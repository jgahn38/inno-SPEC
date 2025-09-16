export interface ScreenConfig {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  type: 'dashboard' | 'custom';
  layout: 'single' | 'grid' | 'tabs';
  components: ScreenComponent[];
  dataStructure: 'project' | 'bridge';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScreenComponent {
  id: string;
  type: 'table' | 'variable';
  componentId: string;
  displayName: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: {
    showHeader: boolean;
    showPagination: boolean;
    showSearch: boolean;
    showFilters: boolean;
    maxRows: number;
    refreshInterval: number;
  };
}

export interface LNBConfig {
  id: string;
  name: string;
  displayName: string;
  icon?: string;
  order: number;
  isActive: boolean;
  parentId?: string;
  type: 'independent' | 'parent' | 'child';
  screenId?: string;
  systemScreenType?: 'dashboard' | 'project-settings' | 'section-library' | 'user-profile' | 'system-settings';
  children?: LNBConfig[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  tenantId: string;
  bridges: Bridge[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Bridge {
  id: string;
  name: string;
  displayName: string;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tenant {
  id: string;
  name: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
