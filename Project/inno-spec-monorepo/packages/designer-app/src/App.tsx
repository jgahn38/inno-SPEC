import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Header, AppType } from '@inno-spec/ui-lib';
import { TableManager, FieldManager, DatabaseManager, FunctionManager, VariableManager, ScreenManager, LnbManager } from '@inno-spec/admin-app';
import { ProjectDashboard, ProjectList as ProjectAppList, ProjectOverview } from '@inno-spec/project-app';
import DataSyncManager from './components/DataSyncManager';
// ScreenCanvas는 현재 사용되지 않음
import ScreenRuntimeView from './components/ScreenRuntimeView';
import { Sidebar } from '@inno-spec/ui-lib';
import LoginView from './components/LoginView';
import IllustrationView from './components/IllustrationView';
import { Project, Bridge, LNBConfig } from '@inno-spec/shared';
import { TenantProvider, useTenant } from './contexts/TenantContext';
import { APIProvider, useAPI } from './contexts/APIContext';
import { ProjectService } from './services/ProjectService';
import { LocalStorageProjectProvider } from './services/dataProviders/LocalStorageProjectProvider';
import { useURLRouting } from './hooks/useURLRouting';
import { adminLNBConfig } from './configs/adminLNBConfig';

// 사용자 생성 화면을 표시하는 컴포넌트
const UserScreenView: React.FC<{ 
  screenId: string; 
  lnbMenu: any;
  selectedProject: Project | null;
}> = ({ 
  screenId, 
  lnbMenu,
  selectedProject
}) => {
  const { screens } = useAPI();
  const screen = screens.find(s => s.id === screenId);
  
  if (!screen) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">화면을 찾을 수 없습니다.</p>
      </div>
    );
  }

  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">프로젝트를 선택해주세요.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <ScreenRuntimeView screen={screen} lnbMenu={lnbMenu} selectedProject={selectedProject} />
    </div>
  );
};


