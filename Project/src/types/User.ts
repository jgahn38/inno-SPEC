export interface User {
  id: string;
  tenantId: string; // 테넌트 ID
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'suspended';
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  profile: UserProfile;
  permissions: Permission[];
  metadata?: Record<string, any>;
}

export type UserRole = 'super_admin' | 'tenant_admin' | 'project_manager' | 'engineer' | 'viewer';

export interface UserProfile {
  avatar?: string;
  phone?: string;
  department?: string;
  position?: string;
  bio?: string;
  timezone: string;
  language: string;
}

export interface Permission {
  resource: string; // 'project', 'user', 'tenant', 'report' 등
  action: string; // 'create', 'read', 'update', 'delete' 등
  conditions?: Record<string, any>; // 추가 조건
}

export interface CreateUserRequest {
  tenantId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  profile: Partial<UserProfile>;
  permissions?: Permission[];
  metadata?: Record<string, any>;
}

export interface UpdateUserRequest {
  id: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  status?: 'active' | 'inactive' | 'suspended';
  profile?: Partial<UserProfile>;
  permissions?: Permission[];
  metadata?: Record<string, any>;
}

export interface LoginRequest {
  tenantCode: string; // 테넌트 코드
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  tenant: Tenant;
  token: string;
  refreshToken: string;
  expiresAt: string;
}
