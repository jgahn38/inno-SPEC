import React, { useState } from 'react';
import Header from './components/Header';
import ProjectList from './components/ProjectList';
import EvaluationView from './components/EvaluationView';
import TableManager from './components/TableManager';
import DatabaseManager from './components/DatabaseManager';
import LoginView from './components/LoginView';
import { Project } from './types';
import { TenantProvider, useTenant } from './contexts/TenantContext';

function AppContent() {
  const { currentTenant, currentUser, isAuthenticated, isLoading, logout } = useTenant();
  const [currentView, setCurrentView] = useState<'projects' | 'evaluation' | 'tables' | 'databases'>('projects');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setCurrentView('evaluation');
  };

  const handleNavigate = (view: 'projects' | 'evaluation' | 'tables' | 'databases') => {
    setCurrentView(view);
  };

  const handleLogout = () => {
    logout();
    setCurrentView('projects');
    setSelectedProject(null);
  };

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않은 경우 로그인 화면
  if (!isAuthenticated || !currentTenant || !currentUser) {
    return <LoginView />;
  }

  // 인증된 경우 메인 애플리케이션
  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        currentView={currentView}
        onNavigate={handleNavigate}
        currentTenant={currentTenant}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      
      <main className="flex-1" style={{ height: 'calc(100vh - 64px)' }}>
        {currentView === 'projects' ? (
          <ProjectList 
            onProjectSelect={handleProjectSelect}
            tenantId={currentTenant.id}
          />
        ) : currentView === 'evaluation' && selectedProject ? (
          <EvaluationView 
            project={selectedProject} 
          />
        ) : currentView === 'tables' ? (
          <TableManager 
            tenantId={currentTenant.id}
            projectId={selectedProject?.id || 'default'}
          />
        ) : currentView === 'databases' ? (
          <DatabaseManager 
            tenantId={currentTenant.id}
            projectId={selectedProject?.id || 'default'}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">프로젝트를 선택해주세요.</p>
          </div>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <TenantProvider>
      <AppContent />
    </TenantProvider>
  );
}

export default App;