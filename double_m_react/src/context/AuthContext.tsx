import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

// 1. Definimos qué información va a tener nuestro "altavoz"
type AuthContextType = {
  token: string | null;
  isLoading: boolean;
  login: (newToken: string) => Promise<void>;
  logout: () => Promise<void>;
};

// 2. Creamos el contexto (La estación de radio)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Creamos el Provider (El Transmisor que envuelve a la app)
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  
  // isLoading empieza en true porque al arrancar la app no sabemos si hay sesión
  const [isLoading, setIsLoading] = useState(true); 

  useEffect(() => {
    // Al abrir la app, revisamos la bóveda segura silenciosamente
    const loadToken = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('userToken');
        if (storedToken) {
          setToken(storedToken); // ¡Encontramos sesión!
        }
      } catch (error) {
        console.error("Error al cargar el token:", error);
      } finally {
        // Ya terminamos de buscar, sea que encontramos algo o no
        setIsLoading(false); 
      }
    };

    loadToken();
  }, []);

  // Función para iniciar sesión (Guarda en la bóveda y avisa a la app)
  const login = async (newToken: string) => {
    try {
      await SecureStore.setItemAsync('userToken', newToken);
      setToken(newToken);
    } catch (error) {
      console.error("Error al guardar el token:", error);
    }
  };

  // Función para cerrar sesión (Borra de la bóveda y avisa a la app)
  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('userToken');
      setToken(null);
    } catch (error) {
      console.error("Error al borrar el token:", error);
    }
  };

  // Transmitimos estas 4 cosas a todos los {children} (las pantallas)
  return (
    <AuthContext.Provider value={{ token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 4. Hook personalizado (El "receptor" que usarás en tus pantallas)
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
