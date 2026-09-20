// Vista Oculta — admin com backend GitHub
// Todo o conteúdo vive no repositório. Sem localStorage para conteúdo.

const LS_USER   = 'vista-oculta:gh-user';
const LS_REPO   = 'vista-oculta:gh-repo';
const LS_BRANCH = 'vista-oculta:gh-branch';
const SS_TOKEN  = 'vista-oculta:gh-token';
const LS_FOLDER = 'vista-oculta:gh-folder';

const state = {
  user: '', repo: '', branch: 'main', token: '',
  posts: [], site: {}, postsSha: null, siteSha: null,
  folder: 'imagens',
};

const $  = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

/* ============= GitHub API ============= */
async function ghApi(path, opts = {}) {
  const headers = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(opts.headers || {}),
  };
  if (state.token) headers['Authorization'] = 'Bearer ' + state.token;

  const r = await fetch('https://api.github.com' + path, { ...opts, headers });

  if (!r.ok) {
    let msg = `${r.status} ${r.statusText}`;
    try { const j = await r.json(); if (j.message) msg = j.message; } catch(e){}
    const err = new Error(msg);
    err.status = r.status;
    throw err;
  }
  if (r.status === 204) return null;
  return r.json();
}

async function ghGetFile(path) {
  try {
    const data = await ghApi(`/repos/${state.user}/${state.repo}/contents/${path}?ref=${state.branch}`);
    return { content: decodeBase64Utf8(data.content), sha: data.sha };
  } catch (err) {
    if (err.status === 404) return { content: null, sha: null };
    throw err;
  }
}

async function ghPutFile(path, content, sha, message) {
  const body = {
    message: message || `admin: atualização ${new Date().toLocaleString('pt-PT')}`,
    content: encodeBase64Utf8(content),
    branch: state.branch,
  };
  if (sha) body.sha = sha;
  return ghApi(`/repos/${state.user}/${state.repo}/contents/${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function ghUploadBinary(path, file) {
  const buf  = await file.arrayBuffer();
  const b64  = arrayBufferToBase64(buf);
  let sha = null;
  try {
    const ex = await ghApi(`/repos/${state.user}/${state.repo}/contents/${path}?ref=${state.branch}`);
    sha = ex.sha;
  } catch(e){ /* não existe, tudo bem */ }
  const body = {
    message: `admin: upload ${path}`,
    content: b64,
    branch: state.branch,
  };
  if (sha) body.sha = sha;
  return ghApi(`/repos/${state.user}/${state.repo}/contents/${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/* ============= base64 UTF-8 ============= */
function encodeBase64Utf8(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  const CH = 0x8000;
  for (let i = 0; i < bytes.length; i += CH)
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
  return btoa(bin);
}
function decodeBase64Utf8(b64) {
  const clean = b64.replace(/\s/g, '');
  const bin = atob(clean);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder('utf-8').decode(bytes);
}
function arrayBufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = '';
  const CH = 0x8000;
  for (let i = 0; i < bytes.length; i += CH)
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
  return btoa(bin);
}

/* ============= Login / Logout ============= */
function showAuthError(msg){ const el = $('#authError'); if (el) el.textContent = msg; }

function fillAuthForm(){
  $('#gh-user').value   = localStorage.getItem(LS_USER)   || '';
  $('#gh-repo').value   = localStorage.getItem(LS_REPO)   || '';
  $('#gh-branch').value = localStorage.getItem(LS_BRANCH) || 'main';
  const t = sessionStorage.getItem(SS_TOKEN);
  if (t) $('#gh-token').value = t;
}

async function doLogin(){
  const user   = $('#gh-user').value.trim();
  const repo   = $('#gh-repo').value.trim();
  const branch = ($('#gh-branch').value.trim() || 'main');
  const token  = $('#gh-token').value.trim();

  if (!user || !repo || !token)
    return showAuthError('Preenche utilizador, repositório e token.');

  state.user = user; state.repo = repo; state.branch = branch; state.token = token;

  $('#authBtn').disabled = true;
  $('#authBtn').textContent = 'A verificar…';
  showAuthError('');

  try {
    await ghApi('/user');
    const r = await ghApi(`/repos/${user}/${repo}`);
    if (!r.permissions || !r.permissions.push) {
      throw new Error('O token não tem permissão de escrita neste repositório.');
    }
  } catch (err) {
    $('#authBtn').disabled = false;
    $('#authBtn').textContent = 'Entrar';
    return showAuthError('Falha: ' + err.message);
  }

  localStorage.setItem(LS_USER, user);
  localStorage.setItem(LS_REPO, repo);
  localStorage.setItem(LS_BRANCH, branch);
  sessionStorage.setItem(SS_TOKEN, token);

  $('#authGate').classList.add('hidden');
  await boot();
}

function doLogout(){
  if (!confirm('Sair? O token será removido desta sessão.')) return;
  sessionStorage.removeItem(SS_TOKEN);
  location.reload();
}

/* ============= Load / Save ============= */
async function loadAll(){
  const [posts, site] = await Promise.all([
    ghGetFile('posts.json'),
    ghGetFile('site.json'),
  ]);
  try { state.posts = posts.content ? JSON.parse(posts.content) : []; } catch(e){ state.posts = []; }
  try { state.site  = site.content  ? JSON.parse(site.content)  : {}; } catch(e){ state.site  = {}; }
  state.postsSha = posts.sha;
  state.siteSha  = site.sha;
}

async function savePostsToGitHub(msg){
  const content = JSON.stringify(state.posts, null, 2);
  const res = await ghPutFile('posts.json', content, state.postsSha, msg);
  state.postsSha = res.content.sha;
}

async function saveSiteToGitHub(msg){
  const content = JSON.stringify(state.site, null, 2);
  const res = await ghPutFile('site.json', content, state.siteSha, msg);
  state.siteSha = res.content.sha;
}

/* ============= Tabs ============= */
function initTabs(){
  $$('.admin-tab').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      $$('.admin-tab').forEach(b => b.classList.remove('active'));
      $$('.admin-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      $('#panel-' + btn.dataset.tab).classList.add('active');
      if (btn.dataset.tab === 'list') renderList();
      if (btn.dataset.tab === 'site') loadSiteForm();
      if (btn.dataset.tab === 'data'){ renderPreview(); renderSitePreview(); }
    });
  });
}

