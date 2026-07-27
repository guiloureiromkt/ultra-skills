# Fase 2 · Hipóteses Priorizadas — Operacional

> Documento de execução da Fase 2 do Diagnóstico em 6 Dimensões.
> Pré-requisito: briefing da Fase 1 consolidado. Não iniciar esta fase sem o template de síntese preenchido.

---

## Bloco 1 · Como hipótese canon é construída

### Formato fixo

Toda hipótese gerada neste diagnóstico segue exatamente este formato:

**"Se [condição testável], então [efeito mensurável], validado por [proxy ou métrica acessível em até 14 dias]."**

Nenhum dos três elementos é opcional. Se qualquer um estiver ausente, a hipótese não está pronta.

### O que cada elemento exige

**Condição testável (Se X)**
- Deve ser uma ação ou mudança que pode ser executada ou observada
- Deve ter variável independente clara — algo que muda de forma controlada
- Não pode ser: uma suposição sobre comportamento alheio ("se os clientes valorizassem mais"), uma tendência de mercado, ou uma recomendação de investimento ("se contratarmos uma agência")
- Exemplos válidos: "se alterarmos o posicionamento da oferta para X segmento", "se testarmos uma nova página de captura com proposta de valor direcionada a Y", "se migrarmos 30% do budget de canal A para canal B por 4 semanas"

**Efeito mensurável (então Y)**
- Deve especificar qual métrica muda e em qual direção
- Deve ter magnitude esperada — não "taxa de conversão melhora", mas "taxa de conversão de página de captura sobe de X% para Y%"
- A métrica deve ser de negócio (receita, conversão, churn, CAC, ticket) ou um proxy direto de negócio
- Não pode ser: métrica de vaidade (impressões, seguidores, curtidas, "engajamento"), sentimento sem proxy mensurável, ou resultado que depende de ação de terceiro fora do controle da empresa

**Validação (validado por Z)**
- Deve especificar a ferramenta ou fonte de dado concreta
- Deve ser acessível: ferramenta gratuita ou até US$50/mês
- Deve ser executável em até 14 dias — se precisar de mais tempo, a hipótese vai para P2 e precisa de plano de instrumentação antes
- Exemplos válidos: GA4 (relatório de conversão por origem), Meta Ads Manager (teste A/B de criativo em campanha ativa), CRM da empresa (filtro de clientes por cohort de entrada), planilha de vendas dos últimos 90 dias, teste de mensagem em 10 ligações de prospecção com registro de resposta

### Quantidade e mix obrigatório

Cada diagnóstico gera 5 a 8 hipóteses.

- Menos de 5: briefing foi raso — volte à Fase 1 e aprofunde as dimensões com dado escasso
- Mais de 8: hipóteses em excesso são inação disfarçada de planejamento — priorize as mais críticas e coloque o restante em backlog documentado

**Mix obrigatório por categoria:**
- Pelo menos 2 hipóteses de **produto ou oferta** (o que é vendido, como é precificado, qual pacote/bundle/entrada)
- Pelo menos 2 hipóteses de **canal ou distribuição** (como o produto chega ao cliente, qual canal de aquisição, qual sequência de ativação)
- Pelo menos 1 hipótese de **positioning ou narrativa** (como a oferta é comunicada, para quem, com qual problema declarado como central)

Diagnóstico que retorna só hipóteses de conteúdo ou presença digital é diagnóstico de superfície — revela que a Fase 1 não chegou às dimensões de Negócio Real e Objetivos Não-Ditos com profundidade suficiente.

---

## Bloco 2 · Matriz Impacto × Verificabilidade (P1/P2/P3/P4)

Após gerar as 5-8 hipóteses, posicione cada uma na matriz abaixo para priorização.

### Os dois eixos

**Eixo X — Verificabilidade**
- **Alta:** resultado verificável em 1-2 semanas com ferramenta gratuita ou já disponível na organização, sem necessidade de nova infraestrutura, novo contrato ou novo budget significativo
- **Baixa:** verificação requer 30+ dias de execução, setup de ferramenta nova, investimento acima de US$50/mês, ou depende de contratação de parceiro externo

**Eixo Y — Impacto potencial**
- **Alto:** se confirmada, a hipótese muda uma decisão de negócio relevante — afeta unit economics (CAC, LTV, margem), muda alocação de canal principal, ou altera a oferta central
- **Baixo:** se confirmada, a hipótese gera otimização marginal — melhora métrica secundária, refina processo já existente, ou reduz fricção sem mudar estrutura

### Os quatro quadrantes

**P1 · Alto impacto + Alta verificabilidade**
> Rodar agora. Ação obrigatória na Semana 1.

Estas hipóteses têm o maior retorno sobre atenção: revelam algo crítico sobre o negócio usando dados já disponíveis. O cliente sai do diagnóstico com o compromisso de iniciar a verificação em até 5 dias úteis.

Exemplos típicos de P1: reanalizar dados de CRM já existente por cohort de origem, testar nova proposta de valor em 10 ligações de prospecção ativa, comparar taxa de ativação entre planos usando dados de assinaturas já registrados.

