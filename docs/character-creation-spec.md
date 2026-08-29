# Especificação da ficha completa e progressão

## Estado do documento

- Etapa de especificação: **0 — consolidação das regras**.
- Implementação: **Etapa 9 — automações profissionais em lotes concluída**.
- Estado: atributos, perícias, 28 árvores profissionais, aprendizado de magias, testes, valores derivados e os quatro lotes profissionais estão normalizados, persistidos e validados. A próxima fase é a Etapa 10.
- Fonte estrutural: planilha `Witcher Sheet Original`.
- Fonte oficial de magias, sinais, rituais e hexes: catálogo de habilidades do aplicativo.
- Dependência em tempo de execução: nenhuma. A aplicação não dependerá da planilha para funcionar.

## Objetivo

Adicionar uma ficha completa opcional sem remover ou alterar o comportamento da ficha rápida. A criação completa deverá reunir raça, profissão, especialização, atributos, perícias, habilidades profissionais, progressão, recursos derivados, inventário, magias e equipamentos em um modelo persistente e compatível com o combate atual.

## Modos de criação

Ao selecionar **Nova ficha**, o usuário deverá escolher entre:

1. **Criação rápida**: mantém o fluxo atual, adequado para participantes criados diretamente para o combate.
2. **Criação completa**: abre um assistente dividido em etapas e aplica as regras deste documento.

No encerramento da criação completa, devem existir três ações explícitas:

- **Salvar ficha**;
- **Salvar ficha e adicionar ao combate**.
- **Adicionar somente ao combate**, sem criar uma ficha salva.

Ao escolher adicionar somente ao combate, o aplicativo deverá explicar que os dados não serão mantidos como modelo reutilizável depois que o participante for removido. Enquanto permanecer no combate, o personagem completo continuará sendo persistido junto à sessão normalmente.

## Regras confirmadas

### Nível

- O nível inicial padrão é **1**.
- O nível poderá ser escolhido durante a criação.
- Não há nível máximo definido. A interface deverá aceitar qualquer número inteiro igual ou superior a 1.
- Os orçamentos serão calculados a partir do nível selecionado.
- Não haverá progressão retroativa duplicada: alterar o nível recalcula o orçamento total, sem adicionar pontos diretamente aos campos já preenchidos.

### Atributos

- Cada atributo começa com valor base **10**.
- No nível 1, o personagem possui **12 pontos de atributo para distribuir**.
- Cada nível acima do primeiro concede **1 ponto adicional**.
- Não há limite máximo definido para o valor base de um atributo.
- Bônus não consomem o orçamento distribuível.
- Fórmula do orçamento:

```text
pontosDeAtributo = 12 + (nível - 1)
```

Exemplos:

| Nível | Pontos de atributo |
|---:|---:|
| 1 | 12 |
| 2 | 13 |
| 3 | 14 |
| 5 | 16 |

### Perícias comuns e habilidades profissionais

- No nível 1, o personagem possui **60 pontos de perícia**.
- Cada nível acima do primeiro concede **4 pontos adicionais**.
- Perícias comuns e habilidades profissionais consomem o **mesmo orçamento**.
- Pontos de treino não são usados em perícias ou habilidades profissionais.
- Cada perícia ou habilidade profissional pode receber de **0 a 4 pontos investidos**.
- Perícias identificadas com `(2)` consomem **2 pontos do orçamento por nível investido**.
- Bônus raciais, profissionais, de equipamento ou temporários podem elevar o total acima de 4.
- Não existem pré-requisitos entre habilidades profissionais: qualquer habilidade da árvore selecionada pode receber pontos diretamente.
- Fórmula do orçamento:

```text
pontosDePericia = 60 + 4 * (nível - 1)
```

Exemplos:

| Nível | Pontos de perícia |
|---:|---:|
| 1 | 60 |
| 2 | 64 |
| 3 | 68 |
| 5 | 76 |

### Pontos de treino e aprendizado de magias

- Pontos de treino são exclusivos para aprender magias e habilidades do catálogo oficial do aplicativo.
- O personagem recebe **10 pontos base mais 5 pontos por nível**.
- Fórmula:

```text
pontosDeTreino = 10 + 5 * nível
```

Exemplos:

