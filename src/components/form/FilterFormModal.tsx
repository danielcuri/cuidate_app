import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';
import { UserSearchModal } from './UserSearchModal';

/** Valores devueltos al filtrar (paridad FilterFormPage). */
export type FilterFormValues = {
  sede_selected?: string | number;
  area_selected?: string | number;
  status_filter?: string;
  source_filter?: string;
  proposed_filter?: string;
  user_selected?: string | number;
  close?: boolean;
};

type LocalRow = { id?: number | string; name?: string; areas?: LocalRow[] };

type Props = {
  visible: boolean;
  title?: string;
  locals: unknown[];
  initial?: Partial<FilterFormValues>;
  onClose: () => void;
  onApply: (v: FilterFormValues) => void;
};

const STATUS_OPTS = [
  { id: 'all', name: 'Todos' },
  { id: 'out', name: 'Fuera de fecha' },
  { id: 'pending', name: 'Pendiente' },
];

const SOURCE_OPTS = [
  { id: '1', name: 'Inspección' },
  { id: '2', name: 'Observación' },
  { id: '3', name: 'Simulacro' },
  { id: '4', name: 'Charla' },
  { id: '5', name: 'IPERC' },
  { id: '6', name: 'Investigación' },
  { id: '7', name: 'Otro' },
  { id: '8', name: 'Auditoría' },
];

export function FilterFormModal({
  visible,
  title = 'Filtros',
  locals,
  initial,
  onClose,
  onApply,
}: Props) {
  const [sede, setSede] = useState<string | number | undefined>();
  const [area, setArea] = useState<string | number | undefined>();
  const [status, setStatus] = useState<string>('all');
  const [source, setSource] = useState<string>('1');
  const [proposed, setProposed] = useState('');
  const [userSel, setUserSel] = useState<{ id: string | number; name: string } | null>(
    null
  );
  const [userModal, setUserModal] = useState(false);

  useEffect(() => {
    if (visible && initial) {
      setSede(initial.sede_selected);
      setArea(initial.area_selected);
      setStatus(String(initial.status_filter ?? 'all'));
      setSource(String(initial.source_filter ?? '1'));
      setProposed(initial.proposed_filter ?? '');
    }
  }, [visible, initial]);

  const areasForSede = useMemo(() => {
    const list = (locals as LocalRow[]) ?? [];
    if (sede == null) {
      return [] as LocalRow[];
    }
    const row = list.find((l) => String(l.id) === String(sede));
    return row?.areas ?? [];
  }, [locals, sede]);

  const apply = () => {
    onApply({
      sede_selected: sede,
      area_selected: area,
      status_filter: status,
      source_filter: source,
      proposed_filter: proposed,
      user_selected: userSel?.id ?? '%',
    });
    onClose();
  };

  const closeOnly = () => {
    onApply({ close: true });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={closeOnly}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.hTitle}>{title}</Text>
          <TouchableOpacity onPress={closeOnly}>
            <Text style={styles.link}>Cerrar</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.label}>Planta / local</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chips}>
              {(locals as LocalRow[]).map((l) => (
                <Pressable
                  key={String(l.id)}
                  style={[styles.chip, String(sede) === String(l.id) && styles.chipOn]}
                  onPress={() => {
                    setSede(l.id);
                    setArea(undefined);
                  }}
                >
                  <Text
                    style={[styles.chipTxt, String(sede) === String(l.id) && styles.chipTxtOn]}
                  >
                    {String(l.name ?? l.id)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <Text style={styles.label}>Área</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chips}>
              {areasForSede.map((a) => (
                <Pressable
                  key={String(a.id)}
                  style={[styles.chip, String(area) === String(a.id) && styles.chipOn]}
                  onPress={() => setArea(a.id)}
                >
                  <Text
                    style={[styles.chipTxt, String(area) === String(a.id) && styles.chipTxtOn]}
                  >
                    {String(a.name ?? a.id)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <Text style={styles.label}>Estado</Text>
          <View style={styles.chips}>
            {STATUS_OPTS.map((o) => (
              <Pressable
                key={o.id}
                style={[styles.chip, status === o.id && styles.chipOn]}
                onPress={() => setStatus(o.id)}
              >
                <Text style={[styles.chipTxt, status === o.id && styles.chipTxtOn]}>
                  {o.name}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Fuente</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chips}>
              {SOURCE_OPTS.map((o) => (
                <Pressable
                  key={o.id}
                  style={[styles.chip, source === o.id && styles.chipOn]}
                  onPress={() => setSource(o.id)}
                >
                  <Text style={[styles.chipTxt, source === o.id && styles.chipTxtOn]}>
                    {o.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <Text style={styles.label}>Acción propuesta</Text>
          <TextInput
            style={styles.input}
            value={proposed}
            onChangeText={setProposed}
            placeholder="Texto libre"
            placeholderTextColor={COLORS.textMuted}
          />

          <Text style={styles.label}>Responsable</Text>
          <TouchableOpacity style={styles.userBtn} onPress={() => setUserModal(true)}>
            <Text style={styles.userBtnTxt}>
              {userSel ? userSel.name : 'Todos'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primary} onPress={apply}>
            <Text style={styles.primaryTxt}>Filtrar</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      <UserSearchModal
        visible={userModal}
        onClose={() => setUserModal(false)}
        onPick={(u) => {
          setUserSel(u);
          setUserModal(false);
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  hTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  link: { color: COLORS.primary, fontWeight: '700' },
  body: { padding: 16, paddingBottom: 40 },
  label: {
    marginTop: 12,
    marginBottom: 6,
    fontWeight: '700',
    color: COLORS.textLabel,
    fontSize: 13,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
  },
  chipOn: { backgroundColor: COLORS.primary },
  chipTxt: { color: COLORS.text, fontSize: 13 },
  chipTxtOn: { color: COLORS.white, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  userBtn: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 14,
  },
  userBtnTxt: { color: COLORS.text },
  primary: {
    marginTop: 24,
    backgroundColor: COLORS.secondary,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryTxt: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
});
