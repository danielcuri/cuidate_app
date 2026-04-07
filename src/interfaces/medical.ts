export interface MedicalAnswer {
  error: boolean;
  recordsRest?: MedicalRest[];
  areas?: Area[];
}
export interface MedicalRest {
  id: number;
  topic: string;
  date_init_topic: string;
  date_init: string;
  date_end: string;
  state: string;
  emit_place: string;
  reason: string;
  doctor_name: string;
  post_reason: string;
}
export interface MedicalUser {
  id: number;
  dni: string;
  rest_day: number;
}

/** Payload enviado a `/saveData` (paridad Ionic `form-rest`). */
export interface MedicalFormRestPayload {
  dni: string;
  topic: string;
  date_init: string;
  date_end: string;
  date_init_topic: string;
  url_cert: string;
  url_prescription: string;
  url_medical_consult: string;
  url_payment: string;
}
export interface Area {
  id: number;
  name: string;
}
