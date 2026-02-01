/**
 * User Service
 * Handles user profile and settings
 */

import api from "../lib/axios";

export const userService = {
  /**
   * Get current user profile
   * @returns {Promise<Object>} User profile
   */
  getProfile: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Updated profile
   */
  updateProfile: async (profileData) => {
    const response = await api.put("/users/profile", profileData);
    return response.data;
  },

  /**
   * Update user password
   * @param {Object} passwordData - Old and new passwords
   * @returns {Promise<Object>} Success message
   */
  updatePassword: async (passwordData) => {
    const response = await api.put("/users/password", passwordData);
    return response.data;
  },

  /**
   * Upload user avatar
   * @param {File} file - Avatar image file
   * @returns {Promise<Object>} Avatar URL
   */
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await api.post("/users/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Get user preferences
   * @returns {Promise<Object>} User preferences
   */
  getPreferences: async () => {
    const response = await api.get("/auth/me");
    return (
      response.data.preferences || {
        currency: "USD",
        language: "en",
        theme: "light",
        notifications: true,
        emailUpdates: false,
      }
    );
  },

  /**
   * Update user preferences
   * @param {Object} preferences - Preferences to update
   * @returns {Promise<Object>} Updated preferences
   */
  updatePreferences: async (preferences) => {
    const response = await api.put("/users/preferences", preferences);
    return response.data.user.preferences;
  },

  /**
   * Get shop settings
   * @returns {Promise<Object>} Shop settings
   */
  getShopSettings: async () => {
    const response = await api.get("/auth/me");
    const user = response.data;
    return {
      shopName: user.shopName,
      ...user.shopSettings,
    };
  },

  /**
   * Update shop settings
   * @param {Object} settings - Shop settings to update
   * @returns {Promise<Object>} Updated settings
   */
  updateShopSettings: async (settings) => {
    const response = await api.put("/users/shop", settings);
    return {
      shopName: response.data.user.shopName,
      ...response.data.user.shopSettings,
    };
  },

  /**
   * Delete user account
   * @returns {Promise<Object>} Deletion confirmation
   */
  deleteAccount: async () => {
    const response = await api.delete("/users/account");
    return response.data;
  },
};

export default userService;
