// src/services/auth.js
import api from "../lib/axios";

// Login – returns { user, accessToken, refreshToken, expiresIn }
export const loginAPI = (credentials) =>
  api.post("/auth/login", credentials).then((res) => res.data);

// Register
export const registerAPI = (data) => api.post("/auth/register", data).then((res) => res.data);

// Refresh – exchange refreshToken for new accessToken and refreshToken (no auth header)
export const refreshAPI = (refreshToken) =>
  api
    .post("/auth/refresh", { refreshToken }, { skipAuthRefresh: true })
    .then((res) => res.data);

// Get current user (requires Authorization: Bearer <accessToken>)
export const meAPI = () => api.get("/auth/me").then((res) => res.data);

// Logout – optionally send refreshToken to invalidate it server-side
export const logoutAPI = (refreshToken) =>
  api
    .post("/auth/logout", refreshToken != null ? { refreshToken } : {}, { skipAuthRefresh: true })
    .then((res) => res.data);

/**
 * Verifies the validity of the current authentication token
 * 
 * Makes a GET request to the /auth/verify endpoint to check if the user's
 * JWT token is still valid without fetching full user data. This is useful
 * for checking session validity before performing authenticated operations.
 * 
 * @returns {Promise<{valid: boolean, userId: string}>} Promise that resolves to an object containing:
 *   - valid: boolean indicating if the token is valid
 *   - userId: string containing the authenticated user's ID
 * @throws {Error} Throws an error if the token is invalid, expired, or missing
 * 
 * @example
 * try {
 *   const { valid, userId } = await verifyAPI();
 *   if (valid) {
 *     console.log('User is authenticated:', userId);
 *   }
 * } catch (error) {
 *   console.error('Token verification failed:', error);
 * }
 */
export const verifyAPI = () => api.get("/auth/verify").then((res) => res.data);
