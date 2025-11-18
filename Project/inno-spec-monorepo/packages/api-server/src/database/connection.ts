import sqlite3 from 'sqlite3';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private db: sqlite3.Database;

  private constructor() {
    // 데이터 디렉토리 생성
    const dataDir = join(process.cwd(), 'data');
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
      console.log('✅ Data directory created:', dataDir);
    }
    
    // 데이터베이스 파일 경로
    const dbPath = join(dataDir, 'inno-spec.db');
    
    // 데이터베이스 연결
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Database connection error:', err);
        throw err;
      }
      console.log('✅ Connected to SQLite database:', dbPath);
    });
    
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
      // ESM 모듈에서 __dirname 대체
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      
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

// Promise 기반 Database 래퍼 클래스
export class Database {
  private static instance: Database;
  private connection: DatabaseConnection;

  private constructor() {
    this.connection = DatabaseConnection.getInstance();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  // Promise로 래핑된 all 메서드
  public all(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const db = this.connection.getDatabase();
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  // Promise로 래핑된 get 메서드
  public get(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      const db = this.connection.getDatabase();
      db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Promise로 래핑된 run 메서드
  public run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    return new Promise((resolve, reject) => {
      const db = this.connection.getDatabase();
      db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            lastID: this.lastID,
            changes: this.changes
          });
        }
      });
    });
  }
}

export default DatabaseConnection;
