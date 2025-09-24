import { LNBConfig } from '@inno-spec/shared';

export const projectLNBConfig: LNBConfig[] = [
  {
    id: 'dashboard',
    name: '대시보드',
    displayName: '대시보드',
    icon: '📊',
    order: 1,
    isActive: true,
    systemScreenType: undefined,
    children: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'project-settings',
    name: '프로젝트 설정',
    displayName: '프로젝트 설정',
    icon: '⚙️',
    order: 2,
    isActive: true,
    systemScreenType: undefined,
    children: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];
