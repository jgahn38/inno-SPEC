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
  // 받은 데이터 로그
  console.log({
    availableTablesCount: availableTables.length,
    availableVariablesCount: availableVariables.length,
    availableTables: availableTables.map(t => ({ id: t.id, displayName: t.displayName })),
    availableVariables: availableVariables.map(v => ({ id: v.id, displayName: v.displayName }))
  });

  // screen props로부터 screen.components 사용, 없으면 propComponents 사용
  const components = screen ? screen.components : (propComponents || []);
  
  // screen props로부터 screen의 레이아웃 설정 사용
  const screenTabs = screen ? screen.tabs : null;
  // const screenGridConfig = screen ? screen.gridConfig : null; // ?�용?��? ?�음
  
  // 초기 상태 설정
  useEffect(() => {
    if (screen) {
      const layout = screen.layout || 'single';
      const tabs = screenTabs ? screenTabs.map(tab => typeof tab === 'string' ? { name: tab, gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } } : tab) : [];
      
      // 단일 레이아웃이고 탭이 없으면 기본 탭 생성
      const finalTabs = layout === 'single' && tabs.length === 0 
        ? [{ name: '단일 그리드', gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } }]
        : tabs;
      
      // setOriginalComponents([...components]); // ?�용?��? ?�음
      // setOriginalLayout(layout); // ?�용?��? ?�음
      // setOriginalTabs(finalTabs); // ?�용?��? ?�음
      
      // 로컬 상태를 초기화
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
  // const [forceRerender, setForceRerender] = useState(0); // ?�용?��? ?�음

  const [tabs, setTabs] = useState<Array<{ name: string; gridConfig: { rows: Array<{ cols: Array<{ width: number }> }> } }>>([
    { name: '탭1', gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }, { cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }, { cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } },
    { name: '탭2', gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }, { cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }, { cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } }
  ]);
  // const [newTabName, setNewTabName] = useState(''); // ?�용?��? ?�음
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const canvasRef = useRef<HTMLDivElement>(null);

  // 변경사항 추적을 위한 상태
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  // const [originalComponents, setOriginalComponents] = useState<ScreenComponent[]>([]); // ?�용?��? ?�음
  // const [originalLayout, setOriginalLayout] = useState<'single' | 'grid' | 'tabs'>('single'); // ?�용?��? ?�음
  // const [originalTabs, setOriginalTabs] = useState<Array<{ name: string; gridConfig: { rows: Array<{ cols: Array<{ width: number }> }> } }>>([]); // ?�용?��? ?�음
  
  // 로컬 편집 상태 (저장까지 임시 상태)
  const [localComponents, setLocalComponents] = useState<ScreenComponent[]>([]);
  const [localLayout, setLocalLayout] = useState<'single' | 'grid' | 'tabs'>('single');
  const [localTabs, setLocalTabs] = useState<Array<{ name: string; gridConfig: { rows: Array<{ cols: Array<{ width: number }> }> } }>>([]);



  // 변경사항 추적 함수
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
      // tabs가 빈 객체 배열인 경우 그대로 사용
      setLocalTabs(tabs);
    } else if (layout === 'single' && localTabs.length === 0) {
      // 단일 레이아웃이고 탭이 없으면 기본 탭 생성
      setLocalTabs([{ name: '단일 그리드', gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } }]);
    } else if (layout === 'tabs' && localTabs.length === 0) {
      // 탭 레이아웃이고 빈 경우 기본 탭2개 생성
      setLocalTabs([
        { name: '탭1', gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } },
        { name: '탭2', gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } }
      ]);
    }
    if (components) {
      setLocalComponents(components);
    }
    markAsChanged();
  };

  // 탭 레이아웃인데 빈 경우 기본 탭 생성
  useEffect(() => {
    if (screen && localLayout === 'tabs' && localTabs.length === 0) {
      // 기본 탭2개 생성
      const defaultTabs = [
        { name: '탭1', gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }, { cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }, { cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } },
        { name: '탭2', gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }, { cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }, { cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } }
      ];
      setLocalTabs(defaultTabs);
      handleLayoutChange('tabs', undefined, defaultTabs, localComponents);
    }
  }, [screen, localLayout, localTabs, localComponents]);

  // handleCancelChanges는 현재 사용하지 않음

  const handleSaveChanges = () => {
    if (!hasUnsavedChanges) return;
    
    // 로컬 상태를 제거하고
    onComponentsChange([...localComponents]);
    onLayoutChange(localLayout, undefined, localTabs, localComponents);
    
    // 이전 상태를 현재 로컬 상태로 업데이트
    // setOriginalComponents([...localComponents]); // ?�용?��? ?�음
    // setOriginalLayout(localLayout); // ?�용?��? ?�음
    // setOriginalTabs([...localTabs]); // ?�용?��? ?�음
    
    setHasUnsavedChanges(false);
    
    // 로컬 ?�태 ?�리
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
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedComponent, dragOffset]);

  // 현재 선택된 탭의 그리드 설정 가져오기(로컬 상태 사용)
  const getCurrentGridConfig = () => {
    // screen props로부터 로컬 레이아웃 설정 사용
    if (screen) {
      if (localLayout === 'tabs' && localTabs.length > 0) {
        const tab = localTabs[selectedTabIndex];
        if (tab && typeof tab === 'object' && 'gridConfig' in tab) {
          return (tab as any).gridConfig.rows || [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }];
        }
      } else if (localLayout === 'single' && localTabs.length > 0) {
        // 단일 레이아웃인 경우 첫번째 탭의 그리드 설정 사용
        const tab = localTabs[0];
        if (tab && typeof tab === 'object' && 'gridConfig' in tab) {
          return (tab as any).gridConfig.rows || [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }];
        }
      }
      // 기본�?
      return [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }];
    }
    
    // 기본 로컬 tabs ?�용
    if (tabs.length === 0) {
      return [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }, { cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }, { cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }]; // 기본�?
    }
    return tabs[selectedTabIndex]?.gridConfig.rows || [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }, { cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }, { cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }];
  };

  // 탭의 그리드 설정 가져오기
  const getRowCols = (rowIndex: number) => {
    const gridConfig = getCurrentGridConfig();
    return gridConfig[rowIndex]?.cols || [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }];
  };

  // 탭의 행 개수 가져오기
  const getRowColCount = (rowIndex: number) => {
    return getRowCols(rowIndex).length;
  };

  // 탭의 설정된 행의 비율 가져오기
  const getColWidth = (rowIndex: number, colIndex: number) => {
    const rowCols = getRowCols(rowIndex);
    const width = rowCols[colIndex]?.width;
    return typeof width === 'number' ? width : 0.25;
  };

  // 탭의 실제 행 비율 계산 (높이 계산용)
  const getColPosition = (rowIndex: number, colIndex: number) => {
    const rowCols = getRowCols(rowIndex);
    return rowCols.slice(0, colIndex).reduce((sum: number, col: any) => sum + (typeof col.width === 'number' ? col.width : 0.25), 0);
  };

  // 이전으로 되돌리기
  const handleDragStart = (e: React.DragEvent, item: DraggedItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'copy';
  };



  // 현재 선택된 컴포넌트만 가져오기(로컬 상태 사용)
  const getCurrentTabComponents = () => {
    console.log({
      hasScreen: !!screen,
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
      // 탭 레이아웃인 경우 현재 탭의 컴포넌트 반환
      // tabIndex가 undefined면 기존 컴포넌트의 첫번째 탭 인덱스(0)로 처리
      const filteredComponents = localComponents.filter(comp => {
        const compTabIndex = comp.tabIndex !== undefined ? comp.tabIndex : 0;
        const isMatch = compTabIndex === selectedTabIndex;
        return isMatch;
      });
        console.log({
        selectedTabIndex,
        filteredCount: filteredComponents.length,
        filteredComponents: filteredComponents.map(c => ({ id: c.id, displayName: c.displayName, position: c.position }))
      });
      
      return filteredComponents;
    }
    // 단일 그리드 레이아웃인 경우 모든 컴포넌트 반환
    return localComponents;
  };

  // 컴포넌트 추가
  const handleDeleteComponent = (componentId: string) => {
    const updatedComponents = localComponents.filter(comp => comp.id !== componentId);
    handleComponentsChange(updatedComponents);
    setSelectedComponent(null);
    // setForceRerender(prev => prev + 1); // ?�용?��? ?�음
  };

  // 컴포?�트 ?�정 변�?
  const handleComponentConfigChange = (componentId: string, updates: Partial<ComponentConfig>) => {
    const updatedComponents = localComponents.map(comp => 
      comp.id === componentId 
        ? { ...comp, config: { ...comp.config, ...updates } }
        : comp
    );
    handleComponentsChange(updatedComponents);
  };

  // 컴포?�트 ?�치/?�기 변�?
  const handleComponentResize = (componentId: string, updates: Partial<{ x: number; y: number; width: number; height: number }>) => {
    const updatedComponents = localComponents.map(comp => 
      comp.id === componentId 
        ? { ...comp, position: { ...comp.position, ...updates } }
        : comp
    );
    handleComponentsChange(updatedComponents);
  };

  // ??추�?
  // handleAddRow???�재 ?�용?��? ?�음

  // handleDeleteRow???�재 ?�용?��? ?�음

  // handleAddCol???�재 ?�용?��? ?�음

  // handleDeleteCol???�재 ?�용?��? ?�음

  // handleColWidthChange???�재 ?�용?��? ?�음

  // handleAddTab???�재 ?�용?��? ?�음

  // handleDeleteTab, handleTabNameChange???�재 ?�용?��? ?�음

  // ?�이?�웃 ?�정 ?�?�창 ?�기
  const handleOpenLayoutSettings = () => {
    let tabsToUse;
    
    if (screen) {
      // screen prop???�으�?로컬 ???�정???�용
      if (localLayout === 'tabs') {
        if (localTabs && localTabs.length > 0) {
          tabsToUse = localTabs.map(tab => ({
            name: typeof tab === 'string' ? tab : (tab as any).name,
            gridConfig: typeof tab === 'object' && 'gridConfig' in tab 
              ? (tab as any).gridConfig 
              : { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] }
          }));
        } else {
          // ???�이?�웃?��?�???�� ?�으�?기본 ???�성
          tabsToUse = [
            { name: '??1', gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } },
            { name: '??2', gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } }
          ];
        }
      } else {
        // ?�일 ?�이?�웃??경우
        if (localTabs && localTabs.length > 0) {
          // 기존 localTabs??�?번째 ???�용
          tabsToUse = [localTabs[0]];
        } else {
          // 기본 단일 그리드 설정
          tabsToUse = [{ name: '단일 그리드', gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } }];
        }
      }
    } else {
      // screen prop이 없으면 기본 tabs 사용
      tabsToUse = tabs.length > 0 ? tabs : [
        { name: '탭1', gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } },
        { name: '탭2', gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } }
      ];
    }
    
    setTempTabs(JSON.parse(JSON.stringify(tabsToUse))); // 깊�? 복사
    setShowLayoutSettings(true);
  };

  // ?�이?�웃 ?�정 ?�??
  const handleSaveLayoutSettings = () => {
    if (screen) {
      // screen prop???�으�?로컬 ???�정???�데?�트
      if (localLayout === 'single') {
        // ?�일 ?�이?�웃??경우 tempTabs??�?번째 ??�� ?�용
        setLocalTabs(tempTabs.length > 0 ? [tempTabs[0]] : []);
        handleLayoutChange(localLayout, undefined, tempTabs.length > 0 ? [tempTabs[0]] : [], localComponents);
      } else {
        // ???�이?�웃??경우 모든 ???�용
        setLocalTabs(tempTabs);
        handleLayoutChange(localLayout, undefined, tempTabs, localComponents);
      }
    } else {
      // screen prop???�으�?기본 tabs ?�태 ?�데?�트
      setTabs(tempTabs);
      // ??�� 그리???�정 ?�보�??�함?�여 ?�달
      handleLayoutChange('tabs', undefined, tempTabs);
    }
    setShowLayoutSettings(false);
  };

  // ?�이?�웃 ?�정 취소
  const handleCancelLayoutSettings = () => {
    setTempTabs([]);
    setShowLayoutSettings(false);
  };

  // ?�시 ??관???�수??
  // handleTempAddRow???�재 ?�용?��? ?�음

  // handleTempDeleteRow???�재 ?�용?��? ?�음

  // handleTempAddCol???�재 ?�용?��? ?�음

  // handleTempDeleteCol???�재 ?�용?��? ?�음

  // handleTempColWidthChange???�재 ?�용?��? ?�음

  // handleTempAddTab???�재 ?�용?��? ?�음

  // handleTempDeleteTab, handleTempTabNameChange???�재 ?�용?��? ?�음

  // ?�이???�서 변�??�수??
  const handleLayerUp = (componentId: string) => {
    const targetComponent = localComponents.find(comp => comp.id === componentId);
    if (!targetComponent) return;
    
    // 같�? ?�???�는 컴포?�트??찾기 (?�재 ??�� 컴포?�트�?
    const currentTabComponents = getCurrentTabComponents();
    const cellComponents = currentTabComponents.filter(comp => 
      comp.position.x === targetComponent.position.x && 
      comp.position.y === targetComponent.position.y
    );
    
    // ?�재 ?�이?�보???��? ?�이?�의 컴포?�트 찾기
    const currentLayer = targetComponent.layer || 0;
    const higherLayerComponent = cellComponents.find(comp => 
      comp.id !== componentId && (comp.layer || 0) > currentLayer
    );
    
    if (higherLayerComponent) {
      // ?�이??교환
      const updatedComponents = localComponents.map(comp => {
        if (comp.id === componentId) {
          return { ...comp, layer: higherLayerComponent.layer || 0 };
        } else if (comp.id === higherLayerComponent.id) {
          return { ...comp, layer: currentLayer };
        }
        return comp;
      });
      
      handleComponentsChange(updatedComponents);
      // setForceRerender(prev => prev + 1); // ?�용?��? ?�음
    }
  };

  const handleLayerDown = (componentId: string) => {
    const targetComponent = localComponents.find(comp => comp.id === componentId);
    if (!targetComponent) return;
    
    // 같�? ?�???�는 컴포?�트??찾기 (?�재 ??�� 컴포?�트�?
    const currentTabComponents = getCurrentTabComponents();
    const cellComponents = currentTabComponents.filter(comp => 
      comp.position.x === targetComponent.position.x && 
      comp.position.y === targetComponent.position.y
    );
    
    // 현재 탭의 보드에서 해당 탭의 컴포넌트 찾기
    const currentLayer = targetComponent.layer || 0;
    const lowerLayerComponent = cellComponents.find(comp => 
      comp.id !== componentId && (comp.layer || 0) < currentLayer
    );
    
    if (lowerLayerComponent) {
      // ?�이??교환
      const updatedComponents = localComponents.map(comp => {
        if (comp.id === componentId) {
          return { ...comp, layer: lowerLayerComponent.layer || 0 };
        } else if (comp.id === lowerLayerComponent.id) {
          return { ...comp, layer: currentLayer };
        }
        return comp;
      });
      
      handleComponentsChange(updatedComponents);
      // setForceRerender(prev => prev + 1); // ?�용?��? ?�음
    }
  };

  // ?�적 ???�이 계산 - useMemo�?최적??
  const rowHeights = useMemo(() => {
    
    const currentGridConfig = getCurrentGridConfig();
    const heights: number[] = [];
    const currentTabComponents = getCurrentTabComponents();
    
    for (let rowIndex = 0; rowIndex < currentGridConfig.length; rowIndex++) {
      // ?�당 ?�의 모든 컴포?�트??찾기 (?�재 ??�� 컴포?�트�?
      const rowComponents = currentTabComponents.filter(comp => 
        comp.position.y === rowIndex
      );
        console.log({
        componentsToUse: localComponents.length,
        rowComponents: rowComponents.length,
        components: rowComponents.map(c => ({ id: c.id, position: c.position }))
      });

      // 컴포?�트가 ?�으�?기본 ?�이
      if (rowComponents.length === 0) {
        heights[rowIndex] = 50;
      } else {
        // �??�별로 컴포?�트 개수 계산
        const cellComponentCounts = new Map<string, number>();
        
        rowComponents.forEach(comp => {
          const cellKey = `${comp.position.x},${comp.position.y}`;
          cellComponentCounts.set(cellKey, (cellComponentCounts.get(cellKey) || 0) + 1);
        });
        
        // 가??많�? 컴포?�트가 ?�는 ?�??개수 찾기
        const maxComponentsInCell = Math.max(...cellComponentCounts.values());
        
        console.log({
          cellComponentCounts: Object.fromEntries(cellComponentCounts),
          maxComponentsInCell
        });
        // 컴포?�트 개수???�른 ?�이 계산 (기본 50px + 추�? 컴포?�트??50px)
        const baseHeight = 50;
        const additionalHeight = Math.max(0, maxComponentsInCell - 1) * 50;
        const totalHeight = baseHeight + additionalHeight;
        
          baseHeight,
          additionalHeight,
        console.log({
          totalHeight,
          maxComponentsInCell
        });
        heights[rowIndex] = totalHeight;
      }
    }
    
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

  // 컴포?�트 ?�래�??�들?�들
  const handleComponentDragStart = (e: React.MouseEvent, componentId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    
    const component = components.find(c => c.id === componentId);
    if (!component) {
      return;
    }

    
    // ?�래�??�프??계산 (캔버??기�?)
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    // 캔버???�에?�의 컴포?�트 ?�치
    const componentInCanvasX = rect.left - canvasRect.left;
    const componentInCanvasY = rect.top - canvasRect.top;
    
    // 마우???�릭 지?�의 ?�프??
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
    
    // ?�프?�을 고려??마우???�치 계산
    const x = e.clientX - canvasRect.left - dragOffset.x;
    const y = e.clientY - canvasRect.top - dragOffset.y;

    // 그리???� ?�치�?변??(?�적 ?�이 ?�용)
    const currentGridConfig = getCurrentGridConfig();
    
    // 실제 높이를 고려한 위치 계산
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
    
    // ?�당 ?�의 ???�에 ?�라 ?� ?�비 계산
    const rowColCount = getRowColCount(gridY);
    const cellWidth = canvasRect.width / rowColCount;
    const gridX = Math.max(0, Math.min(Math.floor(x / cellWidth), rowColCount - 1));

    // ?�래�?중인 컴포?�트???�시 ?�치 ?�??
    const newPosition = { x: gridX, y: gridY };
    setDraggedComponentPosition(newPosition);
    draggedComponentPositionRef.current = newPosition;
  };

  const handleComponentDragEnd = () => {
    if (draggedComponent) {
      const finalPosition = draggedComponentPositionRef.current;
      
      
      // ?�래�?종료 ?�에�??�제 ?�치 ?�데?�트
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
        console.log({
        from: localComponents.find(c => c.id === draggedComponent)?.position,
        to: finalPosition
      });
      
            // 부�?컴포?�트??변경사???�달
      handleComponentsChange(updatedComponents);
      
      // 강제 리렌?�링???�한 ?�태 ?�데?�트
      // setForceRerender(prev => prev + 1); // ?�용?��? ?�음
      
      // ?�래�??�태 초기??
      setDraggedComponent(null);
      setDraggedComponentPosition({ x: 0, y: 0 });
      draggedComponentPositionRef.current = { x: 0, y: 0 };
    } else {
      setDraggedComponent(null);
      setDraggedComponentPosition({ x: 0, y: 0 });
      draggedComponentPositionRef.current = { x: 0, y: 0 };
    }
  };

  // 그리???� ?�더�?
  const renderGridCell = (x: number, y: number) => {
    const currentGridConfig = getCurrentGridConfig();
    
    // 그리??범위�?벗어?�면 ?�더링하지 ?�음
    if (y >= currentGridConfig.length || x >= getRowColCount(y)) {
      return null;
    }

    // ???�???�는 모든 컴포?�트 찾기 (?�재 ??�� 컴포?�트�?
    const currentTabComponents = getCurrentTabComponents();
    const cellComponents = currentTabComponents.filter(comp => {
      const isInComponent = comp.position.x <= x && 
        x < comp.position.x + (comp.position.width || 1) &&
      comp.position.y <= y && 
        y < comp.position.y + (comp.position.height || 1);
      

      
      return isInComponent;
    });

    // ?�이???�서?��??�렬 (??? layer가 먼�?, ?��? layer가 ?�중??
    const sortedComponents = cellComponents.sort((a, b) => (a.layer || 0) - (b.layer || 0));

    // ?�작 ?�??컴포?�트??찾기
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
            // 가???��? ?�이?�의 컴포?�트�??�택
            const topComponent = startComponents[startComponents.length - 1];
            setSelectedComponent(topComponent.id);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (!draggedItem) return;
          
          // 같�? ?�???�는 컴포?�트?�의 최�? ?�이??찾기 (?�재 ??�� 컴포?�트�?
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
            layer: maxLayer + 1, // 기존 컴포?�트?�보???�에 배치
            tabIndex: screen && localLayout === 'tabs' && localTabs.length > 0 ? selectedTabIndex : undefined
          };
          console.log({
            component: newComponent,
            currentTabIndex: selectedTabIndex,
            screenLayout: screen?.layout,
            hasScreenTabs: !!(screen && screenTabs),
            screenTabsLength: screenTabs?.length
          });

          handleComponentsChange([...localComponents, newComponent]);
          setDraggedItem(null);
          // setForceRerender(prev => prev + 1); // ?�용?��? ?�음
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
        }}
      >
        {startComponents.map((component, index) => {
          // 컴포?�트 ?�이�?고정 (50px)
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
                          title="?�로"
                          style={{ width: '20px', height: '20px' }}
                        >
                          <span className="text-xs leading-none">설정</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLayerDown(component.id);
                          }}
                          className="text-gray-600 hover:text-gray-800 p-1 flex items-center justify-center"
                          title="설정"
                          style={{ width: '20px', height: '20px' }}
                        >
                          <span className="text-xs leading-none">설정</span>
                        </button>
                      </>
                    )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowComponentSettings(component.id);
                  }}
                  className="text-blue-600 hover:text-blue-800 p-1"
                  title="?�정"
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
              {component.type === 'table' ? '테이블 데이터' : '일반 변수'}
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
      {/* 좌측: ?�용 가?�한 컴포?�트 목록 */}
      {(
      <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
        <h3 className="text-lg font-medium text-gray-900 mb-4">?�용 가?�한 컴포?�트</h3>
        
        {/* ?�이�?목록 */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            ?�� ?�이�?
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

        {/* 변??목록 */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            ?�� 변??
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

      {/* ?�측: ?�이?�웃 캔버??*/}
      <div className="flex-1 p-4">
        {/* ?�이?�웃 ?�정 UI */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            {/* ?�이?�웃 ?�???�택 */}
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
                  <span className="text-sm text-gray-700">?�일</span>
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
                        // ???�이?�웃?�로 변경할 ??기본 ??2�??�성
                        const defaultTabs = [
                          { name: '??1', gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } },
                          { name: '??2', gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } }
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
              
              {/* ??개수 ?�정 - ???�이?�웃???�만 ?�시 */}
              {(screen && localLayout === 'tabs') && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">??개수:</span>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={localTabs.length || 2}
                    onChange={(e) => {
                      const tabCount = parseInt(e.target.value) || 2;
                      const newTabs = Array.from({ length: tabCount }, (_, i) => ({
                        name: `??${i + 1}`,
                        gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] }
                      }));
                      setLocalTabs(newTabs);
                      handleLayoutChange('tabs', undefined, newTabs, localComponents);
                    }}
                    className="w-16 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <span className="text-sm text-gray-500">탭</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {/* 그리???�정 버튼 */}
              <button
                onClick={handleOpenLayoutSettings}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>그리???�정</span>
              </button>
              
              {/* ?�??버튼 */}
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



        {/* ???�택 UI - ???�이?�웃???�만 ?�시 */}
        {(screen && localLayout === 'tabs' && localTabs.length > 0) && (
          <div className="mb-4">
            <div className="flex space-x-2 border-b border-gray-200">
              {localTabs.map((tab, index) => (
                <button
                  key={index}
                  onClick={() => {
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

        {/* 캔버??*/}
        <div
          ref={canvasRef}
          className="relative bg-white border-2 border-dashed border-gray-300 rounded-lg"
          style={{ height: '600px' }}
        >
          {/* 그리??가?�드 */}
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

          {/* ?�래�?중인 컴포?�트 미리보기 */}
          {draggedComponent && (() => {
            // ?�제 컴포?�트?� ?�일???�기 계산 ?�용
            const left = getColPosition(draggedComponentPosition.y, draggedComponentPosition.x) * 100;
            const width = getColWidth(draggedComponentPosition.y, draggedComponentPosition.x) * 100;
            const top = getRowTopPosition(draggedComponentPosition.y); // ?�적 ?�이 ?�용
            
            const height = 50; // 고정 ?�이 ?�용
            
            return (
              <div 
                className="absolute pointer-events-none" 
                style={{ 
                  zIndex: 10,
                  left: `${left}%`,
                  top: `${top}px`,
                  width: `${width}%`,
                  height: `${height}px` // 고정 ?�이 ?�용
                }}
              >
                <div className="bg-blue-100 border-2 border-blue-300 rounded p-2 shadow-lg h-full flex flex-col justify-center">
                  <div className="text-xs font-medium text-blue-800 text-center">
                    {components.find(c => c.id === draggedComponent)?.displayName}
              </div>
                  <div className="text-xs text-blue-600 text-center">
                    {components.find(c => c.id === draggedComponent)?.type === 'table' ? '테이블 데이터' : '일반 변수'}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 컴포?�트??*/}
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



          {/* 그리???�보 ?�시 */}
          {((screen && localLayout === 'tabs' && localTabs.length > 0) || tabs.length > 0) && (
            <div className="absolute top-2 right-2 bg-white bg-opacity-90 px-2 py-1 rounded text-xs text-gray-600">
              {screen && localTabs.length > 0
                ? localTabs[selectedTabIndex]?.name
                : tabs[selectedTabIndex]?.name
              }: {getCurrentGridConfig().length}??
            </div>
          )}
        </div>

        {/* ?�택??컴포?�트 ?�보 */}
        {selectedComponent && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">?�택??컴포?�트</h4>
            <div className="text-sm text-gray-600">
              {localComponents.find(comp => comp.id === selectedComponent)?.displayName}
            </div>
          </div>
        )}
      </div>

      {/* 컴포?�트 ?�정 모달 */}
      {showComponentSettings && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">컴포?�트 ?�정</h3>
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
                  {/* ?�치 �??�기 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">X ?�치</label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Y ?�치</label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">?�비</label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">?�이</label>
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

                  {/* ?�이�??�정 */}
                  {component.type === 'table' && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">?�이�??�정</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={component.config.showHeader}
                            onChange={(e) => handleComponentConfigChange(component.id, { showHeader: e.target.checked })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">?�더 ?�시</span>
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
                          <span className="ml-2 text-sm text-gray-700">검??기능</span>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">최대 행수</label>
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

      {/* ?�이?�웃 ?�정 모달 */}
      {showLayoutSettings && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-6xl max-w-7xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">그리???�정</h3>
              <button
                onClick={() => setShowLayoutSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* 그리???�정 */}
              <div>
                {/* 단일 탭 레이아웃만 */}
                {((screen && localLayout === 'single') || (!screen && tempTabs.length === 0)) && (
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    
                    {/* ?�일 그리???�정 */}
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
                          <span>??추�?</span>
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {(tempTabs.length > 0 ? tempTabs[0] : { gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } }).gridConfig.rows.map((row: any, rowIndex: number) => (
                          <div key={rowIndex} className="p-3 bg-white rounded border">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-gray-700">??{rowIndex + 1}</span>
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
                                title="삭제"
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
                                      title="삭제"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                            
                            <div className="mt-3 flex justify-between items-center">
                              <div className="text-sm text-gray-500">
                                �?비율: {row.cols.reduce((sum: number, col: any) => sum + (typeof col.width === 'number' ? col.width : 0.25), 0).toFixed(2)}
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
                                <span>??추�?</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 다중 탭 레이아웃만 */}
                {((screen && localLayout === 'tabs') || (!screen && tempTabs.length > 0)) && (
                <div>
                  {/* ???�택 UI */}
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
                          <span>??추�?</span>
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {(tempTabs[selectedTabIndex] || { gridConfig: { rows: [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }] } }).gridConfig.rows.map((row: any, rowIndex: number) => (
                          <div key={rowIndex} className="p-3 bg-white rounded border">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-gray-700">??{rowIndex + 1}</span>
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
                                title="삭제"
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
                                      title="삭제"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                            
                            <div className="mt-3 flex justify-between items-center">
                              <div className="text-sm text-gray-500">
                                �?비율: {row.cols.reduce((sum: number, col: any) => sum + (typeof col.width === 'number' ? col.width : 0.25), 0).toFixed(2)}
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
                                <span>??추�?</span>
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
