import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Database, 
  Trash2, 
  Edit, 
  Eye, 
  Search, 
  Filter, 
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
} from '../types';
import { DatabaseService } from '../services/DatabaseService';

interface DatabaseManagerProps {
  tenantId: string;
}

const DatabaseManager: React.FC<DatabaseManagerProps> = ({ tenantId }) => {
  const [databases, setDatabases] = useState<BridgeDatabase[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<BridgeDatabase | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 모달 상태
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  
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
      setLoading(false);
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

      const createdDatabase = databaseService.createDatabase(request);
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
       validationRules: newField.validationRules || []
     };

    setNewDatabase({
      ...newDatabase,
      fields: [...newDatabase.fields, field]
    });

    setNewField({});
    setIsAddingField(false);
  };

  // 필드 제거
  const handleRemoveField = (index: number) => {
    const updatedFields = newDatabase.fields.filter((_, i) => i !== index);
    setNewDatabase({ ...newDatabase, fields: updatedFields });
  };

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
       validationRules: editingField.validationRules || []
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
       validationRules: editingField.validationRules || []
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
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedData, setPastedData] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  
  // 엑셀 스타일 편집을 위한 상태
  const [editingCell, setEditingCell] = useState<{rowIndex: number, fieldName: string} | null>(null);
  const [editingValue, setEditingValue] = useState(''); // 체크된 행들

  const handleAddNewRow = () => {
    setTableData([...tableData, {}]);
  };

  const handleRemoveRow = (index: number) => {
    setTableData(tableData.filter((_, i) => i !== index));
  };

  const handleCellChange = (rowIndex: number, fieldName: string, value: any) => {
    const newData = [...tableData];
    newData[rowIndex] = { ...newData[rowIndex], [fieldName]: value };
    setTableData(newData);
  };

  // 엑셀 스타일 편집 함수들
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

  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, fieldName: string) => {
    if (editingCell) {
      // 편집 모드에서의 키 처리
      if (e.key === 'Enter') {
        e.preventDefault();
        finishEditing();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setEditingCell(null);
        setEditingValue('');
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        // 편집 모드에서도 화살표 키로 셀 이동 가능
        e.preventDefault();
        
        // 현재 편집 중인 값을 저장
        finishEditing();
        
        // 새 셀로 이동
        const fieldIndex = selectedDatabase?.fields.findIndex(f => f.name === fieldName) || 0;
        let newRowIndex = rowIndex;
        let newFieldIndex = fieldIndex;
        
        switch (e.key) {
          case 'ArrowUp':
            newRowIndex = Math.max(0, rowIndex - 1);
            break;
          case 'ArrowDown':
            newRowIndex = Math.min(tableData.length - 1, rowIndex + 1);
            break;
          case 'ArrowLeft':
            newFieldIndex = Math.max(0, fieldIndex - 1);
            break;
          case 'ArrowRight':
            newFieldIndex = Math.min((selectedDatabase?.fields.length || 1) - 1, fieldIndex + 1);
            break;
        }
        
        // 새 셀로 포커스 이동 및 편집 모드 진입
        const newFieldName = selectedDatabase?.fields[newFieldIndex]?.name;
        if (newFieldName) {
          setTimeout(() => {
            const cellElement = document.querySelector(`[data-row="${newRowIndex}"][data-field="${newFieldName}"]`) as HTMLElement;
            if (cellElement) {
              cellElement.focus();
              // 새 셀을 편집 모드로 진입
              const currentValue = tableData[newRowIndex]?.[newFieldName] || '';
              startEditing(newRowIndex, newFieldName, currentValue);
            }
          }, 0);
        }
      }
      return;
    }

    // 편집 모드가 아닐 때는 화살표 키로 셀 이동
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      
      const fieldIndex = selectedDatabase?.fields.findIndex(f => f.name === fieldName) || 0;
      let newRowIndex = rowIndex;
      let newFieldIndex = fieldIndex;
      
      switch (e.key) {
        case 'ArrowUp':
          newRowIndex = Math.max(0, rowIndex - 1);
          break;
        case 'ArrowDown':
          newRowIndex = Math.min(tableData.length - 1, rowIndex + 1);
          break;
        case 'ArrowLeft':
          newFieldIndex = Math.max(0, fieldIndex - 1);
          break;
        case 'ArrowRight':
          newFieldIndex = Math.min((selectedDatabase?.fields.length || 1) - 1, fieldIndex + 1);
          break;
      }
      
      // 새 셀로 포커스 이동
      const newFieldName = selectedDatabase?.fields[newFieldIndex]?.name;
      if (newFieldName) {
        const cellElement = document.querySelector(`[data-row="${newRowIndex}"][data-field="${newFieldName}"]`) as HTMLElement;
        if (cellElement) {
          cellElement.focus();
        }
      }
    } else if (e.key === 'Enter' || e.key === 'F2') {
      // Enter 또는 F2로 편집 모드 진입
      e.preventDefault();
      const currentValue = tableData[rowIndex]?.[fieldName] || '';
      startEditing(rowIndex, fieldName, currentValue);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      // Delete 또는 Backspace로 셀 값 삭제
      e.preventDefault();
      handleCellChange(rowIndex, fieldName, '');
    } else if (e.key.length === 1 || e.key === 'Delete' || e.key === 'Backspace') {
      // 일반 문자 입력 또는 삭제 키로 편집 모드 진입
      e.preventDefault();
      const currentValue = tableData[rowIndex]?.[fieldName] || '';
      startEditing(rowIndex, fieldName, currentValue);
      
      // 입력된 키가 문자인 경우 편집 값에 추가
      if (e.key.length === 1) {
        setEditingValue(e.key);
      }
    }
  };

  const handleDoubleClick = (rowIndex: number, fieldName: string) => {
    const currentValue = tableData[rowIndex]?.[fieldName] || '';
    startEditing(rowIndex, fieldName, currentValue);
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

  const getInputType = (type: string) => {
    switch (type) {
      case 'text':
        return 'text';
      case 'number':
        return 'text'; // 화살표 버튼 제거를 위해 text로 변경
      case 'date':
        return 'text'; // 날짜도 text로 처리하여 일관성 유지
      case 'boolean':
        return 'checkbox';
      case 'decimal':
        return 'text'; // 화살표 버튼 제거를 위해 text로 변경
      case 'integer':
        return 'text'; // 화살표 버튼 제거를 위해 text로 변경
      default:
        return 'text';
    }
  };

  const handlePasteFromExcel = () => {
    setShowPasteModal(true);
  };

  const handleProcessPastedData = () => {
    try {
      const rows = pastedData.trim().split('\n');
      if (rows.length === 0) {
        alert('붙여넣을 데이터가 없습니다.');
        return;
      }

      // 필드 순서 확인
      const fieldNames = selectedDatabase?.fields.map(f => f.name) || [];
      const fieldDisplayNames = selectedDatabase?.fields.map(f => f.displayName) || [];
      
      if (fieldNames.length === 0) {
        alert('데이터베이스에 필드가 정의되지 않았습니다.');
        return;
      }

      // 모든 행을 데이터로 처리 (헤더 없음)
      const dataRows = rows.filter(row => row.trim()); // 빈 행 제거
      
      if (dataRows.length === 0) {
        alert('데이터 행이 없습니다.');
        return;
      }

      // 필드 개수와 열 개수 확인
      const firstRowCols = dataRows[0].split('\t').length;
      if (firstRowCols !== fieldNames.length) {
        alert(`경고: 데이터베이스 필드 수(${fieldNames.length}개)와 엑셀 열 수(${firstRowCols}개)가 일치하지 않습니다.\n\n필드 순서: ${fieldDisplayNames.join(' → ')}`);
      }

      const processedData = dataRows.map((row, rowIndex) => {
        const values = row.split('\t');
        const data: { [key: string]: any } = {};
        
        console.log(`Row ${rowIndex}:`, values);
        console.log('Field names:', fieldNames);
        
        // 필드 순서대로 데이터 매핑 (위치 기반)
        fieldNames.forEach((fieldName, colIndex) => {
          let value: any = values[colIndex] || '';
          
          // 필드 타입에 따른 데이터 변환
          const field = selectedDatabase?.fields.find(f => f.name === fieldName);
          if (field) {
            switch (field.type) {
              case 'number':
              case 'decimal':
              case 'integer':
                value = value === '' ? 0 : parseFloat(value) || 0;
                break;
              case 'boolean':
                value = value.toLowerCase() === 'true' || value === '1' || value === 'yes';
                break;
              case 'date':
                value = value === '' ? '' : value;
                break;
              default:
                value = value || '';
            }
          }
          
          data[fieldName] = value;
          console.log(`Field ${fieldName}:`, value);
        });
        
        console.log('Processed row data:', data);
        return data;
      });

      setTableData(processedData);
      setShowPasteModal(false);
      setPastedData('');
      alert(`${processedData.length}행의 데이터가 성공적으로 붙여넣어졌습니다.\n\n필드 순서: ${fieldDisplayNames.join(' → ')}`);
    } catch (e) {
      alert('엑셀 데이터를 붙여넣는 중 오류가 발생했습니다.');
      console.error(e);
    }
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
      const records: any[] = tableData.map(row => {
        const record: { [key: string]: any } = {};
        selectedDatabase.fields.forEach(field => {
          record[field.name] = row[field.name];
        });
        return record;
      });

      await databaseService.addRecords(selectedDatabase.id, records);
      loadDatabases(); // 데이터베이스 목록 다시 로드
      loadTableData(selectedDatabase.id); // 테이블 데이터 다시 로드
      alert('데이터가 성공적으로 저장되었습니다.');
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
                          setSelectedDatabase(database);
                          setShowViewModal(true);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 bg-white rounded-full shadow-sm"
                        title="상세보기"
                      >
                        <Eye className="h-3 w-3" />
                      </button>
                      
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
                        onClick={() => setShowViewModal(true)}
                        className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        <span>상세보기</span>
                      </button>
                      
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
                           onClick={() => handleAddNewRow()}
                           className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                         >
                           <Plus className="h-4 w-4" />
                           <span>행 추가</span>
                         </button>
                         <button
                           onClick={() => handlePasteFromExcel()}
                           className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                         >
                           <span>엑셀 붙여넣기</span>
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
                           disabled={getTableData().length === 0}
                           className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                         >
                           데이터 저장
                         </button>
                       </div>
                     </div>

                    {/* 데이터 테이블 */}
                    <div className="overflow-x-auto border border-gray-300 rounded-lg">
                      <table className="min-w-full bg-white">
                        <thead>
                          {/* 상위 헤더 행 */}
                          <tr className="bg-gray-100 border-b border-gray-300">
                            {/* 체크박스 열 - 상위 헤더에서 2행 병합 */}
                                                         <th rowSpan={2} className="px-3 py-2 text-left text-xs font-medium text-gray-700 tracking-wider border-r border-gray-300 w-12">
                              <input
                                type="checkbox"
                                checked={selectedRows.size === tableData.length && tableData.length > 0}
                                onChange={(e) => handleSelectAll(e.target.checked)}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                              />
                            </th>
                            {/* 번호 열 - 상위 헤더에서 2행 병합 */}
                                                         <th rowSpan={2} className="px-3 py-2 text-left text-xs font-medium text-gray-700 tracking-wider border-r border-gray-300 w-16">
                              #
                            </th>
                                                                                      {/* 상위 헤더 그룹화 */}
                              {(() => {
                                const groups = new Map<string, string[]>();
                                
                                // 모든 필드를 상위 헤더별로 그룹화
                                selectedDatabase.fields.forEach(field => {
                                  const parent = field.parentHeader && field.parentHeader.trim() ? field.parentHeader : 'no-parent';
                                  if (!groups.has(parent)) {
                                    groups.set(parent, []);
                                  }
                                  groups.get(parent)!.push(field.id);
                                });
                                
                                const headerElements: JSX.Element[] = [];
                                
                                // 각 그룹을 렌더링
                                Array.from(groups.entries()).forEach(([parentName, fieldIds]) => {
                                                                     if (parentName === 'no-parent') {
                                     // 상위 헤더가 없는 필드들은 각각 2행 병합 (rowSpan=2)
                                     fieldIds.forEach(fieldId => {
                                       const field = selectedDatabase.fields.find(f => f.id === fieldId);
                                       if (field) {
                                         headerElements.push(
                                           <th 
                                             key={`no-parent-${fieldId}`} 
                                             rowSpan={2}
                                             className="px-3 py-2 text-center text-xs font-medium text-gray-700 tracking-wider border-r border-gray-300 min-w-[120px]"
                                           >
                                             <div className="flex flex-col">
                                               <span className="font-medium">{field.displayName}</span>
                                               {field.unit && (
                                                 <span className="text-xs text-gray-500 font-normal">({field.unit})</span>
                                               )}
                                             </div>
                                           </th>
                                         );
                                       }
                                     });
                                   } else {
                                    // 상위 헤더가 있는 그룹은 colSpan으로 병합
                                    headerElements.push(
                                                                             <th 
                                         key={parentName} 
                                         colSpan={fieldIds.length} 
                                         className="px-3 py-2 text-center text-xs font-medium text-gray-700 tracking-wider border-r border-gray-300"
                                       >
                                        {parentName}
                                      </th>
                                    );
                                  }
                                });
                                
                                return headerElements;
                              })()}
                          </tr>
                          
                                                     {/* 하위 헤더 행 */}
                                                       <tr className="bg-gray-50 border-b border-gray-300">
                              {selectedDatabase.fields.map((field) => {
                                // 상위 헤더가 없는 필드는 이미 rowSpan=2로 상위 헤더에 렌더링되었으므로 건너뜀
                                if (!field.parentHeader || !field.parentHeader.trim()) {
                                  return null;
                                }
                                
                                return (
                                                                  <th 
                                  key={field.id} 
                                  className="px-3 py-2 text-center text-xs font-medium text-gray-700 tracking-wider border-r border-gray-300 min-w-[120px]"
                                >
                                    <div className="flex flex-col">
                                      <span className="font-medium">{field.displayName}</span>
                                      {field.unit && (
                                        <span className="text-xs text-gray-500 font-normal">({field.unit})</span>
                                      )}
                                    </div>
                                  </th>
                                );
                              })}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {getTableData().map((row, rowIndex) => (
                            <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              {/* 체크박스 셀 */}
                              <td className="px-3 py-2 text-center border-r border-gray-300">
                                <input
                                  type="checkbox"
                                  checked={selectedRows.has(rowIndex)}
                                  onChange={(e) => handleSelectRow(rowIndex, e.target.checked)}
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-500 border-r border-gray-300 text-center">
                                {rowIndex + 1}
                              </td>
                                                            {(() => {
                                const cells: JSX.Element[] = [];
                                
                                // 상위 헤더가 있는 그룹별로 처리
                                const groups = new Map<string, string[]>();
                                selectedDatabase.fields.forEach(field => {
                                  const parentKey = field.parentHeader && field.parentHeader.trim() ? field.parentHeader : 'no-parent';
                                  if (!groups.has(parentKey)) {
                                    groups.set(parentKey, []);
                                  }
                                  groups.get(parentKey)!.push(field.id);
                                });
                                
                                // 그룹 순서대로 셀 렌더링
                                Array.from(groups.entries()).forEach(([parentName, fieldIds]) => {
                                  if (parentName === 'no-parent') {
                                    // 상위 헤더가 없는 필드들은 각각 개별적으로 렌더링
                                    fieldIds.forEach(fieldId => {
                                      const field = selectedDatabase.fields.find(f => f.id === fieldId);
                                      if (field) {
                                        cells.push(
                                          <td 
                                            key={field.id} 
                                            className="px-3 py-2 border border-gray-300 cursor-text hover:bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:relative focus:z-[9999] focus:outline focus:outline-2 focus:outline-blue-500 focus:outline-offset-0"
                                            tabIndex={0}
                                            data-row={rowIndex}
                                            data-field={field.name}
                                            onKeyDown={(e) => handleKeyDown(e, rowIndex, field.name)}
                                            onDoubleClick={() => handleDoubleClick(rowIndex, field.name)}
                                            onClick={() => {
                                              // 클릭 시에는 셀 선택만 (편집 모드 아님)
                                              // 편집 모드는 키보드 입력 시작 시 진입
                                            }}
                                          >
                                            {editingCell?.rowIndex === rowIndex && editingCell?.fieldName === field.name ? (
                                              <input
                                                type="text"
                                                value={editingValue}
                                                onChange={(e) => setEditingValue(e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(e, rowIndex, field.name)}
                                                onBlur={finishEditing}
                                                className="w-full h-full px-2 py-1 text-sm border-none bg-transparent focus:outline-none"
                                                autoFocus
                                              />
                                            ) : (
                                              <div className="w-full h-full flex items-center px-2 py-1">
                                                {row[field.name] || ''}
                                              </div>
                                            )}
                                          </td>
                                        );
                                      }
                                    });
                                  } else {
                                    // 상위 헤더가 있는 그룹은 순서대로 렌더링
                                    fieldIds.forEach(fieldId => {
                                      const field = selectedDatabase.fields.find(f => f.id === fieldId);
                                      if (field) {
                                        cells.push(
                                          <td 
                                            key={field.id} 
                                            className="px-3 py-2 border border-gray-300 cursor-text hover:bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:relative focus:z-[9999] focus:outline focus:outline-2 focus:outline-blue-500 focus:outline-offset-0"
                                            tabIndex={0}
                                            data-row={rowIndex}
                                            data-field={field.name}
                                            onKeyDown={(e) => handleKeyDown(e, rowIndex, field.name)}
                                            onDoubleClick={() => handleDoubleClick(rowIndex, field.name)}
                                            onClick={() => {
                                              // 클릭 시에는 셀 선택만 (편집 모드 아님)
                                              // 편집 모드는 키보드 입력 시작 시 진입
                                            }}
                                          >
                                            {editingCell?.rowIndex === rowIndex && editingCell?.fieldName === field.name ? (
                                              <input
                                                type="text"
                                                value={editingValue}
                                                onChange={(e) => setEditingValue(e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(e, rowIndex, field.name)}
                                                onBlur={finishEditing}
                                                className="w-full h-full px-2 py-1 text-sm border-none bg-transparent focus:outline-none"
                                                autoFocus
                                              />
                                            ) : (
                                              <div className="w-full h-full flex items-center px-2 py-1">
                                                {row[field.name] || ''}
                                              </div>
                                            )}
                                          </td>
                                        );
                                      }
                                    });
                                  }
                                });
                                
                                return cells;
                              })()}

                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    

                    {/* 붙여넣기 모달 */}
                    {showPasteModal && (
                      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">엑셀 데이터 붙여넣기</h3>
                            <button
                              onClick={() => setShowPasteModal(false)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="h-6 w-6" />
                            </button>
                          </div>
                          
                          <div className="mb-4">
                            {/* 필드 순서 안내 */}
                            {selectedDatabase && (
                              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <h4 className="text-sm font-medium text-blue-800 mb-2"> 필드 순서 (엑셀 열 순서와 일치해야 함)</h4>
                                <div className="text-xs text-blue-700">
                                                                   {selectedDatabase.fields.map((field, index) => (
                                   <div key={field.id} className="flex items-center space-x-2">
                                     <span className="font-mono bg-blue-100 px-2 py-1 rounded text-blue-800">
                                       {index + 1}
                                     </span>
                                     <span className="font-medium">{field.displayName}</span>
                                     <span className="text-blue-600">({field.name})</span>
                                     {field.parentHeader && field.parentHeader.trim() ? (
                                       <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                                         그룹: {field.parentHeader}
                                       </span>
                                     ) : (
                                       <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                         개별 필드
                                       </span>
                                     )}
                                   </div>
                                 ))}
                                </div>
                              </div>
                            )}
                            
                            <p className="text-sm text-gray-600 mb-2">
                              💡 <strong>사용법:</strong><br/>
                              1. 엑셀에서 <strong>데이터만</strong> 선택 (헤더 제외)<br/>
                              2. 복사 (Ctrl+C)<br/>
                              3. 아래 텍스트 영역에 붙여넣기 (Ctrl+V)<br/>
                              4. 필드 순서가 위와 일치하는지 확인
                            </p>
                            <textarea
                              value={pastedData}
                              onChange={(e) => setPastedData(e.target.value)}
                              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                              placeholder="엑셀 데이터를 여기에 붙여넣으세요... (헤더 제외)"
                            />
                          </div>
                          
                          <div className="flex justify-end space-x-3">
                            <button
                              onClick={() => setShowPasteModal(false)}
                              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                            >
                              취소
                            </button>
                            <button
                              onClick={handleProcessPastedData}
                              disabled={!pastedData.trim()}
                              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              데이터 처리
                            </button>
                          </div>
                        </div>
                      </div>
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
