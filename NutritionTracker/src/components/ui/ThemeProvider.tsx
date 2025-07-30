import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { useSettingsStore } from '../../stores';
import { ThemeColors } from '../../types';

const lightTheme: ThemeColors = {
  background: '#ffffff',
  surface: '#f8f9fa',
  primary: '#4CAF50',
  secondary: '#81C784',
  text: '#212529',
  textSecondary: '#6c757d',
  border: '#dee2e6',
  error: '#dc3545',
  success: '#28a745',
  warning: '#ffc107',
};

const darkTheme: ThemeColors = {
  background: '#121212',
  surface: '#1e1e1e',
  primary: '#81C784',
  secondary: '#4CAF50',
  text: '#ffffff',
  textSecondary: '#adb5bd',
  border: '#333333',
  error: '#ff6b6b',
  success: '#51cf66',
  warning: '#ffd43b',
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