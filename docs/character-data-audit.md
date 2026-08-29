# Auditoria dos dados de criação de personagem

## Resumo

- 7 raças jogáveis confirmadas.
- 9 profissões comuns confirmadas.
- 8 escolas de bruxo.
- 28 escolhas finais de árvore profissional, religiosa ou escolar.
- Aproximadamente 280 habilidades profissionais na estrutura atual da planilha.
- 6 atributos e 53 perícias comuns normalizados.
- 7 perícias comuns com custo de 2 pontos por nível.
- Limite de investimento de 0 a 4 encontrado nas validações da ficha.
- Catálogo oficial do aplicativo mantido como fonte de magias, sinais, rituais e hexes.
- 168 habilidades oficiais com IDs únicos após remoção de uma duplicação de Dádiva da Natureza.
- 280 habilidades profissionais classificadas para a Etapa 9: 23 automáticas, 68 assistidas, 111 lembretes e 78 referências.
- Integração direta com Google Sheets descartada: os dados serão normalizados e versionados no projeto.

## Fontes e responsabilidade

| Domínio | Fonte oficial |
|---|---|
| Magias, sinais, rituais, hexes e seus custos | Aplicativo |
| Estrutura de atributos e perícias | Planilha, após normalização |
| Raças e bônus raciais | Planilha e decisões aprovadas |
| Profissões, especializações e árvores profissionais | Planilha, após normalização |
| Fórmulas de progressão | Regras aprovadas na especificação |
| Equipamentos, inventário e combate | Aplicativo |

## Nomes canônicos e aliases

Os aliases deverão ser aceitos somente durante importações e migrações. Novos dados usarão IDs estáveis e o nome canônico.

| Nome encontrado | Nome canônico | ID sugerido | Observação |
|---|---|---|---|
| Humano | Humano | `human` | Raça jogável |
| Elfo | Elfo | `elf` | Raça jogável |
| Anão | Anão | `dwarf` | Raça jogável |
| Ananico | Ananico | `halfling` | Nome de exibição mantido até decisão editorial |
| Witcher | Witcher | `witcher` | Raça e profissão interna especial |
| Vampiro | Vampiro | `vampire` | Também ativa categoria de combate Vampiro |
| Lobisomen | Lobisomem | `werewolf` | Correção ortográfica |
| Clérigo | Clérigo | `cleric` | Codificação normalizada |
| Artesão | Artesão | `artisan` | Codificação normalizada |
| Arruaceiro | Arruaceiro | `brawler` | Árvore da profissão Criminoso |
| Homem de Armas | Homem de Armas | `man_at_arms` | Árvore da profissão Guerreiro |
| Melitele | Melitele | `melitele` | Caminho da profissão Clérigo |
| Escola da Mantícora | Escola da Mantícora | `manticore_school` | Codificação normalizada |
| Escola da Víbora | Escola da Víbora | `viper_school` | Codificação normalizada |
| Língua da Corte Dourada | Língua da Corte Dourada | `golden_court_tongue` | Codificação normalizada |

O arquivo exportado contém diversos caracteres de substituição. Os textos finais deverão ser obtidos da versão legível da planilha e revisados em UTF-8 antes de entrarem no catálogo.

## Mapeamento de profissão para árvores

### Bardo

- `grey_roads_minstrel` — Menestrel das Estradas Cinzentas
- `battlefield_herald` — Arauto do Campo de Batalha
- `golden_court_tongue` — Língua da Corte Dourada

### Artesão

- `artisan` — Artesão

### Criminoso

- `professional_assassin` — Assassino Profissional
- `professional_thief` — Ladrão Profissional
- `brawler` — Arruaceiro
- `duelist` — Duelista

### Doutor

- `doctor` — Doutor

### Mago

- `mage` — Mago

### Guerreiro

- `man_at_arms` — Homem de Armas
- `swordsman` — Espadachim
- `archer` — Arqueiro
- `vanguard` — Vanguarda

### Mercador

- `merchant` — Mercador

### Clérigo

- `melitele` — Melitele
- `druid` — Druida
- `freya` — Freya
- `eternal_fire` — Fogo Eterno

### Nobre

- `noble` — Nobre

### Witcher

- `wolf_school` — Escola do Lobo
- `griffin_school` — Escola do Grifo
- `viper_school` — Escola da Víbora
- `manticore_school` — Escola da Mantícora
- `bear_school` — Escola do Urso
- `cat_school` — Escola do Gato
- `raven_school` — Escola do Corvo
- `lynx_school` — Escola do Lince

## Inconsistências resolvidas

### Nível inicial

