const SESSION_HISTORY_KEY = 'dnd_session_history';
const SAVED_ENCOUNTERS_KEY = 'dnd_saved_encounters';
const LAST_COMBAT_REPORT_KEY = 'dnd_last_combat_report';
const MAX_HISTORY_ENTRIES = 80;
const MAX_UNDO_ENTRIES = 25;
const HISTORY_TYPE_INFO = Object.freeze({
    damage: { icon: '⚔️', label: 'Dano' },
    healing: { icon: '❤️', label: 'Cura' },
    'death-save': { icon: '☠️', label: 'Falha de morte' },
    effect: { icon: '✨', label: 'Efeito' },
    condition: { icon: '⚠️', label: 'Condição' },
    equipment: { icon: '🛡️', label: 'Equipamento' },
    crafting: { icon: '⚒️', label: 'Criação' },
    transfer: { icon: '🔄', label: 'Transferência' },
    turn: { icon: '⏱️', label: 'Turno' },
    participant: { icon: '🧙', label: 'Participante' },
    undo: { icon: '↶', label: 'Desfeito' },
    system: { icon: '📜', label: 'Sessão' }
});
const scheduleMicrotask = window.queueMicrotask || (callback => Promise.resolve().then(callback));

let sessionHistory = loadSessionData(SESSION_HISTORY_KEY, []);
let undoStack = [];
let trackingDepth = 0;
let endCombatHoldTimer = null;
let skipNextEndCombatClick = false;
let historyFilter = 'all';
let historyParticipantFilter = 'all';
let expandedHistoryEntryId = null;

function loadSessionData(key, fallback) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return value ?? fallback;
    } catch {
        return fallback;
    }
}

function cloneSessionData(value) {
    return JSON.parse(JSON.stringify(value));
}

function captureSessionState() {
    window.flushCharacterCollectionContext?.();

    return {
        combatants: cloneSessionData(combatants),
        activeTurnId,
        selectedId,
        round,
        monsterCounter,
        playerCounter,
        lastMonsterData: cloneSessionData(lastMonsterData),
        lastPlayerData: cloneSessionData(lastPlayerData),
        inventory: cloneSessionData(inventory),
        abilitiesInventory: cloneSessionData(abilitiesInventory),
        expandedMagic,
        characterCollectionContextKey: window.getCharacterCollectionContextKey?.() || 'legacy'
    };
}

function getStateFingerprint(state) {
    return JSON.stringify({
        combatants: state.combatants,
        activeTurnId: state.activeTurnId,
        selectedId: state.selectedId,
        round: state.round,
        inventory: state.inventory,
        abilitiesInventory: state.abilitiesInventory,
        expandedMagic: state.expandedMagic,
        characterCollectionContextKey: state.characterCollectionContextKey
    });
}

function persistSessionHistory() {
    localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(sessionHistory));
}

function inferHistoryType(label) {
    const normalized = String(label || '').toLowerCase();

    if (normalized.includes('dano em ') || normalized.includes('armadura absorveu')) return 'damage';
    if (normalized.includes('cura em ')) return 'healing';
    if (normalized.includes('falha de morte')) return 'death-save';
    if (normalized.startsWith('turno:')) return 'turn';
    if (normalized.startsWith('condição')) return 'condition';
    if (normalized.includes('equipad') || normalized.includes('arma ativa') || normalized.includes('danificado')) return 'equipment';
    if (normalized.startsWith('efeito') || normalized.startsWith('item usado')) return 'effect';
    if (normalized.startsWith('participante') || normalized.startsWith('iniciativa')) return 'participant';
    if (normalized.startsWith('desfeito')) return 'undo';
    return 'system';
}

function normalizeHistoryParticipants(value) {
    if (!Array.isArray(value)) return [];

    return value
        .filter(participant => participant?.id !== undefined && participant?.id !== null)
        .map(participant => ({
            id: String(participant.id),
            name: String(participant.name || 'Participante')
        }));
}

function formatHistoryValue(value, fallback = 'Não definido') {
    if (value === undefined || value === null || value === '') return fallback;
    return String(value);
}

function getHistoryArmorValue(combatant, part) {
    return Math.max(0, Number(combatant?.armor?.[part]) || 0);
}

function describeCombatantChanges(beforeCombatant, afterCombatant) {
    const name = afterCombatant?.name || beforeCombatant?.name || 'Participante';
    const participant = afterCombatant || beforeCombatant;
    const metadata = {
        type: 'participant',
        target: participant ? { id: participant.id, name } : undefined,
        participants: participant ? [{ id: participant.id, name }] : []
    };

    if (!beforeCombatant && afterCombatant) {
        return {
            label: `${name} adicionado ao combate`,
            detail: `HP máximo ${afterCombatant.hpMax ?? 0} · EST máximo ${afterCombatant.stMax ?? 0} · CA ${afterCombatant.ca ?? 0}`,
            changed: true,
            metadata
        };
    }

    if (!beforeCombatant || !afterCombatant) {
        return { label: `${name}: participante atualizado`, detail: '', changed: false, metadata };
    }

    const changes = [];
    const addChange = (label, previousValue, nextValue, verb = 'atualizado') => {
        if (previousValue !== nextValue) {
            changes.push(`${label} ${verb} ${formatHistoryValue(previousValue)} → ${formatHistoryValue(nextValue)}`);
        }
    };

    addChange('Nome', beforeCombatant.name, afterCombatant.name);
    addChange('Iniciativa', Number(beforeCombatant.initiative) || 0, Number(afterCombatant.initiative) || 0, 'atualizada');
    addChange('HP máximo', Number(beforeCombatant.hpMax) || 0, Number(afterCombatant.hpMax) || 0);
    addChange('EST máximo', Number(beforeCombatant.stMax) || 0, Number(afterCombatant.stMax) || 0);
    addChange('CA', Number(beforeCombatant.ca) || 0, Number(afterCombatant.ca) || 0, 'atualizada');
    addChange('Ataque/Dano', formatHistoryValue(beforeCombatant.atkInfo, '-'), formatHistoryValue(afterCombatant.atkInfo, '-'));
    addChange('Raça/categoria', formatHistoryValue(beforeCombatant.monsterCategory), formatHistoryValue(afterCombatant.monsterCategory), 'atualizada');
    addChange('Armadura Cabeça', getHistoryArmorValue(beforeCombatant, 'head'), getHistoryArmorValue(afterCombatant, 'head'), 'atualizada');
    addChange('Armadura Tronco', getHistoryArmorValue(beforeCombatant, 'torso'), getHistoryArmorValue(afterCombatant, 'torso'), 'atualizada');
    addChange('Armadura Braço', getHistoryArmorValue(beforeCombatant, 'arm'), getHistoryArmorValue(afterCombatant, 'arm'), 'atualizada');
    addChange('Armadura Perna', getHistoryArmorValue(beforeCombatant, 'leg'), getHistoryArmorValue(afterCombatant, 'leg'), 'atualizada');

    return {
        label: changes.length ? `${name}: ${changes[0]}` : `${name}: participante atualizado`,
        detail: changes.slice(1).join(' · '),
        changed: changes.length > 0,
        metadata
    };
}

function describeCombatantCollectionChange(beforeCombatants, afterCombatants) {
    const previous = Array.isArray(beforeCombatants) ? beforeCombatants : [];
    const current = Array.isArray(afterCombatants) ? afterCombatants : [];
    const added = current.find(combatant => !previous.some(oldCombatant => oldCombatant.id === combatant.id));

    if (added) return describeCombatantChanges(null, added);

    const updated = current.find(combatant => {
        const previousCombatant = previous.find(oldCombatant => oldCombatant.id === combatant.id);
        return previousCombatant && describeCombatantChanges(previousCombatant, combatant).changed;
    });
    const beforeUpdated = updated && previous.find(combatant => combatant.id === updated.id);

    return describeCombatantChanges(beforeUpdated, updated);
}

function getEffectHistoryType(type) {
    return type === 'condition' ? 'condition' : 'effect';
}

function getEffectHistoryLabel(type) {
    return type === 'condition' ? 'Condição' : 'Efeito';
}

