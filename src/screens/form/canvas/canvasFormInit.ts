import moment from 'moment-timezone';
import type { FormDesign, Forms, FormRecordDatum, FormsRecords } from '../../../interfaces/forms';

export type FormDataShape = {
  id: string;
  form_id: string;
  user_id: string | number;
  fields: Record<number, unknown>;
  form_data_ids: Record<number, unknown>;
  rows_deleted: unknown[];
  status: number;
  created?: string;
  name?: string;
};

export type UserCtx = {
  id: number | string;
  name: string;
  signatureUrl: string;
};

export type InitMeta = {
  gpsFieldIds: number[];
  canvasFieldIds: number[];
  signatureCanvasFieldIds: number[];
};

/** Paridad `initValuesWORecord` (Ionic `canvas-form.page.ts`). */
export function initEmptyFormState(form: Forms, ctx: UserCtx): {
  formData: FormDataShape;
  meta: InitMeta;
} {
  moment.tz.setDefault('America/Lima');
  const fields: Record<number, unknown> = {};
  const form_data_ids: Record<number, unknown> = {};
  const gpsFieldIds: number[] = [];
  const canvasFieldIds: number[] = [];
  const signatureCanvasFieldIds: number[] = [];

  const sections = form.form_sections ?? [];

  const walk = (element: FormDesign) => {
    form_data_ids[element.id] = null;
    const ft = element.field_type_id;
    const lp = element.properties?.list_properties;

    if (ft === 13) {
      fields[element.id] = [];
      form_data_ids[element.id] = { id: '', fields: [] };
      return;
    }

    if (ft === 14) {
      fields[element.id] = ctx.name;
      return;
    }

    if (ft === 15) {
      fields[element.id] = ctx.signatureUrl || '';
      if (!fields[element.id]) {
        signatureCanvasFieldIds.push(element.id);
      }
      return;
    }

    if (ft === 4) {
      if (element.db_data_id != null && lp?.database_flag && lp?.database_id) {
        fields[element.id] = '';
      } else {
        fields[element.id] = lp?.list_type === '2' ? [] : '';
      }
      return;
    }

    if (ft === 16) {
      fields[element.id] = [];
      return;
    }

    if (ft === 9) {
      fields[element.id] = false;
      return;
    }

    if (ft === 11) {
      fields[element.id] = element.default_value || '';
      return;
    }

    if (ft === 1 || ft === 2 || ft === 3 || ft === 5 || ft === 6 || ft === 7 || ft === 8) {
      fields[element.id] = element.default_value ? element.default_value : '';
      if (ft === 5) {
        gpsFieldIds.push(element.id);
      }
      if (ft === 8) {
        canvasFieldIds.push(element.id);
      }
      return;
    }

    if (ft === 10 || ft === 12) {
      fields[element.id] = moment().toISOString();
      return;
    }

    fields[element.id] = '';
  };

  for (const section of sections) {
    for (const element of section.list) {
      walk(element);
    }
  }

  const formData: FormDataShape = {
    id: '',
    form_id: String(form.id),
    user_id: ctx.id,
    fields,
    form_data_ids,
    rows_deleted: [],
    status: 0,
  };

  return {
    formData,
    meta: { gpsFieldIds, canvasFieldIds, signatureCanvasFieldIds },
  };
}

export function buildDbArrays(form: Forms): Record<number, unknown[]> {
  const out: Record<number, unknown[]> = {};
  const dbs = form.databases ?? [];
  for (const section of form.form_sections ?? []) {
    for (const item of section.list) {
      if (item.db_data_id == null) {
        continue;
      }
      const dbIdx = dbs.findIndex((d: { id: number }) => d.id === item.db_data_id);
      if (dbIdx < 0) {
        out[item.id] = [];
        continue;
      }
      const db = dbs[dbIdx] as { data?: Record<string, unknown>[] };
      const lp = item.properties?.list_properties as { column_related?: string } | undefined;
      const col = lp?.column_related;
      if (!col || !db.data?.length) {
        out[item.id] = [];
        continue;
      }
      const vals = db.data
        .map((row) => (row as Record<string, unknown>)[col as string])
        .filter((v) => v != null && v !== '');
      out[item.id] = [...new Set(vals)] as unknown[];
    }
  }
  return out;
}

export function searchFormInList(forms: unknown[], formId: number): Forms | undefined {
  const f = (forms as Forms[]).find((form) => form.id === formId);
  return f;
}

