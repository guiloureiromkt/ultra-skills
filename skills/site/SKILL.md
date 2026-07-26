---
name: site
description: Cria SITES premium (landing, marca, portfólio, produto) no método "Claude Design 2.0" — engenharia reversa do website-builder do Higgsfield, rodando 100% local com Replicate como motor de assets. Use SEMPRE que o Gui pedir "ultra-site", "cria um site", "landing page premium", "site animado", "site tipo Higgsfield/Claude Design", "site com scroll cinematográfico", "faz o site da marca X", ou quiser um site novo com direção de arte de verdade (não template). O design é decidido como IMAGENS (reference boards gerados por seção), o visual é um kit de assets 100% bespoke (hero, texturas, ícones, logo, OG, vídeo-scrub), o código é fiel aos boards, e nada é "done" sem gate mecânico + review adversarial por screenshot. NÃO é pra landing WP do guiloureiro.com.br (use gndm-novo-material), nem redesign de página WP (gndm-page-redesign), nem clonar app existente (clone-webapp), nem deck (ultra-deck), nem carrossel (ultra-carrossel).
---

# Ultra-Site — sites premium no método dos boards (Replicate como motor)

Réplica local do motor que faz a trend "Claude Design 2.0 + Higgsfield": um **pipeline de 7 fases com gates** onde o design é decidido como **imagens geradas** antes de qualquer código. A barra: *"um site de estúdio de US$ 40k na primeira tentativa"*. "Limpo mas genérico" = falha.

> Caminho-base: a pasta desta skill (`skills/site/`).
>
> ⚠️ **Dependência paga, sem modo grátis.** As imagens são geradas no Replicate (pago por uso): **US$ 5 a 15 por site**, mais caro com vídeo de hero. Precisa de `REPLICATE_API_TOKEN` no ambiente.
>
> **Se o token faltar, ou se quem está usando nunca configurou:** leia `references/replicate-setup.md` e conduza o passo a passo — conta, crédito, token, variável de ambiente — **antes** de tentar a Fase 2. Não é opcional e não tem contorno: sem imagem gerada não existe board, e sem board o que sai é exatamente o "limpo mas genérico" que esta skill define como falha. Melhor dizer isso na cara logo no começo do que descobrir na metade.
>
> **Avise o custo estimado antes de rodar lotes grandes ou qualquer vídeo.**

## 🩸 Princípios inquebráveis (lê PRIMEIRO)

1. **Os boards SÃO o design.** Nunca pular a Fase 1, nem pra brief "simples" — brief simples é exatamente onde sai site genérico. 1 imagem de referência POR SEÇÃO, gerada antes de qualquer código. Board com cara de template = re-roll (budget 2). Sem board bom, não há Fase 3.
2. **Anti-convergência é mecânica, não gosto.** Paletas de IA banidas **por hex** (dark+laranja · dark+neon · bege+brass · roxo-IA — ver `references/design-recipe.md §2`). E o **ledger** (ver §Ledger no fim — o caminho é resolvido lá, não é fixo): antes de travar o brief, lê-lo e diferir do build anterior em **≥4 dos 6 eixos** (paleta · tipografia · arquitetura do hero · técnica Tier-1 · garments de CTA · linguagem de canto). Ao entregar, registrar o build no ledger (estado sempre no vault).
3. **Zero stock, zero picsum, zero ícone-font decorativo.** TODO o visual é bespoke-gerado no Replicate (`scripts/gen_images.py` · nano-banana-pro). Geração falhou 2×? Troca o modelo (`/find-models`) ou reestrutura o prompt — nunca cai pra stock em silêncio.
4. **O board vence o hábito.** Na Fase 3, reler o board na hora de codar cada seção e extrair texto/escala/espaçamento/cor/componentes dele (`references/image-to-code.md`). Quando seu instinto discordar do board, o board vence. Drift pra template = a falha nº 1.
5. **Done inclui review adversarial.** Gate mecânico (grep) + screenshot full-page 1440px E 390px via `node scripts/screenshot.js` (puppeteer-core + Chrome `file://` — **NUNCA `preview_screenshot`**, trava em página pesada · cicatriz 127 erros). Ler os screenshots como **revisor externo cético com veredito default NEEDS_WORK**, coletar TODOS os fails, corrigir em 1 batch, re-screenshotar 1×.
6. **Copy: anti-fabricação + humanizer default.** PT-BR salvo pedido. Zero número/case/depoimento inventado com cara de real (fatos de PRODUTO fictício plausível podem, claims de performance/social proof não). Em-dash banido do texto visível. INVOCAR o `/humanizer` (não aplicar de cabeça · cicatriz 2026-07-03).
7. **Não publica sozinho.** Entrega a pasta local + screenshots + preview `file://`. Deploy no VPS só quando o Gui pedir. Custo estimado de geração (imagens ~US$0,15 cada · vídeo mais caro) avisado ANTES de rodar lotes grandes ou qualquer vídeo.

