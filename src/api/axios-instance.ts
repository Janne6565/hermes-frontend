import axios, { type AxiosRequestConfig } from 'axios';
import { getAdminToken, clearAdminToken } from '@/lib/session';

/**
 * Shared axios instance. Also the mutator Orval injects into the generated client, so auth and
 * error handling are configured exactly once.
 */
export const api = axios.create({
  // Relative: the ingress serves the API and the app from the same host, and the dev server
  // proxies /api. No base-URL switching between environments.
  baseURL: '',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getAdminToken();
  if (token) {
    config.headers.set('X-Hermes-Token', token);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // A 401 means the stored token is wrong or was rotated. Drop it so the app falls back to the
    // unlock screen instead of looping on failed requests.
    if (error?.response?.status === 401) {
      clearAdminToken();
    }
    return Promise.reject(error);
  },
);

export const customInstance = async <T>(config: AxiosRequestConfig): Promise<T> => {
  const { data } = await api.request<T>(config);
  return data;
};
