# Checklist de validação e publicação

Use este roteiro depois de revisar a interface local e antes de considerar a
Etapa 14 integralmente concluída.

## 1. Auditoria automatizada

Execute na raiz do projeto:

```powershell
npm run verify:release
```

O comando recompila o CSS e o Firebase, executa toda a suíte e empacota o Worker
em modo `--dry-run`. Ele não publica nem modifica serviços externos.

## 2. Campanhas no dispositivo e na nuvem

- confirmar que uma campanha presente nos dois locais aparece em um único card;
- conferir os indicadores **Ativa**, **Dispositivo** e **Nuvem**;
- criar uma campanha local e outra já vinculada à nuvem;
- abrir outra campanha e confirmar a troca do indicador **Ativa**;
- renomear uma campanha vinculada e conferir o mesmo nome nos dois dispositivos;
- tentar repetir um nome e confirmar o bloqueio;
- remover apenas a cópia local e depois baixá-la novamente;
- remover apenas a cópia na nuvem e confirmar que a local continua disponível;
- alterar a campanha ativa, aguardar o salvamento automático e confirmar que não
  ocorre uma requisição para cada pequena alteração;
- desativar **Auto** e confirmar que o card passa a exigir sincronização manual;
- provocar uma revisão concorrente em outro dispositivo e confirmar que nenhuma
  versão é substituída silenciosamente.

## 3. Autenticação

- cadastro e bloqueio de e-mail duplicado;
- confirmação e reenvio de e-mail;
- login correto, senha incorreta e recuperação;
- alteração de senha e encerramento das sessões antigas;
- login Google, vínculo e remoção de provedores;
- logout, restauração da sessão e expiração do token;
- migração de uma conta Cloudflare antiga sem perder campanhas.

## 4. Dispositivos, salas e modo offline

- entrar com a mesma conta em dois dispositivos;
- revogar um dispositivo e confirmar o bloqueio no acesso seguinte;
- criar uma sala, conectar um jogador e validar a sincronização;
- testar queda de conexão, fila offline e reconexão sem comandos duplicados;
- sair, expulsar e encerrar a sala, confirmando a restauração da campanha local;
- continuar offline e usar combate, fichas, inventário e Mundo sem login.

## 5. Publicação

1. confirmar no Firebase Console que a proteção contra enumeração está ativa;
2. fazer commit e publicar o PWA no GitHub Pages;
3. publicar o Worker somente quando houver alterações em `cloudflare/`;
4. confirmar que `js/service-worker.js` público contém o cache esperado;
5. repetir os testes de e-mail e Google no endereço público e no PWA instalado;
6. verificar mobile em 390 × 844 e desktop em 1440 × 900;
7. registrar a versão publicada e a data da validação.

Uma resposta HTTP 200 comprova disponibilidade, mas não substitui os testes de
conta, e-mail, dois dispositivos e PWA instalado.
