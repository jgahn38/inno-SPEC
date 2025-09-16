const mysql = require('mysql2/promise');

async function testMariaDB() {
  try {
    console.log('🔍 MariaDB 연결 테스트 시작...');
    
    // MariaDB 연결 설정 (10.x 버전) - 먼저 시스템 데이터베이스에 연결
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '0000', // root 비밀번호
      database: 'mysql' // 시스템 데이터베이스에 먼저 연결
    });

    console.log('✅ MariaDB 연결 성공!');
    
    // 데이터베이스 생성
    await connection.execute('CREATE DATABASE IF NOT EXISTS inno_spec CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    console.log('✅ 데이터베이스 생성/확인 완료');
    
    // 데이터베이스 선택
    await connection.execute('USE inno_spec');
    console.log('✅ 데이터베이스 선택 완료');
    
    // 테이블 생성
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
    console.log('✅ screens 테이블 생성 완료');
    
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
    console.log('✅ lnb_configs 테이블 생성 완료');
    
    await connection.end();
    console.log('🎉 MariaDB 설정 완료! 이제 MariaDB 서버를 실행할 수 있습니다.');
    
  } catch (error) {
    console.error('❌ MariaDB 연결 실패:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 해결 방법:');
      console.log('1. MariaDB root 비밀번호를 확인하세요');
      console.log('2. test-mariadb.js 파일에서 password 필드를 수정하세요');
      console.log('3. 또는 MariaDB에서 비밀번호를 제거하세요:');
      console.log('   mysql -u root -p');
      console.log('   ALTER USER "root"@"localhost" IDENTIFIED BY "";');
      console.log('   FLUSH PRIVILEGES;');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 해결 방법:');
      console.log('1. MariaDB 서비스가 실행 중인지 확인하세요');
      console.log('2. 관리자 권한으로 PowerShell을 실행하고 다음 명령을 실행하세요:');
      console.log('   net start mariadb');
    }
  }
}

testMariaDB();
