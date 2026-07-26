---
name: auditoria
description: Audita um site inteiro em GEO (ser citado por ChatGPT/Perplexity/Gemini/Claude), SEO (técnico + conteúdo), MEDIÇÃO (Google Analytics instalado? formulário entrega o lead ou finge enviar?) e review de código — e RE-RODA em loop corrigindo até bater a nota-alvo, guiando o dono do site (mesmo leigo) a criar conta de Analytics e Search Console. Use SEMPRE que pedirem "audita o site X", "roda a auditoria no site", "checa o SEO/GEO de <domínio>", "meu site não aparece no ChatGPT", "por que não ranqueio", "review de código do site", "melhora a pontuação do site", "o site tem texto de outra marca / sobrou coisa do template", "o site pede chave de API", "meu site tem Google Analytics?", "o formulário está funcionando?", "não chega lead pelo site", "como instalo o Search Console", ou quando um site acabou de ser construído/entregue e precisa passar no crivo antes de virar oficial. Serve site NO AR (URL), pasta estática local e repositório (Next.js, Astro, WordPress, HTML puro — agnóstico de stack), com checks específicos de blog. É a irmã de verificação da `ultra:site` (que CONSTRÓI) — esta AUDITA e CORRIGE qualquer site, inclusive os que não nasceram da ultra-site. NÃO é pra auditar 1 página avulsa de conteúdo (`seo-page`), nem pra planejar keywords do zero (`seo-plan`), nem pra redesenhar visual (`impeccable`/`hallmark`).
---

# Ultra-Auditoria — o site passa no crivo, ou não é entrega

Um site que "ficou bonito e subiu" ainda não é um site entregue. Esta skill responde quatro perguntas com prova, não com opinião:

1. **A IA consegue te citar?** (GEO) — quando alguém pergunta ao ChatGPT/Perplexity "quem faz X em Y", você aparece?
2. **O Google consegue te entender?** (SEO técnico + conteúdo)
3. **O site está medindo e captando?** — tem Analytics instalado, e o formulário entrega o lead ou só *diz* que entregou?
4. **O código aguenta?** (segurança, acessibilidade, performance, resíduo de molde)

E aí **corrige e roda de novo**, até bater a nota — ou até dizer com todas as letras o que falta e por que não dá pra resolver no código.

A pergunta 3 existe porque as duas piores falhas que esta skill já encontrou num site real não eram de ranking. Eram: **zero medição instalada** (o dono não fazia ideia se alguém visitava) e **um formulário que mostrava "recebemos sua mensagem" e jogava o lead fora** — em todas as páginas, por meses. Nenhuma auditoria de SEO pega isso, e é o que mais custa dinheiro.

> Caminho-base: a pasta desta skill (`skills/auditoria/`).

## 🩸 Princípios inquebráveis (lê PRIMEIRO)

