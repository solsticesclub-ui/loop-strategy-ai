// Rebuilds sitemap.xml from what is actually on disk.
//
// Why it scans the filesystem instead of reading blog/state.json: state.json only
// knows about bot-generated posts (9 of them), while blog/ holds 11 — the two
// oldest were written by hand. A sitemap built from state.json would silently drop
// them, which is the exact failure this file exists to end.
//
// Called at the end of generate-blog.mjs, so every weekly post lands in the sitemap
// the moment it is created. Also runnable on its own: node scripts/generate-sitemap.mjs

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const BASE = 'https://loopstrategy.ai'

// Pages that are not blog posts. changefreq/priority are hints Google largely
// ignores now; lastmod is the one it reads, so that is the one we keep honest.
const STATIC_PAGES = [
  { path: '/',                   changefreq: 'monthly', priority: '1.0' },
  { path: '/visualisation',      changefreq: 'monthly', priority: '0.9' },
  { path: '/operational-system', changefreq: 'monthly', priority: '0.9' },
  { path: '/blog/',              changefreq: 'weekly',  priority: '0.7' },
]

const iso = (d) => d.toISOString().slice(0, 10)

export function buildSitemap(ROOT) {
  const blogDir = join(ROOT, 'blog')

  // Dates: prefer the publication date the bot recorded, fall back to the file's
  // own mtime. Never invent today's date for an old post — a sitemap that claims
  // everything changed today is a sitemap Google stops trusting.
  const dates = {}
  const statePath = join(blogDir, 'state.json')
  if (existsSync(statePath)) {
    for (const p of JSON.parse(readFileSync(statePath, 'utf8')).published || []) {
      dates[p.slug] = p.date
    }
  }

  const posts = readdirSync(blogDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== 'images')
    .map((e) => e.name)
    .filter((slug) => existsSync(join(blogDir, slug, 'index.html')))
    .map((slug) => ({
      path: `/blog/${slug}/`,
      lastmod: dates[slug] || iso(statSync(join(blogDir, slug, 'index.html')).mtime),
    }))
    .sort((a, b) => b.lastmod.localeCompare(a.lastmod))

  const newest = posts.length ? posts[0].lastmod : iso(new Date())

  const entries = [
    ...STATIC_PAGES.map((p) => ({
      loc: BASE + p.path,
      // The homepage and /blog/ change whenever a post lands; the two sales pages
      // change when their content does, which is what git says about them.
      lastmod: p.path === '/' || p.path === '/blog/' ? newest : fileDate(ROOT, p.path, newest),
      changefreq: p.changefreq,
      priority: p.priority,
    })),
    ...posts.map((p) => ({
      loc: BASE + p.path,
      lastmod: p.lastmod,
      changefreq: 'yearly',
      priority: '0.6',
    })),
  ]

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    entries
      .map(
        (e) =>
          '  <url>\n' +
          `    <loc>${e.loc}</loc>\n` +
          `    <lastmod>${e.lastmod}</lastmod>\n` +
          `    <changefreq>${e.changefreq}</changefreq>\n` +
          `    <priority>${e.priority}</priority>\n` +
          '  </url>\n'
      )
      .join('') +
    '</urlset>\n'

  writeFileSync(join(ROOT, 'sitemap.xml'), xml, 'utf8')
  console.log(`✅ sitemap.xml — ${entries.length} URLs (${posts.length} blog posts)`)
  return entries.length
}

// mtime of the page file behind a route, so /visualisation reports when
// visualisation.html actually changed rather than when the bot last ran.
function fileDate(ROOT, path, fallback) {
  const file = join(ROOT, path.replace(/^\//, '').replace(/\/$/, '') + '.html')
  return existsSync(file) ? iso(statSync(file).mtime) : fallback
}

// Direct invocation: node scripts/generate-sitemap.mjs
const __dirname = dirname(fileURLToPath(import.meta.url))
if (process.argv[1] && process.argv[1].endsWith('generate-sitemap.mjs')) {
  buildSitemap(join(__dirname, '..'))
}
