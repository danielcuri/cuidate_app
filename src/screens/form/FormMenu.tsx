import React, { useCallback, useEffect, useState } from "react";
import {
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NavigationProp } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../../theme/colors";
import { Card } from "../../components/shared/Card";
import { MenuFooter } from "../../components/shared/MenuFooter";
import { MenuHeader } from "../../components/shared/MenuHeader";
import { formService } from "../../services/FormService";
import { loadingService } from "../../services/LoadingService";
import { queryService } from "../../services/QueryService";
import { userService } from "../../services/UserService";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import type { FormsList } from "../../interfaces/forms";
import { useFormStore } from "../../stores/formStore";

type Nav = NavigationProp<RootStackParamList>;
const LOGO_LEFT = require("../../../assets/primero_seguro.jpg");
const LOGO_RIGHT = require("../../../assets/pamolsa.jpg");
const PORTRAIT = require("../../../assets/forms/portrait_forms.png");
type Entry = {
    key: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    route: keyof RootStackParamList;
};

/** Siempre: formatos, registros, pendientes. */
const MENU_BASE: Entry[] = [
    {
        key: "formats",
        label: "Formatos",
        icon: "document-text-outline",
        route: "Formats",
    },
    {
        key: "records",
        label: "Registros",
        icon: "folder-outline",
        route: "Records",
    },
    {
        key: "pending",
        label: "Pendientes",
        icon: "time-outline",
        route: "ListPending",
    },
];

/** Solo si `showPamolsa`: inspecciones, seguimiento, eficacia. */
const MENU_PAMOLSA: Entry[] = [
    {
        key: "pamolsa",
        label: "Inspecciones SST",
        icon: "shield-checkmark-outline",
        route: "ListPamolsa",
    },
    {
        key: "actions",
        label: "Seguimiento de acciones propuestas",
        icon: "list-outline",
        route: "Actions",
    },
    {
        key: "effectiveness",
        label: "Eficacia de acciones ejecutadas",
        icon: "stats-chart-outline",
        route: "Effectiveness",
    },
];

export function FormMenu() {
    const navigation = useNavigation<Nav>();
    const [refreshing, setRefreshing] = useState(false);
    const showPamolsa = useFormStore((s) => s.showPamolsa);

    const loadData = useCallback(async (event?: { end?: () => void }) => {
        await loadingService.present();
        try {
            const data = await formService.getGeneralInfo();
            const payload = data as {
                error?: boolean;
                msg?: string;
            } & typeof data;
            if (payload.error) {
                queryService.manageErrors(payload);
                return;
            }

            formService.locals = data.locals ?? [];
            formService.forms = data.forms;
            formService.behaviors_types = data.behaviors_types;
            formService.inspections = data.inspections;
            formService.fieldsToValidate = data.fieldsToValidate;
            formService.pamolsaAreas = data.pamolsaAreas;
            formService.forms_titles = data.forms_titles;
            formService.showPamolsa = data.showPamolsa;
            formService.users = data.users;
            formService.forms_records = data.forms_records ?? [];
            formService.actions = data.actions ?? [];
            formService.actions_executed = data.actions_executed ?? [];
            formService.actions_header = data.actions_header ?? [];

            useFormStore.getState().hydrateFromGeneralInfo(data as FormsList);

            const u = data.user;
            if (u) {
                if (u.roles) {
                    (userService.user as { roles?: string[] }).roles = u.roles;
                }
                if (u.name) {
                    userService.user.name = u.name;
                }
                if (u.signature_url) {
                    (
                        userService.user as { signature_url?: string }
                    ).signature_url = u.signature_url;
                }
            }
            await userService.saveData();
        } catch (e) {
            console.log(e);
        } finally {
            await loadingService.dismiss();
            event?.end?.();
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = () => {
        setRefreshing(true);
        loadData({ end: () => setRefreshing(false) });
    };

    const go = (route: Entry["route"]) => {
        switch (route) {
            case "Formats":
                navigation.navigate("Formats");
                break;
            case "Records":
                navigation.navigate("Records");
                break;
            case "ListPending":
                navigation.navigate("ListPending");
                break;
            case "ListPamolsa":
                navigation.navigate("ListPamolsa");
                break;
            case "Actions":
                navigation.navigate("Actions");
                break;
            case "Effectiveness":
                navigation.navigate("Effectiveness");
                break;
            default:
                break;
        }
    };

    const entries = [...MENU_BASE, ...(showPamolsa ? MENU_PAMOLSA : [])];

    return (
        <View style={styles.page}>
            <SafeAreaView style={styles.safeTop} edges={["top"]}>
                <MenuHeader logoLeft={LOGO_LEFT} logoRight={LOGO_RIGHT} />
            </SafeAreaView>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }
            >
                <Image
                    source={PORTRAIT}
                    style={styles.portrait}
                    resizeMode="contain"
                />
                <View style={styles.grid}>
                    {entries.map((item) => (
                        <TouchableOpacity
                            key={item.key}
                            style={styles.cell}
                            onPress={() => go(item.route)}
                            activeOpacity={0.88}
                        >
                            <Card style={styles.card}>
                                <Ionicons
                                    name={item.icon}
                                    size={36}
                                    color={COLORS.white}
                                />
                                <Text style={styles.cardLabel}>
                                    {item.label}
                                </Text>
                            </Card>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
            <MenuFooter onBack={() => navigation.goBack()} />
        </View>
    );
}

const styles = StyleSheet.create({
    page: {
        flex: 1,
        backgroundColor: COLORS.menuContentBg,
    },
    safeTop: {
        backgroundColor: COLORS.white,
    },
    scroll: { flex: 1 },
    scrollContent: {
        paddingBottom: 24,
    },
    portrait: {
        width: "97%",
        alignSelf: "center",
        height: 120,
        marginVertical: "2%",
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        paddingHorizontal: 8,
        justifyContent: "center",
    },
    cell: {
        width: "46%",
        padding: 8,
    },
    card: {
        backgroundColor: COLORS.menuCardDark,
        paddingVertical: 16,
        paddingHorizontal: 8,
        borderRadius: 8,
        alignItems: "center",
        minHeight: 110,
        justifyContent: "center",
    },
    cardLabel: {
        marginTop: 10,
        fontSize: 11,
        fontWeight: "700",
        color: COLORS.white,
        textAlign: "center",
    },
});
