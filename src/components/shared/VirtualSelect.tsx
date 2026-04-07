import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';

export type VirtualSelectItem = {
  id: string | number;
  name: string;
};

type Props = {
  visible: boolean;
  title: string;
  items: VirtualSelectItem[];
  multiple?: boolean;
  selectedIds: (string | number)[];
  searchable?: boolean;
  onClose: () => void;
  onConfirm: (ids: (string | number)[]) => void;
};

/** Reemplazo de `ionic-selectable`: lista + búsqueda en modal. */
export function VirtualSelect({
  visible,
  title,
  items,
  multiple = false,
  selectedIds,
  searchable = true,
  onClose,
  onConfirm,
}: Props) {
  const [query, setQuery] = useState('');
  const [local, setLocal] = useState<(string | number)[]>(selectedIds);

  React.useEffect(() => {
    if (visible) {
      setLocal([...selectedIds]);
      setQuery('');
    }
  }, [visible, selectedIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return items;
    }
    return items.filter((it) => String(it.name).toLowerCase().includes(q));
  }, [items, query]);

  const toggle = (id: string | number) => {
    if (multiple) {
      setLocal((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    } else {
      setLocal([id]);
    }
  };

  const confirm = () => {
    onConfirm(multiple ? local : local.slice(0, 1));
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Text style={styles.cancel}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <TouchableOpacity onPress={confirm} hitSlop={12}>
            <Text style={styles.ok}>OK</Text>
          </TouchableOpacity>
        </View>
        {searchable && (
          <TextInput
            style={styles.search}
            placeholder="Buscar"
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={setQuery}
          />
        )}
        <FlatList
          data={filtered}
          keyExtractor={(it) => String(it.id)}
          renderItem={({ item }) => {
            const sel = local.includes(item.id);
            return (
              <TouchableOpacity
                style={[styles.row, sel && styles.rowSel]}
                onPress={() => toggle(item.id)}
              >
                <Text style={styles.rowText}>{item.name}</Text>
                {sel ? <Text style={styles.check}>✓</Text> : null}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>Sin resultados</Text>
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  cancel: { color: COLORS.primary, fontSize: 16 },
  title: { flex: 1, textAlign: 'center', fontWeight: '700', color: COLORS.text },
  ok: { color: COLORS.primary, fontWeight: '700', fontSize: 16 },
  search: {
    margin: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.lightGray,
  },
  rowSel: { backgroundColor: COLORS.changePasswordBg },
  rowText: { flex: 1, color: COLORS.text, fontSize: 16 },
  check: { color: COLORS.primary, fontSize: 18, fontWeight: '700' },
  empty: { textAlign: 'center', marginTop: 24, color: COLORS.textMuted },
});
