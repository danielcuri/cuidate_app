import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { VirtualSelect } from '../../components/shared/VirtualSelect';
import { COLORS } from '../../theme/colors';
import { formService } from '../../services/FormService';
import { userService } from '../../services/UserService';
import { loadingService } from '../../services/LoadingService';
import { alertService } from '../../services/AlertService';
import { queryService } from '../../services/QueryService';
import { locationService } from '../../services/LocationService';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import type { FormDesign, FormLocalSaved, Forms } from '../../interfaces/forms';
import {
  deleteDraft,
  saveDraft as persistNewDraft,
  updateDraft,
} from '../../utils/formDrafts';
import { useFormStore } from '../../stores/formStore';
import {
  initEmptyFormState,
  buildDbArrays,
  searchFormInList,
  validateEntireForm,
  hydrateFormDataFromRecord,
  findFormsRecordById,
  type FormDataShape,
} from './canvas/canvasFormInit';
import { FormFieldRenderer, type SelectRequest } from './canvas/FormFieldRenderer';
import { EditPhotoModal } from './canvas/EditPhotoModal';
import { TableDetailModal } from './canvas/TableDetailModal';

type CanvasRoute = RouteProp<RootStackParamList, 'CanvasForm' | 'CanvasFormEdit'>;
type CanvasNav = StackNavigationProp<RootStackParamList, 'CanvasForm' | 'CanvasFormEdit'>;

type SelectModalState = SelectRequest & { visible: boolean };

type PhotoEditState = {
  fieldId: number;
  uri: string | null;
  index?: number;
};

