import React, { useState, useEffect, useCallback } from 'react';
import { TableSchema, TableField, FieldType } from '../types';
import { TableSchemaService } from '../services/TableSchemaService';
import { Plus, Save, X, Columns, Search, Table, GripVertical } from 'lucide-react';

const TableManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tables' | 'fields'>('tables');
  const [schemas, setSchemas] = useState<TableSchema[]>([]);
  const [fields, setFields] = useState<TableField[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  
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
    type: 'text'
  });

  // 테이블 생성 시 필드 선택 상태
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>([]);

  const tableSchemaService = TableSchemaService.getInstance();

  const loadSchemas = useCallback(() => {
    const allSchemas = tableSchemaService.getAllSchemas();
      setSchemas(allSchemas);
  }, [tableSchemaService]);

  const loadFields = useCallback(() => {
    // 독립적으로 정의된 필드들을 로드
    const allFields = tableSchemaService.getAllFields();
    setFields(allFields);
  }, [tableSchemaService]);

  useEffect(() => {
    loadSchemas();
    loadFields();
  }, [loadSchemas, loadFields]);

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

    if (selectedFieldIds.length === 0) {
      alert('최소 하나 이상의 필드를 선택해주세요.');
      return;
    }

    // 선택된 필드들을 가져와서 테이블 스키마 생성
    const selectedFields = fields.filter(field => selectedFieldIds.includes(field.id));
    
    const tableSchema: TableSchema = {
      ...newTable,
      id: `table-${Date.now()}`,
      name: newTable.name!,
      displayName: newTable.displayName!,
      description: newTable.description || '',
      fields: selectedFields,
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
    // 편집 시 기존 필드들을 선택된 상태로 설정
    // schema.fields가 비어있을 수 있으므로 안전하게 처리
    const existingFieldIds = schema.fields && schema.fields.length > 0 
      ? schema.fields.map(f => f.id) 
      : [];
    setSelectedFieldIds(existingFieldIds);
    setShowTableModal(true);
  };

  const handleUpdateTable = () => {
    if (!editingSchema || !newTable.name || !newTable.displayName) {
      alert('테이블명과 표시명은 필수 입력 항목입니다.');
      return;
    }

    if (selectedFieldIds.length === 0) {
      alert('최소 하나 이상의 필드를 선택해주세요.');
      return;
    }

    // 선택된 필드들을 가져와서 테이블 스키마 업데이트
    const selectedFields = fields.filter(field => selectedFieldIds.includes(field.id));

    // 서비스를 통해 테이블 스키마 업데이트 및 저장
    tableSchemaService.updateSchema(editingSchema.id, {
      name: newTable.name!,
      displayName: newTable.displayName!,
      description: newTable.description || '',
      fields: selectedFields
    });

    // 로컬 상태 업데이트
    const updatedSchemas = schemas.map(s => 
      s.id === editingSchema.id ? { ...s, ...newTable, fields: selectedFields, updatedAt: new Date() } : s
    );
    setSchemas(updatedSchemas);
    
    // 폼 초기화 및 모달 닫기
    resetTableForm();
    setEditingSchema(null);
    setShowTableModal(false);
  };

  const handleDeleteTable = (schemaId: string) => {
    if (confirm('정말로 이 테이블을 삭제하시겠습니까?')) {
      // 서비스를 통해 테이블 삭제 및 저장
      tableSchemaService.deleteSchema(schemaId);
      
      // 로컬 상태 업데이트
      setSchemas(schemas.filter(s => s.id !== schemaId));
    }
  };

  const handleAddField = () => {
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
      type: newField.type || 'text'
    } as TableField;

    // 서비스를 통해 필드 추가 및 저장
    tableSchemaService.addField(field);
    
    // 로컬 상태 업데이트
    setFields([...fields, field]);
    
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
      type: field.type
    });
    setShowFieldModal(true);
  };

  const handleUpdateField = () => {
    if (!editingField || !newField.name || !newField.displayName) {
      alert('필드명과 표시명은 필수 입력 항목입니다.');
      return;
    }

    const updatedField: TableField = {
      ...editingField,
      name: newField.name!,
      displayName: newField.displayName!,
      description: newField.description || '',
      type: newField.type || 'text'
    };

    // 서비스를 통해 필드 업데이트 및 저장
    tableSchemaService.updateField(editingField.id, updatedField);

    // 독립적으로 정의된 필드 업데이트
    const updatedFields = fields.map(f => 
      f.id === editingField.id ? updatedField : f
    );
    setFields(updatedFields);

    // 이 필드를 사용하는 모든 테이블 스키마도 업데이트
    const updatedSchemas = schemas.map(schema => ({
      ...schema,
      fields: schema.fields.map(f => 
        f.id === editingField.id ? updatedField : f
      ),
        updatedAt: new Date()
    }));
    setSchemas(updatedSchemas);
    
    // 폼 초기화 및 모달 닫기
    resetFieldForm();
    setEditingField(null);
    setShowFieldModal(false);
  };

  const handleDeleteField = (fieldId: string) => {
    if (confirm('정말로 이 필드를 삭제하시겠습니까? 이 필드를 사용하는 테이블들도 영향을 받습니다.')) {
      // 서비스를 통해 필드 삭제 및 저장
      tableSchemaService.deleteField(fieldId);
      
      // 독립적으로 정의된 필드에서 삭제
      setFields(fields.filter(f => f.id !== fieldId));
      
      // 이 필드를 사용하는 모든 테이블 스키마에서도 제거
      const updatedSchemas = schemas.map(schema => ({
        ...schema,
        fields: schema.fields.filter(f => f.id !== fieldId),
        updatedAt: new Date()
      }));
      setSchemas(updatedSchemas);
    }
  };

  const resetTableForm = () => {
    setNewTable({
      name: '',
      displayName: '',
      description: '',
      fields: []
    });
    setSelectedFieldIds([]);
  };

  const resetFieldForm = () => {
    setNewField({
      name: '',
      displayName: '',
      description: '',
      type: 'text'
    });
  };

  const filteredSchemas = schemas.filter(schema => 
    (searchTerm === '' || 
     schema.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     schema.description?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredFields = fields.filter(field => 
    (searchTerm === '' || 
     field.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     field.description?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getTablesUsingField = (fieldId: string) => {
    return schemas.filter(schema => schema.fields.some(f => f.id === fieldId));
  };



  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">테이블 관리</h1>
          <p className="text-gray-600">
            내진성능평가에 필요한 필드를 먼저 정의하고, 이를 조합하여 테이블 스키마를 구성하세요. 
            모든 프로젝트에서 공통으로 사용할 수 있습니다.
          </p>
        </div>
        
        {/* 탭 네비게이션 */}
        <div className="border-b border-gray-200 mb-6">
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
        
        {/* 테이블 정의 탭 */}
        {activeTab === 'tables' && (
                         <div>
            {/* 테이블 검색 및 추가 */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                             <input
                               type="text"
                    placeholder="테이블 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                           </div>
              </div>
                             <button
                onClick={() => setShowTableModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                             >
                <Plus className="h-4 w-4" />
                <span>테이블 추가</span>
                             </button>
                           </div>

            {/* 테이블 목록 */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10"></th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">테이블명</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">표시명</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">설명</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">필드 수</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      
                               </th>
                             </tr>
                           </thead>
                           <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSchemas.map((schema) => (
                    <tr
                                  key={schema.id}
                                  draggable
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData('text/plain', schema.id);
                                    setDraggedItem(schema.id);
                                  }}
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    const draggedSchemaId = e.dataTransfer.getData('text/plain');
                                    const draggedIndex = schemas.findIndex(s => s.id === draggedSchemaId);
                                    const dropIndex = schemas.findIndex(s => s.id === schema.id);
                                    
                                    if (draggedIndex !== -1 && draggedIndex !== dropIndex) {
                                      const newSchemas = [...schemas];
                                      const [draggedItem] = newSchemas.splice(draggedIndex, 1);
                                      newSchemas.splice(dropIndex, 0, draggedItem);
                                      
                                      // 순서 속성 추가
                                      const updatedSchemas = newSchemas.map((schema, idx) => ({
                                        ...schema,
                                        order: idx
                                      }));
                                      
                                      setSchemas(updatedSchemas);
                                      
                                      // 서비스를 통해 각 스키마 업데이트
                                      updatedSchemas.forEach(schema => {
                                        tableSchemaService.updateSchema(schema.id, schema);
                                      });
                                    }
                                    setDraggedItem(null);
                                  }}
                                  onDragEnd={() => setDraggedItem(null)}
                                  className={`hover:bg-gray-50 cursor-pointer ${draggedItem === schema.id ? 'opacity-50' : ''}`}
                                  onClick={() => handleEditTable(schema)}
                                >
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-move">
                                    <GripVertical className="h-4 w-4" />
                                 </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {schema.name}
                                 </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {schema.displayName}
                                 </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {schema.description || '-'}
                                 </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {schema.fields?.length || 0}개
                                 </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium w-20">
                                   <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteTable(schema.id);
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
                  </div>
                )}

        {/* 필드 정의 탭 */}
        {activeTab === 'fields' && (
                <div>
            {/* 필드 검색 및 추가 */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex-1 max-w-md">
                  <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                    placeholder="필드 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                  <button
                onClick={() => setShowFieldModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>필드 추가</span>
                  </button>
              </div>
              
            {/* 필드 목록 */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10"></th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">필드명</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">표시명</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">타입</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">설명</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용 테이블</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                  {filteredFields.map((field) => (
                    <tr 
                      key={field.id} 
                      className={`hover:bg-gray-50 cursor-pointer ${draggedItem === field.id ? 'opacity-50' : ''}`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', field.id);
                        setDraggedItem(field.id);
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const draggedFieldId = e.dataTransfer.getData('text/plain');
                        const draggedIndex = fields.findIndex(f => f.id === draggedFieldId);
                        const dropIndex = fields.findIndex(f => f.id === field.id);
                        
                        if (draggedIndex !== -1 && draggedIndex !== dropIndex) {
                          const newOrder = [...fields];
                          const [draggedItem] = newOrder.splice(draggedIndex, 1);
                          newOrder.splice(dropIndex, 0, draggedItem);
                          
                          // 순서 속성 추가
                          const updatedFields = newOrder.map((field, idx) => ({
                            ...field,
                            order: idx
                          }));
                          
                          setFields(updatedFields);
                          
                          // 서비스를 통해 각 필드 업데이트
                          updatedFields.forEach(field => {
                            tableSchemaService.updateField(field.id, field);
                          });
                        }
                        setDraggedItem(null);
                      }}
                      onDragEnd={() => setDraggedItem(null)}
                      onClick={() => handleEditField(field)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <GripVertical className="h-4 w-4 cursor-move" />
                          </div>
                        </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{field.name}</div>
                        </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {field.displayName}
                        </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getFieldTypeLabel(field.type)}
                        </td>
                        <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">{field.description || '-'}</div>
                        </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getTablesUsingField(field.id).length}개
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium w-20">
                            <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteField(field.id);
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
          </div>
        )}

        {/* 테이블 추가/수정 모달 */}
        {showTableModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
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
            
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* 1열: 테이블 정보 */}
            <div className="space-y-6">
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
              
              <div>
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

                  {/* 2열: 필드 선택 및 순서 조정 */}
                  <div>
                    {fields.length > 0 ? (
                      <div className="space-y-4">
                        {/* 필드 선택 영역 - 콤보박스 방식 */}
                        <div>
                          <h5 className="block text-sm font-medium text-gray-700 mb-2">사용할 필드 추가</h5>
                          <div className="flex space-x-2">
                      <select
                              value=""
                              onChange={(e) => {
                                const fieldId = e.target.value;
                                if (fieldId) {
                                  setSelectedFieldIds([...selectedFieldIds, fieldId]);
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">사용할 필드를 선택하세요</option>
                              {fields
                                .filter(field => !selectedFieldIds.includes(field.id))
                                .map(field => (
                                  <option key={field.id} value={field.id}>
                                    {field.displayName} ({field.name})
                                  </option>
                                ))
                              }
                      </select>
                      </div>
                    </div>
                    
                        {/* 순서 조정 영역 */}
                        {selectedFieldIds.length > 0 && (
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <h5 className="block text-sm font-medium text-gray-700">선택된 필드 순서 조정</h5>
                      <button
                                onClick={() => setSelectedFieldIds([])}
                                className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded border border-red-200 hover:border-red-300 transition-colors"
                      >
                                모든 필드 제거
                      </button>
                            </div>
                            <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
                              {selectedFieldIds.map((fieldId, index) => {
                                const field = fields.find(f => f.id === fieldId);
                                if (!field) return null;
                                
                                return (
                                  <div
                                    key={fieldId}
                                    draggable
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData('text/plain', fieldId);
                                    }}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      const draggedFieldId = e.dataTransfer.getData('text/plain');
                                      const draggedIndex = selectedFieldIds.indexOf(draggedFieldId);
                                      const dropIndex = index;
                                      
                                      if (draggedIndex !== -1 && draggedIndex !== dropIndex) {
                                        const newOrder = [...selectedFieldIds];
                                        const [draggedItem] = newOrder.splice(draggedIndex, 1);
                                        newOrder.splice(dropIndex, 0, draggedItem);
                                        setSelectedFieldIds(newOrder);
                                      }
                                    }}
                                    className="flex items-center justify-between p-2 mb-2 bg-white rounded-md border shadow-sm cursor-move hover:bg-gray-50"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div className="flex items-center justify-center w-6">
                                        <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                    </div>
                                      <span className="text-sm font-medium text-gray-500 w-6 text-center">
                                        {index + 1}
                              </span>
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">{field.displayName}</div>
                                        <div className="text-xs text-gray-500">{field.name}</div>
                                      </div>
                                    </div>
                              <button
                                      onClick={() => {
                                        setSelectedFieldIds(selectedFieldIds.filter(id => id !== fieldId));
                                      }}
                                      className="text-gray-400 hover:text-red-500 p-1"
                                    >
                                      <X className="h-4 w-4" />
                              </button>
                                  </div>
                                );
                              })}
                            </div>
                  </div>
                )}
                      </div>
                    ) : (
                  <div className="text-center py-8 text-gray-500">
                        <p>등록된 필드가 없습니다.</p>
                        <p className="text-sm mt-1">먼저 필드를 등록해주세요.</p>
                  </div>
                )}
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
                    disabled={fields.length === 0}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
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
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
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
                
                <div className="grid grid-cols-1 gap-6">
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
                      <option value="date">날짜</option>
                      <option value="boolean">불린</option>
                      <option value="decimal">소수</option>
                      <option value="integer">정수</option>
                  </select>
                </div>
                
                <div>
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
