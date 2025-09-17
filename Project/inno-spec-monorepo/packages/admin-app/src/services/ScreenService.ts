import React from 'react';
import { ScreenConfig, ScreenComponent, LNBConfig, ScreenTemplate, SystemScreenType } from '@inno-spec/shared';

class ScreenService {
  private screens: ScreenConfig[] = [];
  private lnbConfigs: LNBConfig[] = [];
  private templates: ScreenTemplate[] = [];

  constructor() {
    this.loadFromLocalStorage();
  }



  // LNB 구성 관�?
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

  // ?�면 구성 관�?
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

    console.log({
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

  // ?�면 컴포?�트 관�?
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

  // ?�플�?관�?
  getTemplates(): ScreenTemplate[] {
    return this.templates;
  }

  getTemplateById(id: string): ScreenTemplate | null {
    return this.templates.find(template => template.id === id) || null;
  }

  // ?�틸리티 메서??
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private saveToLocalStorage() {
    try {
      localStorage.setItem('screenConfigs', JSON.stringify(this.screens));
      localStorage.setItem('lnbConfigs', JSON.stringify(this.lnbConfigs));
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
      }
    } catch (error) {
      console.error('Failed to load screen configs from localStorage:', error);
    }
  }

  // 기본 LNB 구성 ?�성
  createDefaultLNBConfig(): void {
    if (this.lnbConfigs.length === 0) {
      const defaultConfigs: Omit<LNBConfig, 'id' | 'createdAt' | 'updatedAt'>[] = [
        // 대시보드(독립적인 메뉴)
        {
          name: 'dashboard',
          displayName: '대시보드',
          order: 1,
          systemScreenType: 'dashboard',
          isActive: true,
          children: []
        },
        
        // 교량?�황 (?�위 메뉴)
        {
          name: 'bridge-status',
          displayName: '교량?�황',
          icon: 'Building2',
          order: 2,
          isActive: true,
          children: [
            {
              id: 'bridge-specs',
              name: 'bridge-specs',
              displayName: '교량?�원',
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
              displayName: '구조�??�황',
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
              displayName: '교량받침 ?�황',
              icon: 'Anchor',
              order: 3,
              isActive: true,
              children: [],
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]
        },
        
        // 모델�?(?�위 메뉴)
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
              displayName: '?�면',
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
        
        // ?�로?�트 ?�정 (?�립?�인 메뉴)
        {
          name: 'project-settings',
          displayName: '?�로?�트 ?�정',
          icon: 'Settings',
          order: 4,
          systemScreenType: 'project-settings',
          isActive: true,
          children: []
        }
      ];

      defaultConfigs.forEach(config => {
        this.createLNBConfig(config);
      });
    }
  }

  // ?�스???�면 관??메서?�들
  
  /**
   * LNB가 ?�스???�면?��? ?�인
   */
  isSystemScreen(lnbConfig: LNBConfig): boolean {
    return !!lnbConfig.systemScreenType;
  }

  /**
   * LNB가 ?�용???�성 ?�면?��? ?�인
   */
  isUserScreen(lnbConfig: LNBConfig): boolean {
    return !!lnbConfig.screenId && !lnbConfig.systemScreenType;
  }

  /**
   * ?�스???�면 ?�?�에 ?�른 ?�면 컴포?�트 반환
   */
  getSystemScreenComponent(systemScreenType: SystemScreenType): React.ComponentType<any> {
    // ?�적 import�??�용?�여 컴포?�트�?로드
    // admin-app?�서???�스???�면 컴포?�트?�을 ?�공?��? ?�음
    // ??기능?� designer-app?�서 처리??
    throw new Error(`System screen components are not available in admin-app: ${systemScreenType}`);
  }

  /**
   * LNB ?�정 ?�효??검??
   */
  validateLNBConfig(config: Partial<LNBConfig>): string[] {
    const errors: string[] = [];

    if (!config.displayName?.trim()) {
      errors.push('?�시명�? ?�수?�니??');
    }

    if (!config.name?.trim()) {
      errors.push('메뉴명�? ?�수?�니??');
    }

    // ?�스???�면�??�용???�면 �??�나�??�정?�어????
    if (config.systemScreenType && config.screenId) {
      errors.push('?�스???�면�??�용???�면???�시???�정?????�습?�다.');
    }

    if (!config.systemScreenType && !config.screenId) {
      errors.push('?�스???�면 ?�는 ?�용???�면 �??�나�??�택?�야 ?�니??');
    }

    return errors;
  }

  /**
   * 기본 ?�스??LNB 구성 ?�성
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
        displayName: '?�로?�트 ?�정',
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

  // LNB ?�정 초기??(개발??
  resetLNBConfigs(): void {
    this.lnbConfigs = [];
    localStorage.removeItem('lnbConfigs');
    this.createDefaultLNBConfig();
  }

  // 기본 구성 초기??기능 ?�거 (?�구?�항)
}

export const screenService = new ScreenService();
export default ScreenService;
