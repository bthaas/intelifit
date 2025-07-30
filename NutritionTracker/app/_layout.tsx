import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { useSettingsStore } from '../src/stores';
import { db } from '../src/database';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Initialize database on app start
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await db.initialize();
        console.log('Database initialized successfully');
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };

    initializeApp();
  }, []);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { theme } = useSettingsStore();

  // Determine theme based on user preference
  const resolvedTheme = theme === 'system' ? colorScheme : theme;

  return (
    <ThemeProvider value={resolvedTheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen 
          name="food-search" 
          options={{ 
            title: 'Add Food',
            presentation: 'modal',
          }} 
        />
        <Stack.Screen 
          name="food-details" 
          options={{ 
            title: 'Food Details',
            presentation: 'modal',
          }} 
        />
        <Stack.Screen 
          name="barcode-scanner" 
          options={{ 
            title: 'Scan Barcode',
            presentation: 'modal',
          }} 
        />
        <Stack.Screen 
          name="add-workout" 
          options={{ 
            title: 'Add Workout',
            presentation: 'modal',
          }} 
        />
        <Stack.Screen 
          name="weight-entry" 
          options={{ 
            title: 'Log Weight',
            presentation: 'modal',
          }} 
        />
        <Stack.Screen 
          name="profile-setup" 
          options={{ 
            title: 'Profile Setup',
            presentation: 'modal',
          }} 
        />
      </Stack>
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
