import React from 'react';
import { Project } from '@inno-spec/shared';

interface ProjectOverviewProps {
  project: Project | null;
}

const ProjectOverview: React.FC<ProjectOverviewProps> = ({ project }) => {
  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">프로젝트 개요</h2>
          <p className="text-gray-600">프로젝트를 선택하면 개요를 확인할 수 있습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
        <p className="text-gray-600">{project.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 프로젝트 기본 정보 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h3>
          <div className="space-y-4">
            <div>
              <span className="text-sm text-gray-500">프로젝트 ID</span>
              <p className="font-medium">{project.id}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">카테고리</span>
              <p className="font-medium">{project.category}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">상태</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                project.status === 'active' ? 'bg-green-100 text-green-800' :
                project.status === 'archived' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {project.status === 'active' ? '활성' :
                 project.status === 'archived' ? '보관' : '삭제됨'}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-500">생성일</span>
              <p className="font-medium">{new Date(project.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">최종 수정일</span>
              <p className="font-medium">{new Date(project.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* 교량 정보 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">교량 정보</h3>
          <div className="space-y-4">
            <div>
              <span className="text-sm text-gray-500">총 교량 수</span>
              <p className="font-medium text-2xl">{project.bridges?.length || 0}</p>
            </div>
            {project.bridges && project.bridges.length > 0 && (
              <div>
                <span className="text-sm text-gray-500">교량 목록</span>
                <div className="mt-2 space-y-2">
                  {project.bridges.map((bridge, index) => (
                    <div key={bridge.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">{bridge.name || `교량 ${index + 1}`}</span>
                      <span className="text-xs text-gray-500">{bridge.length}m</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 프로젝트 통계 */}
      <div className="mt-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">프로젝트 통계</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">75%</div>
              <div className="text-sm text-gray-500">완료율</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{project.bridges?.length || 0}</div>
              <div className="text-sm text-gray-500">교량 수</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">12</div>
              <div className="text-sm text-gray-500">작업 항목</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectOverview;
