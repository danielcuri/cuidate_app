export interface FormsList {
    forms: Forms[];
    forms_records: FormsRecords[];
    actions: Action[];
    actions_executed: Action[];
    locals: any[];
    behaviors_types: any[];
    inspections: any[];
    actions_header: PamolsaActionHeaderListItem[];
    fieldsToValidate: FieldsValidation;
    user: User;
    fab_data: FabData;
    header_data: HeaderData;
    users:User[];
    pamolsaAreas : Area[];
    forms_titles : Titles[];
    lastIteraction?:number;
    showPamolsa:boolean;
}
export interface Titles {
    id : number;
    name : string;
}
export interface Area {
    id: number;
    name: string;
}
/** Fila devuelta en `forms_records[].form_data` por POST `/getRecords` (estructura anidada flexible). */
export interface FormRecordDatum {
    id: number;
    form_code_id: number | null;
    form_element_id: number;
    value: string | null;
    data: unknown;
}

/** Respuesta POST `/getRecords` (paridad Ionic `FormService.getListRecords`). */
export interface GetRecordsResponse {
    forms_records?: FormsRecords[];
    /** Cursor para la siguiente página (0 = sin más datos). Nombre con typo histórico en backend. */
    lastIteraction?: number;
    error?: boolean;
    msg?: string;
}

/** Fila `formatCard[]` en POST `/getListEffectiveness` → `actions_executed[]`. */
export interface EffectivenessFormatCardRow {
    left: string;
    right: string;
}

/** Resumen de `parent` en ítems de eficacia (lista / detalle). Ver `EndpointEffectiveness.md`. */
export interface EffectivenessParentSummary {
    id?: number;
    risk_level?: string | null;
    pamolsa_action_id?: number | null;
}

/**
 * Ítem de `actions_executed[]` en POST `/getListEffectiveness`.
 * Ver `docs/EndpointEffectiveness.md`.
 */
export interface EffectivenessListItem {
    id: number;
    proposed_actions?: string | null;
    effective_date?: string | null;
    formatCard?: EffectivenessFormatCardRow[];
    parent?: EffectivenessParentSummary | null;
    status?: number | null;
    approved?: number | null;
    comments_effectiveness?: string | null;
    photos_url_effectiveness?: string[] | null;
    effective_flag?: number | null;
}

/** Body POST `/saveDataPamolsaEffectiveness` (paridad Ionic `CreateEffectivenessPage.fieldsData`). */
export interface SavePamolsaEffectivenessPayload {
    pamolsa_action_detail_id: number;
    effective_flag: number;
    comments: string;
    photos: string[];
    effective_date: string;
}

/** Body POST `/getListEffectiveness` (paridad Ionic `EffectivenessPage`). */
export interface GetListEffectivenessPayload {
    last_id: number;
    user_selected: string | number;
    area_selected: string | number;
    status_id: string | number;
    content: string;
}

/** Respuesta POST `/getListEffectiveness`. */
export interface GetListEffectivenessResponse {
    actions_executed?: EffectivenessListItem[];
    lastIteraction?: number;
    current_date?: string;
    status_id?: string;
    error?: boolean;
    msg?: string;
}

/** Parámetros de navegación asociados a una fila de `actions_header` (Ionic `router.navigate([page, parameters])`). */
export interface PamolsaActionHeaderParameters {
    action_header_index?: number;
    slide_index?: number;
}

/**
 * Fila de POST `/getPamolsaRecords` → `actions_header[]` (inspecciones / hallazgos Pamolsa).
 * Campos alineados con la respuesta documentada en `docs/PamolsaView.md`.
 */
export interface PamolsaActionHeaderListItem {
    id: number;
    user_id?: number;
    register_number?: string;
    registered_date?: string;
    turn?: string | null;
    type?: string | null;
    name?: string;
    created?: string;
    form_id?: number;
    restart?: number;
    approved?: number;
    status?: number;
    page?: string;
    comment?: string | null;
    parameters?: PamolsaActionHeaderParameters;
    register_type?: string;
    inspection_id?: number | null;
    local_id?: number | null;
    area_id?: number | null;
    area_responsable_id?: number | null;
    inspection_result?: string | null;
    causes?: string | null;
    charge_responsable?: string | null;
    responsable_sign_url?: string | null;
    responsable_date?: string | null;
    /** Origen Ionic: fila completa incluye `user` al editar desde lista. */
    inspection_responsable?: string | null;
    register_responsable?: string | null;
    others_type?: string | null;
    user?: User;
    details?: unknown;
}

