# Publicação da sala experimental na Cloudflare

A interface do Combat Tracker continua hospedada como PWA estática. O diretório
`cloudflare/` contém somente o serviço de colaboração: API, autenticação da sala,
Durable Objects, diretório público e WebSockets.

## 1. Autorizar o Wrangler

No terminal, a partir da raiz do projeto:

```powershell
cd cloudflare
npx wrangler@latest login
```

O navegador abrirá a autorização da conta Cloudflare.

## 2. Conferir as origens permitidas

Abra `cloudflare/wrangler.jsonc` e mantenha em `ALLOWED_ORIGINS` somente as
origens que poderão abrir salas. Para a versão publicada no GitHub Pages, a
origem é `https://juanmeissner.github.io`.

## 3. Testar localmente

```powershell
npx wrangler@latest dev
```

O serviço normalmente ficará disponível em `http://localhost:8787`. No app,
o endereço de produção fica oculto. Para apontar temporariamente a cópia local
para o Worker de desenvolvimento, execute no console do navegador e recarregue:

```javascript
localStorage.setItem('dnd_collaboration_endpoint_v1', 'http://localhost:8787')
```

## 4. Publicar

```powershell
npx wrangler@latest deploy
```

Os tempos de vida das salas ficam centralizados em `wrangler.jsonc`:

- `MASTER_RECONNECT_GRACE_MS`: tempo concedido ao Mestre para se reconectar, com padrão de 5 minutos;
- `DIRECTORY_HEARTBEAT_MS`: frequência de atualização da presença no diretório, com padrão de 2 minutos;
- `DIRECTORY_STALE_MS`: limite para eliminar uma entrada sem heartbeat, com padrão de 10 minutos.

Uma sala deixa de aparecer no diretório assim que o Mestre desconecta. Durante a janela de reconexão, os dados continuam preservados no Durable Object; passado o limite, a sala é encerrada, os jogadores são desconectados e o registro público é removido.

O cliente oficial já utiliza automaticamente
`https://witcher-combat-collaboration.juanmeissnerf.workers.dev`. Em uma
instalação própria, substitua `DEFAULT_ENDPOINT` em
`js/collaboration/realtime-client.js`. O app guarda somente o endereço e o token
revogável do dispositivo; a senha da sala não é persistida.

## Fluxo de teste entre dois dispositivos

1. No dispositivo do Mestre, abra **⋯ → Sala**, informe o nome e uma senha com
   pelo menos seis caracteres.
2. Marque se a sala deve aparecer publicamente e toque em **Criar sala**.
3. No segundo dispositivo, abra **⋯ → Sala**, toque na sala da lista e informe a senha.
4. Escolha um personagem livre, uma ficha deste dispositivo ou importe um JSON.
5. Avance um turno no dispositivo do Mestre e confirme a atualização automática
   no dispositivo do Jogador.
6. No Jogador, ajuste Adrenalina ou Dado da Sorte do personagem vinculado e
   confirme a atualização nos dois dispositivos.
7. Desative e reative a rede do Jogador para validar a reconexão automática.
8. No Jogador, abra o calendário e confirme que navegação e consulta funcionam,
   mas não existem controles para avançar o tempo ou editar eventos.
9. No Mestre, revogue o dispositivo de teste e confirme a desconexão imediata.

## Limites desta etapa

- a sala é experimental e não substitui os backups locais;
- a visão do Mestre é sincronizada automaticamente por snapshots versionados;
- o Jogador pode alterar imediatamente apenas os recursos próprios já ligados
  ao contrato de comandos;
- inventário, equipamentos, evolução e outras alterações permanentes do Jogador
  entram como propostas para aprovação do Mestre;
- comandos feitos offline são reenviados ao reconectar sem duplicar efeitos;
- divergências de versão abrem uma decisão explícita para o Mestre;
- salas públicas expõem somente nome, código e contadores; fichas e credenciais
  permanecem dentro do Durable Object privado da sala;
- restauração navegável de snapshots históricos continuará em uma etapa futura.
