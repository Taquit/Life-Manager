import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuración de Axios con timeout extendido para soportar cold-starts de Lambda y conexiones móviles
const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 25000, // 25 segundos para evitar 'error de conexión' por cold-start
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Peticiones: inyecta el token Bearer
api.interceptors.request.use(
  async (config) => {
    let token = null;
    try {
      token = await SecureStore.getItemAsync('userToken');
    } catch (error) {
      console.log('Error leyendo SecureStore (pantalla bloqueada o no accesible).');
    }

    if (!token) {
      try {
        token = await AsyncStorage.getItem('backgroundToken');
      } catch (e) {
        console.error('Error leyendo AsyncStorage:', e);
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Respuestas con Reintento Automático para errores de conexión
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retryCount?: number };

    // Si es error 401 (No autorizado / token expirado), limpiar sesión
    if (error.response?.status === 401) {
      console.log('Token inválido o expirado. Limpiando credenciales...');
      try {
        await SecureStore.deleteItemAsync('userToken');
        await AsyncStorage.removeItem('backgroundToken');
      } catch (_) {}
      return Promise.reject(error);
    }

    // Reintento automático para peticiones idempotentes o caídas de red transitorias
    const isNetworkOrTimeout =
      !error.response ||
      error.code === 'ECONNABORTED' ||
      error.code === 'ERR_NETWORK' ||
      error.message?.includes('Network Error') ||
      error.message?.includes('timeout') ||
      (error.response?.status >= 502 && error.response?.status <= 504);

    if (originalRequest && isNetworkOrTimeout) {
      originalRequest._retryCount = originalRequest._retryCount || 0;

      // Reintentar hasta 2 veces para GET, 1 vez para otros métodos si fue timeout/red
      const maxRetries = originalRequest.method?.toLowerCase() === 'get' ? 2 : 1;

      if (originalRequest._retryCount < maxRetries) {
        originalRequest._retryCount += 1;
        const delay = 1000 * originalRequest._retryCount;
        console.warn(`[API] Reintentando petición (${originalRequest._retryCount}/${maxRetries}) a ${originalRequest.url} en ${delay}ms por:`, error.message);
        
        await new Promise((resolve) => setTimeout(resolve, delay));
        return api(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Helper para formatear mensajes de error claros para el usuario
 */
export const getErrorMessage = (error: any): string => {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return 'El servidor tardó demasiado en responder. Por favor reintenta.';
    }
    if (error.message?.includes('Network Error') || !error.response) {
      return 'Error de conexión. Verifica tu conexión a internet o el estado del servidor.';
    }
    if (error.response?.data && typeof error.response.data === 'object') {
      const data = error.response.data as any;
      return data.error || data.message || 'Error en la solicitud.';
    }
  }
  return error?.message || 'Ocurrió un error inesperado.';
};

export default api;
