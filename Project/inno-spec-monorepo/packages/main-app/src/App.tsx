import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Header, AppType, LoginView, Sidebar } from '@inno-spec/ui-lib';
import { TableManager, FieldManager, DatabaseManager, FunctionManager, VariableManager, ScreenManager, LnbManager, ProjectCategoryManager, screenService } from '@inno-spec/admin-app';
import { ProjectDashboard, ProjectList as ProjectAppList } from '@inno-spec/project-app';
import { ScreenRuntimeView } from '@inno-spec/designer-app';
import { Project, Bridge, LNBConfig, ProjectService, LocalStorageProjectProvider } from '@inno-spec/shared';
import { TenantProvider, useTenant } from '@inno-spec/core';
import { APIProvider, useAPI } from '@inno-spec/core';
import { useURLRouting } from '@inno-spec/core';

// 메인 애플리케이션 - 모든 앱을 통합하고 라우팅을 담당
function App() {
  return (
    <TenantProvider>
      <APIProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </APIProvider>
    </TenantProvider>
  );
}

// ADMIN LNB 메뉴 설정 (계층 구조)
const adminLNBConfig: LNBConfig[] = [
  {
    id: 'admin-database',
    name: 'admin-database',
    displayName: '데이터베이스',
    icon: 'Database',
    order: 1,
    isActive: true,
    type: 'parent',
    createdAt: new Date(),
    updatedAt: new Date(),
    children: [
      {
        id: 'admin-db',
        name: 'admin-db',
        displayName: 'DB 관리',
        icon: 'Database',
        order: 1,
        isActive: true,
        type: 'child',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  },
  {
    id: 'admin-project',
    name: 'admin-project',
    displayName: '프로젝트',
    icon: 'FolderOpen',
    order: 2,
    isActive: true,
    type: 'parent',
    createdAt: new Date(),
    updatedAt: new Date(),
    children: [
      {
        id: 'admin-project-category',
        name: 'admin-project-category',
        displayName: '카테고리 관리',
        icon: 'Tag',
        order: 1,
        isActive: true,
        type: 'child',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  },
  {
    id: 'admin-component',
    name: 'admin-component',
    displayName: '컴포넌트',
    icon: 'Component',
    order: 3,
    isActive: true,
    type: 'parent',
    createdAt: new Date(),
    updatedAt: new Date(),
    children: [
      {
        id: 'admin-field-definition',
        name: 'admin-field-definition',
        displayName: '필드 정의',
        icon: 'Type',
        order: 1,
        isActive: true,
        type: 'child',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'admin-table-definition',
        name: 'admin-table-definition',
        displayName: '테이블 정의',
        icon: 'Table',
        order: 2,
        isActive: true,
        type: 'child',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'admin-variable-definition',
        name: 'admin-variable-definition',
        displayName: '변수 정의',
        icon: 'Variable',
        order: 3,
        isActive: true,
        type: 'child',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'admin-function-definition',
        name: 'admin-function-definition',
        displayName: '함수 정의',
        icon: 'Code',
        order: 4,
        isActive: true,
        type: 'child',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  },
  {
    id: 'admin-screen',
    name: 'admin-screen',
    displayName: '화면',
    icon: 'Monitor',
    order: 4,
    isActive: true,
    type: 'parent',
    createdAt: new Date(),
    updatedAt: new Date(),
    children: [
      {
        id: 'admin-screen-config',
        name: 'admin-screen-config',
        displayName: '화면 구성',
        icon: 'Layers',
        order: 1,
        isActive: true,
        type: 'child',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'admin-lnb-config',
        name: 'admin-lnb-config',
        displayName: 'LNB 구성',
        icon: 'Menu',
        order: 2,
        isActive: true,
        type: 'child',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  }
];

function AppContent() {
  const { currentTenant, currentUser, isAuthenticated, logout, login, isLoading } = useTenant();
  const { } = useAPI();
  const [selectedApp, setSelectedApp] = useState<AppType>('PROJECT');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedBridge, setSelectedBridge] = useState<Bridge | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectMenu, setActiveProjectMenu] = useState<string>('dashboard');
  const [activeAdminMenu, setActiveAdminMenu] = useState<string>('admin-db');
  const [activeDesignerMenu, setActiveDesignerMenu] = useState<string>('dashboard');
  const [designerLNBConfigs, setDesignerLNBConfigs] = useState<LNBConfig[]>([]);
  const location = useLocation();
  const { navigateToScreen } = useURLRouting();

  // ProjectService 인스턴스
  const [projectService] = useState(() => new ProjectService(new LocalStorageProjectProvider()));

  // 프로젝트 목록 로드
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const allProjects = await projectService.getAllProjects();
        setProjects(allProjects);
        
        // localStorage에서 선택된 프로젝트 복원
        const savedProjectId = localStorage.getItem('selectedProjectId');
        if (savedProjectId) {
          const savedProject = allProjects.find(p => p.id === savedProjectId);
          if (savedProject) {
            setSelectedProject(savedProject);
          } else if (allProjects.length > 0) {
            // 저장된 프로젝트를 찾을 수 없으면 첫 번째 프로젝트 선택
            setSelectedProject(allProjects[0]);
            localStorage.setItem('selectedProjectId', allProjects[0].id);
          }
        } else if (allProjects.length > 0 && !selectedProject) {
          // 저장된 프로젝트가 없으면 첫 번째 프로젝트 선택
          setSelectedProject(allProjects[0]);
          localStorage.setItem('selectedProjectId', allProjects[0].id);
        }
      } catch (error) {
        console.error('Failed to load projects:', error);
      }
    };
    
    if (currentTenant) {
      loadProjects();
    }
  }, [currentTenant]);

  // DESIGNER LNB 설정 로드 및 초기 메뉴 설정
  useEffect(() => {
    // 기본 LNB 구성이 없으면 생성
    screenService.createDefaultLNBConfig();
    
    const lnbConfigs = screenService.getLNBConfigs();
    setDesignerLNBConfigs(lnbConfigs);
    
    // 첫 번째 활성 LNB 메뉴를 초기 메뉴로 설정
    if (lnbConfigs.length > 0) {
      const firstMenu = lnbConfigs.find(config => config.isActive);
      if (firstMenu) {
        // 첫 번째 메뉴가 부모 메뉴인 경우 첫 번째 자식을 선택
        if (firstMenu.children && firstMenu.children.length > 0) {
          const firstChild = firstMenu.children.find(child => child.isActive);
          if (firstChild) {
            setActiveDesignerMenu(firstChild.id);
          }
        } else {
          setActiveDesignerMenu(firstMenu.id);
        }
      }
    }
  }, []);

  // URL 기반 앱 선택 및 메뉴 활성화
  useEffect(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    
    // ADMIN 모듈 처리
    if (pathSegments.length >= 1 && pathSegments[0] === 'admin') {
      setSelectedApp('ADMIN');
      const page = pathSegments[1];
      
      switch (page) {
        case 'db':
          setActiveAdminMenu('admin-db');
          break;
        case 'project-category':
          setActiveAdminMenu('admin-project-category');
          break;
        case 'field-definition':
          setActiveAdminMenu('admin-field-definition');
          break;
        case 'table-definition':
          setActiveAdminMenu('admin-table-definition');
          break;
        case 'variable-definition':
          setActiveAdminMenu('admin-variable-definition');
          break;
        case 'function-definition':
          setActiveAdminMenu('admin-function-definition');
          break;
        case 'screen-config':
          setActiveAdminMenu('admin-screen-config');
          break;
        case 'lnb-config':
          setActiveAdminMenu('admin-lnb-config');
          // LNB 설정이 변경될 수 있으므로 DESIGNER LNB도 다시 로드
          const lnbConfigs = screenService.getLNBConfigs();
          setDesignerLNBConfigs(lnbConfigs);
          break;
        default:
          setActiveAdminMenu('admin-db');
      }
    } else if (pathSegments.length >= 2) {
      const module = pathSegments[1];
      switch (module) {
        case 'project':
          setSelectedApp('PROJECT');
          // PROJECT 모듈에서 URL 기반 메뉴 활성화
          if (pathSegments.length >= 4) {
            const page = pathSegments[3];
            switch (page) {
              case 'dashboard':
                setActiveProjectMenu('dashboard');
                break;
              case 'project-settings':
                setActiveProjectMenu('project-settings');
                break;
            }
          }
          break;
        case 'designer':
          setSelectedApp('DESIGNER');
          // DESIGNER 모듈에서 URL 기반 메뉴 활성화
          if (pathSegments.length >= 4) {
            const page = pathSegments[3];
            setActiveDesignerMenu(page);
          }
          break;
        case 'modeler':
          setSelectedApp('MODELER');
          break;
        case 'viewer':
          setSelectedApp('VIEWER');
          break;
        default:
          setSelectedApp('PROJECT');
      }
    }
  }, [location.pathname]);

  // 프로젝트 선택 처리
  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    localStorage.setItem('selectedProjectId', project.id);
    
    // 현재 앱에 따라 다른 동작
    if (selectedApp === 'DESIGNER') {
      // DESIGNER 앱에서는 첫 번째 LNB 메뉴로 이동
      const firstMenuId = getFirstActiveMenu(designerLNBConfigs);
      if (firstMenuId) {
        navigateToScreen({ type: firstMenuId as any, module: 'designer', projectId: project.id });
      } else {
        navigateToScreen({ type: 'dashboard', module: 'designer', projectId: project.id });
      }
    } else {
      // PROJECT 앱에서는 대시보드로 이동
    navigateToScreen({ type: 'dashboard', module: 'project', projectId: project.id });
    }
  };

  // PROJECT LNB 메뉴 클릭 처리
  const handleProjectMenuClick = (menuId: string) => {
    setActiveProjectMenu(menuId);
    
    switch (menuId) {
      case 'dashboard':
        navigateToScreen({ type: 'dashboard', module: 'project', projectId: selectedProject?.id });
        break;
      case 'project-settings':
        navigateToScreen({ type: 'project-settings', module: 'project', projectId: selectedProject?.id });
        break;
    }
  };

  // ADMIN LNB 메뉴 클릭 처리
  const handleAdminMenuClick = (menuId: string) => {
    setActiveAdminMenu(menuId);
    
    switch (menuId) {
      case 'admin-db':
        navigateToScreen({ type: 'admin-db', module: 'admin' });
        break;
      case 'admin-project-category':
        navigateToScreen({ type: 'admin-project-category', module: 'admin' });
        break;
      case 'admin-field-definition':
        navigateToScreen({ type: 'admin-field-definition', module: 'admin' });
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
      case 'admin-screen-config':
        navigateToScreen({ type: 'admin-screen-config', module: 'admin' });
        break;
      case 'admin-lnb-config':
        navigateToScreen({ type: 'admin-lnb-config', module: 'admin' });
        break;
    }
  };

  // DESIGNER LNB 메뉴 클릭 처리
  const handleDesignerMenuClick = (menuId: string) => {
    setActiveDesignerMenu(menuId);
    navigateToScreen({
      type: menuId as any,
      module: 'designer',
      projectId: selectedProject?.id
    });
  };

  // 첫 번째 LNB 메뉴 찾기 헬퍼 함수
  const getFirstActiveMenu = (lnbConfigs: LNBConfig[]): string | null => {
    if (lnbConfigs.length === 0) return null;
    
    const firstMenu = lnbConfigs.find(config => config.isActive);
    if (!firstMenu) return null;
    
    // 부모 메뉴인 경우 첫 번째 자식 반환
    if (firstMenu.children && firstMenu.children.length > 0) {
      const firstChild = firstMenu.children.find(child => child.isActive);
      return firstChild ? firstChild.id : firstMenu.id;
    }
    
    return firstMenu.id;
  };

  // 앱 변경 처리
  const handleAppChange = (app: AppType) => {
    setSelectedApp(app);
    localStorage.setItem('selectedApp', app);
    
    switch (app) {
      case 'PROJECT':
        navigateToScreen({ type: 'projects', module: 'project' });
        break;
      case 'DESIGNER':
        // DESIGNER 앱으로 이동 (프로젝트가 선택된 경우)
        if (selectedProject) {
          // 첫 번째 LNB 메뉴로 이동
          const firstMenuId = getFirstActiveMenu(designerLNBConfigs);
          if (firstMenuId) {
            navigateToScreen({ type: firstMenuId as any, module: 'designer', projectId: selectedProject.id });
          } else {
            // LNB 설정이 없으면 dashboard로 fallback
          navigateToScreen({ type: 'dashboard', module: 'designer', projectId: selectedProject.id });
          }
        } else {
          navigateToScreen({ type: 'projects', module: 'project' });
        }
        break;
      case 'ADMIN':
        navigateToScreen({ type: 'admin-db', module: 'admin' });
        break;
      case 'MODELER':
        navigateToScreen({ type: 'modeler', module: 'modeler' });
        break;
      case 'VIEWER':
        navigateToScreen({ type: 'viewer', module: 'viewer' });
        break;
    }
  };

  // 인증되지 않은 경우 로그인 화면 표시
  if (!isAuthenticated || !currentTenant || !currentUser) {
    return <LoginView onLogin={login} isLoading={isLoading} />;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <Header
        currentView="main"
        onNavigate={() => {}}
        currentTenant={currentTenant}
        currentUser={currentUser}
        onLogout={logout}
        selectedApp={selectedApp}
        onAppChange={handleAppChange}
      />
      
      <main className="flex-1 overflow-hidden">
        <Routes>
          {/* PROJECT 앱 라우트 */}
          <Route path="/:tenantId/project/projects" element={
            <div className="h-full overflow-y-auto">
              <ProjectAppList 
                onProjectSelect={handleProjectSelect}
                tenantId={currentTenant?.id || ''}
              />
            </div>
          } />
          <Route path="/:tenantId/project/:projectId/dashboard" element={
            <div className="h-full">
              {selectedProject ? (
            <ProjectDashboard
              project={selectedProject}
                  selectedBridge={selectedBridge}
                  projects={projects}
                  onProjectChange={handleProjectSelect}
                  onBridgeChange={setSelectedBridge}
                  onProjectUpdate={async (updatedProject) => {
                    await projectService.updateProject(updatedProject);
                    const allProjects = await projectService.getAllProjects();
                    setProjects(allProjects);
                    setSelectedProject(updatedProject);
                  }}
                  onLNBMenuClick={handleProjectMenuClick}
                  activeMenu={activeProjectMenu}
                />
              ) : (
                <div className="p-6 text-center text-gray-500">
                  프로젝트를 선택해주세요.
                </div>
              )}
            </div>
          } />
          <Route path="/:tenantId/project/:projectId/project-settings" element={
            <div className="h-full">
              {selectedProject ? (
                <ProjectDashboard
                  project={selectedProject}
                  selectedBridge={selectedBridge}
                  projects={projects}
                  onProjectChange={handleProjectSelect}
                  onBridgeChange={setSelectedBridge}
                  onProjectUpdate={async (updatedProject) => {
                    await projectService.updateProject(updatedProject);
                    const allProjects = await projectService.getAllProjects();
                    setProjects(allProjects);
                    setSelectedProject(updatedProject);
                  }}
                  onLNBMenuClick={handleProjectMenuClick}
                  activeMenu="project-settings"
                />
              ) : (
                <div className="p-6 text-center text-gray-500">
                  프로젝트를 선택해주세요.
                </div>
              )}
            </div>
          } />

          {/* DESIGNER 앱 라우트 - Sidebar와 함께 렌더링 */}
          {/* 동적 LNB 메뉴 라우트 */}
          <Route path="/:tenantId/designer/:projectId/:screenId" element={
            <div className="flex h-full">
              <Sidebar
                activeMenu={activeDesignerMenu}
                onMenuSelect={handleDesignerMenuClick}
                selectedProject={selectedProject}
                selectedBridge={selectedBridge}
                projects={projects}
                onProjectChange={handleProjectSelect}
                onBridgeChange={setSelectedBridge}
                lnbConfigs={designerLNBConfigs}
                showProjectSelector={true}
              />
              <div className="flex-1 overflow-y-auto">
                {(() => {
                  // URL에서 screenId를 가져와서 해당 화면 찾기
                  const pathSegments = location.pathname.split('/').filter(Boolean);
                  const screenId = pathSegments[3];
                  
                  // LNB 설정에서 해당 메뉴 찾기
                  let menuConfig: LNBConfig | undefined;
                  for (const config of designerLNBConfigs) {
                    if (config.id === screenId) {
                      menuConfig = config;
                      break;
                    }
                    if (config.children) {
                      menuConfig = config.children.find(child => child.id === screenId);
                      if (menuConfig) break;
                    }
                  }
                  
                  // 시스템 화면인 경우
                  if (menuConfig?.systemScreenType) {
                    return (
                      <div className="p-6">
                        <div className="text-center">
                          <h1 className="text-3xl font-bold text-gray-900 mb-4">{menuConfig.displayName}</h1>
                          <p className="text-gray-600">시스템 화면 ({menuConfig.systemScreenType})</p>
                        </div>
                      </div>
                    );
                  }
                  
                  // 사용자 정의 화면인 경우
                  if (menuConfig?.screenId) {
                    const screen = screenService.getScreenById(menuConfig.screenId);
                    if (screen) {
                      return (
                        <ScreenRuntimeView 
                          screen={screen} 
                          lnbMenu={menuConfig}
                          selectedProject={selectedProject}
                          selectedBridge={selectedBridge}
                          onBridgeChange={setSelectedBridge}
                        />
                      );
                    }
                  }
                  
                  // 기본 화면
                  return (
                    <div className="p-6">
                      <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                          {menuConfig?.displayName || 'DESIGNER'}
                        </h1>
                        <p className="text-gray-600">화면이 구성되지 않았습니다.</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          } />

          {/* ADMIN 앱 라우트 - Sidebar와 함께 렌더링 */}
          <Route path="/admin/db" element={
            <div className="flex h-full">
              <Sidebar
                activeMenu={activeAdminMenu}
                onMenuSelect={handleAdminMenuClick}
                selectedProject={null}
                selectedBridge={null}
                projects={[]}
                onProjectChange={() => {}}
                onBridgeChange={() => {}}
                lnbConfigs={adminLNBConfig}
                showProjectSelector={false}
              />
              <div className="flex-1 overflow-y-auto">
                <DatabaseManager tenantId={currentTenant?.id || ''} />
              </div>
            </div>
          } />
          <Route path="/admin/field-definition" element={
            <div className="flex h-full">
              <Sidebar
                activeMenu={activeAdminMenu}
                onMenuSelect={handleAdminMenuClick}
                selectedProject={null}
                selectedBridge={null}
                projects={[]}
                onProjectChange={() => {}}
                onBridgeChange={() => {}}
                lnbConfigs={adminLNBConfig}
                showProjectSelector={false}
              />
              <div className="flex-1 overflow-y-auto">
                <FieldManager />
              </div>
            </div>
          } />
          <Route path="/admin/project-category" element={
            <div className="flex h-full">
              <Sidebar
                activeMenu={activeAdminMenu}
                onMenuSelect={handleAdminMenuClick}
                selectedProject={null}
                selectedBridge={null}
                projects={[]}
                onProjectChange={() => {}}
                onBridgeChange={() => {}}
                lnbConfigs={adminLNBConfig}
                showProjectSelector={false}
              />
              <div className="flex-1 overflow-y-auto">
                <ProjectCategoryManager />
              </div>
            </div>
          } />
          <Route path="/admin/table-definition" element={
            <div className="flex h-full">
              <Sidebar
                activeMenu={activeAdminMenu}
                onMenuSelect={handleAdminMenuClick}
                selectedProject={null}
                selectedBridge={null}
                projects={[]}
                onProjectChange={() => {}}
                onBridgeChange={() => {}}
                lnbConfigs={adminLNBConfig}
                showProjectSelector={false}
              />
              <div className="flex-1 overflow-y-auto">
                <TableManager />
              </div>
            </div>
          } />
          <Route path="/admin/variable-definition" element={
            <div className="flex h-full">
              <Sidebar
                activeMenu={activeAdminMenu}
                onMenuSelect={handleAdminMenuClick}
                selectedProject={null}
                selectedBridge={null}
                projects={[]}
                onProjectChange={() => {}}
                onBridgeChange={() => {}}
                lnbConfigs={adminLNBConfig}
                showProjectSelector={false}
              />
              <div className="flex-1 overflow-y-auto">
                <VariableManager />
              </div>
            </div>
          } />
          <Route path="/admin/function-definition" element={
            <div className="flex h-full">
              <Sidebar
                activeMenu={activeAdminMenu}
                onMenuSelect={handleAdminMenuClick}
                selectedProject={null}
                selectedBridge={null}
                projects={[]}
                onProjectChange={() => {}}
                onBridgeChange={() => {}}
                lnbConfigs={adminLNBConfig}
                showProjectSelector={false}
              />
              <div className="flex-1 overflow-y-auto">
                <FunctionManager />
              </div>
            </div>
          } />
          <Route path="/admin/screen-config" element={
            <div className="flex h-full">
              <Sidebar
                activeMenu={activeAdminMenu}
                onMenuSelect={handleAdminMenuClick}
                selectedProject={null}
                selectedBridge={null}
                projects={[]}
                onProjectChange={() => {}}
                onBridgeChange={() => {}}
                lnbConfigs={adminLNBConfig}
                showProjectSelector={false}
              />
              <div className="flex-1 overflow-y-auto">
                <ScreenManager />
              </div>
            </div>
          } />
          <Route path="/admin/lnb-config" element={
            <div className="flex h-full">
              <Sidebar
                activeMenu={activeAdminMenu}
                onMenuSelect={handleAdminMenuClick}
                selectedProject={null}
                selectedBridge={null}
                projects={[]}
                onProjectChange={() => {}}
                onBridgeChange={() => {}}
                lnbConfigs={adminLNBConfig}
                showProjectSelector={false}
              />
              <div className="flex-1 overflow-y-auto">
                <LnbManager />
              </div>
            </div>
          } />

          {/* MODELER 앱 라우트 */}
          <Route path="/:tenantId/modeler" element={
            <div className="flex items-center justify-center h-full bg-gray-50">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">MODELER</h1>
                <p className="text-gray-600">모델러 화면이 여기에 표시됩니다.</p>
              </div>
            </div>
          } />

          {/* VIEWER 앱 라우트 */}
          <Route path="/:tenantId/viewer" element={
            <div className="flex items-center justify-center h-full bg-gray-50">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">VIEWER</h1>
                <p className="text-gray-600">뷰어 화면이 여기에 표시됩니다.</p>
              </div>
            </div>
          } />

          {/* 기본 라우트 */}
          <Route path="/" element={<Navigate to={`/${currentTenant?.id}/project/projects`} replace />} />
          <Route path="/:tenantId" element={<Navigate to={`/${currentTenant?.id}/project/projects`} replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
