import React, { useState, useRef, useCallback } from 'react';
import { X, Move, Resize, Settings, Trash2 } from 'lucide-react';
import { ScreenComponent, ComponentConfig } from '../types';

interface ScreenCanvasProps {
  layout: 'single' | 'grid' | 'tabs';
  components: ScreenComponent[];
  onComponentsChange: (components: ScreenComponent[]) => void;
  availableTables: any[];
  availableVariables: any[];
}

interface DraggedItem {
  type: 'table' | 'variable';
  id: string;
  displayName: string;
}

const ScreenCanvas: React.FC<ScreenCanvasProps> = ({
  layout,
  components,
  onComponentsChange,
  availableTables,
  availableVariables
}) => {
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [showComponentSettings, setShowComponentSettings] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // 드래그 시작
  const handleDragStart = (e: React.DragEvent, item: DraggedItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'copy';
  };

  // 드래그 오버
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  // 드래그 리브
  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  // 드롭
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);

    if (!draggedItem || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / (rect.width / 12));
    const y = Math.floor((e.clientY - rect.top) / 50); // 50px 단위로 Y 위치 계산

    const newComponent: ScreenComponent = {
      id: `comp-${Date.now()}`,
      type: draggedItem.type,
      componentId: draggedItem.id,
      displayName: draggedItem.displayName,
      position: { x: Math.max(0, Math.min(11, x)), y: Math.max(0, y), width: 6, height: 4 },
      config: {
        showHeader: true,
        showPagination: true,
        showSearch: true,
        showFilters: true,
        maxRows: 10,
        refreshInterval: 0
      }
    };

    onComponentsChange([...components, newComponent]);
    setDraggedItem(null);
  };

  // 컴포넌트 삭제
  const handleDeleteComponent = (componentId: string) => {
    onComponentsChange(components.filter(comp => comp.id !== componentId));
    setSelectedComponent(null);
  };

  // 컴포넌트 설정 변경
  const handleComponentConfigChange = (componentId: string, updates: Partial<ComponentConfig>) => {
    const updatedComponents = components.map(comp => 
      comp.id === componentId 
        ? { ...comp, config: { ...comp.config, ...updates } }
        : comp
    );
    onComponentsChange(updatedComponents);
  };

  // 컴포넌트 위치/크기 변경
  const handleComponentResize = (componentId: string, updates: Partial<{ x: number; y: number; width: number; height: number }>) => {
    const updatedComponents = components.map(comp => 
      comp.id === componentId 
        ? { ...comp, position: { ...comp.position, ...updates } }
        : comp
    );
    onComponentsChange(updatedComponents);
  };

  // 그리드 셀 렌더링
  const renderGridCell = (x: number, y: number) => {
    const component = components.find(comp => 
      comp.position.x <= x && 
      x < comp.position.x + comp.position.width &&
      comp.position.y <= y && 
      y < comp.position.y + comp.position.height
    );

    if (component) {
      const isStart = component.position.x === x && component.position.y === y;
      if (isStart) {
        return (
          <div
            key={`${x}-${y}`}
            className={`absolute bg-blue-100 border-2 border-blue-300 rounded-lg p-2 cursor-move ${
              selectedComponent === component.id ? 'ring-2 ring-blue-500' : ''
            }`}
            style={{
              left: `${x * (100 / 12)}%`,
              top: `${y * 50}px`,
              width: `${component.position.width * (100 / 12)}%`,
              height: `${component.position.height * 50}px`,
              zIndex: selectedComponent === component.id ? 10 : 1
            }}
            onClick={() => setSelectedComponent(component.id)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-blue-800 truncate">
                {component.displayName}
              </span>
              <div className="flex space-x-1">
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
            <div className="text-xs text-blue-600">
              {component.type === 'table' ? '📊 테이블' : '📈 변수'}
            </div>
          </div>
        );
      }
      return null;
    }

    return (
      <div
        key={`${x}-${y}`}
        className="w-full h-full border border-gray-200 bg-gray-50"
      />
    );
  };

  return (
    <div className="flex h-full">
      {/* 좌측: 사용 가능한 컴포넌트 목록 */}
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

      {/* 우측: 레이아웃 캔버스 */}
      <div className="flex-1 p-4">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">레이아웃 캔버스</h3>
          <p className="text-sm text-gray-600">
            테이블과 변수를 드래그하여 원하는 위치에 배치하세요.
          </p>
        </div>

        {/* 캔버스 */}
        <div
          ref={canvasRef}
          className={`relative bg-white border-2 border-dashed border-gray-300 rounded-lg ${
            isDraggingOver ? 'border-blue-400 bg-blue-50' : ''
          }`}
          style={{ height: '600px' }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* 그리드 가이드 */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 12 }, (_, x) => (
              <div
                key={x}
                className="absolute top-0 bottom-0 border-l border-gray-200"
                style={{ left: `${(x + 1) * (100 / 12)}%` }}
              />
            ))}
            {Array.from({ length: 12 }, (_, y) => (
              <div
                key={y}
                className="absolute left-0 right-0 border-t border-gray-200"
                style={{ top: `${(y + 1) * 50}px` }}
              />
            ))}
          </div>

          {/* 컴포넌트들 */}
          {Array.from({ length: 12 }, (_, y) =>
            Array.from({ length: 12 }, (_, x) => renderGridCell(x, y))
          )}

          {/* 드롭 가이드 */}
          {isDraggingOver && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-blue-600 text-lg font-medium">
                여기에 드롭하여 컴포넌트 추가
              </div>
            </div>
          )}
        </div>

        {/* 선택된 컴포넌트 정보 */}
        {selectedComponent && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">선택된 컴포넌트</h4>
            <div className="text-sm text-gray-600">
              {components.find(comp => comp.id === selectedComponent)?.displayName}
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
              const component = components.find(comp => comp.id === showComponentSettings);
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
                        max="11"
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
                        max="12"
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
                        max="8"
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
    </div>
  );
};

export default ScreenCanvas;
