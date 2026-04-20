import React, { useMemo, useState } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
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
};

type Props = {
  field: FormDesign;
  value: unknown;
  onChange: (v: unknown) => void;
  dbOptions: Record<number, unknown[]>;
  onRequestSelect: (req: SelectRequest) => void;
  onOpenTable: (field: FormDesign) => void;
  /** Índice para galería tipo 16; null si es foto única / otro flujo */
  onEditPhoto: (fieldId: number, uri: string | null, index?: number) => void;
  onLaunchCamera: (fieldId: number) => void;
  onLaunchGallery?: (fieldId: number) => void;
};

function selectItems(field: FormDesign, dbOptions: Record<number, unknown[]>): VirtualSelectItem[] {
  if (field.db_data_id != null) {
    const raw = dbOptions[field.id] ?? [];
    return raw.map((v) => ({ id: v as string | number, name: String(v) }));
  }
  return (field.extra_data ?? []).map((ed) => ({ id: ed.id, name: ed.name }));
}

function displaySelectLabel(
  value: unknown,
  items: VirtualSelectItem[]
): string {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return 'Seleccionar…';
    }
    return value
      .map((id) => items.find((i) => String(i.id) === String(id))?.name)
      .filter(Boolean)
      .join(', ');
  }
  if (value === '' || value == null) {
    return 'Seleccionar…';
  }
  return items.find((i) => String(i.id) === String(value))?.name ?? 'Seleccionar…';
}

