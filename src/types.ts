import type { ReactNode } from 'react';

export type TranslationData = Record<string, any>;

export interface KotoConfig {
  /** A key generated in the dashboard. */
  apiKey: string;
  /** Project slug or ID. */
  projectId: string;
  /** Initial locale (a persisted choice overrides it). */
  defaultLocale: string;
  /** API host or full /v1/translations endpoint. Defaults to https://api.kotomot.app. */
  apiUrl?: string;
  /** Optional namespace filter. */
  namespace?: string;
}

export interface LocaleInfo {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  direction: 'ltr' | 'rtl';
  isDefault: boolean;
}

export interface KotoContextValue {
  translations: TranslationData;
  locale: string;
  loading: boolean;
  error: Error | null;
  version: string | null;
  availableLocales: LocaleInfo[];
  t: (key: string, fallback?: string) => string;
  ti: (key: string, params: Record<string, string | number>, fallback?: string) => string;
  tp: (key: string, count: number, params?: Record<string, string | number>) => string;
  setLocale: (locale: string) => void;
  refresh: () => Promise<void>;
}

export interface KotoProviderProps extends KotoConfig {
  children: ReactNode;
}

export interface StoredTranslations {
  translations: TranslationData;
  version: string | null;
  timestamp: number;
}
