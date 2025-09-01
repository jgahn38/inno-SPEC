import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ProjectList from './components/ProjectList';
import EvaluationView from './components/EvaluationView';
import TableManager from './components/TableManager';
import DatabaseManager from './components/DatabaseManager';
import FunctionsManager from './components/FunctionsManager';
import DataSyncManager from './components/DataSyncManager';
import ScreenManager from './components/ScreenManager';
import LoginView from './components/LoginView';
import { Project, Bridge } from './types';
import { TenantProvider, useTenant } from './contexts/TenantContext';
import { ProjectService } from './services/ProjectService';
import { LocalStorageProjectProvider } from './services/dataProviders/LocalStorageProjectProvider';

function AppContent() {
  const { currentTenant, currentUser, isAuthenticated, isLoading, logout } = useTenant();
  const [currentView, setCurrentView] = useState<'projects' | 'evaluation' | 'tables' | 'databases' | 'sync' | 'functions' | 'screens' | 'settings'>('projects');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedBridge, setSelectedBridge] = useState<Bridge | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectService] = useState(() => new ProjectService(new LocalStorageProjectProvider()));

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    // 프로젝트의 첫 번째 교량을 기본 선택
    if (project.bridges && project.bridges.length > 0) {
      setSelectedBridge(project.bridges[0]);
    } else {
      setSelectedBridge(null);
    }
    setCurrentView('evaluation');
  };

  const handleNavigate = (view: 'projects' | 'evaluation' | 'tables' | 'databases' | 'sync' | 'functions' | 'screens' | 'settings') => {
    console.log('Navigating to:', view); // 디버깅용 로그
    setCurrentView(view);
  };

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
    setCurrentView('projects');
    setSelectedProject(null);
    setSelectedBridge(null);
    setProjects([]);
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
        {(() => { console.log('Current view:', currentView); return null; })()}
        {currentView === 'projects' ? (
          <ProjectList 
            onProjectSelect={handleProjectSelect}
            tenantId={currentTenant.id}
          />
        ) : currentView === 'evaluation' && selectedProject ? (
          <EvaluationView 
            project={selectedProject} 
            selectedBridge={selectedBridge}
            projects={projects}
            onProjectChange={setSelectedProject}
            onBridgeChange={(bridge) => {
              setSelectedBridge(bridge);
              console.log('Selected bridge:', bridge);
            }}
            onProjectUpdate={async (updatedProject) => {
              try {
                await projectService.updateProject(updatedProject);
                setSelectedProject(updatedProject);
                // 새로 추가된 교량이 있다면 첫 번째 교량 선택
                if (updatedProject.bridges && updatedProject.bridges.length > 0) {
                  if (!selectedBridge || !updatedProject.bridges.find(b => b.id === selectedBridge.id)) {
                    setSelectedBridge(updatedProject.bridges[0]);
                  }
                }
                // 프로젝트 목록도 업데이트
                const allProjects = await projectService.getAllProjects();
                setProjects(allProjects);
                console.log('Project updated:', updatedProject);
              } catch (error) {
                console.error('Failed to update project:', error);
                alert('프로젝트 업데이트에 실패했습니다.');
              }
            }}
          />
        ) : currentView === 'tables' ? (
          <TableManager 
            tenantId={currentTenant.id}
            projectId={selectedProject?.id || 'default'}
          />
        ) : currentView === 'databases' ? (
          <DatabaseManager 
            tenantId={currentTenant.id}
          />
        ) : currentView === 'functions' ? (
          <FunctionsManager />
        ) : currentView === 'screens' ? (
          <ScreenManager />
        ) : currentView === 'sync' ? (
          <DataSyncManager />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">프로젝트를 선택해주세요. (현재 뷰: {currentView})</p>
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