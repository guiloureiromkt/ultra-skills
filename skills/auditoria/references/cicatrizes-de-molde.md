# Cicatrizes de molde — os bugs que já foram pro ar

Sites construídos a partir de um molde (motor próprio, tema comprado, clone de projeto anterior) falham de um jeito específico: **o esqueleto troca, o texto fica.** Não é bug de código — o site funciona, sobe, fica bonito. É bug de identidade, e ele passa por todo mundo porque ninguém lê o site inteiro depois de trocar a marca.

Estas cicatrizes são reais. Cada uma esteve no ar.

---

## 1 · Resíduo de marca (P0 · sempre)

**O caso (2026-07-25).** Um site de cliente no ar, construído a partir de um molde que nasceu do site de outra empresa, de setor completamente diferente. O que ficou:

- **`/llms.txt`** — o arquivo que a IA lê primeiro — abria com: *"Agência de comunicação e marketing com 25 anos de estrada, no Rio de Janeiro… branding e gestão de crise a performance, social CRM, conteúdo e data intelligence."* Ou seja: o negócio de origem, não o negócio do site. Cada IA que passou ali aprendeu a coisa errada.
- **A página `/cases`** trazia a copy da agência inteira, com o trocadilho da marca de origem: *"Como fazemos mais? Primeiro, acreditamos que a proximidade faz diferença… fazemos mais pela experiência: são 25 anos atendendo marcas nacionais e internacionais de diversos setores."*
- **Descrições de página** no `llms.txt`: *"portfólio de trabalhos por setor e capability"*, *"relatórios de tendências (Trends/Ja!)"* — nomes de produto da empresa de origem, que o cliente nunca teve.
- A página `/cases` estava **publicada e vazia**: heading "Cases" no ar com "Nenhum case com esse recorte ainda".

**Por que passou.** O texto estava **cravado no código**, não no CMS nem no arquivo de configuração. Quem trocou a marca trocou o que aparecia no painel; o que estava dentro do componente sobreviveu. E o `llms.txt` ninguém abre — é um arquivo que só robô lê.

**Como pegar.** O `audit.mjs` faz três coisas:
- casa o texto publicado contra `scripts/residue-lexicon.json` + o que vier em `--forbid`;
- confere o resumo do `llms.txt` contra `--brand` e `--sector`;
- na varredura de repo, sinaliza **prosa longa de negócio cravada dentro de componente** (`prose.hardcoded`) — o esconderijo exato.

E lista as **frases auto-descritivas** ("somos", "atendemos", "acreditamos", "nossa equipe") de cada página, pra leitura humana. É o gesto que fecha o buraco: um texto de molde novo, que o léxico não conhece, aparece nessa lista.

**Como corrigir de verdade.** Não basta reescrever a página. Três camadas:
1. **A página** — reescrever com o texto certo.
2. **O código** — a prosa sai do componente e passa a vir do config/CMS. Se ficar cravada, o próximo site nasce com ela de novo.
3. **O molde** — corrigir na origem e acrescentar os termos ao `residue-lexicon.json`. **Sem isso, o bug é imortal.**

---

## 2 · Chave de API exigida por feature que ninguém pediu (P1)

**O caso (mesmo projeto).** O setup do site pedia uma `ANTHROPIC_API_KEY`. O dono, que só queria publicar posts, foi obrigado a abrir uma conta na Anthropic e colocar cartão. A chave nem era do blog — era de uma rota de diagnóstico com IA (`/porta`) herdada do molde, uma página que aquele site nunca teve e que hoje devolve 404.

**Por que isso é achado, não funcionalidade.** Toda chave que o código exige é uma conta a mais, uma fatura a mais e um segredo a mais pra alguém guardar. Quando a feature nem foi pedida, isso é custo puro — e, pior, faz o dono acreditar que aquilo é pré-requisito do site funcionar.

**O que auditar:**
- Toda `process.env.*_API_KEY` / `*_TOKEN` / `*_SECRET`: **qual feature usa? o dono pediu essa feature?**
- A feature **degrada com elegância** sem a chave, ou o site quebra? (Sem chave, o comportamento honesto é a rota sumir ou responder "indisponível" — não estourar erro.)
- Feature morta (rota 404, componente não referenciado) com dependência de chave = **remover**, não documentar.
- `NEXT_PUBLIC_*` com nome de segredo = **P0**. Tudo com esse prefixo vai pro JavaScript que o navegador baixa; qualquer visitante lê.

**Regra pro molde:** feature que exige chave paga nasce **desligada por padrão**, atrás de um flag, e documentada como opcional. Nunca no caminho crítico do setup.

---

## 3 · Host canônico inconsistente (P0)

**O caso.** O site servia em `www.dominio.com.br` (o apex redirecionava com 308, correto). Mas o `canonical` de **toda** página, o `schema.Organization.url` e os 15 links do `llms.txt` apontavam pro apex sem www.

