import type { FormDesign, Forms } from '../../../interfaces/forms';

export type DbArrayMap = Record<number, unknown[]>;

type DbModel = {
    id: number;
    data?: Record<string, unknown>[];
    data_titles: { str_slug: string }[];
};

/** Paridad `canvas-form.page.ts` `getElementsBd` / `elements_bd`. */
export function getElementsBd(form: Forms): FormDesign[][] {
    return (form.form_sections ?? []).map((sec) =>
        sec.list.filter(
            (sub) => sub.db_data_id != null && sub.db_data_id !== undefined,
        ),
    );
}

/** Paridad `findElementByColumnRelated`. */
/**
 * Filas de BD acotadas por las selecciones previas en la cadena (planta → área → …).
 * Corrige el filtro solo por la última columna, que rompe selects anidados reales.
 */
function filterDataForDependentColumn(
    db: DbModel,
    elementsBd: FormDesign[][],
    nextFields: Record<number, unknown>,
    dependentColumnIndex: number,
): Record<string, unknown>[] {
    let rows = [...(db.data ?? [])];
    for (let k = 0; k < dependentColumnIndex; k++) {
        const slug = db.data_titles[k]?.str_slug;
        if (!slug) {
            continue;
        }
        const sources = findElementByColumnRelated(elementsBd, slug, db.id);
        const source = sources[0];
        if (!source) {
            continue;
        }
        const raw = nextFields[source.id];
        if (raw === '' || raw == null) {
            continue;
        }
        const compareVal = Array.isArray(raw) ? raw[0] : raw;
        rows = rows.filter(
            (row) => (row as Record<string, unknown>)[slug] == compareVal,
        );
    }
    return rows;
}

export function findElementByColumnRelated(
    elementsBd: FormDesign[][],
    columnName: string,
    dbId: number,
): FormDesign[] {
    const out: FormDesign[] = [];
    for (const section of elementsBd) {
        for (const listElement of section) {
            const lp = listElement.properties?.list_properties as
                | { column_related?: string }
                | undefined;
            if (lp && listElement.db_data_id === dbId) {
                if (lp.column_related === columnName) {
                    out.push(listElement);
                }
            } else if (
                (listElement.properties as { column_related?: string } | undefined)
                    ?.column_related === columnName &&
                listElement.db_data_id === dbId
            ) {
                out.push(listElement);
            }
        }
    }
    return out;
}

/** Paridad `fillArrayByProperty` (valores únicos por columna). */
export function fillArrayByProperty(db: DbModel, element: FormDesign): {
    options: unknown[];
    autoPick?: unknown;
} {
    const ft = Number(element.field_type_id);
    let col: string | undefined;
    if (ft >= 3) {
        col = (
            element.properties?.list_properties as { column_related?: string }
        )?.column_related;
    } else {
        col = (element.properties as { column_related?: string })?.column_related;
    }
    if (!col || !db.data?.length) {
        return { options: [] };
    }
    const newArray = db.data.map(
        (row) => (row as Record<string, unknown>)[col as string],
    );
    const uniqueValues = Array.from(
        new Set(newArray.filter((v) => v != null && v !== '')),
    );
    uniqueValues.sort((a, b) =>
        String(a).localeCompare(String(b), 'es', {
            numeric: true,
            sensitivity: 'base',
        }),
    );
    let autoPick: unknown;
    if (uniqueValues.length === 1) {
        autoPick = uniqueValues[0];
    }
    return { options: uniqueValues, autoPick };
}

/**
 * Opciones iniciales por campo BD (todas las filas). Paridad primer nivel antes de filtros en cascada.
 */
export function buildInitialDbArrays(form: Forms): DbArrayMap {
    const out: DbArrayMap = {};
    const dbs = (form.databases ?? []) as DbModel[];
    for (const section of form.form_sections ?? []) {
        for (const item of section.list) {
            if (item.db_data_id == null) {
                continue;
            }
            const dbIdx = dbs.findIndex((d) => d.id === item.db_data_id);
            if (dbIdx < 0) {
                out[item.id] = [];
                continue;
            }
            const { options } = fillArrayByProperty(dbs[dbIdx], item);
            out[item.id] = options;
        }
    }
    return out;
}

/**
 * Paridad `selectedDB` / `selectedDBSelectable`: `storedValue` va a `formData.fields`;
 * `filterValue` se usa para filtrar filas en cascada (Ionic usa el escalar del evento).
 */
export function applyDbCascade(
    form: Forms,
    fields: Record<number, unknown>,
    item: FormDesign,
    filterValue: unknown,
    storedValue: unknown,
    prevDbArrays: DbArrayMap,
): { fields: Record<number, unknown>; dbArrays: DbArrayMap } {
    const nextFields = { ...fields, [item.id]: storedValue };
    const nextDb: DbArrayMap = { ...prevDbArrays };
    const dbs = (form.databases ?? []) as DbModel[];
    const elementsBd = getElementsBd(form);
    const databaseIndex = dbs.findIndex((d) => d.id === item.db_data_id);
    if (databaseIndex < 0) {
        return { fields: nextFields, dbArrays: nextDb };
    }
    const dbFull = dbs[databaseIndex];
    const lp = item.properties?.list_properties as
        | { column_related?: string }
        | undefined;
    const colRel = lp?.column_related;
    if (!colRel) {
        return { fields: nextFields, dbArrays: nextDb };
    }

    const l = dbFull.data_titles.length - 1;
    const currentIndex = dbFull.data_titles.findIndex(
        (t) => t.str_slug === colRel,
    );
    if (currentIndex < 0) {
        return { fields: nextFields, dbArrays: nextDb };
    }

    for (let j = currentIndex + 1; j <= l; j++) {
        const nextTitle = dbFull.data_titles[j];
        const dependents = findElementByColumnRelated(
            elementsBd,
            nextTitle.str_slug,
            dbFull.id,
        );
        const filteredData = filterDataForDependentColumn(
            dbFull,
            elementsBd,
            nextFields,
            j,
        );
        const filtered: DbModel = {
            ...dbFull,
            data: filteredData,
        };
        for (const dep of dependents) {
            nextFields[dep.id] = '';
            const { options, autoPick } = fillArrayByProperty(filtered, dep);
            nextDb[dep.id] = options;
            if (autoPick !== undefined) {
                nextFields[dep.id] = autoPick;
            }
        }
    }
    return { fields: nextFields, dbArrays: nextDb };
}

/** `selectedDB`: guarda el valor tal cual (opción primitiva del ion-select). */
export function applySelectedDb(
    form: Forms,
    fields: Record<number, unknown>,
    item: FormDesign,
    eventValue: unknown,
    prevDbArrays: DbArrayMap,
): { fields: Record<number, unknown>; dbArrays: DbArrayMap } {
    return applyDbCascade(
        form,
        fields,
        item,
        eventValue,
        eventValue,
        prevDbArrays,
    );
}

/** `selectedDBSelectable`: guarda `[valor]`; filtra con el escalar. */
export function applySelectedDbSelectable(
    form: Forms,
    fields: Record<number, unknown>,
    item: FormDesign,
    rawValue: unknown,
    prevDbArrays: DbArrayMap,
): { fields: Record<number, unknown>; dbArrays: DbArrayMap } {
    const v = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    return applyDbCascade(form, fields, item, v, [v], prevDbArrays);
}
