import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '@/services/storage';

// 1. Definimos que informacion va a tener nuestro contexto de autenticacion
type AuthContextType = {
  token: string | null;
  isLoading: boolean;
  login: (newToken: string) => Promise<void>;
  logout: () => Promise<void>;
};

// 2. Creamos el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Creamos el Provider
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await storage.getItem('userToken');
        if (storedToken) {
          setToken(storedToken);
        }
      } catch (error) {
        console.error('Error al cargar el token:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadToken();
  }, []);

  const login = async (newToken: string) => {
    try {
      await storage.setItem('userToken', newToken);
      setToken(newToken);
    } catch (error) {
      console.error('Error al guardar el token:', error);
    }
  };

  const logout = async () => {
    try {
      await storage.deleteItem('userToken');
      setToken(null);
    } catch (error) {
      console.error('Error al borrar el token:', error);
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
