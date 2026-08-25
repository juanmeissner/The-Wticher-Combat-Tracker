const CHARACTER_COLLECTIONS_VERSION_KEY = 'dnd_character_collections_version';
const CHARACTER_COLLECTIONS_VERSION = 3;

let characterCollectionsReady = false;
let characterCollectionContextKey = 'legacy';
let characterCollectionsPersisting = false;
let characterCollectionGuardsInstalled = false;

function cloneCharacterCollection(value, fallback = []) {
    try {
        return JSON.parse(JSON.stringify(value ?? fallback));
    } catch {
        return cloneCharacterCollection(fallback, []);
    }
}

function escapeCharacterCollectionHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function getAvailableCharacterSheets() {
    return typeof characterSheets !== 'undefined' && Array.isArray(characterSheets)
        ? characterSheets
        : [];
}

function buildCharacterCollectionContextKey(type, id = '') {
    if (type === 'combatant') return `combatant:${id}`;
    if (type === 'sheet') return `sheet:${id}`;
    return 'legacy';
}

function parseCharacterCollectionContextKey(key) {
    const normalized = String(key || 'legacy');
    const separatorIndex = normalized.indexOf(':');

    if (separatorIndex === -1) return { type: 'legacy', id: '' };

    return {
        type: normalized.slice(0, separatorIndex),
        id: normalized.slice(separatorIndex + 1)
    };
}

function findCharacterCollectionOwner(key = characterCollectionContextKey) {
    const context = parseCharacterCollectionContextKey(key);

    if (context.type === 'combatant') {
        return combatants.find(entry => String(entry.id) === context.id) || null;
    }

    if (context.type === 'sheet') {
        return getAvailableCharacterSheets().find(entry => String(entry.id) === context.id) || null;
    }

    return null;
}

function getLinkedCharacterSheet(combatant) {
    if (!combatant) return null;

    const sheets = getAvailableCharacterSheets();
    const linkedById = combatant.sheetId
        ? sheets.find(sheet => String(sheet.id) === String(combatant.sheetId))
        : null;

    if (linkedById) return linkedById;

    const normalizedName = String(combatant.name || '').trim().toLocaleLowerCase('pt-BR');
    return normalizedName
        ? sheets.find(sheet => String(sheet.name || '').trim().toLocaleLowerCase('pt-BR') === normalizedName) || null
        : null;
}

function ensureCharacterCollectionFields(owner, fallback = {}) {
    if (!owner) return;

    if (!Array.isArray(owner.inventory)) {
        owner.inventory = cloneCharacterCollection(fallback.inventory, []);
    }

    if (!Array.isArray(owner.abilities)) {
        owner.abilities = cloneCharacterCollection(fallback.abilities, []);
    }

    if (!Number.isFinite(Number(owner.expandedMagic))) {
        owner.expandedMagic = Math.max(0, Number(fallback.expandedMagic) || 0);
    } else {
        owner.expandedMagic = Math.max(0, Number(owner.expandedMagic) || 0);
    }

    if (!owner.equipment && fallback.equipment) {
        owner.equipment = cloneCharacterCollection(fallback.equipment, {});
    }

}

function getDefaultCharacterCollectionContextKey() {
    const activeCombatant = combatants.find(entry => String(entry.id) === String(activeTurnId));

    if (activeCombatant) {
        return buildCharacterCollectionContextKey('combatant', activeCombatant.id);
    }

    if (typeof activeCharacterSheetId !== 'undefined' && activeCharacterSheetId) {
        const activeSheet = getAvailableCharacterSheets().find(
            sheet => String(sheet.id) === String(activeCharacterSheetId)
        );

        if (activeSheet) return buildCharacterCollectionContextKey('sheet', activeSheet.id);
    }

    return 'legacy';
}

function writeLegacyCharacterCollectionMirror() {
    localStorage.setItem('inventory', JSON.stringify(inventory));
    localStorage.setItem('abilitiesInventory', JSON.stringify(abilitiesInventory));
    localStorage.setItem('expandedMagic', String(Math.max(0, Number(expandedMagic) || 0)));
}

