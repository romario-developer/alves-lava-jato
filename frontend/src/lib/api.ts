import axios from 'axios';
import { useAuthStore } from '../store/auth';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401) {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
          useAuthStore.getState().setAuth(data);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch {
          useAuthStore.getState().logout();
        }
      }
    }
    return Promise.reject(error);
  },
);
