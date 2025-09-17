import React, { useState, useEffect, useCallback } from 'react';
import { TableField, FieldType, DatabaseCategory, BridgeDatabase } from '@inno-spec/shared';
import { TableSchemaService } from '../TableSchemaService';
import { DatabaseService } from '../DatabaseService';
import { Plus, Save, X, Columns, Search, GripVertical, FileSpreadsheet } from 'lucide-react';
import ExcelFieldImporter from './ExcelFieldImporter';

const FieldManager: React.FC = () => {
  const [fields, setFields] = useState<TableField[]>([]);
  const [schemas, setSchemas] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  
  // 모달 상태
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [showExcelImporter, setShowExcelImporter] = useState(false);
  const [editingField, setEditingField] = useState<TableField | null>(null);
  
  // 새 필드 폼 상태
  const [newField, setNewField] = useState<Partial<TableField>>({
    name: '',
    displayName: '',
    description: '',
    type: 'text',
    options: [],
    defaultValue: '',
    dbCategory: ''
  });

  const tableSchemaService = TableSchemaService.getInstance();
  const databaseService = DatabaseService.getInstance();
  
  // DB 관련 상태
  const [availableDatabases, setAvailableDatabases] = useState<BridgeDatabase[]>([]);
  const [filteredDatabases, setFilteredDatabases] = useState<BridgeDatabase[]>([]);

  const loadFields = useCallback(() => {
    // 독립적으로 정의된 필드들을 로드
    const allFields = tableSchemaService.getAllFields();
    setFields(allFields);
  }, [tableSchemaService]);

  const loadSchemas = useCallback(() => {
    const allSchemas = tableSchemaService.getAllSchemas();
    setSchemas(allSchemas);
  }, [tableSchemaService]);

  // DB 목록 로드
  const loadDatabases = useCallback(() => {
    const allDatabases = databaseService.getAllDatabases();
    setAvailableDatabases(allDatabases);
  }, [databaseService]);

  useEffect(() => {
    loadFields();
    loadSchemas();
    loadDatabases();
  }, [loadFields, loadSchemas, loadDatabases]);

  // DB 카테고리 변경 시 필터링
  const handleDbCategoryChange = (category: DatabaseCategory | '') => {
    if (category === '') {
      setFilteredDatabases(availableDatabases);
    } else {
      const filtered = availableDatabases.filter(db => db.category === category);
      setFilteredDatabases(filtered);
    }
  };

  // DB 카테고리 옵션 가져오기
  const getDbCategories = () => {
    return databaseService.getSupportedCategories();
  };

  const getFieldTypeLabel = (type: FieldType) => {
    switch (type) {
      case 'text': return '텍스트';
      case 'number': return '숫자';
      case 'boolean': return '불린';
      case 'date': return '날짜';
      case 'decimal': return '소수';
      case 'integer': return '정수';
      case 'list': return '목록';
      case 'db': return 'DB';
      default: return type;
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
      type: newField.type || 'text',
      options: newField.type === 'list' ? (newField.options || []) : undefined,
      defaultValue: newField.defaultValue,
      dbCategory: newField.type === 'db' ? newField.dbCategory : undefined
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
      type: field.type,
      options: field.options || [],
      defaultValue: field.defaultValue,
      dbCategory: field.dbCategory
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
      type: newField.type || 'text',
      options: newField.type === 'list' ? (newField.options || []) : undefined,
      defaultValue: newField.defaultValue,
      dbCategory: newField.type === 'db' ? newField.dbCategory : undefined
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

  // 엑셀에서 필드 일괄 등록
  const handleExcelImport = (importedFields: TableField[]) => {
    // 서비스를 통해 필드들 추가 및 저장
    importedFields.forEach(field => {
      tableSchemaService.addField(field);
    });
    
    // 로컬 상태 업데이트
    setFields([...fields, ...importedFields]);
    
    // 모달 닫기
    setShowExcelImporter(false);
  };

  const resetFieldForm = () => {
    setNewField({
      name: '',
      displayName: '',
      description: '',
      type: 'text',
      options: [],
      defaultValue: '',
      dbCategory: ''
    });
  };

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">필드 정의</h1>
          <p className="text-gray-600">
            내진성능평가에 필요한 필드를 먼저 정의하세요. 
            정의된 필드들은 테이블 스키마 구성 시 사용할 수 있습니다.
          </p>
        </div>
        
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
          <div className="flex space-x-2">
            <button
              onClick={() => setShowExcelImporter(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>엑셀 불러오기</span>
            </button>
            <button
              onClick={() => setShowFieldModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>필드 추가</span>
            </button>
          </div>
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
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20"></th>
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
                    <div>
                      {getFieldTypeLabel(field.type)}
                      {field.type === 'list' && field.options && field.options.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          옵션: {field.options.join(', ')}
                        </div>
                      )}
                      {field.type === 'db' && field.dbCategory && field.defaultValue && (
                        <div className="text-xs text-gray-500 mt-1">
                          DB: {availableDatabases.find(db => db.id === field.defaultValue)?.displayName || '알 수 없음'}
                        </div>
                      )}
                      {field.defaultValue !== undefined && field.defaultValue !== '' && (
                        <div className="text-xs text-blue-600 mt-1">
                          기본값: {field.defaultValue}
                        </div>
                      )}
                    </div>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">표시명 *</label>
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
                      onChange={(e) => setNewField({ ...newField, type: e.target.value as FieldType, options: e.target.value === 'list' ? [] : newField.options })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="text">텍스트</option>
                      <option value="number">숫자</option>
                      <option value="date">날짜</option>
                      <option value="boolean">불린</option>
                      <option value="decimal">소수</option>
                      <option value="integer">정수</option>
                      <option value="list">목록</option>
                      <option value="db">DB</option>
                    </select>
                  </div>
                  
                  {/* 목록 타입일 때 옵션 입력 */}
                  {newField.type === 'list' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">목록 옵션</label>
                      <div className="space-y-2">
                        {newField.options?.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...(newField.options || [])];
                                newOptions[index] = e.target.value;
                                setNewField({ ...newField, options: newOptions });
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder={`옵션 ${index + 1}`}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newOptions = newField.options?.filter((_, i) => i !== index) || [];
                                setNewField({ ...newField, options: newOptions });
                              }}
                              className="px-2 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const newOptions = [...(newField.options || []), ''];
                            setNewField({ ...newField, options: newOptions });
                          }}
                          className="flex items-center space-x-1 px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          <span>옵션 추가</span>
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        목록에서 선택할 수 있는 옵션들을 입력하세요.
                      </p>
                    </div>
                  )}

                  {/* DB 타입일 때 카테고리 선택 */}
                  {newField.type === 'db' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                      <select
                        value={newField.dbCategory || ''}
                        onChange={(e) => {
                          const category = e.target.value as DatabaseCategory | '';
                          setNewField({ ...newField, dbCategory: category, defaultValue: '' });
                          handleDbCategoryChange(category);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">카테고리를 선택하세요</option>
                        {getDbCategories().map(category => (
                          <option key={category.value} value={category.value}>
                            {category.label} - {category.description}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">기본값</label>
                    {newField.type === 'boolean' ? (
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="defaultValue"
                            value="true"
                            checked={newField.defaultValue === true}
                            onChange={() => setNewField({ ...newField, defaultValue: true })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">참</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="defaultValue"
                            value="false"
                            checked={newField.defaultValue === false}
                            onChange={() => setNewField({ ...newField, defaultValue: false })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">거짓</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="defaultValue"
                            value=""
                            checked={newField.defaultValue === undefined || newField.defaultValue === ''}
                            onChange={() => setNewField({ ...newField, defaultValue: undefined })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">없음</span>
                        </label>
                      </div>
                    ) : newField.type === 'list' ? (
                      <select
                        value={newField.defaultValue || ''}
                        onChange={(e) => setNewField({ ...newField, defaultValue: e.target.value || undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">기본값 없음</option>
                        {newField.options?.map((option, index) => (
                          <option key={index} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : newField.type === 'date' ? (
                      <input
                        type="date"
                        value={newField.defaultValue || ''}
                        onChange={(e) => setNewField({ ...newField, defaultValue: e.target.value || undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : newField.type === 'db' ? (
                      <div>
                        <select
                          value={newField.defaultValue || ''}
                          onChange={(e) => setNewField({ ...newField, defaultValue: e.target.value || undefined })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={!newField.dbCategory}
                        >
                          <option value="">기본값 없음</option>
                          {filteredDatabases.map(db => (
                            <option key={db.id} value={db.id}>
                              {db.displayName} ({db.recordCount}개 레코드)
                            </option>
                          ))}
                        </select>
                        {!newField.dbCategory && (
                          <p className="text-xs text-gray-500 mt-1">먼저 카테고리를 선택해주세요.</p>
                        )}
                        {newField.dbCategory && filteredDatabases.length === 0 && (
                          <p className="text-xs text-gray-500 mt-1">선택한 카테고리에 등록된 DB가 없습니다.</p>
                        )}
                      </div>
                    ) : (
                      <input
                        type={newField.type === 'number' || newField.type === 'integer' || newField.type === 'decimal' ? 'number' : 'text'}
                        value={newField.defaultValue || ''}
                        onChange={(e) => setNewField({ ...newField, defaultValue: e.target.value || undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="기본값을 입력하세요"
                        step={newField.type === 'decimal' ? '0.01' : undefined}
                      />
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      필드의 기본값을 설정합니다. 비워두면 기본값이 없습니다.
                    </p>
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
                    <span>{editingField ? '저장' : '추가'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 엑셀 불러오기 모달 */}
        {showExcelImporter && (
          <ExcelFieldImporter
            onImport={handleExcelImport}
            onClose={() => setShowExcelImporter(false)}
          />
        )}
      </div>
    </div>
  );
};

export default FieldManager;
