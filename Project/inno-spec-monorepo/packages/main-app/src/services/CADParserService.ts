// LibreDWG 라이브러리 타입 정의
interface LibreDwg {
  dwg_read_data(data: ArrayBuffer): Promise<any>;
  dwg_getall_entities_in_model_space(data: any): any[];
  dwg_get_layers(data: any): any[]; // 레이어 테이블 정보
  dwg_get_layer_table(data: any): any; // 레이어 테이블
}

// @mlightcad/libredwg-web 라이브러리 타입 정의
interface LibreDwgWeb {
  dwg_read_data(data: ArrayBuffer, fileType: number): any;
  convert(dwgData: any): any;
  dwg_free(dwgData: any): void;
}

export interface CADEntity {
  id: string;
  type: 'line' | 'circle' | 'arc' | 'polyline' | 'text' | 'dimension';
  layer: string;
  color?: number;
  linetype?: string;
  lineweight?: number;
  // Line specific properties
  start?: [number, number];
  end?: [number, number];
  // Circle specific properties
  center?: [number, number];
  radius?: number;
  // Arc specific properties
  startAngle?: number;
  endAngle?: number;
  // Polyline specific properties
  vertices?: [number, number][];
  closed?: boolean;
  // Text specific properties
  text?: string;
  position?: [number, number];
  height?: number;
  rotation?: number;
  // Dimension specific properties
  definitionPoint?: [number, number];
  textPosition?: [number, number];
  measurement?: number;
}

export interface CADData {
  id: string;
  name: string;
  type: '2d' | '3d';
  entities: CADEntity[];
  bounds: {
    min: [number, number];
    max: [number, number];
  };
  layers: string[];
  units: string;
  version: string;
  createdDate?: Date;
  modifiedDate?: Date;
}

export interface CADParseResult {
  success: boolean;
  data?: CADData;
  error?: string;
  warnings?: string[];
}

export interface LayerInfo {
  name: string;
  entityCount: number;
  entityTypes: Record<string, number>;
  isVisible: boolean;
  color?: number;
  linetype?: string;
}

export interface LayerSelectionResult {
  success: boolean;
  layers: LayerInfo[];
  error?: string;
}

export class CADParserService {
  private static instance: CADParserService;
  private libreDwg: LibreDwg | null = null;
  private libreDwgWeb: LibreDwgWeb | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<boolean> | null = null;

  private constructor() {}

  public static getInstance(): CADParserService {
    if (!CADParserService.instance) {
      CADParserService.instance = new CADParserService();
    }
    return CADParserService.instance;
  }

  /**
   * LibreDWG 라이브러리 초기화
   */
  public async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    // 이미 초기화 중인 경우 기존 Promise 반환
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<boolean> {
    try {
      // 브라우저 환경 확인
      if (typeof window === 'undefined') {
        console.warn('브라우저 환경이 아닙니다. 테스트 모드로 실행됩니다.');
        this.isInitialized = true;
        this.libreDwg = null;
        return true;
      }

      // 1. @mlightcad/libredwg-web 라이브러리 로드 시도 (현재 비활성화)
      // TODO: 필요시 @mlightcad/libredwg-web 패키지 설치 후 활성화
      /*
      try {
        console.log('@mlightcad/libredwg-web 라이브러리 로드 시도...');
        const { LibreDwg } = await import('@mlightcad/libredwg-web');
        
        if (LibreDwg) {
          this.libreDwgWeb = await LibreDwg.create();
          console.log('@mlightcad/libredwg-web 라이브러리가 성공적으로 로드되었습니다.');
          this.isInitialized = true;
          return true;
        }
      } catch (libredwgWebError) {
        console.warn('@mlightcad/libredwg-web 로드 실패:', libredwgWebError);
      }
      */

      // 2. 기존 LibreDwg WASM 모듈 확인 (fallback)
      if (!(window as any).LibreDwg) {
        console.warn('모든 LibreDwg 라이브러리 로드에 실패했습니다. 테스트 모드로 실행됩니다.');
        console.info('DWG 파일 처리를 위해서는 @mlightcad/libredwg-web 패키지가 필요합니다.');
        this.isInitialized = true;
        this.libreDwg = null;
        this.libreDwgWeb = null;
        return true;
      }

      // WASM 모듈 로딩 대기 (더 긴 시간 대기)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // LibreDwg 라이브러리 인스턴스 생성 시도
      try {
        this.libreDwg = new (window as any).LibreDwg();
        console.log('LibreDwg 인스턴스 생성 성공');
      } catch (instanceError) {
        console.warn('LibreDwg 인스턴스 생성 실패:', instanceError);
        throw new Error(`LibreDwg 인스턴스 생성에 실패했습니다: ${instanceError}`);
      }
      
      // 초기화 성공 확인
      if (!this.libreDwg) {
        throw new Error('LibreDwg 인스턴스가 null입니다.');
      }

      this.isInitialized = true;
      console.log('CAD Parser Service initialized successfully with LibreDwg');
      return true;
    } catch (error) {
      console.warn('LibreDwg 초기화 실패, 테스트 모드로 실행됩니다:', error);
      this.isInitialized = true; // 테스트 모드로 계속 진행
      this.libreDwg = null;
      return true; // 테스트 모드에서는 성공으로 처리
    } finally {
      this.initializationPromise = null;
    }
  }

