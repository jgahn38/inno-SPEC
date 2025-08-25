import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Variable, Code, Play, Copy, Download, Upload, Calculator, Search, GripVertical } from 'lucide-react';

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

interface VariableDefinition {
  id: string;
  name: string;
  description: string;
  type: 'number' | 'string' | 'boolean';
  unit?: string;
  defaultValue?: any;
  category: 'input' | 'output' | 'intermediate' | 'constant';
  scope: 'global' | 'project' | 'bridge';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const FunctionsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'functions' | 'variables'>('functions');
  const [functions, setFunctions] = useState<FunctionDefinition[]>([]);
  const [variables, setVariables] = useState<VariableDefinition[]>([]);
  const [showFunctionModal, setShowFunctionModal] = useState(false);
  const [showVariableModal, setShowVariableModal] = useState(false);
  const [editingFunction, setEditingFunction] = useState<FunctionDefinition | null>(null);
  const [editingVariable, setEditingVariable] = useState<VariableDefinition | null>(null);
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

  // 새 변수 폼 상태
  const [newVariable, setNewVariable] = useState<Partial<VariableDefinition>>({
    name: '',
    description: '',
    type: 'number',
    category: 'input',
    scope: 'global',
    tags: []
  });

  useEffect(() => {
    loadSampleData();
  }, []);

