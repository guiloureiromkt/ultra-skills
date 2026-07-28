#!/usr/bin/env node
// ============================================================================
// ultra-auditoria · smoke.mjs — prova que o auditor funciona ANTES de confiar
// nele. Monta um site de mentira com defeitos conhecidos, roda o audit.mjs em
// cima e confere duas coisas, que valem igual:
//
//   1. ACUSOU o que tem defeito   (sem isso o auditor dá falso conforto)
//   2. NÃO acusou o que está certo (sem isso ninguém lê o relatório até o fim)
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
<script type="application/ld+json">{"@context":"https://schema.org","@type":"BlogPosting","headline":"Quanto custa uma reforma de cozinha em 2026","datePublished":"2026-07-01","dateModified":"2026-07-20","author":{"@type":"Person","name":"Fulana de Tal"}}</script>
</head><body>
<h1>Quanto custa uma reforma de cozinha em 2026</h1>
<p>Uma reforma de cozinha no Brasil custa hoje entre R$ 1.200 e R$ 4.500 por metro quadrado, e a faixa depende quase toda de tres decisoes: bancada, marcenaria e hidraulica. Quem mantem o ponto de agua onde esta economiza cerca de um terco do orcamento total, segundo levantamento do Sinduscon de 2026.</p>
<h2>O que entra na faixa mais barata?</h2>
<p>Na faixa de R$ 1.200 o metro estao acabamentos de linha popular e marcenaria modulada pronta.</p>
<table><tr><th>Faixa</th><th>Preco/m2</th></tr><tr><td>Popular</td><td>R$ 1.200</td></tr></table>
<p>Marcenaria modulada pronta sai por volta de R$ 900 o metro linear em loja de rede, contra R$ 2.100 na marcenaria sob medida. A diferenca de preco esta menos no material e mais no aproveitamento do espaco: modulo pronto vem em medida fixa, entao sobra vao morto em cozinha fora do padrao. Em apartamento novo, com planta retangular, a modulada resolve. Em imovel antigo, com parede torta e pe-direito alto, o sob medida costuma se pagar.</p>
<h2>Vale a pena mudar a hidraulica de lugar?</h2>
<p>Mudar o ponto de agua acrescenta de 20% a 30% ao orcamento, porque envolve quebrar contrapiso, refazer impermeabilizacao e esperar a cura antes de assentar o revestimento. O custo direto do encanamento e baixo; o que pesa e o tempo de obra parada e o retrabalho de acabamento em volta.</p>
<p>Na pratica, so compensa quando a cozinha atual tem um problema de circulacao real, do tipo geladeira que nao abre por causa da bancada. Se o incomodo e so estetico, a mesma verba aplicada em bancada e iluminacao muda mais a percepcao do ambiente do que mover a pia meio metro.</p>
<h2>Quanto tempo demora uma reforma de cozinha?</h2>
<p>De 3 a 5 semanas quando a hidraulica fica onde esta, e de 6 a 10 semanas quando ela muda. O prazo estoura quase sempre por dois motivos: material comprado depois que a obra comecou, e marcenaria medida antes do revestimento assentado. Comprar tudo antes e medir a marcenaria por ultimo resolve a maior parte dos atrasos.</p>
<img src="/capa.png" alt="Cozinha reformada com bancada de granito" width="1200" height="630">
<a href="/outra.html">Ver tabela completa de precos</a>
<form action="/api/contato" method="post">
  <label for="e">Seu e-mail</label><input id="e" name="email" type="email">
  <label for="itens[]">Comodos a reformar</label><input id="itens[]" name="itens[]" type="text">
  <label for="orcamento (R$)">Orcamento previsto</label><input id="orcamento (R$)" name="orcamento" type="text">
  <label for="prazo)">Prazo desejado</label><input id="prazo)" name="prazo" type="text">
  <input type="text" name="website" style="display:none">
  <button>Enviar</button>
</form>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-ABC1234567"></script>
</body></html>`);

fs.writeFileSync(path.join(SITE, "ruim.html"), `<!doctype html>
<html><head>
<meta name="robots" content="index">
<meta name="robots" content="max-image-preview:large">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"VideoObject","name":"Institucional"}</script>
<script type="application/ld+json">{ isto nao e json valido }</script>
</head><body>
<h1>Bem-vindo</h1><h1>Outro titulo</h1>
<p>Lorem ipsum dolor sit amet, texto de exemplo que ficou publicado.</p>
<p>Somos uma agencia de comunicacao e marketing com 25 anos de estrada, apostamos na multidisciplinaridade e atendemos marcas nacionais e internacionais de diversos setores.</p>
<video autoplay muted loop><source src="/broll.mp4"></video>
<img src="/foto.png">
<form><input name="nome"><button>Enviar</button></form>
<a href="/boa.html"></a>
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
// GPTBot de bloqueado — P0 falso. ClaudeBot, esse sim, está bloqueado.
const ROBOTS_ARMADILHA = [
  "User-agent: *", "Allow: /", "",
  "User-agent: GPTBot", "Allow: /", "",
  "User-agent: SemrushBot", "Disallow: /", "",
  "User-agent: ClaudeBot", "Disallow: /", "",
  `Sitemap: ${ORIGIN}/sitemap.xml`, "",
].join("\n");

const SITEMAP_VIVO = `<urlset>
<url><loc>${ORIGIN}/boa.html</loc><lastmod>2026-07-20</lastmod></url>
<url><loc>http://127.0.0.1:${PORTA_MORTA}/inalcancavel.html</loc></url>
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
  ["acusa o site se descrevendo como outra marca", /se DESCREVE com termos de outra marca/.test(msgs)],
  ["acusa VideoObject sem vídeo assistível", /VideoObject` numa página sem vídeo/.test(msgs)],
  ["acusa imagem sem alt", /sem atributo alt/.test(msgs)],
  ["acusa formulário sem destino no HTML", /Formulário sem `action`/.test(msgs)],
  ["acusa link sem texto âncora", /sem texto âncora/.test(msgs)],
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

  // --- modo --url: robots.txt e status HTTP ---------------------------------
  ["a auditoria por URL roda até o fim", vivo !== null],
  ["acusa o bot que ESTÁ bloqueado no próprio bloco (ClaudeBot)",
    /ClaudeBot/.test(acheVivo("robots.ai")?.title || "")],
  ["NÃO acusa bot liberado por causa do Disallow do bloco vizinho (GPTBot)",
    vivo !== null && !/GPTBot/.test(acheVivo("robots.ai")?.title || "")],
  ["não confunde bloqueio de um bot com bloqueio do site inteiro",
    acheVivo("robots.blanket")?.status === "pass"],
  ["separa 'falhou ao buscar' de 'respondeu com status ruim'",
    acheVivo("fetch.failed")?.status === "fail"],
  ["NÃO afirma que todas devolvem 200 quando alguma nem foi buscada",
    vivo !== null && !/Todas as URLs/.test(acheVivo("sitemap.status")?.title || "")],
  ["a URL que respondeu 200 continua contada como 200",
    /1 URL\(s\) medidas devolvem 200/.test(acheVivo("sitemap.status")?.title || "")],
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
