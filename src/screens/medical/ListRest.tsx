import React, { useCallback, useLayoutEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { StackNavigationProp } from "@react-navigation/stack";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { COLORS } from "@/theme/colors";
import type { RootStackParamList } from "@/navigation/AppNavigator";
import type { MedicalRest } from "@/interfaces/medical";
import { medicalService } from "@/services/MedicalService";
import { userService } from "@/services/UserService";
import { loadingService } from "@/services/LoadingService";
import { MenuFooter } from "@/components/shared/MenuFooter";
import { MedicalRestCard } from "@/components/medical/MedicalRestCard";
import { RecordsHeader } from "@/components/shared/RecordsHeader";

type Nav = StackNavigationProp<RootStackParamList, "ListRest">;

export function ListRest() {
    const navigation = useNavigation<Nav>();
    const [records, setRecords] = useState<MedicalRest[]>([]);
    const [loading, setLoading] = useState(true);

    useLayoutEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    const load = useCallback(async () => {
        setLoading(true);
        await loadingService.present();
        try {
            const res = await medicalService.getRestMedical({
                dni: userService.user.dni ?? "",
            });
            setRecords(res.recordsRest ?? []);
        } catch (e) {
            console.log(e);
            setRecords([]);
        } finally {
            setLoading(false);
            await loadingService.dismiss();
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load]),
    );

    return (
        <View style={styles.page}>
            <SafeAreaView style={styles.safeTop} edges={["top"]}>
                <RecordsHeader
                    title="Solicitudes de descanso médico"
                    onBack={() => navigation.goBack()}
                    titleNumberOfLines={2}
                />
            </SafeAreaView>
            {!loading ? (
                <FlatList
                    data={records}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={({ item }) => <MedicalRestCard item={item} />}
                    contentContainerStyle={
                        records.length === 0 ? styles.emptyList : styles.listPad
                    }
                    ListEmptyComponent={
                        <Text style={styles.empty}>
                            No hay solicitudes registradas.
                        </Text>
                    }
                />
            ) : (
                <View style={styles.placeholder} />
            )}
            <MenuFooter onBack={() => navigation.navigate("MedicalMenu")} />
        </View>
    );
}

const styles = StyleSheet.create({
    page: { flex: 1, backgroundColor: COLORS.menuContentBg },
    safeTop: { backgroundColor: COLORS.white },
    listPad: { paddingTop: 12, paddingBottom: 24 },
    placeholder: { flex: 1 },
    empty: {
        textAlign: "center",
        color: COLORS.textMuted,
        paddingHorizontal: 24,
        marginTop: 32,
        fontSize: 15,
    },
    emptyList: { flexGrow: 1 },
});
