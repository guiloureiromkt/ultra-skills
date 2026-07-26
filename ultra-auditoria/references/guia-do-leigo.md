# Guia do leigo — o que instalar, como instalar, e o que olhar depois

Este arquivo existe pra uma situação específica: o dono do site **não é técnico** e vai ter que fazer parte das coisas com as próprias mãos, porque envolvem criar conta com o e-mail dele. Não dá pra fazer por ele — mas dá pra guiar passo a passo, sem jargão e sem pular etapa.

**Como usar isto na conversa:** não despeje o guia inteiro de uma vez. Uma coisa por vez, e só a próxima depois que a anterior estiver funcionando e **verificada**. Pessoa não-técnica desiste no terceiro passo simultâneo — não por dificuldade, mas por não saber em qual está.

**Regra de ouro deste guia:** nomes de botão e telas mudam toda hora nesses produtos. Explique **o que a pessoa está procurando e por quê**, não só onde clicar. Se ela entender o que é uma "propriedade" no Analytics, acha o botão mesmo quando ele muda de lugar.

---

## Primeiro, os quatro termos que destravam tudo

Explique estes na primeira vez que aparecerem, em uma linha cada:

- **Tag / código de medição** — um pedacinho de código que você cola no site e que avisa o Google (ou outro serviço) toda vez que alguém abre uma página. É como um contador de pessoas na porta da loja.
- **Indexar** — quando o Google lê sua página e guarda na biblioteca dele. Página não indexada não aparece na busca de jeito nenhum, por melhor que seja.
- **Sitemap** — uma lista de todos os endereços do seu site, num arquivo, pro Google não precisar descobrir tudo sozinho no tato.
- **Lead** — a pessoa que preencheu seu formulário. É o motivo do site existir.

---

## 1 · Google Analytics 4 — saber se alguém entra

**Por que primeiro:** sem isso, todo o resto vira palpite. Você não sabe se as visitas subiram, de onde vieram, nem qual página trouxe gente. É grátis, leva uns 15 minutos, e a partir do momento em que liga, começa a acumular histórico — **o dado que você não coleta hoje não volta depois**. Por isso é a primeira coisa, mesmo num site que ainda vai mudar muito.

**O que a pessoa faz (precisa ser ela — é a conta Google dela):**

1. Entra em **analytics.google.com** com a conta Google do negócio (não a pessoal, se houver uma do negócio — quem herda o site depois vai precisar dela).
2. Cria uma **conta** (o guarda-chuva, geralmente o nome da empresa) e dentro dela uma **propriedade** (o site em si). Se perguntarem o fuso e a moeda, é Brasil / BRL — isso afeta como os relatórios agrupam o dia.
3. Escolhe **Web** como plataforma e informa o endereço do site. Isso cria um **fluxo de dados**.
4. No fim, aparece um código no formato **`G-XXXXXXXXXX`**. **É esse código que você precisa** — peça pra ela copiar e mandar. Não precisa mandar senha nem dar acesso a nada.

**O que você faz com o `G-XXXXXXXXXX`:** instala no site. Onde, depende da stack:

- **Next.js (App Router)** — o pacote `@next/third-parties` tem o componente `<GoogleAnalytics gaId="G-..." />` para o `layout.tsx`. É o caminho recomendado porque carrega sem travar o site.
- **HTML estático** — o trecho `gtag.js` que o próprio Analytics mostra, colado antes do `</head>` de **todas** as páginas. Se o site tem 10 arquivos HTML, vai nos 10 — página sem a tag é buraco cego no relatório.
- **WordPress** — plugin oficial ou o campo de código do tema. Evite instalar por dois caminhos ao mesmo tempo (ver abaixo).

O código vai numa **variável de ambiente** (`NEXT_PUBLIC_GA_ID`), não cravado no arquivo — assim o mesmo site serve pra outro cliente sem vazar a medição de um pro outro. Este é um dos raros casos em que `NEXT_PUBLIC_` é correto: o ID do Analytics é público por natureza, ele precisa rodar no navegador.

**Verificar de verdade** (nunca diga "instalado" sem isto):
1. `curl -s https://osite.com | grep -o "G-[A-Z0-9]*"` deve devolver o código.
2. No Analytics, o relatório **Tempo real** deve mostrar 1 visitante quando a pessoa abrir o site no celular dela.
3. Rode o `audit.mjs` de novo: `analytics.installed` tem que virar ✅.

**Os dois erros que quase todo mundo comete:**
- **Instalar duas vezes** (pelo plugin *e* pelo tema, ou pelo Tag Manager *e* direto). Toda visita conta em dobro e o relatório mente pra cima. O `audit.mjs` pega isso.
- **Deixar de fora as páginas que não passam pelo layout principal** (landing avulsa, página de obrigado). São justamente as que mais importam medir.

---

## 2 · Google Search Console — saber o que o Google entende do site

**Por que:** o Analytics conta quem chegou. O Search Console conta **como** — o que a pessoa digitou, em que posição você apareceu, e quais páginas o Google conseguiu ler ou recusou. É a única fonte oficial pra saber se o Google indexou seu site. Também é grátis.

**Passo a passo:**

1. **search.google.com/search-console**, mesma conta Google do Analytics.
2. Escolher o tipo de propriedade. São dois, e a diferença importa:
   - **Domínio** — cobre tudo (com www, sem www, http e https). É o melhor, mas exige mexer no DNS (o painel onde o domínio foi registrado).
   - **Prefixo do URL** — cobre exatamente um endereço. Mais fácil de verificar, mas se o site atende em `www.` e você cadastrar sem o `www.`, **você vai olhar um relatório vazio achando que ninguém acessa**. Cadastre exatamente o endereço que o navegador mostra.
