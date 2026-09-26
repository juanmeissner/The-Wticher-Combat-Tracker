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
- ao confirmar o e-mail, o ID token é renovado imediatamente; se o Worker ainda
  receber a reivindicação antiga, o cliente força uma renovação e repete a operação.

## Etapa 5 — vinculação assistida da conta antiga

- o usuário precisa estar autenticado e confirmado pelo Firebase;
- a vinculação exige novamente o usuário e a senha da conta Cloudflare anterior;
- o Worker valida a senha antiga sem enviá-la ao Firebase nem persistir no cliente;
- campanhas da identidade Firebase temporária e da conta anterior são reunidas no
  mesmo proprietário do D1;
- sessões antigas continuam válidas, permitindo confirmar a migração antes de
  abandonar o acesso legado;
- a identidade Firebase passa a apontar para a conta antiga e o perfil técnico
  `firebase_*` é removido sem ser recriado nas solicitações seguintes;
- uma conta antiga vinculada a outro UID é recusada;
- IDs de campanha repetidos bloqueiam toda a operação e exibem conflito, sem
  sobrescrever ou mover parcialmente qualquer dado;
- repetir a vinculação da mesma identidade é seguro e não duplica campanhas.

A vinculação não depende de uma nova migração D1: ela utiliza a tabela
`firebase_identities` criada na Etapa 3 e executa a troca de proprietário em um
lote transacional do D1.

## Etapa 6 — cadastro e confirmação de e-mail

- cadastro exige nome, e-mail, senha de pelo menos oito caracteres e confirmação;
- o Firebase envia a confirmação e o painel permanece utilizável em modo local;
- campanhas permanentes continuam bloqueadas enquanto `emailVerified` for falso;
- **Já confirmei** recarrega o usuário e força a emissão de um ID token atualizado;
- o reenvio possui intervalo persistente de 60 segundos por usuário, além dos
  limites aplicados pelo próprio Firebase;
- contas por E-mail/senha podem corrigir um endereço digitado incorretamente,
  confirmando primeiro a senha atual;
- a alteração usa verificação prévia: o endereço da conta somente muda depois que
  o usuário abre o link enviado ao novo e-mail;
- URLs de retorno recusadas continuam usando automaticamente a página segura
  hospedada pelo Firebase;
- nenhuma senha, token ou endereço alternativo é incluído nos backups da campanha.

## Etapa 7 — recuperação, troca de senha e sessões

- a recuperação usa o e-mail transacional do Firebase e mantém uma resposta
  neutra, sem informar se o endereço existe ou não;
- o link é processado pela página segura do Firebase e retorna ao login do PWA
  com uma confirmação clara para que o usuário entre usando a nova senha;
- a troca dentro do aplicativo exige a senha atual, a nova senha e a confirmação;
- o Firebase invalida as credenciais anteriores conforme suas regras de sessão;
- o Worker encerra imediatamente todas as sessões legadas Cloudflare vinculadas
  ao mesmo proprietário;
- a alteração de senha é registrada no D1 em um histórico privado da própria
  conta, sem guardar senha, token, endereço de e-mail ou conteúdo de campanha;
- somente os 50 eventos mais recentes são conservados e os 20 mais recentes são
  apresentados no painel;
- sair da conta encerra tanto a sessão Firebase quanto qualquer sessão legada
  mantida neste dispositivo.

A migração `0003_account_security_events.sql` cria a tabela aditiva do histórico
e seu índice por proprietário e data. Ela não altera campanhas nem identidades já
existentes.

## Etapa 8 — login com Google

- o acesso utiliza a Conta Google habilitada no Firebase, sem armazenar senha no
  aplicativo, no D1 ou nos backups;
- navegadores compatíveis abrem o seletor de conta em uma janela; quando o popup
  não é suportado ou o PWA está instalado em modo independente, o fluxo alterna
  automaticamente para redirecionamento;
- o retorno do redirecionamento é processado ao carregar o painel e qualquer erro
  é apresentado em linguagem clara sem impedir o restante do aplicativo de abrir;
- o primeiro acesso cria automaticamente o proprietário isolado no D1 quando a
  primeira operação autenticada é realizada;
- nome, e-mail e avatar da Conta Google são apresentados no perfil, com bloqueio
  de URLs de avatar que não usem HTTPS;
- contas Google reconhecidas pelo Firebase chegam como e-mail confirmado e podem
  acessar campanhas permanentes sem confirmação adicional;
- a persistência local do Firebase restaura a mesma sessão nos acessos seguintes;
- o botão segue a identidade visual do Google com o símbolo colorido e o texto
  localizado **Continuar com Google**.

Conflitos entre um e-mail já cadastrado por senha e uma Conta Google são
interrompidos com uma orientação explícita. A vinculação de provedores é tratada
separadamente na Etapa 9 e nunca une identidades sem confirmação do usuário.

## Etapa 9 — vinculação e conflitos de contas

