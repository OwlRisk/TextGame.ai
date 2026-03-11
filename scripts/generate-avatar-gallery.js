#!/usr/bin/env node
/**
 * Generates public/style-test/db.html — a live avatar gallery from the database.
 * Run: node scripts/generate-avatar-gallery.js
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://hazjbhhreltgjexxaazn.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhempiaGhyZWx0Z2pleHhhYXpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODk1MzI4MSwiZXhwIjoyMDg0NTI5MjgxfQ.ne5AoTqlzgWqgvYzImXVmWi68g2dHw5IusNW2NPbcRY';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const STYLES = ['toon3d', 'semi-realistic', 'anime', 'painted', 'pixel', 'cyberpunk'];
const STYLE_META = {
  'toon3d':         { label: '3D Animated',      desc: 'Vibrant 3D animation studio style',  color: '#ff7eb3', bg: 'rgba(255,126,179,0.12)', border: 'rgba(255,126,179,0.3)' },
  'semi-realistic': { label: 'Semi-Realistic', desc: 'Painterly game art, Arcane-inspired', color: '#c8a86b', bg: 'rgba(200,168,107,0.12)', border: 'rgba(200,168,107,0.3)' },
  'anime':          { label: 'Anime',           desc: 'Japanese cel-shaded illustration',   color: '#e879f9', bg: 'rgba(232,121,249,0.12)', border: 'rgba(232,121,249,0.3)' },
  'painted':        { label: 'Painted Portrait', desc: 'Oil-painting brush strokes',        color: '#84cc16', bg: 'rgba(132,204,22,0.12)',  border: 'rgba(132,204,22,0.3)' },
  'pixel':          { label: 'Pixel Art',        desc: 'Retro 16-bit game sprites',         color: '#38bdf8', bg: 'rgba(56,189,248,0.12)',  border: 'rgba(56,189,248,0.3)' },
  'cyberpunk':      { label: 'Cyberpunk',        desc: 'Neon-noir sci-fi aesthetic',        color: '#00ffaa', bg: 'rgba(0,255,170,0.08)',   border: 'rgba(0,255,170,0.3)' },
};

// Cache-bust timestamp — forces CDN to serve fresh images after regeneration
const CACHE_BUST = `?v=${Date.now()}`;

function resolveUrl(char, style) {
  const s = char.avatar_styles || {};
  const hdKey = style + '_hd';
  if (s[hdKey]) return s[hdKey] + CACHE_BUST;
  if (s[style]) return s[style] + CACHE_BUST;
  if (style === 'semi-realistic' && char.avatar_url) return char.avatar_url + CACHE_BUST;
  return null;
}

function charStyleMap(char) {
  const result = {};
  for (const st of STYLES) {
    const url = resolveUrl(char, st);
    if (url) result[st] = url;
  }
  return result;
}

async function run() {
  console.log('Fetching characters from database...');

  const { data, error } = await supabase
    .from('ai_characters')
    .select('id, name, gender, personality, avatar_url, avatar_styles')
    .eq('is_system', true)
    .not('avatar_url', 'is', null)
    .order('name', { ascending: true })
    .limit(500);

  if (error) { console.error('DB error:', error.message); process.exit(1); }

  console.log('Total system characters:', data.length);

  // Build per-style character lists
  const byStyle = {};
  for (const st of STYLES) {
    byStyle[st] = data
      .map(c => {
        const url = resolveUrl(c, st);
        if (!url) return null;
        return { name: c.name, gender: c.gender, url, styles: charStyleMap(c) };
      })
      .filter(Boolean);
    console.log(`  ${st}: ${byStyle[st].length} chars`);
  }

  // Pick hero (most styles)
  const ranked = data
    .map(c => ({ ...c, styleCount: STYLES.filter(st => resolveUrl(c, st)).length }))
    .sort((a, b) => b.styleCount - a.styleCount);
  const hero = ranked.length > 1 ? ranked[1] : ranked[0];
  const heroStyles = hero ? charStyleMap(hero) : null;

  const fullCount = data.filter(c => STYLES.every(st => resolveUrl(c, st))).length;
  const stats = STYLES.map(st => ({ style: st, count: byStyle[st].length }));

  const html = buildHTML(byStyle, heroStyles, hero, stats, fullCount, data.length);
  const outPath = path.join(__dirname, '../public/style-test/db.html');
  fs.writeFileSync(outPath, html, 'utf8');
  console.log('Written:', outPath);
}

function avatarCardHTML(c, st) {
  const otherMinis = STYLES
    .filter(x => x !== st && c.styles[x])
    .map(x => `<img class="mini-style" src="${c.styles[x]}" title="${STYLE_META[x].label}" loading="lazy">`)
    .join('');

  const encoded = encodeURIComponent(JSON.stringify({ name: c.name, gender: c.gender, url: c.url, styles: c.styles }));
  return `<div class="avatar-card" onclick="openModal('${encoded}')">
  <div class="avatar-img-wrap">
    <img src="${c.url}" alt="${c.name}" loading="lazy">
    <div class="avatar-overlay"><div class="mini-styles">${otherMinis}</div></div>
  </div>
  <div class="avatar-name">${c.name}</div>
  <div class="avatar-gender">${c.gender || ''}</div>
</div>`;
}

function buildHTML(byStyle, heroStyles, hero, stats, fullCount, totalCount) {
  const tabsHTML = STYLES.map((st, i) =>
    `<button class="tab${i === 0 ? ' active' : ''}" data-style="${st}" onclick="switchStyle('${st}')">
      <span class="tab-dot"></span>${STYLE_META[st].label}
    </button>`
  ).join('\n');

  const heroRowHTML = (hero && heroStyles)
    ? STYLES.map(st => {
        const url = heroStyles[st];
        if (!url) return '';
        const m = STYLE_META[st];
        return `<div class="hero-card" data-style="${st}" onclick="switchStyle('${st}')">
          <img src="${url}" alt="${m.label}" loading="lazy">
          <div class="hero-card-label"><span class="dot" style="background:${m.color}"></span>${m.label}</div>
        </div>`;
      }).join('\n')
    : '';

  const panelsHTML = STYLES.map((st, i) => {
    const m = STYLE_META[st];
    const cards = byStyle[st].map(c => avatarCardHTML(c, st)).join('\n');
    return `<div class="style-panel${i === 0 ? ' active' : ''}" id="panel-${st}">
  <div class="panel-header">
    <div class="style-badge" style="background:${m.bg};color:${m.color};border:1px solid ${m.border}">${m.label}</div>
    <span class="count-badge">${byStyle[st].length} characters</span>
  </div>
  <div class="avatar-grid">
${cards}
  </div>
</div>`;
  }).join('\n');

  const statsHTML = [
    `<div class="stat"><div class="stat-num">${totalCount}</div><div class="stat-label">Total Characters</div></div>`,
    `<div class="stat"><div class="stat-num">${fullCount}</div><div class="stat-label">All 5 Styles</div></div>`,
    ...stats.map(s => `<div class="stat"><div class="stat-num" style="color:${STYLE_META[s.style].color}">${s.count}</div><div class="stat-label">${STYLE_META[s.style].label}</div></div>`),
  ].join('\n');

  const heroSection = (hero && heroStyles) ? `
<div class="hero-section">
  <p class="hero-name">Same character in all 5 styles — <strong>${hero.name}</strong></p>
  <p class="section-label">Style Comparison</p>
  <div class="hero-row">${heroRowHTML}</div>
</div>` : '';

  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Avatar Gallery — GameMaster Database</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#080810;--surface:#11111e;--surface2:#161625;--border:rgba(255,255,255,0.07);--text:#e8e8f0;--muted:#6b6b8a}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--text);font-family:'Inter',sans-serif;min-height:100vh;overflow-x:hidden}
body::before{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");pointer-events:none;z-index:0}

header{position:relative;z-index:1;text-align:center;padding:60px 24px 32px}
.eyebrow{display:inline-block;font-size:11px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:#f97316;background:rgba(249,115,22,.1);border:1px solid rgba(249,115,22,.25);padding:4px 14px;border-radius:999px;margin-bottom:14px}
h1{font-family:'Cinzel',serif;font-size:clamp(22px,4vw,42px);font-weight:800;background:linear-gradient(135deg,#fff 30%,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:8px}
.subtitle{font-size:13px;color:var(--muted);font-weight:300}

.stats{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;padding:0 24px 28px;position:relative;z-index:1}
.stat{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px 18px;text-align:center;min-width:90px}
.stat-num{font-size:21px;font-weight:700;font-family:'Cinzel',serif}
.stat-label{font-size:10px;color:var(--muted);letter-spacing:.08em;text-transform:uppercase;margin-top:2px}

.hero-section{max-width:960px;margin:0 auto;padding:0 24px 36px;position:relative;z-index:1}
.hero-name{font-size:12px;color:var(--muted);margin-bottom:12px;font-style:italic}
.hero-name strong{color:var(--text);font-style:normal}
.section-label{font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:var(--muted);font-weight:600;margin-bottom:12px;display:flex;align-items:center;gap:10px}
.section-label::after{content:'';flex:1;height:1px;background:var(--border)}
.hero-row{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}
@media(max-width:640px){.hero-row{grid-template-columns:repeat(3,1fr)}}
.hero-card{border-radius:10px;overflow:hidden;border:2px solid transparent;background:var(--surface2);cursor:pointer;transition:all .2s}
.hero-card:hover,.hero-card.active{border-color:rgba(255,255,255,.25);transform:translateY(-2px)}
.hero-card img{width:100%;aspect-ratio:1;object-fit:cover;display:block}
.hero-card-label{padding:7px 8px;font-size:10px;font-weight:600;display:flex;align-items:center;gap:5px;color:var(--muted)}
.dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}

.tabs-wrapper{display:flex;justify-content:center;gap:8px;padding:0 24px 28px;flex-wrap:wrap;position:relative;z-index:1}
.tab{display:flex;align-items:center;gap:7px;padding:7px 16px;border-radius:999px;border:1px solid var(--border);background:transparent;color:var(--muted);font-family:'Inter',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:all .2s;white-space:nowrap}
.tab:hover{border-color:rgba(255,255,255,.15);color:var(--text)}
.tab.active{color:#000;font-weight:600}
.tab[data-style="toon3d"].active{background:#ff7eb3;border-color:#ff7eb3}
.tab[data-style="semi-realistic"].active{background:#c8a86b;border-color:#c8a86b}
.tab[data-style="anime"].active{background:#e879f9;border-color:#e879f9}
.tab[data-style="painted"].active{background:#84cc16;border-color:#84cc16}
.tab[data-style="pixel"].active{background:#38bdf8;border-color:#38bdf8}
.tab[data-style="cyberpunk"].active{background:#00ffaa;border-color:#00ffaa}
.tab-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.tab[data-style="toon3d"] .tab-dot{background:#ff7eb3}
.tab[data-style="semi-realistic"] .tab-dot{background:#c8a86b}
.tab[data-style="anime"] .tab-dot{background:#e879f9}
.tab[data-style="painted"] .tab-dot{background:#84cc16}
.tab[data-style="pixel"] .tab-dot{background:#38bdf8}
.tab[data-style="cyberpunk"] .tab-dot{background:#00ffaa}
.tab.active .tab-dot{background:#000}

.gallery{max-width:1280px;margin:0 auto;padding:0 24px 80px;position:relative;z-index:1}
.style-panel{display:none;animation:fadeIn .3s ease}
.style-panel.active{display:block}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.panel-header{display:flex;align-items:center;gap:12px;margin-bottom:20px}
.style-badge{padding:5px 14px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
.count-badge{font-size:12px;color:var(--muted)}

.avatar-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:14px}
@media(max-width:500px){.avatar-grid{grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:10px}}
.avatar-card{background:var(--surface2);border-radius:12px;overflow:hidden;border:1px solid var(--border);cursor:pointer;transition:all .25s}
.avatar-card:hover{border-color:rgba(255,255,255,.2);transform:translateY(-3px);box-shadow:0 12px 32px rgba(0,0,0,.4)}
.avatar-img-wrap{position:relative;aspect-ratio:1;overflow:hidden}
.avatar-img-wrap img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .35s}
.avatar-card:hover .avatar-img-wrap img{transform:scale(1.06)}
.avatar-overlay{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,.85));padding:8px 6px 6px;opacity:0;transition:opacity .25s}
.avatar-card:hover .avatar-overlay{opacity:1}
.mini-styles{display:flex;gap:4px;justify-content:center;flex-wrap:wrap}
.mini-style{width:24px;height:24px;border-radius:4px;object-fit:cover;border:1px solid rgba(255,255,255,.2)}
.avatar-name{font-size:11px;font-weight:600;padding:7px 8px 2px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.avatar-gender{font-size:10px;color:var(--muted);padding:0 8px 7px;text-transform:capitalize}

/* Modal */
.modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:100;display:none;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(10px)}
.modal-backdrop.open{display:flex}
.modal-wrapper{position:relative}
.modal{background:var(--surface);border:1px solid rgba(255,255,255,.1);border-radius:20px;max-width:640px;width:100%;overflow:hidden;animation:modalIn .22s ease}
@keyframes modalIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
.modal-main-img-wrap{position:relative}
.modal-main-img{width:100%;display:block;max-height:320px;object-fit:cover}
.modal-body{padding:20px 24px 24px}
.modal-name{font-family:'Cinzel',serif;font-size:20px;font-weight:800;margin-bottom:3px}
.modal-gender{font-size:11px;color:var(--muted);margin-bottom:18px;text-transform:capitalize}
.modal-styles-label{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);font-weight:600;margin-bottom:10px}
.modal-styles{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
.modal-style-btn{border-radius:8px;overflow:hidden;border:2px solid transparent;cursor:pointer;transition:all .2s;background:var(--surface2);padding:0}
.modal-style-btn:hover{border-color:rgba(255,255,255,.2)}
.modal-style-btn.active{border-color:rgba(255,255,255,.45)}
.modal-style-btn img{width:100%;aspect-ratio:1;object-fit:cover;display:block}
.modal-style-name{font-size:9px;color:var(--muted);text-align:center;padding:3px 2px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.modal-close{position:absolute;top:12px;right:12px;width:30px;height:30px;border-radius:50%;background:rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.15);color:#fff;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .2s;z-index:10}
.modal-close:hover{background:rgba(255,255,255,.15)}

footer{position:relative;z-index:1;text-align:center;padding:18px;border-top:1px solid var(--border);color:var(--muted);font-size:11px}
footer strong{color:var(--text)}
</style>
</head>
<body>

<header>
  <div class="eyebrow">Live Database · Supabase</div>
  <h1>Character Avatar Gallery</h1>
  <p class="subtitle">All AI system characters · 5 art style packs · Click any avatar for all styles</p>
</header>

<div class="stats">
${statsHTML}
</div>

${heroSection}

<div class="tabs-wrapper">
${tabsHTML}
</div>

<div class="gallery">
${panelsHTML}
</div>

<!-- Modal -->
<div class="modal-backdrop" id="modal-backdrop" onclick="closeModal(event)">
  <div class="modal-wrapper">
    <button class="modal-close" onclick="closeModalDirect()">✕</button>
    <div class="modal" id="modal">
      <div class="modal-main-img-wrap">
        <img id="modal-img" src="" alt="" class="modal-main-img">
      </div>
      <div class="modal-body">
        <div id="modal-name" class="modal-name"></div>
        <div id="modal-gender" class="modal-gender"></div>
        <div class="modal-styles-label">All Styles</div>
        <div class="modal-styles" id="modal-styles"></div>
      </div>
    </div>
  </div>
</div>

<footer>
  <strong>GameMaster</strong> &nbsp;·&nbsp; Avatar Gallery &nbsp;·&nbsp; Live from Supabase &nbsp;·&nbsp; Generated ${dateStr}
</footer>

<script>
const STYLES = ['toon3d','semi-realistic','anime','painted','pixel','cyberpunk'];
const STYLE_LABELS = {'toon3d':'3D Animated','semi-realistic':'Semi-Realistic','anime':'Anime','painted':'Painted','pixel':'Pixel','cyberpunk':'Cyberpunk'};
let currentChar = null;
let currentStyle = 'toon3d';

function switchStyle(style) {
  currentStyle = style;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.style === style));
  document.querySelectorAll('.style-panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + style));
  document.querySelectorAll('.hero-card').forEach(c => c.classList.toggle('active', c.dataset.style === style));
}

function openModal(encoded) {
  const c = JSON.parse(decodeURIComponent(encoded));
  currentChar = c;
  document.getElementById('modal-name').textContent = c.name;
  document.getElementById('modal-gender').textContent = c.gender || '';
  document.getElementById('modal-img').src = c.styles[currentStyle] || c.url;

  const stylesEl = document.getElementById('modal-styles');
  stylesEl.innerHTML = STYLES.map(st => {
    const url = c.styles[st];
    if (!url) return '<div></div>';
    const active = st === currentStyle ? ' active' : '';
    return '<button class="modal-style-btn' + active + '" onclick="switchModalStyle(\\'' + st + '\\')">'
      + '<img src="' + url + '" alt="' + STYLE_LABELS[st] + '" loading="lazy">'
      + '<div class="modal-style-name">' + STYLE_LABELS[st] + '</div>'
      + '</button>';
  }).join('');

  document.getElementById('modal-backdrop').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function switchModalStyle(style) {
  if (!currentChar) return;
  const url = currentChar.styles[style];
  if (!url) return;
  document.getElementById('modal-img').src = url;
  document.querySelectorAll('.modal-style-btn').forEach((b, i) => {
    b.classList.toggle('active', STYLES[i] === style);
  });
}

function closeModal(e) {
  if (e.target === document.getElementById('modal-backdrop')) closeModalDirect();
}
function closeModalDirect() {
  document.getElementById('modal-backdrop').classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModalDirect(); return; }
  if (document.getElementById('modal-backdrop').classList.contains('open')) return;
  const i = STYLES.indexOf(currentStyle);
  if (e.key === 'ArrowRight' && i < STYLES.length - 1) switchStyle(STYLES[i + 1]);
  if (e.key === 'ArrowLeft' && i > 0) switchStyle(STYLES[i - 1]);
});
</script>
</body>
</html>`;
}

run().catch(e => { console.error(e); process.exit(1); });
