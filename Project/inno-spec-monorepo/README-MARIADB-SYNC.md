# MariaDB 실시간 데이터 연동 시스템

프로그램에 저장된 데이터가 MariaDB와 실시간으로 연동되는 환경이 구축되었습니다.

## 🎯 구현 완료 항목

### 1. ✅ MariaDB 테이블 구조

다음 테이블들이 자동으로 생성됩니다:

- **screens** - 화면 구성 정보
- **lnb_configs** - 좌측 네비게이션 메뉴 구성
- **projects** - 프로젝트 정보
- **bridges** - 교량 정보 (프로젝트 하위)
- **bridge_databases** - 교량받침DB, 내진DB 등
- **database_records** - 데이터베이스 레코드
- **table_schemas** - 테이블 스키마 정의
- **variable_definitions** - 변수 정의

### 2. ✅ API 서비스 구현

모든 데이터 타입에 대한 CRUD API가 구현되었습니다:

#### Screens API

- `GET /api/screens` - 모든 화면 조회
- `GET /api/screens/:id` - 특정 화면 조회
- `POST /api/screens` - 화면 생성
- `PUT /api/screens/:id` - 화면 수정
- `DELETE /api/screens/:id` - 화면 삭제

#### LNB Configs API

- `GET /api/lnb` - 모든 LNB 구성 조회
- `GET /api/lnb/:id` - 특정 LNB 구성 조회
- `POST /api/lnb` - LNB 구성 생성
- `PUT /api/lnb/:id` - LNB 구성 수정
- `DELETE /api/lnb/:id` - LNB 구성 삭제

#### Projects API

- `GET /api/projects` - 모든 프로젝트 조회
- `GET /api/projects/:id` - 특정 프로젝트 조회
- `GET /api/projects/category/:category` - 카테고리별 프로젝트 조회
- `POST /api/projects` - 프로젝트 생성
- `PUT /api/projects/:id` - 프로젝트 수정
- `DELETE /api/projects/:id` - 프로젝트 삭제 (soft delete)

#### Databases API

- `GET /api/databases` - 모든 데이터베이스 조회
- `GET /api/databases/:id` - 특정 데이터베이스 조회
- `GET /api/databases/category/:category` - 카테고리별 데이터베이스 조회
- `POST /api/databases` - 데이터베이스 생성
- `PUT /api/databases/:id` - 데이터베이스 수정
- `DELETE /api/databases/:id` - 데이터베이스 삭제

#### Database Records API

- `GET /api/databases/:databaseId/records` - 데이터베이스의 모든 레코드 조회
- `GET /api/databases/records/:recordId` - 특정 레코드 조회
- `POST /api/databases/:databaseId/records` - 레코드 생성
- `POST /api/databases/:databaseId/records/bulk` - 레코드 대량 생성
- `PUT /api/databases/records/:recordId` - 레코드 수정
- `DELETE /api/databases/records/:recordId` - 레코드 삭제

#### Table Schemas API

- `GET /api/table-schemas` - 모든 테이블 스키마 조회
- `GET /api/table-schemas/:id` - 특정 테이블 스키마 조회
- `GET /api/table-schemas/name/:name` - 이름으로 테이블 스키마 조회
- `POST /api/table-schemas` - 테이블 스키마 생성
- `PUT /api/table-schemas/:id` - 테이블 스키마 수정
- `DELETE /api/table-schemas/:id` - 테이블 스키마 삭제

#### Variables API

- `GET /api/variables` - 모든 변수 조회
- `GET /api/variables/:id` - 특정 변수 조회
- `GET /api/variables/category/:category` - 카테고리별 변수 조회
- `GET /api/variables/scope/:scope` - 스코프별 변수 조회
- `POST /api/variables` - 변수 생성
- `PUT /api/variables/:id` - 변수 수정
- `DELETE /api/variables/:id` - 변수 삭제