| Nível | Pontos de treino |
|---:|---:|
| 1 | 15 |
| 2 | 20 |
| 3 | 25 |
| 5 | 35 |

- O custo de aprendizado será obtido do campo `unlockCost` da habilidade oficial.
- Pontos gastos e restantes deverão ser mostrados separadamente.
- Uma habilidade já aprendida não poderá consumir pontos novamente.

### Testes de perícia

- Fórmula padrão:

```text
resultado = 1d20 + totalDaPericia + modificadoresDoTeste
```

- O resultado deverá ser comparado com:
  - uma dificuldade definida pelo mestre; ou
  - o resultado do oponente.
- O padrão de uso continua sendo a rolagem com dados físicos e a informação manual do resultado.
- A rolagem automática poderá ser oferecida como alternativa, respeitando as preferências persistentes do aplicativo.
- Um resultado natural **20** recebe a classificação especial **Crítico** no histórico.
- Todo crítico concede **+1 Dado da Sorte** ao personagem que realizou o teste.
- Quando o crítico ocorrer em combate, também concede **+1 ponto de Adrenalina**.
- O crítico não aplicará dano automaticamente nesta etapa; a resolução de dano continua usando os controles de combate existentes.
- O histórico deverá registrar participante, perícia, dado informado ou rolado, bônus total, modificadores, resultado final, oposição ou dificuldade e resultado do confronto.

## Raças jogáveis

O catálogo inicial deverá conter:

| ID estável | Nome exibido | Categoria de combate sugerida |
|---|---|---|
| `human` | Humano | Humanoide |
| `elf` | Elfo | Humanoide |
| `dwarf` | Anão | Humanoide |
| `halfling` | Ananico | Humanoide |
| `witcher` | Witcher | Humanoide |
| `vampire` | Vampiro | Vampiro |
| `werewolf` | Lobisomem | Amaldiçoado |

`raceId` e `monsterCategory` serão campos separados. A raça representa a construção do personagem; a categoria de combate continua alimentando óleos, Sangue Negro, condições raciais e outras automações.

### Regra especial de Witcher

- Witcher é uma raça jogável especial.
- Ao escolher Witcher, a profissão interna será definida como `witcher`.
- Sua especialização obrigatória será uma escola de bruxo.
- Não será exibida uma segunda seleção de profissão comum.
- As habilidades do catálogo oficial cuja profissão seja `Bruxo` serão concedidas automaticamente.

### Restrições raciais de profissão

- Anão não pode escolher Mago nem Clérigo.
- Ananico não pode escolher Mago nem Clérigo.
- As opções indisponíveis não aparecem no seletor de profissão.
- Rascunhos ou fichas importadas com uma combinação inválida têm profissão e especialização incompatíveis removidas, preservando os demais dados.
- Witcher continua usando exclusivamente uma escola de bruxo no lugar de profissão comum.

## Profissões e especializações normalizadas

Para personagens que não sejam Witcher, a profissão determina as especializações disponíveis.

| Profissão | Especializações/árvores disponíveis |
|---|---|
| Bardo | Menestrel das Estradas Cinzentas; Arauto do Campo de Batalha; Língua da Corte Dourada |
| Artesão | Artesão |
| Criminoso | Assassino Profissional; Ladrão Profissional; Arruaceiro; Duelista |
| Doutor | Doutor |
| Mago | Mago |
| Guerreiro | Homem de Armas; Espadachim; Arqueiro; Vanguarda |
| Mercador | Mercador |
| Clérigo | Melitele; Druida; Freya; Fogo Eterno |
| Nobre | Nobre |

Cada escolha aponta para uma árvore de dez habilidades profissionais encontrada na fonte. A árvore escolhida é exibida por completo; todas as habilidades começam em nível 0 e aceitam investimento independente até o nível 4.

### Escolas de bruxo

- Escola do Lobo
- Escola do Grifo
- Escola da Víbora
- Escola da Mantícora
- Escola do Urso
- Escola do Gato
- Escola do Corvo
- Escola do Lince

## Acesso às habilidades oficiais

O catálogo do aplicativo continuará sendo a única fonte para nome, descrição, custo e comportamento das magias.

### Concessão automática

- Personagens Witcher recebem automaticamente todas as habilidades oficiais da profissão `Bruxo`.

