let wasLongPress = false;
let pendingInventoryAcquisitionItemId = null;

function escapeInventoryHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function getInventoryCatalogItem(itemId) {
    return predefinedItems.find(entry => String(entry.id) === String(itemId)) || null;
}

function getInventoryDisplayItem(item) {
    const catalogItem = getInventoryCatalogItem(item?.id);
    if (!catalogItem) return item;

    return {
        ...catalogItem,
        ...item,
        description: String(item?.description || catalogItem.description || '').trim(),
        shortDescription: String(item?.shortDescription || catalogItem.shortDescription || '').trim(),
        recipe: Array.isArray(item?.recipe) && item.recipe.length
            ? item.recipe
            : (Array.isArray(catalogItem.recipe) ? catalogItem.recipe : [])
    };
}

function getTransportItemDetailFacts(item) {
    const transportKind = window.getTransportItemKind?.(item)
        || String(item?.transportKind || item?.type || '').toLowerCase();
    const facts = [];
    const hp = Math.max(0, Number(item?.hp) || 0);
    const movement = Math.max(0, Number(item?.movement) || 0);
    const capacity = Math.max(0, Number(item?.capacity) || 0);
    const requiredMounts = Math.max(0, Number(item?.requiredMounts) || 0);
    const movementModifier = Number(item?.movementModifier) || 0;
    const defense = Math.max(0, Number(item?.defense) || 0);

    if (transportKind === 'mount') {
        if (hp) facts.push(`❤️ ${hp} HP máximo`);
        if (movement) facts.push(`👣 ${movement} de Movimento`);
        facts.push('🧳 Capacidade liberada por alforjes');
    }

    if (transportKind === 'vehicle') {
        if (hp) facts.push(`❤️ ${hp} HP máximo`);
        if (capacity) facts.push(`📦 Capacidade: ${capacity} de peso`);
        if (requiredMounts) facts.push(`🐎 Exige ${requiredMounts} ${requiredMounts === 1 ? 'cavalo' : 'cavalos'}`);
    }

    if (transportKind === 'mount-gear') {
        if (String(item?.mountSlot || '') === 'saddlebags' && capacity) {
            facts.push(`📦 Concede ${capacity} de capacidade de carga`);
        }
        if (defense) facts.push(`🛡️ Absorção de dano: ${defense}`);
    }

    if (movementModifier) {
        facts.push(`👣 Movimento: ${movementModifier > 0 ? '+' : ''}${movementModifier}`);
    }

    return facts;
}

function renderTransportItemDetailFacts(item) {
    const facts = getTransportItemDetailFacts(item);
    return facts.map(fact => `<span>${escapeInventoryHtml(fact)}</span>`).join('');
}

function handleItemTouchEnd(itemId) {

    cancelItemLongPress();

    // IGNORA toque vindo dos botões + e -
    if (ignoreNextInventoryTouch) {

        ignoreNextInventoryTouch = false;

        return;
    }

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

        // ITEM ESPECIAL
        if (itemId === 'coroa') {

            openCrownEditor();

            return;
        }

        showItemDetails(itemId);

    }, 500);
}

function openCrownEditor() {

    const crown =
        inventory.find(i => i.id === 'coroa');

    if (!crown) return;

    const currentValue =
        crown.moneyValue || 0;

    const newValue = prompt(
        'Digite a quantidade de Coroas:',
        currentValue
    );

    if (newValue === null) return;

    const parsed =
        parseInt(newValue);

    if (isNaN(parsed) || parsed < 0) {

        showToast('❌ Valor inválido');

        return;
    }

    crown.moneyValue = parsed;

    saveInventory();

    renderInventory();

    showToast(
        `👑 Coroas atualizadas: ${parsed}`
    );
}

function cancelItemLongPress() {

    clearTimeout(longPressTimer);
}

