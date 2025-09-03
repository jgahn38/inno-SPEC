import { TableSchema, TableField, FieldType, ValidationRule } from '../types';

export class TableSchemaService {
  private static instance: TableSchemaService;
  private schemas: Map<string, TableSchema>;
  private fields: Map<string, TableField>;
  private readonly STORAGE_KEY = 'inno_spec_table_schemas';
  private readonly FIELDS_STORAGE_KEY = 'inno_spec_fields';

  private constructor() {
    this.schemas = new Map();
    this.fields = new Map();
    this.loadFromLocalStorage();
    this.loadFieldsFromLocalStorage();
  }

  // LocalStorage에서 데이터 로드
  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const schemasArray = JSON.parse(stored);
        schemasArray.forEach((schema: any) => {
          // Date 객체 복원
          schema.createdAt = new Date(schema.createdAt);
          schema.updatedAt = new Date(schema.updatedAt);
          this.schemas.set(schema.id, schema);
        });
      }
    } catch (error) {
      console.error('LocalStorage에서 테이블 스키마 로드 중 오류:', error);
    }
  }

  // LocalStorage에 데이터 저장
  private saveToLocalStorage(): void {
    try {
      const schemasArray = Array.from(this.schemas.values());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(schemasArray));
    } catch (error) {
      console.error('LocalStorage에 테이블 스키마 저장 중 오류:', error);
    }
  }

  // LocalStorage에서 필드 데이터 로드
  private loadFieldsFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem(this.FIELDS_STORAGE_KEY);
      if (stored) {
        const fieldsArray = JSON.parse(stored);
        fieldsArray.forEach((field: any) => {
          this.fields.set(field.id, field);
        });
      }
    } catch (error) {
      console.error('LocalStorage에서 필드 로드 중 오류:', error);
    }
  }

  // LocalStorage에 필드 데이터 저장
  private saveFieldsToLocalStorage(): void {
    try {
      const fieldsArray = Array.from(this.fields.values());
      localStorage.setItem(this.FIELDS_STORAGE_KEY, JSON.stringify(fieldsArray));
    } catch (error) {
      console.error('LocalStorage에 필드 저장 중 오류:', error);
    }
  }

  public static getInstance(): TableSchemaService {
    if (!TableSchemaService.instance) {
      TableSchemaService.instance = new TableSchemaService();
    }
    return TableSchemaService.instance;
  }



  // 모든 테이블 스키마 가져오기
  public getAllSchemas(): TableSchema[] {
    return Array.from(this.schemas.values());
  }

  // 모든 필드 가져오기
  public getAllFields(): TableField[] {
    return Array.from(this.fields.values());
  }

  // 특정 테이블 스키마 가져오기
  public getSchema(tableId: string): TableSchema | undefined {
    return this.schemas.get(tableId);
  }

  // 특정 필드 가져오기
  public getField(fieldId: string): TableField | undefined {
    return this.fields.get(fieldId);
  }

  // 테이블 스키마 존재 여부 확인
  public hasSchema(tableId: string): boolean {
    return this.schemas.has(tableId);
  }

  // 필드 존재 여부 확인
  public hasField(fieldId: string): boolean {
    return this.fields.has(fieldId);
  }

  // 테이블 스키마 추가
  public addSchema(schema: TableSchema): void {
    if (this.schemas.has(schema.id)) {
      throw new Error(`테이블 스키마 '${schema.id}'가 이미 존재합니다.`);
    }
    
    schema.createdAt = new Date();
    schema.updatedAt = new Date();
    this.schemas.set(schema.id, schema);
    this.saveToLocalStorage(); // 스키마 추가 후 저장
  }

  // 필드 추가
  public addField(field: TableField): void {
    if (this.fields.has(field.id)) {
      throw new Error(`필드 '${field.id}'가 이미 존재합니다.`);
    }
    
    this.fields.set(field.id, field);
    this.saveFieldsToLocalStorage(); // 필드 추가 후 저장
  }

  // 테이블 스키마 업데이트
  public updateSchema(tableId: string, updates: Partial<TableSchema>): void {
    const existingSchema = this.schemas.get(tableId);
    if (!existingSchema) {
      throw new Error(`테이블 스키마 '${tableId}'를 찾을 수 없습니다.`);
    }

    const updatedSchema: TableSchema = {
      ...existingSchema,
      ...updates,
      updatedAt: new Date()
    };

    this.schemas.set(tableId, updatedSchema);
    this.saveToLocalStorage(); // 스키마 업데이트 후 저장
  }

  // 필드 업데이트
  public updateField(fieldId: string, updates: Partial<TableField>): void {
    const existingField = this.fields.get(fieldId);
    if (!existingField) {
      throw new Error(`필드 '${fieldId}'를 찾을 수 없습니다.`);
    }

    const updatedField: TableField = {
      ...existingField,
      ...updates
    };

    this.fields.set(fieldId, updatedField);
    this.saveFieldsToLocalStorage(); // 필드 업데이트 후 저장
  }

  // 테이블 스키마 삭제
  public deleteSchema(tableId: string): void {
    if (!this.schemas.has(tableId)) {
      throw new Error(`테이블 스키마 '${tableId}'를 찾을 수 없습니다.`);
    }

    this.schemas.delete(tableId);
    this.saveToLocalStorage(); // 스키마 삭제 후 저장
  }

  // 필드 삭제
  public deleteField(fieldId: string): void {
    if (!this.fields.has(fieldId)) {
      throw new Error(`필드 '${fieldId}'를 찾을 수 없습니다.`);
    }

    this.fields.delete(fieldId);
    this.saveFieldsToLocalStorage(); // 필드 삭제 후 저장
  }

  // 지원되는 필드 타입 가져오기
  public getSupportedFieldTypes(): FieldType[] {
    return ['text', 'number', 'date', 'boolean', 'decimal', 'integer'];
  }

  // 기본 검증 규칙 가져오기
  public getDefaultValidationRules(): ValidationRule[] {
    return [
      {
        type: 'min',
        value: 0,
        message: '값은 0 이상이어야 합니다.'
      },
      {
        type: 'max',
        value: 100,
        message: '값은 100 이하여야 합니다.'
      }
    ];
  }
}
