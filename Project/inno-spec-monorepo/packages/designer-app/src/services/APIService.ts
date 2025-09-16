import { ScreenConfig, LNBConfig } from '@inno-spec/shared';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class APIService {
  private getHeaders(): HeadersInit {
    const tenantId = localStorage.getItem('currentTenantId') || 'default-tenant';
    return {
      'Content-Type': 'application/json',
      'x-tenant-id': tenantId,
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      // API 서버가 실행되지 않은 경우 로컬 스토리지 fallback
      console.warn('API 서버에 연결할 수 없습니다. 로컬 스토리지를 사용합니다.');
      return this.fallbackToLocalStorage<T>(endpoint, options);
    }
  }

  private fallbackToLocalStorage<T>(
    endpoint: string,
    options: RequestInit
  ): ApiResponse<T> {
    try {
      if (endpoint === '/screens') {
        if (options.method === 'GET') {
          const screens = JSON.parse(localStorage.getItem('screenConfigs') || '[]');
          return { success: true, data: screens as T };
        }
      } else if (endpoint === '/lnb') {
        if (options.method === 'GET') {
          const lnbConfigs = JSON.parse(localStorage.getItem('lnbConfigs') || '[]');
          return { success: true, data: lnbConfigs as T };
        }
      }
      
      return {
        success: false,
        error: 'API 서버가 실행되지 않았습니다. 로컬 스토리지에서 데이터를 불러올 수 없습니다.',
      };
    } catch (error) {
      return {
        success: false,
        error: '로컬 스토리지에서 데이터를 불러올 수 없습니다.',
      };
    }
  }

  // 화면 관련 API
  async getScreens(): Promise<ApiResponse<ScreenConfig[]>> {
    return this.request<ScreenConfig[]>('/screens');
  }

  async getScreenById(id: string): Promise<ApiResponse<ScreenConfig>> {
    return this.request<ScreenConfig>(`/screens/${id}`);
  }

  async createScreen(screen: Omit<ScreenConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<ScreenConfig>> {
    return this.request<ScreenConfig>('/screens', {
      method: 'POST',
      body: JSON.stringify(screen),
    });
  }

  async updateScreen(id: string, screen: Partial<ScreenConfig>): Promise<ApiResponse<ScreenConfig>> {
    return this.request<ScreenConfig>(`/screens/${id}`, {
      method: 'PUT',
      body: JSON.stringify(screen),
    });
  }

  async deleteScreen(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/screens/${id}`, {
      method: 'DELETE',
    });
  }

  // LNB 관련 API
  async getLNBConfigs(): Promise<ApiResponse<LNBConfig[]>> {
    return this.request<LNBConfig[]>('/lnb');
  }

  async getLNBConfigById(id: string): Promise<ApiResponse<LNBConfig>> {
    return this.request<LNBConfig>(`/lnb/${id}`);
  }

  async createLNBConfig(config: Omit<LNBConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<LNBConfig>> {
    return this.request<LNBConfig>('/lnb', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async updateLNBConfig(id: string, config: Partial<LNBConfig>): Promise<ApiResponse<LNBConfig>> {
    return this.request<LNBConfig>(`/lnb/${id}`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async deleteLNBConfig(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/lnb/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new APIService();
export default APIService;
