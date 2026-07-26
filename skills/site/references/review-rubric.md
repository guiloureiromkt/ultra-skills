# review-rubric — gate mecânico (Fase 6) + review adversarial (Fase 7)

Two checklists. §A runs BEFORE the screenshots (grep/read the code — every item
is mechanically checkable). §B runs against the real screenshots from
`scripts/screenshot.py`, in the voice of a skeptical outside reviewer whose
default verdict is NEEDS_WORK. Both are completion gates, not suggestions.

## §A. Mechanical gate (code-level)

Grep/read the project files; fix every hit before screenshotting.

1. **Placeholders** — zero `<...>` tokens, `lorem`, `TODO`, `PLACEHOLDER`,
   empty `src=""` (Grep no projeto inteiro).
2. **Em-dash ban** — Grep `—|–` over user-visible strings returns
   nothing (code comments exempt).
3. **Banned default palette** — none of the banned palette families from
   `design-recipe.md` §2 appear in `styles.css`/tokens: beige/brass/espresso
   hexes, graphite/near-black + orange/amber/ember accent, near-black + neon
   cyan/blue/green accent, AI purple/violet glow, or the palette family of your
   previous build in this chat. Overridable ONLY by the user's explicit brand
   colors, justified in the design brief.
4. **Eyebrow ration** — count **eyebrow-position section labels only**. An
   eyebrow is a small uppercase/mono kicker sitting DIRECTLY above the
   section's display headline in the same column; nothing else counts. Must
   be ≤ ceil(sectionCount / 3). Uppercase mono in non-eyebrow roles (spec
   strips, table/metric captions, rail labels, footer column heads) is
   exempt — especially when the reference boards show them. Grep for
   `uppercase tracking` to find candidates, then classify by position.
5. **Asset kit complete + referenced** — every file downloaded into
   `assets/` is actually referenced by the page; the hero
   references a real generated asset (no picsum/stock/CSS-gradient-only hero);
   the icon slots use the generated icon set (or the documented library
   fallback), and no kit item from `asset-system.md`'s "always" list is
   silently missing.
5b. **Head kit complete** — the full favicon/meta set from `asset-system.md`
   §7 is present and wired: favicon (ico/svg + png sizes), apple-touch-icon,
   192/512 + maskable icons with a `site.webmanifest`, `theme-color`, and the
   full OG + twitter card block with absolute image URLs. An empty `<head>`
   or the scaffold's default favicon is a gate failure.
5c. **Descoberta: preview grande liberado** (cicatriz 2026-07-25 · guiloureiro.com.br)
   — TODA página indexável leva
   `<meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">`.
   Sem isso o Google **não** monta card de imagem grande, e o site fica
   **inelegível ao Discover por definição** — não é questão de qualidade de
   conteúdo. Custou 90 dias de Discover a ZERO impressão em 129 páginas, com
   tudo o mais (schema, autor, imagem 1344px) já correto. Grep:
   `max-image-preview` tem que bater o nº de páginas indexáveis.
   **Regra irmã — nunca dois `<meta name="robots">` na mesma página.** Páginas
   `noindex` (área de membros, rascunho) NÃO recebem a tag de preview: duas
   metas robots conflitam. O gate é: `count(robots) == 1` por página.
   Se o build tem estágio de rascunho→publicação, é o publicador que **troca**
   `noindex` pela tag de preview (não apaga e deixa a página sem robots).
5d. **Imagem elegível a Discover** — a imagem principal de cada página
   indexável tem **≥1200px de largura** (medir o arquivo, não confiar no
   atributo `width` do HTML) e é referenciada em `og:image` com URL absoluta.
   Abaixo de 1200 o card grande não é servido nem com a tag do 5c.
5e. **Feed e sitemaps existem de verdade** — todo caminho declarado em
   `robots.txt` (`Sitemap:`) ou submetido no Search Console responde **200**.
   Cicatriz: `sitemap.rss` submetido no GSC devolvia 404 desde abril — erro
   silencioso por 3 meses. Se o site tem blog/conteúdo datado, gerar RSS 2.0
   real (pubDate RFC822, `guid` permalink, `atom:link rel=self`) do disco,
   declarar em `robots.txt` e no `<link rel="alternate">`, e **regerar no
   mesmo passo que publica** (feed velho é pior que feed nenhum).
5f. **VideoObject só em vídeo assistível** — `<video autoplay muted loop>` sem
   `controls` é B-roll decorativo: **NÃO** marcar com `VideoObject`. Schema em
   loop mudo não rende impressão de vídeo (o Google quer vídeo reproduzível e
   proeminente) e cria descompasso markup×página. Vídeo com schema = tem
   controls, é conteúdo principal ou proeminente, e tem título/descrição/thumb.
