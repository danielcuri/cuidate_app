import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

export type RadioOption<T extends string | number> = {
  value: T;
  label: string;
};

export type RadioGroupProps<T extends string | number> = {
  value?: T;
  options: readonly RadioOption<T>[];
  onChange: (value: T) => void;
};

export function RadioGroup<T extends string | number>({ value, options, onChange }: RadioGroupProps<T>) {
  return (
    <View style={styles.wrap}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <TouchableOpacity
            key={String(opt.value)}
            style={styles.row}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.85}
          >
            <Ionicons
              name={selected ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={selected ? COLORS.primary : COLORS.textMuted}
            />
            <Text style={styles.label}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { color: COLORS.text, fontWeight: '700', flex: 1 },
});

