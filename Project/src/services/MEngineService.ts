import { 
  MCode, 
  MTransformation, 
  MExecutionResult, 
  TableData, 
  TableSchema,
  CommonEngineConfig 
} from '../types';
import { MParser } from './MParser';

export class MEngineService {
  private static instance: MEngineService;
  private config: CommonEngineConfig;

  private constructor() {
    this.config = {
      version: '1.0.0',
      supportedTableTypes: ['table-1', 'table-2', 'table-3'],
      maxExecutionTime: 30000, // 30초
      maxRecordsPerExecution: 10000,
      defaultValidationRules: []
    };
  }

  public static getInstance(): MEngineService {
    if (!MEngineService.instance) {
      MEngineService.instance = new MEngineService();
    }
    return MEngineService.instance;
  }

  // M 언어 코드 실행
  public async executeMCode(
    mCode: MCode, 
    tableData: TableData
  ): Promise<MExecutionResult> {
    const startTime = Date.now();
    
    try {
      // 실행 시간 제한 체크
      if (tableData.rowCount > this.config.maxRecordsPerExecution) {
        throw new Error(`최대 처리 가능 레코드 수를 초과했습니다. (${tableData.rowCount} > ${this.config.maxRecordsPerExecution})`);
      }

      // 새로운 M 언어 파서 사용
      const mParser = MParser.getInstance();
      const result = await mParser.execute(mCode.code, tableData.data);
      
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'M 언어 실행 중 오류가 발생했습니다.',
        executionTime,
        recordsProcessed: tableData.rowCount,
        recordsTransformed: 0
      };
    }
  }

  // M 언어 코드 파싱 및 실행 (간단한 구현)
  private async parseAndExecuteMCode(mCode: string, data: Record<string, any>[]): Promise<Record<string, any>[]> {
    // 실제 구현에서는 M 언어 파서를 사용해야 합니다
    // 현재는 기본적인 변환 로직만 구현
    
    const lines = mCode.split('\n').filter(line => line.trim());
    let transformedData = [...data];

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('//')) continue; // 주석 무시
      
      // 간단한 변환 규칙들
      if (trimmedLine.includes('Text.Upper')) {
        transformedData = this.applyTextUpper(transformedData, this.extractColumnName(trimmedLine));
      } else if (trimmedLine.includes('Text.Lower')) {
        transformedData = this.applyTextLower(transformedData, this.extractColumnName(trimmedLine));
      } else if (trimmedLine.includes('Number.Round')) {
        transformedData = this.applyNumberRound(transformedData, this.extractColumnName(trimmedLine));
      }
    }

    return transformedData;
  }

  // 텍스트 대문자 변환
  private applyTextUpper(data: Record<string, any>[], columnName: string): Record<string, any>[] {
    return data.map(row => ({
      ...row,
      [columnName]: typeof row[columnName] === 'string' ? row[columnName].toUpperCase() : row[columnName]
    }));
  }

  // 텍스트 소문자 변환
  private applyTextLower(data: Record<string, any>[], columnName: string): Record<string, any>[] {
    return data.map(row => ({
      ...row,
      [columnName]: typeof row[columnName] === 'string' ? row[columnName].toLowerCase() : row[columnName]
    }));
  }

  // 숫자 반올림
  private applyNumberRound(data: Record<string, any>[], columnName: string): Record<string, any>[] {
    return data.map(row => ({
      ...row,
      [columnName]: typeof row[columnName] === 'number' ? Math.round(row[columnName]) : row[columnName]
    }));
  }

  // 컬럼명 추출 (간단한 구현)
  private extractColumnName(line: string): string {
    const match = line.match(/["']([^"']+)["']/);
    return match ? match[1] : 'unknown';
  }

  // 공통 엔진 설정 가져오기
  public getConfig(): CommonEngineConfig {
    return { ...this.config };
  }

  // 공통 엔진 설정 업데이트
  public updateConfig(newConfig: Partial<CommonEngineConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // 지원되는 테이블 타입 확인
  public isTableTypeSupported(tableType: string): boolean {
    return this.config.supportedTableTypes.includes(tableType);
  }

  // M 언어 코드 유효성 검사
  public validateMCode(code: string): { isValid: boolean; errors: string[] } {
    const mParser = MParser.getInstance();
    return mParser.validate(code);
  }
}
