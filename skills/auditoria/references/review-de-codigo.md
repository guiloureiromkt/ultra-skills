# Review de código — o que quebra site de verdade

Este review não é de estilo. Ninguém foi prejudicado por indentação. O que derruba site é: segredo vazado, texto errado publicado, página que o crawler não vê, custo que ninguém pediu e acessibilidade que exclui gente.

O `audit.mjs --repo` já grepa os padrões mecânicos. Aqui está o que exige leitura, e o porquê de cada um.

---

## 1 · Segredo e fronteira servidor/cliente (P0)

Tudo que o navegador baixa é público. Não existe segredo no frontend.

- `NEXT_PUBLIC_*` (ou `VITE_*`, `PUBLIC_*`) com nome de chave, token ou segredo → **P0 imediato**. Qualquer visitante abre o DevTools e lê.
- Chave de API usada em componente de cliente (`"use client"`) → mesma coisa, mesmo que a variável não tenha prefixo público: se o código roda no navegador, o valor chegou lá.
- Segredo commitado em `.env` versionado, em teste, em comentário, em `docs/`. Rode `git log -p --all -S "sk-"` quando houver suspeita.
- **Se algo vazou, a correção é rotacionar a chave.** Apagar o commit não resolve — a chave já esteve pública.

## 2 · Chave exigida por feature (P1)

Ver `cicatrizes-de-molde.md §2` — é uma cicatriz real, não hipótese.

Pra cada `process.env.*KEY|TOKEN|SECRET`: **qual feature usa, o dono pediu essa feature, e o que acontece sem a chave?** Feature herdada de molde, não pedida e ainda por cima paga, é achado. Sem a chave o comportamento honesto é a rota sumir ou responder "indisponível" — não estourar erro em produção.

## 3 · Texto de negócio cravado no código (P1 · eixo de marca)

Prosa que descreve a empresa dentro de componente não passa pelo CMS nem pelo config. É o esconderijo onde o texto do molde sobrevive à troca de marca. O script sinaliza (`prose.hardcoded`); a correção é mover pro config/CMS, não só reescrever.

## 4 · O crawler enxerga? (P0 quando falha)

Buscador e crawler de IA leem o HTML servido, sem executar JavaScript.

- Conteúdo principal montado só no cliente (`useEffect` que busca e renderiza) é **invisível** pro Google e pro ChatGPT.
- Em Next.js: componente marcado `"use client"` sem necessidade empurra conteúdo pro navegador. Server Component é o default por um motivo.
- Teste rápido: `curl -s <url> | grep -c "<trecho do texto principal>"`. Zero = problema.
- Armadilha inversa: `window`, `document` ou `localStorage` no topo de módulo quebram o build no servidor. Acesso a browser API vive dentro de `useEffect` ou atrás de `typeof window !== "undefined"`.

## 5 · Acessibilidade (P1 — e é obrigação legal em vários contextos)

Vale por si, e o buscador usa os mesmos sinais.

- Toda `<img>` com `alt`. Decorativa leva `alt=""` (explicitamente vazio, não ausente) — isso diz ao leitor de tela "pule isto".
- Botão que é só ícone precisa de `aria-label`. Sem isso o leitor de tela anuncia "botão".
- Todo `<input>` com `<label>` associado por `for`/`id`. Placeholder não é label — ele some quando a pessoa digita.
- Navegação por teclado: dá pra chegar em tudo com Tab, e o foco é visível? `outline: none` sem substituto é falha.
- Contraste mínimo 4.5:1 pra texto normal. Cinza-claro sobre branco é o erro mais comum de site bonito.
- Headings em ordem, sem pular nível — é o índice pelo qual quem usa leitor de tela navega.
- `prefers-reduced-motion` respeitado onde há animação. Movimento involuntário causa enjoo real em parte das pessoas.

## 6 · Performance (P1/P2)

- Imagem servida em resolução muito maior que a exibida. Foto de 4000px num card de 400px é o desperdício mais comum e o mais fácil de corrigir.
- Formato moderno (WebP/AVIF) com fallback.
- `width`/`height` (ou `aspect-ratio`) em toda imagem — sem isso a página pula enquanto carrega, o que conta contra na métrica de experiência do Google.
- Fonte de CDN externo bloqueia o texto aparecer. Fonte local com `font-display: swap` é o padrão.
- Script de terceiro (chat, pixel, analytics) carregado de forma bloqueante.
- **CDN externo em geral é achado** — é ponto de falha e de vazamento fora do seu controle, e uma política de segurança de conteúdo costuma barrar em silêncio. Vendorize.

## 7 · Robustez

- `fetch` sem tratamento de erro e sem timeout. A API de terceiro **vai** cair um dia; a pergunta é se o site cai junto.
- Rota de API sem validação do que chega. Nunca confie no corpo do request.
- Formulário sem estado de erro e sem confirmação de envio — a pessoa clica de novo e você recebe o lead duplicado.
- `console.log` com dado de usuário em produção.
- Chave de API chamada direto do navegador (deveria passar por rota no servidor).

## 8 · Dependências

- Pacote no `package.json` que ninguém importa.
- Dependência sem release há anos numa área que muda (auth, pagamento, upload).
- `npm audit` com vulnerabilidade alta/crítica em dependência que roda em produção. **Devdependency com alerta raramente é urgente** — não trate os dois do mesmo jeito, senão o relatório vira alarme falso.

---

## Como reportar um achado de código

Sem drama e sem catequese. Três linhas e o caminho:

```
### [P0] Chave da API no bundle do cliente
**Onde:** src/components/Contato.tsx:14
**O que acontece:** a variável NEXT_PUBLIC_RESEND_KEY vai pro JavaScript que o
navegador baixa. Qualquer visitante lê e pode enviar e-mail em nome do site.
**Correção:** mover o envio pra uma rota de servidor (app/api/contato/route.ts) e
renomear a variável pra RESEND_KEY, sem o prefixo público. Rotacionar a chave —
a atual já esteve pública.
```

E o mais importante: **não invente gravidade.** Um `console.log` esquecido é P2. Chamá-lo de risco de segurança destrói a credibilidade dos P0 de verdade que estão no mesmo relatório.
