import React, { useCallback, useLayoutEffect, useState } from "react";
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { StackNavigationProp } from "@react-navigation/stack";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser";
import { COLORS } from "@/theme/colors";
import { Card } from "@/components/shared/Card";
import { MenuFooter } from "@/components/shared/MenuFooter";
import {
    CareSvgIcon,
    CovidSvgIcon,
    RecordsCareSvgIcon,
} from "@/components/medical/MedicalSvgIcons";
import { loadingService } from "@/services/LoadingService";
import { medicalService } from "@/services/MedicalService";
import { userService } from "@/services/UserService";
import { useMedicalStore } from "@/store/medicalStore";
import type { RootStackParamList } from "@/navigation/AppNavigator";
import { RecordsHeader } from "@/components/shared/RecordsHeader";

const WEB_SYMPTOMS_URL = "https://simplexgo.com/covid/pamolsa/public/";
const PORTRAIT = require("../../../assets/medical/portrait_medical.png");

type Nav = StackNavigationProp<RootStackParamList, "MedicalMenu">;

export function MedicalMenu() {
    const navigation = useNavigation<Nav>();
    const [restDay, setRestDay] = useState<number | null>(null);
    const setStoreRestDay = useMedicalStore((s) => s.setRestDay);

    useLayoutEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    const openWeb = useCallback(async () => {
        await WebBrowser.openBrowserAsync(WEB_SYMPTOMS_URL);
    }, []);

    const loadPatient = useCallback(async () => {
        await loadingService.present();
        try {
            const data = await medicalService.getInfoUser({
                dni: userService.user.dni ?? "",
            });
            setRestDay(data.rest_day);
            setStoreRestDay(data.rest_day);
        } catch (e) {
            console.log(e);
            Alert.alert(
                "Aviso",
                "No se pudo cargar la información del paciente.",
            );
        } finally {
            await loadingService.dismiss();
        }
    }, [setStoreRestDay]);

    useFocusEffect(
        useCallback(() => {
            loadPatient();
        }, [loadPatient]),
    );

    const goFormRest = () => {
        if (restDay != null && restDay >= 21) {
            Alert.alert(
                "Límite alcanzado",
                "Acercarse a Tópico, se superó los 21 días anuales",
            );
            return;
        }
        navigation.navigate("FormRest");
    };

    const goListRest = () => {
        navigation.navigate("ListRest");
    };

    return (
        <View style={styles.page}>
            <SafeAreaView style={styles.safeTop} edges={["top"]}>
                <RecordsHeader
                    title={"Bienvenido " + (userService.user.name ?? "Usuario")}
                    onBack={() => navigation.goBack()}
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
                        onPress={goFormRest}
                        activeOpacity={0.88}
                    >
                        <Card style={styles.card}>
                            <CareSvgIcon size={36} />
                            <Text style={styles.cardLabel}>
                                Descanso médico
                            </Text>
                        </Card>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.cell}
                        onPress={openWeb}
                        activeOpacity={0.88}
                    >
                        <Card style={styles.card}>
                            <CovidSvgIcon size={36} />
                            <Text style={styles.cardLabel}>Sintomatología</Text>
                        </Card>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.cell, styles.cellWide]}
                        onPress={goListRest}
                        activeOpacity={0.88}
                    >
                        <Card style={styles.card}>
                            <RecordsCareSvgIcon size={36} />
                            <Text style={styles.cardLabel}>Registros</Text>
                        </Card>
                    </TouchableOpacity>
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
    scrollContent: { paddingBottom: 24 },
    portrait: {
        width: "80%",
        alignSelf: "center",
        height: 160,
        marginVertical: "8%",
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
    cellWide: {
        width: "92%",
        alignSelf: "center",
    },
    card: {
        backgroundColor: COLORS.menuCardDark,
        paddingVertical: 20,
        paddingHorizontal: 8,
        borderRadius: 8,
        alignItems: "center",
        minHeight: 110,
        justifyContent: "center",
    },
    cardLabel: {
        marginTop: 8,
        fontSize: 13,
        fontWeight: "700",
        color: COLORS.white,
        textAlign: "center",
    },
});
