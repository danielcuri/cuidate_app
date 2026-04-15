import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StackNavigationProp } from '@react-navigation/stack';
import { COLORS } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import type { ActionTracing } from '../../interfaces/forms';
import { formService } from '../../services/FormService';
import { loadingService } from '../../services/LoadingService';
import { alertService } from '../../services/AlertService';
import { queryService } from '../../services/QueryService';
import { EditPhotoModal } from '../../screens/form/canvas/EditPhotoModal';
import { FormIonSelect, type IonSelectOption } from './FormIonSelect';

type Nav = StackNavigationProp<RootStackParamList>;

type Props = {
  visible: boolean;
  mode: 'create' | 'view';
  pamolsaActionDetailId: number;
  tracing?: ActionTracing | null;
  /** Fecha propuesta de la acción (desde detalle). */
  proposedDate?: string;
  onClose: () => void;
  onSaved?: (model: ActionTracing) => void;
  navigation: Nav;
};

const STATUS_OPTS = [
  { id: 0, name: 'Pendiente' },
  { id: 1, name: 'Fuera de fecha' },
  { id: 2, name: 'Ejecutado' },
  { id: 3, name: 'Anulado' },
];

function normalizeTwoPhotos(raw: string[] | undefined | null): [string, string] {
  const a = raw?.[0];
  const b = raw?.[1];
  return [a != null && a !== '' ? a : '', b != null && b !== '' ? b : ''];
}

function attachBase64(b64: string | undefined | null): string {
  if (!b64) return '';
  return `data:image/jpeg;base64,${b64}`;
}

