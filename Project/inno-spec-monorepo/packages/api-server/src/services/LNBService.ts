import { DatabaseConnection } from '../database/connection.js';
import { LNBConfig, ApiResponse } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export class LNBService {
  private db = DatabaseConnection.getInstance().getDatabase();

  // LNB 설정 목록 조회
  async getLNBConfigs(tenantId: string): Promise<ApiResponse<LNBConfig[]>> {
    try {
      const configs = this.db.prepare(`
        SELECT 
          id, name, display_name, icon, order_index, is_active,
          parent_id, type, screen_id, system_screen_type, created_at, updated_at
        FROM lnb_configs 
        WHERE tenant_id = ? AND is_active = 1
        ORDER BY order_index ASC
      `).all(tenantId);

      // 계층 구조로 변환
      const configsWithChildren = this.buildHierarchy(configs);

      return {
        success: true,
        data: configsWithChildren
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // 특정 LNB 설정 조회
  async getLNBConfigById(configId: string, tenantId: string): Promise<ApiResponse<LNBConfig>> {
    try {
      const config = this.db.prepare(`
        SELECT 
          id, name, display_name, icon, order_index, is_active,
          parent_id, type, screen_id, system_screen_type, created_at, updated_at
        FROM lnb_configs 
        WHERE id = ? AND tenant_id = ? AND is_active = 1
      `).get(configId, tenantId);

      if (!config) {
        return {
          success: false,
          error: 'LNB config not found'
        };
      }

      const configWithChildren = {
        ...config,
        displayName: config.display_name,
        order: config.order_index,
        isActive: Boolean(config.is_active),
        parentId: config.parent_id,
        screenId: config.screen_id,
        systemScreenType: config.system_screen_type,
        createdAt: new Date(config.created_at),
        updatedAt: new Date(config.updated_at),
        children: config.type === 'parent' ? this.getChildrenConfigs(configId) : undefined
      };

      return {
        success: true,
        data: configWithChildren
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // LNB 설정 생성
  async createLNBConfig(configData: Omit<LNBConfig, 'id' | 'createdAt' | 'updatedAt'>, tenantId: string): Promise<ApiResponse<LNBConfig>> {
    try {
      const id = uuidv4();
      const now = new Date();

      // 순서 자동 할당
      const maxOrder = this.db.prepare(`
        SELECT MAX(order_index) as max_order FROM lnb_configs WHERE tenant_id = ? AND parent_id IS NULL
      `).get(tenantId);
      const order = (maxOrder?.max_order || 0) + 1;

      this.db.prepare(`
        INSERT INTO lnb_configs (
          id, name, display_name, icon, order_index, is_active,
          parent_id, type, screen_id, system_screen_type, tenant_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        configData.name,
        configData.displayName,
        configData.icon || null,
        order,
        configData.isActive ? 1 : 0,
        configData.parentId || null,
        configData.type,
        configData.screenId || null,
        configData.systemScreenType || null,
        tenantId,
        now.toISOString(),
        now.toISOString()
      );

      const newConfig = {
        ...configData,
        id,
        createdAt: now,
        updatedAt: now
      };

      return {
        success: true,
        data: newConfig
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // LNB 설정 수정
  async updateLNBConfig(configId: string, configData: Partial<LNBConfig>, tenantId: string): Promise<ApiResponse<LNBConfig>> {
    try {
      const now = new Date();

      this.db.prepare(`
        UPDATE lnb_configs SET
          name = COALESCE(?, name),
          display_name = COALESCE(?, display_name),
          icon = COALESCE(?, icon),
          order_index = COALESCE(?, order_index),
          is_active = COALESCE(?, is_active),
          parent_id = COALESCE(?, parent_id),
          type = COALESCE(?, type),
          screen_id = COALESCE(?, screen_id),
          system_screen_type = COALESCE(?, system_screen_type),
          updated_at = ?
        WHERE id = ? AND tenant_id = ?
      `).run(
        configData.name || null,
        configData.displayName || null,
        configData.icon || null,
        configData.order || null,
        configData.isActive !== undefined ? (configData.isActive ? 1 : 0) : null,
        configData.parentId || null,
        configData.type || null,
        configData.screenId || null,
        configData.systemScreenType || null,
        now.toISOString(),
        configId,
        tenantId
      );

      return {
        success: true,
        message: 'LNB config updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // LNB 설정 삭제
  async deleteLNBConfig(configId: string, tenantId: string): Promise<ApiResponse<void>> {
    try {
      const result = this.db.prepare(`
        UPDATE lnb_configs SET is_active = 0 WHERE id = ? AND tenant_id = ?
      `).run(configId, tenantId);

      if (result.changes === 0) {
        return {
          success: false,
          error: 'LNB config not found'
        };
      }

      return {
        success: true,
        message: 'LNB config deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // 계층 구조로 변환
  private buildHierarchy(configs: any[]): LNBConfig[] {
    const configMap = new Map();
    const rootConfigs: LNBConfig[] = [];

    // 모든 설정을 맵에 저장
    configs.forEach(config => {
      const configWithChildren = {
        ...config,
        displayName: config.display_name,
        order: config.order_index,
        isActive: Boolean(config.is_active),
        parentId: config.parent_id,
        screenId: config.screen_id,
        systemScreenType: config.system_screen_type,
        createdAt: new Date(config.created_at),
        updatedAt: new Date(config.updated_at),
        children: []
      };
      configMap.set(config.id, configWithChildren);
    });

    // 계층 구조 구성
    configs.forEach(config => {
      const configWithChildren = configMap.get(config.id);
      
      if (config.parent_id) {
        const parent = configMap.get(config.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(configWithChildren);
        }
      } else {
        rootConfigs.push(configWithChildren);
      }
    });

    return rootConfigs;
  }

  // 하위 설정 조회
  private getChildrenConfigs(parentId: string): LNBConfig[] {
    const children = this.db.prepare(`
      SELECT 
        id, name, display_name, icon, order_index, is_active,
        parent_id, type, screen_id, system_screen_type, created_at, updated_at
      FROM lnb_configs 
      WHERE parent_id = ? AND is_active = 1
      ORDER BY order_index ASC
    `).all(parentId);

    return children.map(child => ({
      ...child,
      displayName: child.display_name,
      order: child.order_index,
      isActive: Boolean(child.is_active),
      parentId: child.parent_id,
      screenId: child.screen_id,
      systemScreenType: child.system_screen_type,
      createdAt: new Date(child.created_at),
      updatedAt: new Date(child.updated_at)
    }));
  }
}
