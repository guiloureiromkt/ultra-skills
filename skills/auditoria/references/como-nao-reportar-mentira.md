# Como não reportar mentira — as regras do auditor

Todo check deste arquivo é sobre **você**, não sobre o site. São armadilhas de leitura de dado: momentos em que a ferramenta responde uma coisa, você entende outra, e o relatório sai com um problema que não existe.

Isso é pior que não achar o problema. Achado falso gasta o tempo de quem vai corrigir, e depois de dois deles a pessoa para de ler o relatório inteiro — inclusive os P0 verdadeiros.

**As dezessete abaixo são erros reais, cometidos em campo ou prescritos por guias desatualizados, cada um a poucos segundos de virar um achado inventado num relatório entregue.**

---

## B1 · "Indexadas: 0" no painel de sitemaps é campo morto

**Se** você está lendo o número de páginas indexadas na Sitemaps API do Search Console, **não conclua** que o site não está indexado.

Esse campo é legado: o Google não popula mais e devolve `0` pra todo mundo. Acreditar nele leva a reportar "nenhuma página indexada" enquanto a home e dezenas de posts estão indexados e recebendo tráfego.

**A verdade vem do URL Inspection** (`urlInspection/index:inspect`), uma URL por vez, ou do relatório *Páginas* na interface. Se você não rodou nenhum dos dois, o estado correto é **"não medido"** — não "zero".

---

## B2 · Nunca chutar um endereço a partir do título

**Se** você não listou os endereços reais, **não conclua** que uma página não está indexada.

O caminho errado é: ver o título de um post, deduzir o slug, inspecionar, receber "o Google não reconhece este URL" e reportar um buraco de indexação. O buraco era a URL inventada — a página real existia com outro endereço, indexada.

**Sempre liste primeiro**: o sitemap, o filesystem, ou o crawl. Audite só endereços que você viu escritos em algum lugar. Isto vale além do Search Console: é a regra geral de não inventar o objeto da auditoria.

---

## B3 · Largura zero invalida qualquer medida de layout

**Se** `window.innerWidth` for `0`, **não conclua** nada sobre aperto, corte ou vão.

Painéis de preview e navegadores sem interface às vezes reportam viewport zero. Aí todo `grid` colapsa e `getBoundingClientRect` devolve números falsos — já foi medido "54px" numa caixa que tinha 968px, e o achado de "texto espremido" era pura ficção.

**Confirme `innerWidth > 0` antes de acreditar em qualquer medida.** Se for zero, force a largura do container e meça de novo, ou declare não medido.

---

## B4 · Screenshot que trava não vira veredito

**Se** a captura de tela estourou o tempo, **não conclua** que a página está quebrada, nem insista.

Captura via protocolo de depuração congela em página pesada — já estourou 30 segundos duas vezes seguidas. É limite da ferramenta, não sintoma do site.

**Caia pra leitura textual** (o HTML, a árvore de acessibilidade, medição via JavaScript). Quando precisar de captura, o caminho que funciona é `puppeteer-core` + Chrome instalado (o `screenshot.js` da `ultra:site`), não o preview embutido de um painel.

---

## B5 · Prefixo de URL e domínio são propriedades diferentes

**Se** a API do Search Console devolveu 404, **não conclua** que o site não está cadastrado.

`https://site.com.br/` e `sc-domain:site.com.br` são **duas propriedades distintas**. Pedir dado da que não existe devolve 404 com mensagem que parece dizer "não há dados".

**Liste o que a conta enxerga antes de qualquer consulta** (`gsc.mjs check`). E o irmão desta armadilha vale sem API nenhuma: propriedade cadastrada em `site.com.br` quando o site serve em `www.site.com.br` mostra relatório vazio pra sempre.

---

## B6 · Volume baixo pode ser idade, não defeito

**Se** o sitemap foi submetido há poucos dias, **não conclua** que o desempenho é ruim.

Sitemap de cinco dias com 68 impressões não é site fraco — é índice novo. Recomendar otimização de CTR em cima disso é ruído com cara de análise.

**Antes de recomendar qualquer ajuste de desempenho, olhe a data de submissão e a data do último rastreamento.** Sem pelo menos 28 dias de dado, a leitura honesta é "ainda não dá pra dizer".

---

## B7 · `Disallow: /` pertence a um bloco, não ao arquivo

**Se** o robots.txt tem um `Disallow: /` em algum lugar, **não conclua** que ele vale pro bot que você está checando.

