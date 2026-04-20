import React, { useCallback, useLayoutEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import type { StackScreenProps } from "@react-navigation/stack";
import { useFocusEffect } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import { learningService } from "../../services/LearningService";
import { loadingService } from "../../services/LoadingService";
import { queryService } from "../../services/QueryService";
import { userService } from "../../services/UserService";
import type { Certificate } from "../../interfaces/learning";
import { SafeAreaView } from "react-native-safe-area-context";
import { RecordsHeader } from "../../components/shared/RecordsHeader";

type Props = StackScreenProps<RootStackParamList, "Achievement">;
export function Achievement(_props: Props) {
    const [loading, setLoading] = useState(true);
    const [certs, setCerts] = useState<Certificate[]>([]);
    const dni = userService.user.dni ?? "";

    const navigation = _props.navigation;
    useLayoutEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    const load = useCallback(async () => {
        if (!dni) return;
        setLoading(true);
        await loadingService.present();
        try {
            const res = await learningService.getAchievements({ dni });
            queryService.manageErrors(res);
            setCerts(res.certificates ?? []);
        } finally {
            await loadingService.dismiss();
            setLoading(false);
        }
    }, [dni]);

    useFocusEffect(
        useCallback(() => {
            void load();
        }, [load]),
    );

    const data = useMemo(() => certs ?? [], [certs]);

    return (
        <View style={styles.page}>
            <SafeAreaView style={styles.safeTop} edges={["top"]}>
                <RecordsHeader
                    title="Logros"
                    onBack={() => navigation.goBack()}
                />
            </SafeAreaView>
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator />
                    <Text style={styles.muted}>Cargando certificados…</Text>
                </View>
            ) : (
                <FlatList<Certificate>
                    data={data}
                    keyExtractor={(i) => `${i.course_id}-${i.certificate}`}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.row}>
                                <Ionicons
                                    name="ribbon-outline"
                                    size={22}
                                    color={COLORS.primary}
                                />
                                <View style={styles.body}>
                                    <Text
                                        style={styles.title}
                                        numberOfLines={2}
                                    >
                                        {item.name}
                                    </Text>
                                    <Text style={styles.sub} numberOfLines={1}>
                                        Finalizado: {item.date_finish}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.btn}
                                onPress={() =>
                                    WebBrowser.openBrowserAsync(
                                        item.certificate,
                                    )
                                }
                                activeOpacity={0.9}
                            >
                                <Text style={styles.btnText}>Descargar</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.t}>Sin certificados</Text>
                            <Text style={styles.muted}>
                                Aún no tienes cursos aprobados con certificado.
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
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.lightGray,
    },
    row: { flexDirection: "row", alignItems: "center", gap: 12 },
    body: { flex: 1 },
    title: { fontWeight: "900", color: COLORS.text },
    sub: { marginTop: 4, color: COLORS.textMuted, fontWeight: "800" },
    btn: {
        marginTop: 12,
        backgroundColor: COLORS.primary,
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: "center",
    },
    btnText: { color: COLORS.white, fontWeight: "900" },
});
