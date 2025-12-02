import React, { useState } from 'react';
import { PageLayout } from '@inno-spec/ui-lib';
import { FileCode, Upload, FileText, Download, Settings } from 'lucide-react';

const IFCGenerator: React.FC = () => {
  const [inputType, setInputType] = useState<'manual' | 'mct'>('manual');
  const [mctFile, setMctFile] = useState<File | null>(null);
  const [manualData, setManualData] = useState<string>('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setMctFile(file);
    }
  };

  const handleGenerate = () => {
    // TODO: IFC 생성 로직 구현
    console.log('IFC 생성 시작:', { inputType, mctFile, manualData });
    alert('IFC 생성 기능은 개발 중입니다.');
  };

  const handleDownload = () => {
    // TODO: IFC 파일 다운로드 로직 구현
    console.log('IFC 파일 다운로드');
    alert('IFC 다운로드 기능은 개발 중입니다.');
  };

  return (
    <PageLayout>
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <FileCode className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">IFC Generator</h1>
          </div>
          <p className="text-gray-600">
            사용자 입력 값이나 midas Civil의 mct 파일 데이터를 IFC(Industry Foundation Classes) 데이터로 변환합니다.
          </p>
        </div>

        {/* 입력 타입 선택 */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">입력 타입 선택</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setInputType('manual')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                inputType === 'manual'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FileText className="w-5 h-5 inline-block mr-2" />
              수동 입력
            </button>
            <button
              onClick={() => setInputType('mct')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                inputType === 'mct'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Upload className="w-5 h-5 inline-block mr-2" />
              MCT 파일 업로드
            </button>
          </div>
        </div>

        {/* 입력 영역 */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">데이터 입력</h2>
          
          {inputType === 'manual' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                데이터 입력 (JSON, XML, 또는 텍스트 형식)
              </label>
              <textarea
                value={manualData}
                onChange={(e) => setManualData(e.target.value)}
                placeholder="IFC 변환을 위한 데이터를 입력하세요..."
                className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                midas Civil MCT 파일 선택
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <input
                  type="file"
                  accept=".mct"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="mct-file-input"
                />
                <label
                  htmlFor="mct-file-input"
                  className="cursor-pointer inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  파일 선택
                </label>
                {mctFile && (
                  <p className="mt-4 text-sm text-gray-600">
                    선택된 파일: <span className="font-medium">{mctFile.name}</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 설정 영역 */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            변환 설정
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IFC 버전
              </label>
              <select className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="IFC2x3">IFC2x3</option>
                <option value="IFC4" selected>IFC4</option>
                <option value="IFC4x3">IFC4x3</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                좌표계
              </label>
              <select className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="local" selected>로컬 좌표계</option>
                <option value="wgs84">WGS84</option>
                <option value="utm">UTM</option>
              </select>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-4">
          <button
            onClick={handleGenerate}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <FileCode className="w-5 h-5 mr-2" />
            IFC 생성
          </button>
          <button
            onClick={handleDownload}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center"
            disabled
          >
            <Download className="w-5 h-5 mr-2" />
            다운로드
          </button>
        </div>

        {/* 정보 영역 */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">참고사항</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• IFC(Industry Foundation Classes)는 건축 및 건설 산업에서 BIM 데이터를 교환하기 위한 표준 형식입니다.</li>
            <li>• midas Civil의 MCT 파일을 업로드하면 구조물 데이터를 자동으로 추출하여 IFC로 변환합니다.</li>
            <li>• 수동 입력 모드에서는 JSON, XML 또는 텍스트 형식의 데이터를 입력할 수 있습니다.</li>
          </ul>
        </div>
      </div>
    </PageLayout>
  );
};

export default IFCGenerator;

