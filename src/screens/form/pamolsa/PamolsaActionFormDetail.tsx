import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { COLORS } from '../../../theme/colors';
import type { RootStackParamList } from '../../../navigation/AppNavigator';
import type { Action } from '../../../interfaces/forms';
import { formService } from '../../../services/FormService';
import { queryService } from '../../../services/QueryService';

type Route = RouteProp<RootStackParamList, 'PamolsaActionFormDetail'>;

export function PamolsaActionFormDetail() {
  const route = useRoute<Route>();
  const { actionId } = route.params;
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<Action | null>(null);

  const fallback = useMemo(() => {
    const list = (formService.actions as Action[]) ?? [];
    return list.find((a) => a.id === actionId) ?? null;
  }, [actionId]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      setLoading(true);
      try {
        const res = (await formService.getActionDetail({ action_id: actionId })) as
          | { error?: boolean; action?: Action; data?: Action }
          | Action;
        if ((res as { error?: boolean })?.error) {
          queryService.manageErrors(res as { error?: boolean; msg?: string });
          if (mounted) {
            setAction(fallback);
          }
        } else {
          const a = (res as any)?.action ?? (res as any)?.data ?? res;
          if (mounted) {
            setAction((a as Action) ?? fallback);
          }
        }
      } catch (e) {
        console.log(e);
        if (mounted) {
          setAction(fallback);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [actionId, fallback]);

  if (loading && !action) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!action) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>No se pudo cargar el detalle.</Text>
      </View>
    );
  }

  const photos = (action.photos_url as unknown as string[]) ?? [];

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <Text style={styles.k}>Fecha</Text>
      <Text style={styles.v}>{action.created_at ?? '—'}</Text>

      <Text style={styles.k}>Usuario</Text>
      <Text style={styles.v}>{action.action?.user_id ?? action.responsable ?? '—'}</Text>

      <Text style={styles.k}>Sede</Text>
      <Text style={styles.v}>{action.corresponds ?? '—'}</Text>

      <Text style={styles.k}>Área</Text>
      <Text style={styles.v}>{action.action?.area_id ?? '—'}</Text>

      <Text style={styles.k}>Descripción</Text>
      <Text style={styles.v}>{action.findings ?? '—'}</Text>

      <Text style={styles.k}>Nivel de riesgo</Text>
      <Text style={styles.v}>{action.risk_level ?? action.risk ?? '—'}</Text>

      <Text style={styles.k}>Acción propuesta</Text>
      <Text style={styles.v}>{action.proposed_actions ?? '—'}</Text>

      <Text style={styles.k}>Responsable</Text>
      <Text style={styles.v}>{action.responsable ?? '—'}</Text>

      <Text style={styles.k}>Fecha propuesta</Text>
      <Text style={styles.v}>{action.proposed_date ?? '—'}</Text>

      <Text style={styles.section}>Fotos</Text>
      <View style={styles.photoGrid}>
        {photos.slice(0, 2).map((p, idx) => (
          <View key={`${idx}-${p}`} style={styles.photoBox}>
            <Image source={{ uri: p }} style={styles.photo} />
          </View>
        ))}
        {!photos.length ? <Text style={styles.muted}>Sin fotos</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, paddingBottom: 40, backgroundColor: COLORS.menuContentBg, flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  muted: { color: COLORS.textMuted, textAlign: 'center' },
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
  photoGrid: { flexDirection: 'row', gap: 12 },
  photoBox: {
    flex: 1,
    height: 160,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
  },
  photo: { width: '100%', height: '100%' },
});

