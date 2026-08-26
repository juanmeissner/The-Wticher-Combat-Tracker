const CHARACTER_SHEETS_KEY = 'dnd_character_sheets';
const ACTIVE_SHEET_KEY = 'dnd_active_character_sheet';
const CUSTOM_LIBRARY_KEY = 'dnd_custom_library';
const APP_PREFERENCES_KEY = 'dnd_app_preferences';
const ENHANCEMENTS_LAST_COMBAT_REPORT_KEY = 'dnd_last_combat_report';
const DEFAULT_APP_PREFERENCES = {
    theme: 'default',
    reducedMotion: false,
    rollModes: {
        weapons: 'manual',
        crafting: 'manual',
        abilities: 'manual',
        items: 'manual',
        negativeConditions: 'auto'
    }
};
const COMBATANT_RACE_CATEGORIES = Object.freeze([
    'Humanoide',
    'Amaldiçoado',
    'Besta',
    'Draconídeo',
    'Elemental',
    'Espectro',
    'Híbrido',
    'Insetoide',
    'Necrófago',
    'Ogroide',
    'Relicto',
    'Vampiro'
]);

let characterSheets = readEnhancementData(CHARACTER_SHEETS_KEY, []);
let activeCharacterSheetId = localStorage.getItem(ACTIVE_SHEET_KEY) || null;
let customLibrary = readEnhancementData(CUSTOM_LIBRARY_KEY, {
    items: [],
    abilities: [],
    monsters: []
});
const savedAppPreferences = readEnhancementData(APP_PREFERENCES_KEY, {});
let appPreferences = {
    ...DEFAULT_APP_PREFERENCES,
    ...savedAppPreferences,
    rollModes: {
        ...DEFAULT_APP_PREFERENCES.rollModes,
        ...(savedAppPreferences.rollModes || {})
    }
};
let deferredInstallPrompt = null;
let lastModalFocus = null;

function readEnhancementData(key, fallback) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return value ?? fallback;
    } catch {
        return fallback;
    }
}

function cloneEnhancementData(value) {
    return JSON.parse(JSON.stringify(value));
}

function escapeEnhancementHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function normalizeCombatantRaceCategory(value) {
    return COMBATANT_RACE_CATEGORIES.includes(value) ? value : '';
}

function renderCombatantRaceOptions(selectedValue) {
    const selected = normalizeCombatantRaceCategory(selectedValue);
    const emptySelected = selected ? '' : ' selected';
    const options = COMBATANT_RACE_CATEGORIES
        .map(category => `<option value="${category}"${category === selected ? ' selected' : ''}>${category}</option>`)
        .join('');

    return `<option value=""${emptySelected}>Não definida</option>${options}`;
}

function makeContentId(prefix, name) {
    const slug = String(name || prefix)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 36);

    return `${prefix}-${slug || 'novo'}-${Date.now().toString(36)}`;
}

function mergeCustomLibrary() {
    const mergeEntries = (target, entries) => {
        entries.forEach(entry => {
            if (!target.some(existing => existing.id === entry.id)) {
                target.push(entry);
            }
        });
    };

    mergeEntries(predefinedItems, Array.isArray(customLibrary.items) ? customLibrary.items : []);
    mergeEntries(predefinedAbilities, Array.isArray(customLibrary.abilities) ? customLibrary.abilities : []);
    mergeEntries(monsterDatabase, Array.isArray(customLibrary.monsters) ? customLibrary.monsters : []);
}

function persistCharacterSheets() {
    localStorage.setItem(CHARACTER_SHEETS_KEY, JSON.stringify(characterSheets));
}

function getActiveCharacterSheet() {
    return characterSheets.find(sheet => sheet.id === activeCharacterSheetId) || null;
}

function getSheetResourceCurrent(sheet, currentKey, maximum) {
    if (sheet.resourceStateSaved !== true) return maximum;

    const current = Number(sheet[currentKey]);
    if (!Number.isFinite(current)) return maximum;

    return Math.min(maximum, Math.max(0, current));
}

function migrateCharacterSheetResourceState() {
    let changed = false;

    characterSheets.forEach(sheet => {
        // Fichas existentes já podem conter PV/EST de uma sessão anterior.
        // Preservamos esse estado; apenas fichas criadas daqui em diante
        // começam explicitamente como novas e entram cheias no primeiro combate.
        if (typeof sheet.resourceStateSaved !== 'boolean') {
            sheet.resourceStateSaved = true;
            changed = true;
        }
    });

    if (changed) persistCharacterSheets();
}

