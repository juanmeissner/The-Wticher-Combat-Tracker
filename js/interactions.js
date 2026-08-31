function recoverInvalidJSON(key, expectedType) {
    const rawValue = localStorage.getItem(key);

    if (!rawValue) return;

    try {
        const value = JSON.parse(rawValue);

        if (expectedType === 'array' && !Array.isArray(value)) {
            throw new Error('Formato inesperado');
        }
    } catch {
        localStorage.setItem(`${key}_backup_corrompido`, rawValue);
        localStorage.removeItem(key);
    }
}

recoverInvalidJSON('inventory', 'array');
recoverInvalidJSON('abilitiesInventory', 'array');
recoverInvalidJSON('dnd_players', 'array');
recoverInvalidJSON('dnd_combat_session', 'object');

function repairMojibake(value) {
    if (typeof value !== 'string' || !/[Ãâð]/.test(value)) return value;

    try {
        return decodeURIComponent(escape(value));
    } catch {
        return value;
    }
}

const originalShowToast = window.showToast;

window.showToast = message => originalShowToast(repairMojibake(message));

function getVisibleInventoryItems() {
    if (typeof window.getFilteredInventoryItems === 'function') {
        return window.getFilteredInventoryItems();
    }

    return inventory
        .filter(item => item.category === currentInventoryFilter)
        .sort(sortInventoryItems);
}

function selectInventoryCard(card) {
    const cards = Array.from(
        document.querySelectorAll('#inventoryList .inventory-card')
    );
    const index = cards.indexOf(card);
    const item = getVisibleInventoryItems()[index];

    if (item) selectInventoryItem(item.id);
}

function showSelectedItemDetails() {
    if (!selectedInventoryItemId) {
        showToast('Selecione um item.');
        return;
    }

    showItemDetails(selectedInventoryItemId);
}

function useSelectedInventoryItem() {
    if (!selectedInventoryItemId) {
        showToast('Selecione um item para usar.');
        return;
    }

    const item = inventory.find(entry => entry.id === selectedInventoryItemId);

    if (!item) return;

    if (window.isEquipmentItem?.(item)) {
        window.performSelectedEquipmentAction?.();
        return;
    }

    if (item.id === 'coroa') {
        showToast('Coroas não podem ser usadas como consumível.');
        return;
    }

    const result = useItem(item.id);
    if (result?.used === false) return result;

    if (!result?.care?.applied) showToast(`✅ ${item.name} utilizado.`);
    return result;
}

function showSelectedAbilityDetails() {
    if (!selectedAbilityId) {
        showToast('Selecione uma habilidade.');
        return;
    }

    openAbilityDetails(selectedAbilityId);
}

document.addEventListener('click', event => {
    const inventoryCard = event.target.closest('#inventoryList .inventory-card');

    if (inventoryCard) selectInventoryCard(inventoryCard);
});

document.addEventListener('dblclick', event => {
    const inventoryCard = event.target.closest('#inventoryList .inventory-card');

    if (inventoryCard) {
        selectInventoryCard(inventoryCard);
        showSelectedItemDetails();
        return;
    }

    const abilityCard = event.target.closest('#abilitiesList .ability-card');

    if (abilityCard) {
        const cards = Array.from(
            document.querySelectorAll('#abilitiesList .ability-card')
        );
        const ability = abilitiesInventory[cards.indexOf(abilityCard)];

        if (ability) openAbilityDetails(ability.id);
    }
});

document.addEventListener('touchmove', () => {
    cancelItemLongPress();
    clearTimeout(abilityLongPressTimer);
}, { passive: true });

function makeCardsKeyboardAccessible() {
    document
        .querySelectorAll('#inventoryList .inventory-card, #abilitiesList .ability-card')
        .forEach(card => {
            card.tabIndex = 0;
            card.setAttribute('role', 'button');
        });
}

['inventoryList', 'abilitiesList'].forEach(id => {
    const container = document.getElementById(id);

    if (!container) return;

    new MutationObserver(makeCardsKeyboardAccessible)
        .observe(container, { childList: true });
});

document.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;

    const inventoryCard = event.target.closest('#inventoryList .inventory-card');
    const abilityCard = event.target.closest('#abilitiesList .ability-card');

    if (!inventoryCard && !abilityCard) return;

    event.preventDefault();

    if (inventoryCard) selectInventoryCard(inventoryCard);

    if (abilityCard) {
        const cards = Array.from(
            document.querySelectorAll('#abilitiesList .ability-card')
        );
        const ability = abilitiesInventory[cards.indexOf(abilityCard)];

        if (ability) {
            selectAbility(ability.id);
            openAbilityDetails(ability.id);
        }
    }
});

window.showSelectedItemDetails = showSelectedItemDetails;
window.useSelectedInventoryItem = useSelectedInventoryItem;
window.showSelectedAbilityDetails = showSelectedAbilityDetails;
