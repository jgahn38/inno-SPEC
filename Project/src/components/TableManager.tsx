import React, { useState, useEffect } from 'react';
import { TableSchema, TableField, FieldType } from '../types';
import { TableSchemaService } from '../services/TableSchemaService';
import { Plus, Edit, Trash2, Save, X, Columns, Search, Table } from 'lucide-react';

interface TableManagerProps {
  tenantId: string;
  projectId: string;
}

const TableManager: React.FC<TableManagerProps> = ({ tenantId, projectId }) => {
  const [activeTab, setActiveTab] = useState<'tables' | 'fields'>('tables');
  const [schemas, setSchemas] = useState<TableSchema[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<TableSchema | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 모달 상태
  const [showTableModal, setShowTableModal] = useState(false);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingSchema, setEditingSchema] = useState<TableSchema | null>(null);
  const [editingField, setEditingField] = useState<TableField | null>(null);
  
  // 새 테이블 폼 상태
  const [newTable, setNewTable] = useState<Partial<TableSchema>>({
    name: '',
    displayName: '',
    description: '',
    fields: []
  });

  // 새 필드 폼 상태
  const [newField, setNewField] = useState<Partial<TableField>>({
    name: '',
    displayName: '',
    description: '',
    type: 'text',
    required: false
  });

  useEffect(() => {
    loadSchemas();
  }, []);

  const loadSchemas = () => {
    const allSchemas = TableSchemaService.getInstance().getAllSchemas();
    setSchemas(allSchemas);
    if (allSchemas.length > 0 && !selectedSchema) {
      setSelectedSchema(allSchemas[0]);
    }
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

  const getFieldTypeLabel = (type: FieldType) => {
    switch (type) {
      case 'text': return '텍스트';
      case 'number': return '숫자';
      case 'boolean': return '불린';
      case 'date': return '날짜';
      case 'decimal': return '소수';
      case 'integer': return '정수';
      default: return type;
    }
  };

  const handleAddTable = () => {
    if (!newTable.name || !newTable.displayName) {
      alert('테이블명과 표시명은 필수 입력 항목입니다.');
      return;
    }

    const tableSchema: TableSchema = {
      ...newTable,
      id: `table-${Date.now()}`,
      name: newTable.name!,
      displayName: newTable.displayName!,
      description: newTable.description || '',
      fields: newTable.fields || [],
      createdAt: new Date(),
      updatedAt: new Date()
    } as TableSchema;

    // 로컬 상태 업데이트
    setSchemas([...schemas, tableSchema]);
    
    // 폼 초기화 및 모달 닫기
    resetTableForm();
    setShowTableModal(false);
  };

  const handleEditTable = (schema: TableSchema) => {
    setEditingSchema(schema);
    setNewTable({
      name: schema.name,
      displayName: schema.displayName,
      description: schema.description,
      fields: schema.fields || []
    });
    setShowTableModal(true);
  };

  const handleUpdateTable = () => {
    if (!editingSchema || !newTable.name || !newTable.displayName) {
      alert('테이블명과 표시명은 필수 입력 항목입니다.');
      return;
    }

    const updatedSchema: TableSchema = {
      ...editingSchema,
      name: newTable.name!,
      displayName: newTable.displayName!,
      description: newTable.description || '',
      fields: newTable.fields || [],
      updatedAt: new Date()
    };

    // 로컬 상태 업데이트
    const updatedSchemas = schemas.map(s => 
      s.id === editingSchema.id ? updatedSchema : s
    );
    setSchemas(updatedSchemas);
    
    // 폼 초기화 및 모달 닫기
    resetTableForm();
    setEditingSchema(null);
    setShowTableModal(false);
  };

  const handleDeleteTable = (schemaId: string) => {
    if (confirm('정말로 이 테이블을 삭제하시겠습니까?')) {
      // 로컬 상태 업데이트
      setSchemas(schemas.filter(s => s.id !== schemaId));
    }
  };

  const handleAddField = () => {
    if (!selectedSchema) {
      alert('테이블을 먼저 선택해주세요.');
      return;
    }

    if (!newField.name || !newField.displayName) {
      alert('필드명과 표시명은 필수 입력 항목입니다.');
      return;
    }

    const field: TableField = {
      ...newField,
      id: `field-${Date.now()}`,
      name: newField.name!,
      displayName: newField.displayName!,
      description: newField.description || '',
      type: newField.type || 'text',
      required: newField.required || false
    } as TableField;

    // 선택된 스키마에 필드 추가
    const updatedSchema = {
      ...selectedSchema,
      fields: [...selectedSchema.fields, field],
      updatedAt: new Date()
    };

    // 로컬 상태 업데이트
    const updatedSchemas = schemas.map(s => 
      s.id === selectedSchema.id ? updatedSchema : s
    );
    setSchemas(updatedSchemas);
    setSelectedSchema(updatedSchema);
    
    // 폼 초기화 및 모달 닫기
    resetFieldForm();
    setShowFieldModal(false);
  };

  const handleEditField = (field: TableField) => {
    setEditingField(field);
    setNewField({
      name: field.name,
      displayName: field.displayName,
      description: field.description,
      type: field.type,
      required: field.required
    });
    setShowFieldModal(true);
  };

  const handleUpdateField = () => {
    if (!editingField || !selectedSchema || !newField.name || !newField.displayName) {
      alert('필드명과 표시명은 필수 입력 항목입니다.');
      return;
    }

    const updatedField: TableField = {
      ...editingField,
      name: newField.name!,
      displayName: newField.displayName!,
      description: newField.description || '',
      type: newField.type || 'text',
      required: newField.required || false
    };

    // 선택된 스키마의 필드 업데이트
    const updatedSchema = {
      ...selectedSchema,
      fields: selectedSchema.fields.map(f => 
        f.id === editingField.id ? updatedField : f
      ),
      updatedAt: new Date()
    };

    // 로컬 상태 업데이트
    const updatedSchemas = schemas.map(s => 
      s.id === selectedSchema.id ? updatedSchema : s
    );
    setSchemas(updatedSchemas);
    setSelectedSchema(updatedSchema);
    
    // 폼 초기화 및 모달 닫기
    resetFieldForm();
    setEditingField(null);
    setShowFieldModal(false);
  };

  const handleDeleteField = (fieldId: string) => {
    if (!selectedSchema) return;

    if (confirm('정말로 이 필드를 삭제하시겠습니까?')) {
      // 선택된 스키마에서 필드 삭제
      const updatedSchema = {
        ...selectedSchema,
        fields: selectedSchema.fields.filter(f => f.id !== fieldId),
        updatedAt: new Date()
      };

      // 로컬 상태 업데이트
      const updatedSchemas = schemas.map(s => 
        s.id === selectedSchema.id ? updatedSchema : s
      );
      setSchemas(updatedSchemas);
      setSelectedSchema(updatedSchema);
    }
  };

  const resetTableForm = () => {
    setNewTable({
      name: '',
      displayName: '',
      description: '',
      fields: []
    });
  };

  const resetFieldForm = () => {
    setNewField({
      name: '',
      displayName: '',
      description: '',
      type: 'text',
      required: false
    });
  };

  const filteredSchemas = schemas.filter(schema => 
    (searchTerm === '' || 
     schema.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     schema.description?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">테이블 관리</h1>
          <p className="text-gray-600">
            내진성능평가에 필요한 테이블 스키마와 필드를 정의하고 관리하세요. 
            모든 프로젝트에서 공통으로 사용할 수 있습니다.
          </p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('tables')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tables'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Table className="inline-block w-4 h-4 mr-2" />
                테이블 정의
              </button>
              <button
                onClick={() => setActiveTab('fields')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'fields'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Columns className="inline-block w-4 h-4 mr-2" />
                필드 정의
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
                placeholder="테이블명, 설명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowTableModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>테이블 추가</span>
            </button>
          </div>
        </div>

        {/* 테이블 탭 */}
        {activeTab === 'tables' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">테이블 스키마 목록</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">테이블명</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">설명</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">필드 수</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSchemas.length > 0 ? (
                    filteredSchemas.map((schema) => (
                      <tr key={schema.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{schema.displayName}</div>
                          <div className="text-sm text-gray-500">{schema.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {schema.description || '설명 없음'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {schema.fields.length}개
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditTable(schema)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTable(schema.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        {searchTerm ? '검색 결과가 없습니다.' : '테이블 스키마가 없습니다.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 필드 탭 */}
        {activeTab === 'fields' && (
          <div className="space-y-6">
            {/* 테이블 선택 */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">테이블 선택</h2>
                <button
                  onClick={() => setShowFieldModal(true)}
                  disabled={!selectedSchema}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                  <span>필드 추가</span>
                </button>
              </div>
              
              {schemas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {schemas.map((schema) => (
                    <div
                      key={schema.id}
                      onClick={() => setSelectedSchema(schema)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedSchema?.id === schema.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{schema.displayName}</div>
                      <div className="text-sm text-gray-500">{schema.name}</div>
                      <div className="text-sm text-gray-400 mt-1">{schema.fields.length}개 필드</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">테이블 스키마가 없습니다. 먼저 테이블을 추가해주세요.</p>
              )}
            </div>

            {/* 필드 목록 */}
            {selectedSchema && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedSchema.displayName} - 필드 목록
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">필드명</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">표시명</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">타입</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">필수</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">설명</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedSchema.fields.length > 0 ? (
                        selectedSchema.fields.map((field) => (
                          <tr key={field.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{field.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {field.displayName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {getFieldTypeLabel(field.type)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                field.required 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {field.required ? '필수' : '선택'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {field.description || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditField(field)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteField(field.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                            이 테이블에 필드가 없습니다. 필드를 추가해주세요.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 테이블 추가/수정 모달 */}
        {showTableModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingSchema ? '테이블 수정' : '테이블 추가'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowTableModal(false);
                      setEditingSchema(null);
                      resetTableForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">테이블명 (영문) *</label>
                    <input
                      type="text"
                      value={newTable.name}
                      onChange={(e) => setNewTable({ ...newTable, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="테이블명을 입력하세요 (영문)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">표시명 (한글) *</label>
                    <input
                      type="text"
                      value={newTable.displayName}
                      onChange={(e) => setNewTable({ ...newTable, displayName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="표시명을 입력하세요 (한글)"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                    <textarea
                      value={newTable.description}
                      onChange={(e) => setNewTable({ ...newTable, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="테이블에 대한 설명을 입력하세요"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowTableModal(false);
                      setEditingSchema(null);
                      resetTableForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={editingSchema ? handleUpdateTable : handleAddTable}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    <span>{editingSchema ? '수정' : '추가'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 필드 추가/수정 모달 */}
        {showFieldModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingField ? '필드 수정' : '필드 추가'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowFieldModal(false);
                      setEditingField(null);
                      resetFieldForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {selectedSchema && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>테이블:</strong> {selectedSchema.displayName} ({selectedSchema.name})
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">필드명 (영문) *</label>
                    <input
                      type="text"
                      value={newField.name}
                      onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="필드명을 입력하세요 (영문)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">표시명 (한글) *</label>
                    <input
                      type="text"
                      value={newField.displayName}
                      onChange={(e) => setNewField({ ...newField, displayName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="표시명을 입력하세요 (한글)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">데이터 타입</label>
                    <select
                      value={newField.type}
                      onChange={(e) => setNewField({ ...newField, type: e.target.value as FieldType })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="text">텍스트</option>
                      <option value="number">숫자</option>
                      <option value="boolean">불린</option>
                      <option value="date">날짜</option>
                      <option value="decimal">소수</option>
                      <option value="integer">정수</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">필수 여부</label>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newField.required}
                        onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">필수 입력 필드</label>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                    <textarea
                      value={newField.description}
                      onChange={(e) => setNewField({ ...newField, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="필드에 대한 설명을 입력하세요"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowFieldModal(false);
                      setEditingField(null);
                      resetFieldForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={editingField ? handleUpdateField : handleAddField}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    <span>{editingField ? '수정' : '추가'}</span>
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

export default TableManager;
