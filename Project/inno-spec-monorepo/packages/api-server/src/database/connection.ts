import sqlite3 from 'sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private db: sqlite3.Database;

  private constructor() {
    // 데이터베이스 파일 경로
    const dbPath = join(process.cwd(), 'data', 'inno-spec.db');
    
    // 데이터베이스 연결
    this.db = new sqlite3.Database(dbPath);
    
    // 스키마 초기화
    this.initializeSchema();
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public getDatabase(): sqlite3.Database {
    return this.db;
  }

  private initializeSchema() {
    try {
      // 스키마 파일 읽기
      const schemaPath = join(__dirname, 'schema.sql');
      const schema = readFileSync(schemaPath, 'utf8');
      
      // 스키마 실행
      this.db.exec(schema);
      
      console.log('✅ Database schema initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize database schema:', error);
      throw error;
    }
  }

  public close() {
    this.db.close();
  }
}

export default DatabaseConnection;
