import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../../theme/colors';
import type { RootStackParamList } from '../../../navigation/AppNavigator';
import { formService } from '../../../services/FormService';
import { loadingService } from '../../../services/LoadingService';
import { queryService } from '../../../services/QueryService';
import { alertService } from '../../../services/AlertService';
import { VirtualSelect, type VirtualSelectItem } from '../../../components/shared/VirtualSelect';
import { userService } from '../../../services/UserService';
import { SignaturePad } from '../../../components/shared/SignaturePad';
import { PamolsaActionFormDetailModal, type PamolsaActionDetailRowType1 } from './PamolsaActionFormDetailModal';

type Nav = StackNavigationProp<RootStackParamList, 'PamolsaActionForm'>;

const REGISTER_TYPES: VirtualSelectItem[] = [
  { id: 'Prevencion de Incendios', name: 'Prevencion de Incendios' },
  { id: 'Seguridad Industrial', name: 'Seguridad Industrial' },
  { id: 'Salud Ocupacional', name: 'Salud Ocupacional' },
  { id: 'Seguridad Patrimonial', name: 'Seguridad Patrimonial' },
];

// Fuente (`type`) tal cual Ionic.
const TYPE_FUENTE: VirtualSelectItem[] = [
  { id: 'Inspeccion SST', name: 'Inspeccion SST' },
  { id: 'Interacciones de SST', name: 'Interacciones SST' },
  { id: 'Eventos', name: 'Eventos' },
  { id: 'Monitoreo Ocupacionales', name: 'Monitoreo Ocupacionales' },
  { id: 'OCS', name: 'OCS' },
  { id: 'IPERC', name: 'IPERC' },
  { id: 'Aseguradoras', name: 'Aseguradoras' },
  { id: 'Otros', name: 'Otros' },
  { id: 'Seguridad Patrimonial', name: 'Seguridad Patrimonial' },
];

