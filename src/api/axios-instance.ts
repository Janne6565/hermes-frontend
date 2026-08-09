import axios, { type AxiosRequestConfig } from 'axios';

/**
 * Shared axios instance. Also the mutator Orval injects into the generated client, so auth and
 * error handling are configured exactly once.
 *
 * There is no token to attach. Authentik's forward-auth middleware stops the browser at the
 * ingress, so anything that reaches this code already has a session — see the app's README.
 */
export const api = axios.create({
  // Relative: the ingress serves the API and the app from the same host, and the dev server
  // proxies /api. No base-URL switching between environments.
  baseURL: '',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // A 401 means the Authentik session expired while the tab sat open. Nothing in the app can
    // recover from that — a full reload hits the ingress, which redirects to SSO and back.
    if (error?.response?.status === 401) {
      globalThis.location?.reload();
    }
    return Promise.reject(error);
  },
);

export const customInstance = async <T>(config: AxiosRequestConfig): Promise<T> => {
  const { data } = await api.request<T>(config);
  return data;
};