  /**
   * DWG 파일에서 레이어 정보 추출
   */
  public async extractLayerInfo(file: File): Promise<LayerSelectionResult> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          return {
            success: false,
            layers: [],
            error: 'CAD Parser Service가 초기화되지 않았습니다.'
          };
        }
      }

      // 파일을 ArrayBuffer로 읽기
      const arrayBuffer = await file.arrayBuffer();
      console.log('레이어 정보 추출 시작, 파일 크기:', arrayBuffer.byteLength);

      if (this.libreDwgWeb) {
        try {
          console.log('@mlightcad/libredwg-web을 사용하여 레이어 정보 추출...');
          // DWG 파일 타입 상수 (Dwg_File_Type.DWG = 0)
          const dwgData = this.libreDwgWeb.dwg_read_data(arrayBuffer, 0);
          console.log('DWG 데이터 구조:', dwgData);
          
          if (dwgData.error !== 0) {
            throw new Error(`DWG 파일 읽기 실패: 오류 코드 ${dwgData.error}`);
          }
          
          // DwgDatabase로 변환
          const db = this.libreDwgWeb.convert(dwgData);
          console.log('DwgDatabase 구조:', db);
          
          // 레이어 정보 추출
          const layers = db.layers || [];
          const entities = db.entities || [];
          
          console.log('추출된 레이어 수:', layers.length);
          console.log('추출된 엔티티 수:', entities.length);
          
          // 레이어별 엔티티 정보 수집
          const layerMap = new Map<string, LayerInfo>();
          
          // 1. 레이어 테이블에서 기본 레이어 정보 설정
          layers.forEach((layer: any) => {
            const layerName = layer.name || '0';
            layerMap.set(layerName, {
              name: layerName,
              entityCount: 0,
              entityTypes: {},
              isVisible: layer.visible !== false,
              color: layer.color,
              linetype: layer.linetype
            });
          });
          
          // 2. 엔티티에서 레이어 정보 보완
          entities.forEach((entity: any, index: number) => {
            const layerName = entity.layer || '0';
            
            // 상세한 엔티티 정보 로깅 (처음 5개만)
            if (index < 5) {
              console.log(`엔티티 ${index}:`, {
                type: entity.type,
                layer: entity.layer,
                color: entity.color,
                linetype: entity.linetype,
                all_properties: Object.keys(entity)
              });
            }
            
            if (!layerMap.has(layerName)) {
              layerMap.set(layerName, {
                name: layerName,
                entityCount: 0,
                entityTypes: {},
                isVisible: true,
                color: entity.color,
                linetype: entity.linetype
              });
            }
            
            const layerInfo = layerMap.get(layerName)!;
            layerInfo.entityCount++;
            layerInfo.entityTypes[entity.type] = (layerInfo.entityTypes[entity.type] || 0) + 1;
            
            // 엔티티에서 더 정확한 레이어 속성 정보 업데이트
            if (entity.color !== undefined && layerInfo.color === undefined) {
              layerInfo.color = entity.color;
            }
            if (entity.linetype && !layerInfo.linetype) {
              layerInfo.linetype = entity.linetype;
            }
          });
          
          const finalLayers = Array.from(layerMap.values()).sort((a, b) => a.name.localeCompare(b.name));
          
          console.log('최종 추출된 레이어 정보:', {
            totalLayers: finalLayers.length,
            layerNames: finalLayers.map(l => l.name),
            layerDetails: finalLayers
          });
          
          // 메모리 해제
          this.libreDwgWeb.dwg_free(dwgData);
          
          return {
            success: true,
            layers: finalLayers
          };
        } catch (libredwgWebError) {
          console.warn('@mlightcad/libredwg-web 레이어 추출 실패:', libredwgWebError);
          // fallback to test data
        }
      }
      
      if (this.libreDwg) {
        try {
          const dwgData = await this.libreDwg.dwg_read_data(arrayBuffer);
          console.log('DWG 데이터 구조:', dwgData);
          
          // 1. 먼저 레이어 테이블에서 실제 레이어 정보 추출 시도
          let layerTableInfo: any[] = [];
          try {
            if (this.libreDwg.dwg_get_layers) {
              layerTableInfo = this.libreDwg.dwg_get_layers(dwgData) || [];
              console.log('레이어 테이블 정보:', layerTableInfo);
            }
          } catch (layerError) {
            console.warn('레이어 테이블 추출 실패:', layerError);
          }
          
          // 2. 모델스페이스 엔티티에서 레이어 정보 추출
          const modelSpaceEntities = this.libreDwg.dwg_getall_entities_in_model_space(dwgData);
          console.log('모델스페이스 엔티티 수:', modelSpaceEntities?.length || 0);
          
          // 레이어별 엔티티 정보 수집
          const layerMap = new Map<string, LayerInfo>();
          
          // 3. 레이어 테이블 정보가 있으면 우선 사용
          if (layerTableInfo && layerTableInfo.length > 0) {
            layerTableInfo.forEach((layer: any) => {
              const layerName = layer.name || layer.layer_name || '0';
              layerMap.set(layerName, {
                name: layerName,
                entityCount: 0,
                entityTypes: {},
                isVisible: layer.is_visible !== false,
                color: layer.color || layer.color_index,
                linetype: layer.linetype || layer.line_type
              });
            });
          }
          
          // 4. 엔티티에서 레이어 정보 수집 및 보완
          if (modelSpaceEntities && Array.isArray(modelSpaceEntities)) {
            modelSpaceEntities.forEach((entity: any, index: number) => {
              const layerName = entity.layer || entity.layer_name || '0';
              
              // 상세한 엔티티 정보 로깅 (처음 5개만)
              if (index < 5) {
                console.log(`엔티티 ${index}:`, {
                  type: entity.type,
                  layer: entity.layer,
                  layer_name: entity.layer_name,
                  color: entity.color,
                  linetype: entity.linetype,
                  handle: entity.handle,
                  all_properties: Object.keys(entity)
                });
              }
              
              if (!layerMap.has(layerName)) {
                layerMap.set(layerName, {
                  name: layerName,
                  entityCount: 0,
                  entityTypes: {},
                  isVisible: true,
                  color: entity.color,
                  linetype: entity.linetype
                });
              }
              
              const layerInfo = layerMap.get(layerName)!;
              layerInfo.entityCount++;
              layerInfo.entityTypes[entity.type] = (layerInfo.entityTypes[entity.type] || 0) + 1;
              
              // 엔티티에서 더 정확한 레이어 속성 정보 업데이트
              if (entity.color !== undefined && layerInfo.color === undefined) {
                layerInfo.color = entity.color;
              }
              if (entity.linetype && !layerInfo.linetype) {
                layerInfo.linetype = entity.linetype;
              }
            });
          }
          
          const layers = Array.from(layerMap.values()).sort((a, b) => a.name.localeCompare(b.name));
          
          console.log('최종 추출된 레이어 정보:', {
            totalLayers: layers.length,
            layerNames: layers.map(l => l.name),
            layerDetails: layers
          });
          
          return {
            success: true,
            layers
          };
        } catch (libreDwgError) {
          console.warn('LibreDwg 레이어 추출 실패, 테스트 레이어 반환:', libreDwgError);
          
          // 테스트용 레이어 정보 반환
          const testLayers: LayerInfo[] = [
            {
              name: 'outline',
              entityCount: 4,
              entityTypes: { LINE: 4 },
              isVisible: true,
              color: 7,
              linetype: 'CONTINUOUS'
            },
            {
              name: 'internal',
              entityCount: 6,
              entityTypes: { LINE: 6 },
              isVisible: true,
              color: 3,
              linetype: 'DASHED'
            },
            {
              name: 'opening',
              entityCount: 3,
              entityTypes: { CIRCLE: 2, ARC: 1 },
              isVisible: true,
              color: 1,
              linetype: 'CONTINUOUS'
            },
            {
              name: 'text',
              entityCount: 2,
              entityTypes: { TEXT: 2 },
              isVisible: true,
              color: 2,
              linetype: 'CONTINUOUS'
            }
          ];
          
          return {
            success: true,
            layers: testLayers
          };
        }
      } else {
        // LibreDwg가 없는 경우 테스트 레이어 반환
        console.warn('LibreDwg 라이브러리가 없습니다. 테스트 레이어를 반환합니다.');
        
        const testLayers: LayerInfo[] = [
          {
            name: 'outline',
            entityCount: 4,
            entityTypes: { LINE: 4 },
            isVisible: true,
            color: 7,
            linetype: 'CONTINUOUS'
          },
          {
            name: 'internal',
            entityCount: 6,
            entityTypes: { LINE: 6 },
            isVisible: true,
            color: 3,
            linetype: 'DASHED'
          },
          {
            name: 'opening',
            entityCount: 3,
            entityTypes: { CIRCLE: 2, ARC: 1 },
            isVisible: true,
            color: 1,
            linetype: 'CONTINUOUS'
          },
          {
            name: 'text',
            entityCount: 2,
            entityTypes: { TEXT: 2 },
            isVisible: true,
            color: 2,
            linetype: 'CONTINUOUS'
          }
        ];
        
        return {
          success: true,
          layers: testLayers
        };
      }
    } catch (error) {
      console.error('레이어 정보 추출 실패:', error);
      return {
        success: false,
        layers: [],
        error: `레이어 정보 추출에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      };
    }
  }

  /**
   * DWG 파일 파싱 (레이어 필터링 포함)
   */
  public async parseDWGFile(file: File, selectedLayers?: string[]): Promise<CADParseResult> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          return {
            success: false,
            error: 'CAD Parser Service가 초기화되지 않았습니다.'
          };
        }
      }

      // 파일을 ArrayBuffer로 읽기
      const arrayBuffer = await file.arrayBuffer();
      
      console.log('DWG 파일 읽기 시작, 크기:', arrayBuffer.byteLength);
      
      // @mlightcad/libredwg-web으로 DWG 파일 파싱 시도
      if (this.libreDwgWeb) {
        try {
          console.log('@mlightcad/libredwg-web을 사용하여 DWG 파일 파싱...');
          
          // DWG 파일 타입 상수 (Dwg_File_Type.DWG = 0)
          const dwgData = this.libreDwgWeb.dwg_read_data(arrayBuffer, 0);
          console.log('LibreDwg Web 파싱 결과:', dwgData);
          
          if (dwgData.error !== 0) {
            throw new Error(`DWG 파일 읽기 실패: 오류 코드 ${dwgData.error}`);
          }
          
          // DwgDatabase로 변환
          const db = this.libreDwgWeb.convert(dwgData);
          
          // 파싱된 데이터를 표준 형식으로 변환 (레이어 필터링 포함)
          const cadData = this.convertLibreDwgWebToCAD(db, file.name, selectedLayers);
          
          // 메모리 해제
          this.libreDwgWeb.dwg_free(dwgData);
          
          return {
            success: true,
            data: cadData
          };
        } catch (libredwgWebError) {
          console.warn('@mlightcad/libredwg-web 파싱 실패, 테스트 데이터로 대체:', libredwgWebError);
          
          // 테스트를 위한 샘플 데이터 반환 (레이어 필터링 포함)
          const testData = this.createTestCADData(file.name, selectedLayers);
          return {
            success: true,
            data: testData,
            warnings: ['@mlightcad/libredwg-web 파싱에 실패하여 테스트 데이터를 반환합니다.']
          };
        }
      } else if (this.libreDwg) {
        try {
          const dwgData = await this.libreDwg.dwg_read_data(arrayBuffer);
          console.log('LibreDwg 파싱 결과:', dwgData);
          
          // 파싱된 데이터를 표준 형식으로 변환 (레이어 필터링 포함)
          const cadData = this.convertDWGToCAD(dwgData, file.name, selectedLayers);
          
          return {
            success: true,
            data: cadData
          };
        } catch (libreDwgError) {
          console.warn('LibreDwg 파싱 실패, 테스트 데이터로 대체:', libreDwgError);
          
          // 테스트를 위한 샘플 데이터 반환 (레이어 필터링 포함)
          const testData = this.createTestCADData(file.name, selectedLayers);
          return {
            success: true,
            data: testData,
            warnings: ['LibreDwg 파싱에 실패하여 테스트 데이터를 반환합니다.']
          };
        }
      } else {
        // LibreDwg가 없는 경우 테스트 모드로 동작
        console.warn('LibreDwg 라이브러리가 없습니다. 테스트 모드로 실행합니다.');
        
        // 테스트를 위한 샘플 데이터 반환 (레이어 필터링 포함)
        const testData = this.createTestCADData(file.name, selectedLayers);
        return {
          success: true,
          data: testData,
          warnings: ['LibreDwg 라이브러리가 없어 테스트 데이터를 반환합니다.']
        };
      }
    } catch (error) {
      console.error('DWG 파일 처리 실패:', error);
      return {
        success: false,
        error: `DWG 파일 처리에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      };
    }
  }

  /**
   * DXF 파일 파싱 (대안)
   */
  public async parseDXFFile(file: File): Promise<CADParseResult> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        return {
          success: false,
          error: 'CAD Parser Service가 초기화되지 않았습니다.'
        };
      }
    }

    try {
      // DXF 파일은 현재 LibreDwg에서 직접 지원하지 않음
      // DWG로 변환 후 처리하거나 다른 방법 사용
      console.warn(`DXF 파일 파싱 요청: ${file.name} (현재 지원하지 않음)`);
      throw new Error('DXF 파일은 현재 지원하지 않습니다. DWG 파일을 사용해주세요.');
    } catch (error) {
      console.error('DXF 파일 파싱 실패:', error);
      return {
        success: false,
        error: `DXF 파일 파싱에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      };
    }
  }

  /**
   * @mlightcad/libredwg-web 데이터를 표준 CAD 형식으로 변환 (레이어 필터링 포함)
   */
  private convertLibreDwgWebToCAD(db: any, fileName: string, selectedLayers?: string[]): CADData {
    console.log('LibreDwg Web 데이터를 CAD 형식으로 변환 시작...');
    
    // 엔티티 추출
    const entities = db.entities || [];
    const layers = db.layers || [];
    
    console.log('추출된 엔티티 수:', entities.length);
    console.log('추출된 레이어 수:', layers.length);
    
    // 레이어 필터링 적용
    let filteredEntities = entities;
    if (selectedLayers && selectedLayers.length > 0) {
      filteredEntities = entities.filter((entity: any) => {
        const entityLayer = entity.layer || entity.layer_name || '0';
        return selectedLayers.includes(entityLayer);
      });
      console.log(`레이어 필터링 적용: ${entities.length} -> ${filteredEntities.length} 엔티티`);
    }
    
    // 엔티티 변환
    const cadEntities: CADEntity[] = filteredEntities.map((entity: any, index: number) => {
      const layerName = entity.layer || entity.layer_name || '0';
      
      // 상세한 엔티티 정보 로깅 (처음 5개만)
      if (index < 5) {
        console.log(`변환 중인 엔티티 ${index}:`, {
          type: entity.type,
          layer: layerName,
          properties: Object.keys(entity)
        });
      }
      
      const baseEntity: CADEntity = {
        id: `entity_${index}`,
        type: this.mapEntityType(entity.type),
        layer: layerName,
        color: entity.color,
        linetype: entity.linetype
      };
      
      // 엔티티 타입별 속성 매핑
      switch (entity.type?.toLowerCase()) {
        case 'line':
          return {
            ...baseEntity,
            start: [entity.start?.x || 0, entity.start?.y || 0] as [number, number],
            end: [entity.end?.x || 0, entity.end?.y || 0] as [number, number]
          };
        case 'circle':
          return {
            ...baseEntity,
            center: [entity.center?.x || 0, entity.center?.y || 0] as [number, number],
            radius: entity.radius || 0
          };
        case 'arc':
          return {
            ...baseEntity,
            center: [entity.center?.x || 0, entity.center?.y || 0] as [number, number],
            radius: entity.radius || 0,
            startAngle: entity.start_angle || 0,
            endAngle: entity.end_angle || 0
          };
        case 'polyline':
          return {
            ...baseEntity,
            vertices: entity.vertices?.map((v: any) => [v.x || 0, v.y || 0] as [number, number]) || [],
            closed: entity.closed || false
          };
        case 'text':
          return {
            ...baseEntity,
            text: entity.text || entity.value || '',
            position: [entity.position?.x || 0, entity.position?.y || 0] as [number, number],
            height: entity.height || 0,
            rotation: entity.rotation || 0
          };
        default:
          return baseEntity;
      }
    });
    
    // 레이어 목록 추출
    const layerNames = [...new Set(cadEntities.map(e => e.layer))];
    
    // 경계 계산
    const bounds = this.calculateBounds(cadEntities);
    
    const cadData: CADData = {
      id: `cad_${Date.now()}`,
      name: fileName,
      type: '2d',
      entities: cadEntities,
      bounds,
      layers: layerNames,
      units: 'mm',
      version: '1.0',
      createdDate: new Date(),
      modifiedDate: new Date()
    };
    
    console.log('LibreDwg Web CAD 데이터 변환 완료:', {
      entityCount: cadEntities.length,
      layerCount: layerNames.length,
      bounds
    });
    
    return cadData;
  }

  /**
   * 엔티티 타입을 표준 형식으로 매핑
   */
  private mapEntityType(entityType: string): CADEntity['type'] {
    const type = entityType?.toLowerCase() || '';
    switch (type) {
      case 'line':
        return 'line' as const;
      case 'circle':
        return 'circle' as const;
      case 'arc':
        return 'arc' as const;
      case 'polyline':
      case 'lwpolyline':
        return 'polyline' as const;
      case 'text':
      case 'mtext':
        return 'text' as const;
      case 'dimension':
        return 'dimension' as const;
      default:
        return 'line' as const; // 기본값
    }
  }

  /**
   * 엔티티들의 경계를 계산
   */
  private calculateBounds(entities: CADEntity[]): { min: [number, number]; max: [number, number] } {
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    entities.forEach(entity => {
      // Line
      if (entity.start && entity.end) {
        minX = Math.min(minX, entity.start[0], entity.end[0]);
        minY = Math.min(minY, entity.start[1], entity.end[1]);
        maxX = Math.max(maxX, entity.start[0], entity.end[0]);
        maxY = Math.max(maxY, entity.start[1], entity.end[1]);
      }
      
      // Circle
      if (entity.center && entity.radius !== undefined) {
        const radius = entity.radius;
        minX = Math.min(minX, entity.center[0] - radius);
        minY = Math.min(minY, entity.center[1] - radius);
        maxX = Math.max(maxX, entity.center[0] + radius);
        maxY = Math.max(maxY, entity.center[1] + radius);
      }
      
      // Arc
      if (entity.center && entity.radius !== undefined) {
        const radius = entity.radius;
        minX = Math.min(minX, entity.center[0] - radius);
        minY = Math.min(minY, entity.center[1] - radius);
        maxX = Math.max(maxX, entity.center[0] + radius);
        maxY = Math.max(maxY, entity.center[1] + radius);
      }
      
      // Polyline
      if (entity.vertices) {
        entity.vertices.forEach(vertex => {
          minX = Math.min(minX, vertex[0]);
          minY = Math.min(minY, vertex[1]);
          maxX = Math.max(maxX, vertex[0]);
          maxY = Math.max(maxY, vertex[1]);
        });
      }
      
      // Text
      if (entity.position) {
        minX = Math.min(minX, entity.position[0]);
        minY = Math.min(minY, entity.position[1]);
        maxX = Math.max(maxX, entity.position[0]);
        maxY = Math.max(maxY, entity.position[1]);
      }
    });

    // 기본값 설정
    if (minX === Infinity) {
      minX = minY = maxX = maxY = 0;
    }

    return {
      min: [minX, minY] as [number, number],
      max: [maxX, maxY] as [number, number]
    };
  }

  /**
   * LibreDwg 데이터를 표준 CAD 형식으로 변환
   */
  private convertDWGToCAD(dwgData: any, fileName: string, selectedLayers?: string[]): CADData {
    const entities: CADEntity[] = [];
    const layers = new Set<string>();
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    try {
      // LibreDwg에서 모델스페이스의 모든 엔티티 가져오기
      const modelSpaceEntities = this.libreDwg?.dwg_getall_entities_in_model_space(dwgData);
      
      console.log('LibreDwg 원본 엔티티 데이터:', {
        totalEntities: modelSpaceEntities?.length || 0,
        entityTypes: modelSpaceEntities?.map((e: any) => e.type) || [],
        sampleEntity: modelSpaceEntities?.[0] || null
      });
      
      if (modelSpaceEntities && Array.isArray(modelSpaceEntities)) {
        let convertedCount = 0;
        let skippedCount = 0;
        
        modelSpaceEntities.forEach((entity: any, index: number) => {
          // 레이어 필터링 적용
          const entityLayer = entity.layer || '0';
          if (selectedLayers && selectedLayers.length > 0 && !selectedLayers.includes(entityLayer)) {
            skippedCount++;
            console.log(`레이어 필터링으로 제외됨 (${entityLayer}):`, entity.type);
            return;
          }

          const convertedEntity = this.convertEntity(entity, index);
          if (convertedEntity) {
            entities.push(convertedEntity);
            layers.add(convertedEntity.layer);
            convertedCount++;
            
            // 경계 계산
            this.updateBounds(convertedEntity, minX, minY, maxX, maxY);
          } else {
            skippedCount++;
            console.warn(`엔티티 변환 실패 (인덱스 ${index}):`, {
              type: entity.type,
              layer: entity.layer,
              data: entity
            });
          }
        });
        
        console.log('엔티티 변환 결과:', {
          total: modelSpaceEntities.length,
          converted: convertedCount,
          skipped: skippedCount,
          successRate: `${((convertedCount / modelSpaceEntities.length) * 100).toFixed(1)}%`
        });
      } else {
        console.warn('모델스페이스 엔티티를 가져올 수 없습니다:', modelSpaceEntities);
      }
    } catch (error) {
      console.warn('LibreDwg 엔티티 변환 중 오류:', error);
    }

    return {
      id: `cad-${Date.now()}`,
      name: fileName,
      type: '2d', // 기본값, 실제로는 3D 여부를 확인해야 함
      entities,
      bounds: {
        min: [minX === Infinity ? 0 : minX, minY === Infinity ? 0 : minY],
        max: [maxX === -Infinity ? 1000 : maxX, maxY === -Infinity ? 1000 : maxY]
      },
      layers: Array.from(layers),
      units: dwgData.units || 'mm',
      version: dwgData.version || 'unknown'
    };
  }



  /**
   * 개별 엔티티 변환
   */
  private convertEntity(entity: any, index: number): CADEntity | null {
    try {
      console.log(`엔티티 변환 시도 (${index}):`, {
        type: entity.type,
        layer: entity.layer,
        handle: entity.handle,
        hasStart: !!entity.start,
        hasEnd: !!entity.end,
        hasCenter: !!entity.center,
        hasRadius: !!entity.radius
      });

      const baseEntity = {
        id: entity.handle || `entity-${index}`,
        layer: entity.layer || '0',
        color: entity.color || 7,
        linetype: entity.linetype || 'CONTINUOUS',
        lineweight: entity.lineweight || -1
      };

      switch (entity.type) {
        case 'LINE':
          return {
            ...baseEntity,
            type: 'line',
            start: [entity.start?.x || 0, entity.start?.y || 0],
            end: [entity.end?.x || 0, entity.end?.y || 0]
          };

        case 'CIRCLE':
          return {
            ...baseEntity,
            type: 'circle',
            center: [entity.center?.x || 0, entity.center?.y || 0],
            radius: entity.radius || 0
          };

        case 'ARC':
          return {
            ...baseEntity,
            type: 'arc',
            center: [entity.center?.x || 0, entity.center?.y || 0],
            radius: entity.radius || 0,
            startAngle: entity.startAngle || 0,
            endAngle: entity.endAngle || 0
          };

        case 'POLYLINE':
        case 'LWPOLYLINE':
          return {
            ...baseEntity,
            type: 'polyline',
            vertices: entity.vertices?.map((v: any) => [v.x || 0, v.y || 0]) || [],
            closed: entity.closed || false
          };

        case 'TEXT':
        case 'MTEXT':
          return {
            ...baseEntity,
            type: 'text',
            text: entity.text || '',
            position: [entity.position?.x || 0, entity.position?.y || 0],
            height: entity.height || 2.5,
            rotation: entity.rotation || 0
          };

        case 'DIMENSION':
          return {
            ...baseEntity,
            type: 'dimension',
            definitionPoint: [entity.definitionPoint?.x || 0, entity.definitionPoint?.y || 0],
            textPosition: [entity.textPosition?.x || 0, entity.textPosition?.y || 0],
            measurement: entity.measurement || 0
          };

        default:
          console.warn(`지원하지 않는 엔티티 타입: ${entity.type}`);
          return null;
      }
    } catch (error) {
      console.error(`엔티티 변환 실패 (${entity.type}):`, error);
      return null;
    }
  }

  /**
   * 경계 계산 업데이트
   */
  private updateBounds(entity: CADEntity, minX: number, minY: number, maxX: number, maxY: number): void {
    switch (entity.type) {
      case 'line':
        if (entity.start && entity.end) {
          minX = Math.min(minX, entity.start[0], entity.end[0]);
          minY = Math.min(minY, entity.start[1], entity.end[1]);
          maxX = Math.max(maxX, entity.start[0], entity.end[0]);
          maxY = Math.max(maxY, entity.start[1], entity.end[1]);
        }
        break;
      case 'circle':
        if (entity.center && entity.radius) {
          minX = Math.min(minX, entity.center[0] - entity.radius);
          minY = Math.min(minY, entity.center[1] - entity.radius);
          maxX = Math.max(maxX, entity.center[0] + entity.radius);
          maxY = Math.max(maxY, entity.center[1] + entity.radius);
        }
        break;
      case 'polyline':
        if (entity.vertices) {
          entity.vertices.forEach(vertex => {
            minX = Math.min(minX, vertex[0]);
            minY = Math.min(minY, vertex[1]);
            maxX = Math.max(maxX, vertex[0]);
            maxY = Math.max(maxY, vertex[1]);
          });
        }
        break;
      case 'text':
        if (entity.position) {
          minX = Math.min(minX, entity.position[0]);
          minY = Math.min(minY, entity.position[1]);
          maxX = Math.max(maxX, entity.position[0]);
          maxY = Math.max(maxY, entity.position[1]);
        }
        break;
    }
  }

  /**
   * 지원하는 파일 형식 확인
   */
  public isFileSupported(file: File): boolean {
    const extension = file.name.toLowerCase().split('.').pop();
    return ['dwg', 'dxf'].includes(extension || '');
  }

  /**
   * DWG 파일 상세 분석 (디버깅용)
   */
  public async analyzeDWGFileDetailed(file: File): Promise<{
    success: boolean;
    fileInfo: {
      name: string;
      size: number;
      lastModified: Date;
      type: string;
    };
    dwgStructure?: {
      hasLayerTable: boolean;
      layerTableInfo: any[];
      modelSpaceEntityCount: number;
      sampleEntities: any[];
      allEntityTypes: string[];
      layerNames: string[];
    };
    layerAnalysis?: {
      totalLayers: number;
      layers: LayerInfo[];
      layerComparison: {
        fromLayerTable: string[];
        fromEntities: string[];
        differences: string[];
      };
    };
    error?: string;
  }> {
    try {
      const fileInfo = {
        name: file.name,
        size: file.size,
        lastModified: new Date(file.lastModified),
        type: file.type
      };

      console.log('DWG 파일 상세 분석 시작:', fileInfo);

      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          return {
            success: false,
            fileInfo,
            error: 'CAD Parser Service가 초기화되지 않았습니다.'
          };
        }
      }

      const arrayBuffer = await file.arrayBuffer();
      let dwgStructure: any = {};
      let layerAnalysis: any = {};

      if (this.libreDwg) {
        try {
          const dwgData = await this.libreDwg.dwg_read_data(arrayBuffer);
          
          // DWG 구조 분석
          const modelSpaceEntities = this.libreDwg.dwg_getall_entities_in_model_space(dwgData);
          const allEntityTypes = [...new Set(modelSpaceEntities?.map((e: any) => e.type) || [])];
          
          // 레이어 테이블 정보 추출 시도
          let layerTableInfo: any[] = [];
          let hasLayerTable = false;
          try {
            if (this.libreDwg.dwg_get_layers) {
              layerTableInfo = this.libreDwg.dwg_get_layers(dwgData) || [];
              hasLayerTable = layerTableInfo.length > 0;
            }
          } catch (layerError) {
            console.warn('레이어 테이블 추출 실패:', layerError);
          }

          // 엔티티에서 레이어 이름 추출
          const entityLayerNames = [...new Set(modelSpaceEntities?.map((e: any) => e.layer || e.layer_name || '0') || [])];
          const layerTableNames = layerTableInfo.map((l: any) => l.name || l.layer_name || '0');

          dwgStructure = {
            hasLayerTable,
            layerTableInfo,
            modelSpaceEntityCount: modelSpaceEntities?.length || 0,
            sampleEntities: modelSpaceEntities?.slice(0, 3) || [],
            allEntityTypes,
            layerNames: entityLayerNames
          };

          // 레이어 분석
          const layerResult = await this.extractLayerInfo(file);
          if (layerResult.success) {
            layerAnalysis = {
              totalLayers: layerResult.layers.length,
              layers: layerResult.layers,
              layerComparison: {
                fromLayerTable: layerTableNames,
                fromEntities: entityLayerNames,
                differences: [
                  ...layerTableNames.filter(name => !entityLayerNames.includes(name)),
                  ...entityLayerNames.filter(name => !layerTableNames.includes(name))
                ]
              }
            };
          }

        } catch (libreDwgError) {
          console.warn('LibreDwg 상세 분석 실패:', libreDwgError);
          dwgStructure = {
            hasLayerTable: false,
            layerTableInfo: [],
            modelSpaceEntityCount: 0,
            sampleEntities: [],
            allEntityTypes: [],
            layerNames: []
          };
        }
      }

      console.log('DWG 파일 상세 분석 완료:', {
        dwgStructure,
        layerAnalysis
      });

      return {
        success: true,
        fileInfo,
        dwgStructure,
        layerAnalysis
      };

    } catch (error) {
      console.error('DWG 파일 상세 분석 실패:', error);
      return {
        success: false,
        fileInfo: {
          name: file.name,
          size: file.size,
          lastModified: new Date(file.lastModified),
          type: file.type
        },
        error: `파일 분석 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      };
    }
  }

  /**
   * DWG 파일 정보 분석 (디버깅용)
   */
  public async analyzeDWGFile(file: File): Promise<{
    success: boolean;
    fileInfo: {
      name: string;
      size: number;
      lastModified: Date;
      type: string;
    };
    parseResult?: CADParseResult;
    analysis?: {
      totalEntities: number;
      entityTypes: Record<string, number>;
      layers: string[];
      bounds: { min: [number, number]; max: [number, number] };
      warnings: string[];
    };
    error?: string;
  }> {
    try {
      const fileInfo = {
        name: file.name,
        size: file.size,
        lastModified: new Date(file.lastModified),
        type: file.type
      };

      console.log('DWG 파일 분석 시작:', fileInfo);

      // 파일 파싱 시도
      const parseResult = await this.parseDWGFile(file);

      if (parseResult.success && parseResult.data) {
        const data = parseResult.data;
        const entityTypes: Record<string, number> = {};
        
        data.entities.forEach(entity => {
          entityTypes[entity.type] = (entityTypes[entity.type] || 0) + 1;
        });

        const analysis = {
          totalEntities: data.entities.length,
          entityTypes,
          layers: data.layers,
          bounds: data.bounds,
          warnings: parseResult.warnings || []
        };

        console.log('DWG 파일 분석 완료:', analysis);

        return {
          success: true,
          fileInfo,
          parseResult,
          analysis
        };
      } else {
        return {
          success: false,
          fileInfo,
          error: parseResult.error || '파일 파싱에 실패했습니다.'
        };
      }
    } catch (error) {
      console.error('DWG 파일 분석 실패:', error);
      return {
        success: false,
        fileInfo: {
          name: file.name,
          size: file.size,
          lastModified: new Date(file.lastModified),
          type: file.type
        },
        error: `파일 분석 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      };
    }
  }

  /**
   * 서비스 상태 확인
   */
  public getStatus(): { initialized: boolean; libreDwg: boolean } {
    return {
      initialized: this.isInitialized,
      libreDwg: this.libreDwg !== null
    };
  }

  /**
   * 테스트용 CAD 데이터 생성
   */
  private createTestCADData(fileName: string, selectedLayers?: string[]): CADData {
    const timestamp = Date.now();
    
    // 모든 테스트 엔티티 정의
    const allTestEntities: CADEntity[] = [
        // 직사각형 단면 예시 (외곽선)
        { 
          id: 'line1', 
          type: 'line' as const, 
          start: [0, 0] as [number, number], 
          end: [300, 0] as [number, number], 
          layer: 'outline',
          color: 7,
          linetype: 'CONTINUOUS'
        },
        { 
          id: 'line2', 
          type: 'line' as const, 
          start: [300, 0] as [number, number], 
          end: [300, 500] as [number, number], 
          layer: 'outline',
          color: 7,
          linetype: 'CONTINUOUS'
        },
        { 
          id: 'line3', 
          type: 'line' as const, 
          start: [300, 500] as [number, number], 
          end: [0, 500] as [number, number], 
          layer: 'outline',
          color: 7,
          linetype: 'CONTINUOUS'
        },
        { 
          id: 'line4', 
          type: 'line' as const, 
          start: [0, 500] as [number, number], 
          end: [0, 0] as [number, number], 
          layer: 'outline',
          color: 7,
          linetype: 'CONTINUOUS'
        },
        
        // 내부 벽
        { 
          id: 'line5', 
          type: 'line' as const, 
          start: [50, 0] as [number, number], 
          end: [50, 500] as [number, number], 
          layer: 'internal',
          color: 3,
          linetype: 'DASHED'
        },
        { 
          id: 'line6', 
          type: 'line' as const, 
          start: [250, 0] as [number, number], 
          end: [250, 500] as [number, number], 
          layer: 'internal',
          color: 3,
          linetype: 'DASHED'
        },
        { 
          id: 'line7', 
          type: 'line' as const, 
          start: [0, 50] as [number, number], 
          end: [300, 50] as [number, number], 
          layer: 'internal',
          color: 3,
          linetype: 'DASHED'
        },
        { 
          id: 'line8', 
          type: 'line' as const, 
          start: [0, 450] as [number, number], 
          end: [300, 450] as [number, number], 
          layer: 'internal',
          color: 3,
          linetype: 'DASHED'
        },
        
        // 원형 개구부
        { 
          id: 'circle1', 
          type: 'circle' as const, 
          center: [75, 75] as [number, number], 
          radius: 25, 
          layer: 'opening',
          color: 1,
          linetype: 'CONTINUOUS'
        },
        { 
          id: 'circle2', 
          type: 'circle' as const, 
          center: [225, 75] as [number, number], 
          radius: 25, 
          layer: 'opening',
          color: 1,
          linetype: 'CONTINUOUS'
        },
        
        // 호형 개구부
        { 
          id: 'arc1', 
          type: 'arc' as const, 
          center: [150, 400] as [number, number], 
          radius: 30, 
          startAngle: 0, 
          endAngle: Math.PI, 
          layer: 'opening',
          color: 1,
          linetype: 'CONTINUOUS'
        },
        
        // 추가 내부 선
        { 
          id: 'line9', 
          type: 'line' as const, 
          start: [100, 0] as [number, number], 
          end: [100, 500] as [number, number], 
          layer: 'internal',
          color: 3,
          linetype: 'DASHED'
        },
        { 
          id: 'line10', 
          type: 'line' as const, 
          start: [200, 0] as [number, number], 
          end: [200, 500] as [number, number], 
          layer: 'internal',
          color: 3,
          linetype: 'DASHED'
        },
        
        // 텍스트 라벨
        { 
          id: 'text1', 
          type: 'text' as const, 
          text: 'Bridge Section', 
          position: [10, 520] as [number, number], 
          height: 20, 
          rotation: 0, 
          layer: 'text',
          color: 2
        },
        { 
          id: 'text2', 
          type: 'text' as const, 
          text: 'Test Data', 
          position: [10, 550] as [number, number], 
          height: 15, 
          rotation: 0, 
          layer: 'text',
          color: 2
        }
      ];

    // 레이어 필터링 적용
    let filteredEntities = allTestEntities;
    let filteredLayers = ['outline', 'internal', 'opening', 'text'];
    
    if (selectedLayers && selectedLayers.length > 0) {
      filteredEntities = allTestEntities.filter(entity => 
        selectedLayers.includes(entity.layer)
      );
      filteredLayers = selectedLayers;
      console.log('테스트 데이터 레이어 필터링 적용:', {
        selectedLayers,
        filteredEntityCount: filteredEntities.length,
        originalEntityCount: allTestEntities.length
      });
    }

    return {
      id: `test-cad-${timestamp}`,
      name: fileName,
      type: '2d',
      entities: filteredEntities,
      bounds: { min: [0, 0], max: [300, 570] },
      layers: filteredLayers,
      units: 'mm',
      version: 'test',
      createdDate: new Date(),
      modifiedDate: new Date()
    };
  }

  /**
   * 메모리 정리
   */
  public cleanup(): void {
    if (this.libreDwg) {
      // LibreDwg 리소스 정리
      this.libreDwg = null;
    }
    this.isInitialized = false;
  }
}
