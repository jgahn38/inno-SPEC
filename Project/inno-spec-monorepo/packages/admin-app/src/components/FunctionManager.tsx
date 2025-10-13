import React, { useState } from 'react';
import { PageLayout, Modal } from '@inno-spec/ui-lib';
import { Plus, Save, X, Search, GripVertical } from 'lucide-react';

interface FunctionDefinition {
  id: string;
  name: string;
  description: string;
  category: 'structural' | 'material' | 'load' | 'analysis' | 'custom';
  parameters: Array<{
    name: string;
    type: 'number' | 'string' | 'boolean';
    description: string;
    defaultValue?: any;
    unit?: string;
  }>;
  expression: string;
  returnType: 'number' | 'string' | 'boolean';
  returnUnit?: string;
  examples: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const FunctionManager: React.FC = () => {
  const [functions, setFunctions] = useState<FunctionDefinition[]>([]);
  const [showFunctionModal, setShowFunctionModal] = useState(false);
  const [editingFunction, setEditingFunction] = useState<FunctionDefinition | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  // 새 함수 폼 상태
  const [newFunction, setNewFunction] = useState<Partial<FunctionDefinition>>({
    name: '',
    description: '',
    category: 'structural',
    parameters: [],
    expression: '',
    returnType: 'number',
    examples: [],
    tags: []
  });

  const handleAddFunction = () => {
    if (!newFunction.name || !newFunction.expression) {
      alert('함수명과 수식은 필수 입력 항목입니다.');
      return;
    }

    const functionDef: FunctionDefinition = {
      ...newFunction,
      id: `func-${Date.now()}`,
      parameters: newFunction.parameters || [],
      examples: newFunction.examples || [],
      tags: newFunction.tags || [],
      createdAt: new Date(),
      updatedAt: new Date()
    } as FunctionDefinition;

    setFunctions([...functions, functionDef]);
    resetFunctionForm();
    setShowFunctionModal(false);
  };

  const handleEditFunction = (func: FunctionDefinition) => {
    setEditingFunction(func);
    setNewFunction(func);
    setShowFunctionModal(true);
  };

  const handleUpdateFunction = () => {
    if (!editingFunction || !newFunction.name || !newFunction.expression) {
      alert('함수명과 수식은 필수 입력 항목입니다.');
      return;
    }

    const updatedFunctions = functions.map(f => 
      f.id === editingFunction.id 
        ? { ...f, ...newFunction, updatedAt: new Date() }
        : f
    );
    
    setFunctions(updatedFunctions);
    resetFunctionForm();
    setEditingFunction(null);
    setShowFunctionModal(false);
  };

  const handleDeleteFunction = (funcId: string) => {
    if (confirm('정말로 이 함수를 삭제하시겠습니까?')) {
      setFunctions(functions.filter(f => f.id !== funcId));
    }
  };

  const resetFunctionForm = () => {
    setNewFunction({
      name: '',
      description: '',
      category: 'structural',
      parameters: [],
      expression: '',
      returnType: 'number',
      examples: [],
      tags: []
    });
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'structural': return '구조';
      case 'material': return '재료';
      case 'load': return '하중';
      case 'analysis': return '해석';
      case 'custom': return '사용자정의';
      default: return category;
    }
  };

