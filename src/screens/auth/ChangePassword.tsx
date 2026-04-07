import React, { useEffect, useState } from 'react';
import {
  Alert,
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
import type { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../theme/colors';
import { userService } from '../../services/UserService';
import { loadingService } from '../../services/LoadingService';
import { queryService } from '../../services/QueryService';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

export function ChangePassword() {
  const navigation = useNavigation<StackNavigationProp<AuthStackParamList, 'ChangePassword'>>();
  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      await userService.loadStorage();
      const id = userService.user.id;
      if (typeof id === 'number') {
        setUserId(id);
      }
    })();
  }, []);

  const disabled =
    oldPassword === '' || password === '' || passwordConfirmation === '' || userId == null;

  const changePassword = async () => {
    if (userId == null) {
      return;
    }
    await loadingService.present();
    try {
      const data = await userService.changePassword({
        user_id: userId,
        old_password: oldPassword,
        password,
        password_confirmation: passwordConfirmation,
      });
      await loadingService.dismiss();
      if (data.error) {
        queryService.manageErrors(data, null);
        return;
      }
      setOldPassword('');
      setPassword('');
      setPasswordConfirmation('');
      Alert.alert('Simplex', data.msg, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      await loadingService.dismiss();
      console.log(e);
    }
  };

  return (
    <View style={styles.page}>
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
            <View style={styles.grid}>
              <View style={styles.col}>
                <Text style={styles.floatingLabel}>Clave actual</Text>
                <TextInput
                  style={styles.input}
                  secureTextEntry
                  value={oldPassword}
                  onChangeText={setOldPassword}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.floatingLabel}>Nueva clave</Text>
                <TextInput
                  style={styles.input}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.floatingLabel}>Repetir clave</Text>
                <TextInput
                  style={styles.input}
                  secureTextEntry
                  value={passwordConfirmation}
                  onChangeText={setPasswordConfirmation}
                />
              </View>
              <View style={styles.col}>
                <TouchableOpacity
                  style={[styles.submitBtn, disabled && styles.submitDisabled]}
                  onPress={changePassword}
                  disabled={disabled}
                  activeOpacity={0.85}
                >
                  <Text style={styles.submitLabel}>Cambiar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: COLORS.changePasswordBg,
  },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { padding: 16 },
  grid: {
    gap: 16,
  },
  col: {
    width: '100%',
  },
  floatingLabel: {
    fontSize: 13,
    color: COLORS.textLabel,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  submitBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitLabel: {
    color: COLORS.white,
    fontWeight: '700',
  },
});