export function FormFieldRenderer({
  field,
  value,
  onChange,
  dbOptions,
  onRequestSelect,
  onOpenTable,
  onEditPhoto,
  onLaunchCamera,
  onLaunchGallery,
}: Props) {
  const [showDate, setShowDate] = useState(false);
  const p = field.properties;
  const lp = p?.list_properties;
  const items = useMemo(() => selectItems(field, dbOptions), [field, dbOptions]);
  const required = (p?.required ?? 0) === 1;

  const label = (
    <Text style={styles.label}>
      {field.label}
      {required ? <Text style={styles.req}> *</Text> : null}
    </Text>
  );

  const openSelect = () => {
    const multi = lp?.list_type === '2' || Array.isArray(value);
    let selectedIds: (string | number)[] = [];
    if (multi) {
      selectedIds = Array.isArray(value) ? [...value] as (string | number)[] : [];
    } else if (value !== '' && value != null) {
      selectedIds = [value as string | number];
    }
    onRequestSelect({
      fieldId: field.id,
      title: field.label,
      multiple: !!multi,
      items,
      selectedIds,
    });
  };

  switch (field.field_type_id) {
    case 1:
      return (
        <View style={styles.card}>
          {label}
          <TextInput
            style={styles.input}
            value={String(value ?? '')}
            onChangeText={(t) => onChange(t)}
          />
        </View>
      );
    case 2: {
      const numVal =
        value === '' || value == null ? NaN : Number(value);
      const hasRange = !!p?.active_range;
      const minV = p?.min_value ?? 0;
      const maxV = p?.max_value ?? 100;
      const sVal = Number.isNaN(numVal) ? minV : numVal;
      return (
        <View style={styles.card}>
          {label}
          <TextInput
            style={styles.input}
            value={String(value ?? '')}
            onChangeText={(t) => onChange(t)}
            keyboardType="numeric"
          />
          {hasRange && maxV > minV ? (
            <Slider
              style={styles.slider}
              minimumValue={minV}
              maximumValue={maxV}
              value={Math.min(maxV, Math.max(minV, sVal))}
              step={p.step > 0 ? p.step : 1}
              minimumTrackTintColor={COLORS.primary}
              maximumTrackTintColor={COLORS.lightGray}
              onSlidingComplete={(v) => onChange(String(v))}
            />
          ) : null}
        </View>
      );
    }
    case 3:
      return (
        <View style={styles.card}>
          {label}
          <TextInput
            style={[styles.input, styles.textarea]}
            value={String(value ?? '')}
            onChangeText={(t) => onChange(t)}
            multiline
          />
        </View>
      );
    case 4:
      return (
        <View style={styles.card}>
          {label}
          <TouchableOpacity style={styles.selectBtn} onPress={openSelect}>
            <Text style={styles.selectBtnText}>{displaySelectLabel(value, items)}</Text>
          </TouchableOpacity>
        </View>
      );
    case 5: {
      const coords = String(value ?? '');
      const ok = coords.length > 0;
      return (
        <View style={styles.card}>
          {label}
          {ok ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Ubicación capturada</Text>
            </View>
          ) : null}
          <Text style={styles.gpsText} numberOfLines={2}>
            {ok ? coords : 'Sin coordenadas'}
          </Text>
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
        </View>
      );
    }
    case 6:
      return (
        <View style={styles.card}>
          {label}
          <TextInput
            style={styles.input}
            value={String(value ?? '')}
            onChangeText={(t) => onChange(t)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      );
    case 7:
      return (
        <View style={styles.card}>
          {label}
          <TextInput
            style={styles.input}
            value={String(value ?? '')}
            onChangeText={(t) => onChange(t)}
            keyboardType="phone-pad"
          />
        </View>
      );
    case 8:
      return (
        <View style={styles.card}>
          {label}
          <Text style={styles.hint}>Dibuje y levante el dedo para confirmar trazo.</Text>
          <View style={styles.sigWrap}>
            <SignatureCanvas
              confirmText="Guardar"
              clearText="Limpiar"
              webStyle={`.m-signature-pad { box-shadow: none; border: 1px solid ${COLORS.lightGray}; }`}
              onOK={(sig) => onChange(sig)}
            />
          </View>
        </View>
      );
    case 9:
      return (
        <View style={styles.cardRow}>
          {label}
          <Switch
            value={!!value}
            onValueChange={(v) => onChange(v)}
            trackColor={{ true: COLORS.primary, false: COLORS.lightGray }}
          />
        </View>
      );
    case 10:
    case 12: {
      const d = value ? moment(String(value)).toDate() : new Date();
      return (
        <View style={styles.card}>
          {label}
          <TouchableOpacity style={styles.selectBtn} onPress={() => setShowDate(true)}>
            <Text style={styles.selectBtnText}>
              {value
                ? field.field_type_id === 12
                  ? moment(String(value)).format('DD/MM/YYYY HH:mm')
                  : moment(String(value)).format('DD/MM/YYYY')
                : 'Elegir fecha'}
            </Text>
          </TouchableOpacity>
          {showDate && (
            <DateTimePicker
              value={d}
              mode={
                field.field_type_id === 12
                  ? Platform.OS === 'ios'
                    ? 'datetime'
                    : 'date'
                  : 'date'
              }
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                if (Platform.OS === 'android') {
                  setShowDate(false);
                }
                if (event.type === 'dismissed') {
                  setShowDate(false);
                  return;
                }
                if (event.type === 'set' && selectedDate) {
                  onChange(moment(selectedDate).toISOString());
                  setShowDate(false);
                }
              }}
            />
          )}
          {field.field_type_id === 12 && Platform.OS === 'android' ? (
            <Text style={styles.hint}>
              En Android solo se elige fecha aquí — TODO: VERIFICAR hora con Ionic
            </Text>
          ) : null}
        </View>
      );
    }
    case 11:
      return (
        <View style={styles.card}>
          {label}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.segScroll}>
            {(field.extra_data ?? []).map((ed) => {
              const sel = String(value) === String(ed.id);
              return (
                <TouchableOpacity
                  key={ed.id}
                  style={[styles.segChip, sel && styles.segChipOn]}
                  onPress={() => onChange(ed.id)}
                >
                  <Text style={[styles.segTxt, sel && styles.segTxtOn]}>{ed.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      );
    case 13:
      return (
        <View style={styles.card}>
          {label}
          <Text style={styles.sub}>
            {Array.isArray(value) ? `${value.length} fila(s)` : '0 filas'}
          </Text>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => onOpenTable(field)}>
            <Text style={styles.secondaryBtnText}>Ver detalle</Text>
          </TouchableOpacity>
        </View>
      );
    case 14:
      return (
        <View style={styles.card}>
          {label}
          <Text style={styles.readonly}>{String(value ?? '')}</Text>
        </View>
      );
    case 15: {
      const uri = String(value ?? '');
      const hasImg = uri.length > 0 && (uri.startsWith('data:') || uri.startsWith('file'));
      return (
        <View style={styles.card}>
          {label}
          {hasImg ? (
            <TouchableOpacity onPress={() => onEditPhoto(field.id, uri)}>
              <Image source={{ uri }} style={styles.thumbLg} resizeMode="contain" />
            </TouchableOpacity>
          ) : (
            <View style={styles.sigWrap}>
              <SignatureCanvas
                confirmText="Guardar"
                clearText="Limpiar"
                webStyle={`.m-signature-pad { box-shadow: none; border: 1px solid ${COLORS.lightGray}; }`}
                onOK={(sig) => onChange(sig)}
              />
            </View>
          )}
        </View>
      );
    }
    case 16: {
      const photos = Array.isArray(value) ? (value as string[]) : [];
      return (
        <View style={styles.card}>
          {label}
          <ScrollView horizontal style={styles.photoRow}>
            {photos.map((uri, idx) => (
              <TouchableOpacity key={idx} onPress={() => onEditPhoto(field.id, uri, idx)}>
                <Image source={{ uri }} style={styles.thumb} />
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.photoActionsRow}>
            <TouchableOpacity style={[styles.secondaryBtn, styles.photoAction]} onPress={() => onLaunchCamera(field.id)}>
              <Text style={styles.secondaryBtnText}>Tomar foto</Text>
            </TouchableOpacity>
            {onLaunchGallery ? (
              <TouchableOpacity
                style={[styles.secondaryBtn, styles.photoAction]}
                onPress={() => onLaunchGallery(field.id)}
              >
                <Text style={styles.secondaryBtnText}>Elegir de galería</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      );
    }
    default:
      return (
        <View style={styles.card}>
          {label}
          <Text style={styles.warn}>
            Tipo de campo {field.field_type_id} — TODO: VERIFICAR en Ionic
          </Text>
        </View>
      );
  }
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
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    padding: 14,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    elevation: 2,
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
  thumbLg: { height: 160, width: '100%', backgroundColor: COLORS.lightGray, borderRadius: 8 },
  thumb: {
    width: 72,
    height: 72,
    marginRight: 8,
    borderRadius: 6,
    backgroundColor: COLORS.lightGray,
  },
  photoRow: { flexGrow: 0, marginBottom: 8 },
  photoActionsRow: { flexDirection: 'row', gap: 8 },
  photoAction: { flex: 1, marginTop: 0 },
  segScroll: { flexGrow: 0 },
  segChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    marginRight: 8,
  },
  segChipOn: { backgroundColor: COLORS.primary },
  segTxt: { color: COLORS.text },
  segTxtOn: { color: COLORS.white, fontWeight: '700' },
  warn: { color: COLORS.warningYellow },
  slider: { marginTop: 12, height: 36 },
});
