import React, { useMemo, useState } from 'react';
import {
    Image,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import SignatureCanvas from 'react-native-signature-canvas';
import moment from 'moment-timezone';
import type { FormDesign } from '../../../interfaces/forms';
import { COLORS } from '../../../theme/colors';
import type { VirtualSelectItem } from '../../../components/shared/VirtualSelect';
import { locationService } from '../../../services/LocationService';

export type SelectRequest = {
    fieldId: number;
    title: string;
    multiple: boolean;
    items: VirtualSelectItem[];
    selectedIds: (string | number)[];
    /** Cómo aplicar la selección en el padre (cascada BD). */
    kind: 'static' | 'db_primitive' | 'db_searchable';
};

type ListProps = {
    dropdown?: string | number;
    list_type?: string | number;
    orientation?: string | number;
    database_flag?: boolean | number;
    database_id?: string | number | null;
    searchable?: boolean;
    column_related?: string;
};

/** API Laravel suele mandar `field_type_id` como número o string. */
export function normalizeFieldTypeId(raw: unknown): number {
    const n = Number(raw);
    return Number.isFinite(n) ? n : -1;
}

/**
 * `dropdown` / `list_type` / `orientation` pueden venir como 0, 1, 2 (número) o "0","1" (string).
 * Sin normalizar, `list_type === 1` (número) no coincide con `'1'` y se rompen cascadas y ramas UI.
 */
export function normalizeListProps(
    lp: ListProps | Record<string, unknown> | undefined | null,
): { dropdown: string; list_type: string; orientation: string } {
    if (!lp || typeof lp !== 'object') {
        return { dropdown: '0', list_type: '1', orientation: '1' };
    }
    const o = lp as Record<string, unknown>;
    const d = o.dropdown;
    const l = o.list_type;
    const or = o.orientation;
    return {
        dropdown: d === undefined || d === null ? '0' : String(d),
        list_type: l === undefined || l === null ? '1' : String(l),
        orientation: or === undefined || or === null ? '1' : String(or),
    };
}

/** `db_data_id` válido para selects ligados a `databases[]` (evita "" o null). */
export function fieldHasLinkedDatabase(field: FormDesign): boolean {
    const id = field.db_data_id as unknown;
    if (id == null) {
        return false;
    }
    if (typeof id === 'string' && id.trim() === '') {
        return false;
    }
    const n = Number(id);
    return Number.isFinite(n) && n > 0;
}

type Props = {
    field: FormDesign;
    value: unknown;
    onChange: (v: unknown) => void;
    /** Opciones para selects ligados a BD (`dbArrays` en Ionic). */
    dbArrays: Record<number, unknown[]>;
    onRequestSelect: (req: SelectRequest) => void;
    onOpenTable: (field: FormDesign) => void;
    onEditPhoto: (fieldId: number, uri: string | null, index?: number) => void;
    onLaunchCamera: (fieldId: number) => void;
    onLaunchGallery?: (fieldId: number) => void;
    /** Ver registro enviado: sin edición. */
    readOnly?: boolean;
};

function lpOf(field: FormDesign): ListProps | undefined {
    return field.properties?.list_properties as ListProps | undefined;
}

function staticSelectItems(field: FormDesign): VirtualSelectItem[] {
    return (field.extra_data ?? [])
        .map((ed) => ({ id: ed.id, name: ed.name }))
        .sort((a, b) =>
            String(a.name).localeCompare(String(b.name), 'es', {
                numeric: true,
                sensitivity: 'base',
            }),
        );
}

function dbItems(field: FormDesign, dbArrays: Record<number, unknown[]>): VirtualSelectItem[] {
    const raw = dbArrays[field.id] ?? [];
    return raw
        .map((v) => ({ id: v as string | number, name: String(v) }))
        .sort((a, b) =>
            a.name.localeCompare(b.name, 'es', {
                numeric: true,
                sensitivity: 'base',
            }),
        );
}

function displaySelectLabel(
    value: unknown,
    items: VirtualSelectItem[],
    multiple: boolean,
): string {
    if (multiple) {
        const ids = Array.isArray(value) ? value : [];
        if (ids.length === 0) {
            return 'Seleccionar…';
        }
        return ids
            .map((id) => items.find((i) => String(i.id) === String(id))?.name)
            .filter(Boolean)
            .join(', ');
    }
    const ids = Array.isArray(value) ? value : [];
    const id = ids[0];
    if (id === undefined || id === '') {
        return 'Seleccionar…';
    }
    return items.find((i) => String(i.id) === String(id))?.name ?? 'Seleccionar…';
}

/** Valor ion-select múltiple / simple para lista estática dropdown=1 (paridad `manageSelect`). */
function openStaticDropdown(
    field: FormDesign,
    value: unknown,
    lp: ListProps | undefined,
    onRequestSelect: (req: SelectRequest) => void,
) {
    const nlp = normalizeListProps(lp);
    const multi = nlp.list_type === '2';
    const items = staticSelectItems(field);
    let selectedIds: (string | number)[] = [];
    if (multi) {
        selectedIds = Array.isArray(value) ? [...value] as (string | number)[] : [];
    } else {
        const arr = Array.isArray(value) ? value : [];
        const first = arr[0];
        if (first !== undefined && first !== '') {
            selectedIds = [first as string | number];
        }
    }
    onRequestSelect({
        fieldId: field.id,
        title: field.label,
        multiple: multi,
        items,
        selectedIds,
        kind: 'static',
    });
}

export function FormFieldRenderer({
    field,
    value,
    onChange,
    dbArrays,
    onRequestSelect,
    onOpenTable,
    onEditPhoto,
    onLaunchCamera,
    onLaunchGallery,
    readOnly = false,
}: Props) {
    const [showPicker, setShowPicker] = useState(false);
    const p = field.properties;
    const lp = lpOf(field);
    const fieldType = normalizeFieldTypeId(field.field_type_id);
    const disabled = !!p?.disabled || readOnly;
    const required = Number(p?.required ?? 0) === 1;
    const showReq = required ? <Text style={styles.req}> *</Text> : null;

    const maxDate = useMemo(
        () => moment().add(5, 'years').toDate(),
        [],
    );

    const labelEl = (
        <Text style={styles.label}>
            {field.label}
            {showReq}
        </Text>
    );

    const reqClass = required ? styles.cardRequired : undefined;

    switch (fieldType) {
        case 1:
            return (
                <View style={[styles.card, reqClass]}>
                    {labelEl}
                    <TextInput
                        style={styles.input}
                        value={String(value ?? '')}
                        onChangeText={(t) => onChange(t)}
                        editable={!disabled}
                    />
                </View>
            );
        case 2:
            return (
                <View style={[styles.card, reqClass]}>
                    {labelEl}
                    <TextInput
                        style={[styles.input, styles.textarea]}
                        value={String(value ?? '')}
                        onChangeText={(t) => onChange(t)}
                        multiline
                        editable={!disabled}
                    />
                </View>
            );
        case 3: {
            const useRange = Number(p?.active_range ?? 0) === 1;
            const minV = p?.min_value ?? 0;
            const maxV = p?.max_value ?? 100;
            const step = p?.step > 0 ? p.step : 1;
            const numVal =
                value === '' || value == null ? NaN : Number(value);
            const sVal = Number.isNaN(numVal) ? minV : numVal;
            return (
                <View
                    style={[
                        styles.card,
                        reqClass,
                        useRange ? styles.cardWoBorder : undefined,
                    ]}
                >
                    {labelEl}
                    {useRange ? (
                        <>
                            <Text style={styles.rangeNum}>{String(value ?? '')}</Text>
                            <Slider
                                style={styles.slider}
                                minimumValue={minV}
                                maximumValue={maxV}
                                value={Math.min(maxV, Math.max(minV, sVal))}
                                step={step}
                                minimumTrackTintColor={COLORS.primary}
                                maximumTrackTintColor={COLORS.lightGray}
                                onSlidingComplete={(v) => onChange(String(v))}
                                disabled={disabled}
                            />
                        </>
                    ) : (
                        <TextInput
                            style={styles.input}
                            value={String(value ?? '')}
                            onChangeText={(t) => onChange(t)}
                            keyboardType="numeric"
                            editable={!disabled}
                        />
                    )}
                </View>
            );
        }
        case 4: {
            const hasDb = fieldHasLinkedDatabase(field);
            const nlp = normalizeListProps(lp);
            if (!hasDb) {
                const dd = nlp.dropdown;
                if (dd === '0') {
                    const lt = nlp.list_type;
                    const isRow =
                        nlp.orientation === '2'
                            ? { flexDirection: 'row' as const, flexWrap: 'wrap' as const }
                            : undefined;
                    if (lt === '1') {
                        const selected = (Array.isArray(value) ? value : []) as number[];
                        return (
                            <View style={[styles.card, reqClass]}>
                                {labelEl}
                                <View style={isRow}>
                                    {(field.extra_data ?? []).map((sub) => {
                                        const on = selected.includes(sub.id);
                                        return (
                                            <TouchableOpacity
                                                key={sub.id}
                                                style={[styles.radioRow, isRow && styles.radioRowInline]}
                                                onPress={() => {
                                                    if (disabled) {
                                                        return;
                                                    }
                                                    onChange([sub.id]);
                                                }}
                                                disabled={disabled}
                                            >
                                                <View style={[styles.radioOuter, on && styles.radioOuterOn]}>
                                                    {on ? <View style={styles.radioInner} /> : null}
                                                </View>
                                                <Text style={styles.radioLabel}>{sub.name}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        );
                    }
                    const selected = (Array.isArray(value) ? value : []) as number[];
                    return (
                        <View style={[styles.card, reqClass]}>
                            {labelEl}
                            <View style={isRow}>
                                {(field.extra_data ?? []).map((sub) => {
                                    const on = selected.includes(sub.id);
                                    return (
                                        <TouchableOpacity
                                            key={sub.id}
                                            style={[styles.radioRow, isRow && styles.radioRowInline]}
                                            onPress={() => {
                                                if (disabled) {
                                                    return;
                                                }
                                                const next = on
                                                    ? selected.filter((x) => x !== sub.id)
                                                    : [...selected, sub.id];
                                                onChange(next);
                                            }}
                                            disabled={disabled}
                                        >
                                            <View style={[styles.chk, on && styles.chkOn]}>
                                                {on ? <Text style={styles.chkMark}>✓</Text> : null}
                                            </View>
                                            <Text style={styles.radioLabel}>{sub.name}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    );
                }
                const multi = nlp.list_type === '2';
                return (
                    <View style={[styles.card, reqClass]}>
                        {labelEl}
                        <TouchableOpacity
                            style={styles.selectBtn}
                            onPress={() => {
                                if (!disabled) {
                                    openStaticDropdown(field, value, lp, onRequestSelect);
                                }
                            }}
                            disabled={disabled}
                        >
                            <Text style={styles.selectBtnText}>
                                {displaySelectLabel(
                                    value,
                                    staticSelectItems(field),
                                    multi,
                                )}
                            </Text>
                        </TouchableOpacity>
                    </View>
                );
            }
            const searchable = !!lp?.searchable;
            const items = dbItems(field, dbArrays);
            if (searchable) {
                const raw = Array.isArray(value) ? value[0] : value;
                return (
                    <View style={[styles.card, reqClass]}>
                        {labelEl}
                        <TouchableOpacity
                            style={styles.selectBtn}
                            onPress={() => {
                                if (disabled) {
                                    return;
                                }
                                onRequestSelect({
                                    fieldId: field.id,
                                    title: field.label,
                                    multiple: false,
                                    items,
                                    selectedIds:
                                        raw !== undefined && raw !== '' && raw != null
                                            ? [raw as string | number]
                                            : [],
                                    kind: 'db_searchable',
                                });
                            }}
                            disabled={disabled}
                        >
                            <Text style={styles.selectBtnText}>
                                {raw != null && raw !== ''
                                    ? String(raw)
                                    : 'Seleccionar…'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                );
            }
            return (
                <View style={[styles.card, reqClass]}>
                    {labelEl}
                    <TouchableOpacity
                        style={styles.selectBtn}
                        onPress={() => {
                            if (disabled) {
                                return;
                            }
                            onRequestSelect({
                                fieldId: field.id,
                                title: field.label,
                                multiple: false,
                                items,
                                selectedIds:
                                    value !== undefined &&
                                    value !== '' &&
                                    value != null
                                        ? [value as string | number]
                                        : [],
                                kind: 'db_primitive',
                            });
                        }}
                        disabled={disabled}
                    >
                        <Text style={styles.selectBtnText}>
                            {value != null && value !== ''
                                ? String(value)
                                : 'Seleccionar…'}
                        </Text>
                    </TouchableOpacity>
                </View>
            );
        }
        case 5: {
            const coords = String(value ?? '');
            const ok = coords.length > 0;
            return (
                <View style={[styles.card, reqClass]}>
                    {labelEl}
                    {ok ? (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>Ubicación capturada</Text>
                        </View>
                    ) : null}
                    <Text style={styles.gpsText} numberOfLines={3}>
                        {ok ? coords : 'Sin coordenadas'}
                    </Text>
                    {!readOnly ? (
                        <TouchableOpacity
                            style={styles.secondaryBtn}
                            onPress={async () => {
                                const c = await locationService.requestAndGetCoordsString();
                                if (c) {
                                    onChange(c);
                                }
                            }}
                        >
                            <Text style={styles.secondaryBtnText}>Actualizar GPS</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
            );
        }
        case 6:
            return (
                <View style={[styles.card, styles.cardWoBorder, reqClass]}>
                    {labelEl}
                    {field.url_img ? (
                        <Image
                            source={{ uri: field.url_img }}
                            style={styles.decorImg}
                            resizeMode="contain"
                        />
                    ) : null}
                </View>
            );
        case 7: {
            const uri = typeof value === 'string' ? value : '';
            const has = uri.length > 0;
            return (
                <View style={[styles.card, styles.cardWoBorder, reqClass]}>
                    {labelEl}
                    {has ? (
                        <TouchableOpacity
                            onPress={() => {
                                if (!readOnly) {
                                    onEditPhoto(field.id, uri);
                                }
                            }}
                            disabled={readOnly}
                        >
                            <Image
                                source={{ uri }}
                                style={styles.photoMain}
                                resizeMode="contain"
                            />
                        </TouchableOpacity>
                    ) : null}
                    {!readOnly ? (
                        <View style={styles.photoActionsRow}>
                            <TouchableOpacity
                                style={[styles.secondaryBtn, styles.photoAction]}
                                onPress={() => onLaunchCamera(field.id)}
                            >
                                <Text style={styles.secondaryBtnText}>Foto</Text>
                            </TouchableOpacity>
                            {onLaunchGallery ? (
                                <TouchableOpacity
                                    style={[styles.secondaryBtn, styles.photoAction]}
                                    onPress={() => onLaunchGallery(field.id)}
                                >
                                    <Text style={styles.secondaryBtnText}>Galería</Text>
                                </TouchableOpacity>
                            ) : null}
                            {has ? (
                                <TouchableOpacity
                                    style={[styles.secondaryBtn, styles.photoAction]}
                                    onPress={() => onChange('')}
                                >
                                    <Text style={styles.secondaryBtnText}>Eliminar</Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    ) : null}
                </View>
            );
        }
        case 8:
            return (
                <View style={[styles.card, styles.cardWoBorder, reqClass]}>
                    {labelEl}
                    {!readOnly ? (
                        <>
                            <Text style={styles.hint}>
                                Dibuje y use «Guardar» en el lienzo para confirmar.
                            </Text>
                            <View style={styles.sigWrap}>
                                <SignatureCanvas
                                    confirmText="Guardar"
                                    clearText="Limpiar"
                                    webStyle={`.m-signature-pad { box-shadow: none; border: 1px solid ${COLORS.lightGray}; }`}
                                    onOK={(sig) => onChange(sig)}
                                />
                            </View>
                        </>
                    ) : (
                        <Text style={styles.readonly}>(solo lectura)</Text>
                    )}
                </View>
            );
        case 9:
            return (
                <View style={[styles.card, styles.cardLabel, styles.cardWoBorder]}>
                    <Text style={styles.textNormal}>{field.label}</Text>
                </View>
            );
        case 10:
        case 12: {
            const d = value ? moment(String(value)).toDate() : new Date();
            const isTime = fieldType === 12;
            return (
                <View style={[styles.card, reqClass]}>
                    {labelEl}
                    <TouchableOpacity
                        style={styles.selectBtn}
                        onPress={() => {
                            if (!disabled) {
                                setShowPicker(true);
                            }
                        }}
                        disabled={disabled}
                    >
                        <Text style={styles.selectBtnText}>
                            {value
                                ? isTime
                                    ? moment(String(value)).format('HH:mm')
                                    : moment(String(value)).format('DD/MM/YYYY')
                                : isTime
                                  ? 'Elegir hora'
                                  : 'Elegir fecha'}
                        </Text>
                    </TouchableOpacity>
                    {showPicker ? (
                        <DateTimePicker
                            value={d}
                            mode={isTime ? 'time' : 'date'}
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            maximumDate={isTime ? undefined : maxDate}
                            onChange={(event, selected) => {
                                if (Platform.OS === 'android') {
                                    setShowPicker(false);
                                }
                                if (event.type === 'dismissed') {
                                    setShowPicker(false);
                                    return;
                                }
                                if (event.type === 'set' && selected) {
                                    onChange(moment(selected).toISOString());
                                    setShowPicker(false);
                                }
                            }}
                        />
                    ) : null}
                </View>
            );
        }
        case 11:
            return (
                <View style={[styles.card, styles.cardLabel, styles.cardTitle, styles.cardWoBorder]}>
                    <Text style={styles.titleText}>{field.label}</Text>
                </View>
            );
        case 13:
            return (
                <View style={[styles.card, styles.cardWoBorder, reqClass]}>
                    {labelEl}
                    <Text style={styles.sub}>
                        {Array.isArray(value) ? `${value.length} fila(s)` : '0 filas'}
                    </Text>
                    {!readOnly ? (
                        <TouchableOpacity
                            style={styles.secondaryBtn}
                            onPress={() => onOpenTable(field)}
                        >
                            <Text style={styles.secondaryBtnText}>Añadir / editar filas</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
            );
        case 14:
            return (
                <View style={[styles.card, reqClass]}>
                    {labelEl}
                    <Text style={styles.readonly}>{String(value ?? '')}</Text>
                </View>
            );
        case 15: {
            const uri = String(value ?? '');
            const hasImg =
                uri.length > 0 &&
                (uri.startsWith('data:') ||
                    uri.startsWith('file') ||
                    uri.startsWith('http'));
            return (
                <View style={[styles.card, styles.cardWoBorder, reqClass]}>
                    {labelEl}
                    {hasImg ? (
                        <TouchableOpacity
                            onPress={() => {
                                if (!readOnly) {
                                    onEditPhoto(field.id, uri);
                                }
                            }}
                        >
                            <Image
                                source={{ uri }}
                                style={styles.thumbLg}
                                resizeMode="contain"
                            />
                        </TouchableOpacity>
                    ) : !readOnly ? (
                        <View style={styles.sigWrap}>
                            <SignatureCanvas
                                confirmText="Guardar"
                                clearText="Limpiar"
                                webStyle={`.m-signature-pad { box-shadow: none; border: 1px solid ${COLORS.lightGray}; }`}
                                onOK={(sig) => onChange(sig)}
                            />
                        </View>
                    ) : (
                        <Text style={styles.readonly}>(sin firma)</Text>
                    )}
                </View>
            );
        }
        case 16: {
            const ex = field.extra_data ?? [];
            const a = ex[0];
            const b = ex[1];
            const c = ex[2];
            const selected = (Array.isArray(value) ? value : []) as (string | number)[];
            if (!a || !b || !c) {
                return (
                    <View style={styles.card}>
                        {labelEl}
                        <Text style={styles.warn}>Segmento: faltan extra_data[0..2]</Text>
                    </View>
                );
            }
            return (
                <View style={[styles.card, styles.cardWoBorder, reqClass]}>
                    {labelEl}
                    <View style={styles.seg3}>
                        {[a, b, c].map((opt, idx) => {
                            const on = selected.includes(opt.id);
                            const segStyle =
                                idx === 0 ? styles.segR : idx === 1 ? styles.segY : styles.segG;
                            return (
                                <TouchableOpacity
                                    key={opt.id}
                                    style={[styles.segBtn, segStyle, on && styles.segBtnOn]}
                                    onPress={() => {
                                        if (!disabled) {
                                            onChange([opt.id]);
                                        }
                                    }}
                                    disabled={disabled}
                                >
                                    <Text
                                        style={[styles.segTxt, on && styles.segTxtOn]}
                                        numberOfLines={2}
                                    >
                                        {opt.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            );
        }
        default:
            return (
                <View style={styles.card}>
                    {labelEl}
                    <Text style={styles.warn}>
                        Tipo de campo {String(field.field_type_id)} no soportado
                    </Text>
                </View>
            );
    }
}

/** Confirmación VirtualSelect: paridad `manageSelect` para lista estática dropdown. */
export function applyStaticSelectConfirm(
    field: FormDesign,
    ids: (string | number)[],
): unknown {
    const nlp = normalizeListProps(lpOf(field));
    const multi = nlp.list_type === '2';
    if (multi) {
        return ids;
    }
    return ids.length ? [ids[0]] : [];
}

/** Tras elegir en modal BD searchable: aplica `[valor]` y puede disparar cascada en el padre. */
export function unwrapDbSearchableSelection(ids: (string | number)[]): unknown {
    return ids[0];
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.white,
        padding: 14,
        marginBottom: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.lightGray,
        shadowColor: COLORS.black,
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    cardRequired: {
        borderColor: COLORS.danger,
    },
    cardWoBorder: {
        borderColor: 'transparent',
    },
    cardLabel: {
        paddingVertical: 10,
    },
    cardTitle: {
        paddingVertical: 12,
    },
    label: { fontSize: 14, color: COLORS.textLabel, marginBottom: 8 },
    req: { color: COLORS.danger },
    input: {
        borderWidth: 1,
        borderColor: COLORS.lightGray,
        borderRadius: 6,
        padding: 10,
        fontSize: 16,
        color: COLORS.text,
    },
    textarea: { minHeight: 88, textAlignVertical: 'top' },
    rangeNum: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: COLORS.text,
    },
    selectBtn: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 6,
        padding: 12,
        backgroundColor: COLORS.lightGray,
    },
    selectBtnText: { fontSize: 16, color: COLORS.text },
    badge: {
        alignSelf: 'flex-start',
        backgroundColor: COLORS.successGreen,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        marginBottom: 8,
    },
    badgeText: { color: COLORS.white, fontWeight: '700', fontSize: 12 },
    gpsText: { fontSize: 14, color: COLORS.text, marginBottom: 8 },
    secondaryBtn: {
        marginTop: 4,
        padding: 10,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: COLORS.primary,
        alignItems: 'center',
    },
    secondaryBtnText: { color: COLORS.primary, fontWeight: '600' },
    hint: { fontSize: 12, color: COLORS.textMuted, marginBottom: 6 },
    sigWrap: { height: 180, marginTop: 4 },
    sub: { fontSize: 13, color: COLORS.textMuted, marginBottom: 8 },
    readonly: { fontSize: 16, color: COLORS.locked },
    thumbLg: {
        height: 160,
        width: '100%',
        backgroundColor: COLORS.lightGray,
        borderRadius: 8,
    },
    decorImg: {
        width: '100%',
        height: 120,
        marginTop: 8,
        borderRadius: 8,
        backgroundColor: COLORS.lightGray,
    },
    photoMain: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        backgroundColor: COLORS.lightGray,
        marginBottom: 8,
    },
    photoActionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    photoAction: { flex: 1, minWidth: 100, marginTop: 0 },
    textNormal: { fontSize: 15, color: COLORS.text, lineHeight: 22 },
    titleText: { fontSize: 18, fontWeight: '700', color: COLORS.text },
    radioRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    radioRowInline: { marginRight: 12, marginBottom: 8 },
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: COLORS.border,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioOuterOn: { borderColor: COLORS.primary },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.primary,
    },
    radioLabel: { fontSize: 15, color: COLORS.text, flex: 1 },
    chk: {
        width: 22,
        height: 22,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: COLORS.border,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chkOn: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    chkMark: { color: COLORS.white, fontSize: 14, fontWeight: '800' },
    seg3: { flexDirection: 'row', gap: 6 },
    segBtn: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 6,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
    },
    segR: { backgroundColor: '#ffcccc' },
    segY: { backgroundColor: '#fff3cd' },
    segG: { backgroundColor: '#d4edda' },
    segBtnOn: { borderWidth: 2, borderColor: COLORS.primary },
    segTxt: { fontSize: 12, textAlign: 'center', color: COLORS.text },
    segTxtOn: { fontWeight: '700' },
    warn: { color: COLORS.warningYellow },
    slider: { marginTop: 8, height: 40 },
});
