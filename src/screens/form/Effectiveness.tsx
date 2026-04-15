import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { formService } from '../../services/FormService';
import { userService } from '../../services/UserService';
import { queryService } from '../../services/QueryService';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import type {
  EffectivenessFormatCardRow,
  EffectivenessListItem,
  GetListEffectivenessPayload,
} from '../../interfaces/forms';
import { FilterFormModal, type FilterFormValues } from '../../components/form/FilterFormModal';
import { useFormStore } from '../../stores/formStore';
import { RecordsHeader } from '../../components/shared/RecordsHeader';

type Nav = StackNavigationProp<RootStackParamList, 'Effectiveness'>;

function formatEffectiveDate(iso: string | null | undefined): string {
  if (iso == null || iso === '') {
    return '';
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return String(iso);
  }
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function mapStatusFilterToApi(statusFilter: string | undefined): string {
  if (statusFilter === 'out') {
    return '1';
  }
  if (statusFilter === 'pending') {
    return '0';
  }
  return '%';
}

function buildPayload(
  filterValues: FilterFormValues,
  lastId: number
): GetListEffectivenessPayload {
  return {
    last_id: lastId,
    user_selected: filterValues.user_selected ?? '%',
    area_selected: filterValues.area_selected ?? '%',
    status_id: mapStatusFilterToApi(filterValues.status_filter),
    content: filterValues.proposed_filter ?? '',
  };
}

type CardProps = {
  title: string;
  effectiveDate: string | null | undefined;
  riskLevel: string | null | undefined;
  rows: EffectivenessFormatCardRow[];
  onPress: () => void;
};

function EffectivenessPamolsaCard({
  title,
  effectiveDate,
  riskLevel,
  rows,
  onPress,
}: CardProps) {
  const dateLabel = formatEffectiveDate(effectiveDate);
  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={styles.cardOuter}>
      <View style={styles.manage}>
        <View style={styles.topRow}>
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={14} color="#3eaf75" />
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.cardTitle} numberOfLines={4}>
              {title}
            </Text>
          </View>
          {dateLabel ? (
            <View style={styles.dateBadge}>
              <Text style={styles.dateBadgeLine1}>{dateLabel}</Text>
            </View>
          ) : null}
        </View>
        {riskLevel ? (
          <View style={styles.importantMsg}>
            <Text style={styles.importantMsgTxt}>Riesgo: {riskLevel}</Text>
          </View>
        ) : null}
        {rows.length > 0 ? <View style={styles.separator} /> : null}
        {rows.length > 0 ? (
          <View style={styles.information}>
            {rows.map((row, i) => (
              <View style={styles.option} key={`${row.left}-${i}`}>
                <Text style={styles.optionLeft}>{row.left}</Text>
                <Text style={styles.optionRight} numberOfLines={6}>
                  {row.right}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export function Effectiveness() {
  const navigation = useNavigation<Nav>();
  const [items, setItems] = useState<EffectivenessListItem[]>([]);
  const [filters, setFilters] = useState<FilterFormValues>({});
  const filtersRef = useRef(filters);
  const paginationRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);

  const locals = useFormStore((s) => s.locals);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const fetchPage = useCallback(async (reset: boolean) => {
    if (userService.user.id == null) {
      return;
    }
    if (!reset && (!hasMoreRef.current || loadingMoreRef.current)) {
      return;
    }

    const lastId = reset ? 0 : paginationRef.current;
    const payload = buildPayload(filtersRef.current, lastId);

    if (reset) {
      setLoading(true);
    } else {
      loadingMoreRef.current = true;
      setLoadingMore(true);
    }

    try {
      const res = await formService.getListEffectiveness(payload);
      if (res.error) {
        queryService.manageErrors(res);
        return;
      }
      const chunk = res.actions_executed ?? [];
      const next = res.lastIteraction ?? 0;

      if (reset) {
        setItems(chunk);
        formService.actions_executed = chunk;
      } else if (chunk.length) {
        setItems((prev) => {
          const merged = [...prev, ...chunk];
          formService.actions_executed = merged;
          return merged;
        });
      }

      paginationRef.current = next;
      hasMoreRef.current = next !== 0;
      setHasMore(next !== 0);
    } finally {
      if (reset) {
        setLoading(false);
      } else {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      paginationRef.current = 0;
      hasMoreRef.current = true;
      setHasMore(true);
      void fetchPage(true);
    }, [fetchPage])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    setFilters({});
    filtersRef.current = {};
    paginationRef.current = 0;
    hasMoreRef.current = true;
    setHasMore(true);
    await fetchPage(true);
    setRefreshing(false);
  };

  const onFilterApply = (v: FilterFormValues) => {
    if (v.close) {
      return;
    }
    setFilters(v);
    filtersRef.current = v;
    paginationRef.current = 0;
    hasMoreRef.current = true;
    setHasMore(true);
    void fetchPage(true);
  };

  const onEndReached = () => {
    if (!loading && !loadingMore && hasMore && items.length > 0) {
      void fetchPage(false);
    }
  };

  if (loading && !items.length) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <RecordsHeader title="Eficacia" onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <RecordsHeader title="Eficacia" onBack={() => navigation.goBack()} />
      <View style={styles.page}>
        <TouchableOpacity
          style={styles.filterBlock}
          activeOpacity={0.88}
          onPress={() => setFilterOpen(true)}
        >
          <Text style={styles.filterBlockTxt}>Filtros</Text>
        </TouchableOpacity>
        <FlatList
          data={items}
          keyExtractor={(a) => String(a.id)}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.35}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.empty}>No hay registros de eficacia.</Text>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={styles.footerSpinner} color={COLORS.primary} />
            ) : null
          }
          renderItem={({ item }) => (
            <EffectivenessPamolsaCard
              title={item.proposed_actions ?? `Eficacia #${item.id}`}
              effectiveDate={item.effective_date}
              riskLevel={item.parent?.risk_level ?? undefined}
              rows={item.formatCard ?? []}
              onPress={() =>
                navigation.navigate('CreateEffectiveness', {
                  pamolsaActionDetailId: item.id,
                  effectiveDate: String(item.effective_date ?? ''),
                })
              }
            />
          )}
        />
      </View>
      <FilterFormModal
        variant="effectiveness"
        visible={filterOpen}
        locals={locals}
        initial={filters}
        onClose={() => setFilterOpen(false)}
        onApply={onFilterApply}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.menuContentBg },
  page: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingBottom: 24 },
  filterBlock: {
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBlockTxt: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
  empty: { textAlign: 'center', marginTop: 48, color: COLORS.textMuted },
  footerSpinner: { marginVertical: 16 },
  cardOuter: {
    marginHorizontal: 12,
    marginVertical: 6,
  },
  manage: {
    backgroundColor: COLORS.white,
    borderColor: '#eaeef1',
    borderRadius: 7,
    borderWidth: 2,
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    width: '100%',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flexGrow: 1,
    flexShrink: 1,
    marginLeft: 8,
    minWidth: '45%',
  },
  cardTitle: {
    color: '#505962',
    fontSize: 13,
  },
  dateBadge: {
    backgroundColor: 'transparent',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#4c5155',
    padding: 5,
    width: 108,
    flexBasis: 108,
    flexGrow: 0,
  },
  dateBadgeLine1: {
    color: '#4c5155',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  importantMsg: {
    width: '100%',
    marginTop: 4,
  },
  importantMsgTxt: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text,
  },
  separator: {
    backgroundColor: '#367293',
    height: 1,
    width: '100%',
    marginVertical: 8,
  },
  information: {
    width: '100%',
  },
  option: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  optionLeft: {
    color: '#4c5155',
    fontSize: 10,
    marginRight: 4,
    fontWeight: '500',
  },
  optionRight: {
    color: '#4c5155',
    fontSize: 10,
    flex: 1,
  },
});
