# Ultra Skills — as ferramentas que eu uso, abertas e em português

**Cinco skills de [Claude Code](https://claude.com/claude-code). Duas trabalham em par para sites: a `ultra:site` constrói decidindo o design como imagem antes de escrever uma linha de código, e a `ultra:auditoria` mede se o Google entende, se a IA cita, se o Analytics está instalado e se o formulário realmente entrega o contato. As outras três resolvem escrita, presença no LinkedIn e diagnóstico de negócio.** Todas gratuitas, abertas, em português.

Elas existem porque eu precisei delas na minha própria operação. Não são demonstração.

---

## Por que uma skill de auditoria, se já existe tanta ferramenta de SEO?

Porque as ferramentas de SEO validam o que existe — título, descrição, schema — e são cegas para duas coisas que custam muito mais caro.

**A primeira: o que não está lá.** Um site que auditei tinha schema correto, autor definido e imagem em 1344px, e mesmo assim ficou **90 dias com zero impressão no Google Discover**. Faltava uma linha no `<head>` (`max-image-preview:large`). Três auditorias anteriores passaram por ele sem ver — porque nenhuma procurava ausência de habilitação. Porta fechada por omissão não aparece em checklist de presença.

**A segunda: o que engana em silêncio.** Em outro site, o formulário de contato — presente em todas as páginas — mostrava *"Recebemos sua mensagem. Falamos em breve!"* e **descartava o contato**. Nenhum `fetch`, nenhum destino, nada. Quem preenchia achava que tinha falado com a empresa. O dono achava que ninguém procurava pelo site. Ninguém reclama de um formulário que "funcionou", então durou meses.

Nenhuma auditoria de SEO pega isso. A `ultra:auditoria` pega, e classifica como o problema mais grave que um site pode ter.

---

## O que cada uma faz

### 🎨 `ultra:site` — o design é decidido como imagem, não como adjetivo

O jeito comum de fazer site com IA é descrever ("moderno, clean, sofisticado") e torcer. Sai template, porque adjetivo é a média de todos os sites que o modelo já viu.

Aqui o caminho é outro: a skill **gera um quadro de referência visual por seção**, você olha, aprova ou manda refazer — e só então o código é escrito, fiel àquilo. Mais um ledger anti-convergência que impede o próximo site de ter a cara do anterior, paletas de IA banidas por código hexadecimal, e um review adversarial por screenshot antes de qualquer entrega.

> ⚠️ **Depende de conta paga no [Replicate](https://replicate.com)** — cerca de **US$ 5 a 15 por site**. Não existe modo grátis, e isso é deliberado: sem imagem gerada não há quadro de referência, e sem quadro sai exatamente o "limpo mas genérico" que a skill define como falha. O passo a passo completo está em [`skills/site/references/replicate-setup.md`](skills/site/references/replicate-setup.md), inclusive a parte honesta sobre **quando esta skill não é a ferramenta certa**.

### 🔍 `ultra:auditoria` — seis eixos, com nota, e um loop que termina

Roda contra um site no ar, uma pasta local ou um repositório. **Zero dependências** — Node 18+ e pronto.

| Eixo | A pergunta que responde |
|---|---|
| SEO técnico | O Google consegue ler e entender o site? |
| SEO de conteúdo | O conteúdo responde o que as pessoas procuram? |
| GEO | ChatGPT, Perplexity e Gemini conseguem te citar? |
| Integridade de marca | O site fala de você, ou sobrou texto do template? |
| Medição & conversão | Tem Analytics? O formulário entrega o contato ou finge? |
| Código & qualidade | Segurança, acessibilidade, performance |

Cada achado sai com **a evidência colada** — a linha real do seu HTML, o trecho do texto no ar, o caminho do arquivo. Achado sem evidência não entra, porque vira ruído que ninguém consegue conferir.

E tem uma regra que atravessa tudo: **o que não deu pra medir vira "não medido" e sai da conta**, nunca vira zero forçado. Auditoria que inventa nota pra parecer completa é auditoria que você não pode usar pra decidir nada.

---

## As outras três

Estas não têm nada a ver com site. São as que eu uso todo dia e que funcionam para qualquer pessoa — inclusive fora do Claude Code: cada uma é um arquivo autossuficiente que também roda em Claude Projects ou ChatGPT, se for o seu caso.

### ✍️ `ultra:humanizer` — tira a cara de IA do texto

Audita 24 categorias de padrão de escrita de LLM (baseado no [Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing) da Wikipedia, adaptado para o português) e devolve uma nota de 0 a 100 mais o diagnóstico trecho a trecho: qual padrão, onde, por que soa artificial.

Não reescreve por cima da sua voz. Ele mostra o que encontrou, explica a regra, oferece alternativas, e você decide. O texto continua seu — só sai o vício de máquina.

> Este README passou por ele. Score foi de 72 para 89: seis travessões, um contraste binário declamatório e dois "rule of three" decorativos.

### 💼 `ultra:linkedin` — motor de conteúdo com a sua voz, não a minha

Começa entrevistando você para calibrar voz, público e território — depois escreve dentro disso. A calibração é sua; a skill só carrega o método.

### 🔍 `ultra:diagnostico` — o negócio em 6 dimensões

Diagnóstico estruturado em seis dimensões, do jeito que eu faço em consultoria. Serve para qualquer negócio, de qualquer setor e tamanho. Sai um retrato com prioridades, não uma lista de boas intenções.

---

## Como instalar (um comando)

Estas skills são um **plugin do Claude Code**. Você adiciona o repositório uma vez e recebe todas — e toda skill que eu publicar depois chega junto, sem reinstalar nada.

No Claude Code:

```
/plugin marketplace add guiloureiromkt/ultra-skills
/plugin install ultra@ultra-skills
```

Pronto. Elas passam a se chamar **`ultra:site`**, **`ultra:auditoria`**, **`ultra:humanizer`**, **`ultra:linkedin`** e **`ultra:diagnostico`**. É só pedir o que você quer:

> *Roda a auditoria completa no site www.meusite.com.br. A marca é Fulano Advocacia, o setor é advocacia trabalhista, e o código está na pasta X.*

**Pré-requisitos:** [Claude Code](https://claude.com/claude-code) e [Node.js 18+](https://nodejs.org). Para a `ultra:site`, também a conta no Replicate.

<details>
<summary>Instalação manual, sem plugin</summary>

Baixe o [ZIP do repositório](https://github.com/guiloureiromkt/ultra-skills/archive/refs/heads/main.zip) e copie as pastas de dentro de `skills/` para:
- Windows: `C:\Users\SEU-USUARIO\.claude\skills\`
- Mac/Linux: `~/.claude/skills/`

Renomeie com o prefixo ao copiar (`ultra-site`, `ultra-humanizer`…) — sem o plugin, o nome da pasta vira o nome da skill, e `site` ou `humanizer` sozinhos são genéricos demais. Reabra o Claude Code depois.
</details>

---

## Antes de confiar no auditor, teste o auditor

```bash
cd skills/auditoria && node scripts/smoke.mjs
```

Ele monta um site de mentira cheio de defeitos conhecidos, audita e confere **27 propriedades** — metade "acusou o que tem defeito", metade "não acusou o que está certo", mais a que mais importa: **um site correto atinge a nota de aprovação**. Se isso não fosse verdade, o loop de correção nunca terminaria em sucesso e ninguém perceberia.

Tem que dar `27/27 · OK`.

> **Por quê?** Auditor quebrado não dá erro. Ele dá **conforto falso**: diz que está tudo bem e você acredita. Cinco segundos ali valem mais que a auditoria inteira. Foi esse teste, aliás, que encontrou dois falsos positivos meus — campo oculto sendo cobrado por rótulo de acessibilidade, e comparação de domínio contra valor nulo.

---

## Quem fez isso, e por quê

Sou o **Gui Loureiro**. 25 anos de mercado, Diretor de Estratégia e Mídia na 3mais. Passo os dias construindo os sistemas de IA que uso na própria operação — e publicando o que quebra no caminho.

Estas duas skills nasceram assim: precisei entregar sites que não parecessem template, e depois precisei provar que eles funcionavam. As cicatrizes que estão documentadas dentro delas são todas reais, todas minhas, e todas já estiveram no ar. Estão em [`skills/auditoria/references/cicatrizes-de-molde.md`](skills/auditoria/references/cicatrizes-de-molde.md), com o mecanismo de cada uma e a forma mecânica de pegar.

A tese que sustenta isso: **a fronteira da IA é pra dentro**. Não é sobre usar mais ferramenta, é sobre construir sistema — cada pessoa virando alguém que orquestra a IA em vez de só perguntar pro chat.

- 🌐 [guiloureiro.com.br](https://guiloureiro.com.br) — o manifesto e as duas portas
- 🎓 [Mentoria Mão na Massa](https://guiloureiro.com.br/mentoria/) — três sistemas reais da sua área em três meses, sem programar
- 💼 [LinkedIn](https://www.linkedin.com/in/guiloureiro)
- 📸 [Instagram](https://www.instagram.com/guiloureiro)

---

## Verificando antes de publicar

Se você for contribuir, rode antes de abrir o PR:

```bash
node scripts/verificar-publicacao.mjs
```

Ele varre tudo procurando caminho de máquina, referência a vault pessoal, credencial, endereço interno e nome de pessoa real. Existe porque essa varredura já pegou cinco vazamentos neste repositório — nenhum era segredo técnico, todos eram coisas que fazem sentido na máquina de quem escreveu e nenhum sentido no mundo.

## Contribuindo

Achou um bug, ou um achado que a auditoria reportou errado? **Abra uma issue** — falso positivo é o defeito mais grave que uma ferramenta dessas pode ter, e eu quero saber.

Se o seu site nasceu de um template e a auditoria não pegou o texto herdado, mande os termos daquele template: eles entram no [`residue-lexicon.json`](skills/auditoria/scripts/residue-lexicon.json) e passam a ser detectados pra todo mundo.

## Licença

MIT — use, modifique, venda serviço em cima. Se ajudar, me conta.
