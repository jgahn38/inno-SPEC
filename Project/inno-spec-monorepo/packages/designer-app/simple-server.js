const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 8080;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './test.html';
  }
  
  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeType = mimeTypes[extname] || 'application/octet-stream';
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <body>
              <h1>404 - File Not Found</h1>
              <p>Requested file: ${req.url}</p>
              <p>Full path: ${filePath}</p>
              <p>Available files:</p>
              <ul>
                <li><a href="/test.html">test.html</a></li>
                <li><a href="/src/assets/image.png">src/assets/image.png</a></li>
                <li><a href="/public/assets/image.png">public/assets/image.png</a></li>
              </ul>
            </body>
          </html>
        `);
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Server running at http://127.0.0.1:${port}/`);
  console.log(`Test page: http://127.0.0.1:${port}/test.html`);
});