/* ============= Editor ============= */
function initEditor(){
  $$('#editor-toolbar button[data-cmd]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.execCommand(btn.dataset.cmd, false, btn.dataset.val || null);
      $('#editor').focus();
    });
  });

  $('#btn-link')?.addEventListener('click', ()=>{
    const url = prompt('URL:');
    if (url) document.execCommand('createLink', false, url);
  });

  $('#btn-github-img')?.addEventListener('click', ()=> $('#inline-image-file').click());
  $('#inline-image-file')?.addEventListener('change', async e=>{
    const f = e.target.files[0]; if (!f) return;
    const name = prompt('Nome do ficheiro no GitHub:', sanitizeName(f.name)) || sanitizeName(f.name);
    try {
      toast('A enviar imagem…');
      const path = `${state.folder}/${name}`;
      await ghUploadBinary(path, f);
      const url = `https://cdn.jsdelivr.net/gh/${state.user}/${state.repo}@${state.branch}/${path}`;
      document.execCommand('insertHTML', false, `<img src="${url}" alt=""><p><br></p>`);
      $('#editor').focus();
      toast('Imagem enviada.');
    } catch(err){
      alert('Falha no upload: ' + err.message);
    }
    e.target.value = '';
  });

  $('#btn-github-destaque')?.addEventListener('click', ()=> $('#post-image-file').click());
  $('#post-image-file')?.addEventListener('change', async e=>{
    const f = e.target.files[0]; if (!f) return;
    const name = prompt('Nome do ficheiro no GitHub:', sanitizeName(f.name)) || sanitizeName(f.name);
    try {
      toast('A enviar imagem…');
      const path = `${state.folder}/${name}`;
      await ghUploadBinary(path, f);
      const url = `https://cdn.jsdelivr.net/gh/${state.user}/${state.repo}@${state.branch}/${path}`;
      $('#post-image').value = url;
      toast('Imagem enviada.');
    } catch(err){
      alert('Falha no upload: ' + err.message);
    }
    e.target.value = '';
  });

  $('#btn-video')?.addEventListener('click', ()=>{
    const url = prompt('URL YouTube ou Vimeo:');
    if (!url) return;
    let embed = url;
    const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
    if (yt) embed = `https://www.youtube.com/embed/${yt[1]}`;
    const vm = url.match(/vimeo\.com\/(\d+)/);
    if (vm) embed = `https://player.vimeo.com/video/${vm[1]}`;
    document.execCommand('insertHTML', false, `<iframe src="${embed}" allowfullscreen loading="lazy"></iframe><p><br></p>`);
  });
}

