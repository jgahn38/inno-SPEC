import React, { useState, useEffect } from 'react';
import { Eye, Settings, Download, RotateCcw, Plus, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

interface SectionParameter {
  key: string;
  label: string;
  type: string;
  unit: string;
  default: number;
  min: number;
  max: number;
  ui: {
    control: string;
    order: number;
  };
}

interface SectionLibrary {
  id: string;
  name: string;
  version: string;
  category: string;
  parameters: SectionParameter[];
  derived: Array<{
    key: string;
    label: string;
    unit: string;
    expr: string;
  }>;
  constraints: Array<{
    expr: string;
    message: string;
    severity: string;
  }>;
  geometry: {
    draw_ops: Array<{
      op: string;
      args: any;
      save_as?: string;
    }>;
  };
}

const IllustrationView: React.FC = () => {
  const [sectionData, setSectionData] = useState<SectionLibrary | null>(null);
  const [parameters, setParameters] = useState<Record<string, number>>({});
  const [derivedValues, setDerivedValues] = useState<Record<string, number>>({});
  const [constraintResults, setConstraintResults] = useState<Array<{
    message: string;
    severity: string;
    isValid: boolean;
  }>>([]);
  const [viewMode, setViewMode] = useState<'front' | 'side' | 'top'>('front');
  const [availableSections, setAvailableSections] = useState<Array<{id: string, name: string, filename: string}>>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [parameterSearchTerm, setParameterSearchTerm] = useState<string>('');
  const [parameterSortBy, setParameterSortBy] = useState<'order' | 'name' | 'value'>('order');
  const [parameterSortDirection, setParameterSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    // 사용 가능한 section 파일들 로드
    const loadAvailableSections = async () => {
      try {
        console.log('Fetching sections from API...');
        
        // 서버 API에서 section 목록을 가져옴
        const response = await fetch('/api/sections');
        console.log('API Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`API request failed with status: ${response.status}`);
        }
        
        const sections = await response.json();
        console.log('API Response data:', sections);
        
        setAvailableSections(sections);
        
        // 기본값으로 첫 번째 section 선택
        if (sections.length > 0) {
          setSelectedSectionId(sections[0].id);
          loadSectionData(sections[0].filename);
        }
      } catch (error) {
        console.error('Failed to load available sections:', error);
        
        // API 실패 시 fallback으로 각 JSON 파일에서 직접 name을 읽어옴
        console.log('Using fallback sections with direct JSON loading...');
        
        const fallbackFiles = [
          { id: 'boxgirder_singlecell', filename: 'boxgirder_singlecell.json' },
          { id: 'solid_rectangle', filename: 'solid_rectangle.json' }
        ];
        
        // 각 JSON 파일에서 직접 name을 로드
        const fallbackSections = await Promise.all(
          fallbackFiles.map(async (file) => {
            try {
              const response = await fetch(`/section_library/${file.filename}`);
              if (response.ok) {
                const data = await response.json();
                return {
                  id: file.id,
                  name: data.name || file.filename,
                  filename: file.filename
                };
              } else {
                return {
                  id: file.id,
                  name: file.filename,
                  filename: file.filename
                };
              }
            } catch (error) {
              console.warn(`Failed to load ${file.filename}:`, error);
              return {
                id: file.id,
                name: file.filename,
                filename: file.filename
              };
            }
          })
        );
        
        setAvailableSections(fallbackSections);
        
        if (fallbackSections.length > 0) {
          setSelectedSectionId(fallbackSections[0].id);
          loadSectionData(fallbackSections[0].filename);
        }
      }
    };

    loadAvailableSections();
  }, []);

  const loadSectionData = async (filename: string) => {
    try {
      const response = await fetch(`/section_library/${filename}`);
      const data: SectionLibrary = await response.json();
      setSectionData(data);
      
      // 기본값으로 파라미터 초기화
      const initialParams: Record<string, number> = {};
      data.parameters.forEach(param => {
        initialParams[param.key] = param.default;
      });
      setParameters(initialParams);
      calculateDerivedValues(initialParams);
      validateConstraints(initialParams);
    } catch (error) {
      console.error('Failed to load section data:', error);
    }
  };

  const handleSectionChange = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    const section = availableSections.find(s => s.id === sectionId);
    if (section) {
      loadSectionData(section.filename);
    }
  };

  const getSortedAndFilteredParameters = () => {
    if (!sectionData) return [];
    
    let filteredParams = sectionData.parameters;
    
    // 검색 필터링
    if (parameterSearchTerm) {
      filteredParams = filteredParams.filter(param => 
        param.label.toLowerCase().includes(parameterSearchTerm.toLowerCase()) ||
        param.key.toLowerCase().includes(parameterSearchTerm.toLowerCase())
      );
    }
    
    // 정렬
    filteredParams.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (parameterSortBy) {
        case 'order':
          aValue = a.ui.order;
          bValue = b.ui.order;
          break;
        case 'name':
          aValue = a.label;
          bValue = b.label;
          break;
        case 'value':
          aValue = parameters[a.key] || 0;
          bValue = parameters[b.key] || 0;
          break;
        default:
          aValue = a.ui.order;
          bValue = b.ui.order;
      }
      
      if (parameterSortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filteredParams;
  };

  const handleSort = (sortBy: 'order' | 'name' | 'value') => {
    if (parameterSortBy === sortBy) {
      setParameterSortDirection(parameterSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setParameterSortBy(sortBy);
      setParameterSortDirection('asc');
    }
  };

  // 공통 좌표축 렌더링 함수
  const renderCoordinateSystem = (originX: number, originY: number) => {
    return (
      <>
        {/* 배경 그리드 */}
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="500" height="400" fill="url(#grid)" />
        
        {/* 좌표축 - 가장 높은 우선순위로 렌더링 */}
        <line x1={originX - 150} y1={originY} x2={originX + 150} y2={originY} stroke="#333" strokeWidth="4" />
        <line x1={originX} y1={originY - 150} x2={originX} y2={originY + 150} stroke="#333" strokeWidth="4" />
        
        {/* 좌표축 화살표 */}
        <polygon points={`${originX + 150},${originY} ${originX + 140},${originY - 10} ${originX + 140},${originY + 10}`} fill="#333" />
        <polygon points={`${originX},${originY - 150} ${originX - 10},${originY - 140} ${originX + 10},${originY - 140}`} fill="#333" />
        
        {/* 좌표축 라벨 */}
        <text x={originX + 170} y={originY + 10} fontSize="18" fill="#000" fontWeight="bold">X (mm)</text>
        <text x={originX - 10} y={originY - 170} fontSize="18" fill="#000" fontWeight="bold">Y (mm)</text>
        
        {/* Origin 점 표시 */}
        <circle cx={originX} cy={originY} r="8" fill="#ff0000" stroke="#fff" strokeWidth="4" />
        <text x={originX + 30} y={originY + 30} fontSize="16" fill="#ff0000" fontWeight="bold">Origin (0,0)</text>
      </>
    );
  };

  const calculateDerivedValues = (params: Record<string, number>) => {
    if (!sectionData) return;

    const derived: Record<string, number> = {};
    sectionData.derived.forEach(item => {
      try {
        // 간단한 수식 계산 (실제로는 더 복잡한 수식 파서가 필요)
        let expr = item.expr;
        
        // 모든 파라미터를 동적으로 치환
        Object.keys(params).forEach(key => {
          const regex = new RegExp(key, 'g');
          expr = expr.replace(regex, params[key]?.toString() || '0');
        });
        
        derived[item.key] = eval(expr);
      } catch (error) {
        console.warn(`Failed to calculate derived value for ${item.key}:`, error);
        derived[item.key] = 0;
      }
    });
    setDerivedValues(derived);
  };

  const validateConstraints = (params: Record<string, number>) => {
    if (!sectionData) return;

    const results = sectionData.constraints.map(constraint => {
      try {
        let expr = constraint.expr;
        
        // 모든 파라미터를 동적으로 치환
        Object.keys(params).forEach(key => {
          const regex = new RegExp(key, 'g');
          expr = expr.replace(regex, params[key]?.toString() || '0');
        });
        
        const isValid = eval(expr);
        return {
          message: constraint.message,
          severity: constraint.severity,
          isValid
        };
      } catch (error) {
        console.warn(`Failed to validate constraint: ${constraint.expr}`, error);
        return {
          message: `제약조건 검증 실패: ${constraint.expr}`,
          severity: 'error',
          isValid: false
        };
      }
    });
    setConstraintResults(results);
  };

  const updateParameter = (key: string, value: number) => {
    const newParams = { ...parameters, [key]: value };
    setParameters(newParams);
    calculateDerivedValues(newParams);
    validateConstraints(newParams);
  };

  const resetParameters = () => {
    if (!sectionData) return;
    
    const initialParams: Record<string, number> = {};
    sectionData.parameters.forEach(param => {
      initialParams[param.key] = param.default;
    });
    setParameters(initialParams);
    calculateDerivedValues(initialParams);
    validateConstraints(initialParams);
  };

  const renderSectionPreview = () => {
    if (!sectionData || !parameters) return null;

    // section 타입에 따라 다른 렌더링 로직 적용
    if (sectionData.id === 'section.solid.rectangle.v1') {
      return renderRectangleSection();
    } else {
      return renderBoxGirderSection();
    }
  };

  const renderRectangleSection = () => {
    const { B, H } = parameters;
    
    if (!B || !H) return null;

    const scale = Math.min(400 / B, 300 / H);
    const centerX = 250;
    const centerY = 200;
    
    // Geometry의 Origin 위치 계산 (JSON의 local_cs.origin 기준)
    // fallback: sectionData가 없거나 origin이 정의되지 않은 경우 centerX, centerY 사용
    let originX, originY;
    if (sectionData?.geometry?.local_cs?.origin) {
      originX = centerX + sectionData.geometry.local_cs.origin[0] * scale;
      originY = centerY - sectionData.geometry.local_cs.origin[1] * scale;
    } else {
      originX = centerX;
      originY = centerY;
    }
    
    console.log('Rectangle Section Debug:', {
      B, H, scale, centerX, centerY, originX, originY,
      sectionData: sectionData?.geometry?.local_cs
    });

    return (
      <div className="relative bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 flex items-center justify-center">
        <svg width="500" height="400" viewBox="0 0 500 400">
          {/* 공통 좌표축 렌더링 */}
          {renderCoordinateSystem(originX, originY)}
          
          {/* 직사각형 단면 */}
          <rect
            x={centerX - (B * scale) / 2}
            y={centerY - (H * scale) / 2}
            width={B * scale}
            height={H * scale}
            fill="#e0e0e0"
            stroke="#3b82f6"
            strokeWidth="2"
          />
          
          {/* 치수선 */}
          <g stroke="#666" strokeWidth="1">
            {/* 높이 치수 */}
            <line x1={centerX - (B * scale) / 2 - 20} y1={centerY - (H * scale) / 2} 
                  x2={centerX - (B * scale) / 2 - 20} y2={centerY + (H * scale) / 2} />
            <line x1={centerX - (B * scale) / 2 - 25} y1={centerY - (H * scale) / 2} 
                  x2={centerX - (B * scale) / 2 - 15} y2={centerY - (H * scale) / 2} />
            <line x1={centerX - (B * scale) / 2 - 25} y1={centerY + (H * scale) / 2} 
                  x2={centerX - (B * scale) / 2 - 15} y2={centerY + (H * scale) / 2} />
            <text x={centerX - (B * scale) / 2 - 35} y={centerY} fontSize="12" fill="#666" textAnchor="middle">
              H = {H}mm
            </text>
            
            {/* 폭 치수 */}
            <line x1={centerX - (B * scale) / 2} y1={centerY + (H * scale) / 2 + 20} 
                  x2={centerX + (B * scale) / 2} y2={centerY + (H * scale) / 2 + 20} />
            <line x1={centerX - (B * scale) / 2} y1={centerY + (H * scale) / 2 + 15} 
                  x2={centerX - (B * scale) / 2} y2={centerY + (H * scale) / 2 + 25} />
            <line x1={centerX + (B * scale) / 2} y1={centerY + (H * scale) / 2 + 15} 
                  x2={centerX + (B * scale) / 2} y2={centerY + (H * scale) / 2 + 25} />
            <text x={centerX} y={centerY + (B * scale) / 2 + 40} fontSize="12" fill="#666" textAnchor="middle">
              B = {B}mm
            </text>
          </g>
          
          {/* 단면 정보 */}
          <text x={centerX} y={centerY - (H * scale) / 2 - 10} fontSize="10" fill="#666" textAnchor="middle">
            실체 직사각형 단면
          </text>
        </svg>
      </div>
    );
  };

  const renderBoxGirderSection = () => {
    const { B, H, tw, tt, tb, cw } = parameters;
    
    if (!B || !H || !tw || !tt || !tb || !cw) return null;

    const scale = Math.min(400 / B, 300 / H);
    const centerX = 250;
    const centerY = 200;
    
    // Geometry의 Origin 위치 계산 (JSON의 local_cs.origin 기준)
    const originX = centerX + (sectionData.geometry.local_cs?.origin?.[0] || 0) * scale;
    const originY = centerY - (sectionData.geometry.local_cs?.origin?.[1] || 0) * scale;

    return (
      <div className="relative bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 flex items-center justify-center">
        <svg width="500" height="400" viewBox="0 0 500 400">
          {/* 공통 좌표축 렌더링 */}
          {renderCoordinateSystem(originX, originY)}
          
          {/* 외부 박스 */}
          <rect
            x={centerX - (B * scale) / 2}
            y={centerY - (H * scale) / 2}
            width={B * scale}
            height={H * scale}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
          />
          
          {/* 내부 박스 (웹 제외) */}
          <rect
            x={centerX - (cw * scale) / 2}
            y={centerY - (H * scale) / 2 + (tt * scale)}
            width={cw * scale}
            height={(H - tt - tb) * scale}
            fill="none"
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeDasharray="5,5"
          />
          
          {/* 웹 (복부판) */}
          <rect
            x={centerX - (tw * scale) / 2}
            y={centerY - (H * scale) / 2}
            width={tw * scale}
            height={H * scale}
            fill="rgba(59, 130, 246, 0.3)"
            stroke="#3b82f6"
            strokeWidth="1"
          />
          
          {/* 치수선 */}
          <g stroke="#666" strokeWidth="1">
            {/* 높이 치수 */}
            <line x1={centerX - (B * scale) / 2 - 20} y1={centerY - (H * scale) / 2} 
                  x2={centerX - (B * scale) / 2 - 20} y2={centerY + (H * scale) / 2} />
            <line x1={centerX - (B * scale) / 2 - 25} y1={centerY - (H * scale) / 2} 
                  x2={centerX - (B * scale) / 2 - 15} y2={centerY - (H * scale) / 2} />
            <line x1={centerX - (B * scale) / 2 - 25} y1={centerY + (H * scale) / 2} 
                  x2={centerX - (B * scale) / 2 - 15} y2={centerY + (H * scale) / 2} />
            <text x={centerX - (B * scale) / 2 - 35} y={centerY} fontSize="12" fill="#666" textAnchor="middle">
              H = {H}mm
            </text>
            
            {/* 폭 치수 */}
            <line x1={centerX - (B * scale) / 2} y1={centerY + (H * scale) / 2 + 20} 
                  x2={centerX + (B * scale) / 2} y2={centerY + (H * scale) / 2 + 20} />
            <line x1={centerX - (B * scale) / 2} y1={centerY + (H * scale) / 2 + 15} 
                  x2={centerX - (B * scale) / 2} y2={centerY + (H * scale) / 2 + 25} />
            <line x1={centerX + (B * scale) / 2} y1={centerY + (H * scale) / 2 + 15} 
                  x2={centerX + (B * scale) / 2} y2={centerY + (H * scale) / 2 + 25} />
            <text x={centerX} y={centerY + (H * scale) / 2 + 40} fontSize="12" fill="#666" textAnchor="middle">
              B = {B}mm
            </text>
          </g>
          
          {/* 주요 치수 표시 */}
          <text x={centerX} y={centerY - (H * scale) / 2 - 10} fontSize="10" fill="#666" textAnchor="middle">
            tw={tw}mm, tt={tt}mm, tb={tb}mm
          </text>
        </svg>
      </div>
    );
  };

  if (!sectionData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">섹션 라이브러리를 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">단면 - {sectionData.name}</h2>
            <p className="text-sm text-gray-600">단면의 파라미터를 조정하고 형상을 미리보기하세요.</p>
            
            {/* Section 선택 콤보박스 */}
            <div className="mt-3">
              <label htmlFor="section-select" className="block text-sm font-medium text-gray-700 mb-1">
                단면 유형 선택
              </label>
              <select
                id="section-select"
                value={selectedSectionId}
                onChange={(e) => handleSectionChange(e.target.value)}
                className="block w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {availableSections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={resetParameters}
              className="flex items-center space-x-2 px-3 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span>기본값 복원</span>
            </button>
            <button className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              <Download className="h-4 w-4" />
              <span>도면 저장</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 파라미터 입력 패널 */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">단면 파라미터</h3>
            </div>
          </div>
          
          <div className="p-4">
            {/* 검색 및 필터링 */}
            <div className="mb-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="파라미터 검색..."
                    value={parameterSearchTerm}
                    onChange={(e) => setParameterSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="text-sm text-gray-500">
                  {getSortedAndFilteredParameters().length} / {sectionData.parameters.length} 파라미터
                </div>
              </div>
            </div>
            
            {/* 엑셀과 같은 테이블 형식의 파라미터 입력 */}
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('order')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>순서</span>
                        {parameterSortBy === 'order' && (
                          <span className="text-blue-600">
                            {parameterSortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>파라미터</span>
                        {parameterSortBy === 'name' && (
                          <span className="text-blue-600">
                            {parameterSortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('value')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>값</span>
                        {parameterSortBy === 'value' && (
                          <span className="text-blue-600">
                            {parameterSortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      단위
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      범위
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      설명
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getSortedAndFilteredParameters().map((param, index) => (
                      <tr key={param.key} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-sm font-medium text-gray-900">
                            {param.ui.order}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {param.label}
                          </div>
                          <div className="text-xs text-gray-500">
                            {param.key}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            value={parameters[param.key] || ''}
                            onChange={(e) => updateParameter(param.key, parseFloat(e.target.value) || 0)}
                            min={param.min}
                            max={param.max}
                            step="1"
                            className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {param.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs text-gray-600">
                            <div>최소: {param.min.toLocaleString()}</div>
                            <div>최대: {param.max.toLocaleString()}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          기본값: {param.default.toLocaleString()} {param.unit}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            
            {/* 빠른 액션 버튼들 */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={resetParameters}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>기본값 복원</span>
                </button>
                <button
                  onClick={() => {
                    const newParams = { ...parameters };
                    Object.keys(newParams).forEach(key => {
                      const param = sectionData.parameters.find(p => p.key === key);
                      if (param) {
                        newParams[key] = param.min;
                      }
                    });
                    setParameters(newParams);
                    calculateDerivedValues(newParams);
                    validateConstraints(newParams);
                  }}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <span>최소값 설정</span>
                </button>
                <button
                  onClick={() => {
                    const newParams = { ...parameters };
                    Object.keys(newParams).forEach(key => {
                      const param = sectionData.parameters.find(p => p.key === key);
                      if (param) {
                        newParams[key] = param.max;
                      }
                    });
                    setParameters(newParams);
                    calculateDerivedValues(newParams);
                    validateConstraints(newParams);
                  }}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <span>최대값 설정</span>
                </button>
              </div>
              
              <div className="text-sm text-gray-500">
                총 {sectionData.parameters.length}개 파라미터
              </div>
            </div>
          </div>
        </div>

        {/* 미리보기 패널 */}
        <div className="bg-white rounded-lg border border-gray-200 lg:col-span-2">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">단면 미리보기</h3>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setViewMode('front')}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    viewMode === 'front' 
                      ? 'bg-blue-100 text-blue-700 font-medium' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  정면도
                </button>
                <button
                  onClick={() => setViewMode('side')}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    viewMode === 'side' 
                      ? 'bg-blue-100 text-blue-700 font-medium' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  측면도
                </button>
                <button
                  onClick={() => setViewMode('top')}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    viewMode === 'top' 
                      ? 'bg-blue-100 text-blue-700 font-medium' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  평면도
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            <div className="min-h-[400px] flex items-center justify-center">
              {renderSectionPreview()}
            </div>
          </div>
        </div>
      </div>

      {/* 파생값 및 제약조건 패널 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 파생값 */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">계산된 값</h3>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {sectionData.derived.map(item => (
                <div key={item.key} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {derivedValues[item.key]?.toFixed(2) || '0.00'} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 제약조건 검증 */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">제약조건 검증</h3>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {constraintResults.map((result, index) => (
                <div key={index} className={`flex items-center space-x-2 p-2 rounded-md ${
                  result.isValid 
                    ? 'bg-green-50 border border-green-200' 
                    : result.severity === 'error'
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  {result.isValid ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm ${
                    result.isValid 
                      ? 'text-green-800' 
                      : result.severity === 'error'
                      ? 'text-red-800'
                      : 'text-yellow-800'
                  }`}>
                    {result.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IllustrationView;