O robots.txt é lido em **grupos**: um ou mais `User-agent:` seguidos das regras que valem só pra eles, até o próximo grupo. Procurar o nome do bot e depois varrer os próximos caracteres atrás de um `Disallow: /` atravessa a fronteira do bloco — e a regra de um bot vira acusação contra o vizinho.

Aconteceu: um `Disallow: /` de crawler de SEO, três linhas abaixo, fez o GPTBot (que estava explicitamente liberado) ser reportado como bloqueado. **P0 falso, em relatório entregue a cliente.** Na mesma varredura o arquivo ainda foi acusado de bloquear o site inteiro, pelo mesmo motivo.

**Fatie por bloco e avalie cada um sozinho.** No `audit.mjs` isso é o `parseRobotsGroups()`. Bot sem bloco próprio herda o `*` — e isso se diz no achado, porque é uma causa diferente com uma correção diferente. `Allow: /` no mesmo grupo cancela o `Disallow: /`.

---

## B8 · Fetch que falhou não é página que respondeu 200

**Se** a página não pôde ser buscada, **não conclua** nada sobre o status dela.

DNS que não resolve, TLS que quebra, timeout: nesses casos não existe status HTTP nenhum. Um filtro do tipo "status ≥ 300 é problema" trata a ausência de status como se fosse 200 — e o relatório sai afirmando "todas as páginas devolvem 200" tendo medido só uma parte delas. É a pior classe de mentira do relatório: a que soa como aprovação.

**Separe os três estados: respondeu 200 · respondeu outro status · não foi medido.** O terceiro é achado próprio (`fetch.failed`), e o texto do check só fala das páginas que realmente foram medidas. Falha de TLS em massa costuma ser antivírus ou proxy interceptando HTTPS na máquina de quem audita — rode de novo com `NODE_OPTIONS=--use-system-ca` antes de culpar o site.

---

## B9 · Crawler de treino bloqueado não é "a IA não te cita"

**Se** o robots.txt bloqueia `GPTBot`, `ClaudeBot` ou `Google-Extended`, **não conclua** que o site está fora do ChatGPT, do Claude ou do AI Overview.

Esses são os robôs de **treino**. Os que alimentam a resposta são outros: `OAI-SearchBot`, `Claude-SearchBot`, `PerplexityBot`, `Bingbot`, `Googlebot`. Bloquear treino é decisão de licenciamento; bloquear busca é sumir da resposta. O `audit.mjs` separa os dois (`robots.ai` × `robots.ai.train`). Confundir vira P0 falso com a correção errada: o dono libera o treino, nada muda, e a confiança no relatório acaba.

---

## B10 · Schema sem rich result não é defeito

**Se** o `FAQPage` ou o `HowTo` não aparecem na busca, **não conclua** que o schema está errado.

O Google desligou o rich result de FAQ em 2026 e o de HowTo em 2023. O schema continua válido e inofensivo; só não rende nada visual. O que vira achado é outra coisa: schema que diz o que a página **não** diz, porque isso o Google trata como spam. Cobrar FAQ "pra ganhar o acordeão na busca" é recomendar 2023.

---

## B11 · "Sem llms.txt" não explica citação nenhuma

**Se** o site não tem `/llms.txt`, **não conclua** que é por isso que a IA não cita.

O Google diz que ignora o arquivo, e nenhum buscador de IA declara ler o de terceiros. Ele serve a agentes que o usuário aponta pro site. É informativo (P2): vale ter, vale mais estar certo. Colocar llms.txt no topo do plano de correção é prometer um efeito que não existe.

---

## B12 · O ID repetido no texto não é a tag carregada duas vezes

**Se** o mesmo código de medição (`GTM-...`, `G-...`) aparece muitas vezes no HTML, **não conclua** que a visita é contada em dobro.

Contar quantas vezes a *string do ID* aparece é medir a coisa errada. Plugins de rastreamento (o PixelYourSite, no WordPress) escrevem o ID no JSON de configuração de cada evento: 12 ocorrências por página, para **um** container carregado **uma** vez. No caso real isso acusou "medição duplicada" em 582 de 583 páginas.

**Conte instaladores, não o ID:** o `<script>` que carrega a tag (`gtag/js?id=`, o snippet do GTM, `ga('create', ...)`). O `<noscript><iframe ...ns.html?id=GTM-...>` é o par do snippet, não um segundo. Dois snippets do mesmo ID continuam sendo duplicação de verdade, e o smoke garante que isso segue acusado.

---

## B13 · `todo:` é uma palavra, não um marcador de rascunho

**Se** o texto da página contém `todo:`, **não conclua** que sobrou um TODO de desenvolvedor.

