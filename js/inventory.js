let wasLongPress = false;

function handleItemTouchEnd(itemId) {

    cancelItemLongPress();

    if (wasLongPress) return;

    selectInventoryItem(itemId);
}

function startItemLongPress(itemId) {

    wasLongPress = false;

    longPressTimer = setTimeout(() => {

        wasLongPress = true;

        showItemDetails(itemId);

    }, 500);
}

function cancelItemLongPress() {

    clearTimeout(longPressTimer);
}

function setInventoryFilter(category) {

    currentInventoryFilter = category;

    updateInventoryTabs();

    renderInventory();
}

function updateInventoryTabs() {

    const tabs =
        document.querySelectorAll('.inventory-tab');

    tabs.forEach(tab => {

        tab.classList.remove(
            'bg-cyan-700',
            'ring-2',
            'ring-cyan-400'
        );
    });

    const activeTab =
        document.querySelector(
            `[data-category="${currentInventoryFilter}"]`
        );

    if (activeTab) {

        activeTab.classList.add(
            'bg-cyan-700',
            'ring-2',
            'ring-cyan-400'
        );
    }
}

function showItemDetails(itemId) {

    const item =
        inventory.find(i => i.id === itemId);

    if (!item) return;

    const content =
        document.getElementById(
            'itemDetailsContent'
        );

    content.innerHTML = `

        <div class="text-3xl mb-3">

            ${item.icon}

        </div>

        <div class="text-2xl font-bold mb-2">

            ${item.name}

        </div>

        ${item.goldValue
            ? `
                <div class="text-yellow-400 mb-4">
        
                    💰 ${item.goldValue} Ouro
        
                </div>
            `
            : ''}

        ${item.type === 'weapon'
            ? `
                <div class="text-red-400 mb-2">

                    ⚔️ ${item.damage} DMG

                </div>
            `
            : ''}

        ${item.type === 'armor'
            ? `
                <div class="text-cyan-400 mb-2">

                    🛡️ ${item.defense} DEF

                </div>
            `
            : ''}

            ${item.weaponType
                ? `
                    <div class="text-yellow-400 mb-2">
            
                        🏷️ ${item.weaponType}
            
                    </div>
                `
                : ''}
            
            ${item.bonus
                ? `
                    <div class="text-green-400 mb-2">
            
                        ✨ ${item.bonus}
            
                    </div>
                `
                : ''}
            
            ${item.effect
                ? `
                    <div class="text-purple-400 mb-4">
            
                        🌀 ${item.effect}
            
                    </div>
                `
                : ''}

        <div class="text-slate-300 mb-4">

            ${item.description}

        </div>

        <div class="font-bold mb-2">

            Receita

        </div>

        <div class="space-y-1">

            ${item.recipe.length > 0

                ? item.recipe.map(r => `

                    <div class="text-slate-400">

                        • ${r}

                    </div>

                `).join('')

                : `
                    <div class="text-slate-500">

                        Sem receita

                    </div>
                `
            }

        </div>
    `;

    document
        .getElementById('itemDetailsModal')
        .classList.remove('hidden');
}

function closeItemDetailsModal() {

    document
        .getElementById('itemDetailsModal')
        .classList.add('hidden');
}

