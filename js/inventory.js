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
        description: 'Envenena se ingerido ou em contato com sangue. Teste de Tolerância ND:18 para resistir.',
        recipe: [
            'Extrato de Veneno',
            'Raiz de Mandrágora',
            'Pequena Cicuta'
        ]
    },

    {
        id: 'venenonegro',
        name: 'Veneno Negro',
        icon: '🧪',
        category: 'usable',
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
        description: 'A cada turno recupera 1d6 de EST.',
        recipe: [
            'Água Destilada',
            'Veneno de Aracna',
            'Raiz de Pimenta Dioica'
        ]
    },

    // =====================================
    // EQUIPAMENTOS
    // =====================================

    {
        id: 'iron_sword',
        name: 'Espada de Ferro',
        icon: '🗡️',
        category: 'equipment',
        type: 'weapon',
        damage: 12,
        description: 'Uma espada simples.',
        recipe: [
            '2x Ferro',
            '1x Madeira'
        ]
    },

    {
        id: 'leather_armor',
        name: 'Armadura de Couro',
        icon: '🛡️',
        category: 'equipment',
        type: 'armor',
        defense: 8,
        description: 'Armadura leve.',
        recipe: [
            '3x Couro'
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
    
                    <div class="text-lg font-bold">
    
                        ${item.icon} ${item.name}
    
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