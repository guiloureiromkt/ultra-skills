#!/usr/bin/env node
// ============================================================================
// ultra-auditoria · audit.mjs — o gate MECÂNICO da auditoria de site.
//
// Zero dependências (Node 18+ · fetch nativo). Roda contra site NO AR (--url)
// ou pasta estática local (--dir). Devolve JSON + Markdown com achados por
// eixo (SEO técnico · SEO conteúdo · GEO · marca/resíduo · código) e um score
// por eixo, calculado por peso — nunca por "achismo".
//
// A regra que rege este script: ele só afirma o que CONSEGUIU medir. Check que
// não deu pra rodar vira `skipped` e sai do denominador — nunca vira 0 forçado
// (canon de honestidade: "não medido" ≠ "não tem").
//
// Uso:
//   node audit.mjs --url https://www.exemplo.com --brand "Exemplo Ltda" \
//        --sector "escritório de advocacia" --out ./audit [--max 30] \
//        [--forbid "termo1,termo2"] [--repo C:/Repos/meu-site]
//   node audit.mjs --dir ./site/dist --base https://exemplo.com --brand "..." --out ./audit
//
// Cicatriz de ambiente (Windows do Gui): o AVG faz MITM do TLS. Se der
// UNABLE_TO_VERIFY_LEAF_SIGNATURE / self-signed, rode com:
//   NODE_OPTIONS=--use-system-ca node audit.mjs ...
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const UA = "ultra-auditoria/1.0 (+auditoria tecnica; respeita robots)";

// ---------------------------------------------------------------- args ------
function parseArgs(argv) {
  const a = { max: 30, out: "./audit", concurrency: 6 };
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    if (!k.startsWith("--")) continue;
    const name = k.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) { a[name] = true; continue; }
    a[name] = next; i++;
  }
  a.max = Number(a.max) || 30;
  a.concurrency = Number(a.concurrency) || 6;
  return a;
}
const args = parseArgs(process.argv);

if (!args.url && !args.dir) {
  console.error(`
ultra-auditoria · audit.mjs

  --url   <https://...>   audita o site NO AR (segue sitemap/links)
  --dir   <caminho>       audita pasta estática local (html no disco)
  --base  <https://...>   (com --dir) URL pública, pra checar links absolutos
  --brand <"Nome">        nome da marca DECLARADA — usado no teste de resíduo
  --sector <"setor">      setor declarado (ex: "advocacia") — teste de coerência
  --forbid <"a,b,c">      termos que NÃO podem aparecer (marca de origem etc.)
  --allow  <"a,b,c">      marcas de terceiro citadas de propósito (não acusar)
  --repo  <caminho>       repositório do site, pra varredura de código
  --max   <n>             máximo de páginas (default 30)
  --out   <caminho>       pasta de saída (default ./audit)

Exemplo:
  node audit.mjs --url https://www.exemplo.com --brand "Exemplo" --out ./audit
`);
  process.exit(2);
}

// ------------------------------------------------------------- findings -----
// severidade: P0 = quebra/engana (corrigir antes de qualquer coisa)
//             P1 = perde ranking/citação de verdade
//             P2 = polimento
const findings = [];
const AXES = {
  seo_tecnico: "SEO técnico",
  seo_conteudo: "SEO de conteúdo",
  geo: "GEO (citabilidade por IA)",
  marca: "Integridade de marca",
  // Um site sem medição e sem formulário que entrega não é um site com defeito —
  // é um site que não faz o trabalho. Este eixo existe porque tráfego que ninguém
  // conta e lead que ninguém recebe são o prejuízo mais caro e o mais silencioso.
  medicao: "Medição & conversão",
  codigo: "Código & qualidade",
};
const WEIGHT = { P0: 5, P1: 3, P2: 1 };

/** Registra um check. status: "pass" | "fail" | "skip" */
function check(axis, id, status, severity, title, detail = "", evidence = null) {
  findings.push({ axis, id, status, severity, title, detail, evidence });
}
const ok = (axis, id, sev, title, detail, ev) => check(axis, id, "pass", sev, title, detail, ev);
const bad = (axis, id, sev, title, detail, ev) => check(axis, id, "fail", sev, title, detail, ev);
const skip = (axis, id, sev, title, detail) => check(axis, id, "skip", sev, title, detail);

// ------------------------------------------------------------- helpers ------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(n, items.length || 1) }, async () => {
    while (i < items.length) {
      const idx = i++;
      try { out[idx] = await fn(items[idx], idx); }
      catch (e) { out[idx] = { error: String(e && e.message || e) }; }
    }
  });
  await Promise.all(workers);
  return out;
}

let TLS_HINT_SHOWN = false;
function tlsHint(err) {
  const m = String(err && err.message || err);
  if (!TLS_HINT_SHOWN && /self-signed|UNABLE_TO_VERIFY|certificate/i.test(m)) {
    TLS_HINT_SHOWN = true;
    console.error("\n⚠️  TLS falhou. Nesta máquina o antivírus faz MITM. Rode de novo com:\n    NODE_OPTIONS=--use-system-ca node audit.mjs ...\n");
  }
}

/** GET seguindo redirects na mão, pra registrar a cadeia. */
async function fetchChain(url, { method = "GET", maxHops = 6 } = {}) {
  const chain = [];
  let current = url;
  for (let hop = 0; hop <= maxHops; hop++) {
    let res;
    try {
      res = await fetch(current, {
        method, redirect: "manual",
        headers: { "user-agent": UA, accept: "text/html,*/*" },
      });
    } catch (e) { tlsHint(e); return { error: String(e && e.message || e), chain, url: current }; }
    chain.push({ url: current, status: res.status });
    const loc = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && loc) {
      current = new URL(loc, current).toString();
      continue;
    }
    let body = "";
    if (method === "GET") { try { body = await res.text(); } catch { body = ""; } }
    return { status: res.status, url: current, chain, body, headers: res.headers };
  }
  return { error: "loop de redirect", chain, url: current };
}

// --- HTML sem dependência: pequeno, explícito, e ciente dos próprios limites.
const stripComments = (h) => h.replace(/<!--[\s\S]*?-->/g, "");
function tags(html, name) {
  const re = new RegExp(`<${name}\\b([^>]*)>([\\s\\S]*?)<\\/${name}>`, "gi");
  const out = []; let m;
  while ((m = re.exec(html))) out.push({ attrs: m[1] || "", inner: m[2] || "" });
  return out;
}
function voidTags(html, name) {
  const re = new RegExp(`<${name}\\b([^>]*?)\\/?>`, "gi");
  const out = []; let m;
  while ((m = re.exec(html))) out.push({ attrs: m[1] || "" });
  return out;
}
function attr(attrs, name) {
  const m = attrs.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s"'>]+))`, "i"));
  return m ? (m[2] ?? m[3] ?? m[4] ?? "") : null;
}
const ENT = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&apos;": "'", "&nbsp;": " ", "&mdash;": "—", "&ndash;": "–" };
const decode = (s) => String(s || "")
  .replace(/&[a-z#0-9]+;/gi, (e) => ENT[e.toLowerCase()] ?? e)
  .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)));
function visibleText(html) {
  const cleaned = stripComments(html)
    .replace(/<(script|style|noscript|template|svg)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  return decode(cleaned).replace(/\s+/g, " ").trim();
}
const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
const words = (s) => (String(s || "").trim().match(/\S+/g) || []).length;

// ---- dimensão REAL da imagem (A3) ------------------------------------------
// O atributo width do HTML mente: ele diz como a imagem é exibida, não o que o
// arquivo tem. E o gate do card grande do Google é sobre o ARQUIVO. Por isso a
// medição é feita nos bytes do cabeçalho — sem dependência, sem baixar tudo.
function imageSize(buf) {
  if (!buf || buf.length < 24) return null;
  // PNG
  if (buf.readUInt32BE(0) === 0x89504e47) {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), type: "png" };
  }
  // GIF
  if (buf.slice(0, 3).toString("latin1") === "GIF") {
    return { w: buf.readUInt16LE(6), h: buf.readUInt16LE(8), type: "gif" };
  }
  // WebP — três variantes, e cada uma guarda o tamanho num lugar diferente.
  if (buf.slice(0, 4).toString("latin1") === "RIFF" && buf.slice(8, 12).toString("latin1") === "WEBP") {
    const chunk = buf.slice(12, 16).toString("latin1");
    if (chunk === "VP8X") return { w: buf.readUIntLE(24, 3) + 1, h: buf.readUIntLE(27, 3) + 1, type: "webp/x" };
    if (chunk === "VP8 ") {
      const o = buf.indexOf(Buffer.from([0x9d, 0x01, 0x2a]), 12);
      if (o > 0 && buf.length > o + 7) {
        return { w: buf.readUInt16LE(o + 3) & 0x3fff, h: buf.readUInt16LE(o + 5) & 0x3fff, type: "webp/lossy" };
      }
    }
    if (chunk === "VP8L" && buf.length > 25) {
      const b = buf.readUInt32LE(21);
      return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1, type: "webp/lossless" };
    }
  }
  // JPEG — percorrer os segmentos até achar um Start Of Frame.
  if (buf.readUInt16BE(0) === 0xffd8) {
    let o = 2;
    while (o + 9 < buf.length) {
      if (buf[o] !== 0xff) { o++; continue; }
      const marker = buf[o + 1];
      const len = buf.readUInt16BE(o + 2);
      const isSOF = (marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) ||
                    (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf);
      if (isSOF) return { w: buf.readUInt16BE(o + 7), h: buf.readUInt16BE(o + 5), type: "jpeg" };
      if (len < 2) break;
      o += 2 + len;
    }
  }
  // SVG é vetorial: escala sem perda, o gate de pixel não se aplica.
  if (/^\s*(<\?xml|<svg)/i.test(buf.slice(0, 200).toString("utf8"))) return { w: Infinity, h: Infinity, type: "svg" };
  return null;
}

/** Baixa só o começo do arquivo — cabeçalho basta pra medir. */
async function fetchImageHead(url, bytes = 262144) {
  try {
    const res = await fetch(url, { headers: { "user-agent": UA, range: `bytes=0-${bytes - 1}` } });
    if (!res.ok && res.status !== 206) return { error: `HTTP ${res.status}` };
    const ab = await res.arrayBuffer();
    return { buf: Buffer.from(ab), bytes: Number(res.headers.get("content-length")) || null };
  } catch (e) { tlsHint(e); return { error: String(e && e.message || e) }; }
}

function jsonLdBlocks(html) {
  const out = [];
  for (const t of tags(html, "script")) {
    const type = attr(t.attrs, "type") || "";
    if (!/ld\+json/i.test(type)) continue;
    const raw = t.inner.trim();
    try {
      const parsed = JSON.parse(raw);
      const flat = [];
      const walk = (n) => {
        if (Array.isArray(n)) return n.forEach(walk);
        if (n && typeof n === "object") {
          flat.push(n);
          if (Array.isArray(n["@graph"])) n["@graph"].forEach(walk);
        }
      };
      walk(parsed);
      out.push({ ok: true, nodes: flat, raw });
    } catch (e) {
      out.push({ ok: false, error: String(e.message), raw: raw.slice(0, 200) });
    }
  }
  return out;
}

