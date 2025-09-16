import { LNBConfig } from '@inno-spec/shared';

export const adminLNBConfig: LNBConfig[] = [
  {
    id: 'admin-db',
    name: 'admin-db',
    displayName: 'DB',
    icon: 'database',
    order: 1,
    isActive: true,
    systemScreenType: 'admin-db',
    children: []
  },
  {
    id: 'admin-tables',
    name: 'admin-tables',
    displayName: '테이블',
    description: '테이블 관리',
    icon: 'table',
    order: 2,
    isActive: true,
    systemScreenType: undefined,
    children: [
      {
        id: 'admin-fields',
        name: 'admin-fields',
        displayName: '필드 정의',
        icon: 'variable',
        order: 1,
        isActive: true,
        systemScreenType: 'admin-fields',
        children: []
      },
      {
        id: 'admin-table-definition',
        name: 'admin-table-definition',
        displayName: '테이블 정의',
        icon: 'table',
        order: 2,
        isActive: true,
        systemScreenType: 'admin-tables',
        children: []
      }
    ]
  },
  {
    id: 'admin-variables',
    name: 'admin-variables',
    displayName: '변수',
    description: '변수 관리',
    icon: 'variable',
    order: 3,
    isActive: true,
    systemScreenType: undefined,
    children: [
      {
        id: 'admin-variable-definition',
        name: 'admin-variable-definition',
        displayName: '변수 정의',
        icon: 'variable',
        order: 1,
        isActive: true,
        systemScreenType: 'admin-variables',
        children: []
      },
      {
        id: 'admin-function-definition',
        name: 'admin-function-definition',
        displayName: '함수 정의',
        icon: 'Variable',
        order: 2,
        isActive: true,
        systemScreenType: 'admin-functions',
        children: []
      }
    ]
  },
  {
    id: 'admin-screens',
    name: 'admin-screens',
    displayName: '화면',
    description: '화면 관리',
    icon: 'Image',
    order: 4,
    isActive: true,
    systemScreenType: undefined,
    children: [
      {
        id: 'admin-screen-config',
        name: 'admin-screen-config',
        displayName: '화면 구성',
        icon: 'Image',
        order: 1,
        isActive: true,
        systemScreenType: 'admin-screenconfig',
        children: []
      },
      {
        id: 'admin-lnb-config',
        name: 'admin-lnb-config',
        displayName: 'LNB 구성',
        icon: 'Settings',
        order: 2,
        isActive: true,
        systemScreenType: 'admin-lnbconfig',
        children: []
      }
    ]
  }
];
