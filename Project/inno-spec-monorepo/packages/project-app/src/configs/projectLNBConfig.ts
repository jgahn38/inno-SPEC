import { LNBConfig } from '@inno-spec/shared';

export const projectLNBConfig: LNBConfig[] = [
  {
    id: 'dashboard',
    name: 'dashboard',
    displayName: '대시보드',
    description: '프로젝트 개요 및 주요 정보',
    icon: '📊',
    order: 1,
    isActive: true,
    systemScreenType: 'dashboard',
    children: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'project-settings',
    name: 'project-settings',
    displayName: '프로젝트 설정',
    description: '프로젝트 기본 설정 및 메타데이터',
    icon: '⚙️',
    order: 2,
    isActive: true,
    systemScreenType: 'project-settings',
    children: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];
