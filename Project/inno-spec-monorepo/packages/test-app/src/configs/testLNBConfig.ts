import { LNBConfig } from '@inno-spec/shared';

export const testLNBConfig: LNBConfig[] = [
  {
    id: 'test-dashboard',
    name: 'test-dashboard',
    displayName: '대시보드',
    description: '테스트 대시보드',
    icon: 'BarChart3',
    order: 1,
    isActive: true,
    type: 'independent',
    children: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'test-section',
    name: 'test-section',
    displayName: '삽도',
    description: '2D 삽도 생성 테스트',
    icon: 'Ruler',
    order: 2,
    isActive: true,
    type: 'independent',
    children: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'test-ifc-generator',
    name: 'test-ifc-generator',
    displayName: 'IFC Generator',
    description: '사용자 입력값 또는 midas Civil mct 파일 데이터를 IFC 데이터로 변환',
    icon: 'FileCode',
    order: 3,
    isActive: true,
    type: 'independent',
    children: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

