import { Router } from 'express';
import { LNBService } from '../services/LNBService.js';
import { ApiResponse } from '../types/index.js';

const router = Router();
const lnbService = new LNBService();

// LNB 설정 목록 조회
router.get('/', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      } as ApiResponse);
    }

    const result = await lnbService.getLNBConfigs(tenantId);
    
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

// 특정 LNB 설정 조회
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

    const result = await lnbService.getLNBConfigById(id, tenantId);
    
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

// LNB 설정 생성
router.post('/', async (req, res) => {
  try {
    const configData = req.body;
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      } as ApiResponse);
    }

    // 필수 필드 검증
    if (!configData.name || !configData.displayName) {
      return res.status(400).json({
        success: false,
        error: 'Name and displayName are required'
      } as ApiResponse);
    }

    const result = await lnbService.createLNBConfig(configData, tenantId);
    
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

// LNB 설정 수정
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const configData = req.body;
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      } as ApiResponse);
    }

    const result = await lnbService.updateLNBConfig(id, configData, tenantId);
    
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

// LNB 설정 삭제
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

    const result = await lnbService.deleteLNBConfig(id, tenantId);
    
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
