import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어 설정
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
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

// 데이터 디렉토리 생성
const dataDir = join(process.cwd(), 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

// 데이터 파일 경로
const screensFile = join(dataDir, 'screens.json');
const lnbFile = join(dataDir, 'lnb.json');

// 데이터 로드 함수
const loadData = (filePath: string, defaultValue: any = []) => {
  try {
    if (existsSync(filePath)) {
      return JSON.parse(readFileSync(filePath, 'utf8'));
    }
    return defaultValue;
  } catch (error) {
    console.error(`Failed to load data from ${filePath}:`, error);
    return defaultValue;
  }
};

// 데이터 저장 함수
const saveData = (filePath: string, data: any) => {
  try {
    writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Failed to save data to ${filePath}:`, error);
    return false;
  }
};

// 헬스 체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Server is running',
    timestamp: new Date().toISOString()
  });
});

// 화면 관련 API
app.get('/api/screens', (req, res) => {
  try {
    const screens = loadData(screensFile, []);
    res.json({
      success: true,
      data: screens
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load screens'
    });
  }
});

app.get('/api/screens/:id', (req, res) => {
  try {
    const screens = loadData(screensFile, []);
    const screen = screens.find((s: any) => s.id === req.params.id);
    
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
    res.status(500).json({
      success: false,
      error: 'Failed to load screen'
    });
  }
});

app.post('/api/screens', (req, res) => {
  try {
    const screens = loadData(screensFile, []);
    const newScreen = {
      ...req.body,
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    screens.push(newScreen);
    saveData(screensFile, screens);
    
    res.status(201).json({
      success: true,
      data: newScreen
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create screen'
    });
  }
});

app.put('/api/screens/:id', (req, res) => {
  try {
    const screens = loadData(screensFile, []);
    const index = screens.findIndex((s: any) => s.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Screen not found'
      });
    }
    
    screens[index] = {
      ...screens[index],
      ...req.body,
      id: req.params.id,
      updatedAt: new Date().toISOString()
    };
    
    saveData(screensFile, screens);
    
    res.json({
      success: true,
      data: screens[index]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update screen'
    });
  }
});

app.delete('/api/screens/:id', (req, res) => {
  try {
    const screens = loadData(screensFile, []);
    const filteredScreens = screens.filter((s: any) => s.id !== req.params.id);
    
    if (screens.length === filteredScreens.length) {
      return res.status(404).json({
        success: false,
        error: 'Screen not found'
      });
    }
    
    saveData(screensFile, filteredScreens);
    
    res.json({
      success: true,
      message: 'Screen deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete screen'
    });
  }
});

// LNB 관련 API
app.get('/api/lnb', (req, res) => {
  try {
    const lnbConfigs = loadData(lnbFile, []);
    res.json({
      success: true,
      data: lnbConfigs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load LNB configs'
    });
  }
});

app.get('/api/lnb/:id', (req, res) => {
  try {
    const lnbConfigs = loadData(lnbFile, []);
    const config = lnbConfigs.find((c: any) => c.id === req.params.id);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'LNB config not found'
      });
    }
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load LNB config'
    });
  }
});

app.post('/api/lnb', (req, res) => {
  try {
    const lnbConfigs = loadData(lnbFile, []);
    const newConfig = {
      ...req.body,
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    lnbConfigs.push(newConfig);
    saveData(lnbFile, lnbConfigs);
    
    res.status(201).json({
      success: true,
      data: newConfig
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create LNB config'
    });
  }
});

app.put('/api/lnb/:id', (req, res) => {
  try {
    const lnbConfigs = loadData(lnbFile, []);
    const index = lnbConfigs.findIndex((c: any) => c.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'LNB config not found'
      });
    }
    
    lnbConfigs[index] = {
      ...lnbConfigs[index],
      ...req.body,
      id: req.params.id,
      updatedAt: new Date().toISOString()
    };
    
    saveData(lnbFile, lnbConfigs);
    
    res.json({
      success: true,
      data: lnbConfigs[index]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update LNB config'
    });
  }
});

app.delete('/api/lnb/:id', (req, res) => {
  try {
    const lnbConfigs = loadData(lnbFile, []);
    const filteredConfigs = lnbConfigs.filter((c: any) => c.id !== req.params.id);
    
    if (lnbConfigs.length === filteredConfigs.length) {
      return res.status(404).json({
        success: false,
        error: 'LNB config not found'
      });
    }
    
    saveData(lnbFile, filteredConfigs);
    
    res.json({
      success: true,
      message: 'LNB config deleted successfully'
    });
  } catch (error) {
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
  console.log(`🚀 Simple API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
});

export default app;
