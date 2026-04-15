import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import type { Action, ActionTracing } from '../../interfaces/forms';
import { formService } from '../../services/FormService';
import { FormListCard } from '../../components/form/FormListCard';
import { TracingBottomSheet } from '../../components/form/TracingBottomSheet';
import { RecordsHeader } from '../../components/shared/RecordsHeader';

type Route = RouteProp<RootStackParamList, 'ActionDetail'>;
type Nav = StackNavigationProp<RootStackParamList, 'ActionDetail'>;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatDdMmYyyy(d: Date): string {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function formatDdMmYyyyHhMm(d: Date): string {
  return `${formatDdMmYyyy(d)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function toDateSafe(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function statusText(status: number | null | undefined): string {
  if (status === 0) return 'Pendiente';
  if (status === 1) return 'Fuera de fecha';
  if (status === 2) return 'Ejecutado';
  if (status === 3) return 'Anulado';
  return '—';
}

export function ActionDetail() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { actionId } = route.params;
  const [tracingOpen, setTracingOpen] = useState(false);
  const [tracingMode, setTracingMode] = useState<'create' | 'view'>('create');
  const [selectedTracing, setSelectedTracing] = useState<ActionTracing | null>(null);

  const action = useMemo(() => {
    const list = (formService.actions as Action[]) ?? [];
    return list.find((a) => a.id === actionId) ?? null;
  }, [actionId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: action ? 'Detalle acción' : 'Acción',
    });
  }, [navigation, action]);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    if (!tracingOpen) {
      setSelectedTracing(null);
      setTracingMode('create');
    }
  }, [tracingOpen]);

  if (!action) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>No se encontró la acción en memoria. Vuelva a cargar el listado.</Text>
      </View>
    );
  }

  const registeredAt = toDateSafe(action.parent?.action?.registered_date ?? null);
  const proposedAt = toDateSafe(action.proposed_date ?? null);
  const areaName = action.parent?.action?.area?.name ?? '';
  const inspUser = action.parent?.action?.user?.name ?? '';
  const findings = action.parent?.findings ?? '';
  const tracings = action.tracings ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <RecordsHeader title="" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Fecha de registro</Text>
          <View style={styles.field}>
            <Text style={styles.fieldTxt}>
              {registeredAt ? formatDdMmYyyyHhMm(registeredAt) : '—'}
            </Text>
          </View>
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Estado</Text>
          <View style={styles.field}>
            <Text style={styles.fieldTxt}>{statusText(action.status ?? null)}</Text>
          </View>
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Área de observada</Text>
          <View style={styles.field}>
            <Text style={styles.fieldTxt}>{areaName || '—'}</Text>
          </View>
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Responsable de la inspección</Text>
          <View style={styles.field}>
            <Text style={styles.fieldTxt}>{inspUser || '—'}</Text>
          </View>
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Hallazgo y/o observación</Text>
          <View style={styles.areaBox}>
            <Text style={styles.areaTxt}>{findings || '—'}</Text>
          </View>
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Acciones propuestas</Text>
          <View style={styles.areaBox}>
            <Text style={styles.areaTxt}>{action.proposed_actions ?? '—'}</Text>
          </View>
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Fecha propuesta</Text>
          <View style={styles.field}>
            <Text style={styles.fieldTxt}>
              {proposedAt ? formatDdMmYyyy(proposedAt) : action.proposed_date ?? '—'}
            </Text>
          </View>
        </View>

        <View style={styles.actionDetailContent}>
          <View style={styles.createRow}>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => {
                setTracingMode('create');
                setSelectedTracing(null);
                setTracingOpen(true);
              }}
            >
              <Text style={styles.createBtnTxt}>Crear seguimiento</Text>
            </TouchableOpacity>
          </View>

          {tracings.length > 0 ? (
            <View style={styles.tracingContent}>
              <Text style={styles.tracingTitle}>Seguimiento</Text>
              {tracings.map((t, i) => (
                <FormListCard
                  key={`${i}-${t.registered_date ?? 't'}`}
                  title={t.comments ?? `Seguimiento ${i + 1}`}
                  meta={t.registered_date ?? ''}
                  style={styles.tracingCard}
                  onPress={() => {
                    setTracingMode('view');
                    setSelectedTracing(t);
                    setTracingOpen(true);
                  }}
                />
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <TracingBottomSheet
        visible={tracingOpen}
        mode={tracingMode}
        pamolsaActionDetailId={action.id}
        tracing={selectedTracing}
        proposedDate={action.proposed_date ?? undefined}
        navigation={navigation}
        onClose={() => setTracingOpen(false)}
        onSaved={(model) => {
          // Paridad Ionic: actualiza status + push de seguimiento a la acción en memoria.
          const list = (formService.actions as Action[]) ?? [];
          const idx = list.findIndex((a) => a.id === action.id);
          if (idx >= 0) {
            const row = list[idx];
            const nextTracing: ActionTracing = model;
            const nextTracings = [...(row.tracings ?? []), nextTracing];
            const nextStatus = typeof nextTracing.status === 'number' ? nextTracing.status : row.status;
            const nextRow: Action = { ...row, tracings: nextTracings, status: nextStatus };
            list[idx] = nextRow;
            formService.actions = list;
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.menuContentBg },
  center: { flex: 1, justifyContent: 'center', padding: 24 },
  muted: { color: COLORS.textMuted, textAlign: 'center' },
  body: { padding: 16, paddingBottom: 40 },
  fieldBlock: {
    marginBottom: 10,
  },
  label: { fontWeight: '700', color: COLORS.textLabel, marginBottom: 6 },
  field: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
  },
  fieldTxt: { color: COLORS.text },
  areaBox: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    minHeight: 72,
  },
  areaTxt: { color: COLORS.text },
  actionDetailContent: { marginTop: 8 },
  createRow: { marginBottom: 10 },
  createBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  createBtnTxt: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
  tracingContent: { marginTop: 10 },
  tracingTitle: { fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  tracingCard: { marginHorizontal: 0 },
});
