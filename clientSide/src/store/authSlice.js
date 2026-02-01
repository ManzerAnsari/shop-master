// src/store/authSlice.js
import { createSlice } from "@reduxjs/toolkit";

const REFRESH_TOKEN_KEY = "refreshToken";

const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    setTokens(state, action) {
      const { accessToken, refreshToken } = action.payload;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken ?? state.refreshToken;
      state.isAuthenticated = true;
      if (refreshToken !== undefined) {
        try {
          sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        } catch (_) {}
      }
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      try {
        sessionStorage.removeItem(REFRESH_TOKEN_KEY);
      } catch (_) {}
    },
  },
});

export const { setUser, setTokens, logout } = authSlice.actions;
export const getStoredRefreshToken = () => {
  try {
    return sessionStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
};
export default authSlice.reducer;
