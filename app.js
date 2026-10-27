(function(){
const T={
 pt:{nav_posts:"Posts",nav_about:"Sobre & Contacto",hero_tag:"Bundesliga · Análise · Cultura",hero_title:"O futebol <em>alemão</em>, sem ruído",
  hero_desc:"Análises, tática e histórias da Bundesliga e arredores, em português e alemão.",cta_posts:"Ver posts",cta_about:"Sobre o blog",
  latest:"Último post",read:"Ler artigo",posts_label:"Descobrir",posts_title:"Todos os posts",posts_sub:"Análises e histórias do futebol alemão",
  about_label:"Sobre o projeto",about_title:"Futebol alemão, explicado",about_text:"Um blog sobre futebol alemão: Bundesliga, 2. Bundesliga, DFB-Pokal e seleção. Escrevemos em português e em alemão e indicamos as fontes dos dados que usamos.",
  contact_label:"Contacto",contact_title:"Fala connosco",contact_text:"Sugestões, correções ou ideias para um artigo? Escreve-nos.",
  back:"Voltar à página inicial",nf_title:"Post não encontrado",nf_text:"O artigo que procuras não existe ou foi removido.",
  fallback:"Este artigo só está disponível em português.",rights:"Todos os direitos reservados."},
 de:{nav_posts:"Beiträge",nav_about:"Über uns & Kontakt",hero_tag:"Bundesliga · Analyse · Kultur",hero_title:"Deutscher <em>Fußball</em>, ohne Rauschen",
  hero_desc:"Analysen, Taktik und Geschichten aus der Bundesliga und drumherum – auf Portugiesisch und Deutsch.",cta_posts:"Beiträge ansehen",cta_about:"Über den Blog",
  latest:"Neuester Beitrag",read:"Artikel lesen",posts_label:"Entdecken",posts_title:"Alle Beiträge",posts_sub:"Analysen und Geschichten aus dem deutschen Fußball",
  about_label:"Über das Projekt",about_title:"Deutscher Fußball, erklärt",about_text:"Ein Blog über deutschen Fußball: Bundesliga, 2. Bundesliga, DFB-Pokal und Nationalmannschaft. Wir schreiben auf Portugiesisch und Deutsch und nennen die Quellen unserer Daten.",
  contact_label:"Kontakt",contact_title:"Schreib uns",contact_text:"Anregungen, Korrekturen oder Ideen für einen Artikel? Schreib uns.",
  back:"Zurück zur Startseite",nf_title:"Beitrag nicht gefunden",nf_text:"Der gesuchte Artikel existiert nicht oder wurde entfernt.",
  fallback:"Dieser Artikel ist nur auf Portugiesisch verfügbar.",rights:"Alle Rechte vorbehalten."}
};
let lang="pt";
try{lang=new URLSearchParams(location.search).get("lang")||localStorage.getItem("lang")||"pt"}catch(e){}
if(!T[lang])lang="pt";
const t=k=>T[lang][k]||T.pt[k]||"";
const L=o=>(o&&(o[lang]||o.pt))||"";
const esc=s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const fmt=d=>new Date(d+"T12:00:00").toLocaleDateString(lang==="de"?"de-DE":"pt-PT",{day:"2-digit",month:"long",year:"numeric"});
const ex=h=>{const d=document.createElement("div");d.innerHTML=h;const s=(d.textContent||"").trim();return s.length>170?s.slice(0,170).trim()+"…":s};
const posts=(window.POSTS||[]).slice().sort((a,b)=>new Date(b.date)-new Date(a.date));
const $=s=>document.querySelector(s);
const url=p=>"post.html?id="+encodeURIComponent(p.id);

function i18n(){
  document.documentElement.lang=lang;
  document.querySelectorAll("[data-t]").forEach(e=>{e.innerHTML=t(e.dataset.t)});
  document.querySelectorAll(".lang button").forEach(b=>b.classList.toggle("on",b.dataset.l===lang));
  document.querySelectorAll("[data-name]").forEach(e=>{e.textContent=(window.SITE||{}).name||"Die Elf"});
  const m=(window.SITE||{}).email||"";
  document.querySelectorAll("[data-mail]").forEach(e=>{e.textContent=m;e.href="mailto:"+m});
  const y=document.querySelector("[data-year]");if(y)y.textContent=new Date().getFullYear();
}
const card=p=>`<a class="card" href="${url(p)}"><div class="ph">${p.image?`<img src="${esc(p.image)}" alt="">`:""}</div><div class="cb"><div class="meta">${fmt(p.date)}</div><h3>${esc(L(p.title))}</h3><p>${esc(ex(L(p.body)))}</p><span class="more">${t("read")} →</span></div></a>`;

function home(){
  const f=posts[0];if(!f)return;
  $("#ovt").textContent=L(f.title);$("#ovd").textContent=fmt(f.date);
  $("#feat").innerHTML=`<div class="wrap feat"><a class="ph" href="${url(f)}">${f.image?`<img src="${esc(f.image)}" alt="">`:""}</a><div><p class="lbl">${t("latest")}</p><h2>${esc(L(f.title))}</h2><p>${esc(ex(L(f.body)))}</p><a class="btn" href="${url(f)}">${t("read")}</a></div></div>`;
  $("#grid").innerHTML=posts.slice(1).map(card).join("");
}
function post(){
  const id=new URLSearchParams(location.search).get("id"),p=posts.find(x=>x.id===id),v=$("#post");
  if(!p){v.innerHTML=`<div class="ph-hero"><div class="wrap"><h1>${t("nf_title")}</h1><p>${t("nf_text")}</p></div></div><div class="back"><br><a class="btn" href="index.html">${t("back")}</a></div>`;
    document.title=t("nf_title");const r=document.createElement("meta");r.name="robots";r.content="noindex";document.head.appendChild(r);return}
  const ok=!!(p.body[lang]&&p.title[lang]);
  document.title=L(p.title)+" — "+((window.SITE||{}).name||"Die Elf");
  v.innerHTML=`<header class="ph-hero"><div class="wrap"><p class="lbl">${esc((window.SITE||{}).name||"Die Elf")}</p><h1>${esc(L(p.title))}</h1><p class="meta">${fmt(p.date)}</p></div></header>
  ${p.image?`<div class="pimg"><img src="${esc(p.image)}" alt="${esc(L(p.title))}"></div>`:""}
  <article class="wrap narrow pb">${ok?"":`<div class="note" style="margin:0 0 24px">${t("fallback")}</div>`}${L(p.body)}</article>
  <div class="back"><a class="tl" href="index.html">← ${t("back")}</a></div>`;
}
function run(){i18n();if($("#grid"))home();if($("#post"))post()}
function setLang(l){lang=l;try{localStorage.setItem("lang",l)}catch(e){}run()}
document.addEventListener("DOMContentLoaded",()=>{
  document.querySelectorAll(".lang button").forEach(b=>b.addEventListener("click",()=>setLang(b.dataset.l)));
  const h=$(".hd");const s=()=>h.classList.toggle("s",scrollY>30);addEventListener("scroll",s);s();run();
});
})();
