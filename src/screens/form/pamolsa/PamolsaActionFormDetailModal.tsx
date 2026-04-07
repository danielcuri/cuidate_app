import React, { useMemo, useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../theme/colors';
import { VirtualSelect, type VirtualSelectItem } from '../../../components/shared/VirtualSelect';
import { EditPhotoModal } from '../canvas/EditPhotoModal';
import { alertService } from '../../../services/AlertService';

type DetailType = 1 | 2;

export type PamolsaActionDetailRowType2 = {
  id?: number;
  proposed_actions: string;
  area_responsable?: string;
  area_responsable_id?: string | number;
  proposed_date: string;
  approved?: number;
};

export type PamolsaActionDetailRowType1 = {
  id?: number;
  findings: string;
  pamolsa_behavior_type_id: string | number;
  pamolsa_behavior_id: string | number;
  risk: string;
  risk_level: 'Alto' | 'Medio' | 'Bajo' | '';
  photos_url: string[];
  details: PamolsaActionDetailRowType2[];
};

type Props = {
  visible: boolean;
  title: string;
  type: DetailType;
  restart?: number;
  currentItem: PamolsaActionDetailRowType1 | PamolsaActionDetailRowType2 | null;
  behaviorsTypes: { id: number | string; name: string; behaviors: { id: number | string; name: string }[] }[];
  areaResponsableId?: string | number;
  areaResponsable?: string;
  proposedDateSeed?: string;
  onClose: () => void;
  onSave: (row: PamolsaActionDetailRowType1 | PamolsaActionDetailRowType2) => void;
};

const RISK_OPTS: { id: PamolsaActionDetailRowType1['risk_level']; name: string }[] = [
  { id: 'Alto', name: 'Alto' },
  { id: 'Medio', name: 'Medio' },
  { id: 'Bajo', name: 'Bajo' },
];

function addDaysIso(baseIso: string | null, days: number) {
  const base = baseIso ? new Date(baseIso) : new Date();
  const t = Number.isNaN(base.getTime()) ? new Date() : base;
  t.setDate(t.getDate() + days);
  return t.toISOString();
}

export function PamolsaActionFormDetailModal({
  visible,
  title,
  type,
  restart = 0,
  currentItem,
  behaviorsTypes,
  areaResponsableId,
  areaResponsable,
  proposedDateSeed,
  onClose,
  onSave,
}: Props) {
  const readonly = restart === 1 && (currentItem as any)?.id != null;

  const [openTypeSelect, setOpenTypeSelect] = useState(false);
  const [openBehaviorSelect, setOpenBehaviorSelect] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [editPhoto, setEditPhoto] = useState<number | null>(null);

  const [row1, setRow1] = useState<PamolsaActionDetailRowType1>(() => {
    if (type !== 1) {
      return {
        findings: '',
        pamolsa_behavior_type_id: '',
        pamolsa_behavior_id: '',
        risk: '',
        risk_level: '',
        photos_url: ['', ''],
        details: [],
      };
    }
    if (currentItem && (currentItem as any).findings != null) {
      const ci = currentItem as PamolsaActionDetailRowType1;
      return {
        id: ci.id,
        findings: ci.findings ?? '',
        pamolsa_behavior_type_id: ci.pamolsa_behavior_type_id ?? '',
        pamolsa_behavior_id: ci.pamolsa_behavior_id ?? '',
        risk: ci.risk ?? '',
        risk_level: (ci.risk_level ?? '') as any,
        photos_url: Array.isArray(ci.photos_url) && ci.photos_url.length ? ci.photos_url.slice(0, 2) : ['', ''],
        details: Array.isArray(ci.details) ? ci.details : [],
      };
    }
    return {
      findings: '',
      pamolsa_behavior_type_id: '',
      pamolsa_behavior_id: '',
      risk: '',
      risk_level: '',
      photos_url: ['', ''],
      details: [],
    };
  });

  const [row2, setRow2] = useState<PamolsaActionDetailRowType2>(() => {
    if (type !== 2) {
      return { proposed_actions: '', proposed_date: proposedDateSeed ?? new Date().toISOString() };
    }
    if (currentItem && (currentItem as any).proposed_actions != null) {
      const ci = currentItem as PamolsaActionDetailRowType2;
      return {
        id: ci.id,
        proposed_actions: ci.proposed_actions ?? '',
        proposed_date: ci.proposed_date ?? proposedDateSeed ?? new Date().toISOString(),
        area_responsable: ci.area_responsable ?? areaResponsable ?? '',
        area_responsable_id: ci.area_responsable_id ?? areaResponsableId,
        approved: ci.approved,
      };
    }
    return {
      proposed_actions: '',
      proposed_date: proposedDateSeed ?? new Date().toISOString(),
      area_responsable: areaResponsable ?? '',
      area_responsable_id: areaResponsableId,
    };
  });

  const typeItems = useMemo(
    () => behaviorsTypes.map((bt) => ({ id: bt.id, name: bt.name })) as VirtualSelectItem[],
    [behaviorsTypes]
  );

  const selectedType = useMemo(() => {
    const id = String(row1.pamolsa_behavior_type_id ?? '');
    return behaviorsTypes.find((bt) => String(bt.id) === id) ?? null;
  }, [behaviorsTypes, row1.pamolsa_behavior_type_id]);

  const behaviorItems = useMemo(() => {
    const b = selectedType?.behaviors ?? [];
    return b.map((x) => ({ id: x.id, name: x.name })) as VirtualSelectItem[];
  }, [selectedType]);

  const computeProposedDateSeed = () => {
    const rl = row1.risk_level;
    if (rl === 'Alto') return addDaysIso(null, 3);
    if (rl === 'Medio') return addDaysIso(null, 15);
    if (rl === 'Bajo') return addDaysIso(null, 30);
    return new Date().toISOString();
  };

  const addOrEditType2 = (index: number) => {
    const seed = computeProposedDateSeed();
    const current = index >= 0 ? row1.details[index] : null;
    const open = () => {
      setNested({
        open: true,
        index,
        current,
        seed,
      });
    };
    open();
  };

  const [nested, setNested] = useState<{
    open: boolean;
    index: number;
    current: PamolsaActionDetailRowType2 | null;
    seed: string;
  }>({ open: false, index: -1, current: null, seed: new Date().toISOString() });

  const validate = () => {
    if (type === 1) {
      if (!row1.findings.trim()) return 'Complete Hallazgos y/o observaciones.';
      if (!row1.pamolsa_behavior_type_id) return 'Seleccione Tipo de Hallazgo.';
      if (!row1.pamolsa_behavior_id) return 'Seleccione el Hallazgo.';
      if (!row1.risk.trim()) return 'Complete Riesgo.';
      if (!row1.risk_level) return 'Seleccione Nivel de riesgo.';
      if (!row1.photos_url?.[0] || !row1.photos_url?.[1]) return 'Registre 2 fotos.';
      // En Ionic, el detalle tipo 1 puede tener tabla (type2) dentro.
      return null;
    }
    if (!row2.proposed_actions.trim()) return 'Complete Acciones propuestas.';
    if (!row2.proposed_date) return 'Complete Fecha propuesta.';
    return null;
  };

  const submit = () => {
    const err = validate();
    if (err) {
      alertService.present('Validación', err);
      return;
    }
    onSave(type === 1 ? row1 : row2);
    onClose();
  };

  const photoUri = type === 1 && editPhoto != null ? row1.photos_url?.[editPhoto] ?? '' : null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.link}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <TouchableOpacity onPress={submit}>
            <Text style={styles.linkBold}>Enviar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          {type === 1 ? (
            <>
              <Text style={styles.label}>Hallazgos y/o observaciones</Text>
              <TextInput
                style={styles.area}
                value={row1.findings}
                onChangeText={(t) => setRow1((p) => ({ ...p, findings: t }))}
                editable={!readonly}
                multiline
              />

              <Text style={styles.label}>Tipo de Hallazgo</Text>
              <TouchableOpacity style={styles.field} onPress={() => !readonly && setOpenTypeSelect(true)} disabled={readonly}>
                <Text style={styles.fieldTxt}>
                  {typeItems.find((x) => String(x.id) === String(row1.pamolsa_behavior_type_id))?.name ?? 'Seleccionar'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.label}>Hallazgo</Text>
              <TouchableOpacity
                style={styles.field}
                onPress={() => !readonly && setOpenBehaviorSelect(true)}
                disabled={readonly || !row1.pamolsa_behavior_type_id}
              >
                <Text style={styles.fieldTxt}>
                  {behaviorItems.find((x) => String(x.id) === String(row1.pamolsa_behavior_id))?.name ?? 'Seleccionar'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.label}>Riesgo</Text>
              <TextInput
                style={styles.areaSm}
                value={row1.risk}
                onChangeText={(t) => setRow1((p) => ({ ...p, risk: t }))}
                editable={!readonly}
                multiline
              />

              <Text style={styles.label}>Nivel de riesgo</Text>
              <View style={styles.row}>
                {RISK_OPTS.map((o) => {
                  const on = row1.risk_level === o.id;
                  return (
                    <TouchableOpacity
                      key={o.id}
                      style={[styles.chip, on && styles.chipOn]}
                      disabled={readonly}
                      onPress={() => setRow1((p) => ({ ...p, risk_level: o.id }))}
                    >
                      <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>{o.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>Fotos</Text>
              <View style={styles.photos}>
                {[0, 1].map((i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.photoBox}
                    onPress={() => !readonly && setEditPhoto(i)}
                    disabled={readonly}
                    activeOpacity={0.88}
                  >
                    {row1.photos_url?.[i] ? (
                      <Image source={{ uri: row1.photos_url[i] }} style={styles.photo} />
                    ) : (
                      <Text style={styles.photoHint}>Foto {i + 1}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.section}>Tabla de detalle</Text>
              {row1.details.map((d, idx) => (
                <View key={`${idx}-${d.id ?? 'new'}`} style={styles.tableRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tableTitle} numberOfLines={2}>
                      {d.proposed_actions || '—'}
                    </Text>
                    <Text style={styles.tableMeta} numberOfLines={1}>
                      {d.proposed_date ? new Date(d.proposed_date).toLocaleDateString() : '—'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.smallBtn, (d.approved ?? 0) === 1 && styles.smallBtnOff]}
                    onPress={() => addOrEditType2(idx)}
                    disabled={(d.approved ?? 0) === 1 || readonly}
                  >
                    <Text style={styles.smallBtnTxt}>Editar</Text>
                  </TouchableOpacity>
                  {!readonly && !d.id ? (
                    <TouchableOpacity
                      style={[styles.smallBtn, styles.smallBtnDanger]}
                      onPress={() => setRow1((p) => ({ ...p, details: p.details.filter((_, i) => i !== idx) }))}
                    >
                      <Text style={styles.smallBtnTxt}>Eliminar</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}
              {!readonly ? (
                <TouchableOpacity style={styles.addBtn} onPress={() => addOrEditType2(-1)}>
                  <Text style={styles.addBtnTxt}>Añadir registro</Text>
                </TouchableOpacity>
              ) : null}
            </>
          ) : (
            <>
              <Text style={styles.label}>Acciones propuestas</Text>
              <TextInput
                style={styles.areaSm}
                value={row2.proposed_actions}
                onChangeText={(t) => setRow2((p) => ({ ...p, proposed_actions: t }))}
                editable={!readonly}
                multiline
              />

              <Text style={styles.label}>Responsable</Text>
              <View style={styles.field}>
                <Text style={styles.fieldTxt}>{row2.area_responsable ?? areaResponsable ?? '—'}</Text>
              </View>

              <Text style={styles.label}>Fecha propuesta</Text>
              <TouchableOpacity
                style={styles.field}
                onPress={() => !readonly && setShowDate(true)}
                disabled={readonly}
                activeOpacity={0.88}
              >
                <Text style={styles.fieldTxt}>{new Date(row2.proposed_date).toLocaleDateString()}</Text>
              </TouchableOpacity>
              {showDate && !readonly ? (
                <DateTimePicker
                  value={new Date(row2.proposed_date)}
                  mode="date"
                  display="default"
                  onChange={(_, d) => {
                    setShowDate(false);
                    if (d) setRow2((p) => ({ ...p, proposed_date: d.toISOString() }));
                  }}
                />
              ) : null}
            </>
          )}
        </ScrollView>

        <VirtualSelect
          visible={openTypeSelect}
          title="Tipo de Hallazgo"
          items={typeItems}
          selectedIds={row1.pamolsa_behavior_type_id ? [row1.pamolsa_behavior_type_id] : []}
          onClose={() => setOpenTypeSelect(false)}
          onConfirm={(ids) => {
            const id = ids[0] ?? '';
            setRow1((p) => ({ ...p, pamolsa_behavior_type_id: id, pamolsa_behavior_id: '' }));
            setOpenTypeSelect(false);
          }}
        />
        <VirtualSelect
          visible={openBehaviorSelect}
          title="Hallazgo"
          items={behaviorItems}
          selectedIds={row1.pamolsa_behavior_id ? [row1.pamolsa_behavior_id] : []}
          onClose={() => setOpenBehaviorSelect(false)}
          onConfirm={(ids) => {
            setRow1((p) => ({ ...p, pamolsa_behavior_id: ids[0] ?? '' }));
            setOpenBehaviorSelect(false);
          }}
        />
        <EditPhotoModal
          visible={type === 1 && editPhoto != null}
          imageUri={photoUri}
          onClose={() => setEditPhoto(null)}
          onApply={(v) => {
            if (type !== 1 || editPhoto == null) return;
            setRow1((p) => {
              const next = [...(p.photos_url ?? [])];
              next[editPhoto] = v;
              return { ...p, photos_url: next };
            });
            setEditPhoto(null);
          }}
        />

        <PamolsaActionFormDetailModal
          visible={nested.open}
          title="Acciones propuestas"
          type={2}
          restart={restart}
          currentItem={nested.current}
          behaviorsTypes={behaviorsTypes}
          areaResponsableId={areaResponsableId}
          areaResponsable={areaResponsable}
          proposedDateSeed={nested.seed}
          onClose={() => setNested((p) => ({ ...p, open: false }))}
          onSave={(row) => {
            const r = row as PamolsaActionDetailRowType2;
            setRow1((p) => {
              const next = [...p.details];
              if (nested.index === -1) next.push(r);
              else next[nested.index] = r;
              return { ...p, details: next };
            });
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  title: { flex: 1, textAlign: 'center', fontWeight: '800', color: COLORS.text, fontSize: 16 },
  link: { color: COLORS.primary, fontSize: 16 },
  linkBold: { color: COLORS.primary, fontWeight: '800', fontSize: 16 },
  body: { padding: 16, paddingBottom: 40 },
  label: { marginTop: 12, fontWeight: '700', color: COLORS.textLabel },
  section: { marginTop: 18, fontWeight: '800', color: COLORS.text, fontSize: 15 },
  field: {
    marginTop: 6,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
  fieldTxt: { color: COLORS.text },
  area: {
    marginTop: 6,
    minHeight: 130,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top',
    backgroundColor: COLORS.white,
    color: COLORS.text,
  },
  areaSm: {
    marginTop: 6,
    minHeight: 90,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top',
    backgroundColor: COLORS.white,
    color: COLORS.text,
  },
  row: { flexDirection: 'row', gap: 10, marginTop: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: COLORS.lightGray },
  chipOn: { backgroundColor: COLORS.primary },
  chipTxt: { color: COLORS.text, fontWeight: '700' },
  chipTxtOn: { color: COLORS.white },
  photos: { flexDirection: 'row', gap: 12, marginTop: 10 },
  photoBox: {
    flex: 1,
    height: 120,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: { width: '100%', height: '100%' },
  photoHint: { color: COLORS.textMuted, fontWeight: '700' },
  tableRow: {
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: COLORS.menuContentBg,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  tableTitle: { fontWeight: '800', color: COLORS.text },
  tableMeta: { marginTop: 2, color: COLORS.textMuted, fontSize: 12 },
  smallBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: COLORS.primary },
  smallBtnOff: { backgroundColor: COLORS.textMuted },
  smallBtnDanger: { backgroundColor: COLORS.danger },
  smallBtnTxt: { color: COLORS.white, fontWeight: '800', fontSize: 12 },
  addBtn: { marginTop: 12, padding: 12, borderRadius: 10, backgroundColor: COLORS.secondary, alignItems: 'center' },
  addBtnTxt: { color: COLORS.white, fontWeight: '800' },
});