function buildSheetFromCombatant(combatant) {
    return {
        id: `sheet-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: combatant.name,
        hpMax: combatant.hpMax,
        hpCurrent: combatant.hpCurrent,
        stMax: combatant.stMax ?? 0,
        stCurrent: combatant.stCurrent ?? 0,
        resourceStateSaved: true,
        ca: combatant.ca ?? 10,
        atkInfo: combatant.atkInfo ?? '-',
        monsterCategory: normalizeCombatantRaceCategory(combatant.monsterCategory),
        armor: cloneEnhancementData(combatant.armor || { head: 0, torso: 0, arm: 0, leg: 0 }),
        inventory: cloneEnhancementData(combatant.inventory || []),
        abilities: cloneEnhancementData(combatant.abilities || []),
        expandedMagic: Math.max(0, Number(combatant.expandedMagic) || 0),
        equipment: cloneEnhancementData(combatant.equipment || {}),
        updatedAt: new Date().toISOString()
    };
}

function syncCombatantsToCharacterSheets() {
    let changed = false;

    combatants.filter(combatant => combatant.type === 'player').forEach(combatant => {
        let sheet = characterSheets.find(entry => entry.id === combatant.sheetId);

        if (!sheet) {
            sheet = characterSheets.find(entry => entry.name.trim().toLowerCase() === combatant.name.trim().toLowerCase());
        }

        if (!sheet) {
            sheet = buildSheetFromCombatant(combatant);
            characterSheets.push(sheet);
            changed = true;
        }

        if (combatant.sheetId !== sheet.id) {
            combatant.sheetId = sheet.id;
            changed = true;
        }

        if (!Array.isArray(combatant.inventory)) {
            combatant.inventory = cloneEnhancementData(sheet.inventory || []);
            changed = true;
        }

        if (!Array.isArray(combatant.abilities)) {
            combatant.abilities = cloneEnhancementData(sheet.abilities || []);
            changed = true;
        }

        if (!Number.isFinite(Number(combatant.expandedMagic))) {
            combatant.expandedMagic = Math.max(0, Number(sheet.expandedMagic) || 0);
            changed = true;
        }

        if (!combatant.equipment || typeof combatant.equipment !== 'object') {
            combatant.equipment = cloneEnhancementData(sheet.equipment || {});
            changed = true;
        }

        window.ensureEquipmentLoadout?.(combatant);

        Object.assign(sheet, {
            name: combatant.name,
            hpMax: combatant.hpMax,
            hpCurrent: combatant.hpCurrent,
            stMax: combatant.stMax ?? 0,
            stCurrent: combatant.stCurrent ?? 0,
            resourceStateSaved: true,
            ca: combatant.ca ?? 10,
            atkInfo: combatant.atkInfo ?? '-',
            monsterCategory: normalizeCombatantRaceCategory(combatant.monsterCategory),
            armor: cloneEnhancementData(combatant.armor || { head: 0, torso: 0, arm: 0, leg: 0 }),
            inventory: cloneEnhancementData(combatant.inventory || []),
            abilities: cloneEnhancementData(combatant.abilities || []),
            expandedMagic: Math.max(0, Number(combatant.expandedMagic) || 0),
            equipment: cloneEnhancementData(combatant.equipment || {}),
            updatedAt: new Date().toISOString()
        });
        changed = true;
    });

    if (changed) persistCharacterSheets();
}

function syncActiveSheetCollections() {
    if (window.areCharacterCollectionsReady?.()) {
        window.flushCharacterCollectionContext?.();
        return;
    }

    const activeSheet = getActiveCharacterSheet();

    if (!activeSheet) return;

    activeSheet.inventory = cloneEnhancementData(inventory);
    activeSheet.abilities = cloneEnhancementData(abilitiesInventory);
    activeSheet.updatedAt = new Date().toISOString();
    persistCharacterSheets();
}

function createNewCharacterSheet() {
    const sheet = {
        id: `sheet-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: 'Novo personagem',
        hpMax: 10,
        hpCurrent: 10,
        stMax: 0,
        stCurrent: 0,
        resourceStateSaved: false,
        ca: 10,
        atkInfo: '-',
        monsterCategory: '',
        armor: { head: 0, torso: 0, arm: 0, leg: 0 },
        inventory: [],
        abilities: [],
        expandedMagic: 0,
        equipment: window.ensureEquipmentLoadout
            ? cloneEnhancementData(window.ensureEquipmentLoadout({ inventory: [] }))
            : {},
        updatedAt: new Date().toISOString()
    };

    characterSheets.unshift(sheet);
    activeCharacterSheetId = sheet.id;
    localStorage.setItem(ACTIVE_SHEET_KEY, sheet.id);
    persistCharacterSheets();
    openCharacterSheetEditor(sheet.id);
}

function openCharacterSheetEditor(id) {
    const sheet = characterSheets.find(entry => entry.id === id);
    const dialog = document.querySelector('#sessionToolsModal .session-tools');

    if (!sheet || !dialog) return;

    dialog.innerHTML = `
        <div class="session-dialog-header">
            <h2>Ficha de personagem</h2>
            <button type="button" class="session-close" onclick="closeSessionTools()" aria-label="Fechar">×</button>
        </div>
        <div class="enhancement-form-grid">
            <label>Nome<input id="sheetName" class="session-input" value="${escapeEnhancementHtml(sheet.name)}"></label>
            <label>HP máximo<input id="sheetHpMax" class="session-input" type="number" min="1" value="${sheet.hpMax}"></label>
            <label>ST máximo<input id="sheetStMax" class="session-input" type="number" min="0" value="${sheet.stMax}"></label>
            <label>CA<input id="sheetCa" class="session-input" type="number" min="0" value="${sheet.ca}"></label>
            <label class="enhancement-span-2">Raça / categoria<select id="sheetRaceCategory" class="session-input">${renderCombatantRaceOptions(sheet.monsterCategory)}</select></label>
            <label class="enhancement-span-2">Ataque/Dano<input id="sheetAtk" class="session-input" value="${escapeEnhancementHtml(sheet.atkInfo)}"></label>
            <label>Defesa adicional: Cabeça<input id="sheetArmorHead" class="session-input" type="number" min="0" value="${Number(sheet.armor?.head) || 0}"></label>
            <label>Defesa adicional: Tronco<input id="sheetArmorTorso" class="session-input" type="number" min="0" value="${Number(sheet.armor?.torso) || 0}"></label>
            <label>Defesa adicional: Braço<input id="sheetArmorArm" class="session-input" type="number" min="0" value="${Number(sheet.armor?.arm) || 0}"></label>
            <label>Defesa adicional: Perna<input id="sheetArmorLeg" class="session-input" type="number" min="0" value="${Number(sheet.armor?.leg) || 0}"></label>
        </div>
        <p class="enhancement-note">Fichas novas entram com PV e EST máximos. Recursos atuais, inventário, habilidades e equipamentos são sincronizados automaticamente.</p>
        <div class="session-dialog-actions">
            <button type="button" class="session-secondary" onclick="renderSessionToolsView('sheets')">Voltar</button>
            <button type="button" class="session-primary" onclick="saveCharacterSheet('${sheet.id}')">Salvar</button>
        </div>
    `;
}

