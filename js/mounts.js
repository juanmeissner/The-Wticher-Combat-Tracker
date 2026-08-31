(function initializeMountSystem(global) {
    'use strict';

    const TRANSPORT_SCHEMA_VERSION = 2;
    const MOUNT_SLOTS = Object.freeze(['saddle', 'saddlebags', 'barding', 'horseshoes']);
    const MOUNT_SLOT_LABELS = Object.freeze({
        saddle: 'Sela',
        saddlebags: 'Alforjes',
        barding: 'Barda',
        horseshoes: 'Ferraduras'
    });
    const MOUNT_CONDITIONS = Object.freeze({
        frightened: Object.freeze({ icon: '😨', label: 'Assustada', movementModifier: -2 }),
        stunned: Object.freeze({ icon: '💫', label: 'Atordoada', immobilized: true }),
        fallen: Object.freeze({ icon: '🧎', label: 'Caída', immobilized: true, forcesDismount: true }),
        fleeing: Object.freeze({ icon: '🏃', label: 'Em fuga', forcesDismount: true })
    });
    const expandedMountPanels = new Set();
    const cargoTransferDrafts = new Map();
    let focusedAsset = null;
    let pendingDamageChoice = null;

    function clone(value, fallback = null) {
        try {
            return JSON.parse(JSON.stringify(value ?? fallback));
        } catch {
            return clone(fallback, null);
        }
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function makeId(prefix) {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }

    function getCatalogItem(itemOrId) {
        const id = typeof itemOrId === 'object' ? itemOrId?.id : itemOrId;
        const catalog = typeof predefinedItems !== 'undefined' && Array.isArray(predefinedItems)
            ? predefinedItems
            : [];
        return catalog.find(item => String(item.id) === String(id)) || (typeof itemOrId === 'object' ? itemOrId : null);
    }

    function getTransportItemKind(item) {
        const source = getCatalogItem(item) || item;
        const kind = String(source?.transportKind || source?.type || '').toLowerCase();
        return ['mount', 'vehicle', 'mount-gear'].includes(kind) ? kind : null;
    }

    function isTransportSystemItem(item) {
        return Boolean(getTransportItemKind(item));
    }

    function getOwnerInventory(owner) {
        const currentOwner = global.getCharacterCollectionOwner?.();
        if (owner && owner === currentOwner && typeof inventory !== 'undefined' && Array.isArray(inventory)) {
            return inventory;
        }
        return Array.isArray(owner?.inventory) ? owner.inventory : [];
    }

    function createMountInstance(template, index = 0) {
        const maximum = Math.max(1, Number(template?.hp) || 1);
        return {
            id: makeId('mount'),
            templateId: template?.id || '',
            name: `${template?.name || 'Montaria'}${index > 0 ? ` ${index + 1}` : ''}`,
            hpMax: maximum,
            hpCurrent: maximum,
            movement: Math.max(1, Number(template?.movement) || 5),
            equipment: { saddle: null, saddlebags: null, barding: null, horseshoes: null },
            bardingDefenseCurrent: null,
            conditions: [],
            cargo: [],
            attachedVehicleId: null
        };
    }

    function normalizeMountConditions(conditions) {
        return [...new Set((Array.isArray(conditions) ? conditions : [])
            .map(condition => String(condition || '').trim())
            .filter(condition => MOUNT_CONDITIONS[condition]))];
    }

    function getMountHealthState(mount) {
        const current = Math.max(0, Number(mount?.hpCurrent) || 0);
        const maximum = Math.max(1, Number(mount?.hpMax) || 1);
        const ratio = current / maximum;
        if (current <= 0) return { id: 'defeated', icon: '💀', label: 'Derrotada' };
        if (ratio <= .25) return { id: 'critical', icon: '🩸', label: 'Gravemente ferida' };
        if (ratio <= .5) return { id: 'wounded', icon: '🩹', label: 'Ferida' };
        return { id: 'healthy', icon: '❤️', label: 'Saudável' };
    }

    function hasMountCondition(mount, conditionId) {
        return normalizeMountConditions(mount?.conditions).includes(String(conditionId));
    }

    function isMountUnavailable(mount) {
        return !mount
            || Number(mount.hpCurrent) <= 0
            || mount.attachedVehicleId
            || normalizeMountConditions(mount.conditions).some(conditionId => MOUNT_CONDITIONS[conditionId]?.forcesDismount);
    }

    function createVehicleInstance(template, index = 0) {
        const maximum = Math.max(1, Number(template?.hp) || 1);
        return {
            id: makeId('vehicle'),
            templateId: template?.id || '',
            name: `${template?.name || 'Veículo'}${index > 0 ? ` ${index + 1}` : ''}`,
            hpMax: maximum,
            hpCurrent: maximum,
            requiredMounts: Math.max(1, Number(template?.requiredMounts) || 1),
            capacity: Math.max(0, Number(template?.capacity) || 0),
            movementModifier: Number(template?.movementModifier) || 0,
            hitchedMountIds: [],
            cargo: []
        };
    }

    function normalizeCargo(cargo) {
        return (Array.isArray(cargo) ? cargo : [])
            .map(item => ({ ...clone(item, {}), quantity: Math.max(0, Number(item?.quantity) || 0) }))
            .filter(item => item.id && item.quantity > 0);
    }

    function ensureTransportState(owner, { synchronize = true } = {}) {
        if (!owner) return null;
        const saved = owner.transport && typeof owner.transport === 'object' ? owner.transport : {};
        if (
            Number(saved.version) === TRANSPORT_SCHEMA_VERSION
            && Array.isArray(saved.mounts)
            && Array.isArray(saved.vehicles)
        ) {
            saved.mounts.forEach(mount => {
                mount.conditions = normalizeMountConditions(mount.conditions);
            });
            if (synchronize) synchronizeTransportAssets(owner, saved);
            if (!saved.mounts.some(mount => String(mount.id) === String(saved.activeMountId))) {
                saved.activeMountId = saved.mounts[0]?.id || null;
                saved.mounted = false;
            }
            if (!saved.vehicles.some(vehicle => String(vehicle.id) === String(saved.activeVehicleId))) {
                saved.activeVehicleId = saved.vehicles[0]?.id || null;
            }
            const current = saved.mounts.find(mount => String(mount.id) === String(saved.activeMountId));
            if (isMountUnavailable(current)) saved.mounted = false;
            return saved;
        }
        const state = {
            version: TRANSPORT_SCHEMA_VERSION,
            mounted: Boolean(saved.mounted),
            activeMountId: saved.activeMountId || null,
            activeVehicleId: saved.activeVehicleId || null,
            mounts: (Array.isArray(saved.mounts) ? saved.mounts : []).map(mount => ({
                ...mount,
                id: mount.id || makeId('mount'),
                hpMax: Math.max(1, Number(mount.hpMax) || 1),
                hpCurrent: Math.max(0, Math.min(Math.max(1, Number(mount.hpMax) || 1), Number(mount.hpCurrent) || 0)),
                movement: Math.max(1, Number(mount.movement) || 5),
                equipment: MOUNT_SLOTS.reduce((result, slot) => {
                    result[slot] = mount.equipment?.[slot] || null;
                    return result;
                }, {}),
                bardingDefenseCurrent: Number.isFinite(Number(mount.bardingDefenseCurrent))
                    ? Math.max(0, Number(mount.bardingDefenseCurrent))
                    : null,
                conditions: normalizeMountConditions(mount.conditions),
                cargo: normalizeCargo(mount.cargo),
                attachedVehicleId: mount.attachedVehicleId || null
            })),
            vehicles: (Array.isArray(saved.vehicles) ? saved.vehicles : []).map(vehicle => ({
                ...vehicle,
                id: vehicle.id || makeId('vehicle'),
                hpMax: Math.max(1, Number(vehicle.hpMax) || 1),
                hpCurrent: Math.max(0, Math.min(Math.max(1, Number(vehicle.hpMax) || 1), Number(vehicle.hpCurrent) || 0)),
                requiredMounts: Math.max(1, Number(vehicle.requiredMounts) || 1),
                capacity: Math.max(0, Number(vehicle.capacity) || 0),
                movementModifier: Number(vehicle.movementModifier) || 0,
                hitchedMountIds: Array.isArray(vehicle.hitchedMountIds) ? vehicle.hitchedMountIds.filter(Boolean) : [],
                cargo: normalizeCargo(vehicle.cargo)
            }))
        };
        owner.transport = state;

        if (synchronize) synchronizeTransportAssets(owner, state);

        if (!state.mounts.some(mount => String(mount.id) === String(state.activeMountId))) {
            state.activeMountId = state.mounts[0]?.id || null;
            state.mounted = false;
        }
        if (!state.vehicles.some(vehicle => String(vehicle.id) === String(state.activeVehicleId))) {
            state.activeVehicleId = state.vehicles[0]?.id || null;
        }
        const activeMount = state.mounts.find(mount => String(mount.id) === String(state.activeMountId));
        if (isMountUnavailable(activeMount)) state.mounted = false;
        return state;
    }

    function canDiscardMount(mount, state) {
        return !mount.cargo.length
            && !MOUNT_SLOTS.some(slot => mount.equipment?.[slot])
            && !mount.attachedVehicleId
            && !(state.mounted && String(state.activeMountId) === String(mount.id));
    }

    function canDiscardVehicle(vehicle) {
        return !vehicle.cargo.length && !(vehicle.hitchedMountIds || []).length;
    }

    function synchronizeTransportAssets(owner, existingState = null) {
        if (!owner) return null;
        const state = existingState || ensureTransportState(owner, { synchronize: false });
        const ownerInventory = getOwnerInventory(owner);

        ['mount', 'vehicle'].forEach(kind => {
            ownerInventory
                .filter(item => getTransportItemKind(item) === kind)
                .forEach(item => {
                    const list = kind === 'mount' ? state.mounts : state.vehicles;
                    const desired = Math.max(0, Number(item.quantity) || 0);
                    let matches = list.filter(asset => String(asset.templateId) === String(item.id));
                    while (matches.length < desired) {
                        const instance = kind === 'mount'
                            ? createMountInstance(getCatalogItem(item), matches.length)
                            : createVehicleInstance(getCatalogItem(item), matches.length);
                        list.push(instance);
                        matches.push(instance);
                    }
                    while (matches.length > desired) {
                        const removable = [...matches].reverse().find(asset => (
                            kind === 'mount' ? canDiscardMount(asset, state) : canDiscardVehicle(asset)
                        ));
                        if (!removable) break;
                        const index = list.findIndex(asset => String(asset.id) === String(removable.id));
                        if (index >= 0) list.splice(index, 1);
                        matches = matches.filter(asset => String(asset.id) !== String(removable.id));
                    }
                });

            const inventoryIds = new Set(ownerInventory
                .filter(item => getTransportItemKind(item) === kind)
                .map(item => String(item.id)));
            const list = kind === 'mount' ? state.mounts : state.vehicles;
            [...list].forEach(asset => {
                if (inventoryIds.has(String(asset.templateId))) return;
                const removable = kind === 'mount' ? canDiscardMount(asset, state) : canDiscardVehicle(asset);
                if (!removable) return;
                const index = list.findIndex(entry => String(entry.id) === String(asset.id));
                if (index >= 0) list.splice(index, 1);
            });
        });
        return state;
    }

    function getActiveMount(owner, { requireMounted = false } = {}) {
        const state = ensureTransportState(owner);
        if (!state || (requireMounted && !state.mounted)) return null;
        return state.mounts.find(mount => String(mount.id) === String(state.activeMountId)) || null;
    }

    function getMountGear(owner, mount, slot) {
        const itemId = mount?.equipment?.[slot];
        return itemId ? getOwnerInventory(owner).find(item => String(item.id) === String(itemId)) || getCatalogItem(itemId) : null;
    }

    function getMountCapacity(owner, mount) {
        return Math.max(0, Number(getMountGear(owner, mount, 'saddlebags')?.capacity) || 0);
    }

    function getItemWeight(item) {
        return global.getEquipmentItemWeight
            ? global.getEquipmentItemWeight(item)
            : Math.max(0, Number(item?.weight) || 0);
    }

    function getCargoWeight(cargo) {
        return Math.round((normalizeCargo(cargo).reduce(
            (total, item) => total + (getItemWeight(item) * Math.max(0, Number(item.quantity) || 0)),
            0
        ) + Number.EPSILON) * 100) / 100;
    }

    function getMountLoadBreakdown(owner, mount) {
        const equipmentEntries = MOUNT_SLOTS.map(slot => {
            const item = getMountGear(owner, mount, slot);
            return item ? { slot, itemId: item.id, name: item.name, weight: getItemWeight(item) } : null;
        }).filter(Boolean);
        const equipmentWeight = Math.round((equipmentEntries.reduce((total, entry) => total + entry.weight, 0) + Number.EPSILON) * 100) / 100;
        const cargoWeight = getCargoWeight(mount?.cargo);
        const capacity = getMountCapacity(owner, mount);
        const excessCargo = Math.max(0, Math.round((cargoWeight - capacity + Number.EPSILON) * 100) / 100);
        return {
            cargoWeight,
            equipmentWeight,
            total: Math.round((cargoWeight + equipmentWeight + Number.EPSILON) * 100) / 100,
            capacity,
            excessCargo,
            isOverloaded: excessCargo > 0,
            equipmentEntries
        };
    }

    function getVehicleLoadBreakdown(vehicle) {
        const cargoWeight = getCargoWeight(vehicle?.cargo);
        const capacity = Math.max(0, Number(vehicle?.capacity) || 0);
        const excessCargo = Math.max(0, Math.round((cargoWeight - capacity + Number.EPSILON) * 100) / 100);
        return {
            cargoWeight,
            equipmentWeight: 0,
            total: cargoWeight,
            capacity,
            excessCargo,
            isOverloaded: excessCargo > 0,
            equipmentEntries: []
        };
    }

    function getCargoStorageOptions(owner) {
        const state = ensureTransportState(owner);
        return [
            { key: 'owner', kind: 'owner', id: owner.id, name: `🎒 ${owner.name || 'Personagem'}`, cargo: getOwnerInventory(owner), capacity: null },
            ...state.mounts.map(mount => ({
                key: `mount:${mount.id}`,
                kind: 'mount',
                id: mount.id,
                name: `🐎 ${mount.name}`,
                cargo: mount.cargo,
                capacity: getMountCapacity(owner, mount)
            })),
            ...state.vehicles.map(vehicle => ({
                key: `vehicle:${vehicle.id}`,
                kind: 'vehicle',
                id: vehicle.id,
                name: `🛒 ${vehicle.name}`,
                cargo: vehicle.cargo,
                capacity: Math.max(0, Number(vehicle.capacity) || 0)
            }))
        ];
    }

    function resolveCargoStorage(owner, storageKey) {
        return getCargoStorageOptions(owner).find(storage => String(storage.key) === String(storageKey)) || null;
    }

    function getTransferableStorageItems(owner, storage) {
        if (!storage) return [];
        return storage.cargo.filter(item => {
            if (item.id === 'coroa' || ['mount', 'vehicle'].includes(getTransportItemKind(item))) return false;
            const quantity = storage.kind === 'owner'
                ? getAvailableInventoryQuantity(owner, item)
                : Math.max(0, Number(item.quantity) || 0);
            return quantity > 0;
        });
    }

    function getTransferableStorageQuantity(owner, storage, item) {
        if (!storage || !item) return 0;
        return storage.kind === 'owner'
            ? getAvailableInventoryQuantity(owner, item)
            : Math.max(0, Number(item.quantity) || 0);
    }

    function getCargoTransferDraft(owner) {
        const ownerKey = String(owner.id);
        const storages = getCargoStorageOptions(owner);
        const keys = storages.map(storage => storage.key);
        const saved = cargoTransferDrafts.get(ownerKey) || {};
        let sourceKey = keys.includes(saved.sourceKey) ? saved.sourceKey : 'owner';
        let destinationKey = keys.includes(saved.destinationKey) ? saved.destinationKey : (keys.find(key => key !== sourceKey) || sourceKey);
        if (destinationKey === sourceKey) destinationKey = keys.find(key => key !== sourceKey) || sourceKey;
        const source = resolveCargoStorage(owner, sourceKey);
        const items = getTransferableStorageItems(owner, source);
        const itemId = items.some(item => String(item.id) === String(saved.itemId))
            ? saved.itemId
            : (items[0]?.id || '');
        const draft = {
            sourceKey,
            destinationKey,
            itemId,
            quantity: Math.max(1, Number(saved.quantity) || 1)
        };
        cargoTransferDrafts.set(ownerKey, draft);
        return draft;
    }

    function getMountMovement(owner, mount) {
        if (!mount) return 0;
        const activeConditions = normalizeMountConditions(mount.conditions);
        if (activeConditions.some(conditionId => MOUNT_CONDITIONS[conditionId]?.immobilized)) return 0;
        const modifiers = ['barding', 'horseshoes'].reduce(
            (total, slot) => total + (Number(getMountGear(owner, mount, slot)?.movementModifier) || 0),
            0
        );
        const conditionModifier = activeConditions.reduce(
            (total, conditionId) => total + (Number(MOUNT_CONDITIONS[conditionId]?.movementModifier) || 0),
            0
        );
        const overloadPenalty = Math.ceil(getMountLoadBreakdown(owner, mount).excessCargo);
        return Math.max(1, Math.floor((Number(mount.movement) || 5) + modifiers + conditionModifier - overloadPenalty));
    }

    function getEffectiveCombatantMovement(combatant) {
        const mount = getActiveMount(combatant, { requireMounted: true });
        if (mount && mount.hpCurrent > 0 && !mount.attachedVehicleId) {
            return {
                value: getMountMovement(combatant, mount),
                mounted: true,
                mount,
                title: `Montado em ${mount.name}`
            };
        }
        const value = Math.max(0, Number(combatant?.movement) || 5);
        return { value, mounted: false, mount: null, title: 'Movimento do personagem' };
    }

    function getUsedGearQuantity(owner, itemId, ignoredMountId = null) {
        const state = ensureTransportState(owner);
        return state.mounts.reduce((total, mount) => {
            if (String(mount.id) === String(ignoredMountId)) return total;
            return total + MOUNT_SLOTS.filter(slot => String(mount.equipment?.[slot]) === String(itemId)).length;
        }, 0);
    }

    function getAvailableInventoryQuantity(owner, item) {
        let reserved = 0;
        if (global.isItemEquippedForCurrentOwner?.(item.id)) reserved += 1;
        if (getTransportItemKind(item) === 'mount-gear') reserved += getUsedGearQuantity(owner, item.id);
        return Math.max(0, (Number(item.quantity) || 0) - reserved);
    }

    function canRemoveTransportInventoryItem(item) {
        const kind = getTransportItemKind(item);
        if (!kind) return true;
        if (kind === 'mount-gear') {
            const owner = global.getCharacterCollectionOwner?.();
            return !owner || getAvailableInventoryQuantity(owner, item) > 0;
        }
        const owner = global.getCharacterCollectionOwner?.();
        const state = owner ? ensureTransportState(owner) : null;
        if (!state) return true;
        const list = kind === 'mount' ? state.mounts : state.vehicles;
        const candidates = list.filter(asset => String(asset.templateId) === String(item.id));
        return candidates.some(asset => kind === 'mount' ? canDiscardMount(asset, state) : canDiscardVehicle(asset));
    }

    function persist(owner, message = '') {
        synchronizeTransportAssets(owner);
        if (owner?.sheetId && typeof characterSheets !== 'undefined' && Array.isArray(characterSheets)) {
            const sheet = characterSheets.find(entry => String(entry.id) === String(owner.sheetId));
            if (sheet) {
                sheet.transport = clone(owner.transport, {});
                sheet.inventory = clone(getOwnerInventory(owner), []);
                sheet.updatedAt = new Date().toISOString();
            }
        }
        if (typeof saveInventory === 'function') saveInventory();
        global.savePlayersToStorage?.();
        if (typeof persistCharacterSheets === 'function') persistCharacterSheets();
        if (typeof renderInventory === 'function' && document.getElementById('inventoryList')) renderInventory();
        if (typeof renderList === 'function' && document.getElementById('combatList')) renderList(false);
        if (message) global.showToast?.(message);
    }

    function addHistory(owner, title, detail, type = 'effect') {
        global.addCombatHistoryEntry?.(title, detail, {
            type,
            target: owner ? { id: owner.id, name: owner.name } : null,
            participants: owner ? [{ id: owner.id, name: owner.name }] : []
        });
    }

    function ensureModal() {
        let modal = document.getElementById('transportManagerModal');
        if (modal) return modal;
        modal = document.createElement('div');
        modal.id = 'transportManagerModal';
        modal.className = 'transport-modal hidden';
        modal.innerHTML = '<div class="transport-dialog" role="dialog" aria-modal="true"><div id="transportManagerContent"></div></div>';
        modal.addEventListener('click', event => {
            if (event.target === modal) closeTransportManager();
        });
        document.body.appendChild(modal);
        return modal;
    }

    function closeTransportManager() {
        document.getElementById('transportManagerModal')?.classList.add('hidden');
    }

    function renderGearSelect(owner, mount, slot) {
        const inventoryItems = getOwnerInventory(owner).filter(item => (
            getTransportItemKind(item) === 'mount-gear' && String(item.mountSlot) === slot
        ));
        return `
            <label class="transport-field">
                <span>${escapeHtml(MOUNT_SLOT_LABELS[slot])}</span>
                <select onchange="setMountGear('${escapeHtml(owner.id)}','${escapeHtml(mount.id)}','${slot}',this.value)">
                    <option value="">Nenhum</option>
                    ${inventoryItems.map(item => {
                        const selected = String(mount.equipment?.[slot]) === String(item.id);
                        const available = Math.max(0, Number(item.quantity) || 0) - getUsedGearQuantity(owner, item.id, mount.id);
                        return `<option value="${escapeHtml(item.id)}" ${selected ? 'selected' : ''} ${!selected && available <= 0 ? 'disabled' : ''}>${escapeHtml(item.name)}${!selected ? ` · ${available} livre` : ''}</option>`;
                    }).join('')}
                </select>
            </label>`;
    }

    function renderCargo(owner, kind, asset) {
        const cargo = normalizeCargo(asset.cargo);
        const capacity = kind === 'mount' ? getMountCapacity(owner, asset) : Math.max(0, Number(asset.capacity) || 0);
        const weight = getCargoWeight(cargo);
        const availableItems = getOwnerInventory(owner).filter(item => {
            if (['mount', 'vehicle'].includes(getTransportItemKind(item))) return false;
            if (item.id === 'coroa') return false;
            return getAvailableInventoryQuantity(owner, item) > 0;
        });
        const disabled = kind === 'mount' && capacity <= 0;
        return `
            <section class="transport-cargo ${weight > capacity ? 'is-overloaded' : ''}">
                <div class="transport-section-title">
                    <strong>📦 Carga</strong>
                    <span>${weight}/${capacity}</span>
                </div>
                ${disabled ? '<p class="transport-note">Equipe alforjes para liberar a capacidade desta montaria.</p>' : `
                    <div class="transport-cargo-columns">
                        <div>
                            <h4>Inventário do personagem</h4>
                            ${availableItems.length ? availableItems.map(item => `
                                <div class="transport-cargo-row">
                                    <span>${escapeHtml(item.icon || '🎒')} ${escapeHtml(item.name)} <small>x${getAvailableInventoryQuantity(owner, item)}</small></span>
                                    <span><button onclick="transferTransportCargo('${escapeHtml(owner.id)}','${kind}','${escapeHtml(asset.id)}','${escapeHtml(item.id)}','to',1)">+1</button><button onclick="transferTransportCargo('${escapeHtml(owner.id)}','${kind}','${escapeHtml(asset.id)}','${escapeHtml(item.id)}','to','all')">Tudo</button></span>
                                </div>`).join('') : '<p class="transport-empty">Nenhum item livre.</p>'}
                        </div>
                        <div>
                            <h4>Armazenado</h4>
                            ${cargo.length ? cargo.map(item => `
                                <div class="transport-cargo-row">
                                    <span>${escapeHtml(item.icon || '📦')} ${escapeHtml(item.name)} <small>x${item.quantity}</small></span>
                                    <span><button onclick="transferTransportCargo('${escapeHtml(owner.id)}','${kind}','${escapeHtml(asset.id)}','${escapeHtml(item.id)}','from',1)">−1</button><button onclick="transferTransportCargo('${escapeHtml(owner.id)}','${kind}','${escapeHtml(asset.id)}','${escapeHtml(item.id)}','from','all')">Tudo</button></span>
                                </div>`).join('') : '<p class="transport-empty">Carga vazia.</p>'}
                        </div>
                    </div>
                `}
            </section>`;
    }

    function renderCargoTransferHub(owner) {
        const storages = getCargoStorageOptions(owner);
        if (storages.length < 2) return '';
        const draft = getCargoTransferDraft(owner);
        const source = resolveCargoStorage(owner, draft.sourceKey);
        const destination = resolveCargoStorage(owner, draft.destinationKey);
        const items = getTransferableStorageItems(owner, source);
        const selectedItem = items.find(item => String(item.id) === String(draft.itemId)) || null;
        const available = getTransferableStorageQuantity(owner, source, selectedItem);
        const destinationWeight = destination?.kind === 'owner' ? null : getCargoWeight(destination?.cargo);
        const destinationCapacity = destination?.kind === 'owner' ? null : Math.max(0, Number(destination?.capacity) || 0);

        return `
            <section id="transportCargoTransferHub" class="transport-transfer-hub">
                <div class="transport-section-title">
                    <div><strong>🔄 Central de Carga</strong><small>Transfira diretamente entre qualquer armazenamento.</small></div>
                    ${destination?.kind === 'owner'
                        ? '<span>Destino sem limite nesta etapa</span>'
                        : `<span>Destino ${destinationWeight}/${destinationCapacity}</span>`}
                </div>
                <div class="transport-transfer-route">
                    <label class="transport-field">
                        <span>Origem</span>
                        <select onchange="setCargoTransferDraft('${escapeHtml(owner.id)}','sourceKey',this.value)">
                            ${storages.map(storage => `<option value="${escapeHtml(storage.key)}" ${storage.key === draft.sourceKey ? 'selected' : ''}>${escapeHtml(storage.name)}</option>`).join('')}
                        </select>
                    </label>
                    <button type="button" class="transport-swap-button" onclick="swapCargoTransferRoute('${escapeHtml(owner.id)}')" aria-label="Inverter origem e destino">⇄</button>
                    <label class="transport-field">
                        <span>Destino</span>
                        <select onchange="setCargoTransferDraft('${escapeHtml(owner.id)}','destinationKey',this.value)">
                            ${storages.map(storage => `<option value="${escapeHtml(storage.key)}" ${storage.key === draft.destinationKey ? 'selected' : ''} ${storage.key === draft.sourceKey ? 'disabled' : ''}>${escapeHtml(storage.name)}</option>`).join('')}
                        </select>
                    </label>
                </div>
                <div class="transport-transfer-item-row">
                    <label class="transport-field">
                        <span>Item disponível</span>
                        <select onchange="setCargoTransferDraft('${escapeHtml(owner.id)}','itemId',this.value)" ${items.length ? '' : 'disabled'}>
                            ${items.length
                                ? items.map(item => {
                                    const quantity = getTransferableStorageQuantity(owner, source, item);
                                    return `<option value="${escapeHtml(item.id)}" ${String(item.id) === String(draft.itemId) ? 'selected' : ''}>${escapeHtml(item.icon || '📦')} ${escapeHtml(item.name)} · x${quantity}</option>`;
                                }).join('')
                                : '<option value="">Nenhum item transferível</option>'}
                        </select>
                    </label>
                    <label class="transport-field transport-quantity-field">
                        <span>Quantidade</span>
                        <input type="number" min="1" max="${Math.max(1, available)}" value="${Math.min(Math.max(1, draft.quantity), Math.max(1, available))}" onchange="setCargoTransferDraft('${escapeHtml(owner.id)}','quantity',this.value)">
                    </label>
                    <div class="transport-transfer-actions">
                        <button type="button" class="primary" ${!selectedItem || !destination || destination.key === source?.key ? 'disabled' : ''} onclick="executeCargoTransferDraft('${escapeHtml(owner.id)}',false)">Transferir</button>
                        <button type="button" ${!selectedItem || !destination || destination.key === source?.key ? 'disabled' : ''} onclick="executeCargoTransferDraft('${escapeHtml(owner.id)}',true)">Transferir tudo</button>
                    </div>
                </div>
                ${source?.kind !== 'owner' && Number(source?.capacity) <= 0
                    ? '<p class="transport-note">A origem está sem capacidade, mas itens anteriormente armazenados ainda podem ser retirados.</p>'
                    : ''}
            </section>`;
    }

    function refreshCargoTransferHub(owner) {
        const current = document.getElementById('transportCargoTransferHub');
        if (current) current.outerHTML = renderCargoTransferHub(owner);
    }

    function setCargoTransferDraft(ownerId, field, value) {
        if (!['sourceKey', 'destinationKey', 'itemId', 'quantity'].includes(field)) return;
        const owner = findOwner(ownerId);
        if (!owner) return;
        const draft = getCargoTransferDraft(owner);
        if (field === 'destinationKey' && String(value) === String(draft.sourceKey)) {
            refreshCargoTransferHub(owner);
            return;
        }
        draft[field] = field === 'quantity' ? Math.max(1, Number(value) || 1) : String(value || '');
        if (field === 'sourceKey') {
            if (draft.destinationKey === draft.sourceKey) {
                draft.destinationKey = getCargoStorageOptions(owner).find(storage => storage.key !== draft.sourceKey)?.key || draft.sourceKey;
            }
            draft.itemId = '';
        }
        cargoTransferDrafts.set(String(owner.id), draft);
        refreshCargoTransferHub(owner);
    }

    function swapCargoTransferRoute(ownerId) {
        const owner = findOwner(ownerId);
        if (!owner) return;
        const draft = getCargoTransferDraft(owner);
        const previousSource = draft.sourceKey;
        draft.sourceKey = draft.destinationKey;
        draft.destinationKey = previousSource;
        draft.itemId = '';
        draft.quantity = 1;
        cargoTransferDrafts.set(String(owner.id), draft);
        refreshCargoTransferHub(owner);
    }

    function renderMountConditionControls(owner, mount) {
        const conditions = normalizeMountConditions(mount.conditions);
        const health = getMountHealthState(mount);
        return `
            <div class="transport-mount-status">
                <div class="transport-mount-condition-list">
                    <span class="transport-condition-chip is-health">${health.icon} ${health.label}</span>
                    ${conditions.map(conditionId => {
                        const definition = MOUNT_CONDITIONS[conditionId];
                        return `<button type="button" class="transport-condition-chip" onclick="removeMountCondition('${escapeHtml(owner.id)}','${escapeHtml(mount.id)}','${conditionId}')" title="Remover ${escapeHtml(definition.label)}">${definition.icon} ${escapeHtml(definition.label)} ×</button>`;
                    }).join('')}
                </div>
                <div class="transport-mount-condition-actions">
                    <select id="mount-condition-${escapeHtml(mount.id)}" aria-label="Condição da montaria">
                        ${Object.entries(MOUNT_CONDITIONS)
                            .filter(([conditionId]) => !conditions.includes(conditionId))
                            .map(([conditionId, definition]) => `<option value="${conditionId}">${definition.icon} ${escapeHtml(definition.label)}</option>`)
                            .join('')}
                    </select>
                    <button type="button" onclick="applySelectedMountCondition('${escapeHtml(owner.id)}','${escapeHtml(mount.id)}')" ${conditions.length >= Object.keys(MOUNT_CONDITIONS).length ? 'disabled' : ''}>Aplicar condição</button>
                    <button type="button" class="warning" onclick="triggerMountFlee('${escapeHtml(owner.id)}','${escapeHtml(mount.id)}')" ${hasMountCondition(mount, 'fleeing') ? 'disabled' : ''}>🏃 Fuga</button>
                </div>
            </div>`;
    }

    function renderMountCard(owner, state, mount) {
        const isActive = String(state.activeMountId) === String(mount.id);
        const movement = getMountMovement(owner, mount);
        const load = getMountLoadBreakdown(owner, mount);
        return `
            <article class="transport-asset-card ${isActive ? 'is-active' : ''}" id="transport-${escapeHtml(mount.id)}">
                <div class="transport-asset-heading">
                    <div><span class="transport-asset-icon">🐎</span><div><strong>${escapeHtml(mount.name)}</strong><small>HP ${mount.hpCurrent}/${mount.hpMax} · MOV ${movement} · Carga ${load.cargoWeight}/${load.capacity} · Equip. ${load.equipmentWeight}</small></div></div>
                    <span>${load.isOverloaded ? 'SOBRECARGA' : (isActive ? (state.mounted ? 'MONTADO' : 'ATIVA') : '')}</span>
                </div>
                <div class="transport-inline-fields">
                    <label>Nome<input value="${escapeHtml(mount.name)}" onchange="renameTransportAsset('${escapeHtml(owner.id)}','mount','${escapeHtml(mount.id)}',this.value)"></label>
                    <label>HP atual<input type="number" min="0" max="${mount.hpMax}" value="${mount.hpCurrent}" onchange="setTransportHp('${escapeHtml(owner.id)}','mount','${escapeHtml(mount.id)}',this.value)"></label>
                </div>
                <div class="transport-gear-grid">${MOUNT_SLOTS.map(slot => renderGearSelect(owner, mount, slot)).join('')}</div>
                ${renderMountConditionControls(owner, mount)}
                <div class="transport-asset-actions">
                    ${!isActive ? `<button onclick="activateMount('${escapeHtml(owner.id)}','${escapeHtml(mount.id)}')">Selecionar</button>` : ''}
                    ${isActive && !state.mounted ? `<button class="primary" ${isMountUnavailable(mount) ? 'disabled' : ''} onclick="setMountedState('${escapeHtml(owner.id)}',true)">Montar</button>` : ''}
                    ${isActive && state.mounted ? `<button onclick="setMountedState('${escapeHtml(owner.id)}',false)">Desmontar</button>` : ''}
                    ${mount.attachedVehicleId ? '<span class="transport-warning">Atrelado a um veículo</span>' : ''}
                </div>
                ${renderCargo(owner, 'mount', mount)}
            </article>`;
    }

    function getVehicleMovement(owner, vehicle) {
        const state = ensureTransportState(owner);
        const mounts = vehicle.hitchedMountIds
            .map(id => state.mounts.find(mount => String(mount.id) === String(id)))
            .filter(Boolean);
        if (mounts.length < vehicle.requiredMounts) return 0;
        const overloadPenalty = Math.ceil(getVehicleLoadBreakdown(vehicle).excessCargo);
        const slowestMount = Math.min(...mounts.map(mount => getMountMovement(owner, mount)));
        if (slowestMount <= 0) return 0;
        return Math.max(1, slowestMount + (Number(vehicle.movementModifier) || 0) - overloadPenalty);
    }

    function renderVehicleCard(owner, state, vehicle) {
        const hitched = vehicle.hitchedMountIds || [];
        const load = getVehicleLoadBreakdown(vehicle);
        return `
            <article class="transport-asset-card" id="transport-${escapeHtml(vehicle.id)}">
                <div class="transport-asset-heading">
                    <div><span class="transport-asset-icon">🛒</span><div><strong>${escapeHtml(vehicle.name)}</strong><small>HP ${vehicle.hpCurrent}/${vehicle.hpMax} · MOV ${getVehicleMovement(owner, vehicle) || '—'} · Carga ${load.cargoWeight}/${load.capacity}</small></div></div>
                    <span>${load.isOverloaded ? 'SOBRECARGA' : `${hitched.length}/${vehicle.requiredMounts} CAVALOS`}</span>
                </div>
                <div class="transport-inline-fields">
                    <label>Nome<input value="${escapeHtml(vehicle.name)}" onchange="renameTransportAsset('${escapeHtml(owner.id)}','vehicle','${escapeHtml(vehicle.id)}',this.value)"></label>
                    <label>HP atual<input type="number" min="0" max="${vehicle.hpMax}" value="${vehicle.hpCurrent}" onchange="setTransportHp('${escapeHtml(owner.id)}','vehicle','${escapeHtml(vehicle.id)}',this.value)"></label>
                </div>
                <fieldset class="transport-hitch-list">
                    <legend>Cavalos atrelados — selecione exatamente ${vehicle.requiredMounts}</legend>
                    ${state.mounts.length ? state.mounts.map(mount => {
                        const checked = hitched.some(id => String(id) === String(mount.id));
                        const unavailable = mount.attachedVehicleId && String(mount.attachedVehicleId) !== String(vehicle.id);
                        return `<label><input type="checkbox" data-hitch-mount="${escapeHtml(mount.id)}" data-vehicle="${escapeHtml(vehicle.id)}" ${checked ? 'checked' : ''} ${unavailable || mount.hpCurrent <= 0 ? 'disabled' : ''}> ${escapeHtml(mount.name)}${unavailable ? ' · em outro veículo' : ''}</label>`;
                    }).join('') : '<span class="transport-empty">Nenhuma montaria disponível.</span>'}
                    <span class="transport-hitch-actions">
                        <button onclick="applyVehicleHitch('${escapeHtml(owner.id)}','${escapeHtml(vehicle.id)}')">Aplicar pareamento</button>
                        ${hitched.length ? `<button onclick="detachVehicle('${escapeHtml(owner.id)}','${escapeHtml(vehicle.id)}')">Desatrelar</button>` : ''}
                    </span>
                </fieldset>
                ${renderCargo(owner, 'vehicle', vehicle)}
            </article>`;
    }

    function openTransportManager(itemId = null, ownerId = null) {
        const owner = ownerId ? findOwner(ownerId) : global.getCharacterCollectionOwner?.();
        if (!owner) {
            global.showToast?.('Selecione o inventário de um personagem.');
            return false;
        }
        const state = ensureTransportState(owner);
        const kind = getTransportItemKind(getCatalogItem(itemId));
        if (kind === 'mount') focusedAsset = state.mounts.find(asset => String(asset.templateId) === String(itemId))?.id || null;
        else if (kind === 'vehicle') focusedAsset = state.vehicles.find(asset => String(asset.templateId) === String(itemId))?.id || null;
        renderTransportManager(owner);
        ensureModal().classList.remove('hidden');
        if (focusedAsset) requestAnimationFrame(() => document.getElementById(`transport-${focusedAsset}`)?.scrollIntoView({ block: 'nearest' }));
        return true;
    }

    function renderTransportManager(owner = global.getCharacterCollectionOwner?.()) {
        if (!owner) return;
        const state = ensureTransportState(owner);
        const content = ensureModal().querySelector('#transportManagerContent');
        const dialog = content.closest?.('.transport-dialog');
        const previousScrollTop = dialog?.scrollTop || 0;
        content.innerHTML = `
            <header class="transport-modal-header"><div><small>MONTARIAS E TRANSPORTE</small><h2>${escapeHtml(owner.name || 'Personagem')}</h2></div><button onclick="closeTransportManager()" aria-label="Fechar">×</button></header>
            <p class="transport-intro">Gerencie cada montaria individualmente, equipe acessórios e distribua a carga. O Movimento da montaria substitui o do personagem somente enquanto ele estiver montado.</p>
            <nav class="transport-summary"><span>🐎 ${state.mounts.length} montaria${state.mounts.length === 1 ? '' : 's'}</span><span>🛒 ${state.vehicles.length} veículo${state.vehicles.length === 1 ? '' : 's'}</span></nav>
            ${renderCargoTransferHub(owner)}
            <div class="transport-assets">
                ${state.mounts.length ? `<h3>Montarias</h3>${state.mounts.map(mount => renderMountCard(owner, state, mount)).join('')}` : '<p class="transport-empty-block">Adicione um cavalo pela categoria Etc. → Montarias.</p>'}
                ${state.vehicles.length ? `<h3>Veículos</h3>${state.vehicles.map(vehicle => renderVehicleCard(owner, state, vehicle)).join('')}` : ''}
            </div>`;
        if (dialog && previousScrollTop > 0) requestAnimationFrame(() => { dialog.scrollTop = previousScrollTop; });
    }

    function findOwner(ownerId) {
        const current = global.getCharacterCollectionOwner?.();
        if (current && String(current.id) === String(ownerId)) return current;
        if (typeof combatants !== 'undefined') {
            const combatant = combatants.find(entry => String(entry.id) === String(ownerId));
            if (combatant) return combatant;
        }
        if (typeof characterSheets !== 'undefined') return characterSheets.find(entry => String(entry.id) === String(ownerId)) || null;
        return null;
    }

    function findAsset(owner, kind, assetId) {
        const state = ensureTransportState(owner);
        const list = kind === 'vehicle' ? state.vehicles : state.mounts;
        return list.find(asset => String(asset.id) === String(assetId)) || null;
    }

    function renameTransportAsset(ownerId, kind, assetId, name) {
        const owner = findOwner(ownerId);
        const asset = owner ? findAsset(owner, kind, assetId) : null;
        const next = String(name || '').trim();
        if (!asset || !next) return renderTransportManager(owner);
        asset.name = next.slice(0, 60);
        persist(owner);
        renderTransportManager(owner);
    }

    function applyRiderFall(owner, mount, reason) {
        if (!owner) return;
        const alreadyFallen = (Array.isArray(owner.effects) ? owner.effects : [])
            .some(effect => effect?.type === 'condition' && effect.id === '🧎');
        if (!alreadyFallen) {
            if (typeof global.addAutomationCondition === 'function') {
                global.addAutomationCondition(owner, '🧎');
            } else {
                owner.effects ||= [];
                owner.effects.push({
                    id: '🧎',
                    type: 'condition',
                    name: 'Caído',
                    shortDescription: 'Derrubado da montaria.',
                    remainingTurns: 0,
                    initialTurns: 0,
                    stacks: 1,
                    maxStacks: 1,
                    augment: 'debuff'
                });
            }
        }
        addHistory(
            owner,
            `${owner.name} caiu de ${mount.name}`,
            `${reason}\nCondição Caído aplicada ao cavaleiro.`,
            'condition'
        );
    }

    function dismountForMountIncident(owner, mount, reason, { applyFall = false } = {}) {
        const state = owner?.transport && Number(owner.transport.version) === TRANSPORT_SCHEMA_VERSION
            ? owner.transport
            : ensureTransportState(owner);
        const wasMounted = state.mounted && String(state.activeMountId) === String(mount.id);
        if (!wasMounted) return false;
        state.mounted = false;
        if (applyFall) applyRiderFall(owner, mount, reason);
        else addHistory(owner, `${owner.name} desmontou de ${mount.name}`, reason, 'turn');
        return true;
    }

    function recordMountHealthTransition(owner, mount, beforeState, afterState) {
        if (!owner || !mount || beforeState.id === afterState.id) return;
        addHistory(
            owner,
            `${mount.name}: ${afterState.label}`,
            `Estado alterado: ${beforeState.label} > ${afterState.label}\nHP ${mount.hpCurrent}/${mount.hpMax}`,
            afterState.id === 'defeated' ? 'damage' : 'condition'
        );
    }

    function setMountCondition(ownerId, mountId, conditionId, active = true) {
        const owner = findOwner(ownerId);
        const mount = owner ? findAsset(owner, 'mount', mountId) : null;
        const definition = MOUNT_CONDITIONS[conditionId];
        if (!owner || !mount || !definition) return false;

        const conditions = normalizeMountConditions(mount.conditions);
        const exists = conditions.includes(conditionId);
        mount.conditions = active
            ? [...new Set([...conditions, conditionId])]
            : conditions.filter(entry => entry !== conditionId);

        if (active && definition.forcesDismount) {
            dismountForMountIncident(
                owner,
                mount,
                `${definition.label} impediu que a montaria continuasse carregando o cavaleiro.`,
                { applyFall: conditionId === 'fallen' }
            );
        }

        if (exists !== active) {
            addHistory(
                owner,
                `${mount.name}: ${definition.label} ${active ? 'aplicada' : 'removida'}`,
                `Movimento atual: ${getMountMovement(owner, mount)}`,
                'condition'
            );
        }
        persist(owner, `${definition.icon} ${definition.label} ${active ? 'aplicada em' : 'removida de'} ${mount.name}.`);
        renderTransportManager(owner);
        return true;
    }

    function applySelectedMountCondition(ownerId, mountId) {
        const select = document.getElementById(`mount-condition-${mountId}`);
        return select?.value ? setMountCondition(ownerId, mountId, select.value, true) : false;
    }

    function removeMountCondition(ownerId, mountId, conditionId) {
        return setMountCondition(ownerId, mountId, conditionId, false);
    }

    function triggerMountFlee(ownerId, mountId) {
        const owner = findOwner(ownerId);
        const mount = owner ? findAsset(owner, 'mount', mountId) : null;
        if (!owner || !mount || mount.hpCurrent <= 0) return false;
        const applied = setMountCondition(ownerId, mountId, 'fleeing', true);
        if (applied) {
            addHistory(owner, `${mount.name} fugiu do combate`, `${owner.name} não pode montar novamente até remover a condição Em fuga.`, 'turn');
        }
        return applied;
    }

    function setTransportHp(ownerId, kind, assetId, value) {
        const owner = findOwner(ownerId);
        const asset = owner ? findAsset(owner, kind, assetId) : null;
        if (!asset) return;
        const beforeState = kind === 'mount' ? getMountHealthState(asset) : null;
        asset.hpCurrent = Math.max(0, Math.min(asset.hpMax, Number(value) || 0));
        if (kind === 'mount') {
            const afterState = getMountHealthState(asset);
            if (asset.hpCurrent <= 0) {
                dismountForMountIncident(owner, asset, `${asset.name} foi derrotada.`, { applyFall: true });
            }
            recordMountHealthTransition(owner, asset, beforeState, afterState);
        }
        persist(owner);
        renderTransportManager(owner);
    }

    function setMountGear(ownerId, mountId, slot, itemId) {
        const owner = findOwner(ownerId);
        const mount = owner ? findAsset(owner, 'mount', mountId) : null;
        if (!owner || !mount || !MOUNT_SLOTS.includes(slot)) return;
        const currentCargoWeight = getCargoWeight(mount.cargo);
        const item = itemId ? getOwnerInventory(owner).find(entry => String(entry.id) === String(itemId)) : null;
        if (item && (getTransportItemKind(item) !== 'mount-gear' || String(item.mountSlot) !== slot || getAvailableInventoryQuantity(owner, item) <= 0)) {
            global.showToast?.('Este equipamento não está disponível para esta montaria.');
            return renderTransportManager(owner);
        }
        if (slot === 'saddlebags') {
            const nextCapacity = Math.max(0, Number(item?.capacity) || 0);
            if (currentCargoWeight > nextCapacity) {
                global.showToast?.(`A carga atual pesa ${currentCargoWeight}. Retire itens antes de trocar os alforjes.`);
                return renderTransportManager(owner);
            }
        }
        mount.equipment[slot] = item?.id || null;
        if (slot === 'barding') mount.bardingDefenseCurrent = item ? Math.max(0, Number(item.defense) || 0) : null;
        addHistory(owner, `${owner.name}: equipamento de montaria alterado`, `${mount.name} · ${MOUNT_SLOT_LABELS[slot]}: ${item?.name || 'Nenhum'}`);
        persist(owner, item ? `🐎 ${item.name} equipado em ${mount.name}.` : `🐎 ${MOUNT_SLOT_LABELS[slot]} removido de ${mount.name}.`);
        renderTransportManager(owner);
    }

    function activateMount(ownerId, mountId) {
        const owner = findOwner(ownerId);
        const state = owner ? ensureTransportState(owner) : null;
        const mount = state?.mounts.find(entry => String(entry.id) === String(mountId));
        if (!owner || !mount) return;
        state.activeMountId = mount.id;
        state.mounted = false;
        persist(owner, `🐎 ${mount.name} agora é a montaria ativa.`);
        renderTransportManager(owner);
    }

    function setMountedState(ownerId, mounted) {
        const owner = findOwner(ownerId);
        const state = owner ? ensureTransportState(owner) : null;
        const mount = state ? getActiveMount(owner) : null;
        if (!owner || !state || !mount) return;
        if (mounted && isMountUnavailable(mount)) {
            global.showToast?.('Esta montaria não pode ser montada agora.');
            return;
        }
        state.mounted = Boolean(mounted);
        addHistory(owner, `${owner.name} ${state.mounted ? 'montou' : 'desmontou'} ${mount.name}`, `Movimento atual: ${getEffectiveCombatantMovement(owner).value}`, 'turn');
        persist(owner, state.mounted ? `🏇 ${owner.name} montou ${mount.name}.` : `🐎 ${owner.name} desmontou.`);
        renderTransportManager(owner);
    }

    function applyVehicleHitch(ownerId, vehicleId) {
        const owner = findOwner(ownerId);
        const state = owner ? ensureTransportState(owner) : null;
        const vehicle = state?.vehicles.find(entry => String(entry.id) === String(vehicleId));
        if (!owner || !state || !vehicle) return;
        const checked = Array.from(document.querySelectorAll(`[data-vehicle="${vehicle.id}"][data-hitch-mount]:checked`)).map(input => input.dataset.hitchMount);
        if (checked.length !== vehicle.requiredMounts) {
            global.showToast?.(`${vehicle.name} exige exatamente ${vehicle.requiredMounts} cavalo${vehicle.requiredMounts === 1 ? '' : 's'}.`);
            return;
        }
        const selectedMounts = checked.map(id => state.mounts.find(mount => String(mount.id) === String(id))).filter(Boolean);
        if (selectedMounts.length !== checked.length || selectedMounts.some(mount => mount.hpCurrent <= 0 || (mount.attachedVehicleId && String(mount.attachedVehicleId) !== String(vehicle.id)))) {
            global.showToast?.('Uma das montarias selecionadas não está disponível.');
            return;
        }
        state.mounts.forEach(mount => {
            if (String(mount.attachedVehicleId) === String(vehicle.id)) mount.attachedVehicleId = null;
        });
        vehicle.hitchedMountIds = checked;
        selectedMounts.forEach(mount => { mount.attachedVehicleId = vehicle.id; });
        if (selectedMounts.some(mount => String(mount.id) === String(state.activeMountId))) state.mounted = false;
        state.activeVehicleId = vehicle.id;
        addHistory(owner, `${owner.name}: ${vehicle.name} atrelada`, `${selectedMounts.map(mount => mount.name).join(' + ')} · Movimento ${getVehicleMovement(owner, vehicle)}`);
        persist(owner, `🛒 ${vehicle.name} atrelada com sucesso.`);
        renderTransportManager(owner);
    }

    function detachVehicle(ownerId, vehicleId) {
        const owner = findOwner(ownerId);
        const state = owner ? ensureTransportState(owner) : null;
        const vehicle = state?.vehicles.find(entry => String(entry.id) === String(vehicleId));
        if (!owner || !state || !vehicle) return;
        state.mounts.forEach(mount => {
            if (String(mount.attachedVehicleId) === String(vehicle.id)) mount.attachedVehicleId = null;
        });
        vehicle.hitchedMountIds = [];
        addHistory(owner, `${owner.name}: ${vehicle.name} desatrelada`, 'Os cavalos voltaram a ficar disponíveis.');
        persist(owner, `🛒 ${vehicle.name} foi desatrelada.`);
        renderTransportManager(owner);
    }

    function transferCargoBetweenStorages(ownerId, sourceKey, destinationKey, itemId, amount) {
        const owner = findOwner(ownerId);
        if (!owner) return { transferred: false, reason: 'owner-not-found' };
        const source = resolveCargoStorage(owner, sourceKey);
        const destination = resolveCargoStorage(owner, destinationKey);
        if (!source || !destination) return { transferred: false, reason: 'storage-not-found' };
        if (source.key === destination.key) return { transferred: false, reason: 'same-storage' };

        const item = source.cargo.find(entry => String(entry.id) === String(itemId));
        if (!item || item.id === 'coroa' || ['mount', 'vehicle'].includes(getTransportItemKind(item))) {
            return { transferred: false, reason: 'item-not-transferable' };
        }

        const available = getTransferableStorageQuantity(owner, source, item);
        const requested = amount === 'all' ? available : Math.max(1, Number(amount) || 1);
        const quantity = Math.min(available, requested);
        if (quantity <= 0) return { transferred: false, reason: 'quantity-unavailable' };

        if (destination.kind !== 'owner') {
            const capacity = Math.max(0, Number(destination.capacity) || 0);
            const nextWeight = getCargoWeight(destination.cargo) + (getItemWeight(item) * quantity);
            if (capacity <= 0 || nextWeight > capacity) {
                global.showToast?.(`Capacidade insuficiente em ${destination.name.replace(/^\S+\s*/, '')}: ${nextWeight}/${capacity}.`);
                return { transferred: false, reason: 'capacity', nextWeight, capacity };
            }
        }

        const target = destination.cargo.find(entry => String(entry.id) === String(item.id));
        if (target) target.quantity = Math.max(0, Number(target.quantity) || 0) + quantity;
        else destination.cargo.push({ ...clone(item, {}), quantity });
        item.quantity = Math.max(0, Number(item.quantity) || 0) - quantity;
        if (item.quantity <= 0) {
            const index = source.cargo.findIndex(entry => String(entry.id) === String(item.id));
            if (index >= 0) source.cargo.splice(index, 1);
        }

        const sourceName = source.name.replace(/^\S+\s*/, '');
        const destinationName = destination.name.replace(/^\S+\s*/, '');
        addHistory(owner, `${owner.name}: carga transferida`, `${item.name} x${quantity}\n${sourceName} → ${destinationName}`);
        persist(owner, `📦 ${item.name} x${quantity}: ${sourceName} → ${destinationName}.`);
        return {
            transferred: true,
            quantity,
            itemId: item.id,
            sourceKey: source.key,
            destinationKey: destination.key
        };
    }

    function executeCargoTransferDraft(ownerId, transferAll = false) {
        const owner = findOwner(ownerId);
        if (!owner) return;
        const draft = getCargoTransferDraft(owner);
        const result = transferCargoBetweenStorages(
            owner.id,
            draft.sourceKey,
            draft.destinationKey,
            draft.itemId,
            transferAll ? 'all' : draft.quantity
        );
        if (!result.transferred) return;
        draft.itemId = '';
        draft.quantity = 1;
        cargoTransferDrafts.set(String(owner.id), draft);
        renderTransportManager(owner);
    }

    function transferTransportCargo(ownerId, kind, assetId, itemId, direction, amount) {
        const assetKey = `${kind}:${assetId}`;
        const sourceKey = direction === 'to' ? 'owner' : assetKey;
        const destinationKey = direction === 'to' ? assetKey : 'owner';
        const result = transferCargoBetweenStorages(ownerId, sourceKey, destinationKey, itemId, amount);
        const owner = findOwner(ownerId);
        if (result.transferred && owner) renderTransportManager(owner);
        return result;
    }

    function getTransportInventoryBadge(item) {
        const owner = global.getCharacterCollectionOwner?.();
        const kind = getTransportItemKind(item);
        if (!owner || !kind) return null;
        const state = ensureTransportState(owner);
        if (kind === 'mount') {
            const active = state.mounts.find(mount => String(mount.id) === String(state.activeMountId) && String(mount.templateId) === String(item.id));
            return active ? { label: state.mounted ? 'MONTARIA EM USO' : 'MONTARIA ATIVA', className: 'is-active' } : { label: 'GERENCIAR MONTARIAS', className: '' };
        }
        if (kind === 'vehicle') {
            const hitched = state.vehicles.some(vehicle => String(vehicle.templateId) === String(item.id) && vehicle.hitchedMountIds.length);
            return { label: hitched ? 'VEÍCULO ATRELADO' : 'GERENCIAR VEÍCULO', className: hitched ? 'is-active' : '' };
        }
        const used = getUsedGearQuantity(owner, item.id);
        return used ? { label: `EM USO x${used}`, className: 'is-equipped' } : { label: 'EQUIPAMENTO DE MONTARIA', className: '' };
    }

    function getSelectedTransportActionLabel(item) {
        return isTransportSystemItem(item) ? 'Gerenciar' : null;
    }

    function renderTransportDetailsAction(item) {
        if (!isTransportSystemItem(item)) return '';
        return `<div class="equipment-details-actions"><button type="button" class="transport-details-button" onclick="closeItemDetailsModal(); openTransportManager('${escapeHtml(item.id)}')">🐎 Gerenciar montarias e transporte</button></div>`;
    }

    function performSelectedTransportAction() {
        if (typeof selectedInventoryItemId === 'undefined') return false;
        const item = typeof inventory !== 'undefined' ? inventory.find(entry => String(entry.id) === String(selectedInventoryItemId)) : null;
        return item && isTransportSystemItem(item) ? openTransportManager(item.id) : false;
    }

    function toggleMountPanel(combatantId) {
        const key = String(combatantId);
        if (expandedMountPanels.has(key)) expandedMountPanels.delete(key);
        else expandedMountPanels.add(key);
        if (typeof renderList === 'function') renderList(false);
    }

    function renderCombatantMountPanel(combatant) {
        if (!combatant) return '';
        const state = ensureTransportState(combatant);
        if (!state?.mounts.length) return '';
        const mount = getActiveMount(combatant) || state.mounts[0];
        const expanded = expandedMountPanels.has(String(combatant.id));
        const movement = getMountMovement(combatant, mount);
        const load = getMountLoadBreakdown(combatant, mount);
        const barding = getMountGear(combatant, mount, 'barding');
        const health = getMountHealthState(mount);
        const conditions = normalizeMountConditions(mount.conditions)
            .map(conditionId => MOUNT_CONDITIONS[conditionId])
            .filter(Boolean);
        return `
            <section class="combat-mount-panel ${expanded ? '' : 'is-collapsed'}" aria-label="Montaria de ${escapeHtml(combatant.name)}">
                <button type="button" class="combat-subpanel-header mount-panel-header" aria-expanded="${expanded}" onclick="event.stopPropagation(); toggleMountPanel('${escapeHtml(combatant.id)}')">
                    <span>${expanded ? '▼' : '▶'} MONTARIA</span>
                    <small>${escapeHtml(mount.name)} · HP ${mount.hpCurrent}/${mount.hpMax}${state.mounted ? ' · montado' : ''}</small>
                </button>
                ${expanded ? `<div class="combat-mount-content">
                    <div class="combat-mount-stats"><span>❤️ ${mount.hpCurrent}/${mount.hpMax} HP</span><span>👣 ${movement} MOV</span><span>${health.icon} ${health.label}</span><span>📦 ${load.cargoWeight}/${load.capacity}</span><span>⚖️ ${load.total} total</span>${load.isOverloaded ? `<span>⚠️ Sobrecarga ${load.excessCargo}</span>` : ''}${barding ? `<span>🛡️ ${Math.max(0, Number(mount.bardingDefenseCurrent) || 0)}/${Math.max(0, Number(barding.defense) || 0)}</span>` : ''}${conditions.map(condition => `<span>${condition.icon} ${escapeHtml(condition.label)}</span>`).join('')}</div>
                    <div class="combat-mount-actions">
                        <button onclick="event.stopPropagation(); setMountedState('${escapeHtml(combatant.id)}',${state.mounted ? 'false' : 'true'})" ${!state.mounted && isMountUnavailable(mount) ? 'disabled' : ''}>${state.mounted ? 'Desmontar' : 'Montar'}</button>
                        <button onclick="event.stopPropagation(); triggerMountFlee('${escapeHtml(combatant.id)}','${escapeHtml(mount.id)}')" ${mount.hpCurrent <= 0 || hasMountCondition(mount, 'fleeing') ? 'disabled' : ''}>Fuga</button>
                        <button onclick="event.stopPropagation(); openTransportManager(null,'${escapeHtml(combatant.id)}')">Gerenciar</button>
                    </div>
                </div>` : ''}
            </section>`;
    }

    function closeMountedDamageChoice() {
        document.getElementById('mountedDamageChoiceModal')?.remove();
        pendingDamageChoice = null;
    }

    function requestMountedDamageTarget(target, damage, onCharacter) {
        const mount = getActiveMount(target, { requireMounted: true });
        if (!mount || mount.hpCurrent <= 0) return false;
        document.getElementById('mountedDamageChoiceModal')?.remove();
        pendingDamageChoice = { target, mount, damage: Math.max(0, Number(damage) || 0), onCharacter };
        const modal = document.createElement('div');
        modal.id = 'mountedDamageChoiceModal';
        modal.className = 'transport-modal mounted-damage-modal';
        modal.innerHTML = `
            <div class="transport-dialog compact" role="dialog" aria-modal="true">
                <header class="transport-modal-header"><div><small>ALVO MONTADO</small><h2>Quem recebe o dano?</h2></div><button onclick="closeMountedDamageChoice()">×</button></header>
                <p class="transport-intro">${escapeHtml(target.name)} está montado em ${escapeHtml(mount.name)}. Escolha antes de definir o restante do dano.</p>
                <div class="mounted-damage-options">
                    <button onclick="selectMountedDamageTarget('character')"><span>🧙</span><strong>${escapeHtml(target.name)}</strong><small>Continuar para local do dano</small></button>
                    <button onclick="selectMountedDamageTarget('mount')"><span>🐎</span><strong>${escapeHtml(mount.name)}</strong><small>Aplicar ${Math.max(0, Number(damage) || 0)} de dano direto</small></button>
                </div>
            </div>`;
        document.body.appendChild(modal);
        return true;
    }

    function selectMountedDamageTarget(choice) {
        const pending = pendingDamageChoice;
        if (!pending) return;
        document.getElementById('mountedDamageChoiceModal')?.remove();
        pendingDamageChoice = null;
        if (choice === 'character') {
            pending.onCharacter?.();
            return;
        }
        applyMountDamage(pending.target, pending.mount, pending.damage);
    }

    function applyMountDamage(owner, mount, requestedDamage) {
        const before = mount.hpCurrent;
        const beforeState = getMountHealthState(mount);
        const barding = getMountGear(owner, mount, 'barding');
        const armorBefore = barding ? Math.max(0, Number(mount.bardingDefenseCurrent) || Number(barding.defense) || 0) : 0;
        const absorbed = Math.min(requestedDamage, armorBefore);
        const finalDamage = Math.max(0, requestedDamage - absorbed);
        if (barding) mount.bardingDefenseCurrent = Math.max(0, armorBefore - absorbed);
        mount.hpCurrent = Math.max(0, before - finalDamage);
        const afterState = getMountHealthState(mount);
        if (mount.hpCurrent <= 0) {
            dismountForMountIncident(owner, mount, `${mount.name} foi derrotada pelo impacto.`, { applyFall: true });
        }
        recordMountHealthTransition(owner, mount, beforeState, afterState);
        const actor = typeof combatants !== 'undefined' ? combatants.find(entry => String(entry.id) === String(activeTurnId)) : null;
        global.addCombatHistoryEntry?.(
            mount.hpCurrent <= 0
                ? `${actor?.name || 'Ataque'} derrotou ${mount.name}: ${finalDamage}`
                : `${actor?.name || 'Ataque'} > Dano em ${mount.name}: ${finalDamage}`,
            `Dano informado: ${requestedDamage}\nBarda: ${absorbed} absorvido${barding ? ` (${barding.name})` : ''}\nHP ${before} > ${mount.hpCurrent}`,
            {
                type: 'damage',
                actor: actor ? { id: actor.id, name: actor.name } : null,
                target: { id: mount.id, name: mount.name },
                participants: [actor, owner].filter(Boolean).map(entry => ({ id: entry.id, name: entry.name })),
                combat: { baseDamage: requestedDamage, finalValue: finalDamage, armorAbsorbed: absorbed, targetType: 'mount' }
            }
        );
        global.setPendingAutomationDamageContext?.({});
        global.completeSpellDamageStep?.();
        if (typeof clearDisplay === 'function') clearDisplay();
        persist(owner, mount.hpCurrent <= 0 ? `💀 ${mount.name} foi derrotado.` : `🐎 ${mount.name} sofreu ${finalDamage} de dano.`);
    }

    global.ensureTransportState = ensureTransportState;
    global.synchronizeTransportAssets = synchronizeTransportAssets;
    global.getTransportItemKind = getTransportItemKind;
    global.isTransportSystemItem = isTransportSystemItem;
    global.canRemoveTransportInventoryItem = canRemoveTransportInventoryItem;
    global.getTransportInventoryBadge = getTransportInventoryBadge;
    global.getSelectedTransportActionLabel = getSelectedTransportActionLabel;
    global.renderTransportDetailsAction = renderTransportDetailsAction;
    global.performSelectedTransportAction = performSelectedTransportAction;
    global.openTransportManager = openTransportManager;
    global.closeTransportManager = closeTransportManager;
    global.renameTransportAsset = renameTransportAsset;
    global.setTransportHp = setTransportHp;
    global.setMountGear = setMountGear;
    global.activateMount = activateMount;
    global.setMountedState = setMountedState;
    global.setMountCondition = setMountCondition;
    global.applySelectedMountCondition = applySelectedMountCondition;
    global.removeMountCondition = removeMountCondition;
    global.triggerMountFlee = triggerMountFlee;
    global.getMountHealthState = getMountHealthState;
    global.applyVehicleHitch = applyVehicleHitch;
    global.detachVehicle = detachVehicle;
    global.getCargoStorageOptions = getCargoStorageOptions;
    global.resolveCargoStorage = resolveCargoStorage;
    global.setCargoTransferDraft = setCargoTransferDraft;
    global.swapCargoTransferRoute = swapCargoTransferRoute;
    global.executeCargoTransferDraft = executeCargoTransferDraft;
    global.transferCargoBetweenStorages = transferCargoBetweenStorages;
    global.transferTransportCargo = transferTransportCargo;
    global.getActiveMount = getActiveMount;
    global.getUsedMountGearQuantity = getUsedGearQuantity;
    global.getMountCapacity = getMountCapacity;
    global.getCargoWeight = getCargoWeight;
    global.getMountLoadBreakdown = getMountLoadBreakdown;
    global.getVehicleLoadBreakdown = getVehicleLoadBreakdown;
    global.getMountMovement = getMountMovement;
    global.getVehicleMovement = getVehicleMovement;
    global.getEffectiveCombatantMovement = getEffectiveCombatantMovement;
    global.toggleMountPanel = toggleMountPanel;
    global.renderCombatantMountPanel = renderCombatantMountPanel;
    global.requestMountedDamageTarget = requestMountedDamageTarget;
    global.closeMountedDamageChoice = closeMountedDamageChoice;
    global.selectMountedDamageTarget = selectMountedDamageTarget;
    global.applyMountDamage = applyMountDamage;
})(typeof window !== 'undefined' ? window : globalThis);
