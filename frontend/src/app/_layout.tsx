import { DarkTheme, DefaultTheme, Slot, ThemeProvider, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme, AppState } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { flushOfflineQueue } from '@/services/offlineQueue';

SplashScreen.preventAutoHideAsync();

// Este es el "guardia de seguridad" global de la app
function RootLayoutNav() {
  const { token, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Con los grupos, sabemos que cualquier pantalla dentro de (auth) no requiere sesión
    const inAuthGroup = segments[0] === '(auth)';

    if (!token && !inAuthGroup) {
      // Si no hay token y quiere entrar a la app, lo mandamos a login
      router.replace('/(auth)/login');
    } else if (token && inAuthGroup) {
      // Si ya tiene sesión pero quiere ver el login/registro, lo regresamos adentro
      router.replace('/');
    }
  }, [token, segments, isLoading]);

  // Vaciado de cola offline al regresar a primer plano
  useEffect(() => {
    const handleAppStateChange = (nextAppState: any) => {
      if (nextAppState === 'active') {
        flushOfflineQueue().catch((err) => {
          console.error('Error sincronizando cola offline:', err);
        });
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <>
      <AnimatedSplashOverlay />
      {/* Slot cargará (auth)/_layout.tsx o (tabs)/_layout.tsx automáticamente dependiendo de la URL */}
      <Slot />
    </>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  );
}
