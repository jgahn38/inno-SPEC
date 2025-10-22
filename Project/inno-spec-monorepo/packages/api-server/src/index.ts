import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { join } from 'path';
import { createServer } from 'http';
import { WebSocketService } from './services/websocket.js';

// Routes
import screensRouter from './routes/screens.js';
import lnbRouter from './routes/lnb.js';
import fieldDefinitionsRouter from './routes/field-definitions.js';

const app = express();
const PORT = process.env.PORT || 3001;

// HTTP 서버 생성
const httpServer = createServer(app);

// WebSocket 서비스 초기화
const wsService = WebSocketService.getInstance();
wsService.initialize(httpServer);

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
import { mkdirSync } from 'fs';
const dataDir = join(process.cwd(), 'data');
try {
  mkdirSync(dataDir, { recursive: true });
} catch (error) {
  // 디렉토리가 이미 존재하는 경우 무시
}

// 헬스 체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Server is running',
    timestamp: new Date().toISOString()
  });
});

// API 라우트
app.use('/api/screens', screensRouter);
app.use('/api/lnb', lnbRouter);
app.use('/api/field-definitions', fieldDefinitionsRouter);

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
httpServer.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket enabled for real-time updates`);
});

export default app;
