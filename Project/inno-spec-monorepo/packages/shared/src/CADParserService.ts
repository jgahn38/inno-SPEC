// LibreDWG 라이브러리 타입 정의 (사용하지 않음)
// interface LibreDwg {
//   dwg_read_data(data: ArrayBuffer): Promise<any>;
//   dwg_getall_entities_in_model_space(data: any): any[];
//   dwg_get_layers(data: any): any[]; // 레이어 테이블 정보
//   dwg_get_layer_table(data: any): any; // 레이어 테이블
// }

// @mlightcad/libredwg-web 라이브러리 타입 정의 (사용하지 않음)
// interface LibreDwgWeb {
//   dwg_read_data(data: ArrayBuffer, fileType: number): any;
//   convert(dwgData: any): any;
//   dwg_free(dwgData: any): void;
// }

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
  layers: string[];
  bounds: {
    min: [number, number];
    max: [number, number];
  };
  units: string;
  scale: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CADParseResult {
  success: boolean;
  data?: CADData;
  error?: string;
  warnings?: string[];
  parseTime: number;
  entityCount: number;
}
