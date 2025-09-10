import React, { useState, useEffect } from 'react';
import { ScreenConfig, ScreenComponent, Bridge, Project } from '@inno-spec/shared';
import { TableSchemaService } from '../services/TableSchemaService';
import { variableService } from '../services/VariableService';
import { ChevronDown, Building2 } from 'lucide-react';

interface ScreenRuntimeViewProps {
  screen: ScreenConfig;
  lnbMenu?: any;
  selectedProject?: Project | null;
}

interface TableData {
  [key: string]: any;
}

interface VariableData {
  [key: string]: any;
}

const ScreenRuntimeView: React.FC<ScreenRuntimeViewProps> = ({ screen, lnbMenu, selectedProject }) => {
  const [tableData, setTableData] = useState<TableData>({});
  const [editableTableData, setEditableTableData] = useState<{[componentId: string]: any[]}>({});
  const [editingCell, setEditingCell] = useState<{componentId: string, rowIndex: number, fieldName: string} | null>(null);
  const [variableData, setVariableData] = useState<VariableData>({});
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [selectedRows, setSelectedRows] = useState<{[componentId: string]: Set<number>}>({});
  const [selectedBridgeId, setSelectedBridgeId] = useState<string>('');
  const [isBridgeDropdownOpen, setIsBridgeDropdownOpen] = useState(false);
  const [availableBridges, setAvailableBridges] = useState<Bridge[]>([]);
  
  const tableService = TableSchemaService.getInstance();

  // 교량 목록 로드
  useEffect(() => {
    if (screen.dataStructure === 'bridge' && selectedProject) {
      const projectBridges = selectedProject.bridges || [];
      setAvailableBridges(projectBridges);
      
      // 첫 번째 교량을 기본 선택
      if (projectBridges.length > 0 && !selectedBridgeId) {
        setSelectedBridgeId(projectBridges[0].id);
      }
    }
  }, [screen.dataStructure, selectedProject, selectedBridgeId]);

  // 교량별 데이터 저장을 위한 키 생성
  const getDataKey = (componentId: string, bridgeId?: string) => {
    if (screen.dataStructure === 'bridge' && bridgeId) {
      return `${componentId}_bridge_${bridgeId}`;
    }
    return componentId;
  };

  // 테이블 데이터 로드
  useEffect(() => {
    const loadTableData = async () => {
      const tableComponents = screen.components.filter(comp => comp.type === 'table');
      const newTableData: TableData = {};
      
      for (const component of tableComponents) {
        try {
          const table = tableService.getTableById(component.componentId);
          
          if (table) {
            // table.fields가 이미 필드 객체 배열인지 확인
            let fieldObjects: any[] = [];
            if (table.fields && table.fields.length > 0) {
              // 첫 번째 요소가 문자열(필드 ID)인지 객체(필드)인지 확인
              if (typeof table.fields[0] === 'string') {
                // 필드 ID 배열인 경우 실제 필드 객체로 변환
                fieldObjects = (table.fields as any[]).map((fieldId: string) => {
                  const field = tableService.getField(fieldId);
                  return field;
                }).filter(field => field !== undefined);
              } else {
                // 이미 필드 객체 배열인 경우 그대로 사용
                fieldObjects = table.fields;
              }
            } else {
              fieldObjects = [];
            }
            
            // 테이블 스키마에 실제 필드 객체 배열 설정
            const tableWithFields = {
              ...table,
              fields: fieldObjects
            };
            
            // 저장된 데이터가 있으면 로드, 없으면 기본값이 설정된 데이터로 초기화
            const savedData = loadSavedTableData(component.componentId);
            
            let dataToUse;
            if (savedData.length > 0) {
              // 저장된 데이터가 있지만 빈 행이거나 기본값이 없는 경우 확인
              const hasValidData = savedData.some((row: any) => {
                return tableWithFields.fields?.some(field => {
                  const value = row[field.name];
                  return value !== undefined && value !== null && value !== '';
                });
              });
              
              if (hasValidData) {
                // 유효한 데이터가 있으면 그대로 사용
                dataToUse = savedData;
              } else {
                // 빈 행만 있으면 기본값이 설정된 데이터 생성
                dataToUse = generateTableDataWithDefaults(tableWithFields);
              }
            } else {
              // 저장된 데이터가 없으면 기본값이 설정된 데이터 생성
              dataToUse = generateTableDataWithDefaults(tableWithFields);
            }
            
            newTableData[component.componentId] = {
              table: tableWithFields,
              data: dataToUse
            };
            
            // 편집 가능한 데이터 설정
            setEditableTableData(prev => ({
              ...prev,
              [component.componentId]: dataToUse
            }));

            // 선택된 행 상태 초기화
            setSelectedRows(prev => ({
              ...prev,
              [component.componentId]: new Set()
            }));
          }
        } catch (error) {
          console.error(`Failed to load table data for ${component.componentId}:`, error);
        }
      }
      
      setTableData(newTableData);
    };

    loadTableData();
  }, [screen.components, selectedBridgeId]); // selectedBridgeId 의존성 추가

  // 변수 데이터 로드
  useEffect(() => {
    const loadVariableData = async () => {
      const variableComponents = screen.components.filter(comp => comp.type === 'variable');
      const newVariableData: VariableData = {};
      
      for (const component of variableComponents) {
        try {
          const variables = variableService.getVariables();
          const variable = variables.find(v => v.id === component.componentId);
          if (variable) {
            newVariableData[component.componentId] = {
              variable,
              value: getDefaultVariableValue(variable.type)
            };
          }
        } catch (error) {
          console.error(`Failed to load variable data for ${component.componentId}:`, error);
        }
      }
      
      setVariableData(newVariableData);
    };

    loadVariableData();
  }, [screen.components]);

  // 기본값이 설정된 테이블 데이터 생성
  const generateTableDataWithDefaults = (table: any) => {
    // 항상 1행을 생성하되, 기본값이 있는 필드는 해당 값으로 채움
    const defaultRow: any = { id: `row-${Date.now()}` };
    
    table.fields?.forEach((field: any) => {
      // 기본값이 있는 경우 (null, undefined, 빈 문자열이 아닌 경우)
      if (field.defaultValue !== null && field.defaultValue !== undefined && field.defaultValue !== '') {
        defaultRow[field.name] = field.defaultValue;
      }
    });
    
    return [defaultRow];
  };

  // 변수 타입별 기본값
  const getDefaultVariableValue = (type: string) => {
    switch (type) {
      case 'string':
        return '';
      case 'number':
        return 0;
      case 'boolean':
        return false;
      case 'date':
        return new Date().toISOString().split('T')[0];
      default:
        return '';
    }
  };

  // 변수 값 변경 핸들러
  const handleVariableChange = (componentId: string, value: any) => {
    setVariableData(prev => ({
      ...prev,
      [componentId]: {
        ...prev[componentId],
        value
      }
    }));
  };

  // 셀 값 업데이트
  const updateCellValue = (componentId: string, rowIndex: number, fieldName: string, value: any) => {
    setEditableTableData(prev => {
      const newData = { ...prev };
      if (!newData[componentId]) {
        newData[componentId] = [];
      }
      
      // 빈 행(마지막 행)에서 데이터를 입력하는 경우 새 행 생성
      if (rowIndex >= newData[componentId].length) {
        const newRow = { id: `row-${Date.now()}-${rowIndex}` };
        newData[componentId][rowIndex] = newRow;
      }
      
      if (!newData[componentId][rowIndex]) {
        newData[componentId][rowIndex] = { id: `row-${Date.now()}-${rowIndex}` };
      }
      
      // 현재 행에 값 설정
      newData[componentId][rowIndex][fieldName] = value;
      
      // 빈 행에서 데이터를 입력한 경우, 다른 필드들에 기본값 자동 채우기
      if (rowIndex >= newData[componentId].length - 1) {
        const tableInfo = tableData[componentId];
        if (tableInfo && tableInfo.table && tableInfo.table.fields) {
          const currentRow = newData[componentId][rowIndex];
          
          // 현재 행이 비어있는지 확인 (입력한 필드 외에 다른 필드가 모두 비어있는지)
          const hasOtherData = tableInfo.table.fields.some((field: any) => {
            return field.name !== fieldName && 
                   currentRow[field.name] !== undefined && 
                   currentRow[field.name] !== null && 
                   currentRow[field.name] !== '';
          });
          
          // 다른 필드에 데이터가 없으면 기본값으로 채우기
          if (!hasOtherData) {
            tableInfo.table.fields.forEach((field: any) => {
              if (field.name !== fieldName && 
                  field.defaultValue !== null && 
                  field.defaultValue !== undefined && 
                  field.defaultValue !== '') {
                currentRow[field.name] = field.defaultValue;
              }
            });
          }
        }
      }
      
      // 데이터 저장
      saveTableData(componentId, newData[componentId]);
      
      return newData;
    });
  };

  // 새 행 추가
  // addNewRow, deleteRow는 현재 사용되지 않음

  // 체크박스 선택/해제
  const toggleRowSelection = (componentId: string, rowIndex: number) => {
    setSelectedRows(prev => {
      const newSelected = { ...prev };
      const currentSet = newSelected[componentId] || new Set();
      const newSet = new Set(currentSet);
      
      if (newSet.has(rowIndex)) {
        newSet.delete(rowIndex);
      } else {
        newSet.add(rowIndex);
      }
      
      newSelected[componentId] = newSet;
      return newSelected;
    });
  };

  // 전체 선택/해제
  const toggleAllRows = (componentId: string) => {
    setSelectedRows(prev => {
      const newSelected = { ...prev };
      const data = editableTableData[componentId] || [];
      const currentSelected = newSelected[componentId] || new Set();
      
      // 모든 행이 선택되어 있으면 모두 해제, 그렇지 않으면 모두 선택
      const allSelected = data.length > 0 && data.every((_, index) => currentSelected.has(index));
      
      if (allSelected) {
        newSelected[componentId] = new Set();
      } else {
        newSelected[componentId] = new Set(data.map((_, index) => index));
      }
      
      return newSelected;
    });
  };

  // 선택된 행들 일괄 삭제
  const deleteSelectedRows = (componentId: string) => {
    const selected = selectedRows[componentId];
    if (!selected || selected.size === 0) return;

    setEditableTableData(prev => {
      const newData = { ...prev };
      if (newData[componentId]) {
        // 선택된 인덱스들을 내림차순으로 정렬하여 뒤에서부터 삭제
        const sortedIndices = Array.from(selected).sort((a, b) => b - a);
        sortedIndices.forEach(index => {
          newData[componentId].splice(index, 1);
        });
        // 데이터 저장
        saveTableData(componentId, newData[componentId]);
      }
      return newData;
    });

    // 선택 상태 초기화
    setSelectedRows(prev => ({
      ...prev,
      [componentId]: new Set()
    }));
  };

  // 테이블 데이터 저장
  const saveTableData = (componentId: string, data: any[]) => {
    try {
      const dataKey = getDataKey(componentId, selectedBridgeId);
      const storageKey = `table_data_${dataKey}`;
      localStorage.setItem(storageKey, JSON.stringify(data));
      console.log(`테이블 데이터 저장됨: ${dataKey}`, data);
    } catch (error) {
      console.error('테이블 데이터 저장 실패:', error);
    }
  };

  // 저장된 테이블 데이터 로드
  const loadSavedTableData = (componentId: string) => {
    try {
      const dataKey = getDataKey(componentId, selectedBridgeId);
      const storageKey = `table_data_${dataKey}`;
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        return parsedData;
      }
    } catch (error) {
      console.error('테이블 데이터 로드 실패:', error);
    }
    return [];
  };

  // 빈 행용 셀 렌더링 (새 행 추가용)
  const renderEmptyCell = (componentId: string, rowIndex: number, field: any) => {
    const isEditing = editingCell?.componentId === componentId && 
                     editingCell?.rowIndex === rowIndex && 
                     editingCell?.fieldName === field.name;

    if (isEditing) {
      // 목록 타입인 경우 드롭다운
      if (field.type === 'list' && field.options && field.options.length > 0) {
        return (
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) {
                updateCellValue(componentId, rowIndex, field.name, e.target.value);
              }
            }}
            onBlur={() => setEditingCell(null)}
            className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          >
            {field.options.map((option: string, index: number) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      }
      
      // 불린 타입인 경우 체크박스
      if (field.type === 'boolean') {
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={false}
              onChange={(e) => updateCellValue(componentId, rowIndex, field.name, e.target.checked)}
              onBlur={() => setEditingCell(null)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              autoFocus
            />
            <span className="text-sm text-gray-700">거짓</span>
          </div>
        );
      }

      // 일반 입력 필드
      return (
        <input
          type={field.type === 'number' || field.type === 'integer' || field.type === 'decimal' ? 'number' : 
                field.type === 'date' ? 'date' : 'text'}
          value=""
          onChange={(e) => {
            if (e.target.value) {
              updateCellValue(componentId, rowIndex, field.name, e.target.value);
            }
          }}
          onBlur={() => setEditingCell(null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setEditingCell(null);
            }
            if (e.key === 'Escape') {
              setEditingCell(null);
            }
          }}
          className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          style={{ maxWidth: '100%' }}
          autoFocus
          step={field.type === 'decimal' ? '0.01' : undefined}
        />
      );
    }

    // 표시 모드 - 빈 행용 (텍스트 없이 빈 상태로 표시)
    return (
      <div
        className="px-2 py-1 text-sm cursor-pointer hover:bg-gray-100 rounded min-h-[32px] flex items-center"
        onClick={() => setEditingCell({ componentId, rowIndex, fieldName: field.name })}
      >
        {/* 빈 상태로 표시 - placeholder 텍스트 제거 */}
      </div>
    );
  };

  // 편집 가능한 셀 렌더링
  const renderEditableCell = (componentId: string, rowIndex: number, field: any, value: any) => {
    const isEditing = editingCell?.componentId === componentId && 
                     editingCell?.rowIndex === rowIndex && 
                     editingCell?.fieldName === field.name;

    if (isEditing) {
      // 목록 타입인 경우 드롭다운
      if (field.type === 'list' && field.options && field.options.length > 0) {
        return (
          <select
            value={value || ''}
            onChange={(e) => updateCellValue(componentId, rowIndex, field.name, e.target.value)}
            onBlur={() => setEditingCell(null)}
            className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          >
            {field.options.map((option: string, index: number) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      }
      
      // 불린 타입인 경우 체크박스
      if (field.type === 'boolean') {
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value === true || value === 'true'}
              onChange={(e) => updateCellValue(componentId, rowIndex, field.name, e.target.checked)}
              onBlur={() => setEditingCell(null)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              autoFocus
            />
            <span className="text-sm text-gray-700">
              {value === true || value === 'true' ? '참' : '거짓'}
            </span>
          </div>
        );
      }

      // 일반 입력 필드
      return (
        <input
          type={field.type === 'number' || field.type === 'integer' || field.type === 'decimal' ? 'number' : 
                field.type === 'date' ? 'date' : 'text'}
          value={value || ''}
          onChange={(e) => updateCellValue(componentId, rowIndex, field.name, e.target.value)}
          onBlur={() => setEditingCell(null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setEditingCell(null);
            }
            if (e.key === 'Escape') {
              setEditingCell(null);
            }
          }}
          className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          style={{ maxWidth: '100%' }}
          autoFocus
          step={field.type === 'decimal' ? '0.01' : undefined}
        />
      );
    }

    // 표시 모드
    const displayValue = () => {
      if (field.type === 'boolean') {
        return value === true || value === 'true' ? '참' : '거짓';
      }
      if (field.type === 'list' && field.options && field.options.length > 0) {
        return value || '선택하세요';
      }
      return value || '';
    };
    
    const hasValue = value !== undefined && value !== null && value !== '';
    
    return (
      <div
        className="px-2 py-1 text-sm text-gray-900 cursor-pointer hover:bg-gray-100 rounded min-h-[32px] flex items-center whitespace-nowrap overflow-hidden"
        onClick={() => setEditingCell({ componentId, rowIndex, fieldName: field.name })}
        style={{ textOverflow: 'ellipsis' }}
      >
        {hasValue ? displayValue() : <span className="text-gray-400 italic">클릭하여 입력</span>}
      </div>
    );
  };

  // 테이블 컴포넌트 렌더링
  const renderTableComponent = (component: ScreenComponent) => {
    const tableInfo = tableData[component.componentId];
    if (!tableInfo) {
      return (
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <p className="text-gray-500">테이블 데이터를 로드하는 중...</p>
        </div>
      );
    }

    const { table } = tableInfo;
    const data = editableTableData[component.componentId] || [];

    return (
      <div className="p-4 border border-gray-200 rounded-lg bg-white">
        <div className="flex justify-between items-center mb-4">
          {component.config.showHeader !== false && (
            <h3 className="text-lg font-semibold text-gray-900">{component.displayName}</h3>
          )}
          {(selectedRows[component.componentId] || new Set()).size > 0 && (
            <button
              onClick={() => deleteSelectedRows(component.componentId)}
              className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>선택된 행 삭제 ({(selectedRows[component.componentId] || new Set()).size}개)</span>
            </button>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse" style={{ tableLayout: 'fixed' }}>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200" style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={data.length > 0 && data.every((_, index) => (selectedRows[component.componentId] || new Set()).has(index))}
                    onChange={() => toggleAllRows(component.componentId)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
                <th className="px-2 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200" style={{ width: '60px' }}>
                  #
                </th>
                {table.fields?.map((field: any) => (
                  <th key={field.id} className="px-2 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 last:border-r-0" style={{ width: '150px' }}>
                    {field.displayName || field.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {data.map((row: any, index: number) => (
                <tr key={row.id || index} className="hover:bg-gray-50 border-b border-gray-200">
                  <td className="px-2 py-2 text-sm text-gray-500 text-center border-r border-gray-200 bg-gray-50" style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={(selectedRows[component.componentId] || new Set()).has(index)}
                      onChange={() => toggleRowSelection(component.componentId, index)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-2 py-2 text-sm text-gray-500 text-center border-r border-gray-200 bg-gray-50" style={{ width: '60px' }}>
                    {index + 1}
                  </td>
                  {table.fields?.map((field: any) => (
                    <td key={field.id} className="px-2 py-2 text-sm text-gray-900 border-r border-gray-200 last:border-r-0 overflow-hidden" style={{ width: '150px' }}>
                      {renderEditableCell(component.componentId, index, field, row[field.name])}
                    </td>
                  ))}
                </tr>
              ))}
              {/* 항상 마지막에 빈 행 표시 (새 행 추가용) */}
              <tr className="hover:bg-blue-50 bg-blue-25 border-t-2 border-b-2 border-dashed border-blue-300">
                <td className="px-2 py-2 text-sm text-gray-400 text-center border-r border-dashed border-blue-200 bg-blue-50" style={{ width: '40px' }}>
                  <div className="w-4 h-4"></div>
                </td>
                <td className="px-2 py-2 text-sm text-gray-400 text-center border-r border-dashed border-blue-200 bg-blue-50" style={{ width: '60px' }}>
                  {data.length + 1}
                </td>
                {table.fields?.map((field: any) => (
                  <td key={`empty-${field.id}`} className="px-2 py-2 text-sm text-gray-900 border-r border-dashed border-blue-200 last:border-r-0 overflow-hidden" style={{ width: '150px' }}>
                    {renderEmptyCell(component.componentId, data.length, field)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* 행 개수 표시 */}
        {data.length > 0 && (
          <div className="mt-4 flex items-center justify-end">
            <div className="text-sm text-gray-700">
              총 {data.length}개 행
            </div>
          </div>
        )}
      </div>
    );
  };

  // 변수 컴포넌트 렌더링
  const renderVariableComponent = (component: ScreenComponent) => {
    const variableInfo = variableData[component.componentId];
    if (!variableInfo) {
      return (
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <p className="text-gray-500">변수 데이터를 로드하는 중...</p>
        </div>
      );
    }

    const { variable, value } = variableInfo;

    return (
      <div className="p-4 border border-gray-200 rounded-lg bg-white">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {component.displayName}
        </label>
        
        {variable.type === 'string' && (
          <input
            type="text"
            value={value}
            onChange={(e) => handleVariableChange(component.componentId, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={variable.description || '값을 입력하세요'}
          />
        )}
        
        {variable.type === 'number' && (
          <input
            type="number"
            value={value}
            onChange={(e) => handleVariableChange(component.componentId, parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={variable.description || '숫자를 입력하세요'}
          />
        )}
        
        {variable.type === 'boolean' && (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleVariableChange(component.componentId, e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              {value ? '활성' : '비활성'}
            </span>
          </div>
        )}
        
        {variable.type === 'date' && (
          <input
            type="date"
            value={value}
            onChange={(e) => handleVariableChange(component.componentId, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
        
        {variable.description && (
          <p className="mt-1 text-xs text-gray-500">{variable.description}</p>
        )}
      </div>
    );
  };

  // 차트 컴포넌트 렌더링
  const renderChartComponent = (component: ScreenComponent) => {
    return (
      <div className="p-4 border border-gray-200 rounded-lg bg-white">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{component.displayName}</h3>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <p className="text-gray-500">차트 컴포넌트 (구현 예정)</p>
        </div>
      </div>
    );
  };

  // 입력 컴포넌트 렌더링
  const renderInputComponent = (component: ScreenComponent) => {
    return (
      <div className="p-4 border border-gray-200 rounded-lg bg-white">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{component.displayName}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">입력 필드</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="값을 입력하세요"
            />
          </div>
        </div>
      </div>
    );
  };

  // 출력 컴포넌트 렌더링
  const renderOutputComponent = (component: ScreenComponent) => {
    return (
      <div className="p-4 border border-gray-200 rounded-lg bg-white">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{component.displayName}</h3>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-gray-600">계산 결과가 여기에 표시됩니다.</p>
        </div>
      </div>
    );
  };

  // 컴포넌트 렌더링
  const renderComponent = (component: ScreenComponent) => {
    switch (component.type) {
      case 'table':
        return renderTableComponent(component);
      case 'variable':
        return renderVariableComponent(component);
      case 'chart':
        return renderChartComponent(component);
      case 'input':
        return renderInputComponent(component);
      case 'output':
        return renderOutputComponent(component);
      default:
        return (
          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <p className="text-gray-500">알 수 없는 컴포넌트 타입: {component.type}</p>
          </div>
        );
    }
  };

  // 현재 탭의 그리드 설정 가져오기
  const getCurrentGridConfig = () => {
    if (screen.tabs && screen.tabs.length > 0) {
      const tab = screen.tabs[selectedTabIndex];
      if (tab && typeof tab === 'object' && 'gridConfig' in tab) {
        return (tab as any).gridConfig.rows || [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }];
      }
    } else if (screen.gridConfig) {
      return screen.gridConfig.rows || [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }];
    }
    return [{ cols: [{ width: 0.25 }, { width: 0.25 }, { width: 0.25 }, { width: 0.25 }] }];
  };

  // 특정 셀의 컴포넌트들 가져오기 (현재 탭의 컴포넌트만)
  const getComponentsInCell = (rowIndex: number, colIndex: number) => {
    let filteredComponents = screen.components;
    
    // 탭 레이아웃인 경우에만 현재 탭의 컴포넌트만 필터링
    if (screen.layout === 'tabs' && screen.tabs && screen.tabs.length > 0) {
      // tabIndex가 undefined인 기존 컴포넌트들은 첫 번째 탭(인덱스 0)에 속하도록 처리
      filteredComponents = screen.components.filter(comp => {
        const compTabIndex = comp.tabIndex !== undefined ? comp.tabIndex : 0;
        return compTabIndex === selectedTabIndex;
      });
    }
    // 단일 레이아웃인 경우 모든 컴포넌트를 그대로 사용
    
    return filteredComponents.filter(comp => 
      comp.position.x === colIndex && comp.position.y === rowIndex
    ).sort((a, b) => (a.layer || 0) - (b.layer || 0));
  };

  // 그리드 렌더링
  const renderGrid = () => {
    const gridConfig = getCurrentGridConfig();
    
    return (
      <div className="space-y-4">
        {gridConfig.map((row: any, rowIndex: number) => (
          <div key={rowIndex} className="grid gap-4" style={{
            gridTemplateColumns: row.cols.map((col: any) => `${col.width * 100}%`).join(' ')
          }}>
            {row.cols.map((_col: any, colIndex: number) => {
              const componentsInCell = getComponentsInCell(rowIndex, colIndex);
              
              return (
                <div key={colIndex} className="min-h-[100px] space-y-2">
                  {componentsInCell.map((component) => (
                    <div key={component.id} className="w-full">
                      {renderComponent(component)}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
        {/* 교량 선택 UI (교량별 데이터 구조일 때만 표시) - 화면 제목보다 위에 배치 */}
        {screen.dataStructure === 'bridge' && (
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center space-x-4">
              {availableBridges.length > 0 ? (
                <>
                  <div className="relative w-64">
                    <button
                      onClick={() => setIsBridgeDropdownOpen(!isBridgeDropdownOpen)}
                      className="w-full flex items-center justify-between p-2 text-left hover:bg-gray-50 rounded-md transition-colors border border-gray-200"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 bg-green-100 rounded flex items-center justify-center">
                          <Building2 className="h-3 w-3 text-green-600" />
                        </div>
                        <div className="font-medium text-gray-900 text-sm truncate" title={availableBridges.find(b => b.id === selectedBridgeId)?.name || ''}>
                          {availableBridges.find(b => b.id === selectedBridgeId)?.name || ''}
                        </div>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isBridgeDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isBridgeDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                        {availableBridges.map((bridge) => (
                          <button
                            key={bridge.id}
                            onClick={() => {
                              setSelectedBridgeId(bridge.id);
                              setIsBridgeDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors ${
                              selectedBridgeId === bridge.id ? 'bg-green-50 text-green-700' : 'text-gray-700'
                            }`}
                          >
                            <div className="truncate font-medium text-sm" title={bridge.name}>
                              {bridge.name}
                            </div>
                            {bridge.description && (
                              <div className="text-xs text-gray-500 mt-1">{bridge.description}</div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* 교량 정보 표시 */}
                  {selectedBridgeId && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">선택된 교량</span>
                      <span className="mx-2">•</span>
                      <span>데이터 입력 가능</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-amber-600">
                  프로젝트 설정에서 교량을 먼저 등록해주세요.
                </div>
              )}
            </div>
          </div>
        )}

      <div className="p-6">
        <div className="space-y-6">
          {/* 화면 헤더 */}
          <div className="px-6 py-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {lnbMenu?.displayName || screen.displayName}
              </h2>
              {screen.description && (
                <p className="text-sm text-gray-600">{screen.description}</p>
              )}
            </div>
          </div>

        {/* 탭이 있는 경우 탭 헤더 (레이아웃이 'tabs'일 때만) */}
        {screen.layout === 'tabs' && screen.tabs && screen.tabs.length > 0 && (
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {screen.tabs.map((tab, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedTabIndex(index)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    selectedTabIndex === index
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {typeof tab === 'string' ? tab : (tab as any).name || `탭 ${index + 1}`}
                </button>
              ))}
            </nav>
          </div>
        )}

          {/* 메인 콘텐츠 */}
          {screen.dataStructure === 'bridge' && availableBridges.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-lg mb-2">교량이 등록되지 않았습니다</p>
                <p className="text-sm">프로젝트 설정에서 교량을 먼저 등록해주세요.</p>
              </div>
            </div>
          ) : screen.dataStructure === 'bridge' && !selectedBridgeId ? (
            <div className="py-12 text-center">
              <div className="text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-lg mb-2">교량을 선택해주세요</p>
                <p className="text-sm">위에서 교량을 선택하면 해당 교량의 데이터를 입력할 수 있습니다.</p>
              </div>
            </div>
          ) : (
            <div className="px-6">
              {renderGrid()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScreenRuntimeView;