// =========================================
// ITENS PRÉ DEFINIDOS
// =========================================
let currentInventoryFilter = 'usable';
const predefinedItems = [

    // =====================================
    // USÁVEIS
    // =====================================

    {
        id: 'solucaoacida',
        name: 'Solução Ácida',
        icon: '💥',
        category: 'usable',
        goldValue: 10,
        description: 'Provoca 4d6 de dano ao ser arremessada; 1d6 de dano de ablação a armas/armaduras. Espalha-se num cone de 3m.',
        recipe: [
            'Água-forte',
            'Enxofre',
            'Água Ducal'
        ]
    },

    {
        id: 'tumbadeadda',
        name: 'Tumba de Adda',
        icon: '🧪',
        category: 'usable',
        goldValue: 0,
        description: 'Preserva comidas e corpos. Perecíveis tratados não apodrecem por 1d10 dias (corpo humano = 2 doses).',
        recipe: [
            'Pedra de Amolar',
            'Verbena',
            'Cera de Ogro'
        ]
    },

    {
        id: 'adesivoalquimico',
        name: 'Adesivo Alquímico',
        icon: '🧪',
        category: 'usable',
        goldValue: 0,
        description: 'Gruda objetos e pessoas após 2 rodadas. Para separar, é necessário teste de Físico ND:16. Arremessável..',
        recipe: [
            'Visco',
            'Água-forte',
            'Água Ducal'
        ]
    },

    {
        id: 'pobasico',
        name: 'Pó Básico',
        icon: '🧪',
        category: 'usable',
        goldValue: 0,
        description: 'Anula o efeito da solução ácida ou remove o dano de um ferimento crítico de estômago rasgado.',
        recipe: [
            'Extrato de Mandrágora',
            'Heléboro',
            'Scleroderma'
        ]
    },

    {
        id: 'venenonegro',
        name: 'Veneno Negro',
        icon: '🧪',
        category: 'usable',
        goldValue: 0,
        description: 'Envenena se ingerido ou em contato com sangue. Teste de Tolerância ND:18 para resistir.',
        recipe: [
            'Extrato de Veneno',
            'Raiz de Mandrágora',
            'Pequena Cicuta'
        ]
    },

    {
        id: 'furiadebredan',
        name: 'Fúria de Bredan',
        icon: '💥',
        category: 'usable',
        goldValue: 0,
        description: 'Explode ao contato com o ar, causando 2d6 de dano num raio de 4m, os alvos terão que passar em um teste de tolerância para não incendiar.',
        recipe: [
            'Fósforo',
            'Fragmentos Lunares',
            'Polvora'
        ]
    },

    {
        id: 'cloroformio',
        name: 'Clorofórmio',
        icon: '🧪',
        category: 'usable',
        goldValue: 0,
        description: 'Induz inconsciência por respiração. Teste de resistência a Desmaiado ND 18 com penalidade de -2.',
        recipe: [
            'Água Destilada',
            'Água Ducal',
            'Enxofre'
        ]
    },

    {
        id: 'podecoagulacao',
        name: 'Pó de Coagulação',
        icon: '🧪',
        category: 'usable',
        goldValue: 0,
        description: 'Estanca sangramentos por 2d10 rodadas. Após o tempo, o ferimento volta a sangrar.',
        recipe: [
            'Folhas de Bálisa',
            'Mofo Verde',
            'Cal'
        ]
    },

    {
        id: 'fissstech',
        name: 'Fissstech',
        icon: '🧪',
        category: 'usable',
        goldValue: 0,
        description: 'Provoca transe eufórico. Serve como anestésico, irá receber apenas metade do dano ao usar e não sofre penalidades relacionadas á dor. Altamente viciante (teste de Resistência ND:20 após cada uso).',
        recipe: [
            '?',
            '?',
            '?'
        ]
    },

    {
        id: 'alucinogeno',
        name: 'Alucinógeno',
        icon: '🧪',
        category: 'usable',
        goldValue: 0,
        description: 'Causa alucinações até o alvo passar em um teste de resistência ND 18. Pode ser jogado ou dissolvido em bebida.',
        recipe: [
            'Seiva Branca',
            'Visco',
            'Pequena Cicuta'
        ]
    },

    {
        id: 'tintainvisivel',
        name: 'Tinta Invisível',
        icon: '🧪',
        category: 'usable',
        goldValue: 0,
        description: 'Permite escrever mensagens invisíveis, visíveis apenas ao serem aquecidas por 1 turno.',
        recipe: [
            'Sempre-viva Anã',
            'Óleo Escurecedor',
            'Pó Espectral'
        ]
    },

    {
        id: 'ervasentorpecentes',
        name: 'Ervas Entorpecentes',
        icon: '🌿',
        category: 'usable',
        goldValue: 0,
        description: 'Aplicadas em ferimentos, aliviam a dor, reduzindo negativos de ferimentos críticos e de estado próximo da morte em 2. Dura 2d10 rodadas.',
        recipe: [
            'Quelidônia',
            'Fruta de Uva-Espim',
            'Pequena Cicuta',
            'Heleboro'
        ]
    },

    {
        id: 'elixirdepantagran',
        name: 'Elixir de Pantagran',
        icon: '🧪',
        category: 'usable',
        goldValue: 0,
        description: 'Provoca alegria delirante por 2 horas. Usuário sofre -2 em Resistir Coerção.',
        recipe: [
            'Essência de Luz',
            'Água Ducal',
            'Pétalas de Mirto Branco'
        ]
    },

    {
        id: 'pocaodeperfume',
        name: 'Poção de Perfume',
        icon: '🧪',
        category: 'usable',
        goldValue: 0,
        description: 'Teste de Tolerância ND:16. Fracasso causa intoxicação por 1d10 horas.',
        recipe: [
            'Folhas de Aloe',
            'Pétalas de Verbena',
            'Água Ducal',
            'Folhas de Balisa'
        ]
    },

    {
        id: 'amigodoenvenenador',
        name: 'Amigo do Envenenador',
        icon: '🧪',
        category: 'usable',
        goldValue: 0,
        description: 'Líquido que torna comidas e bebidas mais apetitosas e realça o cheiro. Aumenta o ND de detectar veneno para 20.',
        recipe: [
            'Folhas de Bálisa',
            'Fruta de Bálisa',
            'Solução de Mercúrio',
            'Mel'
        ]
    },

    {
        id: 'inflamador',
        name: 'Inflamador',
        icon: '💥',
        category: 'usable',
        goldValue: 0,
        description: 'Torna alvos extremamente inflamáveis. 50% de chance de incendiar ao contato com faíscas.',
        recipe: [
            'Óleo Escurecedor',
            'Fósforo',
            'Fogo da Zerikânia'
        ]
    },

    {
        id: 'saisaromaticos',
        name: 'Sais Aromáticos',
        icon: '🧪',
        category: 'usable',
        goldValue: 0,
        description: 'Acorda imediatamente pessoas ou criaturas inconscientes ou atordoadas. Cada frasco permite 25 usos.',
        recipe: [
            'Enxofre',
            'Raiz de Pimenta',
            'Folhas de Aloe'
        ]
    },

    {
        id: 'fluidoesterilizante',
        name: 'Fluido Esterilizante',
        icon: '🧪',
        category: 'usable',
        goldValue: 0,
        description: 'Aumenta a cura de ferimentos e reduz o tempo de recuperação.',
        recipe: [
            'Água Ducal',
            'Pétalas de Ginatía',
            'Água Purificada'
        ]
    },

    {
        id: 'soprodesucubo',
        name: 'Sopro de Súcubo',
        icon: '🧪',
        category: 'usable',
        goldValue: 0,
        description: 'Recebe +2 em Sedução na pele; -5 na Resistência a Sedução na bebida.',
        recipe: [
            'Essência de Luz',
            'Fruta de Uva-Espim',
            'Água Ducal',
            'Alcool Anão'
        ]
    },

    {
        id: 'lagrimasdetalgar',
        name: 'Lágrimas de Talgar',
        icon: '🧪',
        category: 'usable',
        goldValue: 0,
        description: 'Congela imediatamente alvos atingidos. Itens congelados sofrem o dobro de dano de ablação.',
        recipe: [
            'Fragmentos Lunares',
            'Pó Espectral',
            'Água Purificada'
        ]
    },

    {
        id: 'lagrimasdeesposas',
        name: 'Lágrimas de Esposas',
        icon: '🧪',
        category: 'usable',
        goldValue: 0,
        description: 'Cura estados de intoxicação instantaneamente, deixando o usuário sóbrio.',
        recipe: [
            'Pétalas de Heléboro',
            'Água Ducal',
            'Raiz de Pimenta Dioica'
        ]
    },

    {
        id: 'fogodazerikania',
        name: 'Fogo da Zerikânia',
        icon: '💥',
        category: 'usable',
        goldValue: 0,
        description: 'Explode e incendeia tudo que tocar; causa 8d6 de dano de explosão e incendeia por 1d10 turnos. Espalha-se em um círculo de 5m ao ser arremessado; pode ampliar o efeito se usado com algo inflamável.',
        recipe: [
            'Polvora',
            'Óleo Escurecedor',
            'Fósforo',
            'Alcool Anão'
        ]
    },

    {
        id: 'sanguepreto',
        name: 'Sangue Preto',
        icon: '⚱️',
        category: 'usable',
        goldValue: 0,
        description: 'O sangue do bruxo envenena criaturas vampíricas e necrófagas que o beberem, causando 1d6 de dano por rodada até um teste de Tolerância; impede cura natural e exige teste de resistência a cada turno para não ficar atordoado (ND 20).',
        recipe: [
            'Verbena',
            'Espírito Anão',
            'Cogumelo Sewant',
            'Sangue Carníçal'
        ]
    },

    {
        id: 'nevasca',
        name: 'Nevasca',
        icon: '⚱️',
        category: 'usable',
        goldValue: 0,
        description: '1d6 em todos os sentidos, Reflexo, Defesa, Audição, Percepção, Esquiva, Atletismo, Acrobacias, Habilidades com armas como Esgrima etc...',
        recipe: [
            'Mitro Branco',
            'Água Destilada',
            'Cérebro de Afogador',
            'Sangue de Vampiro'
        ]
    },

    {
        id: 'gato',
        name: 'Gato',
        icon: '⚱️',
        category: 'usable',
        goldValue: 0,
        description: 'Nenhuma penalidade por escuridão ou pouca luz; não pode ser hipnotizado; +5 contra ilusões.',
        recipe: [
            'Fruta de Uva-Espim',
            'Água Destilada',
            'Dente de Vampiro'
        ]
    },

    {
        id: 'luacheia',
        name: 'Lua Cheia',
        icon: '⚱️',
        category: 'usable',
        goldValue: 0,
        description: 'Role 1d8. Fornece +10 PV mais o resultado do dado em PV temporários até o fim da duração. Não acumula.',
        recipe: [
            'Água Destilada',
            'Aconito',
            'Saliva de Lobisomem'
        ]
    },

    {
        id: 'papafigo',
        name: 'Papa-figo',
        icon: '⚱️',
        category: 'usable',
        goldValue: 0,
        description: 'Fornece imunidade a venenos e neutraliza quaisquer poções no sistema.',
        recipe: [
            'Água Destilada',
            'Quelidônia',
            'Saliva de Endriga'
        ]
    },

    {
        id: 'baleiaassassina',
        name: 'Baleia Assassina',
        icon: '⚱️',
        category: 'usable',
        goldValue: 0,
        description: 'Aumenta em 50% a habilidade de segurar a respiração e nega penalidades de visão subaquática.',
        recipe: [
            'Água Destilada',
            'Língua de Afogador',
            'Cérebro de Afogador'
        ]
    },

    {
        id: 'bosquedemaribor',
        name: 'Bosque de Maribor',
        icon: '⚱️',
        category: 'usable',
        goldValue: 0,
        description: 'Toda vez que ganhar um dado de adrenalina, adicione um dado extra.',
        recipe: [
            'Água Destilada',
            'Medula Óssea de Carníçal',
            'Raiz de Mandrágora'
        ]
    },

    {
        id: 'filtrodepetri',
        name: 'Filtro de Petri',
        icon: '⚱️',
        category: 'usable',
        goldValue: 0,
        description: 'Recebe +1d6 em Lançar Feitiços, Hexes e Criar Ritual.',
        recipe: [
            'Água Destilada',
            'Pó Infundido',
            'Visco'
        ]
    },

    {
        id: 'andorinha',
        name: 'Andorinha',
        icon: '⚱️',
        category: 'usable',
        goldValue: 0,
        description: 'Regenera 1d6 PV por rodada. Em rodadas em que for atacado, não regenera. Não acumula.',
        recipe: [
            'Água Destilada',
            'Quelidônia',
            'Cérebro de Afogador'
        ]
    },

    {
        id: 'corujadomato',
        name: 'Coruja-do-mato',
        icon: '⚱️',
        category: 'usable',
        goldValue: 0,
        description: 'A cada turno recupera 1d6 de EST.',
        recipe: [
            'Água Destilada',
            'Veneno de Aracna',
            'Raiz de Pimenta Dioica'
        ]
    },

    {
        id: 'trovoada',
        name: 'Trovoada',
        icon: '⚱️',
        category: 'usable',
        goldValue: 0,
        description: 'Role 1d6+3 de dano adicional em ataques físicos.',
        recipe: [
            'Água Destilada',
            'Garra de Carníçal',
            'Fruta Balisa'
        ]
    },

    {
        id: 'melbranco',
        name: 'Mel Branco',
        icon: '⚱️',
        category: 'usable',
        goldValue: 0,
        description: 'Remove toxicidade e todos os efeitos de poções.',
        recipe: [
            'Água Destilada',
            'Madressilva',
            'Hidromel',
            'Mofo Verde'
        ]
    },

    {
        id: 'oleodefera',
        name: 'Óleo de fera',
        icon: '🧴',
        category: 'usable',
        goldValue: 0,
        description: 'Ganha +12 de dano contra feras',
        recipe: [
            'Sebo',
            'Folhas de Aloe',
            'Extrato de Veneno'
        ]
    },

    {
        id: 'oleodeamaldicoado',
        name: 'Óleo de amaldiçoado',
        icon: '🧴',
        category: 'usable',
        goldValue: 0,
        description: 'Ganha +12 de dano contra amaldiçoados',
        recipe: [
            'Verbena',
            'Mofo Verde',
            'Pó de Prata',
            'Mitro Branco'
        ]
    },

    {
        id: 'oleodedraconideo',
        name: 'Óleo de draconídeo',
        icon: '🧴',
        category: 'usable',
        goldValue: 0,
        description: 'Ganha +12 de dano contra draconídeos',
        recipe: [
            'Olhos de Wyvern',
            'Extrato de Veneno',
            'Cogumelos de Esgoto'
        ]
    },

    {
        id: 'oleodeelemental',
        name: 'Óleo de elemental',
        icon: '🧴',
        category: 'usable',
        goldValue: 0,
        description: 'Ganha +12 de dano contra elemental',
        recipe: [
            'Coração de Golem',
            'Folhas de Aloe'
        ]
    },

    {
        id: 'venenodoenforcado',
        name: 'Veneno do Enforcado',
        icon: '🧴',
        category: 'usable',
        goldValue: 0,
        description: 'Ganha +12 de dano contra humanoides',
        recipe: [
            'Pequena Cicuta',
            'Extrato de Veneno'
        ]
    },

    {
        id: 'oleodehibrido',
        name: 'Óleo de híbrido',
        icon: '🧴',
        category: 'usable',
        goldValue: 0,
        description: 'Ganha +12 de dano contra híbrido',
        recipe: [
            'Sempre-viva Anã',
            'Língua de Bruxa Sepulcral'
        ]
    },

    {
        id: 'oleodeinsetoide',
        name: 'Óleo de insetoide',
        icon: '🧴',
        category: 'usable',
        goldValue: 0,
        description: 'Ganha +12 de dano contra insetoides',
        recipe: [
            'Veneno de Aracna',
            'Olhos de Aracna',
            'Extrato de Veneno',
            'Pequena Cicuta'
        ]
    },

    {
        id: 'oleodenecrofago',
        name: 'Óleo de necrófago',
        icon: '🧴',
        category: 'usable',
        goldValue: 0,
        description: 'Ganha +12 de dano contra necrófago',
        recipe: [
            'Extrato de Veneno',
            'Saliva de Vampiro'
        ]
    },

    {
        id: 'oleodeogroide',
        name: 'Óleo de ogroide',
        icon: '🧴',
        category: 'usable',
        goldValue: 0,
        description: 'Ganha +12 de dano contra ogroides',
        recipe: [
            'Bosta de Demônio',
            'Folhas de Aloe'
        ]
    },

    {
        id: 'oleoderelicto',
        name: 'Óleo de relicto',
        icon: '🧴',
        category: 'usable',
        goldValue: 0,
        description: 'Ganha +12 de dano contra relicto',
        recipe: [
            'Ginátia',
            'Sal Mineral Refinado'
        ]
    },

    {
        id: 'oleodeespectro',
        name: 'Óleo de espectro',
        icon: '🧴',
        category: 'usable',
        goldValue: 0,
        description: 'Ganha +12 de dano contra espectro',
        recipe: [
            'Pó de Prata',
            'Essência de Luz'
        ]
    },

    {
        id: 'oleodevampiro',
        name: 'Óleo de vampiro',
        icon: '🧴',
        category: 'usable',
        goldValue: 0,
        description: 'Ganha +12 de dano contra vampiro',
        recipe: [
            'Verbena',
            'Saliva de Lobisomem',
            'Pó de Prata',
            'Sangue de Carniçal'
        ]
    },

    {
        id: 'podelua',
        name: 'Pó de Lua',
        icon: '💥',
        category: 'usable',
        goldValue: 0,
        description: 'Impede que inimigos se tornem intangíveis ou invisíveis; útil contra Espectros e outras aparições, impede regeneração de vida de vampiros e lobisomens.',
        recipe: [
            'Álcool Anão',
            'Pólvora',
            'Pó de Prata'
        ]
    },

    {
        id: 'podedimeritio',
        name: 'Pó de Dimerítio',
        icon: '💥',
        category: 'usable',
        goldValue: 0,
        description: 'Bloqueia habilidades mágicas de inimigos (Elementais, Magos, Bruxas Sepulcrais) e fecha portais.',
        recipe: [
            'Álcool Anão',
            'Pólvora',
            'Pó de Dimerítio'
        ]
    },

    {
        id: 'bafodedragao',
        name: 'Bafo de Dragão',
        icon: '💥',
        category: 'usable',
        goldValue: 0,
        description: 'Cria fumaça inflamável que causa dano extra com Fogo (Igni).',
        recipe: [
            'Álcool Anão',
            'Pólvora',
            'Enxofre',
            'Óleo Escurecedor'
        ]
    },

    {
        id: 'samun',
        name: 'Samun',
        icon: '💥',
        category: 'usable',
        goldValue: 0,
        description: 'Cega inimigos temporariamente, facilitando o combate.',
        recipe: [
            'Álcool Anão',
            'Fósforo',
            'Seiva Branca'
        ]
    },

    {
        id: 'bombadeestilhacos',
        name: 'Bomba de Estilhaços',
        icon: '💥',
        category: 'usable',
        goldValue: 0,
        description: 'Cega inimigos temporariamente, facilitando o combate.',
        recipe: [
            'Álcool Anão',
            'Salitre',
            'Nitrato de Prata',
            'Estilhaços de Ferro',
            'Polvora'
        ]
    },


    // =====================================
    // EQUIPAMENTOS
    // =====================================


    // =====================================
    // ARMAS
    // =====================================


    {
        id: 'flechadeferro',
        name: 'Flecha de Ferro',
        icon: '➶',
        category: 'equipment',
        goldValue: 0.2,
        type: 'weapon',
        weaponType: 'Flechas',
        damage: '0',
        bonus: ' ',
        effect: ' ',
        description: 'Um Kit com 5 Flechas custa 1 Coroa',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'flechadeaco',
        name: 'Flecha de Aço',
        icon: '➶',
        category: 'equipment',
        goldValue: 0.5,
        type: 'weapon',
        weaponType: 'Flechas',
        damage: '1d6 de Dano Adicional',
        bonus: ' ',
        effect: ' ',
        description: '2 Flechas por 1 Coroa.',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'flechadeprata',
        name: 'Flecha de Prata',
        icon: '➶',
        category: 'equipment',
        goldValue: 5,
        type: 'weapon',
        weaponType: 'Flechas',
        damage: 'Dano de Prata',
        bonus: ' ',
        effect: 'Dano de Prata',
        description: '10 Flechas por 50 Coroas.',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'espadadeacodebruxo',
        name: 'Espada de Aço de Bruxo',
        icon: '🗡️',
        category: 'equipment',
        goldValue: 800,
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '4d6+2',
        bonus: ' ',
        effect: ' ',
        description: 'Espada de Duas Mãos',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'espadadeacodebruxo',
        name: 'Espada de Prata de Bruxo',
        icon: '🗡️',
        category: 'equipment',
        goldValue: 800,
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '1d6',
        bonus: ' ',
        effect: '3d6 Dano de Prata',
        description: 'Espada de Duas Mãos',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'espadalongadeferro',
        name: 'Espada Longa de Ferro',
        icon: '🗡️',
        category: 'equipment',
        goldValue: 160,
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '2d6+2',
        bonus: ' ',
        effect: ' ',
        description: 'Espada de Duas Mãos',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'espadadecavaleiro',
        name: 'Espada de Cavaleiro',
        icon: '🗡️',
        category: 'equipment',
        goldValue: 270,
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '2d6+4',
        bonus: ' ',
        effect: ' ',
        description: 'Espada de Uma Mão',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'gleddyf',
        name: 'Gleddyf',
        icon: '🗡️',
        category: 'equipment',
        goldValue: 285,
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '3d6+2',
        bonus: ' ',
        effect: ' ',
        description: 'Espada de Duas Mãos',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'falcionedocacador',
        name: 'Falcione do Caçador',
        icon: '🗡️',
        category: 'equipment',
        goldValue: 325,
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '3d6+2',
        bonus: ' ',
        effect: ' ',
        description: 'Espada de Uma Mão',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'krigsverd',
        name: 'Krigsverd',
        icon: '🗡️',
        category: 'equipment',
        goldValue: 570,
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '4d6+4',
        bonus: '2',
        effect: ' ',
        description: 'Espada de Uma Mão',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'esboda',
        name: 'Esboda',
        icon: '🗡️',
        category: 'equipment',
        goldValue: 650,
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '5d6',
        bonus: '1',
        effect: ' ',
        description: 'Espada de Uma Mão',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'kord',
        name: 'Kord',
        icon: '🗡️',
        category: 'equipment',
        goldValue: 725,
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '5d6',
        bonus: '',
        effect: 'Sangramento 25%',
        description: 'Espada de Uma Mão',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'laminadevicovaro',
        name: 'Lâmina de Vicovaro',
        icon: '🗡️',
        category: 'equipment',
        goldValue: 955,
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '5d6+4',
        bonus: '',
        effect: 'Balanceada',
        description: 'Espada de Duas Mãos',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'torrwr',
        name: 'Torrwr',
        icon: '🗡️',
        category: 'equipment',
        goldValue: 1075,
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '6d6',
        bonus: '',
        effect: 'Sangramento 50%',
        description: 'Espada de Duas Mãos',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'adaga',
        name: 'Adaga',
        icon: '🔪',
        category: 'equipment',
        goldValue: 50,
        type: 'weapon',
        weaponType: 'Lâminas Curtas',
        damage: '1d6+2',
        bonus: '',
        effect: '',
        description: 'Adaga',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'estilete',
        name: 'Estilete',
        icon: '🔪',
        category: 'equipment',
        goldValue: 275,
        type: 'weapon',
        weaponType: 'Lâminas Curtas',
        damage: '1d6',
        bonus: '2',
        effect: 'Porte Velado',
        description: 'Adaga',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'punhal',
        name: 'Punhal',
        icon: '🔪',
        category: 'equipment',
        goldValue: 350,
        type: 'weapon',
        weaponType: 'Lâminas Curtas',
        damage: '2d6+2',
        bonus: '1',
        effect: 'Sangramento 25%',
        description: 'Adaga',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'jambiya',
        name: 'Jambiya',
        icon: '🔪',
        category: 'equipment',
        goldValue: 440,
        type: 'weapon',
        weaponType: 'Lâminas Curtas',
        damage: '2d6+2',
        bonus: '2',
        effect: 'Sangramento 25% / Perfura 4 de Armadura',
        description: 'Adaga',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'machadodemao',
        name: 'Machado de Mão',
        icon: '🪓',
        category: 'equipment',
        goldValue: 205,
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '2d6+1',
        bonus: '',
        effect: '',
        description: 'Machado de Uma Mão',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'machadodebatalha',
        name: 'Machado de Batalha',
        icon: '🪓',
        category: 'equipment',
        goldValue: 525,
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '5d6',
        bonus: '',
        effect: '',
        description: 'Machado de Uma Mão',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'machadoberserker',
        name: 'Machado Berserker',
        icon: '🪓',
        category: 'equipment',
        goldValue: 960,
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '6d6',
        bonus: '',
        effect: 'Ablativa / Sangramento 25%',
        description: 'Machado de Duas Mãos',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'soqueira',
        name: 'Soqueira',
        icon: '👊',
        category: 'equipment',
        goldValue: 50,
        type: 'weapon',
        weaponType: 'Brigar',
        damage: '1d6',
        bonus: '1',
        effect: 'Adiciona a Soco',
        description: 'Soqueira',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'maca',
        name: 'Maça',
        icon: '📏',
        category: 'equipment',
        goldValue: 525,
        type: 'weapon',
        weaponType: 'Brigar',
        damage: '5d6',
        bonus: '',
        effect: '',
        description: 'Maça de Uma Mão',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'martelodasterrasaltas',
        name: 'Martelo das Terras Altas',
        icon: '📏',
        category: 'equipment',
        goldValue: 1100,
        type: 'weapon',
        weaponType: 'Brigar',
        damage: '6d6+2',
        bonus: '',
        effect: 'Atordoamento 25% / Meteorito',
        description: 'Martelo de Duas Mãos',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'lanca',
        name: 'Lança',
        icon: '🔱',
        category: 'equipment',
        goldValue: 375,
        type: 'weapon',
        weaponType: 'Cajado/Lança',
        damage: '3d6',
        bonus: '1',
        effect: '',
        description: 'Lança de Duas Mãos',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'achadearma',
        name: 'Acha de Arma',
        icon: '🔱',
        category: 'equipment',
        goldValue: 460,
        type: 'weapon',
        weaponType: 'Cajado/Lança',
        damage: '4d6+2',
        bonus: '',
        effect: '',
        description: 'Lança de Duas Mãos',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'alabardavermelha',
        name: 'Alabarda Vermelha',
        icon: '🔱',
        category: 'equipment',
        goldValue: 865,
        type: 'weapon',
        weaponType: 'Cajado/Lança',
        damage: '6d6+3',
        bonus: '',
        effect: '',
        description: 'Lança de Duas Mãos',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'cajado',
        name: 'Cajado',
        icon: '🦯',
        category: 'equipment',
        goldValue: 335,
        type: 'weapon',
        weaponType: 'Cajado/Lança',
        damage: '1d6+2',
        bonus: '',
        effect: 'Foco 1',
        description: 'Cajado de Duas Mãos',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'cajadodepastor',
        name: 'Cajado de Pastor',
        icon: '🦯',
        category: 'equipment',
        goldValue: 550,
        type: 'weapon',
        weaponType: 'Cajado/Lança',
        damage: '2d6',
        bonus: '',
        effect: 'Foco 1 / Agarradora',
        description: 'Cajado de Duas Mãos',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'cajadodeferro',
        name: 'Cajado de Ferro',
        icon: '🦯',
        category: 'equipment',
        goldValue: 675,
        type: 'weapon',
        weaponType: 'Cajado/Lança',
        damage: '3d6',
        bonus: '',
        effect: 'Foco 2 / Atordoamento 50%',
        description: 'Cajado de Duas Mãos',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'cajadodecristal',
        name: 'Cajado de Cristal',
        icon: '🦯',
        category: 'equipment',
        goldValue: 835,
        type: 'weapon',
        weaponType: 'Cajado/Lança',
        damage: '2d6+2',
        bonus: '',
        effect: 'Foco 3 / Foco Maior',
        description: 'Cajado de Duas Mãos',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'arcocurto',
        name: 'Arco Curto',
        icon: '🏹',
        category: 'equipment',
        goldValue: 290,
        type: 'weapon',
        weaponType: 'Arco e Flecha',
        damage: '3d6+3',
        bonus: '',
        effect: '10 Quadros',
        description: 'Arco',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'arcolongo',
        name: 'Arco Longo',
        icon: '🏹',
        category: 'equipment',
        goldValue: 475,
        type: 'weapon',
        weaponType: 'Arco e Flecha',
        damage: '4d6',
        bonus: '',
        effect: '20 Quadros',
        description: 'Arco',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'arcodeguerra',
        name: 'Arco de Guerra',
        icon: '🏹',
        category: 'equipment',
        goldValue: 835,
        type: 'weapon',
        weaponType: 'Arco e Flecha',
        damage: '6d6',
        bonus: '',
        effect: '30 Quadros',
        description: 'Arco',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'bestademão',
        name: 'Besta de Mão',
        icon: '🏹',
        category: 'equipment',
        goldValue: 285,
        type: 'weapon',
        weaponType: 'Arco e Flecha',
        damage: '2d6+2',
        bonus: '1',
        effect: '10 Quadros',
        description: 'Besta de Uma Mão',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'besta',
        name: 'Besta',
        icon: '🏹',
        category: 'equipment',
        goldValue: 455,
        type: 'weapon',
        weaponType: 'Arco e Flecha',
        damage: '4d6+2',
        bonus: '1',
        effect: '15 Quadros',
        description: 'Besta',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'besta',
        name: 'Besta de Caçador de Monstros',
        icon: '🏹',
        category: 'equipment',
        goldValue: 1125,
        type: 'weapon',
        weaponType: 'Arco e Flecha',
        damage: '6d6',
        bonus: '1',
        effect: '20 Quadros',
        description: 'Besta',
        recipe: [
            '',
            '',
            ''
        ]
    },


    // =====================================
    // ARMADURAS
    // =====================================

    {
        id: 'leather_armor',
        name: 'Armadura de Couro',
        icon: '🛡️',
        category: 'equipment',
        goldValue: 0,
        type: 'armor',
        weaponType: 'Armadura Leve',
        defense: 8,
        bonus: ' ',
        description: 'Armadura leve.',
        recipe: [
            '',
            '',
            ''
        ]
    },

    // =====================================
    // ETC
    // =====================================

    {
        id: 'gem',
        name: 'Gema',
        icon: '💎',
        category: 'misc',
        goldValue: 0,
        description: 'Item raro.',
        recipe: []
    }
];