function sanitizeName(n){
  return n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9.\-_]+/g,'-').replace(/^-+|-+$/g,'');
}

/* ============= Post form ============= */
function initPostForm(){
  $('#btn-save')?.addEventListener('click', async ()=>{
    const title = $('#post-title').value.trim();
    const date  = $('#post-date').value || new Date().toISOString().slice(0,10);
    const image = $('#post-image').value.trim();
    const body  = $('#editor').innerHTML.trim();

    if (!title) return alert('Título obrigatório.');
    if (!body)  return alert('Conteúdo obrigatório.');

    const editId = $('#btn-save').dataset.editId;
    if (editId){
      const i = state.posts.findIndex(p => p.id === editId);
      if (i >= 0) state.posts[i] = { ...state.posts[i], title, date, image, body };
    } else {
      state.posts.push({
        id: uid(), title, date, image, body,
        created: new Date().toISOString()
      });
    }

    $('#btn-save').disabled = true;
    $('#btn-save').textContent = 'A publicar…';
    try {
      await savePostsToGitHub(`admin: ${editId ? 'editar' : 'novo post'} "${title}"`);
      clearForm();
      renderList(); renderPreview();
      toast('Publicado no GitHub.');
    } catch(err){
      alert('Falha ao publicar: ' + err.message);
    } finally {
      $('#btn-save').disabled = false;
      $('#btn-save').textContent = editId ? 'Atualizar post' : 'Guardar post';
    }
  });

  $('#btn-clear')?.addEventListener('click', clearForm);
}

function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }

function clearForm(){
  $('#post-title').value = '';
  $('#post-date').value  = new Date().toISOString().slice(0,10);
  $('#post-image').value = '';
  $('#editor').innerHTML = '';
  $('#btn-save').textContent = 'Guardar post';
  delete $('#btn-save').dataset.editId;
}

