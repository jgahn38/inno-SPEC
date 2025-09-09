export interface Bridge {
  id: string;
  name: string;
  displayName: string;
  description: string;
  type: 'concrete' | 'steel' | 'composite';
  length: number;
  width: number;
  // 추가 정보
  spanCount: number; // 경간 수
  height: number; // 높이
  constructionYear: number; // 준공년도
  location: string; // 위치
  status: 'active' | 'inactive' | 'maintenance'; // 상태
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBridgeRequest {
  name: string;
  displayName: string;
  description: string;
  type: 'concrete' | 'steel' | 'composite';
  length: number;
  width: number;
  spanCount: number;
  height: number;
  constructionYear: number;
  location: string;
  status: 'active' | 'inactive' | 'maintenance';
}

export interface UpdateBridgeRequest {
  id: string;
  name?: string;
  displayName?: string;
  description?: string;
  type?: 'concrete' | 'steel' | 'composite';
  length?: number;
  width?: number;
  spanCount?: number;
  height?: number;
  constructionYear?: number;
  location?: string;
  status?: 'active' | 'inactive' | 'maintenance';
  isActive?: boolean;
}
