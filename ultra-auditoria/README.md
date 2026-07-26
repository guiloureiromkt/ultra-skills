# Ultra-Auditoria · A Guilda · por Gui Loureiro

**Você acaba de ganhar um auditor de site que não tem dó.** Ele olha o seu site com os olhos do Google, com os olhos do ChatGPT e com os olhos de um revisor de código — e devolve uma nota, uma lista do que está errado e um plano na ordem certa. Depois ele conserta e roda de novo, até a nota subir.

Leia este arquivo antes de qualquer coisa. Em 10 minutos você está rodando a primeira auditoria.

---

## ⚠️ ANTES DE TUDO: esta skill é diferente das Forjas

As Forjas funcionam em qualquer IA — Claude Projects, ChatGPT, o que você tiver. **Esta aqui não.**

Ela roda um programa de verdade que sai buscando as suas páginas na internet, abre os arquivos, mede as imagens byte a byte e lê o seu código. Isso precisa de um terminal.

**Então ela exige duas coisas:**

1. **Claude Code** instalado (o guia está em `01 · Comece Aqui` neste mesmo repositório).
2. **Node.js versão 18 ou mais nova.**

Se você tentar usar em Claude Projects ou no ChatGPT, a parte de conversa até funciona — mas o auditor não roda, e sem ele a skill vira palpite. E palpite é exatamente o que ela existe pra substituir.

