import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. Crea la instancia de axios con la URL de tu backend
const api = axios.create({
  // Lee la URL desde tu archivo .env
  baseURL: process.env.EXPO_PUBLIC_API_URL, 
  timeout: 10000, 
});

// 2. Interceptor de Peticiones (Se ejecuta ANTES de enviar CUALQUIER solicitud)
api.interceptors.request.use(
  async (config) => {
    let token = null;
    try {
      // 2.1 Intentamos obtener de SecureStore primero (pantalla desbloqueada)
      token = await SecureStore.getItemAsync('userToken');
    } catch (error) {
      console.log('Error leyendo SecureStore (Posiblemente pantalla bloqueada).');
    }
    
    // 2.2 Fallback: Si no hay token o falló SecureStore, intentamos desde AsyncStorage
    if (!token) {
      try {
        token = await AsyncStorage.getItem('backgroundToken');
      } catch (e) {
        console.error('Error leyendo AsyncStorage:', e);
      }
    }
    
    // 2.3 Si encontramos un token, lo inyectamos
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. (Opcional) Interceptor de Respuestas (Se ejecuta al recibir una respuesta)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Si tu backend devuelve un error 401 (No autorizado / Token expirado)
    if (error.response && error.response.status === 401) {
      console.log('Token inválido o expirado. El usuario debería ser deslogueado.');
      
      // Limpiamos el token del almacenamiento seguro
      await SecureStore.deleteItemAsync('userToken');
    }
    return Promise.reject(error);
  }
);

export default api;