type ListProps = {
  database_flag?: number | boolean;
  database_id?: string | number | null;
  searchable?: boolean;
  list_type?: string;
};

function listPropsOf(el: FormDesign): ListProps | undefined {
  return el.properties?.list_properties as ListProps | undefined;
}

function searchFormDatum(
  formDataRows: FormRecordDatum[] | undefined,
  formElementId: number
): FormRecordDatum | undefined {
  if (!formDataRows?.length) {
    return undefined;
  }
  return formDataRows.find((r) => r.form_element_id === formElementId);
}

function parsePhotosValue(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v as string[];
  }
  if (typeof v === 'string' && v.length > 0) {
    try {
      const p = JSON.parse(v) as unknown;
      if (Array.isArray(p)) {
        return p as string[];
      }
    } catch {
      return [v];
    }
  }
  return [];
}

function coerceSwitchValue(v: unknown): boolean {
  if (v === true || v === 1) {
    return true;
  }
  if (v === false || v === 0) {
    return false;
  }
  if (typeof v === 'string') {
    const s = v.toLowerCase();
    return s === '1' || s === 'true' || s === 'yes';
  }
  return false;
}

/**
 * Paridad `initValuesRecord` en `canvas-form.page.ts` (Ionic): rellena `fields` y `form_data_ids`
 * desde `record.form_data` al abrir un registro enviado (`form_data_index` / `formRecordId`).
 */
export function hydrateFormDataFromRecord(
  form: Forms,
  record: FormsRecords,
  ctx: UserCtx
): FormDataShape {
  const formDataRows = Array.isArray(record.form_data)
    ? (record.form_data as FormRecordDatum[])
    : [];

  const fields: Record<number, unknown> = {};
  const form_data_ids: Record<number, unknown> = {};

  for (const section of form.form_sections ?? []) {
    for (const element of section.list) {
      const data = searchFormDatum(formDataRows, element.id);
      const ft = element.field_type_id;
      const lp = listPropsOf(element);

      form_data_ids[element.id] = data != null ? data.id : null;

      if (ft === 9) {
        fields[element.id] = data != null ? coerceSwitchValue(data.value) : false;
        continue;
      }

      if (ft === 16) {
        fields[element.id] =
          data != null && data.value != null && data.value !== ''
            ? parsePhotosValue(data.value)
            : [];
        continue;
      }

      if (
        ft < 4 ||
        ft === 5 ||
        ft === 6 ||
        ft === 7 ||
        ft === 8 ||
        ft === 11
      ) {
        fields[element.id] = data != null ? data.value : '';
        continue;
      }

      if (ft === 10 || ft === 12) {
        if (data != null && data.value) {
          fields[element.id] = moment(String(data.value)).toISOString();
        } else {
          fields[element.id] = '';
        }
        continue;
      }

      if (ft === 13) {
        fields[element.id] = [];
        if (data != null) {
          const tableMeta: { id: number | string; fields: Record<number, unknown>[] } = {
            id: data.id,
            fields: [],
          };
          form_data_ids[element.id] = tableMeta;
          const rawRows = data.data;
          if (Array.isArray(rawRows)) {
            for (const dataElement of rawRows) {
              if (!Array.isArray(dataElement)) {
                continue;
              }
              const aux: Record<number, unknown> = {};
              const auxIds: Record<number, unknown> = {};
              for (const cell of dataElement) {
                if (!cell || typeof cell !== 'object') {
                  continue;
                }
                const c = cell as Record<string, unknown>;
                const feId =
                  typeof c.form_element_id === 'number'
                    ? c.form_element_id
                    : (c.form_element as { id?: number } | undefined)?.id;
                if (feId == null) {
                  continue;
                }
                aux[feId] = c.value;
                auxIds[feId] = c.id;
              }
              (fields[element.id] as unknown[]).push(aux);
              tableMeta.fields.push(auxIds);
            }
          }
        } else {
          form_data_ids[element.id] = { id: '', fields: [] };
        }
        continue;
      }

      if (ft === 14) {
        fields[element.id] = data != null ? data.value : ctx.name;
        continue;
      }

      if (ft === 15) {
        fields[element.id] =
          data?.value != null && data.value !== ''
            ? data.value
            : ctx.signatureUrl;
        continue;
      }

      if (ft === 4 && lp) {
        if (data != null) {
          const dbf = lp.database_flag && lp.database_id != null && String(lp.database_id) !== '';
          if (dbf) {
            let v: unknown = data.value;
            if (lp.searchable && typeof data.value === 'string') {
              try {
                v = JSON.parse(data.value) as unknown;
              } catch {
                v = data.value;
              }
            }
            fields[element.id] = v;
          } else if (!lp.searchable) {
            if (typeof data.value === 'string') {
              try {
                fields[element.id] = JSON.parse(data.value) as unknown;
              } catch {
                fields[element.id] = data.value;
              }
            } else {
              fields[element.id] = data.value;
            }
          } else {
            if (typeof data.value === 'string') {
              try {
                fields[element.id] = JSON.parse(data.value) as unknown;
              } catch {
                fields[element.id] = data.value;
              }
            } else {
              fields[element.id] = data.value;
            }
          }
        } else if (lp.database_flag && lp.database_id != null && String(lp.database_id) !== '') {
          fields[element.id] = '';
        } else {
          fields[element.id] = lp.list_type === '2' ? [] : '';
        }
        continue;
      }

      fields[element.id] = data != null ? data.value : '';
    }
  }

  const statusRaw = record.status;
  const statusNum =
    statusRaw === undefined || statusRaw === null ? 0 : Number(statusRaw);
  const uid = record.user?.id != null ? record.user.id : Number(ctx.id);

  return {
    id: String(record.id),
    form_id: String(form.id),
    user_id: uid,
    fields,
    form_data_ids,
    rows_deleted: [],
    status: Number.isNaN(statusNum) ? 0 : statusNum,
    name: record.form?.name as string | undefined,
    created: record.created ?? record.created_at,
  };
}