function getEffectSnapshot(combatant, type, id) {
    if (!Array.isArray(combatant?.effects)) return null;

    return combatant.effects.find(effect => effect.type === type && effect.id === id) || null;
}

function getEffectSource(effect) {
    if (effect?.sourceId === undefined || effect.sourceId === null) return null;

    const source = combatants.find(combatant => String(combatant.id) === String(effect.sourceId));

    return source
        ? { id: source.id, name: source.name }
        : effect.sourceName
            ? { id: effect.sourceId, name: effect.sourceName }
            : null;
}

function setEffectSource(effect, source) {
    if (!effect || !source || effect.sourceId !== undefined) return;

    effect.sourceId = source.id;
    effect.sourceName = source.name;
}

function formatEffectDuration(effect) {
    const turns = Math.max(0, Number(effect?.remainingTurns) || 0);
    return turns > 0
        ? `Duração restante: ${turns} turno${turns === 1 ? '' : 's'}`
        : 'Duração: até ser removido';
}

function getEffectStateDetails(effect) {
    if (!effect) return [];

    const details = [formatEffectDuration(effect)];
    const stacks = Math.max(1, Number(effect.stacks) || 1);
    const maxStacks = Math.max(1, Number(effect.maxStacks) || 1);
    const automation = effect.automation || {};

    if (maxStacks > 1) details.push(`Acúmulos: ${stacks}/${maxStacks}`);
    if (Number.isFinite(Number(automation.magicShieldHp))) {
        details.push(`Escudo mágico: ${Math.max(0, Number(automation.magicShieldHp))}`);
    }
    if (Number.isFinite(Number(automation.temporaryHp))) {
        details.push(`PV temporários: ${Math.max(0, Number(automation.temporaryHp))}`);
    }
    if (Number.isFinite(Number(automation.staminaCost)) && Number(automation.staminaCost) > 0) {
        if (automation.staminaPayerName) {
            details.push(`Conjurador: ${automation.staminaPayerName}`);
        }
        details.push(`Custo: ${Math.max(0, Number(automation.staminaCost))} EST`);
        if (
            Number.isFinite(Number(automation.staminaBefore)) &&
            Number.isFinite(Number(automation.staminaAfter))
        ) {
            details.push(`EST do conjurador: ${automation.staminaBefore} → ${automation.staminaAfter}`);
        }
    }

    return details;
}

function getEffectUpdateDetails(beforeEffect, afterEffect) {
    const details = [];
    const beforeTurns = Math.max(0, Number(beforeEffect?.remainingTurns) || 0);
    const afterTurns = Math.max(0, Number(afterEffect?.remainingTurns) || 0);
    const beforeStacks = Math.max(1, Number(beforeEffect?.stacks) || 1);
    const afterStacks = Math.max(1, Number(afterEffect?.stacks) || 1);
    const beforeMaxStacks = Math.max(1, Number(beforeEffect?.maxStacks) || 1);
    const afterMaxStacks = Math.max(1, Number(afterEffect?.maxStacks) || 1);
    const automationFields = [
        ['magicShieldHp', 'Escudo mágico'],
        ['temporaryHp', 'PV temporários']
    ];

    if (beforeTurns !== afterTurns) {
        details.push(`Duração restante: ${beforeTurns} → ${afterTurns} turno${afterTurns === 1 ? '' : 's'}`);
    }
    if (beforeStacks !== afterStacks || beforeMaxStacks !== afterMaxStacks) {
        details.push(`Acúmulos: ${beforeStacks}/${beforeMaxStacks} → ${afterStacks}/${afterMaxStacks}`);
    }

    automationFields.forEach(([key, label]) => {
        const beforeValue = Number(beforeEffect?.automation?.[key]);
        const afterValue = Number(afterEffect?.automation?.[key]);

        if (Number.isFinite(beforeValue) && Number.isFinite(afterValue) && beforeValue !== afterValue) {
            details.push(`${label}: ${beforeValue} → ${afterValue}`);
        }
    });

    return details;
}

function describeEffectHistoryChange(beforeCombatant, afterCombatant, type, id) {
    const beforeEffect = getEffectSnapshot(beforeCombatant, type, id);
    const afterEffect = getEffectSnapshot(afterCombatant, type, id);
    const effect = afterEffect || beforeEffect;
    const target = afterCombatant || beforeCombatant;
    const targetName = target?.name || 'Participante';
    const effectName = getEffectName(effect);
    const effectLabel = getEffectHistoryLabel(type);
    const appliedVerb = type === 'condition' ? 'aplicada' : 'aplicado';
    const removedVerb = type === 'condition' ? 'removida' : 'removido';
    const updatedVerb = type === 'condition' ? 'atualizada' : 'atualizado';
    const source = getEffectSource(effect);
    const targetInfo = target ? { id: target.id, name: targetName } : null;
    const participants = [targetInfo].filter(Boolean);

    if (source && source.id !== targetInfo?.id) participants.unshift(source);

    const metadata = {
        type: getEffectHistoryType(type),
        source,
        target: targetInfo,
        participants,
        effect: {
            id: String(id),
            type,
            name: effectName
        }
    };

    if (!beforeEffect && afterEffect) {
        metadata.effect.action = appliedVerb;
        const detail = [getEffectHistoryLabel(type), ...getEffectStateDetails(afterEffect)];
        if (source && source.id !== targetInfo?.id) detail.push(`Aplicado por: ${source.name}`);

        return {
            label: `${targetName}: ${effectLabel} ${effectName} ${appliedVerb}`,
            detail: detail.join('\n'),
            metadata
        };
    }

    if (beforeEffect && !afterEffect) {
        metadata.effect.action = removedVerb;
        const detail = [getEffectHistoryLabel(type), ...getEffectStateDetails(beforeEffect)];
        if (source && source.id !== targetInfo?.id) detail.push(`Aplicado por: ${source.name}`);

        return {
            label: `${targetName}: ${effectLabel} ${effectName} ${removedVerb}`,
            detail: detail.join('\n'),
            metadata
        };
    }

    const changes = getEffectUpdateDetails(beforeEffect, afterEffect);
    metadata.effect.action = updatedVerb;

    return {
        label: `${targetName}: ${effectLabel} ${effectName} ${updatedVerb}`,
        detail: changes.length ? changes.join('\n') : 'Configuração do efeito atualizada.',
        metadata
    };
}

function addHistoryEntry(label, detail = '', metadata = {}) {
    metadata = metadata && typeof metadata === 'object' ? metadata : {};
    const type = HISTORY_TYPE_INFO[metadata.type] ? metadata.type : inferHistoryType(label);

    sessionHistory.unshift({
        id: Date.now() + Math.random(),
        label,
        detail,
        type,
        participants: normalizeHistoryParticipants(metadata.participants),
        source: metadata.source?.id !== undefined
            ? { id: String(metadata.source.id), name: String(metadata.source.name || 'Origem') }
            : undefined,
        target: metadata.target?.id !== undefined
            ? { id: String(metadata.target.id), name: String(metadata.target.name || 'Alvo') }
            : undefined,
        combat: metadata.combat && typeof metadata.combat === 'object' ? metadata.combat : undefined,
        condition: metadata.condition && typeof metadata.condition === 'object'
            ? {
                id: String(metadata.condition.id || ''),
                name: String(metadata.condition.name || '')
            }
            : undefined,
        effect: metadata.effect && typeof metadata.effect === 'object'
            ? {
                id: String(metadata.effect.id || ''),
                type: String(metadata.effect.type || ''),
                name: String(metadata.effect.name || ''),
                action: String(metadata.effect.action || '')
            }
            : undefined,
        round,
        at: new Date().toISOString()
    });

    sessionHistory = sessionHistory.slice(0, MAX_HISTORY_ENTRIES);
    persistSessionHistory();
    refreshSessionStatus();
}

function resolveHistoryValue(value) {
    return typeof value === 'function' ? value() : value;
}

