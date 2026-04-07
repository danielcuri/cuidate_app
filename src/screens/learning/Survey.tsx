import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { COLORS } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { learningService } from '../../services/LearningService';
import { loadingService } from '../../services/LoadingService';
import { queryService } from '../../services/QueryService';
import { userService } from '../../services/UserService';
import { RadioGroup } from '../../components/learning/RadioGroup';

type Props = StackScreenProps<RootStackParamList, 'Survey'>;

type SurveyValue = 1 | 2 | 3 | 4 | 5;

export function Survey({ navigation, route }: Props) {
  const { courseId, name } = route.params;
  const dni = userService.user.dni ?? '';

  const options = useMemo(
    () =>
      [
        { value: 1 as const, label: '1 - Muy malo' },
        { value: 2 as const, label: '2 - Malo' },
        { value: 3 as const, label: '3 - Regular' },
        { value: 4 as const, label: '4 - Bueno' },
        { value: 5 as const, label: '5 - Excelente' },
      ] as const,
    []
  );

  const [q1, setQ1] = useState<SurveyValue | undefined>();
  const [q2, setQ2] = useState<SurveyValue | undefined>();
  const [q3, setQ3] = useState<SurveyValue | undefined>();
  const [comment, setComment] = useState('');

  const submit = async () => {
    if (!dni) return;
    if (!q1 || !q2 || !q3) {
      Alert.alert('Simplex', 'Completa todas las preguntas (1–5).');
      return;
    }
    await loadingService.present();
    try {
      const res = await learningService.registerSurvey({
        dni,
        course_id: courseId,
        answers: { q1, q2, q3 },
        comment: comment.trim() || undefined,
      });
      queryService.manageErrors(res);
      if (!res.error) {
        Alert.alert('Simplex', res.msg || 'Encuesta enviada.');
        navigation.goBack();
      }
    } finally {
      await loadingService.dismiss();
    }
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.title}>Encuesta</Text>
        <Text style={styles.sub} numberOfLines={2}>
          {name}
        </Text>

        <View style={styles.block}>
          <Text style={styles.q}>1) ¿Cómo calificas el contenido?</Text>
          <RadioGroup value={q1} options={options} onChange={(v) => setQ1(v as SurveyValue)} />
        </View>

        <View style={styles.block}>
          <Text style={styles.q}>2) ¿Cómo calificas al instructor?</Text>
          <RadioGroup value={q2} options={options} onChange={(v) => setQ2(v as SurveyValue)} />
        </View>

        <View style={styles.block}>
          <Text style={styles.q}>3) ¿Recomendarías este curso?</Text>
          <RadioGroup value={q3} options={options} onChange={(v) => setQ3(v as SurveyValue)} />
        </View>

        <View style={styles.block}>
          <Text style={styles.q}>Comentario (opcional)</Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Escribe aquí…"
            style={styles.input}
            multiline
          />
        </View>

        <TouchableOpacity style={styles.btn} onPress={submit} activeOpacity={0.9}>
          <Text style={styles.btnText}>Finalizar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.menuContentBg },
  content: { padding: 16, paddingBottom: 24 },
  card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.lightGray },
  title: { fontWeight: '900', fontSize: 16, color: COLORS.text },
  sub: { marginTop: 4, color: COLORS.textMuted, fontWeight: '800' },
  block: { marginTop: 16, gap: 10 },
  q: { fontWeight: '900', color: COLORS.text },
  input: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 12,
    textAlignVertical: 'top',
    color: COLORS.text,
  },
  btn: { marginTop: 18, backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  btnText: { color: COLORS.white, fontWeight: '900' },
});

