import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  THEMES,
  TEXT_SIZES,
  DEFAULT_THEME_SETTINGS,
  THEME_STORAGE_KEY,
  getThemeColors,
  themeToCSSVariables,
  TEXT_SIZE_MULTIPLIERS,
} from '../config/themeConfig';

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    // Load saved preferences from localStorage
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      return saved ? { ...DEFAULT_THEME_SETTINGS, ...JSON.parse(saved) } : DEFAULT_THEME_SETTINGS;
    } catch (error) {
      console.error('Failed to load theme preferences:', error);
      return DEFAULT_THEME_SETTINGS;
    }
  });

  const [systemTheme, setSystemTheme] = useState(() => {
    // Detect system theme preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return THEMES.DARK;
    }
    return THEMES.LIGHT;
  });

  // Get effective theme (considering auto mode)
  const effectiveTheme = settings.theme === THEMES.AUTO ? systemTheme : settings.theme;

  // Save preferences to localStorage
  const savePreferences = useCallback((newSettings) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Failed to save theme preferences:', error);
    }
  }, []);

  // Update theme
  const setTheme = useCallback((theme) => {
    const newSettings = { ...settings, theme };
    setSettings(newSettings);
    savePreferences(newSettings);
  }, [settings, savePreferences]);

  // Toggle high contrast
  const toggleHighContrast = useCallback(() => {
    const newSettings = { ...settings, highContrast: !settings.highContrast };
    setSettings(newSettings);
    savePreferences(newSettings);
  }, [settings, savePreferences]);

  // Set text size
  const setTextSize = useCallback((size) => {
    const newSettings = { ...settings, textSize: size };
    setSettings(newSettings);
    savePreferences(newSettings);
  }, [settings, savePreferences]);

  // Toggle reduce motion
  const toggleReduceMotion = useCallback(() => {
    const newSettings = { ...settings, reduceMotion: !settings.reduceMotion };
    setSettings(newSettings);
    savePreferences(newSettings);
  }, [settings, savePreferences]);

  // Toggle keyboard shortcuts
  const toggleKeyboardShortcuts = useCallback(() => {
    const newSettings = { ...settings, keyboardShortcuts: !settings.keyboardShortcuts };
    setSettings(newSettings);
    savePreferences(newSettings);
  }, [settings, savePreferences]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      setSystemTheme(e.matches ? THEMES.DARK : THEMES.LIGHT);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Legacy browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    const colors = getThemeColors(effectiveTheme, settings.highContrast);
    const cssVars = themeToCSSVariables(colors);

    // Apply CSS variables to root
    Object.entries(cssVars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });

    // Apply theme class to body
    document.body.className = `theme-${effectiveTheme}${settings.highContrast ? ' high-contrast' : ''}`;

    // Apply text size
    const textSizeMultiplier = TEXT_SIZE_MULTIPLIERS[settings.textSize];
    document.documentElement.style.setProperty('--text-size-multiplier', textSizeMultiplier);

    // Apply reduce motion
    if (settings.reduceMotion) {
      document.documentElement.style.setProperty('--transition-duration', '0ms');
    } else {
      document.documentElement.style.setProperty('--transition-duration', '200ms');
    }

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', colors.background);
    }
  }, [effectiveTheme, settings]);

  const value = {
    // Current settings
    theme: settings.theme,
    effectiveTheme,
    highContrast: settings.highContrast,
    textSize: settings.textSize,
    reduceMotion: settings.reduceMotion,
    keyboardShortcuts: settings.keyboardShortcuts,
    systemTheme,
    
    // Theme colors
    colors: getThemeColors(effectiveTheme, settings.highContrast),
    
    // Actions
    setTheme,
    toggleHighContrast,
    setTextSize,
    toggleReduceMotion,
    toggleKeyboardShortcuts,
    
    // Helpers
    isDark: effectiveTheme === THEMES.DARK,
    isLight: effectiveTheme === THEMES.LIGHT,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeContext;
