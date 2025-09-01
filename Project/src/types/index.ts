// 새로운 타입 정의들을 명시적으로 export
export { Project, CreateProjectRequest, UpdateProjectRequest } from './Project';
export { Bridge } from './Bridge';
export { Tenant, TenantSettings, CustomField, BrandingSettings, SecuritySettings, PasswordPolicy, CreateTenantRequest, UpdateTenantRequest } from './Tenant';
export { User, UserRole, UserProfile, Permission, CreateUserRequest, UpdateUserRequest, LoginRequest, LoginResponse } from './User';

// 교량별 데이터 관리 타입
export * from './BridgeData';

// CAD 파싱 관련 타입
export { CADEntity, CADData, CADParseResult } from '../services/CADParserService';

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

// 화면 구성 관련 타입
export interface ScreenConfig {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  type: 'dashboard' | 'custom';
  layout: 'single' | 'grid' | 'tabs';
  components: ScreenComponent[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScreenComponent {
  id: string;
  type: 'table' | 'variable' | 'chart' | 'input' | 'output';
  componentId: string; // 테이블 ID 또는 변수 ID
  displayName: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: ComponentConfig;
}

export interface ComponentConfig {
  showHeader?: boolean;
  showPagination?: boolean;
  showSearch?: boolean;
  showFilters?: boolean;
  maxRows?: number;
  refreshInterval?: number;
  customStyles?: Record<string, any>;
}

export interface LNBConfig {
  id: string;
  name: string;
  displayName: string;
  icon?: string;
  order: number;
  screenId?: string; // 연결된 화면 ID
  children?: LNBConfig[]; // 하위 메뉴
  type?: 'independent' | 'parent' | 'child';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScreenTemplate {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  category: 'structural' | 'material' | 'load' | 'analysis' | 'custom';
  defaultComponents: ScreenComponent[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
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

// 교량 내진성능평가 관련 DB 타입들
export interface BridgeDatabase {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: DatabaseCategory;
  version: string;
  lastUpdated: Date;
  recordCount: number;
  isActive: boolean;
  metadata: Record<string, any>;
  fields: DatabaseField[];
  createdAt: Date;
  updatedAt: Date;
}

export type DatabaseCategory = 
  | 'bearing'           // 교량받침DB
  | 'seismic'           // 내진DB
  | 'material'          // 재료DB
  | 'geometry'          // 기하학적DB
  | 'soil'              // 지반DB
  | 'load'              // 하중DB
  | 'analysis'          // 해석DB
  | 'code'              // 설계기준DB
  | 'other';            // 기타

export interface DatabaseField {
  id: string;
  name: string;
  displayName: string;
  type: FieldType;
  unit?: string;
  description?: string;
  isRequired?: boolean;
  defaultValue?: any;
  validationRules?: ValidationRule[];
  parentHeader?: string; // 상위 헤더 (예: "A", "B", "C")
}

export interface DatabaseRecord {
  id: string;
  databaseId: string;
  data: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DatabaseImportResult {
  success: boolean;
  importedCount: number;
  failedCount: number;
  errors: string[];
  warnings: string[];
}

// DB 생성/수정 요청 타입
export interface CreateDatabaseRequest {
  name: string;
  displayName: string;
  description: string;
  category: DatabaseCategory;
  fields: DatabaseField[];
  metadata?: Record<string, any>;
}

export interface UpdateDatabaseRequest {
  id: string;
  displayName?: string;
  description?: string;
  category?: DatabaseCategory;
  fields?: DatabaseField[];
  metadata?: Record<string, any>;
  isActive?: boolean;
}