- quando o Google informa que o e-mail já pertence a outro método, a credencial
  conflitante é mantida somente na memória da sessão atual;
- o aplicativo apresenta uma confirmação dedicada e exige a senha da conta
  original antes de vincular o Google;
- cancelar a confirmação descarta a credencial pendente sem alterar contas,
  campanhas ou sessões;
- usuários autenticados por E-mail/senha podem vincular uma Conta Google pelo
  gerenciamento da conta;
- usuários autenticados exclusivamente pelo Google podem criar uma senha e passar
  a entrar também por e-mail, mantendo o mesmo UID;
- todos os métodos ativos são exibidos no painel e um provedor só pode ser
  desconectado quando outro continuar disponível;
- remover um método exige confirmação explícita e não remove a conta nem suas
  campanhas;
- credenciais já pertencentes a outra identidade são recusadas e nunca provocam
  união automática ou transferência de dados;
- depois de cada vínculo ou remoção, o token é renovado para que o D1 receba a
  lista atual de provedores na próxima operação autenticada.

Como o Firebase UID não muda durante essas operações, o proprietário interno do
D1 também permanece o mesmo. Esta etapa não exige migração do banco nem altera o
fluxo separado de vinculação das antigas contas Cloudflare.

## Etapa 10 — migração dos usuários antigos

- o cadastro de novas contas Cloudflare deixa de ser oferecido na interface; o
  formulário antigo permanece somente para usuários que já possuem campanhas;
- depois do login antigo, um assistente permite criar uma conta Firebase com
  e-mail, entrar em uma conta existente ou utilizar a Conta Google;
- o usuário pode interromper o processo antes da conclusão: a sessão, a senha e
  as campanhas antigas continuam válidas enquanto o e-mail não estiver confirmado;
- a conclusão exige simultaneamente uma sessão legada válida e um ID token
  Firebase com e-mail confirmado;
- campanhas da conta temporária Firebase e da conta antiga são reunidas em uma
  transação; IDs repetidos bloqueiam toda a migração sem mover dados parcialmente;
- o vínculo mantém o proprietário antigo no D1 e associa a ele o Firebase UID;
- depois da confirmação final, todas as sessões legadas são revogadas e novos
  logins pela senha antiga são recusados com orientação para entrar pelo Firebase;
- o verificador da senha anterior não é apagado: a tabela de migração desativa o
  acesso de modo reversível, preservando um caminho administrativo de rollback;
- repetir a conclusão é idempotente e retorna o registro já consolidado;
- o histórico de segurança registra data, campanhas preservadas e quantidade de
  sessões encerradas, sem guardar e-mail, senha, token ou conteúdo de campanha.

A migração `0004_legacy_account_migrations.sql` cria uma tabela aditiva que marca
somente contas cuja transferência foi concluída. A ausência de registro significa
que a migração continua pendente e o acesso antigo ainda pode ser usado para
retomar o processo.

## Etapa 11 — campanhas, salas e identidade da conta

- campanhas permanentes da conta são consultadas automaticamente depois que a
  sessão Firebase confirmada é restaurada;
- a interface separa as campanhas salvas neste dispositivo das cópias privadas
  mantidas na conta, sem carregar ou substituir nenhuma delas automaticamente;
- toda leitura, gravação e exclusão no D1 continua filtrada pelo proprietário
  autenticado, e uma campanha pertencente a outra conta responde como inexistente;
- ao criar ou entrar em uma sala, o cliente envia o ID token somente no cabeçalho;
  o Worker valida o token e converte a identidade em cabeçalhos internos que não
  podem ser forjados pela requisição pública;
- o Durable Object associa Mestre e jogadores ao ID interno da conta, registra a
  autoria das alterações e publica somente o nome exibido e o estado autenticado;
- e-mail, ID token, senha e credenciais Firebase nunca entram no estado da sala,
  no snapshot da campanha, no backup ou na fila offline;
- o modo convidado permanece disponível. Código, senha, token individual do
  dispositivo e escolha de personagem continuam válidos sem exigir cadastro;
- a campanha recebida por um Jogador permanece temporária. Sair, ser removido ou
  ter a sala encerrada restaura a campanha pessoal que já estava no dispositivo.
- cada campanha permanente mantém um ID imutável e os salvamentos seguintes
  atualizam exclusivamente esse ID, sem utilizar o nome como identidade;
- campanhas podem ser renomeadas diretamente na lista da conta, mantendo ID,
  proprietário, histórico de criação e snapshot;
- nomes são únicos dentro de cada conta. Diferenças apenas de maiúsculas ou
  espaços não permitem criar uma segunda campanha com o mesmo nome;
- a migração `0005_unique_campaign_names.sql` preserva campanhas antigas e
  resolve duplicatas anteriores antes de ativar a restrição no D1.

