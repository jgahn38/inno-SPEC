import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ProjectList from './components/ProjectList';
import Dashboard from './components/Dashboard';
import { TableManager, DatabaseManager } from '@inno-spec/database-app';
import FunctionsManager from './components/FunctionsManager';
import DataSyncManager from './components/DataSyncManager';
import ScreenManager from './components/ScreenManager';
// ScreenCanvas는 현재 사용되지 않음
import ScreenRuntimeView from './components/ScreenRuntimeView';
import Sidebar from './components/Sidebar';
import LoginView from './components/LoginView';
import IllustrationView from './components/IllustrationView';
import ProjectSettings from './components/ProjectSettings';
import { Project, Bridge } from '@inno-spec/shared';
import { TenantProvider, useTenant } from './contexts/TenantContext';
import { ProjectService } from './services/ProjectService';
import { LocalStorageProjectProvider } from './services/dataProviders/LocalStorageProjectProvider';
import { screenService } from './services/ScreenService';

// 사용자 생성 화면을 표시하는 컴포넌트
const UserScreenView: React.FC<{ 
  screenId: string; 
  lnbMenu: any;
  selectedProject: Project | null;
  selectedBridge: Bridge | null;
  projects: Project[];
  onProjectChange: (project: Project) => void;
  onBridgeChange: (bridge: Bridge) => void;
  onLNBMenuClick: (menuId: string) => void;
}> = ({ 
  screenId, 
  lnbMenu,
  selectedProject, 
  selectedBridge, 
  projects, 
  onProjectChange, 
  onBridgeChange, 
  onLNBMenuClick 
}) => {
  const screen = screenService.getScreenById(screenId);
  
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
    <div className="flex h-full">
      <Sidebar 
        activeMenu="user-screen" 
        onMenuSelect={() => {}}
        selectedProject={selectedProject}
        selectedBridge={selectedBridge}
        projects={projects}
        onProjectChange={onProjectChange}
        onBridgeChange={onBridgeChange}
        onLNBMenuClick={onLNBMenuClick}
      />
      <div className="flex-1 bg-gray-50 overflow-auto">
        <ScreenRuntimeView screen={screen} lnbMenu={lnbMenu} selectedProject={selectedProject} />
      </div>
    </div>
  );
};

type AppType = 'DESIGNER' | 'MODELER' | 'VIEWER' | 'DATABASE';

