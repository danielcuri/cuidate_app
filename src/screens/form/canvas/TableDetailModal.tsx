import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { FormDesign } from '../../../interfaces/forms';
import { COLORS } from '../../../theme/colors';

type Row = Record<number, string | number | boolean>;

function emptyRow(columns: FormDesign[]): Row {
  const r: Row = {};
  for (const c of columns) {
    if (c.field_type_id === 9) {
      r[c.id] = false;
    } else if (c.field_type_id === 2) {
      r[c.id] = '';
    } else {
      r[c.id] = '';
    }
  }
  return r;
}

type Props = {
  visible: boolean;
  tableField: FormDesign | null;
  rows: unknown[];
  onClose: () => void;
  onSave: (rows: unknown[]) => void;
};

/**
 * Paridad `TableDetail`: edición de filas de tabla (tipo 13).
 * Tipos de celda complejos: // TODO: VERIFICAR con Ionic (subcampos, listas).
 */
export function TableDetailModal({
  visible,
  tableField,
  rows,
  onClose,
  onSave,
}: Props) {
  const columns = tableField?.columns ?? [];
  const [local, setLocal] = useState<Row[]>([]);

  React.useEffect(() => {
    if (visible && tableField) {
      const initial = (rows as Row[]).length
        ? (rows as Row[]).map((row) => {
            const copy: Row = { ...row };
            for (const c of columns) {
              if (copy[c.id] === undefined) {
                copy[c.id] = c.field_type_id === 9 ? false : '';
              }
            }
            return copy;
          })
        : [];
      setLocal(initial);
    }
  }, [visible, tableField, rows, columns]);

  const title = tableField?.label ?? 'Detalle tabla';

  const addRow = () => {
    setLocal((prev) => [...prev, emptyRow(columns)]);
  };

  const updateCell = (rowIdx: number, colId: number, text: string) => {
    setLocal((prev) => {
      const next = [...prev];
      const row = { ...next[rowIdx] };
      row[colId] = text;
      next[rowIdx] = row;
      return next;
    });
  };

  const removeRow = (idx: number) => {
    setLocal((prev) => prev.filter((_, i) => i !== idx));
  };

  const save = () => {
    onSave(local);
    onClose();
  };

  if (!tableField) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.link}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <TouchableOpacity onPress={save}>
            <Text style={styles.linkBold}>Guardar</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.scroll}>
          {local.map((row, ri) => (
            <View key={ri} style={styles.card}>
              <View style={styles.rowHead}>
                <Text style={styles.rowTitle}>Fila {ri + 1}</Text>
                <TouchableOpacity onPress={() => removeRow(ri)}>
                  <Text style={styles.danger}>Eliminar</Text>
                </TouchableOpacity>
              </View>
              {columns.map((col) => (
                <View key={col.id} style={styles.cell}>
                  <Text style={styles.label}>{col.label}</Text>
                  <TextInput
                    style={styles.input}
                    value={String(row[col.id] ?? '')}
                    onChangeText={(t) => updateCell(ri, col.id, t)}
                    keyboardType={col.field_type_id === 2 ? 'numeric' : 'default'}
                    multiline={col.field_type_id === 3}
                  />
                </View>
              ))}
            </View>
          ))}
          <TouchableOpacity style={styles.addBtn} onPress={addRow}>
            <Text style={styles.addBtnText}>+ Agregar fila</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.menuContentBg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  title: { flex: 1, textAlign: 'center', fontWeight: '700', color: COLORS.text },
  link: { color: COLORS.primary },
  linkBold: { color: COLORS.primary, fontWeight: '700' },
  scroll: { padding: 12, paddingBottom: 32 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  rowHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rowTitle: { fontWeight: '700', color: COLORS.text },
  danger: { color: COLORS.danger },
  cell: { marginBottom: 10 },
  label: { fontSize: 12, color: COLORS.textLabel, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    color: COLORS.text,
  },
  addBtn: {
    padding: 14,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignItems: 'center',
  },
  addBtnText: { color: COLORS.white, fontWeight: '700' },
});
