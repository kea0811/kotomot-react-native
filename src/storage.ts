import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TranslationData, StoredTranslations } from './types';

const PREFIX = 'kotomot:translations:';
const LOCALE_KEY = 'kotomot:locale';

/** AsyncStorage-backed translation cache (one entry per locale). */
export const storage = {
  async getTranslations(locale: string): Promise<StoredTranslations | null> {
    try {
      const raw = await AsyncStorage.getItem(PREFIX + locale);
      return raw ? (JSON.parse(raw) as StoredTranslations) : null;
    } catch {
      return null;
    }
  },

  async setTranslations(
    locale: string,
    translations: TranslationData,
    version: string | null
  ): Promise<void> {
    try {
      await AsyncStorage.setItem(
        PREFIX + locale,
        JSON.stringify({ translations, version, timestamp: Date.now() } as StoredTranslations)
      );
    } catch {
      /* cache write is best-effort */
    }
  },

  async getVersion(locale: string): Promise<string | null> {
    const stored = await this.getTranslations(locale);
    return stored ? stored.version : null;
  },

  async getSelectedLocale(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(LOCALE_KEY);
    } catch {
      return null;
    }
  },

  async setSelectedLocale(locale: string): Promise<void> {
    try {
      await AsyncStorage.setItem(LOCALE_KEY, locale);
    } catch {
      /* best-effort */
    }
  },

  async clear(locale?: string): Promise<void> {
    try {
      if (locale) {
        await AsyncStorage.removeItem(PREFIX + locale);
      } else {
        const keys = await AsyncStorage.getAllKeys();
        const ours = keys.filter((k) => k.startsWith(PREFIX));
        if (ours.length) await AsyncStorage.multiRemove(ours);
      }
    } catch {
      /* best-effort */
    }
  },
};
