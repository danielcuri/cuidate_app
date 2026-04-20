import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import moment from 'moment-timezone';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { COLORS } from '@/theme/colors';
import type { RootStackParamList } from '@/navigation/AppNavigator';
import type { MedicalFormRestPayload } from '@/interfaces/medical';
import { medicalService } from '@/services/MedicalService';
import { userService } from '@/services/UserService';
import { loadingService } from '@/services/LoadingService';
import { queryService } from '@/services/QueryService';
import type { GeneralAnswer } from '@/interfaces/learning';
import { RecordsHeader } from '@/components/shared/RecordsHeader';

const TOPIC_OPTIONS = [
  { value: 'PAMOLSA-Faucett', label: 'PAMOLSA Tópico Faucett' },
  { value: 'PAMOLSA-Gambetta', label: 'PAMOLSA - Tópico Gambetta' },
  { value: 'RECICLOPLAST', label: 'RECICLOPLAST' },
  { value: 'DESPRO', label: 'DESPRO' },
] as const;

type PhotoKey = 'url_cert' | 'url_prescription' | 'url_medical_consult' | 'url_payment';

const PHOTO_LABELS: Record<PhotoKey, string> = {
  url_cert: 'Certificado de descanso médico',
  url_prescription: 'Receta médica',
  url_medical_consult: 'Boleta de pago de consulta médica',
  url_payment: 'Boleta de pago por receta médica',
};

type Nav = StackNavigationProp<RootStackParamList, 'FormRest'>;

function toLimaDateString(d: Date): string {
  return moment.tz(d, 'America/Lima').format('YYYY-MM-DD');
}