function trackAction(label, callback, detail = '', metadata = {}) {
    const isTopLevelAction = trackingDepth === 0;
    const before = isTopLevelAction ? captureSessionState() : null;

    trackingDepth++;

    try {
        return callback();
    } finally {
        trackingDepth--;

        if (isTopLevelAction && getStateFingerprint(before) !== getStateFingerprint(captureSessionState())) {
            const actionLabel = resolveHistoryValue(label);
            undoStack.push({ label: actionLabel, state: before });
            undoStack = undoStack.slice(-MAX_UNDO_ENTRIES);
            addHistoryEntry(actionLabel, resolveHistoryValue(detail), resolveHistoryValue(metadata) || {});
        }
    }
}

function restoreSessionState(state) {
    combatants = cloneSessionData(state.combatants);
    activeTurnId = state.activeTurnId;
    selectedId = state.selectedId;
    round = state.round;
    monsterCounter = state.monsterCounter;
    playerCounter = state.playerCounter;
    lastMonsterData = cloneSessionData(state.lastMonsterData);
    lastPlayerData = cloneSessionData(state.lastPlayerData);
    if (typeof window.restoreCharacterCollectionContext === 'function') {
        window.restoreCharacterCollectionContext(state);
    } else {
        inventory = cloneSessionData(state.inventory);
        abilitiesInventory = cloneSessionData(state.abilitiesInventory);
        expandedMagic = state.expandedMagic;
    }

    savePlayersToStorage();
    saveInventory();
    saveAbilities();
    localStorage.setItem('expandedMagic', String(expandedMagic));

    renderList(false);
    renderInventory();
    renderAbilities();
    updateAbilitiesHeader();
    refreshSessionStatus();
}