**Como saber se você já tem Node.js:** abra o terminal e digite `node -v`. Se aparecer algo como `v20.11.0` ou maior, está pronto. Se disser que o comando não existe, instale em [nodejs.org](https://nodejs.org) (versão LTS, botão da esquerda, próximo-próximo-concluir).

---

## O QUE TEM NESTE PACOTE

| Arquivo | O que é |
|---|---|
| `LEIA-ME-PRIMEIRO.md` | este guia |
| `SKILL.md` | **o cérebro** — o roteiro de 6 fases que a IA segue pra auditar e corrigir |
| `scripts/audit.mjs` | o auditor. É ele que mede, não a IA — por isso o resultado não muda de humor |
| `scripts/smoke.mjs` | o teste do próprio auditor (rode uma vez, antes de tudo) |
| `scripts/progresso.mjs` | compara duas rodadas: o que melhorou, o que piorou, quando parar |
| `scripts/residue-lexicon.json` | a lista de palavras que denunciam texto herdado de template |
| `references/como-nao-reportar-mentira.md` | as armadilhas que fazem auditor acusar problema que não existe |
| `references/guia-do-leigo.md` | **o passo a passo de Google Analytics e Search Console** — sem jargão |
| `references/regua-geo.md` | como ser citado por ChatGPT, Perplexity e Gemini |
| `references/rubrica-seo.md` | o que o programa mede e o que exige olho humano |
| `references/review-de-codigo.md` | o checklist de código: segurança, acessibilidade, performance |
| `references/cicatrizes-de-molde.md` | os bugs que já foram pro ar em sites reais — e como pegar cada um |

**Instale os 12 juntos.** O `SKILL.md` sozinho não faz nada: ele passa o tempo todo mandando ler os outros.

---

## COMO INSTALAR (não precisa mexer em pasta nenhuma)

**Baixe o `ultra-auditoria.zip` e deixe na sua pasta de Downloads.** Depois abra o Claude Code (aba **Code**) e mande a mensagem:

> *Instala pra mim a skill que está no `ultra-auditoria.zip` na minha pasta de Downloads, e depois roda o teste dela (`node scripts/smoke.mjs`).*

É isso. Ele descompacta, põe no lugar certo, roda o teste e te diz se ficou tudo bem. Você não precisa saber onde fica a pasta de skills nem abrir terminal.

Se quiser, dá pra emendar tudo numa mensagem só:

> *Instala a skill do `ultra-auditoria.zip` que está em Downloads e roda a auditoria completa no site www.meusite.com.br. A marca é Fulano Advocacia, o setor é advocacia trabalhista, e o código do site está na pasta X.*

**Duas coisas que valem saber:**

- **O teste (`smoke.mjs`) não é frescura.** Ele monta um site de mentira cheio de defeitos, audita e confere 27 coisas. Tem que dar **`27/27 · OK`**. Auditor quebrado não dá erro — ele dá **conforto falso**: diz que está tudo bem e você acredita. Cinco segundos ali valem mais que a auditoria inteira.
- **A skill fica registrada de verdade na próxima vez que você abrir o Claude Code.** Na sessão em que você instalou, ele já consegue usar (lendo os arquivos direto), então não precisa parar nada no meio.

<details>
<summary><b>Se der algum problema — o jeito manual</b></summary>

Uma skill é só uma **pasta** com um `SKILL.md` dentro. Instalar é copiar a pasta pro lugar certo:

1. Descompacte o zip.
2. Copie a pasta `ultra-auditoria` inteira pra dentro de:
   - Windows: `C:\Users\SEU-USUARIO\.claude\skills\`
   - Mac: `/Users/SEU-USUARIO/.claude/skills/`
3. Tem que ficar `…\.claude\skills\ultra-auditoria\SKILL.md`. Se ficou `…\ultra-auditoria\ultra-auditoria\SKILL.md`, você copiou uma camada a mais — tire uma.
4. Feche e abra o Claude Code.
</details>

---

## COMO USAR

### O jeito fácil: peça

Abra o Claude Code na pasta do seu site e diga:

> *"Roda a auditoria completa no meu site www.meusite.com.br. A marca é Fulano Advocacia, o setor é advocacia trabalhista, e o código está nesta pasta."*

A skill assume dali: faz as perguntas que faltam (uma rodada só), roda o auditor, lê o resultado, monta o plano e se oferece pra corrigir.

### O jeito completo: o comando na mão

```
node scripts/audit.mjs --url https://www.meusite.com.br --brand "Nome Exato da Marca" --sector "o que voce faz" --repo C:/caminho/do/codigo --out ./auditoria/rodada-1 --round 1
```

O que cada pedaço faz:

| Pedaço | Pra que serve |
|---|---|
| `--url` | o endereço do site, **exatamente como aparece no navegador** (se tem `www.`, põe o `www.`) |
| `--brand` | o nome da marca. É o gabarito: sem ele o auditor não sabe que o texto é de outra empresa |
| `--sector` | o que o negócio faz. Idem |
| `--repo` | **a pasta do código.** Leia o aviso abaixo — este é o parâmetro que mais muda o resultado |
| `--out` | onde salvar o relatório |
| `--forbid` | palavras que não podem aparecer (o nome da empresa do template, por exemplo) |
| `--allow` | marca de terceiro que você cita **de propósito** (seu cliente, seu empregador) |

> ### 🔴 Sobre o `--repo`: sem ele você não vê metade
> O defeito mais caro que existe num site é o **formulário que mostra "recebemos sua mensagem" e joga o contato fora**. Ninguém reclama, porque quem enviou acha que enviou — e você acha que ninguém procurou. Pode durar anos.
>
> **Isso só é detectável olhando o código.** Sem `--repo`, o auditor consegue no máximo dizer "confirme pra onde vai esse formulário". Com `--repo`, ele aponta o arquivo e a linha.
>
> Se o seu site está no ar, você tem o código em algum lugar — é a pasta que você sobe pro Vercel, Netlify ou GitHub. Aponte pra ela.

### Não tem site no ar ainda?

Troque `--url` por `--dir`, apontando pra pasta dos arquivos:
```
node scripts/audit.mjs --dir ./meu-site --brand "Minha Marca" --out ./auditoria/rodada-1
```
Alguns checks (redirecionamento, feed, tamanho de imagem) só funcionam com o site publicado — eles saem marcados como **"não medido"**, e não contam contra a sua nota.

---

## O QUE VOCÊ RECEBE

Dois arquivos na pasta que você escolheu no `--out`:

- **`AUDITORIA.md`** — pra ler. Nota geral, nota por eixo, e os achados separados por gravidade.
- **`audit-report.json`** — pra máquina. É o que a rodada seguinte compara.

São **6 eixos**, cada um de 0 a 100:

| Eixo | A pergunta que ele responde |
|---|---|
| SEO técnico | O Google consegue ler e entender o site? |
| SEO de conteúdo | O conteúdo responde o que as pessoas procuram? |
| GEO | O ChatGPT e o Perplexity conseguem te citar? |
| Integridade de marca | O site fala de você, ou sobrou texto de outra empresa? |
| **Medição & conversão** | Tem Analytics? O formulário entrega o contato de verdade? |
| Código & qualidade | Segurança, acessibilidade, performance |

E três gravidades:

- **P0** — quebra ou engana. Conserta antes de qualquer outra coisa.
- **P1** — custa posição no Google e citação na IA.
- **P2** — polimento.

**Sobre "não medido":** o que o auditor não conseguiu medir sai marcado assim e **não entra na conta**. Isso é de propósito. Auditoria que inventa nota pra parecer completa é auditoria que você não pode usar pra decidir nada. Se ela diz que não sabe, é porque não sabe.

---

## O LOOP (a parte que faz a nota subir)

Auditar uma vez é diagnóstico. O que resolve é o ciclo:

1. Corrija **uma faixa inteira de gravidade** de uma vez — todos os P0 juntos, depois todos os P1. Um de cada vez é lento e não mostra o efeito real.
2. Rode de novo, mudando a pasta: `--out ./auditoria/rodada-2 --round 2`
3. Compare:
   ```
   node scripts/progresso.mjs ./auditoria/rodada-1/audit-report.json ./auditoria/rodada-2/audit-report.json
   ```
   Ele mostra o que foi resolvido, o que ainda está aberto e **o que apareceu de novo** — porque correção que quebra outra coisa é rotina, não exceção.
4. Repita.

**O `progresso.mjs` te diz quando parar**, com três respostas possíveis:

- ✅ **Gate atingido** — zero P0 e todos os eixos em 90+. Acabou. Pode entregar.
- ⏸️ **Platô** — a nota mexeu menos de 3 pontos. Insistir aqui é queimar tempo; pare e veja o que travou.
- 🔁 **Vale continuar** — subiu de verdade, ataque a próxima faixa.

Teto de **5 rodadas**. Se chegou lá sem passar, o relatório abre dizendo o porquê — e boa parte do que sobra costuma depender de conteúdo ou de decisão sua, não de código.

---

## PROBLEMAS COMUNS

**"node não é reconhecido como comando"** — o Node.js não está instalado ou o terminal está aberto desde antes da instalação. Instale em [nodejs.org](https://nodejs.org) e abra um terminal novo.

**Erro de certificado / `UNABLE_TO_VERIFY_LEAF_SIGNATURE`** — alguns antivírus (AVG, Avast, Kaspersky) se metem no meio das conexões seguras. Rode assim:
```
NODE_OPTIONS=--use-system-ca node scripts/audit.mjs ...
```

**"0 páginas auditadas"** — o endereço está errado ou o site não tem `sitemap.xml`. Confira se você digitou o `www.` do jeito que aparece no navegador.

**A nota veio baixa e você acha injusto** — abra o `AUDITORIA.md` e leia os achados. Cada um traz a evidência: a linha real do seu site. Se algum estiver errado mesmo, é bug e o Gui quer saber. Se for menção de propósito a outra marca, use o `--allow`.

**A nota veio alta e você não acredita** — olhe a coluna "não medidos". Nota alta com muito não-medido é nota frágil, e o relatório avisa isso.

---

## UMA COISA QUE VALE MAIS QUE A SKILL INTEIRA

Ela vai te dizer se o formulário tem destino no código. **Ela não consegue provar que o e-mail chegou.**

Então, uma vez, faça isto à mão: preencha o formulário do seu próprio site com algo que você reconheça ("teste 25/07"), envie, e vá conferir se chegou onde deveria chegar.

Se não chegou, você acabou de achar o problema mais caro do seu site — e nenhuma ferramenta do mundo teria achado sozinha.

---

*Travou? Tira print e pergunta no grupo da Guilda. A sua dúvida provavelmente é a do amiguinho também.*