function saveCharacterSheet(id) {
    const sheet = characterSheets.find(entry => entry.id === id);

    if (!sheet) return;

    const previousSheet = cloneEnhancementData(sheet);

    const name = document.getElementById('sheetName')?.value.trim();

    if (!name) {
        showToast('Informe o nome do personagem.');
        return;
    }

    sheet.name = name;
    sheet.hpMax = Math.max(1, Number(document.getElementById('sheetHpMax')?.value) || 1);
    sheet.stMax = Math.max(0, Number(document.getElementById('sheetStMax')?.value) || 0);
    sheet.ca = Math.max(0, Number(document.getElementById('sheetCa')?.value) || 0);
    sheet.monsterCategory = normalizeCombatantRaceCategory(document.getElementById('sheetRaceCategory')?.value);
    sheet.atkInfo = document.getElementById('sheetAtk')?.value.trim() || '-';
    sheet.armor = {
        head: Math.max(0, Number(document.getElementById('sheetArmorHead')?.value) || 0),
        torso: Math.max(0, Number(document.getElementById('sheetArmorTorso')?.value) || 0),
        arm: Math.max(0, Number(document.getElementById('sheetArmorArm')?.value) || 0),
        leg: Math.max(0, Number(document.getElementById('sheetArmorLeg')?.value) || 0)
    };
    sheet.hpCurrent = getSheetResourceCurrent(sheet, 'hpCurrent', sheet.hpMax);
    sheet.stCurrent = getSheetResourceCurrent(sheet, 'stCurrent', sheet.stMax);
    sheet.updatedAt = new Date().toISOString();

    combatants.filter(combatant => combatant.sheetId === id).forEach(combatant => {
        combatant.name = sheet.name;
        combatant.hpMax = sheet.hpMax;
        combatant.hpCurrent = Math.min(combatant.hpCurrent, sheet.hpMax);
        combatant.stMax = sheet.stMax;
        combatant.stCurrent = Math.min(combatant.stCurrent, sheet.stMax);
        combatant.ca = sheet.ca;
        combatant.monsterCategory = sheet.monsterCategory;
        combatant.atkInfo = sheet.atkInfo;
        combatant.armor = cloneEnhancementData(sheet.armor);
    });

    persistCharacterSheets();
    savePlayersToStorage();
    window.refreshAutomationMonsterCategories?.();
    const historyChange = window.describeCombatantChanges?.(previousSheet, sheet);
    if (historyChange?.changed) {
        window.addCombatHistoryEntry?.(
            historyChange.label,
            historyChange.detail,
            historyChange.metadata
        );
    }
    renderList(false);
    renderSessionToolsView('sheets');
    showToast('Ficha atualizada.');
}

function activateCharacterSheet(id) {
    const sheet = characterSheets.find(entry => entry.id === id);

    if (!sheet) return;

    activeCharacterSheetId = id;
    localStorage.setItem(ACTIVE_SHEET_KEY, id);
    window.openCharacterSheetCollectionContext?.(id);

    if (!window.areCharacterCollectionsReady?.()) {
        inventory = cloneEnhancementData(sheet.inventory || []);
        abilitiesInventory = cloneEnhancementData(sheet.abilities || []);
        expandedMagic = Math.max(0, Number(sheet.expandedMagic) || 0);
        saveInventory();
        saveAbilities();
        renderInventory();
        renderAbilities();
        updateAbilitiesHeader();
    }
    renderSessionToolsView('sheets');
    showToast(`Ficha ativa: ${sheet.name}`);
}

function addCharacterSheetToCombat(id) {
    const sheet = characterSheets.find(entry => entry.id === id);

    if (!sheet) return;

    const hpCurrent = getSheetResourceCurrent(sheet, 'hpCurrent', sheet.hpMax);
    const stMax = Math.max(0, Number(sheet.stMax) || 0);
    const stCurrent = getSheetResourceCurrent(sheet, 'stCurrent', stMax);

    const combatant = {
        id: Date.now(),
        sheetId: sheet.id,
        name: sheet.name,
        initiative: 0,
        hpMax: sheet.hpMax,
        hpCurrent,
        stMax,
        stCurrent,
        ca: sheet.ca ?? 10,
        atkInfo: sheet.atkInfo ?? '-',
        monsterCategory: normalizeCombatantRaceCategory(sheet.monsterCategory),
        armor: cloneEnhancementData(sheet.armor || { head: 0, torso: 0, arm: 0, leg: 0 }),
        inventory: cloneEnhancementData(sheet.inventory || []),
        abilities: cloneEnhancementData(sheet.abilities || []),
        expandedMagic: Math.max(0, Number(sheet.expandedMagic) || 0),
        equipment: cloneEnhancementData(sheet.equipment || {}),
        type: 'player',
        statusBrain: false,
        conditions: [],
        effects: [],
        deathSaves: { success: 0, failures: 0 },
        stabilized: false
    };

    sheet.hpCurrent = hpCurrent;
    sheet.stCurrent = stCurrent;
    sheet.resourceStateSaved = true;
    sheet.updatedAt = new Date().toISOString();
    persistCharacterSheets();

    combatants.push(combatant);
    window.initializeCombatantEquipment?.(combatant);
    window.refreshAutomationMonsterCategories?.();
    sortCombatants();
    activeTurnId ||= combatant.id;
    window.followActiveTurnCharacterCollectionContext?.();
    savePlayersToStorage();
    renderList(true);
    closeSessionTools();
    showToast(`${sheet.name} adicionado ao combate.`);
}

function deleteCharacterSheet(id) {
    const sheet = characterSheets.find(entry => entry.id === id);

    if (!sheet) return;

    openSessionConfirm({
        title: 'Excluir ficha?',
        message: `${sheet.name} será removido da lista de fichas.`,
        confirmLabel: 'Excluir',
        danger: true,
        onConfirm: () => {
            characterSheets = characterSheets.filter(entry => entry.id !== id);
            if (activeCharacterSheetId === id) {
                activeCharacterSheetId = null;
                localStorage.removeItem(ACTIVE_SHEET_KEY);
            }
            persistCharacterSheets();
            renderSessionToolsView('sheets');
        }
    });
}

function renderCharacterSheetsView(dialog) {
    syncCombatantsToCharacterSheets();
    const cards = characterSheets.length
        ? characterSheets.map(sheet => `
            <li class="enhancement-card">
                <div>
                    <strong>${escapeEnhancementHtml(sheet.name)}</strong>
                    <small>HP ${sheet.hpCurrent}/${sheet.hpMax} · ST ${sheet.stCurrent}/${sheet.stMax}</small>
                </div>
                <div class="enhancement-card-actions">
                    <button type="button" class="session-small-button ${sheet.id === activeCharacterSheetId ? 'enhancement-active' : ''}" onclick="activateCharacterSheet('${sheet.id}')">Usar</button>
                    <button type="button" class="session-small-button" onclick="addCharacterSheetToCombat('${sheet.id}')">+ Combate</button>
                    <button type="button" class="session-small-button" onclick="openCharacterSheetEditor('${sheet.id}')">Editar</button>
                    <button type="button" class="session-small-button session-small-danger" onclick="deleteCharacterSheet('${sheet.id}')" aria-label="Excluir ${escapeEnhancementHtml(sheet.name)}">×</button>
                </div>
            </li>
        `).join('')
        : '<li class="session-empty">Nenhuma ficha criada ainda.</li>';

    dialog.innerHTML = `
        <div class="session-dialog-header">
            <h2>Fichas</h2>
            <button type="button" class="session-close" onclick="closeSessionTools()" aria-label="Fechar">×</button>
        </div>
        <p>Use uma ficha para alternar seu inventário e habilidades; adicione-a ao combate quando necessário.</p>
        <ul class="enhancement-list">${cards}</ul>
        <div class="session-dialog-actions">
            <button type="button" class="session-secondary" onclick="renderSessionToolsView('menu')">Voltar</button>
            <button type="button" class="session-primary" onclick="createNewCharacterSheet()">Nova ficha</button>
        </div>
    `;
}

