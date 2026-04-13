import React, {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RouteProp } from "@react-navigation/native";
import {
    useFocusEffect,
    useNavigation,
    useRoute,
} from "@react-navigation/native";
import { COLORS } from "../../theme/colors";
import { formService } from "../../services/FormService";
import { queryService } from "../../services/QueryService";
import { alertService } from "../../services/AlertService";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import type { PamolsaActionHeaderListItem } from "../../interfaces/forms";
import { extractList } from "../../utils/formApiHelpers";
import { useFormStore } from "../../stores/formStore";
import { RecordsHeader } from "../../components/shared/RecordsHeader";
import {
    VirtualSelect,
    type VirtualSelectItem,
} from "../../components/shared/VirtualSelect";

type Nav = StackNavigationProp<RootStackParamList, "ListPamolsa">;
type ListRoute = RouteProp<RootStackParamList, "ListPamolsa">;

type BadgeKind = "default" | "pending" | "out_date" | "executed";

function pamolsaBadgeKind(item: PamolsaActionHeaderListItem): BadgeKind {
    const approved = Number(item.approved ?? 0);
    const status = Number(item.status ?? 0);
    const restart = Number(item.restart ?? 0);

    if (restart === 1) {
        if (approved === 0 && status === 0) return "pending";
        if (approved === 0 && status === 1) return "out_date";
        if (approved === 0 && status === 2) return "executed";
        return "default";
    }

    const approvedFlag = true;
    if (
        (approvedFlag && approved === 0 && status === 0) ||
        (!approvedFlag && status === 0)
    ) {
        return "pending";
    }
    if (
        (approvedFlag && approved === 0 && status === 1) ||
        (approvedFlag && approved === 3 && status === 0)
    ) {
        return "out_date";
    }
    if (approvedFlag && approved === 0 && status === 2) {
        return "executed";
    }
    return "default";
}

function pamolsaSecondaryLabel(
    item: PamolsaActionHeaderListItem,
): string | null {
    const approved = Number(item.approved ?? 0);
    const status = Number(item.status ?? 0);
    const restart = Number(item.restart ?? 0);
    const approvedFlag = restart === 0;

    if (restart === 1) {
        if (approved === 0 && status === 0) return "Pendiente";
        if (approved === 0 && status === 1) return "Fuera de fecha";
        if (approved === 0 && status === 2) return "Ejecutado";
        return null;
    }

    if (
        (approvedFlag && approved === 0 && status === 0) ||
        (!approvedFlag && status === 0)
    ) {
        return "Pendiente";
    }
    if (approvedFlag && approved === 3 && status === 0) return "Observado";
    if (approvedFlag && approved === 0 && status === 1) return "Fuera de fecha";
    if (approvedFlag && approved === 0 && status === 2) return "Ejecutado";
    return null;
}

// ✅ MEMOIZADO: Componente de tarjeta optimizado
const PamolsaInspectionCard = memo(function PamolsaInspectionCard({
    item,
}: {
    item: PamolsaActionHeaderListItem;
}) {
    const title = String(item.name ?? `Inspección #${item.id}`);
    const dateStr = item.created ?? "";
    const kind = pamolsaBadgeKind(item);
    const secondary = pamolsaSecondaryLabel(item);

    const badgeStyles =
        kind === "pending"
            ? [styles.dateBadge, styles.dateBadgePending]
            : kind === "out_date"
              ? [styles.dateBadge, styles.dateBadgeOut]
              : kind === "executed"
                ? [styles.dateBadge, styles.dateBadgeExecuted]
                : [styles.dateBadge];

    const accent = kind !== "default";

    return (
        <View style={styles.cardRow}>
            <View style={styles.iconWrap}>
                <Ionicons name="checkmark-circle" size={14} color="#3eaf75" />
            </View>
            <Text style={styles.cardTitle} numberOfLines={3}>
                {title}
            </Text>
            <View style={badgeStyles}>
                <Text
                    style={[
                        styles.dateLine,
                        accent ? styles.dateLineOnAccent : null,
                    ]}
                    numberOfLines={2}
                >
                    {dateStr}
                </Text>
                {secondary ? (
                    <Text
                        style={[
                            styles.statusLine,
                            accent ? styles.dateLineOnAccent : null,
                        ]}
                        numberOfLines={1}
                    >
                        {secondary}
                    </Text>
                ) : null}
            </View>
        </View>
    );
});

