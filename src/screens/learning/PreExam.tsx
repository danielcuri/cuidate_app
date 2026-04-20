import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { learningService } from '../../services/LearningService';
import { loadingService } from '../../services/LoadingService';
import { queryService } from '../../services/QueryService';
import { userService } from '../../services/UserService';
import { useLearningStore } from '../../stores/learningStore';
import { RecordsHeader } from '../../components/shared/RecordsHeader';

type Props = StackScreenProps<RootStackParamList, 'PreExam'>;

export function PreExam({ navigation, route }: Props) {
  const { examId, courseId, name } = route.params;
  const dni = userService.user.dni ?? '';
  const [loading, setLoading] = useState(true);
  const [disabled, setDisabled] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const setCurrentExam = useLearningStore((s) => s.setCurrentExam);
  const setCurrentQuestions = useLearningStore((s) => s.setCurrentQuestions);
  const currentExam = useLearningStore((s) => s.currentExam);

  useEffect(() => {
    const run = async () => {
      if (!dni) return;
      setLoading(true);
      await loadingService.present();
      try {
        const res = await learningService.getExamDetail({ dni, exam_id: examId });
        queryService.manageErrors(res);
        setCurrentExam(res.exam);
        setCurrentQuestions(res.questions ?? []);
        setDisabled(!!res.error);
      } finally {
        await loadingService.dismiss();
        setLoading(false);
      }
    };
    void run();
  }, [dni, examId, setCurrentExam, setCurrentQuestions]);

  const meta = useMemo(() => {
    const ex = currentExam;
    if (!ex) return [];
    return [
      { k: 'Duración', v: ex.minutes ? `${ex.minutes} min` : ex.exam_duration },
      { k: 'Intentos', v: `${ex.scholar_attempts ?? 0}/${ex.attempts ?? 0}` },
      { k: 'Nota mínima', v: String(ex.pass_grade ?? '') },
    ].filter((x) => x.v);
  }, [currentExam]);

  return (
    <View style={styles.page}>
      <SafeAreaView style={styles.safeTop} edges={['top']}>
        <RecordsHeader title="Pre-examen" onBack={() => navigation.goBack()} />
      </SafeAreaView>
      <View style={styles.card}>
        <Text style={styles.sub} numberOfLines={2}>
          {name}
        </Text>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator />
            <Text style={styles.muted}>Cargando examen…</Text>
          </View>
        ) : (
          <>
            {meta.map((m) => (
              <View key={m.k} style={styles.row}>
                <Text style={styles.k}>{m.k}</Text>
                <Text style={styles.v}>{m.v}</Text>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.btn, disabled && styles.btnDisabled]}
              onPress={() => navigation.navigate('Exam', { courseId, name, examId })}
              activeOpacity={0.9}
              disabled={disabled}
            >
              <Text style={styles.btnText}>{disabled ? 'No disponible' : 'Iniciar'}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.menuContentBg, padding: 16 },
  safeTop: { backgroundColor: COLORS.white, marginHorizontal: -16, marginTop: -16, marginBottom: 16 },
  card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.lightGray },
  sub: { marginTop: 4, color: COLORS.textMuted, fontWeight: '800' },
  center: { marginTop: 18, alignItems: 'center', gap: 10 },
  muted: { color: COLORS.textMuted },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  k: { color: COLORS.textMuted, fontWeight: '800' },
  v: { color: COLORS.text, fontWeight: '900' },
  btn: { marginTop: 16, backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  btnDisabled: { backgroundColor: COLORS.textMuted },
  btnText: { color: COLORS.white, fontWeight: '900' },
});

