import { VariableDefinition } from '@inno-spec/shared';

class VariableService {
  private static instance: VariableService;
  private variables: VariableDefinition[] = [];
  private listeners: Array<(variables: VariableDefinition[]) => void> = [];
  private readonly STORAGE_KEY = 'bridge_variables';

  private constructor() {
    this.loadFromLocalStorage();
  }

  public static getInstance(): VariableService {
    if (!VariableService.instance) {
      VariableService.instance = new VariableService();
    }
    return VariableService.instance;
  }



  public getVariables(): VariableDefinition[] {
    return [...this.variables];
  }

  public addVariable(variable: VariableDefinition): void {
    this.variables.push(variable);
    this.saveToLocalStorage();
    this.notifyListeners();
  }

  public updateVariable(id: string, updates: Partial<VariableDefinition>): void {
    const index = this.variables.findIndex(v => v.id === id);
    if (index !== -1) {
      this.variables[index] = { ...this.variables[index], ...updates, updatedAt: new Date() };
      this.saveToLocalStorage();
      this.notifyListeners();
    }
  }

  public deleteVariable(id: string): void {
    this.variables = this.variables.filter(v => v.id !== id);
    this.saveToLocalStorage();
    this.notifyListeners();
  }

  public subscribe(listener: (variables: VariableDefinition[]) => void): () => void {
    this.listeners.push(listener);
    // 초기 데이터 전달
    listener(this.getVariables());
    
    // 구독 해제 함수 반환
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getVariables()));
  }

  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.variables = parsed.map((v: any) => ({
          ...v,
          createdAt: new Date(v.createdAt),
          updatedAt: new Date(v.updatedAt)
        }));
      }
    } catch (error) {
      console.error('Failed to load variables from localStorage:', error);
      this.variables = [];
    }
  }

  private saveToLocalStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.variables));
    } catch (error) {
      console.error('Failed to save variables to localStorage:', error);
    }
  }

  // ScreenCanvas에서 사용할 수 있는 형태로 변환
  public getVariablesForScreenCanvas(): any[] {
    return this.variables.map(variable => ({
      id: variable.id,
      name: variable.name,
      displayName: variable.description || variable.name,
      type: variable.type,
      unit: variable.unit
    }));
  }
}

export const variableService = VariableService.getInstance();