export function ListPamolsa() {
    const navigation = useNavigation<Nav>();
    const route = useRoute<ListRoute>();
    const [items, setItems] = useState<PamolsaActionHeaderListItem[]>([]);
    const [nextLastId, setNextLastId] = useState(0);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    /** Valor del selector (Ionic `ngModel`); no aplica al listado hasta «Filtrar». */
    const [areaPending, setAreaPending] = useState<string | number>("%");
    /** Último filtro aplicado (pull-to-refresh y focus usan este valor). */
    const [areaCommitted, setAreaCommitted] = useState<string | number>("%");
    const [areaPickerOpen, setAreaPickerOpen] = useState(false);
    const openedActiveRef = useRef(false);
    const areaCommittedRef = useRef<string | number>("%");
    areaCommittedRef.current = areaCommitted;

    const areas = useFormStore((s) => s.pamolsaAreas) as {
        id: number;
        name: string;
    }[];

    const areaItems: VirtualSelectItem[] = useMemo(
        () => [
            { id: "%", name: "Todos" },
            ...(areas ?? []).map((a) => ({ id: a.id, name: a.name })),
        ],
        [areas],
    );

    const areaDisplayName = useMemo(() => {
        const row = areaItems.find((a) => String(a.id) === String(areaPending));
        return row?.name ?? "Todos";
    }, [areaItems, areaPending]);

    const fetchPage = useCallback(
        async (opts: { reset: boolean }) => {
            const last_id = opts.reset ? 0 : nextLastId;
            if (!opts.reset && last_id === 0) {
                return;
            }
            const res = await formService.getPamolsaRecords({
                last_id,
                area_selected: areaCommitted,
            });
            if (res.error) {
                queryService.manageErrors(res);
                return;
            }
            const chunk = extractList<PamolsaActionHeaderListItem>(res, [
                "actions_header",
            ]);
            const cursor =
                typeof res.lastIteraction === "number"
                    ? res.lastIteraction
                    : chunk.length > 0
                      ? chunk[chunk.length - 1].id
                      : 0;

            if (opts.reset) {
                setItems(chunk);
                formService.actions_header = chunk;
            } else if (chunk.length) {
                setItems((prev) => {
                    const merged = [...prev, ...chunk];
                    formService.actions_header = merged;
                    return merged;
                });
            }
            useFormStore.getState().syncFromService();
            setNextLastId(cursor);
        },
        [nextLastId, areaCommitted],
    );

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;
            setLoading(true);
            setNextLastId(0);
            const ac = areaCommittedRef.current;
            void (async () => {
                try {
                    const res = await formService.getPamolsaRecords({
                        last_id: 0,
                        area_selected: ac,
                    });
                    if (cancelled) return;
                    if (res.error) {
                        queryService.manageErrors(res);
                        return;
                    }
                    const chunk = extractList<PamolsaActionHeaderListItem>(
                        res,
                        ["actions_header"],
                    );
                    const cursor =
                        typeof res.lastIteraction === "number"
                            ? res.lastIteraction
                            : chunk.length > 0
                              ? chunk[chunk.length - 1].id
                              : 0;
                    setItems(chunk);
                    setNextLastId(cursor);
                    formService.actions_header = chunk;
                    useFormStore.getState().syncFromService();
                } catch (e) {
                    console.log(e);
                } finally {
                    if (!cancelled) setLoading(false);
                }
            })();
            return () => {
                cancelled = true;
            };
        }, []),
    );

    const onRefresh = async () => {
        setRefreshing(true);
        setNextLastId(0);
        setAreaPending("%");
        setAreaCommitted("%");
        try {
            const res = await formService.getPamolsaRecords({
                last_id: 0,
                area_selected: "%",
            });
            if (res.error) {
                queryService.manageErrors(res);
                return;
            }
            const chunk = extractList<PamolsaActionHeaderListItem>(res, [
                "actions_header",
            ]);
            const cursor =
                typeof res.lastIteraction === "number"
                    ? res.lastIteraction
                    : chunk.length > 0
                      ? chunk[chunk.length - 1].id
                      : 0;
            setItems(chunk);
            setNextLastId(cursor);
            formService.actions_header = chunk;
            useFormStore.getState().syncFromService();
        } catch (e) {
            console.log(e);
        }
        setRefreshing(false);
    };

    // ✅ OPTIMIZADO: loadMore con prevención de llamadas duplicadas
    const loadMore = useCallback(async () => {
        if (loadingMore || !items.length || nextLastId === 0) {
            return;
        }
        setLoadingMore(true);
        try {
            await fetchPage({ reset: false });
        } catch (e) {
            console.log(e);
        }
        setLoadingMore(false);
    }, [loadingMore, items.length, nextLastId, fetchPage]);

    const applyFilter = async () => {
        setLoading(true);
        setNextLastId(0);
        setAreaCommitted(areaPending);
        try {
            const res = await formService.getPamolsaRecords({
                last_id: 0,
                area_selected: areaPending,
            });
            if (res.error) {
                queryService.manageErrors(res);
                return;
            }
            const chunk = extractList<PamolsaActionHeaderListItem>(res, [
                "actions_header",
            ]);
            const cursor =
                typeof res.lastIteraction === "number"
                    ? res.lastIteraction
                    : chunk.length > 0
                      ? chunk[chunk.length - 1].id
                      : 0;
            setItems(chunk);
            setNextLastId(cursor);
            formService.actions_header = chunk;
            useFormStore.getState().syncFromService();
        } catch (e) {
            console.log(e);
        }
        setLoading(false);
    };

    const openItem = useCallback(
        (item: PamolsaActionHeaderListItem, slideIndex?: number) => {
            const t = item.type;
            if (t === undefined || t === null || String(t).trim() === "") {
                if (item.form_id == null) {
                    alertService.present(
                        "Inspecciones",
                        "Este registro no tiene formulario asociado.",
                    );
                    return;
                }
                navigation.navigate("CanvasForm", {
                    formId: item.form_id,
                    formRecordId: item.id,
                });
                return;
            }
            const p = item.parameters;
            const headerId = p?.action_header_index ?? item.id;
            const slide =
                slideIndex !== undefined
                    ? slideIndex
                    : typeof p?.slide_index === "number"
                      ? p.slide_index
                      : undefined;
            navigation.navigate("PamolsaActionForm", {
                actionHeaderId: headerId,
                initialSlideIndex: slide,
            });
        },
        [navigation],
    );

    // ✅ OPTIMIZADO: Callback memoizado para manejar press
    const handleItemPress = useCallback(
        (item: PamolsaActionHeaderListItem) => {
            return () => openItem(item);
        },
        [openItem],
    );

    // ✅ OPTIMIZADO: RenderItem con useCallback - REFERENCIA ESTABLE
    const renderItem = useCallback(
        ({ item }: { item: PamolsaActionHeaderListItem }) => {
            return (
                <TouchableOpacity
                    style={styles.formContainer}
                    onPress={handleItemPress(item)}
                    activeOpacity={0.88}
                >
                    <PamolsaInspectionCard item={item} />
                </TouchableOpacity>
            );
        },
        [handleItemPress],
    );

    // ✅ OPTIMIZADO: KeyExtractor con useCallback - REFERENCIA ESTABLE
    const keyExtractor = useCallback((item: PamolsaActionHeaderListItem) => {
        return String(item.id);
    }, []);

    // ✅ OPTIMIZADO: ListFooterComponent con useMemo - REFERENCIA ESTABLE
    const ListFooterComponent = useMemo(() => {
        if (loadingMore && nextLastId !== 0) {
            return (
                <ActivityIndicator
                    style={styles.footerSpinner}
                    color={COLORS.primary}
                />
            );
        }
        return null;
    }, [loadingMore, nextLastId]);

    // ✅ OPTIMIZADO: ListEmptyComponent con useMemo - REFERENCIA ESTABLE
    const ListEmptyComponent = useMemo(
        () => <Text style={styles.empty}>No hay inspecciones.</Text>,
        [],
    );

    // ✅ OPTIMIZADO: contentContainerStyle con useMemo - REFERENCIA ESTABLE
    const contentContainerStyle = useMemo(() => styles.listContent, []);

    const activeAction = route.params?.active_action;

    useEffect(() => {
        if (
            activeAction == null ||
            openedActiveRef.current ||
            items.length === 0
        ) {
            return;
        }
        const record = items.find((r) => r.id === activeAction);
        if (record) {
            openedActiveRef.current = true;
            openItem(record);
        }
    }, [activeAction, items, openItem]);

    if (loading && !items.length) {
        return (
            <View style={styles.page}>
                <SafeAreaView style={styles.safeTop} edges={["top"]}>
                    <RecordsHeader
                        title="Registros Inspecciones"
                        onBack={() => navigation.goBack()}
                    />
                </SafeAreaView>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.page}>
            <SafeAreaView style={styles.safeTop} edges={["top"]}>
                <RecordsHeader
                    title="Registros Inspecciones"
                    onBack={() => navigation.goBack()}
                />
            </SafeAreaView>

            <View style={styles.filterBlock}>
                <Text style={styles.stackedLabel}>Filtro por Area</Text>
                <TouchableOpacity
                    style={styles.selectField}
                    onPress={() => setAreaPickerOpen(true)}
                    activeOpacity={0.88}
                >
                    <Text style={styles.selectFieldTxt}>{areaDisplayName}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.filterBtn}
                    onPress={() => void applyFilter()}
                    activeOpacity={0.88}
                >
                    <Text style={styles.filterBtnTxt}>Filtrar</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                style={styles.list}
                contentContainerStyle={contentContainerStyle}
                data={items}
                keyExtractor={keyExtractor}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }
                onEndReached={loadMore}
                onEndReachedThreshold={0.35}
                // 🚀 OPTIMIZACIONES DE RENDIMIENTO CLAVE
                maxToRenderPerBatch={10}
                windowSize={10}
                removeClippedSubviews={true}
                initialNumToRender={10}
                updateCellsBatchingPeriod={50}
                getItemLayout={(data, index) => ({
                    length: 80,
                    offset: 80 * index,
                    index,
                })}
                ListFooterComponent={ListFooterComponent}
                ListEmptyComponent={ListEmptyComponent}
                renderItem={renderItem}
            />

            <VirtualSelect
                visible={areaPickerOpen}
                title="Área"
                items={areaItems}
                selectedIds={[areaPending]}
                onClose={() => setAreaPickerOpen(false)}
                onConfirm={(ids) => {
                    setAreaPending(ids[0] ?? "%");
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    page: { flex: 1, backgroundColor: COLORS.menuContentBg },
    safeTop: {
        backgroundColor: COLORS.white,
    },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    filterBlock: {
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightGray,
        backgroundColor: COLORS.white,
    },
    stackedLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: COLORS.textLabel,
        marginBottom: 6,
    },
    selectField: {
        borderWidth: 1,
        borderColor: COLORS.lightGray,
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: COLORS.white,
        marginBottom: 10,
    },
    selectFieldTxt: { fontSize: 15, color: COLORS.text },
    filterBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: "center",
    },
    filterBtnTxt: { color: COLORS.white, fontWeight: "800", fontSize: 16 },
    list: { flex: 1 },
    listContent: { paddingBottom: 24 },
    footerSpinner: { marginVertical: 16 },
    empty: { textAlign: "center", marginTop: 48, color: COLORS.textMuted },
    formContainer: {
        paddingHorizontal: 12,
        marginBottom: 4,
    },
    cardRow: {
        alignContent: "center",
        alignItems: "center",
        backgroundColor: COLORS.white,
        borderColor: "#eaeef1",
        borderRadius: 7,
        borderStyle: "solid",
        borderWidth: 2,
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    iconWrap: {
        alignItems: "center",
        justifyContent: "center",
    },
    cardTitle: {
        color: "#505962",
        flex: 1,
        flexBasis: "50%",
        fontSize: 13,
        marginLeft: 8,
        textAlign: "left",
    },
    dateBadge: {
        borderColor: "#4c5155",
        borderRadius: 15,
        borderWidth: 1,
        flexBasis: 108,
        flexGrow: 0,
        flexShrink: 0,
        maxWidth: 108,
        padding: 5,
    },
    dateBadgePending: {
        backgroundColor: COLORS.warningYellow,
        borderColor: COLORS.warningYellow,
    },
    dateBadgeOut: {
        backgroundColor: COLORS.danger,
        borderColor: COLORS.danger,
    },
    dateBadgeExecuted: {
        backgroundColor: COLORS.successGreen,
        borderColor: COLORS.successGreen,
    },
    dateLine: {
        color: "#4c5155",
        fontSize: 10,
        fontWeight: "500",
        textAlign: "center",
    },
    dateLineOnAccent: {
        color: COLORS.white,
    },
    statusLine: {
        fontSize: 12,
        fontWeight: "500",
        marginTop: 2,
        textAlign: "center",
    },
});
