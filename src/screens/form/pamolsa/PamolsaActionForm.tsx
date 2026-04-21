import React, {
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { COLORS } from "../../../theme/colors";
import type { RootStackParamList } from "../../../navigation/AppNavigator";
import type { PamolsaActionHeaderListItem } from "../../../interfaces/forms";
import type { User as SessionUser } from "../../../interfaces/login";
import { formService } from "../../../services/FormService";
import { loadingService } from "../../../services/LoadingService";
import { queryService } from "../../../services/QueryService";
import { alertService } from "../../../services/AlertService";
import {
    VirtualSelect,
    type VirtualSelectItem,
} from "../../../components/shared/VirtualSelect";
import { userService } from "../../../services/UserService";
import { SignaturePad } from "../../../components/shared/SignaturePad";
import { RecordsHeader } from "../../../components/shared/RecordsHeader";
import {
    PamolsaActionFormDetailModal,
    type PamolsaActionDetailRowType1,
    type PamolsaActionDetailRowType2,
} from "./PamolsaActionFormDetailModal";

type Nav = StackNavigationProp<RootStackParamList, "PamolsaActionForm">;
type PamolsaFormRoute = RouteProp<RootStackParamList, "PamolsaActionForm">;

type SlideIx = 0 | 1 | 2 | 3;

type PamolsaInspection = { id: number | string; name: string; type?: string };

function mapRiskLevel(v: unknown): PamolsaActionDetailRowType1["risk_level"] {
    if (v === "Alto" || v === "Medio" || v === "Bajo") return v;
    return "";
}

function mapDetailSub(raw: unknown): PamolsaActionDetailRowType2 {
    const r = raw as Record<string, unknown>;
    const pd = r.proposed_date;
    let proposedDate = "";
    if (pd != null && pd !== "") {
        proposedDate = typeof pd === "string" ? pd : String(pd);
    }
    const ed = r.effective_date;
    const effectiveDate =
        ed != null && ed !== ""
            ? typeof ed === "string"
                ? ed
                : String(ed)
            : undefined;
    return {
        id: typeof r.id === "number" ? r.id : undefined,
        proposed_actions: String(r.proposed_actions ?? ""),
        area_responsable:
            typeof r.area_responsable === "string"
                ? r.area_responsable
                : undefined,
        area_responsable_id: r.area_responsable_id as
            | string
            | number
            | undefined,
        proposed_date: proposedDate || new Date().toISOString(),
        approved: typeof r.approved === "number" ? r.approved : undefined,
        effective_date: effectiveDate,
    };
}

function coalesceBehaviorId(v: unknown): string | number {
    if (typeof v === "string" || typeof v === "number") {
        return v;
    }
    return "";
}

/** Paridad Ionic `saveDataPamolsaAction`: ids numéricos cuando aplica. */
function behaviorIdForPamolsaApi(
    v: string | number,
): number | string | "" {
    if (v === "" || v == null) return "";
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    const s = String(v).trim();
    if (s === "") return "";
    const n = Number(s);
    return Number.isFinite(n) ? n : v;
}

function serializeNestedPamolsaRow(
    d: PamolsaActionDetailRowType2,
): Record<string, unknown> {
    const out: Record<string, unknown> = {
        findings: "",
        risk: "",
        consequence: "",
        risk_level: "",
        photos_url: [] as string[],
        proposed_actions: d.proposed_actions ?? "",
        area_responsable: d.area_responsable ?? "",
        area_responsable_id:
            d.area_responsable_id === "" ||
            d.area_responsable_id === undefined ||
            d.area_responsable_id === null
                ? ""
                : behaviorIdForPamolsaApi(
                      d.area_responsable_id as string | number,
                  ),
        proposed_date: d.proposed_date,
        effective_date: d.effective_date ?? "",
        pamolsa_behavior_type_id: "",
        pamolsa_behavior_id: "",
        details: [] as unknown[],
    };
    if (d.id !== undefined) out.id = d.id;
    if (d.approved !== undefined) out.approved = d.approved;
    return out;
}

/** Misma forma que Ionic `fieldsData.details[]` al enviar al API. */
function serializePamolsaDetailLevel1(
    row: PamolsaActionDetailRowType1,
    areaResponsable: string,
    areaResponsableId: string | number | "",
): Record<string, unknown> {
    const photos = row.photos_url ?? ["", ""];
    const out: Record<string, unknown> = {
        findings: row.findings,
        risk: row.risk,
        consequence: row.consequence ?? "",
        risk_level: row.risk_level,
        photos_url: [String(photos[0] ?? ""), String(photos[1] ?? "")],
        proposed_actions: "",
        area_responsable: areaResponsable,
        area_responsable_id:
            areaResponsableId === "" ||
            areaResponsableId === undefined ||
            areaResponsableId === null
                ? ""
                : behaviorIdForPamolsaApi(areaResponsableId as string | number),
        proposed_date: "",
        effective_date: "",
        pamolsa_behavior_type_id: behaviorIdForPamolsaApi(
            row.pamolsa_behavior_type_id,
        ),
        pamolsa_behavior_id: behaviorIdForPamolsaApi(row.pamolsa_behavior_id),
        details: (row.details ?? []).map(serializeNestedPamolsaRow),
    };
    if (row.id !== undefined) out.id = row.id;
    if (row.approved !== undefined) out.approved = row.approved;
    return out;
}

function mapDetailRow1(raw: unknown): PamolsaActionDetailRowType1 {
    const r = raw as Record<string, unknown>;
    const photos = r.photos_url;
    const nested = Array.isArray(r.details) ? r.details : [];
    const photoList = Array.isArray(photos)
        ? photos.filter((u): u is string => typeof u === "string")
        : [];
    const photos_url: [string, string] = [
        photoList[0] ?? "",
        photoList[1] ?? "",
    ];
    return {
        id: typeof r.id === "number" ? r.id : undefined,
        approved: typeof r.approved === "number" ? r.approved : undefined,
        findings: String(r.findings ?? ""),
        pamolsa_behavior_type_id: coalesceBehaviorId(
            r.pamolsa_behavior_type_id,
        ),
        pamolsa_behavior_id: coalesceBehaviorId(r.pamolsa_behavior_id),
        risk: String(r.risk ?? ""),
        consequence: String(r.consequence ?? ""),
        risk_level: mapRiskLevel(r.risk_level),
        photos_url,
        details: nested.map(mapDetailSub),
    };
}

/** Paridad `checkHasNewRecord` + `slider_limit` (Ionic). */
function pamolsaSliderState(
    recordId: number | undefined,
    details: PamolsaActionDetailRowType1[],
    approved: number,
    restart: number,
): { hasNew: boolean; sliderLimit: 3 | 4 } {
    if (recordId == null) {
        return { hasNew: false, sliderLimit: 3 };
    }
    const childrenNew = details.filter((e) => e.id === undefined);
    let hasNew = childrenNew.length > 0;
    if (hasNew) {
        return { hasNew: true, sliderLimit: 4 };
    }
    // Paridad Ionic: `approved` puede ser 0 (pendiente) o 3 (observado) y aún requiere slide de aprobación.
    if ((approved === 0 || approved === 3) && restart === 0) {
        return { hasNew: true, sliderLimit: 4 };
    }
    if (restart === 1 && (approved === 0 || approved === 3)) {
        return { hasNew: true, sliderLimit: 4 };
    }
    return { hasNew, sliderLimit: 3 };
}

// Paridad `pamolsa-action-form.page.html` (ion-radio-group register_type).
const REGISTER_TYPES: VirtualSelectItem[] = [
    { id: "Prevencion de Incendios", name: "Prevencion de Incendios" },
    { id: "Seguridad Industrial", name: "Seguridad Industrial" },
    { id: "Salud Ocupacional", name: "Salud Ocupacional" },
    { id: "Seguridad Patrimonial", name: "Seguridad Patrimonial" },
];

// Fuente (`type`) tal cual Ionic.
const TYPE_FUENTE: VirtualSelectItem[] = [
    { id: "Inspeccion SST", name: "Inspeccion SST" },
    { id: "Interacciones de SST", name: "Interacciones SST" },
    { id: "Eventos", name: "Eventos" },
    { id: "Monitoreo Ocupacionales", name: "Monitoreo Ocupacionales" },
    { id: "OCS", name: "OCS" },
    { id: "IPERC", name: "IPERC" },
    { id: "Aseguradoras", name: "Aseguradoras" },
    { id: "Otros", name: "Otros" },
    { id: "Seguridad Patrimonial", name: "Seguridad Patrimonial" },
];

function sessionUser(): SessionUser {
    return userService.user as SessionUser;
}

function hasRole98(): boolean {
    const roles = sessionUser().roles ?? [];
    return roles.indexOf("98") > -1;
}

export function PamolsaActionForm() {
    const navigation = useNavigation<Nav>();
    const route = useRoute<PamolsaFormRoute>();
    const hydratedHeaderIdRef = useRef<number | null>(null);

    const nowIso = useMemo(() => new Date().toISOString(), []);

    const [slideIndex, setSlideIndex] = useState<SlideIx>(0);

    const [recordId, setRecordId] = useState<number | undefined>(undefined);
    const [visualize, setVisualize] = useState(false);
    const [approved, setApproved] = useState(0);
    const [restart, setRestart] = useState(0);

    const [registerType, setRegisterType] = useState<string>("");
    const [registeredDate, setRegisteredDate] = useState<Date>(new Date());
    const [showRegisteredPicker, setShowRegisteredPicker] = useState(false);
    const [typeFuente, setTypeFuente] = useState<string>("");
    const [inspectionId, setInspectionId] = useState<string | number | "">("");
    const [localId, setLocalId] = useState<string | number | "">("");
    const [areaId, setAreaId] = useState<string | number | "">("");
    const [areaResponsableId, setAreaResponsableId] = useState<
        string | number | ""
    >("");
    const [inspectionResponsable, setInspectionResponsable] = useState<string>(
        sessionUser().name ?? "",
    );
    const [registerResponsable, setRegisterResponsable] = useState<string>(
        sessionUser().name ?? "",
    );

    const [openRegisterType, setOpenRegisterType] = useState(false);
    const [openTypeFuente, setOpenTypeFuente] = useState(false);
    const [openInspection, setOpenInspection] = useState(false);
    const [openLocal, setOpenLocal] = useState(false);
    const [openArea, setOpenArea] = useState(false);
    const [openAreaResp, setOpenAreaResp] = useState(false);

    const [details, setDetails] = useState<PamolsaActionDetailRowType1[]>([]);
    const [inspectionResult, setInspectionResult] = useState("");
    const [causes, setCauses] = useState("");
    /** Paridad Ionic `fieldsData.comment` (aprobación / observación). */
    const [comment, setComment] = useState("");
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [detailIndex, setDetailIndex] = useState<number>(-1);

    const [chargeResponsable, setChargeResponsable] = useState("");
    const [responsableDate, setResponsableDate] = useState<string>(nowIso);
    const sig = sessionUser().signature_url;
    const [responsableSignUrl, setResponsableSignUrl] = useState<string>(
        sig ?? "",
    );
    const [signatureFlag, setSignatureFlag] = useState<boolean>(Boolean(sig));

    const { sliderLimit, hasNew } = useMemo(
        () => pamolsaSliderState(recordId, details, approved, restart),
        [recordId, details, approved, restart],
    );

    /** Etiquetas por paso (paridad Ionic: Sección 1 / Detalle / Responsable / Aprobación). */
    const stepTitles = useMemo(() => {
        const steps = ["Sección 1", "Detalle", "Responsable del registro"];
        if (sliderLimit === 4) {
            steps.push("Aprobación");
        }
        return steps;
    }, [sliderLimit]);

    const fieldsLocked = approved === 1;

    useEffect(() => {
        const actionHeaderId = route.params?.actionHeaderId;
        if (actionHeaderId == null) {
            return;
        }
        if (hydratedHeaderIdRef.current === actionHeaderId) {
            return;
        }
        const list =
            formService.actions_header as PamolsaActionHeaderListItem[];
        const row = list.find((h) => h.id === actionHeaderId);
        if (!row) {
            alertService.present(
                "Hallazgo SST",
                "No se encontró el registro. Vuelva a la lista de inspecciones e intente de nuevo.",
            );
            return;
        }
        hydratedHeaderIdRef.current = actionHeaderId;
        setRecordId(row.id);
        setVisualize(true);
        setApproved(Number(row.approved ?? 0));
        setRestart(Number(row.restart ?? 0));

        if (row.register_type) {
            setRegisterType(String(row.register_type));
        }
        if (row.registered_date) {
            const d = new Date(String(row.registered_date));
            if (!Number.isNaN(d.getTime())) {
                setRegisteredDate(d);
            }
        }
        if (row.type) {
            setTypeFuente(String(row.type));
        }
        if (row.inspection_id != null) {
            setInspectionId(row.inspection_id);
        }
        if (row.local_id != null) {
            setLocalId(row.local_id);
        }
        if (row.area_id != null) {
            setAreaId(row.area_id);
        }
        if (row.area_responsable_id != null) {
            setAreaResponsableId(row.area_responsable_id);
        }
        if (row.inspection_result) {
            setInspectionResult(String(row.inspection_result));
        }
        if (row.causes) {
            setCauses(String(row.causes));
        }
        if (row.charge_responsable) {
            setChargeResponsable(String(row.charge_responsable));
        }
        if (row.responsable_date) {
            const s = String(row.responsable_date);
            const t = new Date(s).getTime();
            if (!Number.isNaN(t)) {
                setResponsableDate(new Date(s).toISOString());
            }
        }
        if (row.comment != null) {
            setComment(String(row.comment));
        }
        if (
            row.responsable_sign_url != null &&
            String(row.responsable_sign_url).length > 0
        ) {
            setResponsableSignUrl(String(row.responsable_sign_url));
            setSignatureFlag(true);
        }
        const u = row.user;
        if (
            Number(row.approved ?? 0) === 3 &&
            typeof row.comment === "string" &&
            row.comment
        ) {
            alertService.present("Observacion Presentada", String(row.comment));
        }
        const uname =
            u?.name ??
            row.inspection_responsable ??
            row.register_responsable ??
            sessionUser().name ??
            "";
        setInspectionResponsable(uname);
        setRegisterResponsable(
            row.register_responsable ?? u?.name ?? sessionUser().name ?? "",
        );

        const rawDetails = row.details;
        const mapped = Array.isArray(rawDetails)
            ? rawDetails.map(mapDetailRow1)
            : [];
        setDetails(mapped);

        const { sliderLimit: lim } = pamolsaSliderState(
            row.id,
            mapped,
            Number(row.approved ?? 0),
            Number(row.restart ?? 0),
        );
        const si = route.params?.initialSlideIndex;
        if (typeof si === "number" && si >= 0) {
            const max = lim - 1;
            const clamped = Math.min(Math.max(0, si), max) as SlideIx;
            setSlideIndex(clamped);
        }
    }, [route.params?.actionHeaderId, route.params?.initialSlideIndex]);

    useEffect(() => {
        const actionHeaderId = route.params?.actionHeaderId;
        if (actionHeaderId != null) {
            return;
        }
        setRegisterResponsable(sessionUser().name ?? "");
        setInspectionResponsable(sessionUser().name ?? "");
        if (sig) {
            setSignatureFlag(true);
            setResponsableSignUrl((prev) => {
                /** No sustituir una firma ya capturada en el lienzo (data URL) por la del perfil. */
                if (String(prev).trim().startsWith("data:")) return prev;
                return sig;
            });
        }
        /** No limpiar `responsableSignUrl` aquí: un `else` con `setResponsableSignUrl('')`
         * borraba la firma dibujada cuando el efecto se volvía a ejecutar (p. ej. al actualizar `sig`). */
    }, [route.params?.actionHeaderId, sig]);

    const onSignaturePadOK = (data: string) => {
        setResponsableSignUrl(data);
        setSignatureFlag(true);
    };

    useLayoutEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    const locals = useMemo(() => {
        const raw =
            (formService.locals as { id: number | string; name: string }[]) ??
            [];
        return raw.map((l) => ({
            id: l.id,
            name: l.name,
        })) as VirtualSelectItem[];
    }, []);

    const currentLocal = useMemo(() => {
        const loc = (formService.locals as Record<string, unknown>[])?.find(
            (l) => String(l.id) === String(localId),
        );
        return loc ?? null;
    }, [localId]);

    const areas = useMemo(() => {
        const raw =
            (currentLocal?.areas as {
                id: number | string;
                name: string;
                users?: unknown[];
            }[]) ?? [];
        return raw
            .slice()
            .sort((a, b) =>
                String(a.name ?? "").localeCompare(String(b.name ?? "")),
            )
            .map((a) => ({ id: a.id, name: a.name })) as VirtualSelectItem[];
    }, [currentLocal]);

    const currentArea = useMemo(() => {
        const a = (currentLocal?.areas as Record<string, unknown>[])?.find(
            (x) => String(x.id) === String(areaId),
        );
        return a ?? null;
    }, [currentLocal, areaId]);

    const areaResponsables = useMemo(() => {
        const raw =
            (currentArea?.users as { id: number | string; name: string }[]) ??
            [];
        return raw
            .slice()
            .sort((a, b) =>
                String(a.name ?? "").localeCompare(String(b.name ?? "")),
            )
            .map((u) => ({ id: u.id, name: u.name })) as VirtualSelectItem[];
    }, [currentArea]);

    const inspections = useMemo(() => {
        const raw = (formService.inspections as PamolsaInspection[]) ?? [];
        return raw.filter((x) => String(x.type ?? "") === String(typeFuente));
    }, [typeFuente]);

    const inspectionItems = useMemo(
        () =>
            inspections.map((x) => ({
                id: x.id,
                name: x.name,
            })) as VirtualSelectItem[],
        [inspections],
    );

    const localName = useMemo(
        () =>
            locals.find((l) => String(l.id) === String(localId))?.name ??
            "Seleccionar",
        [locals, localId],
    );
    const areaName = useMemo(
        () =>
            areas.find((a) => String(a.id) === String(areaId))?.name ??
            "Seleccionar",
        [areas, areaId],
    );
    const areaRespName = useMemo(
        () =>
            areaResponsables.find(
                (u) => String(u.id) === String(areaResponsableId),
            )?.name ?? "Seleccionar",
        [areaResponsables, areaResponsableId],
    );

    const canAddDetailRow =
        (!visualize && !(approved === 1)) ||
        (approved === 1 && restart === 1 && !visualize);

    const validateSlide0 = () => {
        if (!registerType) return "Seleccione tipo de registro.";
        if (!typeFuente) return "Seleccione Fuente.";
        if (
            (typeFuente === "Inspeccion SST" || typeFuente === "Eventos") &&
            !inspectionId
        )
            return "Seleccione Categoria.";
        if (!localId) return "Seleccione Planta / Local.";
        if (!areaId) return "Seleccione Área.";
        if (!areaResponsableId) return "Seleccione Responsable del área.";
        return null;
    };

    const validateSlide1 = () => {
        if (!details.length)
            return "Agregue al menos un registro en la tabla de detalle.";
        if (!inspectionResult.trim())
            return "Complete resultado de la inspección.";
        return null;
    };

    const validateSlide2 = () => {
        if (!chargeResponsable.trim()) return "Complete Cargo.";
        if (!String(responsableSignUrl ?? "").trim()) return "Registre firma.";
        return null;
    };

    const goNext = () => {
        const err =
            slideIndex === 0
                ? validateSlide0()
                : slideIndex === 1
                  ? validateSlide1()
                  : validateSlide2();
        if (err) {
            alertService.present("Hallazgo SST", err);
            return;
        }
        if (slideIndex < sliderLimit - 1) {
            setSlideIndex((s) => (s + 1) as SlideIx);
        }
    };

    const submit = async () => {
        if (sliderLimit === 4 && slideIndex === 3) {
            await sendPayload();
            return;
        }
        const err = validateSlide2();
        if (err) {
            alertService.present("Hallazgo SST", err);
            return;
        }

        await sendPayload();
    };

    const sendPayload = async () => {
        await loadingService.present();
        try {
            const detailsPayload = details.map((row) =>
                serializePamolsaDetailLevel1(row, areaRespName, areaResponsableId),
            );
            const payload: Record<string, unknown> = {
                register_type: registerType,
                registered_date: registeredDate.toISOString(),
                responsable_sign_url: responsableSignUrl,
                type: typeFuente,
                inspection_id:
                    typeFuente === "Inspeccion SST" || typeFuente === "Eventos"
                        ? inspectionId === "" || inspectionId == null
                            ? null
                            : inspectionId
                        : null,
                others_type: "",
                local_id: localId,
                area_id: areaId,
                area_responsable_id: areaResponsableId,
                area_responsable: areaRespName,
                inspection_responsable: inspectionResponsable,
                inspection_result: inspectionResult,
                causes: causes.trim() !== "" ? causes : "",
                register_responsable: registerResponsable,
                charge_responsable: chargeResponsable,
                responsable_date: responsableDate,
                details: detailsPayload,
                comment,
            };
            if (recordId != null) {
                payload.id = recordId;
                payload.approved = approved;
                payload.restart = restart;
            }
            // `console.log(payload)` muestra [Array]/[Object]; stringify expande anidados (firma puede ser muy larga).
            console.log(
                "[PamolsaActionForm] sendPayload",
                JSON.stringify(payload, null, 2),
            );
            const res = (await formService.saveDataPamolsaAction(payload)) as {
                error?: boolean;
                msg?: string;
                data?: { id?: number };
                id?: number;
            };

            if (res?.error) {
                queryService.manageErrors(res);
                return;
            }

            alertService.present("OK", "Registro envíado correctamente");
            navigation.navigate("ListPamolsa");
        } catch (e) {
            console.log(470);
            console.log(e);
            alertService.present("Error", "No se pudo guardar el hallazgo.");
        } finally {
            await loadingService.dismiss();
        }
    };

    const role98 = hasRole98();
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.page}>
            <SafeAreaView style={styles.safeTop} edges={["top"]}>
                <RecordsHeader
                    title="Hallazgo SST"
                    onBack={() => navigation.goBack()}
                />
            </SafeAreaView>
            <ScrollView contentContainerStyle={styles.body}>
                <View style={styles.stepIndicator}>
                    {stepTitles.map((label, i) => (
                        <View key={`${label}-${i}`} style={styles.stepItem}>
                            <View
                                style={[
                                    styles.bullet,
                                    slideIndex === i ? styles.bulletOn : null,
                                ]}
                            />
                            <Text
                                style={[
                                    styles.stepLabel,
                                    slideIndex === i
                                        ? styles.stepLabelActive
                                        : null,
                                ]}
                                numberOfLines={2}
                            >
                                {label}
                            </Text>
                        </View>
                    ))}
                </View>

                {slideIndex === 0 ? (
                    <>
                        <Text style={styles.label}>Tipo</Text>
                        <TouchableOpacity
                            style={[
                                styles.field,
                                fieldsLocked && styles.fieldDisabled,
                            ]}
                            onPress={() =>
                                !fieldsLocked && setOpenRegisterType(true)
                            }
                            activeOpacity={0.88}
                            disabled={fieldsLocked}
                        >
                            <Text style={styles.fieldTxt}>
                                {registerType || "Seleccionar"}
                            </Text>
                        </TouchableOpacity>

                        <Text style={styles.label}>Fecha y hora</Text>
                        <TouchableOpacity
                            style={[
                                styles.field,
                                fieldsLocked && styles.fieldDisabled,
                            ]}
                            onPress={() =>
                                !fieldsLocked && setShowRegisteredPicker(true)
                            }
                            activeOpacity={0.88}
                            disabled={fieldsLocked}
                        >
                            <Text style={styles.fieldTxt}>
                                {registeredDate.toLocaleString()}
                            </Text>
                        </TouchableOpacity>
                        {showRegisteredPicker && !fieldsLocked ? (
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
                        <TouchableOpacity
                            style={[
                                styles.field,
                                fieldsLocked && styles.fieldDisabled,
                            ]}
                            onPress={() =>
                                !fieldsLocked && setOpenTypeFuente(true)
                            }
                            activeOpacity={0.88}
                            disabled={fieldsLocked}
                        >
                            <Text style={styles.fieldTxt}>
                                {typeFuente || "Seleccionar"}
                            </Text>
                        </TouchableOpacity>

                        {typeFuente === "Inspeccion SST" ||
                        typeFuente === "Eventos" ? (
                            <>
                                <Text style={styles.label}>Categoria</Text>
                                <TouchableOpacity
                                    style={[
                                        styles.field,
                                        fieldsLocked && styles.fieldDisabled,
                                    ]}
                                    onPress={() =>
                                        !fieldsLocked && setOpenInspection(true)
                                    }
                                    activeOpacity={0.88}
                                    disabled={fieldsLocked}
                                >
                                    <Text style={styles.fieldTxt}>
                                        {inspectionItems.find(
                                            (x) =>
                                                String(x.id) ===
                                                String(inspectionId),
                                        )?.name ?? "Seleccionar"}
                                    </Text>
                                </TouchableOpacity>
                            </>
                        ) : null}

                        <Text style={styles.label}>Planta / Local</Text>
                        <TouchableOpacity
                            style={[
                                styles.field,
                                fieldsLocked && styles.fieldDisabled,
                            ]}
                            onPress={() => !fieldsLocked && setOpenLocal(true)}
                            activeOpacity={0.88}
                            disabled={fieldsLocked}
                        >
                            <Text style={styles.fieldTxt}>{localName}</Text>
                        </TouchableOpacity>

                        <Text style={styles.label}>Área</Text>
                        <TouchableOpacity
                            style={[
                                styles.field,
                                fieldsLocked && styles.fieldDisabled,
                            ]}
                            onPress={() => !fieldsLocked && setOpenArea(true)}
                            activeOpacity={0.88}
                            disabled={fieldsLocked || !localId}
                        >
                            <Text style={styles.fieldTxt}>{areaName}</Text>
                        </TouchableOpacity>

                        <Text style={styles.label}>Responsable del área</Text>
                        <TouchableOpacity
                            style={[
                                styles.field,
                                fieldsLocked && styles.fieldDisabled,
                            ]}
                            onPress={() =>
                                !fieldsLocked && setOpenAreaResp(true)
                            }
                            activeOpacity={0.88}
                            disabled={fieldsLocked || !areaId}
                        >
                            <Text style={styles.fieldTxt}>{areaRespName}</Text>
                        </TouchableOpacity>

                        <Text style={styles.label}>
                            Responsable de la inspección
                        </Text>
                        <View style={styles.field}>
                            <Text style={styles.fieldTxt}>
                                {inspectionResponsable || "—"}
                            </Text>
                        </View>
                    </>
                ) : null}

                {slideIndex === 1 ? (
                    <>
                        <Text style={styles.section}>Detalle</Text>

                        <Text style={styles.label}>Hallazgos</Text>
                        {details.map((row, idx) => (
                            <View
                                key={`${idx}-${row.id ?? "new"}`}
                                style={styles.tableRow}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.tableTitle}>
                                        {row.findings || "—"}
                                    </Text>
                                    <Text
                                        style={styles.tableMeta}
                                        numberOfLines={1}
                                    >
                                        {(row.risk_level || "—") +
                                            " · " +
                                            (row.details?.length
                                                ? `${row.details.length} acción(es)`
                                                : "0 acción(es)")}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.smallBtn}
                                    onPress={() => {
                                        setDetailIndex(idx);
                                        setDetailModalOpen(true);
                                    }}
                                >
                                    <Text style={styles.smallBtnTxt}>
                                        Editar
                                    </Text>
                                </TouchableOpacity>
                                {!visualize && !row.id ? (
                                    <TouchableOpacity
                                        style={[
                                            styles.smallBtn,
                                            styles.smallBtnDanger,
                                        ]}
                                        onPress={() =>
                                            setDetails((p) =>
                                                p.filter((_, i) => i !== idx),
                                            )
                                        }
                                    >
                                        <Text style={styles.smallBtnTxt}>
                                            Eliminar
                                        </Text>
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                        ))}
                        {canAddDetailRow ? (
                            <TouchableOpacity
                                style={styles.addBtn}
                                onPress={() => {
                                    setDetailIndex(-1);
                                    setDetailModalOpen(true);
                                }}
                            >
                                <Text style={styles.addBtnTxt}>
                                    Añadir registro
                                </Text>
                            </TouchableOpacity>
                        ) : null}

                        <Text style={styles.label}>
                            Resultado de la inspección
                        </Text>
                        <TextInput
                            style={[
                                styles.area,
                                fieldsLocked && styles.fieldDisabled,
                            ]}
                            value={inspectionResult}
                            onChangeText={setInspectionResult}
                            placeholder="Detalle"
                            placeholderTextColor={COLORS.textMuted}
                            multiline
                            editable={!fieldsLocked}
                        />
                    </>
                ) : null}

                {slideIndex === 2 ? (
                    <>
                        <Text style={styles.section}>
                            Responsable del registro
                        </Text>

                        <Text style={styles.label}>Nombre</Text>
                        <View style={styles.field}>
                            <Text style={styles.fieldTxt}>
                                {registerResponsable || "—"}
                            </Text>
                        </View>

                        <Text style={styles.label}>Cargo</Text>
                        <TextInput
                            style={[
                                styles.field,
                                fieldsLocked && styles.fieldDisabled,
                            ]}
                            value={chargeResponsable}
                            onChangeText={setChargeResponsable}
                            placeholder="Cargo"
                            placeholderTextColor={COLORS.textMuted}
                            editable={!fieldsLocked}
                        />

                        <Text style={styles.label}>Fecha</Text>
                        <View style={styles.field}>
                            <Text style={styles.fieldTxt}>
                                {new Date(responsableDate).toLocaleString()}
                            </Text>
                        </View>

                        <Text style={styles.label}>Firma</Text>
                        {signatureFlag && responsableSignUrl ? (
                            <View style={styles.sigWrap}>
                                <Image
                                    source={{ uri: responsableSignUrl }}
                                    style={styles.sigImg}
                                    resizeMode="contain"
                                />
                            </View>
                        ) : (
                            <SignaturePad onOK={onSignaturePadOK} />
                        )}
                    </>
                ) : null}

                {slideIndex === 3 && recordId != null && hasNew ? (
                    <>
                        <Text style={styles.section}>Aprobación</Text>
                        <Text style={styles.label}>Estado</Text>
                        <View style={styles.segRow}>
                            {!role98 ? (
                                <TouchableOpacity
                                    style={[
                                        styles.segBtn,
                                        styles.segYellow,
                                        approved === 0 && styles.segOn,
                                    ]}
                                    onPress={() => setApproved(0)}
                                >
                                    <Text style={styles.segTxt}>Pendiente</Text>
                                </TouchableOpacity>
                            ) : null}
                            <TouchableOpacity
                                style={[
                                    styles.segBtn,
                                    styles.segGreen,
                                    approved === 1 && styles.segOn,
                                ]}
                                onPress={() => role98 && setApproved(1)}
                                disabled={!role98}
                            >
                                <Text style={styles.segTxt}>Aprobado</Text>
                            </TouchableOpacity>
                            {role98 ? (
                                <TouchableOpacity
                                    style={[
                                        styles.segBtn,
                                        styles.segRed,
                                        approved === 2 && styles.segOn,
                                    ]}
                                    onPress={() => setApproved(2)}
                                >
                                    <Text style={styles.segTxt}>Anulado</Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                        <Text style={styles.label}>Observación</Text>
                        <TextInput
                            style={styles.area}
                            value={comment}
                            onChangeText={setComment}
                            placeholder="Comentario de aprobación u observación"
                            placeholderTextColor={COLORS.textMuted}
                            multiline
                        />
                    </>
                ) : null}
            </ScrollView>

            <VirtualSelect
                visible={openRegisterType}
                title="Tipo"
                items={REGISTER_TYPES}
                selectedIds={registerType ? [registerType] : []}
                onClose={() => setOpenRegisterType(false)}
                onConfirm={(ids) => setRegisterType((ids[0] as string) ?? "")}
            />
            <VirtualSelect
                visible={openTypeFuente}
                title="Fuente"
                items={TYPE_FUENTE}
                selectedIds={typeFuente ? [typeFuente] : []}
                onClose={() => setOpenTypeFuente(false)}
                onConfirm={(ids) => {
                    const next = (ids[0] as string) ?? "";
                    setTypeFuente(next);
                    // Anidado: si cambia fuente, limpiar categoria.
                    if (!(next === "Inspeccion SST" || next === "Eventos")) {
                        setInspectionId("");
                    }
                }}
            />
            <VirtualSelect
                visible={openInspection}
                title="Categoria"
                items={inspectionItems}
                selectedIds={inspectionId ? [inspectionId] : []}
                onClose={() => setOpenInspection(false)}
                onConfirm={(ids) => setInspectionId(ids[0] ?? "")}
            />
            <VirtualSelect
                visible={openLocal}
                title="Planta / Local"
                items={locals}
                selectedIds={localId ? [localId] : []}
                onClose={() => setOpenLocal(false)}
                onConfirm={(ids) => {
                    const next = ids[0] ?? "";
                    setLocalId(next);
                    setAreaId("");
                    setAreaResponsableId("");
                }}
            />
            <VirtualSelect
                visible={openArea}
                title="Área"
                items={areas}
                selectedIds={areaId ? [areaId] : []}
                onClose={() => setOpenArea(false)}
                onConfirm={(ids) => {
                    const next = ids[0] ?? "";
                    setAreaId(next);
                    setAreaResponsableId("");
                }}
            />
            <VirtualSelect
                visible={openAreaResp}
                title="Responsable del área"
                items={areaResponsables}
                selectedIds={areaResponsableId ? [areaResponsableId] : []}
                onClose={() => setOpenAreaResp(false)}
                onConfirm={(ids) => setAreaResponsableId(ids[0] ?? "")}
            />

            <PamolsaActionFormDetailModal
                visible={detailModalOpen}
                title="Hallazgos y/o observaciones"
                type={1}
                restart={restart}
                visualize={visualize}
                currentItem={detailIndex >= 0 ? details[detailIndex] : null}
                behaviorsTypes={
                    (formService.behaviors_types ?? []) as {
                        id: number | string;
                        name: string;
                        behaviors: { id: number | string; name: string }[];
                    }[]
                }
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

            <View
                style={[styles.footer, { paddingBottom: 12 + insets.bottom }]}
            >
                {slideIndex === 0 ? (
                    <TouchableOpacity
                        style={[styles.footBtn, styles.negative]}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.footTxt}>Cancelar</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.footBtn, styles.negative]}
                        onPress={() => setSlideIndex((s) => (s - 1) as SlideIx)}
                    >
                        <Text style={styles.footTxt}>Anterior</Text>
                    </TouchableOpacity>
                )}

                {slideIndex < sliderLimit - 1 ? (
                    <TouchableOpacity
                        style={[styles.footBtn, styles.positive]}
                        onPress={() => void goNext()}
                    >
                        <Text style={styles.footTxtOn}>Siguiente</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.footBtn, styles.positive]}
                        onPress={() => void submit()}
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
    safeTop: { backgroundColor: COLORS.white },
    body: { padding: 16, paddingBottom: 40 },
    stepIndicator: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginTop: 8,
        marginBottom: 4,
        paddingHorizontal: 4,
        gap: 4,
    },
    stepItem: { flex: 1, minWidth: 0, alignItems: "center" },
    bullet: {
        width: 10,
        height: 10,
        borderRadius: 6,
        backgroundColor: COLORS.lightGray,
        marginBottom: 6,
    },
    bulletOn: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: COLORS.primary,
        borderWidth: 2,
        borderColor: COLORS.white,
        marginBottom: 4,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 4,
        elevation: 3,
    },
    stepLabel: {
        fontSize: 10,
        lineHeight: 13,
        textAlign: "center",
        color: COLORS.textMuted,
        fontWeight: "600",
    },
    stepLabelActive: { color: COLORS.primary, fontWeight: "800" },
    stepCurrent: {
        textAlign: "center",
        fontSize: 13,
        fontWeight: "800",
        color: COLORS.text,
        marginBottom: 12,
    },
    section: {
        marginTop: 8,
        fontSize: 16,
        fontWeight: "800",
        color: COLORS.text,
    },
    label: { marginTop: 12, fontWeight: "700", color: COLORS.textLabel },
    field: {
        marginTop: 6,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.lightGray,
        backgroundColor: COLORS.white,
    },
    fieldDisabled: { opacity: 0.55 },
    fieldTxt: { color: COLORS.text, fontSize: 15 },
    area: {
        marginTop: 6,
        minHeight: 90,
        borderWidth: 1,
        borderColor: COLORS.lightGray,
        borderRadius: 8,
        padding: 12,
        backgroundColor: COLORS.white,
        textAlignVertical: "top",
        color: COLORS.text,
    },
    tableRow: {
        marginTop: 10,
        padding: 12,
        borderRadius: 10,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.lightGray,
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
    },
    tableTitle: { fontWeight: "800", color: COLORS.text },
    tableMeta: { marginTop: 2, color: COLORS.textMuted, fontSize: 12 },
    smallBtn: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: COLORS.primary,
    },
    smallBtnDanger: { backgroundColor: COLORS.danger },
    smallBtnTxt: { color: COLORS.white, fontWeight: "800", fontSize: 12 },
    addBtn: {
        marginTop: 12,
        padding: 12,
        borderRadius: 10,
        backgroundColor: COLORS.secondary,
        alignItems: "center",
    },
    addBtnTxt: { color: COLORS.white, fontWeight: "800" },
    sigWrap: {
        marginTop: 8,
        minHeight: 120,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.lightGray,
        backgroundColor: COLORS.white,
        overflow: "hidden",
    },
    sigImg: { width: "100%", height: 180 },
    segRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 },
    segBtn: {
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 8,
        minWidth: 100,
        alignItems: "center",
    },
    segYellow: { backgroundColor: "#f4d03f" },
    segGreen: { backgroundColor: "#3eaf75" },
    segRed: { backgroundColor: COLORS.danger },
    segOn: { borderWidth: 2, borderColor: COLORS.text },
    segTxt: { fontWeight: "800", color: COLORS.text },
    footer: {
        flexDirection: "row",
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
        alignItems: "center",
    },
    negative: { backgroundColor: COLORS.lightGray },
    positive: { backgroundColor: COLORS.primary },
    footTxt: { color: COLORS.text, fontWeight: "800" },
    footTxtOn: { color: COLORS.white, fontWeight: "800" },
});
