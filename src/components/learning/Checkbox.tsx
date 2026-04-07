import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

export type CheckboxProps = {
  checked: boolean;
  label: string;
  onToggle: () => void;
};

export function Checkbox({ checked, label, onToggle }: CheckboxProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onToggle} activeOpacity={0.85}>
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked ? <Ionicons name="checkmark" size={16} color={COLORS.white} /> : null}
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  boxChecked: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  label: { color: COLORS.text, fontWeight: '700', flex: 1 },
});

