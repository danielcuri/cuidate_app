import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { formService } from '../../services/FormService';
import { userService } from '../../services/UserService';
import { queryService } from '../../services/QueryService';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import type { Action } from '../../interfaces/forms';
import { FilterFormModal, type FilterFormValues } from '../../components/form/FilterFormModal';
import { useFormStore } from '../../stores/formStore';
import { RecordsHeader } from '../../components/shared/RecordsHeader';

type Nav = StackNavigationProp<RootStackParamList, 'Actions'>;

export function Actions() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [items, setItems] = useState<Action[]>([]);
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

  const mapStatusFilterToApi = (statusFilter: string | undefined): string => {
    if (statusFilter === 'out') {
      return '1';
    }
    if (statusFilter === 'pending') {
      return '0';
    }
    return '%';
  };

  const fetchPage = useCallback(async (reset: boolean) => {
    if (userService.user.id == null) {
      return;
    }
    if (!reset && (!hasMoreRef.current || loadingMoreRef.current)) {
      return;
    }

    const lastId = reset ? 0 : paginationRef.current;
    const fv = filtersRef.current;
    const payload: Record<string, unknown> = {
      last_id: lastId,
      user_selected: '%',
      area_selected: fv.area_selected ?? '%',
      status_id: mapStatusFilterToApi(fv.status_filter),
      content: fv.proposed_filter ?? '',
      fuente_selected: fv.source_filter ?? '%',
      sede_selected: fv.sede_selected ?? '%',
    };

    if (reset) {
      setLoading(true);
    } else {
      loadingMoreRef.current = true;
      setLoadingMore(true);
    }

    try {
      const res = (await formService.getListActions(payload)) as {
        actions?: Action[];
        lastIteraction?: number;
        error?: boolean;
        msg?: string;
      };

      if (res?.error) {
        queryService.manageErrors(res);
        return;
      }

      const chunk = res?.actions ?? [];
      const next = typeof res?.lastIteraction === 'number' ? res.lastIteraction : 0;

      if (reset) {
        setItems(chunk);
        formService.actions = chunk;
      } else if (chunk.length) {
        setItems((prev) => {
          const merged = [...prev, ...chunk];
          formService.actions = merged;
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

  const renderCard = (item: Action) => {
    const rows = item.formatCard ?? [];
    const title = item.proposed_actions ?? `Acción #${item.id}`;
    const dateLabel = item.proposed_date ?? '';
    const risk = item.parent?.risk_level ?? item.risk_level ?? null;
    const statusNum = typeof item.status === 'number' ? item.status : undefined;
    const badge =
      statusNum === 0
        ? { bg: '#ecc547', border: '#ecc547', txt: '#FFF', label: 'Pendiente' }
      : statusNum === 1
        ? { bg: '#e14d47', border: '#e14d47', txt: '#FFF', label: 'Fuera de fecha' }
      : statusNum === 2
        ? { bg: '#96b825', border: '#96b825', txt: '#FFF', label: 'Ejecutado' }
      : { bg: 'transparent', border: '#4c5155', txt: '#4c5155', label: '' };
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => navigation.navigate('ActionDetail', { actionId: item.id })}
        style={styles.cardOuter}
      >
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
            {dateLabel || badge.label ? (
              <View
                style={[
                  styles.dateBadge,
                  { backgroundColor: badge.bg, borderColor: badge.border },
                ]}
              >
                {dateLabel ? (
                  <Text style={[styles.dateBadgeLine1, { color: badge.txt }]}>
                    {dateLabel}
                  </Text>
                ) : null}
                {badge.label ? (
                  <Text style={[styles.dateBadgeLine2, { color: badge.txt }]}>
                    {badge.label}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
          {risk ? (
            <View style={styles.importantMsg}>
              <Text style={styles.importantMsgTxt}>Riesgo: {risk}</Text>
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
  };

  if (loading && !items.length) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <RecordsHeader title="Seguimiento" onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <RecordsHeader title="Seguimiento" onBack={() => navigation.goBack()} />
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.35}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: 24 + insets.bottom },
          ]}
          ListEmptyComponent={<Text style={styles.empty}>No hay acciones.</Text>}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={styles.footerSpinner} color={COLORS.primary} />
            ) : null
          }
          renderItem={({ item }) => renderCard(item)}
        />
      </View>
      <FilterFormModal
        visible={filterOpen}
        locals={locals}
        initial={filters}
        showUserFilter={false}
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

  // Paridad visual con Ionic `app-card` usado en ActionsPage.
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
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  dateBadgeLine2: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
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
