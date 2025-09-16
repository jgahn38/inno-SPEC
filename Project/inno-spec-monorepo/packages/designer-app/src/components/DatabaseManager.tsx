import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Database, 
  Trash2, 
  Edit, 
  Search, 
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { 
  BridgeDatabase, 
  DatabaseCategory, 
  DatabaseField, 
  CreateDatabaseRequest,
  UpdateDatabaseRequest 
} from '@inno-spec/shared';
import { DatabaseService } from '@inno-spec/admin-app';
import ExcelDataImporter from './ExcelDataImporter';

interface DatabaseManagerProps {
  tenantId: string;
}

const DatabaseManager: React.FC<DatabaseManagerProps> = ({ }) => {
  const [databases, setDatabases] = useState<BridgeDatabase[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<BridgeDatabase | null>(null);
  // const [loading, setLoading] = useState(true); // 사용하지 않음
  
  // 모달 상태
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // 필터 상태
  const [selectedCategory, setSelectedCategory] = useState<DatabaseCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // 새 DB 생성 상태
  const [newDatabase, setNewDatabase] = useState({
    name: '',
    displayName: '',
    description: '',
    category: 'bearing' as DatabaseCategory,
    fields: [] as DatabaseField[]
  });
  
  // 필드 추가 상태
  const [isAddingField, setIsAddingField] = useState(false);
  const [newField, setNewField] = useState<Partial<DatabaseField>>({});

  // 편집 모달 상태
  const [editingDatabase, setEditingDatabase] = useState<BridgeDatabase | null>(null);
  const [editingFields, setEditingFields] = useState<DatabaseField[]>([]);
  const [isEditingField, setIsEditingField] = useState(false);
  const [editingField, setEditingField] = useState<Partial<DatabaseField>>({});
  const [editingFieldIndex, setEditingFieldIndex] = useState<number>(-1);

  const databaseService = DatabaseService.getInstance();

  useEffect(() => {
    loadDatabases();
  }, []);

  const loadDatabases = () => {
    try {
      const allDatabases = databaseService.getAllDatabases();
      setDatabases(allDatabases);
      if (allDatabases.length > 0 && !selectedDatabase) {
        setSelectedDatabase(allDatabases[0]);
        loadTableData(allDatabases[0].id);
      }
    } catch (error) {
      console.error('Failed to load databases:', error);
    } finally {
      // setLoading(false); // 사용하지 않음
    }
  };

  // 테이블 데이터 로드
  const loadTableData = (databaseId: string) => {
    try {
      const records = databaseService.getRecords(databaseId);
      const data = records.map(record => record.data);
      setTableData(data);
    } catch (error) {
      console.error('Failed to load table data:', error);
      setTableData([]);
    }
  };

  // 데이터베이스 선택 시 테이블 데이터 로드
  const handleDatabaseSelect = (database: BridgeDatabase) => {
    setSelectedDatabase(database);
    loadTableData(database.id);
  };

  // DB 생성
  const handleCreateDatabase = async () => {
    if (!newDatabase.name.trim() || !newDatabase.displayName.trim()) {
      alert('DB명과 표시명을 입력해주세요.');
      return;
    }

    if (newDatabase.fields.length === 0) {
      alert('최소 하나의 필드를 추가해주세요.');
      return;
    }

    try {
      const request: CreateDatabaseRequest = {
        name: newDatabase.name.trim(),
        displayName: newDatabase.displayName.trim(),
        description: newDatabase.description.trim(),
        category: newDatabase.category,
                 fields: newDatabase.fields.map((field, index) => ({
           ...field,
           id: `field-${Date.now()}-${index}`
         })) as DatabaseField[]
      };

      databaseService.createDatabase(request);
      loadDatabases();
      
      // 모달 닫기 및 폼 초기화
      setNewDatabase({ name: '', displayName: '', description: '', category: 'bearing', fields: [] });
      setShowCreateModal(false);
      setIsAddingField(false);
      setNewField({});
      
      alert('데이터베이스가 성공적으로 생성되었습니다.');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'DB 생성 중 오류가 발생했습니다.');
    }
  };

  // DB 삭제
  const handleDeleteDatabase = (databaseId: string, databaseName: string) => {
    if (window.confirm(`정말로 데이터베이스 "${databaseName}"을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      try {
        databaseService.deleteDatabase(databaseId);
        loadDatabases();
        
        if (selectedDatabase?.id === databaseId) {
          setSelectedDatabase(null);
        }
        
        alert('데이터베이스가 삭제되었습니다.');
      } catch (error) {
        alert(error instanceof Error ? error.message : 'DB 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  // DB 상태 토글
  const handleToggleDatabaseStatus = (databaseId: string) => {
    try {
      databaseService.toggleDatabaseStatus(databaseId);
      loadDatabases();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'DB 상태 변경 중 오류가 발생했습니다.');
    }
  };

  // 필드 추가
  const handleAddField = () => {
    if (!newField.name || !newField.type) {
      alert('필드명과 타입을 입력해주세요.');
      return;
    }

         const field: DatabaseField = {
       id: `field-${Date.now()}`,
       name: newField.name,
       displayName: newField.displayName || newField.name,
       type: newField.type as any,
       unit: newField.unit || '',
       description: newField.description || '',
       parentHeader: newField.parentHeader || '',
       defaultValue: newField.defaultValue,
       validationRules: newField.validationRules || [],
       options: newField.options || []
     };

    setNewDatabase({
      ...newDatabase,
      fields: [...newDatabase.fields, field]
    });

    setNewField({});
    setIsAddingField(false);
  };

  // 필드 제거
  // handleRemoveField는 현재 사용되지 않음

  // 편집 모달 열기
  const handleOpenEditModal = (database: BridgeDatabase) => {
    setEditingDatabase(database);
    setEditingFields([...database.fields]);
    setShowEditModal(true);
  };

  // 편집 모달 닫기
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingDatabase(null);
    setEditingFields([]);
    setIsEditingField(false);
    setEditingField({});
    setEditingFieldIndex(-1);
  };

  // 편집된 DB 저장
  const handleSaveEdit = async () => {
    if (!editingDatabase) return;

    try {
      const updates: UpdateDatabaseRequest = {
        id: editingDatabase.id,
        displayName: editingDatabase.displayName,
        description: editingDatabase.description,
        category: editingDatabase.category,
        fields: editingFields,
        metadata: editingDatabase.metadata
      };

      databaseService.updateDatabase(editingDatabase.id, updates);
      loadDatabases();
      
      // 현재 선택된 DB가 편집된 DB라면 업데이트
      if (selectedDatabase?.id === editingDatabase.id) {
        const updated = databaseService.getDatabase(editingDatabase.id);
        if (updated) setSelectedDatabase(updated);
      }
      
      handleCloseEditModal();
      alert('데이터베이스가 성공적으로 수정되었습니다.');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'DB 수정 중 오류가 발생했습니다.');
    }
  };

  // 편집용 필드 추가
  const handleAddEditField = () => {
    if (!editingField.name || !editingField.type) {
      alert('필드명과 타입을 입력해주세요.');
      return;
    }

         const field: DatabaseField = {
       id: `field-${Date.now()}`,
       name: editingField.name,
       displayName: editingField.displayName || editingField.name,
       type: editingField.type as any,
       unit: editingField.unit || '',
       description: editingField.description || '',
       parentHeader: editingField.parentHeader || '',
       defaultValue: editingField.defaultValue,
       validationRules: editingField.validationRules || [],
       options: editingField.options || []
     };

    setEditingFields([...editingFields, field]);
    setEditingField({});
    setIsEditingField(false);
  };

  // 편집용 필드 수정
  const handleEditField = (index: number) => {
    const field = editingFields[index];
    setEditingField(field);
    setEditingFieldIndex(index);
    setIsEditingField(true);
  };

  // 편집용 필드 수정 저장
  const handleSaveEditField = () => {
    if (editingFieldIndex === -1 || !editingField.name || !editingField.type) return;

         const updatedField: DatabaseField = {
       ...editingFields[editingFieldIndex],
       name: editingField.name,
       displayName: editingField.displayName || editingField.name,
       type: editingField.type as any,
       unit: editingField.unit || '',
       description: editingField.description || '',
       parentHeader: editingField.parentHeader || '',
       defaultValue: editingField.defaultValue,
       validationRules: editingField.validationRules || [],
       options: editingField.options || []
     };

    const updatedFields = [...editingFields];
    updatedFields[editingFieldIndex] = updatedField;
    setEditingFields(updatedFields);
    
    setEditingField({});
    setEditingFieldIndex(-1);
    setIsEditingField(false);
  };

  // 편집용 필드 제거
  const handleRemoveEditField = (index: number) => {
    const updatedFields = editingFields.filter((_, i) => i !== index);
    setEditingFields(updatedFields);
  };

  // 편집용 필드 추가 취소
  const handleCancelEditField = () => {
    setEditingField({});
    setEditingFieldIndex(-1);
    setIsEditingField(false);
  };

  // 필터링된 DB 목록
  const filteredDatabases = databases.filter(db => {
    const matchesCategory = selectedCategory === 'all' || db.category === selectedCategory;
    const matchesSearch = db.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         db.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // 카테고리별 색상
  const getCategoryColor = (category: DatabaseCategory): string => {
    const colors: Record<DatabaseCategory, string> = {
      bearing: 'bg-blue-100 text-blue-800',
      seismic: 'bg-red-100 text-red-800',
      material: 'bg-green-100 text-green-800',
      geometry: 'bg-purple-100 text-purple-800',
      soil: 'bg-yellow-100 text-yellow-800',
      load: 'bg-indigo-100 text-indigo-800',
      analysis: 'bg-pink-100 text-pink-800',
      code: 'bg-gray-100 text-gray-800',
      other: 'bg-orange-100 text-orange-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  // 카테고리 표시명
  const getCategoryLabel = (category: DatabaseCategory): string => {
    const categories = databaseService.getSupportedCategories();
    return categories.find(cat => cat.value === category)?.label || category;
  };

  const resetCreateForm = () => {
    setNewDatabase({ name: '', displayName: '', description: '', category: 'bearing', fields: [] });
    setIsAddingField(false);
    setNewField({});
  };

  // 데이터 초기화 (개발/테스트용)
  const handleResetData = () => {
    if (window.confirm('모든 데이터베이스 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      try {
        databaseService.resetAllData();
        loadDatabases();
        alert('데이터가 초기화되었습니다.');
      } catch (error) {
        alert('데이터 초기화 중 오류가 발생했습니다.');
      }
    }
  };

  // 저장 상태 확인
  const getStorageInfo = () => {
    return databaseService.getStorageInfo();
  };

  // 데이터 입력 관련 상태
  const [tableData, setTableData] = useState<any[]>([]);
  const [showExcelImporter, setShowExcelImporter] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  
  // 편집 상태
  const [editingCell, setEditingCell] = useState<{rowIndex: number, fieldName: string} | null>(null);
  const [editingValue, setEditingValue] = useState('');

  // handleAddNewRow는 현재 사용되지 않음

  const handleCellChange = (rowIndex: number, fieldName: string, value: any) => {
    const newData = [...tableData];
    newData[rowIndex] = { ...newData[rowIndex], [fieldName]: value };
    setTableData(newData);
  };

  // 편집 함수들
  const startEditing = (rowIndex: number, fieldName: string, currentValue: any) => {
    setEditingCell({ rowIndex, fieldName });
    setEditingValue(currentValue || '');
  };

  const finishEditing = () => {
    if (editingCell) {
      handleCellChange(editingCell.rowIndex, editingCell.fieldName, editingValue);
      setEditingCell(null);
      setEditingValue('');
    }
  };

  // 체크박스 관련 함수들
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIndices = new Set(tableData.map((_, index) => index));
      setSelectedRows(allIndices);
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (rowIndex: number, checked: boolean) => {
    const newSelectedRows = new Set(selectedRows);
    if (checked) {
      newSelectedRows.add(rowIndex);
    } else {
      newSelectedRows.delete(rowIndex);
    }
    setSelectedRows(newSelectedRows);
  };

  const handleDeleteSelectedRows = () => {
    if (selectedRows.size === 0) {
      alert('삭제할 행을 선택해주세요.');
      return;
    }

    if (window.confirm(`선택된 ${selectedRows.size}개의 행을 삭제하시겠습니까?`)) {
      const newTableData = tableData.filter((_, index) => !selectedRows.has(index));
      setTableData(newTableData);
      setSelectedRows(new Set()); // 선택 상태 초기화
    }
  };


  const handleExcelImport = () => {
    setShowExcelImporter(true);
  };

  const handleExcelDataImport = (importedData: any[]) => {
    // 빈 행 추가 필터링 (이중 보안)
    const filteredData = importedData.filter(row => {
      // 모든 필드가 비어있지 않은 행만 유지
      return selectedDatabase?.fields.some(field => {
        const value = row[field.name];
        return value !== undefined && value !== null && value !== '';
      });
    });
    
    setTableData(filteredData);
    setShowExcelImporter(false);
    alert(`${filteredData.length}행의 데이터가 성공적으로 가져왔습니다.`);
  };

  // 편집 가능한 셀 렌더링
  const renderEditableCell = (rowIndex: number, field: DatabaseField, value: any) => {
    const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.fieldName === field.name;

    if (isEditing) {
      // 목록 타입인 경우 드롭다운
      if (field.type === 'list' && field.options && field.options.length > 0) {
        return (
          <select
            value={value || ''}
            onChange={(e) => handleCellChange(rowIndex, field.name, e.target.value)}
            onBlur={finishEditing}
            className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          >
            {field.options.map((option: string, index: number) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      }
      
      // 불린 타입인 경우 체크박스
      if (field.type === 'boolean') {
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value === true || value === 'true'}
              onChange={(e) => handleCellChange(rowIndex, field.name, e.target.checked)}
              onBlur={finishEditing}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              autoFocus
            />
            <span className="text-sm text-gray-700">
              {value === true || value === 'true' ? '참' : '거짓'}
            </span>
          </div>
        );
      }

      // 일반 입력 필드
      return (
        <input
          type={field.type === 'number' || field.type === 'integer' || field.type === 'decimal' ? 'number' : 
                field.type === 'date' ? 'date' : 'text'}
          value={value || ''}
          onChange={(e) => setEditingValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              finishEditing();
            }
            if (e.key === 'Escape') {
              setEditingCell(null);
              setEditingValue('');
            }
          }}
          onBlur={finishEditing}
          className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          style={{ maxWidth: '100%' }}
          autoFocus
          step={field.type === 'decimal' ? '0.01' : undefined}
        />
      );
    }

    // 표시 모드
    const displayValue = () => {
      if (field.type === 'boolean') {
        return value === true || value === 'true' ? '참' : '거짓';
      }
      if (field.type === 'list' && field.options && field.options.length > 0) {
        return value || '';
      }
      return value || '';
    };
    
    const hasValue = value !== undefined && value !== null && value !== '';
    
    return (
      <div
        className="px-2 py-1 text-sm text-gray-900 cursor-pointer hover:bg-gray-100 rounded min-h-[32px] flex items-center whitespace-nowrap overflow-hidden"
        onClick={() => {
          const currentValue = tableData[rowIndex]?.[field.name] || '';
          startEditing(rowIndex, field.name, currentValue);
        }}
        style={{ textOverflow: 'ellipsis' }}
      >
        {hasValue ? displayValue() : <span className="text-gray-400 italic">클릭하여 입력</span>}
      </div>
    );
  };

  // 빈 행용 셀 렌더링 (새 행 추가용)
  const renderEmptyCell = (field: DatabaseField) => {
    return (
      <div
        className="px-2 py-1 text-sm cursor-pointer hover:bg-gray-100 rounded min-h-[32px] flex items-center"
        onClick={() => {
          // 새 행 추가
          const newRow = { id: `row-${Date.now()}` };
          setTableData([...tableData, newRow]);
          // 새 행의 첫 번째 필드로 포커스 이동
          setTimeout(() => {
            const newRowIndex = tableData.length;
            const currentValue = field.defaultValue || '';
            startEditing(newRowIndex, field.name, currentValue);
          }, 100);
        }}
      >
        {/* 빈 상태로 표시 - placeholder 텍스트 제거 */}
      </div>
    );
  };

  const handleExportToExcel = () => {
    const headers = selectedDatabase?.fields.map(f => f.displayName) || [];
    const data = tableData.map(row => {
      const values: string[] = [];
      selectedDatabase?.fields.forEach(field => {
        values.push(row[field.name] || '');
      });
      return values.join('\t');
    });

    const csvContent = [headers.join('\t'), ...data].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedDatabase?.displayName || 'data'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveData = async () => {
    if (!selectedDatabase) return;

    try {
      // 기존 레코드 모두 삭제
      databaseService.clearRecords(selectedDatabase.id);
      
      // 새 레코드 추가
      const records: any[] = tableData.map(row => {
        const record: { [key: string]: any } = {};
        selectedDatabase.fields.forEach(field => {
          record[field.name] = row[field.name];
        });
        return record;
      });

      if (records.length > 0) {
        databaseService.addRecords(selectedDatabase.id, records);
        alert(`${records.length}행의 데이터가 성공적으로 저장되었습니다.`);
      } else {
        alert('모든 데이터가 삭제되어 빈 상태로 저장되었습니다.');
      }
      
      loadDatabases(); // 데이터베이스 목록 다시 로드
      loadTableData(selectedDatabase.id); // 테이블 데이터 다시 로드
    } catch (error) {
      alert(error instanceof Error ? error.message : '데이터 저장 중 오류가 발생했습니다.');
    }
  };

  const getTableData = () => {
    return tableData;
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">데이터베이스 관리</h1>
        <p className="text-gray-600 mb-6">
          교량 내진성능평가에 필요한 공통 데이터베이스를 관리합니다. 모든 프로젝트에서 공통으로 사용할 수 있습니다.
        </p>
        
        {/* 저장 상태 및 관리 버튼 */}
        <div className="flex items-center justify-between mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-6">
            <div className="text-sm">
              <span className="font-medium text-blue-800">저장된 DB:</span> {getStorageInfo().databasesCount}개
            </div>
            <div className="text-sm">
              <span className="font-medium text-blue-800">총 레코드:</span> {getStorageInfo().recordsCount}개
            </div>
            <div className="text-sm">
              <span className="font-medium text-blue-800">저장 크기:</span> {(getStorageInfo().storageSize / 1024).toFixed(2)}KB
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleResetData}
              className="px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              title="개발/테스트용 - 모든 데이터 초기화"
            >
              데이터 초기화
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 왼쪽: DB 목록 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">데이터베이스</h2>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  <span>추가</span>
                </button>
              </div>

              {/* 검색 및 필터 */}
              <div className="space-y-3 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="DB 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as DatabaseCategory | 'all')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="all">모든 카테고리</option>
                  {databaseService.getSupportedCategories().map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* DB 목록 */}
              <div className="space-y-2">
                {filteredDatabases.map((database) => (
                  <div key={database.id} className="relative group">
                    <button
                      onClick={() => handleDatabaseSelect(database)}
                      className={`w-full text-left p-3 rounded-md border transition-colors ${
                        selectedDatabase?.id === database.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <Database className={`h-4 w-4 ${database.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                        <span className="font-medium text-sm">{database.displayName}</span>
                        {database.isActive ? (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        ) : (
                          <AlertCircle className="h-3 w-3 text-gray-400" />
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-500 mb-2">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(database.category)}`}>
                          {getCategoryLabel(database.category)}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        {database.recordCount}개 레코드
                      </div>
                    </button>
                    
                    {/* 액션 버튼들 */}
                    <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleDatabaseStatus(database.id);
                        }}
                        className={`p-1 bg-white rounded-full shadow-sm ${
                          database.isActive 
                            ? 'text-green-600 hover:text-red-600' 
                            : 'text-gray-400 hover:text-green-600'
                        }`}
                        title={database.isActive ? '비활성화' : '활성화'}
                      >
                        {database.isActive ? <AlertCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDatabase(database.id, database.displayName);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 bg-white rounded-full shadow-sm"
                        title="삭제"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {filteredDatabases.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Database className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">데이터베이스가 없습니다</p>
                    <p className="text-xs text-gray-500 mb-3">새로운 데이터베이스를 생성해보세요.</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="inline-flex items-center space-x-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                      <span>DB 생성</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 오른쪽: 상세 정보 */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md p-6">
              {selectedDatabase ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        {selectedDatabase.displayName}
                      </h2>
                      <div className="flex items-center space-x-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(selectedDatabase.category)}`}>
                          {getCategoryLabel(selectedDatabase.category)}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          selectedDatabase.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedDatabase.isActive ? '활성' : '비활성'}
                        </span>
                        <span className="text-sm text-gray-500">
                          버전 {selectedDatabase.version}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      
                      <button
                        onClick={() => handleOpenEditModal(selectedDatabase)}
                        className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                        <span>편집</span>
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-6">{selectedDatabase.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 mb-1">레코드 수</div>
                      <div className="text-2xl font-bold text-gray-900">{selectedDatabase.recordCount}</div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 mb-1">마지막 업데이트</div>
                      <div className="text-sm text-gray-900">
                        {new Date(selectedDatabase.lastUpdated).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 mb-1">생성일</div>
                      <div className="text-sm text-gray-900">
                        {new Date(selectedDatabase.createdAt).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-700 mb-4">메타데이터</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(selectedDatabase.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>

                  {/* 데이터 입력 테이블 */}
                  <div className="border-t border-gray-200 pt-6">
                                         <div className="flex items-center justify-between mb-4">
                       <h3 className="text-lg font-medium text-gray-700">데이터 입력</h3>
                       <div className="flex space-x-2">
                         <button
                           onClick={() => handleExcelImport()}
                           className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                         >
                           <span>엑셀 불러오기</span>
                         </button>
                         <button
                           onClick={() => handleExportToExcel()}
                           className="flex items-center space-x-2 px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                         >
                           <span>엑셀 내보내기</span>
                         </button>
                         {selectedRows.size > 0 && (
                           <button
                             onClick={handleDeleteSelectedRows}
                             className="px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                           >
                             선택된 행 삭제 ({selectedRows.size}개)
                           </button>
                         )}
                         <button
                           onClick={handleSaveData}
                           className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                         >
                           데이터 저장
                         </button>
                       </div>
                     </div>

                    {/* 데이터 테이블 */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-2 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200" style={{ width: '40px' }}>
                              <input
                                type="checkbox"
                                checked={selectedRows.size === tableData.length && tableData.length > 0}
                                onChange={(e) => handleSelectAll(e.target.checked)}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                              />
                            </th>
                            <th className="px-2 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200" style={{ width: '60px' }}>
                              #
                            </th>
                            {selectedDatabase.fields.map((field) => (
                              <th key={field.id} className="px-2 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 last:border-r-0" style={{ width: '150px' }}>
                                             <div className="flex flex-col">
                                               <span className="font-medium">{field.displayName}</span>
                                               {field.unit && (
                                                 <span className="text-xs text-gray-500 font-normal">({field.unit})</span>
                                               )}
                                             </div>
                                           </th>
                            ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                          {getTableData().map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-gray-50 border-b border-gray-200">
                              <td className="px-2 py-2 text-sm text-gray-500 text-center border-r border-gray-200 bg-gray-50" style={{ width: '40px' }}>
                                <input
                                  type="checkbox"
                                  checked={selectedRows.has(rowIndex)}
                                  onChange={(e) => handleSelectRow(rowIndex, e.target.checked)}
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-2 py-2 text-sm text-gray-500 text-center border-r border-gray-200 bg-gray-50" style={{ width: '60px' }}>
                                {rowIndex + 1}
                              </td>
                              {selectedDatabase.fields.map((field) => (
                                <td key={field.id} className="px-2 py-2 text-sm text-gray-900 border-r border-gray-200 last:border-r-0 overflow-hidden" style={{ width: '150px' }}>
                                  {renderEditableCell(rowIndex, field, row[field.name])}
                                          </td>
                              ))}
                            </tr>
                          ))}
                          {/* 항상 마지막에 빈 행 표시 (새 행 추가용) */}
                          <tr className="hover:bg-blue-50 bg-blue-25 border-t-2 border-b-2 border-dashed border-blue-300">
                            <td className="px-2 py-2 text-sm text-gray-400 text-center border-r border-dashed border-blue-200 bg-blue-50" style={{ width: '40px' }}>
                              <div className="w-4 h-4"></div>
                            </td>
                            <td className="px-2 py-2 text-sm text-gray-400 text-center border-r border-dashed border-blue-200 bg-blue-50" style={{ width: '60px' }}>
                              {tableData.length + 1}
                            </td>
                            {selectedDatabase.fields.map((field) => (
                              <td key={`empty-${field.id}`} className="px-2 py-2 text-sm text-gray-900 border-r border-dashed border-blue-200 last:border-r-0 overflow-hidden" style={{ width: '150px' }}>
                                {renderEmptyCell(field)}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    

                    {/* 엑셀 데이터 임포터 */}
                    {showExcelImporter && selectedDatabase && (
                      <ExcelDataImporter
                        onImport={handleExcelDataImport}
                        onClose={() => setShowExcelImporter(false)}
                        fields={selectedDatabase.fields.map(field => ({
                          name: field.name,
                          displayName: field.displayName,
                          type: field.type,
                          unit: field.unit
                        }))}
                      />
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">데이터베이스를 선택해주세요</p>
                  <p className="text-gray-600">왼쪽 목록에서 데이터베이스를 선택하면 상세 정보를 볼 수 있습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 새 DB 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">새 데이터베이스 생성</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetCreateForm();
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
                    DB명 *
                  </label>
                  <input
                    type="text"
                    value={newDatabase.name}
                    onChange={(e) => setNewDatabase({ ...newDatabase, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="예: bearing_database"
                  />
                  <p className="text-xs text-gray-500 mt-1">영문 소문자, 언더스코어 사용 권장</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    표시명 *
                  </label>
                  <input
                    type="text"
                    value={newDatabase.displayName}
                    onChange={(e) => setNewDatabase({ ...newDatabase, displayName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="예: 교량받침DB"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  카테고리 *
                </label>
                <select
                  value={newDatabase.category}
                  onChange={(e) => setNewDatabase({ ...newDatabase, category: e.target.value as DatabaseCategory })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {databaseService.getSupportedCategories().map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label} - {category.description}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  설명
                </label>
                <textarea
                  value={newDatabase.description}
                  onChange={(e) => setNewDatabase({ ...newDatabase, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  rows={3}
                  placeholder="데이터베이스의 용도나 설명을 입력하세요"
                />
              </div>

              {/* 필드 관리 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-700">필드 구조</h3>
                  <button
                    onClick={() => {
                      if (isAddingField) {
                        setIsAddingField(false);
                        setNewField({});
                      } else {
                        setIsAddingField(true);
                        setNewField({});
                      }
                    }}
                    className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{isAddingField ? '취소' : '필드 추가'}</span>
                  </button>
                </div>

                {/* 새 필드 추가 폼 */}
                {isAddingField && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-md">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                      <input
                        type="text"
                        placeholder="필드명 *"
                        value={newField.name || ''}
                        onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                      <select
                        value={newField.type || ''}
                        onChange={(e) => setNewField({ ...newField, type: e.target.value as any })}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      >
                        <option value="">타입 선택 *</option>
                        <option value="text">텍스트</option>
                        <option value="number">숫자</option>
                        <option value="date">날짜</option>
                        <option value="boolean">불린</option>
                        <option value="decimal">소수점</option>
                        <option value="integer">정수</option>
                        <option value="list">목록</option>
                      </select>
                      <input
                        type="text"
                        placeholder="단위 (선택사항)"
                        value={newField.unit || ''}
                        onChange={(e) => setNewField({ ...newField, unit: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                      
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      <input
                        type="text"
                        placeholder="표시명 (선택사항)"
                        value={newField.displayName || ''}
                        onChange={(e) => setNewField({ ...newField, displayName: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                      <input
                        type="text"
                        placeholder="상위 헤더 (예: A, B, C)"
                        value={newField.parentHeader || ''}
                        onChange={(e) => setNewField({ ...newField, parentHeader: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                      <input
                        type="text"
                        placeholder="설명 (선택사항)"
                        value={newField.description || ''}
                        onChange={(e) => setNewField({ ...newField, description: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    
                    {/* list 타입일 때 옵션 입력 */}
                    {newField.type === 'list' && (
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          옵션 목록 (쉼표로 구분)
                        </label>
                        <input
                          type="text"
                          placeholder="예: 옵션1, 옵션2, 옵션3"
                          value={newField.options ? newField.options.join(', ') : ''}
                          onChange={(e) => {
                            const options = e.target.value.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0);
                            setNewField({ ...newField, options });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">쉼표로 구분하여 여러 옵션을 입력하세요.</p>
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={handleAddField}
                        disabled={!newField.name || !newField.type}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
                      >
                        필드 추가
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingField(false);
                          setNewField({});
                        }}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}

                {/* 필드 목록 */}
                {newDatabase.fields.length > 0 && (
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
                            단위
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            상위 헤더
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            옵션
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {newDatabase.fields.map((field, index) => (
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
                                field.type === 'list' ? 'bg-pink-100 text-pink-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {field.type}
                              </span>
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                              {field.unit || '-'}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                              {field.parentHeader || '-'}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                              {field.options && field.options.length > 0 ? field.options.join(', ') : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {newDatabase.fields.length === 0 && (
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
                  setShowCreateModal(false);
                  resetCreateForm();
                }}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCreateDatabase}
                disabled={!newDatabase.name.trim() || !newDatabase.displayName.trim() || newDatabase.fields.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                데이터베이스 생성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 데이터베이스 편집 모달 */}
      {showEditModal && editingDatabase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">데이터베이스 편집</h2>
              <button
                onClick={handleCloseEditModal}
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
                    DB명
                  </label>
                  <input
                    type="text"
                    value={editingDatabase.name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">DB명은 시스템에서 자동 생성되며 변경할 수 없습니다.</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    표시명 *
                  </label>
                  <input
                    type="text"
                    value={editingDatabase.displayName}
                    onChange={(e) => setEditingDatabase({ ...editingDatabase, displayName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="예: 교량받침DB"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  카테고리 *
                </label>
                <select
                  value={editingDatabase.category}
                  onChange={(e) => setEditingDatabase({ ...editingDatabase, category: e.target.value as DatabaseCategory })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {databaseService.getSupportedCategories().map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label} - {category.description}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  설명
                </label>
                <textarea
                  value={editingDatabase.description}
                  onChange={(e) => setEditingDatabase({ ...editingDatabase, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  rows={3}
                  placeholder="데이터베이스의 용도나 설명을 입력하세요"
                />
              </div>

              {/* 필드 관리 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-700">필드 구조</h3>
                  <button
                    onClick={() => {
                      if (isEditingField) {
                        handleCancelEditField();
                      } else {
                        setIsEditingField(true);
                        setEditingField({});
                        setEditingFieldIndex(-1);
                      }
                    }}
                    className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{isEditingField ? '취소' : '필드 추가'}</span>
                  </button>
                </div>

                {/* 새 필드 추가 폼 */}
                {isEditingField && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-md">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                      <div className="md:col-span-1">
                        <input
                          type="text"
                          placeholder="필드명 *"
                          value={editingField.name || ''}
                          onChange={(e) => setEditingField({ ...editingField, name: e.target.value })}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                            editingFieldIndex !== -1 ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                          }`}
                          readOnly={editingFieldIndex !== -1}
                          title={editingFieldIndex !== -1 ? '필드명은 편집할 수 없습니다' : ''}
                        />
                        {editingFieldIndex !== -1 && (
                          <p className="text-xs text-gray-500 mt-1">필드명은 편집할 수 없습니다</p>
                        )}
                      </div>
                      <select
                        value={editingField.type || ''}
                        onChange={(e) => setEditingField({ ...editingField, type: e.target.value as any })}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      >
                        <option value="">타입 선택 *</option>
                        <option value="text">텍스트</option>
                        <option value="number">숫자</option>
                        <option value="date">날짜</option>
                        <option value="boolean">불린</option>
                        <option value="decimal">소수점</option>
                        <option value="integer">정수</option>
                        <option value="list">목록</option>
                      </select>
                      <input
                        type="text"
                        placeholder="단위 (선택사항)"
                        value={editingField.unit || ''}
                        onChange={(e) => setEditingField({ ...editingField, unit: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                      
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      <input
                        type="text"
                        placeholder="표시명 (선택사항)"
                        value={editingField.displayName || ''}
                        onChange={(e) => setEditingField({ ...editingField, displayName: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                      <input
                        type="text"
                        placeholder="상위 헤더 (예: A, B, C)"
                        value={editingField.parentHeader || ''}
                        onChange={(e) => setEditingField({ ...editingField, parentHeader: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                      <input
                        type="text"
                        placeholder="설명 (선택사항)"
                        value={editingField.description || ''}
                        onChange={(e) => setEditingField({ ...editingField, description: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    
                    {/* list 타입일 때 옵션 입력 */}
                    {editingField.type === 'list' && (
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          옵션 목록 (쉼표로 구분)
                        </label>
                        <input
                          type="text"
                          placeholder="예: 옵션1, 옵션2, 옵션3"
                          value={editingField.options ? editingField.options.join(', ') : ''}
                          onChange={(e) => {
                            const options = e.target.value.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0);
                            setEditingField({ ...editingField, options });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">쉼표로 구분하여 여러 옵션을 입력하세요.</p>
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      {editingFieldIndex === -1 ? (
                        <button
                          onClick={handleAddEditField}
                          disabled={!editingField.name || !editingField.type}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
                        >
                          필드 추가
                        </button>
                      ) : (
                        <button
                          onClick={handleSaveEditField}
                          disabled={!editingField.name || !editingField.type}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
                        >
                          필드 저장
                        </button>
                      )}
                      <button
                        onClick={handleCancelEditField}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}

                {/* 필드 목록 */}
                {editingFields.length > 0 && (
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
                            단위
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            상위 헤더
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            옵션
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-32">
                            작업
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {editingFields.map((field, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="border border-gray-300 px-3 py-2 text-sm font-mono text-gray-900">
                              {field.name}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                              {field.displayName}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                              <span className={`inline-flex items-center px-2 py-2 text-xs font-medium ${
                                field.type === 'text' ? 'bg-blue-100 text-blue-800' :
                                field.type === 'number' ? 'bg-green-100 text-green-800' :
                                field.type === 'date' ? 'bg-purple-100 text-purple-800' :
                                field.type === 'boolean' ? 'bg-yellow-100 text-yellow-800' :
                                field.type === 'decimal' ? 'bg-indigo-100 text-indigo-800' :
                                field.type === 'list' ? 'bg-pink-100 text-pink-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {field.type}
                              </span>
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                              {field.unit || '-'}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                              {field.parentHeader || '-'}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                              {field.options && field.options.length > 0 ? field.options.join(', ') : '-'}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleEditField(index)}
                                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                >
                                  저장
                                </button>
                                <button
                                  onClick={() => handleRemoveEditField(index)}
                                  className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                >
                                  삭제
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {editingFields.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>아직 필드가 추가되지 않았습니다.</p>
                    <p className="text-sm">위의 "필드 추가" 버튼을 클릭하여 필드를 추가해주세요.</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleCloseEditModal}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={editingDatabase.displayName.trim() === '' || editingFields.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                데이터베이스 저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseManager;
