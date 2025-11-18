import { Router, Request, Response } from 'express';
import { Database } from '../database/connection';
import { MariaDBConnection } from '../database/mariadb-connection';
import { TableField, FieldType } from '@inno-spec/shared';
import { WebSocketService } from '../services/websocket';
import { ApiResponse } from '../types/index.js';

const router = Router();
const wsService = WebSocketService.getInstance();

// MariaDB 또는 SQLite 사용 여부 확인 (환경 변수 또는 기본값)
const useMariaDB = process.env.USE_MARIADB !== 'false'; // 기본값은 true (mariadb-server.ts 사용 시)
const db = useMariaDB ? MariaDBConnection.getInstance() : Database.getInstance();

// MariaDB 쿼리 실행 헬퍼 함수
async function executeMariaDBQuery(sql: string, params: any[] = []): Promise<any[]> {
  const pool = (db as any).getPool();
  const [rows] = await pool.execute(sql, params);
  return rows as any[];
}

// MariaDB 단일 행 조회 헬퍼 함수
async function executeMariaDBGet(sql: string, params: any[] = []): Promise<any> {
  const pool = (db as any).getPool();
  const [rows] = await pool.execute(sql, params);
  return (rows as any[])[0];
}

// MariaDB 실행 헬퍼 함수
async function executeMariaDBRun(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  const pool = (db as any).getPool();
  const [result] = await pool.execute(sql, params);
  return {
    lastID: (result as any).insertId || 0,
    changes: (result as any).affectedRows || 0
  };
}

// 필드 정의 목록 조회
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenant_id = req.headers['x-tenant-id'] as string;
    
    if (!tenant_id) {
      return res.status(400).json({
        success: false,
        error: 'tenant_id is required'
      } as ApiResponse);
    }

    const fields = useMariaDB 
      ? await executeMariaDBQuery(`SELECT * FROM field_definitions WHERE tenant_id = ? AND is_active = 1 ORDER BY order_index ASC, created_at ASC`, [tenant_id])
      : await (db as any).all(`SELECT * FROM field_definitions WHERE tenant_id = ? AND is_active = 1 ORDER BY order_index ASC, created_at ASC`, [tenant_id]);

    // JSON 필드들을 파싱 (MariaDB는 이미 JSON 타입이므로 파싱 불필요)
    const parsedFields = fields.map((field: any) => ({
      ...field,
      displayName: field.display_name,
      options: field.options ? (typeof field.options === 'string' ? JSON.parse(field.options) : field.options) : undefined,
      defaultValue: field.default_value ? (typeof field.default_value === 'string' ? JSON.parse(field.default_value) : field.default_value) : undefined,
      dbCategory: field.db_category,
      order: field.order_index,
      createdAt: new Date(field.created_at),
      updatedAt: new Date(field.updated_at)
    }));

    res.json({
      success: true,
      data: parsedFields
    } as ApiResponse<TableField[]>);
  } catch (error) {
    console.error('Error fetching field definitions:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } as ApiResponse);
  }
});

// 특정 필드 정의 조회
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenant_id = req.headers['x-tenant-id'] as string;
    
    if (!tenant_id) {
      return res.status(400).json({
        success: false,
        error: 'tenant_id is required'
      } as ApiResponse);
    }

    const field = useMariaDB
      ? await executeMariaDBGet(`SELECT * FROM field_definitions WHERE id = ? AND tenant_id = ? AND is_active = 1`, [id, tenant_id])
      : await (db as any).get(`SELECT * FROM field_definitions WHERE id = ? AND tenant_id = ? AND is_active = 1`, [id, tenant_id]);

    if (!field) {
      return res.status(404).json({
        success: false,
        error: 'Field definition not found'
      } as ApiResponse);
    }

    // JSON 필드들을 파싱 (MariaDB는 이미 JSON 타입이므로 파싱 불필요)
    const parsedField = {
      ...field,
      displayName: field.display_name,
      options: field.options ? (typeof field.options === 'string' ? JSON.parse(field.options) : field.options) : undefined,
      defaultValue: field.default_value ? (typeof field.default_value === 'string' ? JSON.parse(field.default_value) : field.default_value) : undefined,
      dbCategory: field.db_category,
      order: field.order_index,
      createdAt: new Date(field.created_at),
      updatedAt: new Date(field.updated_at)
    };

    res.json({
      success: true,
      data: parsedField
    } as ApiResponse<TableField>);
  } catch (error) {
    console.error('Error fetching field definition:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } as ApiResponse);
  }
});