// =========================================
// INVENTÁRIO
// =========================================

let inventory = [];
let selectedInventoryItemId = null;
let longPressTimer = null;

function addInventoryItemFromModal(itemId) {

    addItem(itemId);

    closeInventoryModal();
}

// =========================================
// RENDER INVENTÁRIO
// =========================================

function renderInventory() {

    const container =
        document.getElementById('inventoryList');

    if (!container) return;

    container.innerHTML = '';

    const filteredInventory = inventory.filter(
        item => item.category === currentInventoryFilter
    );

    if (filteredInventory.length === 0) {

        container.innerHTML = `

            <div class="text-center text-slate-500 mt-10">

                Inventário vazio

            </div>
        `;

        return;
    }

    filteredInventory.forEach(item => {

        container.innerHTML += `
    
            <div
    
                ontouchstart="startItemLongPress('${item.id}')"

                ontouchend="handleItemTouchEnd('${item.id}')"

                
    
                class="inventory-card
                       cursor-pointer
    
                       ${selectedInventoryItemId === item.id
                           ? 'ring-2 ring-cyan-400'
                           : ''}">
    
                <div class="flex
                            justify-between
                            items-center">
    
                    <div>

                        <div class="text-lg font-bold">

                            ${item.icon} ${item.name}

                        </div>

                        <div class="text-sm text-slate-400 mt-1">

                            ${item.type === 'weapon'
                                ? `⚔️ ${item.damage} DMG`
                                : ''}

                            ${item.type === 'armor'
                                ? `🛡️ ${item.defense} DEF`
                                : ''}

                        </div>

                    </div>
    
                    <div class="text-cyan-400
                                text-xl
                                font-bold">
    
                        x${item.quantity}
    
                    </div>
    
                </div>
    
            </div>
        `;
    });
}

