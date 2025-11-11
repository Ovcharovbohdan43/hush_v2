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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Проверяем наличие токена при загрузке
    const token = apiClient.getAccessToken();
    setIsAuthenticated(!!token);
    setIsLoading(false);

    // Пытаемся обновить токен если есть refresh token
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken && token) {
      refreshTokenSilently(refreshToken);
    }
  }, []);

  const refreshTokenSilently = async (refreshToken: string) => {
    try {
      await apiClient.refresh(refreshToken);
      setIsAuthenticated(true);
    } catch (error) {
      // Если refresh не удался, очищаем токены
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
    // После регистрации автоматически логинимся
    await login(data);
  };

  const logout = async () => {
    await apiClient.logout();
    setIsAuthenticated(false);
  };

  const refreshToken = async () => {
    const refreshTokenValue = localStorage.getItem('refresh_token');
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

