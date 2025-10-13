// MariaDB 연결 및 데이터 확인 스크립트
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkDatabase() {
  console.log('🔍 MariaDB 연결 확인 중...\n');
  
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'inno-spec-user',
    password: process.env.DB_PASSWORD || 'inno-spec-password',
    database: process.env.DB_NAME || 'inno_spec'
  };

  console.log('연결 설정:');
  console.log(`  Host: ${config.host}`);
  console.log(`  Port: ${config.port}`);
  console.log(`  User: ${config.user}`);
  console.log(`  Database: ${config.database}\n`);

  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ MariaDB 연결 성공!\n');

    // 1. 테이블 목록 확인
    console.log('📋 테이블 목록:');
    const [tables] = await connection.execute('SHOW TABLES');
    console.table(tables);

    // 2. projects 테이블 구조 확인
    console.log('\n🏗️  projects 테이블 구조:');
    const [structure] = await connection.execute('DESCRIBE projects');
    console.table(structure);

    // 3. projects 데이터 확인
    console.log('\n📊 projects 테이블 데이터:');
    const [projects] = await connection.execute('SELECT * FROM projects');
    console.log(`  총 ${projects.length}개의 프로젝트`);
    if (projects.length > 0) {
      console.table(projects);
    } else {
      console.log('  ⚠️  데이터가 없습니다!\n');
    }

    // 4. Tenant별 통계
    console.log('\n📈 Tenant별 프로젝트 통계:');
    const [stats] = await connection.execute(
      'SELECT tenantId, COUNT(*) as count FROM projects GROUP BY tenantId'
    );
    console.table(stats);

    // 5. 최근 생성된 프로젝트
    console.log('\n⏰ 최근 생성된 프로젝트 (5개):');
    const [recent] = await connection.execute(
      'SELECT id, name, tenantId, createdAt FROM projects ORDER BY createdAt DESC LIMIT 5'
    );
    console.table(recent);

    await connection.end();
    console.log('\n✅ 확인 완료!');
    
  } catch (error) {
    console.error('\n❌ 오류 발생:');
    console.error('  메시지:', error.message);
    console.error('  코드:', error.code);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 해결 방법:');
      console.error('  1. MariaDB 컨테이너가 실행 중인지 확인: docker ps');
      console.error('  2. 컨테이너 시작: docker-compose up -d');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 해결 방법:');
      console.error('  1. .env 파일의 DB_USER, DB_PASSWORD 확인');
      console.error('  2. docker-compose.yml과 일치하는지 확인');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\n💡 해결 방법:');
      console.error('  1. 데이터베이스가 생성되지 않았습니다');
      console.error('  2. API 서버를 한번 실행하면 자동 생성됩니다');
    }
  }
}

checkDatabase();

