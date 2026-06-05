import axios from 'axios';
import { store } from '../store/index.js';
import { logout, updateAccessToken } from '../features/authSlice.js';

axios.defaults.baseURL = 'https://orbitus-skillswap-platform.onrender.com';
axios.defaults.withCredentials = true;

let refreshPromise = null;

const getStoredToken = () => localStorage.getItem('accessToken') || '';

axios.interceptors.request.use((config) => {
  const token = store.getState().auth.token || getStoredToken();

  if (token && !config.headers?.Authorization) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`
    };
  }

  return config;
});

axios.interceptors.response.use(
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
      refreshPromise ||= axios
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

      return axios(originalRequest);
    } catch (refreshError) {
      store.dispatch(logout());
      return Promise.reject(refreshError);
    }
  }
);
