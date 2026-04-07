import * as Location from 'expo-location';
import { alertService } from './AlertService';

/**
 * Paridad con Ionic `LocationService` + `Geolocation.getCurrentPosition`.
 * Devuelve cadena `"lat , lng"` como en el formulario original.
 */
export class LocationService {
  async requestAndGetCoordsString(): Promise<string> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alertService.present('Ubicación', 'Se necesita permiso de ubicación para este campo.');
      return '';
    }
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return `${pos.coords.latitude} ,${pos.coords.longitude}`;
  }

  /** Equivalente a `initWatch` Ionic: una lectura y callback. */
  async initWatch(onCoords: (coords: string) => void): Promise<void> {
    try {
      const coords = await this.requestAndGetCoordsString();
      if (coords) {
        onCoords(coords);
      }
    } catch (e) {
      console.log('LocationService.initWatch', e);
    }
  }
}

export const locationService = new LocationService();
