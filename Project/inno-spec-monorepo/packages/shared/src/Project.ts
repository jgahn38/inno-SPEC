import type { Bridge } from './Bridge';

export interface Project {
  id: string;
  tenantId: string; // 테넌트 ID 추가
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'archived' | 'deleted';
  category: string; // 카테고리 이름 (하위 호환성)
  categoryId?: string; // 카테고리 ID (LNB 매칭용)
  tags: string[];
  metadata?: Record<string, any>;
  bridges?: Bridge[];
  createdBy: string; // 생성한 사용자 ID
  assignedTo?: string; // 담당자 ID
}

export interface CreateProjectRequest {
  id: string;
  name: string;
  description: string;
  category: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateProjectRequest {
  id: string;
  name?: string;
  description?: string;
  category?: string;
  tags?: string[];
  status?: 'active' | 'archived' | 'deleted';
  metadata?: Record<string, any>;
}