function setInventoryFilter(category) {

    currentInventoryFilter = category;

    if (!inventorySubfilterByCategory[category]) {
        inventorySubfilterByCategory[category] = 'all';
    }

    updateInventoryTabs();

    // =====================================
    // AUTO SELECIONA PRIMEIRO ITEM
    // =====================================

    const filteredItems = category === 'crafting'
        ? []
        : getFilteredInventoryItems();

    if (filteredItems.length > 0) {

        selectedInventoryItemId =
            filteredItems[0].id;

    } else {

        selectedInventoryItemId = null;
    }

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

    const inventoryItem =
        inventory.find(i => i.id === itemId);

    if (!inventoryItem) return;

    pendingInventoryAcquisitionItemId = null;
    const item = getInventoryDisplayItem(inventoryItem);
    const catalogItem = getInventoryCatalogItem(item.id) || item;
    const itemUnitWeight = window.getEquipmentItemWeight?.(catalogItem) || Math.max(0, Number(catalogItem.weight) || 0);

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
        
                        💰 ${item.goldValue} Coroas
        
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

                    🛡️ ${window.getEquipmentDefenseLabel?.(item) || item.defense} DEF

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

            ${item.type === 'armor' && window.getEquipmentSlotLabel?.(item)
                ? `
                    <div class="text-cyan-300 mb-2">
                        📍 ${window.getEquipmentSlotLabel(item)}
                    </div>
                `
                : ''}

            <div class="text-slate-400 mb-2">
                ⚖️ Peso unitário: ${itemUnitWeight}
                ${['mount', 'vehicle'].includes(window.getTransportItemKind?.(catalogItem)) ? ' · não entra na carga pessoal' : ''}
            </div>

            ${getTransportItemDetailFacts(catalogItem).length
                ? `<div class="item-details-facts mb-4">${renderTransportItemDetailFacts(catalogItem)}</div>`
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

            ${catalogItem.potion
                ? `
                    <div class="text-lime-300 mb-3">
                        ☣ Toxicidade: ${Math.max(0, Number(catalogItem.toxicity) || 0)}%
                        ${catalogItem.clearsToxicity ? ' · remove toda a toxicidade e efeitos de poções' : ''}
                    </div>
                `
                : ''}

            ${catalogItem.careConsumable
                ? `
                    <div class="text-amber-300 mb-3">
                        ${catalogItem.careConsumable.kind === 'food' ? '🍽️ Alimento' : '🥤 Bebida'}
                        · ${Math.max(1, Number(catalogItem.careConsumable.portionsPerUnit) || 1)} porção por unidade
                        ${catalogItem.careConsumable.kind === 'food'
                            ? ` · ${window.careServices?.CARE_CATALOG?.food?.options?.find(option => option.id === catalogItem.careConsumable.optionId)?.name || 'Alimentação'}`
                            : ' · não substitui uma refeição'}
                    </div>
                `
                : ''}

        <div class="text-slate-300 mb-4">

            ${escapeInventoryHtml(item.description || 'Nenhuma descrição cadastrada para este item.')}

        </div>

        <div class="font-bold mb-2">

            Receita

        </div>

        <div class="space-y-1">

            ${(Array.isArray(item.recipe) ? item.recipe : []).length > 0

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

        ${window.renderEquipmentDetailsAction?.(item) || ''}
        ${window.renderTransportDetailsAction?.(item) || ''}
    `;

    document
        .getElementById('itemDetailsModal')
        .classList.remove('hidden');
}

function getInventoryCrownBalance() {
    return Math.max(0, Number(inventory.find(item => item.id === 'coroa')?.moneyValue) || 0);
}

function getInventoryAcquisitionPackSize(item) {
    return Math.max(1, Math.floor(Number(item?.acquisitionPackSize) || 1));
}

function getInventoryAcquisitionUnitLabel(item, quantity = 1) {
    const label = String(item?.acquisitionUnitLabel || 'unidade').trim() || 'unidade';
    return Number(quantity) === 1 ? label : `${label}s`;
}

function getInventoryAcquisitionContentLabel(item) {
    return String(item?.acquisitionContentLabel || 'unidades').trim() || 'unidades';
}

function renderCatalogItemAcquisition(item) {
    if (item.id === 'coroa') {
        return `
            <section class="item-acquisition-panel">
                <strong>👑 Moeda do personagem</strong>
                <p>As Coroas são ajustadas diretamente no inventário do personagem.</p>
            </section>
        `;
    }

    const owner = window.getCharacterCollectionOwner?.();
    const ownerName = owner?.name || 'inventário atual';
    const suggestedPrice = Math.max(0, Math.round(Number(item.goldValue) || 0));
    const packSize = getInventoryAcquisitionPackSize(item);
    const usesPack = packSize > 1;

    return `
        <section class="item-acquisition-panel" aria-labelledby="itemAcquisitionTitle">
            <div class="item-acquisition-heading">
                <div>
                    <small>AQUISIÇÃO</small>
                    <strong id="itemAcquisitionTitle">Adicionar para ${escapeInventoryHtml(ownerName)}</strong>
                </div>
                <span>👑 ${getInventoryCrownBalance()} Coroas</span>
            </div>

            <label class="item-acquisition-field">
                <span>${usesPack ? 'Quantidade de kits' : 'Quantidade'}</span>
                <input id="itemAcquisitionQuantity" type="number" min="1" step="1" value="1" inputmode="numeric" oninput="updateInventoryAcquisitionSummary()">
                ${usesPack ? `<small>Cada kit adiciona ${packSize} ${getInventoryAcquisitionContentLabel(item)} ao inventário.</small>` : ''}
            </label>

            <label class="item-acquisition-purchase-toggle">
                <input id="itemAcquisitionPurchase" type="checkbox" onchange="updateInventoryAcquisitionSummary()">
                <span><strong>Este item está sendo comprado</strong><small>Ative para debitar as Coroas do personagem.</small></span>
            </label>

            <label class="item-acquisition-field">
                <span>${usesPack ? 'Preço por kit em Coroas' : 'Preço unitário em Coroas'}</span>
                <input id="itemAcquisitionUnitPrice" type="number" min="0" step="1" value="${suggestedPrice}" inputmode="numeric" disabled oninput="updateInventoryAcquisitionSummary()">
            </label>

            <div id="itemAcquisitionSummary" class="item-acquisition-summary" aria-live="polite"></div>
            <button type="button" class="item-acquisition-confirm" onclick="confirmInventoryItemAcquisition()">
                Adicionar ao inventário
            </button>
        </section>
    `;
}

function showCatalogItemDetails(itemId) {
    const catalogItem = getInventoryCatalogItem(itemId);
    if (!catalogItem) return;

    pendingInventoryAcquisitionItemId = catalogItem.id;
    const itemUnitWeight = window.getEquipmentItemWeight?.(catalogItem)
        || Math.max(0, Number(catalogItem.weight) || 0);
    const acquisitionPackSize = getInventoryAcquisitionPackSize(catalogItem);
    const recipe = Array.isArray(catalogItem.recipe) ? catalogItem.recipe.filter(Boolean) : [];
    const content = document.getElementById('itemDetailsContent');

    content.innerHTML = `
        <div class="item-details-header">
            ${renderIcon(catalogItem.icon, 'item-details-icon')}
            <div>
                <small>${escapeInventoryHtml(catalogItem.category === 'equipment' ? 'EQUIPAMENTO' : catalogItem.category === 'usable' ? 'USÁVEL' : 'ITEM')}</small>
                <h2>${escapeInventoryHtml(catalogItem.name)}</h2>
            </div>
        </div>
        <div class="item-details-facts">
            <span>⚖️ ${itemUnitWeight} de peso</span>
            <span>👑 ${Math.max(0, Number(catalogItem.goldValue) || 0)} Coroas${acquisitionPackSize > 1 ? ` por kit com ${acquisitionPackSize} ${getInventoryAcquisitionContentLabel(catalogItem)}` : ''}</span>
            ${catalogItem.damage ? `<span>⚔️ ${escapeInventoryHtml(catalogItem.damage)}</span>` : ''}
            ${catalogItem.defense ? `<span>🛡️ ${escapeInventoryHtml(window.getEquipmentDefenseLabel?.(catalogItem) || catalogItem.defense)} DEF</span>` : ''}
            ${catalogItem.weaponType ? `<span>🏷️ ${escapeInventoryHtml(catalogItem.weaponType)}</span>` : ''}
            ${window.getEquipmentSlotLabel?.(catalogItem) ? `<span>📍 ${escapeInventoryHtml(window.getEquipmentSlotLabel(catalogItem))}</span>` : ''}
            ${renderTransportItemDetailFacts(catalogItem)}
        </div>
        <section class="item-details-section">
            <h3>Descrição</h3>
            <p>${escapeInventoryHtml(catalogItem.description || catalogItem.shortDescription || 'Nenhuma descrição cadastrada para este item.')}</p>
        </section>
        ${catalogItem.bonus ? `<section class="item-details-section"><h3>Bônus</h3><p>${escapeInventoryHtml(catalogItem.bonus)}</p></section>` : ''}
        ${catalogItem.effect ? `<section class="item-details-section"><h3>Efeito</h3><p>${escapeInventoryHtml(catalogItem.effect)}</p></section>` : ''}
        ${catalogItem.potion ? `<section class="item-details-section"><h3>Toxicidade</h3><p>${Math.max(0, Number(catalogItem.toxicity) || 0)}%</p></section>` : ''}
        <section class="item-details-section">
            <h3>Receita</h3>
            ${recipe.length ? `<ul>${recipe.map(entry => `<li>${escapeInventoryHtml(entry)}</li>`).join('')}</ul>` : '<p>Não possui receita cadastrada.</p>'}
        </section>
        ${renderCatalogItemAcquisition(catalogItem)}
    `;

    document.getElementById('itemDetailsModal').classList.remove('hidden');
    updateInventoryAcquisitionSummary();
}

function updateInventoryAcquisitionSummary() {
    const item = getInventoryCatalogItem(pendingInventoryAcquisitionItemId);
    const summary = document.getElementById('itemAcquisitionSummary');
    if (!item || !summary) return;

    const quantityInput = document.getElementById('itemAcquisitionQuantity');
    const purchaseInput = document.getElementById('itemAcquisitionPurchase');
    const unitPriceInput = document.getElementById('itemAcquisitionUnitPrice');
    const quantity = Math.max(1, Math.floor(Number(quantityInput?.value) || 1));
    const packSize = getInventoryAcquisitionPackSize(item);
    const acquiredQuantity = quantity * packSize;
    const purchased = Boolean(purchaseInput?.checked);
    const unitPrice = Math.max(0, Math.round(Number(unitPriceInput?.value) || 0));
    const total = purchased ? quantity * unitPrice : 0;

    if (quantityInput) quantityInput.value = quantity;
    if (unitPriceInput) unitPriceInput.disabled = !purchased;

    summary.classList.toggle('is-insufficient', total > getInventoryCrownBalance());
    const packSummary = packSize > 1
        ? `<small>${quantity} ${getInventoryAcquisitionUnitLabel(item, quantity)} = ${acquiredQuantity} ${getInventoryAcquisitionContentLabel(item)} adicionadas.</small>`
        : '';
    summary.innerHTML = total > 0
        ? `<span>Total da compra</span><strong>${total} Coroas</strong>${packSummary}<small>Saldo depois da compra: ${getInventoryCrownBalance() - total}</small>`
        : `<span>Aquisição gratuita</span><strong>0 Coroas</strong>${packSummary}<small>Nenhuma Coroa será removida.</small>`;
}

function addItemQuantity(itemId, requestedQuantity = 1, showMessage = true, persist = true) {
    const amount = Math.max(1, Math.floor(Number(requestedQuantity) || 1));
    const existing = inventory.find(item => item.id === itemId);
    const base = getInventoryCatalogItem(itemId);
    if (!existing && !base) return null;

    if (existing) {
        if (existing.id === 'coroa') existing.moneyValue = Math.max(0, Number(existing.moneyValue) || 0) + amount;
        else existing.quantity = Math.max(0, Number(existing.quantity) || 0) + amount;
    } else {
        inventory.push({
            ...base,
            quantity: amount,
            moneyValue: itemId === 'coroa' ? amount : undefined
        });
    }

    const result = inventory.find(item => item.id === itemId);
    window.synchronizeTransportAssets?.(window.getCharacterCollectionOwner?.());
    if (persist) {
        saveInventory();
        renderInventory();
    }
    if (showMessage) showToast(`🎒 ${result.name} adicionado! (x${amount})`);
    return result;
}

function acquireInventoryItem(itemId, requestedQuantity = 1, options = {}) {
    const item = getInventoryCatalogItem(itemId);
    if (!item || item.id === 'coroa') return { acquired: false, reason: 'invalid-item' };

    const acquisitionUnits = Math.max(1, Math.floor(Number(requestedQuantity) || 1));
    const packSize = getInventoryAcquisitionPackSize(item);
    const quantity = acquisitionUnits * packSize;
    const purchased = Boolean(options.purchased);
    const unitPrice = Math.max(0, Math.round(Number(options.unitPrice) || 0));
    const total = purchased ? acquisitionUnits * unitPrice : 0;
    const crown = inventory.find(entry => entry.id === 'coroa');
    const balance = Math.max(0, Number(crown?.moneyValue) || 0);

    if (total > balance) {
        return { acquired: false, reason: 'insufficient-crowns', required: total, balance };
    }

    if (total > 0) crown.moneyValue = balance - total;
    addItemQuantity(item.id, quantity, false, false);
    saveInventory();
    renderInventory();

    const owner = window.getCharacterCollectionOwner?.();
    const acquisitionLabel = total > 0 ? 'comprou' : 'adquiriu';
    window.addCombatHistoryEntry?.(
        `${owner?.name || 'Inventário'} ${acquisitionLabel} ${item.name} x${quantity}`,
        total > 0
            ? `${packSize > 1 ? `${acquisitionUnits} ${getInventoryAcquisitionUnitLabel(item, acquisitionUnits)} · ${packSize} ${getInventoryAcquisitionContentLabel(item)} por kit\n` : ''}Preço ${packSize > 1 ? 'por kit' : 'unitário'}: ${unitPrice} Coroas\nTotal debitado: ${total} Coroas\nSaldo: ${balance} > ${balance - total}`
            : `${packSize > 1 ? `${acquisitionUnits} ${getInventoryAcquisitionUnitLabel(item, acquisitionUnits)} · ${packSize} ${getInventoryAcquisitionContentLabel(item)} por kit\n` : ''}Aquisição gratuita · nenhuma Coroa foi debitada.`,
        {
            type: 'item',
            actor: owner ? { id: owner.id, name: owner.name } : null,
            target: owner ? { id: owner.id, name: owner.name } : null,
            participants: owner ? [{ id: owner.id, name: owner.name }] : [],
            item: { id: item.id, name: item.name, quantity, acquisitionUnits, packSize, unitPrice, total }
        }
    );

    return {
        acquired: true,
        itemId: item.id,
        quantity,
        acquisitionUnits,
        packSize,
        unitPrice,
        total,
        balanceAfter: balance - total
    };
}

function confirmInventoryItemAcquisition() {
    const quantity = document.getElementById('itemAcquisitionQuantity')?.value;
    const purchased = Boolean(document.getElementById('itemAcquisitionPurchase')?.checked);
    const unitPrice = document.getElementById('itemAcquisitionUnitPrice')?.value;
    const result = acquireInventoryItem(pendingInventoryAcquisitionItemId, quantity, { purchased, unitPrice });

    if (!result.acquired) {
        if (result.reason === 'insufficient-crowns') {
            showToast(`❌ Coroas insuficientes: possui ${result.balance} e precisa de ${result.required}.`);
        } else {
            showToast('❌ Não foi possível adicionar este item.');
        }
        return;
    }

    const item = getInventoryCatalogItem(result.itemId);
    const quantityLabel = result.packSize > 1
        ? `${result.acquisitionUnits} ${getInventoryAcquisitionUnitLabel(item, result.acquisitionUnits)} (${result.quantity} unidades)`
        : `x${result.quantity}`;
    closeItemDetailsModal();
    showToast(result.total > 0
        ? `🛒 ${item.name}: ${quantityLabel} por ${result.total} Coroas.`
        : `🎒 ${item.name}: ${quantityLabel} adicionado gratuitamente.`);
}

function closeItemDetailsModal() {

    pendingInventoryAcquisitionItemId = null;

    document
        .getElementById('itemDetailsModal')
        .classList.add('hidden');
}

// =========================================
// ITENS PRÉ DEFINIDOS
// =========================================
let currentInventoryFilter = 'usable';
const inventorySubfilterByCategory = {
    usable: 'all',
    equipment: 'all',
    misc: 'all'
};


// =========================================
// INVENTÁRIO
// =========================================

let inventory = [];
let selectedInventoryItemId = null;
let longPressTimer = null;
let ignoreNextInventoryTouch = false;

function getCurrentInventorySubfilter() {
    return inventorySubfilterByCategory[currentInventoryFilter] || 'all';
}

function getFilteredInventoryItems(source = inventory) {
    const filterId = getCurrentInventorySubfilter();
    const filterSystem = window.inventoryFilterSystem;

    return source
        .filter(item => filterSystem
            ? filterSystem.matches(item, currentInventoryFilter, filterId)
            : item.category === currentInventoryFilter)
        .sort(sortInventoryItems);
}

function getInventorySubfilterCount(source, filterId) {
    const filterSystem = window.inventoryFilterSystem;

    return source.filter(item => filterSystem
        ? filterSystem.matches(item, currentInventoryFilter, filterId)
        : item.category === currentInventoryFilter).length;
}

function renderInventorySubfilterContainer(containerId, source) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const definitions = window.inventoryFilterSystem?.getDefinitions(currentInventoryFilter) || [];

    if (currentInventoryFilter === 'crafting' || definitions.length === 0) {
        container.hidden = true;
        container.innerHTML = '';
        return;
    }

    const activeFilter = getCurrentInventorySubfilter();
    container.hidden = false;
    container.innerHTML = definitions.map(definition => {
        const count = getInventorySubfilterCount(source, definition.id);
        const active = definition.id === activeFilter;

        return `
            <button
                type="button"
                class="inventory-subfilter ${active ? 'is-active' : ''}"
                aria-pressed="${active}"
                aria-label="Filtrar por ${definition.label}: ${count} itens"
                onclick="setInventorySubfilter('${definition.id}')">
                <span aria-hidden="true">${definition.icon}</span>
                <span>${definition.label}</span>
                <span class="inventory-subfilter-count" aria-hidden="true">${count}</span>
            </button>
        `;
    }).join('');
}

function renderInventorySubfilters() {
    renderInventorySubfilterContainer('inventorySubfilters', inventory);
    renderInventorySubfilterContainer('inventoryModalSubfilters', predefinedItems);
}

function setInventorySubfilter(filterId) {
    const validFilters = window.inventoryFilterSystem
        ?.getDefinitions(currentInventoryFilter)
        .map(filter => filter.id) || ['all'];

    inventorySubfilterByCategory[currentInventoryFilter] = validFilters.includes(filterId)
        ? filterId
        : 'all';

    const filteredItems = getFilteredInventoryItems();
    selectedInventoryItemId = filteredItems[0]?.id || null;

    renderInventory();

    const modal = document.getElementById('inventoryModal');
    if (modal && !modal.classList.contains('hidden')) renderInventoryItemsModal();
}

window.getFilteredInventoryItems = getFilteredInventoryItems;
window.setInventorySubfilter = setInventorySubfilter;

function addInventoryItemFromModal(itemId) {
    showCatalogItemDetails(itemId);
}

// =========================================
// RENDER INVENTÁRIO
// =========================================

function renderInventory() {

    const container =
        document.getElementById('inventoryList');

    if (!container) return;

    container.innerHTML = '';

    const actions = document.getElementById('inventoryActions');
    if (actions) actions.hidden = currentInventoryFilter === 'crafting';

    renderInventorySubfilters();

    if (currentInventoryFilter === 'crafting') {
        window.renderCraftingScreen?.(container);
        return;
    }

    const categoryInventory = inventory.filter(item => item.category === currentInventoryFilter);
    const filteredInventory = getFilteredInventoryItems();

    if (!filteredInventory.some(item => item.id === selectedInventoryItemId)) {
        selectedInventoryItemId = filteredInventory[0]?.id || null;
    }

    if (filteredInventory.length === 0) {

        const ownerName = window.getCharacterCollectionContextInfo?.().name;
        const safeOwnerName = window.escapeCharacterCollectionHtml?.(ownerName) || '';

        container.innerHTML = `

            <div class="text-center text-slate-500 mt-10">

                ${categoryInventory.length > 0
                    ? 'Nenhum item corresponde a este filtro'
                    : 'Inventário vazio'}

                ${safeOwnerName
                    ? `<div class="text-sm mt-2 text-slate-600">Nenhum item adicionado para ${safeOwnerName}.</div>`
                    : ''}

            </div>
        `;

        window.updateInventoryEquipmentAction?.();

        return;
    }

    filteredInventory.forEach(item => {

        const equipmentBadge = window.getInventoryEquipmentBadge?.(item.id)
            || window.getTransportInventoryBadge?.(item);
        const equipmentKind = window.getEquipmentItemKind?.(item);
        const transportKind = window.getTransportItemKind?.(item);
        const unitWeight = window.getEquipmentItemWeight?.(item) || Math.max(0, Number(item.weight) || 0);
        const weightQuantity = item.id === 'coroa'
            ? Math.max(0, Number(item.moneyValue) || 0)
            : Math.max(0, Number(item.quantity) || 0);
        const inventoryStackWeight = Math.round((unitWeight * weightQuantity + Number.EPSILON) * 100) / 100;

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

            ${equipmentKind === 'weapon'
                ? `⚔️ ${item.damage} DMG`
                : ''}

            ${equipmentKind === 'ammunition'
                ? `🏹 ${window.getAmmunitionType?.(item) === 'bolt' ? 'Seta para besta' : 'Flecha para arco'}${String(item.damage || '').trim() && String(item.damage).trim() !== '0' ? ` · ${item.damage}` : ''}`
                : ''}

            ${item.type === 'armor'
                ? `🛡️ ${window.getEquipmentDefenseLabel?.(item) || item.defense} DEF · ${window.getEquipmentSlotLabel?.(item) || 'Proteção'}`
                : ''}

            ${item.careConsumable
                ? `${item.careConsumable.kind === 'food' ? '🍽️ Alimento' : '🥤 Bebida'} · ${Math.max(1, Number(item.careConsumable.portionsPerUnit) || 1)} porção`
                : ''}

            ${transportKind === 'mount'
                ? `🐎 ${Math.max(1, Number(item.hp) || 1)} HP · ${Math.max(1, Number(item.movement) || 5)} MOV`
                : ''}

            ${transportKind === 'vehicle'
                ? `🛒 ${Math.max(1, Number(item.requiredMounts) || 1)} cavalo${Number(item.requiredMounts) === 1 ? '' : 's'} · ${Math.max(0, Number(item.capacity) || 0)} carga`
                : ''}

            ${transportKind === 'mount-gear'
                ? `🐴 ${item.description || 'Equipamento de montaria'}`
                : ''}

        </div>

        ${equipmentBadge
            ? `<span class="inventory-equipment-badge ${equipmentBadge.className}">${equipmentBadge.label}</span>`
            : ''}

        <span class="text-xs text-slate-500 mt-1">⚖️ ${unitWeight} cada${!['mount', 'vehicle'].includes(transportKind) ? ` · ${inventoryStackWeight} total` : ' · recurso de transporte'}</span>

    </div>

</div>
    
                    <div class="text-cyan-400
                                text-xl
                                font-bold">
    
                                ${item.id === 'coroa'
                                    ? `💰 ${item.moneyValue ?? 0}`
                                    : `x${item.quantity}`
                                }
    
                    </div>
    
                </div>
    
            </div>
        `;
    });

    window.updateInventoryEquipmentAction?.();
}