// -------------------------------------------------------- resíduo léxico ----
function loadLexicon() {
  const p = path.join(HERE, "residue-lexicon.json");
  try { return JSON.parse(fs.readFileSync(p, "utf8")); }
  catch { return { motors: {}, generic: [] }; }
}
const LEX = loadLexicon();
const forbidTerms = String(args.forbid || "").split(",").map((s) => s.trim()).filter(Boolean);

// Cada grupo do léxico é o vocabulário de UMA marca. Se o site auditado É essa
// marca, o grupo inteiro sai — senão o dono do molde é acusado de plagiar a si
// mesmo ("Escada de Maturidade em IA" no site de quem cunhou o termo).
// O casamento é pelo nome declarado OU pelo domínio, porque um dos dois basta
// pra provar a titularidade.
let FORBIDDEN = null;
function forbiddenTerms(canonicalHost) {
  if (FORBIDDEN) return FORBIDDEN;
  const brandNorm = norm(args.brand || "");
  const hostNorm = norm(String(canonicalHost || "").replace(/^www\./, ""));
  const allowNorm = String(args.allow || "").split(",").map((s) => norm(s)).filter(Boolean);
  const out = [...forbidTerms, ...(LEX.generic || [])];
  for (const terms of Object.values(LEX.motors || {})) {
    const isOwn = terms.some((t) => {
      const tn = norm(t);
      if (!tn) return false;
      if (brandNorm && (brandNorm.includes(tn) || tn.includes(brandNorm))) return true;
      return hostNorm && tn.replace(/[^a-z0-9]/g, "").length > 5 && hostNorm.includes(tn.replace(/[^a-z0-9]/g, "").slice(0, 12));
    });
    if (!isOwn) out.push(...terms);
  }
  // --allow: marca de terceiro citada de propósito (empregador, cliente, parceiro).
  // Sem essa válvula o auditor acusa de resíduo toda menção legítima, e o relatório
  // perde a autoridade justamente no achado que mais importa.
  FORBIDDEN = [...new Set(out.filter(Boolean))].filter((t) => !allowNorm.includes(norm(t)));
  return FORBIDDEN;
}
// Sentenças em 1ª pessoa que DESCREVEM o negócio: o lugar exato onde o texto do
// molde sobrevive. Não julga sozinho — entrega pro revisor humano/modelo julgar.
const SELF_DESC = /\b(somos|atuamos|atendemos|fazemos|acreditamos|nossa (?:agência|empresa|equipe|história)|nosso (?:time|escritório|jeito)|especialistas em|anos de (?:estrada|mercado|experiência))\b/i;

