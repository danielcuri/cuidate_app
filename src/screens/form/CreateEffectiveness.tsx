import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import type { RouteProp } from '@react-navigation/native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api_url } from '../../api/endpoints';
import { COLORS } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import type { EffectivenessListItem, SavePamolsaEffectivenessPayload } from '../../interfaces/forms';
import { formService } from '../../services/FormService';
import { loadingService } from '../../services/LoadingService';
import { alertService } from '../../services/AlertService';
import { queryService } from '../../services/QueryService';
import { EditPhotoModal } from './canvas/EditPhotoModal';
import { RecordsHeader } from '../../components/shared/RecordsHeader';

type Route = RouteProp<RootStackParamList, 'CreateEffectiveness'>;
type Nav = StackNavigationProp<RootStackParamList, 'CreateEffectiveness'>;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatDdMmYyyy(d: Date): string {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function parseIncomingDate(s: string | null | undefined): Date {
  if (s == null || s === '') {
    return new Date();
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function resolvePhotoDisplayUri(raw: string): string {
  const s = raw.trim();
  if (!s) {
    return '';
  }
  if (s.startsWith('data:') || s.startsWith('http://') || s.startsWith('https://')) {
    return s;
  }
  const base = api_url.replace(/\/+$/, '');
  const path = s.replace(/^\/+/, '');
  return `${base}/storage/${path}`;
}

function normalizePhotoSlots(raw: string[] | null | undefined): [string, string] {
  const a = raw?.[0];
  const b = raw?.[1];
  return [a != null && a !== '' ? a : '', b != null && b !== '' ? b : ''];
}

function attachBase64(b64: string | undefined | null): string {
  if (!b64) {
    return '';
  }
  return `data:image/jpeg;base64,${b64}`;
}

function effectiveSubmitted(row: EffectivenessListItem | undefined): boolean {
  if (row == null) {
    return false;
  }
  return row.effective_flag !== null && row.effective_flag !== undefined;
}

export function CreateEffectiveness() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { pamolsaActionDetailId, effectiveDate: effectiveDateParam } = route.params;

  const [sourceAction, setSourceAction] = useState<EffectivenessListItem | undefined>(undefined);
  const [effectiveFlag, setEffectiveFlag] = useState<number | null>(null);
  const [comments, setComments] = useState('');
  const [date, setDate] = useState(() => parseIncomingDate(effectiveDateParam));
  const [photos, setPhotos] = useState<[string, string]>(['', '']);
  const [showPicker, setShowPicker] = useState(false);
  const [photoMenuIndex, setPhotoMenuIndex] = useState<number | null>(null);
  const [editPhotoIndex, setEditPhotoIndex] = useState<number | null>(null);

  const minDate = useMemo(
    () => new Date(new Date().getFullYear(), 0, 1),
    []
  );
  const maxDate = useMemo(
    () => new Date(new Date().getFullYear() + 2, 11, 31),
    []
  );

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const refreshFromService = useCallback(() => {
    const list = (formService.actions_executed as EffectivenessListItem[]) ?? [];
    const row = list.find((a) => a.id === pamolsaActionDetailId);
    setSourceAction(row);
  }, [pamolsaActionDetailId]);

  useFocusEffect(
    useCallback(() => {
      refreshFromService();
    }, [refreshFromService])
  );

  useEffect(() => {
    if (!pamolsaActionDetailId) {
      navigation.goBack();
    }
  }, [pamolsaActionDetailId, navigation]);

  useEffect(() => {
    const row = sourceAction;
    if (row == null) {
      setDate(parseIncomingDate(effectiveDateParam));
      setEffectiveFlag(null);
      setComments('');
      setPhotos(['', '']);
      return;
    }
    setDate(parseIncomingDate(row.effective_date ?? effectiveDateParam));
    setComments(row.comments_effectiveness ?? '');
    const flag = row.effective_flag;
    setEffectiveFlag(flag === null || flag === undefined ? null : Number(flag));
    if (!effectiveSubmitted(row)) {
      setPhotos(['', '']);
    } else {
      setPhotos(normalizePhotoSlots(row.photos_url_effectiveness));
    }
  }, [sourceAction, effectiveDateParam]);

  const viewOnly = sourceAction != null && effectiveSubmitted(sourceAction);
  /** Paridad Ionic `*ngIf` envío: permitir enviar si aún no hay `effective_flag` en el registro. */
  const showSend =
    sourceAction == null ||
    sourceAction.effective_flag === null ||
    sourceAction.effective_flag === undefined;

  const parentPamolsaActionId = useMemo(() => {
    const p = sourceAction?.parent;
    return p?.pamolsa_action_id ?? p?.id;
  }, [sourceAction]);

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
      const b64 = result.assets[0].base64;
      setPhotos((prev) => {
        const next: [string, string] = [...prev];
        next[index] = attachBase64(b64);
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
      const b64 = result.assets[0].base64;
      setPhotos((prev) => {
        const next: [string, string] = [...prev];
        next[index] = attachBase64(b64);
        return next;
      });
    }
  };

  const openPhotoMenu = (index: 0 | 1) => {
    if (viewOnly) {
      return;
    }
    setPhotoMenuIndex(index);
  };

  const photoMenuIdx = photoMenuIndex;
  const hasPhoto =
    photoMenuIdx !== null ? !!(photos[photoMenuIdx] && photos[photoMenuIdx] !== '') : false;

  const sendData = async () => {
    if (effectiveFlag === null) {
      alertService.present('Eficacia', 'Indique si fue eficaz.');
      return;
    }
    await loadingService.present();
    try {
      const payload: SavePamolsaEffectivenessPayload = {
        pamolsa_action_detail_id: pamolsaActionDetailId,
        effective_flag: effectiveFlag,
        comments,
        photos: [...photos],
        effective_date: date.toISOString(),
      };
      const res = await formService.saveDataPamolsaEffectiveness(payload);
      if (res?.error) {
        queryService.manageErrors(res);
        return;
      }
      alertService.present('OK', 'Formato de eficacia envíado correctamente');
      if (effectiveFlag === 0) {
        if (parentPamolsaActionId != null) {
          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'ListPamolsa',
                params: { active_action: parentPamolsaActionId },
              },
            ],
          });
        } else {
          navigation.reset({ index: 0, routes: [{ name: 'Actions' }] });
        }
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Actions' }] });
      }
    } catch (e) {
      console.log(e);
      alertService.present('Error', 'No se pudo enviar.');
    } finally {
      await loadingService.dismiss();
    }
  };

  const onDateChange = (_: unknown, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selected) {
      setDate(selected);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.page}>
        <SafeAreaView style={styles.safeTop} edges={['top']}>
          <RecordsHeader title="Eficacia" onBack={() => navigation.goBack()} />
        </SafeAreaView>
        <ScrollView
          contentContainerStyle={styles.scrollBody}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerContainer}>
            <View style={styles.bullets}>
              <View style={[styles.bullet, styles.bulletActive]} />
            </View>
          </View>

          <View style={styles.formsContainer}>
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>¿Fue eficaz?</Text>
              <View style={styles.radioList}>
                <Pressable
                  style={styles.radioRow}
                  onPress={() => !viewOnly && setEffectiveFlag(1)}
                  disabled={viewOnly}
                >
                  <View
                    style={[
                      styles.radioOuter,
                      effectiveFlag === 1 && styles.radioOuterOn,
                    ]}
                  >
                    {effectiveFlag === 1 ? <View style={styles.radioInner} /> : null}
                  </View>
                  <Text style={styles.radioLabel}>Si</Text>
                </Pressable>
                <Pressable
                  style={styles.radioRow}
                  onPress={() => !viewOnly && setEffectiveFlag(0)}
                  disabled={viewOnly}
                >
                  <View
                    style={[
                      styles.radioOuter,
                      effectiveFlag === 0 && styles.radioOuterOn,
                    ]}
                  >
                    {effectiveFlag === 0 ? <View style={styles.radioInner} /> : null}
                  </View>
                  <Text style={styles.radioLabel}>No</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Comentarios</Text>
              <TextInput
                style={styles.area}
                value={comments}
                onChangeText={setComments}
                editable={!viewOnly}
                multiline
                placeholder="Comentarios"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Fecha eficacia</Text>
              <TouchableOpacity
                style={styles.field}
                onPress={() => !viewOnly && setShowPicker(true)}
                disabled={viewOnly}
              >
                <Text style={styles.fieldTxt}>{formatDdMmYyyy(date)}</Text>
              </TouchableOpacity>
            </View>

            {([0, 1] as const).map((i) => (
              <View key={i} style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Foto {i + 1}</Text>
                <View style={styles.photoWrap}>
                  {photos[i] ? (
                    <View style={styles.photoContainer}>
                      <Image
                        source={{ uri: resolvePhotoDisplayUri(photos[i]) }}
                        style={styles.photoImg}
                        resizeMode="contain"
                      />
                      {!viewOnly ? (
                        <TouchableOpacity
                          style={styles.greenBtn}
                          onPress={() => openPhotoMenu(i)}
                        >
                          <Text style={styles.greenBtnTxt}>Seleccionar foto</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  ) : (
                    !viewOnly ?
                      <TouchableOpacity
                        style={styles.greenBtn}
                        onPress={() => openPhotoMenu(i)}
                      >
                        <Text style={styles.greenBtnTxt}>Seleccionar foto</Text>
                      </TouchableOpacity>
                    : null
                  )}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={[styles.footBtn, styles.negative]} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={18} color={COLORS.text} />
            <Text style={styles.footTxt}> Cancelar</Text>
          </TouchableOpacity>
          {showSend ?
            <TouchableOpacity style={[styles.footBtn, styles.positive]} onPress={() => void sendData()}>
              <Text style={styles.footTxtOn}>Enviar</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
            </TouchableOpacity>
          : <View style={styles.footBtnSpacer} />}
        </View>
      </View>

      {showPicker && Platform.OS === 'ios' ?
        <Modal transparent animationType="fade" visible={showPicker}>
          <Pressable style={styles.dateOverlay} onPress={() => setShowPicker(false)}>
            <Pressable style={styles.dateSheet} onPress={(e) => e.stopPropagation()}>
              <DateTimePicker
                value={date}
                mode="date"
                display="spinner"
                minimumDate={minDate}
                maximumDate={maxDate}
                onChange={onDateChange}
                locale="es"
              />
              <TouchableOpacity style={styles.dateOk} onPress={() => setShowPicker(false)}>
                <Text style={styles.dateOkTxt}>Ok</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      : null}

      {showPicker && Platform.OS === 'android' ?
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          minimumDate={minDate}
          maximumDate={maxDate}
          onChange={onDateChange}
        />
      : null}

      <Modal
        visible={photoMenuIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoMenuIndex(null)}
      >
        <Pressable style={styles.menuOverlay} onPress={() => setPhotoMenuIndex(null)}>
          <View style={styles.menuSheet}>
            <Text style={styles.menuTitle}>Foto {photoMenuIdx !== null ? photoMenuIdx + 1 : ''}</Text>
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => {
                if (photoMenuIdx === null || (photoMenuIdx !== 0 && photoMenuIdx !== 1)) {
                  return;
                }
                void onPickCamera(photoMenuIdx);
                setPhotoMenuIndex(null);
              }}
            >
              <Ionicons name="camera-outline" size={22} color={COLORS.text} />
              <Text style={styles.menuRowTxt}>Tomar foto</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => {
                if (photoMenuIdx === null || (photoMenuIdx !== 0 && photoMenuIdx !== 1)) {
                  return;
                }
                void onPickGallery(photoMenuIdx);
                setPhotoMenuIndex(null);
              }}
            >
              <Ionicons name="images-outline" size={22} color={COLORS.text} />
              <Text style={styles.menuRowTxt}>Abrir galería</Text>
            </TouchableOpacity>
            {hasPhoto && photoMenuIdx !== null ?
              <>
                <TouchableOpacity
                  style={styles.menuRow}
                  onPress={() => {
                    setPhotos((prev) => {
                      const next: [string, string] = [...prev];
                      next[photoMenuIdx] = '';
                      return next;
                    });
                    setPhotoMenuIndex(null);
                  }}
                >
                  <Ionicons name="trash-outline" size={22} color={COLORS.danger} />
                  <Text style={[styles.menuRowTxt, { color: COLORS.danger }]}>Eliminar imagen</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuRow}
                  onPress={() => {
                    setEditPhotoIndex(photoMenuIdx);
                    setPhotoMenuIndex(null);
                  }}
                >
                  <Ionicons name="create-outline" size={22} color={COLORS.text} />
                  <Text style={styles.menuRowTxt}>Editar</Text>
                </TouchableOpacity>
              </>
            : null}
            <TouchableOpacity style={styles.menuCancel} onPress={() => setPhotoMenuIndex(null)}>
              <Text style={styles.menuCancelTxt}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <EditPhotoModal
        visible={editPhotoIndex !== null}
        imageUri={editPhotoIndex !== null ? resolvePhotoDisplayUri(photos[editPhotoIndex]) : null}
        onClose={() => setEditPhotoIndex(null)}
        onApply={(url) => {
          if (editPhotoIndex === null) {
            return;
          }
          setPhotos((prev) => {
            const next: [string, string] = [...prev];
            next[editPhotoIndex] = url;
            return next;
          });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.menuContentBg },
  safeTop: { backgroundColor: COLORS.white },
  page: { flex: 1 },
  scrollBody: { paddingBottom: 24, flexGrow: 1 },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: COLORS.menuContentBg,
  },
  bullets: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    gap: 8,
  },
  bullet: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.lightGray,
  },
  bulletActive: {
    backgroundColor: COLORS.primary,
    transform: [{ scale: 1.2 }],
  },
  formsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  fieldBlock: {
    marginBottom: 8,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  fieldLabel: {
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    fontSize: 15,
  },
  radioList: { gap: 4 },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterOn: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  radioLabel: { fontSize: 16, color: COLORS.text },
  area: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    backgroundColor: COLORS.white,
    textAlignVertical: 'top',
    color: COLORS.text,
    fontSize: 15,
  },
  field: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
  fieldTxt: { color: COLORS.text, fontSize: 15 },
  photoWrap: { marginTop: 4 },
  photoContainer: { alignItems: 'stretch' },
  photoImg: {
    width: '100%',
    minHeight: 180,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    marginBottom: 10,
  },
  greenBtn: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  greenBtnTxt: { color: COLORS.white, fontWeight: '800' },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
  footBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footBtnSpacer: { flex: 1 },
  negative: { backgroundColor: COLORS.lightGray },
  positive: { backgroundColor: COLORS.primary },
  footTxt: { color: COLORS.text, fontWeight: '800' },
  footTxtOn: { color: COLORS.white, fontWeight: '800', marginRight: 6 },
  dateOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  dateSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingBottom: 16,
  },
  dateOk: { alignItems: 'center', paddingVertical: 12 },
  dateOkTxt: { color: COLORS.primary, fontWeight: '800', fontSize: 17 },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  menuSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingBottom: 16,
  },
  menuTitle: {
    textAlign: 'center',
    fontWeight: '800',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    color: COLORS.text,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.lightGray,
  },
  menuRowTxt: { fontSize: 16, color: COLORS.text },
  menuCancel: { alignItems: 'center', paddingVertical: 14 },
  menuCancelTxt: { color: COLORS.primary, fontWeight: '700', fontSize: 16 },
});
