import { MariaDBConnection } from '../database/mariadb-connection';
import { ScreenConfig } from '@inno-spec/shared';
import { v4 as uuidv4 } from 'uuid';

export class MariaDBScreenService {
  private db: MariaDBConnection;

  constructor() {
    this.db = MariaDBConnection.getInstance();
  }

  private generateId(): string {
    return uuidv4();
  }

  async getAllScreens(tenantId: string): Promise<ScreenConfig[]> {
    const connection = await this.db.getPool().getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM screens WHERE tenantId = ? ORDER BY createdAt DESC',
        [tenantId]
      );
      return rows as ScreenConfig[];
    } finally {
      connection.release();
    }
  }

  async getScreenById(id: string, tenantId: string): Promise<ScreenConfig | null> {
    const connection = await this.db.getPool().getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM screens WHERE id = ? AND tenantId = ?',
        [id, tenantId]
      );
      const screens = rows as ScreenConfig[];
      return screens.length > 0 ? screens[0] : null;
    } finally {
      connection.release();
    }
  }

  async createScreen(screen: Omit<ScreenConfig, 'id' | 'createdAt' | 'updatedAt'>, tenantId: string): Promise<ScreenConfig> {
    const connection = await this.db.getPool().getConnection();
    try {
      const newScreen: ScreenConfig = {
        ...screen,
        id: this.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        components: screen.components || [],
        isActive: screen.isActive ?? true,
        tenantId
      };

      await connection.execute(
        `INSERT INTO screens (id, name, displayName, description, type, layout, components, dataStructure, isActive, createdAt, updatedAt, tenantId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newScreen.id,
          newScreen.name,
          newScreen.displayName,
          newScreen.description,
          newScreen.type,
          newScreen.layout,
          JSON.stringify(newScreen.components),
          JSON.stringify(newScreen.dataStructure),
          newScreen.isActive,
          newScreen.createdAt,
          newScreen.updatedAt,
          newScreen.tenantId
        ]
      );

      return newScreen;
    } finally {
      connection.release();
    }
  }

  async updateScreen(id: string, updates: Partial<ScreenConfig>, tenantId: string): Promise<ScreenConfig | null> {
    const connection = await this.db.getPool().getConnection();
    try {
      const existingScreen = await this.getScreenById(id, tenantId);
      if (!existingScreen) return null;

      const updatedScreen: ScreenConfig = {
        ...existingScreen,
        ...updates,
        components: updates.components ? updates.components : existingScreen.components,
        updatedAt: new Date().toISOString()
      };

      await connection.execute(
        `UPDATE screens 
         SET name = ?, displayName = ?, description = ?, type = ?, layout = ?, components = ?, dataStructure = ?, isActive = ?, updatedAt = ?
         WHERE id = ? AND tenantId = ?`,
        [
          updatedScreen.name,
          updatedScreen.displayName,
          updatedScreen.description,
          updatedScreen.type,
          updatedScreen.layout,
          JSON.stringify(updatedScreen.components),
          JSON.stringify(updatedScreen.dataStructure),
          updatedScreen.isActive,
          updatedScreen.updatedAt,
          id,
          tenantId
        ]
      );

      return updatedScreen;
    } finally {
      connection.release();
    }
  }

  async deleteScreen(id: string, tenantId: string): Promise<boolean> {
    const connection = await this.db.getPool().getConnection();
    try {
      const [result] = await connection.execute(
        'DELETE FROM screens WHERE id = ? AND tenantId = ?',
        [id, tenantId]
      );
      return (result as any).affectedRows > 0;
    } finally {
      connection.release();
    }
  }
}

export const mariaDBScreenService = new MariaDBScreenService();
