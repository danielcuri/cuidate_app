import React, { useLayoutEffect } from "react";
import {
    Image,
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
import type { RootStackParamList } from "../../navigation/AppNavigator";
import { RecordsHeader } from "../../components/shared/RecordsHeader";
import { userService } from "../../services/UserService";

type Nav = NavigationProp<RootStackParamList>;
const PORTRAIT = require("../../../assets/learning/portrait_learning.png");
export function LearningMenu() {
    const navigation = useNavigation<Nav>();

    useLayoutEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    return (
        <View style={styles.page}>
            <SafeAreaView style={styles.safeTop} edges={["top"]}>
                <RecordsHeader
                    title={"Bienvenido " + (userService.user.name ?? "Usuario")}
                    onBack={() => navigation.navigate("PreMain")}
                />
            </SafeAreaView>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
            >
                <Image
                    source={PORTRAIT}
                    style={styles.portrait}
                    resizeMode="contain"
                />
                <View style={styles.grid}>
                    <TouchableOpacity
                        style={styles.cell}
                        onPress={() => navigation.navigate("Courses")}
                        activeOpacity={0.88}
                    >
                        <Card style={styles.card}>
                            <Ionicons
                                name="library-outline"
                                size={36}
                                color={COLORS.white}
                            />
                            <Text style={styles.cardLabel}>Capacitaciones</Text>
                        </Card>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.cell}
                        onPress={() => navigation.navigate("Achievement")}
                        activeOpacity={0.88}
                    >
                        <Card style={styles.card}>
                            <Ionicons
                                name="ribbon-outline"
                                size={36}
                                color={COLORS.white}
                            />
                            <Text style={styles.cardLabel}>Logros</Text>
                        </Card>
                    </TouchableOpacity>
                </View>
                <View style={styles.footerImgWrap}>
                    <Image
                        source={require("../../../assets/forms/portrait_forms.png")}
                        style={styles.footerImg}
                        resizeMode="contain"
                    />
                </View>
            </ScrollView>
            <MenuFooter onBack={() => navigation.navigate("PreMain")} />
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
    scrollContent: { paddingBottom: 24 },
    portrait: {
        width: "80%",
        alignSelf: "center",
        height: 120,
        marginVertical: "10%",
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        paddingHorizontal: 8,
        justifyContent: "center",
    },
    cell: {
        width: "42%",
        padding: 8,
    },
    card: {
        backgroundColor: COLORS.menuCardDark,
        paddingVertical: 22,
        paddingHorizontal: 8,
        borderRadius: 8,
        alignItems: "center",
        minHeight: 110,
        justifyContent: "center",
    },
    cardLabel: {
        marginTop: 10,
        fontSize: 14,
        fontWeight: "700",
        color: COLORS.white,
        textAlign: "center",
    },
    footerImgWrap: {
        alignItems: "center",
        marginTop: 20,
        paddingBottom: 16,
    },
    footerImg: {
        width: 120,
        height: 48,
        opacity: 0.85,
    },
});
