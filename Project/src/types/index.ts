// 새로운 타입 정의들을 명시적으로 export
export { Project, CreateProjectRequest, UpdateProjectRequest } from './Project';
export { Bridge } from './Bridge';
export { Tenant, TenantSettings, CustomField, BrandingSettings, SecuritySettings, PasswordPolicy, CreateTenantRequest, UpdateTenantRequest } from './Tenant';
export { User, UserRole, UserProfile, Permission, CreateUserRequest, UpdateUserRequest, LoginRequest, LoginResponse } from './User';

// 프로젝트 데이터 제공자 인터페이스
export interface IProjectDataProvider {
  /**
   * 모든 프로젝트 목록을 가져옵니다
   */
  getProjects(): Promise<Project[]>;
  
  /**
   * 특정 ID의 프로젝트를 가져옵니다
   */
  getProjectById(id: string): Promise<Project | null>;
  
  /**
   * 새 프로젝트를 생성합니다
   */
  createProject(request: CreateProjectRequest): Promise<Project>;
  
  /**
   * 기존 프로젝트를 업데이트합니다
   */
  updateProject(request: UpdateProjectRequest): Promise<Project>;
  
  /**
   * 프로젝트를 삭제합니다 (soft delete)
   */
  deleteProject(id: string): Promise<void>;
  
  /**
   * 프로젝트를 복원합니다
   */
  restoreProject(id: string): Promise<void>;
  
  /**
   * 프로젝트를 완전히 삭제합니다 (hard delete)
   */
  hardDeleteProject(id: string): Promise<void>;
}

export interface TableRow {
  id: string;
  parameter: string;
  value: string;
  unit: string;
  description: string;
}

export interface CheckItem {
  id: string;
  category: string;
  description: string;
  result: 'OK' | 'NG' | 'PENDING';
  value?: string;
  criteria?: string;
}

// 공통 테이블 스키마 관련 타입
export interface TableSchema {
  id: string;
  name: string;
  displayName: string;
  fields: TableField[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TableField {
  id: string;
  name: string;
  displayName: string;
  type: FieldType;
  required: boolean;
  description?: string;
  validationRules?: ValidationRule[];
}

export type FieldType = 
  | 'text' 
  | 'number' 
  | 'date' 
  | 'boolean' 
  | 'decimal' 
  | 'integer';

export interface ValidationRule {
  type: 'min' | 'max' | 'pattern' | 'custom';
  value: any;
  message?: string;
}

// M 언어 관련 타입
export interface MCode {
  id: string;
  name: string;
  description?: string;
  code: string;
  tableId: string;
  version: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MTransformation {
  id: string;
  name: string;
  description?: string;
  mCodeId: string;
  tableId: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MExecutionResult {
  success: boolean;
  data?: any[];
  error?: string;
  executionTime: number;
  recordsProcessed: number;
  recordsTransformed: number;
}

// 테이블 데이터 관련 타입
export interface TableData {
  id: string;
  tableId: string;
  projectId: string;
  tenantId: string;
  data: Record<string, any>[];
  rowCount: number;
  lastUpdated: Date;
}

// 공통 엔진 설정
export interface CommonEngineConfig {
  version: string;
  supportedTableTypes: string[];
  maxExecutionTime: number;
  maxRecordsPerExecution: number;
  defaultValidationRules: ValidationRule[];
}