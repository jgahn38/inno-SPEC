export type { Project, CreateProjectRequest, UpdateProjectRequest } from './Project';
export type { Bridge, CreateBridgeRequest, UpdateBridgeRequest } from './Bridge';
export type { Tenant, TenantSettings, CustomField, BrandingSettings, SecuritySettings, PasswordPolicy, CreateTenantRequest, UpdateTenantRequest } from './Tenant';
export type { User, UserRole, UserProfile, Permission, CreateUserRequest, UpdateUserRequest, LoginRequest, LoginResponse } from './User';
export * from './BridgeData';
export type { CADEntity, CADData, CADParseResult } from './CADParserService';
export type { IProjectDataProvider } from './IProjectDataProvider';
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
export interface ScreenConfig {
    id: string;
    name: string;
    displayName: string;
    description?: string;
    type: 'dashboard' | 'custom';
    layout: 'single' | 'grid' | 'tabs';
    gridConfig?: {
        rows: number;
        cols: number;
    };
    tabs?: string[];
    components: ScreenComponent[];
    isActive: boolean;
    dataStructure?: UserScreenDataStructure;
    createdAt: Date;
    updatedAt: Date;
}
export interface ScreenComponent {
    id: string;
    type: 'table' | 'variable' | 'chart' | 'input' | 'output';
    componentId: string;
    displayName: string;
    position: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    config: ComponentConfig;
    layer?: number;
    tabIndex?: number;
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
    screenId?: string;
    systemScreenType?: SystemScreenType;
    children?: LNBConfig[];
    type?: 'independent' | 'parent' | 'child';
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export type SystemScreenType = 'dashboard' | 'project-settings' | 'section-library' | 'user-profile' | 'system-settings';
export type UserScreenDataStructure = 'project' | 'bridge';
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
    options?: string[];
    defaultValue?: any;
    dbCategory?: string;
}
export type FieldType = 'text' | 'number' | 'date' | 'boolean' | 'decimal' | 'integer' | 'list' | 'db';
export interface ValidationRule {
    type: 'min' | 'max' | 'pattern' | 'custom';
    value: any;
    message?: string;
}
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
export interface TableData {
    id: string;
    tableId: string;
    projectId: string;
    tenantId: string;
    data: Record<string, any>[];
    rowCount: number;
    lastUpdated: Date;
}
export interface CommonEngineConfig {
    version: string;
    supportedTableTypes: string[];
    maxExecutionTime: number;
    maxRecordsPerExecution: number;
    defaultValidationRules: ValidationRule[];
}
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
export type DatabaseCategory = 'bearing' | 'seismic' | 'material' | 'geometry' | 'soil' | 'load' | 'analysis' | 'code' | 'other';
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
    parentHeader?: string;
    options?: string[];
    dbCategory?: string;
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
export interface VariableDefinition {
    id: string;
    name: string;
    displayName: string;
    description: string;
    type: 'number' | 'string' | 'boolean';
    unit?: string;
    defaultValue?: any;
    category: 'input' | 'output' | 'intermediate' | 'constant';
    scope: 'global' | 'project' | 'bridge';
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=index.d.ts.map