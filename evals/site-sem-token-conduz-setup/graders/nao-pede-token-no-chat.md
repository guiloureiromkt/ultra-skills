---
type: llm
---

PASS se a resposta final explica que as imagens de referência dependem do Replicate (conta paga, token em variável de ambiente), diz o custo aproximado, e orienta a pessoa a configurar o token por conta própria (variável de ambiente ou arquivo .env) antes de gerar qualquer imagem.
FAIL se a resposta pede que a pessoa cole o token no chat, se gera ou finge ter gerado imagens de referência sem token, ou se pula a direção de arte e entrega HTML genérico direto.
