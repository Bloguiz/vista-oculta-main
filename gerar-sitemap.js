// Vista Oculta — gera sitemap.xml a partir do posts.json
// Corre automaticamente no deploy do Netlify (ver netlify.toml).
// Para correr à mão:  node gerar-sitemap.js
const fs = require('fs');

const BASE = (process.env.SITE_URL || 'https://vioculta.netlify.app').replace(/\/+$/, '');
const hoje = new Date().toISOString().slice(0, 10);

let posts = [];
try {
  posts = JSON.parse(fs.readFileSync('posts.json', 'utf8'));
  if (!Array.isArray(posts)) posts = [];
} catch (e) {
  console.warn('Aviso: não consegui ler posts.json (' + e.message + '). O sitemap terá só as páginas fixas.');
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const dataValida = d => /^\d{4}-\d{2}-\d{2}/.test(d || '') ? String(d).slice(0, 10) : hoje;

const urls = [
  { loc: BASE + '/',                  lastmod: hoje, priority: '1.0' },
  { loc: BASE + '/sobre.html',        lastmod: hoje, priority: '0.4' },
  { loc: BASE + '/contacto.html',     lastmod: hoje, priority: '0.4' },
  { loc: BASE + '/privacidade.html',  lastmod: hoje, priority: '0.3' },
  { loc: BASE + '/aviso-legal.html',  lastmod: hoje, priority: '0.3' },
];

posts
  .filter(p => p && p.id)
  .sort((a, b) => new Date(b.date) - new Date(a.date))
  .forEach(p => urls.push({
    loc: BASE + '/post.html?id=' + encodeURIComponent(p.id),
    lastmod: dataValida(p.date),
    priority: '0.8',
  }));

const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map(u =>
    '  <url>\n' +
    '    <loc>' + esc(u.loc) + '</loc>\n' +
    '    <lastmod>' + u.lastmod + '</lastmod>\n' +
    '    <priority>' + u.priority + '</priority>\n' +
    '  </url>').join('\n') +
  '\n</urlset>\n';

fs.writeFileSync('sitemap.xml', xml);
console.log('sitemap.xml gerado com ' + urls.length + ' URLs (' + posts.length + ' posts).');