export function FormRest() {
  const navigation = useNavigation<Nav>();
  const [formData, setFormData] = useState<MedicalFormRestPayload>({
    dni: '',
    topic: '',
    date_init: '',
    date_end: '',
    date_init_topic: '',
    url_cert: '',
    url_prescription: '',
    url_medical_consult: '',
    url_payment: '',
  });
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [topicModal, setTopicModal] = useState(false);
  const [dateInit, setDateInit] = useState(() => new Date());
  const [dateEnd, setDateEnd] = useState(() => new Date());
  const [picker, setPicker] = useState<'init' | 'end' | null>(null);

  useEffect(() => {
    moment.tz.setDefault('America/Lima');
    const now = moment().tz('America/Lima').format('YYYY-MM-DD HH:mm:ss');
    setFormData((prev) => ({
      ...prev,
      dni: userService.user.dni ?? '',
      date_init_topic: now,
    }));
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const topicLabel = useMemo(() => {
    const o = TOPIC_OPTIONS.find((t) => t.value === formData.topic);
    return o?.label ?? 'Seleccionar';
  }, [formData.topic]);

  const setField = useCallback((field: keyof MedicalFormRestPayload, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((e) => ({ ...e, [field]: false }));
  }, []);

  const validateFields = (): boolean => {
    const next: Record<string, boolean> = {};
    const required: (keyof MedicalFormRestPayload)[] = ['topic', 'date_init', 'date_end'];
    let ok = true;
    required.forEach((field) => {
      const v = formData[field];
      if (!v || v === '') {
        next[field] = true;
        ok = false;
      }
    });
    setErrors((e) => ({ ...e, ...next }));
    return ok;
  };

  const attachBase64 = (base64: string | undefined | null): string => {
    if (!base64) return '';
    return `data:image/jpeg;base64,${base64}`;
  };

  const pickCamera = async (key: PhotoKey) => {
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
      const b64 = result.assets[0].base64;
      setField(key, attachBase64(b64));
    }
  };

  const pickGallery = async (key: PhotoKey) => {
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
      const b64 = result.assets[0].base64;
      setField(key, attachBase64(b64));
    }
  };

  const showPhotoOptions = (key: PhotoKey) => {
    const label = PHOTO_LABELS[key];
    const has = !!formData[key];
    const buttons: { text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }[] = [
      { text: 'Tomar foto', onPress: () => pickCamera(key) },
      { text: 'Galería', onPress: () => pickGallery(key) },
    ];
    if (has) {
      buttons.push({
        text: 'Eliminar imagen',
        style: 'destructive',
        onPress: () => setField(key, ''),
      });
    }
    buttons.push({ text: 'Cancelar', style: 'cancel' });
    Alert.alert(label, 'Seleccionar opción', buttons);
  };

  const onChangeDate = (which: 'init' | 'end', event: { type: string }, selected?: Date) => {
    if (Platform.OS === 'android') {
      setPicker(null);
    }
    if (event.type === 'dismissed') {
      setPicker(null);
      return;
    }
    if (event.type === 'set' && selected) {
      const str = toLimaDateString(selected);
      if (which === 'init') {
        setDateInit(selected);
        setField('date_init', str);
      } else {
        setDateEnd(selected);
        setField('date_end', str);
      }
      if (Platform.OS === 'ios') {
        setPicker(null);
      }
    }
  };

  const submit = async () => {
    if (!validateFields()) {
      Alert.alert('Alerta', 'Completar los campos requeridos');
      return;
    }
    await loadingService.present();
    try {
      const res = (await medicalService.registerRestMedical(formData)) as GeneralAnswer;
      if (res?.error) {
        queryService.manageErrors(res);
        return;
      }
      Alert.alert('Mensaje', res.msg ?? 'Registro enviado.', [
        {
          text: 'Continuar',
          onPress: () => navigation.replace('ListRest'),
        },
      ]);
    } catch (e) {
      console.log(e);
      Alert.alert('Error', 'No se pudo enviar el formulario.');
    } finally {
      await loadingService.dismiss();
    }
  };

  const inputRead = [styles.input, styles.inputReadonly];
  const err = (name: string) => (errors[name] ? styles.inputError : null);

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <SafeAreaView style={styles.page} edges={['top']}>
        <SafeAreaView style={styles.safeTop} edges={['top']}>
          <RecordsHeader title="Descanso médico" onBack={() => navigation.goBack()} />
        </SafeAreaView>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>Planta / Local *</Text>
          <TouchableOpacity
            style={[styles.fieldBtn, err('topic')]}
            onPress={() => setTopicModal(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.fieldBtnText} numberOfLines={2}>
              {topicLabel}
            </Text>
          </TouchableOpacity>

          <Text style={styles.label}>Fecha de registro</Text>
          <TextInput style={inputRead} value={formData.date_init_topic} editable={false} />

          <Text style={styles.label}>DNI</Text>
          <TextInput style={inputRead} value={formData.dni} editable={false} />

          <Text style={styles.label}>Apellidos y nombres</Text>
          <TextInput
            style={inputRead}
            value={userService.user.name ?? ''}
            editable={false}
          />

          <Text style={styles.label}>Inicio de descanso médico *</Text>
          <TouchableOpacity
            style={[styles.fieldBtn, err('date_init')]}
            onPress={() => setPicker('init')}
            activeOpacity={0.85}
          >
            <Text style={styles.fieldBtnText}>
              {formData.date_init
                ? moment(formData.date_init).format('DD/MM/YYYY')
                : 'Elegir fecha'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.label}>Fin de descanso médico *</Text>
          <TouchableOpacity
            style={[styles.fieldBtn, err('date_end')]}
            onPress={() => setPicker('end')}
            activeOpacity={0.85}
          >
            <Text style={styles.fieldBtnText}>
              {formData.date_end
                ? moment(formData.date_end).format('DD/MM/YYYY')
                : 'Elegir fecha'}
            </Text>
          </TouchableOpacity>

          <PhotoRow
            label={PHOTO_LABELS.url_cert}
            uri={formData.url_cert}
            onPress={() => showPhotoOptions('url_cert')}
          />
          <PhotoRow
            label={PHOTO_LABELS.url_prescription}
            uri={formData.url_prescription}
            onPress={() => showPhotoOptions('url_prescription')}
          />
          <PhotoRow
            label={PHOTO_LABELS.url_medical_consult}
            uri={formData.url_medical_consult}
            onPress={() => showPhotoOptions('url_medical_consult')}
          />
          <PhotoRow
            label={PHOTO_LABELS.url_payment}
            uri={formData.url_payment}
            onPress={() => showPhotoOptions('url_payment')}
          />
        </ScrollView>

        <SafeAreaView style={styles.footerSafe} edges={['bottom']}>
          <View style={styles.footer}>
            <TouchableOpacity style={styles.btnBack} onPress={() => navigation.goBack()} activeOpacity={0.85}>
              <Text style={styles.btnBackText}>Volver</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnSend} onPress={submit} activeOpacity={0.85}>
              <Text style={styles.btnSendText}>Finalizar</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {picker ? (
          <DateTimePicker
            value={picker === 'init' ? dateInit : dateEnd}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, date) => onChangeDate(picker, event, date)}
          />
        ) : null}

        <Modal visible={topicModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => setTopicModal(false)}>
              <View style={styles.modalBackdrop} />
            </TouchableWithoutFeedback>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Planta / Local</Text>
              {TOPIC_OPTIONS.map((o) => (
                <TouchableOpacity
                  key={o.value}
                  style={styles.modalRow}
                  onPress={() => {
                    setField('topic', o.value);
                    setTopicModal(false);
                  }}
                >
                  <Text style={styles.modalRowText}>{o.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function PhotoRow({
  label,
  uri,
  onPress,
}: {
  label: string;
  uri: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.photoBlock}>
      <Text style={styles.label}>{label}</Text>
      {uri ? (
        <Image source={{ uri }} style={styles.preview} resizeMode="contain" />
      ) : null}
      <TouchableOpacity style={styles.photoBtn} onPress={onPress} activeOpacity={0.88}>
        <Text style={styles.photoBtnText}>Foto</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.menuContentBg },
  safeTop: { backgroundColor: COLORS.white },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  label: { fontSize: 13, color: COLORS.textLabel, marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  inputReadonly: { backgroundColor: COLORS.lightGray, color: COLORS.textMuted },
  inputError: { borderColor: COLORS.danger, borderWidth: 2 },
  fieldBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
  },
  fieldBtnText: { fontSize: 15, color: COLORS.text },
  photoBlock: { marginTop: 8 },
  preview: {
    width: '100%',
    height: 160,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    marginBottom: 8,
  },
  photoBtn: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  photoBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 15 },
  footerSafe: { backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.lightGray },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 12,
  },
  btnBack: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.footerNegativeBorder,
    backgroundColor: COLORS.white,
  },
  btnBackText: { color: COLORS.text, fontWeight: '700' },
  btnSend: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  btnSendText: { color: COLORS.white, fontWeight: '800' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  modalBox: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 8,
    maxHeight: '70%',
    zIndex: 2,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalRow: { paddingVertical: 14, paddingHorizontal: 16 },
  modalRowText: { fontSize: 15, color: COLORS.text },
});
