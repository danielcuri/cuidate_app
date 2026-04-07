import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { formService } from '../../services/FormService';
import { userService } from '../../services/UserService';
import { queryService } from '../../services/QueryService';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import type { Action } from '../../interfaces/forms';
import { FormListCard } from '../../components/form/FormListCard';
import { FilterFormModal, type FilterFormValues } from '../../components/form/FilterFormModal';
import { extractList } from '../../utils/formApiHelpers';
import { useFormStore } from '../../stores/formStore';

type Nav = StackNavigationProp<RootStackParamList, 'Effectiveness'>;

export function Effectiveness() {
  const navigation = useNavigation<Nav>();
  const [items, setItems] = useState<Action[]>([]);
  const [lastId, setLastId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterFormValues>({});

  const locals = useFormStore((s) => s.locals);

  const load = useCallback(
    async (reset: boolean) => {
      const uid = userService.user.id;
      if (uid == null) {
        return;
      }
      const payload: Record<string, unknown> = {
        last_id: reset ? undefined : lastId,
        user_id: uid,
        sede_selected: filters.sede_selected ?? '%',
        area_selected: filters.area_selected ?? '%',
        status_filter: filters.status_filter ?? 'all',
        source_filter: filters.source_filter ?? '1',
        proposed_filter: filters.proposed_filter ?? '',
        user_selected: filters.user_selected ?? '%',
      };
      const res = await formService.getListEffectiveness(payload);
      const chunk = extractList<Action>(res, ['actions_executed', 'actions', 'data']);
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
    },
    [lastId, filters]
  );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void (async () => {
        await load(true);
        setLoading(false);
      })();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    setLastId(undefined);
    await load(true);
    setRefreshing(false);
  };

  const onFilterApply = (v: FilterFormValues) => {
    if (v.close) {
      return;
    }
    setFilters(v);
    setLastId(undefined);
    void load(true);
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
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setFilterOpen(true)}>
          <Ionicons name="filter-outline" size={22} color={COLORS.white} />
          <Text style={styles.filterTxt}>Filtros</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={items}
        keyExtractor={(a) => String(a.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={() => void load(false)}
        onEndReachedThreshold={0.35}
        ListEmptyComponent={<Text style={styles.empty}>No hay registros de eficacia.</Text>}
        renderItem={({ item }) => (
          <FormListCard
            title={item.proposed_actions ?? `Eficacia #${item.id}`}
            subtitle={item.findings}
            meta={`${item.proposed_date ?? ''} · ${item.risk_level ?? ''}`}
            onPress={() =>
              navigation.navigate('CreateEffectiveness', {
                pamolsaActionDetailId: item.id,
                effectiveDate: String(item.proposed_date ?? new Date().toISOString()),
              })
            }
          />
        )}
      />
      <FilterFormModal
        visible={filterOpen}
        locals={locals}
        initial={filters}
        onClose={() => setFilterOpen(false)}
        onApply={onFilterApply}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.menuContentBg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  toolbar: { padding: 12, alignItems: 'flex-end' },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  filterTxt: { color: COLORS.white, fontWeight: '800' },
  empty: { textAlign: 'center', marginTop: 48, color: COLORS.textMuted },
});
