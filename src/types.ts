export interface KotoConfig {
  baseUrl?: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface KotoContextType {
  apiKey: string | null;
  setApiKey: (key: string) => Promise<void>;
  removeApiKey: () => Promise<void>;
  baseUrl: string;
  setBaseUrl: (url: string) => void;
  makeRequest: <T = any>(endpoint: string, options?: RequestInit) => Promise<T>;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
}

export interface KotoResponse<T = any> {
  data: T;
  status: number;
  headers: Headers;
}