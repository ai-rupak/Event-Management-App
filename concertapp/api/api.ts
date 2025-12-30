import { API_BASE } from "@/constants";
import { useAuthStore } from "@/stores/authStore";
import axios from "axios";
import * as SecureStore from "expo-secure-store";

const api = axios.create({
    baseURL: API_BASE,

});
export default api;


api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status == 401) {
      const refreshToken = await SecureStore.getItemAsync("refreshToken");
      if (!refreshToken) {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(`${API_BASE}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefresh } = res.data;
        await useAuthStore.getState().setTokens(accessToken, newRefresh);
      } catch (refreshError) {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);