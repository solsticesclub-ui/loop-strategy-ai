import Anthropic from '@anthropic-ai/sdk'
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs'
import { join, dirname, extname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// ── Post schedule ─────────────────────────────────────────────────────────────
const POSTS = [
  { num: 1,  slug: 'property-listing-render-before-buyer',           category: 'Marketing',       title: 'Why Your Property Listing Needs a Render Before It Has a Buyer' },
  { num: 2,  slug: 'interior-designers-ai-renders',                  category: 'Interior Design', title: 'How Interior Designers Use AI Renders to Win More Clients' },
  { num: 3,  slug: 'real-cost-waiting-traditional-cgi',              category: 'Industry',        title: 'The Real Cost of Waiting for Traditional CGI in 2026' },
  { num: 4,  slug: 'architects-ai-visualisation',                    category: 'Architecture',    title: 'What Architects Need to Know About AI Visualisation' },
  { num: 5,  slug: 'brief-property-render-no-technical-drawings',    category: 'Process',         title: 'How to Brief a Property Render Without Technical Drawings' },
  { num: 6,  slug: 'developers-ai-renders-before-construction',      category: 'Development',     title: '5 Ways Developers Use AI Renders Before Construction Starts' },
  { num: 7,  slug: 'planning-applications-rejected-renders-fix',     category: 'Planning',        title: 'Why Planning Applications Get Rejected — And How Renders Fix It' },
  { num: 8,  slug: 'ai-renders-vs-traditional-cgi',                  category: 'Industry',        title: 'AI Renders vs Traditional CGI: An Honest Comparison' },
  { num: 9,  slug: 'marketing-agencies-property-pitches-ai',         category: 'Marketing',       title: 'How Marketing Agencies Win Property Pitches with AI Visuals' },
  { num: 10, slug: 'property-render-useful-for-sales',               category: 'Sales',           title: 'What Makes a Property Render Actually Useful for Sales' },
  { num: 11, slug: 'off-plan-property-marketing-renders',            category: 'Development',     title: 'Off-Plan Property Marketing: Why Renders Sell Units Before They\'re Built' },
  { num: 12, slug: 'property-investors-ai-visuals',                  category: 'Investment',      title: 'How Property Investors Use AI Visuals to Make Faster Decisions' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function slugToDate() {
  const d = new Date()
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

function isoDate() {
  return new Date().toISOString().split('T')[0]
}

function findImage(num) {
  const dir = join(ROOT, 'blog', 'images')
  const pad = String(num).padStart(2, '0')
  for (const name of [pad, String(num)]) {
    for (const ext of ['.jpg', '.jpeg', '.png', '.webp']) {
      const p = join(dir, name + ext)
      if (existsSync(p)) return `../../blog/images/${name}${ext}`
    }
  }
  return null
}

function readBlogIndex() {
  const p = join(ROOT, 'blog', 'index.html')
  return readFileSync(p, 'utf8')
}

// ── HTML template ─────────────────────────────────────────────────────────────
function buildPostHTML({ title, category, slug, imageFile, date, readTime, intro, sections, ctaText }) {
  const sectionsHTML = sections.map(s => `
      <h2>${s.heading}</h2>
      ${s.paragraphs.map(p => `<p>${p}</p>`).join('\n      ')}
  `).join('\n      <hr>\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Loop Strategy AI</title>
  <meta name="description" content="${intro.slice(0, 155)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://loopstrategy.ai/blog/${slug}/">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${intro.slice(0, 155)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://loopstrategy.ai/blog/${slug}/">
  <meta property="og:image" content="https://loopstrategy.ai/og-image.jpg">
  <meta property="og:site_name" content="Loop Strategy AI">
  <meta property="article:author" content="Fanny">
  <meta property="article:published_time" content="${isoDate()}">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "${title}",
    "description": "${intro.slice(0, 155)}",
    "author": {"@type": "Person", "name": "Fanny", "url": "https://loopstrategy.ai"},
    "publisher": {"@type": "Organization", "name": "Loop Strategy AI", "url": "https://loopstrategy.ai", "logo": {"@type": "ImageObject", "url": "https://loopstrategy.ai/images/favicon.png"}},
    "datePublished": "${isoDate()}",
    "url": "https://loopstrategy.ai/blog/${slug}/"
  }
  </script>
  <link rel="icon" href="../../images/favicon.png" type="image/png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root { --dark:#28190e; --dark-2:#1C1108; --gold:#FFFFFF; --gold-lt:#E8E8E8; --gold-dim:rgba(255,255,255,0.08); --gold-line:rgba(255,255,255,0.1); --cream:#F5EFE6; --cream-2:#EDE3D4; --muted:rgba(245,239,230,0.52); --wa:#7db88e; --wa-dk:#68a87a; --radius:10px; --ease:0.28s ease; }
    html { scroll-behavior: smooth; }
    body { font-family: 'Outfit', sans-serif; background: var(--dark); color: var(--cream); line-height: 1.6; overflow-x: hidden; }
    a { color: inherit; text-decoration: none; }
    img, video { display: block; max-width: 100%; }
    .container { max-width: 1160px; margin: 0 auto; padding: 0 24px; }
    .nav-wrap { position: fixed; top: 0; left: 0; right: 0; z-index: 400; display: flex; justify-content: center; padding: 9px 24px; transition: padding 0.28s ease; }
    .nav-wrap.scrolled { padding: 6px 24px; }
    .nav-pill { display: flex; align-items: center; justify-content: space-between; gap: 24px; width: 100%; max-width: 960px; background: #ffffff; border-radius: 999px; padding: 5px 20px; box-shadow: 0 4px 24px rgba(0,0,0,0.18); }
    .nav-logo img { height: 60px; width: auto; filter: brightness(0) opacity(0.85); }
    .nav-links { display: flex; align-items: center; gap: 26px; list-style: none; }
    .nav-links a { font-size: 0.78rem; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(18,12,7,0.6); transition: color var(--ease); }
    .nav-links a:hover { color: var(--dark); }
    .nav-cta { display: inline-flex; align-items: center; gap: 7px; background: var(--wa); color: #fff; padding: 8px 18px; border-radius: 999px; font-size: 0.78rem; font-weight: 600; letter-spacing: 0.04em; transition: background var(--ease), transform var(--ease); white-space: nowrap; }
    .nav-cta:hover { background: var(--wa-dk); transform: scale(1.03); }
    .nav-cta svg { width: 15px; height: 15px; fill: #fff; }
    .nav-burger { display: none; background: none; border: none; padding: 4px; color: var(--dark); cursor: pointer; }
    .nav-burger svg { width: 22px; height: 22px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; }
    .mobile-menu { display: none; position: fixed; inset: 0; z-index: 500; background: var(--dark); flex-direction: column; align-items: center; justify-content: center; gap: 32px; }
    .mobile-menu.open { display: flex; }
    .mobile-menu a { font-size: 1.4rem; font-weight: 500; color: var(--cream); }
    .mobile-close { position: absolute; top: 28px; right: 28px; background: none; border: none; color: var(--cream); cursor: pointer; }
    .mobile-close svg { width: 26px; height: 26px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; }
    @media (max-width: 768px) { .nav-links { display: none; } .nav-cta.desktop { display: none; } .nav-burger { display: block; } }
    .article-wrap { max-width: 720px; margin: 0 auto; padding: 140px 24px 100px; }
    .article-header { margin-bottom: 48px; }
    .article-back { display: inline-flex; align-items: center; gap: 6px; font-size: 0.76rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-bottom: 28px; transition: color var(--ease); }
    .article-back:hover { color: var(--cream); }
    .article-back svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; }
    .article-tag { display: inline-block; font-size: 0.64rem; letter-spacing: 0.18em; text-transform: uppercase; color: var(--wa); font-weight: 600; margin-bottom: 14px; }
    .article-title { font-size: clamp(1.8rem, 3.5vw, 2.8rem); font-weight: 300; line-height: 1.15; color: var(--cream); margin-bottom: 20px; }
    .article-meta { display: flex; align-items: center; gap: 16px; font-size: 0.78rem; color: var(--muted); padding-bottom: 32px; border-bottom: 1px solid var(--gold-line); }
    .article-meta-dot { width: 3px; height: 3px; border-radius: 50%; background: var(--muted); }
    .article-cover { width: 100%; border-radius: 14px; margin-bottom: 48px; aspect-ratio: 16/9; object-fit: cover; }
    .article-body { font-size: 1rem; line-height: 1.85; color: var(--cream); }
    .article-body p { margin-bottom: 1.4em; }
    .article-body h2 { font-size: 1.35rem; font-weight: 500; line-height: 1.3; color: var(--cream); margin: 2.4em 0 0.9em; }
    .article-body hr { border: none; border-top: 1px solid var(--gold-line); margin: 2.4em 0; }
    .article-body strong { font-weight: 600; }
    .article-body ul { padding-left: 1.4em; display: flex; flex-direction: column; gap: 0.5em; margin-bottom: 1.4em; }
    .article-cta { margin-top: 56px; padding: 36px; background: rgba(255,255,255,0.04); border: 1px solid var(--gold-line); border-radius: 14px; text-align: center; }
    .article-cta p { font-size: 1.05rem; font-weight: 300; color: var(--cream); margin-bottom: 20px; line-height: 1.6; }
    .btn { display: inline-flex; align-items: center; gap: 9px; padding: 13px 26px; font-family: 'Outfit', sans-serif; font-size: 0.84rem; font-weight: 600; letter-spacing: 0.04em; border: none; cursor: pointer; transition: all var(--ease); border-radius: 30px; }
    .btn-wa { background: var(--wa); color: #fff; }
    .btn-wa:hover { background: var(--wa-dk); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(125,184,142,0.35); }
    .btn-wa svg { width: 19px; height: 19px; fill: #fff; }
    .article-cta-sub { margin-top: 12px; font-size: 0.78rem; color: var(--muted); }
    .article-tagline { margin-top: 56px; padding-top: 28px; border-top: 1px solid var(--gold-line); font-size: 0.8rem; color: var(--muted); font-style: italic; }
    footer { background: var(--dark); border-top: 1px solid var(--gold-line); padding: 60px 0 28px; }
    .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 44px; }
    .footer-logo { height: 60px; filter: brightness(0) invert(1) opacity(0.65); margin-bottom: 12px; }
    .footer-desc { font-size: 0.8rem; color: var(--muted); line-height: 1.75; max-width: 250px; margin-bottom: 18px; }
    .footer-col h4 { font-size: 0.67rem; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); margin-bottom: 14px; }
    .footer-links { list-style: none; display: flex; flex-direction: column; gap: 9px; }
    .footer-links a { font-size: 0.81rem; color: var(--muted); transition: color var(--ease); }
    .footer-links a:hover { color: var(--cream); }
    .footer-bottom { padding-top: 20px; border-top: 1px solid rgba(196,160,112,0.07); display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; font-size: 0.73rem; color: var(--muted); }
    @media (max-width: 1024px) { .footer-grid { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 580px) { .footer-grid { grid-template-columns: 1fr; } }
    .wa-float { position: fixed; bottom: 26px; right: 26px; z-index: 600; width: 56px; height: 56px; border-radius: 50%; background: var(--wa); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 22px rgba(125,184,142,0.42); transition: transform var(--ease), box-shadow var(--ease); }
    .wa-float:hover { transform: scale(1.1); }
    .wa-float svg { width: 28px; height: 28px; fill: #fff; }
  </style>
</head>
<body>
<div class="nav-wrap" id="nav">
  <div class="nav-pill">
    <a href="/" class="nav-logo"><img src="../../images/Cream Black Typography Loop Brand Logo.png" alt="Loop Strategy AI" width="120" height="60"></a>
    <ul class="nav-links">
      <li><a href="/#services">Services</a></li>
      <li><a href="/#portfolio">Portfolio</a></li>
      <li><a href="/#pricing">Pricing</a></li>
      <li><a href="/#faq">FAQ</a></li>
    </ul>
    <a class="nav-cta desktop" href="https://wa.me/34630773354?text=Hi%20Fanny%2C%20I'd%20like%20to%20start%20with%20AI%20property%20visualisation." target="_blank" rel="noopener">
      <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      Get started
    </a>
    <button class="nav-burger" onclick="document.getElementById('mobileMenu').classList.toggle('open')" aria-label="Menu">
      <svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    </button>
  </div>
</div>
<div class="mobile-menu" id="mobileMenu">
  <button class="mobile-close" onclick="document.getElementById('mobileMenu').classList.remove('open')">
    <svg viewBox="0 0 24 24"><line x1="4" y1="4" x2="20" y2="20"/><line x1="20" y1="4" x2="4" y2="20"/></svg>
  </button>
  <a href="/#services" onclick="document.getElementById('mobileMenu').classList.remove('open')">Services</a>
  <a href="/#portfolio" onclick="document.getElementById('mobileMenu').classList.remove('open')">Portfolio</a>
  <a href="/#pricing" onclick="document.getElementById('mobileMenu').classList.remove('open')">Pricing</a>
  <a href="/#faq" onclick="document.getElementById('mobileMenu').classList.remove('open')">FAQ</a>
</div>
<main>
  <article class="article-wrap">
    <header class="article-header">
      <a href="/blog/" class="article-back">
        <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
        All posts
      </a>
      <div class="article-tag">${category}</div>
      <h1 class="article-title">${title}</h1>
      <div class="article-meta">
        <span>Fanny</span>
        <div class="article-meta-dot"></div>
        <span>${date}</span>
        <div class="article-meta-dot"></div>
        <span>${readTime}</span>
      </div>
    </header>
    ${imageFile ? `<img src="${imageFile}" alt="${title} — Loop Strategy AI" class="article-cover">` : ''}
    <div class="article-body">
      <p>${intro}</p>
      <hr>
      ${sectionsHTML}
    </div>
    <div class="article-cta">
      <p>${ctaText}</p>
      <a class="btn btn-wa" href="https://wa.me/34630773354?text=Hi%20Fanny%2C%20I%20read%20your%20blog%20and%20I%27d%20like%20to%20discuss%20my%20project." target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        WhatsApp: +34 630 77 33 54
      </a>
      <p class="article-cta-sub"><a href="https://loopstrategy.ai">loopstrategy.ai</a></p>
    </div>
    <p class="article-tagline"><em>Loop Strategy AI is an architectural visualisation studio. We produce photorealistic renders and video for property developers, architects, and investor presentations.</em></p>
  </article>
</main>
<footer>
  <div class="container">
    <div class="footer-grid">
      <div>
        <img src="../../images/Cream Black Typography Loop Brand Logo.png" alt="Loop Strategy AI" class="footer-logo">
        <p class="footer-desc">AI-generated photorealistic property renders and marketing videos. Run personally by Fanny. From €199, delivered in 48 hours.</p>
      </div>
      <div class="footer-col"><h4>Services</h4><ul class="footer-links"><li><a href="/#services">Concept Generation</a></li><li><a href="/#services">Presentation</a></li><li><a href="/#services">Property Marketing</a></li></ul></div>
      <div class="footer-col"><h4>Pricing</h4><ul class="footer-links"><li><a href="/#pricing">Agent Pack — €199</a></li><li><a href="/#pricing">Agency Pack — €399</a></li><li><a href="/#pricing">Studio Pack — €799</a></li></ul></div>
      <div class="footer-col"><h4>Company</h4><ul class="footer-links"><li><a href="/#fanny">About Fanny</a></li><li><a href="/#faq">FAQ</a></li><li><a href="/blog/">Blog</a></li><li><a href="https://wa.me/34630773354" target="_blank">WhatsApp</a></li></ul></div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 Fanny · Loop Strategy AI · All rights reserved</span>
      <span>AI Visual Intelligence for Real Estate · loopstrategy.ai</span>
    </div>
  </div>
</footer>
<a class="wa-float" href="https://wa.me/34630773354?text=Hi%20Fanny%2C%20I'm%20interested%20in%20AI%20property%20visualisation." target="_blank" rel="noopener" aria-label="WhatsApp">
  <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
</a>
<script>
  const navWrap = document.getElementById('nav');
  window.addEventListener('scroll', () => { navWrap.classList.toggle('scrolled', window.scrollY > 60); }, { passive: true });
</script>
</body>
</html>`
}

// ── Update blog index page ─────────────────────────────────────────────────────
function addCardToBlogIndex({ title, slug, category, date, excerpt, imageFile }) {
  const indexPath = join(ROOT, 'blog', 'index.html')
  let html = readFileSync(indexPath, 'utf8')

  const imgTag = imageFile
    ? `<img src="images/${imageFile.split('/').pop()}" alt="${title}" class="blog-card-img" style="width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:12px 12px 0 0;">`
    : ''

  const newCard = `
          <a href="/blog/${slug}/" class="blog-card" style="display:flex;flex-direction:column;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:14px;overflow:hidden;text-decoration:none;transition:transform 0.2s ease;">
            ${imgTag}
            <div style="padding:24px;flex:1;display:flex;flex-direction:column;gap:10px;">
              <span style="font-size:0.65rem;letter-spacing:0.18em;text-transform:uppercase;color:#7db88e;font-weight:600;">${category}</span>
              <h2 style="font-size:1.05rem;font-weight:400;line-height:1.35;color:#F5EFE6;">${title}</h2>
              <p style="font-size:0.85rem;color:rgba(245,239,230,0.55);line-height:1.6;flex:1;">${excerpt}</p>
              <span style="font-size:0.75rem;color:rgba(245,239,230,0.35);">${date}</span>
            </div>
          </a>`

  // Insert before closing </div> of the grid
  html = html.replace('<!-- END_POSTS -->', newCard + '\n          <!-- END_POSTS -->')
  writeFileSync(indexPath, html, 'utf8')
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  const statePath = join(ROOT, 'blog', 'state.json')
  const state = JSON.parse(readFileSync(statePath, 'utf8'))
  const nextNum = state.nextPost

  // Check if all 12 posts are done
  if (nextNum > 12) {
    console.log('⚠️  All 12 blog images have been used. Add new images and update state.json to continue.')
    // Signal to GitHub Actions to create a warning issue
    writeFileSync(join(ROOT, 'IMAGES_EXHAUSTED'), '1')
    process.exit(0)
  }

  const post = POSTS.find(p => p.num === nextNum)
  if (!post) { console.error('Post config not found for num', nextNum); process.exit(1) }

  // Warn 2 posts before running out
  if (nextNum === 11) {
    console.log('⚠️  WARNING: Only 2 blog images remaining after this post. Prepare new images soon.')
    writeFileSync(join(ROOT, 'IMAGES_LOW'), '1')
  }

  const imageFile = findImage(nextNum)
  if (!imageFile) {
    console.error(`Image not found for post ${nextNum}. Add blog/images/${String(nextNum).padStart(2,'0')}.jpg`)
    process.exit(1)
  }

  console.log(`Generating post ${nextNum}: ${post.title}`)

  // Call Claude API
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `Write a blog post for Loop Strategy AI, an architectural visualisation studio run by Fanny that produces AI photorealistic renders for property developers, architects, interior designers, and marketing agencies. Delivers in 48h from €199. Contact via WhatsApp.

Title: "${post.title}"
Category: ${post.category}

Return JSON only, no markdown:
{
  "intro": "Opening paragraph (2-3 sentences, compelling, specific)",
  "readTime": "X min read",
  "ctaText": "Closing sentence encouraging WhatsApp contact",
  "sections": [
    { "heading": "Section heading", "paragraphs": ["paragraph 1", "paragraph 2"] },
    { "heading": "Section heading", "paragraphs": ["paragraph 1"] },
    { "heading": "Section heading", "paragraphs": ["paragraph 1", "paragraph 2"] }
  ],
  "excerpt": "One sentence summary for blog index card (max 120 chars)"
}

Write in a direct, professional tone. No fluff. Speak to a sophisticated real estate/architecture audience.`
    }]
  })

  const raw = response.content[0].text.trim()
  const json = JSON.parse(raw.replace(/^```json\n?/, '').replace(/\n?```$/, ''))

  const date = slugToDate()
  const html = buildPostHTML({
    title: post.title,
    category: post.category,
    slug: post.slug,
    imageFile: `../../blog/images/${imageFile.split('/').pop()}`,
    date,
    readTime: json.readTime,
    intro: json.intro,
    sections: json.sections,
    ctaText: json.ctaText,
  })

  // Write post file
  const postDir = join(ROOT, 'blog', post.slug)
  mkdirSync(postDir, { recursive: true })
  writeFileSync(join(postDir, 'index.html'), html, 'utf8')
  console.log(`✓ Created blog/${post.slug}/index.html`)

  // Update blog index
  addCardToBlogIndex({ title: post.title, slug: post.slug, category: post.category, date, excerpt: json.excerpt, imageFile })
  console.log('✓ Updated blog/index.html')

  // Update state
  state.nextPost = nextNum + 1
  state.published.push({ num: nextNum, slug: post.slug, date: isoDate() })
  writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8')
  console.log(`✓ State updated — next post will be #${state.nextPost}`)
}

main().catch(err => { console.error(err); process.exit(1) })
