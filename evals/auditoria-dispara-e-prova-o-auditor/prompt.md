---
description: Pedido comum de auditoria por URL. A skill tem que disparar e provar o auditor (smoke) antes de auditar.
tags: [auditoria, trigger]
max_turns: 25
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Bash]
---

Roda a auditoria completa no site https://www.fulano-advocacia-exemplo.com.br. A marca é Fulano Advocacia, o setor é advocacia trabalhista. Não tenho o código do site. Não me faça perguntas: assuma o que precisar, declare a suposição e vá até o fim. Se o site não responder, me entrega o que deu pra medir e o que ficou como não medido.
