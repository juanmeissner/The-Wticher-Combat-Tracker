<div align="center">

<img src="./image.png" width="112" alt="Ícone do The Witcher Combat Tracker">

# ⚔️ The Witcher Combat Tracker

### Gerencie combates complexos sem interromper o ritmo da mesa

Uma central de combate **mobile first**, instalável e preparada para funcionar offline. Controle turnos, dano localizado, armaduras, condições, magias, itens, fichas, histórico e automações inspiradas em **The Witcher TRPG** em uma única interface.

[![PWA](https://img.shields.io/badge/PWA-Instalável-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](./manifest.json)
![Mobile First](https://img.shields.io/badge/Mobile_First-iOS_%26_Android-0EA5E9?style=for-the-badge)
![Offline](https://img.shields.io/badge/Modo-Offline-10B981?style=for-the-badge)
![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?style=for-the-badge&logo=javascript&logoColor=111827)

[**Abrir aplicação**](https://juanmeissner.github.io/The-Wticher-Combat-Tracker/) · [**Ver repositório**](https://github.com/juanmeissner/The-Wticher-Combat-Tracker) · [**Guia rápido**](#-guia-rápido-de-uso)

</div>

---

## Visão geral

O **The Witcher Combat Tracker** foi criado para reduzir cálculos repetitivos e manter todas as informações importantes visíveis durante uma sessão de RPG. A aplicação separa claramente duas responsabilidades:

- **personagem do turno ativo:** é quem está agindo e pagando custos de EST;
- **alvo selecionado:** é quem recebe dano, cura, condições, itens ou magias.

Essa separação permite executar ações rapidamente sem perder o contexto do combate. Cada alteração relevante pode alimentar o histórico, o sistema de desfazer, os relatórios e as fichas persistentes.

```mermaid
flowchart LR
    A[Turno ativo] --> B[Ação do personagem]
    C[Alvo selecionado] --> B
    B --> D[Regras e automações]
    D --> E[HP, ST, armadura e efeitos]
    E --> F[Histórico detalhado]
    F --> G[Desfazer e relatório]
    E --> H[Persistência local]
```

## Prévia da interface

### 📱 Experiência mobile / iOS

<p align="center">
  <img src="./img/screenshot/mobileios.png" width="340" alt="The Witcher Combat Tracker instalado no iOS, exibindo participantes, efeitos e o pad de combate">
</p>

<p align="center"><sub>Interface mobile first com navegação compacta, cartões legíveis e pad integrado à área inferior do iOS.</sub></p>

### 🖥️ Experiência desktop

<p align="center">
  <img src="./img/screenshot/desktop.png" alt="The Witcher Combat Tracker no desktop, exibindo a visão ampla do combate e o teclado numérico completo">
</p>

<p align="center"><sub>Visão expandida para acompanhar vários participantes, condições e recursos sem perder os controles principais.</sub></p>

## Destaques do produto

| Sistema | O que entrega |
|---|---|
| ⚔️ Combate | Iniciativa, turnos, rodadas, alvos, HP, ST, armadura, dano localizado e testes de morte |
| 🧙 Fichas | Personagens reutilizáveis com recursos atuais, inventário, habilidades, raça e armaduras por região |
| 👹 Bestiário | Monstros predefinidos, busca, detalhes completos e categorias usadas pelas automações |
| 🌀 Condições | Painel responsivo em grade, duração, stacks e dano recorrente automatizado |
| ✨ Efeitos | Magias e itens ativos vinculados individualmente aos participantes |
| 🎒 Inventário | Catálogo, categorias, quantidades, uso de consumíveis, busca, filtros e detalhes |
| 📚 Habilidades | Catálogo pesquisável, Magia Expandida, custo de treino, ativação e exportação |
| 📜 Histórico | Linha do tempo por rodada, filtros, autoria, alvo, cálculos e golpes finais |
| ↶ Segurança | Confirmações, desfazer ações, encontros salvos e backup completo em JSON |
| 📲 PWA | Instalação, modo standalone, cache offline, atualização e reparo do aplicativo |

## Sistemas da aplicação

### ⚔️ Gerenciamento de combate

- criação de jogadores e monstros personalizados;
- inclusão de criaturas diretamente do bestiário;
- definição de nome, iniciativa, HP, ST, CA, ataque e raça/categoria;
- armadura independente para **cabeça, tronco, braços e pernas**;
- ordenação por iniciativa e avanço automático de turnos e rodadas;
- indicação visual do turno atual e do próximo participante;
- nome do personagem ativo sempre sincronizado no pad;
- seleção independente do alvo da ação;
- participantes eliminados agrupados abaixo de todos os participantes vivos;
- controle de sucessos, falhas, estabilização e morte para personagens em 0 HP;
- rolagem rápida de iniciativa dos monstros ao manter pressionado o botão correspondente;
- finalização segura do combate e geração de relatório pós-combate.

### 🎯 Dano localizado e armadura

O valor digitado no pad é tratado como dano base. A aplicação reduz primeiro a armadura da região e depois aplica os multiplicadores escolhidos.

| Região | Multiplicador |
|---|---:|
| Cabeça | ×3 |
| Tronco | ×1 |
| Braço | ×0,5 |
| Perna | ×0,5 |

Também estão disponíveis:

- dano cheio, dividido ou dobrado;
- dano que ignora armadura;
- dano direto à armadura da região;
- registro do dano base, armadura absorvida, multiplicadores e PV final;
- absorção por escudo mágico e PV temporários;
- identificação automática de golpes que derrotaram o alvo.

> **Exemplo:** um ataque de 15 no tronco contra armadura 5 causa 10 de dano. Na cabeça, os mesmos 10 pontos restantes são multiplicados por 3, causando 30 de dano.

### 🛡️ Escudo mágico e PV temporários

Os dois recursos possuem comportamentos diferentes:

- **Quen e Quen Ampliado** criam escudo mágico. O dano vai diretamente ao escudo, ignora armadura e o excesso do golpe é descartado;
- quando o escudo absorve todo o ataque, não é necessário escolher local do dano;
- **Lua Cheia, Bravura de Freya e outros bônus de PV temporários** podem coexistir e são somados;
- PV temporários continuam usando localização e armadura, pois representam vida adicional e não uma barreira mágica.

### 🌀 Condições e efeitos

O seletor de condições usa um painel central responsivo em grade no celular e no desktop. Os nomes permanecem visíveis e os botões são adequados para toque ou mouse.

Cada condição ou efeito pode conter:

- duração em rodadas ou permanência;
- stacks individuais;
- descrição completa;
- origem e alvo;
- atualização, aplicação e remoção registradas no histórico;
- identidade visual e ícone próprios.

**Sangramento**, **Em Chamas** e **Envenenado** causam 1d6 por stack no início do turno afetado. As três condições aceitam até 10 stacks, conforme suas regras cadastradas.

### 🤖 Automações de regras

As automações preservam a decisão do mestre: magias e itens perguntam resultados por padrão, enquanto condições negativas usam rolagem automática. Esse comportamento pode ser alterado em **⋯ → Preferências**.

| Regra automatizada | Comportamento |
|---|---|
| Quen | Pergunta o EST gasto, debita do personagem do turno e cria 5 pontos de escudo por EST |
| Quen Ampliado | Debita o conjurador ativo e cria 10 pontos de escudo por EST |
| Yrden | Usa EST variável, calcula penalidade e controla duração |
| Axii | Pergunta o EST, calcula a penalidade do teste e aplica a condição vinculada ao alvo |
| Axii Marionete | Usa o EST gasto como custo e duração do controle |
| Sangramento, Chamas e Veneno | Rola 1d6 por stack e aplica o dano no turno do alvo |
| Pó de Coagulação | Impede que Sangramento produza efeito enquanto estiver ativo |
| Lua Cheia | Concede 10 + 1d20 PV temporários |
| Andorinha | Recupera vida por turno enquanto as condições do item forem atendidas |
| Coruja-do-mato | Recupera ST por turno |
| Filtro de Petri | Registra o bônus para o próximo sinal |
| Sangue Negro | Causa 1d6 ao vampiro que atacar o usuário protegido |
| Óleos | Adicionam o bônus contra a categoria correta de criatura |
| Fissstech | Reduz pela metade o dano recebido enquanto estiver ativo |

Criaturas predefinidas recebem suas categorias automaticamente. Monstros vampíricos entram no combate com a condição **Vampiro**, permitindo que Sangue Negro funcione sem perguntas repetidas. Personagens e criaturas personalizadas também podem receber uma raça/categoria ao serem criados.

### 🎒 Inventário e itens

- separação entre **Usáveis**, **Equipamentos** e **Diversos**;
- inclusão de itens a partir do catálogo;
- busca por nome e filtro por tipo;
- alteração de quantidade pelos botões `+` e `−`;
- uso direto de consumíveis;
- detalhes acessíveis por botão no desktop, duplo clique ou toque prolongado;
- efeitos de itens aplicáveis a qualquer participante selecionado;
- feedback visual para inclusão, remoção e uso;
- sincronização com a ficha ativa.

### ✨ Habilidades, sinais e magias

- catálogo com busca e filtro por tipo ou elemento cadastrado;
- detalhes de profissão, categoria, duração, defesa, dano, consumo, alcance e ação;
- adição, remoção, ativação e desativação;
- cálculo do custo total de treino;
- modificador de **Magia Expandida** persistente;
- efeitos aplicáveis no combate com indicação de **conjurador → alvo**;
- exportação das habilidades para uma planilha `.xlsx` no desktop;
- sincronização com a ficha ativa.

### 🧙 Fichas persistentes

Em **⋯ → Fichas**, é possível criar personagens reutilizáveis contendo:

- nome, HP máximo, ST máximo e CA;
- HP e ST atuais preservados entre combates;
- raça ou categoria da criatura;
- ataque e dano;
- armadura da cabeça, tronco, braços e pernas;
- inventário individual;
- habilidades individuais.

Uma ficha pode ser ativada para carregar seu inventário e suas habilidades ou adicionada diretamente ao combate. Alterações feitas durante a sessão são sincronizadas para reutilização posterior.

### 👹 Bestiário e biblioteca personalizada

O bestiário oferece busca, ficha detalhada e adição rápida de monstros predefinidos. Para conteúdo próprio, **⋯ → Biblioteca** permite criar, editar e excluir:

- itens personalizados;
- habilidades personalizadas;
- monstros personalizados.

O conteúdo original permanece intacto e a biblioteca pessoal é mantida somente no dispositivo do usuário.

### 📜 Histórico inteligente

O histórico funciona como uma linha do tempo auditável do combate:

- organização por rodada;
- filtros por dano, cura, efeito, condição e turno;
- filtro por participante;
- identificação de autor e alvo, como `Geralt → Grifo`;
- nomes, ícones e dano específico para Sangramento, Chamas e Veneno;
- registro de local atingido, rolagem, armadura, escudos, PV temporários e EST;
- detalhes de efeitos aplicados, atualizados, removidos ou expirados;
- substituição de “dano” por **“derrotou”** quando a ação elimina o alvo;
- cartões compactos no mobile e detalhes expandidos sob demanda.

### 💾 Sessão, segurança e manutenção

O menu **⋯** concentra as ferramentas administrativas:

- `↶` desfaz ações recentes;
- salva e carrega encontros completos;
- exporta e restaura backup em JSON;
- gera relatório pós-combate com rodadas, participantes, derrotas, dano e cura;
- configura contraste, animações e modos de rolagem;
- instala ou atualiza a PWA;
- repara o cache sem apagar os dados do usuário;
- restaura preferências;
- permite apagar todos os dados com dupla confirmação.

## 🎮 Guia rápido de uso

### 1. Prepare os participantes

1. Abra **⚔️ Combate**.
2. Toque em `🧙‍♂️` para criar um jogador ou em `👹` para criar/escolher um monstro.
3. Se preferir um personagem reutilizável, abra `⋯ → Fichas → Nova ficha`.
4. Informe os recursos e armaduras. Depois, use **+ Combate**.

### 2. Entenda turno e alvo

- o nome acima do teclado numérico indica **quem está no turno**;
- o cartão destacado indica **quem está selecionado como alvo**;
- use `⏩` para avançar ao próximo participante;
- magias automatizadas com custo variável descontam EST do personagem do turno, mas afetam o alvo selecionado.

### 3. Aplique dano

1. Selecione o cartão do alvo.
2. Digite o dano base no teclado numérico.
3. Toque em `☠️`.
4. Escolha cabeça, tronco, braço ou perna.
5. Escolha o tipo de dano.
6. Confira a confirmação e o registro detalhado no histórico.

### 4. Cure ou gerencie recursos

1. Selecione o participante.
2. Digite o valor.
3. Use `❤️` para curar, `🔷` para gastar/recuperar ST ou `⚡` para definir iniciativa.
4. Em 0 HP, os botões de cura e dano também controlam sucessos e falhas de morte.

### 5. Aplique condições, magias e itens ativos

1. Selecione o alvo.
2. Use `🌀` para condições ou `✨` para efeitos de habilidades e itens.
3. Escolha o efeito desejado.
4. Quando necessário, informe duração, stacks, EST ou resultado de dados.
5. Avance os turnos normalmente; os efeitos recorrentes serão processados.

### 6. Consulte ou recupere a sessão

1. Abra `⋯ → Histórico` para revisar as ações.
2. Expanda um cartão para visualizar os cálculos.
3. Use `↶` para desfazer a última alteração compatível.
4. Antes de limpar dados ou trocar de dispositivo, use `⋯ → Backup JSON`.

## 🧭 Mapa dos controles

| Controle | Função |
|:---:|---|
| `🧙‍♂️` | Adicionar jogador |
| `👹` | Criar ou escolher monstro |
| `❌` | Encerrar o combate; mantenha pressionado para uma limpeza completa |
| `⏩` | Avançar turno e, quando necessário, a rodada |
| `🌀` | Abrir o painel de condições |
| `✨` | Aplicar efeitos de magias ou itens |
| `❤️` | Curar HP ou adicionar sucesso de morte |
| `☠️` | Causar dano localizado ou adicionar falha de morte |
| `🔷` | Gastar ou recuperar ST |
| `⚡` | Definir iniciativa; mantenha pressionado para rolar monstros |
| `C` | Limpar o valor digitado |
| `←` | Apagar o último dígito |
| `↶` | Desfazer a última ação disponível |
| `⋯` | Abrir histórico, fichas, biblioteca, preferências, backup e manutenção |

## 📱 Mobile first, iOS e desktop

A interface foi construída para sessões presenciais e se adapta ao espaço disponível:

- navegação por toque entre **Combate**, **Itens** e **Habilidades**;
- gesto horizontal para alternar entre as três telas quando nenhum modal está aberto;
- pad fixado na parte inferior somente durante o combate;
- uso da safe area em iPhones com notch e modo standalone;
- notificações posicionadas acima do pad e dentro da área visível;
- modais centralizados, roláveis e protegidos contra sobreposição da navegação;
- painel de condições em grade tanto no mobile quanto no desktop;
- botões de detalhes e interações próprias para mouse em telas maiores;
- suporte a teclado, foco, tecla `Esc`, contraste alto e redução de animações.

### Instalação no iPhone ou iPad

1. Abra a aplicação no **Safari**.
2. Toque em **Compartilhar**.
3. Escolha **Adicionar à Tela de Início**.
4. Abra o aplicativo pelo novo ícone para usar o modo standalone.

### Atualização e reparo

Se uma versão nova não aparecer, use:

`⋯ → Aplicativo → Atualizar agora`

Se ainda houver arquivos antigos:

`⋯ → Aplicativo → Cache e dados → Reparar cache`

O reparo baixa novamente os arquivos da aplicação e preserva fichas, combate e preferências.

## 💾 Dados, privacidade e backup

Não existe conta, servidor ou banco de dados remoto. Os dados são mantidos no `localStorage` do navegador e incluem:

- combate atual;
- fichas e recursos atuais;
- inventários e habilidades;
- histórico e encontros salvos;
- biblioteca personalizada;
- preferências e modos de rolagem.

> [!IMPORTANT]
> Limpar os dados do site ou remover o armazenamento do navegador pode apagar a campanha local. Exporte periodicamente um **backup JSON completo**, principalmente antes de trocar de dispositivo.

## 🧰 Tecnologias

| Camada | Tecnologia |
|---|---|
| Estrutura | HTML5 semântico |
| Interface | CSS3, Tailwind CSS e layout responsivo próprio |
| Aplicação | JavaScript Vanilla organizado por domínio |
| Persistência | LocalStorage e backups JSON |
| PWA | Web App Manifest, Service Worker e Cache API |
| Exportação | SheetJS para arquivos Excel |
| Compatibilidade | APIs modernas de navegador, safe areas e modo standalone |

O projeto não exige framework JavaScript, bundler ou etapa de compilação.

## 🗂️ Organização do código

```text
.
├── index.html                    # Estrutura da aplicação e modais
├── style.css                    # Estilos principais
├── mobile.css                   # Responsividade, iOS e acessibilidade
├── manifest.json                # Metadados da PWA
├── service-worker.js            # Entrada do Service Worker
├── js/
│   ├── abilities/               # Catálogo, inventário e exportação de habilidades
│   ├── combat/                  # Turnos, dano, renderização, efeitos e persistência
│   ├── core/                    # Utilitários e notificações
│   ├── ui/                      # Componentes de interface e modais
│   ├── enhancements.js          # Fichas, biblioteca, preferências e manutenção
│   ├── rules-automation.js      # Automações de magias, itens e categorias
│   └── session-features.js      # Histórico, desfazer, encontros, backup e relatório
└── img/                         # Imagens do bestiário
```

## 🚀 Executando localmente

Por utilizar Service Worker, a aplicação deve ser aberta por HTTP em vez de diretamente pelo arquivo `index.html`.

```bash
git clone https://github.com/juanmeissner/The-Wticher-Combat-Tracker.git
cd The-Wticher-Combat-Tracker
python -m http.server 8080
```

Depois, acesse [http://localhost:8080](http://localhost:8080).

Também é possível usar qualquer servidor estático, como **Live Server**, `npx serve` ou GitHub Pages.

## ✅ Estado atual

- [x] Interface mobile first e responsiva
- [x] PWA instalável e modo offline
- [x] Compatibilidade visual com safe areas do iOS
- [x] Combate, iniciativa, rodadas e dano localizado
- [x] Fichas persistentes e encontros salvos
- [x] Inventário, habilidades, bestiário e biblioteca própria
- [x] Condições, efeitos e automações de regras
- [x] Histórico detalhado, desfazer e relatório pós-combate
- [x] Backup completo, atualização e reparo de cache
- [ ] Sincronização opcional entre dispositivos
- [ ] Perfis de regras para outros sistemas de RPG
- [ ] Testes automatizados de interface ponta a ponta

## 🤝 Contribuições

Sugestões, correções e novas automações são bem-vindas. Ao contribuir:

1. descreva a regra ou problema com um exemplo reproduzível;
2. preserve a experiência mobile first;
3. valide o comportamento no desktop e, quando possível, no Safari/iOS;
4. evite poluir a interface com informações que podem ficar em detalhes expansíveis;
5. mantenha automações configuráveis quando a decisão depender do mestre.

## Aviso legal

Este é um projeto independente, criado por fãs para apoio a sessões de RPG de mesa. **The Witcher** e suas marcas relacionadas pertencem aos respectivos titulares. O projeto não possui afiliação oficial com CD PROJEKT RED ou R. Talsorian Games.

O repositório não possui atualmente um arquivo de licença de software específico. Consulte o autor antes de redistribuir ou reutilizar partes substanciais do código.

---

<div align="center">

**Menos tempo calculando. Mais tempo narrando.**

Feito para mestres que querem velocidade sem abrir mão dos detalhes.

</div>
