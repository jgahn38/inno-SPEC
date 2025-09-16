const mysql = require('mysql2/promise');

async function testMariaDBWithPassword() {
  const passwords = ['', 'root', 'password', '123456', 'admin', 'mariadb'];
  
  for (const password of passwords) {
    try {
      console.log(`🔍 비밀번호 "${password}"로 MariaDB 연결 시도...`);
      
      const connection = await mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: password,
        database: 'mysql' // 시스템 데이터베이스에 먼저 연결
      });

      console.log(`✅ MariaDB 연결 성공! 비밀번호: "${password}"`);
      
      // 데이터베이스 생성
      await connection.execute('CREATE DATABASE IF NOT EXISTS inno_spec CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
      console.log('✅ 데이터베이스 생성/확인 완료');
      
      // root 사용자의 인증 방식 변경
      await connection.execute(`ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${password}'`);
      await connection.execute('FLUSH PRIVILEGES');
      console.log('✅ root 사용자 인증 방식 변경 완료');
      
      await connection.end();
      console.log('🎉 MariaDB 설정 완료!');
      console.log(`📝 사용할 비밀번호: "${password}"`);
      return password;
      
    } catch (error) {
      console.log(`❌ 비밀번호 "${password}" 실패: ${error.message}`);
    }
  }
  
  console.log('❌ 모든 비밀번호 시도 실패');
  console.log('💡 MariaDB 설치 시 설정한 비밀번호를 확인하세요');
  return null;
}

testMariaDBWithPassword();
