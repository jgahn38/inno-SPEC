import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { MariaDBConnection } from './database/mariadb-connection';
import { mariaDBScreenService } from './services/MariaDBScreenService';
import { mariaDBLNBService } from './services/MariaDBLNBService';

// 환경 변수 로드
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어 설정
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS 설정 - 모든 origin 허용 (개발 환경)
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id']
}));
app.use(compression());
// Only log errors and important requests
app.use(morgan('combined', {
  skip: function (req, res) {
    // Skip successful GET requests to reduce log noise
    return res.statusCode < 400 && req.method === 'GET';
  }
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 데이터베이스 연결 초기화
const db = MariaDBConnection.getInstance();

// 헬스 체크 엔드포인트
app.get('/health', async (req, res) => {
  try {
    const isConnected = await db.testConnection();
    res.json({
      success: true,
      message: 'API Server is running',
      database: isConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'API Server is running but database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// 화면 관련 API
app.get('/api/screens', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const screens = await mariaDBScreenService.getAllScreens(tenantId);
    res.json({
      success: true,
      data: screens
    });
  } catch (error) {
    console.error('Error fetching screens:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch screens'
    });
  }
});

app.get('/api/screens/:id', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const screen = await mariaDBScreenService.getScreenById(req.params.id, tenantId);
    
    if (!screen) {
      return res.status(404).json({
        success: false,
        error: 'Screen not found'
      });
    }
    
    res.json({
      success: true,
      data: screen
    });
  } catch (error) {
    console.error('Error fetching screen:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch screen'
    });
  }
});

app.post('/api/screens', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const newScreen = await mariaDBScreenService.createScreen(req.body, tenantId);
    
    res.status(201).json({
      success: true,
      data: newScreen
    });
  } catch (error) {
    console.error('Error creating screen:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create screen'
    });
  }
});

app.put('/api/screens/:id', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const updatedScreen = await mariaDBScreenService.updateScreen(req.params.id, req.body, tenantId);
    
    if (!updatedScreen) {
      return res.status(404).json({
        success: false,
        error: 'Screen not found'
      });
    }
    
    res.json({
      success: true,
      data: updatedScreen
    });
  } catch (error) {
    console.error('Error updating screen:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update screen'
    });
  }
});

app.delete('/api/screens/:id', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const deleted = await mariaDBScreenService.deleteScreen(req.params.id, tenantId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Screen not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Screen deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting screen:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete screen'
    });
  }
});

// LNB 관련 API
app.get('/api/lnb', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    await mariaDBLNBService.createDefaultLNBConfig(tenantId); // 기본 설정 생성
    const lnbConfigs = await mariaDBLNBService.getAllLNBConfigs(tenantId);
    
    res.json({
      success: true,
      data: lnbConfigs
    });
  } catch (error) {
    console.error('Error fetching LNB configs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch LNB configs'
    });
  }
});

app.get('/api/lnb/:id', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const lnbConfig = await mariaDBLNBService.getLNBConfigById(req.params.id, tenantId);
    
    if (!lnbConfig) {
      return res.status(404).json({
        success: false,
        error: 'LNB config not found'
      });
    }
    
    res.json({
      success: true,
      data: lnbConfig
    });
  } catch (error) {
    console.error('Error fetching LNB config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch LNB config'
    });
  }
});

app.post('/api/lnb', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const newConfig = await mariaDBLNBService.createLNBConfig(req.body, tenantId);
    
    res.status(201).json({
      success: true,
      data: newConfig
    });
  } catch (error) {
    console.error('Error creating LNB config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create LNB config'
    });
  }
});

app.put('/api/lnb/:id', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const updatedConfig = await mariaDBLNBService.updateLNBConfig(req.params.id, req.body, tenantId);
    
    if (!updatedConfig) {
      return res.status(404).json({
        success: false,
        error: 'LNB config not found'
      });
    }
    
    res.json({
      success: true,
      data: updatedConfig
    });
  } catch (error) {
    console.error('Error updating LNB config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update LNB config'
    });
  }
});

app.delete('/api/lnb/:id', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
    const deleted = await mariaDBLNBService.deleteLNBConfig(req.params.id, tenantId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'LNB config not found'
      });
    }
    
    res.json({
      success: true,
      message: 'LNB config deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting LNB config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete LNB config'
    });
  }
});

// 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// 에러 핸들러
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 MariaDB API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🗄️  Database: MariaDB`);
});

export default app;
