import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

export type IonSelectOption<T extends string | number = string | number> = {
  value: T;
  label: string;
};

type Props<T extends string | number> = {
  label: string;
  value: T | undefined;
  options: IonSelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Muestra buscador en la hoja (p. ej. lista larga de usuarios). */
  searchable?: boolean;
  searchPlaceholder?: string;
};

/**
 * Paridad visual con `ion-select` + `ion-select-option` (etiqueta apilada, fila tapable, lista en modal).
 */
export function FormIonSelect<T extends string | number>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Seleccionar',
  disabled = false,
  searchable = false,
  searchPlaceholder = 'Buscar…',
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filteredOptions = useMemo(() => {
    const t = query.trim().toLowerCase();
    if (!t || !searchable) {
      return options;
    }
    return options.filter((o) => String(o.label).toLowerCase().includes(t));
  }, [options, query, searchable]);

  const displayLabel = useMemo(() => {
    const hit = options.find((o) => String(o.value) === String(value));
    return hit?.label ?? placeholder;
  }, [options, value, placeholder]);

  const openSheet = () => {
    if (!disabled) {
      setQuery('');
      setOpen(true);
    }
  };

  return (
    <>
      <Text style={styles.stackedLabel}>{label}</Text>
      <Pressable
        style={[styles.selectRow, disabled && styles.selectRowDisabled]}
        onPress={openSheet}
        disabled={disabled}
      >
        <Text style={styles.selectValue} numberOfLines={2}>
          {displayLabel}
        </Text>
        <Ionicons name="chevron-down" size={20} color={COLORS.textMuted} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>{label}</Text>
            {searchable ? (
              <TextInput
                style={styles.search}
                value={query}
                onChangeText={setQuery}
                placeholder={searchPlaceholder}
                placeholderTextColor={COLORS.textMuted}
              />
            ) : null}
            <FlatList
              style={styles.sheetList}
              data={filteredOptions}
              keyExtractor={(item) => String(item.value)}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const selected = String(item.value) === String(value);
                return (
                  <TouchableOpacity
                    style={[styles.optionRow, selected && styles.optionRowOn]}
                    activeOpacity={0.75}
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                  >
                    <Text
                      style={[styles.optionTxt, selected && styles.optionTxtOn]}
                      numberOfLines={3}
                    >
                      {item.label}
                    </Text>
                    {selected ? (
                      <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                    ) : null}
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity style={styles.sheetCancel} onPress={() => setOpen(false)}>
              <Text style={styles.sheetCancelTxt}>Cancelar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  stackedLabel: {
    marginTop: 12,
    marginBottom: 6,
    fontWeight: '700',
    color: COLORS.textLabel,
    fontSize: 13,
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    minHeight: 48,
  },
  selectRowDisabled: {
    opacity: 0.55,
  },
  selectValue: {
    flex: 1,
    marginRight: 8,
    fontSize: 15,
    color: COLORS.text,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    maxHeight: '55%',
    paddingBottom: 12,
  },
  sheetList: {
    maxHeight: 320,
  },
  sheetTitle: {
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  search: {
    marginHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.lightGray,
  },
  optionRowOn: {
    backgroundColor: COLORS.lightGray,
  },
  optionTxt: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  optionTxtOn: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  sheetCancel: {
    marginTop: 4,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sheetCancelTxt: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
