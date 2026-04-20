import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import RenderHTML from 'react-native-render-html';
import { useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { learningService } from '../../services/LearningService';
import { loadingService } from '../../services/LoadingService';
import { queryService } from '../../services/QueryService';
import { userService } from '../../services/UserService';
import type { Questions } from '../../interfaces/learning';
import { RadioGroup } from '../../components/learning/RadioGroup';
import { Checkbox } from '../../components/learning/Checkbox';
import { useLearningStore } from '../../stores/learningStore';
import { RecordsHeader } from '../../components/shared/RecordsHeader';

type Props = StackScreenProps<RootStackParamList, 'Exam'>;

export function Exam({ navigation, route }: Props) {
  const { name, examId, courseId } = route.params;
  const dni = userService.user.dni ?? '';
  const { width } = useWindowDimensions();

  const exam = useLearningStore((s) => s.currentExam);
  const questions = useLearningStore((s) => s.currentQuestions);

  const [timeDisplay, setTimeDisplay] = useState('00:00');
  const [onTime, setOnTime] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date>(new Date());

  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    startTimeRef.current = new Date();
    const minutes = exam?.minutes ?? 0;
    const totalSeconds = Math.max(0, minutes * 60);
    let remaining = totalSeconds;
    const tick = () => {
      const m = Math.floor(remaining / 60)
        .toString()
        .padStart(2, '0');
      const s = (remaining % 60).toString().padStart(2, '0');
      setTimeDisplay(`${m}:${s}`);
      remaining--;
      if (remaining < 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        setOnTime(false);
      }
    };
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [exam?.minutes]);

  const qList = useMemo(() => questions ?? [], [questions]);

  const setRadio = (q: Questions, value: string) => {
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
  };

  const toggleCheck = (q: Questions, value: string) => {
    setAnswers((prev) => {
      const cur = prev[q.id];
      const arr = Array.isArray(cur) ? cur : [];
      const next = arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
      return { ...prev, [q.id]: next };
    });
  };

  const submit = async () => {
    if (!dni) return;
    const finish = new Date();
    await loadingService.present();
    try {
      const res = await learningService.registerExam({
        dni,
        exam_id: examId,
        answers,
        exam_start_time: startTimeRef.current.toISOString(),
        exam_finish_time: finish.toISOString(),
      });
      queryService.manageErrors(res);
      if (!res.error) {
        Alert.alert('Simplex', res.msg || 'Examen enviado.');
        navigation.navigate('CourseDetail', { courseId, name });
      }
    } finally {
      await loadingService.dismiss();
    }
  };

  return (
    <View style={styles.page}>
      <SafeAreaView style={styles.safeTop} edges={['top']}>
        <RecordsHeader title="Examen" onBack={() => navigation.goBack()} />
      </SafeAreaView>
      <View style={styles.top}>
        <View style={styles.topLeft}>
          <Text style={styles.sub} numberOfLines={2}>
            {name}
          </Text>
        </View>
        <View style={[styles.timerPill, !onTime && styles.timerPillOff]}>
          <Text style={styles.timerText}>{timeDisplay}</Text>
        </View>
      </View>

      {!onTime ? (
        <View style={styles.timeUp}>
          <Text style={styles.timeUpTitle}>Se acabó el tiempo</Text>
          <TouchableOpacity style={styles.btn} onPress={submit} activeOpacity={0.9}>
            <Text style={styles.btnText}>Enviar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {qList.map((q, idx) => {
            const current = answers[q.id];
            const questionHtml = q.question ?? '';
            const radioOptions = (q.convert_answers ?? q.answers ?? []).map((a, i) => ({
              value: String(i),
              label: String(a),
            }));
            return (
              <View key={String(q.id)} style={styles.card}>
                <Text style={styles.qIndex}>Pregunta {idx + 1}</Text>
                {questionHtml ? (
                  <RenderHTML
                    contentWidth={width - 32}
                    source={{ html: `<div>${questionHtml}</div>` }}
                    baseStyle={styles.htmlBase}
                  />
                ) : null}
                {q.type === 0 ? (
                  <RadioGroup
                    value={typeof current === 'string' ? (current as string) : undefined}
                    options={radioOptions}
                    onChange={(v) => setRadio(q, String(v))}
                  />
                ) : (
                  <View style={styles.checkWrap}>
                    {radioOptions.map((opt) => (
                      <Checkbox
                        key={opt.value}
                        checked={Array.isArray(current) ? (current as string[]).includes(opt.value) : false}
                        label={opt.label}
                        onToggle={() => toggleCheck(q, opt.value)}
                      />
                    ))}
                  </View>
                )}
              </View>
            );
          })}

          <TouchableOpacity
            style={styles.btn}
            onPress={() =>
              Alert.alert('Simplex', '¿Finalizar examen?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Finalizar', style: 'destructive', onPress: submit },
              ])
            }
            activeOpacity={0.9}
          >
            <Text style={styles.btnText}>Finalizar</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.menuContentBg },
  safeTop: { backgroundColor: COLORS.white },
  top: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  topLeft: { flex: 1 },
  sub: { marginTop: 4, color: COLORS.textMuted, fontWeight: '800' },
  timerPill: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  timerPillOff: { backgroundColor: COLORS.danger },
  timerText: { color: COLORS.white, fontWeight: '900' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 24, gap: 12 },
  card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.lightGray, gap: 10 },
  qIndex: { fontWeight: '900', color: COLORS.textMuted },
  htmlBase: { color: COLORS.text, fontWeight: '800' },
  checkWrap: { gap: 10 },
  btn: { marginTop: 6, backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  btnText: { color: COLORS.white, fontWeight: '900' },
  timeUp: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, gap: 12 },
  timeUpTitle: { fontWeight: '900', fontSize: 18, color: COLORS.danger },
});
