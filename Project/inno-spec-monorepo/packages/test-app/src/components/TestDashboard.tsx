import React from 'react';
import { PageLayout } from '@inno-spec/ui-lib';
import { Beaker, TestTube, Zap } from 'lucide-react';

const TestDashboard: React.FC = () => {
  return (
    <PageLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">테스트 대시보드</h1>
          <p className="text-gray-600">개발 테스트를 위한 대시보드입니다.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <Beaker className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">컴포넌트 테스트</h3>
                <p className="text-sm text-gray-500">UI 컴포넌트 테스트</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm">
              새로운 컴포넌트를 테스트하고 검증할 수 있습니다.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <TestTube className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">기능 테스트</h3>
                <p className="text-sm text-gray-500">기능 동작 테스트</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm">
              새로운 기능의 동작을 테스트할 수 있습니다.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">성능 테스트</h3>
                <p className="text-sm text-gray-500">성능 최적화 테스트</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm">
              성능 및 최적화를 테스트할 수 있습니다.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">테스트 영역</h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-700">
                여기에 다양한 테스트 컴포넌트와 기능을 추가할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default TestDashboard;