function syncCombatantCollectionsToLinkedSheet(combatant) {
    const sheet = getLinkedCharacterSheet(combatant);

    if (!sheet) return false;

    sheet.inventory = cloneCharacterCollection(combatant.inventory, []);
    sheet.abilities = cloneCharacterCollection(combatant.abilities, []);
    sheet.expandedMagic = Math.max(0, Number(combatant.expandedMagic) || 0);
    sheet.equipment = cloneCharacterCollection(combatant.equipment, {});
    sheet.updatedAt = new Date().toISOString();
    return true;
}

function flushCharacterCollectionContext({ persist = false } = {}) {
    if (!characterCollectionsReady) return;

    const owner = findCharacterCollectionOwner();

    if (owner) {
        owner.inventory = cloneCharacterCollection(inventory, []);
        owner.abilities = cloneCharacterCollection(abilitiesInventory, []);
        owner.expandedMagic = Math.max(0, Number(expandedMagic) || 0);

        if (parseCharacterCollectionContextKey(characterCollectionContextKey).type === 'combatant') {
            syncCombatantCollectionsToLinkedSheet(owner);
        } else {
            owner.updatedAt = new Date().toISOString();
        }
    }

    writeLegacyCharacterCollectionMirror();

    if (persist) persistCharacterCollectionOwners();
}

function persistCharacterCollectionOwners() {
    if (characterCollectionsPersisting) return;

    characterCollectionsPersisting = true;

    try {
        const context = parseCharacterCollectionContextKey(characterCollectionContextKey);

        if (context.type === 'combatant') {
            window.savePlayersToStorage?.();
        }

        if (context.type === 'sheet' || getAvailableCharacterSheets().length > 0) {
            if (typeof persistCharacterSheets === 'function') persistCharacterSheets();
        }
    } finally {
        characterCollectionsPersisting = false;
    }
}

function persistCharacterCollections() {
    if (!characterCollectionsReady) {
        writeLegacyCharacterCollectionMirror();
        return;
    }

    flushCharacterCollectionContext({ persist: true });
    renderCharacterCollectionSelectors();
}

function loadCharacterCollectionContext(key, { persistPrevious = true } = {}) {
    let targetKey = String(key || getDefaultCharacterCollectionContextKey());
    let owner = findCharacterCollectionOwner(targetKey);

    if (!owner && targetKey !== 'legacy') {
        targetKey = getDefaultCharacterCollectionContextKey();
        owner = findCharacterCollectionOwner(targetKey);
    }

    if (characterCollectionsReady) {
        flushCharacterCollectionContext({ persist: persistPrevious });
    }

    characterCollectionContextKey = owner ? targetKey : 'legacy';

    if (owner) {
        ensureCharacterCollectionFields(owner);
        inventory = cloneCharacterCollection(owner.inventory, []);
        abilitiesInventory = cloneCharacterCollection(owner.abilities, []);
        expandedMagic = Math.max(0, Number(owner.expandedMagic) || 0);
        window.ensureEquipmentLoadout?.(owner);
    } else {
        const savedInventory = JSON.parse(localStorage.getItem('inventory') || '[]');
        const savedAbilities = JSON.parse(localStorage.getItem('abilitiesInventory') || '[]');

        inventory = Array.isArray(savedInventory) ? savedInventory : [];
        abilitiesInventory = Array.isArray(savedAbilities) ? savedAbilities : [];
        expandedMagic = Math.max(0, Number(localStorage.getItem('expandedMagic')) || 0);
    }

    selectedInventoryItemId = null;
    selectedAbilityId = null;
    writeLegacyCharacterCollectionMirror();
    renderCharacterCollectionScreens();
}