  const loadSampleData = () => {
    // 샘플 함수 데이터
    const sampleFunctions: FunctionDefinition[] = [
      {
        id: 'func-1',
        name: 'calculateMomentCapacity',
        description: '콘크리트 단면의 휨강도 계산',
        category: 'structural',
        parameters: [
          { name: 'fc', type: 'number', description: '콘크리트 압축강도', unit: 'MPa' },
          { name: 'b', type: 'number', description: '단면 폭', unit: 'mm' },
          { name: 'd', type: 'number', description: '유효높이', unit: 'mm' },
          { name: 'As', type: 'number', description: '철근 단면적', unit: 'mm²' },
          { name: 'fy', type: 'number', description: '철근 항복강도', unit: 'MPa' }
        ],
        expression: 'min(0.85 * fc * b * d * (d - 0.5 * d), As * fy * (d - 0.5 * d))',
        returnType: 'number',
        returnUnit: 'N·mm',
        examples: [
          'calculateMomentCapacity(30, 300, 500, 1500, 400)',
          'calculateMomentCapacity(fc, b, d, As, fy)'
        ],
        tags: ['휨강도', '콘크리트', '철근'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'func-2',
        name: 'calculateShearCapacity',
        description: '콘크리트 단면의 전단강도 계산',
        category: 'structural',
        parameters: [
          { name: 'fc', type: 'number', description: '콘크리트 압축강도', unit: 'MPa' },
          { name: 'b', type: 'number', description: '단면 폭', unit: 'mm' },
          { name: 'd', type: 'number', description: '유효높이', unit: 'mm' }
        ],
        expression: '0.17 * sqrt(fc) * b * d',
        returnType: 'number',
        returnUnit: 'N',
        examples: [
          'calculateShearCapacity(30, 300, 500)',
          'calculateShearCapacity(fc, b, d)'
        ],
        tags: ['전단강도', '콘크리트'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // 샘플 변수 데이터
    const sampleVariables: VariableDefinition[] = [
      {
        id: 'var-1',
        name: 'concreteStrength',
        description: '콘크리트 설계기준압축강도',
        type: 'number',
        unit: 'MPa',
        defaultValue: 30,
        category: 'input',
        scope: 'global',
        tags: ['콘크리트', '강도'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'var-2',
        name: 'steelStrength',
        description: '철근 항복강도',
        type: 'number',
        unit: 'MPa',
        defaultValue: 400,
        category: 'input',
        scope: 'global',
        tags: ['철근', '강도'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    setFunctions(sampleFunctions);
    setVariables(sampleVariables);
  };

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

  const handleAddVariable = () => {
    if (!newVariable.name || !newVariable.type) {
      alert('변수명과 타입은 필수 입력 항목입니다.');
      return;
    }

    const variableDef: VariableDefinition = {
      ...newVariable,
      id: `var-${Date.now()}`,
      tags: newVariable.tags || [],
      createdAt: new Date(),
      updatedAt: new Date()
    } as VariableDefinition;

    setVariables([...variables, variableDef]);
    resetVariableForm();
    setShowVariableModal(false);
  };

  const handleEditVariable = (variable: VariableDefinition) => {
    setEditingVariable(variable);
    setNewVariable(variable);
    setShowVariableModal(true);
  };

  const handleUpdateVariable = () => {
    if (!editingVariable || !newVariable.name || !newVariable.type) {
      alert('변수명과 타입은 필수 입력 항목입니다.');
      return;
    }

    const updatedVariables = variables.map(v => 
      v.id === editingVariable.id 
        ? { ...v, ...newVariable, updatedAt: new Date() }
        : v
    );
    
    setVariables(updatedVariables);
    resetVariableForm();
    setEditingVariable(null);
    setShowVariableModal(false);
  };

  const handleDeleteVariable = (variableId: string) => {
    if (confirm('정말로 이 변수를 삭제하시겠습니까?')) {
      setVariables(variables.filter(v => v.id !== variableId));
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

  const resetVariableForm = () => {
    setNewVariable({
      name: '',
      description: '',
      type: 'number',
      category: 'input',
      scope: 'global',
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

  const getVariableCategoryLabel = (category: string) => {
    switch (category) {
      case 'input': return '입력';
      case 'output': return '출력';
      case 'intermediate': return '중간';
      case 'constant': return '상수';
      default: return category;
    }
  };

  const getScopeLabel = (scope: string) => {
    switch (scope) {
      case 'global': return '전역';
      case 'project': return '프로젝트';
      case 'bridge': return '교량';
      default: return scope;
    }
  };

  const filteredFunctions = functions.filter(func => 
    (selectedCategory === 'all' || func.category === selectedCategory) &&
    (searchTerm === '' || 
     func.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     func.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
     func.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const filteredVariables = variables.filter(variable => 
    (selectedCategory === 'all' || variable.category === selectedCategory) &&
    (searchTerm === '' || 
     variable.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     variable.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
     variable.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) return;

    if (activeTab === 'functions') {
      const draggedIndex = functions.findIndex(f => f.id === draggedItem);
      const targetIndex = functions.findIndex(f => f.id === targetId);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newFunctions = [...functions];
        const [draggedFunction] = newFunctions.splice(draggedIndex, 1);
        newFunctions.splice(targetIndex, 0, draggedFunction);
        
        setFunctions(newFunctions);
        // 순서 변경을 로컬 상태에 저장 (실제 서비스 연동 시 여기에 저장 로직 추가)
      }
    } else if (activeTab === 'variables') {
      const draggedIndex = variables.findIndex(v => v.id === draggedItem);
      const targetIndex = variables.findIndex(v => v.id === targetId);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newVariables = [...variables];
        const [draggedVariable] = newVariables.splice(draggedIndex, 1);
        newVariables.splice(targetIndex, 0, draggedVariable);
        
        setVariables(newVariables);
        // 순서 변경을 로컬 상태에 저장 (실제 서비스 연동 시 여기에 저장 로직 추가)
      }
    }
    
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">함수 관리</h1>
          <p className="text-gray-600">
            내진성능평가에 필요한 함수와 변수를 정의하고 관리하세요. 
            모든 프로젝트에서 공통으로 사용할 수 있습니다.
          </p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('functions')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'functions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                                 <Calculator className="inline-block w-4 h-4 mr-2" />
                 함수 정의
              </button>
              <button
                onClick={() => setActiveTab('variables')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'variables'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Variable className="inline-block w-4 h-4 mr-2" />
                변수 정의
              </button>
            </nav>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="함수명, 설명, 태그로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">모든 카테고리</option>
              <option value="structural">구조</option>
              <option value="material">재료</option>
              <option value="load">하중</option>
              <option value="analysis">해석</option>
              <option value="custom">사용자정의</option>
            </select>
            <button
              onClick={() => activeTab === 'functions' ? setShowFunctionModal(true) : setShowVariableModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>{activeTab === 'functions' ? '함수 추가' : '변수 추가'}</span>
            </button>
          </div>
        </div>

        {/* 함수 탭 */}
        {activeTab === 'functions' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10"></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">함수명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    설명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">카테고리</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">매개변수</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">반환값</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    
                  </th>
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
                        // TODO: 실제 서비스가 있다면 여기서 순서를 저장
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
        )}

        {/* 변수 탭 */}
        {activeTab === 'variables' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10"></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">변수명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">설명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">타입</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">카테고리</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">범위</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVariables.map((variable, index) => (
                  <tr
                    key={variable.id}
                    className={`hover:bg-gray-50 cursor-pointer ${draggedItem === variable.id ? 'opacity-50' : ''}`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', variable.id);
                      setDraggedItem(variable.id);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const draggedVariableId = e.dataTransfer.getData('text/plain');
                      const draggedIndex = variables.findIndex(v => v.id === draggedVariableId);
                      const dropIndex = index;
                      
                      if (draggedIndex !== -1 && draggedIndex !== dropIndex) {
                        const newOrder = [...variables];
                        const [draggedItem] = newOrder.splice(draggedIndex, 1);
                        newOrder.splice(dropIndex, 0, draggedItem);
                        setVariables(newOrder);
                        // TODO: 실제 서비스가 있다면 여기서 순서를 저장
                      }
                      setDraggedItem(null);
                    }}
                    onDragEnd={() => setDraggedItem(null)}
                    onClick={() => handleEditVariable(variable)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-move">
                      <GripVertical className="h-4 w-4" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {variable.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {variable.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {variable.type} {variable.unit && `(${variable.unit})`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {getVariableCategoryLabel(variable.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {getScopeLabel(variable.scope)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium w-20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteVariable(variable.id);
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
        )}

        {/* 함수 추가/수정 모달 */}
        {showFunctionModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingFunction ? '함수 수정' : '함수 추가'}
                </h3>
                
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowFunctionModal(false);
                      resetFunctionForm();
                      setEditingFunction(null);
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <button
                    onClick={editingFunction ? handleUpdateFunction : handleAddFunction}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 변수 추가/수정 모달 */}
        {showVariableModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingVariable ? '변수 수정' : '변수 추가'}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">변수명 *</label>
                    <input
                      type="text"
                      value={newVariable.name}
                      onChange={(e) => setNewVariable({ ...newVariable, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="변수명을 입력하세요"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                    <textarea
                      value={newVariable.description}
                      onChange={(e) => setNewVariable({ ...newVariable, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="변수에 대한 설명을 입력하세요"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">타입 *</label>
                      <select
                        value={newVariable.type}
                        onChange={(e) => setNewVariable({ ...newVariable, type: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="number">숫자</option>
                        <option value="string">문자열</option>
                        <option value="boolean">불린</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">단위</label>
                      <input
                        type="text"
                        value={newVariable.unit || ''}
                        onChange={(e) => setNewVariable({ ...newVariable, unit: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="단위 (예: MPa, mm)"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                      <select
                        value={newVariable.category}
                        onChange={(e) => setNewVariable({ ...newVariable, category: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="input">입력</option>
                        <option value="output">출력</option>
                        <option value="intermediate">중간</option>
                        <option value="constant">상수</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">범위</label>
                      <select
                        value={newVariable.scope}
                        onChange={(e) => setNewVariable({ ...newVariable, scope: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="global">전역</option>
                        <option value="project">프로젝트</option>
                        <option value="bridge">교량</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">기본값</label>
                    <input
                      type="text"
                      value={newVariable.defaultValue || ''}
                      onChange={(e) => setNewVariable({ ...newVariable, defaultValue: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="기본값을 입력하세요"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">태그</label>
                    <input
                      type="text"
                      value={newVariable.tags?.join(', ') || ''}
                      onChange={(e) => setNewVariable({ ...newVariable, tags: e.target.value.split(',').map(t => t.trim()) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="태그를 쉼표로 구분하여 입력하세요"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowVariableModal(false);
                      resetVariableForm();
                      setEditingVariable(null);
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <button
                    onClick={editingVariable ? handleUpdateVariable : handleAddVariable}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FunctionsManager;
