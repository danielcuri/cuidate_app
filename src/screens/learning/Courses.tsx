import React, { useCallback, useLayoutEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    View,
} from "react-native";
import type { StackScreenProps } from "@react-navigation/stack";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS } from "../../theme/colors";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import { learningService } from "../../services/LearningService";
import { loadingService } from "../../services/LoadingService";
import { queryService } from "../../services/QueryService";
import { userService } from "../../services/UserService";
import type { Course } from "../../interfaces/learning";
import { CourseCard } from "../../components/learning/CourseCard";
import { useLearningStore } from "../../stores/learningStore";
import { SafeAreaView } from "react-native-safe-area-context";
import { RecordsHeader } from "../../components/shared/RecordsHeader";

type Props = StackScreenProps<RootStackParamList, "Courses">;

export function Courses({ navigation }: Props) {
    const [loading, setLoading] = useState(true);
    const courses = useLearningStore((s) => s.courses);
    const setCourses = useLearningStore((s) => s.setCourses);

    const dni = userService.user.dni ?? "";

    const load = useCallback(async () => {
        if (!dni) return;
        setLoading(true);
        await loadingService.present();
        try {
            const res = await learningService.getCourses({ dni });
            queryService.manageErrors(res);
            setCourses(res.courses ?? []);
        } finally {
            await loadingService.dismiss();
            setLoading(false);
        }
    }, [dni, setCourses]);

    useFocusEffect(
        useCallback(() => {
            void load();
        }, [load]),
    );

    const data = useMemo(() => courses ?? [], [courses]);

    useLayoutEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    return (
        <View style={styles.page}>
            <SafeAreaView style={styles.safeTop} edges={["top"]}>
                <RecordsHeader
                    title="Capacitaciones"
                    onBack={() => navigation.goBack()}
                />
            </SafeAreaView>
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator />
                    <Text style={styles.muted}>Cargando cursos…</Text>
                </View>
            ) : (
                <FlatList<Course>
                    data={data}
                    keyExtractor={(item) => String(item.course_id)}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <CourseCard
                            image={item.list_picture}
                            name={item.name}
                            area={item.area_name}
                            dateEnd={item.date_end}
                            status={(item.status ?? 0) as 0 | 1 | 2 | 3}
                            onPress={() =>
                                navigation.navigate("CourseDetail", {
                                    courseId: item.course_id,
                                    name: item.name,
                                })
                            }
                        />
                    )}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.t}>Sin cursos</Text>
                            <Text style={styles.muted}>
                                No hay capacitaciones matriculadas para tu
                                usuario.
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    page: { flex: 1, backgroundColor: COLORS.menuContentBg },
    safeTop: {
        backgroundColor: COLORS.white,
    },
    list: { padding: 12, paddingBottom: 20, gap: 10 },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: 16,
    },
    t: { fontSize: 16, fontWeight: "900", color: COLORS.text },
    muted: { color: COLORS.textMuted, textAlign: "center" },
});
