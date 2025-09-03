import React, { useState, useEffect } from 'react';
import { Eye, Settings, Download, RotateCcw, Plus, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { CADParserService, CADData, CADEntity, LayerInfo } from '../services/CADParserService';
import LayerSelectionModal from './LayerSelectionModal';

interface SectionParameter {
  key: string;
  label: string;
  type: string;
  unit: string;
  default: number;
  min: number;
  max: number;
  ui: {
    control: string;
    order: number;
  };
}

interface SectionLibrary {
  id: string;
  name: string;
  version: string;
  category: string;
  parameters: SectionParameter[];
  derived: Array<{
    key: string;
    label: string;
    unit: string;
    expr: string;
  }>;
  constraints: Array<{
    expr: string;
    message: string;
    severity: string;
  }>;
  geometry: {
    draw_ops: Array<{
      op: string;
      args: any;
      save_as?: string;
    }>;
  };
}

const IllustrationView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'library' | 'cad'>('library');
  const [sectionData, setSectionData] = useState<SectionLibrary | null>(null);
  const [parameters, setParameters] = useState<Record<string, number>>({});
  const [derivedValues, setDerivedValues] = useState<Record<string, number>>({});
  const [constraintResults, setConstraintResults] = useState<Array<{
    message: string;
    severity: string;
    isValid: boolean;
  }>>([]);
  const [viewMode, setViewMode] = useState<'front' | 'side' | 'top'>('front');
  const [availableSections, setAvailableSections] = useState<Array<{id: string, name: string, filename: string}>>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [parameterSearchTerm, setParameterSearchTerm] = useState<string>('');
  const [parameterSortBy, setParameterSortBy] = useState<'order' | 'name' | 'value'>('order');
  const [parameterSortDirection, setParameterSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // CAD 파일 업로드 관련 상태
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [detectedSection, setDetectedSection] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // CAD 렌더링 및 선택 관련 상태
  const [cadData, setCadData] = useState<CADData | null>(null);
  const [selectedLines, setSelectedLines] = useState<Array<{id: string, start: [number, number], end: [number, number]}>>([]);
  const [isSelectingLines, setIsSelectingLines] = useState(false);
  const [cadViewMode, setCadViewMode] = useState<'2d' | '3d'>('2d');
  const [cadZoom, setCadZoom] = useState(1);
  const [cadPan, setCadPan] = useState<[number, number]>([0, 0]);
  
  // 레이어 선택 관련 상태
  const [showLayerSelection, setShowLayerSelection] = useState(false);
  const [availableLayers, setAvailableLayers] = useState<LayerInfo[]>([]);
  const [selectedLayers, setSelectedLayers] = useState<string[]>([]);
  
  // CAD 파서 서비스
  const [cadParserService] = useState(() => CADParserService.getInstance());

  useEffect(() => {
    // 사용 가능한 section 파일들 로드
    const loadAvailableSections = async () => {
      try {
        console.log('Fetching sections from API...');
        
        // 서버 API에서 section 목록을 가져옴
        const response = await fetch('/api/sections');
        console.log('API Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`API request failed with status: ${response.status}`);
        }
        
        const sections = await response.json();
        console.log('API Response data:', sections);
        
        setAvailableSections(sections);
        
        // 기본값으로 첫 번째 section 선택
        if (sections.length > 0) {
          setSelectedSectionId(sections[0].id);
          loadSectionData(sections[0].filename);
        }
      } catch (error) {
        console.error('Failed to load available sections:', error);
        
        // API 실패 시 fallback으로 각 JSON 파일에서 직접 name을 읽어옴
        console.log('Using fallback sections with direct JSON loading...');
        
        const fallbackFiles = [
          { id: 'boxgirder_singlecell', filename: 'boxgirder_singlecell.json' },
          { id: 'solid_rectangle', filename: 'solid_rectangle.json' }
        ];
        
        // 각 JSON 파일에서 직접 name을 로드
        const fallbackSections = await Promise.all(
          fallbackFiles.map(async (file) => {
            try {
              const response = await fetch(`/section_library/${file.filename}`);
              if (response.ok) {
                const data = await response.json();
                return {
                  id: file.id,
                  name: data.name || file.filename,
                  filename: file.filename
                };
              } else {
                return {
                  id: file.id,
                  name: file.filename,
                  filename: file.filename
                };
              }
            } catch (error) {
              console.warn(`Failed to load ${file.filename}:`, error);
              return {
                id: file.id,
                name: file.filename,
                filename: file.filename
              };
            }
          })
        );
        
        setAvailableSections(fallbackSections);
        
        if (fallbackSections.length > 0) {
          setSelectedSectionId(fallbackSections[0].id);
          loadSectionData(fallbackSections[0].filename);
        }
      }
    };

    loadAvailableSections();
  }, []);

  const loadSectionData = async (filename: string) => {
    try {
      const response = await fetch(`/section_library/${filename}`);
      const data: SectionLibrary = await response.json();
      setSectionData(data);
      
      // 기본값으로 파라미터 초기화
      const initialParams: Record<string, number> = {};
      data.parameters.forEach(param => {
        initialParams[param.key] = param.default;
      });
      setParameters(initialParams);
      calculateDerivedValues(initialParams);
      validateConstraints(initialParams);
    } catch (error) {
      console.error('Failed to load section data:', error);
    }
  };

  const handleSectionChange = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    const section = availableSections.find(s => s.id === sectionId);
    if (section) {
      loadSectionData(section.filename);
    }
  };

  // CAD 파일 업로드 핸들러
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const validateAndSetFile = (file: File) => {
    setUploadError(null);
    setUploadSuccess(false);
    
    // 파일 크기 검증 (50MB)
    if (file.size > 50 * 1024 * 1024) {
      setUploadError('파일 크기가 50MB를 초과합니다.');
      return;
    }

    // 파일 형식 검증 (현재는 DWG만 지원)
    const allowedTypes = ['.dwg'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(fileExtension)) {
      setUploadError('지원하지 않는 파일 형식입니다. 현재 지원 형식: ' + allowedTypes.join(', '));
      return;
    }

    setUploadedFile(file);
  };

  const uploadFile = async () => {
    if (!uploadedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      // FormData 생성
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('type', 'section');

      // 업로드 진행률 시뮬레이션
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // 파일 업로드 API 호출 (실제 구현 시 서버 엔드포인트로 변경)
      const response = await fetch('/api/upload-cad', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const result = await response.json();
        setUploadSuccess(true);
        setDetectedSection(result.section);
        
        // 성공 후 2초 뒤에 진행 상태 초기화
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 2000);
      } else {
        throw new Error('파일 업로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다.');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const processUploadedFile = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    setUploadError(null);

    try {
      // CAD 파서 서비스 초기화 확인
      const status = cadParserService.getStatus();
      console.log('CAD Parser Service Status:', status);

      // 현재는 DWG 파일만 지원
      if (uploadedFile.name.toLowerCase().endsWith('.dwg')) {
        console.log('DWG 파일 레이어 정보 추출 시작...');
        
        // 먼저 레이어 정보 추출
        const layerResult = await cadParserService.extractLayerInfo(uploadedFile);
        
        if (layerResult.success && layerResult.layers.length > 0) {
          console.log('레이어 정보 추출 성공:', layerResult.layers);
          setAvailableLayers(layerResult.layers);
          setShowLayerSelection(true);
          setIsProcessing(false);
        } else {
          throw new Error(layerResult.error || '레이어 정보 추출에 실패했습니다.');
        }
      } else {
        throw new Error('지원하지 않는 파일 형식입니다. DWG 파일을 사용해주세요.');
      }

    } catch (error) {
      console.error('CAD 파일 처리 오류:', error);
      setUploadError(error instanceof Error ? error.message : '파일 처리 중 오류가 발생했습니다.');
      setIsProcessing(false);
    }
  };

  const handleLayerSelectionConfirm = async (selectedLayerNames: string[]) => {
    if (!uploadedFile) return;

    setSelectedLayers(selectedLayerNames);
    setShowLayerSelection(false);
    setIsProcessing(true);

    try {
      console.log('선택된 레이어로 DWG 파일 파싱 시작:', selectedLayerNames);
      
      const parseResult = await cadParserService.parseDWGFile(uploadedFile, selectedLayerNames);

      if (parseResult.success && parseResult.data) {
        console.log('CAD 파일 파싱 성공:', parseResult.data);
        console.log('총 엔티티 수:', parseResult.data.entities.length);
        console.log('엔티티 타입별 분류:', {
          line: parseResult.data.entities.filter(e => e.type === 'line').length,
          circle: parseResult.data.entities.filter(e => e.type === 'circle').length,
          arc: parseResult.data.entities.filter(e => e.type === 'arc').length,
          polyline: parseResult.data.entities.filter(e => e.type === 'polyline').length,
          text: parseResult.data.entities.filter(e => e.type === 'text').length,
          dimension: parseResult.data.entities.filter(e => e.type === 'dimension').length
        });
        
        setCadData(parseResult.data);
        setUploadSuccess(true);
        setIsProcessing(false);
        
        // CAD 렌더링 모드로 전환
        setActiveTab('cad');
        setUploadSuccess(false);
      } else {
        throw new Error(parseResult.error || '파일 파싱에 실패했습니다.');
      }

    } catch (error) {
      console.error('CAD 파일 파싱 오류:', error);
      setUploadError(error instanceof Error ? error.message : '파일 파싱 중 오류가 발생했습니다.');
      setIsProcessing(false);
    }
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setUploadError(null);
    setUploadSuccess(false);
    setDetectedSection(null);
    setCadData(null);
    setSelectedLines([]);
    setUploadProgress(0);
    setIsUploading(false);
    setIsProcessing(false);
  };

  // 선택된 선을 기반으로 단면 생성
  const createSectionFromSelectedLines = () => {
    if (selectedLines.length === 0) {
      alert('단면으로 사용할 선을 선택해주세요.');
      return;
    }

    // 선택된 선들을 기반으로 단면 파라미터 생성
    const bounds = calculateBounds(selectedLines);
    const width = bounds.max[0] - bounds.min[0];
    const height = bounds.max[1] - bounds.min[1];

    const generatedSection = {
      id: `cad-generated-${Date.now()}`,
      name: `CAD_${uploadedFile?.name.replace(/\.[^/.]+$/, '') || 'Generated'}`,
      version: '1.0',
      category: 'custom',
      parameters: [
        {
          key: 'width',
          label: '폭',
          type: 'number',
          unit: 'mm',
          default: Math.round(width),
          min: Math.round(width * 0.5),
          max: Math.round(width * 2),
          ui: { control: 'input', order: 1 }
        },
        {
          key: 'height',
          label: '높이',
          type: 'number',
          unit: 'mm',
          default: Math.round(height),
          min: Math.round(height * 0.5),
          max: Math.round(height * 2),
          ui: { control: 'input', order: 2 }
        }
      ],
      derived: [
        {
          key: 'area',
          label: '단면적',
          unit: 'mm²',
          expr: 'width * height'
        },
        {
          key: 'perimeter',
          label: '둘레',
          unit: 'mm',
          expr: '2 * (width + height)'
        }
      ],
      constraints: [
        {
          expr: 'width > 0 && height > 0',
          message: '폭과 높이는 0보다 커야 합니다.',
          severity: 'error'
        }
      ],
      geometry: {
        draw_ops: [
          { op: 'rectangle', args: { width: 'width', height: 'height' } }
        ]
      }
    };

    setSectionData(generatedSection);
    
    // 파라미터 초기화
    const initialParams: Record<string, number> = {};
    generatedSection.parameters.forEach(param => {
      initialParams[param.key] = param.default;
    });
    setParameters(initialParams);
    calculateDerivedValues(initialParams);
    validateConstraints(initialParams);

    // 단면 라이브러리 탭으로 전환
    setActiveTab('library');
  };

  // 선택된 선들의 경계 계산
  const calculateBounds = (lines: Array<{id: string, start: [number, number], end: [number, number]}>) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    lines.forEach(line => {
      minX = Math.min(minX, line.start[0], line.end[0]);
      minY = Math.min(minY, line.start[1], line.end[1]);
      maxX = Math.max(maxX, line.start[0], line.end[0]);
      maxY = Math.max(maxY, line.start[1], line.end[1]);
    });

    return { min: [minX, minY], max: [maxX, maxY] };
  };

  // 선 선택/해제 토글
  const toggleLineSelection = (lineId: string) => {
    setSelectedLines(prev => {
      const isSelected = prev.some(line => line.id === lineId);
      if (isSelected) {
        return prev.filter(line => line.id !== lineId);
      } else {
        const line = cadData?.entities.find((e: any) => e.id === lineId);
        if (line && line.type === 'line') {
          return [...prev, { id: line.id, start: line.start, end: line.end }];
        }
        return prev;
      }
    });
  };

  const getSortedAndFilteredParameters = () => {
    if (!sectionData) return [];
    
    let filteredParams = sectionData.parameters;
    
    // 검색 필터링
    if (parameterSearchTerm) {
      filteredParams = filteredParams.filter(param => 
        param.label.toLowerCase().includes(parameterSearchTerm.toLowerCase()) ||
        param.key.toLowerCase().includes(parameterSearchTerm.toLowerCase())
      );
    }
    
    // 정렬
    filteredParams.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (parameterSortBy) {
        case 'order':
          aValue = a.ui.order;
          bValue = b.ui.order;
          break;
        case 'name':
          aValue = a.label;
          bValue = b.label;
          break;
        case 'value':
          aValue = parameters[a.key] || 0;
          bValue = parameters[b.key] || 0;
          break;
        default:
          aValue = a.ui.order;
          bValue = b.ui.order;
      }
      
      if (parameterSortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filteredParams;
  };

  const handleSort = (sortBy: 'order' | 'name' | 'value') => {
    if (parameterSortBy === sortBy) {
      setParameterSortDirection(parameterSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setParameterSortBy(sortBy);
      setParameterSortDirection('asc');
    }
  };

  // 공통 좌표축 렌더링 함수
  const renderCoordinateSystem = (originX: number, originY: number) => {
    return (
      <>
        {/* 배경 그리드 */}
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="500" height="400" fill="url(#grid)" />
        
        {/* 좌표축 - 가장 높은 우선순위로 렌더링 */}
        <line x1={originX - 150} y1={originY} x2={originX + 150} y2={originY} stroke="#333" strokeWidth="4" />
        <line x1={originX} y1={originY - 150} x2={originX} y2={originY + 150} stroke="#333" strokeWidth="4" />
        
        {/* 좌표축 화살표 */}
        <polygon points={`${originX + 150},${originY} ${originX + 140},${originY - 10} ${originX + 140},${originY + 10}`} fill="#333" />
        <polygon points={`${originX},${originY - 150} ${originX - 10},${originY - 140} ${originX + 10},${originY - 140}`} fill="#333" />
        
        {/* 좌표축 라벨 */}
        <text x={originX + 170} y={originY + 10} fontSize="18" fill="#000" fontWeight="bold">X (mm)</text>
        <text x={originX - 10} y={originY - 170} fontSize="18" fill="#000" fontWeight="bold">Y (mm)</text>
        
        {/* Origin 점 표시 */}
        <circle cx={originX} cy={originY} r="8" fill="#ff0000" stroke="#fff" strokeWidth="4" />
        <text x={originX + 30} y={originY + 30} fontSize="16" fill="#ff0000" fontWeight="bold">Origin (0,0)</text>
      </>
    );
  };

  const calculateDerivedValues = (params: Record<string, number>) => {
    if (!sectionData) return;

    const derived: Record<string, number> = {};
    sectionData.derived.forEach(item => {
      try {
        // 간단한 수식 계산 (실제로는 더 복잡한 수식 파서가 필요)
        let expr = item.expr;
        
        // 모든 파라미터를 동적으로 치환
        Object.keys(params).forEach(key => {
          const regex = new RegExp(key, 'g');
          expr = expr.replace(regex, params[key]?.toString() || '0');
        });
        
        derived[item.key] = eval(expr);
      } catch (error) {
        console.warn(`Failed to calculate derived value for ${item.key}:`, error);
        derived[item.key] = 0;
      }
    });
    setDerivedValues(derived);
  };

  const validateConstraints = (params: Record<string, number>) => {
    if (!sectionData) return;

    const results = sectionData.constraints.map(constraint => {
      try {
        let expr = constraint.expr;
        
        // 모든 파라미터를 동적으로 치환
        Object.keys(params).forEach(key => {
          const regex = new RegExp(key, 'g');
          expr = expr.replace(regex, params[key]?.toString() || '0');
        });
        
        const isValid = eval(expr);
        return {
          message: constraint.message,
          severity: constraint.severity,
          isValid
        };
      } catch (error) {
        console.warn(`Failed to validate constraint: ${constraint.expr}`, error);
        return {
          message: `제약조건 검증 실패: ${constraint.expr}`,
          severity: 'error',
          isValid: false
        };
      }
    });
    setConstraintResults(results);
  };

  const updateParameter = (key: string, value: number) => {
    const newParams = { ...parameters, [key]: value };
    setParameters(newParams);
    calculateDerivedValues(newParams);
    validateConstraints(newParams);
  };

  const resetParameters = () => {
    if (!sectionData) return;
    
    const initialParams: Record<string, number> = {};
    sectionData.parameters.forEach(param => {
      initialParams[param.key] = param.default;
    });
    setParameters(initialParams);
    calculateDerivedValues(initialParams);
    validateConstraints(initialParams);
  };

  const renderSectionPreview = () => {
    if (!sectionData || !parameters) return null;

    // section 타입에 따라 다른 렌더링 로직 적용
    if (sectionData.id === 'section.solid.rectangle.v1') {
      return renderRectangleSection();
    } else {
      return renderBoxGirderSection();
    }
  };

  const renderRectangleSection = () => {
    const { B, H } = parameters;
    
    if (!B || !H) return null;

    const scale = Math.min(400 / B, 300 / H);
    const centerX = 250;
    const centerY = 200;
    
    // Geometry의 Origin 위치 계산 (JSON의 local_cs.origin 기준)
    // fallback: sectionData가 없거나 origin이 정의되지 않은 경우 centerX, centerY 사용
    let originX, originY;
    if (sectionData?.geometry?.local_cs?.origin) {
      originX = centerX + sectionData.geometry.local_cs.origin[0] * scale;
      originY = centerY - sectionData.geometry.local_cs.origin[1] * scale;
    } else {
      originX = centerX;
      originY = centerY;
    }
    
    console.log('Rectangle Section Debug:', {
      B, H, scale, centerX, centerY, originX, originY,
      sectionData: sectionData?.geometry?.local_cs
    });

    return (
      <div className="relative bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 flex items-center justify-center">
        <svg width="500" height="400" viewBox="0 0 500 400">
          {/* 공통 좌표축 렌더링 */}
          {renderCoordinateSystem(originX, originY)}
          
          {/* 직사각형 단면 */}
          <rect
            x={centerX - (B * scale) / 2}
            y={centerY - (H * scale) / 2}
            width={B * scale}
            height={H * scale}
            fill="#e0e0e0"
            stroke="#3b82f6"
            strokeWidth="2"
          />
          
          {/* 치수선 */}
          <g stroke="#666" strokeWidth="1">
            {/* 높이 치수 */}
            <line x1={centerX - (B * scale) / 2 - 20} y1={centerY - (H * scale) / 2} 
                  x2={centerX - (B * scale) / 2 - 20} y2={centerY + (H * scale) / 2} />
            <line x1={centerX - (B * scale) / 2 - 25} y1={centerY - (H * scale) / 2} 
                  x2={centerX - (B * scale) / 2 - 15} y2={centerY - (H * scale) / 2} />
            <line x1={centerX - (B * scale) / 2 - 25} y1={centerY + (H * scale) / 2} 
                  x2={centerX - (B * scale) / 2 - 15} y2={centerY + (H * scale) / 2} />
            <text x={centerX - (B * scale) / 2 - 35} y={centerY} fontSize="12" fill="#666" textAnchor="middle">
              H = {H}mm
            </text>
            
            {/* 폭 치수 */}
            <line x1={centerX - (B * scale) / 2} y1={centerY + (H * scale) / 2 + 20} 
                  x2={centerX + (B * scale) / 2} y2={centerY + (H * scale) / 2 + 20} />
            <line x1={centerX - (B * scale) / 2} y1={centerY + (H * scale) / 2 + 15} 
                  x2={centerX - (B * scale) / 2} y2={centerY + (H * scale) / 2 + 25} />
            <line x1={centerX + (B * scale) / 2} y1={centerY + (H * scale) / 2 + 15} 
                  x2={centerX + (B * scale) / 2} y2={centerY + (H * scale) / 2 + 25} />
            <text x={centerX} y={centerY + (B * scale) / 2 + 40} fontSize="12" fill="#666" textAnchor="middle">
              B = {B}mm
            </text>
          </g>
          
          {/* 단면 정보 */}
          <text x={centerX} y={centerY - (H * scale) / 2 - 10} fontSize="10" fill="#666" textAnchor="middle">
            실체 직사각형 단면
          </text>
        </svg>
      </div>
    );
  };

  const renderBoxGirderSection = () => {
    const { B, H, tw, tt, tb, cw } = parameters;
    
    if (!B || !H || !tw || !tt || !tb || !cw) return null;

    const scale = Math.min(400 / B, 300 / H);
    const centerX = 250;
    const centerY = 200;
    
    // Geometry의 Origin 위치 계산 (JSON의 local_cs.origin 기준)
    const originX = centerX + (sectionData.geometry.local_cs?.origin?.[0] || 0) * scale;
    const originY = centerY - (sectionData.geometry.local_cs?.origin?.[1] || 0) * scale;

    return (
      <div className="relative bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 flex items-center justify-center">
        <svg width="500" height="400" viewBox="0 0 500 400">
          {/* 공통 좌표축 렌더링 */}
          {renderCoordinateSystem(originX, originY)}
          
          {/* 외부 박스 */}
          <rect
            x={centerX - (B * scale) / 2}
            y={centerY - (H * scale) / 2}
            width={B * scale}
            height={H * scale}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
          />
          
          {/* 내부 박스 (웹 제외) */}
          <rect
            x={centerX - (cw * scale) / 2}
            y={centerY - (H * scale) / 2 + (tt * scale)}
            width={cw * scale}
            height={(H - tt - tb) * scale}
            fill="none"
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeDasharray="5,5"
          />
          
          {/* 웹 (복부판) */}
          <rect
            x={centerX - (tw * scale) / 2}
            y={centerY - (H * scale) / 2}
            width={tw * scale}
            height={H * scale}
            fill="rgba(59, 130, 246, 0.3)"
            stroke="#3b82f6"
            strokeWidth="1"
          />
          
          {/* 치수선 */}
          <g stroke="#666" strokeWidth="1">
            {/* 높이 치수 */}
            <line x1={centerX - (B * scale) / 2 - 20} y1={centerY - (H * scale) / 2} 
                  x2={centerX - (B * scale) / 2 - 20} y2={centerY + (H * scale) / 2} />
            <line x1={centerX - (B * scale) / 2 - 25} y1={centerY - (H * scale) / 2} 
                  x2={centerX - (B * scale) / 2 - 15} y2={centerY - (H * scale) / 2} />
            <line x1={centerX - (B * scale) / 2 - 25} y1={centerY + (H * scale) / 2} 
                  x2={centerX - (B * scale) / 2 - 15} y2={centerY + (H * scale) / 2} />
            <text x={centerX - (B * scale) / 2 - 35} y={centerY} fontSize="12" fill="#666" textAnchor="middle">
              H = {H}mm
            </text>
            
            {/* 폭 치수 */}
            <line x1={centerX - (B * scale) / 2} y1={centerY + (H * scale) / 2 + 20} 
                  x2={centerX + (B * scale) / 2} y2={centerY + (H * scale) / 2 + 20} />
            <line x1={centerX - (B * scale) / 2} y1={centerY + (H * scale) / 2 + 15} 
                  x2={centerX - (B * scale) / 2} y2={centerY + (H * scale) / 2 + 25} />
            <line x1={centerX + (B * scale) / 2} y1={centerY + (H * scale) / 2 + 15} 
                  x2={centerX + (B * scale) / 2} y2={centerY + (H * scale) / 2 + 25} />
            <text x={centerX} y={centerY + (H * scale) / 2 + 40} fontSize="12" fill="#666" textAnchor="middle">
              B = {B}mm
            </text>
          </g>
          
          {/* 주요 치수 표시 */}
          <text x={centerX} y={centerY - (H * scale) / 2 - 10} fontSize="10" fill="#666" textAnchor="middle">
            tw={tw}mm, tt={tt}mm, tb={tb}mm
          </text>
        </svg>
      </div>
    );
  };

  if (!sectionData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">섹션 라이브러리를 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* 탭 네비게이션 */}
        <div className="px-6 pt-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('library')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'library'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📚 단면 라이브러리
            </button>
            <button
              onClick={() => setActiveTab('cad')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'cad'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🎨 CAD 파일 불러오기
            </button>
          </nav>
        </div>
      </div>

      {/* 단면 라이브러리 탭 */}
      {activeTab === 'library' && (
        <>
          <div className="px-6 py-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">단면 - {sectionData.name}</h2>
              <p className="text-sm text-gray-600">단면의 파라미터를 조정하고 형상을 미리보기하세요.</p>
                
                {/* Section 선택 콤보박스 */}
                <div className="mt-3">
                  <label htmlFor="section-select" className="block text-sm font-medium text-gray-700 mb-1">
                    단면 유형 선택
                  </label>
                  <select
                    id="section-select"
                    value={selectedSectionId}
                    onChange={(e) => handleSectionChange(e.target.value)}
                    className="block w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {availableSections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={resetParameters}
                  className="flex items-center space-x-2 px-3 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>기본값 복원</span>
                </button>
                <button className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  <Download className="h-4 w-4" />
                  <span>도면 저장</span>
                </button>
              </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 파라미터 입력 패널 */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">단면 파라미터</h3>
            </div>
          </div>
          
          <div className="p-4">
            {/* 검색 및 필터링 */}
            <div className="mb-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="파라미터 검색..."
                    value={parameterSearchTerm}
                    onChange={(e) => setParameterSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="text-sm text-gray-500">
                  {getSortedAndFilteredParameters().length} / {sectionData.parameters.length} 파라미터
                </div>
              </div>
            </div>
            
            {/* 엑셀과 같은 테이블 형식의 파라미터 입력 */}
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('order')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>순서</span>
                        {parameterSortBy === 'order' && (
                          <span className="text-blue-600">
                            {parameterSortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>파라미터</span>
                        {parameterSortBy === 'name' && (
                          <span className="text-blue-600">
                            {parameterSortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('value')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>값</span>
                        {parameterSortBy === 'value' && (
                          <span className="text-blue-600">
                            {parameterSortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      단위
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      범위
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      설명
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getSortedAndFilteredParameters().map((param, index) => (
                      <tr key={param.key} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-sm font-medium text-gray-900">
                            {param.ui.order}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {param.label}
                          </div>
                          <div className="text-xs text-gray-500">
                            {param.key}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            value={parameters[param.key] || ''}
                            onChange={(e) => updateParameter(param.key, parseFloat(e.target.value) || 0)}
                            min={param.min}
                            max={param.max}
                            step="1"
                            className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {param.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs text-gray-600">
                            <div>최소: {param.min.toLocaleString()}</div>
                            <div>최대: {param.max.toLocaleString()}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          기본값: {param.default.toLocaleString()} {param.unit}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            
            {/* 빠른 액션 버튼들 */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={resetParameters}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>기본값 복원</span>
                </button>
                <button
                  onClick={() => {
                    const newParams = { ...parameters };
                    Object.keys(newParams).forEach(key => {
                      const param = sectionData.parameters.find(p => p.key === key);
                      if (param) {
                        newParams[key] = param.min;
                      }
                    });
                    setParameters(newParams);
                    calculateDerivedValues(newParams);
                    validateConstraints(newParams);
                  }}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <span>최소값 설정</span>
                </button>
                <button
                  onClick={() => {
                    const newParams = { ...parameters };
                    Object.keys(newParams).forEach(key => {
                      const param = sectionData.parameters.find(p => p.key === key);
                      if (param) {
                        newParams[key] = param.max;
                      }
                    });
                    setParameters(newParams);
                    calculateDerivedValues(newParams);
                    validateConstraints(newParams);
                  }}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <span>최대값 설정</span>
                </button>
              </div>
              
              <div className="text-sm text-gray-500">
                총 {sectionData.parameters.length}개 파라미터
              </div>
            </div>
          </div>
        </div>

        {/* 미리보기 패널 */}
        <div className="bg-white rounded-lg border border-gray-200 lg:col-span-2">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">단면 미리보기</h3>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setViewMode('front')}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    viewMode === 'front' 
                      ? 'bg-blue-100 text-blue-700 font-medium' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  정면도
                </button>
                <button
                  onClick={() => setViewMode('side')}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    viewMode === 'side' 
                      ? 'bg-blue-100 text-blue-700 font-medium' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  측면도
                </button>
                <button
                  onClick={() => setViewMode('top')}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    viewMode === 'top' 
                      ? 'bg-blue-100 text-blue-700 font-medium' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  평면도
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            <div className="min-h-[400px] flex items-center justify-center">
              {renderSectionPreview()}
            </div>
          </div>
        </div>
      </div>

        {/* 파생값 및 제약조건 패널 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 파생값 */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">계산된 값</h3>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {sectionData.derived.map(item => (
                  <div key={item.key} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {derivedValues[item.key]?.toFixed(2) || '0.00'} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 제약조건 검증 */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">제약조건 검증</h3>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {constraintResults.map((result, index) => (
                  <div key={index} className={`flex items-center space-x-2 p-2 rounded-md ${
                    result.isValid 
                      ? 'bg-green-50 border border-green-200' 
                      : result.severity === 'error'
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                    {result.isValid ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`text-sm ${
                      result.isValid 
                        ? 'text-green-800' 
                        : result.severity === 'error'
                        ? 'text-red-800'
                        : 'text-yellow-800'
                    }`}>
                      {result.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </>
      )}

      {/* CAD 파일 불러오기 탭 */}
      {activeTab === 'cad' && (
        <div className="px-6 py-8">
          {!cadData ? (
            // 파일 업로드 화면
            <div className="text-center">
              <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 2v7a1 1 0 001 1h7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">CAD 파일 불러오기</h3>
              <p className="text-gray-600 mb-6">
                AutoCAD (.dwg), SketchUp (.skp), 또는 기타 CAD 파일을 불러와서 단면을 정의하세요.
              </p>
              
              {/* 파일 업로드 영역 */}
              <div className="max-w-md mx-auto">
                {!uploadedFile ? (
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                    onDrop={handleFileDrop}
                    onDragOver={handleDragOver}
                    onClick={() => document.getElementById('file-input')?.click()}
                  >
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-blue-600 hover:text-blue-500">파일을 클릭하여 선택</span>하거나
                      </p>
                      <p className="text-sm text-gray-500">드래그 앤 드롭으로 파일을 업로드하세요</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      지원 형식: .dwg, .dxf, .skp, .3ds, .obj (최대 50MB)
                    </p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-6 bg-white">
                    <div className="flex items-center space-x-3 mb-4">
                      <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                        <p className="text-sm text-gray-500">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    
                    {uploadError && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-800">{uploadError}</p>
                      </div>
                    )}

                    {uploadSuccess && (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-800">파일이 성공적으로 처리되었습니다!</p>
                      </div>
                    )}

                    <div className="flex space-x-3">
                      <button
                        onClick={processUploadedFile}
                        disabled={isProcessing}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isProcessing ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            처리 중...
                          </span>
                        ) : (
                          'CAD 파일 로드'
                        )}
                      </button>
                      <button
                        onClick={resetUpload}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}

                {/* 숨겨진 파일 입력 */}
                <input
                  id="file-input"
                  type="file"
                  accept=".dwg,.dxf,.skp,.3ds,.obj,.stl,.iges,.step"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* 진행 상태 표시 */}
              {(isUploading || isProcessing) && (
                <div className="mt-6 max-w-md mx-auto">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {isUploading ? '파일 업로드 중...' : 'CAD 파일 처리 중...'}
                      </span>
                      <span className="text-sm text-gray-500">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 text-sm text-gray-500">
                <p>• CAD 파일을 업로드하면 화면에 렌더링됩니다</p>
                <p>• 단면으로 사용할 선을 직접 클릭하여 선택하세요</p>
                <p>• 선택된 선들을 기반으로 단면 파라미터가 자동 생성됩니다</p>
              </div>
            </div>
          ) : (
            // CAD 렌더링 및 선 선택 화면
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">CAD 파일: {cadData.name}</h3>
                  <p className="text-sm text-gray-600">단면으로 사용할 선을 클릭하여 선택하세요</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setCadViewMode(cadViewMode === '2d' ? '3d' : '2d')}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    {cadViewMode === '2d' ? '3D 보기' : '2D 보기'}
                  </button>
                  <button
                    onClick={resetUpload}
                    className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    새 파일
                  </button>
                </div>
              </div>

              {/* CAD 뷰어 */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">CAD 뷰어</h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>선택된 선: {selectedLines.length}개</span>
                      <span>•</span>
                      <span>레이어: {cadData.layers.join(', ')}</span>
                    </div>
                  </div>
                  
                  {/* CAD 데이터 디버깅 정보 */}
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>
                        총 {cadData.entities.length}개 객체 | 
                        선: {cadData.entities.filter(e => e.type === 'line').length}개 | 
                        원: {cadData.entities.filter(e => e.type === 'circle').length}개 | 
                        호: {cadData.entities.filter(e => e.type === 'arc').length}개 | 
                        폴리라인: {cadData.entities.filter(e => e.type === 'polyline').length}개 | 
                        텍스트: {cadData.entities.filter(e => e.type === 'text').length}개 | 
                        치수: {cadData.entities.filter(e => e.type === 'dimension').length}개
                      </span>
                      <span>
                        뷰포트: ({cadData.bounds.min[0].toFixed(0)}, {cadData.bounds.min[1].toFixed(0)}) ~ 
                        ({cadData.bounds.max[0].toFixed(0)}, {cadData.bounds.max[1].toFixed(0)})
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="relative bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                    {/* CAD 렌더링 영역 */}
                    <div className="relative" style={{ width: '100%', height: '500px' }}>
                      <svg
                        width="100%"
                        height="100%"
                        viewBox={`${cadData.bounds.min[0] - 50} ${cadData.bounds.min[1] - 50} ${cadData.bounds.max[0] - cadData.bounds.min[0] + 100} ${cadData.bounds.max[1] - cadData.bounds.min[1] + 100}`}
                        className="cursor-crosshair"
                      >
                        {/* 그리드 */}
                        <defs>
                          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                        
                        {/* CAD 엔티티 렌더링 */}
                        {cadData.entities.map((entity: CADEntity) => {
                          const isSelected = selectedLines.some(line => line.id === entity.id);
                          
                          switch (entity.type) {
                            case 'line':
                              if (entity.start && entity.end) {
                                return (
                                  <g key={entity.id}>
                                    <line
                                      x1={entity.start[0]}
                                      y1={entity.start[1]}
                                      x2={entity.end[0]}
                                      y2={entity.end[1]}
                                      stroke={isSelected ? '#3b82f6' : '#374151'}
                                      strokeWidth={isSelected ? 3 : 1}
                                      className="cursor-pointer hover:stroke-blue-500"
                                      onClick={() => toggleLineSelection(entity.id)}
                                    />
                                    {isSelected && (
                                      <>
                                        <circle
                                          cx={entity.start[0]}
                                          cy={entity.start[1]}
                                          r="4"
                                          fill="#3b82f6"
                                        />
                                        <circle
                                          cx={entity.end[0]}
                                          cy={entity.end[1]}
                                          r="4"
                                          fill="#3b82f6"
                                        />
                                      </>
                                    )}
                                  </g>
                                );
                              }
                              break;

                            case 'circle':
                              if (entity.center && entity.radius) {
                                return (
                                  <g key={entity.id}>
                                    <circle
                                      cx={entity.center[0]}
                                      cy={entity.center[1]}
                                      r={entity.radius}
                                      fill="none"
                                      stroke={isSelected ? '#3b82f6' : '#374151'}
                                      strokeWidth={isSelected ? 2 : 1}
                                      className="cursor-pointer hover:stroke-blue-500"
                                      onClick={() => toggleLineSelection(entity.id)}
                                    />
                                    {isSelected && (
                                      <circle
                                        cx={entity.center[0]}
                                        cy={entity.center[1]}
                                        r="4"
                                        fill="#3b82f6"
                                      />
                                    )}
                                  </g>
                                );
                              }
                              break;

                            case 'arc':
                              if (entity.center && entity.radius && entity.startAngle !== undefined && entity.endAngle !== undefined) {
                                // 호를 여러 개의 선분으로 근사
                                const steps = 20;
                                const points = [];
                                
                                for (let i = 0; i <= steps; i++) {
                                  const angle = entity.startAngle + (entity.endAngle - entity.startAngle) * (i / steps);
                                  const x = entity.center[0] + entity.radius * Math.cos(angle);
                                  const y = entity.center[1] + entity.radius * Math.sin(angle);
                                  points.push([x, y]);
                                }
                                
                                return (
                                  <g key={entity.id}>
                                    {points.slice(1).map((point, index) => (
                                      <line
                                        key={`${entity.id}-${index}`}
                                        x1={points[index][0]}
                                        y1={points[index][1]}
                                        x2={point[0]}
                                        y2={point[1]}
                                        stroke={isSelected ? '#3b82f6' : '#374151'}
                                        strokeWidth={isSelected ? 2 : 1}
                                        className="cursor-pointer hover:stroke-blue-500"
                                      />
                                    ))}
                                    {isSelected && (
                                      <circle
                                        cx={entity.center[0]}
                                        cy={entity.center[1]}
                                        r="4"
                                        fill="#3b82f6"
                                      />
                                    )}
                                  </g>
                                );
                              }
                              break;

                            case 'polyline':
                              if (entity.vertices && entity.vertices.length > 1) {
                                const points = entity.vertices;
                                return (
                                  <g key={entity.id}>
                                    {points.slice(1).map((point, index) => (
                                      <line
                                        key={`${entity.id}-${index}`}
                                        x1={points[index][0]}
                                        y1={points[index][1]}
                                        x2={point[0]}
                                        y2={point[1]}
                                        stroke={isSelected ? '#3b82f6' : '#374151'}
                                        strokeWidth={isSelected ? 2 : 1}
                                        className="cursor-pointer hover:stroke-blue-500"
                                      />
                                    ))}
                                    {entity.closed && points.length > 2 && (
                                      <line
                                        x1={points[points.length - 1][0]}
                                        y1={points[points.length - 1][1]}
                                        x2={points[0][0]}
                                        y2={points[0][1]}
                                        stroke={isSelected ? '#3b82f6' : '#374151'}
                                        strokeWidth={isSelected ? 2 : 1}
                                        className="cursor-pointer hover:stroke-blue-500"
                                      />
                                    )}
                                    {isSelected && points.map((point, index) => (
                                      <circle
                                        key={`${entity.id}-point-${index}`}
                                        cx={point[0]}
                                        cy={point[1]}
                                        r="3"
                                        fill="#3b82f6"
                                      />
                                    ))}
                                  </g>
                                );
                              }
                              break;

                            case 'text':
                              if (entity.position && entity.text) {
                                return (
                                  <g key={entity.id}>
                                    <text
                                      x={entity.position[0]}
                                      y={entity.position[1]}
                                      fontSize={entity.height || 12}
                                      fill="#374151"
                                      textAnchor="middle"
                                      dominantBaseline="middle"
                                      transform={`rotate(${entity.rotation || 0} ${entity.position[0]} ${entity.position[1]})`}
                                    >
                                      {entity.text}
                                    </text>
                                  </g>
                                );
                              }
                              break;

                            case 'dimension':
                              if (entity.definitionPoint && entity.textPosition && entity.measurement !== undefined) {
                                return (
                                  <g key={entity.id}>
                                    <line
                                      x1={entity.definitionPoint[0]}
                                      y1={entity.definitionPoint[1]}
                                      x2={entity.textPosition[0]}
                                      y2={entity.textPosition[1]}
                                      stroke="#666"
                                      strokeWidth={1}
                                      strokeDasharray="5,5"
                                    />
                                    <text
                                      x={entity.textPosition[0]}
                                      y={entity.textPosition[1]}
                                      fontSize={10}
                                      fill="#666"
                                      textAnchor="middle"
                                      dominantBaseline="middle"
                                    >
                                      {entity.measurement.toFixed(2)}
                                    </text>
                                  </g>
                                );
                              }
                              break;

                            default:
                              console.warn(`지원하지 않는 엔티티 타입: ${entity.type}`);
                              return null;
                          }
                          
                          return null;
                        })}
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* 선택된 선 정보 및 단면 생성 */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="px-4 py-3 border-b border-gray-200">
                  <h4 className="font-medium text-gray-900">선택된 선 정보</h4>
                </div>
                <div className="p-4">
                  {selectedLines.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">선택된 선이 없습니다. CAD 뷰어에서 선을 클릭하여 선택하세요.</p>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedLines.map((line, index) => (
                          <div key={line.id} className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-blue-900">선 {index + 1}</span>
                              <button
                                onClick={() => toggleLineSelection(line.id)}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                선택 해제
                              </button>
                            </div>
                            <div className="text-xs text-blue-700">
                              <p>시작점: ({line.start[0].toFixed(1)}, {line.start[1].toFixed(1)})</p>
                              <p>끝점: ({line.end[0].toFixed(1)}, {line.end[1].toFixed(1)})</p>
                              <p>길이: {Math.sqrt(Math.pow(line.end[0] - line.start[0], 2) + Math.pow(line.end[1] - line.start[1], 2)).toFixed(1)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="border-t pt-4">
                        <button
                          onClick={createSectionFromSelectedLines}
                          className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
                        >
                          선택된 선으로 단면 생성
                        </button>
                        <p className="text-xs text-gray-500 text-center mt-2">
                          선택된 선들을 기반으로 단면 파라미터가 자동 생성됩니다
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 레이어 선택 모달 */}
      <LayerSelectionModal
        isOpen={showLayerSelection}
        layers={availableLayers}
        fileName={uploadedFile?.name || ''}
        onClose={() => {
          setShowLayerSelection(false);
          setIsProcessing(false);
        }}
        onConfirm={handleLayerSelectionConfirm}
      />
      </div>
    </div>
  );
};

export default IllustrationView;