// 生图器前端静态服务 + 图片保存 API — 单文件、无依赖（Node 内置 http/fs）
// 用法：node serve.js
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT) || 8180;
const HOST = '::';
const ROOT = __dirname;
const OUTPUT_DIR = path.join(ROOT, 'output');
const BACKEND_CONFIG_PATH = path.join(ROOT, 'backend', 'configs', 'config.json');
let backendConfig = {};
try { backendConfig = JSON.parse(fs.readFileSync(BACKEND_CONFIG_PATH, 'utf8')); } catch {}
const BACKEND_PORT = parseInt(process.env.BACKEND_PORT) || backendConfig.SERVER_PORT || 7780;
const BACKEND_API_KEY = process.env.BACKEND_API_KEY || backendConfig.REQUIRED_API_KEY || '123456';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.md': 'text/markdown; charset=utf-8',
};

// 确保 output 目录存在
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function jsonReply(res, status, obj) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(obj));
}

http.createServer(async (req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  // ===== API: 保存图片到磁盘 =====
  if (req.method === 'POST' && urlPath === '/api/save-image') {
    try {
      const body = JSON.parse(await readBody(req));
      const { dataUrl, filename, subfolder } = body;
      if (!dataUrl || !filename) return jsonReply(res, 400, { error: 'dataUrl and filename required' });

      // 从 data URL 提取 base64
      const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!m) return jsonReply(res, 400, { error: 'invalid data URL' });
      const buffer = Buffer.from(m[2], 'base64');

      // 子目录（按日期或对话标题）
      const sub = (subfolder || new Date().toISOString().slice(0, 10)).replace(/[<>:"/\\|?*]/g, '_');
      const dir = path.join(OUTPUT_DIR, sub);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      // 安全文件名
      const safeName = filename.replace(/[<>:"/\\|?*]/g, '_').slice(0, 120);
      const filePath = path.join(dir, safeName);

      fs.writeFileSync(filePath, buffer);
      console.log(`[save] ${filePath} (${(buffer.length / 1024).toFixed(1)} KB)`);
      jsonReply(res, 200, { ok: true, path: filePath, size: buffer.length });
    } catch (e) {
      console.error('[save] error:', e);
      jsonReply(res, 500, { error: e.message });
    }
    return;
  }

  // ===== API: 聊天记录持久化（磁盘双写，换端口不丢）=====
  const STATE_FILE = path.join(ROOT, 'data', 'state.json');
  if (req.method === 'POST' && urlPath === '/api/save-state') {
    try {
      const body = await readBody(req);
      const dir = path.dirname(STATE_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(STATE_FILE, body, 'utf8');
      jsonReply(res, 200, { ok: true });
    } catch (e) { jsonReply(res, 500, { error: e.message }); }
    return;
  }
  if (req.method === 'GET' && urlPath === '/api/load-state') {
    try {
      if (fs.existsSync(STATE_FILE)) {
        const data = fs.readFileSync(STATE_FILE, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
        res.end(data);
      } else {
        jsonReply(res, 404, { error: 'no saved state' });
      }
    } catch (e) { jsonReply(res, 500, { error: e.message }); }
    return;
  }

  // ===== API: 列出已保存的图片 =====
  if (req.method === 'GET' && urlPath === '/api/saved-images') {
    try {
      const result = [];
      if (fs.existsSync(OUTPUT_DIR)) {
        for (const sub of fs.readdirSync(OUTPUT_DIR)) {
          const subPath = path.join(OUTPUT_DIR, sub);
          if (!fs.statSync(subPath).isDirectory()) continue;
          const files = fs.readdirSync(subPath).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
          result.push({ folder: sub, count: files.length, files: files.slice(0, 50) });
        }
      }
      jsonReply(res, 200, { folders: result });
    } catch (e) {
      jsonReply(res, 500, { error: e.message });
    }
    return;
  }

  // ===== 后端管理 token（自动读 pwd 文件登录）=====
  if (req.method === 'GET' && urlPath === '/api/backend-token') {
    try {
      const pwdFile = path.join(ROOT, 'backend', 'configs', 'pwd');
      const pwd = fs.readFileSync(pwdFile, 'utf-8').trim();
      const body = JSON.stringify({ password: pwd });
      const proxyReq = http.request({ hostname: '127.0.0.1', port: BACKEND_PORT, path: '/api/login', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, proxyRes => {
        let data = '';
        proxyRes.on('data', c => data += c);
        proxyRes.on('end', () => { res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' }); res.end(data); });
      });
      proxyReq.on('error', e => jsonReply(res, 502, { error: e.message }));
      proxyReq.end(body);
    } catch (e) { jsonReply(res, 500, { error: e.message }); }
    return;
  }

  // ===== 反代 Proxy（合并端口：前端 8080 → 后端 7777 透明转发）=====
  const isSelfApi = urlPath === '/api/save-image' || urlPath === '/api/saved-images';
  const isProxyPath = !isSelfApi && (
    urlPath.startsWith('/openai-codex-oauth/') ||
    urlPath.startsWith('/v1/') ||
    urlPath.startsWith('/api/') ||
    urlPath === '/health'
  );
  if (isProxyPath) {
    const proxyHeaders = { ...req.headers };
    // 只对生图 API 自动注入 key；管理 API（/api/*）让前端传的 admin token 透传
    const isImageApi = urlPath.startsWith('/openai-codex-oauth/') || urlPath.startsWith('/v1/') || urlPath === '/health';
    if (isImageApi) {
      proxyHeaders['authorization'] = `Bearer ${BACKEND_API_KEY}`;
    }
    delete proxyHeaders['host'];
    const proxyOpts = {
      hostname: '127.0.0.1',
      port: BACKEND_PORT,
      path: req.url,
      method: req.method,
      headers: proxyHeaders,
    };
    const proxyReq = http.request(proxyOpts, (proxyRes) => {
      // 加 CORS 头（前端同 origin 不需要，但保险）
      const h = { ...proxyRes.headers, 'access-control-allow-origin': '*' };
      res.writeHead(proxyRes.statusCode, h);
      proxyRes.pipe(res);
    });
    proxyReq.on('error', (e) => {
      console.error(`[proxy] ${req.method} ${urlPath} → backend error:`, e.message);
      jsonReply(res, 502, { error: `反代后端不可达: ${e.message}。检查 backend 是否在跑 (端口 ${BACKEND_PORT})` });
    });
    req.pipe(proxyReq);
    return;
  }

  // ===== 静态文件服务 =====
  let staticPath = urlPath;
  if (staticPath === '/') staticPath = '/index.html';

  // 允许访问 output/ 下的图片（用来在前端预览已保存的图）
  if (staticPath.startsWith('/backend/') || staticPath.includes('..')) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }
  const filePath = path.join(ROOT, staticPath);
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found: ' + staticPath);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(filePath).pipe(res);
  });
}).listen(PORT, HOST, () => {
  console.log(`\n生图器前端服务运行中`);
  console.log(`  → http://localhost:${PORT}/`);
  console.log(`  → 图片保存目录: ${OUTPUT_DIR}`);
  console.log(`  → 反代后端: http://127.0.0.1:7777`);
  console.log(`\n按 Ctrl+C 停止\n`);
});
