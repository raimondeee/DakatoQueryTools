import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { queriesApiMiddleware, readQueries } from './queriesStore.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, '..', 'dist');
const PORT = Number(process.env.PORT) || 4173;

const api = queriesApiMiddleware();

const server = http.createServer(async (req, res) => {
  await api(req, res, () => {});
  if (res.writableEnded) return;

  if (req.method !== 'GET' || !req.url) {
    res.statusCode = 405;
    res.end('Method not allowed');
    return;
  }

  const urlPath = req.url.split('?')[0];
  let filePath = path.join(DIST_DIR, urlPath === '/' ? 'index.html' : urlPath);

  try {
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) filePath = path.join(filePath, 'index.html');
  } catch {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  try {
    const content = await fs.readFile(filePath);
    res.setHeader('Content-Type', contentType(filePath));
    res.end(content);
  } catch {
    res.statusCode = 404;
    res.end('Not found');
  }
});

server.listen(PORT, async () => {
  await readQueries();
  console.log(`Dakato Query Tools running at http://localhost:${PORT}`);
  console.log(`Queries saved to ${path.join(process.cwd(), 'data', 'queries.json')}`);
});

function contentType(filePath) {
  if (filePath.endsWith('.html')) return 'text/html';
  if (filePath.endsWith('.js')) return 'application/javascript';
  if (filePath.endsWith('.css')) return 'text/css';
  if (filePath.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}
