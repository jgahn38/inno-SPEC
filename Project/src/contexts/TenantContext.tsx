import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Tenant, User } from '../types';

interface TenantContextType {
  currentTenant: Tenant | null;
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (tenantCode: string, username: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchTenant: (tenantId: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 초기 로드 시 저장된 인증 정보 확인
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const tenantId = localStorage.getItem('current_tenant_id');
        const userId = localStorage.getItem('current_user_id');

        if (token && tenantId && userId) {
          // 토큰 유효성 검사 및 사용자 정보 로드
          await refreshUser();
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        // 저장된 인증 정보가 유효하지 않으면 제거
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_tenant_id');
        localStorage.removeItem('current_user_id');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (tenantCode: string, username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // 실제 구현에서는 API 호출
      // const response = await authService.login({ tenantCode, username, password });
      
      // 임시 로그인 로직 (개발용)
      const mockTenant: Tenant = {
        id: 'tenant-1',
        name: '테스트 기업',
        code: tenantCode,
        description: '테스트용 기업 계정',
        status: 'active',
        plan: 'premium',
        maxUsers: 100,
        maxProjects: 1000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        settings: {
          allowedCategories: ['general', 'bridge', 'building', 'infrastructure', 'research'],
          allowedProjectTypes: ['concrete', 'steel', 'composite'],
          customFields: [],
          branding: {
            primaryColor: '#3b82f6',
            companyName: '테스트 기업',
            contactEmail: 'contact@test.com'
          },
          security: {
            passwordPolicy: {
              minLength: 8,
              requireUppercase: true,
              requireLowercase: true,
              requireNumbers: true,
              requireSpecialChars: true,
              maxAge: 90
            },
            sessionTimeout: 480,
            mfaRequired: false
          }
        }
      };

      const mockUser: User = {
        id: 'user-1',
        tenantId: mockTenant.id,
        username,
        email: `${username}@test.com`,
        firstName: '테스트',
        lastName: '사용자',
        role: 'tenant_admin',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        profile: {
          timezone: 'Asia/Seoul',
          language: 'ko'
        },
        permissions: [
          { resource: 'project', action: 'create' },
          { resource: 'project', action: 'read' },
          { resource: 'project', action: 'update' },
          { resource: 'project', action: 'delete' },
          { resource: 'user', action: 'read' },
          { resource: 'tenant', action: 'read' }
        ]
      };

      // 인증 정보 저장
      localStorage.setItem('auth_token', 'mock_token_' + Date.now());
      localStorage.setItem('current_tenant_id', mockTenant.id);
      localStorage.setItem('current_user_id', mockUser.id);

      setCurrentTenant(mockTenant);
      setCurrentUser(mockUser);
      setIsAuthenticated(true);

      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_tenant_id');
    localStorage.removeItem('current_user_id');
    
    setCurrentTenant(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const switchTenant = async (tenantId: string) => {
    try {
      // 실제 구현에서는 API 호출
      // const tenant = await tenantService.getTenantById(tenantId);
      // setCurrentTenant(tenant);
      
      console.log('Switching to tenant:', tenantId);
    } catch (error) {
      console.error('Failed to switch tenant:', error);
    }
  };

  const refreshUser = async () => {
    try {
      const tenantId = localStorage.getItem('current_tenant_id');
      const userId = localStorage.getItem('current_user_id');
      
      if (tenantId && userId) {
        // 실제 구현에서는 API 호출
        // const user = await userService.getUserById(userId);
        // const tenant = await tenantService.getTenantById(tenantId);
        // setCurrentUser(user);
        // setCurrentTenant(tenant);
        
        console.log('Refreshing user data for tenant:', tenantId);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      logout();
    }
  };

  const value: TenantContextType = {
    currentTenant,
    currentUser,
    isAuthenticated,
    isLoading,
    login,
    logout,
    switchTenant,
    refreshUser
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
