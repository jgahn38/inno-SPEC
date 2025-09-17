import React, { useState, useEffect } from 'react';
import { Plus, Save, X, Settings } from 'lucide-react';
import { screenService } from '../services/ScreenService';
import { variableService } from '../services/VariableService';
import { ScreenConfig, ScreenComponent, UserScreenDataStructure } from '@inno-spec/shared';
import { TableSchemaService } from '../TableSchemaService';
import ScreenCanvas from './ScreenCanvas';

const ScreenManager: React.FC = () => {
  const [screens, setScreens] = useState<ScreenConfig[]>([]);
  const [showScreenModal, setShowScreenModal] = useState(false);
  const [editingScreen, setEditingScreen] = useState<ScreenConfig | null>(null);
  const [currentScreenId, setCurrentScreenId] = useState<string>('');

  // 새 화면 폼 상태
  const [newScreen, setNewScreen] = useState({ 
    name: '', 
    displayName: '', 
    description: '', 
    type: 'custom' as 'dashboard' | 'custom', 
    layout: 'single' as 'single' | 'grid', 
    components: [] as ScreenComponent[],
    dataStructure: 'project' as 'project' | 'bridge'
  });

  // 테이블과 변수 데이터
  const [tables, setTables] = useState<any[]>([]);
  const [variables, setVariables] = useState<any[]>([]);

  useEffect(() => {
    loadData();
    loadTableAndVariableData();
  }, []);

  // VariableService 구독
  useEffect(() => {
    const unsubscribe = variableService.subscribe((_variables) => {
      const variablesForCanvas = variableService.getVariablesForScreenCanvas();
      setVariables(variablesForCanvas);
    });

    return unsubscribe;
  }, []);

  const loadData = () => {
    setScreens(screenService.getScreens());
  };

  const loadTableAndVariableData = () => {
    // 테이블 데이터 로드
    const tableService = TableSchemaService.getInstance();
    const allTables = Array.from(tableService.getAllSchemas().values());
    setTables(allTables);

    // 변수 데이터 로드 (VariableService 사용)
    const variablesForCanvas = variableService.getVariablesForScreenCanvas();
    setVariables(variablesForCanvas);
  };

  // 화면 구성 관리
  const handleAddScreen = () => {
    if (newScreen.name && newScreen.displayName) {
      screenService.createScreen({ ...newScreen, isActive: true });
      setNewScreen({ name: '', displayName: '', description: '', type: 'custom', layout: 'single', components: [], dataStructure: 'project' });
      setShowScreenModal(false);
      loadData();
    }
  };

  const handleEditScreen = (screen: ScreenConfig) => {
    setEditingScreen(screen);
    setNewScreen({ 
      name: screen.name, 
      displayName: screen.displayName, 
      description: screen.description || '', 
      type: screen.type, 
      layout: screen.layout as 'single' | 'grid', 
      components: screen.components,
      dataStructure: screen.dataStructure || 'project'
    });
    setShowScreenModal(true);
  };

  const handleUpdateScreen = () => {
    if (editingScreen && newScreen.name && newScreen.displayName) {
      console.log('🔄 화면 수정 요청:', {
        editingScreenId: editingScreen.id,
        oldScreen: editingScreen,
        newScreenData: newScreen,
        layoutChanged: editingScreen.layout !== newScreen.layout
      });
      
      screenService.updateScreen(editingScreen.id, newScreen);
      setEditingScreen(null);
      setNewScreen({ name: '', displayName: '', description: '', type: 'custom', layout: 'single', components: [], dataStructure: 'project' });
      setShowScreenModal(false);
      loadData();
    }
  };

  const handleDeleteScreen = (id: string) => {
    if (window.confirm('이 화면을 삭제하시겠습니까?')) {
      screenService.deleteScreen(id);
      loadData();
    }
  };

  const resetScreenForm = () => {
    setNewScreen({ name: '', displayName: '', description: '', type: 'custom', layout: 'single', components: [], dataStructure: 'project' });
    setEditingScreen(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">화면 구성</h1>
          <p className="text-gray-600">
            사용자 정의 화면을 생성하고 관리하여 내진성능평가 시스템을 맞춤형으로 설정할 수 있습니다.
          </p>
        </div>

        {/* 화면 구성 */}
          <div>
            <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">화면 목록</h2>
              <button
                onClick={() => setShowScreenModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>화면 추가</span>
              </button>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">화면명</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">표시명</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">레이아웃</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">데이터 구조</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-40"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {screens.map((screen) => (
                    <tr 
                      key={screen.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleEditScreen(screen)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{screen.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{screen.displayName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {screen.layout === 'single' ? '단일' : screen.layout === 'tabs' ? '탭' : '그리드'}
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {screen.dataStructure === 'project' ? '프로젝트 공통' : '교량별 개별'}
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium w-40">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentScreenId(screen.id);
                            }}
                            className="text-purple-600 hover:text-purple-900 p-1 rounded-full hover:bg-purple-50 transition-colors"
                            title="레이아웃 캔버스"
                          >
                            <Settings className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteScreen(screen.id);
                            }}
                            className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        {/* 화면 추가/수정 모달 */}
        {showScreenModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingScreen ? '화면 수정' : '화면 추가'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowScreenModal(false);
                      resetScreenForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">화면명 (영문) *</label>
                    <input
                      type="text"
                      value={newScreen.name}
                      onChange={(e) => setNewScreen({ ...newScreen, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="화면명을 입력하세요 (영문)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">표시명 *</label>
                    <input
                      type="text"
                      value={newScreen.displayName}
                      onChange={(e) => setNewScreen({ ...newScreen, displayName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="표시명을 입력하세요 (한글)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                    <textarea
                      value={newScreen.description}
                      onChange={(e) => setNewScreen({ ...newScreen, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="화면에 대한 설명을 입력하세요"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">데이터 저장 구조</label>
                    <select
                      value={newScreen.dataStructure}
                      onChange={(e) => setNewScreen({ ...newScreen, dataStructure: e.target.value as UserScreenDataStructure })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="project">프로젝트 (모든 구조물에 공통 적용)</option>
                      <option value="bridge">교량 (교량별 개별 데이터)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {newScreen.dataStructure === 'project' 
                        ? '입력한 데이터가 프로젝트의 모든 구조물에 공통적으로 적용됩니다.'
                        : '프로젝트의 하위 교량마다 각각 데이터를 입력할 수 있습니다.'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowScreenModal(false);
                      resetScreenForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={editingScreen ? handleUpdateScreen : handleAddScreen}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    <span>{editingScreen ? '저장' : '추가'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
                </div>
                    </div>
  );
};

export default ScreenManager;
