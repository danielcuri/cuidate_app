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
import { formService } from '../../services/FormService';

type UserRow = { id: string | number; name: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  onPick: (u: UserRow) => void;
};

/** Paridad VirtualSelectComponent: primera opción "Todos" (`id: '%'`). */
export function UserSearchModal({ visible, onClose, onPick }: Props) {
  const [q, setQ] = useState('');

  const users = (formService.users as { id: number; name: string }[]) ?? [];

  const rows = useMemo(() => {
    const all: UserRow[] = [{ id: '%', name: 'Todos' }, ...users.map((u) => ({ id: u.id, name: u.name }))];
    const t = q.trim().toLowerCase();
    if (!t) {
      return all;
    }
    return all.filter((r) => String(r.name).toLowerCase().includes(t));
  }, [users, q]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancel}>Cerrar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Responsable</Text>
          <View style={{ width: 56 }} />
        </View>
        <TextInput
          style={styles.search}
          placeholder="Buscar usuario"
          placeholderTextColor={COLORS.textMuted}
          value={q}
          onChangeText={setQ}
        />
        <FlatList
          data={rows}
          keyExtractor={(it) => String(it.id)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => {
                onPick(item);
              }}
            >
              <Text style={styles.rowTxt}>{item.name}</Text>
            </TouchableOpacity>
          )}
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
  title: { fontWeight: '800', color: COLORS.text, fontSize: 16 },
  search: {
    margin: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    fontSize: 16,
    color: COLORS.text,
  },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.lightGray,
  },
  rowTxt: { fontSize: 16, color: COLORS.text },
});