function persistCustomLibrary() {
    localStorage.setItem(CUSTOM_LIBRARY_KEY, JSON.stringify(customLibrary));
}

function renderContentLibraryView(dialog) {
    const counts = {
        item: customLibrary.items.length,
        ability: customLibrary.abilities.length,
        monster: customLibrary.monsters.length
    };

    dialog.innerHTML = `
        <div class="session-dialog-header">
            <h2>Biblioteca</h2>
            <button type="button" class="session-close" onclick="closeSessionTools()" aria-label="Fechar">×</button>
        </div>
        <p>Crie conteúdo próprio sem alterar os dados originais do aplicativo.</p>
        <div class="session-tool-grid">
            <button type="button" onclick="renderCustomContentList('item')">🎒 Itens (${counts.item})</button>
            <button type="button" onclick="renderCustomContentList('ability')">✨ Habilidades (${counts.ability})</button>
            <button type="button" onclick="renderCustomContentList('monster')">👹 Monstros (${counts.monster})</button>
        </div>
        <button type="button" class="session-secondary session-full enhancement-top-gap" onclick="renderSessionToolsView('menu')">Voltar</button>
    `;
}

function getCustomCollection(type) {
    return type === 'item'
        ? customLibrary.items
        : type === 'ability'
            ? customLibrary.abilities
            : customLibrary.monsters;
}

function renderCustomContentList(type) {
    const dialog = document.querySelector('#sessionToolsModal .session-tools');
    const collection = getCustomCollection(type);
    const typeLabel = type === 'item' ? 'Itens' : type === 'ability' ? 'Habilidades' : 'Monstros';

    if (!dialog) return;

    const entries = collection.length
        ? collection.map(entry => `
            <li class="enhancement-card">
                <strong>${escapeEnhancementHtml(entry.name)}</strong>
                <div class="enhancement-card-actions">
                    <button type="button" class="session-small-button" onclick="openCustomContentEditor('${type}', '${entry.id}')">Editar</button>
                    <button type="button" class="session-small-button session-small-danger" onclick="deleteCustomContent('${type}', '${entry.id}')" aria-label="Excluir ${escapeEnhancementHtml(entry.name)}">×</button>
                </div>
            </li>
        `).join('')
        : '<li class="session-empty">Nenhum conteúdo personalizado.</li>';

    dialog.innerHTML = `
        <div class="session-dialog-header">
            <h2>${typeLabel}</h2>
            <button type="button" class="session-close" onclick="closeSessionTools()" aria-label="Fechar">×</button>
        </div>
        <ul class="enhancement-list">${entries}</ul>
        <div class="session-dialog-actions">
            <button type="button" class="session-secondary" onclick="renderSessionToolsView('library')">Voltar</button>
            <button type="button" class="session-primary" onclick="openCustomContentEditor('${type}')">Novo</button>
        </div>
    `;
}

function openCustomContentEditor(type, id = null) {
    const dialog = document.querySelector('#sessionToolsModal .session-tools');
    const existing = getCustomCollection(type).find(entry => entry.id === id);
    const entry = existing || {};
    const title = `${existing ? 'Editar' : 'Novo'} ${type === 'item' ? 'item' : type === 'ability' ? 'habilidade' : 'monstro'}`;

    if (!dialog) return;

    const uniqueFields = type === 'item'
        ? `
            <label>Categoria<select id="contentCategory" class="session-input"><option value="usable">Usável</option><option value="equipment">Equipamento</option><option value="misc">Diverso</option></select></label>
            <label>Tipo de equipamento<select id="contentItemType" class="session-input"><option value="custom">Não equipável</option><option value="weapon">Arma</option><option value="armor">Armadura ou escudo</option></select></label>
            <label>Subtipo<select id="contentWeaponType" class="session-input">
                <option value="">Não definido</option>
                <option>Esgrima</option><option>Lâminas Curtas</option><option>Brigar</option><option>Cajado/Lança</option><option>Arco e Flecha</option><option>Flechas</option>
                <option>Armadura Leve</option><option>Armadura Média</option><option>Armadura Pesada</option><option>Escudo</option><option>Braceiras</option><option>Cabeça</option><option>Pernas</option>
            </select></label>
            <label>Slot da proteção<select id="contentEquipmentSlot" class="session-input">
                <option value="">Não se aplica</option>
                <option value="head">Cabeça</option>
                <option value="body">Tronco</option>
                <option value="arms">Braços</option>
                <option value="legs">Pernas</option>
                <option value="shield">Escudo</option>
            </select></label>
            <label>Dano da arma<input id="contentDamage" class="session-input" value="${escapeEnhancementHtml(entry.damage)}" placeholder="Ex.: 4d6+2"></label>
            <label>Defesa<input id="contentDefense" class="session-input" type="number" min="0" value="${Math.max(0, Number(entry.defense) || 0)}"></label>
            <label>Mãos<select id="contentHands" class="session-input"><option value="1">Uma mão</option><option value="2">Duas mãos</option></select></label>
            <label>Duração (rodadas)<input id="contentActive" class="session-input" type="number" min="0" value="${Number(entry.active) || 0}"></label>
            <label>Stacks máximos<input id="contentStack" class="session-input" type="number" min="1" value="${Number(entry.stack) || 1}"></label>
        `
        : type === 'ability'
            ? `
                <label>Profissão<input id="contentProfession" class="session-input" value="${escapeEnhancementHtml(entry.profession)}"></label>
                <label>Tipo<input id="contentType" class="session-input" value="${escapeEnhancementHtml(entry.type)}"></label>
                <label>Custo<input id="contentCost" class="session-input" value="${escapeEnhancementHtml(entry.cost)}"></label>
                <label>Duração (rodadas)<input id="contentActive" class="session-input" type="number" min="0" value="${Number(entry.active) || 0}"></label>
                <label>Stacks máximos<input id="contentStack" class="session-input" type="number" min="1" value="${Number(entry.stack) || 1}"></label>
            `
            : `
                <label>HP<input id="contentHp" class="session-input" type="number" min="1" value="${Number(entry.hp) || 10}"></label>
                <label>ST<input id="contentSt" class="session-input" type="number" min="0" value="${Number(entry.st) || 0}"></label>
                <label>CA<input id="contentCa" class="session-input" type="number" min="0" value="${Number(entry.ca) || 10}"></label>
                <label class="enhancement-span-2">Ataques (um por linha)<textarea id="contentAttack" class="session-input enhancement-textarea" placeholder="Mordida 2d6&#10;Garras 3d6">${escapeEnhancementHtml((entry.attacks || []).join('\n'))}</textarea></label>
            `;

    dialog.innerHTML = `
        <div class="session-dialog-header">
            <h2>${title}</h2>
            <button type="button" class="session-close" onclick="closeSessionTools()" aria-label="Fechar">×</button>
        </div>
        <div class="enhancement-form-grid">
            <label>Nome<input id="contentName" class="session-input" value="${escapeEnhancementHtml(entry.name)}"></label>
            <label>Ícone ou imagem<input id="contentIcon" class="session-input" value="${escapeEnhancementHtml(entry.icon || entry.image)}" placeholder="Emoji ou URL"></label>
            ${uniqueFields}
            <label class="enhancement-span-2">Descrição<textarea id="contentDescription" class="session-input enhancement-textarea">${escapeEnhancementHtml(entry.description || entry.shortDescription)}</textarea></label>
        </div>
        <div class="session-dialog-actions">
            <button type="button" class="session-secondary" onclick="renderCustomContentList('${type}')">Voltar</button>
            <button type="button" class="session-primary" onclick="saveCustomContent('${type}', '${id || ''}')">Salvar</button>
        </div>
    `;

    if (type === 'item') {
        dialog.querySelector('#contentCategory').value = entry.category || 'usable';
        dialog.querySelector('#contentItemType').value = entry.type || 'custom';
        dialog.querySelector('#contentWeaponType').value = entry.weaponType || '';
        dialog.querySelector('#contentEquipmentSlot').value = entry.equipmentSlot
            || window.getEquipmentItemSlot?.(entry)
            || '';
        dialog.querySelector('#contentHands').value = String(Number(entry.hands) === 2 ? 2 : 1);
    }
}

