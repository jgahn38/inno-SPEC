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

  useEffect(() => {
    // sectionLibrary.json 데이터 로드
    fetch('/section_library/boxgirder_singlecell.json')
      .then(response => response.json())
      .then((data: SectionLibrary) => {
        setSectionData(data);
        // 기본값으로 파라미터 초기화
        const initialParams: Record<string, number> = {};
        data.parameters.forEach(param => {
          initialParams[param.key] = param.default;
        });
        setParameters(initialParams);
        calculateDerivedValues(initialParams);
        validateConstraints(initialParams);
      })
      .catch(error => {
        console.error('Failed to load section library:', error);
      });
  }, []);

  const calculateDerivedValues = (params: Record<string, number>) => {
    if (!sectionData) return;

    const derived: Record<string, number> = {};
    sectionData.derived.forEach(item => {
      try {
        // 간단한 수식 계산 (실제로는 더 복잡한 수식 파서가 필요)
        const expr = item.expr
          .replace(/B/g, params.B?.toString() || '0')
          .replace(/H/g, params.H?.toString() || '0')
          .replace(/tw/g, params.tw?.toString() || '0')
          .replace(/tt/g, params.tt?.toString() || '0')
          .replace(/tb/g, params.tb?.toString() || '0')
          .replace(/cw/g, params.cw?.toString() || '0')
          .replace(/rc/g, params.rc?.toString() || '0');
        
        derived[item.key] = eval(expr);
      } catch (error) {
        derived[item.key] = 0;
      }
    });
    setDerivedValues(derived);
  };

  const validateConstraints = (params: Record<string, number>) => {
    if (!sectionData) return;

    const results = sectionData.constraints.map(constraint => {
      try {
        const expr = constraint.expr
          .replace(/B/g, params.B?.toString() || '0')
          .replace(/H/g, params.H?.toString() || '0')
          .replace(/tw/g, params.tw?.toString() || '0')
          .replace(/tt/g, params.tt?.toString() || '0')
          .replace(/tb/g, params.tb?.toString() || '0')
          .replace(/cw/g, params.cw?.toString() || '0')
          .replace(/rc/g, params.rc?.toString() || '0');
        
        const isValid = eval(expr);
        return {
          message: constraint.message,
          severity: constraint.severity,
          isValid
        };
      } catch (error) {
        return {
          message: constraint.message,
          severity: constraint.severity,
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

    const { B, H, tw, tt, tb, cw } = parameters;

    if (!B || !H || !tw || !tt || !tb || !cw) return null;

    const scale = Math.min(400 / B, 300 / H);
    const centerX = 250;
    const centerY = 200;

    return (
      <div className="relative bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 flex items-center justify-center">
        <svg width="500" height="400" viewBox="0 0 500 400">
          {/* 좌표축 */}
          <line x1="50" y1="350" x2="450" y2="350" stroke="#ccc" strokeWidth="1" />
          <line x1="50" y1="350" x2="50" y2="50" stroke="#ccc" strokeWidth="1" />
          <text x="450" y="365" fontSize="12" fill="#666">X (mm)</text>
          <text x="35" y="55" fontSize="12" fill="#666">Y (mm)</text>
          
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">삽도 - {sectionData.name}</h2>
            <p className="text-sm text-gray-600">박스거더 단면의 파라미터를 조정하고 형상을 미리보기하세요.</p>
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
          
          <div className="p-4 space-y-4">
            {sectionData.parameters
              .sort((a, b) => a.ui.order - b.ui.order)
              .map(param => (
                <div key={param.key} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {param.label}
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={parameters[param.key] || ''}
                      onChange={(e) => updateParameter(param.key, parseFloat(e.target.value) || 0)}
                      min={param.min}
                      max={param.max}
                      step="1"
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-sm text-gray-500 w-12">{param.unit}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>최소: {param.min}</span>
                    <span>최대: {param.max}</span>
                  </div>
                </div>
              ))}
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