function migrateCharacterCollections(legacyState = {}, { forceLegacyMigration = false } = {}) {
    const legacyInventory = cloneCharacterCollection(legacyState.inventory, []);
    const legacyAbilities = cloneCharacterCollection(legacyState.abilities, []);
    const legacyExpandedMagic = Math.max(0, Number(legacyState.expandedMagic) || 0);
    const hadMigration = Number(localStorage.getItem(CHARACTER_COLLECTIONS_VERSION_KEY)) >= CHARACTER_COLLECTIONS_VERSION;
    let foundExistingCollections = false;

    combatants.forEach(combatant => {
        const sheet = getLinkedCharacterSheet(combatant);
        const fallback = sheet
            ? {
                inventory: sheet.inventory,
                abilities: sheet.abilities,
                expandedMagic: sheet.expandedMagic,
                equipment: sheet.equipment
            }
            : {};

        if (
            (Array.isArray(combatant.inventory) && combatant.inventory.length > 0) ||
            (Array.isArray(combatant.abilities) && combatant.abilities.length > 0) ||
            Number(combatant.expandedMagic) > 0 ||
            (Array.isArray(fallback.inventory) && fallback.inventory.length > 0) ||
            (Array.isArray(fallback.abilities) && fallback.abilities.length > 0) ||
            Number(fallback.expandedMagic) > 0
        ) {
            foundExistingCollections = true;
        }

        ensureCharacterCollectionFields(combatant, fallback);
        window.ensureEquipmentLoadout?.(combatant);
    });

    if ((!hadMigration || forceLegacyMigration) && !foundExistingCollections && (legacyInventory.length || legacyAbilities.length || legacyExpandedMagic)) {
        const migrationTarget = combatants.find(entry => String(entry.id) === String(activeTurnId))
            || combatants.find(entry => entry.type === 'player')
            || combatants[0];

        if (migrationTarget) {
            migrationTarget.inventory = legacyInventory;
            migrationTarget.abilities = legacyAbilities;
            migrationTarget.expandedMagic = legacyExpandedMagic;
            syncCombatantCollectionsToLinkedSheet(migrationTarget);
        }
    }

    localStorage.setItem(CHARACTER_COLLECTIONS_VERSION_KEY, String(CHARACTER_COLLECTIONS_VERSION));
}

function initializeCharacterCollections(options = {}) {
    const legacyState = {
        inventory: options.inventory ?? inventory,
        abilities: options.abilities ?? abilitiesInventory,
        expandedMagic: options.expandedMagic ?? expandedMagic
    };

    characterCollectionsReady = false;
    migrateCharacterCollections(legacyState, {
        forceLegacyMigration: options.forceLegacyMigration === true
    });
    characterCollectionsReady = true;

    const preferredKey = options.preferredKey || getDefaultCharacterCollectionContextKey();
    loadCharacterCollectionContext(preferredKey, { persistPrevious: false });
    persistCharacterCollectionOwners();
    installCharacterCollectionGuards();
}

function installCharacterCollectionGuards() {
    if (characterCollectionGuardsInstalled) return;

    const guardActiveTurnChange = action => function (...args) {
        flushCharacterCollectionContext();
        const result = action.apply(this, args);
        ensureActiveTurnCharacterCollectionContext();
        return result;
    };

    ['removeCombatant', 'endCombat', 'hardResetCombat', 'saveEntity'].forEach(actionName => {
        const action = window[actionName];
        if (typeof action === 'function') window[actionName] = guardActiveTurnChange(action);
    });

    characterCollectionGuardsInstalled = true;
}

function restoreCharacterCollectionContext(state = {}) {
    initializeCharacterCollections({
        inventory: state.inventory,
        abilities: state.abilitiesInventory,
        expandedMagic: state.expandedMagic,
        preferredKey: state.characterCollectionContextKey || getDefaultCharacterCollectionContextKey(),
        forceLegacyMigration: true
    });
}

function ensureActiveTurnCharacterCollectionContext() {
    if (!characterCollectionsReady) {
        initializeCharacterCollections();
        return;
    }

    const defaultKey = getDefaultCharacterCollectionContextKey();

    if (characterCollectionContextKey !== defaultKey) {
        loadCharacterCollectionContext(defaultKey);
    } else {
        renderCharacterCollectionScreens();
    }
}

function selectCharacterCollectionOwner(key) {
    if (!findCharacterCollectionOwner(key)) return;

    loadCharacterCollectionContext(key);

    const context = getCharacterCollectionContextInfo();
    if (context?.name) showToast(`👤 Itens e habilidades de ${context.name}.`);
}

