import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { StackScreenProps } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { learningService } from '../../services/LearningService';
import { loadingService } from '../../services/LoadingService';
import { queryService } from '../../services/QueryService';
import { userService } from '../../services/UserService';
import { RadioGroup } from '../../components/learning/RadioGroup';
import { RecordsHeader } from '../../components/shared/RecordsHeader';

type Props = StackScreenProps<RootStackParamList, 'Survey'>;

type SurveyValue = 1 | 2 | 3 | 4 | 5;

/** Paridad con `CourseController::registerSurvey` — índices 0..5. */
const SURVEY_QUESTIONS = [
  'Considera que lo aprendido en esta capacitación podrá aplicarlo en su trabajo',
  'Considera importante el contenido de la capacitación para su trabajo actual',
  'El expositor comunicó de forma clara y fácil de entender los contenidos del curso',
  'El material que presentado fue el adecuado (diapositivas, lecturas, casos prácticos, guías, entre otros).',
  'La coyuntura nos ha obligado a migrar a la virtualidad y nos gustaría conocer un poco: ¿Cómo es tu experiencia con las capacitaciones virtuales? ¿Te sientes cómodo? ¿Crees que se logra el objetivo? Compártenos tus comentarios *',
  '¿Cómo calificarías el evento?',
] as const;

/** Índice de la pregunta abierta (resto: escala 1–5). */
const TEXT_QUESTION_INDEX = 4;

type RatingIndex = 0 | 1 | 2 | 3 | 5;

const HEADER_CLEARANCE = 108;

export function Survey({ navigation, route }: Props) {
  const { courseId, name } = route.params;
  const dni = userService.user.dni ?? '';
  const scrollRef = useRef<ScrollView>(null);
  const commentBlockRef = useRef<View>(null);
  const scrollOffsetRef = useRef(0);
  const commentFocusedRef = useRef(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const scrollToCommentField = useCallback((kbHeight: number) => {
    if (kbHeight <= 0) return;

    const run = () => {
      const block = commentBlockRef.current;
      const scroll = scrollRef.current;
      if (!block || !scroll) return;

      block.measureInWindow((_x, y, _w, height) => {
        const windowH = Dimensions.get('window').height;
        const visibleBottom = windowH - kbHeight - 20;
        const overflow = y + height - visibleBottom;

        if (overflow > 0) {
          scroll.scrollTo({
            y: scrollOffsetRef.current + overflow + 32,
            animated: true,
          });
        } else if (y < HEADER_CLEARANCE) {
          scroll.scrollTo({
            y: Math.max(0, scrollOffsetRef.current - (HEADER_CLEARANCE - y)),
            animated: true,
          });
        }
      });
    };

    requestAnimationFrame(() => {
      setTimeout(run, Platform.OS === 'android' ? 120 : 40);
    });
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      const h = e.endCoordinates.height;
      setKeyboardHeight(h);
      if (commentFocusedRef.current) {
        scrollToCommentField(h);
      }
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [scrollToCommentField]);

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

  const [ratings, setRatings] = useState<Partial<Record<RatingIndex, SurveyValue>>>(
    {}
  );
  const [virtualComment, setVirtualComment] = useState('');

  const setRating = (index: RatingIndex, value: SurveyValue) => {
    Keyboard.dismiss();
    setRatings((prev) => ({ ...prev, [index]: value }));
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const onCommentFocus = () => {
    commentFocusedRef.current = true;
    scrollToCommentField(keyboardHeight || 280);
  };

  const onCommentBlur = () => {
    commentFocusedRef.current = false;
  };

  const buildAnswers = (): (number | string)[] | null => {
    const comment = virtualComment.trim();
    if (
      ratings[0] == null ||
      ratings[1] == null ||
      ratings[2] == null ||
      ratings[3] == null ||
      ratings[5] == null
    ) {
      return null;
    }
    return [
      ratings[0],
      ratings[1],
      ratings[2],
      ratings[3],
      comment,
      ratings[5],
    ];
  };

  const submit = async () => {
    Keyboard.dismiss();
    if (!dni) return;
    const answers = buildAnswers();
    if (!answers) {
      Alert.alert(
        'Simplex',
        'Completa todas las preguntas de calificación (1–5).'
      );
      return;
    }
    await loadingService.present();
    try {
      const res = await learningService.registerSurvey({
        dni,
        course_id: courseId,
        answers,
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

  const keyboardOpen = keyboardHeight > 0;
  const scrollContent = (
    <ScrollView
      ref={scrollRef}
      style={styles.flex}
      contentContainerStyle={[
        styles.content,
        keyboardOpen && { paddingBottom: keyboardHeight + 48 },
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      onScrollBeginDrag={Keyboard.dismiss}
      onScroll={(e) => {
        scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
      }}
      scrollEventThrottle={16}
    >
      <View style={styles.card}>
        <Text style={styles.sub} numberOfLines={2}>
          {name}
        </Text>

        {SURVEY_QUESTIONS.map((text, index) => {
          const isComment = index === TEXT_QUESTION_INDEX;
          return (
            <View
              key={index}
              ref={isComment ? commentBlockRef : undefined}
              collapsable={!isComment}
              style={styles.block}
            >
              <Text style={styles.q}>
                {index + 1}) {text}
                {isComment ? (
                  <Text style={styles.optional}> (opcional)</Text>
                ) : null}
              </Text>
              {isComment ? (
                <>
                  <TextInput
                    value={virtualComment}
                    onChangeText={setVirtualComment}
                    placeholder="Escribe aquí (opcional)…"
                    style={styles.input}
                    multiline
                    returnKeyType="done"
                    submitBehavior="blurAndSubmit"
                    onSubmitEditing={dismissKeyboard}
                    onFocus={onCommentFocus}
                    onBlur={onCommentBlur}
                  />
                  {keyboardOpen ? (
                    <TouchableOpacity
                      style={styles.dismissKbBtn}
                      onPress={dismissKeyboard}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name="chevron-down-circle-outline"
                        size={20}
                        color={COLORS.primary}
                      />
                      <Text style={styles.dismissKbText}>Ocultar teclado</Text>
                    </TouchableOpacity>
                  ) : null}
                </>
              ) : (
                <RadioGroup
                  value={ratings[index as RatingIndex]}
                  options={options}
                  onChange={(v) => setRating(index as RatingIndex, v as SurveyValue)}
                />
              )}
            </View>
          );
        })}

        <TouchableOpacity style={styles.btn} onPress={submit} activeOpacity={0.9}>
          <Text style={styles.btnText}>Finalizar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.page}>
      <SafeAreaView style={styles.safeTop} edges={['top']}>
        <RecordsHeader title="Encuesta" onBack={() => navigation.goBack()} />
      </SafeAreaView>
      {Platform.OS === 'ios' ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior="padding"
          keyboardVerticalOffset={8}
        >
          {scrollContent}
        </KeyboardAvoidingView>
      ) : (
        scrollContent
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.menuContentBg },
  flex: { flex: 1 },
  safeTop: { backgroundColor: COLORS.white },
  content: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  sub: { marginTop: 4, color: COLORS.textMuted, fontWeight: '800' },
  block: { marginTop: 16, gap: 10 },
  q: { fontWeight: '900', color: COLORS.text },
  optional: { fontWeight: '700', color: COLORS.textMuted },
  input: {
    minHeight: 96,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 12,
    textAlignVertical: 'top',
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  dismissKbBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  dismissKbText: { color: COLORS.primary, fontWeight: '800' },
  btn: {
    marginTop: 18,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: { color: COLORS.white, fontWeight: '900' },
});
