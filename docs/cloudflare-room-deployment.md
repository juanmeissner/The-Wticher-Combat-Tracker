# Publicação da sala experimental na Cloudflare

A interface do Combat Tracker continua hospedada como PWA estática. O diretório
`cloudflare/` contém o serviço de colaboração: API, autenticação da sala,
Durable Objects, diretório público, WebSockets e o banco D1 opcional para contas
e campanhas permanentes.

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

## 4. Preparar o banco de contas

O `wrangler.jsonc` liga `ACCOUNT_DB` ao banco `witcher-combat-accounts`. Em uma
conta Cloudflare nova, crie o banco e copie o `database_id` retornado para a
configuração:

```powershell
npx wrangler@latest d1 create witcher-combat-accounts
```

Depois aplique as migrações no banco remoto:

```powershell
npx wrangler@latest d1 migrations apply witcher-combat-accounts --remote
```

A primeira migração cria usuários, sessões revogáveis e campanhas privadas
versionadas. A segunda cria os vínculos entre Firebase UID e proprietário do D1.
Ela pode ser executada novamente com segurança: o Wrangler aplica somente as
migrações ainda pendentes.

Confirme também que `FIREBASE_PROJECT_ID` está definido como
`thewitcherrpgmanager`. O Worker usa esse valor para rejeitar tokens emitidos por
qualquer outro projeto Firebase. Não é necessário armazenar service account,
chave privada ou client secret na Cloudflare.

## 5. Publicar

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

## Fluxo de teste das campanhas permanentes

1. Fora de uma sala, abra **⋯ → Sala → Conta The Witcher RPG Manager**.
2. Entre pelo Google ou crie uma conta com e-mail e confirme a mensagem recebida.
3. Depois da confirmação, toque em **Salvar campanha atual**, informe um nome e confira a versão criada na lista.
4. Em outro dispositivo, entre com a mesma conta e toque em **Carregar**.
5. Confirme que outra conta não consegue listar nem abrir essa campanha.
6. Altere a campanha nos dois dispositivos e confirme que uma versão antiga gera
   conflito, sem sobrescrever silenciosamente a versão mais recente.
7. Saia da conta e confirme que a sessão Firebase desaparece, mas a campanha local continua disponível.
8. Use **Excluir**, confirme a remoção da campanha na nuvem e confira que a cópia local continua disponível.
9. Se houver uma conta anterior, abra **Vincular conta antiga**, informe as
   credenciais legadas e confira que as campanhas das duas contas aparecem juntas.
10. Repita o teste com uma campanha de mesmo ID nas duas contas e confirme que a
    vinculação é bloqueada sem mover ou apagar nenhuma cópia.
11. Salve duas campanhas com nomes diferentes, renomeie uma delas e confirme que
    o ID permanece igual e que o nome novo aparece ao recarregar a lista.
12. Tente salvar ou renomear outra campanha para o mesmo nome, inclusive mudando
    maiúsculas ou espaços, e confirme que o Worker recusa a duplicidade.

Antes de publicar a versão que conclui a migração das contas antigas, aplique as
migrações pendentes e depois publique o Worker:

```powershell
npx wrangler@latest d1 migrations apply witcher-combat-accounts --remote
npx wrangler@latest deploy
```

A Etapa 10 utiliza `0004_legacy_account_migrations.sql` para registrar a conclusão,
revogar o acesso legado sem apagar seu verificador e permitir rollback
administrativo. A migração `0005_unique_campaign_names.sql` acrescenta a chave
normalizada do nome e impede nomes repetidos dentro da mesma conta. Se já houver
duplicatas antigas, todas são preservadas e recebem um sufixo com o ID antes da
criação do índice único. O comando aplica somente migrações ainda pendentes.

A migração `0006_account_security_controls.sql` registra dispositivos por hash,
limites persistentes e bloqueios administrativos. Depois de aplicá-la, publique o
Worker para que os novos cabeçalhos CORS, a revogação de dispositivos e os limites
de acesso entrem em vigor.

Para bloquear administrativamente uma conta, use o painel D1 da Cloudflare e
adicione seu `user_id` à tabela `account_blocks`, com motivo, data ISO e o operador.
Para liberar a conta, remova somente esse registro. Campanhas, identidade e
histórico não são apagados pelo bloqueio.

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
- jogadores recebem a campanha da sala em armazenamento temporário; ao sair,
  serem removidos ou a sala terminar, a campanha offline anterior é restaurada;
- contas são opcionais; a senha é validada por derivação PBKDF2, o token salvo no
  dispositivo não participa dos backups e campanhas permanentes ficam isoladas
  por proprietário no D1;
- restauração navegável de snapshots históricos continuará em uma etapa futura.
