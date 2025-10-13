// API 테스트 스크립트
// 사용법: node test-api.js

const BASE_URL = 'http://localhost:3001/api';
const TENANT_ID = 'test-tenant';

const headers = {
  'Content-Type': 'application/json',
  'x-tenant-id': TENANT_ID,
  'x-user-id': 'test-user'
};

// 테스트 헬퍼 함수
async function testAPI(name, method, url, body = null) {
  console.log(`\n🧪 테스트: ${name}`);
  console.log(`   ${method} ${url}`);
  
  try {
    const options = {
      method,
      headers,
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${url}`, options);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`   ✅ 성공 (${response.status})`);
      console.log('   응답:', JSON.stringify(data, null, 2));
      return data;
    } else {
      console.log(`   ❌ 실패 (${response.status})`);
      console.log('   오류:', data);
      return null;
    }
  } catch (error) {
    console.log(`   ❌ 에러: ${error.message}`);
    return null;
  }
}

// 메인 테스트 시퀀스
async function runTests() {
  console.log('🚀 MariaDB API 테스트 시작\n');
  console.log('=' .repeat(60));
  
  // 1. Projects 테스트
  console.log('\n📁 Projects API 테스트');
  console.log('-'.repeat(60));
  
  // 1-1. 프로젝트 생성
  const newProject = await testAPI(
    '프로젝트 생성',
    'POST',
    '/projects',
    {
      id: 'test-project-1',
      name: '테스트 프로젝트',
      description: 'API 테스트용 프로젝트',
      category: '교량',
      tags: ['테스트', 'API']
    }
  );
  
  // 1-2. 프로젝트 목록 조회
  await testAPI('프로젝트 목록 조회', 'GET', '/projects');
  
  // 1-3. 특정 프로젝트 조회
  if (newProject?.data?.id) {
    await testAPI('특정 프로젝트 조회', 'GET', `/projects/${newProject.data.id}`);
  }
  
  // 1-4. 프로젝트 수정
  if (newProject?.data?.id) {
    await testAPI(
      '프로젝트 수정',
      'PUT',
      `/projects/${newProject.data.id}`,
      {
        name: '수정된 테스트 프로젝트',
        description: '수정된 설명'
      }
    );
  }
  
  // 2. Databases 테스트
  console.log('\n🗄️  Databases API 테스트');
  console.log('-'.repeat(60));
  
  // 2-1. 데이터베이스 생성
  const newDatabase = await testAPI(
    '데이터베이스 생성',
    'POST',
    '/databases',
    {
      name: 'test_bearing_db',
      displayName: '테스트 교량받침 DB',
      description: 'API 테스트용 교량받침 데이터베이스',
      category: 'bearing',
      fields: [
        {
          id: 'field1',
          name: 'bearing_type',
          displayName: '받침 형식',
          type: 'text',
          required: true
        },
        {
          id: 'field2',
          name: 'capacity',
          displayName: '용량',
          type: 'number',
          unit: 'kN'
        }
      ]
    }
  );
  
  // 2-2. 데이터베이스 목록 조회
  await testAPI('데이터베이스 목록 조회', 'GET', '/databases');
  
  // 2-3. 레코드 생성
  if (newDatabase?.data?.id) {
    await testAPI(
      '레코드 생성',
      'POST',
      `/databases/${newDatabase.data.id}/records`,
      {
        bearing_type: '탄성받침',
        capacity: 500
      }
    );
  }
  
  // 2-4. 레코드 조회
  if (newDatabase?.data?.id) {
    await testAPI('레코드 조회', 'GET', `/databases/${newDatabase.data.id}/records`);
  }
  
  // 3. Table Schemas 테스트
  console.log('\n📋 Table Schemas API 테스트');
  console.log('-'.repeat(60));
  
  // 3-1. 테이블 스키마 생성
  const newSchema = await testAPI(
    '테이블 스키마 생성',
    'POST',
    '/table-schemas',
    {
      name: 'test_table',
      displayName: '테스트 테이블',
      description: 'API 테스트용 테이블',
      fields: [
        {
          id: 'field1',
          name: 'name',
          displayName: '이름',
          type: 'text',
          required: true
        }
      ]
    }
  );
  
  // 3-2. 테이블 스키마 목록 조회
  await testAPI('테이블 스키마 목록 조회', 'GET', '/table-schemas');
  
  // 4. Variables 테스트
  console.log('\n🔢 Variables API 테스트');
  console.log('-'.repeat(60));
  
  // 4-1. 변수 생성
  const newVariable = await testAPI(
    '변수 생성',
    'POST',
    '/variables',
    {
      name: 'test_var',
      displayName: '테스트 변수',
      description: 'API 테스트용 변수',
      type: 'number',
      unit: 'm',
      defaultValue: 10.5,
      category: 'input',
      scope: 'project',
      tags: ['테스트']
    }
  );
  
  // 4-2. 변수 목록 조회
  await testAPI('변수 목록 조회', 'GET', '/variables');
  
  // 5. Screens 테스트
  console.log('\n🖥️  Screens API 테스트');
  console.log('-'.repeat(60));
  
  // 5-1. 화면 목록 조회
  await testAPI('화면 목록 조회', 'GET', '/screens');
  
  // 6. LNB 테스트
  console.log('\n🎯 LNB API 테스트');
  console.log('-'.repeat(60));
  
  // 6-1. LNB 목록 조회
  await testAPI('LNB 목록 조회', 'GET', '/lnb');
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ 모든 테스트 완료!\n');
}

// 테스트 실행
runTests().catch(error => {
  console.error('❌ 테스트 실패:', error);
  process.exit(1);
});