export function CanvasForm() {
  const { width } = useWindowDimensions();
  const navigation = useNavigation<CanvasNav>();
  const route = useRoute<CanvasRoute>();
  const listRef = useRef<FlatList>(null);

  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState<Forms | null>(null);
  const [formData, setFormData] = useState<FormDataShape | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [selectModal, setSelectModal] = useState<SelectModalState | null>(null);
  const [tableField, setTableField] = useState<FormDesign | null>(null);
  const [photoEdit, setPhotoEdit] = useState<PhotoEditState | null>(null);

  const isEditRoute = route.name === 'CanvasFormEdit';
  const editParams = route.params as RootStackParamList['CanvasFormEdit'];
  const newParams = route.params as RootStackParamList['CanvasForm'];
  const formIdParam = isEditRoute ? editParams.formId : newParams?.formId;
  const draftIndex = isEditRoute ? editParams.index : undefined;
  const formRecordId = !isEditRoute ? newParams?.formRecordId : undefined;

  const allForms = (formService.forms as Forms[]) ?? [];

  const gpsFieldIds = useMemo(() => {
    if (!form) {
      return [] as number[];
    }
    return initEmptyFormState(form, { id: 0, name: '', signatureUrl: '' }).meta
      .gpsFieldIds;
  }, [form]);

  const dbOptions = useMemo(() => {
    if (!form) {
      return {};
    }
    return buildDbArrays(form);
  }, [form]);

  const patchField = useCallback((fieldId: number, value: unknown) => {
    setFormData((prev) =>
      prev
        ? { ...prev, fields: { ...prev.fields, [fieldId]: value } }
        : prev
    );
  }, []);

  const load = useCallback(async () => {
    setBusy(true);
    setErr(null);
    try {
      await formService.loadStorage();
      await userService.loadStorage();
      const forms = (formService.forms as Forms[]) ?? [];
      const fid = formIdParam ?? forms[0]?.id;
      if (fid == null) {
        setErr('No hay formularios cargados. Actualice desde el menú Formularios.');
        setForm(null);
        setFormData(null);
        return;
      }
      const f = searchFormInList(formService.forms, fid);
      if (!f) {
        setErr('Formulario no encontrado.');
        setForm(null);
        setFormData(null);
        return;
      }
      setForm(f);
      navigation.setOptions({ title: String(f.name ?? 'Formulario') });

      const ctx = {
        id: userService.user.id ?? 0,
        name: userService.user.name ?? '',
        signatureUrl:
          (userService.user as { signature_url?: string }).signature_url ?? '',
      };

      if (draftIndex != null && formService.forms_saved_local[draftIndex]) {
        const raw = formService.forms_saved_local[draftIndex] as FormDataShape;
        setFormData({
          id: raw.id ?? '',
          form_id: String(raw.form_id ?? f.id),
          user_id: raw.user_id ?? ctx.id,
          fields: { ...(raw.fields as Record<number, unknown>) },
          form_data_ids: { ...(raw.form_data_ids as Record<number, unknown>) },
          rows_deleted: raw.rows_deleted ?? [],
          status: raw.status ?? 0,
          name: raw.name,
          created: raw.created,
        });
      } else if (formRecordId != null) {
        const record = findFormsRecordById(
          formRecordId,
          formService.forms_records,
          useFormStore.getState().forms_records
        );
        if (!record) {
          setErr(
            'No se encontró el registro en memoria. Abra el envío desde la lista de registros.'
          );
          setFormData(null);
          return;
        }
        setFormData(hydrateFormDataFromRecord(f, record, ctx));
      } else {
        const { formData: fd } = initEmptyFormState(f, ctx);
        setFormData(fd);
      }
      setSlideIndex(0);
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    } catch (e) {
      console.log(e);
      setErr('Error al cargar el formulario.');
    } finally {
      setBusy(false);
    }
  }, [draftIndex, formIdParam, formRecordId, navigation]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!form || gpsFieldIds.length === 0) {
      return;
    }
    let cancelled = false;
    void locationService.initWatch((coords) => {
      if (cancelled || !coords) {
        return;
      }
      setFormData((prev) => {
        if (!prev) {
          return prev;
        }
        const fields = { ...prev.fields };
        let changed = false;
        for (const id of gpsFieldIds) {
          const cur = fields[id];
          if (cur === '' || cur == null) {
            fields[id] = coords;
            changed = true;
          }
        }
        return changed ? { ...prev, fields } : prev;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [form?.id, gpsFieldIds.join(',')]);

  const sections = form?.form_sections ?? [];

  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const i = Math.round(x / width);
      setSlideIndex(Math.max(0, Math.min(i, sections.length - 1)));
    },
    [sections.length, width]
  );

  const goPrev = () => {
    const i = Math.max(0, slideIndex - 1);
    listRef.current?.scrollToIndex({ index: i, animated: true });
    setSlideIndex(i);
  };

  const goNext = () => {
    const i = Math.min(sections.length - 1, slideIndex + 1);
    listRef.current?.scrollToIndex({ index: i, animated: true });
    setSlideIndex(i);
  };

  const onRequestSelect = useCallback((req: SelectRequest) => {
    setSelectModal({ ...req, visible: true });
  }, []);

  const onSelectConfirm = (ids: (string | number)[]) => {
    if (!selectModal || !formData) {
      return;
    }
    const v = selectModal.multiple ? ids : (ids[0] ?? '');
    patchField(selectModal.fieldId, v);
    setSelectModal(null);
  };

  const saveRemote = async () => {
    if (!form || !formData) {
      return;
    }
    if (!validateEntireForm(form, formData.fields)) {
      alertService.present(
        'Validación',
        'Revise los campos obligatorios en todas las secciones.'
      );
      return;
    }
    await loadingService.present();
    try {
      const res = (await formService.saveData(formData)) as {
        error?: boolean;
        msg?: string;
      };
      if (res?.error) {
        queryService.manageErrors(res);
      } else {
        if (draftIndex != null) {
          await deleteDraft(draftIndex);
        }
        alertService.present('Guardar', 'Datos enviados correctamente.');
      }
    } catch (e) {
      console.log(e);
      alertService.present('Error', 'No se pudo completar el guardado.');
    } finally {
      await loadingService.dismiss();
    }
  };

  const saveDraft = async () => {
    if (!form || !formData) {
      return;
    }
    try {
      const entry: FormLocalSaved = {
        id: Number(formData.id) || Date.now(),
        form_id: Number(formData.form_id),
        name:
          formData.name ??
          `Borrador ${String(form.name ?? form.id)} ${new Date().toLocaleString()}`,
        created: formData.created ?? new Date().toISOString(),
        user_id: Number(formData.user_id ?? userService.user.id ?? 0),
        fields: formData.fields,
        form_data_ids: formData.form_data_ids,
        rows_deleted: formData.rows_deleted as [],
        status: formData.status ?? 0,
      };
      if (draftIndex != null) {
        await updateDraft(draftIndex, entry);
      } else {
        await persistNewDraft(entry);
      }
      alertService.present('Borrador', 'Guardado localmente.');
    } catch (e) {
      console.log(e);
      alertService.present('Error', 'No se pudo guardar el borrador.');
    }
  };

  const appendPhoto = async (fieldId: number) => {
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
    const mime = a.mimeType ?? 'image/jpeg';
    const uri = a.base64 ? `data:${mime};base64,${a.base64}` : a.uri;
    if (!uri) {
      return;
    }
    setFormData((prev) => {
      if (!prev) {
        return prev;
      }
      const prevArr = (prev.fields[fieldId] as string[]) ?? [];
      return {
        ...prev,
        fields: {
          ...prev.fields,
          [fieldId]: [...prevArr, uri],
        },
      };
    });
  };

  const applyEditedPhoto = (dataUrl: string) => {
    if (!photoEdit || !formData) {
      return;
    }
    const { fieldId, index } = photoEdit;
    setFormData((prev) => {
      if (!prev) {
        return prev;
      }
      const fields = { ...prev.fields };
      if (index != null) {
        const arr = [...((fields[fieldId] as string[]) ?? [])];
        arr[index] = dataUrl;
        fields[fieldId] = arr;
      } else {
        fields[fieldId] = dataUrl;
      }
      return { ...prev, fields };
    });
    setPhotoEdit(null);
  };

  if (busy) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (err || !form || !formData) {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>{err ?? 'Sin datos'}</Text>
        <TouchableOpacity style={styles.retry} onPress={load}>
          <Text style={styles.retryTxt}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      {allForms.length > 1 ? (
        <ScrollFormsBar
          forms={allForms}
          currentId={form.id}
          onPick={(id) => {
            navigation.replace('CanvasForm', { formId: id });
          }}
        />
      ) : null}
      <FlatList
        ref={listRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        data={sections}
        keyExtractor={(s) => String(s.id)}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        onScrollToIndexFailed={({ index }) => {
          setTimeout(() => {
            listRef.current?.scrollToIndex({ index, animated: true });
          }, 120);
        }}
        onMomentumScrollEnd={onScrollEnd}
        renderItem={({ item }) => (
          <View style={{ width, flex: 1 }}>
            <ScrollView contentContainerStyle={styles.sectionPad}>
              {item.list.map((el: FormDesign) => (
                <FormFieldRenderer
                  key={el.id}
                  field={el}
                  value={formData.fields[el.id]}
                  onChange={(v) => patchField(el.id, v)}
                  dbOptions={dbOptions}
                  onRequestSelect={onRequestSelect}
                  onOpenTable={(tf) => setTableField(tf)}
                  onEditPhoto={(fid, uri, idx) =>
                    setPhotoEdit({ fieldId: fid, uri, index: idx })
                  }
                  onLaunchCamera={appendPhoto}
                />
              ))}
            </ScrollView>
          </View>
        )}
      />
      <View style={styles.footer}>
        <Text style={styles.slideHint}>
          Sección {slideIndex + 1} / {sections.length || 1}
        </Text>
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.navBtn, slideIndex === 0 && styles.navBtnOff]}
            onPress={goPrev}
            disabled={slideIndex === 0}
          >
            <Text style={[styles.navBtnTxt, slideIndex === 0 && styles.navBtnTxtDim]}>
              Anterior
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navBtn, slideIndex >= sections.length - 1 && styles.navBtnOff]}
            onPress={goNext}
            disabled={slideIndex >= sections.length - 1}
          >
            <Text
              style={[
                styles.navBtnTxt,
                slideIndex >= sections.length - 1 && styles.navBtnTxtDim,
              ]}
            >
              Siguiente
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.saveBtn} onPress={saveRemote}>
          <Text style={styles.saveBtnTxt}>Guardar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.draftBtn} onPress={saveDraft}>
          <Text style={styles.draftBtnTxt}>Guardar borrador</Text>
        </TouchableOpacity>
      </View>

      {selectModal?.visible ? (
        <VirtualSelect
          visible
          title={selectModal.title}
          items={selectModal.items}
          multiple={selectModal.multiple}
          selectedIds={selectModal.selectedIds}
          onClose={() => setSelectModal(null)}
          onConfirm={onSelectConfirm}
        />
      ) : null}

      <TableDetailModal
        visible={!!tableField}
        tableField={tableField}
        rows={(tableField ? formData.fields[tableField.id] : []) as unknown[]}
        onClose={() => setTableField(null)}
        onSave={(rows) => {
          if (tableField) {
            patchField(tableField.id, rows);
          }
        }}
      />

      <EditPhotoModal
        visible={!!photoEdit}
        imageUri={photoEdit?.uri ?? null}
        onClose={() => setPhotoEdit(null)}
        onApply={applyEditedPhoto}
      />
    </View>
  );
}

