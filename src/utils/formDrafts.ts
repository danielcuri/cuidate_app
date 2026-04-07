import { localStorage } from './storage';
import type { FormLocalSaved } from '../interfaces/forms';
import { formService } from '../services/FormService';

const FORMS_SAVED_KEY = 'forms_saved_local';

async function syncFormService(): Promise<void> {
  await formService.loadStorage();
}

export async function loadDrafts(): Promise<FormLocalSaved[]> {
  const raw = await localStorage.getItem(FORMS_SAVED_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as FormLocalSaved[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveDraft(draft: FormLocalSaved): Promise<void> {
  const current = await loadDrafts();
  current.push(draft);
  await localStorage.setItem(FORMS_SAVED_KEY, JSON.stringify(current));
  await syncFormService();
}

export async function updateDraft(index: number, updated: FormLocalSaved): Promise<void> {
  const drafts = await loadDrafts();
  if (index < 0 || index >= drafts.length) {
    return;
  }
  drafts[index] = updated;
  await localStorage.setItem(FORMS_SAVED_KEY, JSON.stringify(drafts));
  await syncFormService();
}

export async function deleteDraft(index: number): Promise<void> {
  const drafts = await loadDrafts();
  if (index < 0 || index >= drafts.length) {
    return;
  }
  drafts.splice(index, 1);
  await localStorage.setItem(FORMS_SAVED_KEY, JSON.stringify(drafts));
  await syncFormService();
}
