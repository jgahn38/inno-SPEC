import { Router, Request, Response } from 'express';
import { Database } from '../database/connection';
import { TableField, FieldType } from '@inno-spec/shared';
import { WebSocketService } from '../services/websocket';

const router = Router();
const wsService = WebSocketService.getInstance();

// 필드 정의 목록 조회
router.get('/', async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.query;
    
    if (!tenant_id) {
      return res.status(400).json({ error: 'tenant_id is required' });
    }

    const db = Database.getInstance();
    const fields = await db.all(`
      SELECT * FROM field_definitions 
      WHERE tenant_id = ? AND is_active = 1 
      ORDER BY order_index ASC, created_at ASC
    `, [tenant_id]);

    // JSON 필드들을 파싱
    const parsedFields = fields.map((field: any) => ({
      ...field,
      options: field.options ? JSON.parse(field.options) : undefined,
      defaultValue: field.default_value ? JSON.parse(field.default_value) : undefined,
      dbCategory: field.db_category,
      order: field.order_index,
      createdAt: new Date(field.created_at),
      updatedAt: new Date(field.updated_at)
    }));

    res.json(parsedFields);
  } catch (error) {
    console.error('Error fetching field definitions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 특정 필드 정의 조회
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tenant_id } = req.query;
    
    if (!tenant_id) {
      return res.status(400).json({ error: 'tenant_id is required' });
    }

    const db = Database.getInstance();
    const field = await db.get(`
      SELECT * FROM field_definitions 
      WHERE id = ? AND tenant_id = ? AND is_active = 1
    `, [id, tenant_id]);

    if (!field) {
      return res.status(404).json({ error: 'Field definition not found' });
    }

    // JSON 필드들을 파싱
    const parsedField = {
      ...field,
      options: field.options ? JSON.parse(field.options) : undefined,
      defaultValue: field.default_value ? JSON.parse(field.default_value) : undefined,
      dbCategory: field.db_category,
      order: field.order_index,
      createdAt: new Date(field.created_at),
      updatedAt: new Date(field.updated_at)
    };

    res.json(parsedField);
  } catch (error) {
    console.error('Error fetching field definition:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 필드 정의 생성
router.post('/', async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.body;
    const fieldData: Partial<TableField> = req.body;
    
    if (!tenant_id) {
      return res.status(400).json({ error: 'tenant_id is required' });
    }

    if (!fieldData.name || !fieldData.displayName || !fieldData.type) {
      return res.status(400).json({ error: 'name, displayName, and type are required' });
    }

    const db = Database.getInstance();
    
    // 중복 이름 확인
    const existingField = await db.get(`
      SELECT id FROM field_definitions 
      WHERE name = ? AND tenant_id = ? AND is_active = 1
    `, [fieldData.name, tenant_id]);

    if (existingField) {
      return res.status(409).json({ error: 'Field with this name already exists' });
    }

    // 다음 order_index 계산
    const maxOrder = await db.get(`
      SELECT MAX(order_index) as max_order FROM field_definitions 
      WHERE tenant_id = ? AND is_active = 1
    `, [tenant_id]);
    
    const nextOrder = (maxOrder?.max_order || 0) + 1;

    const fieldId = `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await db.run(`
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

    // 생성된 필드 조회
    const createdField = await db.get(`
      SELECT * FROM field_definitions WHERE id = ?
    `, [fieldId]);

    const parsedField = {
      ...createdField,
      options: createdField.options ? JSON.parse(createdField.options) : undefined,
      defaultValue: createdField.default_value ? JSON.parse(createdField.default_value) : undefined,
      dbCategory: createdField.db_category,
      order: createdField.order_index,
      createdAt: new Date(createdField.created_at),
      updatedAt: new Date(createdField.updated_at)
    };

    // WebSocket으로 실시간 알림
    wsService.notifyFieldDefinitionCreated(tenant_id, parsedField);

    res.status(201).json(parsedField);
  } catch (error) {
    console.error('Error creating field definition:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 필드 정의 업데이트
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tenant_id } = req.body;
    const fieldData: Partial<TableField> = req.body;
    
    if (!tenant_id) {
      return res.status(400).json({ error: 'tenant_id is required' });
    }

    const db = Database.getInstance();
    
    // 기존 필드 확인
    const existingField = await db.get(`
      SELECT * FROM field_definitions 
      WHERE id = ? AND tenant_id = ? AND is_active = 1
    `, [id, tenant_id]);

    if (!existingField) {
      return res.status(404).json({ error: 'Field definition not found' });
    }

    // 이름 변경 시 중복 확인
    if (fieldData.name && fieldData.name !== existingField.name) {
      const duplicateField = await db.get(`
        SELECT id FROM field_definitions 
        WHERE name = ? AND tenant_id = ? AND is_active = 1 AND id != ?
      `, [fieldData.name, tenant_id, id]);

      if (duplicateField) {
        return res.status(409).json({ error: 'Field with this name already exists' });
      }
    }

    await db.run(`
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

    // 업데이트된 필드 조회
    const updatedField = await db.get(`
      SELECT * FROM field_definitions WHERE id = ?
    `, [id]);

    const parsedField = {
      ...updatedField,
      options: updatedField.options ? JSON.parse(updatedField.options) : undefined,
      defaultValue: updatedField.default_value ? JSON.parse(updatedField.default_value) : undefined,
      dbCategory: updatedField.db_category,
      order: updatedField.order_index,
      createdAt: new Date(updatedField.created_at),
      updatedAt: new Date(updatedField.updated_at)
    };

    // WebSocket으로 실시간 알림
    wsService.notifyFieldDefinitionUpdated(tenant_id, parsedField);

    res.json(parsedField);
  } catch (error) {
    console.error('Error updating field definition:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 필드 정의 삭제 (소프트 삭제)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tenant_id } = req.query;
    
    if (!tenant_id) {
      return res.status(400).json({ error: 'tenant_id is required' });
    }

    const db = Database.getInstance();
    
    // 기존 필드 확인
    const existingField = await db.get(`
      SELECT * FROM field_definitions 
      WHERE id = ? AND tenant_id = ? AND is_active = 1
    `, [id, tenant_id]);

    if (!existingField) {
      return res.status(404).json({ error: 'Field definition not found' });
    }

    // 소프트 삭제
    await db.run(`
      UPDATE field_definitions SET
        is_active = 0,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ?
    `, [id, tenant_id]);

    // WebSocket으로 실시간 알림
    wsService.notifyFieldDefinitionDeleted(tenant_id, id);

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting field definition:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 필드 순서 업데이트
router.put('/:id/order', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tenant_id, order_index } = req.body;
    
    if (!tenant_id || order_index === undefined) {
      return res.status(400).json({ error: 'tenant_id and order_index are required' });
    }

    const db = Database.getInstance();
    
    await db.run(`
      UPDATE field_definitions SET
        order_index = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ? AND is_active = 1
    `, [order_index, id, tenant_id]);

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating field order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
