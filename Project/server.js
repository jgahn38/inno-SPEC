const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const PORT = 3000;

// JSON 파싱을 위한 미들웨어 추가
app.use(express.json({ limit: '10mb' }));

// 정적 파일 서빙을 위한 미들웨어
app.use(express.static(path.join(__dirname, "dist")));

// API 라우트 (필요시 추가)
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// 데이터 백업 API 엔드포인트
app.post("/api/backup", (req, res) => {
  try {
    const { backupData } = req.body;
    
    if (!backupData) {
      return res.status(400).json({ error: "백업 데이터가 필요합니다." });
    }

    // data-backups 폴더 경로
    const backupDir = path.join(__dirname, "data-backups");
    
    // 폴더가 없으면 생성
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // 백업 파일명 생성 (날짜_시간)
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
    const filename = `inno_spec_backup_${date}_${time}.json`;
    const filepath = path.join(backupDir, filename);

    // 백업 파일 저장
    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2), 'utf8');
    
    console.log(`✅ 백업 파일 저장 완료: ${filepath}`);
    
    res.json({ 
      success: true, 
      message: "백업 파일이 성공적으로 저장되었습니다.",
      filename,
      filepath: filepath.replace(__dirname, ''),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('백업 파일 저장 실패:', error);
    res.status(500).json({ 
      error: "백업 파일 저장에 실패했습니다.", 
      details: error.message 
    });
  }
});

// 백업 파일 목록 조회 API
app.get("/api/backups", (req, res) => {
  try {
    const backupDir = path.join(__dirname, "data-backups");
    
    if (!fs.existsSync(backupDir)) {
      return res.json({ backups: [], total: 0 });
    }

    const files = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filepath = path.join(backupDir, file);
        const stats = fs.statSync(filepath);
        return {
          name: file,
          size: stats.size,
          modified: stats.mtime,
          path: filepath.replace(__dirname, '')
        };
      })
      .sort((a, b) => b.modified - a.modified);

    res.json({ 
      backups: files, 
      total: files.length,
      backupDir: backupDir.replace(__dirname, '')
    });
    
  } catch (error) {
    console.error('백업 파일 목록 조회 실패:', error);
    res.status(500).json({ 
      error: "백업 파일 목록 조회에 실패했습니다.", 
      details: error.message 
    });
  }
});

// section_library 폴더의 JSON 파일 목록 제공
app.get("/api/sections", (req, res) => {
  try {
    const sectionLibraryPath = path.join(__dirname, "public", "section_library");
    const files = fs.readdirSync(sectionLibraryPath);
    
    // JSON 파일만 필터링
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    // 각 JSON 파일에서 기본 정보 추출
    const sections = jsonFiles.map(filename => {
      try {
        const filePath = path.join(sectionLibraryPath, filename);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(fileContent);
        
        return {
          id: data.id || filename.replace('.json', ''),
          name: data.name || filename.replace('.json', ''),
          filename: filename,
          category: data.category || 'unknown',
          version: data.version || '1.0.0'
        };
      } catch (error) {
        console.warn(`Failed to parse ${filename}:`, error);
        return {
          id: filename.replace('.json', ''),
          name: filename.replace('.json', ''),
          filename: filename,
          category: 'unknown',
          version: '1.0.0'
        };
      }
    });
    
    res.json(sections);
  } catch (error) {
    console.error('Failed to read section library:', error);
    res.status(500).json({ error: 'Failed to read section library' });
  }
});

// 모든 GET 요청을 React 앱으로 라우팅 (SPA 지원)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`🌐 React app will be served from the dist folder`);
});