1. **O gate é mecânico antes de ser opinião.** Sempre roda `scripts/audit.mjs` ANTES de olhar o site com olho humano. Nota que sai de leitura sem o script rodado é achismo — e achismo não sobrevive a uma segunda rodada.
2. **Honestidade > cobertura.** Check que não deu pra medir vira **"não medido"** e sai do denominador. Nunca vira 0 forçado, nunca vira "não tem". O script já faz isso; a sua leitura também tem que fazer. A pergunta que atravessa toda conclusão é **"eu medi isso, ou eu deduzi isso?"** — e as seis armadilhas que mais derrubam auditor estão em `references/como-nao-reportar-mentira.md`.
3. **Todo achado carrega a evidência.** A linha real do HTML, o trecho do texto no ar, o caminho do arquivo. Achado sem evidência colável não entra no relatório — vira ruído que ninguém consegue conferir nem corrigir.
4. **Zero número inventado.** Não existe "isso melhora 40% o tráfego". Onde houver estatística, ela vem da `references/regua-geo.md` com fonte nomeada. Onde não houver, o achado é qualitativo e é dito como qualitativo.
5. **Resíduo de molde é P0, sempre.** Site que ainda conta a história da marca de origem não é "detalhe de copy" — é o site dizendo pro leitor e pra IA que ele é outra empresa. Ver `references/cicatrizes-de-molde.md`.
6. **Escrito pra quem não é técnico.** O relatório vai pra dono de site, não pra dev. Todo termo técnico ganha explicação curta na primeira aparição ("canonical — a etiqueta que diz ao Google qual é o endereço oficial da página"). Cada achado vira três linhas: **o que está acontecendo · por que isso custa · o que fazer**. E o que só a pessoa pode fazer (criar conta, verificar posse) vira **passo a passo guiado**, um de cada vez — ver `references/guia-do-leigo.md`.
7. **"Instalado" só depois de verificado.** Analytics é verificado vendo o visitante aparecer no relatório em tempo real. Formulário é verificado **enviando de verdade** e confirmando que chegou no destino. Ler o código não prova nada — código certo com lead que não chega é a combinação mais comum que existe.
8. **Não publica nem faz deploy sozinho.** Corrige no código local e entrega o diff. Subir pra produção é decisão de quem é dono do site — e num site no ar cada deploy tem custo e risco.

## Fluxo (6 fases · nenhuma pulável)

### 0 · Intake (uma rodada de perguntas, nunca uma segunda)

Só o que não dá pra descobrir sozinho, no máximo 4 numa tacada:

- **Alvo:** URL no ar, pasta local, ou os dois? E o **repositório** do código (sem ele o review de código não acontece — diga isso explicitamente).
- **Marca e setor declarados:** o nome exato e o que o negócio faz. É o gabarito do teste de resíduo — sem isso o auditor não consegue saber que a descrição no ar é de outro negócio.
- **De qual molde/template esse site nasceu?** (motor de sites, tema comprado, clone de outro projeto, do zero). Se nasceu de um molde, os termos daquele molde entram no `--forbid`.
- **Autonomia:** eu corrijo direto no repo e te entrego o diff, ou levanto tudo e você decide item a item?

Sem resposta em algum ponto: assuma o default sensato, **declare a suposição em uma linha** e siga. Nunca trave a auditoria esperando resposta — o gate mecânico roda de qualquer jeito.

### 1 · Gate mecânico (o script · antes de qualquer leitura)

Na primeira vez numa máquina — e sempre depois de mexer no `audit.mjs` — rode o teste de fumaça antes de auditar site de verdade. São 5 segundos, e ele prova as duas metades: que o auditor **acusa** o que tem defeito e que **não acusa** o que está certo.

```bash
node scripts/smoke.mjs
```

Ele monta um site de mentira com defeitos conhecidos, roda a auditoria em cima e confere 27 propriedades — incluindo a mais importante do loop: **um site correto atinge o gate**. Se o gate fosse inalcançável, o loop nunca terminaria em sucesso. Saiu diferente de `27/27 · OK`? Conserte antes de auditar qualquer coisa: auditor quebrado devolve conforto falso, que é pior que não auditar.

```bash
node scripts/audit.mjs --url https://www.exemplo.com \
  --brand "Nome Exato da Marca" --sector "setor declarado" \
  --forbid "termo-do-molde,outro-termo" \
  --repo C:/Repos/o-repo --max 30 --out ./audit/rodada-1 --round 1
```

Pasta local: troque `--url` por `--dir ./dist --base https://exemplo.com`.

Saída: `AUDITORIA.md` (leitura humana) + `audit-report.json` (o estado que a próxima rodada compara).

