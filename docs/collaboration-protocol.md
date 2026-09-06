# Contrato de colaboração e sincronização

Status: Etapas 0 a 8 concluídas — contrato, sala, combate em tempo real,
aprovações, fila offline, resolução de conflitos e experiência do Jogador.

Este documento define a fronteira entre o aplicativo offline e a sala em tempo
real. Alterações de jogadores utilizam **comandos pequenos, identificáveis e
idempotentes**; o servidor valida, ordena, persiste e devolve eventos
autorizados. Durante a transição dos módulos legados, o Mestre também publica
snapshots versionados e projetados conforme o papel de cada destinatário.

## Princípios obrigatórios

1. O modo offline continua sendo o comportamento padrão e não depende de conta.
2. O servidor é a autoridade de uma sala online.
3. Nenhuma permissão depende apenas de esconder controles na interface.
4. Todo comando possui ID único, autor, dispositivo, campanha e versão-base.
5. Reenvios do mesmo comando nunca aplicam o efeito duas vezes.
6. Alterações incompatíveis nunca substituem dados silenciosamente.
7. Dados exclusivos do mestre não fazem parte da projeção enviada ao jogador.
8. Mudanças permanentes solicitadas por jogadores aguardam aprovação.
9. O histórico registra autor, alvo, resultado, versão e decisão do mestre.
10. A PWA mantém snapshot e fila local para continuar utilizável sem internet.

## Papéis

| Papel | Escopo |
| --- | --- |
| `master` | Autoridade completa da campanha e da sala |
| `player` | Leitura da visão compartilhada e controle da ficha vinculada |
| `spectator` | Somente leitura; reservado para uma etapa futura |

O modo `offline` é um estado de conexão, não um papel. Em uma campanha local, o
dispositivo atua como mestre solo.

## Envelope da campanha

```text
CampaignEnvelope
  schemaVersion
  id
  revision
  createdAt / updatedAt
  metadata
    name
    createdBy
  state
    combat
    characterSheets
    campaignClock
    history
    encounters
    contentLibrary
    reports
    compatibility
  entityVersions
```

`compatibility` guarda temporariamente os valores das chaves antigas do
`localStorage`. Ele permite migrar o aplicativo gradualmente sem interromper os
módulos existentes. Preferências visuais do dispositivo não pertencem à
campanha e não são sincronizadas.

## Envelope de comando

```text
Command
  protocolVersion
  id
  campaignId
  actorId
  deviceId
  role
  type
  targetId
  entityKey
  baseVersion
  payload
  createdAt
```

O `id` é a chave de idempotência. `baseVersion` informa qual versão da entidade
o autor conhecia. `entityKey` identifica a unidade de conflito, como
`combatant:geralt`, `sheet:ciri` ou `equipment:geralt:activeWeapon`.

## Comandos imediatos

- `combat.turn.advance`, `combat.target.set`, `combat.damage.apply`,
  `combat.healing.apply` e `combat.condition.change`: mestre.
- `participant.resource.adjust`: mestre ou jogador sobre a própria ficha.
- `roll.publish`: mestre ou jogador sobre a própria ficha.
- `combat.message.publish`: mestre ou jogador autenticado.
- `campaign.clock.advance`, `campaign.event.change` e
  `campaign.preferences.change`: mestre.

Seleção visual local não é sincronizada. Um jogador pode consultar qualquer
participante permitido sem substituir o alvo ativo definido pelo mestre.

## Mudanças permanentes e aprovação

Os comandos abaixo são aplicados imediatamente quando enviados pelo mestre. Se
partirem de um jogador, tornam-se propostas com estado `pending`:

- `sheet.update`;
- `sheet.level-up`;
- `inventory.change`;
- `equipment.change`;
- `spell.learn`;
- `transfer.item`;
- `transfer.crowns`.

O mestre pode aprovar, rejeitar ou devolver uma proposta com observação. A
decisão gera um evento próprio e não altera o comando original.

## Conflitos

| Classe | Comportamento |
| --- | --- |
| Duplicado | Ignorar o reenvio e confirmar o resultado já conhecido |
| Limpo | Aplicar porque a versão-base ainda é atual |
| Mesclável | Aplicar como delta ou acréscimo idempotente |
| Decisão do mestre | Preservar as duas versões e abrir resolução |

Mensagens, rolagens e ajustes numéricos em delta são mescláveis. Troca de slot,
substituição de ficha, turno, alvo e transferências são exclusivos. Mesmo um
comando do mestre que sobrescreva uma versão divergente precisa gerar auditoria.

## Eventos do servidor

