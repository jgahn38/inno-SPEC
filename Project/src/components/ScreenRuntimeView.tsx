import React, { useState, useEffect } from 'react';
import { ScreenConfig, ScreenComponent } from '../types';
import { TableSchemaService } from '../services/TableSchemaService';
import { variableService } from '../services/VariableService';

interface ScreenRuntimeViewProps {
  screen: ScreenConfig;
  lnbMenu?: any;
}

interface TableData {
  [key: string]: any;
}

interface VariableData {
  [key: string]: any;
}

const ScreenRuntimeView: React.FC<ScreenRuntimeViewProps> = ({ screen, lnbMenu }) => {
  const [tableData, setTableData] = useState<TableData>({});
  const [variableData, setVariableData] = useState<VariableData>({});
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  
  const tableService = TableSchemaService.getInstance();

  // 테이블 데이터 로드
  useEffect(() => {
    const loadTableData = async () => {
      const tableComponents = screen.components.filter(comp => comp.type === 'table');
      const newTableData: TableData = {};
      
      for (const component of tableComponents) {
        try {
          const table = await tableService.getTableById(component.componentId);
          if (table) {
            // 실제 테이블 데이터를 가져오는 로직 (현재는 샘플 데이터)
            newTableData[component.componentId] = {
              table,
              data: generateSampleTableData(table)
            };
          }
        } catch (error) {
          console.error(`Failed to load table data for ${component.componentId}:`, error);
        }
      }
      
      setTableData(newTableData);
    };

    loadTableData();
  }, [screen.components, tableService]);

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

  // 샘플 테이블 데이터 생성
  const generateSampleTableData = (table: any) => {
    const sampleData = [];
    for (let i = 1; i <= 5; i++) {
      const row: any = { id: i };
      table.fields?.forEach((field: any) => {
        switch (field.type) {
          case 'string':
            row[field.name] = `샘플 데이터 ${i}`;
            break;
          case 'number':
            row[field.name] = Math.floor(Math.random() * 100);
            break;
          case 'boolean':
            row[field.name] = Math.random() > 0.5;
            break;
          case 'date':
            row[field.name] = new Date().toISOString().split('T')[0];
            break;
          default:
            row[field.name] = `값 ${i}`;
        }
      });
      sampleData.push(row);
    }
    return sampleData;
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

    const { table, data } = tableInfo;

    return (
      <div className="p-4 border border-gray-200 rounded-lg bg-white">
        {component.config.showHeader !== false && (
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{component.displayName}</h3>
        )}
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {table.fields?.map((field: any) => (
                  <th key={field.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {field.displayName || field.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((row: any, index: number) => (
                <tr key={row.id || index} className="hover:bg-gray-50">
                  {table.fields?.map((field: any) => (
                    <td key={field.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row[field.name]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {component.config.showPagination !== false && data.length > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              총 {data.length}개 항목
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
                이전
              </button>
              <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
                다음
              </button>
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
    
    // 탭 레이아웃인 경우 현재 탭의 컴포넌트만 필터링
    if (screen.layout === 'tabs' && screen.tabs && screen.tabs.length > 0) {
      // tabIndex가 undefined인 기존 컴포넌트들은 첫 번째 탭(인덱스 0)에 속하도록 처리
      filteredComponents = screen.components.filter(comp => {
        const compTabIndex = comp.tabIndex !== undefined ? comp.tabIndex : 0;
        return compTabIndex === selectedTabIndex;
      });
    }
    
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
            {row.cols.map((col: any, colIndex: number) => {
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

        {/* 탭이 있는 경우 탭 헤더 */}
        {screen.tabs && screen.tabs.length > 0 && (
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
        <div className="px-6">
          {renderGrid()}
        </div>
      </div>
    </div>
  );
};

export default ScreenRuntimeView;