### Aprendizado com pontos de treino

- `Mago`: exclusivo da profissão Mago.
- `Druida`: exclusivo do caminho Druida.
- `Sacerdote` e `Clérigo`: categorias equivalentes, exclusivas dos caminhos sacerdotais.
- `Ritual`: disponível para qualquer classe considerada mágica.
- `Hex`: disponível para qualquer classe considerada mágica.
- `Regras`: conteúdo de referência; não é comprado nem concedido como magia.

O filtro de permissão deve controlar o que pode ser aprendido, sem remover habilidades que o personagem já possua por migração ou conteúdo personalizado.

## Composição de atributos e perícias

Valores investidos nunca deverão ser sobrescritos por bônus. O total será calculado em camadas:

O bônus derivado de um atributo é calculado a partir do valor total acima da base 10. Cada dois pontos completos concedem +1:

```text
bonusDoAtributo = piso(maximo(0, valorTotalDoAtributo - 10) / 2)
```

| Valor total | Bônus do atributo |
| ---: | ---: |
| 10 | +0 |
| 11 | +0 |
| 12 | +1 |
| 14 | +2 |

Esse bônus é derivado em tempo real e não consome pontos nem é salvo como ajuste manual. As perícias recebem automaticamente o bônus do atributo ao qual estão vinculadas.

```text
total = investido
      + modificadorDoAtributo
      + bonusRacial
      + bonusProfissional
      + bonusDeEspecializacao
      + bonusDeEquipamento
      + bonusTemporario
      + ajusteManual
```

Cada camada deverá possuir origem identificável. Ao trocar uma escolha, somente as camadas derivadas daquela escolha serão recalculadas.

Exemplo:

```text
Arco e Flecha
Investido: 4
Atributo: +2
Raça Elfo: +2
Equipamento: +1
Total: 9
```

## Modelo persistente proposto

As fichas receberão versão própria e manterão compatibilidade com o modelo rápido.

```text
characterSheet
├── schemaVersion
├── creationMode: quick | full
├── rulesVersion
├── identity
│   ├── name
│   ├── level
│   ├── raceId
│   ├── professionId
│   └── specializationId
├── attributes
│   └── <id>: invested | manualAdjustment
├── skills
│   └── <id>: invested | manualAdjustment
├── professionalSkills
│   └── <id>: invested | manualAdjustment
├── progression
│   ├── attributePoints
│   ├── skillPoints
│   └── trainingPoints
├── traits
├── resources
├── inventory
├── abilities
├── equipment
└── automationState
```

Totais e valores derivados deverão ser recalculados, não gravados como única fonte de verdade. Valores atuais de HP e ST permanecem persistentes para continuar compatíveis com o combate.

## Assistente de criação completa

Ordem prevista:

1. modo de criação;
2. identidade e nível;
3. raça;
4. profissão ou escola de bruxo;
5. especialização;
6. atributos;
7. habilidades profissionais da profissão ou subclasse;
8. perícias comuns;
9. aprendizado de magias — implementado;
10. valores derivados — implementado;
11. revisão;
12. salvamento e inclusão opcional no combate.

O assistente deverá:

- mostrar pontos disponíveis em todas as etapas;
- mostrar, antes do investimento, o bônus já aplicado a cada perícia e suas origens;
- impedir gasto acima do orçamento;
- avisar quando restarem pontos sem distribuir, sem obrigar o consumo;
- preservar o progresso ao voltar para uma etapa anterior;
- recalcular opções dependentes ao trocar raça, profissão, especialização ou nível;
- pedir confirmação antes de remover escolhas incompatíveis já preenchidas.

## Apresentação no combate

Personagens de ficha completa receberão um painel recolhível de perícias abaixo do card principal.

- Recolhido por padrão.
- Exibe somente perícias cujo total seja diferente de zero.
- Exibe o total pronto para uso.
- Permite consultar a composição do bônus.
- Permite iniciar um teste manual ou automático.
- Mantém habilidades profissionais em painel próprio para não misturar perícia comum com regra de classe.

## Política de automação profissional

Cada habilidade profissional deverá declarar um modo:

