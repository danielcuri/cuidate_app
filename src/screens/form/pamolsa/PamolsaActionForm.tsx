import React, { useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../../theme/colors';
import type { RootStackParamList } from '../../../navigation/AppNavigator';
import { formService } from '../../../services/FormService';
import { loadingService } from '../../../services/LoadingService';
import { queryService } from '../../../services/QueryService';
import { alertService } from '../../../services/AlertService';
import { VirtualSelect, type VirtualSelectItem } from '../../../components/shared/VirtualSelect';
import { UserSearchModal } from '../../../components/form/UserSearchModal';
import { EditPhotoModal } from '../canvas/EditPhotoModal';

type Nav = StackNavigationProp<RootStackParamList, 'PamolsaActionForm'>;

const RISK_LEVELS: VirtualSelectItem[] = [
  { id: 'Bajo', name: 'Bajo' },
  { id: 'Medio', name: 'Medio' },
  { id: 'Alto', name: 'Alto' },
  { id: 'Crítico', name: 'Crítico' },
];

export function PamolsaActionForm() {
  const navigation = useNavigation<Nav>();

  const [localId, setLocalId] = useState<string | number | null>(null);
  const [areaId, setAreaId] = useState<string | number | null>(null);
  const [description, setDescription] = useState('');
  const [riskLevel, setRiskLevel] = useState<string | null>(null);
  const [proposedAction, setProposedAction] = useState('');
  const [proposedDate, setProposedDate] = useState<Date>(new Date());
  const [showDate, setShowDate] = useState(false);
  const [responsable, setResponsable] = useState<{ id: string | number; name: string } | null>(null);
  const [photo1, setPhoto1] = useState<string | null>(null);
  const [photo2, setPhoto2] = useState<string | null>(null);

  const [openLocal, setOpenLocal] = useState(false);
  const [openArea, setOpenArea] = useState(false);
  const [openRisk, setOpenRisk] = useState(false);
  const [openUser, setOpenUser] = useState(false);
  const [editPhoto, setEditPhoto] = useState<1 | 2 | null>(null);

  const locals = useMemo(() => {
    const raw = (formService.locals as { id: number | string; name: string }[]) ?? [];
    return raw.map((l) => ({ id: l.id, name: l.name })) as VirtualSelectItem[];
  }, []);

  const areas = useMemo(() => {
    const raw = (formService.pamolsaAreas as { id: number | string; name: string }[]) ?? [];
    return raw.map((a) => ({ id: a.id, name: a.name })) as VirtualSelectItem[];
  }, []);

  const localName = useMemo(() => locals.find((l) => String(l.id) === String(localId))?.name ?? 'Seleccionar', [
    locals,
    localId,
  ]);
  const areaName = useMemo(() => areas.find((a) => String(a.id) === String(areaId))?.name ?? 'Seleccionar', [
    areas,
    areaId,
  ]);

  const validate = () => {
    if (!localId) return 'Seleccione sede.';
    if (!areaId) return 'Seleccione área.';
    if (!description.trim()) return 'Ingrese descripción.';
    if (!riskLevel) return 'Seleccione nivel de riesgo.';
    if (!proposedAction.trim()) return 'Ingrese acción propuesta.';
    if (!responsable || responsable.id === '%') return 'Seleccione responsable.';
    if (!photo1 || !photo2) return 'Debe registrar 2 fotos.';
    return null;
  };

  const submit = async () => {
    const err = validate();
    if (err) {
      alertService.present('Hallazgo SST', err);
      return;
    }
    await loadingService.present();
    try {
      const res = (await formService.saveDataPamolsaAction({
        local_id: localId,
        area_id: areaId,
        findings: description.trim(),
        risk_level: riskLevel,
        proposed_actions: proposedAction.trim(),
        proposed_date: proposedDate.toISOString(),
        responsable_id: responsable?.id,
        responsable: responsable?.name,
        photos: [photo1, photo2],
      })) as { error?: boolean; msg?: string; data?: { id?: number }; id?: number };

      if (res?.error) {
        queryService.manageErrors(res);
        return;
      }

      const actionId = res?.data?.id ?? res?.id;
      if (!actionId) {
        alertService.present('Hallazgo SST', 'Se guardó, pero no se recibió el ID.');
        return;
      }
      navigation.navigate('PamolsaActionFormDetail', { actionId: Number(actionId) });
    } catch (e) {
      console.log(e);
      alertService.present('Error', 'No se pudo guardar el hallazgo.');
    } finally {
      await loadingService.dismiss();
    }
  };

  const openEdit = (slot: 1 | 2) => setEditPhoto(slot);
  const activePhoto = editPhoto === 1 ? photo1 : editPhoto === 2 ? photo2 : null;

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.section}>Datos</Text>

        <Text style={styles.label}>Sede</Text>
        <TouchableOpacity style={styles.field} onPress={() => setOpenLocal(true)} activeOpacity={0.88}>
          <Text style={styles.fieldTxt}>{localName}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Área</Text>
        <TouchableOpacity style={styles.field} onPress={() => setOpenArea(true)} activeOpacity={0.88}>
          <Text style={styles.fieldTxt}>{areaName}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Descripción</Text>
        <TextInput
          style={styles.area}
          value={description}
          onChangeText={setDescription}
          placeholder="Describa el hallazgo"
          placeholderTextColor={COLORS.textMuted}
          multiline
        />

        <Text style={styles.label}>Nivel de riesgo</Text>
        <TouchableOpacity style={styles.field} onPress={() => setOpenRisk(true)} activeOpacity={0.88}>
          <Text style={styles.fieldTxt}>{riskLevel ?? 'Seleccionar'}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Acción propuesta</Text>
        <TextInput
          style={styles.area}
          value={proposedAction}
          onChangeText={setProposedAction}
          placeholder="Acción propuesta"
          placeholderTextColor={COLORS.textMuted}
          multiline
        />

        <Text style={styles.label}>Fecha propuesta</Text>
        <TouchableOpacity style={styles.field} onPress={() => setShowDate(true)} activeOpacity={0.88}>
          <Text style={styles.fieldTxt}>{proposedDate.toLocaleString()}</Text>
        </TouchableOpacity>
        {showDate ? (
          <DateTimePicker
            value={proposedDate}
            mode="datetime"
            display="default"
            onChange={(_, d) => {
              setShowDate(false);
              if (d) setProposedDate(d);
            }}
          />
        ) : null}

        <Text style={styles.label}>Responsable</Text>
        <TouchableOpacity style={styles.field} onPress={() => setOpenUser(true)} activeOpacity={0.88}>
          <Text style={styles.fieldTxt}>{responsable?.name ?? 'Seleccionar'}</Text>
        </TouchableOpacity>

        <Text style={styles.section}>Fotos (2)</Text>
        <View style={styles.photos}>
          <TouchableOpacity style={styles.photoBox} onPress={() => openEdit(1)} activeOpacity={0.88}>
            {photo1 ? <Image source={{ uri: photo1 }} style={styles.photo} /> : <Text style={styles.photoHint}>Foto 1</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoBox} onPress={() => openEdit(2)} activeOpacity={0.88}>
            {photo2 ? <Image source={{ uri: photo2 }} style={styles.photo} /> : <Text style={styles.photoHint}>Foto 2</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.primary} onPress={submit} activeOpacity={0.88}>
          <Text style={styles.primaryTxt}>Enviar</Text>
        </TouchableOpacity>
      </ScrollView>

      <VirtualSelect
        visible={openLocal}
        title="Sede"
        items={locals}
        selectedIds={localId != null ? [localId] : []}
        onClose={() => setOpenLocal(false)}
        onConfirm={(ids) => setLocalId(ids[0] ?? null)}
      />
      <VirtualSelect
        visible={openArea}
        title="Área"
        items={areas}
        selectedIds={areaId != null ? [areaId] : []}
        onClose={() => setOpenArea(false)}
        onConfirm={(ids) => setAreaId(ids[0] ?? null)}
      />
      <VirtualSelect
        visible={openRisk}
        title="Nivel de riesgo"
        items={RISK_LEVELS}
        selectedIds={riskLevel != null ? [riskLevel] : []}
        onClose={() => setOpenRisk(false)}
        onConfirm={(ids) => setRiskLevel((ids[0] as string) ?? null)}
      />
      <UserSearchModal
        visible={openUser}
        onClose={() => setOpenUser(false)}
        onPick={(u) => {
          setResponsable(u);
          setOpenUser(false);
        }}
      />
      <EditPhotoModal
        visible={editPhoto != null}
        imageUri={activePhoto}
        onClose={() => setEditPhoto(null)}
        onApply={(v) => {
          if (editPhoto === 1) setPhoto1(v);
          if (editPhoto === 2) setPhoto2(v);
          setEditPhoto(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.menuContentBg },
  body: { padding: 16, paddingBottom: 40 },
  section: { marginTop: 8, fontSize: 16, fontWeight: '800', color: COLORS.text },
  label: { marginTop: 12, fontWeight: '700', color: COLORS.textLabel },
  field: {
    marginTop: 6,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
  fieldTxt: { color: COLORS.text, fontSize: 15 },
  area: {
    marginTop: 6,
    minHeight: 90,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    backgroundColor: COLORS.white,
    textAlignVertical: 'top',
    color: COLORS.text,
  },
  photos: { flexDirection: 'row', gap: 12, marginTop: 10 },
  photoBox: {
    flex: 1,
    height: 140,
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
  primary: {
    marginTop: 24,
    backgroundColor: COLORS.secondary,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryTxt: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
});

