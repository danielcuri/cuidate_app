import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../theme/colors';
import { Card } from '../shared/Card';

export type CourseStatus = 0 | 1 | 2 | 3;

export type CourseCardProps = {
  image?: string;
  name: string;
  area: string;
  dateEnd?: string;
  status: CourseStatus;
  onPress?: () => void;
};

const statusMeta: Record<CourseStatus, { label: string; bg: string }> = {
  0: { label: 'Pendiente', bg: COLORS.warningYellow },
  1: { label: 'Aprobado', bg: COLORS.successGreen },
  2: { label: 'Desaprobado', bg: COLORS.danger },
  3: { label: 'Vencido', bg: COLORS.textMuted },
};

export function CourseCard({ image, name, area, dateEnd, status, onPress }: CourseCardProps) {
  const meta = statusMeta[status] ?? statusMeta[0];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.9 : 1} disabled={!onPress}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.imgWrap}>
            {image ? (
              <Image source={{ uri: image }} style={styles.img} resizeMode="cover" />
            ) : (
              <View style={[styles.img, styles.imgFallback]} />
            )}
          </View>
          <View style={styles.body}>
            <Text style={styles.title} numberOfLines={2}>
              {name}
            </Text>
            <Text style={styles.area} numberOfLines={1}>
              {area}
            </Text>
            {dateEnd ? (
              <Text style={styles.date} numberOfLines={1}>
                Fecha límite: {dateEnd}
              </Text>
            ) : null}
            <View style={[styles.badge, { backgroundColor: meta.bg }]}>
              <Text style={styles.badgeText}>{meta.label}</Text>
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.white,
  },
  row: { flexDirection: 'row', gap: 12 },
  imgWrap: { width: 72, height: 72, borderRadius: 12, overflow: 'hidden' },
  img: { width: 72, height: 72, borderRadius: 12 },
  imgFallback: { backgroundColor: COLORS.lightGray },
  body: { flex: 1 },
  title: { fontWeight: '800', color: COLORS.text, fontSize: 14 },
  area: { marginTop: 4, color: COLORS.textMuted, fontWeight: '700' },
  date: { marginTop: 6, color: COLORS.textMuted },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: { color: COLORS.white, fontWeight: '900', fontSize: 12 },
});