| Modo | Comportamento |
|---|---|
| `automatic` | O aplicativo executa o efeito quando o gatilho é inequívoco. |
| `assisted` | O aplicativo solicita alvo, resultado, gasto ou confirmação. |
| `reminder` | O aplicativo apresenta um lembrete contextual e registra a decisão. |
| `reference` | A regra fica disponível para consulta, sem interferência automática. |

Na primeira entrega das subclasses, habilidades complexas poderão começar como `reminder` ou `reference`. Bônus numéricos estáticos deverão funcionar automaticamente desde a inclusão da respectiva árvore.

## Compatibilidade e migração

- Fichas existentes serão tratadas como `creationMode: quick`.
- Nenhuma ficha rápida receberá atributos ou perícias inventados durante a migração.
- Inventário, magias, equipamento, HP atual, ST atual e defesas adicionais serão preservados.
- Fichas rápidas poderão ser convertidas posteriormente por uma ação explícita.
- A migração deverá ser idempotente: abrir o aplicativo mais de uma vez não poderá duplicar bônus, habilidades ou pontos.

### Implementado na Etapa 1

- Versão inicial do esquema: `schemaVersion: 1`.
- Versão inicial das regras: `rulesVersion: 1`.
- Migração automática e idempotente das fichas antigas.
- Preservação dos recursos e coleções já existentes.
- Separação de `raceId` e `monsterCategory`.
- Funções puras para nível, orçamentos e custo de perícias `(2)`.
- Estrutura persistente inicial para futuras fichas completas.
- Inclusão do modelo no cache offline do aplicativo.

### Implementado na Etapa 2

- Escolha explícita entre criação rápida e criação completa.
- Assistente responsivo de identidade, raça, profissão/escola e revisão.
- Catálogo normalizado de profissões, especializações e escolas de bruxo.
- Rascunho persistente com retomada, salvamento manual e descarte confirmado.
- Três destinos ao finalizar: salvar, salvar e adicionar ao combate ou usar somente no combate atual.
- Regra-base do 20 natural: classificação `Crítico`, +1 Dado da Sorte e +1 Adrenalina quando o teste ocorrer em combate.
- Separação entre a recompensa do crítico e qualquer futura automação de dano.

### Implementado na Etapa 3

- Catálogo normalizado de 6 atributos e 53 perícias comuns, extraído da estrutura da planilha.
- Identificação explícita das 7 perícias que custam 2 pontos por nível.
- Distribuição de atributos sobre o valor base 10, sem limite máximo artificial.
- Distribuição de perícias com limite de investimento entre 0 e 4.
- Orçamento de perícias preparado para ser compartilhado com as habilidades profissionais.
- Bloqueio de aumentos que ultrapassariam o saldo disponível.
- Permissão para concluir a ficha com pontos ainda não utilizados.
- Perícias filtradas por atributo para reduzir poluição visual no mobile.
- Resumo dos atributos, perícias investidas e saldos na revisão final e na lista de fichas.
- Persistência das alocações na ficha salva e no participante adicionado ao combate.

### Implementado na Etapa 4

- Catálogo racial detalhado para Humano, Elfo, Anão, Ananico e Witcher.
- Bônus raciais de atributos e perícias aplicados em `raceBonus`, sem alterar `invested`.
- Remoção automática apenas da camada racial anterior ao trocar de raça.
- Características raciais persistidas separadamente para consulta e futuras automações.
- Restrição de Mago e Clérigo para Anão e Ananico em interface, validação e normalização de dados.
- Detalhes raciais visíveis durante a escolha e na revisão da ficha.
- Vampiro e Lobisomem preservados como opções em desenvolvimento, sem bônus automáticos provisórios.
- Efeitos estruturados como absorção natural, carga adicional, imunidades e usos por sessão preparados para integração futura, sem alterar prematuramente o cálculo de dano.

### Implementado na Etapa 5 — parte 1

