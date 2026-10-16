# review-rubric — gate mecânico (Fase 6) + review adversarial (Fase 7)

Duas listas. **§A** roda ANTES das capturas, lendo e grepando o código: cada
item é verificável sem opinião. **§B** roda contra os PNGs e o `checks.md`
que `scripts/screenshot.js` gera, na voz de um revisor externo cético cujo
veredito padrão é NEEDS_WORK. As duas são portões de conclusão, não sugestões.

Stack assumida: pasta estática (`index.html`, `css/`, `js/`, `assets/`,
`vendor/`) e o `design-brief.md` na raiz do projeto, como o SKILL.md define.
Num build Next.js, traduza os greps (tokens em `tailwind.config`/`globals.css`,
reveals em `motion/react`); a regra é a mesma.

## §A · Gate mecânico (no código)

Corrija todo item antes de capturar.

1. **Placeholders.** Zero `<...>`, `lorem`, `TODO`, `PLACEHOLDER`, `src=""`.
2. **Travessão.** Grep `—|–` no texto visível devolve nada (comentário de código
   pode).
3. **Paleta banida.** Nenhuma família de `design-recipe.md §2` nos tokens de
   `css/`: bege+latão, grafite+laranja, preto+neon, roxo de IA, nem a família do
   build anterior registrado no ledger. Só a cor de marca declarada pelo usuário
   libera, justificada no brief.
4. **Ração de eyebrows.** Conte só o kicker em caixa alta ou mono que fica
   DIRETAMENTE acima do título de seção, na mesma coluna. Máximo
   `ceil(seções / 3)`. Mono em outras funções (faixa de spec, legenda de métrica,
   cabeçalho de coluna do rodapé) não conta.
5. **Kit de assets referenciado.** Todo arquivo em `assets/` é usado por alguma
   página; o hero usa um asset gerado (nada de stock, picsum ou só gradiente);
   os ícones vêm do set gerado ou da biblioteca documentada como fallback; nada
   da lista "sempre" de `asset-system.md` está faltando em silêncio.
6. **Head kit completo.** Favicon (ico/svg + png), apple-touch-icon, 192/512 +
   maskable com `site.webmanifest`, `theme-color`, OG + twitter card com URL
   absoluta de imagem, `Organization` (ou o tipo específico) com `sameAs`, e,
   em post, `BlogPosting` com datas reais e autor com `url`.
7. **Descoberta liberada.** Toda página indexável leva
   `<meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">`
   (sem isso não há card de imagem grande, e na prática o Discover não mostra a
   página). **Uma só** meta robots por página: página `noindex` não recebe a de
   preview; quem publica troca uma pela outra, nunca deixa a página sem robots.
   Nenhum `nosnippet` ou `max-snippet:0` em página que quer ser citada.
8. **Imagem principal com 1200px+ de largura no arquivo** (meça o arquivo; o
   atributo `width` diz como ela é exibida, não o que ela tem) e referenciada em
   `og:image` com URL absoluta.
9. **Sitemap e feed existem de verdade.** Todo caminho em `robots.txt`
   (`Sitemap:`) ou em `<link rel="alternate">` responde 200. Site com conteúdo
   datado gera RSS 2.0 real (`pubDate` RFC822, `guid`, `atom:link rel=self`) e o
   regenera no mesmo passo que publica; feed velho é pior que feed nenhum.
10. **`VideoObject` só em vídeo assistível.** `<video autoplay muted loop>` sem
    `controls` é B-roll: não leva schema. Vídeo com schema tem controls, é
    conteúdo principal, e tem título, descrição e thumb.
11. **Sem `100vh` / `h-screen`.** `dvh` ou `svh`.
12. **Runtime.** Scripts com `defer` (ou no fim do body); a página é legível com
    JS desligado. Em Next.js: nada de `window`/`document` no topo de módulo.
13. **Reduced motion.** Toda fonte de animação (GSAP, Lenis, CSS) tem par em
    `prefers-reduced-motion` com o estado final estático.
14. **CTA.** Um rótulo por intenção na página inteira ("Fale com a gente" e
    "Entre em contato" juntos = falha); primário com até 3 palavras; nenhuma
    classe de botão compartilhada entre seções: cada CTA do inventário do brief
    é um componente próprio com interação própria.
