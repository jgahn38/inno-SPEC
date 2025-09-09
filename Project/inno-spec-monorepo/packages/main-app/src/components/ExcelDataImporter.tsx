import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react';

interface ExcelDataImporterProps {
  onImport: (data: any[]) => void;
  onClose: () => void;
  fields: Array<{
    name: string;
    displayName: string;
    type: string;
    unit?: string;
  }>;
}

interface ExcelDataRow {
  [key: string]: any;
}

const ExcelDataImporter: React.FC<ExcelDataImporterProps> = ({ onImport, onClose, fields }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [importedData, setImportedData] = useState<ExcelDataRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 샘플 엑셀 파일 다운로드
  const downloadSampleExcel = () => {
    // 필드 정보를 기반으로 샘플 데이터 생성
    // sampleData는 현재 사용되지 않음

    // 헤더와 샘플 데이터를 결합
    const headers = fields.map(f => f.displayName);
    const sampleRow = fields.map(f => {
      let sampleValue = '';
      switch (f.type) {
        case 'text':
          sampleValue = `샘플_${f.displayName}`;
          break;
        case 'number':
        case 'decimal':
        case 'integer':
          sampleValue = '100';
          break;
        case 'date':
          sampleValue = '2024-01-01';
          break;
        case 'boolean':
          sampleValue = 'true';
          break;
        default:
          sampleValue = '샘플값';
      }
      return sampleValue;
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '데이터');

    // 컬럼 너비 설정
    const columnWidths = fields.map(field => ({ wch: Math.max(15, field.displayName.length + 5) }));
    worksheet['!cols'] = columnWidths;

    XLSX.writeFile(workbook, '데이터_샘플.xlsx');
  };

  // 엑셀 파일 파싱
  const parseExcelFile = (file: File): Promise<ExcelDataRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length < 2) {
            throw new Error('데이터가 없습니다. 최소 1행의 데이터가 필요합니다.');
          }

          // 첫 번째 행이 헤더인지 확인
          const headers = jsonData[0] as string[];
          const expectedHeaders = fields.map(f => f.displayName);
          
          // 헤더가 일치하는지 확인 (순서는 상관없음)
          const missingHeaders = expectedHeaders.filter(expected => 
            !headers.some(header => header === expected)
          );
          
          if (missingHeaders.length > 0) {
            throw new Error(`다음 컬럼이 누락되었습니다: ${missingHeaders.join(', ')}`);
          }

          // 데이터 파싱 (헤더 제외)
          const dataRows: ExcelDataRow[] = (jsonData.slice(1) as any[])
            .filter((row: any[]) => {
              // 빈 행 필터링: 모든 셀이 비어있거나 undefined인 행 제거
              return row && row.some(cell => cell !== undefined && cell !== null && cell !== '');
            })
            .map((row: any[]) => {
              const dataRow: ExcelDataRow = {};
              
              // 각 필드에 대해 데이터 매핑
              fields.forEach(field => {
                const headerIndex = headers.findIndex(header => header === field.displayName);
                let value = row[headerIndex] || '';
                
                // 필드 타입에 따른 데이터 변환
                switch (field.type) {
                  case 'number':
                  case 'decimal':
                  case 'integer':
                    value = value === '' ? 0 : parseFloat(value) || 0;
                    break;
                  case 'boolean':
                    value = value === 'true' || value === '1' || value === 'yes' || value === true;
                    break;
                  case 'date':
                    value = value === '' ? '' : String(value);
                    break;
                  default:
                    value = value === '' ? '' : String(value);
                }
                
                dataRow[field.name] = value;
              });
              
              return dataRow;
            });
          
          resolve(dataRows);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
      reader.readAsArrayBuffer(file);
    });
  };

  // 파일 선택 처리
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrors([]);
    setImportedData([]);

    try {
      const data = await parseExcelFile(file);
      setImportedData(data);
      setShowPreview(true);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : '파일 처리 중 오류가 발생했습니다.']);
    } finally {
      setIsProcessing(false);
    }
  };

  // 임포트 실행
  const handleImport = () => {
    if (importedData.length > 0) {
      onImport(importedData);
      onClose();
    }
  };

  // 파일 선택 버튼 클릭
  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">데이터 일괄 등록</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* 필드 정보 안내 */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center mb-2">
              <FileSpreadsheet className="h-5 w-5 text-blue-600 mr-2" />
              <h4 className="text-sm font-medium text-blue-900">필드 정보</h4>
            </div>
            <p className="text-sm text-blue-700 mb-3">
              엑셀 파일의 컬럼은 다음 필드와 일치해야 합니다:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {fields.map((field, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <span className="font-mono bg-blue-100 px-2 py-1 rounded text-blue-800">
                    {index + 1}
                  </span>
                  <span className="font-medium">{field.displayName}</span>
                  <span className="text-blue-600">({field.name})</span>
                  {field.unit && (
                    <span className="text-xs text-gray-600">[{field.unit}]</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 샘플 파일 다운로드 */}
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <div className="flex items-center mb-2">
              <FileSpreadsheet className="h-5 w-5 text-green-600 mr-2" />
              <h4 className="text-sm font-medium text-green-900">샘플 파일 다운로드</h4>
            </div>
            <p className="text-sm text-green-700 mb-3">
              엑셀 파일 형식을 확인하고 참고할 수 있도록 샘플 파일을 다운로드하세요.
            </p>
            <button
              onClick={downloadSampleExcel}
              className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>샘플 파일 다운로드</span>
            </button>
          </div>

          {/* 파일 선택 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              엑셀 파일 선택
            </label>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSelectFile}
                disabled={isProcessing}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="h-4 w-4" />
                <span>{isProcessing ? '처리 중...' : '파일 선택'}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              {fileInputRef.current?.files?.[0] && (
                <span className="text-sm text-gray-600">
                  {fileInputRef.current.files[0].name}
                </span>
              )}
            </div>
          </div>

          {/* 오류 메시지 */}
          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg">
              <div className="flex items-center mb-2">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <h4 className="text-sm font-medium text-red-900">오류 발생</h4>
              </div>
              <ul className="text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 미리보기 */}
          {showPreview && importedData.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <h4 className="text-sm font-medium text-green-900">
                  {importedData.length}개의 데이터가 성공적으로 파싱되었습니다.
                </h4>
              </div>
              
              <div className="border border-gray-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        #
                      </th>
                      {fields.map((field, index) => (
                        <th key={index} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {field.displayName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {importedData.slice(0, 10).map((row, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {index + 1}
                        </td>
                        {fields.map((field, fieldIndex) => (
                          <td key={fieldIndex} className="px-4 py-3 text-sm text-gray-900">
                            {row[field.name] !== undefined && row[field.name] !== '' 
                              ? String(row[field.name]) 
                              : '-'
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                    {importedData.length > 10 && (
                      <tr>
                        <td colSpan={fields.length + 1} className="px-4 py-3 text-sm text-gray-500 text-center">
                          ... 및 {importedData.length - 10}개 더
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleImport}
              disabled={importedData.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Upload className="h-4 w-4" />
              <span>등록 ({importedData.length}개)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelDataImporter;