// ---------------------------------------------------------- page audit ------
function auditPage(pageUrl, html, headers, ctx) {
  const p = { url: pageUrl, issues: [] };
  const add = (sev, msg, ev) => p.issues.push({ severity: sev, msg, evidence: ev || null });
  const H = stripComments(html);
  const head = (H.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i) || [, H])[1];

  // <html lang>
  const htmlTag = (H.match(/<html\b([^>]*)>/i) || [, ""])[1];
  p.lang = attr(htmlTag, "lang");
  if (!p.lang) add("P1", "<html> sem atributo lang — buscador e leitor de tela não sabem o idioma");

  // title
  const title = decode((tags(head, "title")[0] || {}).inner || "").trim();
  p.title = title;
  if (!title) add("P0", "Sem <title>");
  else if (title.length < 15) add("P1", `<title> curto demais (${title.length} chars)`, title);
  else if (title.length > 65) add("P2", `<title> longo (${title.length} chars) — o Google trunca ~60`, title);

  // meta description
  const metas = voidTags(head, "meta");
  const metaBy = (n, v) => metas.find((m) => (attr(m.attrs, n) || "").toLowerCase() === v);
  const desc = decode(attr((metaBy("name", "description") || {}).attrs || "", "content") || "").trim();
  p.description = desc;
  if (!desc) add("P1", "Sem meta description — o snippet vira sobra de texto da página");
  else if (desc.length < 60 || desc.length > 165) add("P2", `meta description fora da faixa útil (${desc.length} chars · alvo 70-160)`, desc);

  // robots meta
  const robotsMeta = attr((metaBy("name", "robots") || {}).attrs || "", "content") || "";
  p.robotsMeta = robotsMeta;
  if (/noindex/i.test(robotsMeta)) add("P0", "Página com noindex — invisível pro Google", robotsMeta);

  // DESCOBERTA · preview grande (gate do card de imagem no Google e da elegibilidade ao Discover).
  // Cicatriz 2026-07-25 (guiloureiro.com.br): faltava nas 129 páginas -> Discover com ZERO
  // impressão em 90 dias, com schema/autor/imagem 1344px já corretos. É 1 linha no <head>.
  const todasRobots = metas.filter((m) => (attr(m.attrs, "name") || "").toLowerCase() === "robots");
  if (!/noindex/i.test(robotsMeta)) {
    if (!/max-image-preview\s*:\s*large/i.test(robotsMeta)) {
      add("P1", "sem 'max-image-preview:large' — o Google não serve card de imagem grande e a página fica inelegível ao Google Discover", robotsMeta || "(nenhuma meta robots)");
    }
    if (!/max-snippet\s*:\s*-1/i.test(robotsMeta)) {
      add("P2", "sem 'max-snippet:-1' — snippet limitado no resultado (perde espaço de SERP e CTR)", robotsMeta || "(nenhuma meta robots)");
    }
  }
  if (todasRobots.length > 1) {
    add("P1", `${todasRobots.length} metas <meta name="robots"> na mesma página — diretivas conflitantes; deixar UMA só`, todasRobots.map((m) => attr(m.attrs, "content")).join(" | "));
  }

  // canonical
  const links = voidTags(head, "link");
  const canon = links.find((l) => (attr(l.attrs, "rel") || "").toLowerCase() === "canonical");
  p.canonical = canon ? attr(canon.attrs, "href") : null;
  if (!p.canonical) add("P1", "Sem <link rel=canonical> — duplicidade de URL divide a autoridade");
  else {
    try {
      const c = new URL(p.canonical, pageUrl);
      if (!/^https?:$/.test(c.protocol)) add("P1", "canonical não é http(s)", p.canonical);
      if (ctx.canonicalHost && c.host !== ctx.canonicalHost) {
        add("P0", `canonical aponta pra host diferente do que o site serve (${c.host} ≠ ${ctx.canonicalHost}) — a autoridade vaza pra um host que só redireciona`, p.canonical);
      }
    } catch { add("P1", "canonical inválido", p.canonical); }
  }

  // Open Graph / Twitter
  const og = (prop) => attr((metas.find((m) => (attr(m.attrs, "property") || attr(m.attrs, "name") || "").toLowerCase() === prop) || {}).attrs || "", "content");
  p.og = { title: og("og:title"), description: og("og:description"), image: og("og:image"), url: og("og:url"), type: og("og:type") };
  for (const k of ["title", "description", "image"]) {
    if (!p.og[k]) add("P2", `Sem og:${k} — o link compartilhado sai sem cara`);
  }
  if (!og("twitter:card")) add("P2", "Sem twitter:card");

  // headings
  const hs = [];
  for (let lvl = 1; lvl <= 6; lvl++) for (const t of tags(H, `h${lvl}`)) hs.push({ lvl, text: decode(visibleText(t.inner)).trim() });
  p.headings = hs;
  const h1s = hs.filter((h) => h.lvl === 1);
  if (h1s.length === 0) add("P0", "Página sem H1");
  else if (h1s.length > 1) add("P1", `${h1s.length} H1 na mesma página — o buscador não sabe qual é o assunto`, h1s.map((h) => h.text).join(" | "));
  const empties = hs.filter((h) => !h.text).length;
  if (empties) add("P2", `${empties} heading(s) vazio(s) — estrutura fantasma`);

  // texto visível
  const text = visibleText(H);
  p.words = words(text);
  p.text = text;
  if (p.words < 250) add("P1", `Página magra (${p.words} palavras) — pouco material pro Google e pra IA citarem`);

  // GEO · BLUF: a resposta tem que estar nos primeiros 30% (44,2% das citações
  // de IA saem dali). Proxy mecânico: existe parágrafo de 40-80 palavras logo
  // depois do H1?
  const afterH1 = text.slice(text.indexOf(h1s[0]?.text || "") + (h1s[0]?.text || "").length);
  const firstChunk = afterH1.split(/(?<=[.!?])\s+/).slice(0, 4).join(" ");
  p.bluf = { words: words(firstChunk), sample: firstChunk.slice(0, 320) };
  if (p.words >= 250 && (p.bluf.words < 25 || p.bluf.words > 140)) {
    add("P1", `Sem BLUF extraível logo abaixo do H1 (${p.bluf.words} palavras no 1º bloco · alvo 40-80) — é a faixa de onde a IA mais cita`, p.bluf.sample);
  }

  // headings em pergunta (espelham a query real)
  const qHeads = hs.filter((h) => h.lvl >= 2 && /\?\s*$/.test(h.text)).length;
  const h2plus = hs.filter((h) => h.lvl >= 2).length;
  p.questionHeadings = { q: qHeads, total: h2plus };
  if (h2plus >= 3 && qHeads === 0) add("P1", "Nenhum H2/H3 em forma de pergunta — perde o casamento com a query literal que a pessoa digita");

  // dados estruturados visuais (tabela/lista) — +30-40% de chance de citação
  p.hasTable = /<table\b/i.test(H);
  p.hasList = /<(ul|ol)\b/i.test(H);

  // imagens
  const imgs = voidTags(H, "img");
  const noAlt = imgs.filter((im) => attr(im.attrs, "alt") === null);
  const emptyAlt = imgs.filter((im) => attr(im.attrs, "alt") === "");
  p.images = { total: imgs.length, missingAlt: noAlt.length, decorativeAlt: emptyAlt.length };
  if (noAlt.length) add("P1", `${noAlt.length}/${imgs.length} <img> sem atributo alt — acessibilidade e SEO de imagem`, noAlt.slice(0, 3).map((i) => attr(i.attrs, "src")).join(" · "));
  const noDim = imgs.filter((im) => !attr(im.attrs, "width") || !attr(im.attrs, "height"));
  if (noDim.length) add("P2", `${noDim.length} <img> sem width/height — causa layout shift (CLS)`);

  // JSON-LD
  const blocks = jsonLdBlocks(H);
  p.jsonld = { blocks: blocks.length, types: [], invalid: 0 };
  const nodes = [];
  for (const b of blocks) {
    if (!b.ok) { p.jsonld.invalid++; add("P0", "Bloco JSON-LD inválido (não parseia) — o Google descarta o schema inteiro", b.error); continue; }
    for (const n of b.nodes) { nodes.push(n); const t = n["@type"]; if (t) p.jsonld.types.push(...[].concat(t)); }
  }
  if (blocks.length === 0) add("P1", "Nenhum JSON-LD — sem entidade declarada, a IA tem que adivinhar quem você é");

  // FAQPage tem que bater com a FAQ visível (cicatriz B9: divergir é sinal negativo)
  const faq = nodes.find((n) => [].concat(n["@type"] || []).includes("FAQPage"));
  if (faq) {
    const qs = [].concat(faq.mainEntity || []).map((q) => q && q.name).filter(Boolean);
    const tnorm = norm(text);
    const missing = qs.filter((q) => !tnorm.includes(norm(q).slice(0, 40)));
    p.faq = { questions: qs.length, missingFromPage: missing.length };
    if (missing.length) add("P0", `FAQPage declara ${missing.length} pergunta(s) que não existem no texto visível — divergência schema×página é sinal negativo pro Google`, missing.slice(0, 2).join(" | "));
  }

  // entidade: Organization genérico onde cabia tipo específico
  const orgNode = nodes.find((n) => [].concat(n["@type"] || []).includes("Organization"));
  if (orgNode) {
    p.orgUrl = orgNode.url || null;
    if (ctx.canonicalHost && orgNode.url) {
      try { if (new URL(orgNode.url).host !== ctx.canonicalHost) add("P1", `schema Organization.url usa host diferente do site (${new URL(orgNode.url).host}) — quebra a consolidação da entidade`, orgNode.url); } catch {}
    }
    const specific = p.jsonld.types.some((t) => !["Organization", "WebSite", "WebPage", "BreadcrumbList", "ImageObject", "SearchAction", "ListItem"].includes(t));
    if (!specific) add("P1", "Só `Organization` genérico no schema — um tipo específico (LegalService, Dentist, SoftwareApplication, LocalBusiness…) diz pra IA o que você FAZ, não só que existe");
  }

  // em-dash no texto visível (regra de copy do Gui)
  const emdash = (text.match(/—/g) || []).length;
  if (emdash) p.emdash = emdash;

  // Placeholders. Sem `placeholder` solto (palavra legítima em texto sobre
  // formulário) e com run de 6+ x — máscara de CNPJ/CPF chega a 4-5 e não é
  // texto por preencher. Achado falso aqui vale menos que achado nenhum: ele
  // treina a pessoa a ignorar o relatório.
  const PLACE = /(lorem ipsum|texto de exemplo|coloque aqui|seu texto aqui|inserir texto|TODO:|FIXME|\bx{6,}\b)/i;
  const ph = text.match(PLACE);
  if (ph) add("P0", "Placeholder/lorem visível na página publicada", ph[0]);

  // seção com título e zero conteúdo (o "Cases" vazio do caso real)
  const emptySection = /(?:^|\s)(Cases|Portfólio|Portfolio|Projetos|Depoimentos|Insights)\s+(?:Nenhum|Nenhuma|Em breve|Sem )/i.exec(text);
  if (emptySection) add("P1", "Seção publicada sem conteúdo (heading no ar com estado vazio) — página fina que o buscador indexa como oca", emptySection[0].slice(0, 120));

  // resíduo de marca / molde
  const residue = [];
  const tnorm = norm(text);
  for (const term of forbiddenTerms(ctx.canonicalHost)) {
    if (tnorm.includes(norm(term))) residue.push(term);
  }
  p.residue = residue;
  if (residue.length) {
    // Onde o termo aparece muda tudo. Dentro de frase que descreve o negócio
    // ("somos uma agência…"), o site está afirmando SER a outra marca — P0.
    // Solto no corpo, pode ser menção legítima a empregador, cliente ou parceiro
    // — P1, pra conferência. Tratar os dois igual queima a credibilidade do P0.
    const sentences = text.split(/(?<=[.!?])\s+/);
    const afirmativo = residue.filter((t) =>
      sentences.some((s) => SELF_DESC.test(s) && norm(s).includes(norm(t))));
    if (afirmativo.length) {
      add("P0", `O site se DESCREVE com termos de outra marca: ${afirmativo.join(" · ")} — pro leitor e pra IA, ele está dizendo que é outra empresa`, residue.join(" | "));
    } else {
      add("P1", `Menção a marca de terceiro no texto: ${residue.join(" · ")} — confirme se é intencional (parceiro/cliente/empregador). Se for, rode com \`--allow "${residue.join(",")}"\` pra parar de acusar`, residue.join(" | "));
    }
  }

  // sentenças auto-descritivas: candidatas a resíduo que o léxico não pega
  // Faixa de 8-45 palavras: abaixo disso é fragmento, acima é o texto corrido do
  // menu/formulário que o extrator concatenou — nos dois casos, ruído pro revisor.
  p.selfDescribing = text.split(/(?<=[.!?])\s+/)
    .filter((s) => SELF_DESC.test(s) && words(s) >= 8 && words(s) <= 45)
    .slice(0, 6);

  // ---- A5 · o feed declarado na página (checado no nível do site) ----------
  p.feeds = links
    .filter((l) => (attr(l.attrs, "rel") || "").toLowerCase() === "alternate" &&
      /(rss|atom|xml)/i.test(attr(l.attrs, "type") || ""))
    .map((l) => { try { return new URL(attr(l.attrs, "href"), pageUrl).toString(); } catch { return null; } })
    .filter(Boolean);

  // ---- A3 · imagem principal: guardar as candidatas pra medir depois -------
  // A medição é de rede (assíncrona) e acontece no nível do site; aqui só se
  // resolve QUAIS imagens importam pro card grande: a og:image e a do schema.
  p.mainImages = [];
  const schemaImg = (() => {
    for (const n of nodes) {
      const im = n.image || n.thumbnailUrl;
      if (!im) continue;
      const v = Array.isArray(im) ? im[0] : im;
      if (typeof v === "string") return v;
      if (v && typeof v === "object" && typeof v.url === "string") return v.url;
    }
    return null;
  })();
  for (const [origem, src] of [["og:image", p.og.image], ["schema image", schemaImg]]) {
    if (!src) continue;
    try { p.mainImages.push({ origem, url: new URL(src, pageUrl).toString() }); } catch {}
  }

  // ---- A6 · VideoObject só quando o vídeo é assistível ---------------------
  // B-roll decorativo (autoplay muted loop, sem controls) marcado como
  // VideoObject não rende impressão de vídeo — o Google quer vídeo reproduzível
  // e proeminente. E cria descompasso entre o markup e o que a página é.
  const videos = tags(H, "video").map((v) => ({
    controls: /\bcontrols\b/i.test(v.attrs),
    autoplay: /\bautoplay\b/i.test(v.attrs),
    loop: /\bloop\b/i.test(v.attrs),
  }));
  const temVideoObject = nodes.some((n) => [].concat(n["@type"] || []).includes("VideoObject"));
  p.videos = { total: videos.length, comControls: videos.filter((v) => v.controls).length, schema: temVideoObject };
  if (temVideoObject) {
    const embed = /(youtube\.com\/embed|player\.vimeo\.com|<iframe[^>]+(youtu|vimeo))/i.test(H);
    if (!videos.some((v) => v.controls) && !embed) {
      add("P1", "Schema `VideoObject` numa página sem vídeo assistível (nenhum <video controls> nem player incorporado) — o Google não conta como resultado de vídeo e o markup fica divergindo da página", `${videos.length} <video> na página, ${videos.filter((v) => v.autoplay).length} em autoplay decorativo`);
    }
  } else if (videos.some((v) => v.controls)) {
    add("P2", "Vídeo assistível na página sem schema `VideoObject` — oportunidade perdida de aparecer na aba Vídeos e no carrossel de vídeo", `${videos.filter((v) => v.controls).length} <video controls>`);
  }

  // ---- medição: quem está contando a visita? -------------------------------
  // Sem isso o dono do site não sabe se alguém entrou, de onde veio, nem se o
  // trabalho de SEO deu resultado. É o instrumento, não um extra.
  const ANALYTICS = [
    // GT- é o "Google Tag" novo; funciona igual ao G- e é o que o WordPress
    // costuma emitir. Faltando ele, site medido virava site "sem medição".
    { id: "GA4", re: /gtag\/js\?id=(G[T]?-[A-Z0-9]+)|['"](G[T]?-[A-Z0-9]{6,})['"]/g },
    { id: "Google Tag Manager", re: /(GTM-[A-Z0-9]{4,})/g },
    { id: "Google Analytics (Universal, descontinuado)", re: /(UA-\d{4,}-\d+)/g },
    { id: "Plausible", re: /plausible\.io\/js/g },
    { id: "Umami", re: /umami\.[a-z.]+\/script/g },
    { id: "Fathom", re: /cdn\.usefathom\.com/g },
    { id: "Matomo", re: /matomo\.(js|php)/g },
    { id: "Microsoft Clarity", re: /clarity\.ms\/tag/g },
    { id: "Hotjar", re: /static\.hotjar\.com/g },
    { id: "Meta Pixel", re: /connect\.facebook\.net\/[^"']*fbevents/g },
    { id: "Vercel Analytics", re: /_vercel\/insights|@vercel\/analytics/g },
  ];
  // Guarda os scripts do próprio domínio: se a medição não estiver no HTML, ela
  // pode estar DENTRO de um deles. É o padrão de quem carrega analytics só
  // depois do aceite de cookies — correto pela LGPD, e invisível pra quem só
  // lê o HTML servido. Sem isso o auditor acusa "sem medição" num site medido.
  p.scriptSrcs = tags(H, "script")
    .map((s) => attr(s.attrs, "src"))
    .filter((s) => s && !/^https?:\/\//i.test(s))
    .map((s) => { try { return new URL(s, pageUrl).toString(); } catch { return null; } })
    .filter(Boolean);

  p.analytics = [];
  for (const a of ANALYTICS) {
    a.re.lastIndex = 0;
    const found = [...H.matchAll(a.re)];
    if (found.length) {
      const ids = [...new Set(found.map((m) => m[1] || m[2]).filter(Boolean))];
      p.analytics.push({ tool: a.id, ids, occurrences: found.length });
    }
  }
  // Medição duplicada conta cada visita duas vezes — todo relatório fica mentindo.
  for (const a of p.analytics) {
    for (const id of a.ids) {
      const n = (H.match(new RegExp(id.replace(/[-]/g, "\\-"), "g")) || []).length;
      if (n > 2) add("P1", `Código de medição ${id} aparece ${n}× na mesma página — visita contada em dobro deixa todo relatório errado pra cima`, id);
    }
  }
  const gsv = metas.find((m) => (attr(m.attrs, "name") || "").toLowerCase() === "google-site-verification");
  p.searchConsoleTag = gsv ? attr(gsv.attrs, "content") : null;

  // ---- formulários: o lead chega em algum lugar? ---------------------------
  // Este é o defeito mais caro que existe num site: a pessoa preenche, vê
  // "recebemos sua mensagem", e ninguém recebe nada. Do lado do HTML só dá pra
  // ver metade da história — a outra metade é o `--repo` (regra form.fake).
  p.forms = [];
  for (const f of tags(H, "form")) {
    const action = attr(f.attrs, "action");
    const todos = [...voidTags(f.inner, "input"), ...tags(f.inner, "textarea"), ...tags(f.inner, "select")];
    // Campo que o leitor de tela nunca alcança não precisa de rótulo: oculto,
    // honeypot, e os botões (que se anunciam pelo próprio texto). Cobrar rótulo
    // deles acusa justamente o formulário bem-feito — e um achado falso aqui
    // ensina a pessoa a ignorar os verdadeiros.
    const invisivel = (i) => /type=["'](hidden|submit|button|reset|image)["']/i.test(i.attrs) ||
      /\bhidden\b/i.test(i.attrs) || /display\s*:\s*none|visibility\s*:\s*hidden/i.test(attr(i.attrs, "style") || "");
    const inputs = todos.filter((i) => !invisivel(i));
    const labeled = inputs.filter((i) => attr(i.attrs, "aria-label") || attr(i.attrs, "aria-labelledby") ||
      attr(i.attrs, "title") || (attr(i.attrs, "id") && new RegExp(`for=["']${attr(i.attrs, "id")}["']`).test(f.inner)));
    const named = inputs.filter((i) => attr(i.attrs, "name"));
    const form = {
      action: action || null,
      method: (attr(f.attrs, "method") || "get").toLowerCase(),
      fields: inputs.length,
      unlabeled: inputs.length - labeled.length,
      unnamed: inputs.length - named.length,
      hasEmail: /type=["']email["']/i.test(f.inner),
      honeypot: /name=["'](website|url|_gotcha|honeypot)["']/i.test(f.inner),
    };
    p.forms.push(form);
    if (inputs.length === 0) continue;
    if (!action) {
      add("P1", `Formulário sem \`action\` — o envio depende de JavaScript. Confirme no código pra onde o lead vai (rode com --repo); formulário que só finge enviar é o defeito mais caro de um site`, `${inputs.length} campo(s)`);
    } else if (/^https?:\/\//i.test(action)) {
      try { const d = new URL(action); if (ctx.canonicalHost && d.host !== ctx.canonicalHost) add("P1", `Formulário envia pra domínio externo (${d.host}) — confirme que é o serviço certo e que o dado do visitante pode ir pra lá`, action); } catch {}
    }
    if (form.unlabeled) add("P1", `Formulário com ${form.unlabeled} campo(s) sem rótulo acessível — quem usa leitor de tela não sabe o que preencher`);
    if (form.unnamed) add("P2", `Formulário com ${form.unnamed} campo(s) sem \`name\` — o valor não é enviado nem chega no destino`);
    if (!form.honeypot && form.hasEmail) add("P2", "Formulário sem campo-armadilha anti-robô (honeypot) — tende a encher de spam");
  }

  // ---- blog: só cobra o que existe ------------------------------------------
  // Detecta pelo schema OU pela URL: em muito site (WordPress na raiz, por
  // exemplo) o post não mora sob /blog/, e cobrar só por padrão de URL deixaria
  // o blog inteiro fora da auditoria sem ninguém perceber.
  const artNode = nodes.find((n) => [].concat(n["@type"] || []).some((t) => ["Article", "BlogPosting", "NewsArticle"].includes(t)));
  const urlLooksPost = /\/(blog|artigos?|posts?|noticias?|insights?|conteudos?)\/[^/]+\/?$/i.test(new URL(pageUrl, "https://x").pathname);
  const isPost = !!artNode || urlLooksPost;
  if (isPost) {
    p.isPost = true;
    if (!artNode) add("P1", "Post de blog sem schema Article/BlogPosting — o buscador não sabe que isso é um artigo, com autor e data");
    else {
      if (!artNode.datePublished) add("P1", "Post sem data de publicação no schema — frescor é critério de citação, principalmente no Perplexity");
      if (!artNode.dateModified) add("P2", "Post sem data de atualização (dateModified) no schema");
      if (!artNode.author) add("P1", "Post sem autor no schema — sem assinatura o conteúdo perde o sinal de experiência (E-E-A-T)");
    }
    if (!/\b(20\d{2})\b/.test(text.slice(0, 1200))) add("P2", "Data de publicação não aparece visível no topo do post — o leitor (e a IA) não sabem se está atualizado");
  }

  // links internos
  const anchors = tags(H, "a").map((a) => ({ href: attr(a.attrs, "href"), text: decode(visibleText(a.inner)).trim() }));
  p.links = { total: anchors.length, internal: [], external: 0, emptyText: 0 };
  for (const a of anchors) {
    if (!a.href || a.href.startsWith("#") || /^(mailto|tel|javascript):/i.test(a.href)) continue;
    let u; try { u = new URL(a.href, pageUrl); } catch { continue; }
    // Sem host canônico (auditoria local), href relativo já é interno por
    // definição — senão toda página local pareceria órfã.
    const interno = ctx.canonicalHost ? u.host === ctx.canonicalHost : !/^[a-z]+:\/\//i.test(a.href);
    if (interno) p.links.internal.push(u.toString().split("#")[0]);
    else p.links.external++;
    if (!a.text) p.links.emptyText++;
  }
  if (p.links.emptyText) add("P2", `${p.links.emptyText} link(s) sem texto âncora — nem o usuário nem o crawler sabem pra onde vão`);
  if (p.links.internal.length === 0) add("P1", "Página sem nenhum link interno — órfã no grafo do site");

  // headers de segurança / cache (só quando veio da rede)
  if (headers) {
    const h = (n) => headers.get(n);
    p.headers = {
      csp: h("content-security-policy"), xcto: h("x-content-type-options"),
      referrer: h("referrer-policy"), hsts: h("strict-transport-security"),
    };
  }
  return p;
}

// ------------------------------------------------------------ discovery -----
async function discoverFromWeb(rootUrl, max) {
  const root = new URL(rootUrl);
  const canonicalHost = root.host;
  const site = { canonicalHost, origin: root.origin };
  const urls = new Set();

  // robots.txt
  const rb = await fetchChain(new URL("/robots.txt", root).toString());
  site.robots = rb.status === 200 ? rb.body : null;
  const sitemapsFromRobots = [];
  if (site.robots) {
    for (const m of site.robots.matchAll(/^\s*sitemap:\s*(\S+)/gim)) sitemapsFromRobots.push(m[1]);
  }

  // sitemap(s)
  const smCandidates = sitemapsFromRobots.length ? sitemapsFromRobots : [new URL("/sitemap.xml", root).toString()];
  site.sitemaps = [];
  const queue = [...smCandidates];
  const seenSm = new Set();
  while (queue.length && urls.size < max * 3) {
    const sm = queue.shift();
    if (seenSm.has(sm)) continue;
    seenSm.add(sm);
    const r = await fetchChain(sm);
    if (r.status !== 200 || !r.body) { site.sitemaps.push({ url: sm, ok: false, status: r.status || r.error }); continue; }
    const locs = [...r.body.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => decode(m[1]));
    const isIndex = /<sitemapindex/i.test(r.body);
    site.sitemaps.push({ url: sm, ok: true, entries: locs.length, index: isIndex, lastmod: /<lastmod>/i.test(r.body) });
    if (isIndex) queue.push(...locs.slice(0, 10));
    else locs.forEach((l) => urls.add(l.split("#")[0]));
  }

  // fallback: varrer links a partir da home
  if (urls.size === 0) {
    const home = await fetchChain(root.toString());
    urls.add(home.url);
    if (home.body) {
      for (const a of tags(stripComments(home.body), "a")) {
        const href = attr(a.attrs, "href");
        if (!href || href.startsWith("#")) continue;
        try { const u = new URL(href, home.url); if (u.host === canonicalHost) urls.add(u.toString().split("#")[0]); } catch {}
      }
    }
  }
  site.llms = await fetchChain(new URL("/llms.txt", root).toString());
  return { site, urls: [...urls].slice(0, max) };
}

function discoverFromDir(dir, max) {
  const files = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === "node_modules" || e.name.startsWith(".")) continue;
      const full = path.join(d, e.name);
      if (e.isDirectory()) walk(full);
      else if (/\.html?$/i.test(e.name)) files.push(full);
    }
  };
  walk(dir);
  return files.slice(0, max);
}

// -------------------------------------------------------- site-level --------
function auditRobots(site) {
  const AI_BOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "anthropic-ai", "PerplexityBot", "Perplexity-User", "Google-Extended", "CCBot", "Applebot-Extended", "meta-externalagent", "Bytespider", "Amazonbot"];
  if (!site.robots) { bad("seo_tecnico", "robots.exists", "P1", "Sem robots.txt", "Sem robots.txt o crawler não recebe nenhuma diretriz e o sitemap não é anunciado."); return; }
  ok("seo_tecnico", "robots.exists", "P1", "robots.txt existe");
  if (/^\s*user-agent:\s*\*\s*$[\s\S]{0,200}?^\s*disallow:\s*\/\s*$/im.test(site.robots)) {
    bad("seo_tecnico", "robots.blanket", "P0", "robots.txt bloqueia o site inteiro", "`Disallow: /` para `*` — o site não é rastreado por ninguém.");
  } else ok("seo_tecnico", "robots.blanket", "P0", "robots.txt não bloqueia o site");
  if (/sitemap:/i.test(site.robots)) ok("seo_tecnico", "robots.sitemap", "P2", "robots.txt anuncia o sitemap");
  else bad("seo_tecnico", "robots.sitemap", "P2", "robots.txt não anuncia o sitemap", "Adicione `Sitemap: https://.../sitemap.xml`.");
  const missing = AI_BOTS.filter((b) => !new RegExp(`user-agent:\\s*${b}\\b`, "i").test(site.robots));
  const blocked = AI_BOTS.filter((b) => {
    const re = new RegExp(`user-agent:\\s*${b}\\b[\\s\\S]{0,120}?disallow:\\s*/\\s*$`, "im");
    return re.test(site.robots);
  });
  if (blocked.length) bad("geo", "robots.ai", "P0", `robots.txt BLOQUEIA crawler de IA: ${blocked.join(", ")}`, "Bloquear o crawler é abrir mão de ser citado por aquela IA — decisão consciente, não default.");
  else if (missing.length > 6) bad("geo", "robots.ai", "P2", `robots.txt não menciona ${missing.length} crawlers de IA`, `Sem regra explícita eles caem no \`*\` (permitido). Declarar Allow explícito para ${missing.slice(0, 5).join(", ")}… é sinal de intenção e evita bloqueio acidental futuro.`);
  else ok("geo", "robots.ai", "P1", "Crawlers de IA liberados explicitamente no robots.txt");
}

function auditSitemap(site, crawled) {
  const good = (site.sitemaps || []).filter((s) => s.ok);
  if (!good.length) { bad("seo_tecnico", "sitemap.exists", "P1", "Sem sitemap.xml acessível", "O crawler descobre páginas só por link — páginas novas demoram ou nunca entram."); return; }
  ok("seo_tecnico", "sitemap.exists", "P1", `sitemap.xml OK (${good.reduce((a, s) => a + (s.entries || 0), 0)} URLs)`);
  if (good.some((s) => s.lastmod)) ok("seo_tecnico", "sitemap.lastmod", "P2", "sitemap tem <lastmod>");
  else bad("seo_tecnico", "sitemap.lastmod", "P2", "sitemap sem <lastmod>", "Sem data o crawler não sabe o que mudou e re-rastreia por chute.");
  const wrongHost = crawled.filter((p) => p.status >= 300).map((p) => p.url);
  if (wrongHost.length) bad("seo_tecnico", "sitemap.status", "P1", `${wrongHost.length} URL(s) do sitemap não devolvem 200`, wrongHost.slice(0, 5).join(" · "));
  else ok("seo_tecnico", "sitemap.status", "P1", "Todas as URLs auditadas devolvem 200");
}

function auditLlmsTxt(site, pages, ctx) {
  const r = site.llms;
  if (!r || r.status !== 200 || !r.body || /<html/i.test(r.body)) {
    bad("geo", "llms.exists", "P1", "Sem /llms.txt", "É o mapa que você entrega pronto pra ChatGPT/Perplexity/Claude: quem você é, o que vende, onde está cada coisa. Sem ele a IA monta esse mapa sozinha — e erra.");
    return;
  }
  const body = r.body;
  ok("geo", "llms.exists", "P1", "/llms.txt existe");

  const h1 = (body.match(/^#\s+(.+)$/m) || [, ""])[1].trim();
  const quote = (body.match(/^>\s*([\s\S]*?)(?:\n\n|\n#)/m) || [, ""])[1].replace(/\n>\s?/g, " ").trim();

  if (args.brand && h1 && norm(h1) !== norm(args.brand)) {
    bad("marca", "llms.h1", "P1", `H1 do llms.txt ("${h1}") ≠ marca declarada ("${args.brand}")`, "O primeiro token que a IA lê tem que ser exatamente o nome da marca.");
  } else if (h1) ok("marca", "llms.h1", "P1", "H1 do llms.txt bate com a marca");

  // O resumo é O ponto onde o texto do molde sobrevive — checar contra resíduo E setor.
  const qn = norm(quote);
  const residue = forbiddenTerms(ctx.canonicalHost).filter((t) => qn.includes(norm(t)));
  const sectorHit = args.sector ? norm(args.sector).split(" ").filter((w) => w.length > 4).some((w) => qn.includes(w)) : null;

  if (!quote) bad("geo", "llms.summary", "P1", "llms.txt sem blockquote de resumo", "O `> resumo` é a frase que a IA repete quando alguém pergunta 'quem é X'.");
  else if (residue.length) bad("marca", "llms.summary", "P0", `Resumo do llms.txt descreve OUTRO negócio (resíduo: ${residue.join(", ")})`, `Texto no ar: "${quote.slice(0, 200)}"`);
  else if (sectorHit === false) bad("marca", "llms.summary", "P1", `Resumo do llms.txt não menciona o setor declarado ("${args.sector}")`, `Texto no ar: "${quote.slice(0, 200)}"`);
  else ok("geo", "llms.summary", "P1", "llms.txt tem resumo coerente com a marca");

  // seções vazias — heading sem item embaixo
  const sections = [...body.matchAll(/^##\s+(.+)$/gm)].map((m, i, all) => {
    const start = m.index + m[0].length;
    const end = i + 1 < all.length ? all[i + 1].index : body.length;
    const chunk = body.slice(start, end);
    return { name: m[1].trim(), items: (chunk.match(/^\s*-\s+/gm) || []).length };
  });
  const empty = sections.filter((s) => s.items === 0);
  if (empty.length) bad("geo", "llms.emptysections", "P1", `llms.txt com seção(ões) vazia(s): ${empty.map((s) => s.name).join(", ")}`, "Heading sem item nenhum diz pra IA que a oferta existe mas não tem prova — pior do que não ter a seção.");
  else if (sections.length) ok("geo", "llms.emptysections", "P1", "Nenhuma seção vazia no llms.txt");

  // host dos links
  const hrefs = [...body.matchAll(/\((https?:\/\/[^)\s]+)\)/g)].map((m) => m[1]);
  if (!ctx.canonicalHost) {
    // Sem host canônico conhecido (auditoria local sem --base) não existe com o
    // que comparar. Comparar contra `null` acusaria 100% dos links — o falso
    // positivo mais fácil de cometer e o mais rápido de destruir a confiança.
    skip("seo_tecnico", "llms.host", "P1", "Host dos links do llms.txt não verificado",
      "Auditoria local sem --base: não há host canônico pra comparar. Rode com --base <url pública>.");
  } else {
    const hostMismatch = hrefs.filter((h) => { try { return new URL(h).host !== ctx.canonicalHost; } catch { return true; } });
    if (hostMismatch.length) bad("seo_tecnico", "llms.host", "P1", `${hostMismatch.length}/${hrefs.length} link(s) do llms.txt usam host diferente do canônico (${ctx.canonicalHost})`, hostMismatch.slice(0, 3).join(" · "));
    else if (hrefs.length) ok("seo_tecnico", "llms.host", "P1", "Links do llms.txt no host canônico");
  }

  // páginas descritas com texto genérico do molde
  const genericDesc = [...body.matchAll(/^\s*-\s+\[[^\]]+\]\([^)]+\):\s*(.+)$/gm)].map((m) => m[1].trim());
  const suspicious = genericDesc.filter((d) => /portfólio de trabalhos|relatórios de tendências|a agência, o time/i.test(d));
  if (suspicious.length) bad("marca", "llms.genericdesc", "P1", `${suspicious.length} descrição(ões) de página herdadas do molde`, suspicious.slice(0, 3).join(" | "));
  site.llmsParsed = { h1, quote, sections, links: hrefs.length };
}

async function auditHostConsistency(rootUrl) {
  const root = new URL(rootUrl);
  const other = root.host.startsWith("www.") ? root.host.slice(4) : `www.${root.host}`;
  const variants = [
    { label: "http", url: `http://${root.host}/` },
    { label: "host alternativo", url: `https://${other}/` },
  ];
  for (const v of variants) {
    const r = await fetchChain(v.url);
    if (r.error) { skip("seo_tecnico", `host.${v.label}`, "P1", `Não deu pra testar ${v.label}`, r.error); continue; }
    const last = r.chain[r.chain.length - 1];
    const landed = new URL(r.url);
    if (landed.host === root.host && landed.protocol === "https:") ok("seo_tecnico", `host.${v.label}`, "P1", `${v.label} redireciona pro canônico`);
    else if (last && last.status === 404) ok("seo_tecnico", `host.${v.label}`, "P1", `${v.label} não existe (404) — sem duplicidade`);
    else bad("seo_tecnico", `host.${v.label}`, "P1", `${v.label} não converge pro host canônico`, `Terminou em ${r.url} (${last && last.status})`);
  }
  // soft-404
  const r404 = await fetchChain(new URL(`/pagina-que-nao-existe-${Date.now()}`, root).toString());
  if (r404.status === 404 || r404.status === 410) ok("seo_tecnico", "soft404", "P1", "URL inexistente devolve 404");
  else if (r404.status) bad("seo_tecnico", "soft404", "P1", `URL inexistente devolve ${r404.status} (soft-404)`, "O Google indexa lixo e dilui o site.");
}

// ---- A3 · medir de verdade as imagens principais ---------------------------
async function auditMainImages(pages, concurrency) {
  const alvos = [];
  const vistos = new Set();
  for (const p of pages) {
    for (const im of (p.mainImages || [])) {
      if (vistos.has(im.url)) continue;
      vistos.add(im.url);
      alvos.push({ ...im, page: p.url });
    }
  }
  if (!alvos.length) {
    skip("seo_tecnico", "img.mainsize", "P1", "Nenhuma imagem principal declarada nas páginas auditadas",
      "Sem og:image nem imagem no schema, não há candidata a card grande pra medir.");
    return;
  }
  const medidas = await pool(alvos, concurrency, async (a) => {
    const r = await fetchImageHead(a.url);
    if (r.error) return { ...a, error: r.error };
    const size = imageSize(r.buf);
    return { ...a, size };
  });
  const quebradas = medidas.filter((m) => m.error);
  const pequenas = medidas.filter((m) => m.size && m.size.w !== Infinity && m.size.w < 1200);
  const ilegiveis = medidas.filter((m) => !m.error && !m.size);

  if (quebradas.length) {
    bad("seo_tecnico", "img.reachable", "P1", `${quebradas.length} imagem(ns) principal(is) não carregam`,
      "og:image ou imagem do schema apontando pra endereço quebrado: o link compartilhado sai sem imagem e o card grande não existe.",
      quebradas.slice(0, 4).map((m) => `${m.url} → ${m.error}`).join("\n"));
  } else ok("seo_tecnico", "img.reachable", "P1", `${medidas.length} imagem(ns) principal(is) carregam`);

  if (pequenas.length) {
    bad("seo_tecnico", "img.mainsize", "P1", `${pequenas.length} imagem(ns) principal(is) com menos de 1200px de largura`,
      "Abaixo de 1200px o Google não serve o card de imagem grande — nem com `max-image-preview:large` no lugar. É medido no ARQUIVO, não no atributo width do HTML (que só diz como a imagem é exibida).",
      pequenas.slice(0, 5).map((m) => `${m.size.w}×${m.size.h} (${m.size.type}) · ${m.origem} · ${m.url}`).join("\n"));
  } else if (medidas.some((m) => m.size)) {
    ok("seo_tecnico", "img.mainsize", "P1", "Imagens principais com 1200px+ de largura");
  }
  if (ilegiveis.length) {
    skip("seo_tecnico", "img.format", "P2", `${ilegiveis.length} imagem(ns) em formato não medido`,
      `Formato fora de PNG/JPEG/GIF/WebP/SVG: ${ilegiveis.slice(0, 3).map((m) => m.url).join(" · ")}. Confira o tamanho à mão.`);
  }
}

// ---- A4/A5 · tudo que é declarado tem que responder; blog pede feed --------
async function auditFeedsAndSitemaps(site, pages, ctx) {
  const declaradosRobots = [];
  if (site.robots) for (const m of site.robots.matchAll(/^\s*sitemap:\s*(\S+)/gim)) declaradosRobots.push(m[1].trim());
  const declaradosHtml = [...new Set(pages.flatMap((p) => p.feeds || []))];
  const todos = [...new Set([...declaradosRobots, ...declaradosHtml])];

  if (todos.length) {
    const checados = await pool(todos, 4, async (u) => {
      const r = await fetchChain(u);
      return { url: u, status: r.status || null, error: r.error || null, body: (r.body || "").slice(0, 400) };
    });
    const mortos = checados.filter((c) => c.status !== 200);
    if (mortos.length) {
      // Cicatriz: um sitemap.rss submetido no Search Console devolvia 404 desde
      // abril. Três meses de erro silencioso — nada no site apontava pra ele, só
      // o painel do Google sabia. Declarar e não servir é pior que não declarar.
      bad("seo_tecnico", "feeds.alive", "P1", `${mortos.length} sitemap/feed declarado(s) que não respondem 200`,
        "Endereço declarado no robots.txt ou no <head> e que não existe. O Google tenta, falha, e o erro fica só no painel dele — no site nada aparece quebrado.",
        mortos.map((m) => `${m.url} → ${m.error || `HTTP ${m.status}`}`).join("\n"));
    } else ok("seo_tecnico", "feeds.alive", "P1", `${todos.length} sitemap/feed declarado(s), todos respondendo 200`);
    site.feedsChecked = checados.map(({ body, ...rest }) => rest);
  } else skip("seo_tecnico", "feeds.alive", "P1", "Nenhum sitemap ou feed declarado", "Nada a verificar.");

  // A5 · feed só é cobrado onde há conteúdo datado. Landing de uma página não
  // precisa de RSS, e sugerir isso queima a confiança no resto do relatório.
  const temPosts = pages.some((p) => p.isPost);
  if (!temPosts) {
    skip("geo", "feed.rss", "P2", "Feed RSS não avaliado", "O site não tem conteúdo datado nas páginas auditadas — feed só faz sentido com blog ou publicação recorrente.");
    return;
  }
  if (declaradosHtml.length) {
    ok("geo", "feed.rss", "P2", "Blog com feed declarado no <head>");
    return;
  }
  const candidatos = ["/feed", "/rss.xml", "/feed.xml", "/index.xml", "/atom.xml", "/blog/feed"];
  let achado = null;
  for (const c of candidatos) {
    try {
      const r = await fetchChain(new URL(c, `https://${ctx.canonicalHost}`).toString());
      if (r.status === 200 && /<(rss|feed)\b/i.test(r.body || "")) { achado = r.url; break; }
    } catch {}
  }
  if (achado) {
    bad("geo", "feed.rss", "P2", "Feed existe mas não é declarado na página",
      `Encontrei ${achado}, mas nenhuma página tem <link rel="alternate" type="application/rss+xml">. Leitor e agregador não acham o feed sozinhos.`);
  } else {
    bad("geo", "feed.rss", "P2", "Blog sem feed RSS",
      "Feed é como leitor, agregador e o Perplexity descobrem que você publicou algo novo — e frescor é critério de citação. Se gerar: RSS 2.0 com `pubDate` em RFC822, `guid` de permalink, `atom:link rel=self`, mais o `<link rel=alternate>` na página e a linha `Sitemap:` no robots.txt. Armadilha: feed desatualizado é pior que feed nenhum, então ele tem que ser regerado no mesmo passo que publica.");
  }
}

function auditSecurityHeaders(pages) {
  const withHeaders = pages.filter((p) => p.headers);
  if (!withHeaders.length) { skip("codigo", "sec.headers", "P2", "Headers não medidos", "Auditoria local (--dir) não vê headers HTTP."); return; }
  const h = withHeaders[0].headers;
  const table = [
    ["x-content-type-options", h.xcto, "P2", "Impede o browser de adivinhar o tipo do arquivo (ataque de MIME sniffing)."],
    ["referrer-policy", h.referrer, "P2", "Controla o que vaza da sua URL quando alguém clica num link externo."],
    ["strict-transport-security", h.hsts, "P2", "Força HTTPS nas próximas visitas, antes mesmo do primeiro request."],
    ["content-security-policy", h.csp, "P2", "Limita de onde script pode carregar — a rede contra injeção de terceiro."],
  ];
  for (const [name, val, sev, why] of table) {
    if (val) ok("codigo", `sec.${name}`, sev, `Header ${name} presente`);
    else bad("codigo", `sec.${name}`, sev, `Sem header ${name}`, why);
  }
}

// ------------------------------------------------------------ repo scan -----
const CODE_RULES = [
  { id: "env.required", sev: "P1", axis: "codigo", re: /process\.env\.([A-Z0-9_]*(?:API_KEY|TOKEN|SECRET)[A-Z0-9_]*)/g,
    title: "Feature exige chave de API",
    why: "Toda chave que o código exige é uma conta a mais (e uma fatura a mais) pro dono do site. Se a feature não foi pedida, ela deveria ser removida ou desligada por padrão — não virar pré-requisito de setup." },
  { id: "client.secret", sev: "P0", axis: "codigo", re: /NEXT_PUBLIC_[A-Z0-9_]*(?:KEY|SECRET|TOKEN)[A-Z0-9_]*/g,
    title: "Segredo exposto no bundle do cliente",
    why: "Tudo com prefixo NEXT_PUBLIC_ vai pro JavaScript que o navegador baixa. Qualquer visitante lê." },
  { id: "html.injection", sev: "P1", axis: "codigo", re: /dangerouslySetInnerHTML|v-html|\.innerHTML\s*=/g,
    title: "HTML injetado sem sanitização aparente",
    why: "Se a string vier de CMS ou input, vira XSS." },
  { id: "cdn.external", sev: "P1", axis: "codigo", re: /<script[^>]+src=["']https?:\/\/(?!\S*(?:localhost|127\.0\.0\.1))/g,
    title: "Script de CDN externo",
    why: "CDN de terceiro é ponto de falha e de vazamento que você não controla — e CSP costuma barrar em silêncio." },
  // Script de build/CLI existe pra imprimir na tela — logar ali não é sujeira.
  // Sem essa exceção o achado vira alarme falso e some com os P0 de verdade.
  { id: "debug.left", sev: "P2", axis: "codigo", re: /console\.(log|debug)\(/g,
    skipPath: /(^|\/)(scripts|bin|tools|tests?|__tests__)\//i,
    title: "console.log esquecido em código de aplicação" },
  { id: "todo.left", sev: "P2", axis: "codigo", re: /\b(TODO|FIXME|HACK|XXX):/g,
    title: "TODO/FIXME no código publicado" },
];

function scanRepo(repoDir) {
  const hits = {};
  const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "dist", "build", "out", "coverage", ".vercel", "vendor"]);
  const files = [];
  const walk = (d, depth = 0) => {
    if (depth > 8) return;
    let entries; try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (SKIP_DIRS.has(e.name) || e.name.startsWith(".")) continue;
      const full = path.join(d, e.name);
      if (e.isDirectory()) walk(full, depth + 1);
      else if (/\.(ts|tsx|js|jsx|mjs|cjs|vue|svelte|astro)$/i.test(e.name)) files.push(full);
    }
  };
  walk(repoDir);

  for (const f of files) {
    let src; try { src = fs.readFileSync(f, "utf8"); } catch { continue; }
    const rel = path.relative(repoDir, f).replace(/\\/g, "/");
    for (const rule of CODE_RULES) {
      if (rule.skipPath && rule.skipPath.test(rel)) continue;
      rule.re.lastIndex = 0;
      const found = [...src.matchAll(rule.re)];
      if (!found.length) continue;
      (hits[rule.id] ||= { rule, files: [] }).files.push({
        file: path.relative(repoDir, f).replace(/\\/g, "/"),
        count: found.length,
        sample: [...new Set(found.map((m) => m[1] || m[0]))].slice(0, 3),
      });
    }
    // ---- formulário-fantasma: o defeito mais caro que um site pode ter -------
    // Um <form> cujo componente inteiro não contém NENHUM destino (fetch, action,
    // mailto, server action, SDK de captura) e ainda assim mostra mensagem de
    // sucesso. A pessoa preenche, lê "recebemos sua mensagem", e o lead evapora.
    // Ninguém reclama, porque quem enviou acha que enviou.
    if (/<form\b/.test(src)) {
      const DESTINO = /(fetch\s*\(|axios|action\s*=\s*["'{]|mailto:|"use server"|useFormState|useActionState|formspree|emailjs|supabase|sendGAEvent|\.submit\(\)|netlify|getform|web3forms|resend|nodemailer|sendgrid|hubspot|\$\.post|XMLHttpRequest)/i;
      const SUCESSO = /(setDone|setSent|setSubmitted|setSuccess|setEnviado|obrigad|recebemos|sucesso|em breve|thank you|success)/i;
      if (!DESTINO.test(src) && SUCESSO.test(src)) {
        (hits["form.fake"] ||= { rule: { id: "form.fake", sev: "P0", axis: "medicao", title: "Formulário que finge enviar", why: "O componente tem <form> e mostra mensagem de sucesso, mas não existe nenhum destino no arquivo — nem fetch, nem action, nem server action, nem serviço de e-mail. Todo mundo que preencheu leu 'recebemos sua mensagem' e ninguém recebeu nada. É invisível: quem enviou acha que enviou, e o dono do site acha que ninguém procurou." }, files: [] })
          .files.push({ file: rel, count: 1, sample: [(src.match(/onSubmit[\s\S]{0,120}/) || [""])[0].replace(/\s+/g, " ").slice(0, 120)] });
      } else if (!DESTINO.test(src)) {
        (hits["form.nodest"] ||= { rule: { id: "form.nodest", sev: "P1", axis: "medicao", title: "Formulário sem destino visível no arquivo", why: "Pode estar recebendo o destino por prop ou por componente-pai — confirme manualmente pra onde o lead vai." }, files: [] })
          .files.push({ file: rel, count: 1, sample: ["<form> sem fetch/action no arquivo"] });
      }
    }

    // prosa longa hardcoded dentro de componente = o texto do molde que ninguém
    // troca porque não está no config nem no CMS.
    for (const m of src.matchAll(/["'`]([^"'`\n]{140,})["'`]/g)) {
      const s = m[1];
      if (!/[.!?]/.test(s)) continue;
      if (/^[\w./-]+$/.test(s)) continue;
      if (SELF_DESC.test(s)) {
        (hits["prose.hardcoded"] ||= { rule: { id: "prose.hardcoded", sev: "P1", axis: "marca", title: "Texto de negócio cravado no código", why: "Copy que descreve a empresa dentro de componente não passa pelo CMS nem pelo config — é exatamente onde o texto do molde sobrevive à troca de marca." }, files: [] })
          .files.push({ file: path.relative(repoDir, f).replace(/\\/g, "/"), count: 1, sample: [s.slice(0, 160)] });
      }
    }
  }

  for (const { rule, files: fl } of Object.values(hits)) {
    const total = fl.reduce((a, x) => a + x.count, 0);
    bad(rule.axis, `code.${rule.id}`, rule.sev, `${rule.title} (${total}× em ${fl.length} arquivo(s))`,
      rule.why || "", fl.slice(0, 6).map((x) => `${x.file}: ${x.sample.join(" · ")}`).join("\n"));
  }
  const clean = CODE_RULES.filter((r) => !hits[r.id]);
  for (const r of clean) ok(r.axis, `code.${r.id}`, r.sev, `Sem ocorrência: ${r.title}`);
  return { filesScanned: files.length };
}

// --------------------------------------------------------------- score ------
function score() {
  const per = {};
  for (const key of Object.keys(AXES)) {
    const fs_ = findings.filter((f) => f.axis === key && f.status !== "skip");
    const total = fs_.reduce((a, f) => a + WEIGHT[f.severity], 0);
    const got = fs_.filter((f) => f.status === "pass").reduce((a, f) => a + WEIGHT[f.severity], 0);
    const p0 = fs_.filter((f) => f.status === "fail" && f.severity === "P0").length;
    per[key] = {
      label: AXES[key],
      score: total ? Math.round((got / total) * 100) : null,
      checks: fs_.length,
      failed: fs_.filter((f) => f.status === "fail").length,
      p0,
      skipped: findings.filter((f) => f.axis === key && f.status === "skip").length,
    };
  }
  const measured = Object.values(per).filter((x) => x.score !== null);
  const overall = measured.length ? Math.round(measured.reduce((a, x) => a + x.score, 0) / measured.length) : null;
  const p0Total = Object.values(per).reduce((a, x) => a + x.p0, 0);
  return { per, overall, p0Total, gate: p0Total === 0 && measured.every((x) => x.score >= 90) };
}

// -------------------------------------------------------------- report ------
function writeReports(outDir, payload) {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "audit-report.json"), JSON.stringify(payload, null, 2), "utf8");

  const { scores, findings: fnd, pages, meta } = payload;
  const L = [];
  L.push(`# Auditoria — ${meta.target}`);
  L.push("");
  L.push(`> Rodada ${meta.round} · ${meta.timestamp} · ${pages.length} página(s) auditada(s).`);
  L.push("");
  L.push(`**Nota geral: ${scores.overall ?? "não medido"}/100** · P0 abertos: **${scores.p0Total}** · Gate (todos ≥90 e zero P0): ${scores.gate ? "✅ PASSOU" : "❌ NÃO PASSOU"}`);
  L.push("");
  L.push("| Eixo | Nota | Checks | Falhas | P0 | Não medidos |");
  L.push("|---|---:|---:|---:|---:|---:|");
  for (const v of Object.values(scores.per)) {
    L.push(`| ${v.label} | ${v.score ?? "—"} | ${v.checks} | ${v.failed} | ${v.p0} | ${v.skipped} |`);
  }
  L.push("");

  for (const sev of ["P0", "P1", "P2"]) {
    const list = fnd.filter((f) => f.status === "fail" && f.severity === sev);
    if (!list.length) continue;
    L.push(`## ${sev} — ${sev === "P0" ? "quebra ou engana (corrigir primeiro)" : sev === "P1" ? "custa ranking e citação" : "polimento"} (${list.length})`);
    L.push("");
    for (const f of list) {
      L.push(`### ${f.title}`);
      L.push(`*Eixo: ${AXES[f.axis]} · id: \`${f.id}\`*`);
      if (f.detail) L.push("", f.detail);
      if (f.evidence) L.push("", "```", String(f.evidence).slice(0, 900), "```");
      L.push("");
    }
  }

  const pageIssues = pages.filter((p) => p.issues && p.issues.length);
  if (pageIssues.length) {
    L.push("## Achados por página");
    L.push("");
    for (const p of pageIssues) {
      L.push(`### ${p.url}`);
      L.push(`\`${p.words} palavras · title ${p.title ? p.title.length + " chars" : "AUSENTE"} · H1 ${p.headings ? p.headings.filter((h) => h.lvl === 1).length : "?"} · JSON-LD ${p.jsonld ? p.jsonld.types.join(",") || "nenhum" : "?"}\``);
      for (const i of p.issues) L.push(`- **${i.severity}** — ${i.msg}${i.evidence ? `\n  > \`${String(i.evidence).slice(0, 220)}\`` : ""}`);
      if (p.selfDescribing && p.selfDescribing.length) {
        L.push(`- *Frases auto-descritivas a conferir (o molde sobrevive aqui):*`);
        for (const s of p.selfDescribing.slice(0, 4)) L.push(`  - "${s.slice(0, 200)}"`);
      }
      L.push("");
    }
  }

  const skipped = fnd.filter((f) => f.status === "skip");
  if (skipped.length) {
    L.push("## Não medido (honestidade: fora do denominador, não conta como falha)");
    L.push("");
    for (const f of skipped) L.push(`- \`${f.id}\` — ${f.title}${f.detail ? `: ${f.detail}` : ""}`);
    L.push("");
  }

  fs.writeFileSync(path.join(outDir, "AUDITORIA.md"), L.join("\n"), "utf8");
}

// ----------------------------------------------------------------- main -----
(async function main() {
  const t0 = Date.now();
  const outDir = path.resolve(args.out);
  let pages = [];
  let site = {};
  let ctx = { canonicalHost: null };

  if (args.url) {
    const root = new URL(args.url);
    ctx.canonicalHost = root.host;
    console.error(`→ descobrindo URLs em ${root.origin} …`);
    const d = await discoverFromWeb(args.url, args.max);
    site = d.site;
    console.error(`→ ${d.urls.length} URL(s) na fila. Auditando …`);
    const results = await pool(d.urls, args.concurrency, async (u) => {
      const r = await fetchChain(u);
      if (r.error) return { url: u, error: r.error, issues: [{ severity: "P0", msg: `Falha ao buscar: ${r.error}` }] };
      if (r.status !== 200) return { url: u, status: r.status, chain: r.chain, issues: [{ severity: r.status >= 400 ? "P0" : "P1", msg: `HTTP ${r.status}${r.chain.length > 1 ? ` após ${r.chain.length - 1} redirect(s)` : ""}` }] };
      const p = auditPage(r.url, r.body, r.headers, ctx);
      p.status = 200; p.redirects = r.chain.length - 1;
      if (p.redirects > 0) p.issues.push({ severity: "P2", msg: `URL do sitemap redireciona (${p.redirects} hop) — aponte o sitemap pra URL final` });
      return p;
    });
    pages = results;
    auditRobots(site);
    auditSitemap(site, pages);
    auditLlmsTxt(site, pages, ctx);
    await auditHostConsistency(args.url);
    await auditFeedsAndSitemaps(site, pages, ctx);
    await auditMainImages(pages, args.concurrency);
    auditSecurityHeaders(pages);
  } else {
    const dir = path.resolve(args.dir);
    if (args.base) { try { ctx.canonicalHost = new URL(args.base).host; } catch {} }
    const files = discoverFromDir(dir, args.max);
    console.error(`→ ${files.length} arquivo(s) HTML em ${dir}. Auditando …`);
    pages = files.map((f) => {
      const html = fs.readFileSync(f, "utf8");
      const p = auditPage(args.base ? new URL(path.relative(dir, f).replace(/\\/g, "/"), args.base).toString() : `file://${f.replace(/\\/g, "/")}`, html, null, ctx);
      p.file = path.relative(dir, f).replace(/\\/g, "/");
      return p;
    });
    for (const name of ["robots.txt", "sitemap.xml", "llms.txt"]) {
      const fp = path.join(dir, name);
      const exists = fs.existsSync(fp);
      if (name === "llms.txt") {
        if (exists) { site.llms = { status: 200, body: fs.readFileSync(fp, "utf8") }; auditLlmsTxt(site, pages, ctx); }
        else bad("geo", "llms.exists", "P1", "Sem llms.txt na pasta", "É o mapa que você entrega pronto pras IAs.");
      } else if (exists) ok("seo_tecnico", `file.${name}`, "P1", `${name} presente`);
      else bad("seo_tecnico", `file.${name}`, "P1", `Sem ${name}`, "");
    }
    skip("seo_tecnico", "host.redirects", "P1", "Redirects de host não medidos", "Auditoria local não testa apex×www.");
    skip("seo_tecnico", "feeds.alive", "P1", "Sitemap/feed não verificados por HTTP", "Auditoria local não consegue provar que o endereço declarado responde 200 — rode com --url depois de publicar.");
    if (args.base) await auditMainImages(pages, args.concurrency);
    else skip("seo_tecnico", "img.mainsize", "P1", "Dimensão das imagens principais não medida", "Passe --base <url pública> pra resolver os endereços das imagens.");
    auditSecurityHeaders(pages);
  }

  // --- agregações cross-página (só fazem sentido com o conjunto na mão) ---
  const live = pages.filter((p) => p.status === 200 || p.file);
  if (live.length > 1) {
    const dupTitles = {}, dupDescs = {};
    for (const p of live) {
      if (p.title) (dupTitles[norm(p.title)] ||= []).push(p.url);
      if (p.description) (dupDescs[norm(p.description)] ||= []).push(p.url);
    }
    const dt = Object.values(dupTitles).filter((v) => v.length > 1);
    const dd = Object.values(dupDescs).filter((v) => v.length > 1);
    if (dt.length) bad("seo_conteudo", "dup.title", "P1", `${dt.length} grupo(s) de páginas com <title> idêntico`, "Título repetido faz as páginas competirem entre si pela mesma query.", dt.slice(0, 3).map((g) => g.join(" · ")).join("\n"));
    else ok("seo_conteudo", "dup.title", "P1", "Títulos únicos entre as páginas auditadas");
    if (dd.length) bad("seo_conteudo", "dup.desc", "P2", `${dd.length} grupo(s) com meta description idêntica`, "", dd.slice(0, 3).map((g) => g.join(" · ")).join("\n"));
    else ok("seo_conteudo", "dup.desc", "P2", "Descriptions únicas");

    // órfãs
    const linkedTo = new Set();
    for (const p of live) for (const l of (p.links?.internal || [])) linkedTo.add(l.replace(/\/$/, ""));
    const orphans = live.filter((p) => p.url && !linkedTo.has(p.url.replace(/\/$/, "")) && !/\/(pt|en)?\/?$/.test(new URL(p.url, "https://x").pathname));
    if (orphans.length) bad("seo_tecnico", "orphans", "P1", `${orphans.length} página(s) sem link interno apontando pra ela`, "Página órfã recebe pouca autoridade e é rastreada por último.", orphans.slice(0, 5).map((p) => p.url).join(" · "));
    else ok("seo_tecnico", "orphans", "P1", "Nenhuma órfã entre as páginas auditadas");
  }

  // Roll-up dos achados por página pros eixos (o score precisa vê-los).
  const sevOf = { P0: 0, P1: 0, P2: 0 };
  for (const p of pages) for (const i of (p.issues || [])) sevOf[i.severity]++;
  const bucket = (id, axis, sev, count, title) => {
    if (count) bad(axis, id, sev, `${title} (${count} ocorrência(s) nas páginas)`, "Detalhe por página na seção 'Achados por página'.");
    else ok(axis, id, sev, `Nenhum achado ${sev} de página`);
  };
  const byMsg = (re) => pages.reduce((a, p) => a + (p.issues || []).filter((i) => re.test(i.msg)).length, 0);
  // P0 estruturais = tudo menos resíduo e placeholder, que já têm balde próprio no eixo de marca.
  const structuralP0 = pages.reduce((a, p) => a + (p.issues || [])
    .filter((i) => i.severity === "P0" && !/Resíduo|Placeholder/.test(i.msg)).length, 0);
  bucket("page.p0", "seo_tecnico", "P0", structuralP0, "Falhas P0 estruturais de página");
  bucket("page.residue", "marca", "P0", byMsg(/se DESCREVE com termos de outra marca/), "O site se descreve com termos de outra marca");
  bucket("page.mencao", "marca", "P1", byMsg(/Menção a marca de terceiro/), "Menções a marca de terceiro a conferir");
  bucket("page.placeholder", "marca", "P0", byMsg(/Placeholder\/lorem/), "Placeholder visível");
  bucket("page.bluf", "geo", "P1", byMsg(/BLUF/), "Páginas sem BLUF extraível");
  bucket("page.qheadings", "geo", "P1", byMsg(/pergunta/), "Páginas sem heading em forma de pergunta");
  bucket("page.schema", "geo", "P1", byMsg(/JSON-LD|schema|Organization/), "Problemas de schema/entidade");
  bucket("page.thin", "seo_conteudo", "P1", byMsg(/magra|sem conteúdo/), "Páginas finas ou com seção vazia");
  bucket("page.alt", "codigo", "P1", byMsg(/sem atributo alt/), "Imagens sem alt");
  bucket("page.meta", "seo_conteudo", "P1", byMsg(/<title>|meta description|canonical/), "Problemas de title/description/canonical");
  const tables = live.filter((p) => p.hasTable || p.hasList).length;
  if (live.length) {
    if (tables / live.length >= 0.5) ok("geo", "structured.data", "P1", "Metade ou mais das páginas usa tabela/lista (formato que a IA levanta inteiro)");
    else bad("geo", "structured.data", "P1", `Só ${tables}/${live.length} páginas usam tabela ou lista`, "Conteúdo comparativo ou enumerável em tabela/lista tem chance bem maior de ser citado — a IA reconhece como dado, não como prosa.");
  }
  // ---- a medição pode estar escondida num .js do próprio site --------------
  // Só vale a pena buscar quando o HTML não revelou nada. É uma rodada extra de
  // rede pra não cometer o erro mais caro que este auditor pode cometer: dizer
  // "você não tem medição" pra quem tem.
  let analyticsEmScript = [];
  const jaTemNoHtml = live.some((p) => (p.analytics || []).length);
  if (live.length && !jaTemNoHtml && args.url) {
    const srcs = [...new Set(live.flatMap((p) => p.scriptSrcs || []))].slice(0, 12);
    const SINAIS = [
      { id: "GA4 / Google Tag", re: /\b(G[T]?-[A-Z0-9]{6,})\b/ },
      { id: "Google Tag Manager", re: /\b(GTM-[A-Z0-9]{4,})\b/ },
      { id: "Plausible", re: /plausible\.io\/js/ },
      { id: "Umami", re: /umami\.[a-z.]+\/script/ },
      { id: "Microsoft Clarity", re: /clarity\.ms\/tag/ },
      { id: "Meta Pixel", re: /fbevents|fbq\(/ },
    ];
    const lidos = await pool(srcs, 4, async (u) => {
      const r = await fetchChain(u);
      return { u, body: (r.body || "").slice(0, 200000) };
    });
    for (const { u, body } of lidos) {
      if (!body) continue;
      for (const s of SINAIS) {
        const m = body.match(s.re);
        if (m) analyticsEmScript.push({ id: `${s.id} (${m[1] || "detectado"})`, arquivo: u.split("/").pop() });
      }
    }
    analyticsEmScript = analyticsEmScript.filter((x, i, a) => a.findIndex((y) => y.id === x.id) === i);
  }

  // ---- medição, no nível do site (uma conclusão só, não uma por página) -----
  if (live.length) {
    const tools = [...new Set(live.flatMap((p) => (p.analytics || []).map((a) => a.tool)))];
    const cobertura = live.filter((p) => (p.analytics || []).length).length;
    if (!tools.length && analyticsEmScript.length) {
      // Achado no arquivo .js do próprio site: está instalado, só carrega depois.
      ok("medicao", "analytics.installed", "P0", `Medição instalada via script do site: ${analyticsEmScript.map((x) => x.id).join(", ")}`);
      bad("medicao", "analytics.deferred", "P2", "Medição carrega por JavaScript, não pelo HTML",
        `Encontrada em ${analyticsEmScript.map((x) => x.arquivo).join(", ")} — padrão normal de quem só ativa o contador depois do aceite de cookies (correto pela LGPD). O efeito colateral é que visitante que recusa cookies não é contado, então o número real de visitas é maior que o do relatório. Confirme no relatório Tempo real do Analytics que a coleta acontece de fato.`,
        analyticsEmScript.map((x) => `${x.arquivo}: ${x.id}`).join("\n"));
    } else if (!tools.length) {
      bad("medicao", "analytics.installed", "P0", "Nenhuma ferramenta de medição detectada",
        "Não foi encontrado Google Analytics, Tag Manager, Plausible, Umami nem qualquer outro contador — nem no HTML servido, nem nos scripts do próprio site. Ninguém sabe quantas pessoas visitam, de onde vêm, o que leem ou onde desistem. Todo o trabalho de SEO e GEO fica sem termômetro: dá pra melhorar o site, mas não dá pra saber se melhorou. É o primeiro item a resolver, e é grátis.");
    } else {
      ok("medicao", "analytics.installed", "P0", `Medição instalada: ${tools.join(", ")}`);
      if (cobertura < live.length) {
        bad("medicao", "analytics.coverage", "P1", `Medição presente em só ${cobertura}/${live.length} páginas auditadas`,
          "Página sem o código de medição é buraco cego no relatório — o visitante entra e some das estatísticas.");
      } else ok("medicao", "analytics.coverage", "P1", "Medição presente em todas as páginas auditadas");
      const ua = live.some((p) => (p.analytics || []).some((a) => /Universal/.test(a.tool)));
      if (ua) bad("medicao", "analytics.legacy", "P1", "Site ainda usa Google Analytics Universal (UA-)", "O Universal Analytics parou de coletar dados em 2023. Se é o único instalado, o site está sem medição de fato — migre pro GA4.");
    }
    const gsc = live.some((p) => p.searchConsoleTag);
    if (gsc) ok("medicao", "searchconsole.tag", "P2", "Etiqueta de verificação do Google Search Console presente");
    else skip("medicao", "searchconsole.tag", "P2", "Search Console não confirmado pelo HTML",
      "A verificação pode ter sido feita por DNS ou por arquivo, que não aparecem aqui. Confirme em search.google.com/search-console — é onde se vê o que as pessoas digitam pra chegar no site e quais páginas o Google indexou.");

    const comForm = live.filter((p) => (p.forms || []).some((f) => f.fields > 0));
    if (!comForm.length) {
      bad("medicao", "forms.exists", "P1", "Nenhum formulário encontrado nas páginas auditadas",
        "Sem formulário, o site informa mas não capta — todo visitante interessado precisa achar sozinho um telefone ou e-mail e tomar a iniciativa. É onde a maior parte some.");
    } else {
      ok("medicao", "forms.exists", "P1", `${comForm.length} página(s) com formulário`);
      const semAction = comForm.filter((p) => (p.forms || []).some((f) => f.fields > 0 && !f.action)).length;
      if (semAction && !args.repo) {
        bad("medicao", "forms.destination", "P1", `${semAction} página(s) com formulário sem destino declarado no HTML`,
          "O envio depende de JavaScript, e daqui não dá pra ver pra onde vai. Rode de novo com --repo <caminho do código> — é o único jeito de provar que o lead chega em algum lugar.");
      } else if (semAction) {
        ok("medicao", "forms.destination", "P1", "Destino dos formulários avaliado pela varredura de código (ver achados de código)");
      } else ok("medicao", "forms.destination", "P1", "Formulários com destino declarado no HTML");
    }
  }
  bucket("page.forms", "medicao", "P1", byMsg(/[Ff]ormulário/), "Problemas de formulário nas páginas");
  bucket("page.analytics", "medicao", "P1", byMsg(/Código de medição/), "Medição duplicada");
  const posts = live.filter((p) => p.isPost);
  if (posts.length) bucket("page.blog", "seo_conteudo", "P1", byMsg(/[Pp]ost (de blog )?sem/), "Problemas de schema/data/autor em post de blog");
  else skip("seo_conteudo", "page.blog", "P1", "Nenhum post de blog nas páginas auditadas", "Os checks específicos de blog (Article, autor, data) só rodam quando existe post.");

  const emdashPages = live.filter((p) => p.emdash).length;
  if (emdashPages) bad("seo_conteudo", "copy.emdash", "P2", `${emdashPages} página(s) com em-dash (—) no texto visível`, "Marcador de texto de IA — trocar por vírgula, dois-pontos ou parênteses.");
  else ok("seo_conteudo", "copy.emdash", "P2", "Sem em-dash no texto visível");

  if (args.repo) {
    console.error(`→ varrendo código em ${args.repo} …`);
    try { site.repo = scanRepo(path.resolve(args.repo)); }
    catch (e) { skip("codigo", "repo.scan", "P1", "Varredura de código falhou", String(e.message)); }
  } else {
    skip("codigo", "repo.scan", "P1", "Código não varrido", "Passe --repo <caminho> pra incluir a revisão de código.");
  }

  const scores = score();
  const payload = {
    meta: {
      target: args.url || path.resolve(args.dir),
      brand: args.brand || null, sector: args.sector || null,
      round: Number(args.round) || 1,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - t0,
      pagesAudited: pages.length,
      canonicalHost: ctx.canonicalHost,
    },
    scores, findings, pages, site,
  };
  writeReports(outDir, payload);

  console.log(`\n${"=".repeat(64)}`);
  console.log(`AUDITORIA · ${payload.meta.target}`);
  console.log("=".repeat(64));
  for (const v of Object.values(scores.per)) {
    console.log(`  ${String(v.label).padEnd(28)} ${String(v.score ?? "—").padStart(4)}/100   ${v.failed} falha(s)${v.p0 ? ` · ${v.p0} P0` : ""}${v.skipped ? ` · ${v.skipped} não medido` : ""}`);
  }
  console.log("-".repeat(64));
  console.log(`  NOTA GERAL ${String(scores.overall ?? "—").padStart(3)}/100 · P0 abertos: ${scores.p0Total} · Gate: ${scores.gate ? "PASSOU" : "NÃO PASSOU"}`);
  console.log(`\n  → ${path.join(outDir, "AUDITORIA.md")}\n  → ${path.join(outDir, "audit-report.json")}\n`);
})();
