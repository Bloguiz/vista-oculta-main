// Vista Oculta — lógica pública
const POSTS_KEY = 'vista-oculta:posts';
const SITE_KEY  = 'vista-oculta:site';

async function fetchJson(url){
  try {
    const r = await fetch(url, { cache: 'no-cache' });
    if (r.ok) return await r.json();
  } catch(e){}
  return null;
}

async function loadSite(){
  const remote = await fetchJson('site.json');
  try {
    const local = JSON.parse(localStorage.getItem(SITE_KEY) || 'null');
    if (local && typeof local === 'object' && local.brand) return local;
  } catch(e){}
  return remote || {};
}

async function loadPosts(){
  const remote = await fetchJson('posts.json');
  if (Array.isArray(remote) && remote.length) return remote;
  try {
    const local = JSON.parse(localStorage.getItem(POSTS_KEY) || '[]');
    if (Array.isArray(local) && local.length) return local;
  } catch(e){}
  return Array.isArray(remote) ? remote : [];
}

const sortByDate = a => a.slice().sort((x,y)=> new Date(y.date) - new Date(x.date));

function excerpt(html, len=170){
  const t = document.createElement('div');
  t.innerHTML = html;
  const txt = (t.textContent || '').trim();
  return txt.length > len ? txt.slice(0,len).trim()+'…' : txt;
}
function fmtDate(iso){
  return new Date(iso).toLocaleDateString('pt-PT',{day:'2-digit',month:'long',year:'numeric'});
}
function postUrl(id){ return `post.html?id=${encodeURIComponent(id)}`; }

function esc(s){
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* ===== Aplicar site.json ao DOM ===== */
function applySite(site){
  if (!site || !site.brand) return;

  // Head
  if (site.seo) {
    if (site.seo.title) document.title = site.seo.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && site.seo.description) metaDesc.setAttribute('content', site.seo.description);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle && site.seo.title) ogTitle.setAttribute('content', site.seo.title);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc && site.seo.description) ogDesc.setAttribute('content', site.seo.description);
    const ogImg = document.querySelector('meta[property="og:image"]');
    if (ogImg && site.seo.ogImage) ogImg.setAttribute('content', site.seo.ogImage);
  }
  if (site.brand.favicon) {
    let link = document.querySelector('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = site.brand.favicon;
  }

  // Logos
  const logoImgs = document.querySelectorAll('.logo-img');
  if (site.brand.logo) logoImgs.forEach(img => { img.src = site.brand.logo; img.alt = site.brand.name || 'Logo'; });
  const footerLogo = document.querySelector('.footer-logo-img');
  if (footerLogo && site.brand.logoIcon) footerLogo.src = site.brand.logoIcon;

  // Hero
  const set = (id, val) => { const el = document.getElementById(id); if (el && val != null) el.innerHTML = val; };
  set('heroTagline', site.hero?.tagline);
  set('heroTitle',   site.hero?.title);
  set('heroDesc',    site.hero?.description);
  const ctaP = document.getElementById('heroCtaPrimary');
  if (ctaP && site.hero?.ctaPrimary) { ctaP.textContent = site.hero.ctaPrimary.label; ctaP.href = site.hero.ctaPrimary.href; }
  const ctaS = document.getElementById('heroCtaSecondary');
  if (ctaS && site.hero?.ctaSecondary) { ctaS.textContent = site.hero.ctaSecondary.label; ctaS.href = site.hero.ctaSecondary.href; }

  // Posts section
  set('postsLabel',    site.postsSection?.label);
  set('postsTitle',    site.postsSection?.title);
  set('postsSubtitle', site.postsSection?.subtitle);

  // Sobre
  set('aboutLabel', site.about?.label);
  set('aboutTitle', site.about?.title);
  const aboutP = document.getElementById('aboutParagraphs');
  if (aboutP && Array.isArray(site.about?.paragraphs)) {
    aboutP.innerHTML = site.about.paragraphs.map(p => `<p class="text-body featured-description">${p}</p>`).join('');
  }
  set('aboutBadge', site.about?.badge);
  const aboutImg = document.getElementById('aboutImage');
  if (aboutImg && site.about?.image) aboutImg.src = site.about.image;
  const aboutCta = document.getElementById('aboutCta');
  if (aboutCta && site.about?.ctaLabel) aboutCta.textContent = site.about.ctaLabel;

  // Contacto
  set('contactLabel', site.contact?.label);
  set('contactTitle', site.contact?.title);
  set('contactDesc',  site.contact?.description);
  const contactEmail = document.getElementById('contactEmail');
  if (contactEmail && site.contact?.email) {
    contactEmail.textContent = site.contact.email;
    contactEmail.href = 'mailto:' + site.contact.email;
  }

  // Footer
  const fTag = document.getElementById('footerTagline');
  if (fTag && site.footer?.tagline) fTag.textContent = site.footer.tagline;
  const fMail = document.getElementById('footerEmail');
  if (fMail && site.footer?.email) { fMail.textContent = site.footer.email; fMail.href = 'mailto:' + site.footer.email; }
  const fCopy = document.getElementById('footerCopyright');
  if (fCopy && site.footer?.copyright) fCopy.textContent = site.footer.copyright;
  const fCred = document.getElementById('footerCredits');
  if (fCred && site.footer?.credits) fCred.textContent = site.footer.credits;
  const fSoc = document.getElementById('footerSocial');
  if (fSoc && Array.isArray(site.footer?.social)) {
    fSoc.innerHTML = site.footer.social.map(s =>
      `<a href="${esc(s.href)}" target="_blank" rel="noopener">${esc(s.label)}</a>`
    ).join('');
  }
}

