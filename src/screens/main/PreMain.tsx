import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { StackNavigationProp } from "@react-navigation/stack";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { COLORS } from "../../theme/colors";
import { userService } from "../../services/UserService";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import { MenuHeader } from "@/components/shared/MenuHeader";

type PreMainNav = StackNavigationProp<RootStackParamList, "PreMain">;
const LOGO_LEFT = require("../../../assets/primero_seguro.jpg");
const LOGO_RIGHT = require("../../../assets/pamolsa.jpg");
export function PreMain() {
    const navigation = useNavigation<PreMainNav>();

    const name = userService.user.name ?? "";

    const goForm = () => navigation.navigate("FormMenu");
    const goMedical = () => navigation.navigate("MedicalMenu");
    const goLearning = () => navigation.navigate("LearningMenu");

    const logout = async () => {
        await userService.logout();
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name: "Auth" }],
            }),
        );
    };

    return (
        <View style={styles.page}>
            <SafeAreaView style={styles.safeTop} edges={["top"]}>
                <MenuHeader logoLeft={LOGO_LEFT} logoRight={LOGO_RIGHT} />
            </SafeAreaView>

            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
            >
                <TouchableOpacity
                    style={[styles.cardBtn, styles.btnForm]}
                    onPress={goForm}
                    activeOpacity={0.88}
                >
                    <Text style={styles.cardTitle}>Formularios</Text>
                    <View style={styles.cardRow}>
                        <Ionicons
                            name="document-text-outline"
                            size={40}
                            color={COLORS.white}
                        />
                        <Text style={styles.cardHint}>
                            Acceder a formularios
                        </Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.cardBtn, styles.btnMedical]}
                    onPress={goMedical}
                    activeOpacity={0.88}
                >
                    <Text style={styles.cardTitle}>Medical</Text>
                    <View style={styles.cardRow}>
                        <Ionicons
                            name="medical-outline"
                            size={40}
                            color={COLORS.white}
                        />
                        <Text style={styles.cardHint}>Salud y reposos</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.cardBtn, styles.btnLearning]}
                    onPress={goLearning}
                    activeOpacity={0.88}
                >
                    <Text style={styles.cardTitle}>Learning</Text>
                    <View style={styles.cardRow}>
                        <Ionicons
                            name="school-outline"
                            size={40}
                            color={COLORS.white}
                        />
                        <Text style={styles.cardHint}>
                            Cursos y certificados
                        </Text>
                    </View>
                </TouchableOpacity>
            </ScrollView>

            <SafeAreaView style={styles.fabSafe} edges={["bottom"]}>
                <TouchableOpacity
                    style={styles.fab}
                    onPress={logout}
                    accessibilityLabel="Cerrar sesión"
                >
                    <Ionicons
                        name="log-out-outline"
                        size={26}
                        color={COLORS.white}
                    />
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    page: {
        flex: 1,
        backgroundColor: COLORS.changePasswordBg,
    },
    safeTop: {
        backgroundColor: COLORS.white,
    },
    headerStrip: {
        flexDirection: "row",
        height: 6,
        width: "100%",
    },
    stripSeg: { flex: 1 },
    stripRed: { backgroundColor: COLORS.danger },
    stripYellow: { backgroundColor: COLORS.warningYellow },
    stripGreen: { backgroundColor: COLORS.successGreen },
    welcomeTitle: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        color: COLORS.changePasswordTitle,
        fontSize: 13,
        fontWeight: "900",
        textAlign: "center",
    },
    scroll: {
        padding: 16,
        paddingBottom: 88,
        gap: 16,
    },
    cardBtn: {
        borderRadius: 15,
        paddingVertical: 20,
        paddingHorizontal: 16,
        minHeight: 100,
        justifyContent: "center",
    },
    btnForm: { backgroundColor: COLORS.primary },
    btnMedical: { backgroundColor: COLORS.danger },
    btnLearning: { backgroundColor: COLORS.dark },
    cardTitle: {
        color: COLORS.lightGray,
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 12,
    },
    cardRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    cardHint: {
        color: COLORS.lightGray,
        fontWeight: "700",
        fontSize: 13,
        flex: 1,
    },
    fabSafe: {
        position: "absolute",
        right: 16,
        bottom: 0,
        backgroundColor: "transparent",
    },
    fab: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.textMuted,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
    },
});
