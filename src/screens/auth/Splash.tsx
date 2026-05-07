import React, { useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { NavigationProp } from "@react-navigation/native";
import { CommonActions, useNavigation } from "@react-navigation/native";
import type { User } from "../../interfaces/login";
import { secureStorage } from "../../utils/storage";
import { userService } from "../../services/UserService";
import type { AuthStackParamList } from "../../navigation/AuthNavigator";
import type { RootStackParamList } from "../../navigation/AppNavigator";

type SplashNav = StackNavigationProp<AuthStackParamList, "Splash">;

function randomMs(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

export function Splash() {
    const navigation = useNavigation<SplashNav>();
    const rootNav = navigation.getParent<NavigationProp<RootStackParamList>>();

    useEffect(() => {
        const delay = randomMs(2000, 3500);
        const t = setTimeout(async () => {
            await userService.loadStorage();
            const token = await secureStorage.getToken();
            const access = (userService.user as User).access_token;
            if (token && access) {
                rootNav?.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [{ name: "PreMain" }],
                    }),
                );
            } else {
                navigation.replace("Login");
            }
        }, delay);
        return () => clearTimeout(t);
    }, [navigation, rootNav]);

    return (
        <View style={styles.wrap}>
            <Image
                source={require("../../../assets/splash_pamolsa.png")}
                style={styles.img}
                resizeMode="cover"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: "#000" },
    img: { width: "100%", height: "100%" },
});