### 3. ✅ APIContext 확장

React Context API를 통해 모든 데이터에 접근할 수 있습니다:

```typescript
const {
  // 데이터 상태
  screens,
  lnbConfigs,
  projects,
  databases,
  tableSchemas,
  variables,
  loading,
  error,

  // CRUD 메서드
  createProject,
  updateProject,
  deleteProject,
  refreshProjects,
  // ... 각 데이터 타입별 CRUD 메서드
} = useAPI();
```

## 🚀 사용 방법

### 1. MariaDB 서버 시작

```bash
# Docker로 MariaDB 시작
cd packages/api-server
docker-compose up -d

# 또는 로컬 MariaDB 사용
# .env 파일 설정 필요
```

### 2. API 서버 시작

```bash
cd packages/api-server
npm install
npm run dev
```

서버가 `http://localhost:3001`에서 실행됩니다.

### 3. 애플리케이션에서 사용

#### 기존 localStorage 방식 (변경 전)

```typescript
// ❌ 기존 방식 - localStorage 직접 사용
const projects = JSON.parse(localStorage.getItem("inno_spec_projects") || "[]");
```

#### 새로운 API 방식 (변경 후)

```typescript
// ✅ 새로운 방식 - APIContext 사용
import { useAPI } from "@inno-spec/core";

function ProjectList() {
  const { projects, createProject, loading, error } = useAPI();

  // 프로젝트 생성
  const handleCreate = async () => {
    const success = await createProject({
      id: uuidv4(),
      name: "새 프로젝트",
      description: "프로젝트 설명",
      category: "bridge",
      tags: ["신규"],
    });

    if (success) {
      console.log("프로젝트가 생성되었습니다.");
    }
  };

  return (
    <div>
      {loading && <p>로딩 중...</p>}
      {error && <p>오류: {error}</p>}
      <ul>
        {projects.map((project) => (
          <li key={project.id}>{project.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

## 📋 전환 가이드

기존 localStorage 기반 코드를 API 기반으로 전환하는 방법:

### 1. DatabaseService → apiService.getDatabases()

```typescript
// Before
import { DatabaseService } from "@inno-spec/admin-app";
const databases = DatabaseService.getAllDatabases();

// After
import { useAPI } from "@inno-spec/core";
const { databases } = useAPI();
```

### 2. ProjectService → apiService.getProjects()

```typescript
// Before
const projects = JSON.parse(localStorage.getItem("inno_spec_projects") || "[]");

// After
const { projects } = useAPI();
```

### 3. TableSchemaService → apiService.getTableSchemas()

```typescript
// Before
import { TableSchemaService } from "@inno-spec/admin-app";
const schemas = TableSchemaService.getAllSchemas();

// After
const { tableSchemas } = useAPI();
```

### 4. VariableService → apiService.getVariables()

```typescript
// Before
const variables = JSON.parse(localStorage.getItem("variables") || "[]");

// After
const { variables } = useAPI();
```

## 🔧 설정

### 환경 변수 (.env)

```env
# MariaDB 설정
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=0000
DB_NAME=inno_spec

# API 서버 포트
PORT=3001
```

### Tenant ID 설정

각 사용자/조직별로 데이터를 분리하려면 Tenant ID를 설정하세요:

```typescript
// localStorage에 Tenant ID 저장
localStorage.setItem("currentTenantId", "my-company-id");

// API 요청 시 자동으로 헤더에 포함됨
// x-tenant-id: my-company-id
```

## 🔄 실시간 동기화

### 자동 새로고침

APIContext는 앱 시작 시 자동으로 모든 데이터를 로드합니다:

```typescript
// 초기 데이터 로드 (자동)
useEffect(() => {
  refreshScreens();
  refreshLNBConfigs();
  refreshProjects();
  refreshDatabases();
  refreshTableSchemas();
  refreshVariables();
}, []);
```

### 수동 새로고침

필요 시 수동으로 데이터를 새로고침할 수 있습니다:

```typescript
const { refreshProjects } = useAPI();

