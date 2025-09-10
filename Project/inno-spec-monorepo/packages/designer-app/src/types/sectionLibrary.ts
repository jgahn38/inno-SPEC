export interface Point {
  id: number;
  x: number;
  y: number;
  chamfer: {
    x: number;
    y: number;
  };
}

export interface Line {
  id: number;
  startPoint: number;
  endPoint: number;
  type: 'line' | 'arc';
  centerPoint?: {
    x: number;
    y: number;
  };
  radius?: number;
}

export interface Dimension {
  id: number;
  startPoint: number;
  endPoint: number;
  value: number;
  direction: 'horizontal' | 'vertical' | 'diagonal';
  fixedPoint: number | 'center';
  label: string;
}

export interface SectionDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  points: Point[];
  lines: Line[];
  dimensions: Dimension[];
}

export interface SectionCategory {
  id: string;
  name: string;
  description: string;
}

export interface SectionLibrary {
  sections: SectionDefinition[];
  categories: SectionCategory[];
}