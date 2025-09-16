-- MariaDB 초기화 스크립트
-- 데이터베이스와 사용자 생성

CREATE DATABASE IF NOT EXISTS inno_spec CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 사용자 생성 (이미 docker-compose에서 생성되지만 안전을 위해)
CREATE USER IF NOT EXISTS 'inno-spec-user'@'%' IDENTIFIED BY 'inno-spec-password';
GRANT ALL PRIVILEGES ON inno_spec.* TO 'inno-spec-user'@'%';
FLUSH PRIVILEGES;

USE inno_spec;

-- 화면 테이블
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- LNB 설정 테이블
CREATE TABLE IF NOT EXISTS lnb_configs (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  displayName VARCHAR(255) NOT NULL,
  icon VARCHAR(100),
  `order` INT NOT NULL,
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
  INDEX idx_order (`order`),
  INDEX idx_parent_id (parentId),
  FOREIGN KEY (parentId) REFERENCES lnb_configs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 프로젝트 테이블
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 브리지 테이블
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
