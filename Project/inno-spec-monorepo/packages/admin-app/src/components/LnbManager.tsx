import React, { useState, useEffect } from 'react';
import { PageLayout, Modal } from '@inno-spec/ui-lib';
import { Plus, X, GripVertical, BarChart3, Building2, Image, Anchor, Database, Variable, Table, FolderOpen, Tag, Component, Code, Layout, Menu, Type, Monitor, Layers, Home, FileText, Settings, Users, Grid, Boxes, ListTree, FileStack, FileCode, BookOpen, Columns, Rows, LayoutGrid, Ruler, Calculator, Activity, TrendingUp, TrendingDown, Compass, PenTool, Scissors, Box, Package, Hammer, Wrench, MapPin, Map, Navigation, Shield, AlertTriangle, CheckCircle, Construction, GitBranch, Maximize2, Move, Hexagon, Square, Circle, Triangle, Minus, Plus as PlusIcon, Equal, ArrowUpDown, Split, Merge } from 'lucide-react';
import { screenService } from '../services/ScreenService';
import { ScreenConfig, LNBConfig, SystemScreenType } from '@inno-spec/shared';

interface ProjectCategory {
  id: string;
  name: string;
  displayName: string;
  description: string;
  color: string;
  icon: string;
  order: number;
  isActive: boolean;
}

