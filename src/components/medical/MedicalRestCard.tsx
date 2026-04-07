import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import moment from 'moment-timezone';
import type { MedicalRest } from '@/interfaces/medical';
import { COLORS } from '@/theme/colors';

type Props = { item: MedicalRest };

function stateColor(state: string): string {
  if (state === 'APROBADO') return COLORS.successGreen;
  if (state === 'RECHAZADO') return COLORS.danger;
  return COLORS.warningYellow;
}

export function MedicalRestCard({ item }: Props) {
  const dInit = item.date_init ? moment(item.date_init).format('DD/MM/YYYY') : '—';
  const dEnd = item.date_end ? moment(item.date_end).format('DD/MM/YYYY') : '—';
  const dTopic = item.date_init_topic
    ? moment(item.date_init_topic).format('DD/MM/YYYY')
    : '—';

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Tópico: {item.topic}</Text>
      <Text style={styles.sub}>Lugar de emisión: {item.emit_place}</Text>
      <Text style={styles.row}>Motivo de descanso: {item.reason}</Text>
      <Text style={styles.row}>Técnico: {item.doctor_name}</Text>
      <Text style={styles.row}>
        Permiso: {dInit} al {dEnd}
      </Text>
      {item.state === 'RECHAZADO' ? (
        <Text style={styles.reject}>Motivo rechazo: {item.post_reason}</Text>
      ) : null}
      <View style={styles.footerRow}>
        <Text style={styles.solicitud}>Solicitud: {dTopic}</Text>
        <View style={[styles.badge, { backgroundColor: stateColor(item.state) }]}>
          <Text style={styles.badgeTxt}>{item.state}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 14,
    marginHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  title: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  sub: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  row: { fontSize: 14, color: COLORS.text, marginTop: 8 },
  reject: { fontSize: 14, color: COLORS.danger, marginTop: 8, fontWeight: '600' },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  solicitud: { fontSize: 13, color: COLORS.textLabel, flex: 1 },
  badge: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  badgeTxt: { color: COLORS.white, fontWeight: '800', fontSize: 12 },
});