O Worker precisa ser publicado para ativar a identidade confiável e as regras de
nomes nas salas e campanhas. O PWA precisa ser atualizado para utilizar o cache
`v195`.

## Etapa 12 — segurança e proteção contra abuso

- cada instalação gera um identificador local exclusivo, enviado apenas em
  cabeçalhos autenticados e armazenado no D1 somente como hash;
- a conta lista os dispositivos ativos, identifica o dispositivo atual e permite
  revogar remotamente os demais sem expor o identificador original;
- novo dispositivo, revogação, troca de senha e migração passam a compor o
  histórico privado de segurança;
- o Worker rejeita dispositivos revogados e contas com bloqueio administrativo
  antes de consultar ou alterar campanhas;
- login legado, cadastro, vínculo de conta e rotas autenticadas possuem limites
  persistentes no D1 e retornam `429` com tempo de espera quando há abuso;
- recuperação de senha e reenvio de confirmação possuem espera local, além das
  proteções nativas do Firebase, mantendo mensagens neutras contra enumeração;
- todos os endpoints privados continuam exigindo e validando o token Firebase ou
  a sessão legada antes de acessar dados do proprietário;
- a Política de Segurança de Conteúdo restringe scripts, conexões, frames e
  formulários às origens necessárias para o PWA, Firebase, Google e Worker;
- senha, token, identificador bruto do dispositivo e credenciais nunca entram em
  backups, snapshots, relatórios ou registros de segurança.

A migração `0006_account_security_controls.sql` cria as tabelas de dispositivos,
bloqueios e limites de requisição. Bloqueios administrativos são intencionalmente
operados no D1 e sempre auditáveis; não existe botão público para bloquear contas.

No Firebase Console, ative também **Proteção contra enumeração de e-mail** nas
configurações de autenticação. Essa proteção pertence ao projeto Firebase e não
pode ser habilitada pelo código público do PWA.

Depois de aplicar as migrações `0005` e `0006`, publique o Worker e o PWA. Esta
etapa utiliza o cache `v195`.

## Etapa 13 — modo offline

- cadastro e login continuam opcionais; **Continuar offline** fecha a área de
  conta e mantém combate, fichas, inventário, Mundo e configurações locais;
- campanhas do dispositivo permanecem no IndexedDB e são exibidas separadamente
  das cópias privadas da conta;
- uma campanha local pode ser vinculada posteriormente usando **Salvar campanha
  atual**, sempre com seu ID permanente;
- carregar uma campanha remota registra uma cópia própria sem apagar a campanha
  local que estava ativa;
- revisão esperada, conflito explícito e nomes únicos impedem substituição
  silenciosa de outra versão ou campanha;
- durante uma sala, o indicador diferencia conexão, sincronização, alterações
  pendentes, conflito e revogação, incluindo a quantidade ainda não confirmada;
- comandos feitos sem conexão permanecem na fila persistente do IndexedDB e são
  reenviados em ordem depois da reconexão, com IDs idempotentes para não repetir
  ações;
- saída, expulsão e encerramento descartam somente a cópia temporária recebida da
  sala e restauram automaticamente a campanha offline anterior;
- Service Worker, módulos Firebase locais e recursos essenciais preservam a
  inicialização do PWA sem internet.

O modo local continua sendo o estado padrão. A indisponibilidade do Firebase ou
do Worker não bloqueia nenhuma ferramenta de mesa que não dependa da nuvem.

## Etapa 14 — testes e publicação

Validação local concluída:

- suíte completa com 166 testes aprovados;
- tokens válidos, expirados, adulterados e emitidos para outro projeto;
- confirmação, reenvio, recuperação neutra, alteração de senha e provedores;
- vínculo e migração de conta antiga sem perda de campanhas;
- IDs, nomes únicos, revisão, conflitos e isolamento entre proprietários;
- dois dispositivos, revogação, bloqueio administrativo e limites de abuso;
- saída, expulsão, encerramento, queda temporária e fila de reconexão;
- cache `v195`, recursos offline e bundle Firebase local;
- interface em 390 × 844 e 1440 × 900 sem overflow horizontal;
- empacotamento do Worker pelo Wrangler em modo `--dry-run`.

Validação de produção pendente após publicação:

1. aplicar as migrações remotas `0005` e `0006`;
2. publicar o Worker Cloudflare;
3. publicar o PWA no GitHub Pages;
4. confirmar a proteção contra enumeração no Firebase Console;
5. testar recebimento real de confirmação e recuperação;
6. testar popup e redirecionamento Google no navegador e no PWA instalado;
7. entrar pela mesma conta em dois dispositivos, revogar um deles e confirmar o
   bloqueio no acesso seguinte;
8. validar renomeação, nome duplicado, modo offline, reconexão e conflito de
   revisão contra o D1 de produção.

A Etapa 14 só deve ser considerada integralmente concluída depois desse roteiro
de produção. Nenhuma publicação é feita automaticamente pelos testes locais.
