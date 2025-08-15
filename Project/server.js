const express = require("express");
const path = require("path");
const app = express();
const PORT = 3000;

// 정적 파일 서빙을 위한 미들웨어
app.use(express.static(path.join(__dirname, "dist")));

// API 라우트 (필요시 추가)
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// 모든 GET 요청을 React 앱으로 라우팅 (SPA 지원)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`🌐 React app will be served from the dist folder`);
});