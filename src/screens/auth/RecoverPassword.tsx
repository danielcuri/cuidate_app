import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { COLORS } from '../../theme/colors';
import { userService } from '../../services/UserService';
import { loadingService } from '../../services/LoadingService';
import { queryService } from '../../services/QueryService';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

type Nav = StackNavigationProp<AuthStackParamList, 'RecoverPassword'>;

export function RecoverPassword() {
  const navigation = useNavigation<Nav>();
  const [email, setEmail] = useState('');
  const [isCharging, setIsCharging] = useState(false);

  const goLogin = () => {
    navigation.goBack();
  };

  const recoverPassword = async () => {
    setIsCharging(true);
    await loadingService.present();
    try {
      const data = await userService.recoverPassword({ email });
      await loadingService.dismiss();
      if (data.error) {
        queryService.manageErrors(data);
        setIsCharging(false);
        return;
      }
      Toast.show({
        type: 'success',
        text1: 'Tu nueva clave ha sido enviada a tu correo.',
        visibilityTime: 4000,
      });
      setTimeout(() => {
        goLogin();
        setIsCharging(false);
      }, 4000);
    } catch (e) {
      await loadingService.dismiss();
      setIsCharging(false);
      console.log(e);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
            <View style={styles.formContainer}>
              <View style={styles.title}>
                <Text style={styles.logoPlaceholder}> </Text>
              </View>
              <View style={styles.form}>
                <View style={[styles.inputRow, styles.inputBorder]}>
                  <Ionicons name="person" size={22} color={COLORS.white} />
                  <TextInput
                    style={styles.input}
                    placeholder="Correo"
                    placeholderTextColor="rgba(255,255,255,0.7)"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                  />
                </View>
                <TouchableOpacity style={styles.forgotWrap} onPress={goLogin}>
                  <Text style={styles.linkText}>Iniciar sesión</Text>
                </TouchableOpacity>
                <View style={styles.buttonsContainer}>
                  <TouchableOpacity
                    style={[styles.submitBtn, isCharging && styles.submitDisabled]}
                    onPress={recoverPassword}
                    disabled={isCharging}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.submitLabel}>RECUPERAR CONTRASEÑA</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.textMuted,
  },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  formContainer: {
    marginTop: 48,
  },
  title: {
    alignItems: 'center',
  },
  logoPlaceholder: {
    fontSize: 1,
  },
  form: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 24,
    backgroundColor: 'transparent',
    borderRadius: 10,
  },
  inputBorder: {
    borderWidth: 2,
    borderColor: COLORS.loginBorderRecover,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    textAlign: 'center',
    color: COLORS.white,
    fontSize: 16,
  },
  forgotWrap: {
    alignItems: 'center',
    marginBottom: 8,
  },
  linkText: {
    color: COLORS.white,
    fontSize: 14,
  },
  buttonsContainer: {
    marginTop: 48,
    alignItems: 'center',
  },
  submitBtn: {
    backgroundColor: COLORS.loginButton,
    height: 45,
    borderRadius: 8,
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitLabel: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
