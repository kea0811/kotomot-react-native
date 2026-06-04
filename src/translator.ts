import type { TranslationData } from './types';

/**
 * Resolve a dot-notation key. Tries a flat lookup first (the API returns a flat
 * `{ keyPath: value }` map), then walks nested objects.
 */
export function getNested(obj: TranslationData, key: string): string | undefined {
  if (obj == null) return undefined;
  const flat = obj[key];
  if (typeof flat === 'string') return flat;

  const parts = key.split('.');
  let cur: any = obj;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in cur) cur = cur[p];
    else return undefined;
  }
  return typeof cur === 'string' ? cur : undefined;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Replace `{name}` and `{{name}}` placeholders (whitespace-tolerant).
 * Missing values render as an empty string.
 */
export function interpolate(str: string, params: Record<string, string | number>): string {
  let out = str;
  for (const [k, v] of Object.entries(params || {})) {
    const val = v === undefined || v === null ? '' : String(v);
    out = out
      .replace(new RegExp(`{{\\s*${escapeRe(k)}\\s*}}`, 'g'), val)
      .replace(new RegExp(`{\\s*${escapeRe(k)}\\s*}`, 'g'), val);
  }
  return out;
}
