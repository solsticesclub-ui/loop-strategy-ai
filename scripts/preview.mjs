// Local preview server that honours _redirects.
//
// Why this exists: `python -m http.server` and most static servers know nothing
// about Netlify's _redirects file, so /visualisation and /operational-system
// 404 locally while working perfectly in production. That looks like a broken
// site when it is only a broken preview, and it makes clicking through the nav
// locally impossible.
//
// Usage: node scripts/preview.mjs [port]   (default 8899)

import { createServer } from 'http'
import { readFile, stat } from 'fs/promises'
import { join, extname, dirname, normalize } from 'path'
import { fileURLToPath } from 'url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = Number(process.argv[2] || 8899)

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4', '.ico': 'image/x-icon', '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2',
}

// Parse _redirects into [{from, to, status}]. Only the plain
// "/from  /to  status" form is used on this site, so that is all we support.
async function loadRedirects() {
  try {
    const raw = await readFile(join(ROOT, '_redirects'), 'utf-8')
    return raw.split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#'))
      .map(l => {
        const [from, to, status] = l.split(/\s+/)
        return { from, to, status: Number(status) || 301 }
      })
  } catch { return [] }
}

const redirects = await loadRedirects()
console.log(`preview: http://127.0.0.1:${PORT}  (${redirects.length} redirect rules loaded)`)

createServer(async (req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0].split('#')[0])

  const rule = redirects.find(r => r.from === urlPath)
  if (rule) {
    if (rule.status === 200) urlPath = rule.to            // rewrite, URL stays put
    else {
      res.writeHead(rule.status, { Location: rule.to }); return res.end()
    }
  }
  if (urlPath.endsWith('/')) urlPath += 'index.html'

  // keep the served path inside ROOT
  const file = join(ROOT, normalize(urlPath).replace(/^(\.\.[/\\])+/, ''))
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('forbidden') }

  try {
    const s = await stat(file)
    if (s.isDirectory()) { res.writeHead(302, { Location: urlPath + '/' }); return res.end() }
    const body = await readFile(file)
    res.writeHead(200, {
      'Content-Type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    })
    res.end(body)
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(`<pre>404 — ${urlPath}\n\nNot on disk. If this is a pretty URL, add it to _redirects.</pre>`)
  }
}).listen(PORT, '127.0.0.1')
