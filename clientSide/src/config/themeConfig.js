/**
 * Theme Configuration
 * Defines color palettes and theme settings for light, dark, and high contrast modes
 */

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',
};

export const TEXT_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
  XLARGE: 'xlarge',
};

// Light theme colors
export const LIGHT_THEME = {
  // Primary colors
  primary: '#1976d2',
  primaryLight: '#42a5f5',
  primaryDark: '#1565c0',
  
  // Background colors
  background: '#ffffff',
  backgroundAlt: '#f5f5f5',
  backgroundElevated: '#ffffff',
  
  // Text colors
  textPrimary: '#212121',
  textSecondary: '#757575',
  textDisabled: '#bdbdbd',
  
  // Border colors
  border: '#e0e0e0',
  borderLight: '#f5f5f5',
  
  // Status colors
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',
  
  // Interactive elements
  hover: 'rgba(0, 0, 0, 0.04)',
  active: 'rgba(0, 0, 0, 0.08)',
  focus: '#1976d2',
  
  // Shadows
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowMedium: 'rgba(0, 0, 0, 0.15)',
  shadowLarge: 'rgba(0, 0, 0, 0.2)',
};

// Dark theme colors
export const DARK_THEME = {
  // Primary colors
  primary: '#90caf9',
  primaryLight: '#bbdefb',
  primaryDark: '#64b5f6',
  
  // Background colors
  background: '#121212',
  backgroundAlt: '#1e1e1e',
  backgroundElevated: '#2c2c2c',
  
  // Text colors
  textPrimary: '#ffffff',
  textSecondary: '#b0b0b0',
  textDisabled: '#6b6b6b',
  
  // Border colors
  border: '#3a3a3a',
  borderLight: '#2c2c2c',
  
  // Status colors
  success: '#66bb6a',
  warning: '#ffa726',
  error: '#ef5350',
  info: '#42a5f5',
  
  // Interactive elements
  hover: 'rgba(255, 255, 255, 0.08)',
  active: 'rgba(255, 255, 255, 0.12)',
  focus: '#90caf9',
  
  // Shadows
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowMedium: 'rgba(0, 0, 0, 0.4)',
  shadowLarge: 'rgba(0, 0, 0, 0.5)',
};

// High contrast light theme
export const HIGH_CONTRAST_LIGHT = {
  ...LIGHT_THEME,
  primary: '#0000ff',
  textPrimary: '#000000',
  textSecondary: '#000000',
  border: '#000000',
  success: '#008000',
  warning: '#ff8c00',
  error: '#ff0000',
  focus: '#0000ff',
};

// High contrast dark theme
export const HIGH_CONTRAST_DARK = {
  ...DARK_THEME,
  primary: '#00ffff',
  textPrimary: '#ffffff',
  textSecondary: '#ffffff',
  border: '#ffffff',
  success: '#00ff00',
  warning: '#ffff00',
  error: '#ff0000',
  focus: '#00ffff',
};

// Text size multipliers
export const TEXT_SIZE_MULTIPLIERS = {
  [TEXT_SIZES.SMALL]: 0.875,
  [TEXT_SIZES.MEDIUM]: 1,
  [TEXT_SIZES.LARGE]: 1.125,
  [TEXT_SIZES.XLARGE]: 1.25,
};

// Default theme settings
export const DEFAULT_THEME_SETTINGS = {
  theme: THEMES.AUTO,
  highContrast: false,
  textSize: TEXT_SIZES.MEDIUM,
  reduceMotion: false,
  keyboardShortcuts: true,
};

// Storage key for theme preferences
export const THEME_STORAGE_KEY = 'shop_theme_preferences';

/**
 * Get theme colors based on settings
 * @param {string} theme - Theme name
 * @param {boolean} highContrast - High contrast mode enabled
 * @returns {Object} Theme colors
 */
export const getThemeColors = (theme, highContrast = false) => {
  if (highContrast) {
    return theme === THEMES.DARK ? HIGH_CONTRAST_DARK : HIGH_CONTRAST_LIGHT;
  }
  return theme === THEMES.DARK ? DARK_THEME : LIGHT_THEME;
};

/**
 * Convert theme colors to CSS variables
 * @param {Object} colors - Theme colors object
 * @returns {Object} CSS variables object
 */
export const themeToCSSVariables = (colors) => {
  const cssVars = {};
  Object.entries(colors).forEach(([key, value]) => {
    // Convert camelCase to kebab-case
    const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    cssVars[`--color-${cssKey}`] = value;
  });
  return cssVars;
};

export default {
  THEMES,
  TEXT_SIZES,
  LIGHT_THEME,
  DARK_THEME,
  HIGH_CONTRAST_LIGHT,
  HIGH_CONTRAST_DARK,
  TEXT_SIZE_MULTIPLIERS,
  DEFAULT_THEME_SETTINGS,
  THEME_STORAGE_KEY,
  getThemeColors,
  themeToCSSVariables,
};
