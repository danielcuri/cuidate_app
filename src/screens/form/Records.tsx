import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { COLORS } from '../../theme/colors';
import { formService } from '../../services/FormService';
import { userService } from '../../services/UserService';
import { queryService } from '../../services/QueryService';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import type { FormsRecords } from '../../interfaces/forms';
import { FormListCard } from '../../components/form/FormListCard';
import { extractList } from '../../utils/formApiHelpers';
import { useFormStore } from '../../stores/formStore';

type Nav = StackNavigationProp<RootStackParamList, 'Records'>;

export function Records() {
  const navigation = useNavigation<Nav>();
  const [items, setItems] = useState<FormsRecords[]>([]);
  const [lastId, setLastId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const seedFromStore = useCallback(() => {
    const fromStore = useFormStore.getState().forms_records;
    if (fromStore?.length) {
      setItems(fromStore);
      const last = fromStore[fromStore.length - 1];
      setLastId(last?.id);
    }
  }, []);

  const fetchPage = useCallback(
    async (reset: boolean) => {
      const uid = userService.user.id;
      if (uid == null) {
        return;
      }
      try {
        const res = await formService.getListRecords({
          last_id: reset ? undefined : lastId,
          user_selected: String(uid),
          form_selected: '%',
        });
        const chunk = extractList<FormsRecords>(res, ['forms_records', 'records', 'data']);
        if ((res as { error?: boolean })?.error) {
          queryService.manageErrors(res as { error?: boolean; msg?: string });
          return;
        }
        if (reset) {
          setItems(chunk);
        } else if (chunk.length) {
          setItems((prev) => [...prev, ...chunk]);
        }
        if (chunk.length) {
          setLastId(chunk[chunk.length - 1].id);
        }
      } catch (e) {
        console.log(e);
        seedFromStore();
      }
    },
    [lastId, seedFromStore]
  );

  useFocusEffect(
    useCallback(() => {
      seedFromStore();
      setLoading(true);
      void (async () => {
        await fetchPage(true);
        setLoading(false);
      })();
    }, [fetchPage, seedFromStore])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    setLastId(undefined);
    await fetchPage(true);
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (loadingMore || !items.length) {
      return;
    }
    setLoadingMore(true);
    await fetchPage(false);
    setLoadingMore(false);
  };

  const openRecord = (rec: FormsRecords) => {
    /** Carga el formato; el detalle remoto del registro se integrará con `formRecordId` + API. */
    navigation.navigate('CanvasForm', {
      formId: rec.form_id,
      formRecordId: rec.id,
    });
  };

  if (loading && !items.length) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <FlatList
        data={items}
        keyExtractor={(r) => String(r.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.35}
        ListFooterComponent={
          loadingMore ? <ActivityIndicator style={{ marginVertical: 16 }} color={COLORS.primary} /> : null
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No hay registros enviados.</Text>
        }
        renderItem={({ item }) => (
          <FormListCard
            title={String(item.form?.name ?? `Registro #${item.id}`)}
            subtitle={item.type ? String(item.type) : undefined}
            meta={`${item.created ?? ''} · ${item.status ?? ''}`}
            onPress={() => openRecord(item)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.menuContentBg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', marginTop: 48, color: COLORS.textMuted },
});