// =========================================
// ADICIONAR ITEM
// =========================================

function addItem(itemId) {

    const existing =
        inventory.find(i => i.id === itemId);

    if (existing) {

        existing.quantity++;

    } else {

        const base =
            predefinedItems.find(i => i.id === itemId);

        if (!base) return;

        inventory.push({

            ...base,

            quantity: 1
        });
    }

    saveInventory();

    renderInventory();
}

// =========================================
// USAR ITEM
// =========================================

function useItem(itemId) {

    const item =
        inventory.find(i => i.id === itemId);

    if (!item) return;

    item.quantity--;

    // remove automaticamente
    if (item.quantity <= 0) {

        inventory =
            inventory.filter(i => i.id !== itemId);
    }

    saveInventory();

    renderInventory();
}

// =========================================
// STORAGE
// =========================================

function saveInventory() {

    localStorage.setItem(
        'inventory',
        JSON.stringify(inventory)
    );
}

function loadInventory() {

    const saved =
        localStorage.getItem('inventory');

    if (!saved) return;

    inventory = JSON.parse(saved);
}

// =========================================
// MODAL
// =========================================

function openInventoryModal() {

    document
        .getElementById('inventoryModal')
        .classList.remove('hidden');

    renderInventoryItemsModal();
}

function closeInventoryModal() {

    document
        .getElementById('inventoryModal')
        .classList.add('hidden');
}

