import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../theme/colors';
import type { RootStackParamList } from '../../../navigation/AppNavigator';
import type { Action } from '../../../interfaces/forms';
import { formService } from '../../../services/FormService';
import { queryService } from '../../../services/QueryService';
import { RecordsHeader } from '../../../components/shared/RecordsHeader';

type Route = RouteProp<RootStackParamList, 'PamolsaActionFormDetail'>;
type Nav = StackNavigationProp<RootStackParamList, 'PamolsaActionFormDetail'>;

function parseActionDetailPayload(res: unknown): Action | null {
  if (res == null || typeof res !== 'object') {
    return null;
  }
  const o = res as Record<string, unknown>;
  if (o.error === true) {
    return null;
  }
  if (o.action != null && typeof o.action === 'object') {
    return o.action as Action;
  }
  if (o.data != null && typeof o.data === 'object') {
    return o.data as Action;
  }
  if (typeof o.id === 'number') {
    return o as unknown as Action;
  }
  return null;
}

export function PamolsaActionFormDetail() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { actionId } = route.params;
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<Action | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const fallback = useMemo(() => {
    const list = (formService.actions as Action[]) ?? [];
    return list.find((a) => a.id === actionId) ?? null;
  }, [actionId]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      setLoading(true);
      try {
        const res = await formService.getActionDetail({ action_id: actionId });
        if (res != null && typeof res === 'object' && 'error' in res && (res as { error?: boolean }).error) {
          queryService.manageErrors(res as { error?: boolean; msg?: string });
          if (mounted) {
            setAction(fallback);
          }
        } else {
          const a = parseActionDetailPayload(res);
          if (mounted) {
            setAction(a ?? fallback);
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
      <View style={styles.page}>
        <SafeAreaView style={styles.safeTop} edges={['top']}>
          <RecordsHeader title="Detalle hallazgo" onBack={() => navigation.goBack()} />
        </SafeAreaView>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  if (!action) {
    return (
      <View style={styles.page}>
        <SafeAreaView style={styles.safeTop} edges={['top']}>
          <RecordsHeader title="Detalle hallazgo" onBack={() => navigation.goBack()} />
        </SafeAreaView>
        <View style={styles.center}>
          <Text style={styles.muted}>No se pudo cargar el detalle.</Text>
        </View>
      </View>
    );
  }

  const photos = (action.photos_url as unknown as string[]) ?? [];
  const photosToShow = photos
    .slice(0, 2)
    .map((p) => String(p).trim())
    .filter(Boolean);

  return (
    <View style={styles.page}>
      <SafeAreaView style={styles.safeTop} edges={['top']}>
        <RecordsHeader title="Detalle hallazgo" onBack={() => navigation.goBack()} />
      </SafeAreaView>
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
          {photosToShow.map((p, idx) => (
            <View key={`${idx}-${p}`} style={styles.photoBox}>
              <Image source={{ uri: p }} style={styles.photo} />
            </View>
          ))}
          {!photosToShow.length ? (
            <Text style={styles.muted}>Sin fotos</Text>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.menuContentBg },
  safeTop: { backgroundColor: COLORS.white },
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