O script mede 6 eixos e devolve nota por eixo: **SEO técnico · SEO de conteúdo · GEO · Integridade de marca · Medição & conversão · Código & qualidade**. Ele cobre o que é objetivamente verificável — title/description/canonical, H1, hierarquia de headings, JSON-LD válido, FAQ que bate com a página, robots.txt, sitemap, llms.txt, apex×www, soft-404, órfãs, títulos duplicados, alt de imagem, headers de segurança, resíduo de molde, **ferramenta de medição instalada (GA4/GTM/Plausible/Umami/Clarity/Meta Pixel e mais) e se está duplicada, formulários e seus destinos, schema/data/autor em post de blog**, e a varredura de código.

Cobre também os **gates de descoberta** — as portas que ficam fechadas por omissão e que nenhum checklist de presença enxerga, porque não há nada de errado no que existe; falta o que não está lá:

- `max-image-preview:large` e `max-snippet:-1` em toda página indexável. Sem a primeira, a página é **inelegível ao Google Discover por definição**, com schema, autor e imagem perfeitos. Cicatriz real: 129 páginas sem essa linha = Discover a zero por 90 dias, depois de três auditorias que não pegaram.
- **Uma só** `<meta name="robots">` por página (duas = diretivas conflitantes). E página `noindex` não é cobrada pela tag de preview — quem publica **troca** o `noindex` pela tag, não apaga deixando a página sem robots.
- **Imagem principal com 1200px+**, medida nos bytes do arquivo. O atributo `width` do HTML mente: ele diz como a imagem é exibida, não o que ela tem. Abaixo de 1200 não há card grande nem com a tag certa.
- **Todo sitemap e feed declarado responde 200.** Cicatriz: um `sitemap.rss` submetido devolvia 404 havia três meses — nada no site apontava pra ele, só o painel do Google sabia.
- **`VideoObject` só onde há vídeo assistível.** B-roll decorativo (`autoplay muted loop` sem `controls`) marcado como vídeo não rende impressão e cria descompasso markup×página. E o inverso — vídeo assistível sem schema — é oportunidade perdida.

Se o site tem blog, os checks de blog entram sozinhos (detecta pelo schema **e** pela URL, porque em muito WordPress o post mora na raiz). Se não tem, saem como "não medido" em vez de punir — auditoria não cobra o que não existe, e feed RSS sugerido pra landing de uma página queima a confiança no resto do relatório.

**Cicatriz de ambiente (máquina do Gui):** o antivírus faz MITM do TLS. Se der erro de certificado, rode com `NODE_OPTIONS=--use-system-ca node scripts/audit.mjs …`. O script imprime esse aviso sozinho quando detecta.

### 2 · Leitura de citabilidade (o que a máquina não vê)

Ler `references/regua-geo.md` e aplicar nas 3-5 páginas que mais importam (home + as páginas de oferta + o post mais forte). O script mede *forma*; aqui você julga *substância*:

- Existe **frase-tese citável** por seção — curta, declarativa, que faz sentido arrancada do contexto?
- Cada claim forte tem **nome próprio + número + fonte**? (Evidência documental é a maior alavanca de citação — e supera autoridade de domínio.)
- Existe **dado de primeira mão** que só essa marca tem, ou é a média da internet reescrita? (Genérico *derruba* a probabilidade de citação — não é neutro.)
- O **título** é a dor que a pessoa digita, ou o jargão da solução?
- A **entidade** está coerente: mesmo nome, mesma URL, mesmo tipo de schema, no site, no llms.txt e nos perfis externos?

Cada resposta "não" vira achado com o trecho real colado. Cada resposta "sim" também é registrada — a auditoria não é uma lista de defeitos, é um retrato.

### 2b · Medição & conversão (o instrumento, não um extra)

Ler `references/guia-do-leigo.md`. O script diz **se** existe medição e **se** o formulário tem destino; esta fase resolve o que fazer a respeito — e boa parte disso a pessoa tem que fazer com a conta dela.

