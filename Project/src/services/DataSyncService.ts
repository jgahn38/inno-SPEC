import { BridgeDatabase, DatabaseRecord, Project, TableSchema, LNBConfig, ScreenConfig, ScreenTemplate } from '../types';

export interface SyncData {
  databases: BridgeDatabase[];
  records: Record<string, DatabaseRecord[]>;
  projects: Project[];
  tableSchemas: TableSchema[];
  lnbConfigs: LNBConfig[];
  screenConfigs: ScreenConfig[];
  screenTemplates: ScreenTemplate[];
  lastSync: string;
  version: string;
}

export interface SyncOptions {
  includeDatabases?: boolean;
  includeProjects?: boolean;
  includeTableSchemas?: boolean;
  includeRecords?: boolean;
  includeLNBConfigs?: boolean;
  includeScreenConfigs?: boolean;
  includeScreenTemplates?: boolean;
}

export class DataSyncService {
  private static instance: DataSyncService;
  private readonly SYNC_VERSION = '1.0.0';
  private readonly SYNC_STORAGE_KEY = 'inno_spec_sync_info';

  private constructor() {}

  public static getInstance(): DataSyncService {
    if (!DataSyncService.instance) {
      DataSyncService.instance = new DataSyncService();
    }
    return DataSyncService.instance;
  }

  /**
   * 모든 데이터를 동기화 가능한 형태로 export
   */
  public exportAllData(): SyncData {
    const syncData: SyncData = {
      databases: this.getDatabasesFromStorage(),
      records: this.getRecordsFromStorage(),
      projects: this.getProjectsFromStorage(),
      tableSchemas: this.getTableSchemasFromMemory(),
      lnbConfigs: this.getLNBConfigsFromStorage(),
      screenConfigs: this.getScreenConfigsFromStorage(),
      screenTemplates: this.getScreenTemplatesFromStorage(),
      lastSync: new Date().toISOString(),
      version: this.SYNC_VERSION
    };

    return syncData;
  }

  /**
   * 선택적 데이터 export
   */
  public exportData(options: SyncOptions = {}): Partial<SyncData> {
    const syncData: Partial<SyncData> = {
      lastSync: new Date().toISOString(),
      version: this.SYNC_VERSION
    };

    if (options.includeDatabases !== false) {
      syncData.databases = this.getDatabasesFromStorage();
    }

    if (options.includeRecords !== false) {
      syncData.records = this.getRecordsFromStorage();
    }

    if (options.includeProjects !== false) {
      syncData.projects = this.getProjectsFromStorage();
    }

    if (options.includeTableSchemas !== false) {
      syncData.tableSchemas = this.getTableSchemasFromMemory();
    }

    if (options.includeLNBConfigs !== false) {
      syncData.lnbConfigs = this.getLNBConfigsFromStorage();
    }

    if (options.includeScreenConfigs !== false) {
      syncData.screenConfigs = this.getScreenConfigsFromStorage();
    }

    if (options.includeScreenTemplates !== false) {
      syncData.screenTemplates = this.getScreenTemplatesFromStorage();
    }

    return syncData;
  }

