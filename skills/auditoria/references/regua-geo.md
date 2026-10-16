# Régua GEO — ser citado por IA (Fase 2)

GEO = **Generative Engine Optimization**. SEO otimiza para aparecer numa lista de links; GEO otimiza para aparecer *dentro da resposta* que o ChatGPT, o Perplexity, o Gemini, o Claude, o Copilot ou o AI Mode do Google escrevem. São problemas parecidos com alavancas diferentes, e boa parte do que se vendia como "técnica de GEO" em 2024 não sobreviveu aos testes controlados de 2026.

> **Honestidade sobre os números.** Cada número abaixo tem fonte e data. Correlação (estudo de vendor sobre citações reais) e causa (experimento controlado) estão marcadas como tal. Cite com a fonte. Onde não houver dado, o achado é qualitativo e é dito como qualitativo. A área muda rápido: número com mais de 18 meses merece reconferir.

---

## O que a evidência diz (2025-2026)

**O que decide a citação, antes de tudo, é ser recuperado e ser relevante para a pergunta.** Um levantamento crítico de 2023-2026 (arXiv 2607.14035, jul/2026) e um estudo fatorial com 252 mil tentativas (SIGIR 2026) chegam ao mesmo lugar: relevância tópica e posição no contexto determinam a primeira citação; formatação sozinha tem efeito fraco. Pior: reescrever o corpo "para a IA" **reduziu** presença no top-20 em 9% e citação final em 6% numa arena de 171 mil documentos. Otimizar a superfície sem ter o conteúdo certo prejudica.

O que ajuda, com medida:

| Alavanca | Efeito medido | Tipo | Fonte |
|---|---|---|---|
| Resumo ou resposta clara no início | +32,8% de chance de citação | correlação (11.882 prompts, 304 mil URLs) | Semrush, jan/2026 |
| Sinais de autoria (credenciais, bio com link) | +30,6% | correlação | Semrush, jan/2026 |
| Formato pergunta-resposta | +25,5% | correlação | Semrush, jan/2026 |
| Estrutura por seção (H2/H3 claros) | +22,9% | correlação | Semrush, jan/2026 |
| Tom promocional | **−26,2%** | correlação | Semrush, jan/2026 |
| Hierarquia de headings + trechos de 150-300 palavras + listas/tabelas | +17,3% de citação (45,0% → 52,8%) em 200 artigos × 6 engines; trechos >300 palavras perdem atenção no meio (−31%), <150 citam menos (−23%) | experimento | arXiv 2603.29979, mar/2026 |
| Estatística e citação com fonte | moderado a forte, **só se verídica** | experimento | survey 2607.14035 |
| Data e preço recentes | moderado, em perguntas sensíveis a tempo | experimento | survey 2607.14035 |
| Conteúdo atualizado | 72% das páginas citadas foram atualizadas no último ano, contra 42% publicadas no último ano: frescor vem de manutenção | correlação (7.683 páginas, mar-jun/2026) | Seer Interactive, jul/2026 |
| Ranking orgânico no Google | de 76% (2025) para 38% (2026) das citações do AI Overview vêm do top-10 orgânico | correlação | Ahrefs, 2025 e 2026 |

O que **não** se sustenta como fator: schema e autoridade de domínio nunca foram isolados num experimento (os estudos de vendor mostram presença de schema nas páginas citadas, não efeito); "tom autoritativo" é instável; menções em terceiros só aparecem em dado observacional.

---

## A régua de citabilidade (o que olhar em cada página que importa)

