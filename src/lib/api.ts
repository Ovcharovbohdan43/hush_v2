// API Client для работы с бэкендом
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface Alias {
  id: string;
  address: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface CreateAliasRequest {
  alias_type: 'random' | 'custom' | 'temporary';
  custom?: string;
  ttl_minutes?: number;
}

export interface TargetEmail {
  email: string;
  verified: boolean;
}

export interface EmailLog {
  id: string;
  alias_id: string;
  from_email: string;
  subject: string;
  received_at: string;
  status: string;
}

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    // Загружаем токен из storage (localStorage или chrome.storage)
    this.loadToken();
  }

  private async loadToken() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['access_token'], (result) => {
        this.accessToken = result.access_token || null;
      });
    } else {
      this.accessToken = localStorage.getItem('access_token');
    }
  }

  private async saveToken(key: string, value: string) {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await new Promise<void>((resolve) => {
        chrome.storage.local.set({ [key]: value }, () => resolve());
      });
    } else {
      localStorage.setItem(key, value);
    }
  }

  private async removeToken(key: string) {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await new Promise<void>((resolve) => {
        chrome.storage.local.remove([key], () => resolve());
      });
    } else {
      localStorage.removeItem(key);
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: response.statusText,
      }));
      throw new Error(error.error || error.message || 'Request failed');
    }

    return response.json();
  }

  // Auth endpoints
  async register(data: RegisterRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    await this.setAccessToken(response.access_token);
    await this.saveToken('refresh_token', response.refresh_token);
    return response;
  }

  async refresh(refreshToken: string): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/api/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    await this.setAccessToken(response.access_token);
    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/api/v1/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      // Ignore errors on logout
    } finally {
      this.clearTokens();
    }
  }

  // Alias endpoints
  async listAliases(): Promise<{ aliases: Alias[] }> {
    return this.request<{ aliases: Alias[] }>('/api/v1/aliases');
  }

  async createAlias(data: CreateAliasRequest): Promise<Alias> {
    return this.request<Alias>('/api/v1/aliases', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteAlias(id: string): Promise<void> {
    await this.request(`/api/v1/aliases/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleAlias(id: string): Promise<Alias> {
    return this.request<Alias>(`/api/v1/aliases/${id}/toggle`, {
      method: 'POST',
    });
  }

  async getAliasLogs(id: string, limit?: number): Promise<{ logs: EmailLog[] }> {
    const params = limit ? `?limit=${limit}` : '';
    const response = await this.request<any>(`/api/v1/aliases/${id}/logs${params}`);
    // API возвращает объект с полем logs, где каждый лог имеет поля from, subject, status, time
    return {
      logs: (response.logs || []).map((log: any) => ({
        id: log.id || '',
        alias_id: id,
        from_email: log.from || log.from_email || '',
        subject: log.subject || '',
        received_at: log.time || log.received_at || '',
        status: log.status || 'unknown',
      })),
    };
  }

  // Target email endpoints
  async getTargetEmail(): Promise<TargetEmail> {
    const response = await this.request<any>('/api/v1/targets');
    // API возвращает null если target email не установлен, или объект с полями email и verified
    if (!response || response === null) {
      return {
        email: '',
        verified: false,
      };
    }
    return {
      email: response.email || '',
      verified: response.verified || false,
    };
  }

  async requestVerification(email: string): Promise<void> {
    await this.request('/api/v1/targets/request_verify', {
      method: 'POST',
      body: JSON.stringify({ target: email }),
    });
  }

  // Health check
  async healthCheck(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/health`);
    return response.text();
  }

  // Token management
  async setAccessToken(token: string) {
    this.accessToken = token;
    await this.saveToken('access_token', token);
  }

  async clearTokens() {
    this.accessToken = null;
    await this.removeToken('access_token');
    await this.removeToken('refresh_token');
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }
}

export const apiClient = new ApiClient();

