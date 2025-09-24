import React, { useState, useEffect } from 'react';
import { Plus, Save, X, GripVertical, BarChart3, Building2, Image, Anchor, Database, Variable } from 'lucide-react';
import { screenService } from '../services/ScreenService';
import { ScreenConfig, LNBConfig, SystemScreenType } from '@inno-spec/shared';

const LnbManager: React.FC = () => {
  const [lnbConfigs, setLnbConfigs] = useState<LNBConfig[]>([]);
  const [screens, setScreens] = useState<ScreenConfig[]>([]);
  const [showLNBModal, setShowLNBModal] = useState(false);
  const [editingLNB, setEditingLNB] = useState<LNBConfig | null>(null);
  const [newLNB, setNewLNB] = useState({ 
    name: '', 
    displayName: '', 
    icon: '', 
    order: 0, 
    isActive: true, 
    parentId: '', 
    isParent: false,
    type: 'independent' as 'independent' | 'parent' | 'child',
    screenId: '',
    systemScreenType: undefined as SystemScreenType | undefined
  });

  // LNB 구성 변경 감지
  const [hasLnbConfigChanges, setHasLnbConfigChanges] = useState<boolean>(false);

  useEffect(() => {
    loadData(true);
    // 기본 LNB 구성이 없으면 생성
    if (lnbConfigs.length === 0) {
      screenService.createDefaultLNBConfig();
      loadData(true);
    }
  }, []);

  const loadData = (resetChanges = false) => {
    const lnbData = screenService.getLNBConfigs();
    
    // 기존 데이터에 type 필드가 없으면 자동으로 설정
    const migratedLnbData = lnbData.map(lnb => {
      if (!lnb.type) {
        const inferredType: 'independent' | 'parent' | 'child' = (lnb.children && lnb.children.length > 0) ? 'parent' : 'independent';
        return { ...lnb, type: inferredType };
      }
      return lnb;
    });
    
    setLnbConfigs(migratedLnbData);
    setScreens(screenService.getScreens());
    
    if (resetChanges) {
      setHasLnbConfigChanges(false);
    }
  };

  const getSystemScreenDisplayName = (systemScreenType: SystemScreenType): string => {
    switch (systemScreenType) {
      case 'dashboard': return '대시보드';
      case 'project-settings': return '프로젝트 설정';
      case 'section-library': return '단면 라이브러리';
      case 'user-profile': return '사용자 프로필';
      case 'system-settings': return '시스템 설정';
      default: return '알 수 없음';
    }
  };

  const getIconComponent = (iconName?: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'BarChart3': <BarChart3 className="h-4 w-4" />,
      'Building2': <Building2 className="h-4 w-4" />,
      'Database': <Database className="h-4 w-4" />,
      'Image': <Image className="h-4 w-4" />,
      'Anchor': <Anchor className="h-4 w-4" />,
      'Settings': <Variable className="h-4 w-4" />
    };
    return iconMap[iconName || ''] || <Variable className="h-4 w-4" />;
  };

  const handleAddLNB = () => {
    if (newLNB.name && newLNB.displayName) {
      const maxOrder = lnbConfigs.length > 0 ? Math.max(...lnbConfigs.map(lnb => lnb.order)) : 0;
      const newOrder = Math.floor(maxOrder) + 1;
      
      if (newLNB.type === 'child') {
        const parent = lnbConfigs.find(p => p.id === newLNB.parentId);
        if (!parent) {
          alert('하위 메뉴를 추가하려면 부모 메뉴를 선택하세요.');
          return;
        }
        const childOrder = (parent.children?.length || 0) + 1;
        const nextChildren = [...(parent.children || []), {
          id: `lnb-${Date.now()}`,
          name: newLNB.name,
          displayName: newLNB.displayName,
          icon: newLNB.icon,
          order: childOrder,
          isActive: newLNB.isActive,
          type: 'child',
          screenId: newLNB.screenId || undefined,
          systemScreenType: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as LNBConfig];
        screenService.updateLNBConfig(parent.id, { children: nextChildren });
      } else {
        screenService.createLNBConfig({ 
          ...newLNB, 
          order: newOrder, 
          type: newLNB.type, 
          children: newLNB.type === 'parent' ? [] : [],
          screenId: newLNB.type === 'parent' ? undefined : (newLNB.screenId || undefined),
          systemScreenType: undefined
        });
      }
      setNewLNB({ name: '', displayName: '', icon: '', order: 0, isActive: true, parentId: '', isParent: false, type: 'independent', screenId: '', systemScreenType: undefined });
      setShowLNBModal(false);
      loadData();
      setHasLnbConfigChanges(true);
    }
  };

  const handleEditLNB = (lnb: LNBConfig) => {
    setEditingLNB(lnb);
    setNewLNB({ 
      name: lnb.name, 
      displayName: lnb.displayName, 
      icon: lnb.icon || '', 
      order: lnb.order, 
      isActive: lnb.isActive,
      parentId: '',
      isParent: false,
      type: lnb.type || (lnb.children && lnb.children.length > 0 ? 'parent' : 'independent'),
      screenId: lnb.screenId || '',
      systemScreenType: undefined
    });
    setShowLNBModal(true);
  };

  const handleUpdateLNB = () => {
    if (editingLNB && newLNB.name && newLNB.displayName) {
      if (editingLNB.type === 'child' || newLNB.type === 'child') {
        const parentId = newLNB.parentId;
        if (parentId) {
          const parent = lnbConfigs.find(p => p.id === parentId);
          if (parent) {
            const updatedChildren = (parent.children || []).map(child => 
              child.id === editingLNB.id 
                ? { ...child, ...newLNB, type: 'child' as const, screenId: newLNB.screenId, systemScreenType: undefined }
                : child
            );
            screenService.updateLNBConfig(parentId, { children: updatedChildren });
          }
        }
      } else {
        const updateData = {
          ...newLNB,
          screenId: newLNB.type === 'parent' ? undefined : (newLNB.screenId || undefined),
          systemScreenType: undefined
        };
        screenService.updateLNBConfig(editingLNB.id, updateData);
      }
      
      setEditingLNB(null);
      setNewLNB({ name: '', displayName: '', icon: '', order: 0, isActive: true, parentId: '', isParent: false, type: 'independent', screenId: '', systemScreenType: undefined });
      setShowLNBModal(false);
      loadData();
      setHasLnbConfigChanges(true);
    }
  };

  const handleDeleteLNB = (id: string) => {
    if (window.confirm('이 LNB 메뉴를 삭제하시겠습니까?')) {
      screenService.deleteLNBConfig(id);
      
      // 삭제 후 순서 재정렬
      const updatedConfigs = screenService.getLNBConfigs();
      updatedConfigs
        .filter(config => config.id !== id)
        .forEach((config, index) => {
          screenService.updateLNBConfig(config.id, { order: index + 1 });
        });
      
      loadData();
      setHasLnbConfigChanges(true);
    }
  };

  const handleEditChildLNB = (parentId: string, child: LNBConfig) => {
    setEditingLNB(child);
    setNewLNB({ 
      name: child.name, 
      displayName: child.displayName, 
      icon: child.icon || '', 
      order: child.order, 
      isActive: child.isActive,
      parentId: parentId,
      isParent: false,
      type: 'child',
      screenId: child.screenId || '',
      systemScreenType: undefined
    });
    setShowLNBModal(true);
  };

  const handleDeleteChildLNB = (parentId: string, childId: string) => {
    if (window.confirm('이 하위 메뉴를 삭제하시겠습니까?')) {
      const parentIndex = lnbConfigs.findIndex(p => p.id === parentId);
      if (parentIndex !== -1) {
        const parent = lnbConfigs[parentIndex];
        const updatedChildren = (parent.children || []).filter(c => c.id !== childId);
        
        const reorderedChildren = updatedChildren.map((child, index) => ({
          ...child,
          order: index + 1
        }));
        
        screenService.updateLNBConfig(parentId, { children: reorderedChildren });
        loadData();
        setHasLnbConfigChanges(true);
      }
    }
  };

  const resetLNBForm = () => {
    setNewLNB({ name: '', displayName: '', icon: '', order: 0, isActive: true, parentId: '', isParent: false, type: 'independent', screenId: '', systemScreenType: undefined });
    setEditingLNB(null);
  };

  const handleSaveLnbConfig = () => {
    console.log('LNB 구성 저장:', lnbConfigs);
    
    window.dispatchEvent(new CustomEvent('lnb-config-updated', {
      detail: { lnbConfigs }
    }));
    
    setHasLnbConfigChanges(false);
    // setOriginalLnbConfigs(lnbConfigs);
    loadData(true);
    
    alert('LNB 구성이 저장되었습니다. DESIGNER의 LNB 메뉴가 업데이트됩니다.');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">LNB 구성</h1>
          <p className="text-gray-600">
            좌측 네비게이션 바의 메뉴 구조를 설정하여 내진성능평가 시스템을 맞춤형으로 구성할 수 있습니다.
          </p>
        </div>

        {/* LNB 메뉴 구성 */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">LNB 메뉴 구성</h2>
              <div className="text-sm text-gray-500 mt-1">
                변경 상태: {hasLnbConfigChanges ? '변경됨' : '저장됨'} | 
                순서 변경: 저장됨
              </div>
            </div>
            <div className="flex space-x-3">
              {hasLnbConfigChanges && (
                <button
                  onClick={handleSaveLnbConfig}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  title="LNB 구성을 저장하고 DESIGNER에 적용"
                >
                  <Save className="h-4 w-4" />
                  <span>LNB 구성 저장</span>
                </button>
              )}
              <button
                onClick={() => setShowLNBModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>LNB 메뉴 추가</span>
              </button>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10"></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">순서</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">아이콘</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">메뉴명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">표시명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">연결된 화면</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lnbConfigs.map((lnb) => (
                  <React.Fragment key={lnb.id}>
                    {/* 상위 메뉴 */}
                    <tr 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleEditLNB(lnb)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-medium">{lnb.order}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center w-8 h-8">
                          {getIconComponent(lnb.icon)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <span className="font-semibold">{lnb.name}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-semibold">{lnb.displayName}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lnb.type === 'parent' ? (
                          <span className="text-gray-400 italic">상위 메뉴 (화면 연결 불가)</span>
                        ) : lnb.systemScreenType ? (
                          `[시스템] ${getSystemScreenDisplayName(lnb.systemScreenType)}`
                        ) : lnb.screenId ? (
                          screens.find(s => s.id === lnb.screenId)?.displayName || '연결됨'
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          lnb.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {lnb.isActive ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium w-20">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteLNB(lnb.id);
                            }}
                            className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* 하위 메뉴 */}
                    {lnb.children && lnb.children.length > 0 && lnb.children
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((child) => (
                      <tr
                        key={child.id || `${lnb.id}-${child.name}`}
                        className="hover:bg-gray-50 bg-gray-50 cursor-pointer"
                        onClick={() => handleEditChildLNB(lnb.id, child)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center">
                            <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="text-gray-500">{lnb.order}.{child.order}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center w-8 h-8">
                            {getIconComponent(child.icon)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="ml-4 text-gray-600">└ {child.name}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="ml-4 text-gray-600">{child.displayName}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {child.systemScreenType ? 
                            `[시스템] ${getSystemScreenDisplayName(child.systemScreenType)}` :
                            child.screenId ? 
                              screens.find(s => s.id === child.screenId)?.displayName || '연결됨' : 
                              '-'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            child.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {child.isActive ? '활성' : '비활성'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium w-20">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteChildLNB(lnb.id, child.id);
                            }}
                            className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* LNB 메뉴 추가/수정 모달 */}
        {showLNBModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingLNB ? 'LNB 메뉴 수정' : 'LNB 메뉴 추가'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowLNBModal(false);
                      resetLNBForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* 구분 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">구분</label>
                    <div className="flex items-center space-x-4 text-sm">
                      <label className="flex items-center space-x-1">
                        <input
                          type="radio"
                          name="lnbType"
                          value="independent"
                          checked={newLNB.type === 'independent'}
                          onChange={(e) => setNewLNB({ ...newLNB, type: e.target.value as 'independent' | 'parent' | 'child' })}
                        />
                        <span>독립</span>
                      </label>
                      <label className="flex items-center space-x-1">
                        <input
                          type="radio"
                          name="lnbType"
                          value="parent"
                          checked={newLNB.type === 'parent'}
                          onChange={(e) => setNewLNB({ 
                            ...newLNB, 
                            type: e.target.value as 'independent' | 'parent' | 'child',
                            screenId: '',
                            systemScreenType: undefined
                          })}
                        />
                        <span>상위</span>
                      </label>
                      <label className="flex items-center space-x-1">
                        <input
                          type="radio"
                          name="lnbType"
                          value="child"
                          checked={newLNB.type === 'child'}
                          onChange={(e) => setNewLNB({ ...newLNB, type: e.target.value as 'independent' | 'parent' | 'child' })}
                        />
                        <span>하위</span>
                      </label>
                    </div>
                  </div>

                  {/* 부모 선택 (하위일 때만) */}
                  {newLNB.type === 'child' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">상위 메뉴</label>
                      <select
                        value={newLNB.parentId}
                        onChange={(e) => setNewLNB({ ...newLNB, parentId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!!editingLNB}
                      >
                        <option value="">상위 메뉴를 선택하세요</option>
                        {(() => {
                          const availableParents = lnbConfigs.filter(parent => {
                            return parent.type === 'parent' || (parent.children && parent.children.length > 0);
                          });
                          return availableParents.map(parent => (
                            <option key={parent.id} value={parent.id}>
                              {parent.displayName} ({parent.name})
                            </option>
                          ));
                        })()}
                      </select>
                      {editingLNB && (
                        <p className="text-xs text-gray-500 mt-1">
                          하위 메뉴 편집 시 상위 메뉴는 변경할 수 없습니다.
                        </p>
                      )}
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">메뉴명 (영문) *</label>
                    <input
                      type="text"
                      value={newLNB.name}
                      onChange={(e) => setNewLNB({ ...newLNB, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="메뉴명을 입력하세요 (영문)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">표시명 *</label>
                    <input
                      type="text"
                      value={newLNB.displayName}
                      onChange={(e) => setNewLNB({ ...newLNB, displayName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="표시명을 입력하세요 (한글)"
                    />
                  </div>

                  {/* 화면 연결 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">연결된 화면</label>
                    
                    {newLNB.type === 'parent' ? (
                      <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500">
                        상위 메뉴는 화면 연결이 불가능합니다. (화면 없음으로 고정)
                      </div>
                    ) : (
                      <select
                        value={newLNB.screenId}
                        onChange={(e) => setNewLNB({ ...newLNB, screenId: e.target.value, systemScreenType: undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">화면 없음</option>
                        {screens.map(screen => (
                          <option key={screen.id} value={screen.id}>
                            {screen.displayName} ({screen.name})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">아이콘</label>
                    <div className="border border-gray-300 rounded-md p-3 bg-gray-50">
                      <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                        <button
                          type="button"
                          onClick={() => setNewLNB({ ...newLNB, icon: '' })}
                          className={`w-10 h-10 flex items-center justify-center rounded-md border-2 transition-all ${
                            !newLNB.icon 
                              ? 'border-blue-500 bg-blue-100' 
                              : 'border-gray-300 bg-white hover:border-gray-400'
                          }`}
                          title="아이콘 없음"
                        >
                          <span className="text-gray-400 text-xs">없음</span>
                        </button>
                        
                        {[
                          { value: 'LayoutDashboard', icon: '📊', name: '대시보드' },
                          { value: 'Building', icon: '🏢', name: '건물' },
                          { value: 'Database', icon: '🗄️', name: '데이터베이스' },
                          { value: 'Zap', icon: '⚡', name: '번개' },
                          { value: 'Shield', icon: '🛡️', name: '방패' },
                          { value: 'Settings', icon: '⚙️', name: '설정' },
                          { value: 'Home', icon: '🏠', name: '홈' },
                          { value: 'User', icon: '👤', name: '사용자' },
                          { value: 'Users', icon: '👥', name: '사용자들' },
                          { value: 'FileText', icon: '📄', name: '문서' },
                          { value: 'Folder', icon: '📁', name: '폴더' },
                          { value: 'Search', icon: '🔍', name: '검색' },
                          { value: 'BarChart', icon: '📈', name: '차트' },
                          { value: 'PieChart', icon: '🥧', name: '파이차트' },
                          { value: 'LineChart', icon: '📉', name: '라인차트' },
                          { value: 'Calendar', icon: '📅', name: '캘린더' },
                          { value: 'Clock', icon: '🕐', name: '시계' },
                          { value: 'Bell', icon: '🔔', name: '알림' },
                          { value: 'Mail', icon: '✉️', name: '메일' },
                          { value: 'Phone', icon: '📞', name: '전화' },
                          { value: 'MapPin', icon: '📍', name: '위치' },
                          { value: 'Globe', icon: '🌍', name: '지구' },
                          { value: 'Star', icon: '⭐', name: '별' },
                          { value: 'Heart', icon: '❤️', name: '하트' },
                          { value: 'ThumbsUp', icon: '👍', name: '좋아요' },
                          { value: 'CheckCircle', icon: '✅', name: '체크' },
                          { value: 'XCircle', icon: '❌', name: '취소' },
                          { value: 'AlertCircle', icon: '⚠️', name: '경고' },
                          { value: 'Info', icon: 'ℹ️', name: '정보' },
                          { value: 'HelpCircle', icon: '❓', name: '도움말' },
                          { value: 'Lock', icon: '🔒', name: '잠금' },
                          { value: 'Unlock', icon: '🔓', name: '잠금해제' },
                          { value: 'Key', icon: '🔑', name: '키' },
                          { value: 'Tool', icon: '🔧', name: '도구' },
                          { value: 'Wrench', icon: '🔨', name: '렌치' },
                          { value: 'Cog', icon: '⚙️', name: '톱니바퀴' },
                          { value: 'Monitor', icon: '🖥️', name: '모니터' },
                          { value: 'Smartphone', icon: '📱', name: '스마트폰' },
                          { value: 'Tablet', icon: '📱', name: '태블릿' },
                          { value: 'Printer', icon: '🖨️', name: '프린터' },
                          { value: 'Camera', icon: '📷', name: '카메라' },
                          { value: 'Video', icon: '📹', name: '비디오' },
                          { value: 'Music', icon: '🎵', name: '음악' },
                          { value: 'Image', icon: '🖼️', name: '이미지' },
                          { value: 'Download', icon: '⬇️', name: '다운로드' },
                          { value: 'Upload', icon: '⬆️', name: '업로드' },
                          { value: 'Share', icon: '📤', name: '공유' },
                          { value: 'Link', icon: '🔗', name: '링크' },
                          { value: 'ExternalLink', icon: '🔗', name: '외부링크' },
                          { value: 'Copy', icon: '📋', name: '복사' },
                          { value: 'Edit', icon: '✏️', name: '편집' },
                          { value: 'Trash', icon: '🗑️', name: '삭제' },
                          { value: 'Archive', icon: '📦', name: '보관' },
                          { value: 'Tag', icon: '🏷️', name: '태그' },
                          { value: 'Filter', icon: '🔍', name: '필터' },
                          { value: 'Sort', icon: '↕️', name: '정렬' },
                          { value: 'Refresh', icon: '🔄', name: '새로고침' },
                          { value: 'RotateCcw', icon: '🔄', name: '되돌리기' },
                          { value: 'Play', icon: '▶️', name: '재생' },
                          { value: 'Pause', icon: '⏸️', name: '일시정지' },
                          { value: 'Stop', icon: '⏹️', name: '정지' },
                          { value: 'SkipBack', icon: '⏮️', name: '이전' },
                          { value: 'SkipForward', icon: '⏭️', name: '다음' }
                        ].map((iconItem) => (
                          <button
                            key={iconItem.value}
                            type="button"
                            onClick={() => setNewLNB({ ...newLNB, icon: iconItem.value })}
                            className={`w-10 h-10 flex items-center justify-center rounded-md border-2 transition-all ${
                              newLNB.icon === iconItem.value 
                                ? 'border-blue-500 bg-blue-100' 
                                : 'border-gray-300 bg-white hover:border-gray-400'
                            }`}
                            title={iconItem.name}
                          >
                            <span className="text-lg">{iconItem.icon}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={newLNB.isActive}
                      onChange={(e) => setNewLNB({ ...newLNB, isActive: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                      활성화
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowLNBModal(false);
                      resetLNBForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={editingLNB ? handleUpdateLNB : handleAddLNB}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    <span>{editingLNB ? '저장' : '추가'}</span>
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

export default LnbManager;
