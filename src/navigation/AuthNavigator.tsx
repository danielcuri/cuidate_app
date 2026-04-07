import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Splash } from '../screens/auth/Splash';
import { Login } from '../screens/auth/Login';
import { RecoverPassword } from '../screens/auth/RecoverPassword';
import { ChangePassword } from '../screens/auth/ChangePassword';
import { COLORS } from '../theme/colors';

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  RecoverPassword: undefined;
  ChangePassword: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={Splash} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="RecoverPassword" component={RecoverPassword} />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePassword}
        options={{
          headerShown: true,
          title: 'Cambiar contraseña',
          headerTitleStyle: {
            color: COLORS.changePasswordTitle,
            fontSize: 13,
            fontWeight: '900',
          },
          headerTintColor: COLORS.text,
          headerBackTitle: 'Atrás',
        }}
      />
    </Stack.Navigator>
  );
}