function saveCustomContent(type, id) {
    const name = document.getElementById('contentName')?.value.trim();

    if (!name) {
        showToast('Informe um nome.');
        return;
    }

    const collection = getCustomCollection(type);
    const existingIndex = collection.findIndex(entry => entry.id === id);
    const common = {
        id: id || makeContentId(type, name),
        name,
        icon: document.getElementById('contentIcon')?.value.trim() || (type === 'item' ? '🎒' : '✨'),
        description: document.getElementById('contentDescription')?.value.trim() || ''
    };
    let content;

    if (type === 'item') {
        const equipmentType = document.getElementById('contentItemType')?.value || 'custom';
        const equipmentSubtype = document.getElementById('contentWeaponType')?.value || '';
        const equipmentSlot = document.getElementById('contentEquipmentSlot')?.value || '';

        if (
            equipmentType === 'armor' &&
            !['head', 'body', 'arms', 'legs', 'shield'].includes(equipmentSlot)
        ) {
            showToast('Escolha qual região a armadura ou escudo protege.');
            return;
        }

        content = {
            ...common,
            category: equipmentType === 'custom'
                ? (document.getElementById('contentCategory')?.value || 'usable')
                : 'equipment',
            type: equipmentType,
            weaponType: equipmentSubtype,
            equipmentSlot: equipmentType === 'armor' ? equipmentSlot : '',
            damage: document.getElementById('contentDamage')?.value.trim() || '',
            defense: Math.max(0, Number(document.getElementById('contentDefense')?.value) || 0),
            hands: Number(document.getElementById('contentHands')?.value) === 2 ? 2 : 1,
            goldValue: 0,
            recipe: [],
            active: Math.max(0, Number(document.getElementById('contentActive')?.value) || 0),
            stack: Math.max(1, Number(document.getElementById('contentStack')?.value) || 1),
            augment: 'buff'
        };
    } else if (type === 'ability') {
        content = {
            ...common,
            shortDescription: common.description,
            profession: document.getElementById('contentProfession')?.value.trim() || 'Personalizada',
            category: 'Personalizada',
            type: document.getElementById('contentType')?.value.trim() || 'Especial',
            cost: document.getElementById('contentCost')?.value.trim() || '-',
            duration: 'Personalizada',
            defense: '-',
            damage: '-',
            range: '-',
            action: 'Livre',
            unlockCost: 0,
            active: Math.max(0, Number(document.getElementById('contentActive')?.value) || 0),
            stack: Math.max(1, Number(document.getElementById('contentStack')?.value) || 1),
            augment: 'buff'
        };
    } else {
        content = {
            id: common.id,
            name: common.name,
            image: document.getElementById('contentIcon')?.value.trim() || '',
            hp: Math.max(1, Number(document.getElementById('contentHp')?.value) || 10),
            st: Math.max(0, Number(document.getElementById('contentSt')?.value) || 0),
            ca: Math.max(0, Number(document.getElementById('contentCa')?.value) || 10),
            threat: 'Personalizado',
            reward: '-',
            armor: { head: 0, torso: 0, arm: 0, leg: 0 },
            vulnerabilities: [],
            abilities: [common.description],
            attacks: document.getElementById('contentAttack')?.value
                .split(/\r?\n/)
                .map(value => value.trim())
                .filter(Boolean),
            loot: [],
            skills: [],
            speed: '-',
            height: '-',
            weight: '-',
            habitat: 'Personalizado',
            intelligence: '-'
        };
    }

    if (existingIndex >= 0) {
        collection[existingIndex] = content;
        const target = type === 'item' ? predefinedItems : type === 'ability' ? predefinedAbilities : monsterDatabase;
        const index = target.findIndex(entry => entry.id === content.id);
        if (index >= 0) target[index] = content;
    } else {
        collection.push(content);
        (type === 'item' ? predefinedItems : type === 'ability' ? predefinedAbilities : monsterDatabase).push(content);
    }

    persistCustomLibrary();
    renderCustomContentList(type);
    showToast(`${content.name} salvo na biblioteca.`);
}