/* ============= Lista ============= */
function renderList(){
  const list = $('#post-list'); if (!list) return;
  const posts = state.posts.slice().sort((a,b)=> new Date(b.date) - new Date(a.date));
  if (!posts.length){
    list.innerHTML = '<div class="empty-state">Sem posts ainda.</div>';
    return;
  }
  list.innerHTML = posts.map(p=>`
    <div class="post-row">
      <div>
        <h4>${escapeHtml(p.title)}</h4>
        <div class="meta">${new Date(p.date).toLocaleDateString('pt-PT')} · <code style="font-size:.7em">${escapeHtml(p.id)}</code></div>
      </div>
      <div class="actions">
        <button class="btn btn-secondary btn-sm" data-edit="${p.id}">Editar</button>
        <button class="btn btn-danger btn-sm" data-del="${p.id}">Remover</button>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('[data-edit]').forEach(b=>{
    b.addEventListener('click', ()=> editPost(b.dataset.edit));
  });
  list.querySelectorAll('[data-del]').forEach(b=>{
    b.addEventListener('click', async ()=>{
      const p = state.posts.find(x => x.id === b.dataset.del);
      if (!p) return;
      if (!confirm(`Remover "${p.title}"?`)) return;
      state.posts = state.posts.filter(x => x.id !== b.dataset.del);
      try {
        await savePostsToGitHub(`admin: remover "${p.title}"`);
        renderList(); renderPreview();
        toast('Removido.');
      } catch(err){
        alert('Falha: ' + err.message);
      }
    });
  });
}

function escapeHtml(s){
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function editPost(id){
  const p = state.posts.find(x => x.id === id); if (!p) return;
  $('#post-title').value = p.title;
  $('#post-date').value  = p.date;
  $('#post-image').value = p.image || '';
  $('#editor').innerHTML = p.body;
  $('#btn-save').textContent = 'Atualizar post';
  $('#btn-save').dataset.editId = id;
  $$('.admin-tab').forEach(b => b.classList.remove('active'));
  $$('.admin-panel').forEach(x => x.classList.remove('active'));
  document.querySelector('.admin-tab[data-tab="new"]').classList.add('active');
  $('#panel-new').classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ============= Site form (site.json) ============= */
const V = id => ($(id) ? $(id).value : '');

function loadSiteForm(){
  const s = state.site || {};
  const b = s.brand || {};
  $('#brand-name').value = b.name || '';
  $('#brand-logo').value = b.logo || '';
  $('#brand-logoIcon').value = b.logoIcon || '';
  $('#brand-favicon').value = b.favicon || '';

  const h = s.hero || {};
  $('#hero-tagline').value = h.tagline || '';
  $('#hero-title').value = h.title || '';
  $('#hero-description').value = h.description || '';
  $('#hero-cta1-label').value = h.ctaPrimary?.label || '';
  $('#hero-cta1-href').value  = h.ctaPrimary?.href || '';
  $('#hero-cta2-label').value = h.ctaSecondary?.label || '';
  $('#hero-cta2-href').value  = h.ctaSecondary?.href || '';
  $('#hero-fallbackImage').value = h.fallbackImage || '';

  const p = s.postsSection || {};
  $('#posts-label').value = p.label || '';
  $('#posts-title').value = p.title || '';
  $('#posts-subtitle').value = p.subtitle || '';

  const a = s.about || {};
  $('#about-label').value = a.label || '';
  $('#about-title').value = a.title || '';
  $('#about-paragraphs').value = (a.paragraphs || []).join('\n');
  $('#about-badge').value = a.badge || '';
  $('#about-image').value = a.image || '';
  $('#about-ctaLabel').value = a.ctaLabel || '';

  const c = s.contact || {};
  $('#contact-label').value = c.label || '';
  $('#contact-title').value = c.title || '';
  $('#contact-description').value = c.description || '';
  $('#contact-email').value = c.email || '';

  const f = s.footer || {};
  $('#footer-tagline').value = f.tagline || '';
  $('#footer-email').value = f.email || '';
  $('#footer-copyright').value = f.copyright || '';
  $('#footer-credits').value = f.credits || '';
  $('#footer-social').value = (f.social || []).map(x => `${x.label}|${x.href}`).join('\n');

  const seo = s.seo || {};
  $('#seo-title').value = seo.title || '';
  $('#seo-description').value = seo.description || '';
  $('#seo-ogImage').value = seo.ogImage || '';
}

function collectSiteForm(){
  const social = V('#footer-social').split('\n').map(l => l.trim()).filter(Boolean).map(l => {
    const [label, href] = l.split('|').map(x => (x || '').trim());
    return { label: label || '', href: href || '#' };
  });
  return {
    brand: {
      name: V('#brand-name') || 'Vista Oculta',
      logo: V('#brand-logo'),
      logoIcon: V('#brand-logoIcon'),
      favicon: V('#brand-favicon')
    },
    hero: {
      tagline: V('#hero-tagline'),
      title: V('#hero-title'),
      description: V('#hero-description'),
      ctaPrimary: { label: V('#hero-cta1-label'), href: V('#hero-cta1-href') },
      ctaSecondary: { label: V('#hero-cta2-label'), href: V('#hero-cta2-href') },
      fallbackImage: V('#hero-fallbackImage')
    },
    postsSection: {
      label: V('#posts-label'),
      title: V('#posts-title'),
      subtitle: V('#posts-subtitle')
    },
    about: {
      label: V('#about-label'),
      title: V('#about-title'),
      paragraphs: V('#about-paragraphs').split('\n').map(s=>s.trim()).filter(Boolean),
      badge: V('#about-badge'),
      image: V('#about-image'),
      ctaLabel: V('#about-ctaLabel')
    },
    contact: {
      label: V('#contact-label'),
      title: V('#contact-title'),
      description: V('#contact-description'),
      email: V('#contact-email')
    },
    footer: {
      tagline: V('#footer-tagline'),
      email: V('#footer-email'),
      social,
      copyright: V('#footer-copyright'),
      credits: V('#footer-credits')
    },
    seo: {
      title: V('#seo-title'),
      description: V('#seo-description'),
      ogImage: V('#seo-ogImage')
    }
  };
}

function initSiteForm(){
  $('#btn-site-save')?.addEventListener('click', async ()=>{
    state.site = collectSiteForm();
    $('#btn-site-save').disabled = true;
    $('#btn-site-save').textContent = 'A publicar…';
    try {
      await saveSiteToGitHub('admin: atualizar definições do site');
      renderSitePreview();
      toast('Definições publicadas no GitHub.');
    } catch(err){
      alert('Falha: ' + err.message);
    } finally {
      $('#btn-site-save').disabled = false;
      $('#btn-site-save').textContent = 'Guardar definições';
    }
  });

  $('#btn-site-reload')?.addEventListener('click', async ()=>{
    if (!confirm('Recarregar definições a partir do GitHub? (perdes edições não guardadas)')) return;
    await loadAll();
    loadSiteForm();
    toast('Recarregado do GitHub.');
  });
}

/* ============= Dados ============= */
function renderPreview(){
  const el = $('#data-preview');
  if (el) el.value = JSON.stringify(state.posts, null, 2);
}
function renderSitePreview(){
  const el = $('#data-preview-site');
  if (el) el.value = JSON.stringify(state.site, null, 2);
}

function initData(){
  $('#btn-reload')?.addEventListener('click', async ()=>{
    if (!confirm('Recarregar posts.json e site.json do GitHub? (perdes alterações não publicadas)')) return;
    await loadAll();
    renderList(); renderPreview(); renderSitePreview(); loadSiteForm();
    toast('Recarregado do GitHub.');
  });
}

/* ============= Toast ============= */
function toast(msg){
  let el = document.getElementById('admin-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'admin-toast';
    el.style.cssText = `
      position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
      background:var(--green-dark); color:var(--cream); padding:12px 22px;
      border-radius:6px; font-family:var(--font-body); font-size:.85rem;
      letter-spacing:.05em; z-index:10000; opacity:0; transition:opacity .3s;
      box-shadow:0 10px 30px rgba(20,52,42,.25);
    `;
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  clearTimeout(el._t);
  el._t = setTimeout(()=> el.style.opacity = '0', 2600);
}

/* ============= Boot ============= */
async function boot(){
  try {
    await loadAll();
  } catch(err){
    alert('Falha a carregar do GitHub: ' + err.message);
    return;
  }
  initTabs();
  initEditor();
  initPostForm();
  initSiteForm();
  initData();
  if (!$('#post-date').value) $('#post-date').value = new Date().toISOString().slice(0,10);
  renderList(); renderPreview(); renderSitePreview(); loadSiteForm();
}

document.addEventListener('DOMContentLoaded', ()=>{
  fillAuthForm();
  $('#authBtn')?.addEventListener('click', doLogin);
  $('#gh-token')?.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  $('#logoutBtn')?.addEventListener('click', doLogout);

  if (sessionStorage.getItem(SS_TOKEN)){
    state.user   = localStorage.getItem(LS_USER)   || '';
    state.repo   = localStorage.getItem(LS_REPO)   || '';
    state.branch = localStorage.getItem(LS_BRANCH) || 'main';
    state.token  = sessionStorage.getItem(SS_TOKEN) || '';
    state.folder = localStorage.getItem(LS_FOLDER) || 'imagens';
    if (state.user && state.repo && state.token){
      $('#authGate').classList.add('hidden');
      boot();
    }
  }
});