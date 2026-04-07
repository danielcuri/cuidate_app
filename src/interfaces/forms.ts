export interface FormsList {
    forms: Forms[];
    forms_records: FormsRecords[];
    actions: Action[];
    actions_executed: Action[];
    locals: any[];
    behaviors_types: any[];
    inspections: any[];
    actions_header: any[];
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
export interface FormsRecords {
    id: number;
    user_id: number;
    form_id: number;
    created: string;
    form: Forms;
    form_data: FormData;
    type: string;
    status: string;
    user: User
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