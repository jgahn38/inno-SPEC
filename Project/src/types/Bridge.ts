export interface Bridge {
  id: string;
  name: string;
  description: string;
  type: 'concrete' | 'steel' | 'composite';
  length: number;
  width: number;
}