6. **`h-screen`** — zero occurrences; use `h-dvh` / `min-h-dvh`.
7. **Runtime safety** — site estático: scripts com `defer` (ou no fim do
   body), página legível com JS desligado (conteúdo não depende de JS pra
   existir). Build Next.js: no `window`/`document`/`localStorage` at module
   top level or in render; client-only atrás de mounted gate; WebGL
   adicionalmente lazy.
8. **Reduced motion** — every animation source (`motion/react`, GSAP, registry
   components) paired with a `prefers-reduced-motion` guard or static fallback.
9. **CTA integrity + bespoke chrome** — one label per intent page-wide (no "Get
   in touch" + "Contact us"); no CTA label longer than ~3 words for primaries;
   AND no shared site-wide button style: grep for a repeated CTA class string /
   `Button` utility component reused across sections — every CTA per the brief's
   inventory has its own component with its own interaction identity.
9b. **Screenshot-safe reveals** — flag any `opacity: 0` / `opacity-0` **whose
   removal depends on a viewport/scroll trigger** (`whileInView`,
   IntersectionObserver entry, ScrollTrigger-gated fade-ins). Hover-state
   decorations at opacity-0 are fine. Nothing may sit invisible waiting for a
   viewport trigger; animate from visible states (y-offset/blur) or fire on
   mount. Video elements need a `poster` (or a rendered first frame) so
   headless shots never show a black box. A full-page headless screenshot
   must show every section.
   **Cicatriz 2026-07-13 (site em produção):** "fire on mount" NÃO
   basta quando a animação é Framer Motion — ele só pinta via o próprio
   loop de rAF, e o Chromium não roda rAF com o documento oculto (aba em
   background, prerender, bot de preview de link do WhatsApp/LinkedIn).
   Até `animate` no mount trava em opacity:0 pra sempre nessa condição —
   37 blocos invisíveis e "+0%" no lugar de "+272%" no ar por dias. Regra
   dupla obrigatória em qualquer reveal Framer/GSAP:
   (a) **rede de segurança fora do motor de animação** — setTimeout
   (~1.2-1.8s) que escreve `opacity:1; transform:none` direto no DOM via
   ref se o reveal não confirmou (padrão provado: hook `useRevealFallback`
   no repositório do projeto); teste replicável: abrir
   a página numa aba que reporta `document.visibilityState === "hidden"`
   e contar `[style*="opacity:0"]` após 3s — tem que ser 0.
   (b) **count-up nasce com o valor real** — o span do número renderiza o
   valor final no HTML/SSR (nunca o literal `0`); a contagem 0→N é só o
   enfeite quando o observer dispara de verdade. Crawler e preview veem o
   número certo mesmo se JS/animação nunca rodar.
9c. **Tudo próprio em produção** — Grep `https?://` no HTML/CSS/JS: zero CDN
   externo (GSAP/Lenis/split-type vendorizados em `vendor/`), fontes
   self-hosted (woff2 em `assets/fonts/`) ou system stack, zero badge
   "powered by" de terceiros. Link externo em CONTEÚDO (href de navegação)
   é ok; dependência de runtime externa não.
9d. **Anti-convergence ledger honored** — the brief lists the previous
   build's six identity axes (palette family, type pairing, hero
   architecture, Tier-1 technique, CTA garments, corner language) and this
   build differs on ≥4; the rationed garments (drawing underline, hover
   flood-fill, framed block) appear at most once page-wide combined; the
   Tier-1 technique carries a `wow-catalog.md` ID and is interactive (not a
   passive loop) on cinema/spectacle.
10. **Section plan honored** — the built page matches `app/design-brief.md`'s
    section plan (families, order, no consecutive family repeats). If the plan
    changed during the build, the brief was updated to match.
11. **Copy self-audit** — every visible string re-read; nothing grammatically
    broken, referent-unclear, filler-verb ("Elevate", "Seamless"…), or fake-precise
    (`92%`, `4.1×` without a source).
12. **Layout aguenta texto longo** (cicatriz 2026-07-25 · widget `w-def`) — todo
    componente rótulo+corpo (pill/badge/eyebrow numa coluna, texto na outra) foi
    testado com o **rótulo mais longo que o conteúdo real produz**. `display:grid;
    grid-template-columns:auto 1fr` + `white-space:nowrap` no rótulo é a
    armadilha: rótulo longo incha a coluna `auto` e espreme o corpo numa
    sanfona de 3 palavras por linha. Padrão seguro: rótulo `inline-block`
    **empilhado** acima, corpo em largura total. Grep `nowrap` e conferir cada
    ocorrência dentro de grid.
