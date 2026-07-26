# Como não reportar mentira — as regras do auditor

Todo check deste arquivo é sobre **você**, não sobre o site. São armadilhas de leitura de dado: momentos em que a ferramenta responde uma coisa, você entende outra, e o relatório sai com um problema que não existe.

Isso é pior que não achar o problema. Achado falso gasta o tempo de quem vai corrigir, e depois de dois deles a pessoa para de ler o relatório inteiro — inclusive os P0 verdadeiros.

**As seis abaixo são erros reais, cometidos em campo, cada um a poucos segundos de virar um achado inventado num relatório entregue.**

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

**Caia pra leitura textual** (o HTML, a árvore de acessibilidade, medição via JavaScript). Nesta máquina, o caminho provado é `puppeteer-core` + Chrome instalado, nunca o preview embutido (`CLAUDE.md §10.4`).

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

## A regra que resume as seis

Toda conclusão precisa passar por: **eu medi isso, ou eu deduzi isso?**

Se deduziu, o relatório diz que deduziu. O eixo "não medido" existe pra isto e não pune nota — usar ele é sinal de rigor, não de trabalho incompleto. **Auditoria que confessa o que não sabe é a única que dá pra confiar no que ela afirma.**

---

## Search Console: o que dá e o que não dá pra fazer

Vale quando a auditoria vai consumir dados do Search Console:

- **A leitura é só leitura.** O escopo é `webmasters.readonly`, de propósito. A skill **não consegue** submeter sitemap nem remover nada — isso é instrução pro dono do site executar, nunca ação automatizada. Não prometa o que não dá pra fazer.
- **Falta de credencial não é falha do site.** Se o Search Console não estiver conectado, os checks que dependem dele são **"não medidos"** e o setup vira um passo do plano — nunca um achado contra o site.
- **Nunca copie credencial pra relatório, log ou conversa.** Aponte o caminho do arquivo onde ela vive, nada além disso.
- **Se for automatizar o acesso:** em muitas organizações a criação de chave de conta de serviço é bloqueada por política. O caminho que costuma funcionar é OAuth de usuário (loopback em `127.0.0.1` + PKCE), com escopo `webmasters.readonly` e o token guardado fora do repositório.
