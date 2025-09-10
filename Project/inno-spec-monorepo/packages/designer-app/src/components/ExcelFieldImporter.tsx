import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { TableField, FieldType } from '../types';
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react';

interface ExcelFieldImporterProps {
  onImport: (fields: TableField[]) => void;
  onClose: () => void;
}

interface ExcelFieldData {
  name: string;
  displayName: string;
  type: string;
  description?: string;
  options?: string;
  defaultValue?: string;
}

const ExcelFieldImporter: React.FC<ExcelFieldImporterProps> = ({ onImport, onClose }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [importedFields, setImportedFields] = useState<TableField[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 샘플 엑셀 파일 다운로드
  const downloadSampleExcel = () => {
    const sampleData: ExcelFieldData[] = [
      {
        name: 'bridge_name',
        displayName: '교량명',
        type: 'text',
        description: '교량의 이름'
      },
      {
        name: 'span_length',
        displayName: '경간장',
        type: 'number',
        description: '교량의 경간 길이 (m)'
      },
      {
        name: 'width',
        displayName: '폭',
        type: 'number',
        description: '교량의 폭 (m)'
      },
      {
        name: 'height',
        displayName: '높이',
        type: 'number',
        description: '교량의 높이 (m)'
      },
      {
        name: 'construction_date',
        displayName: '시공일',
        type: 'date',
        description: '교량 시공일'
      },
      {
        name: 'is_active',
        displayName: '활성상태',
        type: 'boolean',
        description: '교량의 활성 상태'
      },
      {
        name: 'bridge_type',
        displayName: '교량형식',
        type: 'list',
        description: '교량의 구조 형식',
        options: 'I형교, T형교, 박스교, 아치교, 사장교',
        defaultValue: 'I형교'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '필드목록');

    // 컬럼 너비 설정
    const columnWidths = [
      { wch: 20 }, // name
      { wch: 15 }, // displayName
      { wch: 15 }, // type
      { wch: 30 }, // description
      { wch: 40 }, // options
      { wch: 20 }  // defaultValue
    ];
    worksheet['!cols'] = columnWidths;

    XLSX.writeFile(workbook, '필드_샘플.xlsx');
  };

  // 엑셀 파일 파싱
  const parseExcelFile = (file: File): Promise<ExcelFieldData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // 첫 번째 행이 헤더인지 확인
          const headers = jsonData[0] as string[];
          const expectedHeaders = ['name', 'displayName', 'type', 'description', 'options', 'defaultValue'];
          
          if (!expectedHeaders.every(header => headers.includes(header))) {
            throw new Error('엑셀 파일의 컬럼이 올바르지 않습니다. 샘플 파일을 다운로드하여 참고하세요.');
          }
          
          // 데이터 파싱 (헤더 제외)
          const fieldData: ExcelFieldData[] = (jsonData.slice(1) as any[]).map((row: any[], index: number) => {
            const [name, displayName, type, description, options, defaultValue] = row;
            
            if (!name || !displayName || !type) {
              throw new Error(`${index + 2}번째 행: 필수 컬럼(name, displayName, type)이 비어있습니다.`);
            }
            
            return {
              name: String(name).trim(),
              displayName: String(displayName).trim(),
              type: String(type).trim(),
              description: description ? String(description).trim() : undefined,
              options: options ? String(options).trim() : undefined,
              defaultValue: defaultValue ? String(defaultValue).trim() : undefined
            };
          });
          
          resolve(fieldData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
      reader.readAsArrayBuffer(file);
    });
  };

  // 필드 타입 검증 및 변환
  const validateAndConvertField = (data: ExcelFieldData, index: number): TableField | null => {
    const errors: string[] = [];
    
    // 필드명 검증 (영문, 숫자, 언더스코어만 허용)
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(data.name)) {
      errors.push(`${index + 2}번째 행: 필드명은 영문으로 시작하고 영문, 숫자, 언더스코어만 사용할 수 있습니다.`);
    }
    
    // 표시명 검증
    if (data.displayName.length === 0) {
      errors.push(`${index + 2}번째 행: 표시명은 필수입니다.`);
    }
    
    // 타입 검증
    const validTypes: FieldType[] = ['text', 'number', 'date', 'boolean', 'decimal', 'integer', 'list'];
    if (!validTypes.includes(data.type as FieldType)) {
      errors.push(`${index + 2}번째 행: 지원하지 않는 타입입니다. (${validTypes.join(', ')})`);
    }
    
    // list 타입일 때 options 검증
    if (data.type === 'list' && (!data.options || data.options.trim() === '')) {
      errors.push(`${index + 2}번째 행: list 타입일 때는 options가 필수입니다.`);
    }
    
    if (errors.length > 0) {
      setErrors(prev => [...prev, ...errors]);
      return null;
    }
    
    // options 파싱 (쉼표로 구분된 문자열을 배열로 변환)
    const options = data.type === 'list' && data.options 
      ? data.options.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0)
      : undefined;

    // defaultValue 파싱
    let parsedDefaultValue = data.defaultValue;
    if (parsedDefaultValue) {
      if (data.type === 'boolean') {
        parsedDefaultValue = parsedDefaultValue.toLowerCase() === 'true' ? 'true' : 'false';
      } else if (data.type === 'number' || data.type === 'integer' || data.type === 'decimal') {
        parsedDefaultValue = String(parseFloat(parsedDefaultValue));
      }
    }

    return {
      id: `field-${Date.now()}-${index}`,
      name: data.name,
      displayName: data.displayName,
      type: data.type as FieldType,
      required: false,
      description: data.description || '',
      options: options,
      defaultValue: parsedDefaultValue
    };
  };

  // 파일 선택 처리
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrors([]);
    setImportedFields([]);

    try {
      const fieldData = await parseExcelFile(file);
      const validFields: TableField[] = [];
      
      fieldData.forEach((data, index) => {
        const field = validateAndConvertField(data, index);
        if (field) {
          validFields.push(field);
        }
      });
      
      setImportedFields(validFields);
      setShowPreview(true);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : '파일 처리 중 오류가 발생했습니다.']);
    } finally {
      setIsProcessing(false);
    }
  };

  // 임포트 실행
  const handleImport = () => {
    if (importedFields.length > 0) {
      onImport(importedFields);
      onClose();
    }
  };

  // 파일 선택 버튼 클릭
  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">필드 일괄 등록</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* 샘플 파일 다운로드 */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center mb-2">
              <FileSpreadsheet className="h-5 w-5 text-blue-600 mr-2" />
              <h4 className="text-sm font-medium text-blue-900">샘플 파일 다운로드</h4>
            </div>
            <p className="text-sm text-blue-700 mb-3">
              엑셀 파일 형식을 확인하고 참고할 수 있도록 샘플 파일을 다운로드하세요.
            </p>
            <button
              onClick={downloadSampleExcel}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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
          {showPreview && importedFields.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <h4 className="text-sm font-medium text-green-900">
                  {importedFields.length}개의 필드가 성공적으로 파싱되었습니다.
                </h4>
              </div>
              
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        필드명
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        표시명
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        타입
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        옵션
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        기본값
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        설명
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {importedFields.map((field, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {field.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {field.displayName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {field.type}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {field.options ? field.options.join(', ') : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {field.defaultValue !== undefined && field.defaultValue !== '' ? String(field.defaultValue) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {field.description || '-'}
                        </td>
                      </tr>
                    ))}
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
              disabled={importedFields.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Upload className="h-4 w-4" />
              <span>등록 ({importedFields.length}개)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelFieldImporter;
