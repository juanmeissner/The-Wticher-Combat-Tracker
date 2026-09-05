# Contrato de colaboração e sincronização

Status: Etapa 0 concluída — contrato local, independente do provedor de rede.

Este documento define a fronteira entre o aplicativo offline e a futura sala em
tempo real. A interface nunca envia uma campanha inteira para substituir outra.
Ela envia **comandos pequenos, identificáveis e idempotentes**; o servidor da
sala valida, ordena, persiste e devolve eventos autorizados.

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

## Critérios da Etapa 0

- catálogo de comandos versionado;
- matriz de papéis testada;
- validação estrutural de comandos;
- classificação determinística de conflitos;
- projeção de jogador sem campos exclusivos do mestre;
- nenhuma dependência de Cloudflare dentro do domínio do aplicativo.