**O formulário vem primeiro, sempre.** É o único achado desta skill que já está custando dinheiro *agora*, em vez de custar oportunidade. A verificação é enviar de verdade e confirmar que chegou no destino — nunca ler o código e concluir. Três perguntas ao dono, nesta ordem: *quando alguém preenche, onde você espera ver isso? · quando foi o último lead que chegou por aí? · você recebe confirmação, ou só o site diz que enviou?* Hesitação na primeira já é o achado.

Depois, na ordem: **Analytics** (grátis, ~15 min, e o dado que não se coleta hoje não volta depois) → **Search Console** (o que as pessoas digitam pra te achar) → **Google Business Profile**, se o negócio atende algum lugar físico.

Quando o dono não é técnico, conduza **um passo por vez, com confirmação antes do próximo**. Peça só o que é público (o código `G-XXXXXXXXXX`) — **nunca senha, nunca acesso à conta dele**. E diga o tempo e o custo antes de cada etapa: "15 minutos, de graça" derruba mais resistência que qualquer explicação técnica.

### 3 · Review de código (com `--repo`)

O script já grepa os padrões que quebram site (segredo no bundle do cliente, HTML injetado, CDN externo, chave de API exigida, prosa de negócio cravada em componente). Ler `references/review-de-codigo.md` e complementar com o que exige julgamento: fronteira servidor/cliente, tratamento de erro, acessibilidade real (foco, contraste, ordem de tab), peso de bundle, imagem sem otimização, dependência abandonada.

**Regra de ouro deste eixo:** *toda chave de API que o código exige é uma conta e uma fatura que alguém vai ter que manter.* Feature que o dono do site não pediu e que exige chave paga é achado, não funcionalidade. Ver `references/cicatrizes-de-molde.md §2`.

### 4 · Plano de correção priorizado

Ordem: **P0 → P1 → P2**, e dentro de cada faixa, por alavanca ÷ esforço. Formato de cada item:

```
### [P0] llms.txt descreve outro negócio
**O que está acontecendo:** o arquivo /llms.txt — o resumo que você entrega pronto
pras IAs — diz que a empresa é uma agência de marketing. A empresa
não é uma agência de marketing.
**Por que custa:** é literalmente o primeiro parágrafo que ChatGPT e Perplexity leem
sobre você. Hoje eles aprendem a coisa errada.
**Onde:** src/app/llms.txt/route.ts:22 (texto fixo no código, não vem do config)
**Correção:** puxar o resumo de siteConfig.description e apagar o texto fixo.
**Esforço:** 10 min.
```

Itens que **não** são corrigíveis no código (falta de conteúdo real, ausência de prova, decisão de posicionamento) vão numa seção própria — **"o que depende de você, não de mim"** — com o porquê. Não some com eles nem finja que foram resolvidos.

### 5 · Loop de correção (a parte que faz a nota subir)

Este é o coração da skill. O ciclo:

1. **Aplicar as correções** de uma faixa inteira (todos os P0 juntos, depois todos os P1) — não item a item. Corrigir em lote e medir uma vez é mais barato e mostra o efeito real.
2. **Re-rodar** o script com `--out ./audit/rodada-N --round N`.
3. **Comparar** com a rodada anterior: `node scripts/progresso.mjs ./audit/rodada-1/audit-report.json ./audit/rodada-2/audit-report.json`. Ele diz o que subiu, o que caiu, o que foi resolvido e **o que apareceu de novo** (correção que quebra outra coisa é comum).
4. **Repetir.**

**Quando parar** — três condições, e você anuncia qual delas parou o loop:
- ✅ **Gate atingido:** zero P0 e todos os eixos ≥ 90. É o alvo.
- ⏸️ **Platô:** duas rodadas seguidas com ganho < 3 pontos na nota geral. Continuar é queimar tempo — pare e reporte o que travou.
- 🚧 **Teto humano:** o que resta depende de conteúdo, decisão ou acesso que você não tem. Diga exatamente o que é e quem precisa fazer.

