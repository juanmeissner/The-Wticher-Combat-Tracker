let wasLongPress = false;

function handleItemTouchEnd(itemId) {

    cancelItemLongPress();

    if (wasLongPress) return;

    selectInventoryItem(itemId);
}

function renderIcon(icon, className = 'item-icon') {

    if (!icon) return '';

    const isImage =
        icon.includes('.png') ||
        icon.includes('.jpg') ||
        icon.includes('.jpeg') ||
        icon.includes('.webp') ||
        icon.includes('.svg') ||
        icon.startsWith('http') ||
        icon.startsWith('assets/');

    if (isImage) {

        return `
            <img
                src="${icon}"
                class="${className}"
                draggable="false"
            >
        `;
    }

    return `
        <span class="${className}">
            ${icon}
        </span>
    `;
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

        ${renderIcon(item.icon)}

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
    
 <div class="flex items-center gap-3">

    ${renderIcon(item.icon)}

    <div class="flex flex-col">

        <div class="text-lg font-bold leading-tight">

            ${item.name}

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

    // texto da busca
    const search =
        document.getElementById('inventorySearchInput')
            ?.value
            .toLowerCase() || '';

    // filtra categoria + nome
    const filteredItems =
        predefinedItems.filter(item => {

            const sameCategory =
                item.category === currentInventoryFilter;

            const matchesSearch =
                item.name
                    .toLowerCase()
                    .includes(search);

            return sameCategory && matchesSearch;
        });

    // vazio
    if (filteredItems.length === 0) {

        container.innerHTML = `

            <div class="text-center text-slate-500 py-6">

                Nenhum item encontrado

            </div>
        `;

        return;
    }

    filteredItems.forEach(item => {

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
                   items-center
                   transition-all">

            <div class="flex items-center gap-3">

                ${renderIcon(item.icon)}

                <div class="text-left">

                    <div class="font-bold">

                        ${item.name}

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

            </div>

            <span class="text-cyan-400 font-bold">

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