- Regra adotada: nível 1.
- A criação permite escolher outro nível.
- A referência a nível 3 era específica de uma campanha anterior e não fará parte da regra padrão.

### Orçamento de atributos

- Nível 1: 12 pontos.
- Progressão: +1 por nível acima do primeiro.

### Orçamento de perícias

- Nível 1: 60 pontos.
- Progressão: +4 por nível acima do primeiro.
- Perícias comuns e habilidades profissionais compartilham o orçamento.

### Pontos de treino

- Fórmula adotada: `10 + 5 * nível`.
- Uso exclusivo para comprar habilidades do catálogo oficial do aplicativo.

## Catálogo comum normalizado na Etapa 3

| Atributo | Quantidade | Perícias |
|---|---:|---|
| Força | 7 | Bloquear; Brigar; Cajado/Lança; Coragem; Esgrima; Lâminas Curtas; Resistir Coerção |
| Inteligência | 5 | História e Geografia; Investigação; Lançar Feitiços; Natureza; Táticas |
| Destreza | 9 | Abrir Trancas; Acrobacias; Atletismo; Arco e Flecha; Furtividade; Habilidade com Duas Mãos; Prestidigitação; Reflexo/Esquivas; Cavalgar |
| Sabedoria | 21 | Negócios; Armadilhas; Caça; Resistir Magia; Dedução; Educação; Nórdico; Fala Ancestral; Anão; Sabedoria sobre Monstros; Nilfgaardiano; Etiqueta Social; Sabedoria das Ruas; Ensinar; Alquimia; Percepção; Criar; Disfarce; Primeiros Socorros; Criar Armadilhas; Sobrevivência |
| Carisma | 9 | Aparência e Estilo; Belas Artes; Liderança; Ludibriar/Enganar; Persuasão; Percepção Humana; Falsificação; Sedução; Intimidação |
| Constituição | 2 | Físico; Tolerância |

As perícias `Lançar Feitiços`, `Táticas`, `Resistir Magia`, `Sabedoria sobre Monstros`, `Alquimia`, `Criar` e `Criar Armadilhas` custam 2 pontos por nível investido. O marcador `(2)` da planilha foi convertido para o campo numérico `pointCost: 2`, sem permanecer acoplado ao nome exibido.

### Pré-requisitos profissionais

- Nenhuma habilidade exige investimento em outra habilidade da árvore.
- Todas ficam disponíveis desde a escolha da especialização.
- Limite investido: 4.

### Witcher

- A seleção da raça substitui a profissão comum por uma escola de bruxo.
- As magias/sinais de Bruxo são concedidas automaticamente.

## Inconsistências que exigem tratamento técnico

### Raça e categoria de monstro

A ficha atual usa um único campo de raça/categoria para automações de combate. A ficha completa deverá separar:

- `raceId`: Humano, Elfo, Witcher etc.;
- `monsterCategory`: Humanoide, Vampiro, Amaldiçoado etc.

Isso preserva óleos, Sangue Negro e classificações de monstros sem confundir identidade racial com taxonomia de combate.

### Textos das habilidades profissionais

As 280 descrições foram importadas para um catálogo local em UTF-8 e validadas por teste automático contra caracteres de substituição. A planilha permanece apenas como fonte de manutenção; o aplicativo não depende dela durante o uso.

### Fórmulas antigas

As fórmulas da planilha misturam nomes antigos, aliases e referências cruzadas. Elas serão usadas como documentação, não executadas ou traduzidas literalmente. Cada valor derivado terá uma função pura e testes com exemplos conhecidos.

### Linhas provisórias

- Algumas células raciais contêm apenas `Test`.
- Lobisomem aparece sem bônus raciais preenchidos.
- A planilha alterna entre profissão, religião e especialização no mesmo campo.

Esses valores não deverão gerar efeitos automáticos até que exista uma regra aprovada.

## Matriz inicial de acesso às magias

| Categoria oficial | Acesso planejado | Estado |
|---|---|---|
| Bruxo | Concedida automaticamente a Witcher | Confirmado |
| Mago | Aprendizado exclusivo da profissão Mago | Confirmado |
| Druida | Aprendizado exclusivo do caminho Druida | Confirmado |
| Sacerdote | Aprendizado exclusivo de caminhos sacerdotais | Confirmado |
| Clérigo | Alias de Sacerdote; segue as mesmas permissões | Confirmado |
| Ritual | Qualquer classe mágica | Confirmado |
| Hex | Qualquer classe mágica | Confirmado |
| Regras | Somente referência | Inferido do catálogo atual |

## Pendências antes da implementação dos dados completos

As pendências abaixo não bloqueiam a criação do modelo versionado, mas bloqueiam a conclusão das respectivas telas ou automações.

