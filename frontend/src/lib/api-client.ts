import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ApiErrorResponse } from '@/types/api';

const API_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

export const GEMINI_REQUEST_TIMEOUT_MS = 130_000;

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let accessToken: string | null = null;
let refreshSession: (() => Promise<string | null>) | null = null;
let refreshPromise: Promise<string | null> | null = null;

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 30_000,
  headers: {
    Accept: 'application/json',
  },
});

export function setApiAccessToken(token: string | null) {
  accessToken = token;
}

export function setRefreshSessionHandler(handler: (() => Promise<string | null>) | null) {
  refreshSession = handler;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const original = error.config as RetryConfig | undefined;
    const isAuthEndpoint = original?.url?.startsWith('/auth/') ?? false;

    if (
      error.response?.status !== 401 ||
      !original ||
      original._retry ||
      isAuthEndpoint ||
      !refreshSession
    ) {
      return Promise.reject(error);
    }

    original._retry = true;
    refreshPromise ??= refreshSession().finally(() => {
      refreshPromise = null;
    });
    const token = await refreshPromise;

    if (!token) {
      return Promise.reject(error);
    }

    original.headers.Authorization = `Bearer ${token}`;
    return api(original);
  },
);

export async function request<T>(config: AxiosRequestConfig) {
  const response = await api.request<T>(config);
  return response.data;
}
