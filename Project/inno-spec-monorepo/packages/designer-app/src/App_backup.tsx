import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { Header, AppType } from '@inno-spec/ui-lib';
import ProjectList from './components/ProjectList';
import Dashboard from './components/Dashboard';
import { TableManager, FieldManager, DatabaseManager, FunctionManager, VariableManager, ScreenManager, LnbManager } from '@inno-spec/admin-app';
import DataSyncManager from './components/DataSyncManager';
// ScreenCanvas???�재 ?�용?��? ?�음
import ScreenRuntimeView from './components/ScreenRuntimeView';
import { Sidebar } from '@inno-spec/ui-lib';
import LoginView from './components/LoginView';
import IllustrationView from './components/IllustrationView';
import ProjectSettings from './components/ProjectSettings';
import { Project, Bridge } from '@inno-spec/shared';
import { TenantProvider, useTenant } from './contexts/TenantContext';
import { APIProvider, useAPI } from './contexts/APIContext';
import { ProjectService } from './services/ProjectService';
import { LocalStorageProjectProvider } from './services/dataProviders/LocalStorageProjectProvider';
import { useURLRouting } from './hooks/useURLRouting';
import { adminLNBConfig } from './configs/adminLNBConfig';

// ?�용???�성 ?�면???�시?�는 컴포?�트
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
        <p className="text-gray-500">?�면??찾을 ???�습?�다.</p>
      </div>
    );
  }

  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">?�로?�트�??�택?�주?�요.</p>
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
  const params = useParams();
  const [selectedApp, setSelectedApp] = useState<AppType>(() => {
    // localStorage?�서 ?�?�된 ???�?�을 가?�오거나 기본�??�용
    const savedApp = localStorage.getItem('selectedApp') as AppType;
    return savedApp || 'DESIGNER';
  });
  const [currentUserScreen, setCurrentUserScreen] = useState<string | null>(null);
  const [currentLNBMenu, setCurrentLNBMenu] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedBridge, setSelectedBridge] = useState<Bridge | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  
  // URL 변경에 ?�른 ?�면 처리
  useEffect(() => {
    
    // URL 기반?�로 selectedApp ?�동 ?�정
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
    }
    
    // 기본 ?�우?��? dashboard??경우 projects�?리다?�렉??
    if (currentRoute.type === 'dashboard' && !selectedProject) {
      navigateToScreen({ type: 'projects', module: 'designer', projectId: selectedProject?.id });
      return;
    }
    
    switch (currentRoute.type) {
      case 'user-screen':
        if (currentRoute.screenId) {
          setCurrentUserScreen(currentRoute.screenId);
          // ?�당 ?�면???�결??LNB 메뉴 찾기
          const connectedMenu = lnbConfigs.find(lnb => 
            lnb.screenId === currentRoute.screenId || 
            (lnb.children && lnb.children.some((child: any) => child.screenId === currentRoute.screenId))
          );
          setCurrentLNBMenu(connectedMenu);
        }
        break;
      case 'lnb-menu':
        if (currentRoute.menuId) {
          // LNB 메뉴?�서 ?�면 ?�보 찾기
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

  // LNB 구성 ?�데?�트 ?�벤???�신
  useEffect(() => {
    const handleLNBConfigUpdate = (event: CustomEvent) => {
      // ?�벤?��? ?�해 받�? LNB 구성??직접 ?�데?�트???�는 ?�으므�?
      // useAPI ?�에???�이?��? ?�시 로드?�도�??�호�?보내???�니??
      // ?�재??window.location.reload()�??�용?�여 ?�체 ?�이지�??�로고침?�니??
      window.location.reload();
    };

    window.addEventListener('lnb-config-updated', handleLNBConfigUpdate as EventListener);
    
    return () => {
      window.removeEventListener('lnb-config-updated', handleLNBConfigUpdate as EventListener);
    };
  }, []);

  // LNB 메뉴 name??가?�오???�수
  const getActiveMenuName = (): string => {
    
    if (currentLNBMenu) {
      return currentLNBMenu.name;
    }
    
    // ADMIN ?�인 경우 adminLNBConfig?�서 메뉴 찾기
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
    
    // DESIGNER ?�인 경우 lnbConfigs?�서 메뉴 찾기
    if (selectedApp === 'DESIGNER' && lnbConfigs && lnbConfigs.length > 0) {
      
      // ?�용???�성 ?�면??경우
      if (currentRoute.type === 'user-screen' && currentRoute.screenId) {
        for (const top of lnbConfigs) {
          if (top.children) {
            for (const child of top.children) {
              if (child.screenId === currentRoute.screenId) {
                return child.name;
              }
            }
          }
          if (top.screenId === currentRoute.screenId) {
            return top.name;
          }
        }
      }
      
      // LNB 메뉴??경우
      if (currentRoute.type === 'lnb-menu' && currentRoute.menuId) {
        for (const top of lnbConfigs) {
          if (top.children) {
            for (const child of top.children) {
              if (child.id === currentRoute.menuId || child.name === currentRoute.menuId) {
                return child.name;
              }
            }
          }
          if (top.id === currentRoute.menuId || top.name === currentRoute.menuId) {
            return top.name;
          }
        }
      }
      
      // systemScreenType?�로 메뉴 찾기 (dashboard, screens, illustration ??
      for (const top of lnbConfigs) {
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
    
    
    switch (currentRoute.type) {
      case 'dashboard':
        return 'dashboard';
      case 'project-settings':
        return 'project-settings';
      case 'illustration':
        return 'section';
      case 'screens':
        return 'screens';
      case 'settings':
        return 'settings';
      case 'projects':
        return 'projects';
      case 'tables':
        return 'tables';
      case 'functions':
        return 'functions';
      case 'sync':
        return 'sync';
      case 'no-screen':
        return 'no-screen';
      // ADMIN 메뉴??
      case 'admin-db':
        return 'admin-db';
      case 'admin-fields':
        return 'admin-fields';
      case 'admin-tables':
        return 'admin-table-definition';
      case 'admin-variables':
        return 'admin-variable-definition';
      case 'admin-functions':
        return 'admin-function-definition';
      case 'admin-lnbconfig':
        return 'admin-lnb-config';
      case 'admin-screenconfig':
        return 'admin-screen-config';
      default:
        return 'dashboard';
    }
  };
  const [projectService] = useState(() => new ProjectService(new LocalStorageProjectProvider()));

  // 기본 DESIGNER LNB 구성 ?�성
  useEffect(() => {
    const initializeDefaultLNBConfig = () => {
      const existingConfigs = JSON.parse(localStorage.getItem('lnbConfigs') || '[]');
      
      // 기존 ?�정???�거??systemScreenType???�정?��? ?��? 경우 ?�로 ?�성
      const needsUpdate = existingConfigs.length === 0 || 
        !existingConfigs.some((config: any) => config.systemScreenType);
      
      if (needsUpdate) {
        const defaultLNBConfigs: LNBConfig[] = [
          {
            id: 'dashboard',
            name: 'dashboard',
            displayName: '?�?�보??,
            icon: '?��',
            order: 1,
            isActive: true,
            parentId: '',
            isParent: false,
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
            displayName: '?�면 관�?,
            icon: '?���?,
            order: 2,
            isActive: true,
            parentId: '',
            isParent: false,
            type: 'independent',
            screenId: '',
            systemScreenType: 'screens',
            children: [],
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'illustration',
            name: 'illustration',
            displayName: '?�면 관�?,
            icon: '?��',
            order: 3,
            isActive: true,
            parentId: '',
            isParent: false,
            type: 'independent',
            screenId: '',
            systemScreenType: 'illustration',
            children: [],
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'project-settings',
            name: 'project-settings',
            displayName: '?�로?�트 ?�정',
            icon: '?�️',
            order: 4,
            isActive: true,
            parentId: '',
            isParent: false,
            type: 'independent',
            screenId: '',
            systemScreenType: 'project-settings',
            children: [],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];
        
        localStorage.setItem('lnbConfigs', JSON.stringify(defaultLNBConfigs));
        
        // ?�버깅을 ?�해 ?�역 ?�수�??�출
        (window as any).resetLNBConfigs = () => {
          localStorage.removeItem('lnbConfigs');
          window.location.reload();
        };
      }
    };

    initializeDefaultLNBConfig();
  }, []);

  // ?�로?�트 목록??로드????URL ?�는 localStorage?�서 ?�로?�트 ?�동 ?�택
  useEffect(() => {
    
    if (projects.length > 0) {
      // 먼�? URL??projectId�??�인
      let projectId = currentRoute.projectId;
      
      // URL??projectId가 ?�으�?localStorage?�서 가?�옴
      if (!projectId) {
        projectId = localStorage.getItem('selectedProjectId');
      }
      
      
      if (projectId) {
        const project = projects.find(p => p.id === projectId);
        
        if (project) {
          // ?�로?�트가 ?��? ?�택?�어 ?�고 같�? ?�로?�트?��? ?�인
          if (!selectedProject || selectedProject.id !== project.id) {
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

  // ?�로?�트가 로드?�었?��? ?�인 (name?�나 displayName???�으�?로드??것으�??�단)
  const isProjectLoaded = selectedProject && (selectedProject.name || selectedProject.displayName);
  
  // ?�버�?로그 추�?

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    localStorage.setItem('selectedProjectId', project.id);
    // ?�로?�트??�?번째 교량??기본 ?�택
    if (project.bridges && project.bridges.length > 0) {
      setSelectedBridge(project.bridges[0]);
    } else {
      setSelectedBridge(null);
    }
    // ?�로?�트 ID�??�함???�?�보?�로 ?�동
    navigateToScreen({ type: 'dashboard', module: 'designer', projectId: project.id });
  };

  const handleAppChange = (app: AppType) => {
    setSelectedApp(app);
    localStorage.setItem('selectedApp', app);
    // ??변�???기본 뷰로 초기??
    if (app === 'DESIGNER') {
      navigateToScreen({ type: 'projects', module: 'designer', projectId: selectedProject?.id });
    } else if (app === 'MODELER') {
      navigateToScreen({ type: 'modeler', module: 'modeler', projectId: selectedProject?.id });
    } else if (app === 'VIEWER') {
      navigateToScreen({ type: 'viewer', module: 'viewer', projectId: selectedProject?.id });
    } else if (app === 'ADMIN') {
      navigateToScreen({ type: 'admin-db', module: 'admin' });
    }
  };

  const handleLNBMenuClick = React.useCallback((menuId: string) => {
    
    // ADMIN ?�인 경우 adminLNBConfig ?�용
    const currentLNBConfigs = selectedApp === 'ADMIN' ? adminLNBConfig : lnbConfigs;
    
    // LNB ?�정?�서 ?�당 메뉴 찾기
    let targetLNB: any = null;
    
    // 모든 LNB ?�정???�회?�며 ?�당 메뉴 찾기
    for (const top of currentLNBConfigs) {
      // ?�위 메뉴 ?�체가 ?�치?�는지 ?�인 (name ?�는 id�?검??
      if (top.name === menuId || top.id === menuId) {
        targetLNB = top;
        break;
      }
      // ?�위 메뉴?�서 찾기 (name ?�는 id�?검??
      if (top.children) {
        for (const child of top.children) {
          if (child.name === menuId || child.id === menuId) {
            targetLNB = child;
            break;
          }
        }
      }
      if (targetLNB) break;
    }
    
    if (targetLNB) {
      
      // ?�스???�면??경우
      if (targetLNB.systemScreenType) {
        switch (targetLNB.systemScreenType) {
          case 'dashboard':
            navigateToScreen({ type: 'dashboard', module: 'designer', projectId: selectedProject?.id });
            break;
          case 'project-settings':
            navigateToScreen({ type: 'project-settings', module: 'designer', projectId: selectedProject?.id });
            break;
          case 'section-library':
            navigateToScreen({ type: 'illustration', module: 'designer', projectId: selectedProject?.id });
            break;
          case 'user-profile':
          case 'system-settings':
            navigateToScreen({ type: 'settings', module: 'designer' });
            break;
          // ADMIN ?�스???�면??
          case 'admin-db':
            navigateToScreen({ type: 'admin-db', module: 'admin' });
            break;
          case 'admin-fields':
            navigateToScreen({ type: 'admin-fields', module: 'admin' });
            break;
          case 'admin-tables':
            navigateToScreen({ type: 'admin-tables', module: 'admin' });
            break;
          case 'admin-variables':
            navigateToScreen({ type: 'admin-variables', module: 'admin' });
            break;
          case 'admin-functions':
            navigateToScreen({ type: 'admin-functions', module: 'admin' });
            break;
          case 'admin-lnbconfig':
            navigateToScreen({ type: 'admin-lnbconfig', module: 'admin' });
            break;
          case 'admin-screenconfig':
            navigateToScreen({ type: 'admin-screenconfig', module: 'admin' });
            break;
          default:
            if (selectedApp === 'ADMIN') {
              navigateToScreen({ type: 'admin-db', module: 'admin' });
            } else {
              navigateToScreen({ type: 'projects', module: 'designer', projectId: selectedProject?.id });
            }
        }
      }
      // ?�용???�성 ?�면??경우
      else if (targetLNB.screenId) {
        navigateToScreen({ type: 'user-screen', module: 'designer', projectId: selectedProject?.id, screenId: targetLNB.screenId });
      }
      // ?�면???�결?��? ?��? 경우
      else {
        navigateToScreen({ type: 'no-screen', module: 'designer', projectId: selectedProject?.id });
      }
    } else {
      navigateToScreen({ type: 'projects', module: 'designer', projectId: selectedProject?.id });
    }
  }, [lnbConfigs, navigateToScreen, selectedProject]);

  // ?�로?�트 목록 로드
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

  // ?�증?��? ?��? 경우 로그???�면
  if (!isAuthenticated || !currentTenant || !currentUser) {
    return <LoginView />;
  }

  // 로딩 ?�태
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">?�이?��? 불러?�는 �?..</p>
        </div>
      </div>
    );
  }

  // ?�러 ?�태
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">?�️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">?�류 발생</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            ?�로고침
          </button>
        </div>
      </div>
    );
  }

  // ?�증??경우 메인 ?�플리�??�션
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
          {/* ADMIN 메뉴????LNB ?�시 */}
          {selectedApp === 'ADMIN' && (
            <div className="flex h-full">
              <Sidebar
                activeMenu={getActiveMenuName()}
                onMenuSelect={() => {}}
                selectedProject={null}
                projects={[]}
                onProjectChange={() => {}}
                onBridgeChange={() => {}}
                selectedBridge={null}
                onLNBMenuClick={handleLNBMenuClick}
                lnbConfigs={adminLNBConfig}
                showProjectSelector={false}
              />
              <div className="flex-1 bg-gray-50 overflow-auto">
                <Routes>
                  <Route path="/admin/db" element={<DatabaseManager tenantId={currentTenant?.id || ''} />} />
                  <Route path="/admin/fields" element={<FieldManager />} />
                  <Route path="/admin/tables" element={<TableManager />} />
                  <Route path="/admin/variables" element={<VariableManager />} />
                  <Route path="/admin/functions" element={<FunctionManager />} />
                  <Route path="/admin/lnbconfig" element={<LnbManager />} />
                  <Route path="/admin/screenconfig" element={<ScreenManager />} />
                </Routes>
              </div>
            </div>
          )}
          
          {/* ?�른 메뉴??*/}
          {selectedApp !== 'ADMIN' && (
            <Routes>
              {/* GNB ?�우??(?�로?�트 공통) */}
              <Route path="/:tenantId/designer/projects" element={
                <ProjectList 
                  onProjectSelect={handleProjectSelect}
                  tenantId={currentTenant.id}
                />
              } />
              
              <Route path="/:tenantId/designer/tables" element={<TableManager />} />
              <Route path="/:tenantId/designer/functions" element={<FunctionManager />} />
              <Route path="/:tenantId/designer/sync" element={<DataSyncManager />} />
              <Route path="/:tenantId/designer/settings" element={
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">?�정</h2>
                    <p className="text-gray-600">?�스???�정 ?�이지?�니??</p>
                  </div>
                </div>
              } />
              
              <Route path="/:tenantId/modeler" element={
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">?���?/div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">MODELER</h2>
                <p className="text-gray-600 mb-4">3D 모델�?�??�계 ?�구</p>
                <p className="text-sm text-gray-500">?�재 개발 중입?�다. �?만나보실 ???�습?�다.</p>
              </div>
            </div>
          } />
          
          <Route path="/:tenantId/viewer" element={
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">?���?/div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">VIEWER</h2>
                <p className="text-gray-600 mb-4">3D 뷰어 �??�각???�구</p>
                <p className="text-sm text-gray-500">?�재 개발 중입?�다. �?만나보실 ???�습?�다.</p>
              </div>
            </div>
          } />
          
          <Route path="/:tenantId/project/:projectId/viewer" element={
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">?���?/div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">VIEWER</h2>
                <p className="text-gray-600 mb-4">3D 뷰어 �??�각???�구</p>
                <p className="text-sm text-gray-500">?�재 개발 중입?�다. �?만나보실 ???�습?�다.</p>
              </div>
            </div>
          } />
          
          {/* LNB ?�우??(?�로?�트�??�립) */}
          <Route path="/:tenantId/designer/:projectId/dashboard" element={
            isProjectLoaded ? (
              <Dashboard 
                project={selectedProject} 
                selectedBridge={selectedBridge}
                projects={projects}
                onProjectChange={setSelectedProject}
                onBridgeChange={(bridge) => {
                  setSelectedBridge(bridge);
                  // 브리지 변�????�로?�트 ?�데?�트
                  if (selectedProject) {
                    const updatedProject = {
                      ...selectedProject,
                      bridges: selectedProject.bridges.map(b => 
                        b.id === bridge.id ? bridge : b
                      )
                    };
                    setSelectedProject(updatedProject);
                  }
                }}
                onProjectUpdate={async (updatedProject) => {
                  try {
                    const projectService = new ProjectService(new LocalStorageProjectProvider());
                    await projectService.updateProject(updatedProject);
                    setSelectedProject(updatedProject);
                    // 브리지가 변경된 경우 ?�택??브리지???�데?�트
                    if (selectedBridge && !updatedProject.bridges.find(b => b.id === selectedBridge.id)) {
                      setSelectedBridge(updatedProject.bridges[0]);
                    }
                    // ?�로?�트 목록???�데?�트
                    const allProjects = await projectService.getAllProjects();
                    setProjects(allProjects);
                  } catch (error) {
                    console.error('Failed to update project:', error);
                    alert('?�로?�트 ?�데?�트???�패?�습?�다.');
                  }
                }}
                onLNBMenuClick={handleLNBMenuClick}
                lnbConfigs={lnbConfigs}
                showProjectSelector={true}
                activeMenu={getActiveMenuName()}
              />
            ) : selectedProject && !isProjectLoaded ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">?�로?�트 로딩 �?..</h2>
                  <p className="text-gray-600">?�로?�트 ?�보�?불러?�고 ?�습?�다.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-6xl mb-4">?��</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">?�?�보??/h2>
                  <p className="text-gray-600 mb-4">?�로?�트�??�택?�면 ?�?�보?��? ?�인?????�습?�다.</p>
                  <button
                    onClick={() => navigateToScreen({ type: 'projects', module: 'designer', projectId: selectedProject?.id })}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    ?�로?�트 ?�택?�기
                  </button>
                </div>
              </div>
            )
          } />
          
          <Route path="/:tenantId/designer/:projectId/screens" element={<ScreenManager />} />
          <Route path="/:tenantId/designer/:projectId/illustration" element={
            <div className="flex h-full">
              <Sidebar
                activeMenu={getActiveMenuName()}
                onMenuSelect={() => {}}
                selectedProject={selectedProject}
                projects={projects}
                onProjectChange={setSelectedProject}
                onBridgeChange={setSelectedBridge}
                selectedBridge={selectedBridge}
                onLNBMenuClick={handleLNBMenuClick}
                lnbConfigs={lnbConfigs}
                showProjectSelector={true}
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
                  activeMenu={getActiveMenuName()}
                  onMenuSelect={() => {}}
                  selectedProject={selectedProject}
                  projects={projects}
                  onProjectChange={setSelectedProject}
                  onBridgeChange={setSelectedBridge}
                  selectedBridge={selectedBridge}
                  onLNBMenuClick={handleLNBMenuClick}
                  lnbConfigs={lnbConfigs}
                showProjectSelector={true}
                />
                <div className="flex-1 p-6">
                  <ProjectSettings 
                    project={selectedProject}
                    onProjectUpdate={async (updatedProject) => {
                      try {
                        const projectService = new ProjectService(new LocalStorageProjectProvider());
                        await projectService.updateProject(updatedProject);
                        setSelectedProject(updatedProject);
                        // ?�로?�트 목록???�데?�트
                        const allProjects = await projectService.getAllProjects();
                        setProjects(allProjects);
                      } catch (error) {
                        console.error('Failed to update project:', error);
                        alert('?�로?�트 ?�데?�트???�패?�습?�다.');
                      }
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">?�로?�트 ?�정</h2>
                  <p className="text-gray-600">?�로?�트�??�택?�면 ?�정???�인?????�습?�다.</p>
                </div>
              </div>
            )
          } />
          
          <Route path="/:tenantId/designer/:projectId/no-screen" element={
            <div className="flex h-full">
              <Sidebar
                activeMenu={getActiveMenuName()}
                onMenuSelect={() => {}}
                selectedProject={selectedProject}
                projects={projects}
                onProjectChange={setSelectedProject}
                onBridgeChange={setSelectedBridge}
                selectedBridge={selectedBridge}
                onLNBMenuClick={handleLNBMenuClick}
                lnbConfigs={lnbConfigs}
                showProjectSelector={true}
              />
              <div className="flex-1 bg-gray-50 overflow-auto">
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-6xl mb-4">?��</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">?�면 ?�결 ?�음</h2>
                    <p className="text-gray-600 mb-4">??메뉴?�는 ?�결???�면???�습?�다.</p>
                    <p className="text-sm text-gray-500">?�면 관리에???�면???�결?�거???�른 메뉴�??�택?�주?�요.</p>
                  </div>
                </div>
              </div>
            </div>
          } />
          
          {/* 기본 ?�우??*/}
          <Route path="/" element={
            <Navigate to={`/${currentTenant?.id || 'tenant-1'}/designer/projects`} replace />
          } />
          
          {/* ?�넌??기본 ?�우??*/}
          <Route path="/:tenantId" element={
            <Navigate to={`/${currentTenant?.id || 'tenant-1'}/designer/projects`} replace />
          } />
          
          {/* ?�위 ?�환?�을 ?�한 기존 ?�우?�들 */}
          <Route path="/modeler" element={
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">?���?/div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">MODELER</h2>
                <p className="text-gray-600 mb-4">3D 모델�?�??�계 ?�구</p>
                <p className="text-sm text-gray-500">?�재 개발 중입?�다. �?만나보실 ???�습?�다.</p>
              </div>
            </div>
          } />
          
          
          <Route path="/designer/projects" element={
            <ProjectList 
              onProjectSelect={handleProjectSelect}
              tenantId={currentTenant.id}
            />
          } />
          
          <Route path="/designer/dashboard" element={
            selectedProject ? (
              <Dashboard 
                project={selectedProject} 
                selectedBridge={selectedBridge}
                projects={projects}
                onProjectChange={setSelectedProject}
                onBridgeChange={(bridge) => {
                  setSelectedBridge(bridge);
                  // 브리지 변�????�로?�트 ?�데?�트
                  if (selectedProject) {
                    const updatedProject = {
                      ...selectedProject,
                      bridges: selectedProject.bridges.map(b => 
                        b.id === bridge.id ? bridge : b
                      )
                    };
                    setSelectedProject(updatedProject);
                  }
                }}
                onProjectUpdate={async (updatedProject) => {
                  try {
                    const projectService = new ProjectService(new LocalStorageProjectProvider());
                    await projectService.updateProject(updatedProject);
                    setSelectedProject(updatedProject);
                    // 브리지가 변경된 경우 ?�택??브리지???�데?�트
                    if (selectedBridge && !updatedProject.bridges.find(b => b.id === selectedBridge.id)) {
                      setSelectedBridge(updatedProject.bridges[0]);
                    }
                    // ?�로?�트 목록???�데?�트
                    const allProjects = await projectService.getAllProjects();
                    setProjects(allProjects);
                  } catch (error) {
                    console.error('Failed to update project:', error);
                    alert('?�로?�트 ?�데?�트???�패?�습?�다.');
                  }
                }}
                onLNBMenuClick={handleLNBMenuClick}
                lnbConfigs={lnbConfigs}
                showProjectSelector={true}
                activeMenu={getActiveMenuName()}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-6xl mb-4">?��</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">?�?�보??/h2>
                  <p className="text-gray-600 mb-4">?�로?�트�??�택?�면 ?�?�보?��? ?�인?????�습?�다.</p>
                  <button
                    onClick={() => navigateToScreen({ type: 'projects', module: 'designer' })}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    ?�로?�트 ?�택?�기
                  </button>
                </div>
              </div>
            )
          } />
          
          <Route path="/:tenantId/project/:projectId/designer/screens" element={<ScreenManager />} />
          <Route path="/:tenantId/project/:projectId/designer/tables" element={<TableManager />} />
          <Route path="/:tenantId/project/:projectId/designer/sync" element={<DataSyncManager />} />
          <Route path="/:tenantId/project/:projectId/designer/functions" element={<FunctionManager />} />
          
          {/* ?�위 ?�환?�을 ?�한 기존 ?�우?�들 */}
          <Route path="/modeler" element={
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">?���?/div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">MODELER</h2>
                <p className="text-gray-600 mb-4">3D 모델�?�??�계 ?�구</p>
                <p className="text-sm text-gray-500">?�재 개발 중입?�다. �?만나보실 ???�습?�다.</p>
              </div>
            </div>
          } />
          
          
          {/* 기본 ?�우??- ?�넌??기반?�로 리다?�렉??*/}
          <Route path="/" element={
            <Navigate to={`/${currentTenant?.id || 'tenant-1'}/designer/projects`} replace />
          } />
          
          {/* ?�넌??기본 ?�우??*/}
          <Route path="/:tenantId" element={
            <Navigate to={`/${currentTenant?.id || 'tenant-1'}/designer/projects`} replace />
          } />
          
          {/* Designer 모듈 ?�우??*/}
          <Route path="/designer/projects" element={
            <ProjectList 
              onProjectSelect={handleProjectSelect}
              tenantId={currentTenant.id}
            />
          } />
          
          {/* ?�?�보??*/}
          <Route path="/designer/dashboard" element={
            selectedProject ? (
              <Dashboard 
                project={selectedProject} 
                selectedBridge={selectedBridge}
                projects={projects}
                onProjectChange={setSelectedProject}
                onBridgeChange={(bridge) => {
                  setSelectedBridge(bridge);
                }}
                onProjectUpdate={async (updatedProject) => {
                  try {
                    await projectService.updateProject(updatedProject);
                    setSelectedProject(updatedProject);
                    // ?�로 추�???교량???�다�?�?번째 교량 ?�택
                    if (updatedProject.bridges && updatedProject.bridges.length > 0) {
                      if (!selectedBridge || !updatedProject.bridges.find(b => b.id === selectedBridge.id)) {
                        setSelectedBridge(updatedProject.bridges[0]);
                      }
                    }
                    // ?�로?�트 목록???�데?�트
                    const allProjects = await projectService.getAllProjects();
                    setProjects(allProjects);
                  } catch (error) {
                    console.error('Failed to update project:', error);
                    alert('?�로?�트 ?�데?�트???�패?�습?�다.');
                  }
                }}
                onLNBMenuClick={handleLNBMenuClick}
                lnbConfigs={lnbConfigs}
                showProjectSelector={true}
                activeMenu={getActiveMenuName()}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-6xl mb-4">?��</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">?�?�보??/h2>
                  <p className="text-gray-600 mb-4">?�로?�트�??�택?�면 ?�?�보?��? ?�인?????�습?�다.</p>
                  <button
                    onClick={() => navigateToScreen({ type: 'projects' })}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    ?�로?�트 ?�택?�기
                  </button>
                </div>
              </div>
            )
          } />
          
          {/* ?�면 관�?*/}
          <Route path="/:tenantId/designer/screens" element={<ScreenManager />} />
          
          {/* ?�이�?관�?*/}
          <Route path="/:tenantId/designer/tables" element={<TableManager />} />
          
          {/* ?�이?�베?�스 관�?*/}
          
          {/* ?�기??*/}
          <Route path="/:tenantId/designer/sync" element={<DataSyncManager />} />
          
          {/* ?�수 관�?*/}
          <Route path="/:tenantId/designer/functions" element={<FunctionManager />} />
          
          {/* ?�용???�성 ?�면 */}
          <Route path="/designer/screen/:screenId" element={
            <div className="flex h-full">
              <Sidebar
                activeMenu={getActiveMenuName()}
                onMenuSelect={() => {}}
                selectedProject={selectedProject}
                selectedBridge={selectedBridge}
                projects={projects}
                onProjectChange={setSelectedProject}
                onBridgeChange={(bridge) => {
                  setSelectedBridge(bridge);
                }}
                onLNBMenuClick={handleLNBMenuClick}
                lnbConfigs={lnbConfigs}
                showProjectSelector={true}
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
                activeMenu={getActiveMenuName()}
                onMenuSelect={() => {}}
                selectedProject={selectedProject}
                selectedBridge={selectedBridge}
                projects={projects}
                onProjectChange={setSelectedProject}
                onBridgeChange={(bridge) => {
                  setSelectedBridge(bridge);
                }}
                onLNBMenuClick={handleLNBMenuClick}
                lnbConfigs={lnbConfigs}
                showProjectSelector={true}
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
                      <div className="text-6xl mb-4">?��</div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">?�면 ?�결 ?�음</h2>
                      <p className="text-gray-600">??메뉴?�는 ?�결???�면???�습?�다.</p>
                      <p className="text-sm text-gray-500 mt-2">?�면 관리에???�면???�결?�거???�른 메뉴�??�택?�주?�요.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          } />
          
          {/* 기�? ?�면??*/}
          <Route path="/designer/settings" element={
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">?�정</h2>
                <p className="text-gray-600">?�스???�정 ?�이지?�니??</p>
              </div>
            </div>
          } />
          
          <Route path="/designer/illustration" element={
            <div className="flex h-full">
              <Sidebar
                activeMenu={getActiveMenuName()}
                onMenuSelect={() => {}}
                selectedProject={selectedProject}
                selectedBridge={selectedBridge}
                projects={projects}
                onProjectChange={setSelectedProject}
                onBridgeChange={(bridge) => {
                  setSelectedBridge(bridge);
                }}
                onLNBMenuClick={handleLNBMenuClick}
                lnbConfigs={lnbConfigs}
                showProjectSelector={true}
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
                  activeMenu={getActiveMenuName()}
                  onMenuSelect={() => {}}
                  selectedProject={selectedProject}
                  selectedBridge={selectedBridge}
                  projects={projects}
                  onProjectChange={setSelectedProject}
                  onBridgeChange={(bridge) => {
                    setSelectedBridge(bridge);
                  }}
                  onLNBMenuClick={handleLNBMenuClick}
                  lnbConfigs={lnbConfigs}
                showProjectSelector={true}
                />
                <div className="flex-1 bg-gray-50 overflow-auto">
                  <ProjectSettings 
                    project={selectedProject}
                    onProjectUpdate={async (updatedProject) => {
                      try {
                        await projectService.updateProject(updatedProject);
                        setSelectedProject(updatedProject);
                        // ?�로?�트 목록???�데?�트
                        const allProjects = await projectService.getAllProjects();
                        setProjects(allProjects);
                      } catch (error) {
                        console.error('Failed to update project:', error);
                        alert('?�로?�트 ?�데?�트???�패?�습?�다.');
                      }
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">?�로?�트�??�택?�주?�요.</p>
              </div>
            )
          } />
          
          {/* 기본 ?�우??*/}
          <Route path="*" element={
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">?�이지�?찾을 ???�습?�다.</p>
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
