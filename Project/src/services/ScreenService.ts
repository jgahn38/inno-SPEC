import { ScreenConfig, ScreenComponent, LNBConfig, ScreenTemplate } from '../types';

class ScreenService {
  private screens: ScreenConfig[] = [];
  private lnbConfigs: LNBConfig[] = [];
  private templates: ScreenTemplate[] = [];

  constructor() {
    this.initializeDefaultTemplates();
    this.loadFromLocalStorage();
  }

  // 기본 템플릿 초기화
  private initializeDefaultTemplates() {
    this.templates = [
      {
        id: 'dashboard-basic',
        name: 'dashboard-basic',
        displayName: '기본 대시보드',
        description: '기본적인 대시보드 템플릿',
        category: 'custom',
        defaultComponents: [
          {
            id: 'welcome-card',
            type: 'output',
            componentId: 'welcome',
            displayName: '환영 메시지',
            position: { x: 0, y: 0, width: 12, height: 2 },
            config: {
              showHeader: true,
              customStyles: { backgroundColor: '#f8fafc' }
            }
          }
        ],
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
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

    this.screens[index] = {
      ...this.screens[index],
      ...updates,
      updatedAt: new Date()
    };

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
    } catch (error) {
      console.error('Failed to save screen configs to localStorage:', error);
    }
  }

  private loadFromLocalStorage() {
    try {
      const savedScreens = localStorage.getItem('screenConfigs');
      const savedLNBConfigs = localStorage.getItem('lnbConfigs');

      if (savedScreens) {
        this.screens = JSON.parse(savedScreens);
      }
      if (savedLNBConfigs) {
        this.lnbConfigs = JSON.parse(savedLNBConfigs);
      }
    } catch (error) {
      console.error('Failed to load screen configs from localStorage:', error);
    }
  }

  // 기본 LNB 구성 생성
  createDefaultLNBConfig(): void {
    if (this.lnbConfigs.length === 0) {
      const defaultConfigs: Omit<LNBConfig, 'id' | 'createdAt' | 'updatedAt'>[] = [
        // 대시보드 (독립적인 메뉴)
        {
          name: 'dashboard',
          displayName: '대시보드',
          icon: 'BarChart3',
          order: 1,
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
              children: []
            },
            {
              id: 'structure-status',
              name: 'structure-status',
              displayName: '구조물 현황',
              icon: 'Building2',
              order: 2,
              isActive: true,
              children: []
            },
            {
              id: 'bearing-status',
              name: 'bearing-status',
              displayName: '교량받침 현황',
              icon: 'Anchor',
              order: 3,
              isActive: true,
              children: []
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
              isActive: true,
              children: []
            }
          ]
        },
        
        // 프로젝트 설정 (독립적인 메뉴)
        {
          name: 'project-settings',
          displayName: '프로젝트 설정',
          icon: 'Settings',
          order: 4,
          isActive: true,
          children: []
        }
      ];

      defaultConfigs.forEach(config => {
        this.createLNBConfig(config);
      });
    }
  }

  // 기본 구성 초기화 기능 제거 (요구사항)
}

export const screenService = new ScreenService();
export default ScreenService;
