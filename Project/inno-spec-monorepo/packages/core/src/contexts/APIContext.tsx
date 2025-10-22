import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '@inno-spec/shared';
import { ScreenConfig, LNBConfig, Project, BridgeDatabase, TableSchema, VariableDefinition, ProjectCategory, CreateProjectRequest, UpdateProjectRequest, CreateDatabaseRequest, UpdateDatabaseRequest, CreateProjectCategoryRequest, UpdateProjectCategoryRequest, TableField } from '@inno-spec/shared';

export interface APIContextType {
  screens: ScreenConfig[];
  lnbConfigs: LNBConfig[];
  projects: Project[];
  databases: BridgeDatabase[];
  tableSchemas: TableSchema[];
  variables: VariableDefinition[];
  projectCategories: ProjectCategory[];
  fieldDefinitions: TableField[];
  loading: boolean;
  error: string | null;
  
  // Screens
  refreshScreens: () => Promise<void>;
  createScreen: (screen: Omit<ScreenConfig, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateScreen: (id: string, screen: Partial<ScreenConfig>) => Promise<boolean>;
  deleteScreen: (id: string) => Promise<boolean>;
  
  // LNB Configs
  refreshLNBConfigs: () => Promise<void>;
  createLNBConfig: (config: Omit<LNBConfig, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateLNBConfig: (id: string, config: Partial<LNBConfig>) => Promise<boolean>;
  deleteLNBConfig: (id: string) => Promise<boolean>;
  
  // Projects
  refreshProjects: () => Promise<void>;
  createProject: (project: CreateProjectRequest) => Promise<boolean>;
  updateProject: (id: string, project: UpdateProjectRequest) => Promise<boolean>;
  deleteProject: (id: string) => Promise<boolean>;
  
  // Databases
  refreshDatabases: () => Promise<void>;
  createDatabase: (database: CreateDatabaseRequest) => Promise<boolean>;
  updateDatabase: (id: string, database: UpdateDatabaseRequest) => Promise<boolean>;
  deleteDatabase: (id: string) => Promise<boolean>;
  
  // Table Schemas
  refreshTableSchemas: () => Promise<void>;
  createTableSchema: (schema: any) => Promise<boolean>;
  updateTableSchema: (id: string, schema: any) => Promise<boolean>;
  deleteTableSchema: (id: string) => Promise<boolean>;
  
  // Variables
  refreshVariables: () => Promise<void>;
  createVariable: (variable: any) => Promise<boolean>;
  updateVariable: (id: string, variable: any) => Promise<boolean>;
  deleteVariable: (id: string) => Promise<boolean>;
  
  // Project Categories
  refreshProjectCategories: () => Promise<void>;
  createProjectCategory: (category: CreateProjectCategoryRequest) => Promise<boolean>;
  updateProjectCategory: (id: string, category: UpdateProjectCategoryRequest) => Promise<boolean>;
  deleteProjectCategory: (id: string) => Promise<boolean>;
  reorderProjectCategories: (categoryOrders: { id: string; order: number }[]) => Promise<boolean>;
  
  // Field Definitions
  refreshFieldDefinitions: () => Promise<void>;
  createFieldDefinition: (field: Omit<TableField, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateFieldDefinition: (id: string, field: Partial<TableField>) => Promise<boolean>;
  deleteFieldDefinition: (id: string) => Promise<boolean>;
  updateFieldDefinitionOrder: (id: string, orderIndex: number) => Promise<boolean>;
}

const APIContext = createContext<APIContextType | undefined>(undefined);

export const useAPI = () => {
  const context = useContext(APIContext);
  if (context === undefined) {
    throw new Error('useAPI must be used within an APIProvider');
  }
  return context;
};

interface APIProviderProps {
  children: ReactNode;
}

export const APIProvider: React.FC<APIProviderProps> = ({ children }) => {
  const [screens, setScreens] = useState<ScreenConfig[]>([]);
  const [lnbConfigs, setLnbConfigs] = useState<LNBConfig[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [databases, setDatabases] = useState<BridgeDatabase[]>([]);
  const [tableSchemas, setTableSchemas] = useState<TableSchema[]>([]);
  const [variables, setVariables] = useState<VariableDefinition[]>([]);
  const [projectCategories, setProjectCategories] = useState<ProjectCategory[]>([]);
  const [fieldDefinitions, setFieldDefinitions] = useState<TableField[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshScreens = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getScreens();
      if (response.success && response.data) {
        setScreens(response.data);
      } else {
        setError(response.error || 'Failed to load screens');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const refreshLNBConfigs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getLNBConfigs();
      if (response.success && response.data) {
        setLnbConfigs(response.data);
      } else {
        setError(response.error || 'Failed to load LNB configs');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createScreen = async (screen: Omit<ScreenConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      const response = await apiService.createScreen(screen);
      if (response.success) {
        await refreshScreens();
        return true;
      } else {
        setError(response.error || 'Failed to create screen');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  const updateScreen = async (id: string, screen: Partial<ScreenConfig>): Promise<boolean> => {
    try {
      const response = await apiService.updateScreen(id, screen);
      if (response.success) {
        await refreshScreens();
        return true;
      } else {
        setError(response.error || 'Failed to update screen');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  const deleteScreen = async (id: string): Promise<boolean> => {
    try {
      const response = await apiService.deleteScreen(id);
      if (response.success) {
        await refreshScreens();
        return true;
      } else {
        setError(response.error || 'Failed to delete screen');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  const createLNBConfig = async (config: Omit<LNBConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      const response = await apiService.createLNBConfig(config);
      if (response.success) {
        await refreshLNBConfigs();
        return true;
      } else {
        setError(response.error || 'Failed to create LNB config');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  const updateLNBConfig = async (id: string, config: Partial<LNBConfig>): Promise<boolean> => {
    try {
      const response = await apiService.updateLNBConfig(id, config);
      if (response.success) {
        await refreshLNBConfigs();
        return true;
      } else {
        setError(response.error || 'Failed to update LNB config');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  const deleteLNBConfig = async (id: string): Promise<boolean> => {
    try {
      const response = await apiService.deleteLNBConfig(id);
      if (response.success) {
        await refreshLNBConfigs();
        return true;
      } else {
        setError(response.error || 'Failed to delete LNB config');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  // Projects CRUD
  const refreshProjects = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getProjects();
      if (response.success && response.data) {
        setProjects(response.data);
      } else {
        setError(response.error || 'Failed to load projects');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (project: CreateProjectRequest): Promise<boolean> => {
    try {
      const response = await apiService.createProject(project);
      if (response.success) {
        await refreshProjects();
        return true;
      } else {
        setError(response.error || 'Failed to create project');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  const updateProject = async (id: string, project: UpdateProjectRequest): Promise<boolean> => {
    try {
      const response = await apiService.updateProject(id, project);
      if (response.success) {
        await refreshProjects();
        return true;
      } else {
        setError(response.error || 'Failed to update project');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  const deleteProject = async (id: string): Promise<boolean> => {
    try {
      const response = await apiService.deleteProject(id);
      if (response.success) {
        await refreshProjects();
        return true;
      } else {
        setError(response.error || 'Failed to delete project');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  // Databases CRUD
  const refreshDatabases = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getDatabases();
      if (response.success && response.data) {
        setDatabases(response.data);
      } else {
        setError(response.error || 'Failed to load databases');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createDatabase = async (database: CreateDatabaseRequest): Promise<boolean> => {
    try {
      const response = await apiService.createDatabase(database);
      if (response.success) {
        await refreshDatabases();
        return true;
      } else {
        setError(response.error || 'Failed to create database');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  const updateDatabase = async (id: string, database: UpdateDatabaseRequest): Promise<boolean> => {
    try {
      const response = await apiService.updateDatabase(id, database);
      if (response.success) {
        await refreshDatabases();
        return true;
      } else {
        setError(response.error || 'Failed to update database');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  const deleteDatabase = async (id: string): Promise<boolean> => {
    try {
      const response = await apiService.deleteDatabase(id);
      if (response.success) {
        await refreshDatabases();
        return true;
      } else {
        setError(response.error || 'Failed to delete database');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  // Table Schemas CRUD
  const refreshTableSchemas = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getTableSchemas();
      if (response.success && response.data) {
        setTableSchemas(response.data);
      } else {
        setError(response.error || 'Failed to load table schemas');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createTableSchema = async (schema: any): Promise<boolean> => {
    try {
      const response = await apiService.createTableSchema(schema);
      if (response.success) {
        await refreshTableSchemas();
        return true;
      } else {
        setError(response.error || 'Failed to create table schema');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  const updateTableSchema = async (id: string, schema: any): Promise<boolean> => {
    try {
      const response = await apiService.updateTableSchema(id, schema);
      if (response.success) {
        await refreshTableSchemas();
        return true;
      } else {
        setError(response.error || 'Failed to update table schema');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  const deleteTableSchema = async (id: string): Promise<boolean> => {
    try {
      const response = await apiService.deleteTableSchema(id);
      if (response.success) {
        await refreshTableSchemas();
        return true;
      } else {
        setError(response.error || 'Failed to delete table schema');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  // Variables CRUD
  const refreshVariables = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getVariables();
      if (response.success && response.data) {
        setVariables(response.data);
      } else {
        setError(response.error || 'Failed to load variables');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createVariable = async (variable: any): Promise<boolean> => {
    try {
      const response = await apiService.createVariable(variable);
      if (response.success) {
        await refreshVariables();
        return true;
      } else {
        setError(response.error || 'Failed to create variable');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  const updateVariable = async (id: string, variable: any): Promise<boolean> => {
    try {
      const response = await apiService.updateVariable(id, variable);
      if (response.success) {
        await refreshVariables();
        return true;
      } else {
        setError(response.error || 'Failed to update variable');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  const deleteVariable = async (id: string): Promise<boolean> => {
    try {
      const response = await apiService.deleteVariable(id);
      if (response.success) {
        await refreshVariables();
        return true;
      } else {
        setError(response.error || 'Failed to delete variable');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  // Project Categories CRUD
  const refreshProjectCategories = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getProjectCategories();
      if (response.success && response.data) {
        setProjectCategories(response.data);
      } else {
        setError(response.error || 'Failed to load project categories');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createProjectCategory = async (category: CreateProjectCategoryRequest): Promise<boolean> => {
    try {
      const response = await apiService.createProjectCategory(category);
      if (response.success) {
        await refreshProjectCategories();
        return true;
      } else {
        setError(response.error || 'Failed to create project category');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  const updateProjectCategory = async (id: string, category: UpdateProjectCategoryRequest): Promise<boolean> => {
    try {
      const response = await apiService.updateProjectCategory(id, category);
      if (response.success) {
        await refreshProjectCategories();
        return true;
      } else {
        setError(response.error || 'Failed to update project category');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  const deleteProjectCategory = async (id: string): Promise<boolean> => {
    try {
      const response = await apiService.deleteProjectCategory(id);
      if (response.success) {
        await refreshProjectCategories();
        return true;
      } else {
        setError(response.error || 'Failed to delete project category');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  const reorderProjectCategories = async (categoryOrders: { id: string; order: number }[]): Promise<boolean> => {
    try {
      const response = await apiService.reorderProjectCategories(categoryOrders);
      if (response.success) {
        await refreshProjectCategories();
        return true;
      } else {
        setError(response.error || 'Failed to reorder project categories');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  // Field Definitions CRUD
  const refreshFieldDefinitions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getFieldDefinitions();
      if (response.success && response.data) {
        setFieldDefinitions(response.data);
      } else {
        setError(response.error || 'Failed to load field definitions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createFieldDefinition = async (field: Omit<TableField, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      const response = await apiService.createFieldDefinition(field);
      if (response.success) {
        await refreshFieldDefinitions();
        return true;
      } else {
        setError(response.error || 'Failed to create field definition');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  const updateFieldDefinition = async (id: string, field: Partial<TableField>): Promise<boolean> => {
    try {
      const response = await apiService.updateFieldDefinition(id, field);
      if (response.success) {
        await refreshFieldDefinitions();
        return true;
      } else {
        setError(response.error || 'Failed to update field definition');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  const deleteFieldDefinition = async (id: string): Promise<boolean> => {
    try {
      const response = await apiService.deleteFieldDefinition(id);
      if (response.success) {
        await refreshFieldDefinitions();
        return true;
      } else {
        setError(response.error || 'Failed to delete field definition');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  const updateFieldDefinitionOrder = async (id: string, orderIndex: number): Promise<boolean> => {
    try {
      const response = await apiService.updateFieldDefinitionOrder(id, orderIndex);
      if (response.success) {
        await refreshFieldDefinitions();
        return true;
      } else {
        setError(response.error || 'Failed to update field definition order');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    refreshScreens();
    refreshLNBConfigs();
    refreshProjects();
    refreshDatabases();
    refreshTableSchemas();
    refreshVariables();
    refreshProjectCategories();
    refreshFieldDefinitions();
  }, []);

  // lnbConfigs가 비어있을 때 localStorage의 기본 구성 사용
  const getEffectiveLNBConfigs = () => {
    if (lnbConfigs.length > 0) {
      return lnbConfigs;
    }
    
    // localStorage에서 기본 구성 가져오기
    try {
      const storedConfigs = JSON.parse(localStorage.getItem('lnbConfigs') || '[]');
      if (storedConfigs.length > 0) {
        return storedConfigs;
      }
    } catch (error) {
      console.error('Failed to parse stored LNB configs:', error);
    }
    
    return lnbConfigs;
  };

  const value: APIContextType = {
    screens,
    lnbConfigs: getEffectiveLNBConfigs(),
    projects,
    databases,
    tableSchemas,
    variables,
    projectCategories,
    fieldDefinitions,
    loading,
    error,
    
    refreshScreens,
    createScreen,
    updateScreen,
    deleteScreen,
    
    refreshLNBConfigs,
    createLNBConfig,
    updateLNBConfig,
    deleteLNBConfig,
    
    refreshProjects,
    createProject,
    updateProject,
    deleteProject,
    
    refreshDatabases,
    createDatabase,
    updateDatabase,
    deleteDatabase,
    
    refreshTableSchemas,
    createTableSchema,
    updateTableSchema,
    deleteTableSchema,
    
    refreshVariables,
    createVariable,
    updateVariable,
    deleteVariable,
    
    refreshProjectCategories,
    createProjectCategory,
    updateProjectCategory,
    deleteProjectCategory,
    reorderProjectCategories,
    
    refreshFieldDefinitions,
    createFieldDefinition,
    updateFieldDefinition,
    deleteFieldDefinition,
    updateFieldDefinitionOrder,
  };

  return (
    <APIContext.Provider value={value}>
      {children}
    </APIContext.Provider>
  );
};