---

**P2 · Alto impacto + Baixa verificabilidade**
> Investir em instrumentar. Ação obrigatória na Semana 2-4.

Estas hipóteses são críticas mas exigem setup antes de verificar. A ação da Semana 1 não é rodar o teste — é criar a infraestrutura para que ele seja verificável. Isso inclui: instalar evento no GA4, configurar atribuição no CRM, criar registro estruturado de próximas interações de venda.

Ao final da Semana 4, a hipótese P2 deve ter se tornado verificável — ou o diagnóstico identifica por que não foi possível instrumentar e o que isso revela sobre a organização.

---

**P3 · Baixo impacto + Alta verificabilidade**
> Backlog. Rodar quando sobrar capacidade.

Estas hipóteses são fáceis de verificar mas não mudam decisões críticas. Ficam em backlog documentado. Não devem ocupar atenção da liderança nas primeiras 4 semanas. Se o cliente quiser rodá-las junto com P1, pode — desde que não desviem recursos do que importa.

---

**P4 · Baixo impacto + Baixa verificabilidade**
> Descartar ou repriorizar via pesquisa antes de qualquer ação.

Hipóteses P4 custam caro para verificar e mesmo se confirmadas mudam pouco. A ação correta é uma de duas: reformular a hipótese para aumentar verificabilidade (existe um proxy mais barato?), ou descartá-la do ciclo atual e documentar o motivo.

Se uma hipótese aparentemente importante está em P4, isso é sinal de que a variável independente não está bem definida — não que o tema é irrelevante.

### Regra de saída do diagnóstico

O cliente sai do diagnóstico com:
- **1-2 hipóteses P1** iniciando verificação na Semana 1
- **1-2 hipóteses P2** com plano de instrumentação definido para Semana 2-4
- Hipóteses P3 documentadas em backlog
- Hipóteses P4 descartadas ou reformuladas

---

## Bloco 3 · Plano de verificação 3 ondas

### Onda 1 · Semana 1

**Foco:** hipóteses P1 em execução.

Para cada hipótese P1:
- Ação específica a executar (verbo + objeto + prazo dentro da semana)
- Output esperado ao final da semana (qual dado vai existir que não existe hoje)
- Critério de go/no-go: com esse resultado, avançamos na hipótese ou descartamos?

O critério de go/no-go deve ser definido ANTES de rodar — não depois de ver o resultado. Isso evita o viés de confirmação que transforma qualquer resultado em "prova" da hipótese original.

Exemplo de estrutura para P1:
```
Hipótese: [enunciado completo no formato Se/então/validado por]
Ação semana 1: [o que vai ser feito, por quem, até quando]
Output esperado: [dado concreto que vai existir]
Critério go: [número ou resultado que confirma — ex: "taxa de resposta acima de 15%"]
Critério no-go: [número ou resultado que descarta — ex: "taxa de resposta abaixo de 5%"]
Zona cinza: [o que fazer se o resultado ficar entre os dois critérios]
```

### Onda 2 · Semana 2-4

**Foco:** P2 instrumentado, P1 com primeiros sinais, ajuste de hipótese se necessário.

Na Onda 2, três coisas acontecem em paralelo:

1. **P1 com primeiros sinais:** Revisar os dados da Semana 1. A hipótese se sustenta, foi derrubada, ou precisa ser refinada? Hipótese refinada não é hipótese fracassada — é diagnóstico evoluindo com dado real.

2. **P2 instrumentado:** O setup das hipóteses de alto impacto/baixa verificabilidade deve estar completo. Se não estiver, o diagnóstico registra o bloqueio e o que ele revela: falta de acesso a dado, resistência interna, ou dependência de terceiro.

3. **Ajuste de backlog:** Com os sinais das primeiras semanas, alguma hipótese P3 pode ser promovida a P1 (se revelou impacto maior que esperado), e alguma P1 pode ser arquivada (se os dados derrubaram a premissa).

### Onda 3 · Mês 2+

**Foco:** consolidação, descarte das hipóteses derrubadas, escalonamento das confirmadas.

Na Onda 3, o diagnóstico passa de modo "verificação" para modo "decisão":

- **Hipóteses confirmadas:** qual é o próximo nível de investimento (de tempo, budget, equipe) para escalar o que funcionou?
- **Hipóteses derrubadas:** o que o resultado negativo revelou sobre o negócio? Gera nova hipótese ou encerra esse ângulo?
- **Hipóteses inconclusivas:** o que faltou para verificar? Vale a pena investir na verificação ou o custo/benefício não fecha?

O output do Mês 2+ não é um novo diagnóstico — é um documento de decisão com 3-5 linhas de ação priorizadas, cada uma com hipótese confirmada como base.

---

## Bloco 4 · Anti-padrões na geração de hipóteses

### 1. Hipótese sem variável independente clara

"Se melhorarmos a presença digital, então as vendas vão aumentar."

Qual presença? O que exatamente muda? Quem executa? Em quanto tempo? "Melhorar" não é testável. Reformulação obrigatória: identificar o ângulo específico (frequência de posts? canal novo? formato diferente de conteúdo?) e isolar uma variável de cada vez.