  /**
   * 데이터를 JSON 파일로 export (다운로드)
   */
  public exportToFile(options: SyncOptions = {}): void {
    const data = this.exportData(options);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `inno_spec_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * JSON 파일에서 데이터 import
   */
  public async importFromFile(file: File): Promise<{ success: boolean; message: string; data?: SyncData }> {
    try {
      const text = await file.text();
      const data: SyncData = JSON.parse(text);
      
      // 버전 호환성 검사
      if (!this.isVersionCompatible(data.version)) {
        return {
          success: false,
          message: `버전 호환성 문제: 현재 버전 ${this.SYNC_VERSION}, 파일 버전 ${data.version}`
        };
      }

      // 데이터 유효성 검사
      if (!this.validateSyncData(data)) {
        return {
          success: false,
          message: '데이터 형식이 올바르지 않습니다.'
        };
      }

      // 데이터 import
      await this.importData(data);
      
      return {
        success: true,
        message: '데이터가 성공적으로 import되었습니다.',
        data
      };
    } catch (error) {
      return {
        success: false,
        message: `파일 import 중 오류가 발생했습니다: ${error}`
      };
    }
  }

  /**
   * 동기화 데이터를 localStorage에 적용
   */
  public async importData(syncData: SyncData): Promise<void> {
    // 데이터베이스 import
    if (syncData.databases) {
      this.importDatabases(syncData.databases);
    }

    // 레코드 import
    if (syncData.records) {
      this.importRecords(syncData.records);
    }

    // 프로젝트 import
    if (syncData.projects) {
      this.importProjects(syncData.projects);
    }

    // 테이블 스키마 import
    if (syncData.tableSchemas) {
      this.importTableSchemas(syncData.tableSchemas);
    }

    // LNB 구성 import
    if (syncData.lnbConfigs) {
      this.importLNBConfigs(syncData.lnbConfigs);
    }

    // 화면 구성 import
    if (syncData.screenConfigs) {
      this.importScreenConfigs(syncData.screenConfigs);
    }

    // 화면 템플릿 import
    if (syncData.screenTemplates) {
      this.importScreenTemplates(syncData.screenTemplates);
    }

    // 동기화 정보 저장
    this.saveSyncInfo(syncData);
  }

  /**
   * 동기화 상태 확인
   */
  public getSyncStatus(): { lastSync: string | null; isOutdated: boolean } {
    const syncInfo = localStorage.getItem(this.SYNC_STORAGE_KEY);
    if (!syncInfo) {
      return { lastSync: null, isOutdated: true };
    }

    try {
      const info = JSON.parse(syncInfo);
      const lastSync = new Date(info.lastSync);
      const now = new Date();
      const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
      
      return {
        lastSync: info.lastSync,
        isOutdated: hoursSinceSync > 24 // 24시간 이상 지났으면 outdated로 간주
      };
    } catch {
      return { lastSync: null, isOutdated: true };
    }
  }

  /**
   * 데이터 백업 생성 (git commit용)
   */
  public createBackup(): string {
    const data = this.exportAllData();
    return JSON.stringify(data, null, 2);
  }

  /**
   * 데이터 복원 (git pull 후)
   */
  public async restoreFromBackup(backupData: string): Promise<boolean> {
    try {
      const data: SyncData = JSON.parse(backupData);
      await this.importData(data);
      return true;
    } catch (error) {
      console.error('백업 복원 실패:', error);
      return false;
    }
  }

  // Private methods

  private getDatabasesFromStorage(): BridgeDatabase[] {
    try {
      const stored = localStorage.getItem('bridge_databases');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private getRecordsFromStorage(): Record<string, DatabaseRecord[]> {
    try {
      const stored = localStorage.getItem('bridge_database_records');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  private getProjectsFromStorage(): Project[] {
    try {
      const stored = localStorage.getItem('inno_spec_projects');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private getTableSchemasFromMemory(): TableSchema[] {
    // TableSchemaService에서 스키마 가져오기
    try {
      const stored = localStorage.getItem('inno_spec_table_schemas');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private getLNBConfigsFromStorage(): LNBConfig[] {
    try {
      const stored = localStorage.getItem('lnbConfigs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private getScreenConfigsFromStorage(): ScreenConfig[] {
    try {
      const stored = localStorage.getItem('screenConfigs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private getScreenTemplatesFromStorage(): ScreenTemplate[] {
    try {
      const stored = localStorage.getItem('screenTemplates');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private importDatabases(databases: BridgeDatabase[]): void {
    localStorage.setItem('bridge_databases', JSON.stringify(databases));
  }

  private importRecords(records: Record<string, DatabaseRecord[]>): void {
    localStorage.setItem('bridge_database_records', JSON.stringify(records));
  }

  private importProjects(projects: Project[]): void {
    localStorage.setItem('inno_spec_projects', JSON.stringify(projects));
  }

  private importTableSchemas(schemas: TableSchema[]): void {
    // TableSchemaService와 연동하여 스키마 복원
    localStorage.setItem('inno_spec_table_schemas', JSON.stringify(schemas));
    
    // 앱 재시작 시 TableSchemaService가 이 데이터를 로드할 수 있도록 함
    // 실제로는 TableSchemaService의 메서드를 직접 호출하는 것이 좋음
  }

  private importLNBConfigs(configs: LNBConfig[]): void {
    localStorage.setItem('lnbConfigs', JSON.stringify(configs));
  }

  private importScreenConfigs(configs: ScreenConfig[]): void {
    localStorage.setItem('screenConfigs', JSON.stringify(configs));
  }

  private importScreenTemplates(templates: ScreenTemplate[]): void {
    localStorage.setItem('screenTemplates', JSON.stringify(templates));
  }

  private saveSyncInfo(syncData: SyncData): void {
    const syncInfo = {
      lastSync: syncData.lastSync,
      version: syncData.version
    };
    localStorage.setItem(this.SYNC_STORAGE_KEY, JSON.stringify(syncInfo));
  }

  private isVersionCompatible(fileVersion: string): boolean {
    // 간단한 버전 호환성 검사
    const current = this.SYNC_VERSION.split('.').map(Number);
    const file = fileVersion.split('.').map(Number);
    
    // 메이저 버전이 같으면 호환
    return current[0] === file[0];
  }

  private validateSyncData(data: SyncData): boolean {
    return data.version && data.lastSync;
  }
}