function ScrollFormsBar({
  forms,
  currentId,
  onPick,
}: {
  forms: Forms[];
  currentId: number;
  onPick: (id: number) => void;
}) {
  return (
    <View style={styles.formBar}>
      <FlatList
        horizontal
        data={forms}
        keyExtractor={(f) => String(f.id)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.formBarInner}
        renderItem={({ item }) => {
          const sel = item.id === currentId;
          return (
            <TouchableOpacity
              style={[styles.formChip, sel && styles.formChipOn]}
              onPress={() => onPick(item.id)}
            >
              <Text style={[styles.formChipTxt, sel && styles.formChipTxtOn]} numberOfLines={1}>
                {String(item.name ?? item.id)}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.menuContentBg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  err: { color: COLORS.danger, textAlign: 'center', marginBottom: 12 },
  retry: { padding: 12, backgroundColor: COLORS.primary, borderRadius: 8 },
  retryTxt: { color: COLORS.white, fontWeight: '700' },
  sectionPad: { padding: 12, paddingBottom: 220 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    paddingBottom: 20,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    shadowColor: COLORS.black,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
  slideHint: {
    textAlign: 'center',
    color: COLORS.textMuted,
    marginBottom: 8,
    fontSize: 13,
  },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  navBtn: {
    flex: 1,
    marginHorizontal: 4,
    padding: 10,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  navBtnOff: { backgroundColor: COLORS.lightGray },
  navBtnTxt: { color: COLORS.white, fontWeight: '600' },
  navBtnTxtDim: { color: COLORS.textMuted },
  saveBtn: {
    padding: 14,
    borderRadius: 8,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    marginBottom: 8,
  },
  saveBtnTxt: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
  draftBtn: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
  },
  draftBtnTxt: { color: COLORS.primary, fontWeight: '600' },
  formBar: {
    maxHeight: 48,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  formBarInner: { paddingHorizontal: 8, paddingVertical: 8, alignItems: 'center' },
  formChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.lightGray,
    marginRight: 8,
    maxWidth: 160,
  },
  formChipOn: { backgroundColor: COLORS.primary },
  formChipTxt: { fontSize: 12, color: COLORS.text },
  formChipTxtOn: { color: COLORS.white, fontWeight: '700' },
});
