import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import type {
  KotoContextValue,
  KotoProviderProps,
  TranslationData,
  LocaleInfo,
} from './types';
import { storage } from './storage';
import { getNested, interpolate } from './translator';

export const KotoContext = createContext<KotoContextValue | null>(null);

// Accept either the API host (https://api.kotomot.app) or the full
// /v1/translations endpoint, and normalize to the translations endpoint.
function resolveEndpoint(apiUrl: string): string {
  const base = (apiUrl || '').replace(/\/+$/, '');
  return base.endsWith('/v1/translations') ? base : `${base}/v1/translations`;
}
function localesEndpoint(apiUrl: string): string {
  const base = (apiUrl || '').replace(/\/+$/, '').replace(/\/v1\/translations$/, '');
  return `${base}/v1/locales`;
}

export function KotoProvider({
  children,
  apiKey,
  projectId,
  defaultLocale,
  apiUrl = 'https://api.kotomot.app',
  namespace,
}: KotoProviderProps) {
  const [translations, setTranslations] = useState<TranslationData>({});
  const [locale, setLocaleState] = useState(defaultLocale);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [version, setVersion] = useState<string | null>(null);
  const [availableLocales, setAvailableLocales] = useState<LocaleInfo[]>([]);

  const cfg = useRef({ apiKey, projectId, apiUrl, namespace });
  cfg.current = { apiKey, projectId, apiUrl, namespace };
  const loadedRef = useRef<Set<string>>(new Set());

  const fetchTranslations = useCallback(
    async (loc: string): Promise<{ translations: TranslationData; version: string | null }> => {
      const { apiKey, projectId, apiUrl, namespace } = cfg.current;
      let url = `${resolveEndpoint(apiUrl)}?locale=${encodeURIComponent(loc)}&projectId=${encodeURIComponent(projectId)}`;
      if (namespace) url += `&namespace=${encodeURIComponent(namespace)}`;
      const res = await fetch(url, {
        headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`Failed to fetch translations: ${res.status}`);
      const data = await res.json();
      return { translations: data.translations || {}, version: data.version ?? null };
    },
    []
  );

  const checkVersion = useCallback(async (loc: string): Promise<boolean> => {
    const { apiKey, projectId, apiUrl } = cfg.current;
    try {
      const res = await fetch(
        `${resolveEndpoint(apiUrl)}/version?projectId=${encodeURIComponent(projectId)}`,
        { headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' } }
      );
      if (!res.ok) return false;
      const data = await res.json();
      const cachedVersion = await storage.getVersion(loc);
      return !cachedVersion || !data.version || cachedVersion !== data.version;
    } catch {
      return false;
    }
  }, []);

  const load = useCallback(
    async (loc: string) => {
      if (loadedRef.current.has(loc)) return;
      loadedRef.current.add(loc);
      setLoading(true);
      setError(null);
      try {
        const cached = await storage.getTranslations(loc);
        if (cached) {
          // Serve cache immediately, then revalidate by version in the background.
          setTranslations(cached.translations);
          setVersion(cached.version);
          setLoading(false);
          if (await checkVersion(loc)) {
            const fresh = await fetchTranslations(loc);
            setTranslations(fresh.translations);
            setVersion(fresh.version);
            await storage.setTranslations(loc, fresh.translations, fresh.version);
          }
        } else {
          const fresh = await fetchTranslations(loc);
          setTranslations(fresh.translations);
          setVersion(fresh.version);
          setLoading(false);
          await storage.setTranslations(loc, fresh.translations, fresh.version);
        }
      } catch (e) {
        loadedRef.current.delete(loc); // allow retry
        setError(e instanceof Error ? e : new Error('Failed to load translations'));
        setLoading(false);
      }
    },
    [checkVersion, fetchTranslations]
  );

  const refresh = useCallback(async () => {
    try {
      if (!(await checkVersion(locale))) return;
      const fresh = await fetchTranslations(locale);
      setTranslations(fresh.translations);
      setVersion(fresh.version);
      await storage.setTranslations(locale, fresh.translations, fresh.version);
    } catch {
      /* keep the cached bundle on failure */
    }
  }, [locale, checkVersion, fetchTranslations]);

  const setLocale = useCallback(
    (loc: string) => {
      if (loc !== locale) {
        loadedRef.current.delete(loc);
        setLocaleState(loc);
        storage.setSelectedLocale(loc);
      }
    },
    [locale]
  );

  // Restore a previously-selected locale on mount.
  useEffect(() => {
    let active = true;
    (async () => {
      const saved = await storage.getSelectedLocale();
      if (active && saved && saved !== locale) setLocaleState(saved);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch the project's available locales once (for a language picker).
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { apiKey, projectId, apiUrl } = cfg.current;
        const res = await fetch(
          `${localesEndpoint(apiUrl)}?projectId=${encodeURIComponent(projectId)}`,
          { headers: { 'x-api-key': apiKey } }
        );
        if (res.ok && active) {
          const data = await res.json();
          setAvailableLocales(data.locales || []);
        }
      } catch {
        /* picker metadata is optional */
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load(locale);
  }, [locale, load]);

  const t = useCallback(
    (key: string, fallback?: string): string => getNested(translations, key) ?? fallback ?? key,
    [translations]
  );
  const ti = useCallback(
    (key: string, params: Record<string, string | number>, fallback?: string): string =>
      interpolate(t(key, fallback), params),
    [t]
  );
  const tp = useCallback(
    (key: string, count: number, params?: Record<string, string | number>): string => {
      const pluralKey = count === 0 ? `${key}.zero` : count === 1 ? `${key}.one` : `${key}.other`;
      const resolved = getNested(translations, pluralKey) ?? getNested(translations, key) ?? key;
      return interpolate(resolved, { count, ...(params || {}) });
    },
    [translations]
  );

  const value = useMemo<KotoContextValue>(
    () => ({
      translations,
      locale,
      loading,
      error,
      version,
      availableLocales,
      t,
      ti,
      tp,
      setLocale,
      refresh,
    }),
    [translations, locale, loading, error, version, availableLocales, t, ti, tp, setLocale, refresh]
  );

  return <KotoContext.Provider value={value}>{children}</KotoContext.Provider>;
}

/** Full translation context. Throws if used outside a KotoProvider. */
export function useKoto(): KotoContextValue {
  const ctx = useContext(KotoContext);
  if (!ctx) throw new Error('useKoto must be used within a KotoProvider');
  return ctx;
}

/** Convenience hook for the common translating surface. */
export function useTranslation() {
  const { t, ti, tp, locale, loading, setLocale, refresh, availableLocales } = useKoto();
  return { t, ti, tp, locale, loading, setLocale, refresh, availableLocales };
}