1. Informar os bônus raciais de Lobisomem, ausentes na fonte e ainda em desenvolvimento.
2. Concluir a revisão dos bônus de Vampiro, também em desenvolvimento.
3. Definir quais caminhos recebem as habilidades oficiais `Sacerdote` e `Clérigo`:
   - Melitele;
   - Druida;
   - Freya;
   - Fogo Eterno.
4. Revisar ambiguidades de regra individualmente antes de automatizar cada habilidade profissional; a descrição de referência já está disponível no aplicativo.

## Decisões adicionais consolidadas

- Todos os atributos começam em 10 e recebem o orçamento distribuível por cima desse valor.
- Não existe limite máximo de atributo definido.
- Perícias `(2)` custam dois pontos por nível investido.
- Não existe nível máximo de personagem definido; apenas o mínimo 1.
- O nome oficial exibido é `Ananico`.
- Sacerdote e Clérigo representam a mesma classe para permissões de habilidades.
- Vampiro e Lobisomem permanecem no catálogo como opções em desenvolvimento; regras ausentes não serão inventadas.
- Um 20 natural recebe a classificação `Crítico`, concede +1 Dado da Sorte e, quando ocorrer em combate, +1 Adrenalina.
- A classificação e as recompensas do crítico ficam separadas do cálculo de dano; nenhuma multiplicação ou aplicação automática de dano foi definida nesta etapa.
- Anão e Ananico não podem selecionar as profissões Mago ou Clérigo.
- Bônus raciais ocupam uma camada própria e nunca aumentam o gasto de pontos investidos.
- O bônus derivado do atributo concede +1 a cada dois pontos completos acima de 10 e é somado às perícias vinculadas.
- A criação deverá distribuir habilidades profissionais antes das perícias gerais. Habilidades profissionais usam somente o nível investido; bônus de atributo e bônus concedidos pela árvore aparecem nas perícias gerais.
- Bônus provisórios de Vampiro e Lobisomem não serão automatizados enquanto as regras estiverem em desenvolvimento.

## Política de importação

1. Extrair nomes e descrições da fonte.
2. Corrigir UTF-8 e ortografia sem alterar a regra.
3. Atribuir ID estável.
4. Associar profissão, especialização e atributo.
5. Registrar escala dos níveis 0–4.
6. Classificar a automação como automática, assistida, lembrete ou referência.
7. Vincular bônus numéricos a IDs de perícias, nunca a texto visível.
8. Validar referências contra o catálogo oficial do aplicativo.
9. Rejeitar aliases não mapeados e gerar relatório.
10. Executar testes de orçamento, aplicação, remoção e persistência.

## Entregas aprovadas para as próximas etapas

### Etapa 1 — fundação

- [x] esquema versionado da ficha completa;
- [x] migração segura das fichas atuais para modo rápido;
- [x] funções puras de orçamento;
- [x] separação entre raça e categoria de combate;
- [x] testes de migração e persistência.

### Etapa 2 — assistente

- [x] escolha entre ficha rápida e completa;
- [x] estrutura navegável do assistente;
- [x] salvamento e retomada de rascunho;
- [x] revisão e inclusão opcional no combate;
- [x] opção de salvar, salvar e adicionar ao combate ou usar somente na sessão;
- [x] catálogo normalizado de profissões, especializações e escolas de bruxo;
- [x] regra-base testável para classificação e recompensas do 20 natural.

### Etapas posteriores

- [x] atributos e perícias comuns;
- [x] raças e bônus raciais;
- [x] catálogo, distribuição e persistência das habilidades profissionais;
- [x] descrições profissionais completas em UTF-8;
- [x] aprendizado de magias com pontos de treino e permissões por caminho;
- [x] concessão automática das habilidades de Bruxo para Witcher;
- [x] automações profissionais em lotes: 23 automáticas, 68 assistidas, 111 lembretes contextuais e 78 referências concluídas;
- progressão avançada;
- [x] assistente de testes;
- [x] painéis no combate;
- [x] HP, EST, carga e movimento derivados;
- [x] peso de arma ativa, reservas, armaduras e escudo integrado ao movimento;
- [x] Fonte Mágica, Fonte Rúnica e Sobrecarga Arcana aplicadas aos recursos corretos;
- [x] concluir os lembretes contextuais e a validação integral da Etapa 9;
- [x] atualizar fichas salvas, modelos prontos e documentação na Etapa 10;
- [x] criar backup local único antes da consolidação e validar a idempotência da migração;
- [x] validar seis modelos prontos contra os orçamentos e restrições oficiais do aplicativo.
