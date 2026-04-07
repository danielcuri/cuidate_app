import { create } from 'zustand';

/** Estado mínimo del flujo Medical (paridad doc migración + menú 21 días). */
interface MedicalState {
  restDay: number | null;
  setRestDay: (n: number | null) => void;
}

export const useMedicalStore = create<MedicalState>((set) => ({
  restDay: null,
  setRestDay: (n) => set({ restDay: n }),
}));
