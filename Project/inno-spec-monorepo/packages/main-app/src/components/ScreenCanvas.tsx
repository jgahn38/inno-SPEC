import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, Settings, Plus, Save } from 'lucide-react';
import { ScreenComponent, ComponentConfig, ScreenConfig } from '../types';

interface ScreenCanvasProps {
  components?: ScreenComponent[];
  screen?: ScreenConfig;
  onComponentsChange: (components: ScreenComponent[]) => void;
  onLayoutChange: (layout: 'single' | 'grid' | 'tabs', gridConfig?: { rows: number; cols: number }, tabs?: Array<{ name: string; gridConfig: { rows: Array<{ cols: Array<{ width: number }> }> } }>, components?: ScreenComponent[]) => void;
  availableTables?: any[];
  availableVariables?: any[];
}

interface DraggedItem {
  type: 'table' | 'variable';
  id: string;
  displayName: string;
}

const ScreenCanvas: React.FC<ScreenCanvasProps> = ({
  components: propComponents,
  screen,
  onComponentsChange,
  onLayoutChange,
  availableTables = [],
  availableVariables = []
}) => {
  // 받은 데이터 로그
  console.log('🎨 ScreenCanvas 받은 데이터:', {
    hasScreen: !!screen,
    screenLayout: screen?.layout,
    availableTablesCount: availableTables.length,
    availableVariablesCount: availableVariables.length,
    availableTables: availableTables.map(t => ({ id: t.id, displayName: t.displayName })),
    availableVariables: availableVariables.map(v => ({ id: v.id, displayName: v.displayName }))
  });

  // screen prop이 있으면 screen.components를 사용, 없으면 propComponents 사용
  const components = screen ? screen.components : (propComponents || []);
  
  // screen prop이 있으면 screen의 레이아웃 설정을 사용
  const screenTabs = screen ? screen.tabs : null;
  // const screenGridConfig = screen ? screen.gridConfig : null; // 사용하지 않음
  
  // 초기 상태 저장
  useEffect(() => {
    if (screen) {
      const layout = screen.layout || 'single';
      const tabs = screenTabs ? screenTabs.map(tab => typeof tab === 'string' ? { name: tab, gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } } : tab) : [];
      
      // 단일 레이아웃이고 탭이 없으면 기본 탭 생성
      const finalTabs = layout === 'single' && tabs.length === 0 
        ? [{ name: '단일 그리드', gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } }]
        : tabs;
      
      // setOriginalComponents([...components]); // 사용하지 않음
      // setOriginalLayout(layout); // 사용하지 않음
      // setOriginalTabs(finalTabs); // 사용하지 않음
      
      // 로컬 상태도 초기화
      setLocalComponents([...components]);
      setLocalLayout(layout);
      setLocalTabs(finalTabs);
      
      setHasUnsavedChanges(false);
    }
  }, [screen?.id]); // screen.id가 변경될 때만 초기화


  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [showComponentSettings, setShowComponentSettings] = useState<string | null>(null);
  const [showLayoutSettings, setShowLayoutSettings] = useState(false);
  const [tempTabs, setTempTabs] = useState<Array<{ name: string; gridConfig: { rows: Array<{ cols: Array<{ width: number }> }> } }>>([]);
  const [draggedComponent, setDraggedComponent] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draggedComponentPosition, setDraggedComponentPosition] = useState({ x: 0, y: 0 });
  const draggedComponentPositionRef = useRef({ x: 0, y: 0 });
  // const [forceRerender, setForceRerender] = useState(0); // 사용하지 않음

  const [tabs, setTabs] = useState<Array<{ name: string; gridConfig: { rows: Array<{ cols: Array<{ width: number }> }> } }>>([
    { name: '탭 1', gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }, { cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }, { cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } },
    { name: '탭 2', gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }, { cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }, { cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } }
  ]);
  // const [newTabName, setNewTabName] = useState(''); // 사용하지 않음
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const canvasRef = useRef<HTMLDivElement>(null);

  // 변경사항 추적을 위한 상태
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  // const [originalComponents, setOriginalComponents] = useState<ScreenComponent[]>([]); // 사용하지 않음
  // const [originalLayout, setOriginalLayout] = useState<'single' | 'grid' | 'tabs'>('single'); // 사용하지 않음
  // const [originalTabs, setOriginalTabs] = useState<Array<{ name: string; gridConfig: { rows: Array<{ cols: Array<{ width: number }> }> } }>>([]); // 사용하지 않음
  
  // 로컬 편집 상태 (저장 전까지 임시 상태)
  const [localComponents, setLocalComponents] = useState<ScreenComponent[]>([]);
  const [localLayout, setLocalLayout] = useState<'single' | 'grid' | 'tabs'>('single');
  const [localTabs, setLocalTabs] = useState<Array<{ name: string; gridConfig: { rows: Array<{ cols: Array<{ width: number }> }> } }>>([]);



  // 변경사항 추적 함수들
  const markAsChanged = () => {
    setHasUnsavedChanges(true);
  };

  const handleComponentsChange = (newComponents: ScreenComponent[]) => {
    setLocalComponents(newComponents);
    markAsChanged();
  };

  const handleLayoutChange = (layout: 'single' | 'grid' | 'tabs', _gridConfig?: { rows: number; cols: number }, tabs?: Array<{ name: string; gridConfig: { rows: Array<{ cols: Array<{ width: number }> }> } }>, components?: ScreenComponent[]) => {
    setLocalLayout(layout);
    if (tabs) {
      // tabs가 이미 객체 배열인 경우 그대로 사용
      setLocalTabs(tabs);
    } else if (layout === 'single' && localTabs.length === 0) {
      // 단일 레이아웃이고 탭이 없으면 기본 탭 생성
      setLocalTabs([{ name: '단일 그리드', gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } }]);
    } else if (layout === 'tabs' && localTabs.length === 0) {
      // 탭 레이아웃이고 탭이 없으면 기본 탭 2개 생성
      setLocalTabs([
        { name: '탭 1', gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } },
        { name: '탭 2', gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } }
      ]);
    }
    if (components) {
      setLocalComponents(components);
    }
    markAsChanged();
  };

  // 탭 레이아웃인데 탭이 없는 경우 기본 탭 생성
  useEffect(() => {
    if (screen && localLayout === 'tabs' && localTabs.length === 0) {
      console.log('🚨 탭 레이아웃이지만 탭이 없음 - 기본 탭 생성 필요');
      // 기본 탭 2개 생성
      const defaultTabs = [
        { name: '탭 1', gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }, { cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }, { cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } },
        { name: '탭 2', gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }, { cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }, { cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } }
      ];
      setLocalTabs(defaultTabs);
      handleLayoutChange('tabs', undefined, defaultTabs, localComponents);
    }
  }, [screen, localLayout, localTabs, localComponents]);

  // handleCancelChanges는 현재 사용되지 않음

  const handleSaveChanges = () => {
    if (!hasUnsavedChanges) return;
    
    // 로컬 상태를 실제로 저장
    onComponentsChange([...localComponents]);
    onLayoutChange(localLayout, undefined, localTabs, localComponents);
    
    // 원래 상태를 현재 로컬 상태로 업데이트
    // setOriginalComponents([...localComponents]); // 사용하지 않음
    // setOriginalLayout(localLayout); // 사용하지 않음
    // setOriginalTabs([...localTabs]); // 사용하지 않음
    
    setHasUnsavedChanges(false);
    
    // 로컬 상태 정리
    setShowLayoutSettings(false);
    setTempTabs([]);
  };

  // 마우스 이벤트 리스너 추가
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggedComponent) {
        handleComponentDragMove(e);
      }
    };

    const handleMouseUp = () => {
      if (draggedComponent) {
        handleComponentDragEnd();
      }
    };

    if (draggedComponent) {
      console.log('이벤트 리스너 추가됨');
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedComponent, dragOffset]);

  // 현재 선택된 탭의 그리드 설정 가져오기 (로컬 상태 사용)
  const getCurrentGridConfig = () => {
    // screen prop이 있으면 로컬 레이아웃 설정 사용
    if (screen) {
      if (localLayout === 'tabs' && localTabs.length > 0) {
        const tab = localTabs[selectedTabIndex];
        if (tab && typeof tab === 'object' && 'gridConfig' in tab) {
          return (tab as any).gridConfig.rows || [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }];
        }
      } else if (localLayout === 'single' && localTabs.length > 0) {
        // 단일 레이아웃인 경우 첫 번째 탭의 그리드 설정 사용
        const tab = localTabs[0];
        if (tab && typeof tab === 'object' && 'gridConfig' in tab) {
          return (tab as any).gridConfig.rows || [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }];
        }
      }
      // 기본값
      return [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }];
    }
    
    // 기본 로컬 tabs 사용
    if (tabs.length === 0) {
      return [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }, { cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }, { cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }]; // 기본값
    }
    return tabs[selectedTabIndex]?.gridConfig.rows || [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }, { cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }, { cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }];
  };

  // 특정 행의 열 설정 가져오기
  const getRowCols = (rowIndex: number) => {
    const gridConfig = getCurrentGridConfig();
    return gridConfig[rowIndex]?.cols || [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }];
  };

  // 특정 행의 열 개수 가져오기
  const getRowColCount = (rowIndex: number) => {
    return getRowCols(rowIndex).length;
  };

  // 특정 행의 특정 열의 폭 비율 가져오기
  const getColWidth = (rowIndex: number, colIndex: number) => {
    const rowCols = getRowCols(rowIndex);
    const width = rowCols[colIndex]?.width;
    return typeof width === 'number' ? width : 0.25;
  };

  // 특정 행의 누적 폭 비율 계산 (열 위치 계산용)
  const getColPosition = (rowIndex: number, colIndex: number) => {
    const rowCols = getRowCols(rowIndex);
    return rowCols.slice(0, colIndex).reduce((sum: number, col: any) => sum + (typeof col.width === 'number' ? col.width : 0.25), 0);
  };

  // 드래그 시작
  const handleDragStart = (e: React.DragEvent, item: DraggedItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'copy';
  };



  // 현재 탭의 컴포넌트들만 가져오기 (로컬 상태 사용)
  const getCurrentTabComponents = () => {
    console.log('🔍 getCurrentTabComponents 호출:', {
      hasScreen: !!screen,
      localLayout,
      screenId: screen?.id,
      screenName: screen?.name,
      hasLocalTabs: localTabs.length > 0,
      localTabsLength: localTabs.length,
      selectedTabIndex,
      totalLocalComponents: localComponents.length,
      allLocalComponents: localComponents.map(c => ({ 
        id: c.id, 
        tabIndex: c.tabIndex, 
        position: c.position,
        displayName: c.displayName 
      }))
    });
    
    if (screen && localLayout === 'tabs' && localTabs.length > 0) {
      // 탭 레이아웃인 경우 현재 탭의 컴포넌트만 반환
      // tabIndex가 undefined인 기존 컴포넌트들은 첫 번째 탭(인덱스 0)에 속하도록 처리
      const filteredComponents = localComponents.filter(comp => {
        const compTabIndex = comp.tabIndex !== undefined ? comp.tabIndex : 0;
        const isMatch = compTabIndex === selectedTabIndex;
        console.log(`  📋 컴포넌트 ${comp.id} (${comp.displayName}): tabIndex=${comp.tabIndex} -> compTabIndex=${compTabIndex}, selectedTabIndex=${selectedTabIndex}, match=${isMatch}`);
        return isMatch;
      });
      
      console.log('✅ 탭별 필터링 결과:', {
        selectedTabIndex,
        filteredCount: filteredComponents.length,
        filteredComponents: filteredComponents.map(c => ({ id: c.id, displayName: c.displayName, position: c.position }))
      });
      
      return filteredComponents;
    }
    // 단일 그리드 레이아웃인 경우 모든 컴포넌트 반환
    console.log('📄 단일 그리드 레이아웃 - 모든 컴포넌트 반환');
    return localComponents;
  };

  // 컴포넌트 삭제
  const handleDeleteComponent = (componentId: string) => {
    const updatedComponents = localComponents.filter(comp => comp.id !== componentId);
    handleComponentsChange(updatedComponents);
    setSelectedComponent(null);
    // setForceRerender(prev => prev + 1); // 사용하지 않음
  };

  // 컴포넌트 설정 변경
  const handleComponentConfigChange = (componentId: string, updates: Partial<ComponentConfig>) => {
    const updatedComponents = localComponents.map(comp => 
      comp.id === componentId 
        ? { ...comp, config: { ...comp.config, ...updates } }
        : comp
    );
    handleComponentsChange(updatedComponents);
  };

  // 컴포넌트 위치/크기 변경
  const handleComponentResize = (componentId: string, updates: Partial<{ x: number; y: number; width: number; height: number }>) => {
    const updatedComponents = localComponents.map(comp => 
      comp.id === componentId 
        ? { ...comp, position: { ...comp.position, ...updates } }
        : comp
    );
    handleComponentsChange(updatedComponents);
  };

  // 행 추가
  // handleAddRow는 현재 사용되지 않음

  // handleDeleteRow는 현재 사용되지 않음

  // handleAddCol는 현재 사용되지 않음

  // handleDeleteCol는 현재 사용되지 않음

  // handleColWidthChange는 현재 사용되지 않음

  // handleAddTab는 현재 사용되지 않음

  // handleDeleteTab, handleTabNameChange는 현재 사용되지 않음

  // 레이아웃 설정 대화창 열기
  const handleOpenLayoutSettings = () => {
    let tabsToUse;
    
    if (screen) {
      // screen prop이 있으면 로컬 탭 설정을 사용
      if (localLayout === 'tabs') {
        if (localTabs && localTabs.length > 0) {
          tabsToUse = localTabs.map(tab => ({
            name: typeof tab === 'string' ? tab : (tab as any).name,
            gridConfig: typeof tab === 'object' && 'gridConfig' in tab 
              ? (tab as any).gridConfig 
              : { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] }
          }));
        } else {
          // 탭 레이아웃이지만 탭이 없으면 기본 탭 생성
          tabsToUse = [
            { name: '탭 1', gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } },
            { name: '탭 2', gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } }
          ];
        }
      } else {
        // 단일 레이아웃인 경우
        if (localTabs && localTabs.length > 0) {
          // 기존 localTabs의 첫 번째 탭 사용
          tabsToUse = [localTabs[0]];
        } else {
          // 기본 단일 그리드 설정
          tabsToUse = [{ name: '단일 그리드', gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } }];
        }
      }
    } else {
      // screen prop이 없으면 기본 tabs 사용
      tabsToUse = tabs.length > 0 ? tabs : [
        { name: '탭 1', gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } },
        { name: '탭 2', gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } }
      ];
    }
    
    setTempTabs(JSON.parse(JSON.stringify(tabsToUse))); // 깊은 복사
    setShowLayoutSettings(true);
  };

  // 레이아웃 설정 저장
  const handleSaveLayoutSettings = () => {
    if (screen) {
      // screen prop이 있으면 로컬 탭 설정을 업데이트
      if (localLayout === 'single') {
        // 단일 레이아웃인 경우 tempTabs의 첫 번째 탭만 사용
        setLocalTabs(tempTabs.length > 0 ? [tempTabs[0]] : []);
        handleLayoutChange(localLayout, undefined, tempTabs.length > 0 ? [tempTabs[0]] : [], localComponents);
      } else {
        // 탭 레이아웃인 경우 모든 탭 사용
        setLocalTabs(tempTabs);
        handleLayoutChange(localLayout, undefined, tempTabs, localComponents);
      }
    } else {
      // screen prop이 없으면 기본 tabs 상태 업데이트
      setTabs(tempTabs);
      // 탭의 그리드 설정 정보를 포함하여 전달
      handleLayoutChange('tabs', undefined, tempTabs);
    }
    setShowLayoutSettings(false);
  };

  // 레이아웃 설정 취소
  const handleCancelLayoutSettings = () => {
    setTempTabs([]);
    setShowLayoutSettings(false);
  };

  // 임시 탭 관련 함수들
  // handleTempAddRow는 현재 사용되지 않음

  // handleTempDeleteRow는 현재 사용되지 않음

  // handleTempAddCol는 현재 사용되지 않음

  // handleTempDeleteCol는 현재 사용되지 않음

  // handleTempColWidthChange는 현재 사용되지 않음

  // handleTempAddTab는 현재 사용되지 않음

  // handleTempDeleteTab, handleTempTabNameChange는 현재 사용되지 않음

  // 레이어 순서 변경 함수들
  const handleLayerUp = (componentId: string) => {
    const targetComponent = localComponents.find(comp => comp.id === componentId);
    if (!targetComponent) return;
    
    // 같은 셀에 있는 컴포넌트들 찾기 (현재 탭의 컴포넌트만)
    const currentTabComponents = getCurrentTabComponents();
    const cellComponents = currentTabComponents.filter(comp => 
      comp.position.x === targetComponent.position.x && 
      comp.position.y === targetComponent.position.y
    );
    
    // 현재 레이어보다 높은 레이어의 컴포넌트 찾기
    const currentLayer = targetComponent.layer || 0;
    const higherLayerComponent = cellComponents.find(comp => 
      comp.id !== componentId && (comp.layer || 0) > currentLayer
    );
    
    if (higherLayerComponent) {
      // 레이어 교환
      const updatedComponents = localComponents.map(comp => {
        if (comp.id === componentId) {
          return { ...comp, layer: higherLayerComponent.layer || 0 };
        } else if (comp.id === higherLayerComponent.id) {
          return { ...comp, layer: currentLayer };
        }
        return comp;
      });
      
      handleComponentsChange(updatedComponents);
      // setForceRerender(prev => prev + 1); // 사용하지 않음
    }
  };

  const handleLayerDown = (componentId: string) => {
    const targetComponent = localComponents.find(comp => comp.id === componentId);
    if (!targetComponent) return;
    
    // 같은 셀에 있는 컴포넌트들 찾기 (현재 탭의 컴포넌트만)
    const currentTabComponents = getCurrentTabComponents();
    const cellComponents = currentTabComponents.filter(comp => 
      comp.position.x === targetComponent.position.x && 
      comp.position.y === targetComponent.position.y
    );
    
    // 현재 레이어보다 낮은 레이어의 컴포넌트 찾기
    const currentLayer = targetComponent.layer || 0;
    const lowerLayerComponent = cellComponents.find(comp => 
      comp.id !== componentId && (comp.layer || 0) < currentLayer
    );
    
    if (lowerLayerComponent) {
      // 레이어 교환
      const updatedComponents = localComponents.map(comp => {
        if (comp.id === componentId) {
          return { ...comp, layer: lowerLayerComponent.layer || 0 };
        } else if (comp.id === lowerLayerComponent.id) {
          return { ...comp, layer: currentLayer };
        }
        return comp;
      });
      
      handleComponentsChange(updatedComponents);
      // setForceRerender(prev => prev + 1); // 사용하지 않음
    }
  };

  // 동적 행 높이 계산 - useMemo로 최적화
  const rowHeights = useMemo(() => {
    console.log('useMemo 재계산 시작 - localComponents:', localComponents.map(c => ({ id: c.id, position: c.position })));
    
    const currentGridConfig = getCurrentGridConfig();
    const heights: number[] = [];
    const currentTabComponents = getCurrentTabComponents();
    
    for (let rowIndex = 0; rowIndex < currentGridConfig.length; rowIndex++) {
      // 해당 행의 모든 컴포넌트들 찾기 (현재 탭의 컴포넌트만)
      const rowComponents = currentTabComponents.filter(comp => 
        comp.position.y === rowIndex
      );

      console.log(`행 ${rowIndex} 높이 계산:`, {
        componentsToUse: localComponents.length,
        rowComponents: rowComponents.length,
        components: rowComponents.map(c => ({ id: c.id, position: c.position }))
      });

      // 컴포넌트가 없으면 기본 높이
      if (rowComponents.length === 0) {
        console.log(`행 ${rowIndex}: 컴포넌트 없음, 기본 높이 50px`);
        heights[rowIndex] = 50;
      } else {
        // 각 셀별로 컴포넌트 개수 계산
        const cellComponentCounts = new Map<string, number>();
        
        rowComponents.forEach(comp => {
          const cellKey = `${comp.position.x},${comp.position.y}`;
          cellComponentCounts.set(cellKey, (cellComponentCounts.get(cellKey) || 0) + 1);
        });
        
        // 가장 많은 컴포넌트가 있는 셀의 개수 찾기
        const maxComponentsInCell = Math.max(...cellComponentCounts.values());
        
        console.log(`행 ${rowIndex}: 셀별 컴포넌트 개수`, {
          cellComponentCounts: Object.fromEntries(cellComponentCounts),
          maxComponentsInCell
        });
        
        // 컴포넌트 개수에 따른 높이 계산 (기본 50px + 추가 컴포넌트당 50px)
        const baseHeight = 50;
        const additionalHeight = Math.max(0, maxComponentsInCell - 1) * 50;
        const totalHeight = baseHeight + additionalHeight;
        
        console.log(`행 ${rowIndex}: 높이 계산 완료`, {
          baseHeight,
          additionalHeight,
          totalHeight,
          maxComponentsInCell
        });
        
        heights[rowIndex] = totalHeight;
      }
    }
    
    console.log('useMemo 재계산 완료 - heights:', heights);
    return heights;
  }, [localComponents, selectedTabIndex, localTabs, localLayout, screen]);

  const getRowHeight = (rowIndex: number) => {
    return rowHeights[rowIndex] || 50;
  };

  const getRowTopPosition = (rowIndex: number) => {
    let top = 0;
    for (let i = 0; i < rowIndex; i++) {
      top += getRowHeight(i);
    }
    return top;
  };

  // 컴포넌트 드래그 핸들러들
  const handleComponentDragStart = (e: React.MouseEvent, componentId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('드래그 시작:', componentId);
    
    const component = components.find(c => c.id === componentId);
    if (!component) {
      console.log('컴포넌트를 찾을 수 없음:', componentId);
      return;
    }

    console.log('컴포넌트 찾음:', component);
    
    // 드래그 오프셋 계산 (캔버스 기준)
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    // 캔버스 내에서의 컴포넌트 위치
    const componentInCanvasX = rect.left - canvasRect.left;
    const componentInCanvasY = rect.top - canvasRect.top;
    
    // 마우스 클릭 지점의 오프셋
    const offsetX = e.clientX - canvasRect.left - componentInCanvasX;
    const offsetY = e.clientY - canvasRect.top - componentInCanvasY;
    

    
    setDraggedComponent(componentId);
    setDraggedComponentPosition(component.position);
    draggedComponentPositionRef.current = component.position;
    setDragOffset({ x: offsetX, y: offsetY });
  };

  const handleComponentDragMove = (e: MouseEvent) => {
    if (!draggedComponent || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    // 오프셋을 고려한 마우스 위치 계산
    const x = e.clientX - canvasRect.left - dragOffset.x;
    const y = e.clientY - canvasRect.top - dragOffset.y;

    // 그리드 셀 위치로 변환 (동적 높이 사용)
    const currentGridConfig = getCurrentGridConfig();
    
    // 동적 높이를 고려한 행 위치 계산
    let gridY = 0;
    let accumulatedHeight = 0;
    for (let i = 0; i < currentGridConfig.length; i++) {
      const rowHeight = getRowHeight(i);
      if (y >= accumulatedHeight && y < accumulatedHeight + rowHeight) {
        gridY = i;
        break;
      }
      accumulatedHeight += rowHeight;
    }
    gridY = Math.max(0, Math.min(gridY, currentGridConfig.length - 1));
    
    // 해당 행의 열 수에 따라 셀 너비 계산
    const rowColCount = getRowColCount(gridY);
    const cellWidth = canvasRect.width / rowColCount;
    const gridX = Math.max(0, Math.min(Math.floor(x / cellWidth), rowColCount - 1));

    // 드래그 중인 컴포넌트의 임시 위치 저장
    const newPosition = { x: gridX, y: gridY };
    setDraggedComponentPosition(newPosition);
    draggedComponentPositionRef.current = newPosition;
  };

  const handleComponentDragEnd = () => {
    if (draggedComponent) {
      const finalPosition = draggedComponentPositionRef.current;
      
      console.log('드래그 종료 - draggedComponentPosition:', finalPosition);
      console.log('드래그 종료 - finalPosition (ref):', draggedComponentPositionRef.current);
      console.log('드래그 종료 - 현재 컴포넌트들:', localComponents.map(c => ({ id: c.id, position: c.position })));
      
      // 드래그 종료 시에만 실제 위치 업데이트
      const updatedComponents = localComponents.map(comp => {
        if (comp.id === draggedComponent) {
          return { 
            ...comp, 
            position: { 
              ...comp.position, 
              x: finalPosition.x, 
              y: finalPosition.y 
            } 
          };
        }
        return comp;
      });
      
      console.log('컴포넌트 위치 업데이트:', {
        from: localComponents.find(c => c.id === draggedComponent)?.position,
        to: finalPosition
      });
      console.log('업데이트된 컴포넌트들:', updatedComponents.map(c => ({ id: c.id, position: c.position })));
      
            // 부모 컴포넌트에 변경사항 전달
      handleComponentsChange(updatedComponents);
      
      // 강제 리렌더링을 위한 상태 업데이트
      // setForceRerender(prev => prev + 1); // 사용하지 않음
      
      // 드래그 상태 초기화
      setDraggedComponent(null);
      setDraggedComponentPosition({ x: 0, y: 0 });
      draggedComponentPositionRef.current = { x: 0, y: 0 };
    } else {
      setDraggedComponent(null);
      setDraggedComponentPosition({ x: 0, y: 0 });
      draggedComponentPositionRef.current = { x: 0, y: 0 };
    }
  };

  // 그리드 셀 렌더링
  const renderGridCell = (x: number, y: number) => {
    const currentGridConfig = getCurrentGridConfig();
    
    // 그리드 범위를 벗어나면 렌더링하지 않음
    if (y >= currentGridConfig.length || x >= getRowColCount(y)) {
      return null;
    }

    // 이 셀에 있는 모든 컴포넌트 찾기 (현재 탭의 컴포넌트만)
    const currentTabComponents = getCurrentTabComponents();
    const cellComponents = currentTabComponents.filter(comp => {
      const isInComponent = comp.position.x <= x && 
        x < comp.position.x + (comp.position.width || 1) &&
      comp.position.y <= y && 
        y < comp.position.y + (comp.position.height || 1);
      

      
      return isInComponent;
    });

    // 레이어 순서대로 정렬 (낮은 layer가 먼저, 높은 layer가 나중에)
    const sortedComponents = cellComponents.sort((a, b) => (a.layer || 0) - (b.layer || 0));

    // 시작 셀인 컴포넌트들 찾기
    const startComponents = sortedComponents.filter(comp => comp.position.x === x && comp.position.y === y);

        return (
          <div
            key={`${x}-${y}`}
        className={`absolute border border-gray-200 ${
          startComponents.length > 0 
            ? 'bg-blue-100 border-blue-300 rounded-lg p-2 cursor-move' 
            : 'bg-gray-50'
            }`}
            style={{
          left: `${getColPosition(y, x) * 100}%`,
          top: `${getRowTopPosition(y)}px`,
          width: `${getColWidth(y, x) * 100}%`,
          height: `${getRowHeight(y)}px`,
          zIndex: startComponents.length > 0 ? 1 : 0
        }}
        onClick={() => {
          if (startComponents.length > 0) {
            // 가장 높은 레이어의 컴포넌트를 선택
            const topComponent = startComponents[startComponents.length - 1];
            setSelectedComponent(topComponent.id);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (!draggedItem) return;
          
          // 같은 셀에 있는 컴포넌트들의 최대 레이어 찾기 (현재 탭의 컴포넌트만)
          const currentTabComponents = getCurrentTabComponents();
          const cellComponents = currentTabComponents.filter(comp => 
            comp.position.x === x && comp.position.y === y
          );
          const maxLayer = cellComponents.length > 0 
            ? Math.max(...cellComponents.map(comp => comp.layer || 0))
            : -1;

          const newComponent: ScreenComponent = {
            id: `comp-${Date.now()}`,
            type: draggedItem.type,
            componentId: draggedItem.id,
            displayName: draggedItem.displayName,
            position: { x, y, width: 1, height: 1 },
            config: {
              showHeader: true,
              showPagination: true,
              showSearch: true,
              showFilters: true,
              maxRows: 10,
              refreshInterval: 0
            },
            layer: maxLayer + 1, // 기존 컴포넌트들보다 위에 배치
            tabIndex: screen && localLayout === 'tabs' && localTabs.length > 0 ? selectedTabIndex : undefined
          };
          
          console.log('🆕 새 컴포넌트 생성:', {
            component: newComponent,
            currentTabIndex: selectedTabIndex,
            screenLayout: screen?.layout,
            hasScreenTabs: !!(screen && screenTabs),
            screenTabsLength: screenTabs?.length
          });

          handleComponentsChange([...localComponents, newComponent]);
          setDraggedItem(null);
          // setForceRerender(prev => prev + 1); // 사용하지 않음
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
        }}
      >
        {startComponents.map((component, index) => {
          // 컴포넌트 높이를 고정 (50px)
          const componentHeight = 50;
          const componentTop = index * componentHeight;
          
          return (
            <div
              key={component.id}
              className={`cursor-move select-none absolute ${draggedComponent === component.id ? 'opacity-0' : ''} ${
                selectedComponent === component.id ? 'ring-2 ring-blue-500 rounded' : ''
              }`}
              style={{
                zIndex: (component.layer || 0) + 10,
                top: `${componentTop}px`,
                left: '0',
                right: '0',
                height: `${componentHeight}px`,
                userSelect: 'none'
              }}
            onMouseDown={(e) => {
              handleComponentDragStart(e, component.id);
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedComponent(component.id);
            }}
          >
              <div className="flex flex-col h-full p-1">
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <div className="flex items-center space-x-1 flex-1 min-w-0">
              <span className="text-xs font-medium text-blue-800 truncate">
                {component.displayName}
              </span>
                    {startComponents.length > 1 && (
                      <span className="text-xs text-gray-500 bg-gray-200 px-1 rounded flex-shrink-0">
                        L{(component.layer || 0) + 1}
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-1 flex-shrink-0">
                    {startComponents.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLayerUp(component.id);
                          }}
                          className="text-gray-600 hover:text-gray-800 p-1 flex items-center justify-center"
                          title="위로"
                          style={{ width: '20px', height: '20px' }}
                        >
                          <span className="text-xs leading-none">↑</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLayerDown(component.id);
                          }}
                          className="text-gray-600 hover:text-gray-800 p-1 flex items-center justify-center"
                          title="아래로"
                          style={{ width: '20px', height: '20px' }}
                        >
                          <span className="text-xs leading-none">↓</span>
                        </button>
                      </>
                    )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowComponentSettings(component.id);
                  }}
                  className="text-blue-600 hover:text-blue-800 p-1"
                  title="설정"
                >
                  <Settings className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteComponent(component.id);
                  }}
                  className="text-red-600 hover:text-red-800 p-1"
                  title="삭제"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
                <div className="text-xs text-blue-600 flex-shrink-0">
              {component.type === 'table' ? '📊 테이블' : '📈 변수'}
                </div>
            </div>
          </div>
        );
        })}
      </div>
    );
  };

  return (
    <div className="flex h-full">
      {/* 좌측: 사용 가능한 컴포넌트 목록 */}
      {(
      <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
        <h3 className="text-lg font-medium text-gray-900 mb-4">사용 가능한 컴포넌트</h3>
        
        {/* 테이블 목록 */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            📊 테이블
          </h4>
          <div className="space-y-2">
            {availableTables.map(table => (
              <div
                key={table.id}
                draggable
                onDragStart={(e) => handleDragStart(e, {
                  type: 'table',
                  id: table.id,
                  displayName: table.displayName
                })}
                className="p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-move hover:bg-blue-100 transition-colors"
              >
                <div className="text-sm font-medium text-blue-900">{table.displayName}</div>
                <div className="text-xs text-blue-600">{table.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 변수 목록 */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            📈 변수
          </h4>
          <div className="space-y-2">
            {availableVariables.map(variable => (
              <div
                key={variable.id}
                draggable
                onDragStart={(e) => handleDragStart(e, {
                  type: 'variable',
                  id: variable.id,
                  displayName: variable.displayName
                })}
                className="p-3 bg-green-50 border border-green-200 rounded-lg cursor-move hover:bg-green-100 transition-colors"
              >
                <div className="text-sm font-medium text-green-900">{variable.displayName}</div>
                <div className="text-xs text-green-600">{variable.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* 우측: 레이아웃 캔버스 */}
      <div className="flex-1 p-4">
        {/* 레이아웃 설정 UI */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            {/* 레이아웃 타입 선택 */}
            <div className="flex items-center space-x-4">
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="layoutType"
                    value="single"
                    checked={localLayout === 'single'}
                    onChange={(e) => {
                      const newLayout = e.target.value as 'single' | 'tabs';
                      handleLayoutChange(newLayout, undefined, undefined, localComponents);
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">단일</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="layoutType"
                    value="tabs"
                    checked={localLayout === 'tabs'}
                    onChange={(e) => {
                      const newLayout = e.target.value as 'single' | 'tabs';
                      if (newLayout === 'tabs') {
                        // 탭 레이아웃으로 변경할 때 기본 탭 2개 생성
                        const defaultTabs = [
                          { name: '탭 1', gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } },
                          { name: '탭 2', gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } }
                        ];
                        handleLayoutChange(newLayout, undefined, defaultTabs, localComponents);
                      } else {
                        handleLayoutChange(newLayout, undefined, undefined, localComponents);
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">탭</span>
                </label>
              </div>
              
              {/* 탭 개수 설정 - 탭 레이아웃일 때만 표시 */}
              {(screen && localLayout === 'tabs') && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">탭 개수:</span>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={localTabs.length || 2}
                    onChange={(e) => {
                      const tabCount = parseInt(e.target.value) || 2;
                      const newTabs = Array.from({ length: tabCount }, (_, i) => ({
                        name: `탭 ${i + 1}`,
                        gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] }
                      }));
                      setLocalTabs(newTabs);
                      handleLayoutChange('tabs', undefined, newTabs, localComponents);
                    }}
                    className="w-16 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <span className="text-sm text-gray-500">개</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {/* 그리드 설정 버튼 */}
              <button
                onClick={handleOpenLayoutSettings}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>그리드 설정</span>
              </button>
              
              {/* 저장 버튼 */}
              <button
                onClick={handleSaveChanges}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                  hasUnsavedChanges 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-400 text-white cursor-not-allowed'
                }`}
                disabled={!hasUnsavedChanges}
              >
                <Save className="h-4 w-4" />
                <span>저장</span>
              </button>
            </div>
        </div>
          



        </div>



        {/* 탭 선택 UI - 탭 레이아웃일 때만 표시 */}
        {(screen && localLayout === 'tabs' && localTabs.length > 0) && (
          <div className="mb-4">
            <div className="flex space-x-2 border-b border-gray-200">
              {localTabs.map((tab, index) => (
                <button
                  key={index}
                  onClick={() => {
                    console.log('🔄 탭 변경:', { from: selectedTabIndex, to: index });
                    setSelectedTabIndex(index);
                  }}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    selectedTabIndex === index
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 캔버스 */}
        <div
          ref={canvasRef}
          className="relative bg-white border-2 border-dashed border-gray-300 rounded-lg"
          style={{ height: '600px' }}
        >
          {/* 그리드 가이드 */}
          <div className="absolute inset-0 pointer-events-none">
            {(() => {
              const currentGridConfig = getCurrentGridConfig();
              return (
                <>
                  {/* 가로선 */}
                  {Array.from({ length: currentGridConfig.length - 1 }, (_, y) => (
              <div
                key={y}
                className="absolute left-0 right-0 border-t border-gray-200"
                      style={{ top: `${getRowTopPosition(y + 1)}px` }}
              />
            ))}
                </>
              );
            })()}
          </div>

          {/* 드래그 중인 컴포넌트 미리보기 */}
          {draggedComponent && (() => {
            // 실제 컴포넌트와 동일한 크기 계산 사용
            const left = getColPosition(draggedComponentPosition.y, draggedComponentPosition.x) * 100;
            const width = getColWidth(draggedComponentPosition.y, draggedComponentPosition.x) * 100;
            const top = getRowTopPosition(draggedComponentPosition.y); // 동적 높이 사용
            
            const height = 50; // 고정 높이 사용
            
            return (
              <div 
                className="absolute pointer-events-none" 
                style={{ 
                  zIndex: 10,
                  left: `${left}%`,
                  top: `${top}px`,
                  width: `${width}%`,
                  height: `${height}px` // 고정 높이 사용
                }}
              >
                <div className="bg-blue-100 border-2 border-blue-300 rounded p-2 shadow-lg h-full flex flex-col justify-center">
                  <div className="text-xs font-medium text-blue-800 text-center">
                    {components.find(c => c.id === draggedComponent)?.displayName}
              </div>
                  <div className="text-xs text-blue-600 text-center">
                    {components.find(c => c.id === draggedComponent)?.type === 'table' ? '📊 테이블' : '📈 변수'}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 컴포넌트들 */}
          {(() => {
            const currentGridConfig = getCurrentGridConfig();
            const cells = [];
            for (let y = 0; y < currentGridConfig.length; y++) {
              for (let x = 0; x < getRowColCount(y); x++) {
                cells.push(renderGridCell(x, y));
              }
            }
            return cells;
          })()}



          {/* 그리드 정보 표시 */}
          {((screen && localLayout === 'tabs' && localTabs.length > 0) || tabs.length > 0) && (
            <div className="absolute top-2 right-2 bg-white bg-opacity-90 px-2 py-1 rounded text-xs text-gray-600">
              {screen && localTabs.length > 0
                ? localTabs[selectedTabIndex]?.name
                : tabs[selectedTabIndex]?.name
              }: {getCurrentGridConfig().length}행
            </div>
          )}
        </div>

        {/* 선택된 컴포넌트 정보 */}
        {selectedComponent && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">선택된 컴포넌트</h4>
            <div className="text-sm text-gray-600">
              {localComponents.find(comp => comp.id === selectedComponent)?.displayName}
            </div>
          </div>
        )}
      </div>

      {/* 컴포넌트 설정 모달 */}
      {showComponentSettings && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">컴포넌트 설정</h3>
              <button
                onClick={() => setShowComponentSettings(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {(() => {
              const component = localComponents.find(comp => comp.id === showComponentSettings);
              if (!component) return null;

              return (
                <div className="space-y-4">
                  {/* 위치 및 크기 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">X 위치</label>
                      <input
                        type="number"
                        value={component.position.x}
                        onChange={(e) => handleComponentResize(component.id, { x: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        max={getRowColCount(component.position.y) - 1}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Y 위치</label>
                      <input
                        type="number"
                        value={component.position.y}
                        onChange={(e) => handleComponentResize(component.id, { y: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        max={getCurrentGridConfig().length - 1}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">너비</label>
                      <input
                        type="number"
                        value={component.position.width}
                        onChange={(e) => handleComponentResize(component.id, { width: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                        max={getRowColCount(component.position.y) - component.position.x}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">높이</label>
                      <input
                        type="number"
                        value={component.position.height}
                        onChange={(e) => handleComponentResize(component.id, { height: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                        max={getCurrentGridConfig().length - component.position.y}
                      />
                    </div>
                  </div>

                  {/* 테이블 설정 */}
                  {component.type === 'table' && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">테이블 설정</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={component.config.showHeader}
                            onChange={(e) => handleComponentConfigChange(component.id, { showHeader: e.target.checked })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">헤더 표시</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={component.config.showPagination}
                            onChange={(e) => handleComponentConfigChange(component.id, { showPagination: e.target.checked })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">페이지네이션</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={component.config.showSearch}
                            onChange={(e) => handleComponentConfigChange(component.id, { showSearch: e.target.checked })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">검색 기능</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={component.config.showFilters}
                            onChange={(e) => handleComponentConfigChange(component.id, { showFilters: e.target.checked })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">필터 기능</span>
                        </label>
                      </div>
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">최대 행 수</label>
                        <input
                          type="number"
                          value={component.config.maxRows}
                          onChange={(e) => handleComponentConfigChange(component.id, { maxRows: parseInt(e.target.value) || 10 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="1"
                          max="100"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 레이아웃 설정 모달 */}
      {showLayoutSettings && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-6xl max-w-7xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">그리드 설정</h3>
              <button
                onClick={() => setShowLayoutSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* 그리드 설정 */}
              <div>
                {/* 단일 레이아웃일 때 */}
                {((screen && localLayout === 'single') || (!screen && tempTabs.length === 0)) && (
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    
                    {/* 단일 그리드 설정 */}
                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <button
                          onClick={() => {
                            const newTempTabs = tempTabs.length > 0 ? tempTabs : [{ name: '단일 그리드', gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } }];
                            const updatedTabs = newTempTabs.map((tab, i) => 
                              i === 0 
                                ? { 
                                    ...tab, 
                                    gridConfig: { 
                                      rows: [...tab.gridConfig.rows, { cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }]
                                    }
                                  }
                                : tab
                            );
                            setTempTabs(updatedTabs);
                          }}
                          className="flex items-center space-x-1 px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          <Plus className="h-3 w-3" />
                          <span>행 추가</span>
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {(tempTabs.length > 0 ? tempTabs[0] : { gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } }).gridConfig.rows.map((row: any, rowIndex: number) => (
                          <div key={rowIndex} className="p-3 bg-white rounded border">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-gray-700">행 {rowIndex + 1}</span>
                              <button
                                onClick={() => {
                                  const newTempTabs = tempTabs.length > 0 ? tempTabs : [{ name: '단일 그리드', gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } }];
                                  const updatedTabs = newTempTabs.map((tab, i) => 
                                    i === 0 
                                      ? { 
                                          ...tab, 
                                          gridConfig: { 
                                            rows: tab.gridConfig.rows.filter((_: any, rIdx: number) => rIdx !== rowIndex)
                                          }
                                        }
                                      : tab
                                  );
                                  setTempTabs(updatedTabs);
                                }}
                                className="p-1 text-red-600 hover:text-red-800"
                                title="행 삭제"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {row.cols.map((col: any, colIndex: number) => (
                                <div key={colIndex} className="flex items-center space-x-1">
                                  <input
                                    type="number"
                                    min="0.1"
                                    max="1"
                                    step="0.1"
                                    value={col.width}
                                    onChange={(e) => {
                                      const newWidth = parseFloat(e.target.value) || 0.25;
                                      const newTempTabs = tempTabs.length > 0 ? tempTabs : [{ name: '단일 그리드', gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } }];
                                      const updatedTabs = newTempTabs.map((tab, i) => 
                                        i === 0 
                                          ? { 
                                              ...tab, 
                                              gridConfig: { 
                                                rows: tab.gridConfig.rows.map((r: any, rIdx: number) => 
                                                  rIdx === rowIndex 
                                                    ? { cols: r.cols.map((c: any, cIdx: number) => cIdx === colIndex ? { width: newWidth } : c) }
                                                    : r
                                                )
                                              }
                                            }
                                          : tab
                                      );
                                      setTempTabs(updatedTabs);
                                    }}
                                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                    placeholder="0.5"
                                  />
                                  {row.cols.length > 1 && (
                                    <button
                                      onClick={() => {
                                        const newTempTabs = tempTabs.length > 0 ? tempTabs : [{ name: '단일 그리드', gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } }];
                                        const updatedTabs = newTempTabs.map((tab, i) => 
                                          i === 0 
                                            ? { 
                                                ...tab, 
                                                gridConfig: { 
                                                  rows: tab.gridConfig.rows.map((r: any, rIdx: number) => 
                                                    rIdx === rowIndex 
                                                      ? { cols: r.cols.filter((_: any, cIdx: number) => cIdx !== colIndex) }
                                                      : r
                                                  )
                                                }
                                              }
                                            : tab
                                        );
                                        setTempTabs(updatedTabs);
                                      }}
                                      className="p-1 text-red-600 hover:text-red-800"
                                      title="열 삭제"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                            
                            <div className="mt-3 flex justify-between items-center">
                              <div className="text-sm text-gray-500">
                                총 비율: {row.cols.reduce((sum: number, col: any) => sum + (typeof col.width === 'number' ? col.width : 0.25), 0).toFixed(2)}
                              </div>
                              <button
                                onClick={() => {
                                  const newTempTabs = tempTabs.length > 0 ? tempTabs : [{ name: '단일 그리드', gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } }];
                                  const updatedTabs = newTempTabs.map((tab, i) => 
                                    i === 0 
                                      ? { 
                                          ...tab, 
                                          gridConfig: { 
                                            rows: tab.gridConfig.rows.map((r: any, rIdx: number) => 
                                              rIdx === rowIndex 
                                                ? { cols: [...r.cols, { width: 0.25 }] }
                                                : r
                                            )
                                          }
                                        }
                                      : tab
                                  );
                                  setTempTabs(updatedTabs);
                                }}
                                className="flex items-center space-x-1 px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                              >
                                <Plus className="h-3 w-3" />
                                <span>열 추가</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 탭 레이아웃일 때 */}
                {((screen && localLayout === 'tabs') || (!screen && tempTabs.length > 0)) && (
                <div>
                  {/* 탭 선택 UI */}
                  <div className="mb-6">
                    <div className="flex space-x-2 border-b border-gray-200">
                      {tempTabs.map((tab, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedTabIndex(index)}
                          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            selectedTabIndex === index
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {tab.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 선택된 탭의 그리드 설정 */}
                  <div className="p-4 bg-gray-50 rounded-lg border">
                      
                    {/* 선택된 탭의 그리드 설정 */}
                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <button
                          onClick={() => {
                            const newTempTabs = [...tempTabs];
                            const currentTab = newTempTabs[selectedTabIndex];
                            if (currentTab) {
                              currentTab.gridConfig.rows.push({ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] });
                              setTempTabs(newTempTabs);
                            }
                          }}
                          className="flex items-center space-x-1 px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          <Plus className="h-3 w-3" />
                          <span>행 추가</span>
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {(tempTabs[selectedTabIndex] || { gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } }).gridConfig.rows.map((row: any, rowIndex: number) => (
                          <div key={rowIndex} className="p-3 bg-white rounded border">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-gray-700">행 {rowIndex + 1}</span>
                              <button
                                onClick={() => {
                                  const newTempTabs = [...tempTabs];
                                  const currentTab = newTempTabs[selectedTabIndex];
                                  if (currentTab) {
                                    currentTab.gridConfig.rows.splice(rowIndex, 1);
                                    setTempTabs(newTempTabs);
                                  }
                                }}
                                className="p-1 text-red-600 hover:text-red-800"
                                title="행 삭제"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {row.cols.map((col: any, colIndex: number) => (
                                <div key={colIndex} className="flex items-center space-x-1">
                                  <input
                                    type="number"
                                    min="0.1"
                                    max="1"
                                    step="0.1"
                                    value={col.width}
                                    onChange={(e) => {
                                      const newWidth = parseFloat(e.target.value) || 0.25;
                                      const newTempTabs = [...tempTabs];
                                      const currentTab = newTempTabs[selectedTabIndex];
                                      if (currentTab) {
                                        currentTab.gridConfig.rows[rowIndex].cols[colIndex].width = newWidth;
                                        setTempTabs(newTempTabs);
                                      }
                                    }}
                                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                    placeholder="0.5"
                                  />
                                  {row.cols.length > 1 && (
                                    <button
                                      onClick={() => {
                                        const newTempTabs = [...tempTabs];
                                        const currentTab = newTempTabs[selectedTabIndex];
                                        if (currentTab) {
                                          currentTab.gridConfig.rows[rowIndex].cols.splice(colIndex, 1);
                                          setTempTabs(newTempTabs);
                                        }
                                      }}
                                      className="p-1 text-red-600 hover:text-red-800"
                                      title="열 삭제"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                            
                            <div className="mt-3 flex justify-between items-center">
                              <div className="text-sm text-gray-500">
                                총 비율: {row.cols.reduce((sum: number, col: any) => sum + (typeof col.width === 'number' ? col.width : 0.25), 0).toFixed(2)}
                              </div>
                              <button
                                onClick={() => {
                                  const newTempTabs = [...tempTabs];
                                  const currentTab = newTempTabs[selectedTabIndex];
                                  if (currentTab) {
                                    currentTab.gridConfig.rows[rowIndex].cols.push({ width: 0.25 });
                                    setTempTabs(newTempTabs);
                                  }
                                }}
                                className="flex items-center space-x-1 px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                              >
                                <Plus className="h-3 w-3" />
                                <span>열 추가</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCancelLayoutSettings}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSaveLayoutSettings}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>저장</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScreenCanvas;