1. **Resposta direta no primeiro bloco.** 50-70 palavras que respondem a pergunta da página, antes de qualquer contexto. O Bing escreve isso nas diretrizes de 2026 ("o essencial no topo"); a Semrush mede o efeito. O topo não é aquecimento, é o produto.
2. **H2/H3 são as perguntas que a pessoa digita** ("Quanto custa uma recuperação judicial?"), com a resposta no primeiro parágrafo abaixo. **O título obedece à mesma regra:** a dor que a pessoa busca, não o jargão da solução. ❌ "MMM bayesiano e atribuição incremental" → ✅ "Por que as conversões do Meta não batem com as suas vendas". O jargão fica no corpo, onde vira evidência citável.
3. **Uma frase-tese citável por seção.** Curta, declarativa, que continua fazendo sentido arrancada do contexto ("X custa Y porque Z"). É a unidade que o modelo levanta inteira.
4. **Trechos de 150 a 300 palavras por seção.** Mais que isso o modelo perde o meio; menos que isso ele não cita.
5. **Evidência com nome, número e fonte** em cada afirmação forte. Só vale se for verdade: número inventado com cara de real é o pior defeito possível, pior que não ter dado.
6. **O que só você tem.** Pelo menos um dado de primeira mão por página: "na minha operação…", "testei X e deu Y", um print, um número que não existe em outro lugar. O Google chama o contrário de "commodity content" e diz, no guia de otimização para IA (2026), que ele perde.
7. **Dado em formato de dado.** Comparação e enumeração em tabela ou lista (+43% de precisão de extração no experimento de 2026).
8. **Autoria visível e ligada.** Byline com link para página do autor; schema `Person` com `url` e `sameAs`. O Google diz que perfil fabricado (foto de IA, credencial falsa) é sinal de baixa qualidade.
9. **Data de atualização real.** `dateModified` no schema, data visível no texto, `lastmod` no sitemap, todos coerentes com a última mudança de conteúdo. Mudar a data sem mudar o texto é sinal negativo documentado pelo Google.
10. **Sem tom promocional.** Cada frase ensina ou sai. "Líder", "solução completa", "o melhor" derrubam a citação.

---

## O que mudou no Google e você precisa saber ao reportar

- **AI Overviews e AI Mode não têm requisito extra.** Página indexada e elegível a snippet entra; não existe schema, arquivo ou formato especial (Google, guia de IA, 2026). O que tira a página da resposta: `nosnippet` ou `max-snippet:0`.
- **Rich results que acabaram:** FAQ (maio/2026), HowTo (2023), caixa de busca de sitelinks (nov/2024), breadcrumb só no desktop (2025). `FAQPage` continua schema válido, mas não rende nada visual; se o schema disser o que a página não diz, é spam. `WebSite` + `SearchAction` virou opcional.
- **`lastmod` no sitemap** só é usado quando é verificavelmente correto. Sem data é melhor que data errada.
- **`llms.txt`:** o Google diz que ignora (jun/2026). OpenAI, Anthropic e Perplexity publicam o arquivo nas próprias docs, mas nenhuma declara que o buscador lê o de terceiros. Serve a agentes de código e assistentes que o usuário aponta pro site. Vale ter, custa dez minutos, **não é fator de citação**, e é onde o texto do molde mais sobrevive (ver `cicatrizes-de-molde.md`). Tem que estar certo ou não estar.
- **Preferred Sources e Search Profiles:** o leitor pode eleger o site como fonte preferida (documentado em jan/2026, em todas as línguas desde abr/2026, dentro dos AI Overviews e do AI Mode desde mai/2026, com botão oficial para o site desde ago/2026) e seguir o perfil do publisher (Search Profiles, jun/2026). Informativo; vale sugerir para quem publica com frequência.

---

## Crawlers de IA: treino × busca (o que o robots.txt faz de verdade)

Bloquear o crawler **de busca** tira o site da resposta daquela IA. Bloquear o **de treino** é decisão de licenciamento e não mexe na citação. O `audit.mjs` separa os dois (`robots.ai` e `robots.ai.train`).

| Função | Robôs | O que acontece se bloquear |
|---|---|---|
| **Busca / citação** | `OAI-SearchBot` (ChatGPT search) · `Claude-SearchBot` · `PerplexityBot` · `Bingbot` (Bing e Copilot) · `Googlebot` (Search, AI Overviews, AI Mode, Discover) · `Amzn-SearchBot` | a IA não encontra nem cita (P0) |
| **Treino** | `GPTBot` · `ClaudeBot` · `Google-Extended` (Gemini; não afeta Search nem AI Overviews) · `CCBot` · `Applebot-Extended` · `Meta-ExternalAgent` · `Amazonbot` · `Bytespider` | nada na citação; só no dataset (informativo) |
| **Busca a pedido do usuário** | `ChatGPT-User` · `Claude-User` · `Perplexity-User` · `Meta-ExternalFetcher` | `Claude-User` respeita robots.txt; `Perplexity-User` e `Meta-ExternalFetcher` **ignoram** por design e a OpenAI diz que as regras "podem não se aplicar" ao `ChatGPT-User`; só firewall segura esses |