13. **Sticky não morre por overflow** — `position:sticky` só funciona se nenhum
    ancestral criar contexto de rolagem. **`body{overflow-x:hidden}` mata sticky**
    — usar `overflow-x:clip` (corta igual, não cria scroll container). E
    `grid-row:1/-1` **não** cobre linhas implícitas: o item fica curto e o sticky
    não tem trilho — usar `align-self:start` + sticky no próprio item do grid.
    Grep `overflow-x:\s*hidden` e `position:\s*sticky` juntos.
14. **Medição, não achismo** (método) — quando o veredito depende de geometria
    (aperto, corte, vão, altura de trilho sticky), **medir** com
    `getBoundingClientRect` em vez de julgar pelo PNG. Servir a pasta local
    (`python -m http.server`) e ler via JS. Duas armadilhas do ambiente:
    (a) CDP/screenshot **congela** em página pesada (30s timeout) — cair pra
    `read_page`/JS, não insistir; (b) o painel de preview pode reportar
    `innerWidth: 0`, o que colapsa todo grid pra 0px e produz medida falsa —
    forçar largura no container antes de medir e conferir que
    `innerWidth > 0` antes de acreditar em qualquer número.

## §B. Visual rubric (screenshot-level)

`node scripts/screenshot.js <index.html> <out_dir>` gera os dois full-page
(desktop 1440px e mobile 390px). LER os PNGs (tool Read). Grade
each item PASS / FAIL with one sentence of evidence. Be adversarial — you are
hunting for reasons the page reads as AI-template output. Collect every FAIL into
one batch fix list, apply, redeploy once.

> **CICATRIZ 2026-07-14 — "renderizou" ≠ QA, e o screenshot tinha ponto cego.**
> Duas vezes "pronto" foi declarado em cima de um screenshot que NÃO mostrava as
> imagens: o headless roda com `document.hidden`, então `loading="lazy"` nunca
> disparava e os slots vinham vazios — e ninguém sabia se era bug ou só lazy.
> O `screenshot.js` **agora força eager + rola + espera** (corrigido no script),
> então: **slot de imagem vazio no full-page = BUG REAL, não artefato do tool.**
> E o erro-mãe era humano: tratar "não deu erro" como "está bom". Rodar a rubrica
> §B de verdade — vão morto, imagem no formato errado, hero que não parece hero,
> palavra órfã — nada disso levanta erro; só aparece pra quem OLHA.

1. **First impression (the squint test).** Blur your eyes at the hero: is there
   one clear focal point and an obvious next action? Does it look like a site a
   studio charged real money for, or like a component demo?
2. **Hero discipline.** Everything critical inside the first viewport; headline
   ≤2 lines; no stacked micro-elements (eyebrow + tagline + trust strip); the
   generated hero asset is actually visible and well-composed (not cropped into
   mush, not buried under an overlay).
3. **Type hierarchy.** Clear 3-level scale (display / section head / body); line
   lengths ≤65ch; no headline wrapping into 4 lines; italic descenders not
   clipped; consistent font usage per the brief.
4. **Palette lock.** One accent everywhere; page reads as ONE theme top to
   bottom; contrast holds (no white-on-white buttons, no gray-on-gray body); no
   accidental beige+brass default.
5. **Layout variance.** Scrolling the full page: no layout family repeats
   back-to-back, no 3+ zigzag chain, no identical-trio card row, bento cells all
   filled with real visual variation.
6. **Asset integration.** Generated images look intentional: aspect ratios fit
   their slots, palette matches the page, no obvious AI artifacts (garbled text,
   warped hands/objects), no empty image boxes or broken image icons.
7. **Density & copy.** Sections breathe; no data-dump tables; copy is short and
   specific with zero AI-tell phrases visible; footer/nav read as finished.
8. **Mobile integrity (390px).** Nav collapses properly; hero still fits and the
   asset still works; no horizontal scroll; multi-column sections stack in a
   deliberate order; tap targets aren't microscopic; signature effect degrades
   gracefully (or is replaced by its static fallback).
9. **Board faithfulness (per section).** Compare each built section against its
   `refs/` reference board: does it still carry the board's composition, type
   character, and component logic, or did it drift back to a template pattern
   the board never showed? Any section that no longer resembles its board is a
   FAIL for that section.

Scoring: 9/9 = done. Any FAIL in items 1-4, 8, or 9 is blocking. FAILs in 5-7
are blocking on the first pass; on the second pass, note remaining taste-level
nits to the user instead of looping again.