## Fluxo (as 7 fases · sem pular · cada uma produz artefato)

### 0 · Intake (1 rodada única de perguntas, nunca uma segunda)
Só o que o brief não responder, até 3 perguntas numa rodada: **(a) classe** (site institucional/landing/portfólio × app multi-rota) · **(b) marca** (existente — pedir cores/fontes/logo/fotos — ou carta branca; carta branca é o caminho RICO: você vira o estúdio de branding e gera o kit inteiro) · **(c) direção** — oferecer **3 direções de arte nomeadas** com 5-8 palavras-clima cada + "me surpreende". Se o Gui não responder, escolher defaults sensatos, declarar em 1 linha e seguir.

### 1 · Brief (`design-brief.md` no projeto, ANTES de código)
~40 linhas, tudo obrigatório, linha genérica ("moderno e clean", "Inter", "acento azul") = brief não está pronto: leitura de design (1 frase) · **espinha conceitual nomeável** (ex: "o site é um instrumento de calibração" / "um dossiê de arquivo") · **tier** (`editorial` calmo · `cinema` **default** marketing/marca · `spectacle` webgl/awwwards) · **paleta travada** (hexes exatos + defesa de 1 linha + checar bans e ledger) · **tipografia travada** · **técnica Tier-1 com ID do catálogo** (`references/wow-catalog.md` — interativa em cinema/spectacle; loop passivo não conta) · **plano de seções** (1 família de layout por seção, sem repetição consecutiva, ≥4 famílias se 6+ seções, eyebrows ≤ ceil(seções/3)) · **plano de assets** · **inventário de CTAs** (cada um com identidade própria — zero estilo de botão compartilhado). O brief é contrato: fase posterior não contradiz em silêncio.

### 2 · Reference boards (o design como IMAGENS)
Ler `references/reference-boards.md` e executar: **1 board horizontal (16:9) POR SEÇÃO** via `scripts/gen_images.py` (nano-banana-pro, qualidade alta), escolha combinatória travada (tema · fundo · tipografia · hero · sistema de seção · 4 componentes-assinatura · espinha · momento de segunda leitura), âncora de composição VARIANDO por board, paleta travada em todos. Boards caem em `refs/` do projeto. **OLHAR cada board** (Read) e re-rollar o que parecer template.

### 3 · Kit de assets (submete tudo, constrói enquanto renderiza)
Ler `references/asset-system.md`: hero (2 candidatos) · texturas/plates de seção · imagens de conteúdo · **set de ícones custom** (sheet 6-12 glifos → fatiar → remove-background) · logo/monograma (só se não houver) · OG 1200×630 · head kit (favicons/manifest/theme-color **+ a meta de descoberta `max-image-preview:large, max-snippet:-1, max-video-preview:-1`, que é o gate do card grande e do Discover — cicatriz 2026-07-25**; imagem principal ≥1200px de largura, senão o card grande não vem nem com a meta) — e no tier cinema o **vídeo do hero pro scroll-scrub** (avisar custo antes). Baixar tudo em `assets/` do projeto. Checar coerência do kit junto (mesma paleta/grade); peça destoante = regenerar.