Fontes: documentação de crawlers da OpenAI, da Anthropic (abr/2026), da Perplexity, do Google (out/2026), da Apple (set/2026), da Meta e da Amazon. `Content-Signal` (Cloudflare, 2025) e o rascunho `aipref` da IETF são sintaxe que nenhuma IA grande se comprometeu a honrar até out/2026: não pontuam, só se checa que não quebram o arquivo.

**Nenhum crawler de IA grande executa JavaScript** (Vercel mediu em 2024; nenhuma das três documenta renderização). Conteúdo que só existe depois do JS não existe para o ChatGPT nem para o Perplexity. O Google renderiza. Teste: `curl -s <url> | sed 's/<[^>]*>/ /g'` e procure o texto principal.

---

## Por plataforma (o overlap entre elas é pequeno; é mais de uma otimização)

- **ChatGPT** cita poucas fontes por resposta (média 3,4 contra 12,6 do Google e 17,7 do Perplexity em tarefas com várias restrições, arXiv 2604.25707) e pesa cada uma; em mais da metade das repetições nem aciona busca. Puxa do índice do Bing e de menção de marca. Alavanca: Bing Webmaster Tools (importa do Search Console em 5 minutos) e presença em terceiros que ele já cita (Wikipedia é 7,8% das citações, Profound 2025).
- **Perplexity** favorece frescor e comunidade (Reddit é 6,6% das citações). Alavanca: publicação recorrente, datada, com feed.
- **Google AI Overviews / AI Mode** herdam o índice do Googlebot e cada vez menos o ranking orgânico (38% do top-10 em 2026). O AI Mode cita cada vez mais o próprio Google (cards de Business Profile e produto). Alavanca: o que já é bom SEO, mais Business Profile e Merchant Center onde couber.
- **Copilot / Bing**: diretrizes de fev/2026 pedem fato direto, nome de entidade consistente, um tópico por URL, essencial no topo. `NOARCHIVE` tira do Copilot; `nosnippet` rebaixa a citação.
- **Claude** favorece profundidade editorial. Alavanca: as peças longas e bem estruturadas, em trechos de 150-300 palavras.

---

## Consistência de entidade (o que amarra tudo)

A IA consolida "quem é essa marca" cruzando fontes. Divergência quebra a consolidação sem nada aparecer errado na tela. O mesmo nome, a mesma URL e o mesmo tipo em: `<title>` e H1 · `Organization` (com `url`, `logo`, `sameAs`, endereço e CNPJ quando fizer sentido) ou o tipo específico (`LegalService`, `Dentist`, `LocalBusiness`…) · `og:url` e canonical · `llms.txt` · Google Business Profile · LinkedIn e diretórios do setor. Erro clássico: o site serve em `www.dominio.com` e o schema aponta para `dominio.com`.

---

## Verificação com dado real (quando houver ferramenta)

Tudo acima é inferência: sinais que correlacionam com chance de citação. Ninguém aqui testou se a IA cita o site *hoje*. Quando houver acesso a medição real, ela vira a régua, e o inferido só explica o resultado:

- **Bing Webmaster Tools → AI Performance** (fev/2026): citações e cliques vindos do Copilot, por página. Grátis.
- **Search Console** soma o AI Mode nos totais desde jun/2025 (não separa).
- Ferramentas de share of model ou um MCP de SERP que rodem prompts reais contra ChatGPT, Perplexity, Gemini e AI Overviews.

Regras de honestidade iguais às de `como-nao-reportar-mentira.md`: motor que falhou é "não medido", nunca "não aparece" · sem base de comparação não existe share of voice (0 em 5 consultas é ausência observada, não ausência) · tamanho da amostra e confiança vão junto com o número.

---

## O que só o humano ou o modelo julga (não automatize)

1. A frase-tese é de fato citável, ou é bonita e vazia?
2. A evidência é real e verificável, ou número com cara de real?
3. O dado de primeira mão é genuíno, ou a média da internet parafraseada?
4. O título casa com a busca de alguém com aquela dor?
5. A promessa da página é sustentada pelo conteúdo?