// =========================================
// RENDER MODAL ITENS
// =========================================

function renderInventoryItemsModal() {

    const container =
        document.getElementById('inventoryItemsList');

    container.innerHTML = '';

    predefinedItems.forEach(item => {

        if (item.category !== currentInventoryFilter) {
            return;
        }

        container.innerHTML += `

        <button
    
            onclick="addInventoryItemFromModal('${item.id}')"

                class="w-full
                       bg-slate-800
                       hover:bg-slate-700
                       text-white
                       rounded-xl
                       p-4
                       flex
                       justify-between
                       items-center">

                <div>

    <div>

        ${item.icon} ${item.name}

    </div>

    <div class="text-sm text-slate-400">

        ${item.type === 'weapon'
            ? `⚔️ ${item.damage} DMG`
            : ''}

        ${item.type === 'armor'
            ? `🛡️ ${item.defense} DEF`
            : ''}

    </div>

</div>

                <span class="text-cyan-400">

                    Adicionar

                </span>

            </button>
        `;
    });
}

function selectInventoryItem(itemId) {

    selectedInventoryItemId = itemId;

    renderInventory();
}


// =========================================
// INIT
// =========================================

window.addEventListener('load', () => {

    loadInventory();

    setInventoryFilter('usable');

    const btn =
        document.getElementById(
            'openInventoryModalBtn'
        );

    if (btn) {

        btn.addEventListener(
            'click',
            openInventoryModal
        );
    }
});

