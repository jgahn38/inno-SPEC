import { Bridge } from './Bridge';

// 교량제원 데이터
export interface BridgeSpecsData {
  id: string;
  bridgeId: string;
  // 기본 치수
  totalLength: number; // 총 길이 (m)
  totalWidth: number; // 총 폭 (m)
  deckHeight: number; // 상판 높이 (m)
  girderHeight: number; // 거더 높이 (m)
  
  // 경간 정보
  spanLengths: number[]; // 각 경간 길이 (m)
  spanCount: number; // 경간 수
  
  // 재료 정보
  concreteStrength: number; // 콘크리트 강도 (MPa)
  steelStrength: number; // 철근 항복강도 (MPa)
  
  // 하중 정보
  deadLoad: number; // 자중 (kN/m²)
  liveLoad: number; // 활하중 (kN/m²)
  
  // 기타 정보
  designYear: number; // 설계년도
  designCode: string; // 설계기준
  notes: string; // 비고
  
  createdAt: Date;
  updatedAt: Date;
}

// 구조물 현황 데이터
export interface StructureStatusData {
  id: string;
  bridgeId: string;
  
  // 구조물 상태
  overallCondition: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'; // 전반적 상태
  structuralIntegrity: 'intact' | 'minor_damage' | 'moderate_damage' | 'severe_damage'; // 구조적 완전성
  
  // 주요 손상 사항
  damages: Array<{
    id: string;
    location: string; // 위치
    type: string; // 손상 유형
    severity: 'minor' | 'moderate' | 'severe'; // 심각도
    description: string; // 상세 설명
    inspectionDate: Date; // 점검일
    repairRequired: boolean; // 수리 필요 여부
  }>;
  
  // 점검 이력
  inspections: Array<{
    id: string;
    date: Date; // 점검일
    inspector: string; // 점검자
    condition: string; // 점검 시 상태
    findings: string; // 발견사항
    recommendations: string; // 권고사항
  }>;
  
  // 수리 이력
  repairs: Array<{
    id: string;
    date: Date; // 수리일
    type: string; // 수리 유형
    description: string; // 수리 내용
    cost: number; // 수리 비용
    contractor: string; // 시공업체
  }>;
  
  createdAt: Date;
  updatedAt: Date;
}

// 교량받침 현황 데이터
export interface BearingStatusData {
  id: string;
  bridgeId: string;
  
  // 받침 유형
  bearingType: 'elastomeric' | 'pot' | 'roller' | 'sliding' | 'fixed' | 'expansion'; // 받침 유형
  
  // 받침 위치 및 수량
  bearings: Array<{
    id: string;
    location: string; // 위치 (예: A1, A2, B1, B2)
    type: string; // 받침 유형
    size: string; // 크기
    capacity: number; // 지지력 (kN)
    condition: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'; // 상태
    installationDate: Date; // 설치일
    lastInspection: Date; // 최종 점검일
    notes: string; // 비고
  }>;
  
  // 받침 상태
  overallCondition: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'; // 전반적 상태
  
  // 점검 이력
  inspections: Array<{
    id: string;
    date: Date; // 점검일
    inspector: string; // 점검자
    findings: string; // 발견사항
    recommendations: string; // 권고사항
  }>;
  
  // 교체 이력
  replacements: Array<{
    id: string;
    date: Date; // 교체일
    reason: string; // 교체 사유
    oldBearing: string; // 기존 받침 정보
    newBearing: string; // 신규 받침 정보
    cost: number; // 교체 비용
  }>;
  
  createdAt: Date;
  updatedAt: Date;
}

// 단면 데이터
export interface SectionData {
  id: string;
  bridgeId: string;
  
  // 단면 유형
  sectionType: string; // 단면 유형 (예: box girder, T-beam, slab)
  
  // 단면 치수
  dimensions: Record<string, number>; // 단면 치수 (키-값 쌍)
  
  // 재료 정보
  materials: Array<{
    id: string;
    name: string; // 재료명
    type: string; // 재료 유형
    properties: Record<string, number>; // 재료 물성
  }>;
  
  // 강화 정보
  reinforcements: Array<{
    id: string;
    type: string; // 강화 유형
    location: string; // 위치
    properties: Record<string, number>; // 강화 물성
  }>;
  
  // 단면 도면 데이터
  drawingData: {
    svgPath: string; // SVG 경로 데이터
    viewBox: string; // 뷰박스
    annotations: Array<{
      id: string;
      x: number;
      y: number;
      text: string;
      type: 'dimension' | 'label' | 'note';
    }>;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// 교량별 통합 데이터
export interface BridgeData {
  id: string;
  bridgeId: string;
  projectId: string;
  
  // 각 메뉴별 데이터
  bridgeSpecs: BridgeSpecsData | null;
  structureStatus: StructureStatusData | null;
  bearingStatus: BearingStatusData | null;
  sectionData: SectionData | null;
  
  // 메타데이터
  lastModified: Date;
  createdBy: string;
  updatedBy: string;
}

// 데이터 생성 요청 타입
export interface CreateBridgeDataRequest {
  bridgeId: string;
  projectId: string;
  dataType: 'bridgeSpecs' | 'structureStatus' | 'bearingStatus' | 'sectionData';
  data: Partial<BridgeSpecsData | StructureStatusData | BearingStatusData | SectionData>;
}

// 데이터 업데이트 요청 타입
export interface UpdateBridgeDataRequest {
  id: string;
  dataType: 'bridgeSpecs' | 'structureStatus' | 'bearingStatus' | 'sectionData';
  data: Partial<BridgeSpecsData | StructureStatusData | BearingStatusData | SectionData>;
}

// 데이터 조회 요청 타입
export interface GetBridgeDataRequest {
  bridgeId: string;
  projectId: string;
  dataType?: 'bridgeSpecs' | 'structureStatus' | 'bearingStatus' | 'sectionData';
}