- `room.snapshot`: snapshot autorizado inicial;
- `room.presence`: entrada, saída ou reconexão;
- `command.accepted`: comando confirmado e sua nova revisão;
- `command.rejected`: validação ou permissão recusada;
- `proposal.created`, `proposal.resolved`: fluxo de aprovação;
- `conflict.created`, `conflict.resolved`: decisão do mestre;
- `room.revoked`, `room.closed`: acesso removido ou sala encerrada.

Cada evento aceito recebe uma sequência crescente da sala. Na reconexão, o
cliente informa a última sequência confirmada e recebe os eventos ausentes ou
um snapshot novo quando o intervalo não estiver mais disponível.

O cliente ignora sequências antigas, elimina snapshots repetidos e agrupa
atualizações recebidas no mesmo quadro de renderização. O Worker confirma a
publicação ao Mestre sem devolver a ele o próprio snapshot; somente os outros
dispositivos recebem essa atualização.

## Segurança da sala experimental

- HTTPS/WSS obrigatório;
- senha derivada e salgada no servidor, nunca armazenada em texto aberto;
- ticket WebSocket curto e de uso único;
- token individual e revogável por dispositivo;
- tentativas de entrada limitadas;
- validação de papel, propriedade e versão no servidor;
- projeção de dados antes do envio;
- encerramento e revogação auditáveis.

## Implementação da Etapa 3

A primeira implementação de transporte está em `cloudflare/src/worker.mjs` e
utiliza um Durable Object SQLite por código de sala. O cliente fica em
`js/collaboration/realtime-client.js`.

- criação e entrada por código e senha;
- senha derivada com PBKDF2 e sal exclusivo;
- token individual por dispositivo;
- ticket WebSocket curto e descartável;
- WebSocket hibernável para reduzir o tempo ativo do Worker;
- snapshot projetado conforme o papel do participante;
- presença, sequência crescente e reconexão automática;
- publicação automática da campanha pelo Mestre;
- ajuste remoto de Adrenalina e Dado da Sorte pelo próprio Jogador.

## Implementação das Etapas 4 e 5

- sincronização de turno, alvo, HP, EST, condições, recursos e histórico pelo
  estado versionado da campanha;
- rolagens e mensagens como atividades acrescentadas à sala;
- propostas permanentes de ficha, evolução, inventário, equipamentos, magias e
  transferências;
- fila do Mestre com ações de aprovar, ajustar ou rejeitar;
- decisão persistida e visível aos participantes autorizados;
- atualização agrupada e deduplicada para evitar reconstruções repetidas da
  interface.

## Implementação da Etapa 6

- fila persistente `pending-commands` em IndexedDB, com fallback local;
- reconexão automática e solicitação de snapshot atual;
- reenvio idempotente pela mesma identificação de comando;
- remoção da fila somente após confirmação ou rejeição definitiva do servidor;
- controle de versão por `entityKey`;
- preservação da versão atual e da recebida quando existir divergência;
- painel de resolução de conflitos exclusivo do Mestre;
- restauração do estado autorizado antes de reenviar alterações pendentes.

## Implementação da Etapa 7

- diretório público mantido por um Durable Object separado da campanha;
- listagem limitada a código, nome e contadores operacionais da sala;
- opção de sala privada acessível somente por código;
- presença obrigatória do Mestre para uma sala permanecer no diretório público;
- heartbeat periódico do Durable Object e limpeza automática de registros sem atividade;
- janela padrão de cinco minutos para o Mestre se reconectar antes do encerramento automático;
- revogação imediata de dispositivos pelo Mestre;
- encerramento da sala com desconexão de todos os participantes;
- registro privado de criação, entrada, conexão, revogação e encerramento;
- senhas, tokens, nomes de personagens e conteúdo das fichas nunca entram no
  diretório público.

## Implementação da Etapa 8

- entrada em uma sala pública com seleção visual e senha, sem digitar o código;
- vínculo com personagem livre já existente na sala;
- criação local ou importação de JSON antes da entrada;
- cópia segura da ficha enviada com novos IDs de ficha e participante;
- publicação de testes do personagem controlado e bloqueio de rolagens alheias;
- pad numérico recolhível com preferência preservada no dispositivo;
- calendário, agenda e linha do tempo disponíveis ao Jogador somente para leitura;
- ações administrativas e alterações de calendário validadas além da ocultação visual;
- estado persistente de acesso encerrado após saída voluntária, revogação ou fechamento;
- navegação, conteúdo e controles da campanha tornam-se inertes e invisíveis nesse estado;
- somente o navegador de salas pode ser aberto até uma nova autenticação válida.

## Critérios da Etapa 0

- catálogo de comandos versionado;
- matriz de papéis testada;
- validação estrutural de comandos;
- classificação determinística de conflitos;
- projeção de jogador sem campos exclusivos do mestre;
- nenhuma dependência de Cloudflare dentro do domínio do aplicativo.
