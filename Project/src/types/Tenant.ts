export interface Tenant {
  id: string;
  name: string;
  code: string; // 고유한 기업 코드
  description: string;
  status: 'active' | 'inactive' | 'suspended';
  plan: 'free' | 'basic' | 'premium' | 'enterprise';
  maxUsers: number;
  maxProjects: number;
  createdAt: string;
  updatedAt: string;
  settings: TenantSettings;
  metadata?: Record<string, any>;
}

export interface TenantSettings {
  allowedCategories: string[];
  allowedProjectTypes: string[];
  customFields: CustomField[];
  branding: BrandingSettings;
  security: SecuritySettings;
}

export interface CustomField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'boolean';
  required: boolean;
  options?: string[]; // select 타입일 때 사용
  defaultValue?: any;
}

export interface BrandingSettings {
  logo?: string;
  primaryColor: string;
  companyName: string;
  contactEmail: string;
  contactPhone?: string;
}

export interface SecuritySettings {
  passwordPolicy: PasswordPolicy;
  sessionTimeout: number; // 분 단위
  mfaRequired: boolean;
  ipWhitelist?: string[];
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge: number; // 일 단위
}

export interface CreateTenantRequest {
  name: string;
  code: string;
  description: string;
  plan: 'free' | 'basic' | 'premium' | 'enterprise';
  maxUsers: number;
  maxProjects: number;
  settings: TenantSettings;
  metadata?: Record<string, any>;
}

export interface UpdateTenantRequest {
  id: string;
  name?: string;
  description?: string;
  status?: 'active' | 'inactive' | 'suspended';
  plan?: 'free' | 'basic' | 'premium' | 'enterprise';
  maxUsers?: number;
  maxProjects?: number;
  settings?: Partial<TenantSettings>;
  metadata?: Record<string, any>;
}
