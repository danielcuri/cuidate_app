import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { learningService } from '../../services/LearningService';
import { loadingService } from '../../services/LoadingService';
import { queryService } from '../../services/QueryService';
import { userService } from '../../services/UserService';
import type { Course, Lesson as LessonT } from '../../interfaces/learning';
import { useLearningStore } from '../../stores/learningStore';
import { RecordsHeader } from '../../components/shared/RecordsHeader';

type Props = StackScreenProps<RootStackParamList, 'Lesson'>;

export function Lesson({ navigation, route }: Props) {
  const { courseId, name, lessonId } = route.params;
  const dni = userService.user.dni ?? '';
  const userId = userService.user.id ?? 0;

  const course = useLearningStore((s) => s.currentCourse);
  const setCurrentLesson = useLearningStore((s) => s.setCurrentLesson);
  const currentLesson = useLearningStore((s) => s.currentLesson);

  const webRef = useRef<WebView>(null);
  const saveTick = useRef<NodeJS.Timeout | null>(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [lastTime, setLastTime] = useState(0);

  const lesson: LessonT | undefined = useMemo(() => {
    const c: Course | undefined = course;
    const list = c?.lessons ?? [];
    return list.find((l) => l.id === lessonId) ?? currentLesson;
  }, [course, currentLesson, lessonId]);

  const videoId = lesson?.video_link ?? '';
  const embedUrl = videoId ? `https://player.vimeo.com/video/${videoId}?autoplay=0&playsinline=1` : '';

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      await loadingService.present();
      try {
        if (!lesson && dni) {
          const res = await learningService.getCourseDetail({ dni, course_id: courseId });
          queryService.manageErrors(res);
          const l = res.course?.lessons?.find((x) => x.id === lessonId);
          setCurrentLesson(l);
        } else {
          setCurrentLesson(lesson);
        }
      } finally {
        await loadingService.dismiss();
        setLoading(false);
      }
    };
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, dni, lessonId, setCurrentLesson]);

  useEffect(() => {
    const loadTime = async () => {
      if (!videoId || !userId) return;
      const all = await learningService.getTimeVideo();
      const found = all.find((x) => x.user === userId && x.lesson === lessonId && x.video === videoId);
      setLastTime(found?.time ?? 0);
    };
    void loadTime();
  }, [lessonId, userId, videoId]);

  useEffect(() => {
    if (!ready || !videoId || !userId) return;
    if (saveTick.current) clearInterval(saveTick.current);
    saveTick.current = setInterval(() => {
      void learningService.setTimeVideo(lastTime, videoId, userId, lessonId);
    }, 10_000);
    return () => {
      if (saveTick.current) clearInterval(saveTick.current);
      saveTick.current = null;
    };
  }, [lastTime, lessonId, ready, userId, videoId]);

  const injected = useMemo(() => {
    const startAt = Math.max(0, Math.floor(lastTime));
    return `
      (function() {
        try {
          const startAt = ${startAt};
          const iframe = document.querySelector('iframe');
          if (!iframe) return;
          const origin = '*';
          function post(msg){ iframe.contentWindow && iframe.contentWindow.postMessage(JSON.stringify(msg), origin); }
          post({ method: 'setCurrentTime', value: startAt });
          // Ping current time periodically so RN can persist.
          setInterval(function(){ post({ method: 'getCurrentTime' }); }, 5000);
        } catch (e) {}
      })();
      true;
    `;
  }, [lastTime]);

  const onMessage = async (ev: any) => {
    const raw = ev?.nativeEvent?.data;
    if (!raw) return;
    try {
      const msg = JSON.parse(raw);
      if (typeof msg?.value === 'number' && msg?.method === 'getCurrentTime') {
        setLastTime(msg.value);
      }
      if (msg?.event === 'ended' && dni) {
        const res = await learningService.updateVideoAttempt({ dni, lesson_id: lessonId });
        queryService.manageErrors(res);
      }
    } catch {
      // ignore
    }
  };

  const back10 = () => {
    const next = Math.max(0, lastTime - 10);
    setLastTime(next);
    webRef.current?.postMessage(JSON.stringify({ method: 'setCurrentTime', value: next }));
  };

  return (
    <View style={styles.page}>
      <SafeAreaView style={styles.safeTop} edges={['top']}>
        <RecordsHeader
          title={lesson?.name ?? 'Lección'}
          onBack={() => navigation.goBack()}
          titleNumberOfLines={2}
        />
      </SafeAreaView>
      <View style={styles.head}>
        <Text style={styles.courseName} numberOfLines={2}>
          {name}
        </Text>
        {lesson?.video_duration ? <Text style={styles.meta}>Duración: {lesson.video_duration}</Text> : null}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.muted}>Cargando lección…</Text>
        </View>
      ) : !embedUrl ? (
        <View style={styles.center}>
          <Text style={styles.muted}>No hay video configurado para esta lección.</Text>
        </View>
      ) : (
        <>
          <View style={styles.player}>
            <WebView
              ref={webRef}
              source={{ uri: embedUrl }}
              javaScriptEnabled
              injectedJavaScript={injected}
              onMessage={onMessage}
              onLoadEnd={() => setReady(true)}
              allowsFullscreenVideo
            />
          </View>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.btn} onPress={back10} activeOpacity={0.9}>
              <Text style={styles.btnText}>Retroceder 10 seg</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.menuContentBg },
  safeTop: { backgroundColor: COLORS.white },
  head: { padding: 16, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  courseName: { fontWeight: '900', color: COLORS.text },
  meta: { marginTop: 4, color: COLORS.textMuted },
  player: { flex: 1, backgroundColor: '#000' },
  actions: { padding: 12, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.lightGray },
  btn: { backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  btnText: { color: COLORS.white, fontWeight: '900' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16 },
  muted: { color: COLORS.textMuted, textAlign: 'center' },
});

