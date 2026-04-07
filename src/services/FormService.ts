import type { FormsList } from "../interfaces/forms";
import { localStorage } from "../utils/storage";
import { queryService } from "./QueryService";

const FORMS_SAVED_KEY = "forms_saved_local";

/**
 * Paridad con Ionic `FormService`.
 * Rutas: ajustar si el backend Laravel usa otros nombres.
 */
export class FormService {
    forms: unknown[] = [];
    /** Borradores locales (paridad Ionic; estructura flexible). */
    forms_saved_local: any[] = [];
    forms_records: unknown[] = [];
    actions: unknown[] = [];
    actions_executed: unknown[] = [];
    areas: unknown[] = [];
    locals: unknown[] = [];
    behaviors_types: unknown[] = [];
    inspections: unknown[] = [];
    actions_header: unknown[] = [];
    fieldsToValidate: unknown;
    users: unknown[] = [];
    pamolsaAreas: unknown[] = [];
    forms_titles: unknown[] = [];
    showPamolsa = false;

    async getGeneralInfo(): Promise<FormsList> {
        return queryService.executeQuery<FormsList>(
            "get",
            "/getGeneralInfo",
            {},
        );
    }

    async saveData(data: unknown): Promise<unknown> {
        return queryService.executeQuery<unknown>("post", "/saveData", data);
    }

    /** POST paridad `saveCanvasForm` / envío formulario canvas. */
    async saveCanvasForm(data: unknown): Promise<unknown> {
        return this.saveData(data);
    }

    async getFormatsList(data: { user_id: number }): Promise<unknown> {
        return queryService.executeQuery<unknown>(
            "post",
            "/getFormatsList",
            data,
        );
    }

    async getListRecords(data: {
        last_id?: number;
        user_selected?: string;
        form_selected?: string;
    }): Promise<unknown> {
        return queryService.executeQuery<unknown>(
            "post",
            "/getListRecords",
            data,
        );
    }

    async getListActions(data: Record<string, unknown>): Promise<unknown> {
        return queryService.executeQuery<unknown>(
            "post",
            "/getListActions",
            data,
        );
    }

    async getListEffectiveness(
        data: Record<string, unknown>,
    ): Promise<unknown> {
        return queryService.executeQuery<unknown>(
            "post",
            "/getListEffectiveness",
            data,
        );
    }

    async getPamolsaRecords(data: {
        last_id?: number;
        area_selected?: number | string;
    }): Promise<unknown> {
        return queryService.executeQuery<unknown>(
            "post",
            "/getPamolsaRecords",
            data,
        );
    }

    async getActionDetail(data: { action_id: number }): Promise<unknown> {
        return queryService.executeQuery<unknown>(
            "post",
            "/getActionDetail",
            data,
        );
    }

    async saveDataPamolsaTracing(data: unknown): Promise<unknown> {
        return queryService.executeQuery<unknown>("post", "/saveTracing", data);
    }

    async saveEffectiveness(data: unknown): Promise<unknown> {
        return queryService.executeQuery<unknown>(
            "post",
            "/saveEffectiveness",
            data,
        );
    }

    getListRecords2(_data: unknown): Promise<unknown> {
        return Promise.reject(new Error("Deprecated: use getListRecords"));
    }

    list(_data: unknown): Promise<unknown> {
        return Promise.reject(new Error("Not implemented"));
    }

    listExtraInfo(_data: unknown): Promise<unknown> {
        return Promise.reject(new Error("Not implemented"));
    }

    listFormRecords(_data: unknown): Promise<unknown> {
        return Promise.reject(new Error("Not implemented"));
    }

    listActions(_data: unknown): Promise<unknown> {
        return this.getListActions(_data as Record<string, unknown>);
    }

    saveDataPamolsaAction(_data: unknown): Promise<unknown> {
        // Endpoint según documento `Modificacion_Hallazgo_SST.md`
        return queryService.executeQuery<unknown>(
            "post",
            "/pamolsa-action",
            _data,
        );
    }

    saveDataPamolsaEffectiveness(_data: unknown): Promise<unknown> {
        return this.saveEffectiveness(_data);
    }

    async saveDataLocal(): Promise<void> {
        await localStorage.setItem(
            FORMS_SAVED_KEY,
            JSON.stringify(this.forms_saved_local),
        );
    }

    async loadStorage(): Promise<void> {
        const raw = await localStorage.getItem(FORMS_SAVED_KEY);
        if (raw) {
            try {
                this.forms_saved_local = JSON.parse(raw) as any[];
            } catch {
                this.forms_saved_local = [];
            }
        } else {
            this.forms_saved_local = [];
        }
    }
}

export const formService = new FormService();
