import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';
import { formService } from '../../services/FormService';
import { useFormStore } from '../../stores/formStore';
import { FormIonSelect, type IonSelectOption } from './FormIonSelect';

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
  /** `effectiveness`: oculta «Fuente» (no usada en `/getListEffectiveness`). */
  variant?: 'default' | 'effectiveness';
  /** Si `false`, oculta «Responsable» (para `Actions`, donde no se usa). */
  showUserFilter?: boolean;
  locals: unknown[];
  initial?: Partial<FilterFormValues>;
  onClose: () => void;
  onApply: (v: FilterFormValues) => void;
};

const STATUS_OPTS: IonSelectOption<string>[] = [
  { value: 'all', label: 'Todos' },
  { value: 'out', label: 'Fuera de fecha' },
  { value: 'pending', label: 'Pendiente' },
];

const SOURCE_OPTS: IonSelectOption<string>[] = [
  { value: '%', label: 'Todos' },
  { value: '1', label: 'Inspección' },
  { value: '2', label: 'Observación' },
  { value: '3', label: 'Simulacro' },
  { value: '4', label: 'Charla' },
  { value: '5', label: 'IPERC' },
  { value: '6', label: 'Investigación' },
  { value: '7', label: 'Otro' },
  { value: '8', label: 'Auditoría' },
];

function pct<T extends string | number>(v: T | undefined, fallback: T): T {
  if (v === undefined || v === null || v === '') {
    return fallback;
  }
  return v;
}

export function FilterFormModal({
  visible,
  title = 'Filtros',
  variant = 'default',
  showUserFilter = true,
  locals,
  initial,
  onClose,
  onApply,
}: Props) {
  const [sede, setSede] = useState<string | number>('%');
  const [area, setArea] = useState<string | number>('%');
  const [status, setStatus] = useState<string>('all');
  const [source, setSource] = useState<string>('%');
  const [proposed, setProposed] = useState('');
  const [userSelected, setUserSelected] = useState<string | number>('%');

  const localList = (locals as LocalRow[]) ?? [];
  const storeUsers = useFormStore((s) => s.users);

  useEffect(() => {
    if (!visible) {
      return;
    }
    const i = initial ?? {};
    setSede(pct(i.sede_selected, '%'));
    setArea(pct(i.area_selected, '%'));
    setStatus(String(i.status_filter ?? 'all'));
    setSource(String(i.source_filter ?? '%'));
    setProposed(i.proposed_filter ?? '');
    const us = i.user_selected;
    if (us == null || us === '' || String(us) === '%') {
      setUserSelected('%');
    } else {
      setUserSelected(us);
    }
  }, [
    visible,
    initial?.sede_selected,
    initial?.area_selected,
    initial?.status_filter,
    initial?.source_filter,
    initial?.proposed_filter,
    initial?.user_selected,
  ]);

  const sedeOptions: IonSelectOption<string | number>[] = useMemo(() => {
    const head: IonSelectOption<string> = { value: '%', label: 'Todos' };
    const rest = localList.map((l) => ({
      value: l.id as string | number,
      label: String(l.name ?? l.id),
    }));
    return [head, ...rest];
  }, [localList]);

  const areasForSede = useMemo(() => {
    if (String(sede) === '%') {
      return [] as LocalRow[];
    }
    const row = localList.find((l) => String(l.id) === String(sede));
    return row?.areas ?? [];
  }, [localList, sede]);

  const areaOptions: IonSelectOption<string | number>[] = useMemo(() => {
    const head: IonSelectOption<string> = { value: '%', label: 'Todos' };
    if (String(sede) === '%') {
      return [head];
    }
    const rest = areasForSede.map((a) => ({
      value: a.id as string | number,
      label: String(a.name ?? a.id),
    }));
    return [head, ...rest];
  }, [areasForSede, sede]);

  const userOptions: IonSelectOption<string | number>[] = useMemo(() => {
    const fromStore = storeUsers as { id: number; name: string }[];
    const users =
      Array.isArray(fromStore) && fromStore.length > 0 ?
        fromStore
      : ((formService.users as { id: number; name: string }[]) ?? []);
    const head: IonSelectOption<string> = { value: '%', label: 'Todos' };
    const rest = users.map((u) => ({
      value: u.id,
      label: u.name,
    }));
    const base: IonSelectOption<string | number>[] = [head, ...rest];
    if (
      userSelected !== '%' &&
      !base.some((o) => String(o.value) === String(userSelected))
    ) {
      base.push({
        value: userSelected,
        label: `Usuario (${String(userSelected)})`,
      });
    }
    return base;
  }, [storeUsers, userSelected]);

  const apply = () => {
    onApply({
      sede_selected: sede,
      area_selected: area,
      status_filter: status,
      source_filter: source,
      proposed_filter: proposed,
      user_selected: userSelected,
    });
    onClose();
  };

  const closeOnly = () => {
    onApply({ close: true });
    onClose();
  };

  const onSedeChange = (v: string | number) => {
    setSede(v);
    setArea('%');
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
          <FormIonSelect<string | number>
            label="Filtro por Planta / local"
            value={sede}
            options={sedeOptions}
            onChange={onSedeChange}
            placeholder="Seleccionar"
          />

          <FormIonSelect<string | number>
            label="Filtro por área"
            value={area}
            options={areaOptions}
            onChange={setArea}
            placeholder="Seleccionar"
          />

          <FormIonSelect<string>
            label="Filtro por estado"
            value={status}
            options={STATUS_OPTS}
            onChange={setStatus}
            placeholder="Seleccionar"
          />

          {variant === 'default' ? (
            <FormIonSelect<string>
              label="Filtro por fuente"
              value={source}
              options={SOURCE_OPTS}
              onChange={setSource}
              placeholder="Seleccionar"
            />
          ) : null}

          <Text style={styles.label}>Filtro por acción propuesta</Text>
          <TextInput
            style={styles.input}
            value={proposed}
            onChangeText={setProposed}
            placeholder="Texto libre"
            placeholderTextColor={COLORS.textMuted}
          />

          {showUserFilter ? (
            <FormIonSelect<string | number>
              label="Responsable"
              value={userSelected}
              options={userOptions}
              onChange={setUserSelected}
              placeholder="Todos"
              searchable
              searchPlaceholder="Buscar usuario"
            />
          ) : null}

          <TouchableOpacity style={styles.primary} onPress={apply}>
            <Text style={styles.primaryTxt}>Filtrar</Text>
          </TouchableOpacity>
        </ScrollView>
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
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  primary: {
    marginTop: 24,
    backgroundColor: COLORS.secondary,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryTxt: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
});
