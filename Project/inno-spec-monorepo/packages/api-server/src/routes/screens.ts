import { Router } from 'express';
import { ScreenService } from '../services/ScreenService.js';
import { ApiResponse } from '../types/index.js';

const router = Router();
const screenService = new ScreenService();

// 화면 목록 조회
router.get('/', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      } as ApiResponse);
    }

    const result = await screenService.getScreens(tenantId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } as ApiResponse);
  }
});

// 특정 화면 조회
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      } as ApiResponse);
    }

    const result = await screenService.getScreenById(id, tenantId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } as ApiResponse);
  }
});

// 화면 생성
router.post('/', async (req, res) => {
  try {
    const screenData = req.body;
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      } as ApiResponse);
    }

    // 필수 필드 검증
    if (!screenData.name || !screenData.displayName) {
      return res.status(400).json({
        success: false,
        error: 'Name and displayName are required'
      } as ApiResponse);
    }

    const result = await screenService.createScreen(screenData, tenantId);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } as ApiResponse);
  }
});

// 화면 수정
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const screenData = req.body;
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      } as ApiResponse);
    }

    const result = await screenService.updateScreen(id, screenData, tenantId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } as ApiResponse);
  }
});

// 화면 삭제
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      } as ApiResponse);
    }

    const result = await screenService.deleteScreen(id, tenantId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } as ApiResponse);
  }
});

export default router;
