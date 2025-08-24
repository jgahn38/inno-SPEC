import React, { useState, useEffect } from 'react';
import { DataSyncService, SyncOptions } from '../services/DataSyncService';
import { Download, Upload, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface SyncStatus {
  lastSync: string | null;
  isOutdated: boolean;
}

const DataSyncManager: React.FC = () => {
  const [syncService] = useState(() => DataSyncService.getInstance());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ lastSync: null, isOutdated: true });
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [exportOptions, setExportOptions] = useState<SyncOptions>({
    includeDatabases: true,
    includeProjects: true,
    includeTableSchemas: true,
    includeRecords: true
  });

  useEffect(() => {
    updateSyncStatus();
  }, []);

  const updateSyncStatus = () => {
    const status = syncService.getSyncStatus();
    setSyncStatus(status);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      syncService.exportToFile(exportOptions);
      setMessage({ type: 'success', text: '데이터가 성공적으로 export되었습니다.' });
      updateSyncStatus();
    } catch (error) {
      setMessage({ type: 'error', text: `Export 실패: ${error}` });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const result = await syncService.importFromFile(file);
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        updateSyncStatus();
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Import 실패: ${error}` });
    } finally {
      setIsImporting(false);
      // 파일 input 초기화
      event.target.value = '';
    }
  };

  // handleCreateBackup 함수 제거 - handleExport와 동일한 기능

  const formatLastSync = (lastSync: string | null) => {
    if (!lastSync) return '동기화된 적 없음';
    return new Date(lastSync).toLocaleString('ko-KR');
  };

  const clearMessage = () => {
    setMessage(null);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">데이터 동기화 관리</h2>
        <button
          onClick={updateSyncStatus}
          className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
          title="동기화 상태 새로고침"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>
      
      {/* 디버깅용 정보 */}
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-sm text-yellow-800">
          🐛 디버깅: DataSyncManager 컴포넌트가 정상적으로 렌더링되었습니다.
        </p>
      </div>

      {/* 동기화 상태 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          {syncStatus.isOutdated ? (
            <AlertCircle className="w-5 h-5 text-yellow-500" />
          ) : (
            <CheckCircle className="w-5 h-5 text-green-500" />
          )}
          <span className="font-medium">동기화 상태</span>
        </div>
        <p className="text-sm text-gray-600">
          마지막 동기화: {formatLastSync(syncStatus.lastSync)}
        </p>
        {syncStatus.isOutdated && (
          <p className="text-sm text-yellow-600 mt-1">
            ⚠️ 24시간 이상 동기화되지 않았습니다. 최신 데이터로 업데이트하세요.
          </p>
        )}
      </div>

      {/* 메시지 */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
          'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          <div className="flex items-center justify-between">
            <span>{message.text}</span>
            <button
              onClick={clearMessage}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Export 섹션 */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">데이터 Export</h3>
        
        {/* Export 옵션 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={exportOptions.includeDatabases}
              onChange={(e) => setExportOptions(prev => ({ ...prev, includeDatabases: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <span className="text-sm">데이터베이스</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={exportOptions.includeProjects}
              onChange={(e) => setExportOptions(prev => ({ ...prev, includeProjects: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <span className="text-sm">프로젝트</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={exportOptions.includeTableSchemas}
              onChange={(e) => setExportOptions(prev => ({ ...prev, includeTableSchemas: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <span className="text-sm">테이블 스키마</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={exportOptions.includeRecords}
              onChange={(e) => setExportOptions(prev => ({ ...prev, includeRecords: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <span className="text-sm">데이터 레코드</span>
          </label>
        </div>

        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="w-4 h-4" />
          {isExporting ? 'Exporting...' : '데이터 Export'}
        </button>
      </div>

      {/* Import 섹션 */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">데이터 Import</h3>
        
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            {isImporting ? 'Importing...' : '파일 선택'}
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              disabled={isImporting}
            />
          </label>
          
          <span className="text-sm text-gray-600">
            JSON 파일을 선택하여 데이터를 import하세요
          </span>
        </div>
      </div>

      {/* Git 백업 안내 섹션 */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Git 백업 안내</h3>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-3">
          <p className="text-sm text-gray-600 mb-2">
            위의 "데이터 Export" 기능을 사용하여 백업 파일을 생성하고 git에 commit할 수 있습니다.
          </p>
          <p className="text-xs text-gray-500">
            💡 사용법: 데이터 Export → git add → git commit → git push → 다른 컴퓨터에서 git pull → 데이터 Import
          </p>
        </div>
      </div>

      {/* 사용 가이드 */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">💡 회사/집 데이터 동기화 가이드</h4>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. <strong>회사에서:</strong> 데이터 수정 후 "데이터 Export" 클릭</li>
          <li>2. <strong>Git 작업:</strong> 생성된 파일을 git add, commit, push</li>
          <li>3. <strong>집에서:</strong> git pull로 최신 백업 파일 다운로드</li>
          <li>4. <strong>데이터 복원:</strong> 백업 파일을 "데이터 Import"로 복원</li>
        </ol>
      </div>
    </div>
  );
};

export default DataSyncManager;
