import React, { useState } from 'react';
import { Grid as BridgeIcon, ChevronDown } from 'lucide-react';
import Sidebar from './Sidebar';
import InputTable from './InputTable';
import ResultPanel from './ResultPanel';
import IllustrationView from './IllustrationView';
import { Project, Bridge as BridgeType, TableRow, CheckItem } from '../types';

interface EvaluationViewProps {
  project: Project;
  selectedBridge: BridgeType | null;
  projects: Project[];
  onProjectChange: (project: Project) => void;
  onBridgeChange: (bridge: BridgeType) => void;
}

const EvaluationView: React.FC<EvaluationViewProps> = ({ 
  project, 
  selectedBridge, 
  projects, 
  onProjectChange, 
  onBridgeChange 
}) => {
  const [activeMenu, setActiveMenu] = useState('input');
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState<CheckItem[]>([]);
  const [isBridgeDropdownOpen, setIsBridgeDropdownOpen] = useState(false);

  const handleCalculate = async (data: TableRow[]) => {
    setIsCalculating(true);
    setActiveMenu('results');
    
    // 실제 계산 로직을 시뮬레이션 (추후 Python 백엔드와 연동)
    setTimeout(() => {
      const mockResults: CheckItem[] = [
        {
          id: '1',
          category: '기본 검토',
          description: '교량 길이 대 폭 비율 검토',
          result: 'OK',
          value: '2.5',
          criteria: '≤ 4.0'
        },
        {
          id: '2',
          category: '재료 강도',
          description: '콘크리트 압축강도 기준 검토',
          result: 'OK',
          value: '30.0 MPa',
          criteria: '≥ 24.0 MPa'
        },
        {
          id: '3',
          category: '철근 강도',
          description: '철근 항복강도 기준 검토',
          result: 'NG',
          value: '400.0 MPa',
          criteria: '≥ 500.0 MPa'
        },
        {
          id: '4',
          category: '구조 안전성',
          description: '단면 성능 검토',
          result: 'OK',
          value: '1.25',
          criteria: '≥ 1.2'
        }
      ];
      
      setResults(mockResults);
      setIsCalculating(false);
    }, 2000);
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'input':
        return <InputTable onCalculate={handleCalculate} />;
      case 'calculation':
        return (
          <div className="space-y-4">
            <div className="px-6 py-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">내진성능 계산</h2>
                <p className="text-sm text-gray-600">계산 알고리즘 설정 및 해석 매개변수를 조정하세요.</p>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <p className="text-gray-600">계산 설정 및 매개변수 조정 기능이 여기에 구현됩니다.</p>
            </div>
          </div>
        );
      case 'results':
        return <ResultPanel isCalculating={isCalculating} results={results} />;
      case 'illustration':
        return <IllustrationView />;
      case 'report':
        return (
          <div className="space-y-4">
            <div className="px-6 py-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">보고서 생성</h2>
                <p className="text-sm text-gray-600">내진성능평가 결과를 종합한 상세 보고서를 생성하세요.</p>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <p className="text-gray-600">계산 결과를 바탕으로 한 상세 보고서 생성 기능이 여기에 구현됩니다.</p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-4">
            <div className="px-6 py-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">프로젝트 설정</h2>
                <p className="text-sm text-gray-600">프로젝트별 환경 설정 및 계산 기준을 관리하세요.</p>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <p className="text-gray-600">프로젝트별 설정 및 환경 구성 기능이 여기에 구현됩니다.</p>
            </div>
          </div>
        );
      default:
        return <InputTable onCalculate={handleCalculate} />;
    }
  };

  return (
    <div className="flex h-full">
      <Sidebar 
        activeMenu={activeMenu} 
        onMenuSelect={setActiveMenu}
        selectedProject={project}
        selectedBridge={selectedBridge}
        projects={projects}
        onProjectChange={onProjectChange}
        onBridgeChange={onBridgeChange}
      />
      <div className="flex-1 bg-gray-50 overflow-auto">
        {/* 교량 선택 콤보박스 */}
        {project.bridges.length > 0 && (
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="relative w-64">
                <button
                  onClick={() => setIsBridgeDropdownOpen(!isBridgeDropdownOpen)}
                  className="w-full flex items-center justify-between p-2 text-left hover:bg-gray-50 rounded-md transition-colors border border-gray-200"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-green-100 rounded flex items-center justify-center">
                      <BridgeIcon className="h-3 w-3 text-green-600" />
                    </div>
                    <div className="font-medium text-gray-900 text-sm truncate" title={selectedBridge?.name || '교량 선택'}>
                      {selectedBridge?.name || '교량 선택'}
                    </div>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isBridgeDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isBridgeDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                    {project.bridges.map((bridge) => (
                      <button
                        key={bridge.id}
                        onClick={() => {
                          onBridgeChange(bridge);
                          setIsBridgeDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors ${
                          selectedBridge?.id === bridge.id ? 'bg-green-50 text-green-700' : 'text-gray-700'
                        }`}
                      >
                        <div className="truncate font-medium text-sm" title={bridge.name}>
                          {bridge.name}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* 교량 정보 표시 */}
              {selectedBridge && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{getBridgeTypeLabel(selectedBridge.type)}</span>
                  <span className="mx-2">•</span>
                  <span>L={selectedBridge.length}m (35.00x8)</span>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="p-6">
        {renderContent()}
        </div>
      </div>
    </div>
  );
};

const getBridgeTypeLabel = (type: BridgeType['type']) => {
  switch (type) {
    case 'concrete': return 'PCB(35)';
    case 'steel': return '강교';
    case 'composite': return '합성교';
    default: return type;
  }
};

export default EvaluationView;