function undoLastAction() {
    const lastAction = undoStack.pop();

    if (!lastAction) {
        showToast('Não há ação para desfazer.');
        return;
    }

    restoreSessionState(lastAction.state);
    addHistoryEntry(`Desfeito: ${lastAction.label}`);
    showToast(`↶ Desfeito: ${lastAction.label}`);
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function closeSessionConfirm() {
    document.getElementById('sessionConfirmModal')?.remove();
}

function openSessionConfirm({ title, message, confirmLabel, danger = false, onConfirm }) {
    closeSessionConfirm();

    const modal = document.createElement('div');
    modal.id = 'sessionConfirmModal';
    modal.className = 'session-overlay';
    modal.innerHTML = `
        <section class="session-dialog" role="alertdialog" aria-modal="true" aria-labelledby="sessionConfirmTitle">
            <h2 id="sessionConfirmTitle">${escapeHtml(title)}</h2>
            <p>${escapeHtml(message)}</p>
            <div class="session-dialog-actions">
                <button type="button" class="session-secondary" onclick="closeSessionConfirm()">Cancelar</button>
                <button type="button" class="${danger ? 'session-danger' : 'session-primary'}" onclick="confirmSessionAction()">${escapeHtml(confirmLabel)}</button>
            </div>
        </section>
    `;

    document.body.appendChild(modal);
    modal.querySelector('.session-danger, .session-primary')?.focus();

    window.confirmSessionAction = () => {
        closeSessionConfirm();
        onConfirm();
    };
}

function getActiveCombatant() {
    return combatants.find(combatant => combatant.id === activeTurnId) || null;
}

function getNextCombatant() {
    if (!combatants.length) return null;

    const activeIndex = combatants.findIndex(combatant => combatant.id === activeTurnId);

    for (let offset = 1; offset <= combatants.length; offset++) {
        const candidate = combatants[(Math.max(activeIndex, -1) + offset) % combatants.length];
        const eliminated =
            (candidate.type === 'monster' && candidate.hpCurrent <= 0) ||
            (candidate.type === 'player' && candidate.deathSaves?.failures >= 3);

        if (!eliminated) return candidate;
    }

    return null;
}

function renderSessionStatus() {
    const container = document.getElementById('combatList');

    if (!container || document.getElementById('sessionStatusBar')) return;

    const activeCombatant = getActiveCombatant();
    const nextCombatant = getNextCombatant();
    const bar = document.createElement('div');

    bar.id = 'sessionStatusBar';
    bar.className = 'session-status-bar';
    bar.innerHTML = `
        <div class="session-turn-summary" aria-live="polite">
            <span class="session-round">R${round}</span>
            <span id="sessionConnectionStatus" class="session-connection-status" aria-label="Status da conexão" title="Online"></span>
            <span class="session-turn-name">${escapeHtml(activeCombatant?.name || 'Sem turno')}</span>
            ${nextCombatant && activeCombatant?.id !== nextCombatant.id
                ? `<span class="session-next">→ ${escapeHtml(nextCombatant.name)}</span>`
                : ''}
        </div>
        <div class="session-status-actions">
            <button type="button" class="session-icon-button" onclick="undoLastAction()" aria-label="Desfazer última ação" title="Desfazer">↶</button>
            <button type="button" class="session-icon-button" onclick="openSessionTools()" aria-label="Abrir ferramentas da sessão" title="Ferramentas da sessão">⋯</button>
        </div>
    `;

    container.prepend(bar);
}

function refreshSessionStatus() {
    const bar = document.getElementById('sessionStatusBar');

    if (bar) bar.remove();
    renderSessionStatus();
}

function installSessionStatusObserver() {
    const container = document.getElementById('combatList');

    if (!container) return;

    new MutationObserver(() => {
        scheduleMicrotask(renderSessionStatus);
    }).observe(container, { childList: true });

    renderSessionStatus();
}

function formatHistoryTime(value) {
    try {
        return new Intl.DateTimeFormat('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(value));
    } catch {
        return '';
    }
}

function getAutomatedResourceTotal(combatant, resourceKey) {
    return (combatant?.effects || []).reduce(
        (total, effect) => total + Math.max(0, Number(effect?.automation?.[resourceKey]) || 0),
        0
    );
}

function captureCombatResources(combatant) {
    return {
        hp: Math.max(0, Number(combatant?.hpCurrent) || 0),
        st: Math.max(0, Number(combatant?.stCurrent) || 0),
        deathFailures: Math.max(0, Number(combatant?.deathSaves?.failures) || 0),
        magicShield: getAutomatedResourceTotal(combatant, 'magicShieldHp'),
        temporaryHp: getAutomatedResourceTotal(combatant, 'temporaryHp')
    };
}

function didCombatantBecomeDefeated(combatant, before = {}, after = {}) {
    if (!combatant) return false;

    if (combatant.type === 'monster') {
        return Number(before.hp) > 0 && Number(after.hp) <= 0;
    }

    return Number(before.deathFailures) < 3 && Number(after.deathFailures) >= 3;
}

function getHistoryBodyPartName(part) {
    return ({ head: 'Cabeça', torso: 'Tronco', arm: 'Braço', leg: 'Perna' })[part] || '';
}

function createResourceHistoryMetadata(type, target, value, context = {}) {
    const sourceCombatant = combatants.find(combatant => combatant.id === activeTurnId);
    const source = sourceCombatant
        ? { id: sourceCombatant.id, name: sourceCombatant.name }
        : null;
    const targetInfo = { id: target.id, name: target.name };
    const participants = [targetInfo];

    if (source && source.id !== target.id) participants.unshift(source);

    return {
        type,
        source,
        target: targetInfo,
        participants,
        combat: {
            baseDamage: Math.max(0, Number(context.baseDamage ?? value) || 0),
            finalValue: Math.max(0, Number(value) || 0),
            bodyPart: context.bodyPart || '',
            bodyMultiplier: Number(context.bodyMultiplier) || 1,
            typeMultiplier: Number(context.typeMultiplier) || 1,
            armorAbsorbed: Math.max(0, Number(context.armorAbsorbed) || 0),
            armorBreakdown: context.armorBreakdown && typeof context.armorBreakdown === 'object'
                ? cloneSessionData(context.armorBreakdown)
                : null,
            ignoredArmor: Boolean(context.ignoredArmor),
            before: captureCombatResources(target),
            after: null
        }
    };
}

function finalizeResourceHistoryMetadata(metadata, target) {
    if (!metadata?.combat) return;

    metadata.combat.after = captureCombatResources(target);
    metadata.combat.defeated = didCombatantBecomeDefeated(
        target,
        metadata.combat.before,
        metadata.combat.after
    );
}

function buildResourceHistoryDetail(metadata) {
    const combat = metadata?.combat;
    if (!combat) return '';

    const detail = [];
    const bodyPart = getHistoryBodyPartName(combat.bodyPart);
    const before = combat.before || {};
    const after = combat.after || {};
    const shieldAbsorbed = Math.max(0, (before.magicShield || 0) - (after.magicShield || 0));
    const temporaryAbsorbed = Math.max(0, (before.temporaryHp || 0) - (after.temporaryHp || 0));

    if (bodyPart) {
        detail.push(`Local: ${bodyPart} ×${combat.bodyMultiplier || 1}`);
    }

    if (combat.typeMultiplier !== 1) {
        detail.push(`Multiplicador do tipo: ×${combat.typeMultiplier}`);
    }

    if (combat.ignoredArmor) {
        detail.push('Armadura: ignorada');
    } else if (combat.armorAbsorbed > 0) {
        detail.push(`Armadura absorveu: ${combat.armorAbsorbed}`);

        if (combat.armorBreakdown) {
            const sources = [];
            const manual = Math.max(0, Number(combat.armorBreakdown.manual) || 0);
            const equipment = Math.max(0, Number(combat.armorBreakdown.equipment) || 0);
            const shield = Math.max(0, Number(combat.armorBreakdown.shield) || 0);

            if (manual > 0) sources.push(`Defesa adicional ${manual}`);
            if (equipment > 0) {
                sources.push(`${combat.armorBreakdown.equipmentName || 'Equipamento'} ${equipment}`);
            }
            if (shield > 0) sources.push(`${combat.armorBreakdown.shieldName || 'Escudo'} ${shield}`);
            if (!sources.length && Number(combat.armorBreakdown.region) > 0) {
                sources.push(
                    `${combat.armorBreakdown.regionName || 'Região'} ${combat.armorBreakdown.region}`
                );
            }

            if (sources.length) detail.push(`Proteção disponível: ${sources.join(' + ')}`);
        }
    }

    if (shieldAbsorbed > 0) detail.push(`Escudo mágico absorveu: ${shieldAbsorbed}`);
    if (temporaryAbsorbed > 0) detail.push(`PV temporários absorveram: ${temporaryAbsorbed}`);

    if (combat.finalValue > 0) detail.unshift(`Dano total: ${combat.finalValue}`);
    if (before.hp !== after.hp) detail.push(`PV: ${before.hp} → ${after.hp}`);
    if (before.st !== after.st) detail.push(`EST: ${before.st} → ${after.st}`);
    if (combat.defeated) detail.push('Alvo derrotado');

    if (!detail.length && combat.finalValue > 0) {
        detail.push(`Dano total: ${combat.finalValue}`);
    }

    return detail.join('\n');
}

function getHistoryEntryType(entry) {
    return HISTORY_TYPE_INFO[entry?.type] ? entry.type : inferHistoryType(entry?.label);
}

function getHistoryEntryParticipants(entry) {
    const participants = [
        ...normalizeHistoryParticipants(entry?.participants),
        ...normalizeHistoryParticipants([entry?.source, entry?.target])
    ];
    const uniqueParticipants = new Map();

    participants.forEach(participant => uniqueParticipants.set(participant.id, participant));
    return [...uniqueParticipants.values()];
}

function getHistoryParticipantOptions() {
    const participants = new Map();

    sessionHistory.forEach(entry => {
        getHistoryEntryParticipants(entry)
            .forEach(participant => participants.set(participant.id, participant));
    });

    return [...participants.values()].sort((first, second) => first.name.localeCompare(second.name, 'pt-BR'));
}

function historyEntryMatchesFilters(entry) {
    const type = getHistoryEntryType(entry);

    if (historyFilter !== 'all' && type !== historyFilter) return false;
    if (historyParticipantFilter === 'all') return true;

    return getHistoryEntryParticipants(entry)
        .some(participant => participant.id === historyParticipantFilter);
}

function getHistoryCompactName(name) {
    const words = String(name || '').trim().split(/\s+/).filter(Boolean);

    if (words.length <= 2) return words.join(' ') || 'Alvo';

    return `${words[0]} ${words[words.length - 1]}`;
}

function getHistoryDamageValue(entry) {
    const value = Number(entry?.combat?.finalValue);
    if (Number.isFinite(value)) return Math.max(0, value);

    const matches = String(entry?.label || '').match(/(\d+)(?!.*\d)/);
    return matches ? Number(matches[1]) : 0;
}

function getHistoryCondition(entry) {
    if (entry?.condition?.id && entry?.condition?.name) return entry.condition;

    const label = String(entry?.label || '').toLowerCase();
    const conditions = [
        { id: '🩸', name: 'Sangramento', match: 'dano de sangramento' },
        { id: '🔥', name: 'Chamas', match: 'dano de chamas' },
        { id: '🐍', name: 'Veneno', match: 'dano de veneno' }
    ];

    return conditions.find(condition => label.includes(condition.match)) || null;
}

function getHistoryEntryIcon(entry, typeInfo) {
    if (getHistoryEntryType(entry) !== 'damage') return typeInfo.icon;

    const conditionIcons = {
        '🩸': '🩸',
        '🔥': '🔥',
        '🐍': '🐍'
    };

    return conditionIcons[getHistoryCondition(entry)?.id] || typeInfo.icon;
}

function getHistoryEntryHeadline(entry, type) {
    const targetName = getHistoryCompactName(entry?.target?.name);
    const value = getHistoryDamageValue(entry);
    const condition = getHistoryCondition(entry);

    if (type === 'damage') {
        if (entry?.combat?.defeated) return `Derrotou ${targetName}: ${value}`;
        if (condition?.name) {
            return entry?.target?.name
                ? `${targetName} — ${condition.name}: −${value} PV`
                : `${condition.name}: −${value} PV`;
        }
        return entry?.target?.name ? `Dano em ${targetName}: −${value} PV` : entry.label;
    }

    if (type === 'healing') {
        return entry?.target?.name ? `Cura em ${targetName}: +${value} PV` : entry.label;
    }

    if ((type === 'effect' || type === 'condition') && entry?.effect?.name) {
        return `${entry.effect.name} · ${entry.effect.action || 'alterado'}`;
    }

    return entry.label;
}

function getHistoryEntryMetadata(entry) {
    const sourceName = entry?.source?.name ? getHistoryCompactName(entry.source.name) : '';
    const targetName = entry?.target?.name ? getHistoryCompactName(entry.target.name) : '';
    const actorLine = sourceName && targetName && sourceName !== targetName
        ? `${sourceName} → ${targetName}`
        : sourceName || targetName;
    const legacyParticipants = getHistoryEntryParticipants(entry)
        .map(participant => getHistoryCompactName(participant.name))
        .join(' → ');
    const participantLine = actorLine || legacyParticipants;

    return [
        `R${entry.round || 1}`,
        participantLine,
        formatHistoryTime(entry.at)
    ].filter(Boolean).join(' · ');
}

function renderHistoryEntry(entry) {
    const type = getHistoryEntryType(entry);
    const typeInfo = HISTORY_TYPE_INFO[type];
    const entryId = encodeURIComponent(String(entry.id));
    const expanded = expandedHistoryEntryId === String(entry.id);
    const headline = getHistoryEntryHeadline(entry, type);
    const metadata = getHistoryEntryMetadata(entry);
    const detail = entry.detail || buildResourceHistoryDetail(entry);

    return `
        <li class="history-entry history-entry-${type}">
            <button type="button" class="history-entry-main" onclick="toggleHistoryDetails('${entryId}')" aria-expanded="${expanded}">
                <span class="history-entry-icon" aria-hidden="true">${getHistoryEntryIcon(entry, typeInfo)}</span>
                <span class="history-entry-copy">
                    <strong>${escapeHtml(headline)}</strong>
                    <small>${escapeHtml(metadata)}</small>
                </span>
                <span class="history-entry-toggle" aria-hidden="true">${expanded ? '−' : '+'}</span>
            </button>
            ${expanded
                ? `<div class="history-entry-detail">${escapeHtml(detail || 'Nenhum detalhe adicional registrado.')}</div>`
                : ''}
        </li>
    `;
}

function renderHistoryTimeline() {
    const entries = sessionHistory.filter(historyEntryMatchesFilters);

    if (!entries.length) {
        return '<li class="session-empty">Nenhuma ação corresponde aos filtros selecionados.</li>';
    }

    const groupedEntries = new Map();
    entries.forEach(entry => {
        const entryRound = Math.max(1, Number(entry.round) || 1);
        const group = groupedEntries.get(entryRound) || [];
        group.push(entry);
        groupedEntries.set(entryRound, group);
    });

    return [...groupedEntries.entries()]
        .map(([entryRound, roundEntries]) => `
            <li class="history-round-group">
                <div class="history-round-heading"><span>Rodada ${entryRound}</span><small>${roundEntries.length} ${roundEntries.length === 1 ? 'ação' : 'ações'}</small></div>
                <ol class="history-round-list">${roundEntries.map(renderHistoryEntry).join('')}</ol>
            </li>
        `)
        .join('');
}

function setHistoryFilter(filter) {
    historyFilter = filter === 'all' || HISTORY_TYPE_INFO[filter] ? filter : 'all';
    expandedHistoryEntryId = null;
    renderSessionToolsView('history');
}

function setHistoryParticipantFilter(id) {
    historyParticipantFilter = id || 'all';
    expandedHistoryEntryId = null;
    renderSessionToolsView('history');
}

function toggleHistoryDetails(encodedId) {
    const id = decodeURIComponent(encodedId);
    expandedHistoryEntryId = expandedHistoryEntryId === id ? null : id;
    renderSessionToolsView('history');
}

function clearSessionHistory() {
    if (!sessionHistory.length) return;

    openSessionConfirm({
        title: 'Limpar histórico?',
        message: 'As ações desta sessão serão removidas. Isso não altera fichas nem o combate atual.',
        confirmLabel: 'Limpar histórico',
        danger: true,
        onConfirm: () => {
            sessionHistory = [];
            historyFilter = 'all';
            historyParticipantFilter = 'all';
            expandedHistoryEntryId = null;
            persistSessionHistory();
            renderSessionToolsView('history');
        }
    });
}

function closeSessionTools() {
    document.getElementById('sessionToolsModal')?.remove();
}

function openSessionTools(view = 'menu') {
    closeSessionTools();

    const modal = document.createElement('div');
    modal.id = 'sessionToolsModal';
    modal.className = 'session-overlay';
    modal.innerHTML = `<section class="session-dialog session-tools" role="dialog" aria-modal="true"></section>`;
    document.body.appendChild(modal);

    renderSessionToolsView(view);
}

function renderSessionToolsView(view) {
    const dialog = document.querySelector('#sessionToolsModal .session-tools');

    if (!dialog) return;

    if (view === 'sheets' && typeof window.renderCharacterSheetsView === 'function') {
        window.renderCharacterSheetsView(dialog);
        return;
    }

    if (view === 'library' && typeof window.renderContentLibraryView === 'function') {
        window.renderContentLibraryView(dialog);
        return;
    }

    if (view === 'preferences' && typeof window.renderPreferencesView === 'function') {
        window.renderPreferencesView(dialog);
        return;
    }

    if (view === 'report' && typeof window.renderCombatReportView === 'function') {
        window.renderCombatReportView(dialog);
        return;
    }

    if (view === 'install' && typeof window.renderInstallView === 'function') {
        window.renderInstallView(dialog);
        return;
    }

    if (view === 'app-maintenance' && typeof window.renderAppMaintenanceView === 'function') {
        window.renderAppMaintenanceView(dialog);
        return;
    }

    if (view === 'history') {
        const filterTypes = ['all', 'damage', 'healing', 'effect', 'condition', 'equipment', 'turn'];
        const participants = getHistoryParticipantOptions();
        const filterButtons = filterTypes.map(type => {
            const label = type === 'all' ? 'Tudo' : HISTORY_TYPE_INFO[type].label;
            return `<button type="button" class="history-filter-button ${historyFilter === type ? 'history-filter-active' : ''}" onclick="setHistoryFilter('${type}')">${label}</button>`;
        }).join('');
        const participantOptions = participants.map(participant => `
            <option value="${escapeHtml(participant.id)}"${historyParticipantFilter === participant.id ? ' selected' : ''}>${escapeHtml(participant.name)}</option>
        `).join('');

        dialog.innerHTML = `
            <div class="session-dialog-header">
                <h2>Histórico</h2>
                <button type="button" class="session-close" onclick="closeSessionTools()" aria-label="Fechar">×</button>
            </div>
            <p class="history-intro">Toque em uma ação para ver os cálculos e efeitos aplicados.</p>
            <div class="history-filter-bar" role="group" aria-label="Filtrar histórico por tipo">${filterButtons}</div>
            ${participants.length
                ? `<label class="history-participant-filter">Participante<select class="session-input" onchange="setHistoryParticipantFilter(this.value)"><option value="all">Todos os participantes</option>${participantOptions}</select></label>`
                : ''}
            <ol class="session-history-list session-history-timeline">${renderHistoryTimeline()}</ol>
            <div class="session-dialog-actions">
                <button type="button" class="session-secondary" onclick="renderSessionToolsView('menu')">Voltar</button>
                <button type="button" class="session-danger" onclick="clearSessionHistory()"${sessionHistory.length ? '' : ' disabled'}>Limpar</button>
            </div>
        `;
        return;
    }

    if (view === 'save-encounter') {
        dialog.innerHTML = `
            <div class="session-dialog-header">
                <h2>Salvar encontro</h2>
                <button type="button" class="session-close" onclick="closeSessionTools()" aria-label="Fechar">×</button>
            </div>
            <p>Salve o combate atual para carregá-lo rapidamente em outra sessão.</p>
            <label class="session-label" for="encounterNameInput">Nome do encontro</label>
            <input id="encounterNameInput" class="session-input" maxlength="60" placeholder="Ex.: Emboscada em Velen">
            <div class="session-dialog-actions">
                <button type="button" class="session-secondary" onclick="renderSessionToolsView('menu')">Cancelar</button>
                <button type="button" class="session-primary" onclick="saveCurrentEncounter()">Salvar</button>
            </div>
        `;
        dialog.querySelector('#encounterNameInput')?.focus();
        return;
    }

    if (view === 'load-encounter') {
        const encounters = loadSessionData(SAVED_ENCOUNTERS_KEY, []);
        const entries = encounters.length
            ? encounters.map(encounter => `
                <li class="session-encounter-item">
                    <div>
                        <strong>${escapeHtml(encounter.name)}</strong>
                        <small>${encounter.combat?.combatants?.length || 0} participantes</small>
                    </div>
                    <div>
                        <button type="button" class="session-small-button" onclick="loadSavedEncounter('${encounter.id}')">Abrir</button>
                        <button type="button" class="session-small-button session-small-danger" onclick="deleteSavedEncounter('${encounter.id}')" aria-label="Excluir ${escapeHtml(encounter.name)}">×</button>
                    </div>
                </li>
            `).join('')
            : '<li class="session-empty">Nenhum encontro salvo.</li>';

        dialog.innerHTML = `
            <div class="session-dialog-header">
                <h2>Encontros salvos</h2>
                <button type="button" class="session-close" onclick="closeSessionTools()" aria-label="Fechar">×</button>
            </div>
            <ul class="session-encounter-list">${entries}</ul>
            <button type="button" class="session-secondary session-full" onclick="renderSessionToolsView('menu')">Voltar</button>
        `;
        return;
    }

    dialog.innerHTML = `
        <div class="session-dialog-header">
            <h2>Sessão de combate</h2>
            <button type="button" class="session-close" onclick="closeSessionTools()" aria-label="Fechar">×</button>
        </div>
        <p class="session-tools-summary">R${round} · ${combatants.length} participantes</p>
        <div class="session-tool-grid">
            <button type="button" onclick="renderSessionToolsView('history')">📜 Histórico</button>
            <button type="button" onclick="renderSessionToolsView('save-encounter')">💾 Salvar encontro</button>
            <button type="button" onclick="renderSessionToolsView('load-encounter')">⚔️ Carregar encontro</button>
            <button type="button" onclick="exportSessionBackup()">⇩ Backup JSON</button>
            <button type="button" onclick="document.getElementById('sessionImportInput').click()">⇧ Restaurar JSON</button>
            <button type="button" onclick="renderSessionToolsView('sheets')">🧙 Fichas</button>
            <button type="button" onclick="renderSessionToolsView('library')">✎ Biblioteca</button>
            <button type="button" onclick="renderSessionToolsView('report')">▤ Relatório</button>
            <button type="button" onclick="renderSessionToolsView('preferences')">⚙ Preferências</button>
            <button type="button" onclick="renderSessionToolsView('install')">⌄ Aplicativo</button>
        </div>
        <input id="sessionImportInput" type="file" accept="application/json,.json" hidden onchange="importSessionBackup(event)">
    `;
}

function saveCurrentEncounter() {
    const input = document.getElementById('encounterNameInput');
    const name = input?.value.trim();

    if (!name) {
        input?.focus();
        showToast('Informe um nome para o encontro.');
        return;
    }

    const encounters = loadSessionData(SAVED_ENCOUNTERS_KEY, []);
    const state = captureSessionState();

    encounters.unshift({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        createdAt: new Date().toISOString(),
        combat: {
            combatants: state.combatants,
            activeTurnId: state.activeTurnId,
            selectedId: state.selectedId,
            round: state.round,
            monsterCounter: state.monsterCounter,
            playerCounter: state.playerCounter,
            lastMonsterData: state.lastMonsterData,
            lastPlayerData: state.lastPlayerData,
            inventory: state.inventory,
            abilitiesInventory: state.abilitiesInventory,
            expandedMagic: state.expandedMagic,
            characterCollectionContextKey: state.characterCollectionContextKey
        }
    });

    localStorage.setItem(SAVED_ENCOUNTERS_KEY, JSON.stringify(encounters.slice(0, 30)));
    addHistoryEntry(`Encontro salvo: ${name}`);
    showToast(`💾 Encontro salvo: ${name}`);
    renderSessionToolsView('load-encounter');
}

function loadSavedEncounter(id) {
    const encounter = loadSessionData(SAVED_ENCOUNTERS_KEY, [])
        .find(entry => entry.id === id);

    if (!encounter?.combat) return;

    openSessionConfirm({
        title: 'Carregar encontro?',
        message: 'O combate atual será substituído. Você poderá desfazer essa ação.',
        confirmLabel: 'Carregar',
        onConfirm: () => {
            const currentState = captureSessionState();
            const encounterState = {
                ...currentState,
                ...cloneSessionData(encounter.combat)
            };

            undoStack.push({ label: `Carregar encontro: ${encounter.name}`, state: currentState });
            undoStack = undoStack.slice(-MAX_UNDO_ENTRIES);
            restoreSessionState(encounterState);
            addHistoryEntry(`Encontro carregado: ${encounter.name}`);
            closeSessionTools();
            showToast(`⚔️ Encontro carregado: ${encounter.name}`);
        }
    });
}

function deleteSavedEncounter(id) {
    const encounter = loadSessionData(SAVED_ENCOUNTERS_KEY, [])
        .find(entry => entry.id === id);

    if (!encounter) return;

    openSessionConfirm({
        title: 'Excluir encontro?',
        message: `"${encounter.name}" será removido da lista de encontros salvos.`,
        confirmLabel: 'Excluir',
        danger: true,
        onConfirm: () => {
            const encounters = loadSessionData(SAVED_ENCOUNTERS_KEY, []);
            localStorage.setItem(
                SAVED_ENCOUNTERS_KEY,
                JSON.stringify(encounters.filter(entry => entry.id !== id))
            );
            renderSessionToolsView('load-encounter');
        }
    });
}

function exportSessionBackup() {
    const backup = {
        version: 3,
        exportedAt: new Date().toISOString(),
        session: captureSessionState(),
        history: sessionHistory,
        encounters: loadSessionData(SAVED_ENCOUNTERS_KEY, []),
        appStorage: window.getApplicationStorageSnapshot?.() || {}
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `witcher-combat-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    addHistoryEntry('Backup JSON exportado');
    showToast('⇩ Backup JSON exportado.');
}

async function importSessionBackup(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
        const backup = JSON.parse(await file.text());
        const hasSessionBackup = backup?.session && Array.isArray(backup.session.combatants);
        const hasCompleteAppBackup = hasSessionBackup && backup?.appStorage &&
            typeof backup.appStorage === 'object' &&
            !Array.isArray(backup.appStorage);

        if (!hasSessionBackup) {
            throw new Error('Arquivo incompatível');
        }

        openSessionConfirm({
            title: 'Restaurar backup?',
            message: hasCompleteAppBackup
                ? 'Todos os dados do aplicativo serão substituídos, incluindo fichas, biblioteca, preferências e combate atual.'
                : 'O combate, inventário e habilidades atuais serão substituídos. Você poderá desfazer esta restauração.',
            confirmLabel: 'Restaurar',
            danger: true,
            onConfirm: () => {
                if (hasCompleteAppBackup && window.restoreApplicationStorageSnapshot?.(backup.appStorage)) {
                    closeSessionTools();
                    showToast('⇧ Backup completo restaurado. Reabrindo aplicativo...');
                    window.setTimeout(() => window.location.reload(), 250);
                    return;
                }

                const currentState = captureSessionState();
                undoStack.push({ label: 'Restaurar backup', state: currentState });
                undoStack = undoStack.slice(-MAX_UNDO_ENTRIES);
                restoreSessionState(backup.session);
                sessionHistory = Array.isArray(backup.history) ? backup.history.slice(0, MAX_HISTORY_ENTRIES) : [];
                localStorage.setItem(
                    SAVED_ENCOUNTERS_KEY,
                    JSON.stringify(Array.isArray(backup.encounters) ? backup.encounters : [])
                );
                addHistoryEntry('Backup JSON restaurado');
                closeSessionTools();
                showToast('⇧ Backup restaurado.');
            }
        });
    } catch {
        showToast('Não foi possível ler este arquivo de backup.');
    } finally {
        event.target.value = '';
    }
}

function getEffectName(effect) {
    if (!effect) return 'Efeito desconhecido';

    if (effect.type === 'condition') {
        return conditionDescriptions[effect.id]?.title || effect.id;
    }

    if (effect.type === 'ability') {
        return predefinedAbilities.find(ability => ability.id === effect.id)?.name || effect.name || effect.id;
    }

    return predefinedItems.find(item => item.id === effect.id)?.name || effect.name || effect.id;
}

function applyRecurringEffects(combatant) {
    if (!combatant?.effects?.length) return [];

    const recurringConditions = {
        '🩸': 'Sangramento',
        '🔥': 'Chamas',
        '🐍': 'Veneno'
    };
    const changes = [];

    combatant.effects.forEach(effect => {
        if (effect.type !== 'condition' || !recurringConditions[effect.id]) return;

        const prevention = window.getRecurringConditionPrevention?.(combatant, effect);
        if (prevention) {
            changes.push({ summary: `${recurringConditions[effect.id]}: ${prevention}` });
            return;
        }

        const rolls = Array.from(
            { length: Math.max(1, Number(effect.stacks) || 1) },
            () => window.rollAutomationDice?.('negativeConditions', '1d6', recurringConditions[effect.id]) ?? (Math.floor(Math.random() * 6) + 1)
        );
        const damage = rolls.reduce((total, roll) => total + roll, 0);
        const before = captureCombatResources(combatant);

        combatant.hpCurrent = Math.max(0, combatant.hpCurrent - damage);

        if (before.hp > 0 && combatant.hpCurrent === 0) {
            combatant.deathSaves = { success: 0, failures: 0 };
            combatant.stabilized = false;
        }

        const after = captureCombatResources(combatant);
        const source = getEffectSource(effect);
        const defeated = didCombatantBecomeDefeated(combatant, before, after);
        const conditionName = recurringConditions[effect.id];
        const sourcePrefix = source && source.id !== combatant.id ? `${source.name} > ` : '';
        const detail = [
            `Condição: ${conditionName}`,
            `Rolagem: ${rolls.join(' + ')}`,
            `Dano total: ${damage}`,
            `PV: ${before.hp} → ${after.hp}`
        ];

        if (defeated) detail.push('Alvo derrotado');

        changes.push({
            summary: `${conditionName}: ${damage} de dano (${rolls.join('+')})`,
            history: {
                label: defeated
                    ? `${sourcePrefix}Derrotou ${combatant.name}: ${damage}`
                    : `${sourcePrefix}Dano de ${conditionName} em ${combatant.name}: ${damage}`,
                detail: detail.join(' · '),
                metadata: {
                    type: 'damage',
                    source,
                    target: { id: combatant.id, name: combatant.name },
                    participants: [source, { id: combatant.id, name: combatant.name }].filter(Boolean),
                    condition: { id: effect.id, name: conditionName },
                    combat: {
                        baseDamage: damage,
                        finalValue: damage,
                        before,
                        after,
                        defeated
                    }
                }
            }
        });
    });

    if (changes.length) {
        savePlayersToStorage();
        showToast(`⚠️ ${combatant.name}: ${changes.map(change => change.summary).join(' · ')}`);
    }

    return changes;
}

function saveCombatReport(state) {
    const damageEntries = sessionHistory.filter(entry => getHistoryEntryType(entry) === 'damage');
    const healingEntries = sessionHistory.filter(entry => getHistoryEntryType(entry) === 'healing');
    const totalFromEntries = entries => entries.reduce((total, entry) => {
        const value = Number(entry.label.match(/(\d+)$/)?.[1] || 0);
        return total + value;
    }, 0);
    const monsters = state.combatants.filter(combatant => combatant.type === 'monster');
    const players = state.combatants.filter(combatant => combatant.type === 'player');
    const defeated = monsters.filter(combatant => combatant.hpCurrent <= 0);

    localStorage.setItem(LAST_COMBAT_REPORT_KEY, JSON.stringify({
        createdAt: new Date().toISOString(),
        rounds: state.round,
        participants: state.combatants.length,
        players: players.length,
        monsters: monsters.length,
        defeatedMonsters: defeated.length,
        totalDamage: totalFromEntries(damageEntries),
        totalHealing: totalFromEntries(healingEntries),
        recentActions: sessionHistory.slice(0, 12)
    }));
}

function getExpiredEffects(beforeState) {
    const expired = [];

    beforeState.combatants.forEach(previousCombatant => {
        const currentCombatant = combatants.find(combatant => combatant.id === previousCombatant.id);

        previousCombatant.effects?.forEach(previousEffect => {
            const stillActive = currentCombatant?.effects?.some(effect =>
                effect.id === previousEffect.id && effect.type === previousEffect.type
            );

            if (previousEffect.remainingTurns > 0 && !stillActive) {
                const change = describeEffectHistoryChange(
                    previousCombatant,
                    currentCombatant,
                    previousEffect.type,
                    previousEffect.id
                );

                expired.push({
                    summary: `${previousCombatant.name}: ${getEffectName(previousEffect)} expirou`,
                    history: {
                        label: change.label,
                        detail: `${change.detail} · Duração encerrada.`,
                        metadata: change.metadata
                    }
                });
            }
        });
    });

    return expired;
}

function installActionGuards() {
    const originalRemoveCombatant = window.removeCombatant;
    const originalEndCombat = window.endCombat;
    const originalHardResetCombat = window.hardResetCombat;
    const originalApplyHP = window.applyHP;
    const originalApplyST = window.applyST;
    const originalNextTurn = window.nextTurn;
    const originalSaveEntity = window.saveEntity;
    const originalApplyInitiative = window.applyInitiative;
    const originalToggleCondition = window.toggleCondition;
    const originalToggleEffect = window.toggleEffect;
    const originalRemoveEffect = window.removeEffect;
    const originalUseSelectedItem = window.useSelectedInventoryItem;

    window.removeCombatant = (event, id) => {
        event?.stopPropagation();
        const combatant = combatants.find(entry => entry.id === id);

        if (!combatant) return;

        openSessionConfirm({
            title: 'Remover participante?',
            message: `${combatant.name} será removido do combate. Você poderá desfazer esta ação.`,
            confirmLabel: 'Remover',
            danger: true,
            onConfirm: () => {
                const result = trackAction(
                    `Participante removido: ${combatant.name}`,
                    () => originalRemoveCombatant({ stopPropagation() {} }, id)
                );
                window.followActiveTurnCharacterCollectionContext?.();
                return result;
            }
        });
    };

    window.endCombat = () => {
        if (skipNextEndCombatClick) {
            skipNextEndCombatClick = false;
            return;
        }

        openSessionConfirm({
            title: 'Encerrar combate?',
            message: 'Monstros e efeitos serão removidos. PV e EST das fichas salvas serão mantidos para o próximo combate. Você poderá desfazer.',
            confirmLabel: 'Encerrar',
            danger: true,
            onConfirm: () => {
                const stateBeforeEnd = captureSessionState();
                trackAction('Combate encerrado', originalEndCombat);
                window.followActiveTurnCharacterCollectionContext?.();
                saveCombatReport(stateBeforeEnd);
            }
        });
    };

    window.hardResetCombat = () => {
        openSessionConfirm({
            title: 'Resetar todo o combate?',
            message: 'Todos os participantes serão removidos. Você poderá desfazer enquanto a sessão estiver aberta.',
            confirmLabel: 'Resetar',
            danger: true,
            onConfirm: () => trackAction('Combate resetado', () => {
                originalHardResetCombat();
                window.followActiveTurnCharacterCollectionContext?.();
                savePlayersToStorage();
            })
        });
    };

    window.startEndCombatPress = () => {
        skipNextEndCombatClick = false;
        window.clearTimeout(endCombatHoldTimer);
        endCombatHoldTimer = window.setTimeout(() => {
            skipNextEndCombatClick = true;
            window.hardResetCombat();
        }, 3000);
    };

    window.cancelEndCombatPress = () => window.clearTimeout(endCombatHoldTimer);

    window.applyHP = (isHealing, resolvedValue = null, historyContext = null) => {
        const target = combatants.find(combatant => combatant.id === selectedId);
        const hasResolvedValue =
            resolvedValue !== null &&
            resolvedValue !== undefined &&
            Number.isFinite(Number(resolvedValue));
        const value = hasResolvedValue
            ? Math.max(0, Number.parseInt(resolvedValue, 10) || 0)
            : Number.parseInt(currentInput) || 0;
        const historyType = isHealing ? 'healing' : (value === 0 ? 'death-save' : 'damage');
        const historyMetadata = target
            ? createResourceHistoryMetadata(historyType, target, value, historyContext || {})
            : null;
        const sourcePrefix = historyMetadata?.source?.name
            ? `${historyMetadata.source.name} > `
            : '';
        const historyLabel = () => {
            if (isHealing) return `${sourcePrefix}Cura em ${target?.name || 'alvo'}: ${value}`;

            if (historyMetadata?.combat?.defeated) {
                return `${sourcePrefix}Derrotou ${target?.name || 'alvo'}: ${value || 'falha de morte'}`;
            }

            return `${sourcePrefix}Dano em ${target?.name || 'alvo'}: ${value || 'falha de morte'}`;
        };

        const applyOriginalHP = () => {
            let result;

            if (hasResolvedValue) {
                // A confirmação é assíncrona. Recoloca o valor calculado apenas
                // no instante da aplicação para que armadura e multiplicadores
                // não sejam substituídos pelo valor digitado originalmente.
                currentInput = String(value);
            }

            result = originalApplyHP(isHealing);
            if (historyMetadata) finalizeResourceHistoryMetadata(historyMetadata, target);
            return result;
        };

        if (isHealing) {
            return trackAction(
                historyLabel,
                applyOriginalHP,
                () => buildResourceHistoryDetail(historyMetadata),
                () => historyMetadata
            );
        }

        if (!target) return applyOriginalHP();

        openSessionConfirm({
            title: 'Aplicar dano?',
            message: value > 0
                ? `${target.name} receberá ${value} de dano.`
                : `${target.name} receberá uma falha de morte.`,
            confirmLabel: 'Aplicar dano',
            danger: true,
            onConfirm: () => trackAction(
                historyLabel,
                applyOriginalHP,
                () => buildResourceHistoryDetail(historyMetadata),
                () => historyMetadata
            )
        });
    };

    window.applyST = isHealing => {
        const target = combatants.find(combatant => combatant.id === selectedId);
        const value = Number.parseInt(currentInput) || 0;
        return trackAction(
            `${isHealing ? 'ST recuperado' : 'ST gasto'} em ${target?.name || 'alvo'}: ${value}`,
            () => originalApplyST(isHealing)
        );
    };

    window.nextTurn = () => {
        const before = captureSessionState();
        originalNextTurn();

        const activeCombatant = getActiveCombatant();
        const recurringEffects = applyRecurringEffects(activeCombatant);
        const recurringChanges = recurringEffects.map(change => change.summary);
        const automationChanges = window.processAutomatedTurnEffects?.(activeCombatant) || [];
        const expiredEffects = getExpiredEffects(before);
        const detail = [
            ...recurringChanges,
            ...automationChanges,
            ...expiredEffects.map(effect => effect.summary)
        ].join(' · ');

        if (getStateFingerprint(before) !== getStateFingerprint(captureSessionState())) {
            undoStack.push({ label: `Próximo turno: ${activeCombatant?.name || 'sem participante'}`, state: before });
            undoStack = undoStack.slice(-MAX_UNDO_ENTRIES);
            addHistoryEntry(`Turno: ${activeCombatant?.name || 'sem participante'}`, detail);
            recurringEffects.forEach(change => {
                if (change.history) {
                    addHistoryEntry(change.history.label, change.history.detail, change.history.metadata);
                }
            });
            expiredEffects.forEach(effect => {
                if (effect.history) {
                    addHistoryEntry(effect.history.label, effect.history.detail, effect.history.metadata);
                }
            });
        }

        renderList(false);
    };

    window.saveEntity = () => {
        const beforeCombatants = cloneSessionData(combatants);
        const getChange = () => describeCombatantCollectionChange(beforeCombatants, combatants);

        const result = trackAction(
            () => getChange().label,
            originalSaveEntity,
            () => getChange().detail,
            () => getChange().metadata
        );
        window.followActiveTurnCharacterCollectionContext?.();
        return result;
    };
    window.applyInitiative = () => trackAction('Iniciativa alterada', originalApplyInitiative);

    window.toggleCondition = icon => {
        const target = combatants.find(combatant => combatant.id === selectedId);
        const beforeTarget = target ? cloneSessionData(target) : null;
        const source = combatants.find(combatant => combatant.id === activeTurnId) || null;

        if (!target) return originalToggleCondition(icon);

        return trackAction(
            () => describeEffectHistoryChange(
                beforeTarget,
                combatants.find(combatant => combatant.id === target.id),
                'condition',
                icon
            ).label,
            () => {
                const result = originalToggleCondition(icon);
                const currentTarget = combatants.find(combatant => combatant.id === target.id);
                const existingBefore = getEffectSnapshot(beforeTarget, 'condition', icon);
                const currentEffect = getEffectSnapshot(currentTarget, 'condition', icon);

                if (!existingBefore && currentEffect) {
                    setEffectSource(currentEffect, source);
                    savePlayersToStorage();
                }

                return result;
            },
            () => describeEffectHistoryChange(
                beforeTarget,
                combatants.find(combatant => combatant.id === target.id),
                'condition',
                icon
            ).detail,
            () => describeEffectHistoryChange(
                beforeTarget,
                combatants.find(combatant => combatant.id === target.id),
                'condition',
                icon
            ).metadata
        );
    };

    window.toggleEffect = (type, id) => {
        const target = combatants.find(combatant => combatant.id === selectedId);
        const beforeTarget = target ? cloneSessionData(target) : null;
        const source = combatants.find(combatant => combatant.id === activeTurnId) || null;

        if (!target) return originalToggleEffect(type, id);

        return trackAction(
            () => describeEffectHistoryChange(
                beforeTarget,
                combatants.find(combatant => combatant.id === target.id),
                type,
                id
            ).label,
            () => {
                const result = originalToggleEffect(type, id);
                const currentTarget = combatants.find(combatant => combatant.id === target.id);
                const existingBefore = getEffectSnapshot(beforeTarget, type, id);
                const currentEffect = getEffectSnapshot(currentTarget, type, id);

                if (!existingBefore && currentEffect) {
                    setEffectSource(currentEffect, source);
                    savePlayersToStorage();
                }

                return result;
            },
            () => describeEffectHistoryChange(
                beforeTarget,
                combatants.find(combatant => combatant.id === target.id),
                type,
                id
            ).detail,
            () => describeEffectHistoryChange(
                beforeTarget,
                combatants.find(combatant => combatant.id === target.id),
                type,
                id
            ).metadata
        );
    };

    const guardEffectChange = originalAction => (combatantId, type, id, ...args) => {
        const target = combatants.find(combatant => combatant.id === combatantId);
        const beforeTarget = target ? cloneSessionData(target) : null;

        if (!target) return originalAction(combatantId, type, id, ...args);

        return trackAction(
            () => describeEffectHistoryChange(
                beforeTarget,
                combatants.find(combatant => combatant.id === target.id),
                type,
                id
            ).label,
            () => originalAction(combatantId, type, id, ...args),
            () => describeEffectHistoryChange(
                beforeTarget,
                combatants.find(combatant => combatant.id === target.id),
                type,
                id
            ).detail,
            () => describeEffectHistoryChange(
                beforeTarget,
                combatants.find(combatant => combatant.id === target.id),
                type,
                id
            ).metadata
        );
    };

    if (typeof originalRemoveEffect === 'function') {
        window.removeEffect = guardEffectChange(originalRemoveEffect);
    }

    [
        'increaseEffectTurn',
        'decreaseEffectTurn',
        'increaseEffectStack',
        'decreaseEffectStack'
    ].forEach(actionName => {
        const originalAction = window[actionName];

        if (typeof originalAction === 'function') {
            window[actionName] = guardEffectChange(originalAction);
        }
    });

    window.useSelectedInventoryItem = () => {
        const item = inventory.find(entry => entry.id === selectedInventoryItemId);

        if (!item || item.id === 'coroa') return originalUseSelectedItem();

        if (window.isEquipmentItem?.(item)) return originalUseSelectedItem();

        openSessionConfirm({
            title: 'Usar item?',
            message: `${item.name} será consumido do inventário. Você poderá desfazer.`,
            confirmLabel: 'Usar item',
            onConfirm: () => trackAction(`Item usado: ${item.name}`, originalUseSelectedItem)
        });
    };
}

window.closeSessionConfirm = closeSessionConfirm;
window.openSessionConfirm = openSessionConfirm;
window.undoLastAction = undoLastAction;
window.openSessionTools = openSessionTools;
window.closeSessionTools = closeSessionTools;
window.renderSessionToolsView = renderSessionToolsView;
window.setHistoryFilter = setHistoryFilter;
window.setHistoryParticipantFilter = setHistoryParticipantFilter;
window.toggleHistoryDetails = toggleHistoryDetails;
window.clearSessionHistory = clearSessionHistory;
window.addCombatHistoryEntry = addHistoryEntry;
window.trackEquipmentAction = (label, callback, detail = '', metadata = {}) =>
    trackAction(label, callback, detail, metadata);
window.describeCombatantChanges = describeCombatantChanges;
window.saveCurrentEncounter = saveCurrentEncounter;
window.loadSavedEncounter = loadSavedEncounter;
window.deleteSavedEncounter = deleteSavedEncounter;
window.exportSessionBackup = exportSessionBackup;
window.importSessionBackup = importSessionBackup;

installActionGuards();
window.addEventListener('load', installSessionStatusObserver);