**Por que dói.** `canonical` é a etiqueta que diz ao Google "o endereço oficial desta página é esse". Apontando pra um endereço que só redireciona, a autoridade fica dando voltas em vez de acumular. E a IA vê duas identidades onde deveria ver uma.

**Onde nasce:** uma variável `SITE_URL` preenchida antes de decidir se o domínio final teria www. Um caractere. Efeito em todas as páginas.

**Como auditar:** o `audit.mjs` compara o host de `canonical`, do schema e dos links do `llms.txt` contra o host que de fato serve o conteúdo. Também testa `http://`, o host alternativo (com/sem www) e uma URL inexistente (pra pegar soft-404 — quando o servidor devolve 200 numa página que não existe e o Google indexa lixo).

---

## 4 · Seção publicada e vazia (P1)

Heading no ar com estado vazio embaixo: "Cases — Nenhum case com esse recorte ainda". A página é indexada como página fina, e o `llms.txt` lista "## Cases" sem item nenhum — o que diz pra IA que a oferta existe mas não tem prova. É pior do que não ter a seção.

**Regra:** seção sem conteúdo real não vai pro ar. Ou se preenche, ou se despublica até ter o que mostrar.

---

## 5 · Formulário-fantasma (P0 · o mais caro de todos)

**O caso (mesmo site, achado em 2026-07-25).** O formulário de contato — presente em **todas** as páginas, porque estava no rodapé global — fazia isto:

```jsx
onSubmit={(e) => {
  e.preventDefault();
  setDone(true);     // ← e só. Nenhum fetch. Nenhum action. Nenhum e-mail.
}}
```

Em seguida exibia: *"Recebemos sua mensagem. Falamos em breve! 💬"*

Todo mundo que preencheu leu que a mensagem chegou. **Nenhuma chegou.**

**Por que é o defeito mais caro que existe.** Ele faz duas vítimas ao mesmo tempo e cala as duas: quem preencheu acha que falou com a empresa e fica esperando; o dono acha que ninguém procurou pelo site. Ninguém reclama de um formulário que "funcionou". Pode durar anos.

**Por que passou por todo mundo.** No molde existiam **dois componentes com o mesmo nome**: `motor/sections/ContactForm.tsx` (o real, que posta em `/api/contact`) e `motor/components/ContactForm.tsx` (uma maquete visual, feita pra demonstração). O chrome global importava a maquete. Na tela, os dois são idênticos — inclusive a mensagem de sucesso. Só o comportamento difere, e comportamento não aparece em screenshot nem em review de layout.

**Como pegar.** O `audit.mjs --repo` implementa a regra `form.fake`: arquivo que contém `<form>` e alguma variante de mensagem de sucesso (`setDone`, `setSent`, "recebemos", "obrigado"), mas **nenhum destino** (`fetch`, `action=`, `mailto:`, `"use server"`, `useActionState`, ou SDK de captura conhecido) → **P0**. A variante mais fraca (`form.nodest`) marca P1 quando não há destino mas também não há mensagem de sucesso — pode estar recebendo o destino por prop.

**A regra que fecha o buraco, e vale pra qualquer site:** *nenhum formulário é declarado funcionando sem um envio real que chegou ao destino.* Preencher no site no ar, com um dado reconhecível, e confirmar na caixa de entrada / planilha / CRM. Ler o código não prova nada — o código deste estava impecável, bem indentado, com `aria-label` em todo campo.

**E no molde:** maquete visual não vive na mesma pasta e com o mesmo nome do componente real. Ou se chama `ContactFormPreview`, ou não existe.

---

## 6 · Nenhuma medição instalada (P0)

Mesmo site: zero Analytics, zero Tag Manager, zero contador de qualquer espécie. O dono publicou, esperou, e não tinha como saber se alguém tinha entrado.

Não é "faltou um extra". É o site funcionando sem instrumento: dá pra melhorar, mas não dá pra saber se melhorou — e **o dado que não se coleta hoje não volta depois**. Por isso é P0 e por isso vem cedo, mesmo num site que ainda vai mudar muito.

Molde que se preze aceita o ID de medição por variável de ambiente e **avisa no setup quando ele está vazio**. Ver `guia-do-leigo.md §1`.

---

## 7 · O padrão por trás de todos

Os seis têm a mesma raiz: **o molde carrega decisões da marca que o originou, e a troca de marca só alcança o que está visível na tela.** Texto dentro de componente, arquivo que só robô lê, componente-maquete com nome de componente-real, variável de ambiente vazia — nada disso aparece olhando o site.

Toda auditoria de site nascido de molde começa perguntando **de qual molde ele nasceu**, testa o que não se vê (formulário, medição, `llms.txt`, `canonical`), e termina corrigindo o molde — não só o filho.