const LnbManager: React.FC = () => {
  const [lnbConfigs, setLnbConfigs] = useState<LNBConfig[]>([]);
  const [screens, setScreens] = useState<ScreenConfig[]>([]);
  const [showLNBModal, setShowLNBModal] = useState(false);
  const [editingLNB, setEditingLNB] = useState<LNBConfig | null>(null);
  const [newLNB, setNewLNB] = useState({ 
    name: '', 
    displayName: '', 
    description: '',
    icon: '', 
    order: 0, 
    isActive: true, 
    parentId: '', 
    isParent: false,
    type: 'independent' as 'independent' | 'parent' | 'child',
    screenId: '',
    systemScreenType: undefined as SystemScreenType | undefined
  });

  // 프로젝트 카테고리 상태
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  // 드래그 앤 드롭 상태
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [draggedChildItem, setDraggedChildItem] = useState<{ parentId: string; childId: string } | null>(null);

  useEffect(() => {
    loadCategories();
    loadData();
    // 기본 LNB 구성이 없으면 생성
    if (lnbConfigs.length === 0) {
      screenService.createDefaultLNBConfig();
      loadData();
    }
  }, []);

  // 선택된 카테고리가 변경되면 해당 카테고리의 LNB 로드
  useEffect(() => {
    if (selectedCategoryId) {
      loadData();
    }
  }, [selectedCategoryId]);

  const loadCategories = () => {
    const stored = localStorage.getItem('project-categories');
    if (stored) {
      const parsedCategories = JSON.parse(stored).map((cat: any) => ({
        ...cat,
        createdAt: new Date(cat.createdAt),
        updatedAt: new Date(cat.updatedAt)
      }));
      setCategories(parsedCategories.filter((cat: ProjectCategory) => cat.isActive));
      
      // 첫 번째 카테고리를 기본 선택
      if (parsedCategories.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(parsedCategories[0].id);
      }
    }
  };

  const loadData = () => {
    // 선택된 카테고리의 LNB만 로드
    const lnbData = selectedCategoryId 
      ? screenService.getLNBConfigsByCategory(selectedCategoryId)
      : screenService.getLNBConfigs();
    
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
    // 이모지인 경우 직접 표시
    if (iconName && /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(iconName)) {
      return <span className="text-lg flex items-center justify-center">{iconName}</span>;
    }
    
    // Lucide 아이콘 매핑
    const iconMap: Record<string, React.ReactNode> = {
      // 기본 아이콘
      'BarChart3': <BarChart3 className="h-4 w-4" />,
      'Database': <Database className="h-4 w-4" />,
      'Table': <Table className="h-4 w-4" />,
      'FolderOpen': <FolderOpen className="h-4 w-4" />,
      'Tag': <Tag className="h-4 w-4" />,
      'Component': <Component className="h-4 w-4" />,
      'Code': <Code className="h-4 w-4" />,
      'Variable': <Variable className="h-4 w-4" />,
      'Type': <Type className="h-4 w-4" />,
      'Monitor': <Monitor className="h-4 w-4" />,
      'Layers': <Layers className="h-4 w-4" />,
      'Layout': <Layout className="h-4 w-4" />,
      'Menu': <Menu className="h-4 w-4" />,
      'Home': <Home className="h-4 w-4" />,
      'FileText': <FileText className="h-4 w-4" />,
      'Settings': <Settings className="h-4 w-4" />,
      'Users': <Users className="h-4 w-4" />,
      'Grid': <Grid className="h-4 w-4" />,
      'Boxes': <Boxes className="h-4 w-4" />,
      'ListTree': <ListTree className="h-4 w-4" />,
      'FileStack': <FileStack className="h-4 w-4" />,
      'FileCode': <FileCode className="h-4 w-4" />,
      'BookOpen': <BookOpen className="h-4 w-4" />,
      'Columns': <Columns className="h-4 w-4" />,
      'Rows': <Rows className="h-4 w-4" />,
      'LayoutGrid': <LayoutGrid className="h-4 w-4" />,
      // 토목/건설 관련
      'Building2': <Building2 className="h-4 w-4" />,
      'Construction': <Construction className="h-4 w-4" />,
      'Anchor': <Anchor className="h-4 w-4" />,
      'Image': <Image className="h-4 w-4" />,
      // 측정/계산 관련
      'Ruler': <Ruler className="h-4 w-4" />,
      'Calculator': <Calculator className="h-4 w-4" />,
      'Activity': <Activity className="h-4 w-4" />,
      'TrendingUp': <TrendingUp className="h-4 w-4" />,
      'TrendingDown': <TrendingDown className="h-4 w-4" />,
      // 설계/도구 관련
      'Compass': <Compass className="h-4 w-4" />,
      'PenTool': <PenTool className="h-4 w-4" />,
      'Scissors': <Scissors className="h-4 w-4" />,
      'Hammer': <Hammer className="h-4 w-4" />,
      'Wrench': <Wrench className="h-4 w-4" />,
      // 공간/위치 관련
      'MapPin': <MapPin className="h-4 w-4" />,
      'Map': <Map className="h-4 w-4" />,
      'Navigation': <Navigation className="h-4 w-4" />,
      // 구조/도형 관련
      'Box': <Box className="h-4 w-4" />,
      'Package': <Package className="h-4 w-4" />,
      'Hexagon': <Hexagon className="h-4 w-4" />,
      'Square': <Square className="h-4 w-4" />,
      'Circle': <Circle className="h-4 w-4" />,
      'Triangle': <Triangle className="h-4 w-4" />,
      // 분기/연결 관련
      'GitBranch': <GitBranch className="h-4 w-4" />,
      'Split': <Split className="h-4 w-4" />,
      'Merge': <Merge className="h-4 w-4" />,
      // 크기/이동 관련
      'Maximize2': <Maximize2 className="h-4 w-4" />,
      'Move': <Move className="h-4 w-4" />,
      'ArrowUpDown': <ArrowUpDown className="h-4 w-4" />,
      // 기타 유틸리티
      'Shield': <Shield className="h-4 w-4" />,
      'AlertTriangle': <AlertTriangle className="h-4 w-4" />,
      'CheckCircle': <CheckCircle className="h-4 w-4" />,
      'Minus': <Minus className="h-4 w-4" />,
      'PlusIcon': <PlusIcon className="h-4 w-4" />,
      'Equal': <Equal className="h-4 w-4" />
    };
    return iconMap[iconName || ''] || <Database className="h-4 w-4" />;
  };

  const handleAddLNB = () => {
    if (newLNB.name && newLNB.displayName) {
      if (!selectedCategoryId) {
        alert('프로젝트 카테고리를 먼저 선택하세요.');
        return;
      }

      // 현재 선택된 카테고리 내에서 최대 순서 값을 찾아 새 순서 계산
      // (lnbConfigs는 이미 선택된 카테고리로 필터링된 상태)
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
          description: newLNB.description || undefined,
          icon: newLNB.icon,
          order: childOrder,
          isActive: newLNB.isActive,
          type: 'child',
          categoryId: selectedCategoryId,
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
          categoryId: selectedCategoryId,
          children: newLNB.type === 'parent' ? [] : [],
          screenId: newLNB.type === 'parent' ? undefined : (newLNB.screenId || undefined),
          systemScreenType: undefined
        });
      }
      setNewLNB({ name: '', displayName: '', description: '', icon: '', order: 0, isActive: true, parentId: '', isParent: false, type: 'independent', screenId: '', systemScreenType: undefined });
      setShowLNBModal(false);
      loadData();
      autoSaveLnbConfig(); // 실시간 저장
    }
  };

  const handleEditLNB = (lnb: LNBConfig) => {
    setEditingLNB(lnb);
    setNewLNB({ 
      name: lnb.name, 
      displayName: lnb.displayName, 
      description: lnb.description || '',
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
      setNewLNB({ name: '', displayName: '', description: '', icon: '', order: 0, isActive: true, parentId: '', isParent: false, type: 'independent', screenId: '', systemScreenType: undefined });
      setShowLNBModal(false);
      loadData();
      autoSaveLnbConfig(); // 실시간 저장
    }
  };

  const handleDeleteLNB = (id: string) => {
    if (window.confirm('이 LNB 메뉴를 삭제하시겠습니까?')) {
      screenService.deleteLNBConfig(id);
      
      // 삭제 후 순서 재정렬 (해당 카테고리 내에서만)
      if (selectedCategoryId) {
        const categoryConfigs = screenService.getLNBConfigsByCategory(selectedCategoryId);
        categoryConfigs
          .filter(config => config.id !== id)
          .forEach((config, index) => {
            screenService.updateLNBConfig(config.id, { order: index + 1 });
          });
      }
      
      loadData();
      autoSaveLnbConfig(); // 실시간 저장
    }
  };

  const handleEditChildLNB = (parentId: string, child: LNBConfig) => {
    setEditingLNB(child);
    setNewLNB({ 
      name: child.name, 
      displayName: child.displayName, 
      description: child.description || '',
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
        autoSaveLnbConfig(); // 실시간 저장
      }
    }
  };

  const resetLNBForm = () => {
    setNewLNB({ name: '', displayName: '', description: '', icon: '', order: 0, isActive: true, parentId: '', isParent: false, type: 'independent', screenId: '', systemScreenType: undefined });
    setEditingLNB(null);
  };

  // LNB 구성 자동 저장 (실시간 저장)
  const autoSaveLnbConfig = () => {
    const currentLnbConfigs = screenService.getLNBConfigs();
    console.log('LNB 구성 자동 저장:', currentLnbConfigs);
    
    // DESIGNER 앱에 변경 사항 알림
    window.dispatchEvent(new CustomEvent('lnb-config-updated', {
      detail: { lnbConfigs: currentLnbConfigs }
    }));
  };

  return (
    <PageLayout
      title="LNB 구성"
      description="좌측 네비게이션 바의 메뉴 구조를 설정하여 내진성능평가 시스템을 맞춤형으로 구성할 수 있습니다."
      actions={
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <label htmlFor="category-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
              프로젝트 카테고리:
            </label>
            <select
              id="category-select"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMS41TDYgNi41TDExIDEuNSIgc3Ryb2tlPSIjNkI3MjgwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==')] bg-[right_0.5rem_center] bg-no-repeat"
              disabled={categories.length === 0}
            >
              {categories.length === 0 ? (
                <option value="">카테고리 없음</option>
              ) : (
                categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.displayName}
                  </option>
                ))
              )}
            </select>
          </div>
          <button
            onClick={() => setShowLNBModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            disabled={!selectedCategoryId}
          >
            <Plus className="h-4 w-4" />
            <span>LNB 메뉴 추가</span>
          </button>
        </div>
      }
    >
      <div>
        {!selectedCategoryId ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md p-12 text-center">
            <p className="text-gray-500 text-lg">프로젝트 카테고리를 선택하세요.</p>
            <p className="text-gray-400 text-sm mt-2">각 프로젝트 카테고리별로 LNB 메뉴를 구성할 수 있습니다.</p>
          </div>
        ) : lnbConfigs.length === 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md p-12 text-center">
            <p className="text-gray-500 text-lg">선택한 카테고리에 LNB 메뉴가 없습니다.</p>
            <p className="text-gray-400 text-sm mt-2">"LNB 메뉴 추가" 버튼을 클릭하여 메뉴를 추가하세요.</p>
          </div>
        ) : (
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
                      className={`hover:bg-gray-50 cursor-pointer ${draggedItem === lnb.id ? 'opacity-50' : ''}`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', lnb.id);
                        setDraggedItem(lnb.id);
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const draggedLnbId = e.dataTransfer.getData('text/plain');
                        const draggedIndex = lnbConfigs.findIndex(l => l.id === draggedLnbId);
                        const dropIndex = lnbConfigs.findIndex(l => l.id === lnb.id);
                        
                        if (draggedIndex !== -1 && draggedIndex !== dropIndex) {
                          const newOrder = [...lnbConfigs];
                          const [draggedLnb] = newOrder.splice(draggedIndex, 1);
                          newOrder.splice(dropIndex, 0, draggedLnb);
                          
                          // order 필드 업데이트 (현재 카테고리 내에서만)
                          // lnbConfigs는 이미 선택된 카테고리로 필터링된 상태
                          newOrder.forEach((item, index) => {
                            screenService.updateLNBConfig(item.id, { order: index + 1 });
                          });
                          
                          setLnbConfigs(newOrder);
                          autoSaveLnbConfig(); // 실시간 저장
                        }
                        setDraggedItem(null);
                      }}
                      onDragEnd={() => setDraggedItem(null)}
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
                      .map((child, childIndex) => (
                      <tr
                        key={child.id || `${lnb.id}-${child.name}`}
                        className={`hover:bg-gray-50 bg-gray-50 cursor-pointer ${
                          draggedChildItem?.childId === child.id && draggedChildItem?.parentId === lnb.id ? 'opacity-50' : ''
                        }`}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', JSON.stringify({ parentId: lnb.id, childId: child.id }));
                          setDraggedChildItem({ parentId: lnb.id, childId: child.id });
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
                          
                          // 같은 부모 내에서만 드래그 앤 드롭 허용
                          if (dragData.parentId === lnb.id) {
                            const sortedChildren = [...(lnb.children || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
                            const draggedIndex = sortedChildren.findIndex(c => c.id === dragData.childId);
                            const dropIndex = childIndex;
                            
                            if (draggedIndex !== -1 && draggedIndex !== dropIndex) {
                              const newOrder = [...sortedChildren];
                              const [draggedChild] = newOrder.splice(draggedIndex, 1);
                              newOrder.splice(dropIndex, 0, draggedChild);
                              
                              // order 필드 업데이트
                              const reorderedChildren = newOrder.map((c, index) => ({
                                ...c,
                                order: index + 1
                              }));
                              
                              screenService.updateLNBConfig(lnb.id, { children: reorderedChildren });
                              loadData();
                              autoSaveLnbConfig(); // 실시간 저장
                            }
                          }
                          setDraggedChildItem(null);
                        }}
                        onDragEnd={() => setDraggedChildItem(null)}
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
        )}
      </div>

        {/* LNB 메뉴 추가/수정 모달 */}
        <Modal
          isOpen={showLNBModal}
          onClose={() => {
            setShowLNBModal(false);
            resetLNBForm();
          }}
          title={editingLNB ? 'LNB 메뉴 수정' : 'LNB 메뉴 추가'}
          size="md"
          footer={
            <div className="flex justify-end space-x-3">
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
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {editingLNB ? '저장' : '추가'}
              </button>
            </div>
          }
        >
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
                        className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMS41TDYgNi41TDExIDEuNSIgc3Ryb2tlPSIjNkI3MjgwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==')] bg-[right_0.5rem_center] bg-no-repeat"
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                    <textarea
                      value={newLNB.description}
                      onChange={(e) => setNewLNB({ ...newLNB, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="메뉴에 대한 설명을 입력하세요"
                      rows={2}
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
                        className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMS41TDYgNi41TDExIDEuNSIgc3Ryb2tlPSIjNkI3MjgwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==')] bg-[right_0.5rem_center] bg-no-repeat"
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
                          // 기본/일반
                          { value: 'Home', component: Home, name: '홈', category: '기본' },
                          { value: 'BarChart3', component: BarChart3, name: '차트', category: '기본' },
                          { value: 'Settings', component: Settings, name: '설정', category: '기본' },
                          { value: 'Database', component: Database, name: '데이터베이스', category: '기본' },
                          { value: 'Table', component: Table, name: '테이블', category: '기본' },
                          { value: 'FileText', component: FileText, name: '문서', category: '기본' },
                          { value: 'FolderOpen', component: FolderOpen, name: '폴더', category: '기본' },
                          { value: 'Users', component: Users, name: '사용자', category: '기본' },
                          
                          // 구조물/건설
                          { value: 'Building2', component: Building2, name: '구조물', category: '건설' },
                          { value: 'Construction', component: Construction, name: '공사', category: '건설' },
                          { value: 'Anchor', component: Anchor, name: '지점/받침', category: '건설' },
                          { value: 'Box', component: Box, name: '박스', category: '건설' },
                          { value: 'Package', component: Package, name: '패키지', category: '건설' },
                          { value: 'Boxes', component: Boxes, name: '부재', category: '건설' },
                          
                          // 측정/분석
                          { value: 'Ruler', component: Ruler, name: '측정', category: '측정' },
                          { value: 'Calculator', component: Calculator, name: '계산', category: '측정' },
                          { value: 'Activity', component: Activity, name: '활동/파형', category: '측정' },
                          { value: 'TrendingUp', component: TrendingUp, name: '증가 추세', category: '측정' },
                          { value: 'TrendingDown', component: TrendingDown, name: '감소 추세', category: '측정' },
                          
                          // 설계/도면
                          { value: 'Compass', component: Compass, name: '나침반/방향', category: '설계' },
                          { value: 'PenTool', component: PenTool, name: '펜/설계', category: '설계' },
                          { value: 'Image', component: Image, name: '단면/이미지', category: '설계' },
                          { value: 'Layers', component: Layers, name: '레이어', category: '설계' },
                          { value: 'Layout', component: Layout, name: '레이아웃', category: '설계' },
                          
                          // 위치/경로
                          { value: 'MapPin', component: MapPin, name: '위치', category: '위치' },
                          { value: 'Map', component: Map, name: '지도', category: '위치' },
                          { value: 'Navigation', component: Navigation, name: '내비게이션', category: '위치' },
                          
                          // 도형/형상
                          { value: 'Circle', component: Circle, name: '원형', category: '도형' },
                          { value: 'Square', component: Square, name: '사각형', category: '도형' },
                          { value: 'Triangle', component: Triangle, name: '삼각형', category: '도형' },
                          { value: 'Hexagon', component: Hexagon, name: '육각형', category: '도형' },
                          
                          // 연결/분기
                          { value: 'GitBranch', component: GitBranch, name: '분기', category: '연결' },
                          { value: 'Split', component: Split, name: '분할', category: '연결' },
                          { value: 'Merge', component: Merge, name: '병합', category: '연결' },
                          
                          // 크기/변형
                          { value: 'Maximize2', component: Maximize2, name: '확대', category: '변형' },
                          { value: 'Move', component: Move, name: '이동', category: '변형' },
                          { value: 'ArrowUpDown', component: ArrowUpDown, name: '상하', category: '변형' },
                          
                          // 도구
                          { value: 'Hammer', component: Hammer, name: '해머', category: '도구' },
                          { value: 'Wrench', component: Wrench, name: '렌치', category: '도구' },
                          { value: 'Scissors', component: Scissors, name: '가위', category: '도구' },
                          
                          // 데이터 구조
                          { value: 'Component', component: Component, name: '컴포넌트', category: '데이터' },
                          { value: 'Code', component: Code, name: '코드', category: '데이터' },
                          { value: 'Variable', component: Variable, name: '변수', category: '데이터' },
                          { value: 'Type', component: Type, name: '타입', category: '데이터' },
                          { value: 'Grid', component: Grid, name: '그리드', category: '데이터' },
                          { value: 'Columns', component: Columns, name: '컬럼', category: '데이터' },
                          { value: 'Rows', component: Rows, name: '행', category: '데이터' },
                          { value: 'LayoutGrid', component: LayoutGrid, name: '그리드 레이아웃', category: '데이터' },
                          
                          // 검증/상태
                          { value: 'Shield', component: Shield, name: '안전/보호', category: '상태' },
                          { value: 'AlertTriangle', component: AlertTriangle, name: '경고', category: '상태' },
                          { value: 'CheckCircle', component: CheckCircle, name: '검증 완료', category: '상태' },
                          
                          // 기타
                          { value: 'Tag', component: Tag, name: '태그', category: '기타' },
                          { value: 'Monitor', component: Monitor, name: '모니터', category: '기타' },
                          { value: 'Menu', component: Menu, name: '메뉴', category: '기타' },
                          { value: 'BookOpen', component: BookOpen, name: '매뉴얼', category: '기타' },
                          { value: 'ListTree', component: ListTree, name: '트리', category: '기타' },
                          { value: 'FileStack', component: FileStack, name: '파일', category: '기타' },
                          { value: 'FileCode', component: FileCode, name: '코드파일', category: '기타' }
                        ].map((iconItem) => {
                          const IconComponent = iconItem.component;
                          return (
                            <button
                              key={iconItem.value}
                              type="button"
                              onClick={() => setNewLNB({ ...newLNB, icon: iconItem.value })}
                              className={`w-10 h-10 flex items-center justify-center rounded-md border-2 transition-all ${
                                newLNB.icon === iconItem.value 
                                  ? 'border-blue-500 bg-blue-100' 
                                  : 'border-gray-300 bg-white hover:border-gray-400'
                              }`}
                              title={`${iconItem.name} (${iconItem.category})`}
                            >
                              <IconComponent className="h-5 w-5 text-gray-700" />
                            </button>
                          );
                        })}
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
        </Modal>
    </PageLayout>
  );
};

export default LnbManager;
