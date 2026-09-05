# Publicação da sala experimental na Cloudflare

A interface do Combat Tracker continua hospedada como PWA estática. O diretório
`cloudflare/` contém somente o serviço de colaboração: API, autenticação da sala,
Durable Object e WebSockets.

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
abra **⋯ → Sala** e informe esse endereço no campo Cloudflare.

## 4. Publicar

```powershell
npx wrangler@latest deploy
```

Ao final, copie o endereço HTTPS exibido, semelhante a
`https://witcher-combat-collaboration.<subdominio>.workers.dev`, e cole-o em
**⋯ → Sala**. O app guarda somente o endereço e o token revogável do dispositivo;
a senha da sala não é persistida.

## Fluxo de teste entre dois dispositivos

1. No dispositivo do Mestre, abra **⋯ → Sala**, informe o endereço do Worker,
   nome, sala e uma senha com pelo menos seis caracteres.
2. Toque em **Criar sala** e copie o código gerado.
3. No segundo dispositivo, informe o mesmo endereço, código e senha.
4. Escolha um dos personagens ainda disponíveis e toque em **Entrar agora**.
5. Avance um turno no dispositivo do Mestre e confirme a atualização automática
   no dispositivo do Jogador.
6. No Jogador, ajuste Adrenalina ou Dado da Sorte do personagem vinculado e
   confirme a atualização nos dois dispositivos.
7. Desative e reative a rede do Jogador para validar a reconexão automática.

## Limites desta etapa

- a sala é experimental e não substitui os backups locais;
- a visão do Mestre é sincronizada automaticamente por snapshots versionados;
- o Jogador pode alterar imediatamente apenas os recursos próprios já ligados
  ao contrato de comandos;
- inventário, equipamentos, evolução e outras alterações permanentes entrarão
  como propostas para aprovação nas próximas etapas;
- encerramento remoto, expulsão de dispositivos e histórico de versões serão
  ampliados nas etapas de colaboração seguintes.

