import React from 'react';
import { ScreenConfig, ScreenComponent, LNBConfig, ScreenTemplate, SystemScreenType } from '@inno-spec/shared';

class ScreenService {
  private screens: ScreenConfig[] = [];
  private lnbConfigs: LNBConfig[] = [];
  private templates: ScreenTemplate[] = [];

  constructor() {
    this.loadFromLocalStorage();
  }



  // LNB 구성 관리
  getLNBConfigs(): LNBConfig[] {
    return this.lnbConfigs.sort((a, b) => a.order - b.order);
  }

  createLNBConfig(config: Omit<LNBConfig, 'id' | 'createdAt' | 'updatedAt'>): LNBConfig {
    const newConfig: LNBConfig = {
      ...config,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.lnbConfigs.push(newConfig);
    this.saveToLocalStorage();
    return newConfig;
  }

  updateLNBConfig(id: string, updates: Partial<LNBConfig>): LNBConfig | null {
    const index = this.lnbConfigs.findIndex(config => config.id === id);
    if (index === -1) return null;

    this.lnbConfigs[index] = {
      ...this.lnbConfigs[index],
      ...updates,
      updatedAt: new Date()
    };

    this.saveToLocalStorage();
    return this.lnbConfigs[index];
  }

  deleteLNBConfig(id: string): boolean {
    const index = this.lnbConfigs.findIndex(config => config.id === id);
    if (index === -1) return false;

    this.lnbConfigs.splice(index, 1);
    this.saveToLocalStorage();
    return true;
  }

  // 화면 구성 관리
  getScreens(): ScreenConfig[] {
    return this.screens;
  }

  getScreenById(id: string): ScreenConfig | null {
    return this.screens.find(screen => screen.id === id) || null;
  }

  createScreen(screen: Omit<ScreenConfig, 'id' | 'createdAt' | 'updatedAt'>): ScreenConfig {
    const newScreen: ScreenConfig = {
      ...screen,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.screens.push(newScreen);
    this.saveToLocalStorage();
    return newScreen;
  }

  updateScreen(id: string, updates: Partial<ScreenConfig>): ScreenConfig | null {
    const index = this.screens.findIndex(screen => screen.id === id);
    if (index === -1) return null;

    const oldScreen = this.screens[index];
    this.screens[index] = {
      ...this.screens[index],
      ...updates,
      updatedAt: new Date()
    };

    console.log('🔄 ScreenService.updateScreen:', {
      screenId: id,
      oldLayout: oldScreen.layout,
      newLayout: updates.layout,
      oldTabs: oldScreen.tabs,
      newTabs: updates.tabs,
      fullOldScreen: oldScreen,
      fullNewScreen: this.screens[index]
    });

    this.saveToLocalStorage();
    return this.screens[index];
  }

  deleteScreen(id: string): boolean {
    const index = this.screens.findIndex(screen => screen.id === id);
    if (index === -1) return false;

    this.screens.splice(index, 1);
    this.saveToLocalStorage();
    return true;
  }

  // 화면 컴포넌트 관리
  addComponentToScreen(screenId: string, component: Omit<ScreenComponent, 'id'>): ScreenComponent | null {
    const screen = this.getScreenById(screenId);
    if (!screen) return null;

    const newComponent: ScreenComponent = {
      ...component,
      id: this.generateId()
    };

    screen.components.push(newComponent);
    screen.updatedAt = new Date();
    this.saveToLocalStorage();
    return newComponent;
  }

  updateScreenComponent(screenId: string, componentId: string, updates: Partial<ScreenComponent>): ScreenComponent | null {
    const screen = this.getScreenById(screenId);
    if (!screen) return null;

    const componentIndex = screen.components.findIndex(comp => comp.id === componentId);
    if (componentIndex === -1) return null;

    screen.components[componentIndex] = {
      ...screen.components[componentIndex],
      ...updates
    };
    screen.updatedAt = new Date();
    this.saveToLocalStorage();
    return screen.components[componentIndex];
  }

  removeComponentFromScreen(screenId: string, componentId: string): boolean {
    const screen = this.getScreenById(screenId);
    if (!screen) return false;

    const componentIndex = screen.components.findIndex(comp => comp.id === componentId);
    if (componentIndex === -1) return false;

    screen.components.splice(componentIndex, 1);
    screen.updatedAt = new Date();
    this.saveToLocalStorage();
    return true;
  }

  // 템플릿 관리
  getTemplates(): ScreenTemplate[] {
    return this.templates;
  }

  getTemplateById(id: string): ScreenTemplate | null {
    return this.templates.find(template => template.id === id) || null;
  }

  // 유틸리티 메서드
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private saveToLocalStorage() {
    try {
      localStorage.setItem('screenConfigs', JSON.stringify(this.screens));
      localStorage.setItem('lnbConfigs', JSON.stringify(this.lnbConfigs));
      console.log('Saved LNB configs to localStorage:', this.lnbConfigs);
    } catch (error) {
      console.error('Failed to save screen configs to localStorage:', error);
    }
  }

  private loadFromLocalStorage() {
    try {
      const savedScreens = localStorage.getItem('screenConfigs');
      const savedLNBConfigs = localStorage.getItem('lnbConfigs');

      if (savedScreens) {
        const parsedScreens = JSON.parse(savedScreens);
        this.screens = parsedScreens.map((screen: any) => ({
          ...screen,
          createdAt: new Date(screen.createdAt),
          updatedAt: new Date(screen.updatedAt)
        }));
      }
      if (savedLNBConfigs) {
        const parsedLNBConfigs = JSON.parse(savedLNBConfigs);
        this.lnbConfigs = parsedLNBConfigs.map((config: any) => ({
          ...config,
          createdAt: new Date(config.createdAt),
          updatedAt: new Date(config.updatedAt),
          children: config.children ? config.children.map((child: any) => ({
            ...child,
            createdAt: new Date(child.createdAt),
            updatedAt: new Date(child.updatedAt)
          })) : undefined
        }));
        console.log('Loaded LNB configs from localStorage:', this.lnbConfigs);
      }
    } catch (error) {
      console.error('Failed to load screen configs from localStorage:', error);
    }
  }

  // 기본 LNB 구성 생성
  createDefaultLNBConfig(): void {
    console.log('Creating default LNB config. Current configs length:', this.lnbConfigs.length);
    if (this.lnbConfigs.length === 0) {
      const defaultConfigs: Omit<LNBConfig, 'id' | 'createdAt' | 'updatedAt'>[] = [
        // 대시보드 (독립적인 메뉴)
        {
          name: 'dashboard',
          displayName: '대시보드',
          icon: 'BarChart3',
          order: 1,
          systemScreenType: 'dashboard',
          isActive: true,
          children: []
        },
        
        // 교량현황 (상위 메뉴)
        {
          name: 'bridge-status',
          displayName: '교량현황',
          icon: 'Building2',
          order: 2,
          isActive: true,
          children: [
            {
              id: 'bridge-specs',
              name: 'bridge-specs',
              displayName: '교량제원',
              icon: 'Database',
              order: 1,
              isActive: true,
              children: [],
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 'structure-status',
              name: 'structure-status',
              displayName: '구조물 현황',
              icon: 'Building2',
              order: 2,
              isActive: true,
              children: [],
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 'bearing-status',
              name: 'bearing-status',
              displayName: '교량받침 현황',
              icon: 'Anchor',
              order: 3,
              isActive: true,
              children: [],
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]
        },
        
        // 모델링 (상위 메뉴)
        {
          name: 'modeling',
          displayName: '모델링',
          icon: 'Image',
          order: 3,
          isActive: true,
          children: [
            {
              id: 'section',
              name: 'section',
              displayName: '단면',
              icon: 'Image',
              order: 1,
              systemScreenType: 'section-library',
              isActive: true,
              children: [],
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]
        },
        
        // 프로젝트 설정 (독립적인 메뉴)
        {
          name: 'project-settings',
          displayName: '프로젝트 설정',
          icon: 'Settings',
          order: 4,
          systemScreenType: 'project-settings',
          isActive: true,
          children: []
        }
      ];

      defaultConfigs.forEach(config => {
        console.log('Creating LNB config:', config);
        this.createLNBConfig(config);
      });
    }
  }

  // 시스템 화면 관련 메서드들
  
  /**
   * LNB가 시스템 화면인지 확인
   */
  isSystemScreen(lnbConfig: LNBConfig): boolean {
    return !!lnbConfig.systemScreenType;
  }

  /**
   * LNB가 사용자 생성 화면인지 확인
   */
  isUserScreen(lnbConfig: LNBConfig): boolean {
    return !!lnbConfig.screenId && !lnbConfig.systemScreenType;
  }

  /**
   * 시스템 화면 타입에 따른 화면 컴포넌트 반환
   */
  getSystemScreenComponent(systemScreenType: SystemScreenType): React.ComponentType<any> {
    // 동적 import를 사용하여 컴포넌트를 로드
    // admin-app에서는 시스템 화면 컴포넌트들을 제공하지 않음
    // 이 기능은 designer-app에서 처리됨
    throw new Error(`System screen components are not available in admin-app: ${systemScreenType}`);
  }

  /**
   * LNB 설정 유효성 검사
   */
  validateLNBConfig(config: Partial<LNBConfig>): string[] {
    const errors: string[] = [];

    if (!config.displayName?.trim()) {
      errors.push('표시명은 필수입니다.');
    }

    if (!config.name?.trim()) {
      errors.push('메뉴명은 필수입니다.');
    }

    // 시스템 화면과 사용자 화면 중 하나만 설정되어야 함
    if (config.systemScreenType && config.screenId) {
      errors.push('시스템 화면과 사용자 화면을 동시에 설정할 수 없습니다.');
    }

    if (!config.systemScreenType && !config.screenId) {
      errors.push('시스템 화면 또는 사용자 화면 중 하나를 선택해야 합니다.');
    }

    return errors;
  }

  /**
   * 기본 시스템 LNB 구성 생성
   */
  createDefaultSystemLNBConfigs(): LNBConfig[] {
    return [
      {
        id: 'lnb-dashboard',
        name: 'dashboard',
        displayName: '대시보드',
        icon: 'BarChart3',
        order: 1,
        systemScreenType: 'dashboard',
        type: 'independent',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'lnb-project-settings',
        name: 'project-settings',
        displayName: '프로젝트 설정',
        icon: 'Settings',
        order: 2,
        systemScreenType: 'project-settings',
        type: 'independent',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'lnb-section-library',
        name: 'section-library',
        displayName: '단면 라이브러리',
        icon: 'Building2',
        order: 3,
        systemScreenType: 'section-library',
        type: 'independent',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  // LNB 설정 초기화 (개발용)
  resetLNBConfigs(): void {
    console.log('Resetting LNB configs...');
    this.lnbConfigs = [];
    localStorage.removeItem('lnbConfigs');
    this.createDefaultLNBConfig();
    console.log('LNB configs reset completed. New configs:', this.lnbConfigs);
  }

  // 기본 구성 초기화 기능 제거 (요구사항)
}

export const screenService = new ScreenService();
export default ScreenService;