/** Respuesta POST `/getPamolsaRecords`. */
export interface GetPamolsaRecordsResponse {
    actions_header?: PamolsaActionHeaderListItem[];
    lastIteraction?: number;
    last_idssss?: number | null;
    user?: User;
    error?: boolean;
    msg?: string;
}

export interface FormsRecords {
    id: number;
    user_id?: number;
    form_id: number;
    created?: string;
    created_at?: string;
    form: Forms;
    form_data?: FormRecordDatum[] | FormData;
    type?: string;
    status?: number | string;
    user?: User;
}

export interface Forms {
    id: number;
    name?: any;
    form_sections?: FormSection[],
    databases: any[];
}

export interface FormData {
    id: number;
    form_code_id: number;
    form_element_id: number;
    form_data_id?: number;
    value: any;
    data: FormData[]
}

export interface FormSection {
    id: number;
    form_id: number;
    position: number;
    name: string;
    list: FormDesign[]
}

export interface FormDesign {
    id: number;
    form_section_id: number;
    form_element_id?: number;
    field_type_id: number;
    position: number;
    label: string;
    html: string;
    properties: Properties;
    extra_data: ExtraData[];
    columns: FormDesign[];
    default_value: string;
    db_data_id?: number;
}

export interface Properties {
    required: number;
    step: number;
    max_value: number;
    min_value: number;
    active_range: number;
    list_properties?: any;
}

export interface ExtraData {
    id: number;
    form_element_id: number;
    name: string;
    position: number;
}

export interface Action {
    id: number;
    pamolsa_action_id?: number | null;
    pamolsa_action_detail_id?: number | null;
    findings?: string | null;
    type?: string | null;
    pamolsa_behavior_type_id?: number | null;
    pamolsa_behavior_id?: number | null;
    other_behavior?: string | null;
    risk?: string | null;
    consequence?: string | null;
    risk_level?: string | null;
    photos_url?: string[];
    proposed_actions?: string | null;
    comments_effectiveness?: string | null;
    effective_flag?: number | null;
    photos_url_effectiveness?: string[] | null;
    area_responsable?: string | null;
    area_responsable_id?: number | null;
    proposed_date?: string | null;
    proposed_date_modified?: string | null;
    effective_date?: string | null;
    status?: number | null;
    approved?: number | null;
    created_at?: string | null;
    updated_at?: string | null;
    deleted_at?: string | null;
    /** Render helpers devueltos por backend (paridad Ionic `app-card`). */
    formatCard?: { left: string; right: string }[];
    tracings?: ActionTracing[];
    responsable?: User | null;
    parent?: ActionParent | null;
}

export interface ActionTracing {
    registered_date?: string | null;
    pamolsa_action_detail_id?: number | null;
    proposed_date?: string | null;
    execution_date?: string | null;
    status?: number | null;
    comments?: string | null;
    photos?: string[];
}

export interface ActionParent {
    id: number;
    pamolsa_action_id?: number | null;
    risk_level?: string | null;
    findings?: string | null;
    status?: number | null;
    approved?: number | null;
    created_at?: string | null;
    updated_at?: string | null;
    behavior_type?: { id: number; name?: string | null } | null;
    behavior?: { id: number; name?: string | null } | null;
    action?: {
        id: number;
        register_number?: string | null;
        registered_date?: string | null;
        type?: string | null;
        local_id?: number | null;
        area_id?: number | null;
        user_id?: number | null;
        user?: User | null;
        area?: { id: number; name?: string | null } | null;
    } | null;
}
export interface User {
    id: number;
    name: string;
    email: string;
    signature_url?: string;
    roles?: string[];
}

export interface FieldsValidation {
   general: GeneralValidation[];
   table: GeneralValidation[];
}

export interface GeneralValidation {
   section: Number;
   fields: FieldData[];
}

export interface FieldData {
   type: string;
   name: string;
   index?: Number;
   required?: string;
   value?: string;
}

export interface FabData {
    show_fab: boolean;
    fab_url: string;
    title: string;
}

export interface HeaderData {
    show_header: boolean;
}

export interface FormLocalSaved {
    id: number;
    form_id: number;
    name : string;
    user_id: number;
    created: string;
    fields : any;
    form_data_ids : any;
    rows_deleted : [];
    status: number;
}