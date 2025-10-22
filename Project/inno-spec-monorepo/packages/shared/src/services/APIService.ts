import { ScreenConfig, LNBConfig, Project, CreateProjectRequest, UpdateProjectRequest, BridgeDatabase, DatabaseRecord, CreateDatabaseRequest, UpdateDatabaseRequest, TableSchema, VariableDefinition, ProjectCategory, CreateProjectCategoryRequest, UpdateProjectCategoryRequest, TableField } from '@inno-spec/shared';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

const API_BASE_URL = 'http://localhost:3001/api';

class APIService {
  private getHeaders(): HeadersInit {
    const tenantId = localStorage.getItem('current_tenant_id') || 'default-tenant';
    const userId = localStorage.getItem('current_user_id') || 'default-user';
    return {
      'Content-Type': 'application/json',
      'x-tenant-id': tenantId,
      'x-user-id': userId,
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

  // 프로젝트 관련 API
  async getProjects(): Promise<ApiResponse<Project[]>> {
    return this.request<Project[]>('/projects');
  }

  async getProjectById(id: string): Promise<ApiResponse<Project>> {
    return this.request<Project>(`/projects/${id}`);
  }

  async createProject(project: CreateProjectRequest): Promise<ApiResponse<Project>> {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  async updateProject(id: string, project: UpdateProjectRequest): Promise<ApiResponse<Project>> {
    return this.request<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(project),
    });
  }

  async deleteProject(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  async getProjectsByCategory(category: string): Promise<ApiResponse<Project[]>> {
    return this.request<Project[]>(`/projects/category/${category}`);
  }

  // 데이터베이스 관련 API
  async getDatabases(): Promise<ApiResponse<BridgeDatabase[]>> {
    return this.request<BridgeDatabase[]>('/databases');
  }

  async getDatabaseById(id: string): Promise<ApiResponse<BridgeDatabase>> {
    return this.request<BridgeDatabase>(`/databases/${id}`);
  }

  async getDatabasesByCategory(category: string): Promise<ApiResponse<BridgeDatabase[]>> {
    return this.request<BridgeDatabase[]>(`/databases/category/${category}`);
  }

  async createDatabase(database: CreateDatabaseRequest): Promise<ApiResponse<BridgeDatabase>> {
    return this.request<BridgeDatabase>('/databases', {
      method: 'POST',
      body: JSON.stringify(database),
    });
  }

  async updateDatabase(id: string, database: UpdateDatabaseRequest): Promise<ApiResponse<BridgeDatabase>> {
    return this.request<BridgeDatabase>(`/databases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(database),
    });
  }

  async deleteDatabase(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/databases/${id}`, {
      method: 'DELETE',
    });
  }

  // 데이터베이스 레코드 관련 API
  async getDatabaseRecords(databaseId: string): Promise<ApiResponse<DatabaseRecord[]>> {
    return this.request<DatabaseRecord[]>(`/databases/${databaseId}/records`);
  }

  async getDatabaseRecordById(recordId: string): Promise<ApiResponse<DatabaseRecord>> {
    return this.request<DatabaseRecord>(`/databases/records/${recordId}`);
  }

  async createDatabaseRecord(databaseId: string, data: Record<string, any>): Promise<ApiResponse<DatabaseRecord>> {
    return this.request<DatabaseRecord>(`/databases/${databaseId}/records`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async bulkCreateDatabaseRecords(databaseId: string, records: Record<string, any>[]): Promise<ApiResponse<DatabaseRecord[]>> {
    return this.request<DatabaseRecord[]>(`/databases/${databaseId}/records/bulk`, {
      method: 'POST',
      body: JSON.stringify({ records }),
    });
  }

  async updateDatabaseRecord(recordId: string, data: Record<string, any>): Promise<ApiResponse<DatabaseRecord>> {
    return this.request<DatabaseRecord>(`/databases/records/${recordId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDatabaseRecord(recordId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/databases/records/${recordId}`, {
      method: 'DELETE',
    });
  }

  // 테이블 스키마 관련 API
  async getTableSchemas(): Promise<ApiResponse<TableSchema[]>> {
    return this.request<TableSchema[]>('/table-schemas');
  }

  async getTableSchemaById(id: string): Promise<ApiResponse<TableSchema>> {
    return this.request<TableSchema>(`/table-schemas/${id}`);
  }

  async getTableSchemaByName(name: string): Promise<ApiResponse<TableSchema>> {
    return this.request<TableSchema>(`/table-schemas/name/${name}`);
  }

  async createTableSchema(schema: any): Promise<ApiResponse<TableSchema>> {
    return this.request<TableSchema>('/table-schemas', {
      method: 'POST',
      body: JSON.stringify(schema),
    });
  }

  async updateTableSchema(id: string, schema: any): Promise<ApiResponse<TableSchema>> {
    return this.request<TableSchema>(`/table-schemas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(schema),
    });
  }

  async deleteTableSchema(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/table-schemas/${id}`, {
      method: 'DELETE',
    });
  }

  // 변수 관련 API
  async getVariables(): Promise<ApiResponse<VariableDefinition[]>> {
    return this.request<VariableDefinition[]>('/variables');
  }

  async getVariableById(id: string): Promise<ApiResponse<VariableDefinition>> {
    return this.request<VariableDefinition>(`/variables/${id}`);
  }

  async getVariablesByCategory(category: string): Promise<ApiResponse<VariableDefinition[]>> {
    return this.request<VariableDefinition[]>(`/variables/category/${category}`);
  }

  async getVariablesByScope(scope: string): Promise<ApiResponse<VariableDefinition[]>> {
    return this.request<VariableDefinition[]>(`/variables/scope/${scope}`);
  }

  async createVariable(variable: any): Promise<ApiResponse<VariableDefinition>> {
    return this.request<VariableDefinition>('/variables', {
      method: 'POST',
      body: JSON.stringify(variable),
    });
  }

  async updateVariable(id: string, variable: any): Promise<ApiResponse<VariableDefinition>> {
    return this.request<VariableDefinition>(`/variables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(variable),
    });
  }

  async deleteVariable(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/variables/${id}`, {
      method: 'DELETE',
    });
  }

  // 프로젝트 카테고리 관련 API
  async getProjectCategories(): Promise<ApiResponse<ProjectCategory[]>> {
    return this.request<ProjectCategory[]>('/project-categories');
  }

  async getProjectCategoryById(id: string): Promise<ApiResponse<ProjectCategory>> {
    return this.request<ProjectCategory>(`/project-categories/${id}`);
  }

  async createProjectCategory(category: CreateProjectCategoryRequest): Promise<ApiResponse<ProjectCategory>> {
    return this.request<ProjectCategory>('/project-categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  }

  async updateProjectCategory(id: string, category: UpdateProjectCategoryRequest): Promise<ApiResponse<ProjectCategory>> {
    return this.request<ProjectCategory>(`/project-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    });
  }

  async deleteProjectCategory(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/project-categories/${id}`, {
      method: 'DELETE',
    });
  }

  async reorderProjectCategories(categoryOrders: { id: string; order: number }[]): Promise<ApiResponse<void>> {
    return this.request<void>('/project-categories/reorder', {
      method: 'POST',
      body: JSON.stringify({ categoryOrders }),
    });
  }

  // 필드 정의 관련 API
  async getFieldDefinitions(): Promise<ApiResponse<TableField[]>> {
    return this.request<TableField[]>('/field-definitions');
  }

  async getFieldDefinitionById(id: string): Promise<ApiResponse<TableField>> {
    return this.request<TableField>(`/field-definitions/${id}`);
  }

  async createFieldDefinition(field: Omit<TableField, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<TableField>> {
    return this.request<TableField>('/field-definitions', {
      method: 'POST',
      body: JSON.stringify(field),
    });
  }

  async updateFieldDefinition(id: string, field: Partial<TableField>): Promise<ApiResponse<TableField>> {
    return this.request<TableField>(`/field-definitions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(field),
    });
  }

  async deleteFieldDefinition(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/field-definitions/${id}`, {
      method: 'DELETE',
    });
  }

  async updateFieldDefinitionOrder(id: string, orderIndex: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/field-definitions/${id}/order`, {
      method: 'PUT',
      body: JSON.stringify({ order_index: orderIndex }),
    });
  }
}

export const apiService = new APIService();
export default APIService;
