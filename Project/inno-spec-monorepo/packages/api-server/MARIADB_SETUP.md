# MariaDB 설치 및 설정 가이드

## Windows에서 MariaDB 설치

### 방법 1: MariaDB 공식 설치 프로그램 사용

1. **MariaDB 다운로드**

   - https://mariadb.org/download/ 접속
   - Windows용 MariaDB Community Server 다운로드
   - 최신 안정 버전 (10.11.x) 선택

2. **설치 과정**

   - 다운로드한 `.msi` 파일 실행
   - 설치 마법사 따라하기
   - Root 비밀번호 설정 (예: `inno-spec-root`)
   - 포트 번호: 3306 (기본값)
   - 서비스로 실행 설정

3. **설치 확인**
   ```cmd
   mysql -u root -p
   ```

### 방법 2: Chocolatey 사용 (권장)

```powershell
# Chocolatey가 설치되어 있다면
choco install mariadb

# 서비스 시작
net start mariadb
```

### 방법 3: Docker 사용

```bash
# Docker Desktop이 설치되어 있다면
docker run --name inno-spec-mariadb -e MYSQL_ROOT_PASSWORD=inno-spec-root -e MYSQL_DATABASE=inno_spec -p 3306:3306 -d mariadb:10.11
```

## 데이터베이스 설정

### 1. 데이터베이스 생성

```sql
CREATE DATABASE inno_spec CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. 사용자 생성 (선택사항)

```sql
CREATE USER 'inno-spec-user'@'localhost' IDENTIFIED BY 'inno-spec-password';
GRANT ALL PRIVILEGES ON inno_spec.* TO 'inno-spec-user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. 환경 변수 설정

`.env` 파일 생성:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_root_password
DB_NAME=inno_spec
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## 서버 실행

```bash
# MariaDB 서버 실행
npm run dev:mariadb

# 또는 간단한 JSON 서버 실행 (MariaDB 없이)
npm run dev
```

## 문제 해결

### 연결 오류가 발생하는 경우

1. **MariaDB 서비스 확인**

   ```cmd
   net start mariadb
   ```

2. **포트 확인**

   ```cmd
   netstat -an | findstr 3306
   ```

3. **방화벽 설정**

   - Windows 방화벽에서 포트 3306 허용

4. **비밀번호 확인**
   - 설치 시 설정한 root 비밀번호 확인

### 대안: JSON 파일 기반 서버 사용

MariaDB 설치가 어려운 경우, 기존의 JSON 파일 기반 서버를 사용할 수 있습니다:

```bash
npm run dev
```

이 경우 데이터는 `data/screens.json`과 `data/lnb.json` 파일에 저장됩니다.
