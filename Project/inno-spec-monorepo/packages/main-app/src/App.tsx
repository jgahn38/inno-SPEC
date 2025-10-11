import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Header, AppType, LoginView, Sidebar } from '@inno-spec/ui-lib';
import { TableManager, FieldManager, DatabaseManager, FunctionManager, VariableManager, ScreenManager, LnbManager } from '@inno-spec/admin-app';
import { ProjectDashboard, ProjectList as ProjectAppList } from '@inno-spec/project-app';
import { ScreenRuntimeView } from '@inno-spec/designer-app';
import { Project, Bridge, LNBConfig } from '@inno-spec/shared';
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
    id: 'admin-data-management',
    name: 'admin-data-management',
    displayName: '데이터 관리',
    icon: 'Database',
    order: 1,
    isActive: true,
    type: 'parent',
    children: [
      {
        id: 'admin-db',
        name: 'admin-db',
        displayName: '데이터베이스',
        icon: 'Database',
        order: 1,
        isActive: true,
        type: 'child'
      },
      {
        id: 'admin-fields',
        name: 'admin-fields',
        displayName: '필드 관리',
        icon: 'Variable',
        order: 2,
        isActive: true,
        type: 'child'
      },
      {
        id: 'admin-table-definition',
        name: 'admin-table-definition',
        displayName: '테이블 정의',
        icon: 'Table',
        order: 3,
        isActive: true,
        type: 'child'
      }
    ]
  },
  {
    id: 'admin-system-config',
    name: 'admin-system-config',
    displayName: '시스템 설정',
    icon: 'Settings',
    order: 2,
    isActive: true,
    type: 'parent',
    children: [
      {
        id: 'admin-variable-definition',
        name: 'admin-variable-definition',
        displayName: '변수 정의',
        icon: 'Variable',
        order: 1,
        isActive: true,
        type: 'child'
      },
      {
        id: 'admin-function-definition',
        name: 'admin-function-definition',
        displayName: '함수 정의',
        icon: 'Variable',
        order: 2,
        isActive: true,
        type: 'child'
      },
      {
        id: 'admin-screen-config',
        name: 'admin-screen-config',
        displayName: '화면 설정',
        icon: 'Settings',
        order: 3,
        isActive: true,
        type: 'child'
      },
      {
        id: 'admin-lnb-config',
        name: 'admin-lnb-config',
        displayName: 'LNB 설정',
        icon: 'Settings',
        order: 4,
        isActive: true,
        type: 'child'
      }
    ]
  }
];

