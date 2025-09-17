import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { Header, AppType } from '@inno-spec/ui-lib';
import ProjectList from './components/ProjectList';
import Dashboard from './components/Dashboard';
import { TableManager, FieldManager, DatabaseManager, FunctionManager, VariableManager, ScreenManager, LnbManager } from '@inno-spec/admin-app';
import DataSyncManager from './components/DataSyncManager';
// ScreenCanvas는 현재 사용하지 않음
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

// 사용자가 생성한 화면을 표시하는 컴포넌트
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
    <ScreenRuntimeView 
      screen={screen} 
      lnbMenu={lnbMenu}
      selectedProject={selectedProject}
    />
  );
};

// LNBConfig 타입 정의
interface LNBConfig {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  order: number;
  isActive: boolean;
  parentId: string;
  isParent: boolean;
  type: string;
  screenId: string;
  systemScreenType: string;
  children: LNBConfig[];
  createdAt: Date;
  updatedAt: Date;
}

function AppContent() {
  const { currentRoute, navigateToProject, navigateToScreen } = useURLRouting();
  const { selectedProject, setSelectedProject } = useTenant();
  const { projects, loadProjects, createProject, updateProject, deleteProject } = useAPI();
  const [isLoading, setIsLoading] = useState(true);
  const [lnbMenu, setLnbMenu] = useState<LNBConfig[]>([]);

  // 프로젝트 서비스 초기화
  useEffect(() => {
    const projectProvider = new LocalStorageProjectProvider();
    const projectService = new ProjectService(projectProvider);
    
    // 프로젝트 서비스를 전역으로 사용할 수 있도록 설정
    (window as any).projectService = projectService;
  }, []);

  // 기본 LNB 설정 초기화
  useEffect(() => {
    const initializeDefaultLNBConfig = () => {
      const existingConfigs = JSON.parse(localStorage.getItem('lnbConfigs') || '[]');
      
      const needsUpdate = existingConfigs.length === 0 || 
        !existingConfigs.some((config: any) => config.systemScreenType);
      
      if (needsUpdate) {
        const defaultLNBConfigs: LNBConfig[] = [
          {
            id: 'dashboard',
            name: 'dashboard',
            displayName: '대시보드',
            icon: '📊',
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
            displayName: '화면 관리',
            icon: '🖼️',
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
            displayName: '도면 관리',
            icon: '📐',
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
            displayName: '프로젝트 설정',
            icon: '⚙️',
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
        
        // 디버깅을 위해 전역 함수로 설정
        (window as any).resetLNBConfigs = () => {
          localStorage.removeItem('lnbConfigs');
          window.location.reload();
        };
      }
    };

    initializeDefaultLNBConfig();
  }, []);

  // 프로젝트 목록을 로드하고 URL 또는 localStorage에서 프로젝트 자동 선택
  useEffect(() => {
    
    if (projects.length > 0) {
      // 먼저 URL에서 projectId를 확인
      let projectId = currentRoute.projectId;
      
      // URL에 projectId가 없으면 localStorage에서 가져옴
      if (!projectId) {
        projectId = localStorage.getItem('selectedProjectId');
      }
      
      
      if (projectId) {
        const project = projects.find(p => p.id === projectId);
        
        if (project) {
          setSelectedProject(project);
        } else {
          // 프로젝트가 없으면 첫 번째 프로젝트 선택
          setSelectedProject(projects[0]);
          localStorage.setItem('selectedProjectId', projects[0].id);
        }
      } else {
        // projectId가 없으면 첫 번째 프로젝트 선택
        setSelectedProject(projects[0]);
        localStorage.setItem('selectedProjectId', projects[0].id);
      }
      
      setIsLoading(false);
    }
  }, [projects, currentRoute.projectId, setSelectedProject]);

  // LNB 메뉴 로드
  useEffect(() => {
    const loadLNBConfig = () => {
      const configs = JSON.parse(localStorage.getItem('lnbConfigs') || '[]');
      setLnbMenu(configs);
    };

    loadLNBConfig();
    
    // LNB 설정 변경 감지
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'lnbConfigs') {
        loadLNBConfig();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // 프로젝트 변경 시 URL 업데이트
  useEffect(() => {
    if (selectedProject && currentRoute.projectId !== selectedProject.id) {
      navigateToProject(selectedProject.id);
    }
  }, [selectedProject, currentRoute.projectId, navigateToProject]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 로그인 상태 확인 (간단한 구현)
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  if (!isLoggedIn) {
    return <LoginView />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        lnbMenu={lnbMenu}
        selectedProject={selectedProject}
        onProjectChange={setSelectedProject}
        onMenuClick={(menu) => {
          if (menu.systemScreenType === 'dashboard') {
            navigateToProject(selectedProject?.id || '', 'dashboard');
          } else if (menu.systemScreenType === 'screens') {
            navigateToProject(selectedProject?.id || '', 'screens');
          } else if (menu.systemScreenType === 'illustration') {
            navigateToProject(selectedProject?.id || '', 'illustration');
          } else if (menu.systemScreenType === 'project-settings') {
            navigateToProject(selectedProject?.id || '', 'project-settings');
          } else if (menu.screenId) {
            navigateToScreen(selectedProject?.id || '', menu.screenId);
          }
        }}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
          appType={AppType.DESIGNER}
          selectedProject={selectedProject}
          onProjectChange={setSelectedProject}
        />
        
        {selectedProject ? (
          <Routes>
            {/* 프로젝트 목록 */}
            <Route path="/" element={
              <ProjectList 
                projects={projects}
                selectedProject={selectedProject}
                onProjectSelect={setSelectedProject}
                onProjectCreate={createProject}
                onProjectUpdate={updateProject}
                onProjectDelete={deleteProject}
              />
            } />
            
            {/* 대시보드 */}
            <Route path="/project/:projectId/dashboard" element={
              <Dashboard 
                project={selectedProject}
                onProjectUpdate={updateProject}
              />
            } />
            
            {/* 화면 관리 */}
            <Route path="/project/:projectId/screens" element={
              <div className="flex-1 p-6">
                <ScreenManager 
                  projectId={selectedProject.id}
                  onScreenUpdate={() => {
                    // 화면 업데이트 후 LNB 메뉴 다시 로드
                    const configs = JSON.parse(localStorage.getItem('lnbConfigs') || '[]');
                    setLnbMenu(configs);
                  }}
                />
              </div>
            } />
            
            {/* 도면 관리 */}
            <Route path="/project/:projectId/illustration" element={
              <IllustrationView 
                project={selectedProject}
                onProjectUpdate={updateProject}
              />
            } />
            
            {/* 프로젝트 설정 */}
            <Route path="/project/:projectId/settings" element={
              <ProjectSettings 
                project={selectedProject}
                onProjectUpdate={updateProject}
              />
            } />
            
            {/* 사용자 생성 화면 */}
            <Route path="/project/:projectId/screen/:screenId" element={
              <UserScreenView 
                screenId={currentRoute.screenId || ''}
                lnbMenu={lnbMenu}
                selectedProject={selectedProject}
              />
            } />
            
            {/* 데이터 동기화 관리 */}
            <Route path="/project/:projectId/sync" element={
              <DataSyncManager 
                project={selectedProject}
                onProjectUpdate={updateProject}
              />
            } />
            
            {/* 관리자 도구들 */}
            <Route path="/project/:projectId/admin/tables" element={
              <div className="flex-1 p-6">
                <TableManager projectId={selectedProject.id} />
              </div>
            } />
            
            <Route path="/project/:projectId/admin/fields" element={
              <div className="flex-1 p-6">
                <FieldManager projectId={selectedProject.id} />
              </div>
            } />
            
            <Route path="/project/:projectId/admin/database" element={
              <div className="flex-1 p-6">
                <DatabaseManager projectId={selectedProject.id} />
              </div>
            } />
            
            <Route path="/project/:projectId/admin/functions" element={
              <div className="flex-1 p-6">
                <FunctionManager projectId={selectedProject.id} />
              </div>
            } />
            
            <Route path="/project/:projectId/admin/variables" element={
              <div className="flex-1 p-6">
                <VariableManager projectId={selectedProject.id} />
              </div>
            } />
            
            <Route path="/project/:projectId/admin/lnb" element={
              <div className="flex-1 p-6">
                <LnbManager 
                  projectId={selectedProject.id}
                  onLNBUpdate={() => {
                    // LNB 업데이트 후 메뉴 다시 로드
                    const configs = JSON.parse(localStorage.getItem('lnbConfigs') || '[]');
                    setLnbMenu(configs);
                  }}
                />
              </div>
            } />
            
            {/* 기본 대시보드로 리다이렉트 */}
            <Route path="/project/:projectId" element={
              <Navigate to={`/project/${selectedProject.id}/dashboard`} replace />
            } />
            
            {/* 프로젝트가 선택되지 않은 경우 */}
            <Route path="*" element={
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">프로젝트를 선택해주세요.</p>
              </div>
            } />
          </Routes>
        ) : (
          <div className="flex-1 p-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">프로젝트 관리</h2>
              <ProjectList 
                projects={projects}
                selectedProject={selectedProject}
                onProjectSelect={setSelectedProject}
                onProjectCreate={createProject}
                onProjectUpdate={updateProject}
                onProjectDelete={deleteProject}
              />
            </div>
          </div>
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
