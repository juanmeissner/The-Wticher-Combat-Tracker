# ⚔️ RPG Combat Manager

Um gerenciador de combate moderno e altamente otimizado para RPGs de mesa, desenvolvido como uma Progressive Web App (PWA). O projeto foi criado para substituir fichas físicas, controles manuais e planilhas durante sessões presenciais, oferecendo uma interface rápida, intuitiva e preparada para combates complexos.

Embora tenha sido desenvolvido inicialmente para uma campanha inspirada no universo de **The Witcher**, toda a arquitetura foi construída para ser altamente adaptável a qualquer sistema de RPG.

---

# ✨ Principais Recursos

## ⚔️ Gerenciamento de Combate

* Controle completo da iniciativa.
* Avanço automático de turnos e rodadas.
* Controle de HP e ST.
* Aplicação rápida de dano e cura.
* Alteração de iniciativa durante o combate.
* Controle de múltiplos jogadores e monstros.
* Sistema preparado para centenas de combatentes simultâneos.

---

## 🧙 Sistema Avançado de Efeitos

O projeto possui um sistema robusto para gerenciamento de efeitos temporários e permanentes.

Cada efeito pode possuir:

* duração em rodadas;
* duração permanente;
* stacks editáveis;
* categorias visuais;
* descrição curta;
* descrição completa;
* ícone personalizado;
* controle individual por combatente.

As categorias atualmente suportadas incluem:

* Buff
* Debuff
* Controle
* Dano Contínuo
* Cura
* Proteção
* Estado Especial
* Permanente

Cada categoria possui identidade visual própria através de bordas coloridas.

---

## 🎒 Inventário

Sistema completo de inventário contendo:

* armas;
* armaduras;
* itens consumíveis;
* acessórios;
* equipamentos diversos.

Os itens podem possuir:

* descrição;
* categoria;
* quantidade;
* peso;
* valor;
* efeitos próprios.

---

## ✨ Sistema de Habilidades

O gerenciador inclui um catálogo completo de habilidades.

Cada habilidade possui:

* Nome
* Categoria
* Tipo
* Profissão
* Descrição
* Duração
* Defesa
* Dano
* Custo
* Alcance
* Tipo de ação
* Custo de desbloqueio
* Ícone personalizado

Além disso:

* habilidades podem ser adicionadas ao personagem;
* podem ser ativadas/desativadas;
* possuem custo modificado automaticamente através do sistema de Magia Expandida;
* possuem visualização detalhada.

---

## 📊 Exportação para Excel

Todas as habilidades podem ser exportadas para uma planilha Excel contendo:

* Nome
* Categoria
* Tipo
* Profissão
* Descrição
* Duração
* Defesa
* Dano
* Custo
* Alcance
* Ação
* Custo de Desbloqueio

Ideal para organização, documentação ou impressão.

---

## 📱 Interface Responsiva

A interface foi totalmente adaptada para dois cenários distintos.

### Mobile

Pensada para uso durante sessões presenciais.

* interface compacta;
* controles rápidos;
* teclado numérico integrado;
* menus adaptados para toque.

### Desktop

Interface expandida contendo:

* navegação superior;
* maior área de visualização;
* gerenciamento confortável de grandes combates.

---

# 🚀 Progressive Web App (PWA)

O projeto funciona como um aplicativo instalável.

Recursos:

* instalação diretamente pelo navegador;
* funcionamento offline;
* Service Worker;
* armazenamento local;
* abertura em tela cheia.

---

# 💾 Persistência de Dados

Todas as informações são armazenadas localmente utilizando LocalStorage.

Entre elas:

* personagens;
* monstros;
* inventário;
* habilidades;
* efeitos;
* configurações;
* progresso da campanha.

---

# 🎨 Tecnologias Utilizadas

* HTML5
* CSS3
* JavaScript (Vanilla)
* Tailwind CSS
* LocalStorage
* Progressive Web App (PWA)

O projeto foi desenvolvido sem frameworks JavaScript, priorizando desempenho, simplicidade e total controle sobre a arquitetura.

---

# 🎯 Filosofia do Projeto

O objetivo nunca foi apenas criar um aplicativo de fichas.

A proposta é oferecer uma ferramenta que reduza drasticamente o tempo gasto com gerenciamento durante uma sessão de RPG, permitindo que o mestre e os jogadores concentrem sua atenção na narrativa.

Cada funcionalidade foi desenvolvida pensando em velocidade de uso, poucos cliques e clareza visual.

---

# 📌 Funcionalidades em Desenvolvimento

* Sistema de campanha.
* Editor visual de monstros.
* Editor visual de habilidades.
* Importação e exportação completas.
* Banco compartilhado de criaturas.
* Sistema de magias expandido.
* Melhorias na interface desktop.
* Personalização de temas.
* Suporte para múltiplos sistemas de RPG.

---

# 📱 Navegação

O RPG Combat Manager foi desenvolvido seguindo o conceito de **Mobile First**, ou seja, toda a experiência foi projetada inicialmente para smartphones e tablets, garantindo velocidade, praticidade e facilidade de uso durante sessões presenciais de RPG.

## Navegação Mobile

Para aproveitar todos os recursos da interface, alguns gestos fazem parte da navegação:

* 👉 **Deslize horizontalmente** sobre a barra inferior para alternar entre as telas de **Combate**, **Inventário** e **Habilidades**.
* ✋ **Pressione e segure** (long press) sobre cartas de habilidades, itens e outros elementos para abrir informações detalhadas e opções adicionais.
* 👆 Um toque simples normalmente seleciona o elemento, enquanto o toque prolongado revela funções avançadas.

Essa abordagem permite manter a interface limpa e organizada, evitando excesso de botões na tela sem perder funcionalidades.

## Experiência Desktop

Ao acessar pelo computador, a interface é automaticamente adaptada para uma navegação mais tradicional, com menus superiores, áreas de visualização ampliadas e controles otimizados para teclado e mouse, preservando todas as funcionalidades disponíveis na versão mobile.

O objetivo é oferecer a melhor experiência possível em qualquer dispositivo, mantendo a mesma base de funcionamento e a mesma velocidade de operação.

---

# 📄 Licença

Este projeto está em desenvolvimento contínuo e foi criado para uso em campanhas de RPG de mesa.

Contribuições, sugestões e melhorias são sempre bem-vindas.
