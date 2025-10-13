import React, { useState, useEffect } from 'react';
import { Plus, Save, X, Search, GripVertical } from 'lucide-react';
import { PageLayout } from '@inno-spec/ui-lib';

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

const ProjectCategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProjectCategory | null>(null);
  const [draggedItem, setDraggedItem] = useState<ProjectCategory | null>(null);
  const [draggedOverItem, setDraggedOverItem] = useState<ProjectCategory | null>(null);
  
  const [formData, setFormData] = useState<Partial<ProjectCategory>>({
    name: '',
    displayName: '',
    description: '',
    color: '#3B82F6',
    icon: 'Folder',
    order: 0,
    isActive: true
  });

  // 로컬 스토리지에서 카테고리 로드
  useEffect(() => {
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
      setCategories(parsedCategories);
    }
  };

  const saveCategories = (newCategories: ProjectCategory[]) => {
    localStorage.setItem('project-categories', JSON.stringify(newCategories));
    setCategories(newCategories);
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      displayName: '',
      description: '',
      color: '#3B82F6',
      icon: 'Folder',
      order: categories.length + 1,
      isActive: true
    });
    setShowModal(true);
  };

  const handleEditCategory = (category: ProjectCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      displayName: category.displayName,
      description: category.description,
      color: category.color,
      icon: category.icon,
      order: category.order,
      isActive: category.isActive
    });
    setShowModal(true);
  };

  const handleSaveCategory = () => {
    if (!formData.name || !formData.displayName) {
      alert('카테고리 이름과 표시명을 입력해주세요.');
      return;
    }

    const now = new Date();

    if (editingCategory) {
      // 기존 카테고리 수정
      const updatedCategories = categories.map(cat =>
        cat.id === editingCategory.id
          ? {
              ...cat,
              ...formData,
              updatedAt: now
            } as ProjectCategory
          : cat
      );
      saveCategories(updatedCategories);
    } else {
      // 새 카테고리 추가
      const newCategory: ProjectCategory = {
        id: `cat-${Date.now()}`,
        name: formData.name!,
        displayName: formData.displayName!,
        description: formData.description || '',
        color: formData.color || '#3B82F6',
        icon: formData.icon || 'Folder',
        order: formData.order || categories.length + 1,
        isActive: formData.isActive !== undefined ? formData.isActive : true,
        createdAt: now,
        updatedAt: now
      };
      saveCategories([...categories, newCategory]);
    }

    setShowModal(false);
    setFormData({
      name: '',
      displayName: '',
      description: '',
      color: '#3B82F6',
      icon: 'Folder',
      order: 0,
      isActive: true
    });
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (window.confirm('이 카테고리를 삭제하시겠습니까?')) {
      const updatedCategories = categories.filter(cat => cat.id !== categoryId);
      saveCategories(updatedCategories);
    }
  };

  const handleToggleActive = (categoryId: string) => {
    const updatedCategories = categories.map(cat =>
      cat.id === categoryId
        ? { ...cat, isActive: !cat.isActive, updatedAt: new Date() }
        : cat
    );
    saveCategories(updatedCategories);
  };

  // 드래그 앤 드롭 핸들러
  const handleDragStart = (e: React.DragEvent, category: ProjectCategory) => {
    setDraggedItem(category);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', category.id);
  };

  const handleDragOver = (e: React.DragEvent, category: ProjectCategory) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverItem(category);
  };

  const handleDragLeave = () => {
    setDraggedOverItem(null);
  };

  const handleDrop = (e: React.DragEvent, targetCategory: ProjectCategory) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.id === targetCategory.id) {
      setDraggedItem(null);
      setDraggedOverItem(null);
      return;
    }

    // 카테고리 순서 재정렬
    const sortedCategories = [...categories].sort((a, b) => a.order - b.order);
    const draggedIndex = sortedCategories.findIndex(cat => cat.id === draggedItem.id);
    const targetIndex = sortedCategories.findIndex(cat => cat.id === targetCategory.id);

    // 배열에서 드래그된 아이템 제거
    const [removedItem] = sortedCategories.splice(draggedIndex, 1);
    // 타겟 위치에 삽입
    sortedCategories.splice(targetIndex, 0, removedItem);

    // 새로운 순서로 order 값 업데이트 (1부터 시작)
    const updatedCategories = sortedCategories.map((cat, index) => ({
      ...cat,
      order: index + 1,
      updatedAt: new Date()
    }));

    saveCategories(updatedCategories);
    setDraggedItem(null);
    setDraggedOverItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDraggedOverItem(null);
  };

  // 검색 필터링
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageLayout
      title="카테고리 관리"
      description="프로젝트 카테고리를 관리합니다."
      actions={
        <button
          onClick={handleAddCategory}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          카테고리 추가
        </button>
      }
    >
      {/* 검색 */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="카테고리 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 카테고리 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10"></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                순서
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                색상
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                카테고리명
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                표시명
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                설명
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  {searchTerm ? '검색 결과가 없습니다.' : '등록된 카테고리가 없습니다.'}
                </td>
              </tr>
            ) : (
              filteredCategories
                .sort((a, b) => a.order - b.order)
                .map((category) => (
                  <tr 
                    key={category.id} 
                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                      draggedItem?.id === category.id ? 'opacity-50' : ''
                    } ${
                      draggedOverItem?.id === category.id ? 'bg-blue-50 border-t-2 border-b-2 border-blue-300' : ''
                    }`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, category)}
                    onDragOver={(e) => handleDragOver(e, category)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, category)}
                    onDragEnd={handleDragEnd}
                    onClick={() => handleEditCategory(category)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        <GripVertical 
                          className="h-4 w-4 text-gray-400 cursor-move hover:text-gray-600" 
                          onMouseDown={(e) => e.stopPropagation()}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {category.order}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className="w-8 h-8 rounded"
                        style={{ backgroundColor: category.color }}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {category.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {category.displayName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {category.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleActive(category.id);
                        }}
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          category.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {category.isActive ? '활성' : '비활성'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium w-20">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCategory(category.id);
                          }}
                          className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
          )}
        </tbody>
      </table>
      </div>

      {/* 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCategory ? '카테고리 수정' : '새 카테고리'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  카테고리명 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: project-type-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  표시명 *
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 건축 프로젝트"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="카테고리 설명을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  색상
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  활성화
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSaveCategory}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default ProjectCategoryManager;

