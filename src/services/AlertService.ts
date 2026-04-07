import { Alert } from 'react-native';

/** Parity: `AlertCtrlService` (Ionic). */
export class AlertService {
  present(title: string, msg: string): void {
    Alert.alert(title, msg);
  }
}

export const alertService = new AlertService();