### 4 · Build fiel aos boards, seção a seção
Ler `references/image-to-code.md` + `references/design-recipe.md` (o piso de craft: tipografia, hero ≤4 elementos de texto, bans de layout, regras de copy). **Stack default: pasta estática auto-contida** — `index.html` + `css/` + `js/` + `assets/` + `vendor/` (GSAP · Lenis · split-type baixados localmente — zero CDN em produção · tudo próprio). Next.js/Tailwind só quando o brief for app multi-rota (aí valem as regras SSR: nada de `window` em top-level). Chrome bespoke: cada CTA é um componente próprio com identidade de interação própria (catálogo de garments no image-to-code). Construir estático-mas-completo; motion é a próxima fase.

### 5 · Motion pass (1 passada focada, ditada pelo tier)
Cinema/spectacle: Lenis + GSAP ScrollTrigger (bridge `autoRaf:false` + `gsap.ticker`) e a **técnica Tier-1 do brief executada por inteiro** — o hero responde ao INPUT do usuário (scrub de scroll toca o filme frame a frame via canvas), não loop passivo. Reveals com stagger por seção. **Regra screenshot-safe:** nada esperando em `opacity:0` por IntersectionObserver — text builds disparam no mount; efeitos de scroll animam só transform/scale/clip. **E mount não basta com Framer Motion/GSAP** (pintura via rAF, que o Chromium pausa em documento oculto — aba background, prerender, bot de preview): todo reveal leva rede de segurança setTimeout que escreve o estado final direto no DOM via ref, e count-up nasce com o valor real no HTML (cicatriz 2026-07-13 + padrão provado na rubric §9b). Armadilha do pin-spacer: `pinSpacing:false` ou verificar que o full-page não tem faixa morta. TUDO com fallback `prefers-reduced-motion`.

### 6 · Gate mecânico (antes de qualquer screenshot)
Checklist grep de `references/review-rubric.md §A` (adaptado local): placeholders/lorem · em-dash no texto visível · paleta banida nos tokens · ração de eyebrows · todo asset gerado referenciado (e hero usa asset real) · head kit completo · **descoberta liberada (§A 5c-5f: `max-image-preview:large` em toda página indexável, 1 só meta robots por página, imagem ≥1200px, sitemap/feed respondendo 200)** · `h-dvh` não `h-screen` · reduced-motion · CTA bespoke (nenhuma classe de botão repetida página inteira) · `opacity-0`+viewport-trigger · **layout aguenta rótulo longo + sticky não morto por `overflow-x:hidden` (§A 12-13)** · plano de seções honrado · auto-audit de copy. Item falhando = corrige antes de seguir. Veredito de geometria se mede (`getBoundingClientRect`), não se acha (§A 14).

### 7 · Screenshot + review adversarial + entrega
`node scripts/screenshot.js <index.html> <out_dir>` → full-page 1440 e 390. Ler os 2 PNGs e gradear a rubrica §B (9 itens: squint test · hero · hierarquia de tipo · trava de paleta · variância de layout · integração dos assets · densidade/copy · mobile · **fidelidade board-a-board**) como revisor cético. TODOS os fails → 1 batch fix → re-screenshot 1×. Entregar: pasta do site + screenshots + 1 frase de conceito + o que ficou honestamente de fora + **caminho absoluto em texto puro**. Registrar o build no ledger. Oferecer: ajustes · deploy VPS · variações.

