import { DatabaseConnection } from '../database/connection.js';
import { ScreenConfig, ScreenComponent, ApiResponse } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export class ScreenService {
  private db = DatabaseConnection.getInstance().getDatabase();

  // 화면 목록 조회
  async getScreens(tenantId: string): Promise<ApiResponse<ScreenConfig[]>> {
    try {
      const screens = this.db.prepare(`
        SELECT 
          id, name, display_name, description, type, layout, 
          data_structure, is_active, created_at, updated_at
        FROM screens 
        WHERE tenant_id = ? AND is_active = 1
        ORDER BY created_at DESC
      `).all(tenantId);

      const screensWithComponents = screens.map(screen => ({
        ...screen,
        displayName: screen.display_name,
        dataStructure: screen.data_structure,
        isActive: Boolean(screen.is_active),
        createdAt: new Date(screen.created_at),
        updatedAt: new Date(screen.updated_at),
        components: this.getScreenComponents(screen.id)
      }));

      return {
        success: true,
        data: screensWithComponents
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // 특정 화면 조회
  async getScreenById(screenId: string, tenantId: string): Promise<ApiResponse<ScreenConfig>> {
    try {
      const screen = this.db.prepare(`
        SELECT 
          id, name, display_name, description, type, layout, 
          data_structure, is_active, created_at, updated_at
        FROM screens 
        WHERE id = ? AND tenant_id = ? AND is_active = 1
      `).get(screenId, tenantId);

      if (!screen) {
        return {
          success: false,
          error: 'Screen not found'
        };
      }

      const screenWithComponents = {
        ...screen,
        displayName: screen.display_name,
        dataStructure: screen.data_structure,
        isActive: Boolean(screen.is_active),
        createdAt: new Date(screen.created_at),
        updatedAt: new Date(screen.updated_at),
        components: this.getScreenComponents(screen.id)
      };

      return {
        success: true,
        data: screenWithComponents
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // 화면 생성
  async createScreen(screenData: Omit<ScreenConfig, 'id' | 'createdAt' | 'updatedAt'>, tenantId: string): Promise<ApiResponse<ScreenConfig>> {
    try {
      const id = uuidv4();
      const now = new Date();

      this.db.prepare(`
        INSERT INTO screens (
          id, name, display_name, description, type, layout, 
          data_structure, is_active, tenant_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        screenData.name,
        screenData.displayName,
        screenData.description || null,
        screenData.type,
        screenData.layout,
        screenData.dataStructure,
        screenData.isActive ? 1 : 0,
        tenantId,
        now.toISOString(),
        now.toISOString()
      );

      // 컴포넌트 저장
      if (screenData.components && screenData.components.length > 0) {
        this.saveScreenComponents(id, screenData.components);
      }

      const newScreen = {
        ...screenData,
        id,
        createdAt: now,
        updatedAt: now
      };

      return {
        success: true,
        data: newScreen
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // 화면 수정
  async updateScreen(screenId: string, screenData: Partial<ScreenConfig>, tenantId: string): Promise<ApiResponse<ScreenConfig>> {
    try {
      const now = new Date();
      
      // 기존 화면 조회
      const existingScreen = this.db.prepare(`
        SELECT * FROM screens WHERE id = ? AND tenant_id = ?
      `).get(screenId, tenantId);

      if (!existingScreen) {
        return {
          success: false,
          error: 'Screen not found'
        };
      }

      // 화면 정보 업데이트
      this.db.prepare(`
        UPDATE screens SET
          name = COALESCE(?, name),
          display_name = COALESCE(?, display_name),
          description = COALESCE(?, description),
          type = COALESCE(?, type),
          layout = COALESCE(?, layout),
          data_structure = COALESCE(?, data_structure),
          is_active = COALESCE(?, is_active),
          updated_at = ?
        WHERE id = ? AND tenant_id = ?
      `).run(
        screenData.name || null,
        screenData.displayName || null,
        screenData.description || null,
        screenData.type || null,
        screenData.layout || null,
        screenData.dataStructure || null,
        screenData.isActive !== undefined ? (screenData.isActive ? 1 : 0) : null,
        now.toISOString(),
        screenId,
        tenantId
      );

      // 컴포넌트 업데이트
      if (screenData.components) {
        // 기존 컴포넌트 삭제
        this.db.prepare(`
          DELETE FROM screen_components WHERE screen_id = ?
        `).run(screenId);

        // 새 컴포넌트 저장
        this.saveScreenComponents(screenId, screenData.components);
      }

      return {
        success: true,
        message: 'Screen updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // 화면 삭제
  async deleteScreen(screenId: string, tenantId: string): Promise<ApiResponse<void>> {
    try {
      const result = this.db.prepare(`
        UPDATE screens SET is_active = 0 WHERE id = ? AND tenant_id = ?
      `).run(screenId, tenantId);

      if (result.changes === 0) {
        return {
          success: false,
          error: 'Screen not found'
        };
      }

      return {
        success: true,
        message: 'Screen deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // 화면 컴포넌트 조회
  private getScreenComponents(screenId: string): ScreenComponent[] {
    const components = this.db.prepare(`
      SELECT 
        id, type, component_id, display_name, 
        position_x, position_y, width, height, config
      FROM screen_components 
      WHERE screen_id = ?
      ORDER BY position_y, position_x
    `).all(screenId);

    return components.map(comp => ({
      id: comp.id,
      type: comp.type,
      componentId: comp.component_id,
      displayName: comp.display_name,
      position: {
        x: comp.position_x,
        y: comp.position_y,
        width: comp.width,
        height: comp.height
      },
      config: JSON.parse(comp.config)
    }));
  }

  // 화면 컴포넌트 저장
  private saveScreenComponents(screenId: string, components: ScreenComponent[]): void {
    const insertComponent = this.db.prepare(`
      INSERT INTO screen_components (
        id, screen_id, type, component_id, display_name,
        position_x, position_y, width, height, config
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const component of components) {
      insertComponent.run(
        component.id,
        screenId,
        component.type,
        component.componentId,
        component.displayName,
        component.position.x,
        component.position.y,
        component.position.width,
        component.position.height,
        JSON.stringify(component.config)
      );
    }
  }
}
