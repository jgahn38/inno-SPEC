const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const PORT = 3000;

// 정적 파일 서빙을 위한 미들웨어
app.use(express.static(path.join(__dirname, "dist")));

// API 라우트 (필요시 추가)
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
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