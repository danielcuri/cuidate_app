import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';

type Props = {
  onBack: () => void;
};

/** Parity `ion-footer.footer_form` + botón negativo Ionic. */
export function MenuFooter({ onBack }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.btn} onPress={onBack} activeOpacity={0.85}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
          <Text style={styles.btnText}>Volver</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: COLORS.white,
  },
  footer: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.footerNegativeBorder,
    backgroundColor: COLORS.white,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  btnText: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 14,
  },
});
