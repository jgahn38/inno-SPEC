import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Header, AppType, LoginView } from '@inno-spec/ui-lib';
import { TableManager, FieldManager, DatabaseManager, FunctionManager, VariableManager, ScreenManager, LnbManager } from '@inno-spec/admin-app';
import { ProjectDashboard, ProjectList as ProjectAppList } from '@inno-spec/project-app';
import { Project, Bridge } from '@inno-spec/shared';
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

function AppContent() {
  const { currentTenant, currentUser, isAuthenticated, logout, login, isLoading } = useTenant();
  const { } = useAPI();
  const [selectedApp, setSelectedApp] = useState<AppType>('PROJECT');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const location = useLocation();
  const { navigateToScreen } = useURLRouting();

  // URL 기반 앱 선택
  useEffect(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    if (pathSegments.length >= 2) {
      const module = pathSegments[1];
      switch (module) {
        case 'project':
          setSelectedApp('PROJECT');
          break;
        case 'designer':
          setSelectedApp('DESIGNER');
          break;
        case 'admin':
          setSelectedApp('ADMIN');
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

          {/* ADMIN 앱 라우트 */}
          <Route path="/admin/database" element={<DatabaseManager tenantId={currentTenant?.id || ''} />} />
          <Route path="/admin/fields" element={<FieldManager />} />
          <Route path="/admin/table-definition" element={<TableManager />} />
          <Route path="/admin/variable-definition" element={<VariableManager />} />
          <Route path="/admin/function-definition" element={<FunctionManager />} />
          <Route path="/admin/screen-config" element={<ScreenManager />} />
          <Route path="/admin/lnb-config" element={<LnbManager />} />

          {/* 기본 라우트 */}
          <Route path="/" element={<Navigate to={`/${currentTenant?.id}/project/projects`} replace />} />
          <Route path="/:tenantId" element={<Navigate to={`/${currentTenant?.id}/project/projects`} replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
