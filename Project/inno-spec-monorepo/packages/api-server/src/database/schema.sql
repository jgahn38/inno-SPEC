-- 데이터베이스 스키마 정의

-- 테넌트 테이블
CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- 프로젝트 테이블
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    tenant_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- 교량 테이블
CREATE TABLE IF NOT EXISTS bridges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    project_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 화면 설정 테이블
CREATE TABLE IF NOT EXISTS screens (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('dashboard', 'custom')),
    layout TEXT NOT NULL CHECK (layout IN ('single', 'grid', 'tabs')),
    data_structure TEXT NOT NULL CHECK (data_structure IN ('project', 'bridge')),
    is_active BOOLEAN DEFAULT 1,
    tenant_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- 화면 컴포넌트 테이블
CREATE TABLE IF NOT EXISTS screen_components (
    id TEXT PRIMARY KEY,
    screen_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('table', 'variable')),
    component_id TEXT NOT NULL,
    display_name TEXT NOT NULL,
    position_x INTEGER NOT NULL,
    position_y INTEGER NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    config TEXT NOT NULL, -- JSON 문자열로 저장
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (screen_id) REFERENCES screens(id) ON DELETE CASCADE
);

-- LNB 설정 테이블
CREATE TABLE IF NOT EXISTS lnb_configs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    icon TEXT,
    order_index INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    parent_id TEXT,
    type TEXT NOT NULL CHECK (type IN ('independent', 'parent', 'child')),
    screen_id TEXT,
    system_screen_type TEXT CHECK (system_screen_type IN ('dashboard', 'project-settings', 'section-library', 'user-profile', 'system-settings')),
    tenant_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES lnb_configs(id) ON DELETE CASCADE,
    FOREIGN KEY (screen_id) REFERENCES screens(id) ON DELETE SET NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_projects_tenant_id ON projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bridges_project_id ON bridges(project_id);
CREATE INDEX IF NOT EXISTS idx_screens_tenant_id ON screens(tenant_id);
CREATE INDEX IF NOT EXISTS idx_screen_components_screen_id ON screen_components(screen_id);
CREATE INDEX IF NOT EXISTS idx_lnb_configs_tenant_id ON lnb_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lnb_configs_parent_id ON lnb_configs(parent_id);
CREATE INDEX IF NOT EXISTS idx_lnb_configs_order ON lnb_configs(order_index);
