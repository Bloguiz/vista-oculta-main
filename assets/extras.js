// Vista Oculta — extras: SEO por post, anúncios só onde há conteúdo, e-mail nas páginas estáticas.
// Carrega DEPOIS de blog.js (usa as funções loadPosts, loadSite e excerpt desse ficheiro).
(function () {
  const SITE_URL   = 'https://vioculta.netlify.app';
  const ADS_CLIENT = 'ca-pub-5206866962356060';
  const LOGO_URL   = 'https://cdn.jsdelivr.net/gh/bloguiz/vista-oculta-assets@main/logos/logo-vo-sem-texto.png';

  function setMeta(selector, create, content) {
    if (!content) return;
    let el = document.querySelector(selector);
    if (!el) { el = document.createElement('meta'); create(el); document.head.appendChild(el); }
    el.setAttribute('content', content);
  }
  const byName = n => [`meta[name="${n}"]`, el => el.setAttribute('name', n)];
  const byProp = p => [`meta[property="${p}"]`, el => el.setAttribute('property', p)];

  function setCanonical(url) {
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
    link.href = url;
  }

  // Carrega o AdSense apenas quando a página tem conteúdo real
  function loadAds() {
    if (document.getElementById('adsense-loader')) return;
    if (document.querySelector('script[src*="adsbygoogle.js"]')) return;
    const s = document.createElement('script');
    s.id = 'adsense-loader';
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADS_CLIENT;
    document.head.appendChild(s);
  }

  function initPost() {
    const view = document.getElementById('postView');
    if (!view || typeof loadPosts !== 'function') return;

    // espera que blog.js tenha desenhado a página (depois de applySite)
    const rendered = new Promise(resolve => {
      if (view.children.length) return resolve();
      const obs = new MutationObserver(() => {
        if (view.children.length) { obs.disconnect(); resolve(); }
      });
      obs.observe(view, { childList: true });
    });

    Promise.all([loadPosts(), rendered]).then(([posts]) => {
      const id = new URLSearchParams(location.search).get('id');
      const post = (posts || []).find(p => p.id === id);

      if (!post) {
        // Post inexistente: não indexar e não mostrar anúncios
        setMeta(...byName('robots'), 'noindex, nofollow');
        return;
      }

      const url  = SITE_URL + '/post.html?id=' + encodeURIComponent(post.id);
      const desc = typeof excerpt === 'function' ? excerpt(post.body, 155) : '';

      setCanonical(url);
      if (desc) setMeta(...byName('description'), desc);
      setMeta(...byProp('og:type'), 'article');
      setMeta(...byProp('og:title'), post.title);
      if (desc) setMeta(...byProp('og:description'), desc);
      setMeta(...byProp('og:url'), url);
      if (post.image) setMeta(...byProp('og:image'), post.image);

      const ld = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        datePublished: post.date,
        dateModified: post.date,
        mainEntityOfPage: url,
        author: { '@type': 'Organization', name: 'Vista Oculta' },
        publisher: { '@type': 'Organization', name: 'Vista Oculta', logo: { '@type': 'ImageObject', url: LOGO_URL } },
      };
      if (post.image) ld.image = [post.image];
      const tag = document.createElement('script');
      tag.type = 'application/ld+json';
      tag.textContent = JSON.stringify(ld);
      document.head.appendChild(tag);

      loadAds();
    }).catch(() => {});
  }

  function initStatic() {
    if (typeof loadSite !== 'function') return;
    loadSite().then(site => {
      const mail = (site && site.contact && site.contact.email) || (site && site.footer && site.footer.email);
      if (!mail) return;
      document.querySelectorAll('[data-email]').forEach(el => {
        el.textContent = mail;
        if (el.tagName === 'A') el.href = 'mailto:' + mail;
      });
    }).catch(() => {});
  }

  function start() {
    const page = document.body && document.body.dataset.page;
    if (page === 'post') initPost();
    if (page === 'static') initStatic();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