- Catálogo local em UTF-8 com 28 árvores e 10 habilidades profissionais por árvore.
- Etapa de habilidades profissionais posicionada antes das perícias gerais.
- Limite de 4 pontos investidos por habilidade profissional.
- Saldo único de pontos entre habilidades profissionais e perícias gerais.
- Exibição do nível investido sem somar o bônus de atributo à habilidade profissional.
- Persistência das escolhas no rascunho, na ficha salva e no participante de combate.
- Migração dos rascunhos anteriores para a sequência que introduziu habilidades profissionais.
- Infraestrutura de bônus profissionais aplicada às perícias gerais por IDs estáveis.
- Primeiro lote de relações numéricas validado, incluindo Treinamento de Bruxo, Trama Encantada e bônus diretos de perícias específicas.
- As 280 descrições foram extraídas da planilha, normalizadas em UTF-8 e exibidas integralmente nos cards profissionais.
- O atributo indicado na fonte permanece apenas como metadado; seu modificador é aplicado somente às perícias gerais.

### Implementado na Etapa 6

- Nova etapa responsiva de aprendizado de magias antes da revisão final.
- Catálogo oficial do aplicativo mantido como fonte única, com 168 IDs exclusivos após remoção de uma duplicação de `Dádiva da Natureza`.
- Busca por nome, elemento ou efeito e filtro pelas categorias permitidas para reduzir a poluição visual.
- Mago pode aprender habilidades de Mago, Ritual e Hex.
- Druida pode aprender habilidades de Druida, Ritual e Hex.
- Caminhos sacerdotais podem aprender Sacerdote/Clérigo, Ritual e Hex.
- Witcher recebe automaticamente as nove habilidades oficiais de Bruxo, sem gastar pontos de treino.
- Profissões não mágicas preservam seus pontos de treino para progressão futura sem exibir opções incompatíveis.
- Custo obtido de `unlockCost`, cobrança única por ID e bloqueio de compras acima do orçamento.
- Persistência separada dos IDs aprendidos e das habilidades completas usadas pelas abas e pelo combate.
- Migração dos rascunhos anteriores para o novo fluxo de oito etapas.

### Implementado na Etapa 7

- Painel recolhível de perícias gerais abaixo do card dos personagens de ficha completa.
- Exibição exclusiva das perícias cujo total calculado seja diferente de zero.
- Total pronto para uso, atributo vinculado e composição do bônus disponíveis no próprio fluxo do teste.
- Painel separado e recolhível para habilidades profissionais investidas, com nível e descrição completa.
- Assistente de testes com `1d20 + total da perícia + modificador`.
- Comparação com dificuldade definida pelo mestre ou resultado informado do oponente.
- Rolagem manual por padrão e automática opcional por preferência persistente.
- Resultado de empate tratado como sucesso por alcançar a dificuldade ou oposição informada.
- Registro detalhado no histórico com dado, bônus, modificador, resultado final, alvo da comparação, margem e desfecho.
- Classificação especial do 20 natural como Crítico, concedendo +1 Dado da Sorte e +1 Adrenalina em combate.
- Sorte e Adrenalina persistidas na progressão da ficha e exibidas no cabeçalho do painel de perícias.
- Correção da revisão final para não listar perícias realmente zeradas.

### Implementado na Etapa 8

- Etapa responsiva de valores derivados inserida antes da revisão final, totalizando nove passos.
- HP máximo calculado por `(bônus CON + Físico total) × nível + 10 + pontos investidos em CON`.
- EST máximo calculado por caminho: Witcher, Mago, Clérigo/Druida ou reserva física dos caminhos não mágicos.
- Fonte Mágica da Escola do Lobo acrescenta `+2 EST` por nível investido.
- Sobrecarga Arcana acrescenta `+10 EST` por nível investido.
- Fonte Rúnica da Escola do Grifo gera uma reserva separada de `+2` por nível, visível no card de combate, priorizada no custo dos Sinais e regenerada junto do EST.
- Carga calculada por `Força total ÷ 2 + Físico total + bônus de Força`, incluindo o bônus racial `+25` do Anão.
- Movimento calculado entre 5 e 15, descontando o peso dos equipamentos efetivamente usados.
- Arma ativa, duas reservas, armaduras e escudo contam no peso; itens apenas guardados no inventário não contam.
- Pesos oficiais importados da aba `Items`; itens especiais cujo campo de peso está vazio recebem uma estimativa consistente por classe e número de mãos.
- Recalcular máximos preserva HP, EST e Fonte Rúnica atuais, limitando-os somente quando excederem o novo máximo.
- Resumo compacto de peso, capacidade e movimento adicionado ao painel de equipamentos.
- Migração dos rascunhos anteriores preserva a posição da revisão após a inclusão da nova etapa.