  const filteredFunctions = functions.filter(func => 
    (selectedCategory === 'all' || func.category === selectedCategory) &&
    (searchTerm === '' || 
     func.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     func.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
     func.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
    <PageLayout
      title="함수 정의"
      description="내진성능평가에 필요한 함수를 정의하고 관리하세요. 모든 프로젝트에서 공통으로 사용할 수 있습니다."
      actions={
        <button
          onClick={() => setShowFunctionModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>함수 추가</span>
        </button>
      }
    >
      {/* 검색 및 필터 */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="함수명, 설명, 태그로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMS41TDYgNi41TDExIDEuNSIgc3Ryb2tlPSIjNkI3MjgwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==')] bg-[right_0.5rem_center] bg-no-repeat"
          >
            <option value="all">모든 카테고리</option>
            <option value="structural">구조</option>
            <option value="material">재료</option>
            <option value="load">하중</option>
            <option value="analysis">해석</option>
            <option value="custom">사용자정의</option>
          </select>
        </div>
      </div>

      {/* 함수 목록 */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10"></th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">함수명</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">설명</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">카테고리</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">매개변수</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">반환값</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFunctions.map((func, index) => (
                <tr
                  key={func.id}
                  className={`hover:bg-gray-50 cursor-pointer ${draggedItem === func.id ? 'opacity-50' : ''}`}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', func.id);
                    setDraggedItem(func.id);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const draggedFuncId = e.dataTransfer.getData('text/plain');
                    const draggedIndex = functions.findIndex(f => f.id === draggedFuncId);
                    const dropIndex = index;
                    
                    if (draggedIndex !== -1 && draggedIndex !== dropIndex) {
                      const newOrder = [...functions];
                      const [draggedItem] = newOrder.splice(draggedIndex, 1);
                      newOrder.splice(dropIndex, 0, draggedItem);
                      setFunctions(newOrder);
                    }
                    setDraggedItem(null);
                  }}
                  onDragEnd={() => setDraggedItem(null)}
                  onClick={() => handleEditFunction(func)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-move">
                    <GripVertical className="h-4 w-4" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {func.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {func.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getCategoryLabel(func.category)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {func.parameters.length}개
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {func.returnType} {func.returnUnit && `(${func.returnUnit})`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium w-20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFunction(func.id);
                      }}
                      className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 함수 추가/수정 모달 */}
        <Modal
          isOpen={showFunctionModal}
          onClose={() => {
            setShowFunctionModal(false);
            resetFunctionForm();
            setEditingFunction(null);
          }}
          title={editingFunction ? '함수 수정' : '함수 추가'}
          size="xl"
          footer={
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowFunctionModal(false);
                  resetFunctionForm();
                  setEditingFunction(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={editingFunction ? handleUpdateFunction : handleAddFunction}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>{editingFunction ? '저장' : '추가'}</span>
              </button>
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">함수명 *</label>
                    <input
                      type="text"
                      value={newFunction.name}
                      onChange={(e) => setNewFunction({ ...newFunction, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="함수명을 입력하세요"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                    <select
                      value={newFunction.category}
                      onChange={(e) => setNewFunction({ ...newFunction, category: e.target.value as any })}
                      className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMS41TDYgNi41TDExIDEuNSIgc3Ryb2tlPSIjNkI3MjgwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==')] bg-[right_0.5rem_center] bg-no-repeat"
                    >
                      <option value="structural">구조</option>
                      <option value="material">재료</option>
                      <option value="load">하중</option>
                      <option value="analysis">해석</option>
                      <option value="custom">사용자정의</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                    <textarea
                      value={newFunction.description}
                      onChange={(e) => setNewFunction({ ...newFunction, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="함수에 대한 설명을 입력하세요"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">반환 타입</label>
                    <select
                      value={newFunction.returnType}
                      onChange={(e) => setNewFunction({ ...newFunction, returnType: e.target.value as any })}
                      className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMS41TDYgNi41TDExIDEuNSIgc3Ryb2tlPSIjNkI3MjgwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==')] bg-[right_0.5rem_center] bg-no-repeat"
                    >
                      <option value="number">숫자</option>
                      <option value="string">문자열</option>
                      <option value="boolean">불린</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">반환 단위</label>
                    <input
                      type="text"
                      value={newFunction.returnUnit || ''}
                      onChange={(e) => setNewFunction({ ...newFunction, returnUnit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="단위 (예: MPa, mm, kN)"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">수식 *</label>
                    <textarea
                      value={newFunction.expression}
                      onChange={(e) => setNewFunction({ ...newFunction, expression: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      rows={3}
                      placeholder="수식을 입력하세요 (예: a + b * c)"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">태그</label>
                    <input
                      type="text"
                      value={newFunction.tags?.join(', ') || ''}
                      onChange={(e) => setNewFunction({ ...newFunction, tags: e.target.value.split(',').map(t => t.trim()) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="태그를 쉼표로 구분하여 입력하세요"
                    />
                  </div>
                </div>
        </Modal>
    </PageLayout>
  );
};

export default FunctionManager;