Em espanhol, galego e português, *todo* quer dizer "tudo" ("Nos ocupamos de absolutamente todo: transporte, aduana y seguro"). Casar a palavra sem distinguir caixa e sem olhar o idioma deu um **P0 falso** ("placeholder visível") numa página que estava correta. Só `TODO:` e `FIXME` em CAIXA ALTA contam, e em página `es`/`pt`/`gl`/`ca` só o `FIXME`, porque até o `TODO:` maiúsculo é frase normal ali ("Hacemos TODO: del embalaje a la entrega"). O TODO esquecido de verdade fica por conta da varredura de código (`--repo`).

---

## B14 · Nem tudo que está no sitemap é uma página

**Se** a URL do sitemap responde 200, **não conclua** que é HTML para auditar.

O Rank Math lista `/locations.kml` (arquivo de mapa) no sitemap de SEO local. Auditado como página, gerou cerca de dez achados falsos (sem title, sem H1, sem `lang`, sem canonical, sem schema) e ainda derrubou a cobertura de medição para "582 de 583". O auditor agora olha o `Content-Type`: o que não é HTML sai do denominador e aparece em *Não medido* (`pages.nonhtml`), dito às claras, sem sumir.

---

## B15 · "A primeira `image` do schema" pode ser foto de pessoa

**Se** o grafo de schema tem uma `image`, **não conclua** que é a imagem principal da página.

O schema do Rank Math traz um nó `Person` (o autor) com a foto do Gravatar, 96×96. Pegar a primeira `image` do grafo acusou "imagem principal com menos de 1200px" numa página cuja capa tinha 1344px. **Só contam** a `image` do `Article`/`BlogPosting`/`NewsArticle`, a `primaryImageOfPage` do `WebPage` e a `og:image`. E o Rank Math referencia por `@id` (`"image": {"@id": ".../#primaryImage"}`), então a referência é resolvida contra os nós do grafo antes de medir.

---

## B16 · Link de oEmbed não é feed nem sitemap

**Se** o `<head>` tem `<link rel="alternate" type="text/xml+oembed">`, **não conclua** que é um feed declarado.

O WordPress emite dois deles. O tipo contém "xml", e um filtro frouxo (`/rss|atom|xml/`) os tratou como feed, produzindo "N sitemaps/feeds declarados que não respondem 200". O oEmbed é o endereço que **outro site** usa para mostrar a prévia do link (Slack, Notion, outro WordPress). Fora do ar, só a prévia some: não mexe em Google nem em busca de IA. Agora fica fora do `feeds.alive` e tem o próprio achado, `oembed.alive`, P2, checado por amostra de cinco endereços.

---

## B17 · Schema `Article` não faz um post

**Se** a página tem schema `Article`, **não conclua** que é post de blog.

Rank Math e Yoast aplicam `Article` a páginas de serviço. Cobrar "data de publicação", autor e `dateModified` de uma página de serviço é cobrar o que ela nunca deveria ter. Agora é post quem tem `BlogPosting`/`NewsArticle`, ou `Article` com `datePublished` ou `og:type=article`, ou URL de blog. Limite assumido: um `Article` genuíno, sem data e com `og:type=website`, deixa de ser cobrado; é a troca de um falso positivo frequente por um falso negativo raro, e este arquivo existe para fazer essa troca de olhos abertos.

---

## A regra que resume as dezessete

Toda conclusão precisa passar por: **eu medi isso, ou eu deduzi isso?**

Se deduziu, o relatório diz que deduziu. O eixo "não medido" existe pra isto e não pune nota — usar ele é sinal de rigor, não de trabalho incompleto. **Auditoria que confessa o que não sabe é a única que dá pra confiar no que ela afirma.**

---

## Search Console: o que dá e o que não dá pra fazer

Vale quando a auditoria vai consumir dados do Search Console:

- **A leitura é só leitura.** O escopo é `webmasters.readonly`, de propósito. A skill **não consegue** submeter sitemap nem remover nada — isso é instrução pro dono do site executar, nunca ação automatizada. Não prometa o que não dá pra fazer.
- **Falta de credencial não é falha do site.** Se o Search Console não estiver conectado, os checks que dependem dele são **"não medidos"** e o setup vira um passo do plano — nunca um achado contra o site.
- **Nunca copie credencial pra relatório, log ou conversa.** Aponte o caminho do arquivo onde ela vive, nada além disso.
- **Se for automatizar o acesso:** em muitas organizações a criação de chave de conta de serviço é bloqueada por política. O caminho que costuma funcionar é OAuth de usuário (loopback em `127.0.0.1` + PKCE), com escopo `webmasters.readonly` e o token guardado fora do repositório.
