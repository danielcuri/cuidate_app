import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { COLORS } from '../../theme/colors';
import { userService } from '../../services/UserService';

const DEFAULT_LOGO = require('../../../assets/icon.png');

type Props = {
  /** Si se omite, se usa "Bienvenido {nombre}" como en Ionic. */
  title?: string;
  logoLeft?: ImageSourcePropType;
  logoRight?: ImageSourcePropType;
  style?: ViewStyle;
};

export function MenuHeader({ title, logoLeft, logoRight, style }: Props) {
  const name = userService.user.name ?? '';
  const label = title ?? `Bienvenido ${name}`;
  const left = logoLeft ?? DEFAULT_LOGO;
  const right = logoRight ?? DEFAULT_LOGO;

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.logoRow}>
        <Image
          source={left}
          style={[styles.logo, styles.logoFirst]}
          resizeMode="contain"
        />
        <Image source={right} style={styles.logo} resizeMode="contain" />
      </View>
      <View style={styles.strip}>
        <View style={[styles.stripSeg, { backgroundColor: COLORS.danger }]} />
        <View style={[styles.stripSeg, { backgroundColor: COLORS.warningYellow }]} />
        <View style={[styles.stripSeg, { backgroundColor: COLORS.successGreen }]} />
      </View>
      <View style={styles.titleBar}>
        <Text style={styles.title} numberOfLines={3}>
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.white,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  logo: {
    width: 56,
    height: 40,
  },
  logoFirst: {
    marginRight: 8,
  },
  strip: {
    flexDirection: 'row',
    height: 6,
    width: '100%',
    marginTop: 4,
  },
  stripSeg: { flex: 1 },
  titleBar: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  title: {
    color: COLORS.changePasswordTitle,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
});