function AppContent() {
  const { currentTenant, currentUser, isAuthenticated, logout } = useTenant();
  const { lnbConfigs, loading, error } = useAPI();
  const { currentRoute, navigateToScreen } = useURLRouting();
  const location = useLocation();
  // const params = useParams();
  const [selectedApp, setSelectedApp] = useState<AppType>(() => {
    // URL 기반으로 selectedApp 자동 설정
    const pathname = window.location.pathname;
    if (pathname.startsWith('/admin/')) {
      return 'ADMIN';
    } else if (pathname.includes('/modeler')) {
      return 'MODELER';
    } else if (pathname.includes('/viewer')) {
      return 'VIEWER';
    } else if (pathname.includes('/designer')) {
      return 'DESIGNER';
    } else if (pathname.includes('/project')) {
      return 'PROJECT';
    }
    
    // localStorage에서 저장된 앱 타입을 가져오거나 기본값 사용
    const savedApp = localStorage.getItem('selectedApp') as AppType;
    return savedApp || 'PROJECT';
  });
  const [currentUserScreen, setCurrentUserScreen] = useState<string | null>(null);
  const [currentLNBMenu, setCurrentLNBMenu] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedBridge, setSelectedBridge] = useState<Bridge | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  // DESIGNER 기본 화면: LNB 순서 기반으로 결정 (1번, 상위면 1.1)
  const navigateToDesignerDefault = React.useCallback(() => {
    console.log('=== navigateToDesignerDefault Debug ===');
    console.log('lnbConfigs:', lnbConfigs);
    console.log('lnbConfigs.length:', lnbConfigs?.length);
    console.log('selectedProject:', selectedProject);
    console.log('projects.length:', projects.length);
    
    try {
      if (!lnbConfigs || lnbConfigs.length === 0) {
        console.log('No LNB configs found, navigating to screens');
        // LNB가 없으면 화면 관리로 이동
        navigateToScreen({ type: 'screens', module: 'designer', tenantId: currentTenant?.id });
        return;
      }

      // 프로젝트 필요: 없으면 첫 번째 프로젝트 선택 유도 또는 프로젝트 목록으로
      let projectId = selectedProject?.id;
      if (!projectId) {
        if (projects.length > 0) {
          projectId = projects[0].id;
          setSelectedProject(projects[0]);
          localStorage.setItem('selectedProjectId', projects[0].id);
        } else {
          navigateToScreen({ type: 'projects', module: 'project', tenantId: currentTenant?.id });
          return;
        }
      }

      // 최상위에서 order가 가장 낮은 항목
      const top = [...lnbConfigs].sort((a, b) => (a.order || 0) - (b.order || 0))[0];
      if (!top) {
        navigateToScreen({ type: 'screens', module: 'designer', tenantId: currentTenant?.id });
        return;
      }

      // 상위 메뉴인 경우 첫 번째 하위(1.1)
      const isParent = Array.isArray(top.children) && top.children.length > 0;
      const target = isParent
        ? [...(top.children || [])].sort((a, b) => (a.order || 0) - (b.order || 0))[0]
        : top;

      if (!target) {
        navigateToScreen({ type: 'screens', module: 'designer', tenantId: currentTenant?.id });
        return;
      }

      // 사용자 화면 우선
      if (target.screenId) {
        navigateToScreen({ type: 'user-screen', module: 'designer', tenantId: currentTenant?.id, projectId, screenId: target.screenId });
        return;
      }
      // 시스템 화면 라우팅
      if (target.systemScreenType) {
        switch (target.systemScreenType) {
          case 'dashboard':
            // dashboard는 더 이상 사용하지 않음, LNB 순서 기반 화면으로 대체
            navigateToScreen({ type: 'no-screen', module: 'designer', tenantId: currentTenant?.id, projectId });
            return;
          case 'project-settings':
            navigateToScreen({ type: 'project-settings', module: 'designer', tenantId: currentTenant?.id, projectId });
            return;
          default:
            break;
        }
      }

      // 연결된 화면이 없으면 안내 화면
      navigateToScreen({ type: 'no-screen', module: 'designer', tenantId: currentTenant?.id, projectId });
    } catch (e) {
      console.error('Failed to navigate to designer default from LNB:', e);
      navigateToScreen({ type: 'screens', module: 'designer', tenantId: currentTenant?.id });
    }
  }, [lnbConfigs, navigateToScreen, selectedProject, projects, currentTenant, setSelectedProject]);
  
  // URL 변경에 따른 화면 처리
  useEffect(() => {
    console.log('Current route changed:', currentRoute);
    
    // URL 기반으로 selectedApp 자동 설정
    if (location.pathname.startsWith('/admin/')) {
      if (selectedApp !== 'ADMIN') {
        setSelectedApp('ADMIN');
        localStorage.setItem('selectedApp', 'ADMIN');
      }
    } else if (location.pathname.includes('/modeler')) {
      if (selectedApp !== 'MODELER') {
        setSelectedApp('MODELER');
        localStorage.setItem('selectedApp', 'MODELER');
      }
    } else if (location.pathname.includes('/viewer')) {
      if (selectedApp !== 'VIEWER') {
        setSelectedApp('VIEWER');
        localStorage.setItem('selectedApp', 'VIEWER');
      }
    } else if (location.pathname.includes('/designer')) {
      if (selectedApp !== 'DESIGNER') {
        setSelectedApp('DESIGNER');
        localStorage.setItem('selectedApp', 'DESIGNER');
      }
    } else if (location.pathname.includes('/project')) {
      if (selectedApp !== 'PROJECT') {
        setSelectedApp('PROJECT');
        localStorage.setItem('selectedApp', 'PROJECT');
      }
    }
    
    // 기본 라우트가 dashboard인 경우 LNB 순서 기반 기본 화면으로 리다이렉트
    if (currentRoute.type === 'dashboard' && selectedApp === 'DESIGNER') {
      navigateToDesignerDefault();
      return;
    }
    
    // 프로젝트가 없는 경우 PROJECT 앱으로 리다이렉트
    if (currentRoute.type === 'dashboard' && !selectedProject && projects.length === 0) {
      navigateToScreen({ type: 'projects', module: 'project', tenantId: currentTenant?.id });
      return;
    }
    
    switch (currentRoute.type) {
      case 'user-screen':
        if (currentRoute.screenId) {
          setCurrentUserScreen(currentRoute.screenId);
          // 해당 화면에 연결된 LNB 메뉴 찾기
          const connectedMenu = lnbConfigs.find(lnb => 
            lnb.screenId === currentRoute.screenId || 
            (lnb.children && lnb.children.some((child: any) => child.screenId === currentRoute.screenId))
          );
          setCurrentLNBMenu(connectedMenu);
        }
        break;
      case 'lnb-menu':
        if (currentRoute.menuId) {
          // LNB 메뉴에서 화면 정보 찾기
          const menu = lnbConfigs.find(lnb => 
            lnb.id === currentRoute.menuId || 
            (lnb.children && lnb.children.some((child: any) => child.id === currentRoute.menuId))
          );
          if (menu) {
            setCurrentLNBMenu(menu);
            if (menu.screenId) {
              setCurrentUserScreen(menu.screenId);
            }
          }
        }
        break;
      default:
        setCurrentUserScreen(null);
        setCurrentLNBMenu(null);
    }
  }, [currentRoute, lnbConfigs]);

  // LNB 구성 업데이트 이벤트 수신
  useEffect(() => {
    const handleLNBConfigUpdate = (event: CustomEvent) => {
      console.log('LNB 구성 업데이트 이벤트 수신:', event.detail);
      // 이벤트를 통해 받은 LNB 구성을 직접 업데이트할 수는 없으므로
      // useAPI 훅에서 데이터를 다시 로드하도록 신호를 보내야 합니다.
      // 현재는 window.location.reload()를 사용하여 전체 페이지를 새로고침합니다.
      window.location.reload();
    };

    window.addEventListener('lnb-config-updated', handleLNBConfigUpdate as EventListener);
    
    return () => {
      window.removeEventListener('lnb-config-updated', handleLNBConfigUpdate as EventListener);
    };
  }, []);

  // LNB 메뉴 name을 가져오는 함수
  const getActiveMenuName = (): string => {
    // console.log('=== getActiveMenuName Debug ===');
    // console.log('currentRoute:', currentRoute);
    // console.log('currentLNBMenu:', currentLNBMenu);
    // console.log('selectedApp:', selectedApp);
    // console.log('lnbConfigs:', lnbConfigs);
    // console.log('lnbConfigs length:', lnbConfigs?.length);
    
    if (currentLNBMenu) {
      console.log('getActiveMenuName - returning currentLNBMenu.name:', currentLNBMenu.name);
      return currentLNBMenu.name;
    }
    
    // ADMIN 앱인 경우 adminLNBConfig에서 메뉴 찾기
    if (selectedApp === 'ADMIN') {
      for (const top of adminLNBConfig) {
        if (top.systemScreenType === currentRoute.type) {
          return top.name;
        }
        if (top.children) {
          for (const child of top.children) {
            if (child.systemScreenType === currentRoute.type) {
              return child.name;
            }
          }
        }
      }
    }
    
    // DESIGNER 앱인 경우 lnbConfigs에서 메뉴 찾기
    if (selectedApp === 'DESIGNER' && lnbConfigs && lnbConfigs.length > 0) {
      // console.log('Searching in lnbConfigs for DESIGNER app, currentRoute.type:', currentRoute.type);
      // console.log('Available lnbConfigs:', lnbConfigs.map(c => ({ id: c.id, name: c.name, systemScreenType: c.systemScreenType })));
      
      // 사용자 생성 화면인 경우
      if (currentRoute.type === 'user-screen' && currentRoute.screenId) {
        for (const top of lnbConfigs) {
          if (top.children) {
            for (const child of top.children) {
              if (child.screenId === currentRoute.screenId) {
                console.log('Found user-screen in child:', child.name);
                return child.name;
              }
            }
          }
          if (top.screenId === currentRoute.screenId) {
            console.log('Found user-screen in top:', top.name);
            return top.name;
          }
        }
      }
      
      // LNB 메뉴인 경우
      if (currentRoute.type === 'lnb-menu' && currentRoute.menuId) {
        for (const top of lnbConfigs) {
          if (top.children) {
            for (const child of top.children) {
              if (child.id === currentRoute.menuId || child.name === currentRoute.menuId) {
                console.log('Found lnb-menu in child:', child.name);
                return child.name;
              }
            }
          }
          if (top.id === currentRoute.menuId || top.name === currentRoute.menuId) {
            console.log('Found lnb-menu in top:', top.name);
            return top.name;
          }
        }
      }
      
      // systemScreenType으로 메뉴 찾기 (dashboard, screens, illustration 등)
      for (const top of lnbConfigs) {
        // console.log(`Checking top menu: ${top.id} (${top.name}) with systemScreenType: ${top.systemScreenType}`);
        if (top.systemScreenType === currentRoute.type) {
          console.log('Found systemScreenType match in top:', top.name);
          return top.name;
        }
        if (top.children) {
          for (const child of top.children) {
            // console.log(`Checking child menu: ${child.id} (${child.name}) with systemScreenType: ${child.systemScreenType}`);
            if (child.systemScreenType === currentRoute.type) {
              console.log('Found systemScreenType match in child:', child.name);
              return child.name;
            }
          }
        }
      }
      
      console.log('No matching menu found in lnbConfigs for type:', currentRoute.type);
    }
    
    console.log('getActiveMenuName - checking switch for currentRoute.type:', currentRoute.type);
    
    switch (currentRoute.type) {
      case 'dashboard':
        console.log('getActiveMenuName - returning dashboard');
        return 'dashboard';
      case 'project-settings':
        console.log('getActiveMenuName - returning project-settings');
        return 'project-settings';
      case 'illustration':
        console.log('getActiveMenuName - returning illustration');
        return 'illustration';
      case 'screens':
        console.log('getActiveMenuName - returning screens');
        return 'screens';
      case 'settings':
        console.log('getActiveMenuName - returning settings');
        return 'settings';
      case 'projects':
        console.log('getActiveMenuName - projects screen, returning empty string (no LNB selection)');
        return ''; // projects 화면에서는 LNB 메뉴 선택 상태를 표시하지 않음
      case 'tables':
        console.log('getActiveMenuName - returning tables');
        return 'tables';
      case 'functions':
        console.log('getActiveMenuName - returning functions');
        return 'functions';
      case 'sync':
        console.log('getActiveMenuName - returning sync');
        return 'sync';
      case 'no-screen':
        console.log('getActiveMenuName - returning no-screen');
        return 'no-screen';
      // ADMIN 메뉴들
      case 'admin-db':
        console.log('getActiveMenuName - returning admin-db');
        return 'admin-db';
      case 'admin-fields':
        console.log('getActiveMenuName - returning admin-fields');
        return 'admin-fields';
      case 'admin-table-definition':
        console.log('getActiveMenuName - returning admin-table-definition');
        return 'admin-table-definition';
      case 'admin-variable-definition':
        console.log('getActiveMenuName - returning admin-variable-definition');
        return 'admin-variable-definition';
      case 'admin-function-definition':
        console.log('getActiveMenuName - returning admin-function-definition');
        return 'admin-function-definition';
      case 'admin-lnb-config':
        console.log('getActiveMenuName - returning admin-lnb-config');
        return 'admin-lnb-config';
      case 'admin-screen-config':
        console.log('getActiveMenuName - returning admin-screen-config');
        return 'admin-screen-config';
      default:
        console.log('getActiveMenuName - returning default dashboard');
        return 'dashboard';
    }
  };
  const [projectService] = useState(() => new ProjectService(new LocalStorageProjectProvider()));

  // 기본 DESIGNER LNB 구성 생성
  useEffect(() => {
    const initializeDefaultLNBConfig = () => {
      const existingConfigs = JSON.parse(localStorage.getItem('lnbConfigs') || '[]');
      
      if (existingConfigs.length === 0) {
        const defaultLNBConfigs: LNBConfig[] = [
          {
            id: 'dashboard',
            name: 'dashboard',
            displayName: '대시보드',
            icon: '📊',
            order: 1,
            isActive: true,
            type: 'independent',
            screenId: '',
            systemScreenType: 'dashboard',
            children: [],
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'screens',
            name: 'screens',
            displayName: '화면 관리',
            icon: '🖼️',
            order: 2,
            isActive: true,
            type: 'independent',
            screenId: '',
            systemScreenType: undefined,
            children: [],
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'illustration',
            name: 'illustration',
            displayName: '도면 관리',
            icon: '📐',
            order: 3,
            isActive: true,
            type: 'independent',
            screenId: '',
            systemScreenType: undefined,
            children: [],
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'project-settings',
            name: 'project-settings',
            displayName: '프로젝트 설정',
            icon: '⚙️',
            order: 4,
            isActive: true,
            type: 'independent',
            screenId: '',
            systemScreenType: 'project-settings',
            children: [],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];
        
        localStorage.setItem('lnbConfigs', JSON.stringify(defaultLNBConfigs));
        console.log('Default DESIGNER LNB configs initialized');
      }
    };

    initializeDefaultLNBConfig();
  }, []);

  // 프로젝트 목록이 로드된 후 URL 또는 localStorage에서 프로젝트 자동 선택
  useEffect(() => {
    console.log('Project loading effect triggered - projects:', projects.length, 'selectedProject:', selectedProject, 'currentRoute.projectId:', currentRoute.projectId);
    
    if (projects.length > 0) {
      // 먼저 URL의 projectId를 확인
      let projectId = currentRoute.projectId;
      
      // URL에 projectId가 없으면 localStorage에서 가져옴
      if (!projectId) {
        projectId = localStorage.getItem('selectedProjectId') || undefined;
      }
      
      console.log('Looking for project with ID:', projectId);
      
      if (projectId) {
        const project = projects.find(p => p.id === projectId);
        console.log('Found project:', project);
        
        if (project) {
          // 프로젝트가 이미 선택되어 있고 같은 프로젝트인지 확인
          if (!selectedProject || selectedProject.id !== project.id) {
            console.log('Auto-selecting project after projects loaded:', project);
            setSelectedProject(project);
            localStorage.setItem('selectedProjectId', project.id);
            if (project.bridges && project.bridges.length > 0) {
              setSelectedBridge(project.bridges[0]);
            }
          }
        } else {
          console.warn('Project not found with ID:', projectId);
        }
      }
    }
  }, [projects, currentRoute.projectId, selectedProject]);

  // 프로젝트가 로드되었는지 확인 (name이나 displayName이 있으면 로드된 것으로 판단)
  const isProjectLoaded = selectedProject && selectedProject.name;
  
  // 디버깅 로그 추가
  console.log('Debug - selectedProject:', selectedProject);
  console.log('Debug - isProjectLoaded:', isProjectLoaded);
  console.log('Debug - projects.length:', projects.length);
  console.log('Debug - currentRoute.projectId:', currentRoute.projectId);
  console.log('Debug - lnbConfigs:', lnbConfigs);
  console.log('Debug - lnbConfigs.length:', lnbConfigs?.length);

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    localStorage.setItem('selectedProjectId', project.id);
    // 프로젝트의 첫 번째 교량을 기본 선택
    if (project.bridges && project.bridges.length > 0) {
      setSelectedBridge(project.bridges[0]);
    } else {
      setSelectedBridge(null);
    }
    // 프로젝트 ID를 포함한 PROJECT 앱의 대시보드로 이동
    navigateToScreen({ type: 'dashboard', module: 'project', tenantId: currentTenant?.id, projectId: project.id });
  };

  const handleAppChange = (app: AppType) => {
    console.log('=== handleAppChange Debug ===');
    console.log('Changing to app:', app);
    console.log('Current selectedApp:', selectedApp);
    console.log('Current selectedProject:', selectedProject);
    console.log('Current lnbConfigs:', lnbConfigs);
    
    setSelectedApp(app);
    localStorage.setItem('selectedApp', app);
    // 앱 변경 시 기본 뷰로 초기화
    if (app === 'PROJECT') {
      console.log('Navigating to PROJECT app');
      navigateToScreen({ type: 'projects', module: 'project', projectId: selectedProject?.id });
    } else if (app === 'DESIGNER') {
      console.log('Navigating to DESIGNER app - calling navigateToDesignerDefault');
      // DESIGNER 앱 선택 시 LNB 순서 기반 기본 화면으로 이동
      navigateToDesignerDefault();
    } else if (app === 'MODELER') {
      console.log('Navigating to MODELER app');
      navigateToScreen({ type: 'modeler', module: 'modeler', projectId: selectedProject?.id });
    } else if (app === 'VIEWER') {
      console.log('Navigating to VIEWER app');
      navigateToScreen({ type: 'viewer', module: 'viewer', projectId: selectedProject?.id });
    } else if (app === 'ADMIN') {
      console.log('Navigating to ADMIN app');
      navigateToScreen({ type: 'admin-db', module: 'admin' });
    }
  };

  const handleLNBMenuClick = React.useCallback((menuId: string) => {
    console.log('=== LNB Menu Click Debug ===');
    console.log('Clicked menuId:', menuId);
    console.log('Selected app:', selectedApp);
    console.log('Current pathname:', window.location.pathname);
    
    // ADMIN 앱인 경우 adminLNBConfig 사용
    const currentLNBConfigs = selectedApp === 'ADMIN' ? adminLNBConfig : lnbConfigs;
    console.log('Using LNB configs:', currentLNBConfigs);
    console.log('Available menu IDs:', currentLNBConfigs.map(c => ({ id: c.id, name: c.name, systemScreenType: c.systemScreenType })));
    
    // LNB 설정에서 해당 메뉴 찾기
    let targetLNB: any = null;
    
    // 모든 LNB 설정을 순회하며 해당 메뉴 찾기
    for (const top of currentLNBConfigs) {
      console.log(`Checking top menu: ${top.id} (${top.name})`);
      // 상위 메뉴 자체가 일치하는지 확인 (name 또는 id로 검색)
      if (top.name === menuId || top.id === menuId) {
        targetLNB = top;
        console.log('Found match in top menu:', top);
        break;
      }
      // 하위 메뉴에서 찾기 (name 또는 id로 검색)
      if (top.children) {
        for (const child of top.children) {
          console.log(`Checking child menu: ${child.id} (${child.name})`);
          if (child.name === menuId || child.id === menuId) {
            targetLNB = child;
            console.log('Found match in child menu:', child);
            break;
          }
        }
      }
      if (targetLNB) break;
    }
    
    if (targetLNB) {
      console.log('Found target LNB:', targetLNB);
      console.log('targetLNB.systemScreenType:', targetLNB.systemScreenType);
      
      // 시스템 화면인 경우
      if (targetLNB.systemScreenType) {
        console.log('Processing systemScreenType:', targetLNB.systemScreenType);
        switch (targetLNB.systemScreenType) {
          case 'dashboard':
            navigateToScreen({ type: 'dashboard', module: 'designer', projectId: selectedProject?.id });
            break;
          case 'project-settings':
            navigateToScreen({ type: 'project-settings', module: 'designer', projectId: selectedProject?.id });
            break;
          case 'illustration':
            navigateToScreen({ type: 'illustration', module: 'designer', projectId: selectedProject?.id });
            break;
          case 'screens':
            navigateToScreen({ type: 'screens', module: 'designer', projectId: selectedProject?.id });
            break;
          case 'user-profile':
          case 'system-settings':
            navigateToScreen({ type: 'settings', module: 'designer' });
            break;
          // ADMIN 시스템 화면들
          case 'admin-db':
            navigateToScreen({ type: 'admin-db', module: 'admin' });
            break;
          case 'admin-fields':
            navigateToScreen({ type: 'admin-fields', module: 'admin' });
            break;
          case 'admin-table-definition':
            navigateToScreen({ type: 'admin-table-definition', module: 'admin' });
            break;
          case 'admin-variable-definition':
            navigateToScreen({ type: 'admin-variable-definition', module: 'admin' });
            break;
          case 'admin-function-definition':
            navigateToScreen({ type: 'admin-function-definition', module: 'admin' });
            break;
          case 'admin-lnb-config':
            navigateToScreen({ type: 'admin-lnb-config', module: 'admin' });
            break;
          case 'admin-screen-config':
            navigateToScreen({ type: 'admin-screen-config', module: 'admin' });
            break;
          default:
            console.log('No matching case found for systemScreenType:', targetLNB.systemScreenType);
            if (selectedApp === 'ADMIN') {
              console.log('Redirecting to admin-db as fallback');
              navigateToScreen({ type: 'admin-db', module: 'admin' });
            } else {
              navigateToScreen({ type: 'projects', module: 'designer', projectId: selectedProject?.id });
            }
        }
      }
      // 사용자 생성 화면인 경우
      else if (targetLNB.screenId) {
        navigateToScreen({ type: 'user-screen', module: 'designer', projectId: selectedProject?.id, screenId: targetLNB.screenId });
      }
      // 화면이 연결되지 않은 경우
      else {
        console.log('No systemScreenType or screenId found, redirecting to no-screen');
        navigateToScreen({ type: 'no-screen', module: 'designer', projectId: selectedProject?.id });
      }
    } else {
      console.log('LNB menu not found:', menuId);
      // ADMIN 앱인 경우 기본 ADMIN 화면으로, 그 외에는 프로젝트 목록으로
      if (selectedApp === 'ADMIN') {
        navigateToScreen({ type: 'admin-db', module: 'admin' });
      } else {
        navigateToScreen({ type: 'projects', module: 'designer', projectId: selectedProject?.id });
      }
    }
  }, [lnbConfigs, navigateToScreen, selectedProject, selectedApp]);

  // 프로젝트 목록 로드
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const allProjects = await projectService.getAllProjects();
        setProjects(allProjects);
      } catch (error) {
        console.error('Failed to load projects:', error);
      }
    };
    
    if (isAuthenticated && currentTenant) {
      loadProjects();
    }
  }, [isAuthenticated, currentTenant, projectService]);

  const handleLogout = () => {
    logout();
    setSelectedProject(null);
    setSelectedBridge(null);
    setProjects([]);
    localStorage.removeItem('selectedProjectId');
    localStorage.removeItem('selectedApp');
  };

  // 인증되지 않은 경우 로그인 화면
  if (!isAuthenticated || !currentTenant || !currentUser) {
    return <LoginView />;
  }

  // 로딩 상태
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">오류 발생</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            새로고침
          </button>
        </div>
      </div>
    );
  }

  // 인증된 경우 메인 애플리케이션
  console.log('Current route type:', currentRoute.type);
  console.log('Current location pathname:', location.pathname);
  console.log('Selected app:', selectedApp);
  return (
    <div className="min-h-screen bg-gray-50">
        <Header 
          currentView={currentRoute.type as any}
          onNavigate={() => {}}
        currentTenant={currentTenant}
        currentUser={currentUser}
        onLogout={handleLogout}
        selectedApp={selectedApp}
        onAppChange={handleAppChange}
      />
      
        <main className="flex-1" style={{ height: 'calc(100vh - 64px)' }}>
          {/* ADMIN 메뉴일 때 LNB 표시 */}
          {selectedApp === 'ADMIN' && (
            <div className="flex h-full">
              <Sidebar
                activeMenu={getActiveMenuName()}
                onMenuSelect={handleLNBMenuClick}
                selectedProject={null}
                projects={[]}
                onProjectChange={() => {}}
                onBridgeChange={() => {}}
                selectedBridge={null}
                lnbConfigs={adminLNBConfig}
                showProjectSelector={false}
              />
              <div className="flex-1 bg-gray-50 overflow-auto">
                <Routes>
                  <Route path="/admin/db" element={<DatabaseManager tenantId={currentTenant?.id || ''} />} />
                  <Route path="/admin/fields" element={<FieldManager />} />
                  <Route path="/admin/table-definition" element={<TableManager />} />
                  <Route path="/admin/variable-definition" element={<VariableManager />} />
                  <Route path="/admin/function-definition" element={<FunctionManager />} />
                  <Route path="/admin/lnb-config" element={<LnbManager />} />
                  <Route path="/admin/screen-config" element={<ScreenManager />} />
                </Routes>
              </div>
            </div>
          )}
          
          {/* 다른 메뉴들 */}
          {selectedApp !== 'ADMIN' && (
            <Routes>
              {/* PROJECT 앱 라우트 */}
              <Route path="/:tenantId/project/projects" element={
                <ProjectAppList 
                  onProjectSelect={handleProjectSelect}
                  tenantId={currentTenant.id}
                />
              } />
              
              <Route path="/:tenantId/project/:projectId/dashboard" element={
                selectedProject ? (
                  <ProjectDashboard 
                    project={selectedProject}
                    selectedBridge={selectedBridge}
                    projects={projects}
                    onProjectChange={setSelectedProject}
                    onBridgeChange={setSelectedBridge}
                    onProjectUpdate={async (updatedProject: Project) => {
                      try {
                        const projectService = new ProjectService(new LocalStorageProjectProvider());
                        await projectService.updateProject(updatedProject);
                        setSelectedProject(updatedProject);
                        const allProjects = await projectService.getAllProjects();
                        setProjects(allProjects);
                        console.log('Project updated:', updatedProject);
                      } catch (error) {
                        console.error('Failed to update project:', error);
                        alert('프로젝트 업데이트에 실패했습니다.');
                      }
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-6xl mb-4">📊</div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">프로젝트 대시보드</h2>
                      <p className="text-gray-600 mb-4">프로젝트를 선택하면 대시보드를 확인할 수 있습니다.</p>
                      <button
                        onClick={() => navigateToScreen({ type: 'projects', module: 'project', projectId: selectedProject?.id || undefined })}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        프로젝트 선택하기
                      </button>
                    </div>
                  </div>
                )
              } />
              
              <Route path="/:tenantId/project/:projectId/overview" element={
                selectedProject ? (
                  <ProjectOverview project={selectedProject} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-6xl mb-4">📋</div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">프로젝트 개요</h2>
                      <p className="text-gray-600">프로젝트를 선택하면 개요를 확인할 수 있습니다.</p>
                    </div>
                  </div>
                )
              } />
              
              <Route path="/:tenantId/project/:projectId/project-settings" element={
                selectedProject ? (
                  <ProjectDashboard 
                    project={selectedProject}
                    selectedBridge={selectedBridge}
                    projects={projects}
                    onProjectChange={setSelectedProject}
                    onBridgeChange={setSelectedBridge}
                    onProjectUpdate={async (updatedProject: Project) => {
                      try {
                        const projectService = new ProjectService(new LocalStorageProjectProvider());
                        await projectService.updateProject(updatedProject);
                        setSelectedProject(updatedProject);
                        const allProjects = await projectService.getAllProjects();
                        setProjects(allProjects);
                        console.log('Project updated:', updatedProject);
                      } catch (error) {
                        console.error('Failed to update project:', error);
                        alert('프로젝트 업데이트에 실패했습니다.');
                      }
                    }}
                    activeMenu="project-settings"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">프로젝트 설정</h2>
                      <p className="text-gray-600">프로젝트를 선택하면 설정을 확인할 수 있습니다.</p>
                    </div>
                  </div>
                )
              } />

              {/* GNB 라우트 (프로젝트 공통) */}
              
              <Route path="/:tenantId/designer/tables" element={<TableManager />} />
              <Route path="/:tenantId/designer/functions" element={<FunctionManager />} />
              <Route path="/:tenantId/designer/sync" element={<DataSyncManager />} />
              <Route path="/:tenantId/designer/settings" element={
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">설정</h2>
                    <p className="text-gray-600">시스템 설정 페이지입니다.</p>
                  </div>
                </div>
              } />
              
              <Route path="/:tenantId/modeler" element={
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">🏗️</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">MODELER</h2>
                <p className="text-gray-600 mb-4">3D 모델링 및 설계 도구</p>
                <p className="text-sm text-gray-500">현재 개발 중입니다. 곧 만나보실 수 있습니다.</p>
              </div>
            </div>
          } />
          
          <Route path="/:tenantId/viewer" element={
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">👁️</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">VIEWER</h2>
                <p className="text-gray-600 mb-4">3D 뷰어 및 시각화 도구</p>
                <p className="text-sm text-gray-500">현재 개발 중입니다. 곧 만나보실 수 있습니다.</p>
              </div>
            </div>
          } />
          
          <Route path="/:tenantId/project/:projectId/viewer" element={
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">👁️</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">VIEWER</h2>
                <p className="text-gray-600 mb-4">3D 뷰어 및 시각화 도구</p>
                <p className="text-sm text-gray-500">현재 개발 중입니다. 곧 만나보실 수 있습니다.</p>
              </div>
            </div>
          } />
          
          {/* LNB 라우트 (프로젝트별 독립) */}
          <Route path="/:tenantId/designer/:projectId/dashboard" element={
            isProjectLoaded ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-6xl mb-4">🚧</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">DESIGNER 대시보드</h2>
                  <p className="text-gray-600 mb-4">DESIGNER 앱의 대시보드 기능이 PROJECT 앱으로 이전되었습니다.</p>
                  <button
                    onClick={() => navigateToScreen({ type: 'projects', module: 'project', tenantId: currentTenant?.id })}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    PROJECT 앱으로 이동
                  </button>
                </div>
              </div>
            ) : selectedProject && !isProjectLoaded ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">프로젝트 로딩 중...</h2>
                  <p className="text-gray-600">프로젝트 정보를 불러오고 있습니다.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-6xl mb-4">📊</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">대시보드</h2>
                  <p className="text-gray-600 mb-4">프로젝트를 선택하면 대시보드를 확인할 수 있습니다.</p>
                  <button
                    onClick={() => navigateToScreen({ type: 'projects', module: 'designer', projectId: selectedProject?.id })}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    프로젝트 선택하기
                  </button>
                </div>
              </div>
            )
          } />
          
          <Route path="/:tenantId/designer/:projectId/screens" element={<ScreenManager />} />
          <Route path="/:tenantId/designer/:projectId/illustration" element={
            <div className="flex h-full">
              <Sidebar
                onMenuSelect={() => {}}
                selectedProject={selectedProject}
                onBridgeChange={setSelectedBridge}
              />
              <div className="flex-1 p-6">
                <IllustrationView />
              </div>
            </div>
          } />
          <Route path="/:tenantId/designer/:projectId/project-settings" element={
            selectedProject ? (
              <div className="flex h-full">
                <Sidebar
                  onMenuSelect={() => {}}
                  selectedProject={selectedProject}
                  onBridgeChange={setSelectedBridge}
                />
                <div className="flex-1 p-6">
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-6xl mb-4">⚙️</div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">프로젝트 설정</h2>
                      <p className="text-gray-600 mb-4">프로젝트 설정 기능이 PROJECT 앱으로 이전되었습니다.</p>
                      <button
                        onClick={() => navigateToScreen({ type: 'project-settings', module: 'project', tenantId: currentTenant?.id, projectId: selectedProject?.id })}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        PROJECT 앱으로 이동
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">프로젝트 설정</h2>
                  <p className="text-gray-600">프로젝트를 선택하면 설정을 확인할 수 있습니다.</p>
                </div>
              </div>
            )
          } />
          
          <Route path="/:tenantId/designer/:projectId/no-screen" element={
            <div className="flex h-full">
              <Sidebar
                activeMenu={getActiveMenuName()}
                onMenuSelect={handleLNBMenuClick}
                selectedProject={selectedProject}
                projects={projects}
                onProjectChange={setSelectedProject}
                onBridgeChange={setSelectedBridge}
                selectedBridge={selectedBridge}
                lnbConfigs={lnbConfigs}
                showProjectSelector={true}
              />
              <div className="flex-1 bg-gray-50 overflow-auto">
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📋</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">화면 연결 없음</h2>
                    <p className="text-gray-600 mb-4">이 메뉴에는 연결된 화면이 없습니다.</p>
                    <p className="text-sm text-gray-500">화면 관리에서 화면을 연결하거나 다른 메뉴를 선택해주세요.</p>
                  </div>
                </div>
              </div>
            </div>
          } />
          
          {/* 기본 라우트 */}
          <Route path="/" element={
            <Navigate to={`/${currentTenant?.id || 'tenant-1'}/project/projects`} replace />
          } />
          
          {/* 테넌트 기본 라우트 */}
          <Route path="/:tenantId" element={
            <Navigate to={`/${currentTenant?.id || 'tenant-1'}/project/projects`} replace />
          } />
          
          {/* 하위 호환성을 위한 기존 라우트들 */}
          <Route path="/modeler" element={
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">🏗️</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">MODELER</h2>
                <p className="text-gray-600 mb-4">3D 모델링 및 설계 도구</p>
                <p className="text-sm text-gray-500">현재 개발 중입니다. 곧 만나보실 수 있습니다.</p>
              </div>
            </div>
          } />
          
          
          <Route path="/designer/projects" element={
            <ProjectAppList 
              onProjectSelect={handleProjectSelect}
              tenantId={currentTenant.id}
            />
          } />
          
          <Route path="/designer/dashboard" element={
            selectedProject ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-6xl mb-4">🚧</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">DESIGNER 대시보드</h2>
                  <p className="text-gray-600 mb-4">DESIGNER 앱의 대시보드 기능이 PROJECT 앱으로 이전되었습니다.</p>
                  <button
                    onClick={() => navigateToScreen({ type: 'projects', module: 'project', tenantId: currentTenant?.id })}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    PROJECT 앱으로 이동
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-6xl mb-4">📊</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">대시보드</h2>
                  <p className="text-gray-600 mb-4">프로젝트를 선택하면 대시보드를 확인할 수 있습니다.</p>
                  <button
                    onClick={() => navigateToScreen({ type: 'projects', module: 'designer' })}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    프로젝트 선택하기
                  </button>
                </div>
              </div>
            )
          } />
          
          <Route path="/:tenantId/project/:projectId/designer/screens" element={<ScreenManager />} />
          <Route path="/:tenantId/project/:projectId/designer/tables" element={<TableManager />} />
          <Route path="/:tenantId/project/:projectId/designer/sync" element={<DataSyncManager />} />
          <Route path="/:tenantId/project/:projectId/designer/functions" element={<FunctionManager />} />
          
          {/* DESIGNER 앱 LNB 라우트들 */}
          <Route path="/:tenantId/designer/:projectId/user-screen" element={
            <div className="flex h-full">
              <Sidebar
                activeMenu={getActiveMenuName()}
                onMenuSelect={handleLNBMenuClick}
                selectedProject={selectedProject}
                projects={projects}
                onProjectChange={setSelectedProject}
                onBridgeChange={setSelectedBridge}
                selectedBridge={selectedBridge}
                lnbConfigs={lnbConfigs}
                showProjectSelector={true}
              />
              <div className="flex-1 bg-gray-50 overflow-auto">
                {currentUserScreen ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-6xl mb-4">📱</div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">사용자 화면</h2>
                      <p className="text-gray-600">화면 ID: {currentUserScreen}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-6xl mb-4">📱</div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">사용자 화면</h2>
                      <p className="text-gray-600">화면을 로드하는 중입니다...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          } />
          
          <Route path="/:tenantId/designer/:projectId/lnb-menu" element={
            <div className="flex h-full">
              <Sidebar
                activeMenu={getActiveMenuName()}
                onMenuSelect={handleLNBMenuClick}
                selectedProject={selectedProject}
                projects={projects}
                onProjectChange={setSelectedProject}
                onBridgeChange={setSelectedBridge}
                selectedBridge={selectedBridge}
                lnbConfigs={lnbConfigs}
                showProjectSelector={true}
              />
              <div className="flex-1 bg-gray-50 overflow-auto">
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📋</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">LNB 메뉴</h2>
                    <p className="text-gray-600 mb-4">LNB 메뉴 화면입니다.</p>
                    <p className="text-sm text-gray-500">메뉴 ID: {currentRoute.menuId}</p>
                  </div>
                </div>
              </div>
            </div>
          } />
          
          {/* 하위 호환성을 위한 기존 라우트들 */}
          <Route path="/modeler" element={
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">🏗️</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">MODELER</h2>
                <p className="text-gray-600 mb-4">3D 모델링 및 설계 도구</p>
                <p className="text-sm text-gray-500">현재 개발 중입니다. 곧 만나보실 수 있습니다.</p>
              </div>
            </div>
          } />
          
          
          {/* 기본 라우트 - 테넌트 기반으로 리다이렉트 */}
          <Route path="/" element={
            <Navigate to={`/${currentTenant?.id || 'tenant-1'}/project/projects`} replace />
          } />
          
          {/* 테넌트 기본 라우트 */}
          <Route path="/:tenantId" element={
            <Navigate to={`/${currentTenant?.id || 'tenant-1'}/project/projects`} replace />
          } />
          
          {/* Designer 모듈 라우트 */}
          <Route path="/designer/projects" element={
            <ProjectAppList 
              onProjectSelect={handleProjectSelect}
              tenantId={currentTenant.id}
            />
          } />
          
          {/* 대시보드 */}
          <Route path="/designer/dashboard" element={
            selectedProject ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-6xl mb-4">🚧</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">DESIGNER 대시보드</h2>
                  <p className="text-gray-600 mb-4">DESIGNER 앱의 대시보드 기능이 PROJECT 앱으로 이전되었습니다.</p>
                  <button
                    onClick={() => navigateToScreen({ type: 'projects', module: 'project', tenantId: currentTenant?.id })}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    PROJECT 앱으로 이동
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-6xl mb-4">📊</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">대시보드</h2>
                  <p className="text-gray-600 mb-4">프로젝트를 선택하면 대시보드를 확인할 수 있습니다.</p>
                  <button
                    onClick={() => navigateToScreen({ type: 'projects' })}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    프로젝트 선택하기
                  </button>
                </div>
              </div>
            )
          } />
          
          {/* 화면 관리 */}
          <Route path="/:tenantId/designer/screens" element={<ScreenManager />} />
          
          {/* 테이블 관리 */}
          <Route path="/:tenantId/designer/tables" element={<TableManager />} />
          
          {/* 데이터베이스 관리 */}
          
          {/* 동기화 */}
          <Route path="/:tenantId/designer/sync" element={<DataSyncManager />} />
          
          {/* 함수 관리 */}
          <Route path="/:tenantId/designer/functions" element={<FunctionManager />} />
          
          {/* 사용자 생성 화면 */}
          <Route path="/designer/screen/:screenId" element={
            <div className="flex h-full">
              <Sidebar
                onMenuSelect={() => {}}
                selectedProject={selectedProject}
              />
              <div className="flex-1 bg-gray-50 overflow-auto">
                <UserScreenView 
                  screenId={currentUserScreen || ''}
                  lnbMenu={currentLNBMenu}
                  selectedProject={selectedProject}
                />
              </div>
            </div>
          } />
          
          {/* LNB 메뉴 */}
          <Route path="/designer/lnb/:menuId" element={
            <div className="flex h-full">
              <Sidebar
                onMenuSelect={() => {}}
                selectedProject={selectedProject}
              />
              <div className="flex-1 bg-gray-50 overflow-auto">
                {currentUserScreen ? (
                  <UserScreenView 
                    screenId={currentUserScreen}
                    lnbMenu={currentLNBMenu}
                    selectedProject={selectedProject}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-6xl mb-4">📋</div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">화면 연결 없음</h2>
                      <p className="text-gray-600">이 메뉴에는 연결된 화면이 없습니다.</p>
                      <p className="text-sm text-gray-500 mt-2">화면 관리에서 화면을 연결하거나 다른 메뉴를 선택해주세요.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          } />
          
          {/* 기타 화면들 */}
          <Route path="/designer/settings" element={
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">설정</h2>
                <p className="text-gray-600">시스템 설정 페이지입니다.</p>
              </div>
            </div>
          } />
          
          <Route path="/designer/illustration" element={
            <div className="flex h-full">
              <Sidebar
                onMenuSelect={() => {}}
                selectedProject={selectedProject}
              />
              <div className="flex-1 bg-gray-50 overflow-auto">
                <IllustrationView />
              </div>
            </div>
          } />
          
          <Route path="/designer/project-settings" element={
            selectedProject ? (
              <div className="flex h-full">
                <Sidebar
                  onMenuSelect={() => {}}
                  selectedProject={selectedProject}
                  onBridgeChange={(bridge) => {
                    setSelectedBridge(bridge);
                    console.log('Selected bridge:', bridge);
                  }}
                />
                <div className="flex-1 bg-gray-50 overflow-auto">
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-6xl mb-4">⚙️</div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">프로젝트 설정</h2>
                      <p className="text-gray-600 mb-4">프로젝트 설정 기능이 PROJECT 앱으로 이전되었습니다.</p>
                      <button
                        onClick={() => navigateToScreen({ type: 'project-settings', module: 'project', tenantId: currentTenant?.id, projectId: selectedProject?.id })}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        PROJECT 앱으로 이동
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">프로젝트를 선택해주세요.</p>
              </div>
            )
          } />
          
          {/* 기본 라우트 */}
          <Route path="*" element={
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">페이지를 찾을 수 없습니다.</p>
            </div>
          } />
            </Routes>
          )}
        </main>
      </div>
    );
  }

function App() {
  return (
    <BrowserRouter>
      <TenantProvider>
        <APIProvider>
          <AppContent />
        </APIProvider>
      </TenantProvider>
    </BrowserRouter>
  );
}

export default App;