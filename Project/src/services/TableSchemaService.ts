import { TableSchema, TableField, FieldType, ValidationRule } from '../types';

export class TableSchemaService {
  private static instance: TableSchemaService;
  private schemas: Map<string, TableSchema>;

  private constructor() {
    this.schemas = new Map();
    this.initializeDefaultSchemas();
  }

  public static getInstance(): TableSchemaService {
    if (!TableSchemaService.instance) {
      TableSchemaService.instance = new TableSchemaService();
    }
    return TableSchemaService.instance;
  }

  // 기본 테이블 스키마 초기화
  private initializeDefaultSchemas(): void {
    // 테이블-1: 기본 정보 테이블
    const table1Schema: TableSchema = {
      id: 'table-1',
      name: 'table-1',
      displayName: '기본 정보 테이블',
      description: '프로젝트의 기본 정보를 담는 테이블',
      fields: [
        {
          id: 'field-1-1',
          name: 'project_name',
          displayName: '프로젝트명',
          type: 'text',
          required: true,
          description: '프로젝트의 이름'
        },
        {
          id: 'field-1-2',
          name: 'project_code',
          displayName: '프로젝트 코드',
          type: 'text',
          required: true,
          description: '프로젝트 식별 코드'
        },
        {
          id: 'field-1-3',
          name: 'start_date',
          displayName: '시작일',
          type: 'date',
          required: true,
          description: '프로젝트 시작 날짜'
        },
        {
          id: 'field-1-4',
          name: 'end_date',
          displayName: '종료일',
          type: 'date',
          required: false,
          description: '프로젝트 종료 날짜'
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 테이블-2: 상세 정보 테이블
    const table2Schema: TableSchema = {
      id: 'table-2',
      name: 'table-2',
      displayName: '상세 정보 테이블',
      description: '프로젝트의 상세 정보를 담는 테이블',
      fields: [
        {
          id: 'field-2-1',
          name: 'description',
          displayName: '설명',
          type: 'text',
          required: false,
          description: '프로젝트에 대한 상세 설명'
        },
        {
          id: 'field-2-2',
          name: 'budget',
          displayName: '예산',
          type: 'decimal',
          required: false,
          description: '프로젝트 예산',
          validationRules: [
            {
              type: 'min',
              value: 0,
              message: '예산은 0 이상이어야 합니다.'
            }
          ]
        },
        {
          id: 'field-2-3',
          name: 'status',
          displayName: '상태',
          type: 'text',
          required: true,
          description: '프로젝트 진행 상태'
        },
        {
          id: 'field-2-4',
          name: 'priority',
          displayName: '우선순위',
          type: 'integer',
          required: false,
          description: '프로젝트 우선순위 (1-5)',
          validationRules: [
            {
              type: 'min',
              value: 1,
              message: '우선순위는 1 이상이어야 합니다.'
            },
            {
              type: 'max',
              value: 5,
              message: '우선순위는 5 이하여야 합니다.'
            }
          ]
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 테이블-3: 리소스 테이블
    const table3Schema: TableSchema = {
      id: 'table-3',
      name: 'table-3',
      displayName: '리소스 테이블',
      description: '프로젝트에 할당된 리소스 정보를 담는 테이블',
      fields: [
        {
          id: 'field-3-1',
          name: 'resource_name',
          displayName: '리소스명',
          type: 'text',
          required: true,
          description: '리소스의 이름'
        },
        {
          id: 'field-3-2',
          name: 'resource_type',
          displayName: '리소스 타입',
          type: 'text',
          required: true,
          description: '리소스의 유형 (인력, 장비, 자재 등)'
        },
        {
          id: 'field-3-3',
          name: 'quantity',
          displayName: '수량',
          type: 'number',
          required: true,
          description: '리소스 수량',
          validationRules: [
            {
              type: 'min',
              value: 1,
              message: '수량은 1 이상이어야 합니다.'
            }
          ]
        },
        {
          id: 'field-3-4',
          name: 'unit_cost',
          displayName: '단가',
          type: 'decimal',
          required: false,
          description: '리소스 단위 비용',
          validationRules: [
            {
              type: 'min',
              value: 0,
              message: '단가는 0 이상이어야 합니다.'
            }
          ]
        },
        {
          id: 'field-3-5',
          name: 'is_available',
          displayName: '사용 가능 여부',
          type: 'boolean',
          required: true,
          description: '리소스 사용 가능 여부'
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.schemas.set('table-1', table1Schema);
    this.schemas.set('table-2', table2Schema);
    this.schemas.set('table-3', table3Schema);
  }

  // 모든 테이블 스키마 가져오기
  public getAllSchemas(): TableSchema[] {
    return Array.from(this.schemas.values());
  }

  // 특정 테이블 스키마 가져오기
  public getSchema(tableId: string): TableSchema | undefined {
    return this.schemas.get(tableId);
  }

  // 테이블 스키마 존재 여부 확인
  public hasSchema(tableId: string): boolean {
    return this.schemas.has(tableId);
  }

  // 테이블 스키마 추가
  public addSchema(schema: TableSchema): void {
    if (this.schemas.has(schema.id)) {
      throw new Error(`테이블 스키마 '${schema.id}'가 이미 존재합니다.`);
    }
    
    schema.createdAt = new Date();
    schema.updatedAt = new Date();
    this.schemas.set(schema.id, schema);
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
  }

  // 테이블 스키마 삭제
  public deleteSchema(tableId: string): void {
    if (!this.schemas.has(tableId)) {
      throw new Error(`테이블 스키마 '${tableId}'를 찾을 수 없습니다.`);
    }

    this.schemas.delete(tableId);
  }

  // 테이블 필드 추가
  public addField(tableId: string, field: TableField): void {
    const schema = this.schemas.get(tableId);
    if (!schema) {
      throw new Error(`테이블 스키마 '${tableId}'를 찾을 수 없습니다.`);
    }

    if (schema.fields.some(f => f.name === field.name)) {
      throw new Error(`필드 '${field.name}'가 이미 존재합니다.`);
    }

    schema.fields.push(field);
    schema.updatedAt = new Date();
    this.schemas.set(tableId, schema);
  }

  // 테이블 필드 업데이트
  public updateField(tableId: string, fieldName: string, updates: Partial<TableField>): void {
    const schema = this.schemas.get(tableId);
    if (!schema) {
      throw new Error(`테이블 스키마 '${tableId}'를 찾을 수 없습니다.`);
    }

    const fieldIndex = schema.fields.findIndex(f => f.name === fieldName);
    if (fieldIndex === -1) {
      throw new Error(`필드 '${fieldName}'를 찾을 수 없습니다.`);
    }

    schema.fields[fieldIndex] = {
      ...schema.fields[fieldIndex],
      ...updates
    };
    schema.updatedAt = new Date();
    this.schemas.set(tableId, schema);
  }

  // 테이블 필드 삭제
  public deleteField(tableId: string, fieldName: string): void {
    const schema = this.schemas.get(tableId);
    if (!schema) {
      throw new Error(`테이블 스키마 '${tableId}'를 찾을 수 없습니다.`);
    }

    const fieldIndex = schema.fields.findIndex(f => f.name === fieldName);
    if (fieldIndex === -1) {
      throw new Error(`필드 '${fieldName}'를 찾을 수 없습니다.`);
    }

    schema.fields.splice(fieldIndex, 1);
    schema.updatedAt = new Date();
    this.schemas.set(tableId, schema);
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
