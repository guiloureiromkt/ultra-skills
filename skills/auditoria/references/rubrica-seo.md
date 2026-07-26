# Rubrica SEO — o que a máquina mede e o que ela não alcança

Duas listas. A primeira o `audit.mjs` resolve sozinho e você só interpreta. A segunda exige que alguém olhe — e é onde mora a diferença entre um site "sem erro" e um site que traz gente.

---

## Parte A · O que o `audit.mjs` já mede (você lê, não refaz)

**Por página**
`<html lang>` · `<title>` (presença, tamanho 15-65, duplicidade entre páginas) · meta description (presença, 70-160, duplicidade) · `canonical` (presença, absoluto, host correto) · meta robots (`noindex` vazado) · Open Graph e `twitter:card` · exatamente um H1 · hierarquia de headings sem pulo e sem heading vazio · contagem de palavras (página fina) · BLUF logo abaixo do H1 · H2/H3 em forma de pergunta · presença de tabela/lista · `alt` e `width`/`height` em imagem · JSON-LD (parseia? quais tipos? `Organization` genérico?) · `FAQPage` bate com a FAQ visível · placeholder/lorem visível · seção publicada vazia · resíduo de molde · frases auto-descritivas · links internos e âncora vazia.

**Do site**
`robots.txt` (existe, não bloqueia tudo, anuncia o sitemap, política de crawler de IA) · `sitemap.xml` (existe, `<lastmod>`, URLs devolvem 200, não redirecionam) · `llms.txt` (existe, H1 = marca, resumo coerente, seção vazia, host dos links, descrição herdada do molde) · apex × www × http convergindo pro canônico · soft-404 · páginas órfãs · headers de segurança.

**Como ler a nota.** Cada check tem peso pela severidade (P0 = 5, P1 = 3, P2 = 1). Nota do eixo = peso conquistado ÷ peso avaliado. Check que não deu pra medir **sai do denominador** — ele não pune e não premia. Por isso a nota vem sempre acompanhada da coluna "não medidos": nota alta com muitos não-medidos é nota frágil, e o relatório precisa dizer isso.

---

## Parte B · O que exige olho (a auditoria de verdade)

### 1. Intenção de busca
Cada página responde a uma pergunta que alguém realmente digita? Ou responde à pergunta que a empresa gostaria que fizessem? O teste é literal: **alguém com essa dor digitaria esse título?** Se a resposta é "só quem já conhece o jargão", o título está errado.

### 2. Canibalização
Duas páginas disputando a mesma query se enfraquecem mutuamente — o Google não sabe qual mostrar e as duas caem. O script pega título idêntico; ele **não** pega intenção equivalente com palavras diferentes.

Cuidado com o falso positivo mais comum: "o que é X" (perene) e "X em 2026" (temporal) parecem duplicatas e **não são** — são intenções diferentes e as duas devem ficar. Duplicata real é mesma intenção, mesmo ângulo. Consolidar o que não era duplicata queima ranking que já existia.

### 3. Arquitetura de links internos
O site tem hierarquia — uma página forte por tema, com páginas de apoio ligadas a ela e entre si? Ou é um monte de página solta pendurada no menu? Sinal claro: página que só o menu alcança é página que o Google trata como periférica.

### 4. Profundidade real do conteúdo
Contagem de palavras é proxy ruim. Pergunta certa: **essa página resolve a dúvida, ou empurra pro contato?** Página de serviço com três parágrafos genéricos e um botão "fale conosco" não ranqueia e não é citada — não porque é curta, mas porque não ensina nada.

### 5. Velocidade e experiência
O script não roda Lighthouse (isso exigiria Chrome e dependências que o mentorado pode não ter). Se estiver disponível, complemente com a skill `web-quality-audit` ou com o PageSpeed Insights. O que dá pra ver sem ferramenta: imagem enorme servida em tamanho pequeno, fonte carregada de CDN externo bloqueando o render, JavaScript que atrasa o primeiro texto aparecer.

### 6. O crawler te vê? (o mais grave dos silenciosos)
Buscador e crawler de IA leem o HTML que o servidor entrega — **eles não esperam o JavaScript rodar**. Site que monta o conteúdo no navegador entrega uma casca vazia.

Teste, sem ferramenta nenhuma:
```bash
curl -s https://seusite.com/pagina | sed 's/<[^>]*>/ /g' | tr -s ' ' | head -c 2000
```
Se o texto principal não aparece aí, ele não existe pro Google nem pro ChatGPT — por mais bonito que esteja na tela.

### 7. Internacionalização (se houver mais de um idioma)
Cada versão declara `hreflang` apontando pras outras **e pra si mesma**, mais um `x-default`. Sem reciprocidade o Google ignora o conjunto e trata as versões como conteúdo duplicado.

### 8. Sinais fora do site
Perfil no LinkedIn, Google Business, diretórios do setor — com **exatamente** o mesmo nome, endereço e URL do site. É o que consolida a entidade. Divergência aqui não aparece em auditoria técnica nenhuma e derruba a confiança das duas pontas.

---

## Como priorizar (quando tudo parece urgente)

Ordem de alavanca, da maior pra menor:

1. **O que impede de ser encontrado** — `noindex` vazado, robots bloqueando, crawler não vendo o conteúdo, host canônico errado. Sem isso resolvido, o resto não é medível.
2. **O que engana** — resíduo de molde, schema divergente da página, seção vazia publicada. Custa confiança, e confiança é o que o Google e a IA estão medindo.
3. **O que impede de ser citado** — BLUF ausente, zero evidência, schema genérico, sem `llms.txt`.
4. **O que impede de converter** — título que ninguém busca, página que não ensina, CTA sem contexto.
5. **Polimento** — headers, `width`/`height`, `og:image`, em-dash.

Faixas 1 e 2 são sempre P0. Nunca comece pela 5 porque é a mais fácil de fechar.
