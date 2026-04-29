import { Alert } from 'react-native';

/** Parity: `AlertCtrlService` (Ionic). */
export class AlertService {
  present(title: string, msg: string, onOk?: () => void): void {
    if (onOk) {
      Alert.alert(title, msg, [{ text: 'OK', onPress: onOk }], {
        cancelable: true,
      });
      return;
    }
    Alert.alert(title, msg);
  }
}

export const alertService = new AlertService();
