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
    pamolsa_action_id: number;
    findings: string;
    type: string;
    corresponds: string;
    risk: string;
    consequence: string;
    risk_level?: string;
    photos_url: string[];
    proposed_actions: string;
    responsable: string;
    proposed_date: string;
    created_at: string;
    updated_at: string;
    deleted_at?: any;
    laravel_through_key: number;
    action:ExtraAction;
    parent: Action;
}
export interface ExtraAction{
    area_id:string;
    user_id : string;
}
export interface User {
    id: number;
    name: string;
    email: string;
    signature_url: string;
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