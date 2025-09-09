import {
  BridgeData,
  BridgeSpecsData,
  StructureStatusData,
  BearingStatusData,
  SectionData,
  CreateBridgeDataRequest,
  // UpdateBridgeDataRequest, // 사용하지 않음
  GetBridgeDataRequest
} from '@inno-spec/shared';

export class BridgeDataService {
  private readonly STORAGE_KEY = 'inno_spec_bridge_data';
  private static instance: BridgeDataService;

  private constructor() {
    // 샘플 데이터 초기화 제거 - 데이터 동기화 관리에서 관리
  }

  public static getInstance(): BridgeDataService {
    if (!BridgeDataService.instance) {
      BridgeDataService.instance = new BridgeDataService();
    }
    return BridgeDataService.instance;
  }



  /**
   * 교량별 데이터 가져오기
   */
  async getBridgeData(request: GetBridgeDataRequest): Promise<BridgeData | null> {
    try {
      const allData = this.getDataFromStorage();
      const bridgeData = allData.find(data => 
        data.bridgeId === request.bridgeId && 
        data.projectId === request.projectId
      );

      if (!bridgeData) {
        return null;
      }

      // 특정 데이터 타입만 요청한 경우
      if (request.dataType) {
        const filteredData: BridgeData = {
          ...bridgeData,
          bridgeSpecs: request.dataType === 'bridgeSpecs' ? bridgeData.bridgeSpecs : null,
          structureStatus: request.dataType === 'structureStatus' ? bridgeData.structureStatus : null,
          bearingStatus: request.dataType === 'bearingStatus' ? bridgeData.bearingStatus : null,
          sectionData: request.dataType === 'sectionData' ? bridgeData.sectionData : null,
        };
        return filteredData;
      }

      return bridgeData;
    } catch (error) {
      console.error('Failed to get bridge data:', error);
      throw new Error('교량 데이터를 가져오는데 실패했습니다.');
    }
  }

  /**
   * 교량별 데이터 생성 또는 업데이트
   */
  async createOrUpdateBridgeData(request: CreateBridgeDataRequest): Promise<BridgeData> {
    try {
      const allData = this.getDataFromStorage();
      const existingIndex = allData.findIndex(data => 
        data.bridgeId === request.bridgeId && 
        data.projectId === request.projectId
      );

      let bridgeData: BridgeData;

      if (existingIndex >= 0) {
        // 기존 데이터 업데이트
        bridgeData = allData[existingIndex];
        bridgeData = this.updateBridgeDataByType(bridgeData, request.dataType, request.data);
        bridgeData.lastModified = new Date();
        bridgeData.updatedBy = 'current_user'; // TODO: 실제 사용자 ID로 교체
        
        allData[existingIndex] = bridgeData;
      } else {
        // 새 데이터 생성
        bridgeData = {
          id: `bridge-data-${Date.now()}`,
          bridgeId: request.bridgeId,
          projectId: request.projectId,
          bridgeSpecs: null,
          structureStatus: null,
          bearingStatus: null,
          sectionData: null,
          lastModified: new Date(),
          createdBy: 'current_user', // TODO: 실제 사용자 ID로 교체
          updatedBy: 'current_user', // TODO: 실제 사용자 ID로 교체
        };
        
        bridgeData = this.updateBridgeDataByType(bridgeData, request.dataType, request.data);
        allData.push(bridgeData);
      }

      this.saveDataToStorage(allData);
      return bridgeData;
    } catch (error) {
      console.error('Failed to create or update bridge data:', error);
      throw new Error('교량 데이터 생성/업데이트에 실패했습니다.');
    }
  }

  /**
   * 특정 데이터 타입별로 교량 데이터 업데이트
   */
  private updateBridgeDataByType(
    bridgeData: BridgeData, 
    dataType: string, 
    data: any
  ): BridgeData {
    const now = new Date();
    
    switch (dataType) {
      case 'bridgeSpecs':
        bridgeData.bridgeSpecs = {
          id: bridgeData.bridgeSpecs?.id || `specs-${Date.now()}`,
          bridgeId: bridgeData.bridgeId,
          ...data,
          createdAt: bridgeData.bridgeSpecs?.createdAt || now,
          updatedAt: now,
        } as BridgeSpecsData;
        break;
        
      case 'structureStatus':
        bridgeData.structureStatus = {
          id: bridgeData.structureStatus?.id || `status-${Date.now()}`,
          bridgeId: bridgeData.bridgeId,
          ...data,
          createdAt: bridgeData.structureStatus?.createdAt || now,
          updatedAt: now,
        } as StructureStatusData;
        break;
        
      case 'bearingStatus':
        bridgeData.bearingStatus = {
          id: bridgeData.bearingStatus?.id || `bearing-${Date.now()}`,
          bridgeId: bridgeData.bridgeId,
          ...data,
          createdAt: bridgeData.bearingStatus?.createdAt || now,
          updatedAt: now,
        } as BearingStatusData;
        break;
        
      case 'sectionData':
        bridgeData.sectionData = {
          id: bridgeData.sectionData?.id || `section-${Date.now()}`,
          bridgeId: bridgeData.bridgeId,
          ...data,
          createdAt: bridgeData.sectionData?.createdAt || now,
          updatedAt: now,
        } as SectionData;
        break;
    }
    
    return bridgeData;
  }

