import React, { useLayoutEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import type { Action } from '../../interfaces/forms';
import { formService } from '../../services/FormService';
import { FormListCard } from '../../components/form/FormListCard';
import { TracingBottomSheet } from '../../components/form/TracingBottomSheet';

type Route = RouteProp<RootStackParamList, 'ActionDetail'>;
type Nav = StackNavigationProp<RootStackParamList, 'ActionDetail'>;

export function ActionDetail() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { actionId } = route.params;
  const [tracingOpen, setTracingOpen] = useState(false);
  const [tracingMode, setTracingMode] = useState<'create' | 'view'>('create');

  const action = useMemo(() => {
    const list = (formService.actions as Action[]) ?? [];
    return list.find((a) => a.id === actionId) ?? null;
  }, [actionId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: action ? 'Detalle acción' : 'Acción',
    });
  }, [navigation, action]);

  if (!action) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>No se encontró la acción en memoria. Vuelva a cargar el listado.</Text>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.k}>Registro</Text>
        <Text style={styles.v}>{action.created_at ?? '—'}</Text>
        <Text style={styles.k}>Estado / tipo</Text>
        <Text style={styles.v}>{action.type ?? '—'}</Text>
        <Text style={styles.k}>Hallazgo</Text>
        <Text style={styles.v}>{action.findings ?? '—'}</Text>
        <Text style={styles.k}>Acciones propuestas</Text>
        <Text style={styles.v}>{action.proposed_actions ?? '—'}</Text>
        <Text style={styles.k}>Responsable</Text>
        <Text style={styles.v}>{action.responsable ?? '—'}</Text>
        <Text style={styles.k}>Fecha propuesta</Text>
        <Text style={styles.v}>{action.proposed_date ?? '—'}</Text>
        {action.risk_level ? (
          <>
            <Text style={styles.k}>Nivel de riesgo</Text>
            <Text style={styles.v}>{action.risk_level}</Text>
          </>
        ) : null}

        <Text style={styles.section}>Seguimientos</Text>
        <FormListCard
          title="Ejemplo de traza (local)"
          meta="Toque para ver"
          onPress={() => {
            setTracingMode('view');
            setTracingOpen(true);
          }}
        />

        <TouchableOpacity
          style={styles.btn}
          onPress={() => {
            setTracingMode('create');
            setTracingOpen(true);
          }}
        >
          <Text style={styles.btnTxt}>Crear seguimiento</Text>
        </TouchableOpacity>
      </ScrollView>

      <TracingBottomSheet
        visible={tracingOpen}
        mode={tracingMode}
        proposedDate={action.proposed_date}
        navigation={navigation}
        onClose={() => setTracingOpen(false)}
        onSave={() => {
          setTracingOpen(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.menuContentBg },
  center: { flex: 1, justifyContent: 'center', padding: 24 },
  muted: { color: COLORS.textMuted, textAlign: 'center' },
  body: { padding: 16, paddingBottom: 40 },
  k: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textLabel,
    textTransform: 'uppercase',
  },
  v: { marginTop: 4, fontSize: 15, color: COLORS.text },
  section: {
    marginTop: 24,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  btn: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnTxt: { color: COLORS.white, fontWeight: '800' },
});
