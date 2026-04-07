import React, { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../theme/colors';
import { alertService } from '../../../services/AlertService';

type Props = {
  visible: boolean;
  /** `data:image/...;base64,...` o URI file */
  imageUri: string | null;
  onClose: () => void;
  /** Base64 sin prefijo o con prefijo data URL — según backend Ionic */
  onApply: (base64OrDataUrl: string) => void;
};

/**
 * Paridad modal `EditPhoto`: reemplazar / retomar foto.
 * Recorte avanzado: // TODO: VERIFICAR (Ionic / crop plugin).
 */
export function EditPhotoModal({ visible, imageUri, onClose, onApply }: Props) {
  const [preview, setPreview] = useState<string | null>(imageUri);

  useEffect(() => {
    if (visible) {
      setPreview(imageUri);
    }
  }, [visible, imageUri]);

  const pickCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      alertService.present('Cámara', 'Se necesita permiso para usar la cámara.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.75,
    });
    if (res.canceled || !res.assets?.[0]) {
      return;
    }
    const a = res.assets[0];
    if (a.base64) {
      const mime = a.mimeType ?? 'image/jpeg';
      setPreview(`data:${mime};base64,${a.base64}`);
    } else if (a.uri) {
      setPreview(a.uri);
    }
  };

  const apply = () => {
    if (!preview) {
      alertService.present('Foto', 'No hay imagen para guardar.');
      return;
    }
    onApply(preview);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.link}>Cerrar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Foto</Text>
          <TouchableOpacity onPress={apply}>
            <Text style={styles.linkBold}>Usar</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.body}>
          {preview ? (
            <Image source={{ uri: preview }} style={styles.img} resizeMode="contain" />
          ) : (
            <Text style={styles.hint}>Sin imagen</Text>
          )}
          <TouchableOpacity style={styles.btn} onPress={pickCamera}>
            <Text style={styles.btnText}>Tomar otra foto</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  title: { fontWeight: '700', color: COLORS.text, fontSize: 17 },
  link: { color: COLORS.primary, fontSize: 16 },
  linkBold: { color: COLORS.primary, fontWeight: '700', fontSize: 16 },
  body: { flex: 1, padding: 16 },
  img: { flex: 1, width: '100%', backgroundColor: COLORS.lightGray, borderRadius: 8 },
  hint: { textAlign: 'center', marginTop: 40, color: COLORS.textMuted },
  btn: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: { color: COLORS.white, fontWeight: '700' },
});
