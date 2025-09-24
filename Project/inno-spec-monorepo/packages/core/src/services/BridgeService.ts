import { Bridge } from '@inno-spec/shared';

class BridgeService {
  private static instance: BridgeService;
  private bridges: Map<string, Bridge> = new Map();

  private constructor() {
    this.loadFromLocalStorage();
  }

  public static getInstance(): BridgeService {
    if (!BridgeService.instance) {
      BridgeService.instance = new BridgeService();
    }
    return BridgeService.instance;
  }

  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem('bridges');
      if (stored) {
        const bridges: Bridge[] = JSON.parse(stored);
        this.bridges = new Map(bridges.map(bridge => [bridge.id, bridge]));
      }
    } catch (error) {
      console.error('교량 데이터 로드 실패:', error);
    }
  }

  private saveToLocalStorage(): void {
    try {
      const bridges = Array.from(this.bridges.values());
      localStorage.setItem('bridges', JSON.stringify(bridges));
    } catch (error) {
      console.error('교량 데이터 저장 실패:', error);
    }
  }

  // 모든 교량 조회
  public getAllBridges(): Bridge[] {
    return Array.from(this.bridges.values()).sort((a, b) => 
      a.displayName.localeCompare(b.displayName)
    );
  }

  // 활성 교량만 조회
  public getActiveBridges(): Bridge[] {
    return this.getAllBridges().filter(bridge => bridge.isActive);
  }

  // 교량 ID로 조회
  public getBridgeById(id: string): Bridge | undefined {
    return this.bridges.get(id);
  }

  // 교량 생성
  public createBridge(bridge: Omit<Bridge, 'id' | 'createdAt' | 'updatedAt'>): Bridge {
    const newBridge: Bridge = {
      ...bridge,
      id: `bridge-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.bridges.set(newBridge.id, newBridge);
    this.saveToLocalStorage();
    return newBridge;
  }

  // 교량 수정
  public updateBridge(id: string, updates: Partial<Omit<Bridge, 'id' | 'createdAt'>>): Bridge | null {
    const bridge = this.bridges.get(id);
    if (!bridge) {
      return null;
    }

    const updatedBridge: Bridge = {
      ...bridge,
      ...updates,
      updatedAt: new Date()
    };

    this.bridges.set(id, updatedBridge);
    this.saveToLocalStorage();
    return updatedBridge;
  }

  // 교량 삭제
  public deleteBridge(id: string): boolean {
    const deleted = this.bridges.delete(id);
    if (deleted) {
      this.saveToLocalStorage();
    }
    return deleted;
  }

  // 교량 활성화/비활성화
  public toggleBridgeStatus(id: string): Bridge | null {
    const bridge = this.bridges.get(id);
    if (!bridge) {
      return null;
    }

    return this.updateBridge(id, { isActive: !bridge.isActive });
  }
}

export default BridgeService;
