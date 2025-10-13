import React, { useState, useEffect } from 'react';
import { PageLayout } from '@inno-spec/ui-lib';
import { Project } from '@inno-spec/shared';
import { ProjectService, LocalStorageProjectProvider } from '@inno-spec/shared';

interface ProjectCategory {
  id: string;
  name: string;
  displayName: string;
  description: string;
  color: string;
  icon: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ProjectListProps {
  onProjectSelect: (project: Project) => void;
  tenantId: string;
}

const ProjectList: React.FC<ProjectListProps> = ({ onProjectSelect, tenantId: _tenantId }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [newProject, setNewProject] = useState({
    id: '',
    name: '',
    description: '',
    category: ''
  });

  const projectService = new ProjectService(new LocalStorageProjectProvider());

  useEffect(() => {
    loadProjects();
    loadCategories();
  }, []);

  const loadCategories = () => {
    const stored = localStorage.getItem('project-categories');
    if (stored) {
      const parsedCategories = JSON.parse(stored).map((cat: any) => ({
        ...cat,
        createdAt: new Date(cat.createdAt),
        updatedAt: new Date(cat.updatedAt)
      }));
      // 활성화된 카테고리만 필터링하고 순서대로 정렬
      const activeCategories = parsedCategories
        .filter((cat: ProjectCategory) => cat.isActive)
        .sort((a: ProjectCategory, b: ProjectCategory) => a.order - b.order);
      setCategories(activeCategories);
    }
  };

  const loadProjects = async () => {
    try {
      setLoading(true);
      const allProjects = await projectService.getAllProjects();
      setProjects(allProjects);
    } catch (err) {
      setError('프로젝트를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.id.trim() || !newProject.name.trim() || !newProject.description.trim() || !newProject.category.trim()) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    try {
      const createdProject = await projectService.createProject({
        id: newProject.id.trim(),
        name: newProject.name.trim(),
        description: newProject.description.trim(),
        category: newProject.category
      });
      
      setProjects(prev => [...prev, createdProject]);
      setShowCreateModal(false);
      setNewProject({ id: '', name: '', description: '', category: '' });
    } catch (err) {
      console.error('프로젝트 생성 에러:', err);
      const errorMessage = err instanceof Error ? err.message : '프로젝트 생성에 실패했습니다.';
      alert(errorMessage);
    }
  };

  const getStatusBadgeClass = (status: Project['status']) => {
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

  const getCategoryInfo = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    return {
      displayName: category?.displayName || categoryName,
      color: category?.color || '#6B7280' // 기본 회색
    };
  };

  // 프로젝트 삭제 기능
  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (window.confirm(`정말로 프로젝트 "${projectName}"을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      try {
        await projectService.deleteProject(projectId);
        setProjects(prev => prev.filter(p => p.id !== projectId));
      } catch (err) {
        alert('프로젝트 삭제에 실패했습니다.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">프로젝트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">오류 발생</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadProjects}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <PageLayout
      title="프로젝트 목록"
      description={`총 ${projects.length}개의 프로젝트가 있습니다.`}
      actions={
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>새 프로젝트 생성</span>
        </button>
      }
    >

      {projects.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">프로젝트가 없습니다</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">새 프로젝트를 생성하여 시작하세요. 교량, 터널, 도로 등 다양한 인프라 프로젝트를 관리할 수 있습니다.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>첫 프로젝트 생성하기</span>
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
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 truncate pr-2">
                    {project.name}
                  </h3>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(project.status)}`}>
                      {getStatusText(project.status)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id, project.name);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50"
                      title="프로젝트 삭제"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-2 text-sm line-clamp-2">
                  {project.description}
                </p>
                
                <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                  <span 
                    className="px-2 py-1 rounded font-medium"
                    style={{ 
                      backgroundColor: `${getCategoryInfo(project.category).color}20`,
                      color: getCategoryInfo(project.category).color
                    }}
                  >
                    {getCategoryInfo(project.category).displayName}
                  </span>
                  <span className="flex items-center">
                    <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 프로젝트 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">새 프로젝트 생성</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  프로젝트 ID
                </label>
                <input
                  type="text"
                  value={newProject.id}
                  onChange={(e) => setNewProject(prev => ({ ...prev, id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: project-001"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  프로젝트 이름
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 서울대교 건설 프로젝트"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  프로젝트 설명
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="프로젝트에 대한 상세 설명을 입력하세요."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  카테고리
                </label>
                <select
                  value={newProject.category}
                  onChange={(e) => setNewProject(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">카테고리를 선택하세요</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.displayName}
                    </option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ 등록된 카테고리가 없습니다. 관리자 앱에서 카테고리를 먼저 생성해주세요.
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                취소
              </button>
              <button
                onClick={handleCreateProject}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                생성
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default ProjectList;