/** Paridad TracingPage: crear / visualizar seguimiento. */
export function TracingBottomSheet({
  visible,
  mode,
  pamolsaActionDetailId,
  tracing = null,
  proposedDate,
  onClose,
  onSaved,
  navigation,
}: Props) {
  const readonly = mode === 'view';

  const minDate = useMemo(() => new Date(new Date().getFullYear(), 0, 1), []);
  const maxDate = useMemo(() => new Date(new Date().getFullYear() + 2, 11, 31), []);
  const statusOptions = useMemo<IonSelectOption<number>[]>(
    () => STATUS_OPTS.map((o) => ({ value: o.id, label: o.name })),
    []
  );

  const [registeredAt, setRegisteredAt] = useState(() => new Date());
  const [status, setStatus] = useState<number>(0);
  const [proposedAt, setProposedAt] = useState(() => new Date());
  const [executionAt, setExecutionAt] = useState(() => new Date());
  const [comments, setComments] = useState('');
  const [photos, setPhotos] = useState<[string, string]>(['', '']);

  const [showRegisteredPicker, setShowRegisteredPicker] = useState(false);
  const [showProposedPicker, setShowProposedPicker] = useState(false);
  const [showExecutionPicker, setShowExecutionPicker] = useState(false);
  const [photoMenuIndex, setPhotoMenuIndex] = useState<number | null>(null);
  const [editPhotoIndex, setEditPhotoIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!visible) return;
    // Hidratación (ver / crear) con paridad Ionic.
    if (readonly && tracing) {
      setRegisteredAt(tracing.registered_date ? new Date(tracing.registered_date) : new Date());
      setStatus(typeof tracing.status === 'number' ? tracing.status : 0);
      setProposedAt(tracing.proposed_date ? new Date(tracing.proposed_date) : new Date());
      setExecutionAt(tracing.execution_date ? new Date(tracing.execution_date) : new Date());
      setComments(tracing.comments ?? '');
      setPhotos(normalizeTwoPhotos(tracing.photos));
      return;
    }
    const now = new Date();
    setRegisteredAt(now);
    const seedProposed = proposedDate ? new Date(proposedDate) : new Date();
    setProposedAt(seedProposed);
    setExecutionAt(seedProposed);
    setStatus(0);
    setComments('');
    setPhotos(['', '']);
  }, [visible, readonly, tracing, proposedDate]);

  const onPickCamera = async (index: 0 | 1) => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permisos', 'Se necesita acceso a la cámara.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotos((prev) => {
        const next: [string, string] = [...prev];
        next[index] = attachBase64(result.assets[0].base64);
        return next;
      });
    }
  };

  const onPickGallery = async (index: 0 | 1) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permisos', 'Se necesita acceso a la galería.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotos((prev) => {
        const next: [string, string] = [...prev];
        next[index] = attachBase64(result.assets[0].base64);
        return next;
      });
    }
  };

  const submit = async () => {
    if (readonly) {
      onClose();
      return;
    }
    if (!pamolsaActionDetailId) {
      alertService.present('Seguimiento', 'No se encontró el ID de la acción.');
      return;
    }
    await loadingService.present();
    try {
      const payload: Required<Pick<ActionTracing,
        'registered_date' | 'pamolsa_action_detail_id' | 'proposed_date' | 'execution_date' | 'status' | 'comments' | 'photos'
      >> = {
        registered_date: registeredAt.toISOString(),
        pamolsa_action_detail_id: pamolsaActionDetailId,
        proposed_date: proposedAt.toISOString(),
        execution_date: status === 2 ? executionAt.toISOString() : '',
        status,
        comments,
        photos: [...photos],
      };

      const res = (await formService.saveDataPamolsaTracing(payload)) as {
        error?: boolean;
        msg?: string;
        model?: ActionTracing;
      };
      if (res?.error) {
        queryService.manageErrors(res);
        return;
      }
      alertService.present('OK', 'Seguimiento envíado correctamente');
      const model = res?.model ?? payload;
      onSaved?.(model);
      if (status === 2) {
        navigation.navigate('Effectiveness');
      }
      onClose();
    } catch (e) {
      console.log(e);
      alertService.present('Error', 'No se pudo enviar.');
    } finally {
      await loadingService.dismiss();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {readonly ? 'Ver seguimiento' : 'Nuevo seguimiento'}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.link}>Cerrar</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.label}>Fecha y hora</Text>
          <TouchableOpacity
            style={styles.field}
            disabled={readonly}
            onPress={() => !readonly && setShowRegisteredPicker(true)}
          >
            <Text style={styles.fieldTxt}>{registeredAt.toLocaleString()}</Text>
          </TouchableOpacity>
          {showRegisteredPicker && !readonly ? (
            <DateTimePicker
              value={registeredAt}
              mode="datetime"
              display="default"
              minimumDate={minDate}
              maximumDate={maxDate}
              onChange={(_, d) => {
                setShowRegisteredPicker(false);
                if (d) setRegisteredAt(d);
              }}
            />
          ) : null}

          <FormIonSelect<number>
            label="Estado"
            value={status}
            options={statusOptions}
            onChange={setStatus}
            placeholder="Seleccionar"
            disabled={readonly}
          />

          <Text style={styles.label}>Fecha propuesta</Text>
          <TouchableOpacity
            style={styles.field}
            disabled={readonly}
            onPress={() => !readonly && setShowProposedPicker(true)}
          >
            <Text style={styles.fieldTxt}>{proposedAt.toLocaleDateString()}</Text>
          </TouchableOpacity>
          {showProposedPicker && !readonly ? (
            <DateTimePicker
              value={proposedAt}
              mode="date"
              display="default"
              minimumDate={minDate}
              maximumDate={maxDate}
              onChange={(_, d) => {
                setShowProposedPicker(false);
                if (d) setProposedAt(d);
              }}
            />
          ) : null}

          {status === 2 ? (
            <>
              <Text style={styles.label}>Fecha ejecución</Text>
              <TouchableOpacity
                style={styles.field}
                disabled={readonly}
                onPress={() => !readonly && setShowExecutionPicker(true)}
              >
                <Text style={styles.fieldTxt}>{executionAt.toLocaleDateString()}</Text>
              </TouchableOpacity>
              {showExecutionPicker && !readonly ? (
                <DateTimePicker
                  value={executionAt}
                  mode="date"
                  display="default"
                  minimumDate={minDate}
                  maximumDate={maxDate}
                  onChange={(_, d) => {
                    setShowExecutionPicker(false);
                    if (d) setExecutionAt(d);
                  }}
                />
              ) : null}
            </>
          ) : null}

          <Text style={styles.label}>Comentarios</Text>
          <TextInput
            style={styles.area}
            value={comments}
            onChangeText={setComments}
            editable={!readonly}
            multiline
            placeholder="Comentarios"
          />

          <Text style={styles.label}>Fotos</Text>
          <View style={styles.photos}>
            {([0, 1] as const).map((i) => (
              <TouchableOpacity
                key={i}
                style={styles.photoBox}
                disabled={readonly}
                onPress={() => {
                  if (readonly) return;
                  setPhotoMenuIndex(i);
                }}
                activeOpacity={0.88}
              >
                {photos[i] ? (
                  <Image source={{ uri: photos[i] }} style={styles.photo} />
                ) : (
                  <Text style={styles.photoHint}>Foto {i + 1}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {!readonly ? (
            <TouchableOpacity style={styles.primary} onPress={() => void submit()}>
              <Text style={styles.primaryTxt}>Enviar</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      </SafeAreaView>

      {/* Menú de foto (paridad Ionic action-sheet) */}
      <Modal
        visible={photoMenuIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoMenuIndex(null)}
      >
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setPhotoMenuIndex(null)}>
          <View style={styles.menuSheet}>
            <Text style={styles.menuTitle}>Foto {photoMenuIndex !== null ? photoMenuIndex + 1 : ''}</Text>
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => {
                const idx = photoMenuIndex;
                if (idx === null) return;
                void onPickCamera(idx as 0 | 1);
                setPhotoMenuIndex(null);
              }}
            >
              <Text style={styles.menuRowTxt}>Tomar foto</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => {
                const idx = photoMenuIndex;
                if (idx === null) return;
                void onPickGallery(idx as 0 | 1);
                setPhotoMenuIndex(null);
              }}
            >
              <Text style={styles.menuRowTxt}>Abrir galería</Text>
            </TouchableOpacity>
            {photoMenuIndex !== null && photos[photoMenuIndex] ? (
              <>
                <TouchableOpacity
                  style={styles.menuRow}
                  onPress={() => {
                    const idx = photoMenuIndex;
                    if (idx === null) return;
                    setPhotos((prev) => {
                      const next: [string, string] = [...prev];
                      next[idx as 0 | 1] = '';
                      return next;
                    });
                    setPhotoMenuIndex(null);
                  }}
                >
                  <Text style={[styles.menuRowTxt, { color: COLORS.danger }]}>Eliminar imagen</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuRow}
                  onPress={() => {
                    setEditPhotoIndex(photoMenuIndex);
                    setPhotoMenuIndex(null);
                  }}
                >
                  <Text style={styles.menuRowTxt}>Editar</Text>
                </TouchableOpacity>
              </>
            ) : null}
            <TouchableOpacity style={styles.menuCancel} onPress={() => setPhotoMenuIndex(null)}>
              <Text style={styles.menuCancelTxt}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <EditPhotoModal
        visible={editPhotoIndex !== null}
        imageUri={editPhotoIndex !== null ? photos[editPhotoIndex] : null}
        onClose={() => setEditPhotoIndex(null)}
        onApply={(url) => {
          if (editPhotoIndex === null) return;
          setPhotos((prev) => {
            const next: [string, string] = [...prev];
            next[editPhotoIndex as 0 | 1] = url;
            return next;
          });
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  link: { color: COLORS.primary, fontWeight: '700' },
  body: { padding: 16, paddingBottom: 40 },
  hint: { marginBottom: 12, color: COLORS.textMuted },
  label: { marginTop: 12, fontWeight: '700', color: COLORS.textLabel },
  field: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    marginTop: 6,
  },
  fieldTxt: { color: COLORS.text },
  area: {
    marginTop: 6,
    minHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top',
    color: COLORS.text,
  },
  primary: {
    marginTop: 24,
    backgroundColor: COLORS.secondary,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryTxt: { color: COLORS.white, fontWeight: '800' },

  photos: { flexDirection: 'row', gap: 12, marginTop: 10 },
  photoBox: {
    flex: 1,
    height: 120,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: { width: '100%', height: '100%' },
  photoHint: { color: COLORS.textMuted, fontWeight: '700' },

  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  menuSheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 14, borderTopRightRadius: 14, paddingBottom: 16 },
  menuTitle: {
    textAlign: 'center',
    fontWeight: '800',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    color: COLORS.text,
  },
  menuRow: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.lightGray,
  },
  menuRowTxt: { fontSize: 16, color: COLORS.text },
  menuCancel: { alignItems: 'center', paddingVertical: 14 },
  menuCancelTxt: { color: COLORS.primary, fontWeight: '700', fontSize: 16 },
});