// 필드 정의 생성
router.post('/', async (req: Request, res: Response) => {
  try {
    const tenant_id = req.headers['x-tenant-id'] as string;
    const fieldData: Partial<TableField> = req.body;
    
    if (!tenant_id) {
      return res.status(400).json({
        success: false,
        error: 'tenant_id is required'
      } as ApiResponse);
    }

    if (!fieldData.name || !fieldData.displayName || !fieldData.type) {
      return res.status(400).json({
        success: false,
        error: 'name, displayName, and type are required'
      } as ApiResponse);
    }

    // 중복 이름 확인
    const existingField = useMariaDB
      ? await executeMariaDBGet(`SELECT id FROM field_definitions WHERE name = ? AND tenant_id = ? AND is_active = 1`, [fieldData.name, tenant_id])
      : await (db as any).get(`SELECT id FROM field_definitions WHERE name = ? AND tenant_id = ? AND is_active = 1`, [fieldData.name, tenant_id]);

    if (existingField) {
      return res.status(409).json({
        success: false,
        error: 'Field with this name already exists'
      } as ApiResponse);
    }

    // 다음 order_index 계산
    const maxOrder = useMariaDB
      ? await executeMariaDBGet(`SELECT MAX(order_index) as max_order FROM field_definitions WHERE tenant_id = ? AND is_active = 1`, [tenant_id])
      : await (db as any).get(`SELECT MAX(order_index) as max_order FROM field_definitions WHERE tenant_id = ? AND is_active = 1`, [tenant_id]);
    
    const nextOrder = (maxOrder?.max_order || 0) + 1;

    const fieldId = `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (useMariaDB) {
      await executeMariaDBRun(`
        INSERT INTO field_definitions (
          id, name, display_name, description, type, options, 
          default_value, db_category, order_index, tenant_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        fieldId,
        fieldData.name,
        fieldData.displayName,
        fieldData.description || null,
        fieldData.type,
        fieldData.options ? JSON.stringify(fieldData.options) : null,
        fieldData.defaultValue !== undefined ? JSON.stringify(fieldData.defaultValue) : null,
        fieldData.dbCategory || null,
        nextOrder,
        tenant_id
      ]);
    } else {
      await (db as any).run(`
        INSERT INTO field_definitions (
          id, name, display_name, description, type, options, 
          default_value, db_category, order_index, tenant_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        fieldId,
        fieldData.name,
        fieldData.displayName,
        fieldData.description || null,
        fieldData.type,
        fieldData.options ? JSON.stringify(fieldData.options) : null,
        fieldData.defaultValue !== undefined ? JSON.stringify(fieldData.defaultValue) : null,
        fieldData.dbCategory || null,
        nextOrder,
        tenant_id
      ]);
    }

    // 생성된 필드 조회
    const createdField = useMariaDB
      ? await executeMariaDBGet(`SELECT * FROM field_definitions WHERE id = ?`, [fieldId])
      : await (db as any).get(`SELECT * FROM field_definitions WHERE id = ?`, [fieldId]);

    const parsedField = {
      ...createdField,
      displayName: createdField.display_name,
      options: createdField.options ? JSON.parse(createdField.options) : undefined,
      defaultValue: createdField.default_value ? JSON.parse(createdField.default_value) : undefined,
      dbCategory: createdField.db_category,
      order: createdField.order_index,
      createdAt: new Date(createdField.created_at),
      updatedAt: new Date(createdField.updated_at)
    };

    // WebSocket으로 실시간 알림
    wsService.notifyFieldDefinitionCreated(tenant_id, parsedField);

    res.status(201).json({
      success: true,
      data: parsedField
    } as ApiResponse<TableField>);
  } catch (error) {
    console.error('Error creating field definition:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } as ApiResponse);
  }
});

// 필드 정의 업데이트
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenant_id = req.headers['x-tenant-id'] as string;
    const fieldData: Partial<TableField> = req.body;
    
    if (!tenant_id) {
      return res.status(400).json({
        success: false,
        error: 'tenant_id is required'
      } as ApiResponse);
    }

    // 기존 필드 확인
    const existingField = useMariaDB
      ? await executeMariaDBGet(`SELECT * FROM field_definitions WHERE id = ? AND tenant_id = ? AND is_active = 1`, [id, tenant_id])
      : await (db as any).get(`SELECT * FROM field_definitions WHERE id = ? AND tenant_id = ? AND is_active = 1`, [id, tenant_id]);

    if (!existingField) {
      return res.status(404).json({
        success: false,
        error: 'Field definition not found'
      } as ApiResponse);
    }

    // 이름 변경 시 중복 확인
    if (fieldData.name && fieldData.name !== existingField.name) {
      const duplicateField = useMariaDB
        ? await executeMariaDBGet(`SELECT id FROM field_definitions WHERE name = ? AND tenant_id = ? AND is_active = 1 AND id != ?`, [fieldData.name, tenant_id, id])
        : await (db as any).get(`SELECT id FROM field_definitions WHERE name = ? AND tenant_id = ? AND is_active = 1 AND id != ?`, [fieldData.name, tenant_id, id]);

      if (duplicateField) {
        return res.status(409).json({
          success: false,
          error: 'Field with this name already exists'
        } as ApiResponse);
      }
    }

    if (useMariaDB) {
      await executeMariaDBRun(`
        UPDATE field_definitions SET
          name = COALESCE(?, name),
          display_name = COALESCE(?, display_name),
          description = COALESCE(?, description),
          type = COALESCE(?, type),
          options = COALESCE(?, options),
          default_value = COALESCE(?, default_value),
          db_category = COALESCE(?, db_category),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND tenant_id = ?
      `, [
        fieldData.name || null,
        fieldData.displayName || null,
        fieldData.description || null,
        fieldData.type || null,
        fieldData.options ? JSON.stringify(fieldData.options) : null,
        fieldData.defaultValue !== undefined ? JSON.stringify(fieldData.defaultValue) : null,
        fieldData.dbCategory || null,
        id,
        tenant_id
      ]);
    } else {
      await (db as any).run(`
        UPDATE field_definitions SET
          name = COALESCE(?, name),
          display_name = COALESCE(?, display_name),
          description = COALESCE(?, description),
          type = COALESCE(?, type),
          options = COALESCE(?, options),
          default_value = COALESCE(?, default_value),
          db_category = COALESCE(?, db_category),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND tenant_id = ?
      `, [
        fieldData.name || null,
        fieldData.displayName || null,
        fieldData.description || null,
        fieldData.type || null,
        fieldData.options ? JSON.stringify(fieldData.options) : null,
        fieldData.defaultValue !== undefined ? JSON.stringify(fieldData.defaultValue) : null,
        fieldData.dbCategory || null,
        id,
        tenant_id
      ]);
    }

    // 업데이트된 필드 조회
    const updatedField = useMariaDB
      ? await executeMariaDBGet(`SELECT * FROM field_definitions WHERE id = ?`, [id])
      : await (db as any).get(`SELECT * FROM field_definitions WHERE id = ?`, [id]);

    const parsedField = {
      ...updatedField,
      displayName: updatedField.display_name,
      options: updatedField.options ? JSON.parse(updatedField.options) : undefined,
      defaultValue: updatedField.default_value ? JSON.parse(updatedField.default_value) : undefined,
      dbCategory: updatedField.db_category,
      order: updatedField.order_index,
      createdAt: new Date(updatedField.created_at),
      updatedAt: new Date(updatedField.updated_at)
    };

    // WebSocket으로 실시간 알림
    wsService.notifyFieldDefinitionUpdated(tenant_id, parsedField);

    res.json({
      success: true,
      data: parsedField
    } as ApiResponse<TableField>);
  } catch (error) {
    console.error('Error updating field definition:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } as ApiResponse);
  }
});

// 필드 정의 삭제 (소프트 삭제)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenant_id = req.headers['x-tenant-id'] as string;
    
    if (!tenant_id) {
      return res.status(400).json({
        success: false,
        error: 'tenant_id is required'
      } as ApiResponse);
    }

    // 기존 필드 확인
    const existingField = useMariaDB
      ? await executeMariaDBGet(`SELECT * FROM field_definitions WHERE id = ? AND tenant_id = ? AND is_active = 1`, [id, tenant_id])
      : await (db as any).get(`SELECT * FROM field_definitions WHERE id = ? AND tenant_id = ? AND is_active = 1`, [id, tenant_id]);

    if (!existingField) {
      return res.status(404).json({
        success: false,
        error: 'Field definition not found'
      } as ApiResponse);
    }

    // 소프트 삭제
    if (useMariaDB) {
      await executeMariaDBRun(`UPDATE field_definitions SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?`, [id, tenant_id]);
    } else {
      await (db as any).run(`UPDATE field_definitions SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?`, [id, tenant_id]);
    }

    // WebSocket으로 실시간 알림
    wsService.notifyFieldDefinitionDeleted(tenant_id, id);

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting field definition:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } as ApiResponse);
  }
});

// 필드 순서 업데이트
router.put('/:id/order', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenant_id = req.headers['x-tenant-id'] as string;
    const { order_index } = req.body;
    
    if (!tenant_id || order_index === undefined) {
      return res.status(400).json({
        success: false,
        error: 'tenant_id and order_index are required'
      } as ApiResponse);
    }

    if (useMariaDB) {
      await executeMariaDBRun(`UPDATE field_definitions SET order_index = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ? AND is_active = 1`, [order_index, id, tenant_id]);
    } else {
      await (db as any).run(`UPDATE field_definitions SET order_index = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ? AND is_active = 1`, [order_index, id, tenant_id]);
    }

    res.json({
      success: true
    } as ApiResponse);
  } catch (error) {
    console.error('Error updating field order:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } as ApiResponse);
  }
});

export default router;
