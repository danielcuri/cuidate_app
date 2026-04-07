import React, { PropsWithChildren } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { COLORS } from '../../theme/colors';

type Props = PropsWithChildren<{
  title: string;
  subtitle?: string;
  meta?: string;
  onPress?: () => void;
  style?: ViewStyle;
}>;

export function FormListCard({
  title,
  subtitle,
  meta,
  onPress,
  children,
  style,
}: Props) {
  const Inner = (
    <View style={[styles.card, style]}>
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={styles.sub} numberOfLines={3}>
          {subtitle}
        </Text>
      ) : null}
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.88} onPress={onPress}>
        {Inner}
      </TouchableOpacity>
    );
  }
  return Inner;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 12,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    shadowColor: COLORS.black,
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  sub: {
    marginTop: 6,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  meta: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
