import { DeviceEventEmitter } from 'react-native';

export const GLOBAL_LOADING_EVENT = 'global-loading';

export class LoadingService {
  isLoading = false;

  async present(): Promise<void> {
    this.isLoading = true;
    DeviceEventEmitter.emit(GLOBAL_LOADING_EVENT, true);
  }

  async dismiss(): Promise<void> {
    this.isLoading = false;
    DeviceEventEmitter.emit(GLOBAL_LOADING_EVENT, false);
  }
}

export const loadingService = new LoadingService();