// =========================================
// ADICIONAR ITEM
// =========================================

function addItem(itemId, showMessage = true) {
    return addItemQuantity(itemId, 1, showMessage);
}

// =========================================
// USAR ITEM
// =========================================

function useItem(itemId) {

    const item =
        inventory.find(i => i.id === itemId);

    if (!item) return;

    if (window.isEquipmentItem?.(item)) {
        window.performSelectedEquipmentAction?.();
        return { used: false, reason: 'equipment' };
    }

    const collectionOwner = window.getCharacterCollectionOwner?.() || null;
    const catalogItem = predefinedItems.find(entry => entry.id === itemId) || item;
    let careResult = null;
    if (catalogItem.careConsumable) {
        if (!collectionOwner) {
            showToast('Selecione o inventário de um personagem antes de consumir este item.');
            return { used: false, reason: 'owner-not-found' };
        }
        if (typeof window.consumeCareInventoryItem !== 'function') {
            showToast('O sistema de alimentação ainda está carregando. Tente novamente.');
            return { used: false, reason: 'care-system-unavailable' };
        }
        careResult = window.consumeCareInventoryItem(collectionOwner, catalogItem);
        if (careResult?.blocked || !careResult?.applied) {
            return { used: false, reason: careResult?.reason || 'care-not-applied', care: careResult };
        }
    }
    const appliesActiveInventoryEffect = Boolean(
        window.isInventoryItemAutomationManaged?.(catalogItem) || (
            (catalogItem.potion || catalogItem.oil) &&
            Object.prototype.hasOwnProperty.call(catalogItem, 'active')
        )
    );
    let effectResult = null;

    if (appliesActiveInventoryEffect) {
        if (typeof window.applyInventoryItemEffectOnOwner !== 'function') {
            showToast('O sistema de efeitos ainda está carregando. Tente novamente.');
            return { used: false, reason: 'effect-system-unavailable' };
        }

        effectResult = window.applyInventoryItemEffectOnOwner(collectionOwner, catalogItem.id);

        if (effectResult?.blocked || effectResult?.cancelled || !effectResult?.applied) {
            return {
                used: false,
                reason: effectResult?.reason || (effectResult?.cancelled ? 'cancelled' : 'effect-not-applied'),
                effect: effectResult
            };
        }
    }

    const toxicityResult = window.applyConsumedItemToxicity?.(collectionOwner, catalogItem) || null;

    if (effectResult?.applied) {
        if (effectResult.summary) {
            window.appendToxicityItemUseDetail?.(effectResult.summary);
        } else {
            const duration = Number(effectResult.effect?.remainingTurns) || 0;
            const durationDetail = duration > 0
                ? ` por ${duration} rodada${duration === 1 ? '' : 's'}`
                : '';
            const action = effectResult.refreshed ? 'renovado' : 'aplicado';
            const automationNote = String(effectResult.effect?.automation?.note || '').trim();
            window.appendToxicityItemUseDetail?.(
                `Efeito ${catalogItem.name} ${action} em ${collectionOwner?.name || 'personagem'}${durationDetail}${automationNote ? `\nRegra aplicada: ${automationNote}` : ''}`
            );
        }
    }

    item.quantity--;

    // remove automaticamente
    if (item.quantity <= 0) {

        inventory =
            inventory.filter(i => i.id !== itemId);
    }

    window.synchronizeTransportAssets?.(window.getCharacterCollectionOwner?.());

    saveInventory();

    renderInventory();

    return {
        used: true,
        itemId,
        toxicity: toxicityResult,
        effect: effectResult,
        care: careResult
    };
}

