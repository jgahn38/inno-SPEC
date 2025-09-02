import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Settings, Save, X, GripVertical, BarChart3, Building2, Image, Anchor, Database, Variable, Table, Grid3X3 } from 'lucide-react';
import { screenService } from '../services/ScreenService';
import { ScreenConfig, ScreenComponent, LNBConfig, ScreenTemplate } from '../types';
import { TableSchemaService } from '../services/TableSchemaService';
import ScreenCanvas from './ScreenCanvas';

const ScreenManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'lnb' | 'screens' | 'templates'>('lnb');
  const [lnbConfigs, setLnbConfigs] = useState<LNBConfig[]>([]);
  const [screens, setScreens] = useState<ScreenConfig[]>([]);
  const [templates, setTemplates] = useState<ScreenTemplate[]>([]);
  const [showLNBModal, setShowLNBModal] = useState(false);
  const [showScreenModal, setShowScreenModal] = useState(false);
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [showVisualEditor, setShowVisualEditor] = useState(false);
  const [editingLNB, setEditingLNB] = useState<LNBConfig | null>(null);
  const [editingScreen, setEditingScreen] = useState<ScreenConfig | null>(null);
  const [currentScreenId, setCurrentScreenId] = useState<string>('');
  const [newLNB, setNewLNB] = useState({ 
    name: '', 
    displayName: '', 
    icon: '', 
    order: 0, 
    isActive: true, 
    parentId: '', 
    isParent: false,
    type: 'independent' as 'independent' | 'parent' | 'child',
    screenId: ''
  });
  const [newScreen, setNewScreen] = useState({ 
    name: '', 
    displayName: '', 
    description: '', 
    type: 'custom' as 'dashboard' | 'custom', 
    layout: 'single' as 'single' | 'grid' | 'tabs', 
    components: [] as ScreenComponent[] 
  });

  // 테이블과 변수 데이터
  const [tables, setTables] = useState<any[]>([]);
  const [variables, setVariables] = useState<any[]>([]);
  const [newComponent, setNewComponent] = useState({
    type: 'table' as 'table' | 'variable',
    componentId: '',
    displayName: '',
    position: { x: 0, y: 0, width: 6, height: 4 },
    config: {
      showHeader: true,
      showPagination: true,
      showSearch: true,
      showFilters: true,
      maxRows: 10,
      refreshInterval: 0
    }
  });

  // 드래그 앤 드롭 상태
  const [draggedLNB, setDraggedLNB] = useState<LNBConfig | null>(null);
  const [hasLnbOrderChanges, setHasLnbOrderChanges] = useState<boolean>(false);
  const [draggedChild, setDraggedChild] = useState<{ parentId: string; childId: string } | null>(null);

  useEffect(() => {
    loadData();
    loadTableAndVariableData();
    // 기본 LNB 구성이 없으면 생성
    if (lnbConfigs.length === 0) {
      screenService.createDefaultLNBConfig();
      loadData();
    }
  }, []);

  const loadData = () => {
    const lnbData = screenService.getLNBConfigs();
    
    // 기존 데이터에 type 필드가 없으면 자동으로 설정
    const migratedLnbData = lnbData.map(lnb => {
      if (!lnb.type) {
        // children이 있으면 'parent', 없으면 'independent'
        const inferredType: 'independent' | 'parent' | 'child' = (lnb.children && lnb.children.length > 0) ? 'parent' : 'independent';
        return { ...lnb, type: inferredType };
      }
      return lnb;
    });
    
    setLnbConfigs(migratedLnbData);
    setScreens(screenService.getScreens());
    setTemplates(screenService.getTemplates());
  };

  const loadTableAndVariableData = () => {
    // 테이블 데이터 로드
    const tableService = TableSchemaService.getInstance();
    const allTables = Array.from(tableService.getAllSchemas().values());
    setTables(allTables);

    // 변수 데이터 로드 (샘플 데이터)
    const sampleVariables = [
      { id: 'var-1', name: 'concrete_strength', displayName: '콘크리트 강도', type: 'number', unit: 'MPa' },
      { id: 'var-2', name: 'steel_yield', displayName: '철근 항복강도', type: 'number', unit: 'MPa' },
      { id: 'var-3', name: 'section_width', displayName: '단면 폭', type: 'number', unit: 'mm' },
      { id: 'var-4', name: 'section_height', displayName: '단면 높이', type: 'number', unit: 'mm' },
      { id: 'var-5', name: 'project_name', displayName: '프로젝트명', type: 'string' }
    ];
    setVariables(sampleVariables);
  };

  // LNB 구성 관리
  const handleAddLNB = () => {
    if (newLNB.name && newLNB.displayName) {
      // 자동으로 순서 할당 (마지막 순서 + 1)
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
          screenId: newLNB.screenId,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as LNBConfig];
        screenService.updateLNBConfig(parent.id, { children: nextChildren });
      } else {
        screenService.createLNBConfig({ ...newLNB, order: newOrder, type: newLNB.type, children: newLNB.type === 'parent' ? [] : [] });
      }
      setNewLNB({ name: '', displayName: '', icon: '', order: 0, isActive: true, parentId: '', isParent: false, type: 'independent', screenId: '' });
      setShowLNBModal(false);
      loadData();
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
      screenId: lnb.screenId || ''
    });
    setShowLNBModal(true);
  };

  const handleUpdateLNB = () => {
    if (editingLNB && newLNB.name && newLNB.displayName) {
      if (editingLNB.type === 'child' || newLNB.type === 'child') {
        // 하위 메뉴 편집인 경우 부모를 통해 업데이트
        const parentId = newLNB.parentId;
        if (parentId) {
          const parent = lnbConfigs.find(p => p.id === parentId);
          if (parent) {
            const updatedChildren = (parent.children || []).map(child => 
              child.id === editingLNB.id 
                ? { ...child, ...newLNB, type: 'child' as const, screenId: newLNB.screenId }
                : child
            );
            screenService.updateLNBConfig(parentId, { children: updatedChildren });
          }
        }
      } else {
        // 상위/독립 메뉴 편집
        screenService.updateLNBConfig(editingLNB.id, newLNB);
      }
      
      setEditingLNB(null);
      setNewLNB({ name: '', displayName: '', icon: '', order: 0, isActive: true, parentId: '', isParent: false, type: 'independent', screenId: '' });
      setShowLNBModal(false);
      loadData();
    }
  };

  const handleDeleteLNB = (id: string) => {
    if (window.confirm('이 LNB 메뉴를 삭제하시겠습니까?')) {
      screenService.deleteLNBConfig(id);
      loadData();
    }
  };

  // 하위 메뉴 편집
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
      screenId: child.screenId || ''
    });
    setShowLNBModal(true);
  };

  // 하위 메뉴 삭제
  const handleDeleteChildLNB = (parentId: string, childId: string) => {
    if (window.confirm('이 하위 메뉴를 삭제하시겠습니까?')) {
      const parentIndex = lnbConfigs.findIndex(p => p.id === parentId);
      if (parentIndex !== -1) {
        const parent = lnbConfigs[parentIndex];
        const updatedChildren = (parent.children || []).filter(c => c.id !== childId);
        
        // 자식 order 재할당
        const reorderedChildren = updatedChildren.map((child, index) => ({
          ...child,
          order: index + 1
        }));
        
        screenService.updateLNBConfig(parentId, { children: reorderedChildren });
        loadData();
      }
    }
  };

  // 화면 구성 관리
  const handleAddScreen = () => {
    if (newScreen.name && newScreen.displayName) {
      screenService.createScreen({ ...newScreen, isActive: true });
      setNewScreen({ name: '', displayName: '', description: '', type: 'custom', layout: 'single', components: [] });
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
      layout: screen.layout, 
      components: screen.components 
    });
    setShowScreenModal(true);
  };

  const handleUpdateScreen = () => {
    if (editingScreen && newScreen.name && newScreen.displayName) {
      screenService.updateScreen(editingScreen.id, newScreen);
      setEditingScreen(null);
      setNewScreen({ name: '', displayName: '', description: '', type: 'custom', layout: 'single', components: [] });
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

  const getIconComponent = (iconName?: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'BarChart3': <BarChart3 className="h-4 w-4" />,
      'Building2': <Building2 className="h-4 w-4" />,
      'Database': <Database className="h-4 w-4" />,
      'Image': <Image className="h-4 w-4" />,
      'Anchor': <Anchor className="h-4 w-4" />,
      'Settings': <Settings className="h-4 w-4" />
    };
    return iconMap[iconName || ''] || <Settings className="h-4 w-4" />;
  };

  const resetLNBForm = () => {
    setNewLNB({ name: '', displayName: '', icon: '', order: 0, isActive: true, parentId: '', isParent: false, type: 'independent', screenId: '' });
    setEditingLNB(null);
  };

  const resetScreenForm = () => {
    setNewScreen({ name: '', displayName: '', description: '', type: 'custom', layout: 'single', components: [] });
    setEditingScreen(null);
  };

  // 드래그 앤 드롭 핸들러
  const handleDragStart = (e: React.DragEvent, lnb: LNBConfig) => {
    setDraggedLNB(lnb);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetLNB: LNBConfig) => {
    e.preventDefault();
    if (!draggedLNB || draggedLNB.id === targetLNB.id) return;

    const draggedIndex = lnbConfigs.findIndex(lnb => lnb.id === draggedLNB.id);
    const targetIndex = lnbConfigs.findIndex(lnb => lnb.id === targetLNB.id);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      const newLnbConfigs = [...lnbConfigs];
      const [draggedItem] = newLnbConfigs.splice(draggedIndex, 1);
      newLnbConfigs.splice(targetIndex, 0, draggedItem);
      
      // 순서 재할당
      const updatedLnbConfigs = newLnbConfigs.map((lnb, index) => ({
        ...lnb,
        order: index + 1
      }));
      
      setLnbConfigs(updatedLnbConfigs);
      setHasLnbOrderChanges(true);
    }
    
    setDraggedLNB(null);
  };

  const handleDragEnd = () => {
    setDraggedLNB(null);
  };

  // 하위 메뉴 드래그 앤 드롭 핸들러
  const handleChildDragStart = (e: React.DragEvent, parentId: string, child: LNBConfig) => {
    setDraggedChild({ parentId, childId: child.id });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleChildDrop = (e: React.DragEvent, parentId: string, targetChild: LNBConfig) => {
    e.preventDefault();
    if (!draggedChild) return;
    if (draggedChild.parentId !== parentId) {
      // 부모가 다르면 이동 허용하지 않음 (동일 부모 내 정렬만 허용)
      setDraggedChild(null);
      return;
    }
    if (draggedChild.childId === targetChild.id) {
      setDraggedChild(null);
      return;
    }

    const parentIndex = lnbConfigs.findIndex(p => p.id === parentId);
    if (parentIndex === -1) {
      setDraggedChild(null);
      return;
    }
    const currentParent = lnbConfigs[parentIndex];
    const children = [...(currentParent.children || [])];
    const fromIndex = children.findIndex(c => c.id === draggedChild.childId);
    const toIndex = children.findIndex(c => c.id === targetChild.id);
    if (fromIndex === -1 || toIndex === -1) {
      setDraggedChild(null);
      return;
    }

    const reordered = [...children];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    // 자식 order 재할당 (1부터)
    const updatedChildren = reordered.map((c, idx) => ({ ...c, order: idx + 1 }));
    const updatedParent: LNBConfig = { ...currentParent, children: updatedChildren };
    const nextConfigs = [...lnbConfigs];
    nextConfigs[parentIndex] = updatedParent;
    setLnbConfigs(nextConfigs);
    setHasLnbOrderChanges(true);
    setDraggedChild(null);
  };

  const handleChildDragEnd = () => {
    setDraggedChild(null);
  };

  const handleSaveLnbOrder = () => {
    // 현재 로컬 상태의 순서를 일괄 저장
    lnbConfigs.forEach(lnb => {
      screenService.updateLNBConfig(lnb.id, { order: lnb.order, children: lnb.children || [] });
    });
    setHasLnbOrderChanges(false);
    loadData();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">화면 구성 관리</h1>
          <p className="mt-2 text-gray-600">
            LNB 메뉴와 화면을 직접 구성하여 내진성능평가 시스템을 맞춤형으로 설정할 수 있습니다.
          </p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('lnb')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'lnb'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              LNB 메뉴 구성
            </button>
            <button
              onClick={() => setActiveTab('screens')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'screens'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              화면 구성
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'templates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              화면 템플릿
            </button>
          </nav>
        </div>

        {/* LNB 메뉴 구성 탭 */}
        {activeTab === 'lnb' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">LNB 메뉴 구성</h2>
              <div className="flex space-x-3">
                {hasLnbOrderChanges && (
                  <button
                    onClick={handleSaveLnbOrder}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    title="변경된 순서를 저장"
                  >
                    <Save className="h-4 w-4" />
                    <span>저장</span>
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
                        className={`hover:bg-gray-50 cursor-pointer ${draggedLNB?.id === lnb.id ? 'opacity-50' : ''}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lnb)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, lnb)}
                        onDragEnd={handleDragEnd}
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
                          {lnb.screenId ? screens.find(s => s.id === lnb.screenId)?.displayName || '연결됨' : '-'}
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
                          className={`hover:bg-gray-50 bg-gray-50 cursor-pointer ${draggedChild?.childId === child.id ? 'opacity-50' : ''}`}
                          draggable
                          onDragStart={(e) => handleChildDragStart(e, lnb.id, child)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleChildDrop(e, lnb.id, child)}
                          onDragEnd={handleChildDragEnd}
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
                            {child.screenId ? screens.find(s => s.id === child.screenId)?.displayName || '연결됨' : '-'}
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
        )}

        {/* 화면 구성 탭 */}
        {activeTab === 'screens' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">화면 구성</h2>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">타입</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">레이아웃</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">컴포넌트 수</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-40"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {screens.map((screen) => (
                    <tr key={screen.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{screen.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{screen.displayName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {screen.type === 'dashboard' ? '대시보드' : '사용자정의'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {screen.layout === 'single' ? '단일' : screen.layout === 'grid' ? '그리드' : '탭'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{screen.components.length}개</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          screen.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {screen.isActive ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium w-40">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => {
                              setCurrentScreenId(screen.id);
                              setShowVisualEditor(true);
                            }}
                            className="text-purple-600 hover:text-purple-900 p-1 rounded-full hover:bg-purple-50 transition-colors"
                            title="시각적 편집"
                          >
                            <Grid3X3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditScreen(screen)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteScreen(screen.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 화면 템플릿 탭 */}
        {activeTab === 'templates' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">화면 템플릿</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <div key={template.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">{template.displayName}</h3>
                    {template.isSystem && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        시스템
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-4">{template.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>컴포넌트: {template.defaultComponents.length}개</span>
                    <span className="capitalize">{template.category}</span>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <button className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors">
                      사용하기
                    </button>
                    <button className="px-3 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
                          onChange={(e) => setNewLNB({ ...newLNB, type: e.target.value as 'independent' | 'parent' | 'child' })}
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
                        disabled={!!editingLNB} // 편집 중일 때는 비활성화
                      >
                        <option value="">상위 메뉴를 선택하세요</option>
                        {(() => {
                          const availableParents = lnbConfigs.filter(parent => {
                            // type이 'parent'이거나 children이 있는 경우를 상위 메뉴로 간주
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">표시명 (한글) *</label>
                    <input
                      type="text"
                      value={newLNB.displayName}
                      onChange={(e) => setNewLNB({ ...newLNB, displayName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="표시명을 입력하세요 (한글)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">아이콘</label>
                    <div className="border border-gray-300 rounded-md p-3 bg-gray-50">
                      <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                        {/* 빈 아이콘 (선택 안함) */}
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
                        
                        {/* 아이콘 그리드 */}
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



                  {/* 화면 연결 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">연결된 화면</label>
                    <select
                      value={newLNB.screenId}
                      onChange={(e) => setNewLNB({ ...newLNB, screenId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">화면을 선택하세요 (선택사항)</option>
                      {screens.map(screen => (
                        <option key={screen.id} value={screen.id}>
                          {screen.displayName} ({screen.name})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      메뉴 클릭 시 연결된 화면으로 이동합니다. 선택하지 않으면 메뉴만 표시됩니다.
                    </p>
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
                    <span>{editingLNB ? '수정' : '추가'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
                    <label className="block text-sm font-medium text-gray-700 mb-1">표시명 (한글) *</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">타입</label>
                    <select
                      value={newScreen.type}
                      onChange={(e) => setNewScreen({ ...newScreen, type: e.target.value as 'dashboard' | 'custom' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="custom">사용자정의</option>
                      <option value="dashboard">대시보드</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">레이아웃</label>
                    <select
                      value={newScreen.layout}
                      onChange={(e) => setNewScreen({ ...newScreen, layout: e.target.value as 'single' | 'grid' | 'tabs' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="single">단일</option>
                      <option value="grid">그리드</option>
                      <option value="tabs">탭</option>
                    </select>
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
                    <span>{editingScreen ? '수정' : '추가'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 컴포넌트 추가 모달 */}
        {showComponentModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">컴포넌트 추가</h3>
                  <button
                    onClick={() => {
                      setShowComponentModal(false);
                      setNewComponent({
                        type: 'table',
                        componentId: '',
                        displayName: '',
                        position: { x: 0, y: 0, width: 6, height: 4 },
                        config: {
                          showHeader: true,
                          showPagination: true,
                          showSearch: true,
                          showFilters: true,
                          maxRows: 10,
                          refreshInterval: 0
                        }
                      });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* 컴포넌트 타입 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">컴포넌트 타입</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="table"
                          checked={newComponent.type === 'table'}
                          onChange={(e) => setNewComponent({ ...newComponent, type: e.target.value as 'table' | 'variable' })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-2 flex items-center">
                          <Table className="h-4 w-4 mr-1" />
                          테이블
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="variable"
                          checked={newComponent.type === 'variable'}
                          onChange={(e) => setNewComponent({ ...newComponent, type: e.target.value as 'table' | 'variable' })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-2 flex items-center">
                          <Variable className="h-4 w-4 mr-1" />
                          변수
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* 테이블/변수 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {newComponent.type === 'table' ? '테이블' : '변수'} 선택
                    </label>
                    <select
                      value={newComponent.componentId}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        const selectedItem = newComponent.type === 'table' 
                          ? tables.find(t => t.id === selectedId)
                          : variables.find(v => v.id === selectedId);
                        
                        setNewComponent({
                          ...newComponent,
                          componentId: selectedId,
                          displayName: selectedItem?.displayName || ''
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{newComponent.type === 'table' ? '테이블을 선택하세요' : '변수를 선택하세요'}</option>
                      {newComponent.type === 'table' 
                        ? tables.map(table => (
                            <option key={table.id} value={table.id}>
                              {table.displayName} ({table.name})
                            </option>
                          ))
                        : variables.map(variable => (
                            <option key={variable.id} value={variable.id}>
                              {variable.displayName} ({variable.name})
                            </option>
                          ))
                      }
                    </select>
                  </div>

                  {/* 표시명 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">표시명</label>
                    <input
                      type="text"
                      value={newComponent.displayName}
                      onChange={(e) => setNewComponent({ ...newComponent, displayName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="화면에 표시될 이름을 입력하세요"
                    />
                  </div>

                  {/* 위치 및 크기 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">X 위치</label>
                      <input
                        type="number"
                        value={newComponent.position.x}
                        onChange={(e) => setNewComponent({
                          ...newComponent,
                          position: { ...newComponent.position, x: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Y 위치</label>
                      <input
                        type="number"
                        value={newComponent.position.y}
                        onChange={(e) => setNewComponent({
                          ...newComponent,
                          position: { ...newComponent.position, y: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">너비</label>
                      <input
                        type="number"
                        value={newComponent.position.width}
                        onChange={(e) => setNewComponent({
                          ...newComponent,
                          position: { ...newComponent.position, width: parseInt(e.target.value) || 1 }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                        max="12"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">높이</label>
                      <input
                        type="number"
                        value={newComponent.position.height}
                        onChange={(e) => setNewComponent({
                          ...newComponent,
                          position: { ...newComponent.position, height: parseInt(e.target.value) || 1 }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                        max="8"
                      />
                    </div>
                  </div>

                  {/* 테이블 설정 (테이블 타입일 때만) */}
                  {newComponent.type === 'table' && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">테이블 설정</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newComponent.config.showHeader}
                            onChange={(e) => setNewComponent({
                              ...newComponent,
                              config: { ...newComponent.config, showHeader: e.target.checked }
                            })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">헤더 표시</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newComponent.config.showPagination}
                            onChange={(e) => setNewComponent({
                              ...newComponent,
                              config: { ...newComponent.config, showPagination: e.target.checked }
                            })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">페이지네이션</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newComponent.config.showSearch}
                            onChange={(e) => setNewComponent({
                              ...newComponent,
                              config: { ...newComponent.config, showSearch: e.target.checked }
                            })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">검색 기능</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newComponent.config.showFilters}
                            onChange={(e) => setNewComponent({
                              ...newComponent,
                              config: { ...newComponent.config, showFilters: e.target.checked }
                            })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">필터 기능</span>
                        </label>
                      </div>
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">최대 행 수</label>
                        <input
                          type="number"
                          value={newComponent.config.maxRows}
                          onChange={(e) => setNewComponent({
                            ...newComponent,
                            config: { ...newComponent.config, maxRows: parseInt(e.target.value) || 10 }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="1"
                          max="100"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowComponentModal(false);
                      setNewComponent({
                        type: 'table',
                        componentId: '',
                        displayName: '',
                        position: { x: 0, y: 0, width: 6, height: 4 },
                        config: {
                          showHeader: true,
                          showPagination: true,
                          showSearch: true,
                          showFilters: true,
                          maxRows: 10,
                          refreshInterval: 0
                        }
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => {
                      if (newComponent.componentId && newComponent.displayName) {
                        screenService.addComponentToScreen(currentScreenId, newComponent);
                        setShowComponentModal(false);
                        setNewComponent({
                          type: 'table',
                          componentId: '',
                          displayName: '',
                          position: { x: 0, y: 0, width: 6, height: 4 },
                          config: {
                            showHeader: true,
                            showPagination: true,
                            showSearch: true,
                            showFilters: true,
                            maxRows: 10,
                            refreshInterval: 0
                          }
                        });
                        loadData();
                      }
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>컴포넌트 추가</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 시각적 편집 모달 */}
        {showVisualEditor && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-7xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {screens.find(s => s.id === currentScreenId)?.displayName} - 시각적 편집
                  </h3>
                  <button
                    onClick={() => setShowVisualEditor(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="h-[800px]">
                  <ScreenCanvas
                    layout={screens.find(s => s.id === currentScreenId)?.layout || 'single'}
                    components={screens.find(s => s.id === currentScreenId)?.components || []}
                    onComponentsChange={(newComponents) => {
                      const updatedScreens = screens.map(screen =>
                        screen.id === currentScreenId
                          ? { ...screen, components: newComponents }
                          : screen
                      );
                      setScreens(updatedScreens);
                      // 화면 업데이트
                      const currentScreen = screens.find(s => s.id === currentScreenId);
                      if (currentScreen) {
                        screenService.updateScreen(currentScreenId, { components: newComponents });
                      }
                    }}
                    availableTables={tables}
                    availableVariables={variables}
                  />
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