### 8 · Auditoria GEO/SEO/código (obrigatória antes de chamar de entregue)
Screenshot bonito prova que o site **parece** certo; não prova que o Google entende, que a IA cita, nem que o código aguenta. Invocar a skill **`ultra:auditoria`** apontando pra pasta do projeto (`--dir`) — e pra URL, se já estiver no ar. Ela roda o gate mecânico (title/canonical/schema/robots/sitemap/llms.txt/resíduo de molde/varredura de código), pontua 5 eixos e re-roda em loop até zero P0 e todos os eixos ≥90. **Site com resíduo de molde ou llms.txt errado não é entrega** — é o site contando a história de outra marca (cicatriz 2026-07-25). O `llms.txt` e o head kit da Fase 3 nascem aqui já corretos: gerados a partir do brief, nunca copiados de outro projeto.

## Referências (ordem de leitura)
0. `references/replicate-setup.md` — a dependência paga: por que é obrigatória, quanto custa, como configurar, como não gastar à toa, e quando esta skill **não** é a ferramenta certa. Ler na Fase 0 se o token não estiver configurado.
1. `references/design-recipe.md` — piso de craft (SEMPRE ler · curto).
2. `references/wow-catalog.md` — Fase 1: técnica Tier-1 + ledger anti-convergência; Fase 5: contratos de implementação.
3. `references/reference-boards.md` — Fase 2: os boards.
4. `references/asset-system.md` — Fase 3: o kit (mapa Replicate).
5. `references/image-to-code.md` — Fase 4: fidelidade + garments de CTA.
6. `references/review-rubric.md` — Fases 6-7: gate + rubrica visual.

## Scripts
- `scripts/gen_images.py` — gera imagens via Replicate. Spec JSON `{nome: prompt}` ou `{nome: {prompt, ar, model, refs[]}}`. Modelos: `nano` (google/nano-banana-pro · default · boards/assets/edição com referência) e `flux` (flux-dev · barato pra texturas). Token: `REPLICATE_API_TOKEN` do ambiente (ou `.env` na pasta do projeto) — **nunca perguntar ao usuário nem colar em lugar nenhum**; se faltar, o script imprime o passo a passo. `PYTHONUTF8=1`.
- `scripts/screenshot.js` — puppeteer-core + Chrome `file://` → full-page desktop 1440 + mobile 390. É O caminho de verificação (não usar preview_screenshot). Se faltar puppeteer-core, o script imprime o comando de setup (1× só).
- Vídeo do hero (cinema): `/find-models` pra escolher o modelo vigente de image-to-video no Replicate (seedance/wan/kling — checar disponibilidade na hora) + `/run-models`; depois `ffmpeg -i clip.mp4 -vf "fps=20,scale=1280:-2" -q:v 4 frames/hero/f%03d.jpg` → canvas scrub.

## Ledger anti-convergência (a memória entre builds)
Registro dos builds anteriores, pra que o próximo não repita a cara do último. Sem ele, todo site que você faz converge pro mesmo lugar — o gosto do modelo, não o da marca.

**Onde mora** (o 1º que existir vence):
1. `$ULTRA_SITE_LEDGER` — se a variável de ambiente estiver setada.
2. `C:\GuiOS\GuiOS\90_Meta\ultra-site-ledger.md` — o vault do Gui, se existir (estado sempre no vault).
3. `~/.claude/ultra-site-ledger.md` — o default portátil, criado na hora se não houver.

Se não existir, criar com frontmatter (`type: sot`) e uma tabela: data · projeto · família de paleta · pairing de tipo · arquitetura do hero · Tier-1 (ID) · garments de CTA · linguagem de canto. Ler antes do brief, escrever depois da entrega.

## Quando esta skill NÃO se aplica
- Landing/lead magnet DENTRO do guiloureiro.com.br (WP) → `gndm-novo-material`. Redesign de página WP → `gndm-page-redesign`. Clonar webapp existente → `clone-webapp`. Deck → `ultra-deck`. Carrossel → `ultra-carrossel`. **Redesign completo de app existente → `ultra-app`** (irmã desta · mesmos boards/scripts + função sagrada). Ajuste pontual de 1 componente/tela → `impeccable` direto.