  /**
   * 교량 데이터 삭제
   */
  async deleteBridgeData(bridgeId: string, projectId: string): Promise<void> {
    try {
      const allData = this.getDataFromStorage();
      const filteredData = allData.filter(data => 
        !(data.bridgeId === bridgeId && data.projectId === projectId)
      );
      
      this.saveDataToStorage(filteredData);
    } catch (error) {
      console.error('Failed to delete bridge data:', error);
      throw new Error('교량 데이터 삭제에 실패했습니다.');
    }
  }

  /**
   * 프로젝트의 모든 교량 데이터 가져오기
   */
  async getAllBridgeDataByProject(projectId: string): Promise<BridgeData[]> {
    try {
      const allData = this.getDataFromStorage();
      return allData.filter(data => data.projectId === projectId);
    } catch (error) {
      console.error('Failed to get all bridge data by project:', error);
      throw new Error('프로젝트의 교량 데이터를 가져오는데 실패했습니다.');
    }
  }

  /**
   * 교량별 데이터 존재 여부 확인
   */
  async hasBridgeData(bridgeId: string, projectId: string): Promise<boolean> {
    try {
      const allData = this.getDataFromStorage();
      return allData.some(data => 
        data.bridgeId === bridgeId && data.projectId === projectId
      );
    } catch (error) {
      console.error('Failed to check bridge data existence:', error);
      return false;
    }
  }

  /**
   * 특정 데이터 타입의 데이터 존재 여부 확인
   */
  async hasDataType(
    bridgeId: string, 
    projectId: string, 
    dataType: 'bridgeSpecs' | 'structureStatus' | 'bearingStatus' | 'sectionData'
  ): Promise<boolean> {
    try {
      const bridgeData = await this.getBridgeData({ bridgeId, projectId });
      if (!bridgeData) return false;
      
      switch (dataType) {
        case 'bridgeSpecs': return bridgeData.bridgeSpecs !== null;
        case 'structureStatus': return bridgeData.structureStatus !== null;
        case 'bearingStatus': return bridgeData.bearingStatus !== null;
        case 'sectionData': return bridgeData.sectionData !== null;
        default: return false;
      }
    } catch (error) {
      console.error('Failed to check data type existence:', error);
      return false;
    }
  }

  /**
   * localStorage에서 데이터 읽기
   */
  private getDataFromStorage(): BridgeData[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return [];
      
      const parsedData = JSON.parse(data);
      // Date 객체 복원
      return parsedData.map((item: any) => ({
        ...item,
        lastModified: new Date(item.lastModified),
        bridgeSpecs: item.bridgeSpecs ? {
          ...item.bridgeSpecs,
          createdAt: new Date(item.bridgeSpecs.createdAt),
          updatedAt: new Date(item.bridgeSpecs.updatedAt),
        } : null,
        structureStatus: item.structureStatus ? {
          ...item.structureStatus,
          createdAt: new Date(item.structureStatus.createdAt),
          updatedAt: new Date(item.structureStatus.updatedAt),
          damages: item.structureStatus.damages?.map((d: any) => ({
            ...d,
            inspectionDate: new Date(d.inspectionDate),
          })) || [],
          inspections: item.structureStatus.inspections?.map((i: any) => ({
            ...i,
            date: new Date(i.date),
          })) || [],
          repairs: item.structureStatus.repairs?.map((r: any) => ({
            ...r,
            date: new Date(r.date),
          })) || [],
        } : null,
        bearingStatus: item.bearingStatus ? {
          ...item.bearingStatus,
          createdAt: new Date(item.bearingStatus.createdAt),
          updatedAt: new Date(item.bearingStatus.updatedAt),
          bearings: item.bearingStatus.bearings?.map((b: any) => ({
            ...b,
            installationDate: new Date(b.installationDate),
            lastInspection: new Date(b.lastInspection),
          })) || [],
          inspections: item.bearingStatus.inspections?.map((i: any) => ({
            ...i,
            date: new Date(i.date),
          })) || [],
          replacements: item.bearingStatus.replacements?.map((r: any) => ({
            ...r,
            date: new Date(r.date),
          })) || [],
        } : null,
        sectionData: item.sectionData ? {
          ...item.sectionData,
          createdAt: new Date(item.sectionData.createdAt),
          updatedAt: new Date(item.sectionData.updatedAt),
        } : null,
      }));
    } catch (error) {
      console.error('Failed to parse bridge data from localStorage:', error);
      return [];
    }
  }

  /**
   * localStorage에 데이터 저장
   */
  private saveDataToStorage(data: BridgeData[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save bridge data to localStorage:', error);
    }
  }

  /**
   * 데이터 백업 생성
   */
  async createBackup(): Promise<string> {
    try {
      const allData = this.getDataFromStorage();
      const backup = {
        timestamp: new Date().toISOString(),
        data: allData,
        version: '1.0.0'
      };
      
      const backupString = JSON.stringify(backup, null, 2);
      return backupString;
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw new Error('백업 생성에 실패했습니다.');
    }
  }

  /**
   * 백업에서 데이터 복원
   */
  async restoreFromBackup(backupString: string): Promise<void> {
    try {
      const backup = JSON.parse(backupString);
      if (backup.data && Array.isArray(backup.data)) {
        this.saveDataToStorage(backup.data);
      } else {
        throw new Error('잘못된 백업 형식입니다.');
      }
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      throw new Error('백업 복원에 실패했습니다.');
    }
  }
}