### Etapa 9 — automações profissionais em lotes

- **Lote 1 — automático:** bônus permanentes em perícias gerais, limites de recursos e redução de custo de Magia Expandida.
- **Lote 2 — assistido (concluído):** habilidades que exigem teste, CD, alvo, gasto ou escolha do mestre recebem um assistente comum de resolução.
- **Lote 3 — lembretes (concluído):** gatilhos de turno, dano, condição, eliminação, descanso e uso limitado aparecem como etiquetas contextuais, sem pop-ups intrusivos.
- **Lote 4 — referência (concluído):** regras narrativas ou dependentes de subsistemas ainda não existentes permanecem consultáveis e recebem identificação explícita.
- Todas as 280 habilidades possuem classificação explícita e um lote definido.
- Somente habilidades com implementação efetiva recebem o selo `AUTOMÁTICO` na criação e no card de combate.
- O Lote 1 também conecta Treinamento Mágico a Lançar Feitiços, Resistir Magia e Alquimia; Durão como Aço a Físico e Tolerância; e Magia Expandida à redução já usada pelo catálogo de habilidades.
- As 68 habilidades do Lote 2 oferecem `Realizar teste` no card profissional, usando `1d20 + nível profissional + modificador` contra CD ou oposição.
- A rolagem respeita a preferência manual/automática dos testes de perícia, registra a descrição da regra nos detalhes e mantém as recompensas de 20 natural.
- Consequências que dependem de alvo, duração, escolha ou interpretação continuam sob decisão do mestre após o resultado, sem aplicação automática indevida.
- As 111 habilidades do Lote 3 possuem contextos classificados; PV baixo, poção ativa, envenenamento e turno ativo recebem destaque visual quando detectados.
- As 78 habilidades do Lote 4 recebem o selo `REFERÊNCIA` e preservam a descrição integral, sem simular uma automação inexistente.

### Etapa 10 — consolidação (concluída)

- [x] Atualizar a apresentação das fichas salvas com caminho, nível, versão das regras, recursos, movimento, carga e orçamentos.
- [x] Criar uma cópia local única das fichas existentes antes da primeira normalização da Etapa 10.
- [x] Preservar HP, EST, Fonte Rúnica, coleções, equipamentos e demais dados durante a migração idempotente.
- [x] Criar seis modelos prontos de nível 1: Escola do Lobo, Mago, Vanguarda, Assassino, Melitele e Arqueiro.
- [x] Validar atributos, perícias compartilhadas, treino, raça, profissão, especialização e magias de cada modelo.
- [x] Abrir modelos como rascunhos independentes e inteiramente editáveis no assistente completo.
- [x] Integrar o seletor de modelos ao mesmo modal usado pelo botão do pad e por `Fichas → Nova ficha`.
- [x] Consolidar README, documentação de regras, migrações, recursos offline e instruções de uso.

## Critérios de aceite para a implementação futura

1. Selecionar nível 1 gera 12 pontos de atributo, 60 de perícia e 15 de treino.
2. Selecionar nível 3 gera 14 pontos de atributo, 68 de perícia e 25 de treino.
3. Perícias comuns e profissionais debitam o mesmo saldo.
4. Nenhum valor investido ultrapassa 4.
5. Bônus podem elevar o total acima de 4.
6. Trocar raça remove apenas os bônus da raça anterior.
7. Trocar especialização remove apenas suas habilidades e bônus derivados, mediante confirmação quando houver pontos investidos.
8. Witcher exige uma escola e recebe as habilidades oficiais de Bruxo.
9. Magias aprendidas debitam `unlockCost` dos pontos de treino.
10. Testes usam `1d20 + total + modificadores` e aceitam dificuldade ou oposição.
11. A ficha salva mantém todos os dados após recarregar o aplicativo.
12. Fichas rápidas existentes continuam funcionando sem alterações visíveis.
13. A criação completa permite adicionar o personagem somente ao combate, sem obrigar o salvamento na lista de fichas.
14. Habilidades profissionais são distribuídas antes das perícias comuns, para que seus bônus derivados já apareçam na etapa seguinte.
