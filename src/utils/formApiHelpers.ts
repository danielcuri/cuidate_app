/** Normaliza listas devueltas por distintas formas de payload Laravel. */
export function extractList<T>(res: unknown, keys: string[]): T[] {
  if (!res || typeof res !== 'object') {
    return [];
  }
  const r = res as Record<string, unknown>;
  if (r.error) {
    return [];
  }
  for (const k of keys) {
    const v = r[k];
    if (Array.isArray(v)) {
      return v as T[];
    }
    if (v && typeof v === 'object' && Array.isArray((v as Record<string, unknown>).data)) {
      return (v as { data: T[] }).data;
    }
  }
  if (Array.isArray(r.data)) {
    return r.data as T[];
  }
  return [];
}
