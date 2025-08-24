# Inno-SPEC 데이터 동기화 시스템

회사와 집에서 개발할 때 테이블, 데이터베이스, 프로젝트 데이터를 동기화하기 위한 시스템입니다.

## 🎯 주요 기능

- **데이터 Export/Import**: JSON 파일을 통한 데이터 백업 및 복원
- **Git 기반 동기화**: 백업 파일을 git으로 관리하여 컴퓨터 간 동기화
- **자동 동기화**: 스크립트를 통한 자동 데이터 복원
- **선택적 동기화**: 필요한 데이터만 선택적으로 동기화

## 🚀 빠른 시작

### 1. 데이터 동기화 관리자 접근

애플리케이션에서 `DataSyncManager` 컴포넌트를 통해 데이터 동기화를 관리할 수 있습니다.

### 2. 회사에서 작업 후 동기화

```bash
# 1. 애플리케이션에서 "백업 파일 생성" 클릭
# 2. 생성된 백업 파일을 git에 추가
git add data-backups/inno_spec_backup_YYYY-MM-DD.json

# 3. 커밋 및 푸시
git commit -m "데이터 백업: YYYY-MM-DD"
git push
```

### 3. 집에서 최신 데이터 가져오기

```bash
# 1. 최신 코드 및 백업 파일 가져오기
git pull

# 2. 자동 데이터 복원
npm run sync:restore

# 3. 애플리케이션 실행하여 복원된 데이터 확인
npm run dev
```

## 📋 상세 사용법

### 명령어 스크립트

```bash
# 동기화 상태 확인
npm run sync:status

# 백업 파일 생성 (개발용)
npm run sync:backup

# 최신 백업에서 데이터 복원
npm run sync:restore
```

### 수동 동기화

1. **데이터 Export**
   - 애플리케이션에서 "데이터 Export" 클릭
   - 원하는 데이터 타입 선택 (데이터베이스, 프로젝트, 테이블 스키마, 레코드)
   - JSON 파일 다운로드

2. **데이터 Import**
   - 애플리케이션에서 "파일 선택" 클릭
   - JSON 파일 선택하여 데이터 복원

## 🔧 시스템 구성

### 핵심 서비스

- **DataSyncService**: 데이터 동기화 로직 관리
- **DatabaseService**: 데이터베이스 데이터 관리 (localStorage)
- **ProjectService**: 프로젝트 데이터 관리 (localStorage)
- **TableSchemaService**: 테이블 스키마 관리 (localStorage)

### 데이터 저장소

- **localStorage**: 브라우저 기반 데이터 저장
- **JSON 파일**: 백업 및 동기화용 데이터 포맷
- **Git**: 백업 파일 버전 관리

## 📁 파일 구조

```
Project/
├── src/
│   ├── services/
│   │   ├── DataSyncService.ts          # 데이터 동기화 서비스
│   │   ├── DatabaseService.ts          # 데이터베이스 관리
│   │   ├── ProjectService.ts           # 프로젝트 관리
│   │   └── TableSchemaService.ts       # 테이블 스키마 관리
│   └── components/
│       └── DataSyncManager.tsx         # 동기화 관리 UI
├── scripts/
│   └── sync-data.js                    # 동기화 스크립트
├── data-backups/                       # 백업 파일 저장소
└── package.json                        # npm 스크립트 정의
```

## 🔄 동기화 워크플로우

### 회사에서 작업 시

1. 데이터 수정/추가
2. 애플리케이션에서 "백업 파일 생성" 클릭
3. 생성된 백업 파일을 git에 추가
4. 커밋 및 푸시

### 집에서 작업 시

1. git pull로 최신 코드 및 백업 가져오기
2. `npm run sync:restore` 실행
3. 애플리케이션 실행하여 복원된 데이터 확인

## ⚠️ 주의사항

### 데이터 충돌 방지

- **동시 작업 금지**: 같은 데이터를 동시에 수정하지 마세요
- **정기 동기화**: 하루에 최소 1회 이상 동기화하세요
- **백업 확인**: 동기화 전 백업 파일의 유효성을 확인하세요

### 호환성

- **버전 관리**: 메이저 버전이 다른 백업 파일은 호환되지 않을 수 있습니다
- **브라우저 지원**: localStorage를 지원하는 최신 브라우저를 사용하세요

## 🛠️ 문제 해결

### 일반적인 문제

1. **동기화 실패**
   - 백업 파일 형식 확인
   - 브라우저 콘솔에서 오류 메시지 확인
   - localStorage 용량 확인

2. **데이터 누락**
   - 백업 파일에 해당 데이터가 포함되어 있는지 확인
   - Export 옵션에서 해당 데이터 타입이 선택되어 있는지 확인

3. **스크립트 실행 오류**
   - Node.js 버전 확인 (v14 이상 권장)
   - 스크립트 파일 권한 확인
   - 백업 디렉토리 존재 여부 확인

### 디버깅

```bash
# 동기화 상태 확인
npm run sync:status

# 브라우저 개발자 도구에서 localStorage 확인
localStorage.getItem('bridge_databases')
localStorage.getItem('inno_spec_projects')
localStorage.getItem('inno_spec_table_schemas')
```

## 🔮 향후 계획

- [ ] 클라우드 데이터베이스 연동 (Firebase, Supabase)
- [ ] 실시간 동기화
- [ ] 충돌 해결 자동화
- [ ] 데이터 암호화
- [ ] 백업 압축 및 최적화

## 📞 지원

문제가 발생하거나 개선 사항이 있으면 이슈를 등록해 주세요.

---

**💡 팁**: 정기적인 동기화를 위해 작업 시작/종료 시 동기화하는 습관을 들이세요!
