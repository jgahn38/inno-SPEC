import { LNBConfig } from '@inno-spec/shared';

export const adminLNBConfig: LNBConfig[] = [
  {
    id: 'admin-db',
    name: 'admin-db',
    displayName: 'DB',
    icon: '🏢',
    order: 1,
    isActive: true,
    systemScreenType: 'admin-db',
    children: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'admin-tables',
    name: 'admin-tables',
    displayName: '테이블',
    description: '테이블 관리',
    icon: '📊',
    order: 2,
    isActive: true,
    systemScreenType: undefined,
    children: [
      {
        id: 'admin-fields',
        name: 'admin-fields',
        displayName: '필드 정의',
        icon: '🏷️',
        order: 1,
        isActive: true,
        systemScreenType: 'admin-fields',
        children: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'admin-table-definition',
        name: 'admin-table-definition',
        displayName: '테이블 정의',
        icon: '📋',
        order: 2,
        isActive: true,
        systemScreenType: 'admin-table-definition',
        children: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'admin-variables',
    name: 'admin-variables',
    displayName: '변수',
    description: '변수 관리',
    icon: '🔧',
    order: 3,
    isActive: true,
    systemScreenType: undefined,
    children: [
      {
        id: 'admin-variable-definition',
        name: 'admin-variable-definition',
        displayName: '변수 정의',
        icon: '🔧',
        order: 1,
        isActive: true,
        systemScreenType: 'admin-variable-definition',
        children: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'admin-function-definition',
        name: 'admin-function-definition',
        displayName: '함수 정의',
        icon: '⚙️',
        order: 2,
        isActive: true,
        systemScreenType: 'admin-function-definition',
        children: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'admin-screens',
    name: 'admin-screens',
    displayName: '화면',
    description: '화면 관리',
    icon: '🖼️',
    order: 4,
    isActive: true,
    systemScreenType: undefined,
    children: [
      {
        id: 'admin-screen-config',
        name: 'admin-screen-config',
        displayName: '화면 구성',
        icon: '🖼️',
        order: 1,
        isActive: true,
        systemScreenType: 'admin-screen-config',
        children: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'admin-lnb-config',
        name: 'admin-lnb-config',
        displayName: 'LNB 구성',
        icon: '🎛️',
        order: 2,
        isActive: true,
        systemScreenType: 'admin-lnb-config',
        children: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];
