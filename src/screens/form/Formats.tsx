import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { StackNavigationProp } from "@react-navigation/stack";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import { formService } from "../../services/FormService";
import { userService } from "../../services/UserService";
import { queryService } from "../../services/QueryService";
import { alertService } from "../../services/AlertService";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import type { Forms } from "../../interfaces/forms";
import { useFormStore } from "../../stores/formStore";
import { RecordsHeader } from "../../components/shared/RecordsHeader";

type Nav = StackNavigationProp<RootStackParamList, "Formats">;

export function Formats() {
    const navigation = useNavigation<Nav>();
    const showPamolsa = useFormStore((s) => s.showPamolsa);
    const [refreshing, setRefreshing] = useState(false);
    const lastRefreshRef = useRef(0);

    useLayoutEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    const forms = (formService.forms as Forms[]) ?? [];
    const pamolsaItem = useMemo(
        () =>
            ({
                id: -1,
                name: "Hallazgo de seguridad y salud en el trabajo",
                isStatic: true,
            }) as Forms & { isStatic: true },
        [],
    );
    const formatsList = useMemo(
        () => [...forms, ...(showPamolsa ? [pamolsaItem] : [])],
        [forms, showPamolsa, pamolsaItem],
    );

    const refreshList = useCallback(async () => {
        const uid = userService.user.id;
        if (uid == null) {
            return;
        }
        try {
            const res = (await formService.getFormatsList({
                user_id: Number(uid),
            })) as {
                error?: boolean;
                forms?: Forms[];
            };
            if (res?.error) {
                queryService.manageErrors(res);
                return;
            }
            if (Array.isArray(res?.forms)) {
                formService.forms = res.forms;
                useFormStore.getState().syncFromService();
            }
        } catch (e) {
            console.log(e);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            void refreshList();
        }, [refreshList]),
    );

    const onRefresh = async () => {
        const now = Date.now();
        if (now - lastRefreshRef.current < 2000) {
            return;
        }
        lastRefreshRef.current = now;
        setRefreshing(true);
        await refreshList();
        setRefreshing(false);
    };

    const open = (item: Forms & { isStatic?: boolean }) => {
        if (item.isStatic) {
            navigation.navigate("PamolsaActionForm");
            return;
        }
        navigation.navigate("CanvasForm", { formId: item.id });
    };

    return (
        <View style={styles.page}>
            <SafeAreaView style={styles.safeTop} edges={["top"]}>
                <RecordsHeader
                    title="Formatos"
                    onBack={() => navigation.navigate("FormMenu")}
                />
            </SafeAreaView>
            <FlatList
                data={formatsList}
                keyExtractor={(f) => String(f.id)}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }
                ListEmptyComponent={
                    <Text style={styles.empty}>
                        No hay formatos. Tire hacia abajo para actualizar.
                    </Text>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[
                            styles.row,
                            (item as any)?.isStatic ? styles.rowStatic : null,
                        ]}
                        onPress={() =>
                            open(item as Forms & { isStatic?: boolean })
                        }
                        activeOpacity={0.88}
                    >
                        <View style={{ flex: 1 }}>
                            <Text style={styles.rowTitle} numberOfLines={2}>
                                {String(item.name ?? item.id)}
                            </Text>
                            {(item as any)?.isStatic ? (
                                <Text style={styles.rowMeta}>
                                    Pamolsa · Hallazgo SST
                                </Text>
                            ) : null}
                        </View>
                        <Ionicons
                            name="chevron-forward"
                            size={20}
                            color={COLORS.textMuted}
                        />
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    page: { flex: 1, backgroundColor: COLORS.menuContentBg },
    safeTop: {
        backgroundColor: COLORS.white,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 12,
        marginVertical: 4,
        padding: 16,
        backgroundColor: COLORS.white,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.lightGray,
    },
    rowStatic: {
        borderColor: COLORS.secondary,
        backgroundColor: COLORS.white,
    },
    rowTitle: { flex: 1, fontSize: 15, fontWeight: "700", color: COLORS.text },
    rowMeta: { marginTop: 4, fontSize: 12, color: COLORS.textMuted },
    empty: {
        textAlign: "center",
        marginTop: 48,
        color: COLORS.textMuted,
        paddingHorizontal: 24,
    },
});