function AppContent() {
  const { currentTenant, currentUser, isAuthenticated, logout } = useTenant();
  const [selectedApp, setSelectedApp] = useState<AppType>('DESIGNER');
  const [currentView, setCurrentView] = useState<'projects' | 'evaluation' | 'tables' | 'databases' | 'sync' | 'functions' | 'screens' | 'settings' | 'user-screen' | 'illustration' | 'project-settings' | 'no-screen' | 'dashboard'>('projects');
  const [currentUserScreen, setCurrentUserScreen] = useState<string | null>(null);
  const [currentLNBMenu, setCurrentLNBMenu] = useState<any>(null);
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
    setCurrentView('dashboard');
  };

  const handleNavigate = (view: 'projects' | 'evaluation' | 'tables' | 'databases' | 'sync' | 'functions' | 'screens' | 'settings' | 'user-screen' | 'illustration' | 'project-settings' | 'no-screen' | 'dashboard') => {
    console.log('Navigating to:', view); // 디버깅용 로그
    // 사용자 생성 화면이 아닌 경우 currentUserScreen 초기화
    if (view !== 'user-screen') {
      setCurrentUserScreen(null);
    }
    setCurrentView(view);
  };

  const handleAppChange = (app: AppType) => {
    setSelectedApp(app);
    // 앱 변경 시 기본 뷰로 초기화
    if (app === 'DESIGNER') {
      setCurrentView('projects');
    } else if (app === 'DATABASE') {
      setCurrentView('databases');
    }
    // MODELER, VIEWER는 별도 화면이므로 currentView는 그대로 유지
  };

  const handleLNBMenuClick = (menuId: string) => {
    console.log('LNB Menu clicked:', menuId);
    
    // Sidebar에서 변환된 메뉴 이름을 원래 이름으로 복원
    const actualMenuId = menuId === 'settings' ? 'project-settings' : menuId;
    console.log('Actual menu ID:', actualMenuId);
    
    // LNB 설정에서 해당 메뉴 찾기
    const lnbConfigs = screenService.getLNBConfigs();
    console.log('Available LNB configs:', lnbConfigs);
    let targetLNB: any = null;
    
    // 모든 LNB 설정을 순회하며 해당 메뉴 찾기
    for (const top of lnbConfigs) {
      // 상위 메뉴 자체가 일치하는지 확인
      if (top.name === actualMenuId) {
        targetLNB = top;
        break;
      }
      // 하위 메뉴에서 찾기
      if (top.children) {
        for (const child of top.children) {
          if (child.name === actualMenuId) {
            targetLNB = child;
            break;
          }
        }
      }
      if (targetLNB) break;
    }
    
    if (targetLNB) {
      // 시스템 화면인 경우
      if (targetLNB.systemScreenType) {
        console.log('System screen type:', targetLNB.systemScreenType);
        // 사용자 생성 화면 상태 초기화
        setCurrentUserScreen(null);
        setCurrentLNBMenu(null);
        
        // 시스템 화면 타입에 따라 적절한 view로 이동
        switch (targetLNB.systemScreenType) {
          case 'dashboard':
            setCurrentView('dashboard'); // 대시보드는 대시보드 화면으로
            break;
          case 'project-settings':
            setCurrentView('project-settings'); // 프로젝트 설정은 프로젝트 설정 화면으로
            break;
          case 'section-library':
            setCurrentView('illustration'); // 단면 라이브러리는 단면 라이브러리 화면으로
            break;
          case 'user-profile':
            setCurrentView('settings'); // 사용자 프로필은 설정으로
            break;
          case 'system-settings':
            setCurrentView('settings'); // 시스템 설정은 설정으로
            break;
          default:
            console.log('Unknown system screen type:', targetLNB.systemScreenType);
            // 알 수 없는 시스템 화면 타입인 경우 기본 화면으로
            setCurrentView('projects');
        }
      }
      // 사용자 생성 화면인 경우
      else if (targetLNB.screenId) {
        console.log('User screen ID:', targetLNB.screenId);
        // LNB 메뉴 정보 저장
        setCurrentLNBMenu(targetLNB);
        // 사용자 생성 화면으로 이동
        setCurrentUserScreen(targetLNB.screenId);
        
        // 프로젝트가 선택되어 있지 않다면 첫 번째 프로젝트 선택
        if (!selectedProject && projects.length > 0) {
          setSelectedProject(projects[0]);
          // 프로젝트의 첫 번째 교량도 선택
          if (projects[0].bridges && projects[0].bridges.length > 0) {
            setSelectedBridge(projects[0].bridges[0]);
          }
        }
        
        setCurrentView('user-screen');
      }
      // 화면이 연결되지 않은 경우
      else {
        console.log('No screen connected to this LNB menu - showing no screen message');
        // 사용자 생성 화면 상태 초기화
        setCurrentUserScreen(null);
        setCurrentLNBMenu(null);
        // "화면 연결 없음" 메시지를 표시하는 특별한 뷰로 이동
        setCurrentView('no-screen');
      }
    } else {
      console.log('LNB menu not found:', menuId);
      // 사용자 생성 화면 상태 초기화
      setCurrentUserScreen(null);
      // LNB 메뉴를 찾지 못한 경우에만 기본 화면으로 이동
      setCurrentView('projects');
    }
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
        selectedApp={selectedApp}
        onAppChange={handleAppChange}
      />
      
      <main className="flex-1" style={{ height: 'calc(100vh - 64px)' }}>
        {(() => { console.log('Current view:', currentView); return null; })()}
        
        {/* MODELER 앱 선택 시 */}
        {selectedApp === 'MODELER' ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">🏗️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">MODELER</h2>
              <p className="text-gray-600 mb-4">3D 모델링 및 설계 도구</p>
              <p className="text-sm text-gray-500">현재 개발 중입니다. 곧 만나보실 수 있습니다.</p>
            </div>
          </div>
        ) : selectedApp === 'VIEWER' ? (
          /* VIEWER 앱 선택 시 */
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">👁️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">VIEWER</h2>
              <p className="text-gray-600 mb-4">3D 뷰어 및 시각화 도구</p>
              <p className="text-sm text-gray-500">현재 개발 중입니다. 곧 만나보실 수 있습니다.</p>
            </div>
          </div>
        ) : currentView === 'projects' ? (
          <ProjectList 
            onProjectSelect={handleProjectSelect}
            tenantId={currentTenant.id}
          />
        ) : currentView === 'dashboard' && selectedProject ? (
          <Dashboard 
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
            onLNBMenuClick={handleLNBMenuClick}
          />
        ) : currentView === 'tables' ? (
          <TableManager />
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
        ) : currentView === 'user-screen' && currentUserScreen ? (
          <UserScreenView 
            screenId={currentUserScreen}
            lnbMenu={currentLNBMenu}
            selectedProject={selectedProject}
            selectedBridge={selectedBridge}
            projects={projects}
            onProjectChange={setSelectedProject}
            onBridgeChange={(bridge) => {
              setSelectedBridge(bridge);
              console.log('Selected bridge:', bridge);
            }}
            onLNBMenuClick={handleLNBMenuClick}
          />
        ) : currentView === 'settings' ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">설정</h2>
              <p className="text-gray-600">시스템 설정 페이지입니다.</p>
            </div>
          </div>
        ) : currentView === 'illustration' ? (
          <div className="flex h-full">
            <Sidebar
              activeMenu="illustration"
              onMenuSelect={() => {}}
              selectedProject={selectedProject}
              selectedBridge={selectedBridge}
              projects={projects}
              onProjectChange={setSelectedProject}
              onBridgeChange={(bridge) => {
                setSelectedBridge(bridge);
                console.log('Selected bridge:', bridge);
              }}
              onLNBMenuClick={handleLNBMenuClick}
            />
            <div className="flex-1 bg-gray-50 overflow-auto">
              <IllustrationView />
            </div>
          </div>
        ) : currentView === 'project-settings' && selectedProject ? (
          <div className="flex h-full">
            <Sidebar
              activeMenu="project-settings"
              onMenuSelect={() => {}}
              selectedProject={selectedProject}
              selectedBridge={selectedBridge}
              projects={projects}
              onProjectChange={setSelectedProject}
              onBridgeChange={(bridge) => {
                setSelectedBridge(bridge);
                console.log('Selected bridge:', bridge);
              }}
              onLNBMenuClick={handleLNBMenuClick}
            />
            <div className="flex-1 bg-gray-50 overflow-auto">
              <ProjectSettings 
                project={selectedProject}
                onProjectUpdate={async (updatedProject) => {
                  try {
                    await projectService.updateProject(updatedProject);
                    setSelectedProject(updatedProject);
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
            </div>
          </div>
        ) : currentView === 'project-settings' ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">프로젝트를 선택해주세요.</p>
          </div>
        ) : currentView === 'no-screen' ? (
          <div className="flex h-full">
            <Sidebar
              activeMenu="no-screen"
              onMenuSelect={() => {}}
              selectedProject={selectedProject}
              selectedBridge={selectedBridge}
              projects={projects}
              onProjectChange={setSelectedProject}
              onBridgeChange={(bridge) => {
                setSelectedBridge(bridge);
                console.log('Selected bridge:', bridge);
              }}
              onLNBMenuClick={handleLNBMenuClick}
            />
            <div className="flex-1 bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">📋</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">화면 연결 없음</h2>
                <p className="text-gray-600">이 메뉴에는 연결된 화면이 없습니다.</p>
                <p className="text-sm text-gray-500 mt-2">화면 관리에서 화면을 연결하거나 다른 메뉴를 선택해주세요.</p>
              </div>
            </div>
          </div>
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