15. **Reveal screenshot-safe.** Nada visível espera em `opacity: 0` por
    IntersectionObserver ou ScrollTrigger. Reveals partem de visível (y-offset,
    blur) ou disparam no mount, **e** levam rede de segurança fora do motor de
    animação (um `setTimeout` que escreve o estado final direto no DOM), porque
    o navegador não roda `requestAnimationFrame` em documento oculto (aba em
    segundo plano, prerender, robô de preview de link) e o conteúdo fica
    invisível para sempre. Número com count-up nasce com o valor final no HTML.
    Vídeo tem `poster`. Teste replicável: abrir a página numa aba oculta, contar
    `[style*="opacity:0"]` depois de 3 s, tem que ser 0.
16. **Tudo próprio em produção.** Grep `https?://` em HTML/CSS/JS: zero CDN de
    runtime (GSAP, Lenis, split-type em `vendor/`), fonte self-hosted em
    `assets/fonts/` ou stack de sistema, zero badge de terceiro. Link externo de
    conteúdo é normal.
17. **Ledger honrado.** O brief lista os seis eixos do build anterior (paleta,
    pairing de tipo, arquitetura do hero, Tier-1, garments de CTA, linguagem de
    canto) e este difere em 4 ou mais; os três garments racionados (underline
    desenhado, flood-fill no hover, bloco emoldurado) aparecem no máximo uma vez
    somados; a Tier-1 tem ID do `wow-catalog.md` e é interativa em
    cinema/spectacle.
18. **Plano de seções honrado.** A página construída bate com o plano do
    `design-brief.md` (famílias, ordem, sem repetição consecutiva). Se o plano
    mudou no build, o brief foi atualizado.
19. **Auto-auditoria de copy.** Cada string visível relida: nada quebrado,
    nada com referente obscuro, nenhum verbo de enchimento ("Eleve",
    "Revolucione"), nenhum número preciso sem fonte.
20. **Layout aguenta rótulo longo.** Todo componente rótulo + corpo (badge numa
    coluna, texto na outra) testado com o rótulo mais longo que o conteúdo real
    produz. `grid-template-columns: auto 1fr` + `white-space: nowrap` no rótulo
    é a armadilha: o rótulo incha a coluna e espreme o corpo em três palavras
    por linha. Padrão seguro: rótulo empilhado acima, corpo em largura total.
    Grep `nowrap` e confira cada ocorrência dentro de grid.
21. **Sticky vivo.** `position: sticky` morre quando um ancestral cria contexto
    de rolagem: `body { overflow-x: hidden }` mata. Use `overflow-x: clip`.
    `grid-row: 1 / -1` não cobre linha implícita; use `align-self: start` no
    item. Grep `overflow-x:\s*hidden` e `position:\s*sticky` juntos.
22. **Reflow, LCP, fontes, alvos, foco, formulário, nada rodando sozinho.** As
    regras estão em `design-recipe.md §10`; o gate confere: nenhuma largura fixa
    em px acima de 320 sem `max-width: 100%` · a imagem do hero com
    `fetchpriority="high"`, dimensões, `decoding="async"` e sem `loading="lazy"`,
    única com prioridade alta · `@font-face` com `font-display`, preload só da
    fonte do hero, fallback com `size-adjust` · nenhum `outline: none` sem
    `:focus-visible` · `scroll-padding-top` no `html` quando há header fixo ·
    nenhum `tabindex` positivo · um `<main>` · campos com label visível,
    `autocomplete`, `type`/`inputmode`, erro por `aria-describedby`, honeypot ·
    Consent Mode antes da tag quando há GA4/Pixel/Clarity · carrossel sem
    auto-avanço · `<video autoplay>` com `muted playsinline` e pausa ·
    `animation-timeline` só atrás de `@supports`.
23. **Medição, não achismo.** Quando o veredito depende de geometria (aperto,
    corte, vão, trilho sticky), meça com `getBoundingClientRect` em vez de
    julgar pelo PNG: sirva a pasta (`python -m http.server`) e leia via JS.
    Confira `innerWidth > 0` antes de acreditar em qualquer número: viewport
    zero colapsa todo grid e produz medida falsa.

