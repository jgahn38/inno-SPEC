import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config();

interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  waitForConnections: boolean;
  connectionLimit: number;
  queueLimit: number;
}

class MariaDBConnection {
  private static instance: MariaDBConnection;
  private pool: mysql.Pool;

  private constructor() {
    const config: any = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '0000',
      database: process.env.DB_NAME || 'inno_spec',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      // MariaDB 10.x 인증 플러그인 설정
      authPlugins: {
        mysql_native_password: () => () => Buffer.alloc(0)
      }
    };

    console.log('🔧 Database config:', {
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password ? '***' : 'NOT SET',
      database: config.database
    });

    this.pool = mysql.createPool(config);
    this.initializeDatabase();
  }

  public static getInstance(): MariaDBConnection {
    if (!MariaDBConnection.instance) {
      MariaDBConnection.instance = new MariaDBConnection();
    }
    return MariaDBConnection.instance;
  }

  public getPool(): mysql.Pool {
    return this.pool;
  }

  private async initializeDatabase() {
    try {
      // 데이터베이스가 존재하지 않으면 생성
      await this.createDatabaseIfNotExists();
      
      // 테이블 생성
      await this.createTables();
      
      console.log('✅ MariaDB database initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize MariaDB database:', error);
      throw error;
    }
  }

  private async createDatabaseIfNotExists() {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '0000',
      // MariaDB 10.x 인증 플러그인 설정
      authPlugins: {
        mysql_native_password: () => () => Buffer.alloc(0)
      }
    });

    const dbName = process.env.DB_NAME || 'inno_spec';
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.execute(`USE \`${dbName}\``);
    await connection.end();
  }

  private async createTables() {
    const connection = await this.pool.getConnection();
    
    try {
      // 화면 테이블 생성
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS screens (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          displayName VARCHAR(255) NOT NULL,
          description TEXT,
          type VARCHAR(50) NOT NULL,
          layout TEXT NOT NULL,
          components JSON,
          dataStructure JSON,
          isActive BOOLEAN DEFAULT TRUE,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          tenantId VARCHAR(36) NOT NULL,
          INDEX idx_tenant_id (tenantId),
          INDEX idx_created_at (createdAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // LNB 설정 테이블 생성
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS lnb_configs (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          displayName VARCHAR(255) NOT NULL,
          icon VARCHAR(100),
          \`order\` INT NOT NULL,
          isActive BOOLEAN DEFAULT TRUE,
          parentId VARCHAR(36),
          isParent BOOLEAN DEFAULT FALSE,
          type VARCHAR(50) NOT NULL,
          screenId VARCHAR(36),
          systemScreenType VARCHAR(50),
          children JSON,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          tenantId VARCHAR(36) NOT NULL,
          INDEX idx_tenant_id (tenantId),
          INDEX idx_order (\`order\`),
          INDEX idx_parent_id (parentId),
          FOREIGN KEY (parentId) REFERENCES lnb_configs(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // 프로젝트 테이블 생성
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS projects (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          isActive BOOLEAN DEFAULT TRUE,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          tenantId VARCHAR(36) NOT NULL,
          INDEX idx_tenant_id (tenantId),
          INDEX idx_created_at (createdAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // 브리지 테이블 생성
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS bridges (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          projectId VARCHAR(36) NOT NULL,
          isActive BOOLEAN DEFAULT TRUE,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          tenantId VARCHAR(36) NOT NULL,
          INDEX idx_project_id (projectId),
          INDEX idx_tenant_id (tenantId),
          FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      console.log('✅ Database tables created successfully');
    } finally {
      connection.release();
    }
  }

  public async close() {
    await this.pool.end();
  }

  // 연결 테스트
  public async testConnection(): Promise<boolean> {
    try {
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }
}

export default MariaDBConnection;
export { MariaDBConnection };