// =========================================
// STORAGE
// =========================================

function saveInventory() {

    if (typeof window.persistCharacterCollections === 'function') {

        window.persistCharacterCollections();

        return;
    }

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
    predefinedItems
        .filter(item => {

            const sameCategory =
                item.category === currentInventoryFilter;

            const matchesSearch =
                item.name
                    .toLowerCase()
                    .includes(search);

            const matchesSubfilter = window.inventoryFilterSystem
                ? window.inventoryFilterSystem.matches(
                    item,
                    currentInventoryFilter,
                    getCurrentInventorySubfilter()
                )
                : sameCategory;

            return sameCategory && matchesSearch && matchesSubfilter;
        })

        .sort(sortInventoryItems);

    renderInventorySubfilterContainer('inventoryModalSubfilters', predefinedItems);

        

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
    
            onclick="showCatalogItemDetails('${item.id}')"

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
                            ? `🛡️ ${window.getEquipmentDefenseLabel?.(item) || item.defense} DEF · ${window.getEquipmentSlotLabel?.(item) || 'Proteção'}`
                            : ''}

                        ${item.careConsumable
                            ? `${item.careConsumable.kind === 'food' ? '🍽️ Alimento' : '🥤 Bebida'} · ${Math.max(1, Number(item.careConsumable.portionsPerUnit) || 1)} porção`
                            : ''}

                    </div>

                </div>

            </div>

            <span class="text-cyan-400 font-bold">

                Ver detalhes

            </span>



        </button>
        `;
    });
}

function selectInventoryItem(itemId) {

    selectedInventoryItemId = itemId;

    renderInventory();

    window.updateInventoryEquipmentAction?.();
}

window.showCatalogItemDetails = showCatalogItemDetails;
window.updateInventoryAcquisitionSummary = updateInventoryAcquisitionSummary;
window.confirmInventoryItemAcquisition = confirmInventoryItemAcquisition;
window.acquireInventoryItem = acquireInventoryItem;
window.addItemQuantity = addItemQuantity;


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

    const item =
        inventory.find(
            i => i.id === selectedInventoryItemId
        );

    if (!item) return;

    // =====================================
    // COROA
    // =====================================

    if (item.id === 'coroa') {

        item.moneyValue =
            (item.moneyValue || 0) + 1;

        saveInventory();

        renderInventory();

        return;
    }

    // =====================================
    // ITENS NORMAIS
    // =====================================

    addItem(selectedInventoryItemId);
}

function handleInventoryIncreaseClick(event) {
    // O clique sintético que alguns celulares emitem após o toque não pode
    // repetir a alteração já executada pelo gesto de pressionar.
    if (inventoryTouchUsed) {
        event?.preventDefault();
        return;
    }

    increaseSelectedItem();
}

function decreaseSelectedItem(showMessage = true) {

    if (!selectedInventoryItemId) return;

    const item =
        inventory.find(
            i => i.id === selectedInventoryItemId
        );

    if (!item) return;

    const itemName = item.name;

    if (window.canRemoveTransportInventoryItem && !window.canRemoveTransportInventoryItem(item)) {
        if (showMessage) showToast('Remova a carga, desatrele ou desequipe este item antes de excluir a unidade.');
        return;
    }

    if (
        window.isItemEquippedForCurrentOwner?.(item.id) &&
        Math.max(0, Number(item.quantity) || 0) <= 1
    ) {
        if (showMessage) showToast('Desequipe o item antes de remover a última unidade.');
        return;
    }

    // =====================================
    // COROA
    // =====================================

    if (item.id === 'coroa') {

        item.moneyValue =
            (item.moneyValue || 0) - 1;

        if (item.moneyValue < 0) {

            item.moneyValue = 0;
        }

        saveInventory();

        renderInventory();

        if (showMessage) {

            showToast(
                `🗑️ ${itemName} removido!`
            );
        }

        return;
    }

    // =====================================
    // ITENS NORMAIS
    // =====================================

    item.quantity--;

    if (item.quantity <= 0) {

        inventory =
            inventory.filter(
                i => i.id !== selectedInventoryItemId
            );

        selectedInventoryItemId = null;
    }

    window.synchronizeTransportAssets?.(window.getCharacterCollectionOwner?.());

    saveInventory();

    renderInventory();

    if (showMessage) {

        showToast(
            `🗑️ ${itemName} removido!`
        );
    }
}

function handleInventoryDecreaseClick(event) {
    if (inventoryTouchUsed) {
        event?.preventDefault();
        return;
    }

    decreaseSelectedItem();
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

    event.stopPropagation();

    ignoreNextInventoryTouch = true;

    event.preventDefault();

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

        const item =
        inventory.find(
            i => i.id === selectedInventoryItemId
        );
    
    if (!item) return;
    
    for (let i = 0; i < 10; i++) {
    
        addItem(selectedInventoryItemId, false);
    }
    
    showToast(
        `🎒 ${item.name} adicionado x10!`
    );

    }, 500);
}

function endInventoryIncreaseHold(event) {

    event.stopPropagation();

    ignoreNextInventoryTouch = true;

    event.preventDefault();

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

    event.stopPropagation();

    ignoreNextInventoryTouch = true;

    event.preventDefault();

    if (event.type === 'mousedown' && inventoryTouchUsed) {
        return;
    }

    if (event.type === 'touchstart') {
        inventoryTouchUsed = true;
    }

    inventoryQuantityHold = false;

    inventoryQuantityTimer = setTimeout(() => {

        inventoryQuantityHold = true;

        const item =
        inventory.find(
            i => i.id === selectedInventoryItemId
        );
    
    if (!item) return;
    
    const itemName = item.name;
    
    for (let i = 0; i < 10; i++) {
    
        decreaseSelectedItem(false);
    }
    
    showToast(
        `🗑️ ${itemName} removido x10!`
    );

    }, 500);
}

function endInventoryDecreaseHold(event) {

    event.stopPropagation();

    ignoreNextInventoryTouch = true;

    event.preventDefault();

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

function sortInventoryItems(a, b) {

    // 👑 Coroa sempre no topo
    if (a.id === 'coroa') return -1;
    if (b.id === 'coroa') return 1;

    // quantidade da coroa usa moneyValue
    const quantityA =
        a.id === 'coroa'
            ? (a.moneyValue || 0)
            : (a.quantity || 0);

    const quantityB =
        b.id === 'coroa'
            ? (b.moneyValue || 0)
            : (b.quantity || 0);

    // maior quantidade primeiro
    return quantityB - quantityA;
}
