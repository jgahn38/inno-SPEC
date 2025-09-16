import { MariaDBConnection } from '../database/mariadb-connection';
import { LNBConfig, SystemScreenType } from '@inno-spec/shared';
import { v4 as uuidv4 } from 'uuid';

export class MariaDBLNBService {
  private db: MariaDBConnection;

  constructor() {
    this.db = MariaDBConnection.getInstance();
  }

  private generateId(): string {
    return uuidv4();
  }

  async getAllLNBConfigs(tenantId: string): Promise<LNBConfig[]> {
    const connection = await this.db.getPool().getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM lnb_configs WHERE tenantId = ? ORDER BY `order` ASC',
        [tenantId]
      );
      
      const configs = rows as any[];
      return configs.map(row => ({
        ...row,
        isActive: Boolean(row.isActive),
        isParent: Boolean(row.isParent),
        children: row.children ? JSON.parse(row.children) : []
      })) as LNBConfig[];
    } finally {
      connection.release();
    }
  }

  async getLNBConfigById(id: string, tenantId: string): Promise<LNBConfig | null> {
    const connection = await this.db.getPool().getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM lnb_configs WHERE id = ? AND tenantId = ?',
        [id, tenantId]
      );
      
      const configs = rows as any[];
      if (configs.length === 0) return null;
      
      const config = configs[0];
      return {
        ...config,
        isActive: Boolean(config.isActive),
        isParent: Boolean(config.isParent),
        children: config.children ? JSON.parse(config.children) : []
      } as LNBConfig;
    } finally {
      connection.release();
    }
  }

  async createLNBConfig(config: Omit<LNBConfig, 'id' | 'createdAt' | 'updatedAt'>, tenantId: string): Promise<LNBConfig> {
    const connection = await this.db.getPool().getConnection();
    try {
      const newConfig: LNBConfig = {
        ...config,
        id: this.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: config.isActive ?? true,
        isParent: config.isParent ?? false,
        children: config.children || [],
        tenantId
      };

      await connection.execute(
        `INSERT INTO lnb_configs (id, name, displayName, icon, \`order\`, isActive, parentId, isParent, type, screenId, systemScreenType, children, createdAt, updatedAt, tenantId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newConfig.id,
          newConfig.name,
          newConfig.displayName,
          newConfig.icon || null,
          newConfig.order,
          newConfig.isActive,
          newConfig.parentId || null,
          newConfig.isParent,
          newConfig.type,
          newConfig.screenId || null,
          newConfig.systemScreenType || null,
          JSON.stringify(newConfig.children || []),
          new Date(newConfig.createdAt).toISOString().slice(0, 19).replace('T', ' '),
          new Date(newConfig.updatedAt).toISOString().slice(0, 19).replace('T', ' '),
          newConfig.tenantId
        ]
      );

      return newConfig;
    } finally {
      connection.release();
    }
  }

  async updateLNBConfig(id: string, updates: Partial<LNBConfig>, tenantId: string): Promise<LNBConfig | null> {
    const connection = await this.db.getPool().getConnection();
    try {
      const existingConfig = await this.getLNBConfigById(id, tenantId);
      if (!existingConfig) return null;

      const updatedConfig: LNBConfig = {
        ...existingConfig,
        ...updates,
        children: updates.children ? updates.children : existingConfig.children,
        updatedAt: new Date().toISOString()
      };

      await connection.execute(
        `UPDATE lnb_configs 
         SET name = ?, displayName = ?, icon = ?, \`order\` = ?, isActive = ?, parentId = ?, isParent = ?, type = ?, screenId = ?, systemScreenType = ?, children = ?, updatedAt = ?
         WHERE id = ? AND tenantId = ?`,
        [
          updatedConfig.name,
          updatedConfig.displayName,
          updatedConfig.icon,
          updatedConfig.order,
          updatedConfig.isActive,
          updatedConfig.parentId,
          updatedConfig.isParent,
          updatedConfig.type,
          updatedConfig.screenId,
          updatedConfig.systemScreenType,
          JSON.stringify(updatedConfig.children),
          updatedConfig.updatedAt,
          id,
          tenantId
        ]
      );

      return updatedConfig;
    } finally {
      connection.release();
    }
  }

  async deleteLNBConfig(id: string, tenantId: string): Promise<boolean> {
    const connection = await this.db.getPool().getConnection();
    try {
      const [result] = await connection.execute(
        'DELETE FROM lnb_configs WHERE id = ? AND tenantId = ?',
        [id, tenantId]
      );
      return (result as any).affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  async createDefaultLNBConfig(tenantId: string): Promise<void> {
    const connection = await this.db.getPool().getConnection();
    try {
      const existingConfigs = await this.getAllLNBConfigs(tenantId);
      if (existingConfigs.length === 0) {
        const defaultConfigs: Omit<LNBConfig, 'id' | 'createdAt' | 'updatedAt'>[] = [
          { 
            name: 'dashboard', 
            displayName: '대시보드', 
            icon: 'BarChart3', 
            order: 1, 
            systemScreenType: 'dashboard' as SystemScreenType, 
            isActive: true, 
            type: 'independent', 
            children: [] 
          },
          { 
            name: 'bridge-status', 
            displayName: '교량현황', 
            icon: 'Building2', 
            order: 2, 
            isActive: true, 
            type: 'parent', 
            children: [
              { 
                id: this.generateId(), 
                name: 'bridge-specs', 
                displayName: '교량제원', 
                icon: 'Database', 
                order: 1, 
                isActive: true, 
                type: 'child', 
                createdAt: new Date().toISOString(), 
                updatedAt: new Date().toISOString() 
              },
              { 
                id: this.generateId(), 
                name: 'structure-status', 
                displayName: '구조물 현황', 
                icon: 'Building2', 
                order: 2, 
                isActive: true, 
                type: 'child', 
                createdAt: new Date().toISOString(), 
                updatedAt: new Date().toISOString() 
              },
              { 
                id: this.generateId(), 
                name: 'bearing-status', 
                displayName: '교량받침 현황', 
                icon: 'Anchor', 
                order: 3, 
                isActive: true, 
                type: 'child', 
                createdAt: new Date().toISOString(), 
                updatedAt: new Date().toISOString() 
              }
            ]
          },
          { 
            name: 'modeling', 
            displayName: '모델링', 
            icon: 'Image', 
            order: 3, 
            isActive: true, 
            type: 'parent', 
            children: [
              { 
                id: this.generateId(), 
                name: 'section', 
                displayName: '단면', 
                icon: 'Image', 
                order: 1, 
                systemScreenType: 'section-library' as SystemScreenType, 
                isActive: true, 
                type: 'child', 
                createdAt: new Date().toISOString(), 
                updatedAt: new Date().toISOString() 
              }
            ]
          },
          { 
            name: 'project-settings', 
            displayName: '프로젝트 설정', 
            icon: 'Settings', 
            order: 4, 
            systemScreenType: 'project-settings' as SystemScreenType, 
            isActive: true, 
            type: 'independent', 
            children: [] 
          }
        ];

        for (const config of defaultConfigs) {
          await this.createLNBConfig(config, tenantId);
        }
      }
    } finally {
      connection.release();
    }
  }
}

export const mariaDBLNBService = new MariaDBLNBService();
