// Re-export from shared package
export * from '@inno-spec/shared';

// Bridge 타입을 명시적으로 re-export
export type { Bridge, CreateBridgeRequest, UpdateBridgeRequest } from '@inno-spec/shared';

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

export interface ScreenTemplate {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  category: 'structural' | 'material' | 'load' | 'analysis' | 'custom';
  defaultComponents: any[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ScreenComponent 타입을 명시적으로 re-export
export type { ScreenComponent } from '@inno-spec/shared';

// 변수 정의 관련 타입
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