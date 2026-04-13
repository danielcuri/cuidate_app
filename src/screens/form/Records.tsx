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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { COLORS } from '../../theme/colors';
import { formService } from '../../services/FormService';
import { userService } from '../../services/UserService';
import { queryService } from '../../services/QueryService';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import type { FormsRecords, GetRecordsResponse } from '../../interfaces/forms';
import { extractList } from '../../utils/formApiHelpers';
import { useFormStore } from '../../stores/formStore';
import { RecordsHeader } from '../../components/shared/RecordsHeader';

type Nav = StackNavigationProp<RootStackParamList, 'Records'>;

function parseRecordStatus(status: FormsRecords['status']): number {
  if (status === undefined || status === null) {
    return -1;
  }
  const n = Number(status);
  return Number.isNaN(n) ? -1 : n;
}

export function Records() {
  const navigation = useNavigation<Nav>();
  const [items, setItems] = useState<FormsRecords[]>([]);
  /** Cursor `last_id` para la siguiente página (paridad `lastIteraction` Ionic). */
  const [nextLastId, setNextLastId] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const seedFromStore = useCallback(() => {
    const fromStore = useFormStore.getState().forms_records;
    if (fromStore?.length) {
      setItems(fromStore);
      const last = fromStore[fromStore.length - 1];
      setNextLastId(last?.id ?? 0);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      seedFromStore();
      setLoading(true);
      setNextLastId(0);
      void (async () => {
        const uid = userService.user.id;
        if (uid == null) {
          setLoading(false);
          return;
        }
        try {
          const res = (await formService.getListRecords({
            last_id: 0,
            user_selected: String(uid),
            form_selected: '%',
          })) as GetRecordsResponse;
          const chunk = extractList<FormsRecords>(res, ['forms_records', 'records', 'data']);
          if (res?.error) {
            queryService.manageErrors(res);
            return;
          }
          const cursor =
            typeof res.lastIteraction === 'number'
              ? res.lastIteraction
              : chunk.length > 0
                ? chunk[chunk.length - 1].id
                : 0;
          setItems(chunk);
          setNextLastId(cursor);
          formService.forms_records = chunk;
          useFormStore.getState().syncFromService();
        } catch (e) {
          console.log(e);
          seedFromStore();
        } finally {
          setLoading(false);
        }
      })();
    }, [seedFromStore])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    setNextLastId(0);
    const uid = userService.user.id;
    if (uid == null) {
      setRefreshing(false);
      return;
    }
    try {
      const res = (await formService.getListRecords({
        last_id: 0,
        user_selected: String(uid),
        form_selected: '%',
      })) as GetRecordsResponse;
      const chunk = extractList<FormsRecords>(res, ['forms_records', 'records', 'data']);
      if (res?.error) {
        queryService.manageErrors(res);
        return;
      }
      const cursor =
        typeof res.lastIteraction === 'number'
          ? res.lastIteraction
          : chunk.length > 0
            ? chunk[chunk.length - 1].id
            : 0;
      setItems(chunk);
      setNextLastId(cursor);
      formService.forms_records = chunk;
      useFormStore.getState().syncFromService();
    } catch (e) {
      console.log(e);
      seedFromStore();
    }
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (loadingMore || !items.length || nextLastId === 0) {
      return;
    }
    setLoadingMore(true);
    const uid = userService.user.id;
    if (uid == null) {
      setLoadingMore(false);
      return;
    }
    try {
      const res = (await formService.getListRecords({
        last_id: nextLastId,
        user_selected: String(uid),
        form_selected: '%',
      })) as GetRecordsResponse;
      const chunk = extractList<FormsRecords>(res, ['forms_records', 'records', 'data']);
      if (res?.error) {
        queryService.manageErrors(res);
        return;
      }
      const cursor =
        typeof res.lastIteraction === 'number'
          ? res.lastIteraction
          : chunk.length > 0
            ? chunk[chunk.length - 1].id
            : 0;
      if (chunk.length) {
        setItems((prev) => [...prev, ...chunk]);
        formService.forms_records = [...(formService.forms_records as FormsRecords[]), ...chunk];
        useFormStore.getState().syncFromService();
      }
      setNextLastId(cursor);
    } catch (e) {
      console.log(e);
      seedFromStore();
    }
    setLoadingMore(false);
  };

  const openRecord = (rec: FormsRecords) => {
    navigation.navigate('CanvasForm', {
      formId: rec.form_id,
      formRecordId: rec.id,
    });
  };

  if (loading && !items.length) {
    return (
      <View style={styles.page}>
        <SafeAreaView style={styles.safeTop} edges={['top']}>
          <RecordsHeader title="Registros" onBack={() => navigation.goBack()} />
        </SafeAreaView>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <SafeAreaView style={styles.safeTop} edges={['top']}>
        <RecordsHeader title="Registros" onBack={() => navigation.goBack()} />
      </SafeAreaView>
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={items}
        keyExtractor={(r) => String(r.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.35}
        ListFooterComponent={
          loadingMore && nextLastId !== 0 ? (
            <ActivityIndicator style={styles.footerSpinner} color={COLORS.primary} />
          ) : null
        }
        ListEmptyComponent={<Text style={styles.empty}>No hay registros enviados.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.formContainer}
            onPress={() => openRecord(item)}
            activeOpacity={0.88}
          >
            <RecordsCard item={item} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function RecordsCard({ item }: { item: FormsRecords }) {
  const title = String(item.form?.name ?? `Registro #${item.id}`);
  const st = parseRecordStatus(item.status);
  const dateStr = item.created ?? item.created_at ?? '';
  const pending = st === 0;

  return (
    <View style={styles.cardRow}>
      <View style={styles.iconWrap}>
        <Ionicons name="checkmark-circle" size={14} color="#3eaf75" />
      </View>
      <Text style={styles.cardTitle} numberOfLines={3}>
        {title}
      </Text>
      <View
        style={[
          styles.dateBadge,
          pending ? styles.dateBadgePending : null,
        ]}
      >
        <Text style={[styles.dateLine, pending ? styles.dateLineOnAccent : null]} numberOfLines={2}>
          {dateStr}
        </Text>
        {pending ? (
          <Text style={[styles.statusLine, styles.dateLineOnAccent]} numberOfLines={1}>
            Pendiente
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.menuContentBg },
  safeTop: {
    backgroundColor: COLORS.white,
  },
  list: { flex: 1 },
  listContent: {
    paddingBottom: 24,
  },
  footerSpinner: { marginVertical: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', marginTop: 48, color: COLORS.textMuted },
  formContainer: {
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  cardRow: {
    alignContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderColor: '#eaeef1',
    borderRadius: 7,
    borderStyle: 'solid',
    borderWidth: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    color: '#505962',
    flex: 1,
    flexBasis: '50%',
    fontSize: 13,
    marginLeft: 8,
    textAlign: 'left',
  },
  dateBadge: {
    borderColor: '#4c5155',
    borderRadius: 15,
    borderWidth: 1,
    flexBasis: 108,
    flexGrow: 0,
    flexShrink: 0,
    maxWidth: 108,
    padding: 5,
  },
  dateBadgePending: {
    backgroundColor: COLORS.warningYellow,
    borderColor: COLORS.warningYellow,
  },
  dateLine: {
    color: '#4c5155',
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  dateLineOnAccent: {
    color: COLORS.white,
  },
  statusLine: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
});
