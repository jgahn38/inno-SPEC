import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Header, AppType, Sidebar, LoginView } from '@inno-spec/ui-lib';
import ScreenRuntimeView from './components/ScreenRuntimeView';
import { Project, Bridge } from '@inno-spec/shared';
import { TenantProvider, useTenant } from '@inno-spec/core';
import { APIProvider, useAPI } from '@inno-spec/core';
import { useURLRouting } from '@inno-spec/core';
import { ProjectService } from './services/ProjectService';
import { LocalStorageProjectProvider } from '@inno-spec/core';

// DESIGNER 앱 - 순수한 DESIGNER 기능만 담당 (화면 구성, 브릿지 관리 등)
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

function AppContent() {
  const { currentTenant, currentUser, isAuthenticated, logout, login, isLoading } = useTenant();
  const { lnbConfigs } = useAPI();
  const [selectedApp] = useState<AppType>('DESIGNER');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedBridge, setSelectedBridge] = useState<Bridge | null>(null);
  const [activeMenu, setActiveMenu] = useState<string>('dashboard');
  const location = useLocation();
  const { getScreenFromPath, navigateToScreen } = useURLRouting();

  // 프로젝트 서비스 초기화
  const [projectService] = useState(() => new ProjectService(new LocalStorageProjectProvider()));

  // 프로젝트 로드
  useEffect(() => {
    const loadProject = async () => {
      const projectId = localStorage.getItem('selectedProjectId');
      if (projectId) {
        try {
          const projects = await projectService.getAllProjects();
        const project = projects.find(p => p.id === projectId);
        if (project) {
            setSelectedProject(project);
          }
        } catch (error) {
          console.error('Failed to load project:', error);
        }
      }
    };
    loadProject();
  }, [projectService]);

  // URL 기반 메뉴 선택
  useEffect(() => {
    const screen = getScreenFromPath(location.pathname);
    if (screen) {
      setActiveMenu(screen.type);
    }
  }, [location.pathname, getScreenFromPath]);

  // 프로젝트 변경 처리
  const handleProjectChange = (project: Project) => {
    setSelectedProject(project);
    localStorage.setItem('selectedProjectId', project.id);
  };

  // 브릿지 변경 처리
  const handleBridgeChange = (bridge: Bridge) => {
    setSelectedBridge(bridge);
  };

  // LNB 메뉴 선택 처리
  const handleLNBMenuClick = (menuId: string) => {
    setActiveMenu(menuId);
    navigateToScreen({
      type: menuId as any,
      module: 'designer',
      projectId: selectedProject?.id
    });
  };

  // 인증되지 않은 경우 로그인 화면 표시
  if (!isAuthenticated || !currentTenant || !currentUser) {
    return <LoginView onLogin={login} isLoading={isLoading} />;
  }

  // 프로젝트가 선택되지 않은 경우 프로젝트 선택 화면으로 리다이렉트
  if (!selectedProject) {
    return <Navigate to={`/${currentTenant.id}/project/projects`} replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
        <Header 
        currentView="designer"
          onNavigate={() => {}}
        currentTenant={currentTenant}
        currentUser={currentUser}
        onLogout={logout}
        selectedApp={selectedApp}
        onAppChange={() => {}}
      />
      
      <div className="flex">
        {/* LNB 사이드바 */}
              <Sidebar
          activeMenu={activeMenu}
          onMenuSelect={handleLNBMenuClick}
                selectedProject={selectedProject}
          projects={[selectedProject]}
          onProjectChange={handleProjectChange}
          onBridgeChange={handleBridgeChange}
                  selectedBridge={selectedBridge}
                  lnbConfigs={lnbConfigs}
                showProjectSelector={true}
                />
        
        {/* 메인 콘텐츠 */}
        <main className="flex-1 p-6">
          <Routes>
            {/* DESIGNER 앱 라우트 */}
            <Route path="/:tenantId/designer/:projectId/dashboard" element={
              <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">DESIGNER 대시보드</h1>
                <p className="text-gray-600">프로젝트: {selectedProject?.name}</p>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-lg font-semibold mb-4">화면 구성</h2>
                  <p className="text-gray-600">화면 구성 기능이 여기에 표시됩니다.</p>
              </div>
            </div>
          } />
          
            <Route path="/:tenantId/designer/:projectId/screens" element={
              <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">화면 관리</h1>
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
          
            <Route path="/:tenantId/designer/:projectId/bridges" element={
              <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">브릿지 관리</h1>
                <div className="bg-white p-6 rounded-lg shadow">
                  <p className="text-gray-600">브릿지 관리 기능이 여기에 표시됩니다.</p>
              </div>
            </div>
          } />
          
            <Route path="/:tenantId/designer/:projectId/settings" element={
              <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">설정</h1>
                <div className="bg-white p-6 rounded-lg shadow">
                  <p className="text-gray-600">설정 기능이 여기에 표시됩니다.</p>
              </div>
            </div>
          } />
          
            {/* 기본 라우트 */}
            <Route path="/:tenantId/designer" element={
              <Navigate to={`/${currentTenant.id}/designer/${selectedProject.id}/dashboard`} replace />
            } />
            <Route path="/:tenantId/designer/:projectId" element={
              <Navigate to={`/${currentTenant.id}/designer/${selectedProject.id}/dashboard`} replace />
          } />
            </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