## §B · Rubrica visual (nos PNGs e no checks.md)

```bash
node scripts/screenshot.js <index.html> <out_dir>
```

Gera `desktop-1440.png`, `mobile-390.png`, `checks.json` e `checks.md`. O
`checks.md` mede, em 1440, 390, 360 e 320: scroll horizontal (com o elemento
culpado), alvos menores que 24px, contraste computado de cada texto sobre o
fundo real, blocos presos em `opacity: 0` depois do load e com
`prefers-reduced-motion`, ordem de Tab com foco coberto por elemento fixo e sem
estilo de foco, CLS e long tasks durante o scroll, `<main>` e `lang`. Qualquer
linha em **BLOQUEANTES** é FAIL automático do item 8 abaixo, com a evidência já
escrita.

LER os PNGs (tool Read) e o `checks.md`. Dê PASS ou FAIL a cada item com uma
frase de evidência. Seja adversarial: você está caçando motivos para a página
parecer saída de template de IA. Junte todos os FAIL num lote de correção,
aplique, capture de novo uma vez.

> "Renderizou" não é QA. Slot de imagem vazio no full-page é bug real: o
> script já força eager, rola a página inteira e espera as imagens. Vão morto,
> imagem no formato errado, hero que não parece hero, palavra órfã: nada disso
> levanta erro; só aparece para quem OLHA.

1. **Primeira impressão (squint test).** Com os olhos semicerrados no hero: há
   um foco claro e uma próxima ação óbvia? Parece um site que um estúdio cobrou
   caro, ou uma demo de componentes?
2. **Disciplina do hero.** Tudo que importa na primeira dobra; título em até 2
   linhas; nenhuma pilha de micro-elementos (eyebrow + tagline + faixa de
   confiança); o asset gerado está visível e bem composto, não cortado em
   papa nem enterrado sob véu.
3. **Hierarquia de tipo.** Três níveis claros (display, título de seção,
   corpo); linhas até 65 caracteres; título não quebra em 4 linhas; descendente
   de itálico não corta; fontes conforme o brief.
4. **Trava de paleta.** Um acento em tudo; a página lê como UM tema de cima a
   baixo; contraste aguenta (nada de botão branco sobre branco, cinza sobre
   cinza); nenhum bege+latão por descuido.
5. **Variância de layout.** Rolando a página inteira: nenhuma família de layout
   repete em sequência, nenhuma corrente de 3 zigue-zagues, nenhum trio de cards
   idênticos, bento com todas as células preenchidas com variação real.
6. **Integração dos assets.** As imagens geradas parecem intencionais:
   proporção certa no slot, paleta da página, sem artefato de IA (texto
   embaralhado, mão deformada), sem caixa vazia ou ícone de imagem quebrada.
7. **Densidade e copy.** As seções respiram; sem tabela-despejo; copy curta e
   específica sem frase de IA; rodapé e nav parecem terminados.
8. **Integridade mobile (390, e 360/320 no `checks.md`).** Nav colapsa bem
   (2-4 itens visíveis mais "mais" vence hambúrguer puro); o hero ainda cabe e
   o asset ainda funciona; sem scroll horizontal em nenhuma das três larguras;
   seções multi-coluna empilham numa ordem deliberada; alvos de 24px ou mais;
   contraste medido de 4,5:1 ou mais; nada preso em opacity 0 com
   reduced-motion; foco por Tab nunca coberto pelo header; o efeito-assinatura
   degrada com graça ou é trocado pelo fallback estático.
9. **Fidelidade ao board, seção a seção.** Compare cada seção construída com o
   board em `refs/`: ainda carrega a composição, o caráter tipográfico e a
   lógica de componentes do board, ou derivou para um padrão de template que o
   board nunca mostrou? Seção que não lembra o board é FAIL dela.

Pontuação: 9/9 = pronto. FAIL nos itens 1-4, 8 ou 9 bloqueia. FAIL em 5-7
bloqueia na primeira passada; na segunda, anote o que sobrou como ajuste de
gosto para o usuário em vez de rodar de novo.
