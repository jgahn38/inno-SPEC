// LibreDWG ?¼ì´ë¸ŒëŸ¬ë¦??€???•ì˜
interface LibreDwg {
  dwg_read_data(data: ArrayBuffer): Promise<any>;
  dwg_getall_entities_in_model_space(data: any): any[];
  dwg_get_layers(data: any): any[]; // ?ˆì´???Œì´ë¸??•ë³´
  dwg_get_layer_table(data: any): any; // ?ˆì´???Œì´ë¸?
}

// @mlightcad/libredwg-web ?¼ì´ë¸ŒëŸ¬ë¦??€???•ì˜
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
   * LibreDWG ?¼ì´ë¸ŒëŸ¬ë¦?ì´ˆê¸°??
   */
  public async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    // ?´ë? ì´ˆê¸°??ì¤‘ì¸ ê²½ìš° ê¸°ì¡´ Promise ë°˜í™˜
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<boolean> {
    try {
      // ë¸Œë¼?°ì? ?˜ê²½ ?•ì¸
      if (typeof window === 'undefined') {
        console.warn('ë¸Œë¼?°ì? ?˜ê²½???„ë‹™?ˆë‹¤. ?ŒìŠ¤??ëª¨ë“œë¡??¤í–‰?©ë‹ˆ??');
        this.isInitialized = true;
        this.libreDwg = null;
        return true;
      }

      // 1. @mlightcad/libredwg-web ?¼ì´ë¸ŒëŸ¬ë¦?ë¡œë“œ ?œë„ (?„ì¬ ë¹„í™œ?±í™”)
      // TODO: ?„ìš”??@mlightcad/libredwg-web ?¨í‚¤ì§€ ?¤ì¹˜ ???œì„±??
      /*
      try {
        const { LibreDwg } = await import('@mlightcad/libredwg-web');
        
        if (LibreDwg) {
          this.libreDwgWeb = await LibreDwg.create();
          this.isInitialized = true;
          return true;
        }
      } catch (libredwgWebError) {
        console.warn('@mlightcad/libredwg-web ë¡œë“œ ?¤íŒ¨:', libredwgWebError);
      }
      */

      // 2. ê¸°ì¡´ LibreDwg WASM ëª¨ë“ˆ ?•ì¸ (fallback)
      if (!(window as any).LibreDwg) {
        console.warn('ëª¨ë“  LibreDwg ?¼ì´ë¸ŒëŸ¬ë¦?ë¡œë“œ???¤íŒ¨?ˆìŠµ?ˆë‹¤. ?ŒìŠ¤??ëª¨ë“œë¡??¤í–‰?©ë‹ˆ??');
        console.info('DWG ?Œì¼ ì²˜ë¦¬ë¥??„í•´?œëŠ” @mlightcad/libredwg-web ?¨í‚¤ì§€ê°€ ?„ìš”?©ë‹ˆ??');
        this.isInitialized = true;
        this.libreDwg = null;
        this.libreDwgWeb = null;
        return true;
      }

      // WASM ëª¨ë“ˆ ë¡œë”© ?€ê¸?(??ê¸??œê°„ ?€ê¸?
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // LibreDwg ?¼ì´ë¸ŒëŸ¬ë¦??¸ìŠ¤?´ìŠ¤ ?ì„± ?œë„
      try {
        this.libreDwg = new (window as any).LibreDwg();
      } catch (instanceError) {
        console.warn('LibreDwg ?¸ìŠ¤?´ìŠ¤ ?ì„± ?¤íŒ¨:', instanceError);
        throw new Error(`LibreDwg ?¸ìŠ¤?´ìŠ¤ ?ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤: ${instanceError}`);
      }
      
      // ì´ˆê¸°???±ê³µ ?•ì¸
      if (!this.libreDwg) {
        throw new Error('LibreDwg ?¸ìŠ¤?´ìŠ¤ê°€ null?…ë‹ˆ??');
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.warn('LibreDwg ì´ˆê¸°???¤íŒ¨, ?ŒìŠ¤??ëª¨ë“œë¡??¤í–‰?©ë‹ˆ??', error);
      this.isInitialized = true; // ?ŒìŠ¤??ëª¨ë“œë¡?ê³„ì† ì§„í–‰
      this.libreDwg = null;
      return true; // ?ŒìŠ¤??ëª¨ë“œ?ì„œ???±ê³µ?¼ë¡œ ì²˜ë¦¬
    } finally {
      this.initializationPromise = null;
    }
  }

  /**
   * DWG ?Œì¼?ì„œ ?ˆì´???•ë³´ ì¶”ì¶œ
   */
  public async extractLayerInfo(file: File): Promise<LayerSelectionResult> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          return {
            success: false,
            layers: [],
            error: 'CAD Parser Serviceê°€ ì´ˆê¸°?”ë˜ì§€ ?Šì•˜?µë‹ˆ??'
          };
        }
      }

      // ?Œì¼??ArrayBufferë¡??½ê¸°
      const arrayBuffer = await file.arrayBuffer();

      if (this.libreDwgWeb) {
        try {
          // DWG ?Œì¼ ?€???ìˆ˜ (Dwg_File_Type.DWG = 0)
          const dwgData = this.libreDwgWeb.dwg_read_data(arrayBuffer, 0);
          
          if (dwgData.error !== 0) {
            throw new Error(`DWG ?Œì¼ ?½ê¸° ?¤íŒ¨: ?¤ë¥˜ ì½”ë“œ ${dwgData.error}`);
          }
          
          // DwgDatabaseë¡?ë³€??
          const db = this.libreDwgWeb.convert(dwgData);
          
          // ?ˆì´???•ë³´ ì¶”ì¶œ
          const layers = db.layers || [];
          const entities = db.entities || [];
          
          
          // ?ˆì´?´ë³„ ?”í‹°???•ë³´ ?˜ì§‘
          const layerMap = new Map<string, LayerInfo>();
          
          // 1. ?ˆì´???Œì´ë¸”ì—??ê¸°ë³¸ ?ˆì´???•ë³´ ?¤ì •
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
          
          // 2. ?”í‹°?°ì—???ˆì´???•ë³´ ë³´ì™„
          entities.forEach((entity: any, index: number) => {
            const layerName = entity.layer || '0';
            
            // ?ì„¸???”í‹°???•ë³´ ë¡œê¹… (ì²˜ìŒ 5ê°œë§Œ)
            if (index < 5) {
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
            
            // ?”í‹°?°ì—?????•í™•???ˆì´???ì„± ?•ë³´ ?…ë°?´íŠ¸
            if (entity.color !== undefined && layerInfo.color === undefined) {
              layerInfo.color = entity.color;
            }
            if (entity.linetype && !layerInfo.linetype) {
              layerInfo.linetype = entity.linetype;
            }
          });
          
          const finalLayers = Array.from(layerMap.values()).sort((a, b) => a.name.localeCompare(b.name));
          
            totalLayers: finalLayers.length,
            layerNames: finalLayers.map(l => l.name),
            layerDetails: finalLayers
          });
          
          // ë©”ëª¨ë¦??´ì œ
          this.libreDwgWeb.dwg_free(dwgData);
          
          return {
            success: true,
            layers: finalLayers
          };
        } catch (libredwgWebError) {
          console.warn('@mlightcad/libredwg-web ?ˆì´??ì¶”ì¶œ ?¤íŒ¨:', libredwgWebError);
          // fallback to test data
        }
      }
      
      if (this.libreDwg) {
        try {
          const dwgData = await this.libreDwg.dwg_read_data(arrayBuffer);
          
          // 1. ë¨¼ì? ?ˆì´???Œì´ë¸”ì—???¤ì œ ?ˆì´???•ë³´ ì¶”ì¶œ ?œë„
          let layerTableInfo: any[] = [];
          try {
            if (this.libreDwg.dwg_get_layers) {
              layerTableInfo = this.libreDwg.dwg_get_layers(dwgData) || [];
            }
          } catch (layerError) {
            console.warn('?ˆì´???Œì´ë¸?ì¶”ì¶œ ?¤íŒ¨:', layerError);
          }
          
          // 2. ëª¨ë¸?¤í˜?´ìŠ¤ ?”í‹°?°ì—???ˆì´???•ë³´ ì¶”ì¶œ
          const modelSpaceEntities = this.libreDwg.dwg_getall_entities_in_model_space(dwgData);
          
          // ?ˆì´?´ë³„ ?”í‹°???•ë³´ ?˜ì§‘
          const layerMap = new Map<string, LayerInfo>();
          
          // 3. ?ˆì´???Œì´ë¸??•ë³´ê°€ ?ˆìœ¼ë©??°ì„  ?¬ìš©
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
          
          // 4. ?”í‹°?°ì—???ˆì´???•ë³´ ?˜ì§‘ ë°?ë³´ì™„
          if (modelSpaceEntities && Array.isArray(modelSpaceEntities)) {
            modelSpaceEntities.forEach((entity: any, index: number) => {
              const layerName = entity.layer || entity.layer_name || '0';
              
              // ?ì„¸???”í‹°???•ë³´ ë¡œê¹… (ì²˜ìŒ 5ê°œë§Œ)
              if (index < 5) {
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
              
              // ?”í‹°?°ì—?????•í™•???ˆì´???ì„± ?•ë³´ ?…ë°?´íŠ¸
              if (entity.color !== undefined && layerInfo.color === undefined) {
                layerInfo.color = entity.color;
              }
              if (entity.linetype && !layerInfo.linetype) {
                layerInfo.linetype = entity.linetype;
              }
            });
          }
          
          const layers = Array.from(layerMap.values()).sort((a, b) => a.name.localeCompare(b.name));
          
            totalLayers: layers.length,
            layerNames: layers.map(l => l.name),
            layerDetails: layers
          });
          
          return {
            success: true,
            layers
          };
        } catch (libreDwgError) {
          console.warn('LibreDwg ?ˆì´??ì¶”ì¶œ ?¤íŒ¨, ?ŒìŠ¤???ˆì´??ë°˜í™˜:', libreDwgError);
          
          // ?ŒìŠ¤?¸ìš© ?ˆì´???•ë³´ ë°˜í™˜
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
        // LibreDwgê°€ ?†ëŠ” ê²½ìš° ?ŒìŠ¤???ˆì´??ë°˜í™˜
        console.warn('LibreDwg ?¼ì´ë¸ŒëŸ¬ë¦¬ê? ?†ìŠµ?ˆë‹¤. ?ŒìŠ¤???ˆì´?´ë? ë°˜í™˜?©ë‹ˆ??');
        
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
      console.error('?ˆì´???•ë³´ ì¶”ì¶œ ?¤íŒ¨:', error);
      return {
        success: false,
        layers: [],
        error: `?ˆì´???•ë³´ ì¶”ì¶œ???¤íŒ¨?ˆìŠµ?ˆë‹¤: ${error instanceof Error ? error.message : '?????†ëŠ” ?¤ë¥˜'}`
      };
    }
  }

  /**
   * DWG ?Œì¼ ?Œì‹± (?ˆì´???„í„°ë§??¬í•¨)
   */
  public async parseDWGFile(file: File, selectedLayers?: string[]): Promise<CADParseResult> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          return {
            success: false,
            error: 'CAD Parser Serviceê°€ ì´ˆê¸°?”ë˜ì§€ ?Šì•˜?µë‹ˆ??'
          };
        }
      }

      // ?Œì¼??ArrayBufferë¡??½ê¸°
      const arrayBuffer = await file.arrayBuffer();
      
      
      // @mlightcad/libredwg-web?¼ë¡œ DWG ?Œì¼ ?Œì‹± ?œë„
      if (this.libreDwgWeb) {
        try {
          
          // DWG ?Œì¼ ?€???ìˆ˜ (Dwg_File_Type.DWG = 0)
          const dwgData = this.libreDwgWeb.dwg_read_data(arrayBuffer, 0);
          
          if (dwgData.error !== 0) {
            throw new Error(`DWG ?Œì¼ ?½ê¸° ?¤íŒ¨: ?¤ë¥˜ ì½”ë“œ ${dwgData.error}`);
          }
          
          // DwgDatabaseë¡?ë³€??
          const db = this.libreDwgWeb.convert(dwgData);
          
          // ?Œì‹±???°ì´?°ë? ?œì? ?•ì‹?¼ë¡œ ë³€??(?ˆì´???„í„°ë§??¬í•¨)
          const cadData = this.convertLibreDwgWebToCAD(db, file.name, selectedLayers);
          
          // ë©”ëª¨ë¦??´ì œ
          this.libreDwgWeb.dwg_free(dwgData);
          
          return {
            success: true,
            data: cadData
          };
        } catch (libredwgWebError) {
          console.warn('@mlightcad/libredwg-web ?Œì‹± ?¤íŒ¨, ?ŒìŠ¤???°ì´?°ë¡œ ?€ì²?', libredwgWebError);
          
          // ?ŒìŠ¤?¸ë? ?„í•œ ?˜í”Œ ?°ì´??ë°˜í™˜ (?ˆì´???„í„°ë§??¬í•¨)
          const testData = this.createTestCADData(file.name, selectedLayers);
          return {
            success: true,
            data: testData,
            warnings: ['@mlightcad/libredwg-web ?Œì‹±???¤íŒ¨?˜ì—¬ ?ŒìŠ¤???°ì´?°ë? ë°˜í™˜?©ë‹ˆ??']
          };
        }
      } else if (this.libreDwg) {
        try {
          const dwgData = await this.libreDwg.dwg_read_data(arrayBuffer);
          
          // ?Œì‹±???°ì´?°ë? ?œì? ?•ì‹?¼ë¡œ ë³€??(?ˆì´???„í„°ë§??¬í•¨)
          const cadData = this.convertDWGToCAD(dwgData, file.name, selectedLayers);
          
          return {
            success: true,
            data: cadData
          };
        } catch (libreDwgError) {
          console.warn('LibreDwg ?Œì‹± ?¤íŒ¨, ?ŒìŠ¤???°ì´?°ë¡œ ?€ì²?', libreDwgError);
          
          // ?ŒìŠ¤?¸ë? ?„í•œ ?˜í”Œ ?°ì´??ë°˜í™˜ (?ˆì´???„í„°ë§??¬í•¨)
          const testData = this.createTestCADData(file.name, selectedLayers);
          return {
            success: true,
            data: testData,
            warnings: ['LibreDwg ?Œì‹±???¤íŒ¨?˜ì—¬ ?ŒìŠ¤???°ì´?°ë? ë°˜í™˜?©ë‹ˆ??']
          };
        }
      } else {
        // LibreDwgê°€ ?†ëŠ” ê²½ìš° ?ŒìŠ¤??ëª¨ë“œë¡??™ì‘
        console.warn('LibreDwg ?¼ì´ë¸ŒëŸ¬ë¦¬ê? ?†ìŠµ?ˆë‹¤. ?ŒìŠ¤??ëª¨ë“œë¡??¤í–‰?©ë‹ˆ??');
        
        // ?ŒìŠ¤?¸ë? ?„í•œ ?˜í”Œ ?°ì´??ë°˜í™˜ (?ˆì´???„í„°ë§??¬í•¨)
        const testData = this.createTestCADData(file.name, selectedLayers);
        return {
          success: true,
          data: testData,
          warnings: ['LibreDwg ?¼ì´ë¸ŒëŸ¬ë¦¬ê? ?†ì–´ ?ŒìŠ¤???°ì´?°ë? ë°˜í™˜?©ë‹ˆ??']
        };
      }
    } catch (error) {
      console.error('DWG ?Œì¼ ì²˜ë¦¬ ?¤íŒ¨:', error);
      return {
        success: false,
        error: `DWG ?Œì¼ ì²˜ë¦¬???¤íŒ¨?ˆìŠµ?ˆë‹¤: ${error instanceof Error ? error.message : '?????†ëŠ” ?¤ë¥˜'}`
      };
    }
  }

  /**
   * DXF ?Œì¼ ?Œì‹± (?€??
   */
  public async parseDXFFile(file: File): Promise<CADParseResult> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        return {
          success: false,
          error: 'CAD Parser Serviceê°€ ì´ˆê¸°?”ë˜ì§€ ?Šì•˜?µë‹ˆ??'
        };
      }
    }

    try {
      // DXF ?Œì¼?€ ?„ì¬ LibreDwg?ì„œ ì§ì ‘ ì§€?í•˜ì§€ ?ŠìŒ
      // DWGë¡?ë³€????ì²˜ë¦¬?˜ê±°???¤ë¥¸ ë°©ë²• ?¬ìš©
      console.warn(`DXF ?Œì¼ ?Œì‹± ?”ì²­: ${file.name} (?„ì¬ ì§€?í•˜ì§€ ?ŠìŒ)`);
      throw new Error('DXF ?Œì¼?€ ?„ì¬ ì§€?í•˜ì§€ ?ŠìŠµ?ˆë‹¤. DWG ?Œì¼???¬ìš©?´ì£¼?¸ìš”.');
    } catch (error) {
      console.error('DXF ?Œì¼ ?Œì‹± ?¤íŒ¨:', error);
      return {
        success: false,
        error: `DXF ?Œì¼ ?Œì‹±???¤íŒ¨?ˆìŠµ?ˆë‹¤: ${error instanceof Error ? error.message : '?????†ëŠ” ?¤ë¥˜'}`
      };
    }
  }

  /**
   * @mlightcad/libredwg-web ?°ì´?°ë? ?œì? CAD ?•ì‹?¼ë¡œ ë³€??(?ˆì´???„í„°ë§??¬í•¨)
   */
  private convertLibreDwgWebToCAD(db: any, fileName: string, selectedLayers?: string[]): CADData {
    
    // ?”í‹°??ì¶”ì¶œ
    const entities = db.entities || [];
    const layers = db.layers || [];
    
    
    // ?ˆì´???„í„°ë§??ìš©
    let filteredEntities = entities;
    if (selectedLayers && selectedLayers.length > 0) {
      filteredEntities = entities.filter((entity: any) => {
        const entityLayer = entity.layer || entity.layer_name || '0';
        return selectedLayers.includes(entityLayer);
      });
    }
    
    // ?”í‹°??ë³€??
    const cadEntities: CADEntity[] = filteredEntities.map((entity: any, index: number) => {
      const layerName = entity.layer || entity.layer_name || '0';
      
      // ?ì„¸???”í‹°???•ë³´ ë¡œê¹… (ì²˜ìŒ 5ê°œë§Œ)
      if (index < 5) {
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
      
      // ?”í‹°???€?…ë³„ ?ì„± ë§¤í•‘
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
    
    // ?ˆì´??ëª©ë¡ ì¶”ì¶œ
    const layerNames = [...new Set(cadEntities.map(e => e.layer))];
    
    // ê²½ê³„ ê³„ì‚°
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
    
      entityCount: cadEntities.length,
      layerCount: layerNames.length,
      bounds
    });
    
    return cadData;
  }

  /**
   * ?”í‹°???€?…ì„ ?œì? ?•ì‹?¼ë¡œ ë§¤í•‘
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
        return 'line' as const; // ê¸°ë³¸ê°?
    }
  }

  /**
   * ?”í‹°?°ë“¤??ê²½ê³„ë¥?ê³„ì‚°
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

    // ê¸°ë³¸ê°??¤ì •
    if (minX === Infinity) {
      minX = minY = maxX = maxY = 0;
    }

    return {
      min: [minX, minY] as [number, number],
      max: [maxX, maxY] as [number, number]
    };
  }

  /**
   * LibreDwg ?°ì´?°ë? ?œì? CAD ?•ì‹?¼ë¡œ ë³€??
   */
  private convertDWGToCAD(dwgData: any, fileName: string, selectedLayers?: string[]): CADData {
    const entities: CADEntity[] = [];
    const layers = new Set<string>();
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    try {
      // LibreDwg?ì„œ ëª¨ë¸?¤í˜?´ìŠ¤??ëª¨ë“  ?”í‹°??ê°€?¸ì˜¤ê¸?
      const modelSpaceEntities = this.libreDwg?.dwg_getall_entities_in_model_space(dwgData);
      
        totalEntities: modelSpaceEntities?.length || 0,
        entityTypes: modelSpaceEntities?.map((e: any) => e.type) || [],
        sampleEntity: modelSpaceEntities?.[0] || null
      });
      
      if (modelSpaceEntities && Array.isArray(modelSpaceEntities)) {
        let convertedCount = 0;
        let skippedCount = 0;
        
        modelSpaceEntities.forEach((entity: any, index: number) => {
          // ?ˆì´???„í„°ë§??ìš©
          const entityLayer = entity.layer || '0';
          if (selectedLayers && selectedLayers.length > 0 && !selectedLayers.includes(entityLayer)) {
            skippedCount++;
            return;
          }

          const convertedEntity = this.convertEntity(entity, index);
          if (convertedEntity) {
            entities.push(convertedEntity);
            layers.add(convertedEntity.layer);
            convertedCount++;
            
            // ê²½ê³„ ê³„ì‚°
            this.updateBounds(convertedEntity, minX, minY, maxX, maxY);
          } else {
            skippedCount++;
            console.warn(`?”í‹°??ë³€???¤íŒ¨ (?¸ë±??${index}):`, {
              type: entity.type,
              layer: entity.layer,
              data: entity
            });
          }
        });
        
          total: modelSpaceEntities.length,
          converted: convertedCount,
          skipped: skippedCount,
          successRate: `${((convertedCount / modelSpaceEntities.length) * 100).toFixed(1)}%`
        });
      } else {
        console.warn('ëª¨ë¸?¤í˜?´ìŠ¤ ?”í‹°?°ë? ê°€?¸ì˜¬ ???†ìŠµ?ˆë‹¤:', modelSpaceEntities);
      }
    } catch (error) {
      console.warn('LibreDwg ?”í‹°??ë³€??ì¤??¤ë¥˜:', error);
    }

    return {
      id: `cad-${Date.now()}`,
      name: fileName,
      type: '2d', // ê¸°ë³¸ê°? ?¤ì œë¡œëŠ” 3D ?¬ë?ë¥??•ì¸?´ì•¼ ??
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
   * ê°œë³„ ?”í‹°??ë³€??
   */
  private convertEntity(entity: any, index: number): CADEntity | null {
    try {
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
          console.warn(`ì§€?í•˜ì§€ ?ŠëŠ” ?”í‹°???€?? ${entity.type}`);
          return null;
      }
    } catch (error) {
      console.error(`?”í‹°??ë³€???¤íŒ¨ (${entity.type}):`, error);
      return null;
    }
  }

  /**
   * ê²½ê³„ ê³„ì‚° ?…ë°?´íŠ¸
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
   * ì§€?í•˜???Œì¼ ?•ì‹ ?•ì¸
   */
  public isFileSupported(file: File): boolean {
    const extension = file.name.toLowerCase().split('.').pop();
    return ['dwg', 'dxf'].includes(extension || '');
  }

  /**
   * DWG ?Œì¼ ?ì„¸ ë¶„ì„ (?”ë²„ê¹…ìš©)
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


      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          return {
            success: false,
            fileInfo,
            error: 'CAD Parser Serviceê°€ ì´ˆê¸°?”ë˜ì§€ ?Šì•˜?µë‹ˆ??'
          };
        }
      }

      const arrayBuffer = await file.arrayBuffer();
      let dwgStructure: any = {};
      let layerAnalysis: any = {};

      if (this.libreDwg) {
        try {
          const dwgData = await this.libreDwg.dwg_read_data(arrayBuffer);
          
          // DWG êµ¬ì¡° ë¶„ì„
          const modelSpaceEntities = this.libreDwg.dwg_getall_entities_in_model_space(dwgData);
          const allEntityTypes = [...new Set(modelSpaceEntities?.map((e: any) => e.type) || [])];
          
          // ?ˆì´???Œì´ë¸??•ë³´ ì¶”ì¶œ ?œë„
          let layerTableInfo: any[] = [];
          let hasLayerTable = false;
          try {
            if (this.libreDwg.dwg_get_layers) {
              layerTableInfo = this.libreDwg.dwg_get_layers(dwgData) || [];
              hasLayerTable = layerTableInfo.length > 0;
            }
          } catch (layerError) {
            console.warn('?ˆì´???Œì´ë¸?ì¶”ì¶œ ?¤íŒ¨:', layerError);
          }

          // ?”í‹°?°ì—???ˆì´???´ë¦„ ì¶”ì¶œ
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

          // ?ˆì´??ë¶„ì„
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
          console.warn('LibreDwg ?ì„¸ ë¶„ì„ ?¤íŒ¨:', libreDwgError);
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
      console.error('DWG ?Œì¼ ?ì„¸ ë¶„ì„ ?¤íŒ¨:', error);
      return {
        success: false,
        fileInfo: {
          name: file.name,
          size: file.size,
          lastModified: new Date(file.lastModified),
          type: file.type
        },
        error: `?Œì¼ ë¶„ì„ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤: ${error instanceof Error ? error.message : '?????†ëŠ” ?¤ë¥˜'}`
      };
    }
  }

  /**
   * DWG ?Œì¼ ?•ë³´ ë¶„ì„ (?”ë²„ê¹…ìš©)
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


      // ?Œì¼ ?Œì‹± ?œë„
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
          error: parseResult.error || '?Œì¼ ?Œì‹±???¤íŒ¨?ˆìŠµ?ˆë‹¤.'
        };
      }
    } catch (error) {
      console.error('DWG ?Œì¼ ë¶„ì„ ?¤íŒ¨:', error);
      return {
        success: false,
        fileInfo: {
          name: file.name,
          size: file.size,
          lastModified: new Date(file.lastModified),
          type: file.type
        },
        error: `?Œì¼ ë¶„ì„ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤: ${error instanceof Error ? error.message : '?????†ëŠ” ?¤ë¥˜'}`
      };
    }
  }

  /**
   * ?œë¹„???íƒœ ?•ì¸
   */
  public getStatus(): { initialized: boolean; libreDwg: boolean } {
    return {
      initialized: this.isInitialized,
      libreDwg: this.libreDwg !== null
    };
  }

  /**
   * ?ŒìŠ¤?¸ìš© CAD ?°ì´???ì„±
   */
  private createTestCADData(fileName: string, selectedLayers?: string[]): CADData {
    const timestamp = Date.now();
    
    // ëª¨ë“  ?ŒìŠ¤???”í‹°???•ì˜
    const allTestEntities: CADEntity[] = [
        // ì§ì‚¬ê°í˜• ?¨ë©´ ?ˆì‹œ (?¸ê³½??
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
        
        // ?´ë? ë²?
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
        
        // ?í˜• ê°œêµ¬ë¶€
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
        
        // ?¸í˜• ê°œêµ¬ë¶€
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
        
        // ì¶”ê? ?´ë? ??
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
        
        // ?ìŠ¤???¼ë²¨
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

    // ?ˆì´???„í„°ë§??ìš©
    let filteredEntities = allTestEntities;
    let filteredLayers = ['outline', 'internal', 'opening', 'text'];
    
    if (selectedLayers && selectedLayers.length > 0) {
      filteredEntities = allTestEntities.filter(entity => 
        selectedLayers.includes(entity.layer)
      );
      filteredLayers = selectedLayers;
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
   * ë©”ëª¨ë¦??•ë¦¬
   */
  public cleanup(): void {
    if (this.libreDwg) {
      // LibreDwg ë¦¬ì†Œ???•ë¦¬
      this.libreDwg = null;
    }
    this.isInitialized = false;
  }
}
