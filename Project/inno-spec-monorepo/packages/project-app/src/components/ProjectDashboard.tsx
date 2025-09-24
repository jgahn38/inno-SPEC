import React, { useState, useEffect } from 'react';
import { Grid as BridgeIcon, ChevronDown } from 'lucide-react';
import { Sidebar } from '@inno-spec/ui-lib';
// import IllustrationView from '../../designer-app/src/components/IllustrationView';
import ProjectSettings from './ProjectSettings';
import { Project, Bridge } from '@inno-spec/shared';
import { BridgeDataService } from '@inno-spec/shared';
import { projectLNBConfig } from '../configs/projectLNBConfig';

interface ProjectDashboardProps {
  project: Project;
  selectedBridge: Bridge | null;
  projects: Project[];
  onProjectChange: (project: Project) => void;
  onBridgeChange: (bridge: Bridge) => void;
  onProjectUpdate: (updatedProject: Project) => void;
  onLNBMenuClick?: (menuId: string) => void;
  activeMenu?: string;
}

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ 
  project, 
  selectedBridge, 
  projects, 
  onProjectChange, 
  onBridgeChange, 
  onProjectUpdate, 
  onLNBMenuClick,
  activeMenu: propActiveMenu = 'dashboard'
}) => {
  const [activeMenu, setActiveMenu] = useState(propActiveMenu);
  
  // Dashboard 컴포넌트에서는 항상 'dashboard'로 유지
  useEffect(() => {
    if (propActiveMenu !== 'dashboard') {
      setActiveMenu('dashboard');
    }
  }, [propActiveMenu]);
  
  // 메뉴 클릭 처리
  const handleMenuSelect = (menuId: string) => {
    console.log('Project menu selected:', menuId);
    setActiveMenu(menuId);
  };
  const [isBridgeDropdownOpen, setIsBridgeDropdownOpen] = useState(false);
  // const [bridgeData, setBridgeData] = useState<BridgeData | null>(null); // 사용하지 않음
  const [bridgeDataService] = useState(() => BridgeDataService.getInstance());

  // 교량 데이터 로드
  useEffect(() => {
    const loadBridgeData = async () => {
      if (selectedBridge && project) {
        try {
          await bridgeDataService.getBridgeData({
            bridgeId: selectedBridge.id,
            projectId: project.id
          });
          // setBridgeData(data); // 사용하지 않음
        } catch (error) {
          console.error('Failed to load bridge data:', error);
          // setBridgeData(null); // 사용하지 않음
        }
      }
    };

    loadBridgeData();
  }, [selectedBridge, project, bridgeDataService]);

  const getBridgeTypeLabel = (type: string) => {
    switch (type) {
      case 'concrete': return '콘크리트';
      case 'steel': return '강교';
      case 'composite': return '합성교';
      default: return type;
    }
  };

  const renderContent = () => {
    switch (activeMenu) {
      // 대시보드
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="px-6 py-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">대시보드</h2>
                <p className="text-sm text-gray-600">프로젝트 전체 교량의 내진성능평가 현황을 한눈에 확인하세요.</p>
              </div>
            </div>
            
            {/* 프로젝트 요약 정보 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">프로젝트 개요</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{project.bridges?.length || 0}</div>
                  <div className="text-sm text-gray-600">등록된 교량</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {project.bridges?.filter(b => b.status === 'active').length || 0}
                  </div>
                  <div className="text-sm text-gray-600">활성 교량</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {project.bridges?.filter(b => b.status === 'maintenance').length || 0}
                  </div>
                  <div className="text-sm text-gray-600">점검중 교량</div>
                </div>
              </div>
            </div>

            {/* 교량별 평가 현황 */}
            {project.bridges && project.bridges.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">교량별 평가 현황</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">교량명</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">유형</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">평가 진행률</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">최종 점검일</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {project.bridges.map((bridge) => (
                        <tr key={bridge.id} className="hover:bg-gray-50">
                          <td className="px-3 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{bridge.name}</div>
                            <div className="text-sm text-gray-500">{bridge.description}</div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {getBridgeTypeLabel(bridge.type)}
                            </span>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              bridge.status === 'active' ? 'bg-green-100 text-green-800' :
                              bridge.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {bridge.status === 'active' ? '활성' : 
                               bridge.status === 'maintenance' ? '점검중' : '비활성'}
                            </span>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '25%' }}></div>
                              </div>
                              <span className="text-sm text-gray-600">25%</span>
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {bridge.updatedAt ? new Date(bridge.updatedAt).toLocaleDateString('ko-KR') : '미정'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 최근 활동 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 활동</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">새 교량 "교량 D"가 추가되었습니다.</span>
                  <span className="text-xs text-gray-400 ml-auto">2시간 전</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">"교량 A"의 구조물 현황이 업데이트되었습니다.</span>
                  <span className="text-xs text-gray-400 ml-auto">1일 전</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">"교량 B"의 교량받침 점검이 예정되었습니다.</span>
                  <span className="text-xs text-gray-400 ml-auto">3일 전</span>
                </div>
              </div>
            </div>
          </div>
        );

      // 교량현황
      case 'bridge-specs':
        return (
          <div className="space-y-4">
            <div className="px-6 py-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">교량제원</h2>
                <p className="text-sm text-gray-600">교량의 기본 제원 정보를 확인하고 관리하세요.</p>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <p className="text-gray-600">교량제원 관리 기능이 여기에 구현됩니다.</p>
            </div>
          </div>
        );
      
      case 'structure-status':
        return (
          <div className="space-y-4">
            <div className="px-6 py-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">구조물 현황</h2>
                <p className="text-sm text-gray-600">교량 구조물의 현재 상태를 확인하세요.</p>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <p className="text-gray-600">구조물 현황 관리 기능이 여기에 구현됩니다.</p>
            </div>
          </div>
        );
      
      case 'bearing-status':
        return (
          <div className="space-y-4">
            <div className="px-6 py-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">교량받침 현황</h2>
                <p className="text-sm text-gray-600">교량받침의 상태와 정보를 확인하세요.</p>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <p className="text-gray-600">교량받침 현황 관리 기능이 여기에 구현됩니다.</p>
            </div>
          </div>
        );
      
      // 모델링
      case 'section':
        return (
          <div className="space-y-4">
            <div className="px-6 py-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">모델링</h2>
                <p className="text-sm text-gray-600">교량 모델링 기능이 여기에 구현됩니다.</p>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <p className="text-gray-600">모델링 기능이 구현될 예정입니다.</p>
            </div>
          </div>
        );
      
      // 프로젝트 설정
      case 'project-settings':
        return <ProjectSettings project={project} onProjectUpdate={onProjectUpdate} />;
      
      default:
        return (
          <div className="space-y-4">
            <div className="px-6 py-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">교량제원</h2>
                <p className="text-sm text-gray-600">교량의 기본 제원 정보를 확인하고 관리하세요.</p>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <p className="text-gray-600">교량제원 관리 기능이 여기에 구현됩니다.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-full">
      <Sidebar 
        activeMenu={activeMenu} 
        onMenuSelect={handleMenuSelect}
        selectedProject={project}
        selectedBridge={selectedBridge}
        projects={projects}
        onProjectChange={onProjectChange}
        onBridgeChange={onBridgeChange}
        onLNBMenuClick={onLNBMenuClick}
        lnbConfigs={projectLNBConfig}
      />
      <div className="flex-1 bg-gray-50 overflow-auto">
        {/* 교량 선택 헤더 - 대시보드와 프로젝트 설정 메뉴일 때는 표시하지 않음 */}
        {activeMenu !== 'dashboard' && activeMenu !== 'project-settings' && project.bridges && project.bridges.length > 0 && (
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="relative w-64">
                <button
                  onClick={() => setIsBridgeDropdownOpen(!isBridgeDropdownOpen)}
                  className="w-full flex items-center justify-between p-2 text-left hover:bg-gray-50 rounded-md transition-colors border border-gray-200"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-green-100 rounded flex items-center justify-center">
                      <BridgeIcon className="h-3 w-3 text-green-600" />
                    </div>
                    <div className="font-medium text-gray-900 text-sm truncate" title={selectedBridge?.name || '교량 선택'}>
                      {selectedBridge?.name || '교량 선택'}
                    </div>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isBridgeDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isBridgeDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                    {project.bridges.map((bridge) => (
                      <button
                        key={bridge.id}
                        onClick={() => {
                          onBridgeChange(bridge);
                          setIsBridgeDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors ${
                          selectedBridge?.id === bridge.id ? 'bg-green-50 text-green-700' : 'text-gray-700'
                        }`}
                      >
                        <div className="truncate font-medium text-sm" title={bridge.displayName}>
                          {bridge.displayName}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* 교량 정보 표시 */}
              {selectedBridge && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{selectedBridge.type === 'concrete' ? '콘크리트' : selectedBridge.type === 'steel' ? '강교' : '합성교'}</span>
                  <span className="mx-2">•</span>
                  <span>L={selectedBridge.length}m × W={selectedBridge.width}m</span>
                  {selectedBridge.spanCount > 1 && (
                    <>
                      <span className="mx-2">•</span>
                      <span>{selectedBridge.spanCount}경간</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboard;