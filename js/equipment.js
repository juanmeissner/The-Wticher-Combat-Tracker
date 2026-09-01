const EQUIPMENT_SCHEMA_VERSION = 3;
const EQUIPMENT_ARMOR_PARTS = Object.freeze(['head', 'torso', 'arm', 'leg']);
const EQUIPMENT_PART_LABELS = Object.freeze({
    head: 'Cabeça',
    torso: 'Tronco',
    arm: 'Braços',
    leg: 'Pernas'
});
const EQUIPMENT_SLOT_TO_ARMOR_PART = Object.freeze({
    head: 'head',
    body: 'torso',
    arms: 'arm',
    legs: 'leg',
    shield: 'shield'
});
const EQUIPMENT_ARMOR_PART_TO_SLOT = Object.freeze({
    head: 'head',
    torso: 'body',
    arm: 'arms',
    leg: 'legs'
});
const EQUIPMENT_SLOT_LABELS = Object.freeze({
    head: 'Cabeça',
    body: 'Tronco',
    arms: 'Braços',
    legs: 'Pernas',
    shield: 'Escudo',
    ammunition: 'Munição'
});

const collapsedEquipmentPanels = new Set();
const collapsedMonsterActionPanels = new Set();
const expandedMonsterAbilityPanels = new Set();
const expandedMonsterSkillPanels = new Set();
let pendingArmorSourceDamage = null;

function cloneEquipmentData(value, fallback = null) {
    try {
        return JSON.parse(JSON.stringify(value ?? fallback));
    } catch {
        return cloneEquipmentData(fallback, null);
    }
}

function escapeEquipmentHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function createEmptyEquipmentLoadout() {
    return {
        version: EQUIPMENT_SCHEMA_VERSION,
        weapons: [null, null, null],
        activeWeaponSlot: 0,
        ammunition: [null, null],
        activeAmmunitionSlot: 0,
        shield: null,
        armor: {
            head: null,
            torso: null,
            arm: null,
            leg: null
        }
    };
}

function getEquipmentItemSlot(item) {
    if (!item || item.category !== 'equipment') return null;

    if (item.type === 'weapon') {
        const explicitSlot = String(item.equipmentSlot || '').toLocaleLowerCase('en-US');
        const weaponType = String(item.weaponType || '').toLocaleLowerCase('pt-BR');
        const name = String(item.name || '').toLocaleLowerCase('pt-BR');
        const ammunition = explicitSlot === 'ammunition'
            || ['flechas', 'setas', 'virotes'].includes(weaponType)
            || /^(flecha|seta|virote)\b/.test(name);
        return ammunition ? 'ammunition' : 'weapon';
    }

    if (item.type !== 'armor') return null;

    const explicitSlot = String(item.equipmentSlot || '').toLocaleLowerCase('en-US');
    if (Object.prototype.hasOwnProperty.call(EQUIPMENT_SLOT_TO_ARMOR_PART, explicitSlot)) return explicitSlot;

    const type = String(item.weaponType || '').toLocaleLowerCase('pt-BR');
    const name = String(item.name || '').toLocaleLowerCase('pt-BR');
    const description = String(item.description || '').toLocaleLowerCase('pt-BR');
    let inferredSlot = null;

    if (type === 'escudo' || name.includes('escudo') || name.includes('broquel') || name.includes('pavise')) {
        inferredSlot = 'shield';
    } else if (
        type === 'pernas' || description.includes('para pernas') ||
        /^(calças|grevas|chausses)\b/.test(name)
    ) {
        inferredSlot = 'legs';
    } else if (
        type === 'braceiras' || description.includes('para braços') ||
        /^(braceiras|armadura de braços)\b/.test(name)
    ) {
        inferredSlot = 'arms';
    } else if (
        type === 'cabeça' ||
        /^(capuz|touca|elmo|armet|grande elmo)\b/.test(name)
    ) {
        inferredSlot = 'head';
    } else {
        inferredSlot = 'body';
    }

    // Migra automaticamente itens personalizados e inventários antigos.
    item.equipmentSlot = inferredSlot;
    return inferredSlot;
}

function getEquipmentItemKind(item) {
    const slot = getEquipmentItemSlot(item);
    return EQUIPMENT_SLOT_TO_ARMOR_PART[slot] || slot;
}

function getAmmunitionType(item) {
    if (!item || getEquipmentItemSlot(item) !== 'ammunition') return null;

    const explicit = String(item.ammunitionType || '').toLocaleLowerCase('en-US');
    if (explicit === 'arrow' || explicit === 'bolt') return explicit;

    const source = `${item.weaponType || ''} ${item.name || ''}`.toLocaleLowerCase('pt-BR');
    return /seta|virote/.test(source) ? 'bolt' : 'arrow';
}

function getRequiredAmmunitionType(item) {
    if (!item || getEquipmentItemSlot(item) !== 'weapon') return null;

    const explicit = String(item.requiredAmmunitionType || '').toLocaleLowerCase('en-US');
    if (explicit === 'arrow' || explicit === 'bolt') return explicit;

    const weaponType = String(item.weaponType || '').toLocaleLowerCase('pt-BR');
    if (weaponType !== 'arco e flecha') return null;

    const source = `${item.name || ''} ${item.description || ''}`.toLocaleLowerCase('pt-BR');
    return source.includes('besta') ? 'bolt' : 'arrow';
}

function isAmmunitionCompatibleWithWeapon(ammunition, weapon) {
    const requiredType = getRequiredAmmunitionType(weapon);
    return Boolean(requiredType && getAmmunitionType(ammunition) === requiredType);
}

function getEquipmentSlotLabel(item) {
    return EQUIPMENT_SLOT_LABELS[getEquipmentItemSlot(item)] || '';
}

function isEquipmentItem(item) {
    const kind = getEquipmentItemKind(item);
    return Boolean(kind);
}

function isTwoHandedWeapon(item) {
    if (!item || getEquipmentItemKind(item) !== 'weapon') return false;
    if (Number(item.hands) === 2) return true;
    return /duas\s+mãos/i.test(String(item.description || ''));
}

function getEquipmentOwnerInventory(owner) {
    const currentOwner = window.getCharacterCollectionOwner?.();

    if (owner && owner === currentOwner && typeof inventory !== 'undefined' && Array.isArray(inventory)) {
        return inventory;
    }

    return Array.isArray(owner?.inventory) ? owner.inventory : [];
}

function findEquipmentItem(owner, itemId) {
    return getEquipmentOwnerInventory(owner).find(item => String(item.id) === String(itemId)) || null;
}

function ensureEquipmentDefense(item) {
    if (!item || ['weapon', 'ammunition'].includes(getEquipmentItemKind(item))) return 0;

    const maximum = Math.max(0, Number(item.defense) || 0);
    const current = Number(item.equipmentDefense);

    item.equipmentDefense = Number.isFinite(current)
        ? Math.min(maximum, Math.max(0, current))
        : maximum;

    return item.equipmentDefense;
}

function getEquipmentDefenseLabel(item) {
    if (!item || ['weapon', 'ammunition'].includes(getEquipmentItemKind(item))) return '';

    const current = ensureEquipmentDefense(item);
    const maximum = Math.max(0, Number(item.defense) || 0);
    return current === maximum ? String(maximum) : `${current}/${maximum}`;
}

function ensureEquipmentLoadout(owner) {
    if (!owner) return createEmptyEquipmentLoadout();

    const empty = createEmptyEquipmentLoadout();
    const saved = owner.equipment && typeof owner.equipment === 'object'
        ? owner.equipment
        : {};
    const rawWeapons = Array.isArray(saved.weapons) ? saved.weapons : [];
    const usedWeaponIds = new Set();
    const weapons = rawWeapons.slice(0, 3).map(itemId => {
        if (!itemId || usedWeaponIds.has(String(itemId))) return null;
        const item = findEquipmentItem(owner, itemId);
        if (getEquipmentItemKind(item) !== 'weapon') return null;
        usedWeaponIds.add(String(itemId));
        return item.id;
    });

    while (weapons.length < 3) weapons.push(null);

    const rawAmmunition = Array.isArray(saved.ammunition) ? saved.ammunition : [];
    const usedAmmunitionIds = new Set();
    const ammunition = rawAmmunition.slice(0, 2).map(itemId => {
        if (!itemId || usedAmmunitionIds.has(String(itemId))) return null;
        const item = findEquipmentItem(owner, itemId);
        if (getEquipmentItemKind(item) !== 'ammunition' || Number(item.quantity) <= 0) return null;
        usedAmmunitionIds.add(String(itemId));
        return item.id;
    });

    while (ammunition.length < 2) ammunition.push(null);

    const armor = {};
    EQUIPMENT_ARMOR_PARTS.forEach(part => {
        const itemId = saved.armor?.[part];
        const item = findEquipmentItem(owner, itemId);
        armor[part] = getEquipmentItemKind(item) === part ? item.id : null;
        if (armor[part]) ensureEquipmentDefense(item);
    });

    const shieldItem = findEquipmentItem(owner, saved.shield);
    const shield = getEquipmentItemKind(shieldItem) === 'shield' ? shieldItem.id : null;
    if (shield) ensureEquipmentDefense(shieldItem);

    let activeWeaponSlot = Math.min(2, Math.max(0, Number(saved.activeWeaponSlot) || 0));
    if (!weapons[activeWeaponSlot]) {
        const firstOccupied = weapons.findIndex(Boolean);
        activeWeaponSlot = firstOccupied === -1 ? 0 : firstOccupied;
    }

    let activeAmmunitionSlot = Math.min(1, Math.max(0, Number(saved.activeAmmunitionSlot) || 0));
    if (!ammunition[activeAmmunitionSlot]) {
        const firstOccupied = ammunition.findIndex(Boolean);
        activeAmmunitionSlot = firstOccupied === -1 ? 0 : firstOccupied;
    }

    const normalizedLoadout = {
        ...empty,
        version: EQUIPMENT_SCHEMA_VERSION,
        weapons,
        activeWeaponSlot,
        ammunition,
        activeAmmunitionSlot,
        shield,
        armor
    };

    Object.assign(saved, normalizedLoadout);
    owner.equipment = saved;

    return saved;
}

function getActiveWeaponEntry(owner) {
    const loadout = ensureEquipmentLoadout(owner);
    const itemId = loadout.weapons[loadout.activeWeaponSlot];
    const item = findEquipmentItem(owner, itemId);

    return item
        ? { item, slotIndex: loadout.activeWeaponSlot }
        : null;
}

function getCriticalWeaponRestriction(owner, item) {
    if (!owner || !item) return '';
    if (window.hasUnusableArmFromCriticalWound?.(owner) && isTwoHandedWeapon(item)) {
        return `${owner.name} está com um braço inutilizado e não pode usar armas de duas mãos.`;
    }
    if (item.weaponUnusable) {
        return `${item.name} está inutilizável e precisa ser reparada.`;
    }
    return '';
}

function applyActiveWeaponDurabilityDamage(owner, amount) {
    const weapon = getActiveWeaponEntry(owner)?.item;
    if (!weapon) return null;
    const before = Math.max(0, Number(weapon.durabilityDamage) || 0);
    const applied = Math.max(0, Math.floor(Number(amount) || 0));
    weapon.durabilityDamage = before + applied;
    return { item: weapon, name: weapon.name, before, after: weapon.durabilityDamage };
}

function markActiveWeaponUnusable(owner) {
    const weapon = getActiveWeaponEntry(owner)?.item;
    if (!weapon) return null;
    weapon.weaponUnusable = true;
    return weapon;
}

function disarmActiveWeapon(owner) {
    const entry = getActiveWeaponEntry(owner);
    if (!entry) return null;

    const loadout = ensureEquipmentLoadout(owner);
    const previousSlot = entry.slotIndex;
    loadout.weapons[previousSlot] = null;
    const replacementSlot = loadout.weapons.findIndex(Boolean);
    loadout.activeWeaponSlot = replacementSlot >= 0 ? replacementSlot : 0;

    return {
        item: entry.item,
        name: entry.item.name,
        previousSlot,
        replacementSlot,
        replacementName: replacementSlot >= 0
            ? findEquipmentItem(owner, loadout.weapons[replacementSlot])?.name || ''
            : ''
    };
}

function consumeActiveAmmunitionForOutcome(owner, amount = 1) {
    const weapon = getActiveWeaponEntry(owner)?.item;
    const entry = weapon ? getActiveAmmunitionEntry(owner, weapon) : null;
    if (!entry) return null;
    const before = Math.max(0, Number(entry.item.quantity) || 0);
    const after = Math.max(0, before - Math.max(1, Math.floor(Number(amount) || 1)));
    entry.item.quantity = after;
    if (after === 0) {
        ensureEquipmentLoadout(owner).ammunition[entry.slotIndex] = null;
    }
    return { item: entry.item, name: entry.item.name, before, after };
}

function enforceCriticalEquipmentRestrictions(owner) {
    if (!owner) return null;
    const loadout = ensureEquipmentLoadout(owner);
    const removedArmor = [];

    EQUIPMENT_ARMOR_PARTS.forEach(part => {
        const slot = EQUIPMENT_ARMOR_PART_TO_SLOT[part];
        const restriction = window.getCriticalEquipmentSlotRestriction?.(owner, slot);
        const item = findEquipmentItem(owner, loadout.armor[part]);
        if (!restriction || !item) return;
        loadout.armor[part] = null;
        removedArmor.push({ part, itemId: item.id, name: item.name, restriction });
    });

    const active = getActiveWeaponEntry(owner)?.item;
    let weaponResult = null;

    if (active && isTwoHandedWeapon(active) && window.hasUnusableArmFromCriticalWound?.(owner)) {
        const replacementSlot = loadout.weapons.findIndex((itemId, slotIndex) => {
            if (!itemId || slotIndex === loadout.activeWeaponSlot) return false;
            const candidate = findEquipmentItem(owner, itemId);
            return candidate && !isTwoHandedWeapon(candidate) && !candidate.weaponUnusable;
        });
        const previousSlot = loadout.activeWeaponSlot;
        if (replacementSlot >= 0) loadout.activeWeaponSlot = replacementSlot;
        weaponResult = {
            previousWeapon: active.name,
            replacementWeapon: replacementSlot >= 0
                ? findEquipmentItem(owner, loadout.weapons[replacementSlot])?.name || ''
                : '',
            previousSlot,
            currentSlot: loadout.activeWeaponSlot
        };
    }

    if (!weaponResult && !removedArmor.length) return null;
    return { ...(weaponResult || {}), removedArmor };
}

function getCompatibleAmmunitionSlots(owner, weapon = getActiveWeaponEntry(owner)?.item) {
    const loadout = ensureEquipmentLoadout(owner);
    if (!getRequiredAmmunitionType(weapon)) return [];

    return loadout.ammunition
        .map((itemId, slotIndex) => {
            const item = findEquipmentItem(owner, itemId);
            return item && Number(item.quantity) > 0 && isAmmunitionCompatibleWithWeapon(item, weapon)
                ? slotIndex
                : null;
        })
        .filter(slotIndex => slotIndex !== null);
}

function getActiveAmmunitionEntry(owner, weapon = getActiveWeaponEntry(owner)?.item) {
    const loadout = ensureEquipmentLoadout(owner);
    const compatibleSlots = getCompatibleAmmunitionSlots(owner, weapon);
    if (!compatibleSlots.length) return null;

    if (!compatibleSlots.includes(loadout.activeAmmunitionSlot)) {
        loadout.activeAmmunitionSlot = compatibleSlots[0];
    }

    const item = findEquipmentItem(owner, loadout.ammunition[loadout.activeAmmunitionSlot]);
    return item ? { item, slotIndex: loadout.activeAmmunitionSlot } : null;
}

function getEquipmentItemWeight(item) {
    const catalogItem = typeof predefinedItems !== 'undefined'
        ? predefinedItems.find(entry => String(entry.id) === String(item?.id))
        : null;
    const catalogWeight = Number(catalogItem?.weight);
    if (Number.isFinite(catalogWeight)) return Math.max(0, catalogWeight);
    const itemWeight = Number(item?.weight);
    if (Number.isFinite(itemWeight)) return Math.max(0, itemWeight);
    if (typeof estimatePredefinedInventoryItemWeight === 'function') {
        return Math.max(0, Number(estimatePredefinedInventoryItemWeight(item)) || 0);
    }
    return 0.1;
}

function getCarriedWeightMode() {
    let mode = 'equipped';
    if (typeof appPreferences !== 'undefined') {
        mode = appPreferences.carriedWeightMode || mode;
    } else {
        try {
            mode = JSON.parse(localStorage.getItem('dnd_app_preferences') || '{}').carriedWeightMode || mode;
        } catch {
            mode = 'equipped';
        }
    }
    return mode === 'inventory' ? 'inventory' : 'equipped';
}

function getInventoryItemWeightQuantity(item) {
    if (item?.id === 'coroa') return Math.max(0, Number(item.moneyValue) || 0);
    return Math.max(0, Number(item?.quantity) || 0);
}

function getInventoryWeightBreakdown(owner) {
    const entries = [];
    getEquipmentOwnerInventory(owner).forEach(item => {
        const transportKind = window.getTransportItemKind?.(item)
            || String(item?.transportKind || item?.type || '').toLowerCase();
        if (transportKind === 'mount' || transportKind === 'vehicle') return;

        let quantity = getInventoryItemWeightQuantity(item);
        if (transportKind === 'mount-gear') {
            quantity = Math.max(0, quantity - (window.getUsedMountGearQuantity?.(owner, item.id) || 0));
        }
        if (quantity <= 0) return;

        const unitWeight = getEquipmentItemWeight(item);
        entries.push({
            itemId: item.id,
            name: item.name,
            category: item.category || 'misc',
            quantity,
            unitWeight,
            weight: Math.round((unitWeight * quantity + Number.EPSILON) * 100) / 100
        });
    });

    return {
        total: Math.round((entries.reduce((total, entry) => total + entry.weight, 0) + Number.EPSILON) * 100) / 100,
        entries
    };
}

function getEquippedWeightBreakdown(owner) {
    if (!owner) return { total: 0, weapons: 0, ammunition: 0, armor: 0, shield: 0, entries: [] };

    const loadout = ensureEquipmentLoadout(owner);
    const entries = [];
    loadout.weapons.forEach((itemId, slotIndex) => {
        const item = findEquipmentItem(owner, itemId);
        if (!item) return;
        entries.push({
            itemId: item.id,
            name: item.name,
            category: slotIndex === loadout.activeWeaponSlot ? 'weapon-active' : 'weapon-reserve',
            weight: getEquipmentItemWeight(item)
        });
    });
    loadout.ammunition.forEach((itemId, slotIndex) => {
        const item = findEquipmentItem(owner, itemId);
        if (!item) return;
        const quantity = Math.max(0, Number(item.quantity) || 0);
        const unitWeight = getEquipmentItemWeight(item);
        entries.push({
            itemId: item.id,
            name: item.name,
            category: slotIndex === loadout.activeAmmunitionSlot ? 'ammunition-active' : 'ammunition-reserve',
            quantity,
            unitWeight,
            weight: Math.round((unitWeight * quantity + Number.EPSILON) * 100) / 100
        });
    });
    EQUIPMENT_ARMOR_PARTS.forEach(part => {
        const item = findEquipmentItem(owner, loadout.armor[part]);
        if (!item) return;
        entries.push({
            itemId: item.id,
            name: item.name,
            category: `armor-${part}`,
            weight: getEquipmentItemWeight(item)
        });
    });
    const shield = findEquipmentItem(owner, loadout.shield);
    if (shield) {
        entries.push({
            itemId: shield.id,
            name: shield.name,
            category: 'shield',
            weight: getEquipmentItemWeight(shield)
        });
    }

    const sum = category => entries
        .filter(entry => entry.category === category || entry.category.startsWith(`${category}-`))
        .reduce((total, entry) => total + entry.weight, 0);
    const weapons = sum('weapon');
    const ammunition = sum('ammunition');
    const armor = sum('armor');
    const shieldWeight = sum('shield');

    return {
        total: Math.round((weapons + ammunition + armor + shieldWeight) * 100) / 100,
        weapons,
        ammunition,
        armor,
        shield: shieldWeight,
        entries
    };
}

function getCharacterCarriedWeightBreakdown(owner) {
    const mode = getCarriedWeightMode();
    const equipped = getEquippedWeightBreakdown(owner);
    const inventoryWeight = getInventoryWeightBreakdown(owner);
    const selected = mode === 'inventory' ? inventoryWeight : equipped;
    return {
        mode,
        modeLabel: mode === 'inventory' ? 'Todo o inventário' : 'Somente equipamentos equipados',
        total: selected.total,
        entries: selected.entries,
        equippedTotal: equipped.total,
        inventoryTotal: inventoryWeight.total,
        equipped,
        inventory: inventoryWeight
    };
}

function getEquipmentStatus(owner, itemId) {
    const loadout = ensureEquipmentLoadout(owner);
    const weaponSlot = loadout.weapons.findIndex(id => String(id) === String(itemId));

    if (weaponSlot !== -1) {
        const reserveSlots = loadout.weapons
            .map((id, index) => id && index !== loadout.activeWeaponSlot ? index : null)
            .filter(index => index !== null);
        const reserveNumber = reserveSlots.indexOf(weaponSlot) + 1;

        return {
            kind: 'weapon',
            slotIndex: weaponSlot,
            active: weaponSlot === loadout.activeWeaponSlot,
            label: weaponSlot === loadout.activeWeaponSlot
                ? 'ARMA ATIVA'
                : `RESERVA ${reserveNumber}`
        };
    }

    const ammunitionSlot = loadout.ammunition.findIndex(id => String(id) === String(itemId));
    if (ammunitionSlot !== -1) {
        return {
            kind: 'ammunition',
            slotIndex: ammunitionSlot,
            active: ammunitionSlot === loadout.activeAmmunitionSlot,
            label: ammunitionSlot === loadout.activeAmmunitionSlot
                ? 'MUNIÇÃO ATIVA'
                : 'MUNIÇÃO RESERVA'
        };
    }

    if (String(loadout.shield) === String(itemId)) {
        return { kind: 'shield', active: true, label: 'ESCUDO EQUIPADO' };
    }

    const armorPart = EQUIPMENT_ARMOR_PARTS.find(part => String(loadout.armor[part]) === String(itemId));
    if (armorPart) {
        return {
            kind: armorPart,
            active: true,
            label: `${EQUIPMENT_PART_LABELS[armorPart].toLocaleUpperCase('pt-BR')} EQUIPADO`
        };
    }

    return null;
}

function getInventoryEquipmentBadge(itemId) {
    const owner = window.getCharacterCollectionOwner?.();
    if (!owner) return null;

    const status = getEquipmentStatus(owner, itemId);
    if (!status) return null;

    return {
        label: status.label,
        className: status.active ? 'equipment-badge-active' : 'equipment-badge-reserve'
    };
}

function persistEquipmentOwner(owner) {
    const currentOwner = window.getCharacterCollectionOwner?.();

    window.refreshCharacterDerivedValues?.(owner, { persist: false });

    if (owner === currentOwner) {
        window.persistCharacterCollections?.();
    } else if (combatants.includes(owner)) {
        window.savePlayersToStorage?.();
    } else if (typeof persistCharacterSheets === 'function') {
        persistCharacterSheets();
    }

    renderInventory();
    window.updateInventoryEquipmentAction?.();
    renderList(false);
}

function runEquipmentMutation(owner, label, detail, callback) {
    const execute = () => {
        callback();
        persistEquipmentOwner(owner);
    };
    const metadata = {
        type: 'equipment',
        target: owner?.id !== undefined ? { id: owner.id, name: owner.name } : undefined,
        participants: owner?.id !== undefined ? [{ id: owner.id, name: owner.name }] : []
    };

    if (combatants.includes(owner) && typeof window.trackEquipmentAction === 'function') {
        return window.trackEquipmentAction(label, execute, detail, metadata);
    }

    return execute();
}

function confirmTwoHandedWeapon(owner, item, onConfirm) {
    const restriction = getCriticalWeaponRestriction(owner, item);
    if (restriction) {
        showToast(`⚠️ ${restriction}`);
        return;
    }
    const loadout = ensureEquipmentLoadout(owner);
    if (!isTwoHandedWeapon(item) || !loadout.shield) {
        onConfirm(false);
        return;
    }

    const shield = findEquipmentItem(owner, loadout.shield);
    const proceed = () => onConfirm(true);

    if (typeof window.openSessionConfirm === 'function') {
        window.openSessionConfirm({
            title: 'Guardar o escudo?',
            message: `${item.name} usa duas mãos. ${shield?.name || 'O escudo'} será desequipado para ativar esta arma.`,
            confirmLabel: 'Guardar e ativar',
            onConfirm: proceed
        });
        return;
    }

    proceed();
}

function activateWeaponSlot(owner, slotIndex) {
    const loadout = ensureEquipmentLoadout(owner);
    const item = findEquipmentItem(owner, loadout.weapons[slotIndex]);
    if (!item || slotIndex === loadout.activeWeaponSlot) return;

    confirmTwoHandedWeapon(owner, item, removeShield => {
        const previous = getActiveWeaponEntry(owner)?.item;
        runEquipmentMutation(
            owner,
            `${owner.name}: ${item.name} tornou-se a arma ativa`,
            `${previous?.name || 'Nenhuma'} → ${item.name}${removeShield ? ' · escudo guardado' : ''}`,
            () => {
                loadout.activeWeaponSlot = slotIndex;
                if (removeShield) loadout.shield = null;
                getActiveAmmunitionEntry(owner, item);
            }
        );
        showToast(`⚔️ ${item.name} agora é a arma ativa de ${owner.name}.`);
    });
}

function equipWeapon(owner, item) {
    const loadout = ensureEquipmentLoadout(owner);
    const existingSlot = loadout.weapons.findIndex(id => String(id) === String(item.id));

    if (existingSlot !== -1) {
        if (existingSlot === loadout.activeWeaponSlot) {
            const nextSlot = loadout.weapons.findIndex((id, index) => Boolean(id) && index !== existingSlot);
            const nextWeapon = findEquipmentItem(owner, loadout.weapons[nextSlot]);
            const finishUnequip = removeShield => {
                runEquipmentMutation(
                    owner,
                    `${owner.name}: ${item.name} desequipada`,
                    `A arma foi devolvida ao inventário${removeShield ? ' · escudo guardado para ativar a próxima arma' : ''}.`,
                    () => {
                        loadout.weapons[existingSlot] = null;
                        loadout.activeWeaponSlot = nextSlot === -1 ? 0 : nextSlot;
                        if (removeShield) loadout.shield = null;
                        if (nextWeapon) getActiveAmmunitionEntry(owner, nextWeapon);
                    }
                );
                showToast(`🎒 ${item.name} foi guardada.`);
            };

            if (nextWeapon) confirmTwoHandedWeapon(owner, nextWeapon, finishUnequip);
            else finishUnequip(false);
        } else {
            activateWeaponSlot(owner, existingSlot);
        }
        return;
    }

    const emptySlot = loadout.weapons.findIndex(id => !id);
    if (emptySlot === -1) {
        showToast('As três posições de arma estão ocupadas. Desequipe uma arma primeiro.');
        return;
    }

    const hasActiveWeapon = Boolean(getActiveWeaponEntry(owner));
    const finishEquip = removeShield => {
        const becomesActive = !hasActiveWeapon;
        runEquipmentMutation(
            owner,
            `${owner.name}: ${item.name} equipada${becomesActive ? ' como arma ativa' : ' como reserva'}`,
            becomesActive
                ? `Arma ativa definida${removeShield ? ' · escudo guardado' : ''}`
                : `Reserva ${emptySlot || 1}`,
            () => {
                loadout.weapons[emptySlot] = item.id;
                if (becomesActive) loadout.activeWeaponSlot = emptySlot;
                if (removeShield) loadout.shield = null;
            }
        );
        showToast(`⚔️ ${item.name} equipada em ${owner.name}.`);
    };

    if (!hasActiveWeapon) {
        confirmTwoHandedWeapon(owner, item, finishEquip);
    } else {
        finishEquip(false);
    }
}

function activateAmmunitionSlot(owner, slotIndex) {
    const loadout = ensureEquipmentLoadout(owner);
    const item = findEquipmentItem(owner, loadout.ammunition[slotIndex]);
    if (!item || slotIndex === loadout.activeAmmunitionSlot) return;

    const activeWeapon = getActiveWeaponEntry(owner)?.item;
    const requiredType = getRequiredAmmunitionType(activeWeapon);
    if (requiredType && !isAmmunitionCompatibleWithWeapon(item, activeWeapon)) {
        showToast(requiredType === 'bolt'
            ? `⚠️ ${activeWeapon.name} usa setas, não flechas.`
            : `⚠️ ${activeWeapon.name} usa flechas, não setas.`);
        return;
    }

    const previous = findEquipmentItem(owner, loadout.ammunition[loadout.activeAmmunitionSlot]);
    runEquipmentMutation(
        owner,
        `${owner.name}: ${item.name} tornou-se a munição ativa`,
        `${previous?.name || 'Nenhuma munição'} → ${item.name}`,
        () => { loadout.activeAmmunitionSlot = slotIndex; }
    );
    showToast(`🏹 ${item.name} agora é a munição ativa de ${owner.name}.`);
}

function equipAmmunition(owner, item) {
    const loadout = ensureEquipmentLoadout(owner);
    const existingSlot = loadout.ammunition.findIndex(id => String(id) === String(item.id));

    if (existingSlot !== -1) {
        if (existingSlot === loadout.activeAmmunitionSlot) {
            runEquipmentMutation(
                owner,
                `${owner.name}: ${item.name} desequipada`,
                'A munição permanece disponível no inventário.',
                () => {
                    loadout.ammunition[existingSlot] = null;
                    const nextSlot = loadout.ammunition.findIndex(Boolean);
                    loadout.activeAmmunitionSlot = nextSlot === -1 ? 0 : nextSlot;
                }
            );
            showToast(`🎒 ${item.name} foi guardada.`);
        } else {
            activateAmmunitionSlot(owner, existingSlot);
        }
        return;
    }

    const emptySlot = loadout.ammunition.findIndex(id => !id);
    if (emptySlot === -1) {
        showToast('As duas posições de munição estão ocupadas. Desequipe uma munição primeiro.');
        return;
    }

    const becomesActive = !loadout.ammunition.some(Boolean);
    runEquipmentMutation(
        owner,
        `${owner.name}: ${item.name} equipada${becomesActive ? ' como munição ativa' : ' como reserva'}`,
        becomesActive ? `Quantidade disponível: ${Number(item.quantity) || 0}` : 'Segunda opção de munição preparada.',
        () => {
            loadout.ammunition[emptySlot] = item.id;
            if (becomesActive) loadout.activeAmmunitionSlot = emptySlot;
        }
    );
    showToast(`🏹 ${item.name} equipada em ${owner.name}.`);
}

function equipShield(owner, item) {
    const loadout = ensureEquipmentLoadout(owner);
    const activeWeapon = getActiveWeaponEntry(owner)?.item;

    if (String(loadout.shield) === String(item.id)) {
        runEquipmentMutation(
            owner,
            `${owner.name}: ${item.name} desequipado`,
            'O bônus geral do escudo foi removido.',
            () => { loadout.shield = null; }
        );
        showToast(`🎒 ${item.name} foi guardado.`);
        return;
    }

    if (activeWeapon && isTwoHandedWeapon(activeWeapon)) {
        showToast(`⚠️ ${activeWeapon.name} usa duas mãos. Troque a arma ativa antes de equipar um escudo.`);
        return;
    }

    ensureEquipmentDefense(item);
    const previous = findEquipmentItem(owner, loadout.shield);
    const equip = () => {
        runEquipmentMutation(
            owner,
            `${owner.name}: ${item.name} equipado`,
            `${previous?.name || 'Nenhum escudo'} → ${item.name} · +${item.equipmentDefense} em todas as regiões`,
            () => { loadout.shield = item.id; }
        );
        showToast(`🛡️ ${item.name} equipado em ${owner.name}.`);
    };

    if (previous && typeof window.openSessionConfirm === 'function') {
        window.openSessionConfirm({
            title: 'Trocar escudo?',
            message: `${previous.name} será substituído por ${item.name}.`,
            confirmLabel: 'Trocar',
            onConfirm: equip
        });
    } else {
        equip();
    }
}

function equipArmor(owner, item, part) {
    const loadout = ensureEquipmentLoadout(owner);

    if (String(loadout.armor[part]) === String(item.id)) {
        const manualDefense = Math.max(0, Number(owner?.armor?.[part]) || 0);
        runEquipmentMutation(
            owner,
            `${owner.name}: ${item.name} desequipada`,
            `${item.name} deixou de conceder defesa em ${EQUIPMENT_PART_LABELS[part]}. Defesa adicional mantida: ${manualDefense}.`,
            () => { loadout.armor[part] = null; }
        );
        showToast(`🎒 ${item.name} foi guardada.`);
        return;
    }

    const equipmentSlot = EQUIPMENT_ARMOR_PART_TO_SLOT[part];
    const criticalRestriction = window.getCriticalEquipmentSlotRestriction?.(owner, equipmentSlot);
    if (criticalRestriction) {
        showToast(`⚠️ ${criticalRestriction}`);
        return;
    }

    ensureEquipmentDefense(item);
    const previous = findEquipmentItem(owner, loadout.armor[part]);
    const manualDefense = Math.max(0, Number(owner?.armor?.[part]) || 0);
    const equip = () => {
        runEquipmentMutation(
            owner,
            `${owner.name}: ${item.name} equipada em ${EQUIPMENT_PART_LABELS[part]}`,
            `${previous?.name || 'Nenhuma peça equipada'} → ${item.name} (${item.equipmentDefense}/${item.defense}) · defesa adicional ${manualDefense} mantida`,
            () => { loadout.armor[part] = item.id; }
        );
        showToast(`🛡️ ${item.name} equipada em ${EQUIPMENT_PART_LABELS[part]}.`);
    };

    if (previous && typeof window.openSessionConfirm === 'function') {
        window.openSessionConfirm({
            title: `Trocar proteção de ${EQUIPMENT_PART_LABELS[part]}?`,
            message: `${previous.name} será substituída por ${item.name}.`,
            confirmLabel: 'Trocar',
            onConfirm: equip
        });
    } else {
        equip();
    }
}

function performSelectedEquipmentAction() {
    const owner = window.getCharacterCollectionOwner?.();
    const item = inventory.find(entry => entry.id === selectedInventoryItemId);
    const kind = getEquipmentItemKind(item);

    if (!owner || !item || !kind) return false;

    if (kind === 'weapon') equipWeapon(owner, item);
    else if (kind === 'ammunition') equipAmmunition(owner, item);
    else if (kind === 'shield') equipShield(owner, item);
    else equipArmor(owner, item, kind);

    return true;
}

function unequipEquipmentItem(itemId) {
    const owner = window.getCharacterCollectionOwner?.();
    const item = findEquipmentItem(owner, itemId);
    const status = owner ? getEquipmentStatus(owner, itemId) : null;
    if (!owner || !item || !status) return;

    const loadout = ensureEquipmentLoadout(owner);
    const finishUnequip = removeShield => {
        runEquipmentMutation(
            owner,
            `${owner.name}: ${item.name} desequipado`,
            `O item permanece disponível no inventário${removeShield ? ' · escudo guardado para ativar a próxima arma' : ''}.`,
            () => {
                if (status.kind === 'weapon') {
                    loadout.weapons[status.slotIndex] = null;
                    if (status.slotIndex === loadout.activeWeaponSlot) {
                        const nextSlot = loadout.weapons.findIndex(Boolean);
                        loadout.activeWeaponSlot = nextSlot === -1 ? 0 : nextSlot;
                    }
                } else if (status.kind === 'ammunition') {
                    loadout.ammunition[status.slotIndex] = null;
                    if (status.slotIndex === loadout.activeAmmunitionSlot) {
                        const nextSlot = loadout.ammunition.findIndex(Boolean);
                        loadout.activeAmmunitionSlot = nextSlot === -1 ? 0 : nextSlot;
                    }
                } else if (status.kind === 'shield') {
                    loadout.shield = null;
                } else {
                    loadout.armor[status.kind] = null;
                }

                if (removeShield) loadout.shield = null;
            }
        );
        closeItemDetailsModal();
        showToast(`🎒 ${item.name} foi desequipado.`);
    };

    if (status.kind === 'weapon' && status.active) {
        const nextSlot = loadout.weapons.findIndex((id, index) => Boolean(id) && index !== status.slotIndex);
        const nextWeapon = findEquipmentItem(owner, loadout.weapons[nextSlot]);
        if (nextWeapon) {
            confirmTwoHandedWeapon(owner, nextWeapon, finishUnequip);
            return;
        }
    }

    finishUnequip(false);
}

function isItemEquippedForCurrentOwner(itemId) {
    const owner = window.getCharacterCollectionOwner?.();
    return Boolean(owner && getEquipmentStatus(owner, itemId));
}

function getSelectedEquipmentActionLabel(item) {
    const owner = window.getCharacterCollectionOwner?.();
    const kind = getEquipmentItemKind(item);
    if (!owner || !kind) return null;

    const status = getEquipmentStatus(owner, item.id);
    if (!status) return 'Equipar';
    if (['weapon', 'ammunition'].includes(status.kind) && !status.active) return 'Tornar ativa';
    return 'Desequipar';
}

function updateInventoryEquipmentAction() {
    const button = document.getElementById('inventoryUseActionButton');
    if (!button) return;

    const item = inventory.find(entry => entry.id === selectedInventoryItemId);
    const equipmentLabel = getSelectedEquipmentActionLabel(item);
    const transportLabel = window.getSelectedTransportActionLabel?.(item);
    button.textContent = transportLabel || equipmentLabel || (item?.careConsumable ? 'Consumir' : 'Usar');
    button.classList.toggle('equipment-action-button', Boolean(equipmentLabel || transportLabel));
    if (typeof button.setAttribute === 'function') {
        button.setAttribute(
            'onclick',
            transportLabel
                ? `openTransportManager('${String(item?.id || '').replaceAll("'", "\\'")}')`
                : 'useSelectedInventoryItem()'
        );
    }
}

function renderEquipmentDetailsAction(item) {
    const owner = window.getCharacterCollectionOwner?.();
    const status = owner ? getEquipmentStatus(owner, item?.id) : null;
    const kind = getEquipmentItemKind(item);
    const canRepairArmor = Boolean(
        owner &&
        item &&
        kind &&
        kind !== 'weapon' &&
        kind !== 'ammunition' &&
        ensureEquipmentDefense(item) < Math.max(0, Number(item.defense) || 0)
    );
    const canRepairWeapon = Boolean(
        owner && item && kind === 'weapon' &&
        (item.weaponUnusable || Math.max(0, Number(item.durabilityDamage) || 0) > 0)
    );
    const canRepair = canRepairArmor || canRepairWeapon;

    if (!status && !canRepair) return '';

    return `
        <div class="equipment-details-actions">
            ${canRepair ? `
                <button type="button" class="equipment-details-repair" onclick="repairEquipmentItem('${escapeEquipmentHtml(item.id)}')">
                    ${canRepairWeapon
                        ? `🔧 Reparar arma${item.weaponUnusable ? ' · inutilizável' : ''}${Number(item.durabilityDamage) ? ` · desgaste ${Number(item.durabilityDamage)}` : ''}`
                        : `🔧 Reparar defesa (${ensureEquipmentDefense(item)} → ${Math.max(0, Number(item.defense) || 0)})`}
                </button>
            ` : ''}
            ${status ? `
                <button type="button" class="equipment-details-unequip" onclick="unequipEquipmentItem('${escapeEquipmentHtml(item.id)}')">
                    Desequipar
                </button>
            ` : ''}
        </div>
    `;
}

function repairEquipmentItem(itemId) {
    const owner = window.getCharacterCollectionOwner?.();
    const item = owner ? findEquipmentItem(owner, itemId) : null;
    const kind = getEquipmentItemKind(item);

    if (!owner || !item || !kind || kind === 'ammunition') return;

    if (kind === 'weapon') {
        const wear = Math.max(0, Number(item.durabilityDamage) || 0);
        const unusable = Boolean(item.weaponUnusable);
        if (!wear && !unusable) {
            showToast(`⚔️ ${item.name} não precisa de reparo.`);
            return;
        }
        runEquipmentMutation(
            owner,
            `${owner.name}: ${item.name} reparada`,
            `Desgaste removido: ${wear}${unusable ? ' · arma voltou a funcionar' : ''}`,
            () => {
                item.durabilityDamage = 0;
                item.weaponUnusable = false;
            }
        );
        closeItemDetailsModal();
        showToast(`🔧 ${item.name} foi reparada.`);
        return;
    }

    const before = ensureEquipmentDefense(item);
    const maximum = Math.max(0, Number(item.defense) || 0);

    if (before >= maximum) {
        showToast(`🛡️ ${item.name} já está com a defesa máxima.`);
        return;
    }

    runEquipmentMutation(
        owner,
        `${owner.name}: ${item.name} reparada`,
        `Defesa restaurada: ${before} → ${maximum}`,
        () => { item.equipmentDefense = maximum; }
    );

    closeItemDetailsModal();
    showToast(`🔧 ${item.name} reparada: ${before} → ${maximum} de defesa.`);
}

function getEquippedArmorSource(combatant, part) {
    const loadout = ensureEquipmentLoadout(combatant);
    const item = findEquipmentItem(combatant, loadout.armor[part]);
    if (!item) return null;

    return {
        key: 'equipment',
        item,
        name: item.name,
        current: ensureEquipmentDefense(item),
        maximum: Math.max(0, Number(item.defense) || 0)
    };
}

function getEquippedShieldSource(combatant) {
    const loadout = ensureEquipmentLoadout(combatant);
    const item = findEquipmentItem(combatant, loadout.shield);
    const activeWeapon = getActiveWeaponEntry(combatant)?.item;

    if (!item || (activeWeapon && isTwoHandedWeapon(activeWeapon))) return null;

    return {
        key: 'shield',
        item,
        name: item.name,
        current: ensureEquipmentDefense(item),
        maximum: Math.max(0, Number(item.defense) || 0)
    };
}

function getEffectiveArmorBreakdown(combatant, part) {
    const equippedRegion = getEquippedArmorSource(combatant, part);
    const shield = getEquippedShieldSource(combatant);
    const manualValue = Math.max(0, Number(combatant?.armor?.[part]) || 0);
    const equipmentValue = equippedRegion?.current || 0;
    const manualSource = manualValue > 0
        ? {
            key: 'manual',
            item: null,
            name: `Defesa adicional de ${EQUIPMENT_PART_LABELS[part]}`,
            current: manualValue,
            maximum: manualValue
        }
        : null;
    const region = manualValue + equipmentValue;
    const sources = [manualSource, equippedRegion, shield].filter(Boolean);

    return {
        part,
        manual: manualValue,
        equipment: equipmentValue,
        region,
        shield: shield?.current || 0,
        total: region + (shield?.current || 0),
        manualSource,
        equipmentSource: equippedRegion,
        shieldSource: shield,
        sources,
        // Mantido para consumidores antigos; representa a proteção física principal.
        regionSource: equippedRegion || manualSource
    };
}

function getEffectiveArmorValue(combatant, part) {
    return getEffectiveArmorBreakdown(combatant, part).total;
}

function closeArmorSourceModal() {
    pendingArmorSourceDamage = null;
    const modal = document.getElementById('armorSourceModal');
    if (modal) modal.style.display = 'none';
}

function commitArmorSourceDamage(target, part, amount, sourceKey) {
    const breakdown = getEffectiveArmorBreakdown(target, part);
    const source = breakdown.sources.find(entry => entry.key === sourceKey);
    if (!source || source.current <= 0) return;

    const before = source.current;
    const after = Math.max(0, before - amount);
    runEquipmentMutation(
        target,
        `${target.name}: ${source.name} danificado`,
        `${EQUIPMENT_PART_LABELS[part]} · ${source.name}: ${before} → ${after}`,
        () => {
            if (source.item) {
                source.item.equipmentDefense = after;
            } else {
                target.armor ||= { head: 0, torso: 0, arm: 0, leg: 0 };
                target.armor[part] = after;
            }
        }
    );

    closeArmorSourceModal();
    closeDamageModals();
    clearDisplay();
    showToast(`🛡️ ${source.name}: ${before} → ${after}`);
}

function selectArmorDamageSource(sourceKey) {
    if (!pendingArmorSourceDamage) return;
    const { target, part, amount } = pendingArmorSourceDamage;
    commitArmorSourceDamage(target, part, amount, sourceKey);
}

function requestArmorDamageSource(target, part, amount) {
    const breakdown = getEffectiveArmorBreakdown(target, part);
    const sources = breakdown.sources.filter(source => source.current > 0);

    document.getElementById('damageTypeModal').style.display = 'none';

    if (sources.length === 0) {
        closeDamageModals();
        showToast(`⚠️ ${target.name} não possui proteção em ${EQUIPMENT_PART_LABELS[part]}.`);
        return true;
    }

    if (sources.length === 1) {
        commitArmorSourceDamage(target, part, amount, sources[0].key);
        return true;
    }

    pendingArmorSourceDamage = { target, part, amount };
    const options = document.getElementById('armorSourceOptions');
    if (options) {
        options.innerHTML = sources.map(source => `
            <button type="button" class="armor-source-option" onclick="selectArmorDamageSource('${source.key}')">
                <strong>${escapeEquipmentHtml(source.name)}</strong>
                <small>${source.current}/${source.maximum} de defesa</small>
            </button>
        `).join('');
    }

    document.getElementById('armorSourceContext').textContent =
        `${target.name} · ${EQUIPMENT_PART_LABELS[part]} · dano ${amount}`;
    document.getElementById('armorSourceModal').style.display = 'flex';
    return true;
}

function cycleActiveWeapon(combatantId) {
    const owner = combatants.find(entry => String(entry.id) === String(combatantId));
    if (!owner) return;

    const loadout = ensureEquipmentLoadout(owner);
    const occupiedSlots = loadout.weapons
        .map((itemId, index) => itemId ? index : null)
        .filter(index => index !== null);

    if (occupiedSlots.length < 2) {
        showToast('Adicione uma arma reserva para realizar a troca.');
        return;
    }

    const currentPosition = occupiedSlots.indexOf(loadout.activeWeaponSlot);
    const nextSlot = occupiedSlots[(currentPosition + 1) % occupiedSlots.length];
    activateWeaponSlot(owner, nextSlot);
}

function cycleActiveAmmunition(combatantId) {
    const owner = combatants.find(entry => String(entry.id) === String(combatantId));
    const weapon = owner ? getActiveWeaponEntry(owner)?.item : null;
    if (!owner || !weapon) return;

    const loadout = ensureEquipmentLoadout(owner);
    const compatibleSlots = getCompatibleAmmunitionSlots(owner, weapon);
    if (compatibleSlots.length < 2) {
        showToast(getRequiredAmmunitionType(weapon) === 'bolt'
            ? 'Equipe uma segunda seta compatível para realizar a troca.'
            : 'Equipe uma segunda flecha compatível para realizar a troca.');
        return;
    }

    const currentPosition = compatibleSlots.indexOf(loadout.activeAmmunitionSlot);
    const nextSlot = compatibleSlots[(currentPosition + 1) % compatibleSlots.length];
    activateAmmunitionSlot(owner, nextSlot);
}

function consumeActiveAmmunition(combatantId) {
    const owner = combatants.find(entry => String(entry.id) === String(combatantId));
    const weapon = owner ? getActiveWeaponEntry(owner)?.item : null;
    const entry = owner && weapon ? getActiveAmmunitionEntry(owner, weapon) : null;
    if (!owner || !weapon || !getRequiredAmmunitionType(weapon)) return;

    if (!entry || Number(entry.item.quantity) <= 0) {
        showToast(getRequiredAmmunitionType(weapon) === 'bolt'
            ? `⚠️ ${owner.name} não possui uma seta compatível equipada.`
            : `⚠️ ${owner.name} não possui uma flecha compatível equipada.`);
        return;
    }

    const loadout = ensureEquipmentLoadout(owner);
    const item = entry.item;
    const before = Math.max(0, Number(item.quantity) || 0);
    const after = Math.max(0, before - 1);
    runEquipmentMutation(
        owner,
        `${owner.name}: Gastou 1x ${item.name}`,
        `${weapon.name} · munição ${before} → ${after}${after === 0 ? ' · estoque esgotado' : ''}`,
        () => {
            item.quantity = after;
            if (after > 0) return;

            loadout.ammunition[entry.slotIndex] = null;
            const currentOwner = window.getCharacterCollectionOwner?.();
            if (owner === currentOwner && typeof inventory !== 'undefined' && Array.isArray(inventory)) {
                inventory = inventory.filter(candidate => String(candidate.id) !== String(item.id));
                owner.inventory = inventory;
                if (String(selectedInventoryItemId) === String(item.id)) selectedInventoryItemId = null;
            } else if (Array.isArray(owner.inventory)) {
                owner.inventory = owner.inventory.filter(candidate => String(candidate.id) !== String(item.id));
            }

            const nextEntry = getActiveAmmunitionEntry(owner, weapon);
            loadout.activeAmmunitionSlot = nextEntry?.slotIndex ?? 0;
        }
    );

    const replacement = getActiveAmmunitionEntry(owner, weapon)?.item;
    showToast(after > 0
        ? `🏹 ${item.name}: ${after} restante${after === 1 ? '' : 's'}.`
        : `🏹 ${item.name} esgotada.${replacement ? ` ${replacement.name} tornou-se ativa.` : ''}`);
}

function getWeaponRollMode() {
    if (typeof appPreferences !== 'undefined') {
        return appPreferences.rollModes?.weapons || 'manual';
    }

    try {
        return JSON.parse(localStorage.getItem('dnd_app_preferences') || '{}').rollModes?.weapons || 'manual';
    } catch {
        return 'manual';
    }
}

function parseDiceExpression(expression) {
    const match = String(expression || '').trim().match(
        /^(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?(?:\s*[x*]\s*(\d+))?$/i
    );
    if (!match) return null;

    const count = Math.min(100, Math.max(1, Number(match[1])));
    const sides = Math.min(1000, Math.max(2, Number(match[2])));
    const modifier = match[3]
        ? Number(match[4]) * (match[3] === '-' ? -1 : 1)
        : 0;
    const multiplier = Math.min(20, Math.max(1, Number(match[5]) || 1));

    return { count, sides, modifier, multiplier };
}

function rollDiceExpression(expression, random = Math.random) {
    const parsed = parseDiceExpression(expression);
    if (!parsed) return null;

    const rolls = Array.from({ length: parsed.count }, () =>
        Math.floor(random() * parsed.sides) + 1
    );
    const subtotal = Math.max(0, rolls.reduce((sum, value) => sum + value, 0) + parsed.modifier);
    const total = subtotal * parsed.multiplier;

    return { ...parsed, expression: String(expression).replaceAll(' ', ''), rolls, subtotal, total };
}

function prepareDamageRoll(combatant, name, expression) {
    if (String(combatant.id) !== String(activeTurnId)) {
        showToast(`Aguarde o turno de ${combatant.name} para usar esta ação.`);
        return;
    }

    const parsed = parseDiceExpression(expression);
    if (!parsed) {
        showToast(`${name} não possui uma rolagem de dano automática.`);
        return;
    }

    if (getWeaponRollMode() !== 'auto') {
        showToast(`🎲 Role ${String(expression).replaceAll(' ', '')} na mesa para ${name}.`);
        return;
    }

    const result = rollDiceExpression(expression);
    currentInput = String(result.total);
    updateNumpad();

    const modifierText = result.modifier
        ? ` ${result.modifier > 0 ? '+' : '−'} ${Math.abs(result.modifier)}`
        : '';
    const multiplierText = result.multiplier > 1 ? ` × ${result.multiplier}` : '';
    showToast(`🎲 ${name}: ${result.rolls.join(' + ')}${modifierText}${multiplierText} = ${result.total}`);
}

function rollActiveWeapon(combatantId) {
    const combatant = combatants.find(entry => String(entry.id) === String(combatantId));
    const weapon = combatant ? getActiveWeaponEntry(combatant)?.item : null;
    if (!combatant || !weapon) return;

    const restriction = getCriticalWeaponRestriction(combatant, weapon);
    if (restriction) {
        showToast(`⚠️ ${restriction}`);
        return;
    }

    prepareDamageRoll(combatant, weapon.name, weapon.damage);
}

function normalizeMonsterAction(rawAction, index = 0) {
    if (rawAction && typeof rawAction === 'object') {
        return {
            id: rawAction.id || `monster-action-${index}`,
            name: String(rawAction.name || `Ação ${index + 1}`),
            damage: String(rawAction.damage || '').replaceAll(' ', ''),
            details: String(rawAction.details || rawAction.description || ''),
            raw: String(rawAction.raw || rawAction.name || '')
        };
    }

    const raw = String(rawAction || '').trim();
    if (!raw) return null;

    const match = raw.match(/^(.*?)(\d+d\d+(?:\s*[+-]\s*\d+)?(?:\s*[x*]\s*\d+)?)(.*)$/i);
    if (!match) {
        const [name, ...detailParts] = raw.split(/\s+[—–]\s+/);
        return {
            id: `monster-action-${index}`,
            name: name.trim() || raw,
            damage: '',
            details: detailParts.join(' — ').trim(),
            raw
        };
    }

    const name = match[1].replace(/[—:–-]+\s*$/, '').trim() || `Ataque ${index + 1}`;
    const details = match[3].replace(/^\s*[—:–-]+\s*/, '').trim();

    return {
        id: `monster-action-${index}`,
        name,
        damage: match[2].replaceAll(' ', ''),
        details,
        raw
    };
}

function buildMonsterActions(attacks) {
    return (Array.isArray(attacks) ? attacks : [])
        .map(normalizeMonsterAction)
        .filter(Boolean);
}

function ensureMonsterActions(combatant, monsterSource = null) {
    if (!combatant || combatant.type !== 'monster') return [];

    if (Array.isArray(combatant.monsterActions) && combatant.monsterActions.length) {
        combatant.monsterActions = combatant.monsterActions.map(normalizeMonsterAction).filter(Boolean);
        return combatant.monsterActions;
    }

    const preset = monsterSource
        || (combatant.presetMonsterId && typeof monsterDatabase !== 'undefined'
            ? monsterDatabase.find(monster => String(monster.id) === String(combatant.presetMonsterId))
            : null);
    const rawActions = preset?.attacks
        || String(combatant.atkInfo || '')
            .split(/\s*\/\s*/)
            .filter(Boolean);

    combatant.monsterActions = buildMonsterActions(rawActions);
    return combatant.monsterActions;
}

function normalizeMonsterAbility(rawAbility, index = 0) {
    if (rawAbility && typeof rawAbility === 'object') {
        const name = String(rawAbility.name || rawAbility.title || `Habilidade ${index + 1}`).trim();
        const description = String(
            rawAbility.description || rawAbility.details || rawAbility.effect || ''
        ).trim();

        return name || description
            ? { id: rawAbility.id || `monster-ability-${index}`, name, description }
            : null;
    }

    const raw = String(rawAbility || '').replace(/\r/g, '').trim();
    if (!raw) return null;

    const lines = raw
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);
    const name = lines.shift() || `Habilidade ${index + 1}`;

    return {
        id: `monster-ability-${index}`,
        name,
        description: lines.join(' ').replace(/\s+/g, ' ').trim()
    };
}

function buildMonsterAbilities(abilities) {
    return (Array.isArray(abilities) ? abilities : [])
        .map(normalizeMonsterAbility)
        .filter(Boolean);
}

function normalizeMonsterSkill(rawSkill, index = 0) {
    if (rawSkill && typeof rawSkill === 'object') {
        const name = String(rawSkill.name || rawSkill.label || `Perícia ${index + 1}`).trim();
        const value = String(rawSkill.value ?? rawSkill.bonus ?? '').trim();
        return name || value
            ? { id: rawSkill.id || `monster-skill-${index}`, name, value }
            : null;
    }

    const raw = String(rawSkill || '').replace(/\s+/g, ' ').trim();
    if (!raw) return null;

    const match = raw.match(/^(.*?)([+-]\s*\d+)$/);
    return {
        id: `monster-skill-${index}`,
        name: (match?.[1] || raw).trim(),
        value: match ? match[2].replace(/\s+/g, '') : ''
    };
}

function buildMonsterSkills(skills) {
    return (Array.isArray(skills) ? skills : [])
        .map(normalizeMonsterSkill)
        .filter(Boolean);
}

function findMonsterPreset(combatant, monsterSource = null) {
    if (monsterSource) return monsterSource;
    if (!combatant?.presetMonsterId || typeof monsterDatabase === 'undefined') return null;

    return monsterDatabase.find(
        monster => String(monster.id) === String(combatant.presetMonsterId)
    ) || null;
}

function ensureMonsterAbilities(combatant, monsterSource = null) {
    if (!combatant || combatant.type !== 'monster') return [];

    if (Array.isArray(combatant.monsterAbilities) && combatant.monsterAbilities.length) {
        combatant.monsterAbilities = buildMonsterAbilities(combatant.monsterAbilities);
        return combatant.monsterAbilities;
    }

    const preset = findMonsterPreset(combatant, monsterSource);
    combatant.monsterAbilities = buildMonsterAbilities(preset?.abilities);
    return combatant.monsterAbilities;
}

function ensureMonsterSkills(combatant, monsterSource = null) {
    if (!combatant || combatant.type !== 'monster') return [];

    if (Array.isArray(combatant.monsterSkills) && combatant.monsterSkills.length) {
        combatant.monsterSkills = buildMonsterSkills(combatant.monsterSkills);
        return combatant.monsterSkills;
    }

    const preset = findMonsterPreset(combatant, monsterSource);
    combatant.monsterSkills = buildMonsterSkills(preset?.skills);
    return combatant.monsterSkills;
}

function initializeCombatantEquipment(combatant, monsterSource = null) {
    ensureEquipmentLoadout(combatant);
    ensureMonsterActions(combatant, monsterSource);
    ensureMonsterAbilities(combatant, monsterSource);
    ensureMonsterSkills(combatant, monsterSource);
    return combatant;
}

function initializeEquipmentSystem() {
    combatants.forEach(combatant => {
        initializeCombatantEquipment(combatant);
        window.ensureTransportState?.(combatant);
    });

    if (typeof characterSheets !== 'undefined' && Array.isArray(characterSheets)) {
        characterSheets.forEach(sheet => {
            ensureEquipmentLoadout(sheet);
            window.ensureTransportState?.(sheet);
        });
    }

    window.persistCharacterCollections?.();
    renderInventory();
    renderList(false);
}

function toggleEquipmentPanel(combatantId) {
    const key = String(combatantId);
    if (collapsedEquipmentPanels.has(key)) collapsedEquipmentPanels.delete(key);
    else collapsedEquipmentPanels.add(key);
    renderList(false);
}

function toggleMonsterActionsPanel(combatantId) {
    const key = String(combatantId);
    if (collapsedMonsterActionPanels.has(key)) collapsedMonsterActionPanels.delete(key);
    else collapsedMonsterActionPanels.add(key);
    renderList(false);
}

function toggleMonsterAbilitiesPanel(combatantId) {
    const key = String(combatantId);
    if (expandedMonsterAbilityPanels.has(key)) expandedMonsterAbilityPanels.delete(key);
    else expandedMonsterAbilityPanels.add(key);
    renderList(false);
}

function toggleMonsterSkillsPanel(combatantId) {
    const key = String(combatantId);
    if (expandedMonsterSkillPanels.has(key)) expandedMonsterSkillPanels.delete(key);
    else expandedMonsterSkillPanels.add(key);
    renderList(false);
}

function renderEquipmentIcon(item, className = '') {
    const icon = String(item?.icon || '⚔️');
    const isImage = icon.startsWith('http') || /\.(png|jpe?g|webp|svg)$/i.test(icon);
    return isImage
        ? `<img src="${escapeEquipmentHtml(icon)}" alt="" class="${className}" draggable="false">`
        : `<span class="${className}">${escapeEquipmentHtml(icon)}</span>`;
}

function renderCombatantEquipmentPanel(combatant) {
    if (!combatant || combatant.type === 'monster') return '';

    const loadout = ensureEquipmentLoadout(combatant);
    const equippedCount = [
        ...loadout.weapons,
        ...loadout.ammunition,
        loadout.shield,
        ...EQUIPMENT_ARMOR_PARTS.map(part => loadout.armor[part])
    ].filter(Boolean).length;

    if (!equippedCount) return '';

    const collapsed = collapsedEquipmentPanels.has(String(combatant.id));
    const activeWeapon = getActiveWeaponEntry(combatant)?.item;
    const activeWeaponRestriction = getCriticalWeaponRestriction(combatant, activeWeapon);
    const weaponCount = loadout.weapons.filter(Boolean).length;
    const requiredAmmunitionType = getRequiredAmmunitionType(activeWeapon);
    const activeAmmunition = requiredAmmunitionType
        ? getActiveAmmunitionEntry(combatant, activeWeapon)?.item
        : null;
    const compatibleAmmunitionCount = requiredAmmunitionType
        ? getCompatibleAmmunitionSlots(combatant, activeWeapon).length
        : 0;
    const ammunitionDetail = activeAmmunition
        ? [...new Set([activeAmmunition.damage, activeAmmunition.effect]
            .map(value => String(value || '').trim())
            .filter(value => value && value !== '0'))].join(' · ') || 'Munição padrão'
        : '';
    const shield = getEquippedShieldSource(combatant);
    const carriedWeight = getCharacterCarriedWeightBreakdown(combatant);
    const derived = combatant.creationMode === 'full'
        ? window.characterSheetModel?.calculateCharacterDerivedValues(combatant, {
            equippedWeight: carriedWeight.total
        })
        : null;
    const displayedMovement = window.getEffectiveCombatantMovement?.(combatant)?.value
        ?? derived?.movement;
    const armorValues = EQUIPMENT_ARMOR_PARTS.map(part => ({
        part,
        ...getEffectiveArmorBreakdown(combatant, part)
    }));

    return `
        <section class="combat-equipment-panel ${collapsed ? 'is-collapsed' : ''}" aria-label="Equipamentos de ${escapeEquipmentHtml(combatant.name)}">
            <button type="button" class="combat-subpanel-header" onclick="event.stopPropagation(); toggleEquipmentPanel('${escapeEquipmentHtml(combatant.id)}')">
                <span>${collapsed ? '▶' : '▼'} EQUIPAMENTOS</span>
                <small>${escapeEquipmentHtml(activeWeapon?.name || `${equippedCount} equipado${equippedCount === 1 ? '' : 's'}`)}</small>
            </button>
            ${collapsed ? '' : `
                <div class="combat-equipment-content">
                    ${activeWeapon ? `
                        <article class="active-weapon-card ${weaponCount > 1 ? 'has-swap' : ''} ${activeWeaponRestriction ? 'is-unusable' : ''}">
                            ${renderEquipmentIcon(activeWeapon, 'active-weapon-icon')}
                            <div class="active-weapon-copy">
                                <strong>${escapeEquipmentHtml(activeWeapon.name)}</strong>
                                <small>${escapeEquipmentHtml(activeWeapon.damage)}${activeWeapon.effect?.trim() ? ` · ${escapeEquipmentHtml(activeWeapon.effect)}` : ''}${Number(activeWeapon.durabilityDamage) ? ` · desgaste ${Math.max(0, Number(activeWeapon.durabilityDamage) || 0)}` : ''}${activeWeaponRestriction ? ` · ${escapeEquipmentHtml(activeWeaponRestriction)}` : ''}</small>
                            </div>
                            <button type="button" class="equipment-roll-button" onclick="event.stopPropagation(); rollActiveWeapon('${escapeEquipmentHtml(combatant.id)}')" title="${getWeaponRollMode() === 'auto' ? 'Rolar dano' : 'Consultar rolagem'}">🎲</button>
                            ${weaponCount > 1 ? `
                                <button type="button" class="equipment-swap-button" onclick="event.stopPropagation(); cycleActiveWeapon('${escapeEquipmentHtml(combatant.id)}')" title="Trocar para a próxima arma">🔄</button>
                            ` : ''}
                        </article>
                        ${requiredAmmunitionType ? `
                            <article class="active-ammunition-card ${activeAmmunition ? '' : 'is-empty'} ${compatibleAmmunitionCount > 1 ? 'has-swap' : ''}">
                                ${activeAmmunition
                                    ? renderEquipmentIcon(activeAmmunition, 'active-ammunition-icon')
                                    : '<span class="active-ammunition-icon">🏹</span>'}
                                <div class="active-ammunition-copy">
                                    <small>${requiredAmmunitionType === 'bolt' ? 'SETA EQUIPADA' : 'FLECHA EQUIPADA'}</small>
                                    <strong>${escapeEquipmentHtml(activeAmmunition?.name || `Nenhuma ${requiredAmmunitionType === 'bolt' ? 'seta' : 'flecha'} compatível`)}</strong>
                                    ${activeAmmunition ? `<span>x${Math.max(0, Number(activeAmmunition.quantity) || 0)} · ${escapeEquipmentHtml(ammunitionDetail)}</span>` : ''}
                                </div>
                                ${activeAmmunition ? `
                                    <button type="button" class="equipment-ammunition-use" onclick="event.stopPropagation(); consumeActiveAmmunition('${escapeEquipmentHtml(combatant.id)}')" title="Gastar uma munição">−1</button>
                                ` : ''}
                                ${compatibleAmmunitionCount > 1 ? `
                                    <button type="button" class="equipment-ammunition-swap" onclick="event.stopPropagation(); cycleActiveAmmunition('${escapeEquipmentHtml(combatant.id)}')" title="Trocar para a segunda munição">🔄</button>
                                ` : ''}
                            </article>
                        ` : ''}
                    ` : '<p class="equipment-empty-line">Nenhuma arma ativa.</p>'}
                    <div class="armor-summary-grid">
                        ${armorValues.map(value => `
                            <div title="${escapeEquipmentHtml(EQUIPMENT_PART_LABELS[value.part])}: adicional ${value.manual} + equipamento ${value.equipment} + escudo ${value.shield}">
                                <span>${({ head: '🪖', torso: '🦺', arm: '🦾', leg: '🥾' })[value.part]}</span>
                                <small>${escapeEquipmentHtml(EQUIPMENT_PART_LABELS[value.part])}</small>
                                <strong>${value.total}</strong>
                            </div>
                        `).join('')}
                    </div>
                    ${shield ? `<div class="equipped-shield-line">🛡️ ${escapeEquipmentHtml(shield.name)} · +${shield.current} em todas as regiões</div>` : ''}
                    ${derived ? `
                        <div class="equipment-derived-line">
                            <span title="${escapeEquipmentHtml(carriedWeight.modeLabel)}">⚖️ ${carriedWeight.total}/${derived.carryingCapacity} de carga</span>
                            <span>👣 Movimento ${displayedMovement}</span>
                        </div>
                    ` : ''}
                </div>
            `}
        </section>
    `;
}

function rollMonsterAction(combatantId, actionIndex) {
    const combatant = combatants.find(entry => String(entry.id) === String(combatantId));
    const action = combatant ? ensureMonsterActions(combatant)[Number(actionIndex)] : null;
    if (!combatant || !action) return;

    if (String(combatant.id) !== String(activeTurnId)) {
        showToast(`Aguarde o turno de ${combatant.name} para usar esta ação.`);
        return;
    }

    if (!action.damage) {
        showToast(`👹 ${action.name}${action.details ? `: ${action.details}` : ''}`);
        return;
    }

    prepareDamageRoll(combatant, action.name, action.damage);
}

function renderMonsterActionsPanel(combatant) {
    if (!combatant || combatant.type !== 'monster') return '';

    const actions = ensureMonsterActions(combatant);
    if (!actions.length) return '';

    const collapsed = collapsedMonsterActionPanels.has(String(combatant.id));
    return `
        <section class="monster-actions-panel ${collapsed ? 'is-collapsed' : ''}" aria-label="Ataques de ${escapeEquipmentHtml(combatant.name)}">
            <button type="button" class="combat-subpanel-header monster-actions-header" onclick="event.stopPropagation(); toggleMonsterActionsPanel('${escapeEquipmentHtml(combatant.id)}')">
                <span>${collapsed ? '▶' : '▼'} ATAQUES</span>
                <small>${actions.length} ${actions.length === 1 ? 'ação' : 'ações'}</small>
            </button>
            ${collapsed ? '' : `
                <div class="monster-action-grid">
                    ${actions.map((action, index) => `
                        <button type="button" class="monster-action-card" onclick="event.stopPropagation(); rollMonsterAction('${escapeEquipmentHtml(combatant.id)}', ${index})" title="${escapeEquipmentHtml(action.raw)}">
                            <span class="monster-action-icon">${action.damage ? '⚔️' : '✦'}</span>
                            <span class="monster-action-copy">
                                <strong>${escapeEquipmentHtml(action.name)}</strong>
                                <small>
                                    ${escapeEquipmentHtml(action.damage || 'Ação especial')}
                                    ${action.details ? ` · ${escapeEquipmentHtml(action.details)}` : ''}
                                </small>
                            </span>
                            ${action.damage ? '<span class="monster-action-die">🎲</span>' : ''}
                        </button>
                    `).join('')}
                </div>
            `}
        </section>
    `;
}

function renderMonsterAbilitiesPanel(combatant) {
    if (!combatant || combatant.type !== 'monster') return '';

    const abilities = ensureMonsterAbilities(combatant);
    if (!abilities.length) return '';

    const expanded = expandedMonsterAbilityPanels.has(String(combatant.id));
    return `
        <section class="monster-abilities-panel ${expanded ? '' : 'is-collapsed'}" aria-label="Habilidades de ${escapeEquipmentHtml(combatant.name)}">
            <button type="button" class="combat-subpanel-header monster-abilities-header" aria-expanded="${expanded}" onclick="event.stopPropagation(); toggleMonsterAbilitiesPanel('${escapeEquipmentHtml(combatant.id)}')">
                <span>${expanded ? '▼' : '▶'} HABILIDADES</span>
                <small>${abilities.length} ${abilities.length === 1 ? 'habilidade' : 'habilidades'}</small>
            </button>
            ${expanded ? `
                <div class="monster-ability-list">
                    ${abilities.map(ability => `
                        <article class="monster-ability-card">
                            <span class="monster-reference-icon" aria-hidden="true">✦</span>
                            <div>
                                <strong>${escapeEquipmentHtml(ability.name)}</strong>
                                ${ability.description
                                    ? `<p>${escapeEquipmentHtml(ability.description)}</p>`
                                    : '<p>Sem descrição adicional.</p>'}
                            </div>
                        </article>
                    `).join('')}
                </div>
            ` : ''}
        </section>
    `;
}

function renderMonsterSkillsPanel(combatant) {
    if (!combatant || combatant.type !== 'monster') return '';

    const skills = ensureMonsterSkills(combatant);
    if (!skills.length) return '';

    const expanded = expandedMonsterSkillPanels.has(String(combatant.id));
    return `
        <section class="monster-skills-panel ${expanded ? '' : 'is-collapsed'}" aria-label="Perícias de ${escapeEquipmentHtml(combatant.name)}">
            <button type="button" class="combat-subpanel-header monster-skills-header" aria-expanded="${expanded}" onclick="event.stopPropagation(); toggleMonsterSkillsPanel('${escapeEquipmentHtml(combatant.id)}')">
                <span>${expanded ? '▼' : '▶'} PERÍCIAS</span>
                <small>${skills.length} ${skills.length === 1 ? 'perícia' : 'perícias'}</small>
            </button>
            ${expanded ? `
                <div class="monster-skill-grid">
                    ${skills.map(skill => `
                        <div class="monster-skill-card">
                            <span>${escapeEquipmentHtml(skill.name)}</span>
                            ${skill.value ? `<strong>${escapeEquipmentHtml(skill.value)}</strong>` : ''}
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </section>
    `;
}

window.getEquipmentItemKind = getEquipmentItemKind;
window.getEquipmentItemSlot = getEquipmentItemSlot;
window.getEquipmentSlotLabel = getEquipmentSlotLabel;
window.getAmmunitionType = getAmmunitionType;
window.getRequiredAmmunitionType = getRequiredAmmunitionType;
window.isAmmunitionCompatibleWithWeapon = isAmmunitionCompatibleWithWeapon;
window.isEquipmentItem = isEquipmentItem;
window.isTwoHandedWeapon = isTwoHandedWeapon;
window.ensureEquipmentLoadout = ensureEquipmentLoadout;
window.getActiveWeaponEntry = getActiveWeaponEntry;
window.getCriticalWeaponRestriction = getCriticalWeaponRestriction;
window.applyActiveWeaponDurabilityDamage = applyActiveWeaponDurabilityDamage;
window.markActiveWeaponUnusable = markActiveWeaponUnusable;
window.disarmActiveWeapon = disarmActiveWeapon;
window.consumeActiveAmmunitionForOutcome = consumeActiveAmmunitionForOutcome;
window.enforceCriticalEquipmentRestrictions = enforceCriticalEquipmentRestrictions;
window.getEquipmentItemWeight = getEquipmentItemWeight;
window.getCarriedWeightMode = getCarriedWeightMode;
window.getInventoryWeightBreakdown = getInventoryWeightBreakdown;
window.getEquippedWeightBreakdown = getEquippedWeightBreakdown;
window.getCharacterCarriedWeightBreakdown = getCharacterCarriedWeightBreakdown;
window.initializeCombatantEquipment = initializeCombatantEquipment;
window.initializeEquipmentSystem = initializeEquipmentSystem;
window.getInventoryEquipmentBadge = getInventoryEquipmentBadge;
window.getSelectedEquipmentActionLabel = getSelectedEquipmentActionLabel;
window.updateInventoryEquipmentAction = updateInventoryEquipmentAction;
window.performSelectedEquipmentAction = performSelectedEquipmentAction;
window.unequipEquipmentItem = unequipEquipmentItem;
window.repairEquipmentItem = repairEquipmentItem;
window.isItemEquippedForCurrentOwner = isItemEquippedForCurrentOwner;
window.renderEquipmentDetailsAction = renderEquipmentDetailsAction;
window.getEffectiveArmorBreakdown = getEffectiveArmorBreakdown;
window.getEffectiveArmorValue = getEffectiveArmorValue;
window.getEquipmentDefenseLabel = getEquipmentDefenseLabel;
window.requestArmorDamageSource = requestArmorDamageSource;
window.selectArmorDamageSource = selectArmorDamageSource;
window.closeArmorSourceModal = closeArmorSourceModal;
window.cycleActiveWeapon = cycleActiveWeapon;
window.cycleActiveAmmunition = cycleActiveAmmunition;
window.consumeActiveAmmunition = consumeActiveAmmunition;
window.rollActiveWeapon = rollActiveWeapon;
window.rollDiceExpression = rollDiceExpression;
window.normalizeMonsterAction = normalizeMonsterAction;
window.buildMonsterActions = buildMonsterActions;
window.ensureMonsterActions = ensureMonsterActions;
window.normalizeMonsterAbility = normalizeMonsterAbility;
window.buildMonsterAbilities = buildMonsterAbilities;
window.ensureMonsterAbilities = ensureMonsterAbilities;
window.normalizeMonsterSkill = normalizeMonsterSkill;
window.buildMonsterSkills = buildMonsterSkills;
window.ensureMonsterSkills = ensureMonsterSkills;
window.toggleEquipmentPanel = toggleEquipmentPanel;
window.toggleMonsterActionsPanel = toggleMonsterActionsPanel;
window.toggleMonsterAbilitiesPanel = toggleMonsterAbilitiesPanel;
window.toggleMonsterSkillsPanel = toggleMonsterSkillsPanel;
window.renderCombatantEquipmentPanel = renderCombatantEquipmentPanel;
window.renderMonsterActionsPanel = renderMonsterActionsPanel;
window.renderMonsterAbilitiesPanel = renderMonsterAbilitiesPanel;
window.renderMonsterSkillsPanel = renderMonsterSkillsPanel;
window.rollMonsterAction = rollMonsterAction;
window.escapeEquipmentHtml = escapeEquipmentHtml;
