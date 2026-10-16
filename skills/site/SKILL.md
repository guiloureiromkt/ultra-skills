---
name: site
description: Constrói sites premium (landing, institucional, portfólio, produto) decidindo o design como imagem antes do código. Um quadro de referência gerado por seção, aprovado, e código fiel a ele, com kit de assets próprio (imagens geradas no Replicate, pago), motion por tier e verificação em navegador real (screenshots em várias larguras, reflow a 320px, reduced-motion, foco por teclado, contraste) antes de chamar de pronto. Use quando pedirem um site novo, uma landing page, um site "com cara de estúdio", "não template", "tipo Claude Design / Higgsfield", ou quando a direção visual ainda não existe e precisa nascer junto com o site. Não é para ajuste pontual de um componente, redesign de app existente, deck ou carrossel.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(node ${CLAUDE_SKILL_DIR}/scripts/screenshot.js *), Bash(python ${CLAUDE_SKILL_DIR}/scripts/gen_images.py *), Bash(python3 ${CLAUDE_SKILL_DIR}/scripts/gen_images.py *)
---

# ultra:site — o design é decidido como imagem, não como adjetivo

Descrever um site com adjetivos ("moderno, clean, premium") produz a média de todos os sites que o modelo já viu. Aqui o caminho é outro: **um quadro de referência visual por seção, gerado e olhado antes de qualquer código**, e código que copia o quadro. O resto da skill existe para que o quadro não seja genérico e o código não derive de volta pro template.

Caminho-base: a pasta desta skill (`${CLAUDE_SKILL_DIR}`). A barra: *"um site de estúdio na primeira tentativa"*. "Limpo mas genérico" conta como falha.

## A dependência paga, dita no começo

As imagens vêm do Replicate (pago por uso, **US$ 5 a 15 por site**; vídeo de hero custa mais). Sem token, não existe board; sem board, sai exatamente o genérico que esta skill existe para evitar. Se `REPLICATE_API_TOKEN` não estiver no ambiente, leia `references/replicate-setup.md` e conduza a configuração antes da Fase 2. Avise o custo estimado antes de lotes grandes e antes de qualquer vídeo.

## O que não se negocia (e por quê)

1. **Os boards são o design.** Um board por seção, gerado antes do código, olhado um a um. Brief "simples" é onde mais sai site genérico, então a fase não se pula por simplicidade. Board com cara de template se refaz (orçamento: 2 re-rolls por board); depois disso o problema é o brief, não a sorte.
2. **Anti-convergência é mecânica.** Paletas-padrão de IA são banidas por hex (`references/design-recipe.md §2`), e o **ledger** de builds anteriores (§Ledger) obriga o novo site a diferir do último em pelo menos 4 dos 6 eixos de identidade. Sem isso, todo site converge pro gosto do modelo.
3. **Zero stock, zero placeholder de imagem, zero ícone-font decorativo.** O visual é gerado para esta marca (`scripts/gen_images.py`). Se a geração falhar duas vezes, troque o modelo ou reescreva o prompt; cair para stock em silêncio é o que o cliente vai notar primeiro.
4. **O board vence o hábito.** Ao codar cada seção, reler o board e extrair dele texto, escala, espaçamento, cor e componentes (`references/image-to-code.md`). Deriva pro template é a falha mais comum deste tipo de build, e acontece sem ninguém decidir.
5. **"Pronto" inclui verificação em navegador real.** Gate mecânico no código, depois `scripts/screenshot.js`: PNGs em desktop e mobile mais um `checks.md` do que o olho não vê no PNG (reflow, reduced-motion, foco, alvos, contraste, CLS). Ler os PNGs como revisor externo cético, com veredito padrão NEEDS_WORK, corrigir tudo num lote e capturar de novo uma vez.
6. **Copy sem invenção, e humanizada.** Nada de número, case ou depoimento inventado com cara de real (fato plausível de produto fictício pode; prova social e performance, não). Travessão fora do texto visível. Passar a copy pela `ultra:humanizer` (mesmo plugin), invocando a skill; de cabeça, o checklist deixa passar padrões.
7. **Não publica sozinho.** Entrega pasta local, screenshots e preview `file://`. Deploy é decisão de quem é dono do site.