function deleteCustomContent(type, id) {
    const collection = getCustomCollection(type);
    const entry = collection.find(content => content.id === id);

    if (!entry) return;

    openSessionConfirm({
        title: 'Excluir conteúdo?',
        message: `${entry.name} será removido da sua biblioteca.`,
        confirmLabel: 'Excluir',
        danger: true,
        onConfirm: () => {
            const target = type === 'item' ? predefinedItems : type === 'ability' ? predefinedAbilities : monsterDatabase;
            const targetIndex = target.findIndex(content => content.id === id);
            if (targetIndex >= 0) target.splice(targetIndex, 1);
            if (type === 'item') customLibrary.items = customLibrary.items.filter(content => content.id !== id);
            if (type === 'ability') customLibrary.abilities = customLibrary.abilities.filter(content => content.id !== id);
            if (type === 'monster') customLibrary.monsters = customLibrary.monsters.filter(content => content.id !== id);
            persistCustomLibrary();
            renderCustomContentList(type);
        }
    });
}

function ensureCatalogFilters() {
    const abilitySearch = document.getElementById('abilitiesSearchInput');
    const itemSearch = document.getElementById('inventorySearchInput');

    if (abilitySearch && !document.getElementById('abilityTypeFilter')) {
        const filter = document.createElement('select');
        filter.id = 'abilityTypeFilter';
        filter.className = 'enhancement-filter';
        const types = [...new Set(predefinedAbilities.map(ability => ability.type).filter(Boolean))].sort();
        filter.innerHTML = `<option value="">Todos os tipos</option>${types.map(type => `<option value="${escapeEnhancementHtml(type)}">${escapeEnhancementHtml(type)}</option>`).join('')}`;
        abilitySearch.parentElement.insertAdjacentElement('afterend', filter);
        filter.addEventListener('change', applyCatalogFilters);
    }

    if (itemSearch && !document.getElementById('itemTypeFilter')) {
        const filter = document.createElement('select');
        filter.id = 'itemTypeFilter';
        filter.className = 'enhancement-filter';
        const types = [...new Set(predefinedItems.map(item => item.type).filter(Boolean))].sort();
        filter.innerHTML = `<option value="">Todos os tipos</option>${types.map(type => `<option value="${escapeEnhancementHtml(type)}">${escapeEnhancementHtml(type)}</option>`).join('')}`;
        itemSearch.parentElement.insertAdjacentElement('afterend', filter);
        filter.addEventListener('change', applyCatalogFilters);
    }

    applyCatalogFilters();
}

function applyCatalogFilters() {
    if (document.getElementById('abilitiesModalList')) {
        renderAbilitiesModal();
    }

    if (document.getElementById('inventoryItemsList')) {
        renderInventoryItemsModal();
    }
}

function isVisibleModal(element) {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden';
}

function getTopVisibleModal() {
    return [...document.querySelectorAll('[id$="Modal"], #circularMenu')]
        .filter(isVisibleModal)
        .at(-1) || null;
}

function focusModal(modal) {
    if (!modal || modal.contains(document.activeElement)) return;
    lastModalFocus = document.activeElement;
    const target = modal.querySelector('[autofocus], input, button, select, textarea, [tabindex]:not([tabindex="-1"])');
    target?.focus();
}