function openCharacterSheetCollectionContext(sheetId) {
    const linkedCombatant = combatants.find(entry => String(entry.sheetId) === String(sheetId));
    const key = linkedCombatant
        ? buildCharacterCollectionContextKey('combatant', linkedCombatant.id)
        : buildCharacterCollectionContextKey('sheet', sheetId);

    loadCharacterCollectionContext(key);
}

function getCharacterCollectionContextInfo() {
    const context = parseCharacterCollectionContextKey(characterCollectionContextKey);
    const owner = findCharacterCollectionOwner();

    if (!owner) {
        return {
            key: 'legacy',
            type: 'legacy',
            id: null,
            name: 'Sem personagem ativo',
            isActiveTurn: false
        };
    }

    return {
        key: characterCollectionContextKey,
        type: context.type,
        id: owner.id,
        name: owner.name || 'Sem nome',
        isActiveTurn: context.type === 'combatant' && String(owner.id) === String(activeTurnId)
    };
}

function isCombatantEliminated(combatant) {
    return (combatant.type === 'monster' && combatant.hpCurrent <= 0)
        || (combatant.type === 'player' && combatant.deathSaves?.failures >= 3);
}

function getCharacterCollectionOptions() {
    if (combatants.length > 0) {
        return combatants.map(combatant => ({
            key: buildCharacterCollectionContextKey('combatant', combatant.id),
            label: `${String(combatant.id) === String(activeTurnId) ? '⚔ ' : ''}${combatant.name}${isCombatantEliminated(combatant) ? ' — eliminado' : ''}`
        }));
    }

    const sheets = getAvailableCharacterSheets();
    if (sheets.length > 0) {
        return sheets.map(sheet => ({
            key: buildCharacterCollectionContextKey('sheet', sheet.id),
            label: sheet.name || 'Ficha sem nome'
        }));
    }

    return [{ key: 'legacy', label: 'Sem personagem ativo' }];
}

function renderCharacterCollectionSelectors() {
    const options = getCharacterCollectionOptions();

    ['inventoryOwnerSelect', 'abilitiesOwnerSelect'].forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;

        select.replaceChildren();
        options.forEach(optionInfo => {
            const option = document.createElement('option');
            option.value = optionInfo.key;
            option.textContent = optionInfo.label;
            option.selected = optionInfo.key === characterCollectionContextKey;
            select.append(option);
        });

        select.disabled = options.length === 1 && options[0].key === 'legacy';
        select.setAttribute('aria-label', selectId === 'inventoryOwnerSelect'
            ? 'Personagem do inventário'
            : 'Personagem das habilidades');
    });

    const info = getCharacterCollectionContextInfo();
    document.querySelectorAll('[data-collection-turn-indicator]').forEach(element => {
        element.textContent = info.isActiveTurn ? 'TURNO ATIVO' : 'CONSULTA';
        element.classList.toggle('collection-owner-indicator-active', info.isActiveTurn);
    });
}

function renderCharacterCollectionScreens() {
    renderCharacterCollectionSelectors();
    renderInventory();
    renderAbilities();
    updateAbilitiesHeader();
    window.updateInventoryEquipmentAction?.();
}

window.initializeCharacterCollections = initializeCharacterCollections;
window.restoreCharacterCollectionContext = restoreCharacterCollectionContext;
window.ensureActiveTurnCharacterCollectionContext = ensureActiveTurnCharacterCollectionContext;
window.followActiveTurnCharacterCollectionContext = ensureActiveTurnCharacterCollectionContext;
window.selectCharacterCollectionOwner = selectCharacterCollectionOwner;
window.openCharacterSheetCollectionContext = openCharacterSheetCollectionContext;
window.flushCharacterCollectionContext = flushCharacterCollectionContext;
window.persistCharacterCollections = persistCharacterCollections;
window.renderCharacterCollectionSelectors = renderCharacterCollectionSelectors;
window.getCharacterCollectionContextInfo = getCharacterCollectionContextInfo;
window.getCharacterCollectionContextKey = () => characterCollectionContextKey;
window.getCharacterCollectionOwner = () => findCharacterCollectionOwner();
window.areCharacterCollectionsReady = () => characterCollectionsReady;
window.escapeCharacterCollectionHtml = escapeCharacterCollectionHtml;