/** Busca el registro en memoria (servicio + store), como `fs.forms_records` en Ionic. */
export function findFormsRecordById(
  recordId: number,
  serviceRecords: unknown,
  storeRecords: FormsRecords[]
): FormsRecords | undefined {
  const fromService = (serviceRecords as FormsRecords[]).find((r) => r.id === recordId);
  if (fromService) {
    return fromService;
  }
  return storeRecords.find((r) => r.id === recordId);
}

/** Paridad `checkCurrentField` (validación por tipo). */
export function checkFieldInvalid(field: FormDesign, value: unknown): boolean {
  const ft = field.field_type_id;
  const req = (field.properties?.required ?? 0) === 1;
  if (!req) {
    return false;
  }
  const p = field.properties;
  const lp = p?.list_properties;

  switch (ft) {
    case 1:
    case 3:
    case 5:
    case 8:
      return value === '' || value == null;
    case 2: {
      if (value === '' || value == null) {
        return true;
      }
      const n = Number(value);
      if (Number.isNaN(n)) {
        return true;
      }
      if (p?.active_range) {
        if (n < p.min_value || n > p.max_value) {
          return true;
        }
      }
      return false;
    }
    case 6: {
      if (value === '' || value == null) {
        return true;
      }
      const s = String(value);
      return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
    }
    case 7:
      return value === '' || value == null;
    case 9:
      // TODO: VERIFICAR Ionic — «requerido» en checkbox puede ser «debe estar marcado».
      return value !== true && value !== 1 && value !== '1';
    case 4: {
      if (lp?.list_type === '2') {
        return !Array.isArray(value) || value.length === 0;
      }
      if (Array.isArray(value)) {
        return value.length === 0;
      }
      return value === '' || value == null;
    }
    case 16:
      return !Array.isArray(value) || value.length === 0;
    case 10:
    case 12:
      return value === '' || value == null;
    case 13:
      return !Array.isArray(value) || value.length === 0;
    case 14:
    case 15:
      return value === '' || value == null;
    case 11:
      return value === '' || value == null;
    default:
      return false;
  }
}

export function validateEntireForm(
  form: Forms,
  fields: Record<number, unknown>
): boolean {
  const n = form.form_sections?.length ?? 0;
  for (let i = 0; i < n; i++) {
    if (!validateSection(form, i, fields)) {
      return false;
    }
  }
  return true;
}

export function validateSection(
  form: Forms,
  slideIndex: number,
  fields: Record<number, unknown>
): boolean {
  const section = form.form_sections?.[slideIndex];
  if (!section) {
    return true;
  }
  let errors = 0;
  for (const element of section.list) {
    if ((element.properties?.required ?? 0) === 1) {
      if (checkFieldInvalid(element, fields[element.id])) {
        errors++;
      }
    }
  }
  return errors === 0;
}
