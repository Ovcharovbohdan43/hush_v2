import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient, LoginRequest, RegisterRequest } from '../lib/api';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Хелпер для работы с storage (localStorage или chrome.storage)
const hasChromeStorage = () =>
  typeof chrome !== 'undefined' && typeof chrome.storage?.local !== 'undefined';

const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (hasChromeStorage()) {
      return new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => {
          const rawValue = result?.[key as keyof typeof result] as unknown;
          resolve(typeof rawValue === 'string' ? rawValue : null);
        });
      });
    }
    return localStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (hasChromeStorage()) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: value }, () => resolve());
      });
    }
    localStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (hasChromeStorage()) {
      return new Promise((resolve) => {
        chrome.storage.local.remove([key], () => resolve());
      });
    }
    localStorage.removeItem(key);
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = await storage.getItem('access_token');
      setIsAuthenticated(!!token);
      setIsLoading(false);

      const refreshTokenValue = await storage.getItem('refresh_token');
      if (refreshTokenValue && token) {
        refreshTokenSilently(refreshTokenValue);
      }
    };
    initAuth();
  }, []);

  const refreshTokenSilently = async (refreshToken: string) => {
    try {
      await apiClient.refresh(refreshToken);
      setIsAuthenticated(true);
    } catch (error) {
      apiClient.clearTokens();
      setIsAuthenticated(false);
    }
  };

  const login = async (data: LoginRequest) => {
    await apiClient.login(data);
    setIsAuthenticated(true);
  };

  const register = async (data: RegisterRequest) => {
    await apiClient.register(data);
    await login(data);
  };

  const logout = async () => {
    await apiClient.logout();
    setIsAuthenticated(false);
  };

  const refreshToken = async () => {
    const refreshTokenValue = await storage.getItem('refresh_token');
    if (refreshTokenValue) {
      await refreshTokenSilently(refreshTokenValue);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