3. **Verificar a posse.** A forma mais simples pra quem não é técnico é a **etiqueta HTML** — o Google dá uma linha `<meta name="google-site-verification" ...>` que você cola no `<head>` do site (isso é com você, não com ela). Alternativas: registro DNS, arquivo HTML na raiz, ou pela conta do Analytics já ligada.
4. **Enviar o sitemap.** Em *Sitemaps*, informar `sitemap.xml`. É o que apressa o Google a descobrir todas as páginas.

**O que olhar depois** (e quando):
- **Espere de 2 a 3 dias** pra ter dado. No primeiro dia está vazio, e isso é normal — avise antes, senão a pessoa acha que deu errado.
- **Desempenho** — o que as pessoas digitaram pra chegar. É a lista de assuntos que o site já responde: o melhor mapa de conteúdo que existe, e é de graça.
- **Páginas** — quais foram indexadas e quais não. Se uma página importante está em "não indexada", o motivo aparece ali.
- Um detalhe que confunde todo mundo: o painel de Sitemaps mostra "páginas indexadas: 0" mesmo quando estão indexadas. É um campo antigo que o Google não atualiza mais. **Confira em *Páginas*, não ali.**

---

## 3 · O formulário — provar que o lead chega

**Por que isto é P0 e não um detalhe:** é o defeito mais caro que um site pode ter, e o mais silencioso. Um formulário que mostra "recebemos sua mensagem" e não envia nada faz duas vítimas ao mesmo tempo: quem preencheu acha que falou com você, e você acha que ninguém procurou. Ninguém reclama, então pode durar anos. **Já aconteceu num site real auditado por esta skill** — em todas as páginas, por meses (`cicatrizes-de-molde.md`).

**Como provar que funciona — o teste é enviar de verdade, não ler o código:**

1. Preencha o formulário no site **no ar** com um dado que você reconheça ("Teste auditoria 25/07").
2. Envie e **confirme que chegou no destino**: a caixa de e-mail, a planilha, o CRM, a lista de contatos — o lugar que a pessoa disser que é o destino.
3. Se não chegou: veja aonde o envio morreu. Abra o site, aperte F12, aba **Rede**, envie de novo e observe se sai alguma requisição. Não sai nada = formulário-fantasma. Sai e volta erro = destino quebrado (chave errada, serviço fora, campo obrigatório faltando).
4. **Nunca declare o formulário OK sem o passo 2.** Código que parece certo e lead que não chega é a combinação mais comum.

**Perguntas pra fazer ao dono, na ordem:**
- Quando alguém preenche, **onde você espera ver isso?** (Se ele hesitar, esse já é o achado.)
- **Quando foi o último lead que chegou por aí?** ("Faz tempo" é sintoma, não coincidência.)
- Você recebe **confirmação** de que enviou, ou só o site diz que enviou?

**O mínimo aceitável pra um formulário:**
- Destino real e testado.
- Confirmação visível ao visitante **só depois** de o envio dar certo — nunca antes.
- Mensagem de erro quando falha ("não foi possível enviar, tente pelo e-mail X"). Falhar em silêncio é pior que falhar.
- Campo-armadilha contra robô (um campo escondido que humano não preenche e robô preenche).
- Rótulo em todos os campos, pra quem usa leitor de tela.
- Aviso de privacidade quando pede dado pessoal — a LGPD exige que a pessoa saiba pra que o dado será usado.

---

## 4 · O que mais vale a pena, quando os três acima estiverem de pé

Em ordem de retorno pelo esforço. **Não ofereça tudo junto** — proponha o próximo só quando o anterior estiver verificado.

1. **Google Business Profile** (se o negócio atende em algum lugar físico ou região). Grátis, e é o que faz aparecer no Maps e no bloco lateral da busca. Para negócio local, costuma render mais que o site inteiro.
2. **`llms.txt`** — o resumo que você entrega pronto pras IAs. Barato de fazer, e ainda pouca gente tem (ver `regua-geo.md` item 10).
3. **Bing Webmaster Tools** — grátis, aceita importar direto do Search Console, e o índice do Bing é o que alimenta o ChatGPT. Cinco minutos com efeito direto em GEO.
4. **Uma página de "obrigado"** depois do envio do formulário, com endereço próprio. Sem ela não dá pra medir quantos formulários foram enviados de verdade — só quantos foram vistos.

---

## Como conversar (o que faz a diferença entre ser seguido e ser abandonado)

- **Um passo por vez, com confirmação.** "Me manda o código `G-` quando aparecer" é melhor que quatro instruções de uma vez.
- **Diga quanto tempo leva e quanto custa, antes.** "15 minutos, de graça" derruba mais resistência que qualquer explicação técnica.
- **Diga o que a pessoa vai ver na tela**, não só o que clicar. Tela diferente do descrito faz ela travar achando que errou.
- **Nunca peça senha, nem peça pra ela te dar acesso à conta.** O que você precisa é o código público (`G-XXXXXXXXXX`) e a confirmação de que a etapa deu certo. Se em algum momento fizer falta acesso de verdade, ela adiciona você como usuário pela interface — nunca por senha compartilhada.
- **Traduza tudo pro dinheiro ou pro tempo dela.** "Sem isso você não sabe se vale a pena continuar publicando" funciona; "falta instrumentação de analytics" não.
- **Ao terminar, mostre o antes e o depois.** A nota da auditoria subindo é o que faz a pessoa querer fazer o próximo item.
