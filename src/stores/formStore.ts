import { create } from 'zustand';
import type { FormsList } from '../interfaces/forms';
import type { Forms, FormsRecords, Action } from '../interfaces/forms';
import { formService } from '../services/FormService';

/** Estado global del flujo de formularios (paridad con doc. migración + FormService). */
export type FormStoreState = {
  forms: Forms[];
  locals: unknown[];
  showPamolsa: boolean;
  pamolsaAreas: unknown[];
  users: unknown[];
  forms_titles: unknown[];
  fieldsToValidate: unknown;
  behaviors_types: unknown[];
  inspections: unknown[];
  forms_records: FormsRecords[];
  actions: Action[];
  actions_executed: Action[];
  actions_header: unknown[];
  forms_saved_local: unknown[];
  hydrateFromGeneralInfo: (data: FormsList) => void;
  syncFromService: () => void;
};

export const useFormStore = create<FormStoreState>((set) => ({
  forms: [],
  locals: [],
  showPamolsa: false,
  pamolsaAreas: [],
  users: [],
  forms_titles: [],
  fieldsToValidate: undefined,
  behaviors_types: [],
  inspections: [],
  forms_records: [],
  actions: [],
  actions_executed: [],
  actions_header: [],
  forms_saved_local: [],

  hydrateFromGeneralInfo: (data: FormsList) => {
    set({
      forms: data.forms ?? [],
      locals: data.locals ?? [],
      showPamolsa: !!data.showPamolsa,
      pamolsaAreas: data.pamolsaAreas ?? [],
      users: data.users ?? [],
      forms_titles: data.forms_titles ?? [],
      fieldsToValidate: data.fieldsToValidate,
      behaviors_types: data.behaviors_types ?? [],
      inspections: data.inspections ?? [],
      forms_records: (data.forms_records as FormsRecords[]) ?? [],
      actions: (data.actions as Action[]) ?? [],
      actions_executed: (data.actions_executed as Action[]) ?? [],
      actions_header: data.actions_header ?? [],
    });
  },

  syncFromService: () => {
    set({
      forms: (formService.forms as Forms[]) ?? [],
      locals: formService.locals ?? [],
      showPamolsa: formService.showPamolsa,
      pamolsaAreas: formService.pamolsaAreas ?? [],
      users: formService.users ?? [],
      forms_titles: formService.forms_titles ?? [],
      fieldsToValidate: formService.fieldsToValidate,
      behaviors_types: formService.behaviors_types ?? [],
      inspections: formService.inspections ?? [],
      forms_records: (formService.forms_records as FormsRecords[]) ?? [],
      actions: (formService.actions as Action[]) ?? [],
      actions_executed: (formService.actions_executed as Action[]) ?? [],
      actions_header: formService.actions_header ?? [],
      forms_saved_local: formService.forms_saved_local ?? [],
    });
  },
}));