export function PamolsaActionForm() {
  const navigation = useNavigation<Nav>();

  const nowIso = useMemo(() => new Date().toISOString(), []);

  const [slideIndex, setSlideIndex] = useState<0 | 1 | 2>(0);

  // Slide 1 (Sección 1)
  const [registerType, setRegisterType] = useState<string>('');
  const [registeredDate, setRegisteredDate] = useState<Date>(new Date());
  const [showRegisteredPicker, setShowRegisteredPicker] = useState(false);
  const [typeFuente, setTypeFuente] = useState<string>('');
  const [inspectionId, setInspectionId] = useState<string | number | ''>('');
  const [localId, setLocalId] = useState<string | number | ''>('');
  const [areaId, setAreaId] = useState<string | number | ''>('');
  const [areaResponsableId, setAreaResponsableId] = useState<string | number | ''>('');
  const [inspectionResponsable] = useState<string>(userService.user.name ?? '');

  const [openRegisterType, setOpenRegisterType] = useState(false);
  const [openTypeFuente, setOpenTypeFuente] = useState(false);
  const [openInspection, setOpenInspection] = useState(false);
  const [openLocal, setOpenLocal] = useState(false);
  const [openArea, setOpenArea] = useState(false);
  const [openAreaResp, setOpenAreaResp] = useState(false);

  // Slide 2 (Detalle)
  const [details, setDetails] = useState<PamolsaActionDetailRowType1[]>([]);
  const [inspectionResult, setInspectionResult] = useState('');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailIndex, setDetailIndex] = useState<number>(-1);

  // Slide 3 (Responsable del registro + firma + enviar)
  const [registerResponsable] = useState<string>(userService.user.name ?? '');
  const [chargeResponsable, setChargeResponsable] = useState('');
  const [responsableDate] = useState<string>(nowIso);
  const [responsableSignUrl, setResponsableSignUrl] = useState<string>((userService.user as any)?.signature_url ?? '');
  const [signatureFlag] = useState<boolean>(Boolean((userService.user as any)?.signature_url));

  const locals = useMemo(() => {
    const raw = (formService.locals as { id: number | string; name: string }[]) ?? [];
    return raw.map((l) => ({ id: l.id, name: l.name })) as VirtualSelectItem[];
  }, []);

  const currentLocal = useMemo(() => {
    const loc = (formService.locals as any[])?.find((l) => String(l.id) === String(localId));
    return loc ?? null;
  }, [localId]);

  const areas = useMemo(() => {
    const raw = (currentLocal?.areas as { id: number | string; name: string; users?: any[] }[]) ?? [];
    return raw
      .slice()
      .sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? '')))
      .map((a) => ({ id: a.id, name: a.name })) as VirtualSelectItem[];
  }, [currentLocal]);

  const currentArea = useMemo(() => {
    const a = (currentLocal?.areas as any[])?.find((x) => String(x.id) === String(areaId));
    return a ?? null;
  }, [currentLocal, areaId]);

  const areaResponsables = useMemo(() => {
    const raw = (currentArea?.users as { id: number | string; name: string }[]) ?? [];
    return raw
      .slice()
      .sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? '')))
      .map((u) => ({ id: u.id, name: u.name })) as VirtualSelectItem[];
  }, [currentArea]);

  const inspections = useMemo(() => {
    const raw = (formService.inspections as { id: number | string; name: string; type?: string }[]) ?? [];
    return raw.filter((x) => String(x.type ?? '') === String(typeFuente));
  }, [typeFuente]);

  const inspectionItems = useMemo(() => inspections.map((x) => ({ id: x.id, name: x.name })) as VirtualSelectItem[], [inspections]);

  const localName = useMemo(() => locals.find((l) => String(l.id) === String(localId))?.name ?? 'Seleccionar', [locals, localId]);
  const areaName = useMemo(() => areas.find((a) => String(a.id) === String(areaId))?.name ?? 'Seleccionar', [areas, areaId]);
  const areaRespName = useMemo(
    () => areaResponsables.find((u) => String(u.id) === String(areaResponsableId))?.name ?? 'Seleccionar',
    [areaResponsables, areaResponsableId]
  );

  const validateSlide1 = () => {
    if (!registerType) return 'Seleccione tipo de registro.';
    if (!typeFuente) return 'Seleccione Fuente.';
    if ((typeFuente === 'Inspeccion SST' || typeFuente === 'Eventos') && !inspectionId) return 'Seleccione Categoria.';
    if (!localId) return 'Seleccione Planta / Local.';
    if (!areaId) return 'Seleccione Área.';
    if (!areaResponsableId) return 'Seleccione Responsable del área.';
    return null;
  };

  const validateSlide2 = () => {
    if (!details.length) return 'Agregue al menos un registro en la tabla de detalle.';
    if (!inspectionResult.trim()) return 'Complete "Hallazgo reportado a".';
    return null;
  };

  const validateSlide3 = () => {
    if (!chargeResponsable.trim()) return 'Complete Cargo.';
    if (!responsableSignUrl) return 'Registre firma.';
    return null;
  };

  const submit = async () => {
    const err = validateSlide3();
    if (err) return alertService.present('Hallazgo SST', err);
    await loadingService.present();
    try {
      const res = (await formService.saveDataPamolsaAction({
        register_type: registerType,
        registered_date: registeredDate.toISOString(),
        responsable_sign_url: responsableSignUrl,
        type: typeFuente,
        inspection_id: inspectionId,
        local_id: localId,
        area_id: areaId,
        area_responsable_id: areaResponsableId,
        inspection_responsable: inspectionResponsable,
        inspection_result: inspectionResult,
        register_responsable: registerResponsable,
        charge_responsable: chargeResponsable,
        responsable_date: responsableDate,
        details,
      })) as { error?: boolean; msg?: string; data?: { id?: number }; id?: number };

      if (res?.error) {
        queryService.manageErrors(res);
        return;
      }

      const actionId = res?.data?.id ?? res?.id;
      if (!actionId) {
        alertService.present('Hallazgo SST', 'Se guardó, pero no se recibió el ID.');
        return;
      }
      navigation.navigate('PamolsaActionFormDetail', { actionId: Number(actionId) });
    } catch (e) {
      console.log(e);
      alertService.present('Error', 'No se pudo guardar el hallazgo.');
    } finally {
      await loadingService.dismiss();
    }
  };

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.bullets}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.bullet, slideIndex === i ? styles.bulletOn : null]} />
          ))}
        </View>

        {slideIndex === 0 ? (
          <>
            <Text style={styles.section}>Sección 1</Text>

            <Text style={styles.label}>Tipo</Text>
            <TouchableOpacity style={styles.field} onPress={() => setOpenRegisterType(true)} activeOpacity={0.88}>
              <Text style={styles.fieldTxt}>{registerType || 'Seleccionar'}</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Fecha y hora</Text>
            <TouchableOpacity style={styles.field} onPress={() => setShowRegisteredPicker(true)} activeOpacity={0.88}>
              <Text style={styles.fieldTxt}>{registeredDate.toLocaleString()}</Text>
            </TouchableOpacity>
            {showRegisteredPicker ? (
              <DateTimePicker
                value={registeredDate}
                mode="datetime"
                display="default"
                onChange={(_, d) => {
                  setShowRegisteredPicker(false);
                  if (d) setRegisteredDate(d);
                }}
              />
            ) : null}

            <Text style={styles.label}>Fuente</Text>
            <TouchableOpacity style={styles.field} onPress={() => setOpenTypeFuente(true)} activeOpacity={0.88}>
              <Text style={styles.fieldTxt}>{typeFuente || 'Seleccionar'}</Text>
            </TouchableOpacity>

            {(typeFuente === 'Inspeccion SST' || typeFuente === 'Eventos') ? (
              <>
                <Text style={styles.label}>Categoria</Text>
                <TouchableOpacity style={styles.field} onPress={() => setOpenInspection(true)} activeOpacity={0.88}>
                  <Text style={styles.fieldTxt}>
                    {inspectionItems.find((x) => String(x.id) === String(inspectionId))?.name ?? 'Seleccionar'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : null}

            <Text style={styles.label}>Planta / Local</Text>
            <TouchableOpacity style={styles.field} onPress={() => setOpenLocal(true)} activeOpacity={0.88}>
              <Text style={styles.fieldTxt}>{localName}</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Área</Text>
            <TouchableOpacity style={styles.field} onPress={() => setOpenArea(true)} activeOpacity={0.88} disabled={!localId}>
              <Text style={styles.fieldTxt}>{areaName}</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Responsable del área</Text>
            <TouchableOpacity
              style={styles.field}
              onPress={() => setOpenAreaResp(true)}
              activeOpacity={0.88}
              disabled={!areaId}
            >
              <Text style={styles.fieldTxt}>{areaRespName}</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Responsable de la inspección</Text>
            <View style={styles.field}>
              <Text style={styles.fieldTxt}>{inspectionResponsable || '—'}</Text>
            </View>
          </>
        ) : null}

        {slideIndex === 1 ? (
          <>
            <Text style={styles.section}>Detalle</Text>

            <Text style={styles.label}>Tabla de detalle</Text>
            {details.map((row, idx) => (
              <View key={`${idx}-${row.id ?? 'new'}`} style={styles.tableRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tableTitle} numberOfLines={2}>
                    {row.findings || '—'}
                  </Text>
                  <Text style={styles.tableMeta} numberOfLines={1}>
                    {(row.risk_level || '—') + ' · ' + (row.details?.length ? `${row.details.length} acción(es)` : '0 acción(es)')}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.smallBtn}
                  onPress={() => {
                    setDetailIndex(idx);
                    setDetailModalOpen(true);
                  }}
                >
                  <Text style={styles.smallBtnTxt}>Editar</Text>
                </TouchableOpacity>
                {!row.id ? (
                  <TouchableOpacity
                    style={[styles.smallBtn, styles.smallBtnDanger]}
                    onPress={() => setDetails((p) => p.filter((_, i) => i !== idx))}
                  >
                    <Text style={styles.smallBtnTxt}>Eliminar</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => {
                setDetailIndex(-1);
                setDetailModalOpen(true);
              }}
            >
              <Text style={styles.addBtnTxt}>Añadir registro</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Hallazgo reportado a</Text>
            <TextInput
              style={styles.area}
              value={inspectionResult}
              onChangeText={setInspectionResult}
              placeholder="Detalle"
              placeholderTextColor={COLORS.textMuted}
              multiline
            />
          </>
        ) : null}

        {slideIndex === 2 ? (
          <>
            <Text style={styles.section}>Responsable del registro</Text>

            <Text style={styles.label}>Nombre</Text>
            <View style={styles.field}>
              <Text style={styles.fieldTxt}>{registerResponsable || '—'}</Text>
            </View>

            <Text style={styles.label}>Cargo</Text>
            <TextInput
              style={styles.field}
              value={chargeResponsable}
              onChangeText={setChargeResponsable}
              placeholder="Cargo"
              placeholderTextColor={COLORS.textMuted}
            />

            <Text style={styles.label}>Fecha</Text>
            <View style={styles.field}>
              <Text style={styles.fieldTxt}>{new Date(responsableDate).toLocaleString()}</Text>
            </View>

            <Text style={styles.label}>Firma</Text>
            {signatureFlag && responsableSignUrl ? (
              <View style={styles.field}>
                <Text style={styles.fieldTxt}>Firma registrada</Text>
              </View>
            ) : (
              <SignaturePad
                onOK={setResponsableSignUrl}
              />
            )}
          </>
        ) : null}
      </ScrollView>

      <VirtualSelect
        visible={openRegisterType}
        title="Tipo"
        items={REGISTER_TYPES}
        selectedIds={registerType ? [registerType] : []}
        onClose={() => setOpenRegisterType(false)}
        onConfirm={(ids) => setRegisterType((ids[0] as string) ?? '')}
      />
      <VirtualSelect
        visible={openTypeFuente}
        title="Fuente"
        items={TYPE_FUENTE}
        selectedIds={typeFuente ? [typeFuente] : []}
        onClose={() => setOpenTypeFuente(false)}
        onConfirm={(ids) => {
          const next = (ids[0] as string) ?? '';
          setTypeFuente(next);
          // Anidado: si cambia fuente, limpiar categoria.
          setInspectionId('');
        }}
      />
      <VirtualSelect
        visible={openInspection}
        title="Categoria"
        items={inspectionItems}
        selectedIds={inspectionId ? [inspectionId] : []}
        onClose={() => setOpenInspection(false)}
        onConfirm={(ids) => setInspectionId(ids[0] ?? '')}
      />
      <VirtualSelect
        visible={openLocal}
        title="Planta / Local"
        items={locals}
        selectedIds={localId ? [localId] : []}
        onClose={() => setOpenLocal(false)}
        onConfirm={(ids) => {
          const next = ids[0] ?? '';
          setLocalId(next);
          // Anidados: limpiar dependientes
          setAreaId('');
          setAreaResponsableId('');
        }}
      />
      <VirtualSelect
        visible={openArea}
        title="Área"
        items={areas}
        selectedIds={areaId ? [areaId] : []}
        onClose={() => setOpenArea(false)}
        onConfirm={(ids) => {
          const next = ids[0] ?? '';
          setAreaId(next);
          setAreaResponsableId('');
        }}
      />
      <VirtualSelect
        visible={openAreaResp}
        title="Responsable del área"
        items={areaResponsables}
        selectedIds={areaResponsableId ? [areaResponsableId] : []}
        onClose={() => setOpenAreaResp(false)}
        onConfirm={(ids) => setAreaResponsableId(ids[0] ?? '')}
      />

      <PamolsaActionFormDetailModal
        visible={detailModalOpen}
        title="Hallazgos y/o observaciones"
        type={1}
        currentItem={detailIndex >= 0 ? details[detailIndex] : null}
        behaviorsTypes={(formService.behaviors_types as any[]) ?? []}
        areaResponsableId={areaResponsableId}
        areaResponsable={areaRespName}
        onClose={() => setDetailModalOpen(false)}
        onSave={(row) => {
          const r = row as PamolsaActionDetailRowType1;
          setDetails((p) => {
            const next = [...p];
            if (detailIndex === -1) next.push(r);
            else next[detailIndex] = r;
            return next;
          });
        }}
      />

      <View style={styles.footer}>
        {slideIndex === 0 ? (
          <TouchableOpacity style={[styles.footBtn, styles.negative]} onPress={() => navigation.goBack()}>
            <Text style={styles.footTxt}>Cancelar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.footBtn, styles.negative]}
            onPress={() => setSlideIndex((s) => (s === 0 ? 0 : ((s - 1) as any)))}
          >
            <Text style={styles.footTxt}>Anterior</Text>
          </TouchableOpacity>
        )}

        {slideIndex < 2 ? (
          <TouchableOpacity
            style={[styles.footBtn, styles.positive]}
            onPress={() => {
              const err = slideIndex === 0 ? validateSlide1() : validateSlide2();
              if (err) {
                alertService.present('Hallazgo SST', err);
                return;
              }
              setSlideIndex((s) => ((s + 1) as any));
            }}
          >
            <Text style={styles.footTxtOn}>Siguiente</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.footBtn, styles.positive]}
            onPress={() => {
              const err = validateSlide3();
              if (err) {
                alertService.present('Hallazgo SST', err);
                return;
              }
              void submit();
            }}
          >
            <Text style={styles.footTxtOn}>Enviar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.menuContentBg },
  body: { padding: 16, paddingBottom: 40 },
  bullets: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 6, marginBottom: 10 },
  bullet: { width: 10, height: 10, borderRadius: 10, backgroundColor: COLORS.lightGray },
  bulletOn: { backgroundColor: COLORS.primary },
  section: { marginTop: 8, fontSize: 16, fontWeight: '800', color: COLORS.text },
  label: { marginTop: 12, fontWeight: '700', color: COLORS.textLabel },
  field: {
    marginTop: 6,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
  fieldTxt: { color: COLORS.text, fontSize: 15 },
  area: {
    marginTop: 6,
    minHeight: 90,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    backgroundColor: COLORS.white,
    textAlignVertical: 'top',
    color: COLORS.text,
  },
  tableRow: {
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  tableTitle: { fontWeight: '800', color: COLORS.text },
  tableMeta: { marginTop: 2, color: COLORS.textMuted, fontSize: 12 },
  smallBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: COLORS.primary },
  smallBtnDanger: { backgroundColor: COLORS.danger },
  smallBtnTxt: { color: COLORS.white, fontWeight: '800', fontSize: 12 },
  addBtn: { marginTop: 12, padding: 12, borderRadius: 10, backgroundColor: COLORS.secondary, alignItems: 'center' },
  addBtnTxt: { color: COLORS.white, fontWeight: '800' },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
  footBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  negative: { backgroundColor: COLORS.lightGray },
  positive: { backgroundColor: COLORS.primary },
  footTxt: { color: COLORS.text, fontWeight: '800' },
  footTxtOn: { color: COLORS.white, fontWeight: '800' },
});

