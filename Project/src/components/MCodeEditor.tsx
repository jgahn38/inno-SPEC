import React, { useState, useEffect } from 'react';
import { MCode, MExecutionResult, TableData } from '../types';
import { MEngineService } from '../services/MEngineService';

interface MCodeEditorProps {
  mCode: MCode;
  tableData?: TableData;
  onCodeChange: (code: string) => void;
  onExecute?: (result: MExecutionResult) => void;
  readOnly?: boolean;
}

const MCodeEditor: React.FC<MCodeEditorProps> = ({
  mCode,
  tableData,
  onCodeChange,
  onExecute,
  readOnly = false
}) => {
  const [code, setCode] = useState(mCode.code);
  const [isExecuting, setIsExecuting] = useState(false);
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; errors: string[] }>({ isValid: true, errors: [] });
  const [executionResult, setExecutionResult] = useState<MExecutionResult | null>(null);

  const mEngineService = MEngineService.getInstance();

  useEffect(() => {
    setCode(mCode.code);
  }, [mCode.code]);

  useEffect(() => {
    // 코드 변경 시 유효성 검사
    const result = mEngineService.validateMCode(code);
    setValidationResult(result);
  }, [code, mEngineService]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    onCodeChange(newCode);
  };

  const handleExecute = async () => {
    if (!tableData) {
      alert('실행할 테이블 데이터가 없습니다.');
      return;
    }

    if (!validationResult.isValid) {
      alert('M 언어 코드에 오류가 있습니다. 수정 후 다시 시도해주세요.');
      return;
    }

    setIsExecuting(true);
    try {
      const updatedMCode: MCode = { ...mCode, code };
      const result = await mEngineService.executeMCode(updatedMCode, tableData);
      setExecutionResult(result);
      
      if (onExecute) {
        onExecute(result);
      }
    } catch (error) {
      console.error('M 코드 실행 중 오류 발생:', error);
      setExecutionResult({
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        executionTime: 0,
        recordsProcessed: 0,
        recordsTransformed: 0
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const insertTemplate = (template: string) => {
    const textarea = document.getElementById('m-code-editor') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newCode = code.substring(0, start) + template + code.substring(end);
      handleCodeChange(newCode);
      
      // 커서 위치 조정
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + template.length, start + template.length);
      }, 0);
    }
  };

  const templates = [
    { 
      name: 'Table.TransformColumns', 
      code: 'let\n    Source = Excel.CurrentWorkbook(){[Name="Table1"]}[Content],\n    #"Transformed Columns" = Table.TransformColumns(Source, {\n        {"project_name", each Text.Upper(_), type text},\n        {"project_code", each Text.Upper(_), type text}\n    })\nin\n    #"Transformed Columns"'
    },
    { 
      name: 'Table.SelectColumns', 
      code: 'let\n    Source = Excel.CurrentWorkbook(){[Name="Table1"]}[Content],\n    #"Removed Other Columns" = Table.SelectColumns(Source, {"project_name", "project_code", "start_date"})\nin\n    #"Removed Other Columns"'
    },
    { 
      name: 'Table.AddColumn', 
      code: 'let\n    Source = Excel.CurrentWorkbook(){[Name="Table1"]}[Content],\n    #"Added Custom" = Table.AddColumn(Source, "Custom", each Text.Upper([project_name]))\nin\n    #"Added Custom"'
    },
    { 
      name: '주석', 
      code: '// 파워쿼리 변환 단계\n'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">M 언어 코드 편집기</h3>
        <div className="flex space-x-2">
          <button
            onClick={handleExecute}
            disabled={isExecuting || !tableData || !validationResult.isValid}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isExecuting ? '실행 중...' : '실행'}
          </button>
        </div>
      </div>

      {/* 코드 편집기 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="m-code-editor" className="block text-sm font-medium text-gray-700">
            M 언어 코드
          </label>
          <div className="flex space-x-1">
            {templates.map((template, index) => (
              <button
                key={index}
                onClick={() => insertTemplate(template.code)}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                title={template.name}
              >
                {template.name}
              </button>
            ))}
          </div>
        </div>
        <textarea
          id="m-code-editor"
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          readOnly={readOnly}
          className="w-full h-64 p-3 border border-gray-300 rounded-md font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="M 언어 코드를 입력하세요..."
        />
      </div>

      {/* 유효성 검사 결과 */}
      {!validationResult.isValid && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <h4 className="text-sm font-medium text-red-800 mb-2">코드 오류</h4>
          <ul className="text-sm text-red-700 space-y-1">
            {validationResult.errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 실행 결과 */}
      {executionResult && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <h4 className="text-sm font-medium text-gray-800 mb-2">실행 결과</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">상태: </span>
              <span className={executionResult.success ? 'text-green-600' : 'text-red-600'}>
                {executionResult.success ? '성공' : '실패'}
              </span>
            </div>
            <div>
              <span className="font-medium">실행 시간: </span>
              <span>{executionResult.executionTime}ms</span>
            </div>
            <div>
              <span className="font-medium">처리된 레코드: </span>
              <span>{executionResult.recordsProcessed}</span>
            </div>
            <div>
              <span className="font-medium">변환된 레코드: </span>
              <span>{executionResult.recordsTransformed}</span>
            </div>
          </div>
          {executionResult.error && (
            <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-red-700 text-sm">
              오류: {executionResult.error}
            </div>
          )}
        </div>
      )}

      {/* 도움말 */}
      <div className="text-sm text-gray-600">
        <h4 className="font-medium mb-2">파워쿼리 M 언어 지원:</h4>
        <ul className="space-y-1">
          <li>• <code className="bg-gray-100 px-1 rounded">Table.TransformColumns</code> - 컬럼 변환</li>
          <li>• <code className="bg-gray-100 px-1 rounded">Table.SelectColumns</code> - 컬럼 선택</li>
          <li>• <code className="bg-gray-100 px-1 rounded">Table.AddColumn</code> - 컬럼 추가</li>
          <li>• <code className="bg-gray-100 px-1 rounded">Text.Upper/Lower</code> - 텍스트 변환</li>
          <li>• <code className="bg-gray-100 px-1 rounded">Number.Round</code> - 숫자 변환</li>
          <li>• <code className="bg-gray-100 px-1 rounded">let/in</code> - 변수 및 표현식</li>
        </ul>
        <p className="mt-2 text-xs text-gray-500">
          엑셀 파워쿼리에서 복사한 M 언어 코드를 그대로 붙여넣어 사용할 수 있습니다.
        </p>
      </div>
    </div>
  );
};

export default MCodeEditor;
