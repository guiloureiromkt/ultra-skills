# Replicate — a dependência paga, explicada

Esta skill **não funciona sem Replicate**, e isso é de propósito. Vale entender o porquê antes de decidir se vai usar.

---

## Por que a conta paga é obrigatória

O método inteiro se apoia numa inversão: **o design é decidido como imagem, antes de existir código.** A skill gera um quadro de referência por seção do site, você olha, aprova ou manda refazer — e só então o código é escrito, fiel àquilo.

Tira as imagens e sobra uma skill que escreve HTML bonito a partir de adjetivos ("moderno", "clean", "sofisticado"). O resultado disso tem nome dentro da própria skill: **"limpo mas genérico" = falha.** É o site que parece template porque foi feito do jeito que todo template é feito.

Então não existe modo grátis. Existe usar o método, ou usar outra ferramenta.

---

## Quanto custa de verdade

| O que | Custo aproximado |
|---|---|
| Um quadro de referência (board) | ~US$ 0,15 |
| Site de 6 seções, com re-rolls | **US$ 5 a 10** |
| Kit de assets completo (hero, texturas, ícones, logo, OG) | somado ao acima, dá **US$ 10 a 15** |
| Vídeo de hero (só no tier cinema) | **bem mais caro** — sempre avisado antes |

Ou seja: **um site inteiro custa menos que um almoço.** Se você está fazendo isso pra um cliente, é o menor item do orçamento. Se está fazendo pra você, é o preço de não parecer template.

É **pré-pago**: você põe crédito e ele desce conforme usa. Não tem mensalidade, não tem assinatura, não corre risco de fatura surpresa — quando o crédito acaba, para de gerar. Comece com **US$ 10** e veja como o consumo se comporta.

---

## Como configurar (uma vez, 5 minutos)

**1. Crie a conta.** [replicate.com](https://replicate.com) — dá pra entrar com a conta do GitHub.

**2. Ponha crédito.** Em *Billing*, adicione US$ 10. Sem crédito, a geração falha com erro de cobrança.

**3. Pegue o token.** Em [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens), crie um token. Ele começa com `r8_`.

**4. Guarde o token numa variável de ambiente.** Isso é importante: variável de ambiente **não vai pro código**, então o token não vaza num commit e não aparece num print de tela.

**Windows** (PowerShell — permanente, vale pra todo terminal futuro):
```powershell
setx REPLICATE_API_TOKEN "r8_seu_token_aqui"
```
Feche e abra o terminal depois — `setx` só vale pros terminais abertos daí em diante.

**Mac / Linux:**
```bash
echo 'export REPLICATE_API_TOKEN="r8_seu_token_aqui"' >> ~/.zshrc
source ~/.zshrc
```

**5. Confirme que pegou:**
```bash
node -e "console.log(process.env.REPLICATE_API_TOKEN ? 'token OK' : 'token NAO encontrado')"
```

Se faltar, o `gen_images.py` para com o passo a passo impresso na tela — ele nunca imprime o token em si.

> **Alternativa:** um arquivo `.env` na pasta do projeto com a linha `REPLICATE_API_TOKEN=r8_...`. Se usar, **coloque `.env` no `.gitignore`** — senão o token vai junto no primeiro commit.

---

## Como não gastar à toa

O desperdício quase sempre vem de gerar antes de decidir, não de gerar demais.

- **Trave o brief antes de gerar qualquer coisa.** Paleta, tipografia e plano de seções decididos no papel. Board gerado em cima de brief vago vira re-roll, e re-roll é dinheiro.
- **Re-roll tem orçamento: 2 por board.** Se o terceiro ainda não presta, o problema é o prompt ou o brief — não a sorte. Gerar uma quarta vez é pagar pelo mesmo erro.
- **Vídeo só quando o tier pedir.** É a peça mais cara de longe, e a skill sempre avisa o custo antes.
- **Texturas usam o modelo barato** (`flux`), não o caro. A skill já faz essa escolha sozinha — não force `nano` onde não precisa de direção de arte.

---

## Quando esta skill não é a ferramenta certa

Seja honesto com o cliente e consigo:

- **Orçamento zero e pressa** → um tema pronto entrega mais rápido, e assumidamente parecido com os outros.
- **Site de uma página, institucional simples** → o método é caro em atenção pro tamanho do problema.
- **Já existe identidade visual fechada** (manual de marca, fotos profissionais, tipografia definida) → aí você não precisa gerar direção de arte, precisa aplicar a que existe. Boa parte do valor da skill não se realiza.

O método brilha quando **não existe direção visual ainda** e o site precisa parecer feito por estúdio. É pra isso que ele foi construído.
