# Autenticação Firebase — preparação e configuração

Este documento registra a transição planejada do login próprio para o Firebase Authentication. A mudança é deliberadamente aditiva: o aplicativo offline, as campanhas locais, as salas em Durable Objects e as campanhas no Cloudflare D1 continuam funcionando durante a migração.

## Etapa 0 — inventário e proteção

### Estado atual

- `users`: contas legadas identificadas por `id` e `username`, com verificador PBKDF2; nenhuma senha em texto aberto.
- `account_sessions`: sessões revogáveis das contas legadas.
- `cloud_campaigns`: campanhas privadas vinculadas a `owner_user_id`.
- IndexedDB: fonte local das campanhas e do modo offline.
- Durable Objects: salas temporárias e sincronização em tempo real.

### Regras de segurança da transição

1. Nenhuma tabela atual será apagada ou renomeada durante a adoção do Firebase.
2. Campanhas continuarão vinculadas ao mesmo proprietário até uma associação autenticada e explícita com o UID do Firebase.
3. O login legado permanecerá disponível até que cadastro, confirmação de e-mail, recuperação, Google e acesso às campanhas estejam validados em produção.
4. A migração futura será aditiva, com uma tabela de identidades externas ou colunas opcionais; nunca substituirá silenciosamente um proprietário.
5. O rollback consiste em desativar o provedor Firebase no cliente e no Worker, preservando as tabelas e sessões legadas.
6. Backups JSON locais não receberão tokens do Firebase, tokens legados nem dados de credenciais.

### Contrato entre Firebase e Cloudflare

- O Firebase autentica a identidade e emite um ID token de curta duração.
- O PWA envia esse token ao Cloudflare Worker pelo cabeçalho `Authorization: Bearer`.
- O Worker valida assinatura, emissor, audiência, validade e e-mail confirmado antes de acessar o D1.
- O D1 mantém perfil, vínculo de identidade e campanhas; o Durable Object continua responsável pelas salas.
- Chaves administrativas, service accounts e client secrets existem somente no servidor. Nunca são incluídos no PWA.

## Etapa 1 — configurar o projeto Firebase

Esta etapa exige acesso do proprietário ao [console do Firebase](https://console.firebase.google.com/). O código do PWA já possui um arquivo separado para receber a configuração pública.

### 1. Criar o projeto

1. Crie um projeto Firebase para o aplicativo.
2. O Google Analytics é opcional e pode permanecer desativado nesta fase.
3. Em **Configurações do projeto → Seus aplicativos**, registre um aplicativo **Web**.
4. Copie somente a configuração Web pública exibida pelo Firebase.

### 2. Habilitar os provedores

Em **Authentication → Sign-in method**:

1. habilite **E-mail/senha**;
2. habilite **Google**;
3. defina o nome público do aplicativo e o e-mail de suporte solicitado pelo Google.

Não habilite login sem senha por link nesta fase. Confirmação de e-mail e recuperação serão executadas pelo próprio Firebase nas etapas seguintes.

### 3. Autorizar os endereços do PWA

Em **Authentication → Settings → Authorized domains**, mantenha os domínios criados automaticamente e adicione os endereços realmente usados pelo aplicativo:

- `juanmeissner.github.io` para a publicação atual;
- `localhost` para desenvolvimento local;
- o domínio definitivo do PWA, quando ele existir.

Domínios devem ser cadastrados sem `https://`, caminhos ou barras finais. Adicione `127.0.0.1` somente se o console aceitar e o desenvolvimento usar esse endereço.

### 4. Preencher a configuração pública

Edite `js/auth/firebase-project-config.js` e substitua os campos vazios pelos valores do bloco `firebaseConfig` fornecido pelo console:

```js
root.WITCHER_FIREBASE_AUTH_CONFIG = Object.freeze({
    apiKey: 'valor-publico',
    authDomain: 'seu-projeto.firebaseapp.com',
    projectId: 'seu-projeto',
    storageBucket: 'seu-projeto.firebasestorage.app',
    appId: 'valor-publico',
    messagingSenderId: 'valor-publico',
    measurementId: 'valor-publico-opcional'
});
```

`apiKey` do aplicativo Web é um identificador público. Não copie para esse arquivo `privateKey`, `clientSecret`, service account, senha ou token administrativo. O módulo `firebase-auth-config.js` rejeita campos secretos conhecidos e informa campos públicos ausentes.

### Critério de conclusão da Etapa 1

- projeto Firebase criado;
- aplicativo Web registrado;
- E-mail/senha e Google habilitados;
- nome público e e-mail de suporte definidos;
- domínios autorizados revisados;
- configuração pública preenchida;
- suíte automatizada aprovada.

**Status:** concluída para o projeto `thewitcherrpgmanager`. O aplicativo Web está
registrado, E-mail/senha e Google estão habilitados e os domínios de produção e
desenvolvimento foram autorizados.

## Etapa 2 — autenticação no PWA

- SDK modular instalado pelo npm e empacotado localmente com esbuild;
- bundle de autenticação carregado somente quando o painel de conta é aberto;
- cadastro com nome, e-mail, senha e confirmação de senha;
- envio e reenvio de confirmação de e-mail;
- login por e-mail/senha e Conta Google;
- recuperação de senha pelo e-mail cadastrado;
- persistência da sessão e encerramento manual;
- mensagens de erro traduzidas e fluxo responsivo para mobile;
- acesso legado ao Cloudflare preservado em um painel recolhível.

O Analytics não é carregado nesta fase.

## Etapa 3 — Firebase, Cloudflare Worker e D1

- validação da assinatura RS256 com as chaves públicas oficiais do Google;
- conferência obrigatória de projeto, emissor, validade, emissão e autenticação;
- bloqueio de e-mails ainda não confirmados;
- vínculo determinístico entre Firebase UID e usuário interno do D1;
- campanhas isoladas por UID, sem exposição entre contas;
- ID token obtido sob demanda e nunca incluído nos backups do aplicativo;
- contas e sessões legadas preservadas durante a transição;
- cache das chaves públicas conforme o prazo informado pelo Google.

A migração `0002_firebase_identities.sql` é aditiva: ela cria somente a tabela de
identidades externas e seu índice. As campanhas já existentes continuam ligadas
ao proprietário anterior e não são mescladas automaticamente com base em nome ou
e-mail. Isso evita que duas pessoas recebam dados uma da outra por engano.

## Etapa 4 — gerenciamento e segurança da conta

- edição do nome exibido sem alterar o UID nem a propriedade das campanhas;
- troca de senha somente para contas que usam o provedor E-mail/senha;
- reautenticação obrigatória com a senha atual antes da alteração;
- nova senha mantida exclusivamente pelo Firebase, sem persistência local ou no D1;
- contas exclusivamente Google continuam gerenciando a senha pela Conta Google;
- interface responsiva e recolhível para não ocupar permanentemente o painel da conta.
- confirmação e recuperação tentam retornar ao PWA e usam automaticamente a
  página segura hospedada pelo Firebase quando a URL de retorno for recusada.
