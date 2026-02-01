import axios from "axios";
import store from "../store";
import { setTokens, logout, getStoredRefreshToken } from "../store/authSlice";
import { refreshAPI } from "../services/auth";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    if (config.skipAuthRefresh) return config;
    const accessToken = store.getState().auth.accessToken;
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

function processQueue(err, token = null) {
  failedQueue.forEach((prom) => (err ? prom.reject(err) : prom.resolve(token)));
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest.skipAuthRefresh) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => api(originalRequest))
        .catch((err) => Promise.reject(err));
    }

    isRefreshing = true;
    const refreshToken =
      store.getState().auth.refreshToken || getStoredRefreshToken();

    if (!refreshToken) {
      store.dispatch(logout());
      isRefreshing = false;
      return Promise.reject(error);
    }

    return refreshAPI(refreshToken)
      .then((data) => {
        store.dispatch(
          setTokens({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken ?? refreshToken,
          })
        );
        processQueue(null, data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      })
      .catch((err) => {
        processQueue(err, null);
        store.dispatch(logout());
        return Promise.reject(err ?? error);
      })
      .finally(() => {
        isRefreshing = false;
      });
  }
);

export default api;
