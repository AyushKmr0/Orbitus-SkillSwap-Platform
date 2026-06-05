import axios from 'axios';
import { store } from '../store/index.js';
import { logout, updateAccessToken } from '../features/authSlice.js';
import { backendUrl } from '../config/env.js';

if (backendUrl) {
  axios.defaults.baseURL = backendUrl;
}

export const API_BASE_URL = backendUrl || 'https://orbitus-skillswap-platform.onrender.com';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

let refreshPromise = null;

const getStoredToken = () => localStorage.getItem('accessToken') || '';

apiClient.interceptors.request.use((config) => {
  const token = store.getState().auth.token || getStoredToken();

  if (token && !config.headers?.Authorization) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`
    };
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (
      status !== 401 ||
      originalRequest?._retry ||
      originalRequest?._skipAuthRefresh ||
      originalRequest?.url?.includes('/api/auth/login') ||
      originalRequest?.url?.includes('/api/auth/refresh')
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      refreshPromise ||= apiClient
        .post('/api/auth/refresh', {}, { _skipAuthRefresh: true })
        .finally(() => {
          refreshPromise = null;
        });

      const { data } = await refreshPromise;
      const accessToken = data.accessToken;

      store.dispatch(updateAccessToken(accessToken));
      originalRequest.headers = {
        ...originalRequest.headers,
        Authorization: `Bearer ${accessToken}`
      };

      return apiClient(originalRequest);
    } catch (refreshError) {
      store.dispatch(logout());
      return Promise.reject(refreshError);
    }
  }
);

export default apiClient;