## Fluxo (cada fase produz um artefato; a ordem importa)

### 0 · Intake, uma rodada só
Pergunte apenas o que o brief não responde, até 3 itens: **classe** (institucional/landing/portfólio × app multi-rota), **marca** (existe: pedir cores, fontes, logo, fotos; carta branca: você é o estúdio de branding e gera o kit), **direção** (ofereça 3 direções de arte nomeadas, 5-8 palavras-clima cada, mais "me surpreende"). Pergunte também **idioma e público** (vale a regra brasileira de acessibilidade, LBI; vale a europeia, EAA, se vende para a UE). Sem resposta, escolha defaults sensatos, declare em uma linha e siga.

### 1 · Brief (`design-brief.md`, antes do código)
Cerca de 40 linhas, todas obrigatórias: leitura de design em 1 frase · **espinha conceitual nomeável** ("o site é um instrumento de calibração") · **tier** (`editorial` calmo · `cinema` default de marketing · `spectacle` webgl) · **paleta travada** (hex exatos, defesa de 1 linha, conferida contra os bans e o ledger) · **tipografia travada** · **técnica Tier-1 com ID** de `references/wow-catalog.md` · **plano de seções** (1 família de layout por seção, sem repetição consecutiva, 4+ famílias se 6+ seções) · **plano de assets** · **inventário de CTAs**, cada um com identidade própria. Linha genérica ("moderno e clean", "Inter", "acento azul") significa brief não pronto. O brief é contrato: fase posterior não o contradiz em silêncio.

### 2 · Reference boards
`references/reference-boards.md`. Um board 16:9 por seção via `python ${CLAUDE_SKILL_DIR}/scripts/gen_images.py`, escolha combinatória travada no brief, âncora de composição variando por board, paleta igual em todos. Boards ficam em `refs/` do projeto. **Olhar cada um** e re-rolar o que parecer template.

### 3 · Kit de assets
`references/asset-system.md`. Hero (2 candidatos) · plates de seção · imagens de conteúdo · set de ícones próprio · logo só se não houver · OG 1200×630 · head kit completo (favicons, manifest, theme-color, meta de descoberta `max-image-preview:large`, imagem principal com 1200px+ de largura no arquivo) · no tier cinema, o vídeo do hero para scroll-scrub. Submeta tudo em lote e construa enquanto renderiza. Asset que destoa do kit se regenera.

### 4 · Build fiel aos boards
`references/image-to-code.md` + `references/design-recipe.md` (o piso de craft, inclusive a seção **§10 de responsividade, acessibilidade e performance**). Stack padrão: pasta estática auto-contida (`index.html`, `css/`, `js/`, `assets/`, `vendor/` com GSAP, Lenis e split-type baixados, zero CDN em produção). Next.js só quando o brief for app multi-rota. Cada CTA é um componente próprio com interação própria. Estático e completo primeiro; motion é a fase seguinte.

### 5 · Motion
Uma passada, ditada pelo tier. Cinema/spectacle: Lenis + GSAP ScrollTrigger e a técnica Tier-1 do brief inteira, respondendo ao input do usuário (scrub de scroll toca o filme frame a frame), não loop passivo. Animações nativas de scroll (`animation-timeline`) só atrás de `@supports`, com GSAP como caminho principal, porque ainda não são Baseline. Todo reveal nasce visível ou leva rede de segurança fora do motor de animação, porque navegador em aba oculta não roda `requestAnimationFrame` e o conteúdo fica invisível para crawler e preview de link. `prefers-reduced-motion` recebe o estado final estático. Nada pesado em handler de clique (INP).

### 6 · Gate mecânico
`references/review-rubric.md §A`, no código, antes de capturar: placeholders · travessão visível · paleta banida nos tokens · ração de eyebrows · assets referenciados · head kit · descoberta liberada · `dvh/svh` em vez de `100vh` · reduced-motion · CTA sem classe compartilhada · reveal screenshot-safe · layout aguenta rótulo longo · sticky não morto por `overflow-x:hidden` · imagem LCP com `fetchpriority="high"` e nunca lazy · fonte do hero com preload e fallback com `size-adjust` · alvos de toque 24px+ · header fixo com `scroll-padding-top` · formulário com label visível, `autocomplete` e erro por `aria-describedby`. Item falhando se corrige antes de seguir.