function increaseSelectedItem() {

    if (!selectedInventoryItemId) return;

    addItem(selectedInventoryItemId);
}

function decreaseSelectedItem() {

    if (!selectedInventoryItemId) return;

    const item =
        inventory.find(
            i => i.id === selectedInventoryItemId
        );

    if (!item) return;

    item.quantity--;

    // remove automaticamente
    if (item.quantity <= 0) {

        inventory =
            inventory.filter(
                i => i.id !== selectedInventoryItemId
            );

        selectedInventoryItemId = null;
    }

    saveInventory();

    renderInventory();
}


// =========================================
// HOLD QUANTIDADE INVENTÁRIO
// =========================================

let inventoryQuantityTimer = null;
let inventoryQuantityHold = false;
let inventoryTouchUsed = false;

// =========================================
// +
// =========================================

function startInventoryIncreaseHold(event) {

    // evita mouse duplicado após touch
    if (event.type === 'mousedown' && inventoryTouchUsed) {
        return;
    }

    if (event.type === 'touchstart') {
        inventoryTouchUsed = true;
    }

    inventoryQuantityHold = false;

    inventoryQuantityTimer = setTimeout(() => {

        inventoryQuantityHold = true;

        for (let i = 0; i < 10; i++) {

            increaseSelectedItem();
        }

    }, 500);
}

function endInventoryIncreaseHold(event) {

    if (event.type === 'mouseup' && inventoryTouchUsed) {
        return;
    }

    clearTimeout(inventoryQuantityTimer);

    // clique rápido = +1
    if (!inventoryQuantityHold) {

        increaseSelectedItem();
    }

    setTimeout(() => {

        inventoryTouchUsed = false;

    }, 50);
}

// =========================================
// -
// =========================================

function startInventoryDecreaseHold(event) {

    if (event.type === 'mousedown' && inventoryTouchUsed) {
        return;
    }

    if (event.type === 'touchstart') {
        inventoryTouchUsed = true;
    }

    inventoryQuantityHold = false;

    inventoryQuantityTimer = setTimeout(() => {

        inventoryQuantityHold = true;

        for (let i = 0; i < 10; i++) {

            decreaseSelectedItem();
        }

    }, 500);
}

function endInventoryDecreaseHold(event) {

    if (event.type === 'mouseup' && inventoryTouchUsed) {
        return;
    }

    clearTimeout(inventoryQuantityTimer);

    // clique rápido = -1
    if (!inventoryQuantityHold) {

        decreaseSelectedItem();
    }

    setTimeout(() => {

        inventoryTouchUsed = false;

    }, 50);
}
