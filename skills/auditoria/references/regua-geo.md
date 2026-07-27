# Régua GEO — ser citado por IA (Fase 2)

GEO = **Generative Engine Optimization**. Traduzindo: SEO otimiza pra aparecer numa *lista de links*; GEO otimiza pra aparecer *dentro da resposta* que o ChatGPT, o Perplexity, o Gemini ou o AI Overview do Google escreve. São problemas diferentes e a diferença importa: hoje a maioria das buscas termina sem clique nenhum, então estar na resposta virou o lugar que antes era o primeiro resultado.

> **Nota de honestidade sobre os números abaixo.** Todos vêm do GEO-bench (Princeton, ago/2024) e do corpus Growth & Performance, compilados na régua de citabilidade que uso na minha operação. São de 2024-2026 e a área muda rápido. **Cite-os com a fonte e a data.** Não invente número novo. Onde não houver dado, o achado é qualitativo — e é dito como qualitativo.

---

## As 5 dimensões (com peso)

O `audit.mjs` pontua a parte mecânica. Esta tabela é como você **lê** o eixo GEO e explica pro dono do site onde ele está perdendo.

| Dimensão | Peso | O que se olha |
|---|---:|---|
| **Citabilidade** | 25% | Frase-tese arrancável do contexto · resposta nas primeiras 40-80 palavras · passagens de 130-170 palavras que se sustentam sozinhas · construções "X é…" · dado que só essa marca tem |
| **Estrutura** | 20% | H1→H2→H3 sem pulo · H2 em forma de pergunta literal · parágrafo curto · tabela/lista onde é comparativo · FAQ |
| **Multi-modal** | 15% | Texto + imagem com legenda descritiva · vídeo · gráfico · elemento interativo (dá mais superfície pra IA entender o assunto) |
| **Autoridade / Marca** | 20% | Assinatura com credencial · data de publicação e de atualização · fonte primária nomeada · schema `Person` com `sameAs` · menções em terceiros (LinkedIn, Reddit, YouTube, imprensa) |
| **Técnico** | 20% | O conteúdo existe no HTML servido (crawler não roda JavaScript) · `FAQPage` idêntico à FAQ visível · schema completo e válido · `llms.txt` · robots liberando os crawlers de IA |

---

## A régua de citabilidade — os 10 itens, em toda página que importa

1. **BLUF nos primeiros 30%.** *(BLUF = Bottom Line Up Front: a conclusão primeiro, o desenvolvimento depois.)* Resposta direta em 50-70 palavras, com o termo central em **negrito** já na primeira frase. **44,2% das citações de IA saem dos primeiros 30% do texto** — o topo não é aquecimento, é o produto.
2. **H2/H3 são perguntas literais** — as mesmas que a pessoa digita ("Quanto custa uma recuperação judicial?"), com a resposta direta no primeiro parágrafo abaixo.
   - **O título obedece à mesma regra:** é a **dor que a pessoa busca**, não o jargão da solução. ❌ "MMM bayesiano e atribuição incremental" (ninguém pesquisa isso) → ✅ "Por que as conversões do Meta não batem com as suas vendas". O jargão fica **no corpo**, onde vira evidência citável; no título ele mata o clique.
3. **Uma frase-tese citável por seção.** Curta, declarativa, atribuível, que continua fazendo sentido sozinha ("X custa Y porque Z"). É a unidade que o modelo levanta inteira.
4. **Densidade de evidência — a maior alavanca.** Cada afirmação forte carrega **nome próprio + número + fonte/data**. Dado documental deu **+115% de visibilidade citacional** no GEO-bench, e vale até pra página sem autoridade nenhuma: **evidência supera domain authority.** É a melhor notícia que um site novo pode receber.
5. **Information gain — o que só você tem.** Pelo menos um dado de primeira mão por página: "na minha operação…", "testei X e deu Y", um print, um número que não existe em outro lugar. O contrário é medido e é ruim: conteúdo genérico/programático perde **10% a 26% de probabilidade de citação**. Sameness não é neutro — ele *derruba*.
6. **Dado em formato de dado.** Onde for comparativo ou enumerável, use tabela ou lista. A IA reconhece como dado estruturado (+30-40% de chance de citação), não como prosa a resumir.
7. **Schema completo.** `Article`/`BlogPosting` + `FAQPage` (Q&A literal) + `Person` com `sameAs` (LinkedIn, site, redes) + `author` ligado ao Person. E o **tipo específico do negócio**: `LegalService`, `Dentist`, `LocalBusiness`, `SoftwareApplication`. Só `Organization` diz que a empresa existe; não diz o que ela faz.
8. **O `FAQPage` bate com a FAQ visível, pergunta por pergunta.** Divergir é sinal negativo pro Google — ele lê os dois. (O `audit.mjs` checa isso automaticamente e marca como P0.)
9. **Zero anti-padrão.** Sem repetição de keyword, sem parágrafo genérico sem evidência, sem enchimento. Cada frase ensina ou sai.
10. **`llms.txt` na raiz.** O mapa que você entrega pronto: quem é a marca, o que vende, onde está cada coisa. Adoção ainda baixa — o que o torna barato e diferenciador. **E é onde o texto do molde mais sobrevive** (ver `cicatrizes-de-molde.md`): o resumo do `llms.txt` é literalmente o primeiro parágrafo que a IA lê sobre a marca.

---

## Consistência de entidade (o que amarra tudo)

A IA consolida "quem é essa marca" cruzando fontes. Divergência quebra a consolidação e é a falha mais silenciosa que existe — nada aparece errado na tela.

Confira que **o mesmo nome, a mesma URL e o mesmo tipo** aparecem em: `<title>` e H1 · schema `Organization`/`LegalService`.`url` · `og:url` e canonical · `llms.txt` · perfis externos (LinkedIn, Google Business, diretórios do setor).

Erro clássico e fácil de achar: o site serve em `www.dominio.com` mas o schema e o `llms.txt` apontam pro `dominio.com` sem www. São dois endereços diferentes pra máquina.

---

## Por plataforma (o overlap entre elas é de só 11-14% — não é uma otimização só)

- **ChatGPT** — puxa autoridade do índice do Bing e de menções de marca. Alavanca: presença forte no LinkedIn + ser citado por terceiros.
- **Perplexity** — favorece frescor e conteúdo de comunidade (Reddit incluso). Alavanca: publicação recorrente e datada.
- **Claude** — favorece profundidade editorial. Alavanca: as peças longas e bem estruturadas.
- **AI Overviews (Google)** — herda os sinais clássicos de SEO. Alavanca: o que já é bom SEO, feito direito.

---

## O que **só** o humano ou o modelo julga (não automatize isto)

O script mede forma. Estes cinco exigem leitura:

1. A frase-tese é de fato citável, ou é uma frase bonita e vazia?
2. A evidência é real e verificável, ou é número com cara de real e sem fonte? *(Este é o pior defeito possível — pior que não ter dado nenhum.)*
3. O dado de primeira mão é genuíno, ou é a média da internet parafraseada?
4. O título casa com a busca real de alguém com aquela dor?
5. A promessa da página é sustentada pelo conteúdo, ou o site promete o que não entrega?
