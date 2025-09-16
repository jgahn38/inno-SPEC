import React, { useState, useEffect } from 'react';
import { Plus, Building2, Calendar, Trash2, Filter } from 'lucide-react';
import { Project, CreateProjectRequest } from '@inno-spec/shared';
import { projectService } from '../services';

interface ProjectListProps {
  onProjectSelect: (project: Project) => void;
  tenantId: string;
}

const ProjectList: React.FC<ProjectListProps> = ({ onProjectSelect }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({
    id: '',
    name: '',
    description: '',
    category: 'general'
  });

  // 프로젝트 목록 로드
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const projectsData = await projectService.getAllProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    console.log('handleCreateProject called with:', newProject);
    
    if (newProject.id.trim() && newProject.name.trim() && newProject.description.trim()) {
      try {
        console.log('Creating project request...');
        const createRequest: CreateProjectRequest = {
          id: newProject.id.trim(),
          name: newProject.name.trim(),
          description: newProject.description.trim(),
          category: newProject.category
        };
        
        console.log('Calling projectService.createProject...');
        const createdProject = await projectService.createProject(createRequest);
        console.log('Project created successfully:', createdProject);
        
        // 프로젝트 목록 새로고침
        console.log('Refreshing project list...');
        await loadProjects();
        
        // 모달 닫기 및 폼 초기화
        setNewProject({ id: '', name: '', description: '', category: 'general' });
        setShowCreateModal(false);
        
        // 새로 생성된 프로젝트 선택
        console.log('Selecting created project...');
        onProjectSelect(createdProject);
      } catch (error) {
        console.error('Failed to create project:', error);
        const errorMessage = error instanceof Error ? error.message : '프로젝트 생성에 실패했습니다.';
        alert(errorMessage);
      }
    } else {
      console.log('Validation failed:', { id: newProject.id.trim(), name: newProject.name.trim(), description: newProject.description.trim() });
      alert('프로젝트 ID, 프로젝트명, 설명을 모두 입력해주세요.');
    }
  };

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-yellow-100 text-yellow-800';
      case 'deleted':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return '활성';
      case 'archived':
        return '보관';
      case 'deleted':
        return '삭제됨';
      default:
        return '알 수 없음';
    }
  };

  // 프로젝트 삭제 기능
  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (window.confirm(`정말로 프로젝트 "${projectName}"을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      try {
        await projectService.deleteProject(projectId);
        await loadProjects();
        alert('프로젝트가 삭제되었습니다.');
      } catch (error) {
        console.error('Failed to delete project:', error);
        alert('프로젝트 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">프로젝트</h1>
              <p className="text-gray-600">
                내진성능평가 프로젝트를 생성하고 관리하세요. 
                각 프로젝트는 독립적인 교량 데이터와 분석 결과를 가집니다.
              </p>
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
                <span>프로젝트 추가</span>
              </button>
            </div>
          </div>
        </div>

        {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">프로젝트를 로딩 중...</p>
          </div>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">프로젝트가 없습니다</h3>
          <p className="text-gray-600 mb-4">새로운 프로젝트를 만들어보세요.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>프로젝트 추가</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {projects.map((project) => (
          <div
            key={project.id}
            className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer group relative"
            onClick={() => onProjectSelect(project)}
          >
            {/* 삭제 버튼 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteProject(project.id, project.name);
              }}
              className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white rounded-full shadow-sm hover:shadow-md z-10"
              title="프로젝트 삭제"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            
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
                    <p className="text-xs text-gray-500 mt-1">
                      ID: {project.id}
                    </p>
                  </div>
                </div>
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
      )}

      {/* 프로젝트 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-4">프로젝트 추가</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  프로젝트 ID *
                </label>
                <input
                  type="text"
                  value={newProject.id}
                  onChange={(e) => setNewProject({ ...newProject, id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="프로젝트 ID를 입력하세요 (예: project-001)"
                />
              </div>
              
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  카테고리
                </label>
                <select
                  value={newProject.category}
                  onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="general">일반</option>
                  <option value="bridge">교량</option>
                  <option value="building">건물</option>
                  <option value="infrastructure">인프라</option>
                  <option value="research">연구</option>
                </select>
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
                disabled={!newProject.id.trim() || !newProject.name.trim()}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>추가</span>
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ProjectList;