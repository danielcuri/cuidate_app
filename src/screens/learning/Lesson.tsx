import React, {
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import type { StackScreenProps } from "@react-navigation/stack";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../../theme/colors";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import { learningService } from "../../services/LearningService";
import { loadingService } from "../../services/LoadingService";
import { queryService } from "../../services/QueryService";
import { userService } from "../../services/UserService";
import type { Course, Lesson as LessonT } from "../../interfaces/learning";
import { useLearningStore } from "../../stores/learningStore";
import { RecordsHeader } from "../../components/shared/RecordsHeader";

type Props = StackScreenProps<RootStackParamList, "Lesson">;

export function Lesson({ navigation, route }: Props) {
    const { courseId, name, lessonId } = route.params;
    const dni = userService.user.dni ?? "";
    const userId = userService.user.id ?? 0;

    const course = useLearningStore((s) => s.currentCourse);
    const setCurrentLesson = useLearningStore((s) => s.setCurrentLesson);
    const currentLesson = useLearningStore((s) => s.currentLesson);

    const webRef = useRef<WebView>(null);
    const saveTick = useRef<NodeJS.Timeout | null>(null);
    const endedSentRef = useRef(false);
    const startAtRef = useRef(0);
    const [loading, setLoading] = useState(true);
    const [ready, setReady] = useState(false);
    const [lastTime, setLastTime] = useState(0);

    const lesson: LessonT | undefined = useMemo(() => {
        const c: Course | undefined = course;
        const list = c?.lessons ?? [];
        return list.find((l) => l.id === lessonId) ?? currentLesson;
    }, [course, currentLesson, lessonId]);

    const videoId = lesson?.video_link ?? "";
    const embedUrl = videoId
        ? `https://player.vimeo.com/video/${videoId}?autoplay=0&playsinline=1&transparent=0&title=0&byline=0&portrait=0`
        : "";

    useLayoutEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    useEffect(() => {
        const run = async () => {
            setLoading(true);
            await loadingService.present();
            try {
                if (!lesson && dni) {
                    const res = await learningService.getCourseDetail({
                        dni,
                        course_id: courseId,
                    });
                    queryService.manageErrors(res);
                    const l = res.course?.lessons?.find(
                        (x) => x.id === lessonId,
                    );
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
            const found = all.find(
                (x) =>
                    x.user === userId &&
                    x.lesson === lessonId &&
                    x.video === videoId,
            );
            const t = found?.time ?? 0;
            startAtRef.current = Math.max(0, Math.floor(t));
            setLastTime(t);
            endedSentRef.current = false;
            setReady(false);
        };
        void loadTime();
    }, [lessonId, userId, videoId]);

    useEffect(() => {
        if (!ready || !videoId || !userId) return;
        if (saveTick.current) clearInterval(saveTick.current);
        saveTick.current = setInterval(() => {
            void learningService.setTimeVideo(
                lastTime,
                videoId,
                userId,
                lessonId,
            );
        }, 10_000);
        return () => {
            if (saveTick.current) clearInterval(saveTick.current);
            saveTick.current = null;
        };
    }, [lastTime, lessonId, ready, userId, videoId]);

    const playerHtml = useMemo(() => {
        const startAt = startAtRef.current;
        const src = embedUrl;
        return `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
    <style>
      html, body { margin:0; padding:0; height:100%; background:#000; }
      #wrap { position:relative; width:100%; height:100%; }
      iframe { position:absolute; top:0; left:0; width:100%; height:100%; border:0; }
    </style>
  </head>
  <body>
    <div id="wrap">
      <iframe
        id="vimeo-player"
        src="${src}"
        allow="autoplay; fullscreen; picture-in-picture"
        allowfullscreen
      ></iframe>
    </div>

    <script src="https://player.vimeo.com/api/player.js"></script>
    <script>
      (function() {
        var RN = window.ReactNativeWebView;
        function send(payload) {
          try { RN && RN.postMessage(JSON.stringify(payload)); } catch (e) {}
        }

        var iframe = document.getElementById('vimeo-player');
        if (!iframe || !window.Vimeo || !window.Vimeo.Player) return;

        var player = new window.Vimeo.Player(iframe);
        var endedSent = false;
        var tick = null;

        player.ready().then(function() {
          send({ type: "ready" });
          var startAt = ${startAt};
          if (startAt > 0) {
            player.setCurrentTime(startAt).catch(function(){});
          }
          tick = setInterval(function() {
            player.getCurrentTime().then(function(t) {
              send({ type: "time", value: t });
            }).catch(function(){});
          }, 5000);
        }).catch(function(){});

        player.on('ended', function() {
          if (endedSent) return;
          endedSent = true;
          send({ type: "ended" });
        });

        window.addEventListener('message', function(e) {
          try {
            var data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
            if (data && data.type === "seek" && typeof data.value === "number") {
              player.setCurrentTime(Math.max(0, data.value)).catch(function(){});
            }
          } catch (err) {}
        });

        window.addEventListener('unload', function() {
          try { tick && clearInterval(tick); } catch (e) {}
        });
      })();
    </script>
  </body>
</html>`;
    }, [embedUrl]);

    const onMessage = async (ev: any) => {
        const raw = ev?.nativeEvent?.data;
        if (!raw) return;
        try {
            const msg = JSON.parse(raw);
            if (msg?.type === "ready") {
                setReady(true);
            }
            if (msg?.type === "time" && typeof msg?.value === "number") {
                setLastTime(msg.value);
            }
            if (msg?.type === "ended" && dni && !endedSentRef.current) {
                endedSentRef.current = true;
                const res = await learningService.updateVideoAttempt({
                    dni,
                    lesson_id: lessonId,
                });
                queryService.manageErrors(res);
            }
        } catch {
            // ignore
        }
    };

    const back10 = () => {
        const next = Math.max(0, lastTime - 10);
        setLastTime(next);
        webRef.current?.postMessage(
            JSON.stringify({ type: "seek", value: next }),
        );
    };

    return (
        <View style={styles.page}>
            <SafeAreaView style={styles.safeTop} edges={["top"]}>
                <RecordsHeader
                    title={lesson?.name ?? "Lección"}
                    onBack={() => navigation.goBack()}
                    titleNumberOfLines={2}
                />
            </SafeAreaView>
            <View style={styles.head}>
                <Text style={styles.courseName} numberOfLines={2}>
                    {name}
                </Text>
                {lesson?.video_duration ? (
                    <Text style={styles.meta}>
                        Duración: {lesson.video_duration}
                    </Text>
                ) : null}
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator />
                    <Text style={styles.muted}>Cargando lección…</Text>
                </View>
            ) : !embedUrl ? (
                <View style={styles.center}>
                    <Text style={styles.muted}>
                        No hay video configurado para esta lección.
                    </Text>
                </View>
            ) : (
                <>
                    <View style={styles.player}>
                        <WebView
                            ref={webRef}
                            source={{ html: playerHtml }}
                            javaScriptEnabled
                            onMessage={onMessage}
                            allowsFullscreenVideo
                        />
                    </View>
                    <SafeAreaView style={styles.safeBottom} edges={["bottom"]}>
                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={styles.btn}
                                onPress={back10}
                                activeOpacity={0.9}
                            >
                                <Text style={styles.btnText}>
                                    Retroceder 10 seg
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    page: { flex: 1, backgroundColor: COLORS.menuContentBg },
    safeTop: { backgroundColor: COLORS.white },
    safeBottom: { backgroundColor: COLORS.white },
    head: {
        padding: 16,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightGray,
    },
    courseName: { fontWeight: "900", color: COLORS.text },
    meta: { marginTop: 4, color: COLORS.textMuted },
    player: { flex: 1, backgroundColor: "#000" },
    actions: {
        padding: 12,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.lightGray,
    },
    btn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: "center",
    },
    btnText: { color: COLORS.white, fontWeight: "900" },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: 16,
    },
    muted: { color: COLORS.textMuted, textAlign: "center" },
});
