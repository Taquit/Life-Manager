import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// 1. Crea la instancia de axios con la URL de tu backend
const api = axios.create({
  // Lee la URL desde tu archivo .env
  baseURL: process.env.EXPO_PUBLIC_API_URL, 
  timeout: 10000, 
});

// 2. Interceptor de Peticiones (Se ejecuta ANTES de enviar CUALQUIER solicitud)
api.interceptors.request.use(
  async (config) => {
    try {
      // 2.1 Buscamos si el usuario ya tiene un token guardado (ENCRIPTADO)
      const token = await SecureStore.getItemAsync('userToken');
      
      // 2.2 Si existe el token, se lo inyectamos a los Headers automáticamente
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error leyendo el token:', error);
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