/* ===== Home ===== */
async function renderHome(){
  const grid = document.getElementById('postsGrid');
  if (!grid) return;

  const [site, rawPosts] = await Promise.all([loadSite(), loadPosts()]);
  applySite(site);

  const posts = sortByDate(rawPosts);
  const empty = document.getElementById('emptyState');
  const heroSlides = document.getElementById('heroSlides');
  const featured = document.getElementById('featured');

  if (!posts.length){
    if (empty) empty.style.display = 'block';
    return;
  }

  // Hero slides
  const withImg = posts.filter(p => p.image);
  if (heroSlides){
    const fallback = site.hero?.fallbackImage;
    let hero = withImg.slice(0,3);
    if (!hero.length && fallback){
      hero = [{ title: site.brand?.name || 'Vista Oculta', date: new Date().toISOString(), image: fallback }];
    }
    if (hero.length){
      heroSlides.innerHTML = hero.map((p,i)=>`
        <div class="hero-slide ${i===0?'active':''}" data-title="${esc(p.title)}" data-price="${esc(fmtDate(p.date))}">
          <img src="${esc(p.image)}" alt="${esc(p.title)}">
        </div>`).join('');
      iniciarSlideshow();
    }
  }

  // Featured
  if (featured && posts[0]){
    const p = posts[0];
    const label = site.featured?.label || site.postsSection?.label || 'Em destaque';
    const badge = site.featured?.badge || 'Último post';
    featured.innerHTML = `
      <div class="container">
        <div class="featured-grid">
          ${p.image ? `
          <div class="featured-image-wrapper">
            <div class="featured-image"><img src="${esc(p.image)}" alt="${esc(p.title)}"></div>
            <div class="featured-badge">${esc(badge)}</div>
          </div>` : ''}
          <div class="featured-content">
            <p class="text-label featured-label">${esc(label)}</p>
            <h2 class="heading-display featured-title">${esc(p.title)}</h2>
            <p class="text-body featured-description">${excerpt(p.body, 260)}</p>
            <a href="${postUrl(p.id)}" class="btn-primary">Ler artigo</a>
          </div>
        </div>
      </div>`;
  }

  // Grid
  const rest = posts.slice(1);
  grid.innerHTML = rest.map(p => `
    <article class="post-card">
      <a href="${postUrl(p.id)}" class="post-card-image">
        ${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.title)}">` : ''}
      </a>
      <div class="post-card-body">
        <div class="post-card-meta">${fmtDate(p.date)}</div>
        <h3><a href="${postUrl(p.id)}">${esc(p.title)}</a></h3>
        <p>${excerpt(p.body)}</p>
        <a class="read-more" href="${postUrl(p.id)}">Ler mais</a>
      </div>
    </article>`).join('');
}

function iniciarSlideshow(){
  const slides = document.querySelectorAll('.hero-slide');
  const tEl = document.getElementById('heroTitleOverlay');
  const pEl = document.getElementById('heroPriceOverlay');
  if (slides.length < 2) return;

  let cur = 0;
  setInterval(()=>{
    slides[cur].classList.remove('active');
    cur = (cur+1) % slides.length;
    if (tEl && pEl){
      tEl.style.opacity = 0;
      pEl.style.opacity = 0;
      setTimeout(()=>{
        tEl.textContent = slides[cur].dataset.title;
        pEl.textContent = slides[cur].dataset.price;
        tEl.style.opacity = 1;
        pEl.style.opacity = 1;
      }, 400);
    }
    slides[cur].classList.add('active');
  }, 5000);
}

/* ===== Post individual ===== */
async function renderPost(){
  const wrap = document.getElementById('postView');
  if (!wrap) return;

  const [site, posts] = await Promise.all([loadSite(), loadPosts()]);
  applySite(site);

  const id = new URLSearchParams(location.search).get('id');
  const post = posts.find(p => p.id === id);

  if (!post){
    wrap.innerHTML = `
      <div class="container">
        <div class="empty-state" style="padding-top:calc(var(--header-h) + 4rem)">
          <h2>Post não encontrado</h2>
          <p>O artigo que procuras não existe (ou foi removido).</p>
          <p style="margin-top:24px"><a href="index.html" class="btn-primary">Voltar ao início</a></p>
        </div>
      </div>`;
    return;
  }

  document.title = post.title + ' — ' + (site.brand?.name || 'Vista Oculta');
  const label = site.brand?.name || 'Vista Oculta';

  wrap.innerHTML = `
    <header class="post-hero">
      <div class="container container--narrow">
        <p class="text-label">${esc(label)}</p>
        <h1>${esc(post.title)}</h1>
        <p class="post-meta">${fmtDate(post.date)}</p>
      </div>
    </header>
    ${post.image ? `<div class="post-hero-image"><img src="${esc(post.image)}" alt="${esc(post.title)}"></div>` : ''}
    <article class="container container--narrow post-body">${post.body}</article>
    <div class="container container--narrow post-footer-nav">
      <a href="index.html" class="btn-text">Voltar à página inicial</a>
    </div>`;
}

/* ===== Header scroll ===== */
function initHeader(){
  const h = document.querySelector('.site-header');
  if (!h) return;
  const onScroll = ()=>{
    if (window.scrollY > 40) h.classList.add('scrolled');
    else h.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll);
  onScroll();
}

/* ===== Mobile nav ===== */
function initMobileNav(){
  const toggle  = document.getElementById('menuToggle');
  const nav     = document.getElementById('mobileNav');
  const overlay = document.getElementById('mobileOverlay');
  const close   = document.getElementById('mobileNavClose');
  if (!toggle || !nav) return;

  const open = ()=>{ nav.classList.add('active'); overlay.classList.add('active'); document.body.style.overflow='hidden'; };
  const shut = ()=>{ nav.classList.remove('active'); overlay.classList.remove('active'); document.body.style.overflow=''; };

  toggle.addEventListener('click', open);
  close?.addEventListener('click', shut);
  overlay?.addEventListener('click', shut);
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', shut));
}

document.addEventListener('DOMContentLoaded', ()=>{
  initHeader();
  initMobileNav();
  renderHome();
  renderPost();
});