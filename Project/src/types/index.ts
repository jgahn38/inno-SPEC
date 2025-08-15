export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'completed' | 'draft';
  bridges: Bridge[];
}

export interface Bridge {
  id: string;
  name: string;
  description: string;
  type: 'concrete' | 'steel' | 'composite';
  length: number;
  width: number;
}

export interface TableRow {
  id: string;
  parameter: string;
  value: string;
  unit: string;
  description: string;
}

export interface CheckItem {
  id: string;
  category: string;
  description: string;
  result: 'OK' | 'NG' | 'PENDING';
  value?: string;
  criteria?: string;
}