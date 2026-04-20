import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

const LOGO_LEFT = require('../../../assets/primero_seguro.jpg');
const LOGO_RIGHT = require('../../../assets/pamolsa.jpg');

export type RecordsHeaderProps = {
  title: string;
  onBack: () => void;
  style?: ViewStyle;
  titleNumberOfLines?: number;
  showBackButton?: boolean;
};

export function RecordsHeader({
  title,
  onBack,
  style,
  titleNumberOfLines = 1,
  showBackButton = true,
}: RecordsHeaderProps) {
  return (
    <View style={[styles.headerWrap, style]}>
      <View style={styles.logoRow}>
        <Image source={LOGO_LEFT} style={[styles.logo, styles.logoFirst]} resizeMode="contain" />
        <View style={styles.logoRightWrap}>
          <Image source={LOGO_RIGHT} style={styles.logo} resizeMode="contain" />
        </View>
      </View>
      <View style={styles.strip}>
        <View style={[styles.stripSeg, { backgroundColor: COLORS.danger }]} />
        <View style={[styles.stripSeg, { backgroundColor: COLORS.warningYellow }]} />
        <View style={[styles.stripSeg, { backgroundColor: COLORS.successGreen }]} />
      </View>
      <View style={styles.toolbar}>
        {showBackButton ? (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtnSpacer} />
        )}
        <Text style={styles.toolbarTitle} numberOfLines={titleNumberOfLines}>
          {title}
        </Text>
        <View style={styles.backBtnSpacer} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
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
  logoRightWrap: {
    marginLeft: 'auto',
  },
  strip: {
    flexDirection: 'row',
    height: 6,
    width: '100%',
    marginTop: 4,
  },
  stripSeg: { flex: 1 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    minHeight: 44,
  },
  backBtn: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backBtnSpacer: {
    width: 40,
  },
  toolbarTitle: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.changePasswordTitle,
    fontSize: 13,
    fontWeight: '900',
  },
});
