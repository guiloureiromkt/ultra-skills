---
name: auditoria
description: Audita um site inteiro com prova, não com opinião, em seis eixos. GEO (a IA consegue citar: ChatGPT, Perplexity, Gemini/AI Mode, Claude, Copilot), SEO técnico e de conteúdo, integridade de marca (sobrou texto de outro negócio ou do template), medição e conversão (Analytics instalado e com consentimento, formulário que entrega o lead ou só finge, WhatsApp medido) e código (segredo vazado, chave de API exigida, acessibilidade, performance). Corrige em loop até bater a nota-alvo e guia o dono do site, mesmo leigo, a criar Analytics e Search Console. Use para qualquer pedido de auditar, checar ou melhorar um site, "por que não apareço no Google / no ChatGPT", "o formulário funciona?", "tem Analytics?", "sobrou coisa do template", ou quando um site acabou de ser construído e precisa passar no crivo antes de virar oficial. Serve site no ar (URL), pasta estática local e repositório, agnóstico de stack. Não é para auditar uma página de conteúdo isolada, planejar keywords do zero nem redesenhar visual.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(node ${CLAUDE_SKILL_DIR}/scripts/*)
---

# ultra:auditoria — o site passa no crivo, ou não é entrega

Um site que "ficou bonito e subiu" ainda não foi entregue. Esta skill responde quatro perguntas com evidência colada:

1. **A IA consegue te citar?** Quando alguém pergunta ao ChatGPT ou ao Google "quem faz X em Y", você está na resposta?
2. **O Google consegue te entender?** Técnica e conteúdo.
3. **O site está medindo e captando?** Analytics instalado e dentro da lei; formulário que entrega o lead, não que só diz que entregou.
4. **O código aguenta?** Segredo, custo escondido, acessibilidade, performance, texto herdado de outra marca.

Depois corrige e roda de novo, até bater a nota ou até dizer com todas as letras o que falta e por que não se resolve no código.

A pergunta 3 existe porque as duas piores falhas já encontradas por esta skill em site real não eram de ranking: nenhuma medição instalada, e um formulário que mostrava "recebemos sua mensagem" e descartava o contato, em todas as páginas, por meses. Nenhuma auditoria de SEO pega isso, e é o que mais custa dinheiro.

Caminho-base: a pasta desta skill (`${CLAUDE_SKILL_DIR}`).

## O que não se negocia (e por quê)

1. **O gate é mecânico antes de ser opinião.** `scripts/audit.mjs` roda antes de qualquer leitura humana. Nota que sai de leitura sem o script é achismo, e achismo não sobrevive à segunda rodada.
2. **Honestidade acima de cobertura.** O que não deu para medir vira **"não medido"** e sai do denominador; nunca vira zero forçado nem "não tem". A pergunta que atravessa toda conclusão: *eu medi isso ou deduzi isso?* As armadilhas que mais derrubam auditor estão em `references/como-nao-reportar-mentira.md`; leia antes de escrever o primeiro achado, porque achado falso custa mais que achado ausente: depois de dois, a pessoa para de ler o relatório.
3. **Todo achado carrega evidência colável.** A linha do HTML, o trecho no ar, o caminho do arquivo. Sem isso ninguém confere nem corrige.
4. **Zero número inventado.** Estatística só com fonte e data, de `references/regua-geo.md`. Sem fonte, o achado é qualitativo e é dito como qualitativo.
5. **Resíduo de molde é P0.** Site que ainda conta a história da marca de origem diz ao leitor e à IA que é outra empresa. `references/cicatrizes-de-molde.md`.
6. **Escrito para quem não é técnico.** O relatório vai para dono de site. Termo técnico ganha explicação curta na primeira aparição ("canonical, a etiqueta que diz ao Google qual é o endereço oficial da página"). Cada achado em três linhas: o que está acontecendo · por que custa · o que fazer. O que só a pessoa pode fazer (criar conta, verificar posse) vira passo a passo, um de cada vez: `references/guia-do-leigo.md`.
7. **"Instalado" só depois de verificado.** Analytics se confirma vendo o visitante no relatório em tempo real. Formulário se confirma enviando de verdade e achando o envio no destino. Código certo com lead que não chega é a combinação mais comum que existe.
8. **Não publica nem faz deploy.** Corrige no código local e entrega o diff. Subir é decisão de quem é dono do site.

## Fluxo (a ordem importa: cada fase alimenta a seguinte)

### 0 · Intake, uma rodada só
No máximo 4 perguntas, só o que não dá para descobrir sozinho: **alvo** (URL no ar, pasta local, ou os dois) e o **repositório** (sem ele não há review de código nem prova do destino do formulário; diga isso) · **marca e setor declarados** (o gabarito do teste de resíduo) · **de que molde o site nasceu** (motor de sites, tema comprado, clone; os termos do molde entram em `--forbid`) · **autonomia** (corrijo no repo e entrego o diff, ou levanto tudo e você decide item a item). Sem resposta, assuma o default sensato, declare em uma linha e siga. O gate mecânico roda de qualquer jeito.

### 1 · Gate mecânico
Na primeira vez numa máquina, e sempre depois de mexer no `audit.mjs`, prove o auditor antes de auditar: ele monta um site de mentira com defeitos conhecidos e confere que acusa o que tem defeito, que não acusa o que está certo, e que um site correto atinge o gate (sem isso o loop nunca terminaria). Tem que sair `OK` em todas as asserções.

```bash
node ${CLAUDE_SKILL_DIR}/scripts/smoke.mjs
```

```bash
node ${CLAUDE_SKILL_DIR}/scripts/audit.mjs --url https://www.exemplo.com \
  --brand "Nome Exato da Marca" --sector "setor declarado" \
  --forbid "termo-do-molde,outro-termo" \
  --repo ./caminho/do/repo --max 30 --out ./audit/rodada-1 --round 1
```

Pasta local: `--dir ./dist --base https://exemplo.com` no lugar de `--url`.

**Site em homologação (ambiente de teste que vai migrar de endereço):** o sitemap muitas vezes já lista o domínio final. Por padrão o auditor só audita o host apontado em `--url` (`www` e sem `www` contam como o mesmo) e diz, como "não medido", quantas URLs de outros hosts deixou de fora. Se o crawler achar menos páginas do que o site tem (ele segue um nível de links), passe a lista: `--urls paginas.txt`, uma página por linha. Declare `--brand` com o nome **exato** que o site usa ("Iza Criativa Studio", não "Iza Criativa"), senão o `llms.txt` vira falso alarme. O auditor também lê o cabeçalho `x-robots-tag`: em homologação ele costuma estar lá de propósito, e o achado diz isso, mas no site no ar é P0. Saída: `AUDITORIA.md` (leitura humana) e `audit-report.json` (o estado que a próxima rodada compara). Se a rede recusar o certificado (antivírus ou proxy interceptando HTTPS), o script imprime o `NODE_OPTIONS=--use-system-ca` a usar.

O que ele mede, eixo a eixo, está em `references/rubrica-seo.md` Parte A: o verificável de SEO e GEO, a medição (instalada, sem duplicidade, **com consentimento declarado antes da tag**), formulários e WhatsApp, schema de post, acessibilidade e performance que o HTML prova, e a varredura de código. Dois pontos que checklist comum erra: os **gates de descoberta** (o que falta, não o que existe: `max-image-preview:large`, `nosnippet`, imagem principal medida no arquivo, feed declarado respondendo 200) e a **separação entre crawler de busca e de treino**: bloquear OAI-SearchBot, Claude-SearchBot, PerplexityBot, Bingbot ou Googlebot é P0, porque sem eles a IA não cita; bloquear GPTBot, ClaudeBot ou Google-Extended é decisão de licenciamento e só informa.

Blog: os checks de post entram sozinhos quando existe post (pelo schema e pela URL). Sem blog, saem como "não medido"; auditoria não cobra o que não existe.

### 2 · Leitura de citabilidade (o que a máquina não vê)
`references/regua-geo.md`, nas 3-5 páginas que mais importam (home, páginas de oferta, o post mais forte). O script mede forma; aqui você julga substância: resposta direta no primeiro bloco de cada página · frase-tese citável por seção · cada afirmação forte com nome próprio, número e fonte · dado de primeira mão que só essa marca tem (conteúdo genérico derruba a chance de citação, não é neutro) · título que é a dor que a pessoa digita, não o jargão da solução · entidade coerente (mesmo nome, mesma URL, mesmo tipo de schema no site, no `llms.txt` e nos perfis externos) · conteúdo atualizado de verdade (a maioria das páginas citadas foi mantida no último ano; mudar a data sem mudar o texto é sinal negativo para o Google). Cada "não" vira achado com o trecho colado; cada "sim" também é registrado. A auditoria é um retrato, não uma lista de defeitos.

### 2b · Medição e conversão (o instrumento, não um extra)
`references/guia-do-leigo.md`. O script diz se existe medição e se o formulário tem destino; esta fase resolve o que fazer, e boa parte a pessoa faz com a conta dela.

**O formulário vem primeiro, sempre.** É o único achado desta skill que já está custando dinheiro agora. Três perguntas ao dono, nesta ordem: *quando alguém preenche, onde você espera ver isso? · quando foi o último lead que chegou por aí? · você recebe confirmação, ou só o site diz que enviou?* Hesitação na primeira já é o achado. Depois: Analytics (grátis, 15 minutos; o dado que não se coleta hoje não volta), com consentimento antes da tag (Consent Mode resolve sem perder dado; site sem cookie não essencial dispensa banner) → Search Console → Bing Webmaster Tools (é o índice do ChatGPT e do Copilot, e tem relatório de citações em IA) → Google Business Profile, se há atendimento físico. Um passo por vez, com confirmação antes do próximo. Peça só o que é público (o código `G-XXXXXXXXXX`); nunca senha, nunca acesso à conta.

### 3 · Review de código (com `--repo`)
O script grepa o que quebra site: segredo no bundle do cliente, chave de API exigida, CDN externo, prosa de negócio cravada em componente, formulário sem destino. `references/review-de-codigo.md` cobre o que exige julgamento: fronteira servidor/cliente, conteúdo que só existe depois do JavaScript (crawler de IA não executa JS), acessibilidade real, peso de bundle, imagem sem otimização, dependência abandonada. Regra do eixo: *toda chave de API que o código exige é uma conta e uma fatura que alguém vai manter*. Feature não pedida que exige chave paga é achado, não funcionalidade.

### 4 · Plano de correção
Ordem: P0 → P1 → P2, e dentro de cada faixa por alavanca ÷ esforço. Cada item:

```
### [P0] llms.txt descreve outro negócio
**O que está acontecendo:** o arquivo /llms.txt diz que a empresa é uma agência
de marketing. A empresa não é uma agência de marketing.
**Por que custa:** é o resumo que um agente de IA lê quando o usuário aponta pro
site. Hoje ele aprende a coisa errada.
**Onde:** src/app/llms.txt/route.ts:22 (texto fixo no código, não vem do config)
**Correção:** puxar o resumo de siteConfig.description e apagar o texto fixo.
**Esforço:** 10 min.
```

O que não se corrige no código (falta de conteúdo real, ausência de prova, decisão de posicionamento) vai numa seção própria, **"o que depende de você, não de mim"**, com o porquê. Não some com isso nem finja que resolveu.

### 5 · Loop de correção
1. Aplicar as correções de uma faixa inteira (todos os P0, depois todos os P1), não item a item: corrigir em lote e medir uma vez mostra o efeito real.
2. Re-rodar com `--out ./audit/rodada-N --round N`.
3. Comparar: `node ${CLAUDE_SKILL_DIR}/scripts/progresso.mjs rodada-1/audit-report.json rodada-2/audit-report.json` diz o que subiu, caiu, resolveu e **o que apareceu de novo** (correção que quebra outra coisa é comum).
4. Repetir.

Parar por uma de três razões, e dizer qual: **gate atingido** (zero P0 e todos os eixos ≥ 90) · **platô** (duas rodadas seguidas com ganho menor que 3 pontos) · **teto humano** (o que resta depende de conteúdo, decisão ou acesso que você não tem). Teto duro de 5 rodadas; se chegou lá sem passar, o relatório final abre com o porquê. Nunca afrouxe o critério para fechar a rodada: nota inflada some com o problema e deixa de valer entre projetos.

### 6 · Entrega e registro
`AUDITORIA.md` da última rodada e o comparativo entre a primeira e a última (a curva é a prova do trabalho) · o diff das correções (sem deploy) · a seção "o que depende de você" · **caminho absoluto em texto puro** dos arquivos gerados. Se o molde de origem tinha o defeito, corrija no molde e acrescente os termos dele ao `scripts/residue-lexicon.json`; senão o próximo site nasce com o mesmo bug.

## Referências (quando ler)
- `references/como-nao-reportar-mentira.md` — antes do primeiro achado: as armadilhas de leitura de dado, na forma "se X, não conclua Y".
- `references/guia-do-leigo.md` — Fase 2b: Analytics, consentimento, Search Console, Bing, teste de formulário, WhatsApp, escrito para quem não é técnico.
- `references/regua-geo.md` — Fase 2: o que a evidência de 2025-2026 diz sobre ser citado, por plataforma, com fonte; e o que só o humano julga.
- `references/rubrica-seo.md` — Fases 1-2: o que o script cobre, o que não cobre, como ler a nota.
- `references/review-de-codigo.md` — Fase 3: segredo, crawler, acessibilidade (WCAG 2.2), performance, robustez.
- `references/cicatrizes-de-molde.md` — transversal: os bugs que já foram pro ar e como pegar cada um.

## Scripts
- `scripts/smoke.mjs` — roda primeiro. Prova que o auditor acusa defeito, não acusa acerto, e que o gate é alcançável.
- `scripts/audit.mjs` — o gate mecânico. Zero dependências (Node 18+). `--url` ou `--dir` (+ `--base <url>`), `--repo`, `--brand`, `--sector`, `--forbid`, `--allow` (marca de terceiro citada de propósito: empregador, cliente), `--max`, `--out`, `--round`.
- `scripts/progresso.mjs` — compara duas rodadas.
- `scripts/residue-lexicon.json` — termos que denunciam molde herdado. Molde novo, termos novos aqui.

## Interação com outras skills
- `ultra:site` constrói; esta audita. Todo site que sai de lá passa aqui antes de virar entrega.
- Skills de SEO, Lighthouse ou keyword research, se instaladas, complementam. Esta não depende de nenhuma: é auto-contida de propósito, porque vai para a mão de quem pode não ter esse arsenal.
- Se houver ferramenta de **medição real de citação** (share of model, MCP de SERP, o relatório AI Performance do Bing Webmaster Tools, o AI Mode somado no Search Console), ela testa se a IA cita o site hoje; complementa a Fase 2 (`references/regua-geo.md`, verificação com dado real), não a substitui.