### 2. Hipótese cujo custo de verificação supera o impacto potencial

Se verificar a hipótese requer contratar pesquisa de mercado de R$15k e o impacto máximo possível é aumentar a taxa de conversão em 0,5% numa base pequena — a verificação não se justifica. Descarte ou reformule para usar proxy mais barato.

### 3. Hipótese de "fazer mais do que já está sendo feito" sem mudar variável

"Se postarmos mais frequentemente nas redes sociais, então o alcance vai aumentar."

Isso não é hipótese — é projeção linear de comportamento atual. Hipótese precisa mudar uma variável de forma controlada. Reformulação: "Se migrarmos o formato de posts de texto para vídeo curto de até 60s no mesmo canal, então a taxa de salvamento aumenta, validado por Meta Insights em 3 semanas de teste."

### 4. Hipótese cujo proxy de validação é vaidade

Qualquer hipótese cuja confirmação depende de curtidas, compartilhamentos, impressões, "engajamento geral" ou "awareness" sem proxy de conversão vai para P4 automaticamente. Exceção: se o negócio está em fase pré-receita e o objetivo documentado é construção de audiência com métrica de lead qualificado atrelada.

### 5. Hipótese que depende de comportamento de terceiro fora do controle

"Se o concorrente X parar de fazer Y, então nossa taxa de conversão vai subir."

O que o concorrente faz não é variável controlável. A hipótese precisa ser reformulada para o que A EMPRESA pode fazer em resposta ao comportamento do concorrente.

### 6. Hipótese cuja validação exige consenso interno como pré-requisito

"Se aprovação da diretoria para testar novo canal X for obtida, então podemos verificar se o canal funciona."

A aprovação não é parte da hipótese — é um bloqueio político que precisa ser mapeado separadamente (voltando à Dimensão 6 do briefing). A hipótese deve assumir que a ação é executável e deixar o mapa de stakeholders guiar a estratégia de implementação.

### 7. Hipótese de "diagnóstico do diagnóstico"

"Se fizermos mais pesquisa, então vamos entender melhor o problema."

Isso é procrastinação disfarçada de rigor. O diagnóstico existe para gerar hipóteses testáveis com os dados disponíveis, não para justificar mais rodadas de levantamento sem comprometimento com ação.

---

## Bloco 5 · Exemplo canon de saída (hipótese completa)

O exemplo abaixo mostra como uma hipótese fica formatada no documento final entregue ao cliente. É um caso B2B plausível — empresa de software de gestão com modelo de receita recorrente, problema de churn acima da média do setor.

---

**Hipótese H3 · Canal de ativação**

**Enunciado:**
"Se implementarmos uma sequência de onboarding ativo (3 touchpoints humanos nos primeiros 21 dias após ativação), então a taxa de uso da funcionalidade X — indicador leading de retenção identificado no CRM — aumentará de 23% para acima de 40% no cohort de novos clientes, validado por relatório de adoção extraído do CRM ao final de 30 dias de implementação."

**Classificação:** P1 (Alto impacto + Alta verificabilidade)
- Impacto: ativação é leading indicator de churn, e churn é o problema central do diagnóstico
- Verificabilidade: CRM já tem o dado de uso da funcionalidade X; a sequência de onboarding pode ser executada pelo time de CS existente sem novo contrato ou ferramenta

**Variável independente:** sequência de onboarding ativo (3 touchpoints humanos em 21 dias)
**Variável dependente:** taxa de uso da funcionalidade X no cohort de novos clientes
**Proxy de validação:** relatório de adoção no CRM — campo "funcionalidade X ativada" por data de ativação do cliente
**Janela de verificação:** 30 dias a partir do início da implementação
**Custo de verificação:** zero incremental (usa time de CS existente + CRM já contratado)

**Plano de verificação — Onda 1 (Semana 1):**
- Ação: definir script dos 3 touchpoints, atribuir responsável no CS, ativar para clientes que entrarem a partir de segunda-feira
- Output esperado: 5-10 clientes novos no protocolo, primeiros contatos feitos e registrados no CRM
- Critério go: clientes que completaram os 3 touchpoints mostram taxa de ativação da funcionalidade X acima de 35% em 21 dias
- Critério no-go: taxa abaixo de 25% mesmo com os 3 touchpoints — indica que o problema não é onboarding, é produto
- Zona cinza: entre 25-35% — estender o teste por mais 2 semanas antes de decidir

**Conexão com briefing:**
Esta hipótese deriva diretamente da Dimensão 4 (Histórico): a empresa tentou onboarding automatizado por e-mail em 2023 com resultado nulo. A hipótese testa se o componente humano faz diferença — variável que o teste anterior não isolou.

---

*Após gerar todas as hipóteses no formato acima e posicioná-las na matriz P1-P4, consolide o documento final com: briefing sintetizado (da Fase 1) + hipóteses priorizadas + plano de verificação 3 ondas + próximos passos com dono e prazo.*