const handleRefresh = async () => {
  await refreshProjects();
  console.log("프로젝트 목록이 새로고침되었습니다.");
};
```

## 📊 데이터 마이그레이션

기존 localStorage 데이터를 MariaDB로 마이그레이션하려면:

### 1. 데이터 Export

```typescript
import { DataSyncService } from "@inno-spec/core";

const syncService = DataSyncService.getInstance();
const allData = syncService.exportAllData();
console.log(allData);
```

### 2. 데이터 Import

```typescript
import { apiService } from "@inno-spec/shared";

// 프로젝트 마이그레이션
const projects = JSON.parse(localStorage.getItem("inno_spec_projects") || "[]");
for (const project of projects) {
  await apiService.createProject(project);
}

// 데이터베이스 마이그레이션
const databases = JSON.parse(localStorage.getItem("bridge_databases") || "[]");
for (const db of databases) {
  await apiService.createDatabase(db);
}

// 테이블 스키마 마이그레이션
const schemas = JSON.parse(localStorage.getItem("inno_spec_table_schemas") || "[]");
for (const schema of schemas) {
  await apiService.createTableSchema(schema);
}

// 변수 마이그레이션
const variables = JSON.parse(localStorage.getItem("variables") || "[]");
for (const variable of variables) {
  await apiService.createVariable(variable);
}
```

## ⚡ 성능 최적화

### 1. API Fallback

API 서버가 실행되지 않은 경우 자동으로 localStorage를 사용합니다:

```typescript
// APIService.ts에서 자동 fallback
private fallbackToLocalStorage<T>(endpoint: string, options: RequestInit): ApiResponse<T> {
  if (endpoint === '/projects') {
    const projects = JSON.parse(localStorage.getItem('inno_spec_projects') || '[]');
    return { success: true, data: projects as T };
  }
  // ...
}
```

### 2. 캐싱

APIContext는 메모리에 데이터를 캐싱하여 불필요한 API 호출을 방지합니다.

## 🔐 보안

### Multi-Tenant 지원

각 Tenant는 자신의 데이터만 조회/수정할 수 있습니다:

```sql
-- 모든 쿼리에 tenantId 필터 자동 적용
SELECT * FROM projects WHERE tenantId = 'tenant-123';
```

### User ID 추적

모든 생성/수정 작업에 사용자 ID가 기록됩니다:

```typescript
// 프로젝트 생성 시 createdBy 자동 설정
const userId = req.headers["x-user-id"] || "default-user";
await mariaDBProjectService.createProject(req.body, tenantId, userId);
```

## 🐛 문제 해결

### API 서버 연결 실패

```
Error: API 서버에 연결할 수 없습니다.
```

**해결 방법:**

1. API 서버가 실행 중인지 확인: `http://localhost:3001/health`
2. CORS 설정 확인
3. 네트워크 방화벽 확인

### 데이터가 표시되지 않음

**해결 방법:**

1. Tenant ID가 올바른지 확인
2. MariaDB 테이블에 데이터가 있는지 확인
3. 브라우저 콘솔에서 에러 메시지 확인

### 데이터 동기화 오류

**해결 방법:**

1. API 서버 로그 확인
2. MariaDB 연결 상태 확인
3. `refreshXXX()` 메서드로 수동 새로고침

## 📚 참고 자료

- [MariaDB 설정 가이드](packages/api-server/MARIADB_SETUP.md)
- [API 서버 문서](packages/api-server/README.md)
- [Docker Compose 설정](packages/api-server/docker-compose.yml)

---

**💡 완료!** 이제 모든 데이터가 MariaDB와 실시간으로 연동됩니다. 각 컴포넌트에서 localStorage 대신 `useAPI()` 훅을 사용하도록 변경하면 됩니다.
