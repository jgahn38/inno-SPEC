import React, { useState } from 'react';
import { Plus, Building2, Calendar, MoreVertical, Edit, Trash2, Filter, Search } from 'lucide-react';
import { Project } from '../types';

interface ProjectListProps {
  projects: Project[];
  onProjectSelect: (project: Project) => void;
  onProjectCreate: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onProjectDelete: (projectId: string) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ 
  projects, 
  onProjectSelect, 
  onProjectCreate,
  onProjectDelete 
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    status: 'draft' as const
  });

  const handleCreateProject = () => {
    if (newProject.name.trim()) {
      onProjectCreate({
        ...newProject,
        bridges: []
      });
      setNewProject({ name: '', description: '', status: 'draft' });
      setShowCreateModal(false);
    }
  };

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return '진행중';
      case 'completed':
        return '완료';
      case 'draft':
        return '초안';
      default:
        return '초안';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
        <span>프로젝트</span>
        <span>/</span>
        <span className="text-gray-900">모든 프로젝트</span>
      </div>
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">프로젝트</h1>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-3 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
            <Filter className="h-4 w-4" />
            <span>필터</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>프로젝트 만들기</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer group"
            onClick={() => onProjectSelect(project)}
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors text-sm">
                      {project.name}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onProjectDelete(project.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              
              <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                {project.description || '설명이 없습니다.'}
              </p>
              
              <div className="flex items-center justify-between">
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
                  {getStatusText(project.status)}
                </span>
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>{new Date(project.createdAt).toLocaleDateString('ko-KR')}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 프로젝트 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-4">프로젝트 만들기</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  프로젝트명 *
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="프로젝트명을 입력하세요"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  설명
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  rows={3}
                  placeholder="프로젝트 설명을 입력하세요"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProject.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                만들기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectList;