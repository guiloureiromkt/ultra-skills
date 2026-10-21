#!/usr/bin/env node
// ============================================================================
// ultra-auditoria · smoke.mjs — prova que o auditor funciona ANTES de confiar
// nele. Monta um site de mentira com defeitos conhecidos, roda o audit.mjs em
// cima e confere duas coisas, que valem igual:
//
//   1. ACUSOU o que tem defeito   (sem isso o auditor dá falso conforto)
//   2. NÃO acusou o que está certo (sem isso ninguém lê o relatório até o fim)
//   3. Um site CORRETO atinge o gate (sem isso o loop nunca termina)
//
// Rode depois de mexer no audit.mjs, e rode uma vez antes da primeira auditoria
// de verdade — é 5 segundos e é a diferença entre "a ferramenta está boa" e
// "acho que está boa".
//
//   node smoke.mjs
// ============================================================================

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "ultra-auditoria-smoke-"));
const SITE = path.join(TMP, "site");
const REPO = path.join(TMP, "repo");
const OUT = path.join(TMP, "out");
fs.mkdirSync(SITE, { recursive: true });
fs.mkdirSync(path.join(REPO, "src"), { recursive: true });

// ---------------------------------------------------------------- fixtures --
// A página CERTA existe pra provar o outro lado: um auditor que só sabe acusar
// é tão inútil quanto um que nunca acusa.
fs.writeFileSync(path.join(SITE, "boa.html"), `<!doctype html>
<html lang="pt-BR"><head>
<title>Quanto custa uma reforma de cozinha em 2026</title>
<meta name="description" content="O custo medio de uma reforma de cozinha no Brasil em 2026, com faixa de preco por metro quadrado e onde da pra economizar sem perder qualidade.">
<meta name="robots" content="max-image-preview:large, max-snippet:-1">
<link rel="canonical" href="https://exemplo.com.br/boa.html">
<link rel="alternate" type="application/rss+xml" href="https://exemplo.com.br/feed.xml">
<meta property="og:title" content="Quanto custa uma reforma de cozinha"><meta property="og:description" content="Faixas de preco reais"><meta property="og:image" content="https://exemplo.com.br/capa.png"><meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"BlogPosting","headline":"Quanto custa uma reforma de cozinha em 2026","datePublished":"2026-07-01","dateModified":"2026-07-20","author":{"@type":"Person","name":"Fulana de Tal","url":"https://exemplo.com.br/autor/fulana"}}</script>
</head><body>
<main>
<h1>Quanto custa uma reforma de cozinha em 2026</h1>
<p>Uma reforma de cozinha no Brasil custa hoje entre R$ 1.200 e R$ 4.500 por metro quadrado, e a faixa depende quase toda de tres decisoes: bancada, marcenaria e hidraulica. Quem mantem o ponto de agua onde esta economiza cerca de um terco do orcamento total, segundo levantamento do Sinduscon de 2026.</p>
<h2>O que entra na faixa mais barata?</h2>
<p>Na faixa de R$ 1.200 o metro estao acabamentos de linha popular e marcenaria modulada pronta.</p>
<table><tr><th>Faixa</th><th>Preco/m2</th></tr><tr><td>Popular</td><td>R$ 1.200</td></tr></table>
<p>Marcenaria modulada pronta sai por volta de R$ 900 o metro linear em loja de rede, contra R$ 2.100 na marcenaria sob medida. A diferenca de preco esta menos no material e mais no aproveitamento do espaco: modulo pronto vem em medida fixa, entao sobra vao morto em cozinha fora do padrao. Em apartamento novo, com planta retangular, a modulada resolve. Em imovel antigo, com parede torta e pe-direito alto, o sob medida costuma se pagar.</p>
<h2>Vale a pena mudar a hidraulica de lugar?</h2>
<p>Mudar o ponto de agua acrescenta de 20% a 30% ao orcamento, porque envolve quebrar contrapiso, refazer impermeabilizacao e esperar a cura antes de assentar o revestimento. O custo direto do encanamento e baixo; o que pesa e o tempo de obra parada e o retrabalho de acabamento em volta.</p>
<p>Na pratica, so compensa quando a cozinha atual tem um problema de circulacao real, do tipo geladeira que nao abre por causa da bancada. Se o incomodo e so estetico, a mesma verba aplicada em bancada e iluminacao muda mais a percepcao do ambiente do que mover a pia meio metro.</p>
<p>O metodo: comprar tudo antes e medir a marcenaria por ultimo. Esta frase esta no teste de proposito: a palavra antes dos dois pontos termina nas mesmas quatro letras do marcador de rascunho em ingles, e isso ja fez o auditor acusar rascunho onde nao havia.</p>
<h2>Quanto tempo demora uma reforma de cozinha?</h2>
<p>De 3 a 5 semanas quando a hidraulica fica onde esta, e de 6 a 10 semanas quando ela muda. O prazo estoura quase sempre por dois motivos: material comprado depois que a obra comecou, e marcenaria medida antes do revestimento assentado. Comprar tudo antes e medir a marcenaria por ultimo resolve a maior parte dos atrasos.</p>
<img src="/capa.png" alt="Cozinha reformada com bancada de granito" width="1200" height="630">
<a href="/outra.html">Ver tabela completa de precos</a>
<form action="/api/contato" method="post">
  <label for="e">Seu e-mail</label><input id="e" name="email" type="email" autocomplete="email">
  <label for="itens[]">Comodos a reformar</label><input id="itens[]" name="itens[]" type="text">
  <label for="orcamento (R$)">Orcamento previsto</label><input id="orcamento (R$)" name="orcamento" type="text">
  <label for="prazo)">Prazo desejado</label><input id="prazo)" name="prazo" type="text">
  <input type="text" name="website" style="display:none">
  <button>Enviar</button>
</form>
</main>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)};gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied'});</script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-ABC1234567"></script>
</body></html>`);

fs.writeFileSync(path.join(SITE, "ruim.html"), `<!doctype html>
<html><head>
<meta name="robots" content="index">
<meta name="robots" content="max-image-preview:large, max-snippet:0">
<script src="/app.js"></script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"VideoObject","name":"Institucional"}</script>
<script type="application/ld+json">{ isto nao e json valido }</script>
</head><body>
<h1>Bem-vindo</h1><h1>Outro titulo</h1>
<p>Lorem ipsum dolor sit amet, texto de exemplo que ficou publicado.</p>
<p>Somos uma agencia de comunicacao e marketing com 25 anos de estrada, apostamos na multidisciplinaridade e atendemos marcas nacionais e internacionais de diversos setores.</p>
<video autoplay muted loop><source src="/broll.mp4"></video>
<img src="/foto.png">
<form><input name="nome"><input name="email" type="email" aria-describedby="dica-que-nao-existe"><button>Enviar</button></form>
<a href="/boa.html" tabindex="2"></a>
<a href="https://wa.me/55119">Fale no WhatsApp</a>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-RUIM000000"></script>
</body></html>`);

fs.writeFileSync(path.join(SITE, "llms.txt"), `# Marca Certa

> Loja de material de construcao em Sao Paulo, com entrega em 24h.

## Servicos
- [Entrega](https://exemplo.com.br/entrega): entrega rapida.

## Cases
`);

fs.writeFileSync(path.join(REPO, "src", "FormularioFantasma.tsx"), `
export function Contato() {
  const [done, setDone] = useState(false);
  if (done) return <p>Recebemos sua mensagem. Falamos em breve!</p>;
  return <form onSubmit={(e) => { e.preventDefault(); setDone(true); }}>
    <input name="email" />
  </form>;
}`);
fs.writeFileSync(path.join(REPO, "src", "config.ts"), `
export const KEY = process.env.OPENAI_API_KEY;
export const PUBLICO = process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY;
`);

// ------------------------------------------------------------------- run ----
const res = spawnSync(process.execPath, [
  path.join(HERE, "audit.mjs"),
  "--dir", SITE, "--repo", REPO,
  "--brand", "Marca Certa", "--sector", "material de construcao",
  "--out", OUT,
], { encoding: "utf8" });

if (res.status !== 0) {
  console.error("✗ o audit.mjs saiu com erro — o smoke para aqui\n");
  console.error(res.stdout || "", res.stderr || "");
  process.exit(1);
}

const rel = JSON.parse(fs.readFileSync(path.join(OUT, "audit-report.json"), "utf8"));
const falhas = new Set(rel.findings.filter((f) => f.status === "fail").map((f) => f.id));
const msgs = rel.pages.flatMap((p) => (p.issues || []).map((i) => i.msg)).join("\n");
// mensagens SÓ da página correta: serve pras asserções de "não acusa o que está certo"
const boaMsgs = rel.pages.filter((p) => /boa\.html$/.test(p.url || "")).flatMap((p) => (p.issues || []).map((i) => i.msg)).join("\n");

// --- 2ª rodada: um site CORRETO tem que ATINGIR o gate ----------------------
// Esta é a propriedade mais importante do loop de correção: se o gate for
// inalcançável na prática, o loop nunca termina em sucesso e a skill vira uma
// máquina de rodar rodada sem fim. Provar que dá pra passar é obrigatório.
const LIMPO = path.join(TMP, "limpo");
const OUT2 = path.join(TMP, "out2");
fs.mkdirSync(LIMPO, { recursive: true });
fs.copyFileSync(path.join(SITE, "boa.html"), path.join(LIMPO, "boa.html"));
fs.writeFileSync(path.join(LIMPO, "llms.txt"), `# Marca Certa\n\n> Loja de material de construcao em Sao Paulo, com entrega em 24h na capital.\n\n## Servicos\n- [Entrega](https://exemplo.com.br/entrega): entrega em 24h na capital.\n`);
fs.writeFileSync(path.join(LIMPO, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: https://exemplo.com.br/sitemap.xml\n`);
fs.writeFileSync(path.join(LIMPO, "sitemap.xml"), `<urlset><url><loc>https://exemplo.com.br/boa.html</loc><lastmod>2026-07-20</lastmod></url></urlset>`);
const res2 = spawnSync(process.execPath, [
  path.join(HERE, "audit.mjs"), "--dir", LIMPO,
  "--brand", "Marca Certa", "--sector", "material de construcao", "--out", OUT2,
], { encoding: "utf8" });
const limpo = res2.status === 0
  ? JSON.parse(fs.readFileSync(path.join(OUT2, "audit-report.json"), "utf8"))
  : null;

// --- 3ª rodada: o que SÓ existe no modo --url ------------------------------
// robots.txt e status HTTP não são exercitados por auditoria de pasta. Estes
// dois já produziram achado errado em relatório entregue a cliente, então
// aqui sobe um servidor de mentira e roda o auditor contra ele de verdade.
const PORT = 34771 + (process.pid % 800);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const PORTA_MORTA = 9; // discard — recusa conexão: força FALHA de fetch, não status

// A armadilha: GPTBot está LIBERADO, mas o `Disallow: /` do SemrushBot vem
// logo abaixo. A regex antiga atravessava a fronteira do bloco e acusava o
// GPTBot de bloqueado — P0 falso. ClaudeBot (treino) e Claude-SearchBot (busca)
// estão bloqueados de verdade — e o auditor tem que tratá-los diferente: só o
// de busca tira o site da resposta da IA.
const ROBOTS_ARMADILHA = [
  "User-agent: *", "Allow: /", "",
  "User-agent: GPTBot", "Allow: /", "",
  "User-agent: SemrushBot", "Disallow: /", "",
  "User-agent: ClaudeBot", "Disallow: /", "",
  "User-agent: Claude-SearchBot", "Disallow: /", "",
  `Sitemap: ${ORIGIN}/sitemap.xml`, "",
].join("\n");

const SITEMAP_VIVO = `<urlset>
<url><loc>${ORIGIN}/boa.html</loc><lastmod>2026-07-20</lastmod></url>
<url><loc>${ORIGIN}/derruba.html</loc></url>
</urlset>`;

const htmlBoa = fs.readFileSync(path.join(SITE, "boa.html"), "utf8");
const rotas = {
  "/robots.txt": ["text/plain", ROBOTS_ARMADILHA],
  "/sitemap.xml": ["application/xml", SITEMAP_VIVO],
  "/boa.html": ["text/html; charset=utf-8", htmlBoa],
  "/llms.txt": ["text/plain", "# Marca Certa\n\n> Loja de material de construcao em Sao Paulo.\n\n## Servicos\n- [Entrega](/entrega): entrega em 24h.\n"],
};
const { createServer } = await import("node:http");
const srv = createServer((req, res) => {
  // Mesmo host, mas a conexão cai no meio: falha de fetch de verdade, sem status HTTP.
  if (req.url.startsWith("/derruba.html")) { req.socket.destroy(); return; }
  const rota = rotas[req.url.split("?")[0]];
  if (!rota) { res.writeHead(404, { "content-type": "text/html" }); res.end("<h1>nao existe</h1>"); return; }
  res.writeHead(200, { "content-type": rota[0] });
  res.end(rota[1]);
});
await new Promise((r) => srv.listen(PORT, "127.0.0.1", r));

const OUT3 = path.join(TMP, "out3");
const res3 = await new Promise((resolve) => {
  const c = spawn(process.execPath, [
    path.join(HERE, "audit.mjs"), "--url", `${ORIGIN}/`,
    "--brand", "Marca Certa", "--sector", "material de construcao", "--out", OUT3,
  ], { encoding: "utf8" });
  c.on("close", (code) => resolve(code));
  c.on("error", () => resolve(-1));
});
srv.close();
const vivo = res3 === 0 && fs.existsSync(path.join(OUT3, "audit-report.json"))
  ? JSON.parse(fs.readFileSync(path.join(OUT3, "audit-report.json"), "utf8"))
  : null;
const acheVivo = (id) => (vivo?.findings || []).find((f) => f.id === id) || null;


// --- 4ª rodada: o site WordPress que o auditor acusou errado ----------------
// WordPress + Elementor + PixelYourSite + Rank Math + TranslatePress. Cada
// fixture abaixo reproduz um achado que, numa auditoria real de 583 URLs, foi
// conferido à mão e era FALSO (cicatrizes F1-F7 em references/como-nao-reportar-mentira.md).
// Cada caso tem o par: o falso que não pode mais sair E o verdadeiro que não
// pode deixar de sair (corrigir falso positivo sem o par vira falso negativo).
const PORT2 = 36771 + (process.pid % 800);
const ORIGIN2 = `http://127.0.0.1:${PORT2}`;
const GTM = "GTM-ABC1234";
const png = (w, h) => {
  const b = Buffer.alloc(33);
  b.writeUInt32BE(0x89504e47, 0); b.writeUInt32BE(0x0d0a1a0a, 4); b.writeUInt32BE(13, 8);
  b.write("IHDR", 12, "latin1"); b.writeUInt32BE(w, 16); b.writeUInt32BE(h, 20);
  return b;
};
// O PixelYourSite escreve o ID do container no JSON de config de CADA evento.
const pysJson = Array.from({ length: 12 }, (_, i) => `"ev${i}":{"trackingIds":["${GTM}"],"name":"e${i}"}`).join(",");
const gtmSnippet = `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM}');</script>`;
const medicaoWP = `<script>var pysOptions={"staticEvents":{${pysJson}}};</script>\n${gtmSnippet}`;
const noscriptGTM = `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${GTM}" height="0" width="0"></iframe></noscript>`;
const graphRankMath = (title, tipo, extra = {}) => JSON.stringify({ "@context": "https://schema.org", "@graph": [
  { "@type": "Organization", "@id": `${ORIGIN2}/#org`, name: extra.org || "Ponte Leste", url: ORIGIN2 },
  // O autor tem foto de Gravatar (96px). Ela NÃO é a imagem da página.
  { "@type": "Person", "@id": `${ORIGIN2}/#autor`, name: "Ana Souza", image: { "@type": "ImageObject", "@id": `${ORIGIN2}/#avatar`, url: `${ORIGIN2}/gravatar.png`, caption: "Ana Souza" } },
  { "@type": "ImageObject", "@id": `${ORIGIN2}/#primaryImage`, url: `${ORIGIN2}/capa-grande.png`, width: 1344, height: 800 },
  { "@type": "WebPage", "@id": `${ORIGIN2}/#webpage`, name: title, primaryImageOfPage: { "@id": `${ORIGIN2}/#primaryImage` } },
  { "@type": tipo, headline: title, author: { "@id": `${ORIGIN2}/#autor` }, image: { "@id": `${ORIGIN2}/#primaryImage` }, ...(extra.date ? { datePublished: extra.date } : {}) },
] });
const paginaWP = ({ lang = "pt-BR", title, siteName = "Ponte Leste", ogType = "website", tipo = "Article", org, texto = "", medicao = medicaoWP }) => `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><title>${title}</title>
<meta name="description" content="Mudancas internacionais com acompanhamento de ponta a ponta, do orcamento ao desembaraco na alfandega e a entrega na porta de casa.">
<meta property="og:site_name" content="${siteName}"><meta property="og:type" content="${ogType}">
<meta property="og:title" content="${title}"><meta property="og:image" content="${ORIGIN2}/capa-grande.png">
<link rel="alternate" type="application/rss+xml" href="${ORIGIN2}/feed.xml">
<link rel="alternate" type="application/json+oembed" href="${ORIGIN2}/wp-json/oembed/1.0/embed?url=x">
<link rel="alternate" type="text/xml+oembed" href="${ORIGIN2}/wp-json/oembed/1.0/embed?url=x&format=xml">
<script type="application/ld+json">${graphRankMath(title, tipo, { org, date: null })}</script>
${medicao}
</head><body>${noscriptGTM}<main><h1>${title}</h1><p>${texto}</p><a href="/">Inicio</a></main></body></html>`;
const BLOG = (title) => paginaWP({ title, tipo: "BlogPosting", ogType: "article" });
const rotasWP = {
  "/": ["text/html; charset=utf-8", paginaWP({ title: "Mudancas internacionais | Ponte Leste", texto: "Cuidamos da sua mudanca." })],
  "/servicos/": ["text/html; charset=utf-8", paginaWP({ title: "Servicos de mudanca | Ponte Leste", tipo: "Article", texto: "Pagina de servico, nao e post." })],
  "/novidades/guia-de-mudanca/": ["text/html; charset=utf-8", BLOG("Guia de mudanca internacional | Ponte Leste")],
  "/duplicada/": ["text/html; charset=utf-8", paginaWP({ title: "Pagina com GTM em dobro | Ponte Leste", medicao: medicaoWP + "\n" + gtmSnippet })],
  "/es/": ["text/html; charset=utf-8", paginaWP({ lang: "es-ES", title: "Puente Este | Mudanzas internacionales", siteName: "Puente Este", org: "Puente Este", texto: "Nos ocupamos de absolutamente todo: transporte, aduana y seguro. Hacemos TODO: desde el embalaje hasta la entrega." })],
  "/en/": ["text/html; charset=utf-8", paginaWP({ lang: "en-US", title: "International moves | Ponte Leste", texto: "TODO: write the copy for this section" })],
  "/es/servicios/": ["text/html; charset=utf-8", paginaWP({ lang: "es-ES", title: "Servicios de mudanza | Ponte Leste", texto: "Servicios con la marca intacta." })],
  "/locations.kml": ["application/vnd.google-earth.kml+xml", `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>Ponte Leste</name></Document></kml>`],
  "/feed.xml": ["application/rss+xml", `<rss version="2.0"><channel><title>Ponte Leste</title></channel></rss>`],
  "/robots.txt": ["text/plain", `User-agent: *\nAllow: /\nSitemap: ${ORIGIN2}/sitemap.xml\n`],
  "/sitemap.xml": ["application/xml", `<urlset>${["/", "/servicos/", "/novidades/guia-de-mudanca/", "/duplicada/", "/es/", "/es/servicios/", "/en/", "/locations.kml"].map((u) => `<url><loc>${ORIGIN2}${u}</loc></url>`).join("")}</urlset>`],
  "/capa-grande.png": ["image/png", png(1344, 800)],
  "/gravatar.png": ["image/png", png(96, 96)],
};
const srvWP = createServer((req, res) => {
  const rota = rotasWP[req.url.split("?")[0]];
  if (!rota) { res.writeHead(404, { "content-type": "text/html" }); res.end("<h1>nao existe</h1>"); return; }
  res.writeHead(200, { "content-type": rota[0] });
  res.end(rota[1]);
});
await new Promise((r) => srvWP.listen(PORT2, "127.0.0.1", r));
const OUT4 = path.join(TMP, "out4");
const res4 = await new Promise((resolve) => {
  const c = spawn(process.execPath, [
    path.join(HERE, "audit.mjs"), "--url", `${ORIGIN2}/`,
    "--brand", "Ponte Leste", "--sector", "mudancas internacionais", "--out", OUT4,
  ]);
  c.on("close", (code) => resolve(code));
  c.on("error", () => resolve(-1));
});
srvWP.close();
const wp = res4 === 0 && fs.existsSync(path.join(OUT4, "audit-report.json"))
  ? JSON.parse(fs.readFileSync(path.join(OUT4, "audit-report.json"), "utf8"))
  : null;
const acheWP = (id) => (wp?.findings || []).find((f) => f.id === id) || null;
const paginaWPde = (rota) => (wp?.pages || []).find((p) => p.url === `${ORIGIN2}${rota}`) || null;
const msgsWP = (rota) => (paginaWPde(rota)?.issues || []).map((i) => i.msg).join("\n");

// --- 5ª rodada: o site de homologação (Iza Criativa, outubro/2026) ----------
// Site em ambiente de teste, sitemap já com o domínio final. Cada fixture é um
// erro real daquela auditoria, com o par verdadeiro que não pode sumir:
//   G1 · sitemap com URL de OUTRO host contaminou a nota (62 páginas, 27 "sem H1")
//   G2 · link só com ícone e aria-label contado como "sem texto âncora"
//   G3 · player próprio (botão de play) tratado como "vídeo sem controles"
//   G4 · noindex em página de link na bio acusado como P0
//   G5 · cabeçalho x-robots-tag: none (a meta tag não existe) passava batido
const PORT3 = 38771 + (process.pid % 800);
const ORIGIN3 = `http://127.0.0.1:${PORT3}`;
const videoLd = (n) => `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "VideoObject", name: n, description: "Depoimento em video de uma cliente satisfeita com o trabalho", thumbnailUrl: `${ORIGIN3}/poster.png`, contentUrl: `${ORIGIN3}/v.mp4`, uploadDate: "2026-10-01" })}</script>`;
const paginaH = ({ title, corpo = "", robots = "max-image-preview:large, max-snippet:-1", extraHead = "" }) => `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>${title}</title>
<meta name="description" content="Estudio de identidade visual para profissionais que querem parecer o que entregam, com projetos de marca, social media e papelaria completa.">
<meta name="robots" content="${robots}">
${extraHead}</head><body><main><h1>${title}</h1><p>Texto da pagina de homologacao com conteudo suficiente para nao ser acusada de fina.</p>${corpo}</main></body></html>`;
const rotas3 = {
  "/home.html": ["text/html; charset=utf-8", paginaH({ title: "Home do estudio de teste", extraHead: videoLd("Depoimento da Ana"), corpo:
    `<a href="/insta" aria-label="Instagram do estudio"><svg viewBox="0 0 8 8"><path d="M0 0h8v8z"/></svg></a>` +
    `<a href="/zap"><img src="/i.png" alt="Falar no WhatsApp"></a>` +
    `<a href="/vazio"></a>` +
    `<video src="/v.mp4" poster="/poster.png" preload="none" playsinline></video><button type="button" class="vc-play" aria-label="Assistir ao depoimento de Ana"></button>` })],
  "/decor.html": ["text/html; charset=utf-8", paginaH({ title: "Pagina com video decorativo", extraHead: videoLd("Fundo animado"), corpo:
    `<video src="/v.mp4" muted loop autoplay playsinline></video>` })],
  "/bio/": ["text/html; charset=utf-8", paginaH({ title: "Links do estudio", robots: "noindex, nofollow", corpo: `<a href="/home.html">Home</a>` })],
  "/privado.html": ["text/html; charset=utf-8", paginaH({ title: "Pagina de conteudo escondida", robots: "noindex, nofollow", corpo: `<a href="/home.html">Home</a>` })],
  "/xrt.html": ["text/html; charset=utf-8", paginaH({ title: "Pagina com cabecalho que bloqueia", corpo: `<a href="/home.html">Home</a>` }), { "x-robots-tag": ["none", "none"] }],
  "/ok.html": ["text/html; charset=utf-8", paginaH({ title: "Pagina normal sem cabecalho", corpo: `<a href="/home.html">Home</a>` })],
  "/robots.txt": ["text/plain", `User-agent: *\nAllow: /\nSitemap: ${ORIGIN3}/sitemap.xml\n`],
  "/sitemap.xml": ["application/xml", `<urlset>${["/home.html", "/decor.html", "/bio/", "/privado.html", "/xrt.html", "/ok.html"].map((u) => `<url><loc>${ORIGIN3}${u}</loc></url>`).join("")}<url><loc>https://www.exemplo-final-inexistente.test/antigo.html</loc></url><url><loc>http://127.0.0.1:${PORTA_MORTA}/outro-host.html</loc></url></urlset>`],
  "/poster.png": ["image/png", png(1280, 720)],
};
const srv3 = createServer((req, res) => {
  const rota = rotas3[req.url.split("?")[0]];
  if (!rota) { res.writeHead(404, { "content-type": "text/html" }); res.end("<h1>nao existe</h1>"); return; }
  res.writeHead(200, { "content-type": rota[0], ...(rota[2] || {}) });
  res.end(rota[1]);
});
await new Promise((r) => srv3.listen(PORT3, "127.0.0.1", r));
const rodar = (extra, out) => new Promise((resolve) => {
  const c = spawn(process.execPath, [path.join(HERE, "audit.mjs"), "--url", `${ORIGIN3}/`, "--brand", "Estudio de Teste", "--sector", "identidade visual", "--out", out, ...extra]);
  c.on("close", (code) => resolve(code));
  c.on("error", () => resolve(-1));
});
const OUT5 = path.join(TMP, "out5");
const res5 = await rodar([], OUT5);
// Segunda rodada: --urls restringe a auditoria a uma lista, ignorando o sitemap.
const LISTA = path.join(TMP, "paginas.txt");
fs.writeFileSync(LISTA, `# páginas do ambiente de teste\n${ORIGIN3}/home.html\n/ok.html\n\n`);
const OUT6 = path.join(TMP, "out6");
const res6 = await rodar(["--urls", LISTA], OUT6);
// spawn assíncrono de propósito: spawnSync trava o event loop deste processo, e o servidor de mentira mora aqui.
const resSemArquivo = await new Promise((resolve) => {
  const c = spawn(process.execPath, [path.join(HERE, "audit.mjs"), "--url", `${ORIGIN3}/`, "--urls", path.join(TMP, "nao-existe.txt"), "--out", path.join(TMP, "out7")]);
  let stderr = "";
  c.stderr.on("data", (d) => { stderr += d; });
  c.on("close", (status) => resolve({ status, stderr }));
  c.on("error", () => resolve({ status: -1, stderr }));
});
srv3.close();
const lerRel = (code, out) => code === 0 && fs.existsSync(path.join(out, "audit-report.json"))
  ? JSON.parse(fs.readFileSync(path.join(out, "audit-report.json"), "utf8")) : null;
const hom = lerRel(res5, OUT5);
const homLista = lerRel(res6, OUT6);
const acheHom = (id) => (hom?.findings || []).find((f) => f.id === id) || null;
const paginaHom = (rota) => (hom?.pages || []).find((p) => p.url === `${ORIGIN3}${rota}`) || null;
const issuesHom = (rota) => paginaHom(rota)?.issues || [];
const msgsHom = (rota) => issuesHom(rota).map((i) => i.msg).join("\n");

// ------------------------------------------------------------------ asserts -
const casos = [
  // [descrição, condição verdadeira = passou]
  ["acusa formulário que finge enviar", falhas.has("code.form.fake")],
  ["acusa segredo no bundle do cliente", falhas.has("code.client.secret")],
  ["acusa chave de API exigida", falhas.has("code.env.required")],
  ["acusa seção vazia no llms.txt", falhas.has("llms.emptysections")],
  ["acusa ausência de medição? NÃO — a página boa tem GA4", !falhas.has("analytics.installed")],
  ["acusa <html> sem lang", /sem atributo lang/.test(msgs)],
  ["acusa página sem title", /Sem <title>/.test(msgs)],
  ["acusa dois H1 na mesma página", /2 H1 na mesma página/.test(msgs)],
  ["acusa duas metas robots", /metas <meta name="robots">/.test(msgs)],
  ["acusa JSON-LD inválido", /JSON-LD inválido/.test(msgs)],
  ["acusa placeholder publicado", /Placeholder\/lorem/.test(msgs)],
  ["NAO acusa placeholder em palavra portuguesa (metodo: termina em todo:)", !/Placeholder\/lorem/.test(boaMsgs)],
  ["acusa o site se descrevendo como outra marca", /se DESCREVE com termos de outra marca/.test(msgs)],
  ["acusa VideoObject sem vídeo assistível", /VideoObject` numa página sem vídeo/.test(msgs)],
  ["acusa imagem sem alt", /sem atributo alt/.test(msgs)],
  ["acusa formulário sem destino no HTML", /Formulário sem `action`/.test(msgs)],
  ["acusa link sem texto âncora", /sem texto âncora/.test(msgs)],
  // 2026: o que o HTML servido prova sobre citação, acessibilidade e performance
  ["acusa nosnippet / max-snippet:0 (tira dos AI Overviews)", /max-snippet:0/.test(msgs)],
  ["acusa script no <head> sem defer/async", /sem defer\/async/.test(msgs)],
  ["acusa campo de identidade sem autocomplete", /sem autocomplete/.test(msgs)],
  ["acusa tabindex positivo", /tabindex positivo/.test(msgs)],
  ["acusa aria-describedby apontando pra id inexistente", /id que não existe/.test(msgs)],
  ["acusa vídeo autoplay sem playsinline", /sem playsinline/.test(msgs)],
  ["acusa link do WhatsApp com número fora do padrão", /WhatsApp com número fora do padrão/.test(msgs)],
  ["acusa medição sem consentimento declarado (site ruim)", falhas.has("consent.mode")],
  ["acusa WhatsApp sem evento de medição", falhas.has("whatsapp.tracked")],
  ["llms.txt é informativo (P2), não fator de citação", rel.findings.find((f) => f.id === "llms.exists")?.severity === "P2"],
  ["NÃO acusa a página boa de faltar <main>/skip link", !/Sem <main>/.test(boaMsgs)],
  ["NÃO acusa a página boa de campo sem autocomplete", !/sem autocomplete/.test(boaMsgs)],
  // O outro lado: a página boa não pode gerar ruído.
  ["NÃO acusa a página boa de faltar BLUF", !/boa\.html/.test(JSON.stringify(rel.pages.find((p) => /boa/.test(p.file || ""))?.issues?.filter((i) => /BLUF/.test(i.msg)) || []))],
  ["NÃO acusa a página boa de faltar heading-pergunta",
    !(rel.pages.find((p) => /boa/.test(p.file || ""))?.issues || []).some((i) => /pergunta/.test(i.msg))],
  ["NÃO acusa a página boa de canonical ausente",
    !(rel.pages.find((p) => /boa/.test(p.file || ""))?.issues || []).some((i) => /canonical/.test(i.msg))],
  ["NÃO acusa a página boa de faltar max-image-preview",
    !(rel.pages.find((p) => /boa/.test(p.file || ""))?.issues || []).some((i) => /max-image-preview/.test(i.msg))],
  // `id="itens[]"` e `id="orcamento (R$)"` são HTML válido e viravam RegExp
  // inválida — a auditoria inteira morria no meio. Aqui eles têm <label for>
  // certinho: se o auditor sobreviver E não acusar, a interpolação está segura.
  ["NÃO acusa a página boa de formulário sem rótulo (inclusive id com [] e parêntese)",
    !(rel.pages.find((p) => /boa/.test(p.file || ""))?.issues || []).some((i) => /sem rótulo/.test(i.msg))],
  ["mede os 4 campos visíveis do formulário sem quebrar no id exótico",
    (rel.pages.find((p) => /boa/.test(p.file || ""))?.forms || []).some((f) => f.fields === 4 && f.unlabeled === 0)],
  // Honestidade: o que não dá pra medir localmente tem que sair como não medido.
  ["marca como 'não medido' o que auditoria local não vê",
    rel.findings.some((f) => f.status === "skip" && f.id === "feeds.alive")],
  // Sanidade do placar.
  ["produz nota em todos os 6 eixos", Object.values(rel.scores.per).every((v) => v.score !== null || v.skipped > 0)],
  ["gate não passa num site cheio de defeito", rel.scores.gate === false],
  // O loop precisa poder terminar. Gate inalcançável = loop infinito por design.
  ["site correto ATINGE o gate (o loop consegue terminar)", limpo !== null && limpo.scores.gate === true],
  ["site correto fica sem nenhum P0", limpo !== null && limpo.scores.p0Total === 0],
  ["nenhum eixo do site correto fica abaixo de 90",
    limpo !== null && Object.values(limpo.scores.per).every((v) => v.score === null || v.score >= 90)],
  ["em pasta local o robots.txt do disco é auditado (crawlers de busca liberados = pass)",
    limpo !== null && limpo.findings.find((f) => f.id === "robots.ai")?.status === "pass"],
  ["site correto com Consent Mode passa no check de consentimento",
    limpo !== null && limpo.findings.find((f) => f.id === "consent.mode")?.status === "pass"],

  // --- modo --url: robots.txt e status HTTP ---------------------------------
  ["a auditoria por URL roda até o fim", vivo !== null],
  ["acusa como P0 o crawler de BUSCA bloqueado no próprio bloco (Claude-SearchBot)",
    acheVivo("robots.ai")?.status === "fail" && /Claude-SearchBot/.test(acheVivo("robots.ai")?.title || "")],
  ["registra o crawler de TREINO bloqueado (ClaudeBot) como informativo, não como P0",
    acheVivo("robots.ai.train")?.status === "pass" && /ClaudeBot/.test(acheVivo("robots.ai.train")?.title || "")
    && !/ClaudeBot/.test(acheVivo("robots.ai")?.title || "")],
  ["NÃO acusa bot liberado por causa do Disallow do bloco vizinho (GPTBot)",
    vivo !== null && !/GPTBot/.test((acheVivo("robots.ai")?.title || "") + (acheVivo("robots.ai.train")?.title || ""))],
  ["HEAD e GET comparados na home", ["pass", "fail"].includes(acheVivo("host.head")?.status)],
  ["não confunde bloqueio de um bot com bloqueio do site inteiro",
    acheVivo("robots.blanket")?.status === "pass"],
  ["separa 'falhou ao buscar' de 'respondeu com status ruim'",
    acheVivo("fetch.failed")?.status === "fail"],
  ["NÃO afirma que todas devolvem 200 quando alguma nem foi buscada",
    vivo !== null && !/Todas as URLs/.test(acheVivo("sitemap.status")?.title || "")],
  ["a URL que respondeu 200 continua contada como 200",
    /1 URL\(s\) medidas devolvem 200/.test(acheVivo("sitemap.status")?.title || "")],

  // --- 4ª rodada: WordPress (cada falso positivo real, com o seu par) --------
  ["WP: a auditoria do site WordPress roda até o fim", wp !== null],
  // F1 · o ID do GTM aparece 12× no JSON do PixelYourSite e é UM container só
  ["F1 · ID do GTM repetido no JSON de config NÃO vira 'medição duplicada'", wp !== null && !/Código de medição/.test(msgsWP("/"))],
  ["F1 · dois snippets do MESMO GTM continuam acusados (o par verdadeiro)", wp !== null && /Código de medição/.test(msgsWP("/duplicada/"))],
  // F2 · "todo:" é palavra comum em espanhol e português
  ["F2 · 'todo:' e 'TODO:' em texto espanhol NÃO são placeholder", wp !== null && !/Placeholder/.test(msgsWP("/es/"))],
  ["F2 · 'TODO:' em página em inglês continua acusado (o par verdadeiro)", /Placeholder/.test(msgsWP("/en/"))],
  // F3 · /locations.kml (Rank Math) no sitemap
  ["F3 · .kml do sitemap não é auditado como página HTML (zero achados nele)",
    paginaWPde("/locations.kml")?.nonHtml !== undefined && (paginaWPde("/locations.kml")?.issues || []).length === 0],
  ["F3 · .kml fora do denominador: 'medição presente' não vira N-1/N", acheWP("analytics.coverage")?.status === "pass"],
  ["F3 · o que ficou de fora sai como 'não medido', não some em silêncio", acheWP("pages.nonhtml")?.status === "skip"],
  // F4 · a foto do autor (Gravatar 96px) não é a imagem principal da página
  ["F4 · foto do autor (96px) não entra como imagem principal", acheWP("img.mainsize")?.status === "pass"
    && !(paginaWPde("/servicos/")?.mainImages || []).some((m) => /gravatar/.test(m.url))],
  ["F4 · a imagem do Article (via @id → ImageObject) continua sendo medida",
    (paginaWPde("/servicos/")?.mainImages || []).some((m) => /capa-grande/.test(m.url))],
  // F5 · oEmbed não é sitemap nem feed
  ["F5 · link oEmbed (text/xml+oembed) NÃO conta como 'sitemap/feed declarado'", acheWP("feeds.alive")?.status === "pass"],
  ["F5 · oEmbed fora do ar vira achado próprio, P2, com rótulo certo",
    acheWP("oembed.alive")?.status === "fail" && acheWP("oembed.alive")?.severity === "P2" && /oEmbed/.test(acheWP("oembed.alive")?.title || "")],
  // F6 · Article em página de serviço não é post de blog
  ["F6 · página de serviço com schema Article NÃO é cobrada como post", wp !== null && !/Post (de blog )?sem/.test(msgsWP("/servicos/"))],
  ["F6 · BlogPosting sem datePublished continua acusado (o par verdadeiro)", /sem data de publicação/.test(msgsWP("/novidades/guia-de-mudanca/"))],
  // F7 · o furo: marca traduzida por máquina na versão /es/
  ["F7 · acusa marca traduzida na versão /es/ (og:site_name, schema e título)",
    acheWP("brand.translated")?.status === "fail" && new RegExp(`${ORIGIN2}/es/ →`).test(acheWP("brand.translated")?.evidence || "")
    && /Puente Este/.test(acheWP("brand.translated")?.evidence || "")],
  ["F7 · versão traduzida com a marca intacta NÃO é acusada", !new RegExp(`${ORIGIN2}/es/servicios/ →`).test(acheWP("brand.translated")?.evidence || "")],
  ["F7 · site de um idioma só não gera o check", limpo !== null && !limpo.findings.some((f) => f.id === "brand.translated")],
  // --- 5ª rodada: homologação (G1-G5, cada um com o seu par) ------------------
  ["G · a auditoria do site de homologação roda até o fim", hom !== null],
  ["G1 · URL do sitemap em OUTRO host NÃO é auditada (a nota é do site que você apontou)",
    hom !== null && hom.pages.every((p) => p.url.startsWith(ORIGIN3))],
  ["G1 · o que ficou de fora sai como 'não medido', com o host e como incluir",
    acheHom("sitemap.foreignhost")?.status === "skip" && /exemplo-final-inexistente\.test/.test(JSON.stringify(acheHom("sitemap.foreignhost")))],
  ["G1 · as 6 páginas do próprio host foram auditadas", hom !== null && hom.pages.length === 6],
  ["G1 · --urls audita só a lista (absoluta e relativa, ignora # e linha vazia)",
    homLista !== null && homLista.pages.length === 2 && homLista.pages.every((p) => p.url.startsWith(ORIGIN3))],
  ["G2 · link só com ícone + aria-label e link com <img alt> NÃO são 'sem texto âncora'",
    /1 link\(s\) sem texto âncora/.test(msgsHom("/home.html"))],
  ["G2 · o link realmente vazio continua acusado (o par verdadeiro)", /sem texto âncora/.test(msgsHom("/home.html"))],
  ["G3 · vídeo com botão de play próprio NÃO é 'VideoObject sem vídeo assistível'",
    hom !== null && !/VideoObject` numa página sem vídeo/.test(msgsHom("/home.html"))],
  ["G3 · vídeo decorativo (autoplay muted loop) continua acusado (o par verdadeiro)",
    /VideoObject` numa página sem vídeo/.test(msgsHom("/decor.html"))],
  ["G · --urls com arquivo inexistente falha com mensagem clara, não com stack trace",
    resSemArquivo.status === 2 && /Não consegui abrir o arquivo de páginas/.test(resSemArquivo.stderr) && !/at Object\.readFileSync/.test(resSemArquivo.stderr)],
  ["G4 · noindex em página de link na bio (/bio/) NÃO é P0",
    hom !== null && issuesHom("/bio/").some((i) => /noindex/.test(i.msg)) && !issuesHom("/bio/").some((i) => /noindex/.test(i.msg) && (i.severity || i.sev) === "P0")],
  ["G4 · noindex em página de conteúdo continua P0 (o par verdadeiro)",
    issuesHom("/privado.html").some((i) => /noindex/.test(i.msg) && (i.severity || i.sev) === "P0")],
  ["G5 · x-robots-tag: none no cabeçalho é P0, mesmo sem meta robots, e cita a homologação",
    issuesHom("/xrt.html").some((i) => /x-robots-tag/i.test(i.msg) && (i.severity || i.sev) === "P0" && /homologa/i.test(i.msg))],
  ["G5 · página sem o cabeçalho não é acusada (o par verdadeiro)", hom !== null && !/x-robots-tag/i.test(msgsHom("/ok.html"))],
];

let falhou = 0;
console.log(`\nSMOKE · ultra-auditoria\n${"=".repeat(58)}`);
for (const [nome, passou] of casos) {
  console.log(`  ${passou ? "✓" : "✗"} ${nome}`);
  if (!passou) falhou++;
}
console.log("=".repeat(58));
console.log(`  ${casos.length - falhou}/${casos.length} · ${falhou ? "FALHOU" : "OK"}`);
console.log(`  fixture: ${TMP}\n`);

if (falhou) {
  console.error("Alguma checagem parou de funcionar. Não rode auditoria de verdade até resolver:");
  console.error("um auditor quebrado devolve conforto falso, que é pior que não auditar.\n");
  process.exit(1);
}
fs.rmSync(TMP, { recursive: true, force: true });
