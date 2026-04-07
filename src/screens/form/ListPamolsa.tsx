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
import { COLORS } from '../../theme/colors';
import { formService } from '../../services/FormService';
import { queryService } from '../../services/QueryService';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import type { FormsRecords } from '../../interfaces/forms';
import { FormListCard } from '../../components/form/FormListCard';
import { extractList } from '../../utils/formApiHelpers';
import { useFormStore } from '../../stores/formStore';

type Nav = StackNavigationProp<RootStackParamList, 'ListPamolsa'>;

export function ListPamolsa() {
  const navigation = useNavigation<Nav>();
  const [items, setItems] = useState<FormsRecords[]>([]);
  const [lastId, setLastId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [areaId, setAreaId] = useState<string | number | undefined>(undefined);

  const areas = useFormStore((s) => s.pamolsaAreas) as { id: number; name: string }[];

  const load = useCallback(
    async (reset: boolean) => {
      try {
        const res = await formService.getPamolsaRecords({
          last_id: reset ? undefined : lastId,
          area_selected: areaId ?? '%',
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
      }
    },
    [lastId, areaId]
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

  if (loading && !items.length) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <View style={styles.areaBar}>
        <Text style={styles.areaLbl}>Área</Text>
        <FlatList
          horizontal
          data={[{ id: '%', name: 'Todas' }, ...(areas ?? [])]}
          keyExtractor={(a) => String(a.id)}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => {
            const sel = String(areaId ?? '%') === String(item.id);
            return (
              <TouchableOpacity
                style={[styles.areaChip, sel && styles.areaChipOn]}
                onPress={() => {
                  setAreaId(item.id === '%' ? undefined : item.id);
                  setLastId(undefined);
                  void load(true);
                }}
              >
                <Text style={[styles.areaChipTxt, sel && styles.areaChipTxtOn]}>{item.name}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
      <FlatList
        data={items}
        keyExtractor={(r) => String(r.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={() => void load(false)}
        onEndReachedThreshold={0.35}
        ListEmptyComponent={<Text style={styles.empty}>No hay inspecciones.</Text>}
        renderItem={({ item }) => (
          <FormListCard
            title={String(item.form?.name ?? `Inspección #${item.id}`)}
            meta={`${item.created ?? ''} · ${item.status ?? ''}`}
            onPress={() =>
              navigation.navigate('CanvasForm', { formId: item.form_id, formRecordId: item.id })
            }
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.menuContentBg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  areaBar: { paddingVertical: 10, paddingLeft: 12, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  areaLbl: { fontSize: 12, fontWeight: '700', color: COLORS.textLabel, marginBottom: 6 },
  areaChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: COLORS.lightGray,
  },
  areaChipOn: { backgroundColor: COLORS.primary },
  areaChipTxt: { fontSize: 13, color: COLORS.text },
  areaChipTxtOn: { color: COLORS.white, fontWeight: '700' },
  empty: { textAlign: 'center', marginTop: 48, color: COLORS.textMuted },
});
