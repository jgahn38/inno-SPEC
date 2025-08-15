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