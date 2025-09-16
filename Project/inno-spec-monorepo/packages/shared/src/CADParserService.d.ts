export interface CADEntity {
    id: string;
    type: 'line' | 'circle' | 'arc' | 'polyline' | 'text' | 'dimension';
    layer: string;
    color?: number;
    linetype?: string;
    lineweight?: number;
    start?: [number, number];
    end?: [number, number];
    center?: [number, number];
    radius?: number;
    startAngle?: number;
    endAngle?: number;
    vertices?: [number, number][];
    closed?: boolean;
    text?: string;
    position?: [number, number];
    height?: number;
    rotation?: number;
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
//# sourceMappingURL=CADParserService.d.ts.map