import { MariaDBConnection } from '../database/mariadb-connection';
import { VariableDefinition } from '@inno-spec/shared';
import { v4 as uuidv4 } from 'uuid';

export interface CreateVariableDefinitionRequest {
  name: string;
  displayName: string;
  description: string;
  type: 'number' | 'string' | 'boolean';
  unit?: string;
  defaultValue?: any;
  category: 'input' | 'output' | 'intermediate' | 'constant';
  scope: 'global' | 'project' | 'bridge';
  tags?: string[];
}

export interface UpdateVariableDefinitionRequest {
  id: string;
  name?: string;
  displayName?: string;
  description?: string;
  type?: 'number' | 'string' | 'boolean';
  unit?: string;
  defaultValue?: any;
  category?: 'input' | 'output' | 'intermediate' | 'constant';
  scope?: 'global' | 'project' | 'bridge';
  tags?: string[];
}

export class MariaDBVariableService {
  private db: MariaDBConnection;

  constructor() {
    this.db = MariaDBConnection.getInstance();
  }

  private generateId(): string {
    return uuidv4();
  }

  async getAllVariables(tenantId: string): Promise<VariableDefinition[]> {
    const connection = await this.db.getPool().getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM variable_definitions WHERE tenantId = ? ORDER BY category, name',
        [tenantId]
      );
      
      const variables = rows as any[];
      return variables.map(row => ({
        ...row,
        tags: row.tags ? JSON.parse(row.tags) : []
      })) as VariableDefinition[];
    } finally {
      connection.release();
    }
  }

  async getVariableById(id: string, tenantId: string): Promise<VariableDefinition | null> {
    const connection = await this.db.getPool().getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM variable_definitions WHERE id = ? AND tenantId = ?',
        [id, tenantId]
      );
      
      const variables = rows as any[];
      if (variables.length === 0) return null;
      
      const variable = variables[0];
      return {
        ...variable,
        tags: variable.tags ? JSON.parse(variable.tags) : []
      } as VariableDefinition;
    } finally {
      connection.release();
    }
  }

  async getVariablesByCategory(category: string, tenantId: string): Promise<VariableDefinition[]> {
    const connection = await this.db.getPool().getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM variable_definitions WHERE category = ? AND tenantId = ? ORDER BY name',
        [category, tenantId]
      );
      
      const variables = rows as any[];
      return variables.map(row => ({
        ...row,
        tags: row.tags ? JSON.parse(row.tags) : []
      })) as VariableDefinition[];
    } finally {
      connection.release();
    }
  }

  async getVariablesByScope(scope: string, tenantId: string): Promise<VariableDefinition[]> {
    const connection = await this.db.getPool().getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM variable_definitions WHERE scope = ? AND tenantId = ? ORDER BY name',
        [scope, tenantId]
      );
      
      const variables = rows as any[];
      return variables.map(row => ({
        ...row,
        tags: row.tags ? JSON.parse(row.tags) : []
      })) as VariableDefinition[];
    } finally {
      connection.release();
    }
  }

  async createVariable(request: CreateVariableDefinitionRequest, tenantId: string): Promise<VariableDefinition> {
    const connection = await this.db.getPool().getConnection();
    try {
      const newVariable: VariableDefinition = {
        id: this.generateId(),
        name: request.name,
        displayName: request.displayName,
        description: request.description,
        type: request.type,
        unit: request.unit,
        defaultValue: request.defaultValue,
        category: request.category,
        scope: request.scope,
        tags: request.tags || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await connection.execute(
        `INSERT INTO variable_definitions 
         (id, name, displayName, description, type, unit, defaultValue, category, scope, tags, createdAt, updatedAt, tenantId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newVariable.id,
          newVariable.name,
          newVariable.displayName,
          newVariable.description,
          newVariable.type,
          newVariable.unit || null,
          newVariable.defaultValue || null,
          newVariable.category,
          newVariable.scope,
          JSON.stringify(newVariable.tags),
          newVariable.createdAt,
          newVariable.updatedAt,
          tenantId
        ]
      );

      return newVariable;
    } finally {
      connection.release();
    }
  }

  async updateVariable(request: UpdateVariableDefinitionRequest, tenantId: string): Promise<VariableDefinition | null> {
    const connection = await this.db.getPool().getConnection();
    try {
      const existingVariable = await this.getVariableById(request.id, tenantId);
      if (!existingVariable) return null;

      const updatedVariable: VariableDefinition = {
        ...existingVariable,
        name: request.name ?? existingVariable.name,
        displayName: request.displayName ?? existingVariable.displayName,
        description: request.description ?? existingVariable.description,
        type: request.type ?? existingVariable.type,
        unit: request.unit ?? existingVariable.unit,
        defaultValue: request.defaultValue ?? existingVariable.defaultValue,
        category: request.category ?? existingVariable.category,
        scope: request.scope ?? existingVariable.scope,
        tags: request.tags ?? existingVariable.tags,
        updatedAt: new Date()
      };

      await connection.execute(
        `UPDATE variable_definitions 
         SET name = ?, displayName = ?, description = ?, type = ?, unit = ?, defaultValue = ?, category = ?, scope = ?, tags = ?, updatedAt = ?
         WHERE id = ? AND tenantId = ?`,
        [
          updatedVariable.name,
          updatedVariable.displayName,
          updatedVariable.description,
          updatedVariable.type,
          updatedVariable.unit,
          updatedVariable.defaultValue,
          updatedVariable.category,
          updatedVariable.scope,
          JSON.stringify(updatedVariable.tags),
          updatedVariable.updatedAt,
          request.id,
          tenantId
        ]
      );

      return updatedVariable;
    } finally {
      connection.release();
    }
  }

  async deleteVariable(id: string, tenantId: string): Promise<boolean> {
    const connection = await this.db.getPool().getConnection();
    try {
      const [result] = await connection.execute(
        'DELETE FROM variable_definitions WHERE id = ? AND tenantId = ?',
        [id, tenantId]
      );
      return (result as any).affectedRows > 0;
    } finally {
      connection.release();
    }
  }
}

export const mariaDBVariableService = new MariaDBVariableService();

