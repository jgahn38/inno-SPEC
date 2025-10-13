import { MariaDBConnection } from '../database/mariadb-connection';
import { BridgeDatabase, DatabaseRecord, CreateDatabaseRequest, UpdateDatabaseRequest } from '@inno-spec/shared';
import { v4 as uuidv4 } from 'uuid';

export class MariaDBDatabaseService {
  private db: MariaDBConnection;

  constructor() {
    this.db = MariaDBConnection.getInstance();
  }

  private generateId(): string {
    return uuidv4();
  }

  // 데이터베이스 관련 메서드
  async getAllDatabases(tenantId: string): Promise<BridgeDatabase[]> {
    const connection = await this.db.getPool().getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM bridge_databases WHERE tenantId = ? ORDER BY category, name',
        [tenantId]
      );
      
      const databases = rows as any[];
      return databases.map(row => ({
        ...row,
        isActive: Boolean(row.isActive),
        metadata: row.metadata ? JSON.parse(row.metadata) : {},
        fields: row.fields ? JSON.parse(row.fields) : []
      })) as BridgeDatabase[];
    } finally {
      connection.release();
    }
  }

  async getDatabaseById(id: string, tenantId: string): Promise<BridgeDatabase | null> {
    const connection = await this.db.getPool().getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM bridge_databases WHERE id = ? AND tenantId = ?',
        [id, tenantId]
      );
      
      const databases = rows as any[];
      if (databases.length === 0) return null;
      
      const db = databases[0];
      return {
        ...db,
        isActive: Boolean(db.isActive),
        metadata: db.metadata ? JSON.parse(db.metadata) : {},
        fields: db.fields ? JSON.parse(db.fields) : []
      } as BridgeDatabase;
    } finally {
      connection.release();
    }
  }

  async getDatabasesByCategory(category: string, tenantId: string): Promise<BridgeDatabase[]> {
    const connection = await this.db.getPool().getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM bridge_databases WHERE category = ? AND tenantId = ? AND isActive = TRUE ORDER BY name',
        [category, tenantId]
      );
      
      const databases = rows as any[];
      return databases.map(row => ({
        ...row,
        isActive: Boolean(row.isActive),
        metadata: row.metadata ? JSON.parse(row.metadata) : {},
        fields: row.fields ? JSON.parse(row.fields) : []
      })) as BridgeDatabase[];
    } finally {
      connection.release();
    }
  }

  async createDatabase(request: CreateDatabaseRequest, tenantId: string): Promise<BridgeDatabase> {
    const connection = await this.db.getPool().getConnection();
    try {
      const newDatabase: BridgeDatabase = {
        id: this.generateId(),
        name: request.name,
        displayName: request.displayName,
        description: request.description,
        category: request.category,
        version: '1.0.0',
        lastUpdated: new Date(),
        recordCount: 0,
        isActive: true,
        metadata: request.metadata || {},
        fields: request.fields,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await connection.execute(
        `INSERT INTO bridge_databases 
         (id, name, displayName, description, category, version, lastUpdated, recordCount, isActive, metadata, fields, createdAt, updatedAt, tenantId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newDatabase.id,
          newDatabase.name,
          newDatabase.displayName,
          newDatabase.description,
          newDatabase.category,
          newDatabase.version,
          newDatabase.lastUpdated,
          newDatabase.recordCount,
          newDatabase.isActive,
          JSON.stringify(newDatabase.metadata),
          JSON.stringify(newDatabase.fields),
          newDatabase.createdAt,
          newDatabase.updatedAt,
          tenantId
        ]
      );

      return newDatabase;
    } finally {
      connection.release();
    }
  }

  async updateDatabase(request: UpdateDatabaseRequest, tenantId: string): Promise<BridgeDatabase | null> {
    const connection = await this.db.getPool().getConnection();
    try {
      const existingDb = await this.getDatabaseById(request.id, tenantId);
      if (!existingDb) return null;

      const updatedDatabase: BridgeDatabase = {
        ...existingDb,
        displayName: request.displayName ?? existingDb.displayName,
        description: request.description ?? existingDb.description,
        category: request.category ?? existingDb.category,
        fields: request.fields ?? existingDb.fields,
        metadata: request.metadata ? { ...existingDb.metadata, ...request.metadata } : existingDb.metadata,
        isActive: request.isActive ?? existingDb.isActive,
        lastUpdated: new Date(),
        updatedAt: new Date()
      };

      await connection.execute(
        `UPDATE bridge_databases 
         SET displayName = ?, description = ?, category = ?, fields = ?, metadata = ?, isActive = ?, lastUpdated = ?, updatedAt = ?
         WHERE id = ? AND tenantId = ?`,
        [
          updatedDatabase.displayName,
          updatedDatabase.description,
          updatedDatabase.category,
          JSON.stringify(updatedDatabase.fields),
          JSON.stringify(updatedDatabase.metadata),
          updatedDatabase.isActive,
          updatedDatabase.lastUpdated,
          updatedDatabase.updatedAt,
          request.id,
          tenantId
        ]
      );

      return updatedDatabase;
    } finally {
      connection.release();
    }
  }

  async deleteDatabase(id: string, tenantId: string): Promise<boolean> {
    const connection = await this.db.getPool().getConnection();
    try {
      const [result] = await connection.execute(
        'DELETE FROM bridge_databases WHERE id = ? AND tenantId = ?',
        [id, tenantId]
      );
      return (result as any).affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  // 데이터베이스 레코드 관련 메서드
  async getRecordsByDatabaseId(databaseId: string, tenantId: string): Promise<DatabaseRecord[]> {
    const connection = await this.db.getPool().getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM database_records WHERE databaseId = ? AND tenantId = ? ORDER BY createdAt DESC',
        [databaseId, tenantId]
      );
      
      const records = rows as any[];
      return records.map(row => ({
        ...row,
        data: row.data ? JSON.parse(row.data) : {}
      })) as DatabaseRecord[];
    } finally {
      connection.release();
    }
  }

  async getRecordById(id: string, tenantId: string): Promise<DatabaseRecord | null> {
    const connection = await this.db.getPool().getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM database_records WHERE id = ? AND tenantId = ?',
        [id, tenantId]
      );
      
      const records = rows as any[];
      if (records.length === 0) return null;
      
      const record = records[0];
      return {
        ...record,
        data: record.data ? JSON.parse(record.data) : {}
      } as DatabaseRecord;
    } finally {
      connection.release();
    }
  }

  async createRecord(databaseId: string, data: Record<string, any>, tenantId: string): Promise<DatabaseRecord> {
    const connection = await this.db.getPool().getConnection();
    try {
      const newRecord: DatabaseRecord = {
        id: this.generateId(),
        databaseId,
        data,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await connection.execute(
        `INSERT INTO database_records (id, databaseId, data, createdAt, updatedAt, tenantId)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          newRecord.id,
          newRecord.databaseId,
          JSON.stringify(newRecord.data),
          newRecord.createdAt,
          newRecord.updatedAt,
          tenantId
        ]
      );

      // 레코드 카운트 업데이트
      await connection.execute(
        'UPDATE bridge_databases SET recordCount = recordCount + 1, lastUpdated = ? WHERE id = ?',
        [new Date(), databaseId]
      );

      return newRecord;
    } finally {
      connection.release();
    }
  }

  async updateRecord(id: string, data: Record<string, any>, tenantId: string): Promise<DatabaseRecord | null> {
    const connection = await this.db.getPool().getConnection();
    try {
      const existingRecord = await this.getRecordById(id, tenantId);
      if (!existingRecord) return null;

      const updatedRecord: DatabaseRecord = {
        ...existingRecord,
        data: { ...existingRecord.data, ...data },
        updatedAt: new Date()
      };

      await connection.execute(
        'UPDATE database_records SET data = ?, updatedAt = ? WHERE id = ? AND tenantId = ?',
        [JSON.stringify(updatedRecord.data), updatedRecord.updatedAt, id, tenantId]
      );

      // 데이터베이스 lastUpdated 업데이트
      await connection.execute(
        'UPDATE bridge_databases SET lastUpdated = ? WHERE id = ?',
        [new Date(), existingRecord.databaseId]
      );

      return updatedRecord;
    } finally {
      connection.release();
    }
  }

  async deleteRecord(id: string, tenantId: string): Promise<boolean> {
    const connection = await this.db.getPool().getConnection();
    try {
      // 레코드 정보 먼저 가져오기
      const record = await this.getRecordById(id, tenantId);
      if (!record) return false;

      const [result] = await connection.execute(
        'DELETE FROM database_records WHERE id = ? AND tenantId = ?',
        [id, tenantId]
      );

      if ((result as any).affectedRows > 0) {
        // 레코드 카운트 업데이트
        await connection.execute(
          'UPDATE bridge_databases SET recordCount = GREATEST(0, recordCount - 1), lastUpdated = ? WHERE id = ?',
          [new Date(), record.databaseId]
        );
        return true;
      }

      return false;
    } finally {
      connection.release();
    }
  }

  async bulkCreateRecords(databaseId: string, records: Record<string, any>[], tenantId: string): Promise<DatabaseRecord[]> {
    const connection = await this.db.getPool().getConnection();
    try {
      await connection.beginTransaction();

      const createdRecords: DatabaseRecord[] = [];

      for (const recordData of records) {
        const newRecord: DatabaseRecord = {
          id: this.generateId(),
          databaseId,
          data: recordData,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await connection.execute(
          `INSERT INTO database_records (id, databaseId, data, createdAt, updatedAt, tenantId)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            newRecord.id,
            newRecord.databaseId,
            JSON.stringify(newRecord.data),
            newRecord.createdAt,
            newRecord.updatedAt,
            tenantId
          ]
        );

        createdRecords.push(newRecord);
      }

      // 레코드 카운트 업데이트
      await connection.execute(
        'UPDATE bridge_databases SET recordCount = recordCount + ?, lastUpdated = ? WHERE id = ?',
        [records.length, new Date(), databaseId]
      );

      await connection.commit();

      return createdRecords;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

export const mariaDBDatabaseService = new MariaDBDatabaseService();

