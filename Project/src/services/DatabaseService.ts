import { 
  BridgeDatabase, 
  DatabaseCategory, 
  DatabaseField, 
  DatabaseRecord, 
  CreateDatabaseRequest, 
  UpdateDatabaseRequest,
  DatabaseImportResult 
} from '../types';

export class DatabaseService {
  private static instance: DatabaseService;
  private databases: Map<string, BridgeDatabase>;
  private records: Map<string, DatabaseRecord[]>;
  private readonly STORAGE_KEY_DATABASES = 'bridge_databases';
  private readonly STORAGE_KEY_RECORDS = 'bridge_database_records';

  private constructor() {
    this.databases = new Map();
    this.records = new Map();
    this.loadFromLocalStorage();
    this.initializeDefaultDatabases();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // LocalStorage에서 데이터 로드
  private loadFromLocalStorage(): void {
    try {
      // 데이터베이스 로드
      const storedDatabases = localStorage.getItem(this.STORAGE_KEY_DATABASES);
      if (storedDatabases) {
        const databasesArray = JSON.parse(storedDatabases);
        databasesArray.forEach((db: any) => {
          // Date 객체 복원
          db.createdAt = new Date(db.createdAt);
          db.updatedAt = new Date(db.updatedAt);
          db.lastUpdated = new Date(db.lastUpdated);
          this.databases.set(db.id, db);
        });
      }

      // 레코드 로드
      const storedRecords = localStorage.getItem(this.STORAGE_KEY_RECORDS);
      if (storedRecords) {
        const recordsData = JSON.parse(storedRecords);
        Object.keys(recordsData).forEach(databaseId => {
          const records = recordsData[databaseId].map((record: any) => ({
            ...record,
            createdAt: new Date(record.createdAt),
            updatedAt: new Date(record.updatedAt)
          }));
          this.records.set(databaseId, records);
        });
      }
    } catch (error) {
      console.error('LocalStorage에서 데이터 로드 중 오류:', error);
    }
  }

  // LocalStorage에 데이터 저장
  private saveToLocalStorage(): void {
    try {
      // 데이터베이스 저장
      const databasesArray = Array.from(this.databases.values());
      localStorage.setItem(this.STORAGE_KEY_DATABASES, JSON.stringify(databasesArray));

      // 레코드 저장
      const recordsData: Record<string, any[]> = {};
      this.records.forEach((records, databaseId) => {
        recordsData[databaseId] = records;
      });
      localStorage.setItem(this.STORAGE_KEY_RECORDS, JSON.stringify(recordsData));
    } catch (error) {
      console.error('LocalStorage에 데이터 저장 중 오류:', error);
    }
  }

  // 기본 DB 초기화
  private initializeDefaultDatabases(): void {
    // 이미 기본 DB가 존재하면 초기화하지 않음
    if (this.databases.size > 0) {
      return;
    }

    // 교량받침DB
    const bearingDB: BridgeDatabase = {
      id: 'db-bearing-1',
      name: 'bearing_database',
      displayName: '교량받침DB',
      description: '교량받침의 물리적 특성 및 내진성능 관련 데이터베이스',
      category: 'bearing',
      version: '1.0.0',
      lastUpdated: new Date(),
      recordCount: 0,
      isActive: true,
      metadata: {
        source: 'KICT 표준',
        lastMaintenance: new Date().toISOString()
      },
      fields: [
        {
          id: 'field-bearing-1',
          name: 'bearing_type',
          displayName: '받침 유형',
          type: 'text',
          unit: '',
          description: '받침의 종류 (고정받침, 이동받침, 롤러받침 등)',
          isRequired: true,
          defaultValue: '',
          validationRules: []
        },
        {
          id: 'field-bearing-2',
          name: 'material',
          displayName: '재료',
          type: 'text',
          unit: '',
          description: '받침 제작 재료',
          isRequired: true,
          defaultValue: '',
          validationRules: []
        },
        {
          id: 'field-bearing-3',
          name: 'load_capacity',
          displayName: '하중용량',
          type: 'number',
          unit: 'kN',
          description: '받침이 견딜 수 있는 최대 하중',
          isRequired: true,
          defaultValue: 0,
          validationRules: []
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 내진DB
    const seismicDB: BridgeDatabase = {
      id: 'db-seismic-1',
      name: 'seismic_database',
      displayName: '내진DB',
      description: '지진하중 및 내진설계 관련 데이터베이스',
      category: 'seismic',
      version: '1.0.0',
      lastUpdated: new Date(),
      recordCount: 0,
      isActive: true,
      metadata: {
        source: '국토교통부 기준',
        lastMaintenance: new Date().toISOString()
      },
      fields: [
        {
          id: 'field-seismic-1',
          name: 'seismic_zone',
          displayName: '지진대',
          type: 'text',
          unit: '',
          description: '지진대 분류 (1등급, 2등급, 3등급)',
          isRequired: true,
          defaultValue: '',
          validationRules: []
        },
        {
          id: 'field-seismic-2',
          name: 'design_acceleration',
          displayName: '설계지반가속도',
          type: 'decimal',
          unit: 'g',
          description: '설계 기준 지반가속도',
          isRequired: true,
          defaultValue: 0,
          validationRules: []
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 재료DB
    const materialDB: BridgeDatabase = {
      id: 'db-material-1',
      name: 'material_database',
      displayName: '재료DB',
      description: '콘크리트, 철근 등 건설재료의 물성 데이터베이스',
      category: 'material',
      version: '1.0.0',
      lastUpdated: new Date(),
      recordCount: 0,
      isActive: true,
      metadata: {
        source: 'KS 표준',
        lastMaintenance: new Date().toISOString()
      },
      fields: [
        {
          id: 'field-material-1',
          name: 'material_name',
          displayName: '재료명',
          type: 'text',
          unit: '',
          description: '재료의 명칭',
          isRequired: true,
          defaultValue: '',
          validationRules: []
        },
        {
          id: 'field-material-2',
          name: 'compressive_strength',
          displayName: '압축강도',
          type: 'number',
          unit: 'MPa',
          description: '재료의 압축강도',
          isRequired: true,
          defaultValue: 0,
          validationRules: []
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.databases.set(bearingDB.id, bearingDB);
    this.databases.set(seismicDB.id, seismicDB);
    this.databases.set(materialDB.id, materialDB);
    this.records.set(bearingDB.id, []);
    this.records.set(seismicDB.id, []);
    this.records.set(materialDB.id, []);
    this.saveToLocalStorage(); // 기본 DB 초기화 후 저장
  }

  // 모든 DB 가져오기
  public getAllDatabases(): BridgeDatabase[] {
    return Array.from(this.databases.values());
  }

  // 활성 DB만 가져오기
  public getActiveDatabases(): BridgeDatabase[] {
    return Array.from(this.databases.values()).filter(db => db.isActive);
  }

  // 카테고리별 DB 가져오기
  public getDatabasesByCategory(category: DatabaseCategory): BridgeDatabase[] {
    return Array.from(this.databases.values()).filter(db => db.category === category);
  }

  // 특정 DB 가져오기
  public getDatabase(id: string): BridgeDatabase | undefined {
    return this.databases.get(id);
  }

  // DB 생성
  public createDatabase(request: CreateDatabaseRequest): BridgeDatabase {
    const id = `db-${request.category}-${Date.now()}`;
    
    const database: BridgeDatabase = {
      id,
      name: request.name,
      displayName: request.displayName,
      description: request.description,
      category: request.category,
      version: '1.0.0',
      lastUpdated: new Date(),
      recordCount: 0,
      isActive: true,
      metadata: request.metadata || {},
      fields: request.fields || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.databases.set(id, database);
    this.records.set(id, []);
    this.saveToLocalStorage(); // 데이터베이스 생성 후 저장
    
    return database;
  }

  // DB 업데이트
  public updateDatabase(id: string, updates: UpdateDatabaseRequest): BridgeDatabase {
    const database = this.databases.get(id);
    if (!database) {
      throw new Error(`데이터베이스 '${id}'를 찾을 수 없습니다.`);
    }

    const updatedDatabase: BridgeDatabase = {
      ...database,
      ...updates,
      updatedAt: new Date()
    };

    this.databases.set(id, updatedDatabase);
    this.saveToLocalStorage(); // 데이터베이스 업데이트 후 저장
    return updatedDatabase;
  }

  // DB 삭제
  public deleteDatabase(id: string): void {
    if (!this.databases.has(id)) {
      throw new Error(`데이터베이스 '${id}'를 찾을 수 없습니다.`);
    }

    this.databases.delete(id);
    this.records.delete(id);
    this.saveToLocalStorage(); // 데이터베이스 삭제 후 저장
  }

  // DB 활성화/비활성화
  public toggleDatabaseStatus(id: string): BridgeDatabase {
    const database = this.databases.get(id);
    if (!database) {
      throw new Error(`데이터베이스 '${id}'를 찾을 수 없습니다.`);
    }

    const updatedDatabase: BridgeDatabase = {
      ...database,
      isActive: !database.isActive,
      updatedAt: new Date()
    };

    this.databases.set(id, updatedDatabase);
    this.saveToLocalStorage(); // 데이터베이스 상태 변경 후 저장
    return updatedDatabase;
  }

  // DB 레코드 추가
  public addRecord(databaseId: string, data: Record<string, any>): DatabaseRecord {
    const database = this.databases.get(databaseId);
    if (!database) {
      throw new Error(`데이터베이스 '${databaseId}'를 찾을 수 없습니다.`);
    }

    const record: DatabaseRecord = {
      id: `record-${Date.now()}`,
      databaseId,
      data,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const records = this.records.get(databaseId) || [];
    records.push(record);
    this.records.set(databaseId, records);
    this.saveToLocalStorage(); // 레코드 추가 후 저장

    // DB 레코드 수 업데이트
    database.recordCount = records.length;
    database.lastUpdated = new Date();
    this.databases.set(databaseId, database);
    this.saveToLocalStorage(); // DB 레코드 수 업데이트 후 저장

    return record;
  }

  // 여러 레코드 한 번에 추가
  public addRecords(databaseId: string, dataArray: Record<string, any>[]): DatabaseRecord[] {
    const database = this.databases.get(databaseId);
    if (!database) {
      throw new Error(`데이터베이스 '${databaseId}'를 찾을 수 없습니다.`);
    }

    const records = this.records.get(databaseId) || [];
    const newRecords: DatabaseRecord[] = [];

    dataArray.forEach(data => {
      const record: DatabaseRecord = {
        id: `record-${Date.now()}-${Math.random()}`,
        databaseId,
        data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      records.push(record);
      newRecords.push(record);
    });

    this.records.set(databaseId, records);
    this.saveToLocalStorage(); // 레코드 추가 후 저장

    // DB 레코드 수 업데이트
    database.recordCount = records.length;
    database.lastUpdated = new Date();
    this.databases.set(databaseId, database);
    this.saveToLocalStorage(); // DB 레코드 수 업데이트 후 저장

    return newRecords;
  }

  // DB 레코드 가져오기
  public getRecords(databaseId: string): DatabaseRecord[] {
    return this.records.get(databaseId) || [];
  }

  // DB 레코드 검색
  public searchRecords(databaseId: string, query: Record<string, any>): DatabaseRecord[] {
    const records = this.getRecords(databaseId);
    return records.filter(record => {
      return Object.entries(query).every(([key, value]) => {
        return record.data[key] === value;
      });
    });
  }

  // 지원되는 DB 카테고리 가져오기
  public getSupportedCategories(): { value: DatabaseCategory; label: string; description: string }[] {
    return [
      { value: 'bearing', label: '교량받침DB', description: '교량받침의 물리적 특성 및 내진성능' },
      { value: 'seismic', label: '내진DB', description: '지진하중 및 내진설계 관련' },
      { value: 'material', label: '재료DB', description: '콘크리트, 철근 등 건설재료의 물성' },
      { value: 'geometry', label: '기하학적DB', description: '교량의 기하학적 특성' },
      { value: 'soil', label: '지반DB', description: '지반조건 및 지반반응' },
      { value: 'load', label: '하중DB', description: '정적/동적 하중 조건' },
      { value: 'analysis', label: '해석DB', description: '구조해석 결과 및 모델링' },
      { value: 'code', label: '설계기준DB', description: '설계기준 및 규정' },
      { value: 'other', label: '기타', description: '기타 관련 데이터' }
    ];
  }

  // DB 백업
  public exportDatabase(id: string): { database: BridgeDatabase; records: DatabaseRecord[] } {
    const database = this.databases.get(id);
    if (!database) {
      throw new Error(`데이터베이스 '${id}'를 찾을 수 없습니다.`);
    }

    const records = this.records.get(id) || [];
    return { database, records };
  }

  // DB 복원
  public importDatabase(database: BridgeDatabase, records: DatabaseRecord[]): void {
    this.databases.set(database.id, database);
    this.records.set(database.id, records);
    this.saveToLocalStorage(); // 데이터베이스 복원 후 저장
  }

  // 모든 데이터 초기화 (개발/테스트용)
  public resetAllData(): void {
    this.databases.clear();
    this.records.clear();
    localStorage.removeItem(this.STORAGE_KEY_DATABASES);
    localStorage.removeItem(this.STORAGE_KEY_RECORDS);
    this.initializeDefaultDatabases();
  }

  // LocalStorage 데이터 확인 (디버깅용)
  public getStorageInfo(): { databasesCount: number; recordsCount: number; storageSize: number } {
    const databasesCount = this.databases.size;
    let recordsCount = 0;
    this.records.forEach(records => {
      recordsCount += records.length;
    });
    
    const storageSize = new Blob([
      localStorage.getItem(this.STORAGE_KEY_DATABASES) || '',
      localStorage.getItem(this.STORAGE_KEY_RECORDS) || ''
    ]).size;
    
    return { databasesCount, recordsCount, storageSize };
  }
}
