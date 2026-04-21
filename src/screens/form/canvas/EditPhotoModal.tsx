import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { COLORS } from '../../../theme/colors';
import { alertService } from '../../../services/AlertService';

export type EditPhotoPanelProps = {
  visible: boolean;
  /** `data:image/...;base64,...` o URI file */
  imageUri: string | null;
  onClose: () => void;
  /** Base64 sin prefijo o con prefijo data URL — según backend Ionic */
  onApply: (base64OrDataUrl: string) => void;
  /**
   * Dentro de otro `Modal` con overlay absoluto (p. ej. Pamolsa detalle): el
   * contenido debe respetar insets con `useSafeAreaInsets` — un `SafeAreaView`
   * anidado no aplica bien sobre vistas absolutas.
   */
  embedded?: boolean;
};

/**
 * Paridad modal `EditPhoto`: reemplazar / retomar foto.
 * Recorte avanzado: // TODO: VERIFICAR (Ionic / crop plugin).
 */
export function EditPhotoPanel({
  visible,
  imageUri,
  onClose,
  onApply,
  embedded = false,
}: EditPhotoPanelProps) {
  const insets = useSafeAreaInsets();
  const [preview, setPreview] = useState<string | null>(() =>
    imageUri && imageUri.length > 0 ? imageUri : null,
  );

  const previewMaxH = Math.min(Dimensions.get('window').height * 0.42, 380);

  useEffect(() => {
    if (visible) {
      setPreview(imageUri && imageUri.length > 0 ? imageUri : null);
    }
  }, [visible, imageUri]);

  const pickCamera = async () => {
    try {
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
    } catch (e) {
      console.log(e);
      alertService.present('Foto', 'No se pudo abrir la cámara. Revise permisos.');
    }
  };

  const pickGallery = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        alertService.present('Galería', 'Se necesita permiso para acceder a tus fotos.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
    } catch (e) {
      console.log(e);
      alertService.present('Galería', 'No se pudo abrir la galería. Revise permisos.');
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

  if (!visible) {
    return null;
  }

  const shell = (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.link}>Cerrar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Foto</Text>
        <TouchableOpacity onPress={apply}>
          <Text style={styles.linkBold}>Usar</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.bodyScroll}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
      >
        {preview ? (
          <Image
            source={{ uri: preview }}
            style={[styles.img, { maxHeight: previewMaxH }]}
            resizeMode="contain"
          />
        ) : (
          <Text style={styles.hint}>Sin imagen — elija cámara o galería</Text>
        )}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.btn, styles.action, styles.actionFirst]}
            onPress={pickCamera}
          >
            <Text style={styles.btnText}>Tomar foto</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.action]} onPress={pickGallery}>
            <Text style={styles.btnText}>Elegir de galería</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );

  if (embedded) {
    return (
      <View
        style={[
          styles.safe,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        {shell}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {shell}
    </SafeAreaView>
  );
}

export function EditPhotoModal({
  visible,
  imageUri,
  onClose,
  onApply,
}: Omit<EditPhotoPanelProps, 'embedded'>) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <EditPhotoPanel
        visible={visible}
        imageUri={imageUri}
        onClose={onClose}
        onApply={onApply}
      />
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
  bodyScroll: { flex: 1 },
  bodyContent: {
    padding: 16,
    paddingBottom: 28,
    flexGrow: 1,
  },
  /** Sin `flex:1` en la imagen: si no, en pantallas bajas o modal sobre modal los botones quedan fuera de vista. */
  img: {
    width: '100%',
    minHeight: 160,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
  },
  hint: {
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 8,
    paddingVertical: 32,
    color: COLORS.textMuted,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 16,
  },
  action: { flex: 1 },
  actionFirst: { marginRight: 10 },
  btn: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: { color: COLORS.white, fontWeight: '700' },
});
