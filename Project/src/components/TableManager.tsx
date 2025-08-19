import React, { useState, useEffect } from 'react';
import { TableSchema, TableField, FieldType, TableData, MCode } from '../types';
import { TableSchemaService } from '../services/TableSchemaService';
import MCodeEditor from './MCodeEditor';
import { Plus, Building2, Calendar, MoreVertical, Edit, Trash2, Filter, Search, X } from 'lucide-react';

interface TableManagerProps {
  tenantId: string;
  projectId: string;
}

const TableManager: React.FC<TableManagerProps> = ({ tenantId, projectId }) => {
  const [schemas, setSchemas] = useState<TableSchema[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<TableSchema | null>(null);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [mCodes, setMCodes] = useState<MCode[]>([]);
  const [selectedMCode, setSelectedMCode] = useState<MCode | null>(null);
  const [isAddingField, setIsAddingField] = useState(false);
  const [newField, setNewField] = useState<Partial<TableField>>({});
  
  // 새 스키마 생성 관련 상태
  const [showCreateSchemaModal, setShowCreateSchemaModal] = useState(false);
  const [newSchema, setNewSchema] = useState({
    name: '',
    displayName: '',
    description: '',
    fields: [] as Partial<TableField>[]
  });
  const [isAddingSchemaField, setIsAddingSchemaField] = useState(false);
  const [newSchemaField, setNewSchemaField] = useState<Partial<TableField>>({});

  const tableSchemaService = TableSchemaService.getInstance();

  useEffect(() => {
    loadSchemas();
    loadMCodes();
  }, []);

  const loadSchemas = () => {
    const allSchemas = tableSchemaService.getAllSchemas();
    setSchemas(allSchemas);
    if (allSchemas.length > 0 && !selectedSchema) {
      setSelectedSchema(allSchemas[0]);
    }
  };

  const loadMCodes = () => {
    // 샘플 M 코드 데이터 (실제로는 서비스에서 가져와야 함)
    const sampleMCodes: MCode[] = [
      {
        id: 'mcode-1',
        name: '프로젝트명 대문자 변환',
        description: '파워쿼리 스타일의 컬럼 변환 코드',
        code: `let
    Source = Excel.CurrentWorkbook(){[Name="Table1"]}[Content],
    #"Transformed Columns" = Table.TransformColumns(Source, {
        {"project_name", each Text.Upper(_), type text},
        {"project_code", each Text.Upper(_), type text}
    })
in
    #"Transformed Columns"`,
        tableId: 'table-1',
        version: '1.0.0',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'mcode-2',
        name: '예산 및 수량 반올림',
        description: '숫자 필드의 반올림 처리',
        code: `let
    Source = Excel.CurrentWorkbook(){[Name="Table2"]}[Content],
    #"Rounded Numbers" = Table.TransformColumns(Source, {
        {"budget", each Number.Round(_, 0), type number},
        {"quantity", each Number.Round(_, 0), type number}
    })
in
    #"Rounded Numbers"`,
        tableId: 'table-2',
        version: '1.0.0',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    setMCodes(sampleMCodes);
  };

  const loadTableData = (schemaId: string) => {
    // 샘플 테이블 데이터 (실제로는 서비스에서 가져와야 함)
    const sampleData: TableData = {
      id: `data-${schemaId}`,
      tableId: schemaId,
      projectId,
      tenantId,
      data: [
        {
          project_name: '샘플 프로젝트 1',
          project_code: 'PRJ001',
          start_date: '2024-01-01',
          end_date: '2024-12-31'
        },
        {
          project_name: '샘플 프로젝트 2',
          project_code: 'PRJ002',
          start_date: '2024-02-01',
          end_date: '2024-11-30'
        }
      ],
      rowCount: 2,
      lastUpdated: new Date()
    };
    setTableData(sampleData);
  };

  const handleSchemaSelect = (schema: TableSchema) => {
    setSelectedSchema(schema);
    loadTableData(schema.id);
    setSelectedMCode(mCodes.find(mc => mc.tableId === schema.id) || null);
  };

  const handleAddField = () => {
    if (!selectedSchema || !newField.name || !newField.type) {
      alert('필드명과 타입을 입력해주세요.');
      return;
    }

    try {
      const field: TableField = {
        id: `field-${Date.now()}`,
        name: newField.name,
        displayName: newField.displayName || newField.name,
        type: newField.type as FieldType,
        required: newField.required || false,
        description: newField.description || '',
        validationRules: newField.validationRules || []
      };

      tableSchemaService.addField(selectedSchema.id, field);
      loadSchemas();
      setNewField({});
      setIsAddingField(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : '필드 추가 중 오류가 발생했습니다.');
    }
  };

  const handleMCodeChange = (code: string) => {
    if (selectedMCode) {
      const updatedMCode = { ...selectedMCode, code };
      setSelectedMCode(updatedMCode);
      
      // M 코드 목록 업데이트
      setMCodes(prev => prev.map(mc => 
        mc.id === selectedMCode.id ? updatedMCode : mc
      ));
    }
  };

  const handleMCodeExecute = (result: any) => {
    console.log('M 코드 실행 결과:', result);
    // 여기서 변환된 데이터를 처리할 수 있습니다
  };

  // 새 스키마 생성 관련 함수들
  const handleCreateSchema = async () => {
    if (!newSchema.name.trim() || !newSchema.displayName.trim()) {
      alert('테이블명과 표시명을 입력해주세요.');
      return;
    }

    if (newSchema.fields.length === 0) {
      alert('최소 하나의 필드를 추가해주세요.');
      return;
    }

    try {
      const schema: TableSchema = {
        id: `table-${Date.now()}`,
        name: newSchema.name.trim(),
        displayName: newSchema.displayName.trim(),
        description: newSchema.description.trim(),
        fields: newSchema.fields.map((field, index) => ({
          id: `field-${Date.now()}-${index}`,
          name: field.name!,
          displayName: field.displayName || field.name!,
          type: field.type as FieldType,
          required: field.required || false,
          description: field.description || '',
          validationRules: field.validationRules || []
        })) as TableField[],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      tableSchemaService.addSchema(schema);
      loadSchemas();
      
      // 모달 닫기 및 폼 초기화
      setNewSchema({ name: '', displayName: '', description: '', fields: [] });
      setShowCreateSchemaModal(false);
      setIsAddingSchemaField(false);
      setNewSchemaField({});
      
      alert('테이블 스키마가 성공적으로 생성되었습니다.');
    } catch (error) {
      alert(error instanceof Error ? error.message : '스키마 생성 중 오류가 발생했습니다.');
    }
  };

  const handleAddSchemaField = () => {
    if (!newSchemaField.name || !newSchemaField.type) {
      alert('필드명과 타입을 입력해주세요.');
      return;
    }

    const field: Partial<TableField> = {
      name: newSchemaField.name,
      displayName: newSchemaField.displayName || newSchemaField.name,
      type: newSchemaField.type as FieldType,
      required: newSchemaField.required || false,
      description: newSchemaField.description || '',
      validationRules: newSchemaField.validationRules || []
    };

    setNewSchema({
      ...newSchema,
      fields: [...newSchema.fields, field]
    });

    setNewSchemaField({});
    setIsAddingSchemaField(false);
  };

  const handleRemoveSchemaField = (index: number) => {
    const updatedFields = newSchema.fields.filter((_, i) => i !== index);
    setNewSchema({ ...newSchema, fields: updatedFields });
  };

  const resetCreateSchemaForm = () => {
    setNewSchema({ name: '', displayName: '', description: '', fields: [] });
    setIsAddingSchemaField(false);
    setNewSchemaField({});
  };

  // 스키마 삭제 기능
  const handleDeleteSchema = (schemaId: string) => {
    if (window.confirm('정말로 이 테이블 스키마를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      try {
        tableSchemaService.deleteSchema(schemaId);
        loadSchemas();
        
        // 삭제된 스키마가 현재 선택된 스키마였다면 선택 해제
        if (selectedSchema?.id === schemaId) {
          setSelectedSchema(null);
          setTableData(null);
        }
        
        alert('테이블 스키마가 삭제되었습니다.');
      } catch (error) {
        alert(error instanceof Error ? error.message : '스키마 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const getFieldTypeDisplayName = (type: FieldType): string => {
    const typeNames: Record<FieldType, string> = {
      text: '텍스트',
      number: '숫자',
      date: '날짜',
      boolean: '불린',
      decimal: '소수점',
      integer: '정수'
    };
    return typeNames[type];
  };

  // 입력 타입 결정
  const getInputType = (type: FieldType): string => {
    switch (type) {
      case 'date': return 'date';
      case 'number': return 'number';
      case 'decimal': return 'number';
      case 'integer': return 'number';
      case 'boolean': return 'checkbox';
      default: return 'text';
    }
  };

  // 데이터 변경 처리
  const handleDataChange = (rowIndex: number, fieldName: string, value: string) => {
    if (!tableData) return;
    
    const newData = [...tableData.data];
    newData[rowIndex] = { ...newData[rowIndex], [fieldName]: value };
    
    setTableData({
      ...tableData,
      data: newData,
      rowCount: newData.length,
      lastUpdated: new Date()
    });
  };

  // 새 행 추가
  const handleAddNewRow = () => {
    if (!tableData || !selectedSchema) return;
    
    const newRow: Record<string, any> = {};
    selectedSchema.fields.forEach(field => {
      newRow[field.name] = '';
    });
    
    const newData = [...tableData.data, newRow];
    setTableData({
      ...tableData,
      data: newData,
      rowCount: newData.length,
      lastUpdated: new Date()
    });
  };

  // 행 삭제
  const handleDeleteRow = (rowIndex: number) => {
    if (!tableData) return;
    
    const newData = tableData.data.filter((_, index) => index !== rowIndex);
    setTableData({
      ...tableData,
      data: newData,
      rowCount: newData.length,
      lastUpdated: new Date()
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">테이블 관리</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 왼쪽: 테이블 스키마 목록 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">테이블 스키마</h2>
                <button
                  onClick={() => setShowCreateSchemaModal(true)}
                  className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  <span>추가</span>
                </button>
              </div>
              <div className="space-y-2">
                {schemas.map((schema) => (
                  <div key={schema.id} className="relative group">
                    <button
                      onClick={() => handleSchemaSelect(schema)}
                      className={`w-full text-left p-3 rounded-md border transition-colors ${
                        selectedSchema?.id === schema.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium">{schema.displayName}</div>
                      <div className="text-sm text-gray-500">{schema.fields.length}개 필드</div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSchema(schema.id);
                      }}
                      className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all duration-200"
                      title="스키마 삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                
                {schemas.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Building2 className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">테이블 스키마가 없습니다</p>
                    <p className="text-xs text-gray-500 mb-3">새로운 테이블 스키마를 생성해보세요.</p>
                    <button
                      onClick={() => setShowCreateSchemaModal(true)}
                      className="inline-flex items-center space-x-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                      <span>스키마 생성</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 오른쪽: 상세 정보 및 M 언어 편집기 */}
          <div className="lg:col-span-3">
            <div className="grid grid-rows-2 gap-6 h-full">
              {/* 오른쪽 위: 테이블 구조 및 데이터 */}
              <div className="bg-white rounded-lg shadow-md p-6">
                {selectedSchema ? (
                  <>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                      {selectedSchema.displayName}
                    </h2>
                    <p className="text-gray-600 mb-4">{selectedSchema.description}</p>
                    
                                         {/* 필드 목록 */}
                     <div className="mb-4">
                       <div className="flex items-center justify-between mb-3">
                         <h3 className="font-medium text-gray-700">필드 구조</h3>
                         <button
                           onClick={() => setIsAddingField(!isAddingField)}
                           className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                         >
                           {isAddingField ? '취소' : '필드 추가'}
                         </button>
                       </div>
                       
                       {isAddingField && (
                         <div className="mb-4 p-3 bg-gray-50 rounded-md">
                           <div className="grid grid-cols-2 gap-2 mb-2">
                             <input
                               type="text"
                               placeholder="필드명"
                               value={newField.name || ''}
                               onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                               className="px-2 py-1 border border-gray-300 rounded text-sm"
                             />
                             <select
                               value={newField.type || ''}
                               onChange={(e) => setNewField({ ...newField, type: e.target.value as FieldType })}
                               className="px-2 py-1 border border-gray-300 rounded text-sm"
                             >
                               <option value="">타입 선택</option>
                               {tableSchemaService.getSupportedFieldTypes().map(type => (
                                 <option key={type} value={type}>{getFieldTypeDisplayName(type)}</option>
                               ))}
                             </select>
                           </div>
                           <div className="flex space-x-2">
                             <input
                               type="text"
                               placeholder="표시명 (선택사항)"
                               value={newField.displayName || ''}
                               onChange={(e) => setNewField({ ...newField, displayName: e.target.value })}
                               className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                             />
                             <button
                               onClick={handleAddField}
                               className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                             >
                               추가
                             </button>
                           </div>
                         </div>
                       )}
                       
                       {/* 엑셀 스타일 테이블 */}
                       <div className="overflow-x-auto">
                         <table className="min-w-full border border-gray-300 bg-white">
                           <thead>
                             <tr className="bg-gray-50">
                               <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                 필드명
                               </th>
                               <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                 표시명
                               </th>
                               <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                 타입
                               </th>
                               <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                 필수
                               </th>
                               <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                 설명
                               </th>
                             </tr>
                           </thead>
                           <tbody className="bg-white divide-y divide-gray-200">
                             {selectedSchema.fields.map((field, index) => (
                               <tr key={field.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                 <td className="border border-gray-300 px-3 py-2 text-sm font-mono text-gray-900">
                                   {field.name}
                                 </td>
                                 <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                                   {field.displayName}
                                 </td>
                                 <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                                   <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                     field.type === 'text' ? 'bg-blue-100 text-blue-800' :
                                     field.type === 'number' ? 'bg-green-100 text-green-800' :
                                     field.type === 'date' ? 'bg-purple-100 text-purple-800' :
                                     field.type === 'boolean' ? 'bg-yellow-100 text-yellow-800' :
                                     field.type === 'decimal' ? 'bg-indigo-100 text-indigo-800' :
                                     'bg-gray-100 text-gray-800'
                                   }`}>
                                     {getFieldTypeDisplayName(field.type)}
                                   </span>
                                 </td>
                                 <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                                   {field.required ? (
                                     <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                       필수
                                     </span>
                                   ) : (
                                     <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                       선택
                                     </span>
                                   )}
                                 </td>
                                 <td className="border border-gray-300 px-3 py-2 text-sm text-gray-600">
                                   {field.description || '-'}
                                 </td>
                               </tr>
                             ))}
                           </tbody>
                         </table>
                       </div>
                     </div>

                                         {/* 데이터 입력 및 테스트 테이블 */}
                     <div className="mt-6">
                       <h3 className="font-medium text-gray-700 mb-3">데이터 입력 및 테스트</h3>
                       
                       {/* 데이터 입력 테이블 */}
                       <div className="overflow-x-auto mb-4">
                         <table className="min-w-full border border-gray-300 bg-white">
                           <thead>
                             <tr className="bg-gray-50">
                               {selectedSchema.fields.map((field) => (
                                 <th key={field.id} className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                   {field.displayName}
                                   {field.required && <span className="text-red-500 ml-1">*</span>}
                                 </th>
                               ))}
                               <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-20">
                                 작업
                               </th>
                             </tr>
                           </thead>
                           <tbody className="bg-white divide-y divide-gray-200">
                             {tableData?.data.map((row, rowIndex) => (
                               <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                 {selectedSchema.fields.map((field) => (
                                   <td key={field.id} className="border border-gray-300 px-2 py-1">
                                     {field.type === 'boolean' ? (
                                       <input
                                         type="checkbox"
                                         checked={Boolean(row[field.name])}
                                         onChange={(e) => handleDataChange(rowIndex, field.name, e.target.checked.toString())}
                                         className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                       />
                                     ) : (
                                       <input
                                         type={getInputType(field.type)}
                                         value={row[field.name] || ''}
                                         onChange={(e) => handleDataChange(rowIndex, field.name, e.target.value)}
                                         className="w-full px-2 py-1 text-sm border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                         placeholder={field.description || field.displayName}
                                         required={field.required}
                                       />
                                     )}
                                   </td>
                                 ))}
                                 <td className="border border-gray-300 px-2 py-1">
                                   <button
                                     onClick={() => handleDeleteRow(rowIndex)}
                                     className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                                   >
                                     삭제
                                   </button>
                                 </td>
                               </tr>
                             ))}
                           </tbody>
                         </table>
                       </div>
                       
                       {/* 새 행 추가 버튼 */}
                       <div className="flex justify-between items-center">
                         <button
                           onClick={handleAddNewRow}
                           className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                         >
                           새 행 추가
                         </button>
                         
                         <div className="text-sm text-gray-600">
                           총 {tableData?.rowCount || 0}개 레코드
                         </div>
                       </div>
                     </div>
                  </>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <p>테이블 스키마를 선택해주세요.</p>
                  </div>
                )}
              </div>

              {/* 오른쪽 아래: M 언어 편집기 */}
              <div className="bg-white rounded-lg shadow-md p-6">
                {selectedMCode && tableData ? (
                  <MCodeEditor
                    mCode={selectedMCode}
                    tableData={tableData}
                    onCodeChange={handleMCodeChange}
                    onExecute={handleMCodeExecute}
                  />
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">M 언어 편집기</h3>
                    <p>테이블을 선택하면 M 언어 코드를 편집할 수 있습니다.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 새 테이블 스키마 생성 모달 */}
      {showCreateSchemaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">새 테이블 스키마 생성</h2>
              <button
                onClick={() => {
                  setShowCreateSchemaModal(false);
                  resetCreateSchemaForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    테이블명 *
                  </label>
                  <input
                    type="text"
                    value={newSchema.name}
                    onChange={(e) => setNewSchema({ ...newSchema, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="예: project_info"
                  />
                  <p className="text-xs text-gray-500 mt-1">영문 소문자, 언더스코어 사용 권장</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    표시명 *
                  </label>
                  <input
                    type="text"
                    value={newSchema.displayName}
                    onChange={(e) => setNewSchema({ ...newSchema, displayName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="예: 프로젝트 정보"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  설명
                </label>
                <textarea
                  value={newSchema.description}
                  onChange={(e) => setNewSchema({ ...newSchema, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  rows={3}
                  placeholder="테이블의 용도나 설명을 입력하세요"
                />
              </div>

              {/* 필드 관리 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-700">필드 구조</h3>
                  <button
                    onClick={() => setIsAddingSchemaField(!isAddingSchemaField)}
                    className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>필드 추가</span>
                  </button>
                </div>

                {/* 새 필드 추가 폼 */}
                {isAddingSchemaField && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-md">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      <input
                        type="text"
                        placeholder="필드명 *"
                        value={newSchemaField.name || ''}
                        onChange={(e) => setNewSchemaField({ ...newSchemaField, name: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                      <select
                        value={newSchemaField.type || ''}
                        onChange={(e) => setNewSchemaField({ ...newSchemaField, type: e.target.value as FieldType })}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      >
                        <option value="">타입 선택 *</option>
                        {tableSchemaService.getSupportedFieldTypes().map(type => (
                          <option key={type} value={type}>{getFieldTypeDisplayName(type)}</option>
                        ))}
                      </select>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="required-field"
                          checked={newSchemaField.required || false}
                          onChange={(e) => setNewSchemaField({ ...newSchemaField, required: e.target.checked })}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="required-field" className="text-sm text-gray-700">필수</label>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <input
                        type="text"
                        placeholder="표시명 (선택사항)"
                        value={newSchemaField.displayName || ''}
                        onChange={(e) => setNewSchemaField({ ...newSchemaField, displayName: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                      <input
                        type="text"
                        placeholder="설명 (선택사항)"
                        value={newSchemaField.description || ''}
                        onChange={(e) => setNewSchemaField({ ...newSchemaField, description: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={handleAddSchemaField}
                        disabled={!newSchemaField.name || !newSchemaField.type}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
                      >
                        필드 추가
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingSchemaField(false);
                          setNewSchemaField({});
                        }}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}

                {/* 필드 목록 */}
                {newSchema.fields.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300 bg-white">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            필드명
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            표시명
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            타입
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            필수
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            설명
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-20">
                            작업
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {newSchema.fields.map((field, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="border border-gray-300 px-3 py-2 text-sm font-mono text-gray-900">
                              {field.name}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                              {field.displayName}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                field.type === 'text' ? 'bg-blue-100 text-blue-800' :
                                field.type === 'number' ? 'bg-green-100 text-green-800' :
                                field.type === 'date' ? 'bg-purple-100 text-purple-800' :
                                field.type === 'boolean' ? 'bg-yellow-100 text-yellow-800' :
                                field.type === 'decimal' ? 'bg-indigo-100 text-indigo-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {field.type ? getFieldTypeDisplayName(field.type) : '-'}
                              </span>
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                              {field.required ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  필수
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  선택
                                </span>
                              )}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-gray-600">
                              {field.description || '-'}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                              <button
                                onClick={() => handleRemoveSchemaField(index)}
                                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                              >
                                삭제
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {newSchema.fields.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>아직 필드가 추가되지 않았습니다.</p>
                    <p className="text-sm">위의 "필드 추가" 버튼을 클릭하여 필드를 추가해주세요.</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowCreateSchemaModal(false);
                  resetCreateSchemaForm();
                }}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCreateSchema}
                disabled={!newSchema.name.trim() || !newSchema.displayName.trim() || newSchema.fields.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                스키마 생성
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableManager;
