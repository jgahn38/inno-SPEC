import React from 'react';

const IllustrationView: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">도면 관리</h1>
        <p className="text-gray-600">교량 도면 및 섹션 라이브러리를 관리합니다.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 도면 라이브러리 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">도면 라이브러리</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">📐</div>
                <div>
                  <h3 className="font-medium text-gray-900">기본 교량 도면</h3>
                  <p className="text-sm text-gray-500">표준 교량 설계 도면</p>
                </div>
              </div>
              <button className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600">
                열기
              </button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">🏗️</div>
                <div>
                  <h3 className="font-medium text-gray-900">커스텀 도면</h3>
                  <p className="text-sm text-gray-500">사용자 정의 도면</p>
                </div>
              </div>
              <button className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600">
                열기
              </button>
            </div>
          </div>
        </div>
        
        {/* 섹션 라이브러리 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">섹션 라이브러리</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">📏</div>
                <div>
                  <h3 className="font-medium text-gray-900">표준 섹션</h3>
                  <p className="text-sm text-gray-500">일반적인 교량 섹션</p>
                </div>
              </div>
              <button className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600">
                사용
              </button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">🔧</div>
                <div>
                  <h3 className="font-medium text-gray-900">커스텀 섹션</h3>
                  <p className="text-sm text-gray-500">사용자 정의 섹션</p>
                </div>
              </div>
              <button className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600">
                사용
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 도면 업로드 영역 */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">도면 업로드</h2>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">📁</div>
          <p className="text-gray-600 mb-4">도면 파일을 여기에 드래그하거나 클릭하여 업로드하세요</p>
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            파일 선택
          </button>
          <p className="text-sm text-gray-500 mt-2">지원 형식: DWG, DXF, PDF, PNG, JPG</p>
        </div>
      </div>
    </div>
  );
};

export default IllustrationView;
