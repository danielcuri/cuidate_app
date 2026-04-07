import React, { useEffect, useState } from "react";
import {
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { NavigationProp } from "@react-navigation/native";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { COLORS } from "../../theme/colors";
import { userService } from "../../services/UserService";
import { loadingService } from "../../services/LoadingService";
import { queryService } from "../../services/QueryService";
import { secureStorage } from "../../utils/storage";
import type { User } from "../../interfaces/login";
import type { AuthStackParamList } from "../../navigation/AuthNavigator";
import type { RootStackParamList } from "../../navigation/AppNavigator";

type LoginNav = StackNavigationProp<AuthStackParamList, "Login">;

export function Login() {
    const navigation = useNavigation<LoginNav>();
    const rootNav = navigation.getParent<NavigationProp<RootStackParamList>>();
    const [dni, setDni] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const token = await secureStorage.getToken();
            if (!cancelled && token) {
                rootNav?.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [{ name: "PreMain" }],
                    }),
                );
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [rootNav]);

    const goRecoverPassword = () => {
        navigation.navigate("RecoverPassword");
    };

    const login = async () => {
        await loadingService.present();
        try {
            const data = await userService.login({ dni, password });
            await loadingService.dismiss();
            if (data.error) {
                queryService.manageErrors(data);
                return;
            }
            if (data.user) {
                userService.user = data.user as User;
                await userService.saveData();
            }
            rootNav?.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: "PreMain" }],
                }),
            );
        } catch (e) {
            await loadingService.dismiss();
            console.log(e);
        }
    };

    return (
        <ImageBackground
            source={require("../../../assets/splash-pamolsa.png")}
            style={styles.bg}
            resizeMode="cover"
        >
            <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
                <KeyboardAvoidingView
                    style={styles.flex}
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                >
                    <ScrollView
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={styles.scroll}
                    >
                        <View style={styles.formContainer}>
                            <View style={styles.title} />
                            <View style={styles.form}>
                                <View
                                    style={[
                                        styles.inputRow,
                                        styles.inputBorder,
                                    ]}
                                >
                                    <Ionicons
                                        name="person"
                                        size={22}
                                        color={COLORS.loginIcon}
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="DNI"
                                        placeholderTextColor={COLORS.textMuted}
                                        value={dni}
                                        onChangeText={setDni}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                </View>
                                <View
                                    style={[
                                        styles.inputRow,
                                        styles.inputBorder,
                                    ]}
                                >
                                    <Ionicons
                                        name="lock-closed"
                                        size={22}
                                        color={COLORS.loginIcon}
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Clave"
                                        placeholderTextColor={COLORS.textMuted}
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                    />
                                </View>
                                <TouchableOpacity
                                    style={styles.forgotWrap}
                                    onPress={goRecoverPassword}
                                >
                                    <Text style={styles.forgotText}>
                                        ¿Olvidaste tu contraseña?
                                    </Text>
                                </TouchableOpacity>
                                <View style={styles.buttonsContainer}>
                                    <TouchableOpacity
                                        style={styles.submitBtn}
                                        onPress={login}
                                        activeOpacity={0.85}
                                    >
                                        <Text style={styles.submitLabel}>
                                            INGRESAR
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    bg: { flex: 1 },
    safe: { flex: 1, backgroundColor: "transparent" },
    flex: { flex: 1 },
    scroll: { flexGrow: 1 },
    formContainer: {
        marginTop: 48,
    },
    title: {
        alignItems: "center",
    },
    form: {
        paddingHorizontal: 24,
        paddingTop: 160,
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginBottom: 24,
        backgroundColor: "rgba(255,255,255,0.95)",
        borderRadius: 10,
    },
    inputBorder: {
        borderWidth: 2,
        borderColor: COLORS.loginBorder,
    },
    input: {
        flex: 1,
        marginLeft: 12,
        textAlign: "center",
        color: COLORS.black,
        fontSize: 16,
    },
    forgotWrap: {
        alignItems: "center",
        marginBottom: 8,
    },
    forgotText: {
        color: COLORS.white,
        fontSize: 14,
    },
    buttonsContainer: {
        marginTop: 48,
        alignItems: "center",
    },
    submitBtn: {
        backgroundColor: COLORS.loginButton,
        height: 45,
        borderRadius: 8,
        alignSelf: "stretch",
        justifyContent: "center",
        alignItems: "center",
    },
    submitLabel: {
        color: COLORS.white,
        fontWeight: "700",
        fontSize: 15,
        letterSpacing: 0.5,
    },
});
