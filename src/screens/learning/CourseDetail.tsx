import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { StackScreenProps } from '@react-navigation/stack';
import * as WebBrowser from 'expo-web-browser';
import { COLORS } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { learningService } from '../../services/LearningService';
import { loadingService } from '../../services/LoadingService';
import { queryService } from '../../services/QueryService';
import { userService } from '../../services/UserService';
import type { Complex, Course, SpecialFormat } from '../../interfaces/learning';
import { useLearningStore } from '../../stores/learningStore';

type Props = StackScreenProps<RootStackParamList, 'CourseDetail'>;

type SectionRow = { title: string; data: Complex[] };

export function CourseDetail({ navigation, route }: Props) {
  const { courseId, name } = route.params;
  const [course, setCourse] = useState<Course | undefined>(undefined);
  const [sections, setSections] = useState<SpecialFormat[]>([]);
  const [loading, setLoading] = useState(true);

  const setCurrentCourse = useLearningStore((s) => s.setCurrentCourse);
  const setCurrentCourseId = useLearningStore((s) => s.setCurrentCourseId);

  const dni = userService.user.dni ?? '';

  const load = useCallback(async () => {
    if (!dni) return;
    setLoading(true);
    await loadingService.present();
    try {
      const res = await learningService.getCourseDetail({ dni, course_id: courseId });
      queryService.manageErrors(res);
      setCourse(res.course);
      setSections(res.new_format ?? []);
      setCurrentCourse(res.course);
      setCurrentCourseId(courseId);
    } finally {
      await loadingService.dismiss();
      setLoading(false);
    }
  }, [courseId, dni, setCurrentCourse, setCurrentCourseId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const mappedSections: SectionRow[] = useMemo(() => {
    const list = sections ?? [];
    return list
      .map((s) => ({
        title: s.title ?? '',
        data: s.content ?? [],
      }))
      .filter((s) => s.data.length > 0);
  }, [sections]);

  const openMaterial = async (url: string) => {
    if (!url) return;
    await WebBrowser.openBrowserAsync(url);
  };

  const onPressItem = (item: Complex) => {
    if (item.icon === 2) return; // locked
    if (item.register_type === 1) {
      navigation.navigate('Lesson', { courseId, name, lessonId: item.id });
      return;
    }
    if (item.register_type === 2) {
      navigation.navigate('PreExam', { courseId, name, examId: item.id });
      return;
    }
  };

  const canSurvey = (course?.flag_survery ?? 1) !== 1;

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          {name}
        </Text>
        {course?.area_name ? <Text style={styles.sub}>{course.area_name}</Text> : null}
        {course?.date_end ? <Text style={styles.meta}>Fecha límite: {course.date_end}</Text> : null}
        {course?.totalTimeVideo ? <Text style={styles.meta}>Duración video: {course.totalTimeVideo}</Text> : null}
        {course?.totalTimeExam ? <Text style={styles.meta}>Duración examen: {course.totalTimeExam}</Text> : null}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.muted}>Cargando detalle…</Text>
        </View>
      ) : (
        <SectionList
          sections={mappedSections}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderSectionHeader={({ section }) => (section.title ? <Text style={styles.sectionTitle}>{section.title}</Text> : null)}
          renderItem={({ item }) => {
            const locked = item.icon === 2;
            const iconName = locked ? 'lock-closed' : 'checkmark-circle-outline';
            return (
              <TouchableOpacity
                style={[styles.row, locked && styles.rowLocked]}
                onPress={() => onPressItem(item)}
                activeOpacity={locked ? 1 : 0.85}
                disabled={locked}
              >
                <Ionicons name={iconName} size={18} color={locked ? COLORS.textMuted : COLORS.successGreen} />
                <View style={styles.rowBody}>
                  <Text style={[styles.rowTitle, locked && styles.muted]} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={[styles.rowSub, locked && styles.muted]} numberOfLines={1}>
                    {item.duration} · {item.status}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={locked ? COLORS.textMuted : COLORS.text} />
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={
            <View style={styles.footer}>
              {course?.materials?.length ? (
                <View style={styles.block}>
                  <Text style={styles.sectionTitle}>Material de Clase</Text>
                  {course.materials.map((m) => (
                    <TouchableOpacity
                      key={String(m.id)}
                      style={styles.linkRow}
                      onPress={() => openMaterial(m.material_template)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="open-outline" size={18} color={COLORS.primary} />
                      <Text style={styles.linkText} numberOfLines={2}>
                        {m.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}

              <View style={styles.block}>
                <Text style={styles.sectionTitle}>Encuesta de Satisfacción</Text>
                <TouchableOpacity
                  style={[styles.primaryBtn, !canSurvey && styles.btnDisabled]}
                  onPress={() => navigation.navigate('Survey', { courseId, name })}
                  activeOpacity={0.9}
                  disabled={!canSurvey}
                >
                  <Text style={styles.primaryBtnText}>{canSurvey ? 'Responder encuesta' : 'Encuesta bloqueada'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.menuContentBg },
  header: { padding: 16, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  title: { fontSize: 16, fontWeight: '900', color: COLORS.text },
  sub: { marginTop: 4, color: COLORS.textMuted, fontWeight: '800' },
  meta: { marginTop: 4, color: COLORS.textMuted },
  list: { padding: 12, paddingBottom: 20 },
  sectionTitle: { marginTop: 12, marginBottom: 8, fontWeight: '900', color: COLORS.text },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  rowLocked: { opacity: 0.7 },
  rowBody: { flex: 1 },
  rowTitle: { fontWeight: '900', color: COLORS.text },
  rowSub: { marginTop: 3, color: COLORS.textMuted, fontWeight: '700', fontSize: 12 },
  muted: { color: COLORS.textMuted },
  footer: { paddingTop: 10 },
  block: { marginTop: 12 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  linkText: { color: COLORS.primary, fontWeight: '800', flex: 1 },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  btnDisabled: { backgroundColor: COLORS.textMuted },
  primaryBtnText: { color: COLORS.white, fontWeight: '900' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
});

