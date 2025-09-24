import { 
  MCode, 
  MExecutionResult, 
  TableData, 
  CommonEngineConfig 
} from '@inno-spec/shared';
import { MParser } from './MParser';

export class MEngineService {
  private static instance: MEngineService;
  private config: CommonEngineConfig;

  private constructor() {
    this.config = {
      version: '1.0.0',
      maxExecutionTime: 30000, // 30초
      maxRecordsPerExecution: 10000,
      supportedTableTypes: ['bridge-specs', 'structure-status', 'bearing-status'],
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
  public async executeMCode(mCode: MCode, data: TableData[]): Promise<MExecutionResult> {
    const startTime = Date.now();
    
    try {
      // M 언어 파서를 사용하여 코드 실행
      const mParser = MParser.getInstance();
      const result = await mParser.execute(mCode.code, data);
      
      return {
        success: true,
        data: (result as unknown) as any[],
        error: undefined,
        executionTime: Date.now() - startTime,
        recordsProcessed: data.length,
        recordsTransformed: ((result as unknown) as any[]).length
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
        recordsProcessed: 0,
        recordsTransformed: 0
      };
    }
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