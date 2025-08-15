import React from 'react';
import { CheckCircle, XCircle, AlertCircle, FileBarChart } from 'lucide-react';

interface CheckItem {
  id: string;
  category: string;
  description: string;
  result: 'OK' | 'NG' | 'PENDING';
  value?: string;
  criteria?: string;
}

interface ResultPanelProps {
  isCalculating: boolean;
  results: CheckItem[];
}

const ResultPanel: React.FC<ResultPanelProps> = ({ isCalculating, results }) => {
  const getStatusIcon = (result: 'OK' | 'NG' | 'PENDING') => {
    switch (result) {
      case 'OK':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'NG':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'PENDING':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = (result: 'OK' | 'NG' | 'PENDING') => {
    switch (result) {
      case 'OK':
        return 'text-green-700 bg-green-50';
      case 'NG':
        return 'text-red-700 bg-red-50';
      case 'PENDING':
        return 'text-yellow-700 bg-yellow-50';
    }
  };

  return (
    <div className="space-y-4">
      <div className="px-6 py-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <FileBarChart className="h-6 w-6 text-gray-600" />
            <h2 className="text-2xl font-bold text-gray-900">검토 결과</h2>
          </div>
          <p className="text-sm text-gray-600">내진성능평가 계산 결과 및 기준 적합성을 확인하세요.</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {isCalculating ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">계산 중...</span>
            </div>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Run 버튼을 클릭하여 내진성능평가를 시작하세요.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(item.result)}
                      <span className="font-medium text-gray-800">{item.category}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusText(item.result)}`}>
                        {item.result}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{item.description}</p>
                    {item.value && item.criteria && (
                      <div className="text-sm text-gray-500">
                        <span>계산값: {item.value}</span>
                        <span className="mx-2">|</span>
                        <span>기준값: {item.criteria}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultPanel;