import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header, AppType } from '@inno-spec/ui-lib';
import ProjectList from './components/ProjectList';
import Dashboard from './components/Dashboard';
import { TableManager, DatabaseManager, FunctionsManager, ScreenManager } from '@inno-spec/admin-app';
import DataSyncManager from './components/DataSyncManager';
// ScreenCanvas는 현재 사용되지 않음
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
  const [selectedApp, setSelectedApp] = useState<AppType>('DESIGNER');
  const [currentUserScreen, setCurrentUserScreen] = useState<string | null>(null);
  const [currentLNBMenu, setCurrentLNBMenu] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedBridge, setSelectedBridge] = useState<Bridge | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  
  // URL 변경에 따른 화면 처리
  useEffect(() => {
    console.log('Current route changed:', currentRoute);
    
    // 기본 라우트가 dashboard인 경우 projects로 리다이렉트
    if (currentRoute.type === 'dashboard' && !selectedProject) {
      navigateToScreen({ type: 'projects', module: 'designer', projectId: selectedProject?.id });
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

  // LNB 메뉴 name을 가져오는 함수
  const getActiveMenuName = (): string => {
    if (currentLNBMenu) {
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
      // ADMIN 메뉴들
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

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    // 프로젝트의 첫 번째 교량을 기본 선택
    if (project.bridges && project.bridges.length > 0) {
      setSelectedBridge(project.bridges[0]);
    } else {
      setSelectedBridge(null);
    }
    // 프로젝트 ID를 포함한 대시보드로 이동
    navigateToScreen({ type: 'dashboard', module: 'designer', projectId: project.id });
  };

  const handleAppChange = (app: AppType) => {
    setSelectedApp(app);
    // 앱 변경 시 기본 뷰로 초기화
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
    console.log('LNB Menu clicked:', menuId);
    
    // ADMIN 앱인 경우 adminLNBConfig 사용
    const currentLNBConfigs = selectedApp === 'ADMIN' ? adminLNBConfig : lnbConfigs;
    
    // LNB 설정에서 해당 메뉴 찾기
    let targetLNB: any = null;
    
    // 모든 LNB 설정을 순회하며 해당 메뉴 찾기
    for (const top of currentLNBConfigs) {
      // 상위 메뉴 자체가 일치하는지 확인 (name 또는 id로 검색)
      if (top.name === menuId || top.id === menuId) {
        targetLNB = top;
        break;
      }
      // 하위 메뉴에서 찾기 (name 또는 id로 검색)
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
      console.log('Found target LNB:', targetLNB);
      
      // 시스템 화면인 경우
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
          // ADMIN 시스템 화면들
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
      // 사용자 생성 화면인 경우
      else if (targetLNB.screenId) {
        navigateToScreen({ type: 'user-screen', module: 'designer', projectId: selectedProject?.id, screenId: targetLNB.screenId });
      }
      // 화면이 연결되지 않은 경우
      else {
        navigateToScreen({ type: 'no-screen', module: 'designer', projectId: selectedProject?.id });
      }
    } else {
      console.log('LNB menu not found:', menuId);
      navigateToScreen({ type: 'projects', module: 'designer', projectId: selectedProject?.id });
    }
  }, [lnbConfigs, navigateToScreen, selectedProject]);

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
                onMenuSelect={() => {}}
                selectedProject={null}
                projects={[]}
                onProjectChange={() => {}}
                onBridgeChange={() => {}}
                selectedBridge={null}
                onLNBMenuClick={handleLNBMenuClick}
                lnbConfigs={adminLNBConfig}
              />
              <div className="flex-1 bg-gray-50 overflow-auto">
                <Routes>
                  <Route path="/admin/db" element={<DatabaseManager tenantId={currentTenant?.id || ''} />} />
                  <Route path="/admin/fields" element={
                    <div className="p-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">필드 정의</h2>
                      <TableManager showOnly="fields" />
                    </div>
                  } />
                  <Route path="/admin/tables" element={
                    <div className="p-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">테이블 정의</h2>
                      <TableManager showOnly="tables" />
                    </div>
                  } />
                  <Route path="/admin/variables" element={
                    <div className="p-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">변수 정의</h2>
                      <FunctionsManager showOnly="variables" />
                    </div>
                  } />
                  <Route path="/admin/functions" element={
                    <div className="p-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">함수 정의</h2>
                      <FunctionsManager showOnly="functions" />
                    </div>
                  } />
                  <Route path="/admin/lnbconfig" element={
                    <div className="p-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">LNB 구성</h2>
                      <ScreenManager showOnly="lnb" />
                    </div>
                  } />
                  <Route path="/admin/screenconfig" element={
                    <div className="p-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">화면 구성</h2>
                      <ScreenManager showOnly="screens" />
                    </div>
                  } />
                </Routes>
              </div>
            </div>
          )}
          
          {/* 다른 메뉴들 */}
          {selectedApp !== 'ADMIN' && (
            <Routes>
              {/* GNB 라우트 (프로젝트 공통) */}
              <Route path="/:tenantId/designer/projects" element={
                <ProjectList 
                  onProjectSelect={handleProjectSelect}
                  tenantId={currentTenant.id}
                />
              } />
              
              <Route path="/:tenantId/designer/tables" element={<TableManager />} />
              <Route path="/:tenantId/designer/functions" element={<FunctionsManager />} />
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
            selectedProject ? (
              <Dashboard 
                project={selectedProject} 
                selectedBridge={selectedBridge}
                projects={projects}
                onProjectChange={setSelectedProject}
                onBridgeChange={(bridge) => {
                  setSelectedBridge(bridge);
                  // 브리지 변경 시 프로젝트 업데이트
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
                    // 브리지가 변경된 경우 선택된 브리지도 업데이트
                    if (selectedBridge && !updatedProject.bridges.find(b => b.id === selectedBridge.id)) {
                      setSelectedBridge(updatedProject.bridges[0]);
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
                lnbConfigs={lnbConfigs}
                activeMenu={getActiveMenuName()}
              />
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
                activeMenu={getActiveMenuName()}
                onMenuSelect={() => {}}
                selectedProject={selectedProject}
                projects={projects}
                onProjectChange={setSelectedProject}
                onBridgeChange={setSelectedBridge}
                selectedBridge={selectedBridge}
                onLNBMenuClick={handleLNBMenuClick}
                lnbConfigs={lnbConfigs}
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
                />
                <div className="flex-1 p-6">
                  <ProjectSettings 
                    project={selectedProject}
                    onProjectUpdate={async (updatedProject) => {
                      try {
                        const projectService = new ProjectService(new LocalStorageProjectProvider());
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
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">프로젝트 설정</h2>
                  <p className="text-gray-600">프로젝트를 선택하면 설정을 확인할 수 있습니다.</p>
                </div>
              </div>
            )
          } />
          
          {/* 기본 라우트 */}
          <Route path="/" element={
            <ProjectList 
              onProjectSelect={handleProjectSelect}
              tenantId={currentTenant.id}
            />
          } />
          
          {/* 테넌트 기본 라우트 */}
          <Route path="/:tenantId" element={
            <ProjectList 
              onProjectSelect={handleProjectSelect}
              tenantId={currentTenant.id}
            />
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
          
          <Route path="/viewer" element={
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">👁️</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">VIEWER</h2>
                <p className="text-gray-600 mb-4">3D 뷰어 및 시각화 도구</p>
                <p className="text-sm text-gray-500">현재 개발 중입니다. 곧 만나보실 수 있습니다.</p>
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
                  // 브리지 변경 시 프로젝트 업데이트
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
                    // 브리지가 변경된 경우 선택된 브리지도 업데이트
                    if (selectedBridge && !updatedProject.bridges.find(b => b.id === selectedBridge.id)) {
                      setSelectedBridge(updatedProject.bridges[0]);
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
                lnbConfigs={lnbConfigs}
                activeMenu={getActiveMenuName()}
              />
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
          <Route path="/:tenantId/project/:projectId/designer/functions" element={<FunctionsManager />} />
          
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
          
          {/* VIEWER 앱 */}
          <Route path="/viewer" element={
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">👁️</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">VIEWER</h2>
                <p className="text-gray-600 mb-4">3D 뷰어 및 시각화 도구</p>
                <p className="text-sm text-gray-500">현재 개발 중입니다. 곧 만나보실 수 있습니다.</p>
              </div>
            </div>
          } />
          
          {/* 기본 라우트 - 테넌트 기반으로 리다이렉트 */}
          <Route path="/" element={
            <ProjectList 
              onProjectSelect={handleProjectSelect}
              tenantId={currentTenant.id}
            />
          } />
          
          {/* 테넌트 기본 라우트 */}
          <Route path="/:tenantId" element={
            <ProjectList 
              onProjectSelect={handleProjectSelect}
              tenantId={currentTenant.id}
            />
          } />
          
          {/* Designer 모듈 라우트 */}
          <Route path="/designer/projects" element={
            <ProjectList 
              onProjectSelect={handleProjectSelect}
              tenantId={currentTenant.id}
            />
          } />
          
          {/* 대시보드 */}
          <Route path="/designer/dashboard" element={
            selectedProject ? (
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
                lnbConfigs={lnbConfigs}
                activeMenu={getActiveMenuName()}
              />
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
          <Route path="/:tenantId/designer/functions" element={<FunctionsManager />} />
          
          {/* 사용자 생성 화면 */}
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
                  console.log('Selected bridge:', bridge);
                }}
                onLNBMenuClick={handleLNBMenuClick}
                lnbConfigs={lnbConfigs}
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
                  console.log('Selected bridge:', bridge);
                }}
                onLNBMenuClick={handleLNBMenuClick}
                lnbConfigs={lnbConfigs}
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
                activeMenu={getActiveMenuName()}
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
                lnbConfigs={lnbConfigs}
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
                    console.log('Selected bridge:', bridge);
                  }}
                  onLNBMenuClick={handleLNBMenuClick}
                  lnbConfigs={lnbConfigs}
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