Teto duro de **5 rodadas**. Se chegou lá sem passar, o relatório final abre com *por que* — não com desculpa.

> **Nunca** infle a nota afrouxando o critério pra "fechar" a rodada. A nota existe pra ser confiável entre projetos; nota inflada é pior que nota baixa, porque some com o problema.

### 6 · Entrega + registro

Entregar:
- `AUDITORIA.md` da última rodada + o comparativo entre a primeira e a última (a curva é a prova do trabalho).
- O **diff** das correções aplicadas (nunca deploy — ver princípio 7).
- A seção **"o que depende de você"**.
- **Caminho absoluto em texto puro** dos arquivos gerados (além do link).

Se o molde de origem tinha um defeito que vai se repetir em todo site nascido dele (foi o caso do resíduo de marca), **corrija no molde também** e diga que corrigiu — senão o próximo site nasce com o mesmo bug. Registrar a cicatriz em `references/cicatrizes-de-molde.md` e, no ambiente do Gui, logar em `C:\GuiOS\GuiOS\90_Meta\Logs\`.

## Referências (ordem de leitura)

0. `references/como-nao-reportar-mentira.md` — **leia antes de escrever qualquer achado.** As seis armadilhas de leitura de dado que fazem o auditor reportar problema que não existe, cada uma na forma "se X, então não conclua Y". Achado falso custa mais que achado ausente: depois de dois, a pessoa para de ler o relatório inteiro.
1. `references/guia-do-leigo.md` — Fase 2b: passo a passo de Analytics, Search Console e teste de formulário, escrito pra quem não é técnico. **Leia antes de instruir qualquer dono de site.**
2. `references/regua-geo.md` — Fase 2: as 5 dimensões de GEO com peso + a régua de citabilidade de 10 itens + o que só o humano julga.
3. `references/rubrica-seo.md` — Fases 1-2: o que o script cobre, o que ele não cobre, e como ler os dois.
4. `references/review-de-codigo.md` — Fase 3: o checklist de código por stack.
5. `references/cicatrizes-de-molde.md` — transversal: resíduo de marca, chave de API, formulário-fantasma, e os bugs que já foram pro ar.

## Scripts

- `scripts/smoke.mjs` — **roda isto primeiro.** 27 asserções contra um site de mentira: acusa o que tem defeito, não acusa o que está certo, e prova que o gate é alcançável. Sem argumento, 5 segundos.
- `scripts/audit.mjs` — o gate mecânico. Zero dependências (Node 18+). `--url` (site no ar) ou `--dir` (pasta local, com `--base <url>` pra checar host e imagens), `--repo` pro review de código, `--brand`/`--sector`/`--forbid` pro teste de resíduo, `--allow` pra marca de terceiro citada de propósito (empregador, cliente, parceiro — sem isso o auditor acusa menção legítima). Emite `AUDITORIA.md` + `audit-report.json`.
- `scripts/progresso.mjs` — compara duas rodadas: nota por eixo, resolvidos, regressões, novos.
- `scripts/residue-lexicon.json` — os termos que denunciam molde herdado. **Ao auditar um site vindo de um molde novo, acrescente os termos daquele molde aqui** — é isso que faz o teste pegar o resíduo no próximo site em vez de depender de alguém reparar.

## Interação com outras skills

- **`ultra:site`** constrói; esta audita. Todo site que sai da ultra-site passa aqui antes de virar entrega (a ultra-site aponta pra cá na Fase 8).
- Se estiverem instaladas, `seo-geo`, `seo-audit` e `web-quality-audit` complementam com ângulos extras (Lighthouse, keyword research). **Esta skill não depende delas** — ela é auto-contida de propósito, porque vai pra mão de mentorado que pode não ter esse arsenal.
- Auditoria de **uma página só** de conteúdo → `seo-page`. **Plano de keywords do zero** → `seo-plan`. **Problema é visual, não de ranking** → `impeccable` / `hallmark`.