### 7 · Screenshot, review adversarial, entrega
```bash
node ${CLAUDE_SKILL_DIR}/scripts/screenshot.js <index.html> <out_dir>
```
Gera os PNGs, `checks.json` e `checks.md` (mede também 360 e 320). Ler os PNGs e o `checks.md`, gradear a rubrica §B (squint test · hero · hierarquia de tipo · trava de paleta · variância de layout · integração dos assets · densidade e copy · mobile · fidelidade board a board). Bloqueante do `checks.md` é FAIL. Tudo que falhou vira um lote de correção, recaptura uma vez. Entregar: pasta do site, screenshots, 1 frase de conceito, o que ficou honestamente de fora e o **caminho absoluto em texto puro**. Registrar o build no ledger.

### 8 · Auditoria antes de chamar de entregue
Screenshot bonito prova que o site parece certo, não que o Google entende, que a IA cita, que o formulário entrega o lead. Invocar **`ultra:auditoria`** apontando para a pasta (`--dir`) e para a URL se já estiver no ar. Site com texto de outra marca, formulário que finge enviar ou medição ausente não é entrega.

## Referências (quando ler)
- `references/replicate-setup.md` — Fase 0, se o token faltar: custo, configuração, e quando esta skill não é a ferramenta certa.
- `references/design-recipe.md` — todo build: tipografia, cor, hero, layout, copy, motion, forms, imagens, **responsivo/acessível/performance (§10)**.
- `references/wow-catalog.md` — Fase 1 (técnica Tier-1) e Fase 5 (contratos de implementação).
- `references/reference-boards.md` — Fase 2.
- `references/asset-system.md` — Fase 3.
- `references/image-to-code.md` — Fase 4.
- `references/review-rubric.md` — Fases 6 e 7.

## Scripts
- `scripts/gen_images.py` — imagens via Replicate. Spec JSON `{nome: prompt}` ou `{nome: {prompt, ar, model, refs[]}}`. Modelos: `nano` (google/nano-banana-pro, default: boards, assets, edição com referência) e `flux` (barato, texturas). Precisa de Python 3 com o pacote `requests` (`pip install requests`, uma vez). Token lido de `REPLICATE_API_TOKEN` ou de `.env` na pasta do projeto; nunca se pergunta ao usuário nem se cola no chat. Rodar com `PYTHONUTF8=1`.
- `scripts/screenshot.js` — puppeteer-core + Chrome instalado. Flags: `--viewports 1440,390,360,320` · `--shots 1440,390` · `--dark` · `--no-checks`. Sai com código 1 quando há bloqueante. Se faltar puppeteer-core, imprime o comando de instalação; Chrome em caminho fora do padrão vai em `CHROME_PATH`.
- Vídeo do hero (cinema): modelo image-to-video vigente no Replicate (seedance, wan, kling; conferir disponibilidade na hora, pela skill `run-models` se instalada ou pela API HTTP, no padrão do `gen_images.py`); depois `ffmpeg -i clip.mp4 -vf "fps=20,scale=1280:-2" -q:v 4 frames/hero/f%03d.jpg` → canvas scrub.

## Ledger anti-convergência
Registro dos builds anteriores, para que o próximo não repita a cara do último. Onde mora, o primeiro que existir: `$ULTRA_SITE_LEDGER` · `./ultra-site-ledger.md` na pasta do projeto · `~/.claude/ultra-site-ledger.md` (default, criado na hora). Tabela: data · projeto · família de paleta · pairing de tipo · arquitetura do hero · Tier-1 (ID) · garments de CTA · linguagem de canto. Ler antes do brief, escrever depois da entrega.

## Quando não usar
Ajuste pontual de um componente ou tela (use uma skill de UI direta, como `impeccable`, se instalada) · redesign de app existente · deck (`ultra:deck`) · carrossel · landing dentro de um WordPress já existente (edite o tema; o método dos boards não se aplica a página solta num CMS).