function AppContent() {
  const { currentTenant, currentUser, isAuthenticated, logout, login, isLoading } = useTenant();
  const { } = useAPI();
  const [selectedApp, setSelectedApp] = useState<AppType>('PROJECT');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeAdminMenu, setActiveAdminMenu] = useState<string>('admin-db');
  const location = useLocation();
  const { navigateToScreen } = useURLRouting();

  // localStorage에서 선택된 프로젝트 복원
  useEffect(() => {
    const savedProjectId = localStorage.getItem('selectedProjectId');
    if (savedProjectId && !selectedProject) {
      // 실제 환경에서는 프로젝트 목록을 가져와서 해당 프로젝트를 찾아야 합니다
      // 임시로 더미 프로젝트 생성
      const dummyProject: Project = {
        id: savedProjectId,
        name: '프로젝트 1',
        description: '임시 프로젝트',
        tenantId: currentTenant?.id || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {}
      };
      setSelectedProject(dummyProject);
    }
  }, [currentTenant, selectedProject]);

  // URL 기반 앱 선택 및 ADMIN 메뉴 활성화
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
        case 'fields':
          setActiveAdminMenu('admin-fields');
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
          break;
        default:
          setActiveAdminMenu('admin-db');
      }
    } else if (pathSegments.length >= 2) {
      const module = pathSegments[1];
      switch (module) {
        case 'project':
          setSelectedApp('PROJECT');
          break;
        case 'designer':
          setSelectedApp('DESIGNER');
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
    // 프로젝트 선택 시 해당 앱의 대시보드로 이동
    navigateToScreen({ type: 'dashboard', module: 'project', projectId: project.id });
  };

  // ADMIN LNB 메뉴 클릭 처리
  const handleAdminMenuClick = (menuId: string) => {
    setActiveAdminMenu(menuId);
    
    switch (menuId) {
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
      case 'admin-screen-config':
        navigateToScreen({ type: 'admin-screen-config', module: 'admin' });
        break;
      case 'admin-lnb-config':
        navigateToScreen({ type: 'admin-lnb-config', module: 'admin' });
        break;
    }
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
          navigateToScreen({ type: 'dashboard', module: 'designer', projectId: selectedProject.id });
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
    <div className="min-h-screen bg-gray-50">
      <Header
        currentView="main"
        onNavigate={() => {}}
        currentTenant={currentTenant}
        currentUser={currentUser}
        onLogout={logout}
        selectedApp={selectedApp}
        onAppChange={handleAppChange}
      />
      
      <main className="flex-1">
        <Routes>
          {/* PROJECT 앱 라우트 */}
          <Route path="/:tenantId/project/projects" element={
            <ProjectAppList 
              onProjectSelect={handleProjectSelect}
              tenantId={currentTenant?.id || ''}
            />
          } />
          <Route path="/:tenantId/project/:projectId/dashboard" element={
            <ProjectDashboard
              project={selectedProject}
            />
          } />
          <Route path="/:tenantId/project/:projectId/project-settings" element={
            <ProjectAppList 
              onProjectSelect={handleProjectSelect}
              tenantId={currentTenant?.id || ''}
            />
          } />

          {/* DESIGNER 앱 라우트 */}
          <Route path="/:tenantId/designer/:projectId/dashboard" element={
            <div className="flex items-center justify-center h-[calc(100vh-56px)] bg-gray-50">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">DESIGNER 대시보드</h1>
                <p className="text-gray-600">디자이너 대시보드가 여기에 표시됩니다.</p>
                {selectedProject && (
                  <p className="text-sm text-gray-500 mt-2">프로젝트: {selectedProject.name}</p>
                )}
              </div>
            </div>
          } />
          <Route path="/:tenantId/designer/:projectId/screens" element={
            <div className="p-6">
              <ScreenRuntimeView
                screen={{
                  id: 'screens',
                  name: '화면 관리',
                  displayName: '화면 관리',
                  type: 'custom',
                  layout: 'single',
                  components: [],
                  dataStructure: 'project',
                  isActive: true,
                  createdAt: new Date(),
                  updatedAt: new Date()
                }}
                selectedProject={selectedProject}
              />
            </div>
          } />
          <Route path="/:tenantId/designer/screens" element={
            <div className="p-6">
              <ScreenRuntimeView
                screen={{
                  id: 'screens-list',
                  name: '화면 목록',
                  displayName: '화면 목록',
                  type: 'custom',
                  layout: 'single',
                  components: [],
                  dataStructure: 'project',
                  isActive: true,
                  createdAt: new Date(),
                  updatedAt: new Date()
                }}
                selectedProject={selectedProject}
              />
            </div>
          } />

          {/* ADMIN 앱 라우트 - Sidebar와 함께 렌더링 */}
          <Route path="/admin/db" element={
            <div className="flex h-[calc(100vh-56px)]">
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
          <Route path="/admin/fields" element={
            <div className="flex h-[calc(100vh-56px)]">
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
          <Route path="/admin/table-definition" element={
            <div className="flex h-[calc(100vh-56px)]">
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
            <div className="flex h-[calc(100vh-56px)]">
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
            <div className="flex h-[calc(100vh-56px)]">
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
            <div className="flex h-[calc(100vh-56px)]">
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
            <div className="flex h-[calc(100vh-56px)]">
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
            <div className="flex items-center justify-center h-[calc(100vh-56px)] bg-gray-50">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">MODELER</h1>
                <p className="text-gray-600">모델러 화면이 여기에 표시됩니다.</p>
              </div>
            </div>
          } />

          {/* VIEWER 앱 라우트 */}
          <Route path="/:tenantId/viewer" element={
            <div className="flex items-center justify-center h-[calc(100vh-56px)] bg-gray-50">
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
