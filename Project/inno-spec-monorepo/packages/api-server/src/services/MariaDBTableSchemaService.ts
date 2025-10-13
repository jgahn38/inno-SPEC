import { MariaDBConnection } from '../database/mariadb-connection';
import { TableSchema } from '@inno-spec/shared';
import { v4 as uuidv4 } from 'uuid';

export interface CreateTableSchemaRequest {
  name: string;
  displayName: string;
  description?: string;
  fields: any[];
}

export interface UpdateTableSchemaRequest {
  id: string;
  name?: string;
  displayName?: string;
  description?: string;
  fields?: any[];
}

export class MariaDBTableSchemaService {
  private db: MariaDBConnection;

  constructor() {
    this.db = MariaDBConnection.getInstance();
  }

  private generateId(): string {
    return uuidv4();
  }

  async getAllTableSchemas(tenantId: string): Promise<TableSchema[]> {
    const connection = await this.db.getPool().getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM table_schemas WHERE tenantId = ? ORDER BY name',
        [tenantId]
      );
      
      const schemas = rows as any[];
      return schemas.map(row => ({
        ...row,
        fields: row.fields ? JSON.parse(row.fields) : []
      })) as TableSchema[];
    } finally {
      connection.release();
    }
  }

  async getTableSchemaById(id: string, tenantId: string): Promise<TableSchema | null> {
    const connection = await this.db.getPool().getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM table_schemas WHERE id = ? AND tenantId = ?',
        [id, tenantId]
      );
      
      const schemas = rows as any[];
      if (schemas.length === 0) return null;
      
      const schema = schemas[0];
      return {
        ...schema,
        fields: schema.fields ? JSON.parse(schema.fields) : []
      } as TableSchema;
    } finally {
      connection.release();
    }
  }

  async getTableSchemaByName(name: string, tenantId: string): Promise<TableSchema | null> {
    const connection = await this.db.getPool().getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM table_schemas WHERE name = ? AND tenantId = ?',
        [name, tenantId]
      );
      
      const schemas = rows as any[];
      if (schemas.length === 0) return null;
      
      const schema = schemas[0];
      return {
        ...schema,
        fields: schema.fields ? JSON.parse(schema.fields) : []
      } as TableSchema;
    } finally {
      connection.release();
    }
  }

  async createTableSchema(request: CreateTableSchemaRequest, tenantId: string): Promise<TableSchema> {
    const connection = await this.db.getPool().getConnection();
    try {
      const newSchema: TableSchema = {
        id: this.generateId(),
        name: request.name,
        displayName: request.displayName,
        description: request.description,
        fields: request.fields,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await connection.execute(
        `INSERT INTO table_schemas 
         (id, name, displayName, description, fields, createdAt, updatedAt, tenantId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newSchema.id,
          newSchema.name,
          newSchema.displayName,
          newSchema.description || null,
          JSON.stringify(newSchema.fields),
          newSchema.createdAt,
          newSchema.updatedAt,
          tenantId
        ]
      );

      return newSchema;
    } finally {
      connection.release();
    }
  }

  async updateTableSchema(request: UpdateTableSchemaRequest, tenantId: string): Promise<TableSchema | null> {
    const connection = await this.db.getPool().getConnection();
    try {
      const existingSchema = await this.getTableSchemaById(request.id, tenantId);
      if (!existingSchema) return null;

      const updatedSchema: TableSchema = {
        ...existingSchema,
        name: request.name ?? existingSchema.name,
        displayName: request.displayName ?? existingSchema.displayName,
        description: request.description ?? existingSchema.description,
        fields: request.fields ?? existingSchema.fields,
        updatedAt: new Date()
      };

      await connection.execute(
        `UPDATE table_schemas 
         SET name = ?, displayName = ?, description = ?, fields = ?, updatedAt = ?
         WHERE id = ? AND tenantId = ?`,
        [
          updatedSchema.name,
          updatedSchema.displayName,
          updatedSchema.description,
          JSON.stringify(updatedSchema.fields),
          updatedSchema.updatedAt,
          request.id,
          tenantId
        ]
      );

      return updatedSchema;
    } finally {
      connection.release();
    }
  }

  async deleteTableSchema(id: string, tenantId: string): Promise<boolean> {
    const connection = await this.db.getPool().getConnection();
    try {
      const [result] = await connection.execute(
        'DELETE FROM table_schemas WHERE id = ? AND tenantId = ?',
        [id, tenantId]
      );
      return (result as any).affectedRows > 0;
    } finally {
      connection.release();
    }
  }
}

export const mariaDBTableSchemaService = new MariaDBTableSchemaService();

