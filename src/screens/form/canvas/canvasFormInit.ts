import moment from 'moment-timezone';
import type { FormDesign, Forms } from '../../../interfaces/forms';

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
