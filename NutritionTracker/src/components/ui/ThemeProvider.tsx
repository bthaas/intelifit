import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { useSettingsStore } from '../../stores';
import { ThemeColors } from '../../types';

const lightTheme: ThemeColors = {
  background: '#FFFFFF', // White
  surface: '#f8f9fa', // Light gray for cards/surfaces
  primary: '#00693E', // Dartmouth Green
  secondary: '#95C623', // Yellow Green
  text: '#000000', // Black
  textSecondary: '#6c757d', // Gray for secondary text
  border: '#dee2e6', // Light border
  error: '#dc3545', // Red for errors
  success: '#95C623', // Yellow Green for success
  warning: '#FDD11D', // Jonquil for warnings
};

const darkTheme: ThemeColors = {
  background: '#000000', // Black
  surface: '#1e1e1e', // Dark gray for cards/surfaces
  primary: '#00693E', // Dartmouth Green
  secondary: '#95C623', // Yellow Green
  text: '#FFFFFF', // White
  textSecondary: '#adb5bd', // Light gray for secondary text
  border: '#333333', // Dark border
  error: '#ff6b6b', // Red for errors
  success: '#95C623', // Yellow Green for success
  warning: '#FDD11D', // Jonquil for warnings
};

const ThemeContext = createContext<ThemeColors>(lightTheme);

export const useAppTheme = (): ThemeColors => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const AppThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const colorScheme = useColorScheme();
  const { theme } = useSettingsStore();
  
  // Determine theme based on user preference
  const resolvedTheme = theme === 'system' ? colorScheme : theme;
  const currentTheme = resolvedTheme === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={currentTheme}>
      {children}
    </ThemeContext.Provider>
  );
};