function installModalAccessibility() {
    document.querySelectorAll('[id$="Modal"], #circularMenu').forEach(modal => {
        if (!modal.hasAttribute('role')) modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.tabIndex = -1;
    });

    document.querySelectorAll('label').forEach(label => {
        if (!label.htmlFor) {
            const input = label.parentElement?.querySelector('input, select, textarea');
            if (input?.id) label.htmlFor = input.id;
        }
    });

    document.querySelectorAll('button[title]').forEach(button => {
        if (!button.hasAttribute('aria-label')) button.setAttribute('aria-label', button.title);
    });

    new MutationObserver(mutations => {
        const modalChanged = mutations.some(mutation => mutation.type === 'attributes');
        if (modalChanged) window.setTimeout(() => focusModal(getTopVisibleModal()), 0);
        ensureCatalogFilters();
    }).observe(document.body, {
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
    });

    document.addEventListener('keydown', event => {
        const modal = getTopVisibleModal();

        if (!modal) return;

        if (event.key === 'Escape' && modal.id !== 'concentrationModal') {
            const closeButton = modal.querySelector('button[onclick*="close"], button[onclick*="Cancel"]');
            if (closeButton) {
                event.preventDefault();
                closeButton.click();
            }
        }

        if (event.key !== 'Tab') return;

        const focusable = [...modal.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
            .filter(element => !element.hidden && isVisibleModal(element));

        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable.at(-1);

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });
}

function updateConnectionStatus() {
    const indicator = document.getElementById('sessionConnectionStatus');

    if (!indicator) return;

    const online = navigator.onLine;
    indicator.classList.toggle('is-offline', !online);
    indicator.title = online ? 'Online' : 'Offline';
    indicator.setAttribute('aria-label', online ? 'Online' : 'Offline');
}

function renderInstallView(dialog) {
    const isStandalone = window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const action = deferredInstallPrompt
        ? '<button type="button" class="session-primary session-full" onclick="installCurrentApp()">Instalar aplicativo</button>'
        : isStandalone
            ? '<p class="enhancement-note">O aplicativo já está instalado neste dispositivo.</p>'
            : isIOS
                ? '<p class="enhancement-note">No Safari, toque em Compartilhar e escolha “Adicionar à Tela de Início”.</p>'
                : '<p class="enhancement-note">A instalação ficará disponível quando o navegador permitir.</p>';

    dialog.innerHTML = `
        <div class="session-dialog-header">
            <h2>Aplicativo</h2>
            <button type="button" class="session-close" onclick="closeSessionTools()" aria-label="Fechar">×</button>
        </div>
        <p>O indicador na faixa de combate mostra se o aplicativo está online ou usando o modo offline.</p>
        ${action}
        <h3 class="enhancement-section-title">Atualizações</h3>
        <button type="button" class="session-primary session-full" onclick="updateCurrentApplication()">↻ Atualizar agora</button>
        <p class="enhancement-note">Busca a versão mais recente e recarrega o aplicativo sem apagar fichas, combate ou preferências.</p>
        <button type="button" class="session-secondary session-full enhancement-top-gap" onclick="renderSessionToolsView('app-maintenance')">Cache e dados do aplicativo</button>
        <button type="button" class="session-secondary session-full enhancement-top-gap" onclick="renderSessionToolsView('menu')">Voltar</button>
    `;
}

async function installCurrentApp() {
    if (!deferredInstallPrompt) return;

    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    renderSessionToolsView('install');
}

function updateCurrentApplication() {
    if (!navigator.onLine) {
        showToast('Conecte-se à internet para buscar atualizações.');
        return;
    }

    closeSessionTools();
    showToast('↻ Buscando atualização do aplicativo...');

    Promise.resolve(window.updateApplicationNow?.())
        .then(result => {
            if (result?.supported === false) {
                showToast('Atualização automática não é suportada neste navegador. Reabrindo aplicativo...');
            } else {
                showToast('✓ Atualização verificada. Reabrindo aplicativo...');
            }

            window.setTimeout(() => window.location.reload(), 300);
        })
        .catch(() => showToast('Não foi possível buscar atualizações agora.'));
}

function repairCurrentApplicationCache() {
    openSessionConfirm({
        title: 'Reparar cache?',
        message: 'Os arquivos salvos do aplicativo serão baixados novamente. Fichas, combate e preferências serão mantidos.',
        confirmLabel: 'Reparar cache',
        danger: true,
        onConfirm: async () => {
            if (!navigator.onLine) {
                showToast('Conecte-se à internet para reparar o cache.');
                return;
            }

            closeSessionTools();
            showToast('↻ Limpando arquivos em cache...');

            try {
                await window.repairApplicationCache?.();
                showToast('✓ Cache reparado. Reabrindo aplicativo...');
                window.setTimeout(() => window.location.reload(), 300);
            } catch {
                showToast('Não foi possível reparar o cache agora.');
            }
        }
    });
}

function restoreDefaultAppPreferences() {
    openSessionConfirm({
        title: 'Restaurar preferências?',
        message: 'Tema, animações e modos de rolagem voltarão ao padrão. Fichas e combate não serão alterados.',
        confirmLabel: 'Restaurar preferências',
        danger: true,
        onConfirm: () => {
            appPreferences = {
                ...DEFAULT_APP_PREFERENCES,
                rollModes: { ...DEFAULT_APP_PREFERENCES.rollModes }
            };
            localStorage.removeItem(APP_PREFERENCES_KEY);
            applyPreferences();
            showToast('✓ Preferências restauradas.');
            renderSessionToolsView('app-maintenance');
        }
    });
}

function requestCompleteApplicationReset() {
    openSessionConfirm({
        title: 'Apagar todos os dados?',
        message: 'Isso removerá fichas, combate, inventário, habilidades, histórico, encontros, biblioteca e preferências deste dispositivo.',
        confirmLabel: 'Continuar',
        danger: true,
        onConfirm: () => {
            openSessionConfirm({
                title: 'Confirmação final',
                message: 'Esta ação é permanente neste dispositivo. Faça um backup completo antes de continuar.',
                confirmLabel: 'Apagar tudo',
                danger: true,
                onConfirm: executeCompleteApplicationReset
            });
        }
    });
}

async function executeCompleteApplicationReset() {
    closeSessionTools();
    showToast('↻ Restaurando aplicativo...');

    try {
        await window.resetApplicationCompletely?.();
        window.setTimeout(() => window.location.reload(), 300);
    } catch {
        showToast('Não foi possível restaurar o aplicativo agora.');
    }
}

function renderAppMaintenanceView(dialog) {
    dialog.innerHTML = `
        <div class="session-dialog-header">
            <h2>Cache e dados</h2>
            <button type="button" class="session-close" onclick="closeSessionTools()" aria-label="Fechar">×</button>
        </div>
        <p>Use estas opções quando o aplicativo não exibir uma atualização ou quando quiser restaurar dados deste dispositivo.</p>
        <section class="app-maintenance-section">
            <h3>Arquivos do aplicativo</h3>
            <button type="button" class="session-primary session-full" onclick="updateCurrentApplication()">↻ Atualizar agora</button>
            <small>Busca a versão mais recente e mantém seus dados.</small>
            <button type="button" class="session-secondary session-full enhancement-top-gap" onclick="repairCurrentApplicationCache()">Reparar cache</button>
            <small>Remove somente arquivos temporários e baixa tudo de novo.</small>
        </section>
        <section class="app-maintenance-section">
            <h3>Dados e preferências</h3>
            <button type="button" class="session-secondary session-full" onclick="exportSessionBackup()">⇩ Baixar backup completo</button>
            <small>Inclui combate, histórico, fichas, biblioteca, encontros e preferências.</small>
            <button type="button" class="session-secondary session-full enhancement-top-gap" onclick="restoreDefaultAppPreferences()">Restaurar preferências</button>
            <small>Volta tema e configurações de rolagem ao padrão.</small>
            <button type="button" class="session-danger session-full enhancement-top-gap" onclick="requestCompleteApplicationReset()">Apagar todos os dados</button>
            <small>Remove todos os dados do aplicativo deste dispositivo. Faça backup antes.</small>
        </section>
        <button type="button" class="session-secondary session-full enhancement-top-gap" onclick="renderSessionToolsView('install')">Voltar</button>
    `;
}

function applyPreferences() {
    document.documentElement.dataset.theme = appPreferences.theme || 'default';
    document.documentElement.dataset.reducedMotion = String(Boolean(appPreferences.reducedMotion));
}

function setAppPreference(key, value) {
    appPreferences[key] = value;
    localStorage.setItem(APP_PREFERENCES_KEY, JSON.stringify(appPreferences));
    applyPreferences();
    renderSessionToolsView('preferences');
}

function setRollMode(preference, value) {
    appPreferences.rollModes = {
        ...DEFAULT_APP_PREFERENCES.rollModes,
        ...(appPreferences.rollModes || {}),
        [preference]: value
    };
    localStorage.setItem(APP_PREFERENCES_KEY, JSON.stringify(appPreferences));
    renderSessionToolsView('preferences');
}

function renderPreferencesView(dialog) {
    const contrastActive = appPreferences.theme === 'contrast';
    const rollModes = {
        ...DEFAULT_APP_PREFERENCES.rollModes,
        ...(appPreferences.rollModes || {})
    };
    const renderRollMode = (key, title, description, manualLabel = 'Perguntar') => `
        <div class="enhancement-preference-row enhancement-preference-stack">
            <div><strong>${title}</strong><small>${description}</small></div>
            <div class="enhancement-choice-group">
                <button type="button" class="session-small-button ${rollModes[key] === 'manual' ? 'enhancement-active' : ''}" onclick="setRollMode('${key}', 'manual')">${manualLabel}</button>
                <button type="button" class="session-small-button ${rollModes[key] === 'auto' ? 'enhancement-active' : ''}" onclick="setRollMode('${key}', 'auto')">Automática</button>
            </div>
        </div>
    `;

    dialog.innerHTML = `
        <div class="session-dialog-header">
            <h2>Preferências</h2>
            <button type="button" class="session-close" onclick="closeSessionTools()" aria-label="Fechar">×</button>
        </div>
        <p>As escolhas visuais e de rolagem ficam salvas neste dispositivo.</p>
        <div class="enhancement-preference-row">
            <div><strong>Contraste alto</strong><small>Melhora leitura em ambientes escuros.</small></div>
            <button type="button" class="session-small-button ${contrastActive ? 'enhancement-active' : ''}" onclick="setAppPreference('theme', '${contrastActive ? 'default' : 'contrast'}')">${contrastActive ? 'Ativo' : 'Ativar'}</button>
        </div>
        <div class="enhancement-preference-row">
            <div><strong>Reduzir animações</strong><small>Evita movimentos contínuos e transições.</small></div>
            <button type="button" class="session-small-button ${appPreferences.reducedMotion ? 'enhancement-active' : ''}" onclick="setAppPreference('reducedMotion', ${!appPreferences.reducedMotion})">${appPreferences.reducedMotion ? 'Ativo' : 'Ativar'}</button>
        </div>
        <h3 class="enhancement-section-title">Rolagens</h3>
        ${renderRollMode('weapons', 'Armas e ataques', 'Manual mantém a rolagem na mesa; automática coloca o total no pad.', 'Manual')}
        ${renderRollMode('crafting', 'Criação e alquimia', 'Manual solicita o total do teste; automática rola 1d10 e soma o bônus informado.', 'Manual')}
        ${renderRollMode('abilities', 'Magias e sinais', 'Padrão: perguntar o resultado informado na mesa.')}
        ${renderRollMode('items', 'Itens', 'Padrão: perguntar o resultado informado na mesa.')}
        ${renderRollMode('negativeConditions', 'Status negativos', 'Padrão: rolagem automática para efeitos recorrentes.')}
        <button type="button" class="session-secondary session-full enhancement-top-gap" onclick="renderSessionToolsView('menu')">Voltar</button>
    `;
}

function renderCombatReportView(dialog) {
    const report = readEnhancementData(ENHANCEMENTS_LAST_COMBAT_REPORT_KEY, null);

    if (!report) {
        dialog.innerHTML = `
            <div class="session-dialog-header"><h2>Relatório</h2><button type="button" class="session-close" onclick="closeSessionTools()" aria-label="Fechar">×</button></div>
            <p class="enhancement-note">Finalize um combate para gerar o primeiro relatório.</p>
            <button type="button" class="session-secondary session-full" onclick="renderSessionToolsView('menu')">Voltar</button>
        `;
        return;
    }

    const actions = report.recentActions?.length
        ? report.recentActions.map(action => `<li>${escapeEnhancementHtml(action.label)}<small>R${action.round}</small></li>`).join('')
        : '<li class="session-empty">Sem ações registradas.</li>';

    dialog.innerHTML = `
        <div class="session-dialog-header"><h2>Relatório pós-combate</h2><button type="button" class="session-close" onclick="closeSessionTools()" aria-label="Fechar">×</button></div>
        <div class="enhancement-report-grid">
            <div><small>Rodadas</small><strong>${report.rounds}</strong></div>
            <div><small>Participantes</small><strong>${report.participants}</strong></div>
            <div><small>Monstros derrotados</small><strong>${report.defeatedMonsters}/${report.monsters}</strong></div>
            <div><small>Dano registrado</small><strong>${report.totalDamage}</strong></div>
            <div><small>Cura registrada</small><strong>${report.totalHealing}</strong></div>
        </div>
        <h3 class="enhancement-section-title">Últimas ações</h3>
        <ul class="session-history-list">${actions}</ul>
        <button type="button" class="session-secondary session-full" onclick="renderSessionToolsView('menu')">Voltar</button>
    `;
}

function installEnhancements() {
    mergeCustomLibrary();
    migrateCharacterSheetResourceState();
    applyPreferences();
    syncCombatantsToCharacterSheets();
    installModalAccessibility();
    ensureCatalogFilters();
    updateConnectionStatus();

    const originalSavePlayers = window.savePlayersToStorage;
    const originalSaveInventory = window.saveInventory;
    const originalSaveAbilities = window.saveAbilities;

    window.savePlayersToStorage = () => {
        originalSavePlayers();
        syncCombatantsToCharacterSheets();
    };

    window.saveInventory = () => {
        originalSaveInventory();
        syncActiveSheetCollections();
    };

    window.saveAbilities = () => {
        originalSaveAbilities();
        syncActiveSheetCollections();
    };

    window.setTimeout(syncCombatantsToCharacterSheets, 0);

    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);
    window.addEventListener('beforeunload', syncCombatantsToCharacterSheets);
    document.addEventListener('input', () => window.setTimeout(applyCatalogFilters, 0));
}

window.renderCharacterSheetsView = renderCharacterSheetsView;
window.createNewCharacterSheet = createNewCharacterSheet;
window.openCharacterSheetEditor = openCharacterSheetEditor;
window.saveCharacterSheet = saveCharacterSheet;
window.activateCharacterSheet = activateCharacterSheet;
window.addCharacterSheetToCombat = addCharacterSheetToCombat;
window.deleteCharacterSheet = deleteCharacterSheet;
window.renderContentLibraryView = renderContentLibraryView;
window.renderCustomContentList = renderCustomContentList;
window.openCustomContentEditor = openCustomContentEditor;
window.saveCustomContent = saveCustomContent;
window.deleteCustomContent = deleteCustomContent;
window.renderPreferencesView = renderPreferencesView;
window.setAppPreference = setAppPreference;
window.setRollMode = setRollMode;
window.renderCombatReportView = renderCombatReportView;
window.renderInstallView = renderInstallView;
window.installCurrentApp = installCurrentApp;

window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event;
});

window.addEventListener('load', installEnhancements);
