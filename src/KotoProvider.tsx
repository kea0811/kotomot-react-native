import React, { createContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KotoContextType, KotoConfig } from './types';

export const KotoContext = createContext<KotoContextType | undefined>(undefined);

const STORAGE_KEY = '@koto:apiKey';

interface KotoProviderProps {
  children: ReactNode;
  config?: KotoConfig;
}

export const KotoProvider: React.FC<KotoProviderProps> = ({
  children,
  config = {}
}) => {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [baseUrl, setBaseUrlState] = useState<string>(
    config.baseUrl || 'https://api.koto.dev'
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    try {
      setIsLoading(true);
      const storedKey = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedKey) {
        setApiKeyState(storedKey);
      }
    } catch (err) {
      console.error('Failed to load API key from AsyncStorage:', err);
      setError('Failed to load API key');
    } finally {
      setIsLoading(false);
    }
  };

  const setApiKey = async (key: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, key);
      setApiKeyState(key);
      setError(null);
    } catch (err) {
      console.error('Failed to save API key to AsyncStorage:', err);
      setError('Failed to save API key');
      throw err;
    }
  };

  const removeApiKey = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setApiKeyState(null);
      setError(null);
    } catch (err) {
      console.error('Failed to remove API key from AsyncStorage:', err);
      setError('Failed to remove API key');
      throw err;
    }
  };

  const setBaseUrl = (url: string) => {
    setBaseUrlState(url);
  };

  const makeRequest = async <T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    if (!apiKey) {
      throw new Error('API key is not set. Please set an API key first.');
    }

    const url = `${baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as T;
    } catch (err) {
      console.error('Request failed:', err);
      throw err;
    }
  };

  const value: KotoContextType = {
    apiKey,
    setApiKey,
    removeApiKey,
    baseUrl,
    setBaseUrl,
    makeRequest,
    isLoading,
    error,
    isAuthenticated: !!apiKey,
  };

  return (
    <KotoContext.Provider value={value}>
      {children}
    </KotoContext.Provider>
  );
};