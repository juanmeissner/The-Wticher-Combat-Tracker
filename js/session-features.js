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
    loot: { icon: '🎁', label: 'Saque' },
    'skill-test': { icon: '🎲', label: 'Teste' },
    turn: { icon: '⏱️', label: 'Turno' },
    time: { icon: '🕰️', label: 'Tempo' },
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
let pendingSessionCancel = null;
let appliedCampaignViewId = null;

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
        campaignClock: window.campaignClock?.getSnapshot?.() || null,
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
        campaignClock: state.campaignClock,
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
    if (normalized.startsWith('tempo avançado') || normalized.includes('relógio da campanha') || normalized.includes('início da campanha')) return 'time';
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
    if (Number.isFinite(Number(automation.temporarySt))) {
        details.push(`EST temporário: ${Math.max(0, Number(automation.temporarySt))}`);
    }
    if (Number.isFinite(Number(automation.staminaCost)) && Number(automation.staminaCost) > 0) {
        if (automation.staminaPayerName) {
            details.push(`Conjurador: ${automation.staminaPayerName}`);
        }
        const runeSourceSpent = Math.max(0, Number(automation.runeSourceSpent) || 0);
        const staminaSpent = Number.isFinite(Number(automation.staminaSpent))
            ? Math.max(0, Number(automation.staminaSpent))
            : Math.max(0, Number(automation.staminaCost));
        details.push(runeSourceSpent > 0
            ? `Custo: ${runeSourceSpent} Fonte Rúnica + ${staminaSpent} EST`
            : `Custo: ${staminaSpent} EST`);
        if (
            Number.isFinite(Number(automation.runeSourceBefore)) &&
            Number.isFinite(Number(automation.runeSourceAfter)) &&
            runeSourceSpent > 0
        ) {
            details.push(`Fonte Rúnica do conjurador: ${automation.runeSourceBefore} → ${automation.runeSourceAfter}`);
        }
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
        ['temporaryHp', 'PV temporários'],
        ['temporarySt', 'EST temporário']
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
    if (state.campaignClock) window.campaignClock?.restoreSnapshot?.(state.campaignClock);

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

function applyRemoteCampaignView(campaign) {
    const remoteCombat = campaign?.state?.combat;
    if (!remoteCombat || !Array.isArray(remoteCombat.combatants)) return false;

    const campaignViewId = String(campaign?.id || 'campaign');
    const forceViewRefresh = appliedCampaignViewId !== campaignViewId;
    const previousCombatFingerprint = JSON.stringify({
        combatants,
        activeTurnId,
        selectedId,
        round,
        monsterCounter,
        playerCounter
    });
    const previousInventoryFingerprint = JSON.stringify(inventory);
    const previousAbilitiesFingerprint = JSON.stringify({ abilitiesInventory, expandedMagic });

    combatants = cloneSessionData(remoteCombat.combatants);
    activeTurnId = remoteCombat.activeTurnId ?? null;
    selectedId = remoteCombat.selectedId ?? null;
    round = Math.max(1, Number(remoteCombat.round) || 1);
    monsterCounter = Math.max(1, Number(remoteCombat.monsterCounter) || 1);
    playerCounter = Math.max(1, Number(remoteCombat.playerCounter) || 1);
    sessionHistory = loadSessionData(SESSION_HISTORY_KEY, []);

    inventory = [];
    abilitiesInventory = [];
    if (typeof loadInventory === 'function') loadInventory();
    if (typeof loadAbilities === 'function') loadAbilities();
    expandedMagic = Math.max(0, Number(localStorage.getItem('expandedMagic')) || 0);
    window.reloadCharacterSheetsFromStorage?.();
    window.initializeCharacterCollections?.({ inventory, abilities: abilitiesInventory, expandedMagic });
    if (campaign.state?.campaignClock) window.campaignClock?.restoreSnapshot?.(campaign.state.campaignClock);

    const nextCombatFingerprint = JSON.stringify({
        combatants,
        activeTurnId,
        selectedId,
        round,
        monsterCounter,
        playerCounter
    });
    const nextInventoryFingerprint = JSON.stringify(inventory);
    const nextAbilitiesFingerprint = JSON.stringify({ abilitiesInventory, expandedMagic });

    if (forceViewRefresh || previousCombatFingerprint !== nextCombatFingerprint) renderList(false);
    if (forceViewRefresh || previousInventoryFingerprint !== nextInventoryFingerprint) renderInventory();
    if (forceViewRefresh || previousAbilitiesFingerprint !== nextAbilitiesFingerprint) {
        renderAbilities();
        updateAbilitiesHeader();
    }
    refreshSessionStatus();
    appliedCampaignViewId = campaignViewId;
    return true;
}

window.applyRemoteCampaignView = applyRemoteCampaignView;

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
    pendingSessionCancel = null;
}

function cancelSessionConfirm() {
    const callback = pendingSessionCancel;
    closeSessionConfirm();
    callback?.();
}

function openSessionConfirm({ title, message, confirmLabel, danger = false, onConfirm, onCancel = null }) {
    closeSessionConfirm();
    pendingSessionCancel = typeof onCancel === 'function' ? onCancel : null;

    const modal = document.createElement('div');
    modal.id = 'sessionConfirmModal';
    modal.className = 'session-overlay';
    modal.innerHTML = `
        <section class="session-dialog" role="alertdialog" aria-modal="true" aria-labelledby="sessionConfirmTitle">
            <h2 id="sessionConfirmTitle">${escapeHtml(title)}</h2>
            <p>${escapeHtml(message)}</p>
            <div class="session-dialog-actions">
                <button type="button" class="session-secondary" onclick="cancelSessionConfirm()">Cancelar</button>
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
    const preparedCritical = window.getPreparedAttackCritical?.(activeCombatant);
    const collaborationRole = window.collaborationSession?.getRoleLabel?.() || 'Mestre';
    const bar = document.createElement('div');

    bar.id = 'sessionStatusBar';
    bar.className = 'session-status-bar';
    bar.innerHTML = `
        <div class="session-turn-summary" aria-live="polite">
            <span class="session-round">R${round}</span>
            <span id="sessionConnectionStatus" class="session-connection-status" aria-label="Status da conexão" title="Online"></span>
            <span class="session-role-chip">${escapeHtml(collaborationRole)}</span>
            <span class="session-turn-name">${escapeHtml(activeCombatant?.name || 'Sem turno')}</span>
            ${preparedCritical ? `
                <span
                    class="session-critical-ready"
                    title="20 natural em ${escapeHtml(preparedCritical.skillName || 'ataque')} · margem ${preparedCritical.margin || 0}"
                    aria-label="Crítico preparado com margem ${preparedCritical.margin || 0}"
                >💥 ${preparedCritical.margin || 0}</span>
            ` : ''}
            ${nextCombatant && activeCombatant?.id !== nextCombatant.id
                ? `<span class="session-next">→ ${escapeHtml(nextCombatant.name)}</span>`
                : ''}
        </div>
        <div class="session-status-actions">
            <button type="button" data-master-only class="session-icon-button" onclick="undoLastAction()" aria-label="Desfazer última ação" title="Desfazer">↶</button>
            <button type="button" class="session-icon-button" onclick="openSessionTools()" aria-label="Abrir ferramentas da sessão" title="Ferramentas da sessão">⋯</button>
        </div>
    `;

    container.prepend(bar);
    window.collaborationSession?.updateConnectionIndicator?.();
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
    const contextualSourceId = context.damageSource?.sourceId;
    const sourceCombatant = combatants.find(combatant => (
        contextualSourceId
            ? String(combatant.id) === String(contextualSourceId)
            : combatant.id === activeTurnId
    ));
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
            localizedBaseDamage: Math.max(0, Number(context.localizedBaseDamage ?? context.baseDamage ?? value) || 0),
            finalValue: Math.max(0, Number(value) || 0),
            damageType: context.damageType || '',
            spellDamage: context.spellDamage && typeof context.spellDamage === 'object'
                ? cloneSessionData(context.spellDamage)
                : null,
            itemDamage: context.itemDamage && typeof context.itemDamage === 'object'
                ? cloneSessionData(context.itemDamage)
                : null,
            damageSource: context.damageSource && typeof context.damageSource === 'object'
                ? cloneSessionData(context.damageSource)
                : null,
            bodyPart: context.bodyPart || '',
            bodyMultiplier: Number(context.bodyMultiplier) || 1,
            typeMultiplier: Number(context.typeMultiplier) || 1,
            armorAbsorbed: Math.max(0, Number(context.armorAbsorbed) || 0),
            armorBreakdown: context.armorBreakdown && typeof context.armorBreakdown === 'object'
                ? cloneSessionData(context.armorBreakdown)
                : null,
            ignoredArmor: Boolean(context.ignoredArmor),
            critical: context.critical && typeof context.critical === 'object'
                ? cloneSessionData(context.critical)
                : null,
            before: captureCombatResources(target),
            after: null
        }
    };
}

function finalizeResourceHistoryMetadata(metadata, target) {
    if (!metadata?.combat) return;

    metadata.combat.after = captureCombatResources(target);
    if (metadata.type === 'damage') {
        const automationDamage = window.consumeAutomationDamageResolution?.(target);
        if (automationDamage) {
            metadata.combat.automationDamage = cloneSessionData(automationDamage);
            if (Number.isFinite(Number(automationDamage.damageAfterFisstech))) {
                metadata.combat.finalValue = Math.max(0, Number(automationDamage.damageAfterFisstech) || 0);
            }
        }
    }
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

    if (combat.critical) {
        const critical = combat.critical;
        const spellRoll = combat.spellDamage?.roll;
        detail.push(critical.severityName
            ? `Crítico ${critical.severityName} · margem ${critical.margin || 0}`
            : `Crítico por 20 natural · margem ${critical.margin || 0} · sem ferimento adicional`);
        detail.push(
            `Cálculo: ${combat.localizedBaseDamage ?? combat.baseDamage} ×2 ×${combat.bodyMultiplier || 1} + ${critical.woundBonus || 0} = ${combat.finalValue}`
        );
        if (spellRoll?.adrenalineMultiplier > 1) {
            detail.push(`Golpe Forte: dano base ×${spellRoll.adrenalineMultiplier}`);
        }
        if (spellRoll?.overloadMultiplier > 1) {
            detail.push(`Sobrecarga Arcana: dano base ×${spellRoll.overloadMultiplier}`);
        }
        if (spellRoll?.totalMultiplier > 1) {
            detail.push(`Multiplicador mágico antes do crítico: ×${spellRoll.totalMultiplier}`);
        }
        if (critical.preparedFromNatural20) {
            detail.push(`Preparado por: 20 natural em ${critical.preparedSkillName || 'ataque'}`);
        }
        if (critical.woundName) detail.push(`Ferimento: ${critical.woundName}`);
        if (critical.roll) detail.push(`Definição: ${critical.roll}`);
        if (critical.conditionsApplied?.length) {
            detail.push(`Condições aplicadas: ${critical.conditionsApplied.join(', ')}`);
        }
        if (critical.advancedConsequences?.length) {
            critical.advancedConsequences.forEach(consequence =>
                detail.push(`Consequência: ${consequence}`)
            );
        }
        if (critical.sourceName && Number.isFinite(Number(critical.adrenalineAfter))) {
            detail.push(
                `Adrenalina de ${critical.sourceName}: ${critical.adrenalineBefore || 0} → ${critical.adrenalineAfter}`
            );
            if (critical.adrenalineReused) detail.push('Adrenalina já concedida no teste; nenhum ponto duplicado');
        }
        if (critical.deathApplied) detail.push('Consequência: morte imediata');
    }

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

    const automationDamage = combat.automationDamage;
    if (combat.spellDamage?.abilityName) {
        detail.push(`Magia: ${combat.spellDamage.abilityName}`);
    }
    if (combat.itemDamage?.itemName) {
        detail.push(`Item: ${combat.itemDamage.itemName}`);
    }
    if (automationDamage?.damageType === 'fire') {
        if (automationDamage.fireBonus > 0) detail.push(`Bafo de Dragão: +${automationDamage.fireBonus} de Fogo`);
        if (automationDamage.fireMultiplier > 1) detail.push(`Inflamador: ×${automationDamage.fireMultiplier}`);
        if (combat.localizedBaseDamage !== combat.baseDamage) {
            detail.push(`Base elemental antes do local: ${combat.baseDamage} → ${combat.localizedBaseDamage}`);
        }
    }
    if (automationDamage?.fissstechSuppressed > 0) {
        detail.push(`Fisstech suprimiu: ${automationDamage.fissstechSuppressed}`);
        detail.push(`Dano após Fisstech: ${automationDamage.damageAfterFisstech}`);
    }

    if (metadata.type === 'healing' && Number(combat.healingMultiplier) !== 1) {
        detail.push(`Cura base: ${combat.requestedHealing || 0}`);
        detail.push(`Multiplicador de cura: ×${combat.healingMultiplier}`);
        detail.push(`Cura calculada: ${combat.finalValue}`);
    }

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

    if (entry?.combat?.critical) return '💥';
    if (entry?.combat?.criticalWound) return '🩹';

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
        if (entry?.combat?.defeated) {
            return entry?.combat?.critical
                ? `Derrotou ${targetName} com crítico: ${value}`
                : `Derrotou ${targetName}: ${value}`;
        }
        if (entry?.combat?.critical) return `Crítico em ${targetName}: −${value} PV`;
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

function closeWorldHub() {
    window.worldMap?.destroy?.();
    document.getElementById('worldHubModal')?.remove();
}

function getWorldLocationTypeLabel(type) {
    return ({
        continent: 'Continente',
        realm: 'Reino ou território',
        province: 'Província',
        location: 'Local'
    })[type] || 'Local';
}

function getWorldPoliticalTypeLabel(type) {
    return ({
        empire: 'Império',
        kingdom: 'Reino',
        'united-kingdom': 'União de reinos',
        duchy: 'Ducado',
        'vassal-kingdom': 'Reino vassalo',
        'vassal-duchy': 'Ducado vassalo',
        federation: 'Federação',
        'free-city': 'Cidade livre',
        'autonomous-territory': 'Território autônomo',
        province: 'Província',
        'geopolitical-region': 'Região geopolítica',
        queendom: 'Reino matriarcal',
        archipelago: 'Arquipélago'
    })[type] || 'Entidade política';
}

function getWorldCanonicalTypeLabel(type) {
    return ({
        capital: 'Capital',
        city: 'Cidade',
        'port-city': 'Cidade portuária',
        town: 'Vila ou cidade menor',
        village: 'Vilarejo',
        fortress: 'Fortaleza',
        castle: 'Castelo',
        keep: 'Forte',
        palace: 'Palácio',
        academy: 'Academia',
        temple: 'Templo',
        island: 'Ilha',
        ruins: 'Ruínas',
        tower: 'Torre',
        battlefield: 'Campo de batalha',
        'forest-settlement': 'Assentamento florestal',
        'special-site': 'Local especial'
    })[type] || 'Local canônico';
}

function getWorldCartographicTypeLabel(type) {
    return ({
        settlement: 'Assentamento',
        'fortified-settlement': 'Assentamento fortificado',
        castle: 'Castelo',
        fort: 'Forte',
        island: 'Ilha',
        'special-site': 'Local especial'
    })[type] || 'Local cartográfico';
}

function getWorldCustomTypeLabel(type) {
    return ({
        city: 'Cidade',
        town: 'Vila ou cidade menor',
        village: 'Vilarejo',
        settlement: 'Assentamento',
        fortress: 'Fortaleza',
        castle: 'Castelo',
        'special-site': 'Local especial'
    })[type] || 'Local personalizado';
}

function getWorldReliabilityLabel(confidence) {
    return ({
        high: 'Alta — nome e território legíveis',
        medium: 'Média — vínculo territorial aproximado',
        low: 'Baixa — transcrição ou posição a confirmar'
    })[confidence] || 'Não classificada';
}

function getWorldCatalogLayer(location) {
    if (location?.origin === 'custom') return 'custom';
    if (location?.cartographicStatus === 'map-only') return 'cartographic';
    return 'canonical';
}

function getWorldCatalogType(location) {
    return location?.canonicalType || location?.cartographicType || location?.customType || 'location';
}

function getWorldCatalogTypeLabel(location) {
    if (location?.origin === 'custom') return getWorldCustomTypeLabel(location.customType);
    if (location?.cartographicStatus === 'map-only') return getWorldCartographicTypeLabel(location.cartographicType);
    return getWorldCanonicalTypeLabel(location?.canonicalType);
}

function normalizeWorldSearch(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function filterWorldPoliticalAtlas() {
    const modal = document.getElementById('worldHubModal');
    if (!modal) return;
    const query = normalizeWorldSearch(modal.querySelector('#worldAtlasSearch')?.value);
    const type = modal.querySelector('#worldAtlasType')?.value || 'all';
    let visible = 0;
    modal.querySelectorAll('.world-political-card').forEach(card => {
        const matchesQuery = !query || normalizeWorldSearch(card.dataset.search).includes(query);
        const matchesType = type === 'all' || card.dataset.politicalType === type;
        card.hidden = !(matchesQuery && matchesType);
        if (!card.hidden) visible += 1;
    });
    const empty = modal.querySelector('.world-atlas-empty');
    if (empty) empty.hidden = visible > 0;
    const count = modal.querySelector('.world-atlas-visible-count');
    if (count) count.textContent = `${visible} ${visible === 1 ? 'entidade encontrada' : 'entidades encontradas'}`;
}

function filterWorldCanonicalCatalog() {
    const modal = document.getElementById('worldHubModal');
    if (!modal) return;
    const query = normalizeWorldSearch(modal.querySelector('#worldLocationSearch')?.value);
    const type = modal.querySelector('#worldLocationType')?.value || 'all';
    const layer = modal.querySelector('#worldLocationLayer')?.value || 'all';
    const confidence = modal.querySelector('#worldLocationConfidence')?.value || 'all';
    let visible = 0;
    modal.querySelectorAll('.world-location-card').forEach(card => {
        const matchesQuery = !query || normalizeWorldSearch(card.dataset.search).includes(query);
        const matchesType = type === 'all' || card.dataset.locationType === type;
        const matchesLayer = layer === 'all' || card.dataset.locationLayer === layer;
        const matchesConfidence = confidence === 'all' || card.dataset.locationConfidence === confidence;
        card.hidden = !(matchesQuery && matchesType && matchesLayer && matchesConfidence);
        if (!card.hidden) visible += 1;
    });
    const empty = modal.querySelector('.world-location-empty');
    if (empty) empty.hidden = visible > 0;
    const count = modal.querySelector('.world-location-visible-count');
    if (count) count.textContent = `${visible} ${visible === 1 ? 'local encontrado' : 'locais encontrados'}`;
}

function closeWorldLocationEditor() {
    document.getElementById('worldLocationEditorModal')?.remove();
}

function openWorldLocationEditor(locationId = '') {
    closeWorldLocationEditor();
    if (window.collaborationSession?.isPlayer?.()) {
        showToast('Somente o mestre pode criar locais da campanha.');
        return;
    }
    const world = window.worldStore?.getWorld?.();
    const editing = locationId ? window.worldModel?.getLocation?.(world, locationId) : null;
    if (editing && editing.origin !== 'custom') {
        showToast('O catálogo oficial é somente leitura.');
        return;
    }
    const parentOptions = (world?.locations || [])
        .filter(location => location.id !== locationId && location.politicalType !== 'geopolitical-region')
        .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'))
        .map(location => {
            const path = window.worldModel?.getLocationPath?.(world, location.id) || [location];
            const label = path.map(entry => entry.name).join(' › ');
            return `<option value="${escapeHtml(location.id)}"${editing?.parentId === location.id ? ' selected' : ''}>${escapeHtml(label)}</option>`;
        }).join('');
    const coordinates = editing?.coordinates || {};
    const modal = document.createElement('div');
    modal.id = 'worldLocationEditorModal';
    modal.className = 'session-overlay world-location-editor-overlay';
    modal.addEventListener('click', event => {
        if (event.target === modal) closeWorldLocationEditor();
    });
    modal.innerHTML = `
        <section class="session-dialog world-location-editor" role="dialog" aria-modal="true" aria-labelledby="worldLocationEditorTitle">
            <div class="session-dialog-header">
                <div><small class="world-hub-kicker">LOCAL DA CAMPANHA</small><h2 id="worldLocationEditorTitle">${editing ? 'Editar local' : 'Criar local personalizado'}</h2></div>
                <button type="button" class="session-close" onclick="closeWorldLocationEditor()" aria-label="Fechar">×</button>
            </div>
            <p>Este registro pertence apenas à campanha e não altera o catálogo oficial.</p>
            <form id="worldLocationEditorForm" onsubmit="saveWorldLocationFromForm(event, '${escapeHtml(locationId)}')">
                <label><span>Nome *</span><input name="name" required maxlength="120" value="${escapeHtml(editing?.name || '')}" placeholder="Ex.: Aldeia do Carvalho"></label>
                <label><span>Dentro de *</span><select name="parentId" required><option value="">Selecione o território</option>${parentOptions}</select></label>
                <div class="world-location-editor-grid">
                    <label><span>Tipo</span><select name="customType">
                        ${['city', 'town', 'village', 'settlement', 'fortress', 'castle', 'special-site'].map(type => `<option value="${type}"${(editing?.customType || 'settlement') === type ? ' selected' : ''}>${getWorldCustomTypeLabel(type)}</option>`).join('')}
                    </select></label>
                    <label><span>Visibilidade</span><select name="visibility"><option value="public"${editing?.visibility !== 'private' ? ' selected' : ''}>Pública</option><option value="private"${editing?.visibility === 'private' ? ' selected' : ''}>Somente mestre</option></select></label>
                </div>
                <label><span>Descrição</span><textarea name="description" maxlength="4000" rows="4" placeholder="História, aparência e informações úteis para a campanha">${escapeHtml(editing?.description || '')}</textarea></label>
                <fieldset><legend>Coordenadas no mapa (opcional)</legend><div class="world-location-editor-grid">
                    <label><span>Horizontal X (%)</span><input name="coordinateX" type="number" min="0" max="100" step="0.1" value="${coordinates.x ?? ''}" placeholder="0–100"></label>
                    <label><span>Vertical Y (%)</span><input name="coordinateY" type="number" min="0" max="100" step="0.1" value="${coordinates.y ?? ''}" placeholder="0–100"></label>
                </div><small>0,0 é o canto superior esquerdo; 100,100 é o canto inferior direito.</small></fieldset>
                <div class="session-dialog-actions"><button type="button" class="session-secondary" onclick="closeWorldLocationEditor()">Cancelar</button><button type="submit" class="session-primary">${editing ? 'Salvar alterações' : 'Criar local'}</button></div>
            </form>
        </section>`;
    document.body.appendChild(modal);
    modal.querySelector('input[name="name"]')?.focus();
}

function saveWorldLocationFromForm(event, locationId = '') {
    event?.preventDefault?.();
    const form = event?.currentTarget;
    if (!form) return;
    const data = new FormData(form);
    const xValue = String(data.get('coordinateX') || '').trim();
    const yValue = String(data.get('coordinateY') || '').trim();
    if ((xValue && !yValue) || (!xValue && yValue)) {
        showToast('Informe X e Y juntos ou deixe as duas coordenadas vazias.');
        return;
    }
    const input = {
        type: window.worldModel?.LOCATION_TYPES?.LOCATION || 'location',
        origin: 'custom',
        name: String(data.get('name') || '').trim(),
        parentId: String(data.get('parentId') || ''),
        customType: String(data.get('customType') || 'settlement'),
        visibility: data.get('visibility') === 'private' ? 'private' : 'public',
        description: String(data.get('description') || '').trim(),
        coordinates: xValue && yValue ? { x: Number(xValue), y: Number(yValue) } : null
    };
    try {
        if (locationId) window.worldStore?.updateLocation?.(locationId, input);
        else window.worldStore?.createLocation?.(input);
        closeWorldLocationEditor();
        showToast(locationId ? '📍 Local atualizado.' : '📍 Local criado para a campanha.');
        openWorldHub('locations');
    } catch (error) {
        showToast(error?.message || 'Não foi possível salvar o local.');
    }
}

function requestDeleteWorldLocation(locationId) {
    const world = window.worldStore?.getWorld?.();
    const location = window.worldModel?.getLocation?.(world, locationId);
    if (!location || location.origin !== 'custom') return;
    openSessionConfirm({
        title: `Excluir ${location.name}?`,
        message: 'O local e todos os locais personalizados que estiverem dentro dele serão removidos desta campanha.',
        confirmLabel: 'Excluir local',
        danger: true,
        onConfirm: () => {
            try {
                window.worldStore?.removeLocation?.(locationId);
                showToast('🗑️ Local personalizado removido.');
                openWorldHub('locations');
            } catch (error) {
                showToast(error?.message || 'Não foi possível remover o local.');
            }
        }
    });
}

function getWorldNpcRelationshipLabel(value) {
    return ({
        unknown: 'Desconhecido',
        neutral: 'Neutro',
        friendly: 'Amigável',
        allied: 'Aliado',
        hostile: 'Hostil',
        rival: 'Rival'
    })[value] || 'Desconhecido';
}

function formatWorldNpcMovementDate(movement) {
    const value = movement?.chronology;
    if (!value) return 'Data da campanha não registrada';
    const date = `${String(value.day).padStart(2, '0')}/${String(value.month).padStart(2, '0')}/${value.year} ${value.era}`;
    return `${date} · ${String(value.hour).padStart(2, '0')}:${String(value.minute).padStart(2, '0')}`;
}

function filterWorldNpcs() {
    const modal = document.getElementById('worldHubModal');
    if (!modal) return;
    const query = normalizeWorldSearch(modal.querySelector('#worldNpcSearch')?.value);
    const relationship = modal.querySelector('#worldNpcRelationship')?.value || 'all';
    const locationId = modal.querySelector('#worldNpcLocation')?.value || 'all';
    let visible = 0;
    modal.querySelectorAll('.world-npc-card').forEach(card => {
        const matchesQuery = !query || normalizeWorldSearch(card.dataset.search).includes(query);
        const matchesRelationship = relationship === 'all' || card.dataset.npcRelationship === relationship;
        const locationPath = String(card.dataset.npcLocationPath || card.dataset.npcLocation || '').split('|');
        const matchesLocation = locationId === 'all' || locationPath.includes(locationId);
        card.hidden = !(matchesQuery && matchesRelationship && matchesLocation);
        if (!card.hidden) visible += 1;
    });
    const empty = modal.querySelector('.world-npc-empty');
    if (empty) empty.hidden = visible > 0;
    const count = modal.querySelector('.world-npc-visible-count');
    if (count) count.textContent = `${visible} ${visible === 1 ? 'NPC encontrado' : 'NPCs encontrados'}`;
}

function filterWorldMerchants() {
    const modal = document.getElementById('worldHubModal');
    if (!modal) return;
    const query = normalizeWorldSearch(modal.querySelector('#worldMerchantSearch')?.value);
    const category = modal.querySelector('#worldMerchantCategory')?.value || 'all';
    const locationId = modal.querySelector('#worldMerchantLocation')?.value || 'all';
    let visible = 0;
    modal.querySelectorAll('.world-merchant-directory-card').forEach(card => {
        const matchesQuery = !query || normalizeWorldSearch(card.dataset.search).includes(query);
        const matchesCategory = category === 'all' || card.dataset.merchantCategory === category;
        const locationPath = String(card.dataset.merchantLocationPath || card.dataset.merchantLocation || '').split('|');
        const matchesLocation = locationId === 'all' || locationPath.includes(locationId);
        card.hidden = !(matchesQuery && matchesCategory && matchesLocation);
        if (!card.hidden) visible += 1;
    });
    const empty = modal.querySelector('.world-merchant-empty-result');
    if (empty) empty.hidden = visible > 0;
    const count = modal.querySelector('.world-merchant-visible-count');
    if (count) count.textContent = `${visible} ${visible === 1 ? 'loja encontrada' : 'lojas encontradas'}`;
}

function closeWorldNpcEditor() {
    document.getElementById('worldNpcEditorModal')?.remove();
}

function openWorldNpcEditor(npcId = '') {
    closeWorldNpcEditor();
    if (window.collaborationSession?.isPlayer?.()) {
        showToast('Somente o mestre pode gerenciar NPCs.');
        return;
    }
    const world = window.worldStore?.getWorld?.();
    const editing = npcId ? window.worldModel?.getNpc?.(world, npcId) : null;
    const selectedLocationId = editing?.currentLocationId || (!editing ? world?.currentLocationId : '') || '';
    const locationOptions = (world?.locations || [])
        .filter(location => location.politicalType !== 'geopolitical-region')
        .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'))
        .map(location => {
            const path = window.worldModel?.getLocationPath?.(world, location.id) || [location];
            return `<option value="${escapeHtml(location.id)}"${selectedLocationId === location.id ? ' selected' : ''}>${escapeHtml(path.map(entry => entry.name).join(' › '))}</option>`;
        }).join('');
    const modal = document.createElement('div');
    modal.id = 'worldNpcEditorModal';
    modal.className = 'session-overlay world-npc-editor-overlay';
    modal.addEventListener('click', event => {
        if (event.target === modal) closeWorldNpcEditor();
    });
    modal.innerHTML = `
        <section class="session-dialog world-npc-editor" role="dialog" aria-modal="true" aria-labelledby="worldNpcEditorTitle">
            <div class="session-dialog-header"><div><small class="world-hub-kicker">PERSONAGEM DO MUNDO</small><h2 id="worldNpcEditorTitle">${editing ? 'Editar NPC' : 'Criar NPC'}</h2></div><button type="button" class="session-close" onclick="closeWorldNpcEditor()" aria-label="Fechar">×</button></div>
            <p>Informações públicas podem ser compartilhadas com os jogadores. As anotações privadas permanecem exclusivas do mestre.</p>
            <form id="worldNpcEditorForm" onsubmit="saveWorldNpcFromForm(event, '${escapeHtml(npcId)}')">
                <label><span>Nome *</span><input name="name" required maxlength="120" value="${escapeHtml(editing?.name || '')}" placeholder="Nome do NPC"></label>
                <div class="world-npc-editor-grid">
                    <label><span>Profissão</span><input name="profession" maxlength="120" value="${escapeHtml(editing?.profession || '')}" placeholder="Ex.: Ferreiro"></label>
                    <label><span>Facção</span><input name="faction" maxlength="160" value="${escapeHtml(editing?.faction || '')}" placeholder="Ex.: Guarda de Vizima"></label>
                    <label><span>Relacionamento</span><select name="relationship">${(window.worldModel?.NPC_RELATIONSHIPS || ['unknown', 'neutral', 'friendly', 'allied', 'hostile', 'rival']).map(value => `<option value="${value}"${(editing?.relationship || 'unknown') === value ? ' selected' : ''}>${getWorldNpcRelationshipLabel(value)}</option>`).join('')}</select></label>
                    <label><span>Visibilidade</span><select name="visibility"><option value="public"${editing?.visibility !== 'private' ? ' selected' : ''}>Visível aos jogadores</option><option value="private"${editing?.visibility === 'private' ? ' selected' : ''}>NPC secreto</option></select></label>
                </div>
                <label><span>Localização atual</span><select name="currentLocationId"><option value="">Sem localização definida</option>${locationOptions}</select></label>
                <label><span>Informações públicas</span><textarea name="publicInfo" maxlength="4000" rows="4" placeholder="Aparência, comportamento e fatos conhecidos pelos jogadores">${escapeHtml(editing?.publicInfo || '')}</textarea></label>
                <label class="world-npc-private-field"><span>Anotações privadas do mestre</span><textarea name="privateNotes" maxlength="8000" rows="5" placeholder="Segredos, motivações, estatísticas e planos">${escapeHtml(editing?.privateNotes || '')}</textarea></label>
                <label><span>${editing ? 'Motivo do deslocamento (se mudar o local)' : 'Nota da localização inicial'}</span><input name="movementNote" maxlength="1000" placeholder="Opcional"></label>
                <div class="session-dialog-actions"><button type="button" class="session-secondary" onclick="closeWorldNpcEditor()">Cancelar</button><button type="submit" class="session-primary">${editing ? 'Salvar NPC' : 'Criar NPC'}</button></div>
            </form>
        </section>`;
    document.body.appendChild(modal);
    modal.querySelector('input[name="name"]')?.focus();
}

function saveWorldNpcFromForm(event, npcId = '') {
    event?.preventDefault?.();
    const form = event?.currentTarget;
    if (!form) return;
    const data = new FormData(form);
    const input = {
        name: String(data.get('name') || '').trim(),
        profession: String(data.get('profession') || '').trim(),
        faction: String(data.get('faction') || '').trim(),
        relationship: String(data.get('relationship') || 'unknown'),
        visibility: data.get('visibility') === 'private' ? 'private' : 'public',
        currentLocationId: String(data.get('currentLocationId') || '') || null,
        publicInfo: String(data.get('publicInfo') || '').trim(),
        privateNotes: String(data.get('privateNotes') || '').trim()
    };
    const movementNote = String(data.get('movementNote') || '').trim();
    try {
        if (npcId) {
            const previous = window.worldModel?.getNpc?.(window.worldStore?.getWorld?.(), npcId);
            window.worldStore?.updateNpc?.(npcId, input);
            if ((previous?.currentLocationId || null) !== input.currentLocationId) {
                window.worldStore?.moveNpc?.(npcId, input.currentLocationId, { note: movementNote });
            }
        } else {
            window.worldStore?.createNpc?.(input, { movementNote });
        }
        closeWorldNpcEditor();
        showToast(npcId ? '🧑 NPC atualizado.' : '🧑 NPC criado para a campanha.');
        openWorldHub('npcs');
    } catch (error) {
        showToast(error?.message || 'Não foi possível salvar o NPC.');
    }
}

function requestDeleteWorldNpc(npcId) {
    const npc = window.worldModel?.getNpc?.(window.worldStore?.getWorld?.(), npcId);
    if (!npc || window.collaborationSession?.isPlayer?.()) return;
    openSessionConfirm({
        title: `Excluir ${npc.name}?`,
        message: 'O NPC e seu histórico de deslocamentos serão removidos desta campanha.',
        confirmLabel: 'Excluir NPC',
        danger: true,
        onConfirm: () => {
            try {
                window.worldStore?.removeNpc?.(npcId);
                showToast('🗑️ NPC removido da campanha.');
                openWorldHub('npcs');
            } catch (error) {
                showToast(error?.message || 'Não foi possível remover o NPC.');
            }
        }
    });
}

function getWorldHistoryTypeLabel(type) {
    return ({
        situation: 'Situação territorial',
        war: 'Guerra',
        occupation: 'Ocupação',
        destruction: 'Destruição',
        reconstruction: 'Reconstrução',
        political: 'Mudança política',
        battle: 'Batalha'
    })[type] || 'Acontecimento';
}

function getWorldHistoryTypeIcon(type) {
    return ({
        situation: '🏛️',
        war: '⚔️',
        occupation: '🚩',
        destruction: '🔥',
        reconstruction: '🏗️',
        political: '📜',
        battle: '🛡️'
    })[type] || '📖';
}

function getWorldHistoryContinuityLabel(continuity) {
    return ({
        shared: 'Livros e jogos',
        books: 'Livros',
        games: 'Jogos'
    })[continuity] || 'Continuidade compartilhada';
}

function filterWorldHistory() {
    const modal = document.getElementById('worldHubModal');
    if (!modal) return;
    const query = normalizeWorldSearch(modal.querySelector('#worldHistorySearch')?.value);
    const type = modal.querySelector('#worldHistoryType')?.value || 'all';
    let visible = 0;
    modal.querySelectorAll('.world-history-card').forEach(card => {
        const matchesQuery = !query || normalizeWorldSearch(card.dataset.search).includes(query);
        const matchesType = type === 'all' || card.dataset.historyType === type;
        card.hidden = !(matchesQuery && matchesType);
        if (!card.hidden) visible += 1;
    });
    const empty = modal.querySelector('.world-history-empty');
    if (empty) empty.hidden = visible > 0;
    const count = modal.querySelector('.world-history-visible-count');
    if (count) count.textContent = `${visible} ${visible === 1 ? 'registro visível' : 'registros visíveis'}`;
}

function setCampaignCurrentWorldLocation(locationId) {
    try {
        window.worldStore?.setCurrentLocation?.(locationId || null);
        showToast(locationId ? '📍 Local atual da campanha atualizado.' : '📍 Local atual removido.');
        openWorldHub();
    } catch (error) {
        showToast(error?.message || 'Não foi possível atualizar o local atual.');
    }
}

function exportCampaignWorld() {
    try {
        const packageData = window.worldStore?.exportWorld?.();
        if (!packageData) throw new Error('O Mundo desta campanha não está disponível.');
        const campaignName = window.campaignStore?.getActiveCampaign?.()?.metadata?.name || 'campanha';
        const safeName = String(campaignName).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'campanha';
        const blob = new Blob([JSON.stringify(packageData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `witcher-mundo-${safeName}.json`;
        link.click();
        URL.revokeObjectURL(url);
        showToast('🌍 Backup do Mundo exportado.');
    } catch (error) {
        showToast(error?.message || 'Não foi possível exportar o Mundo.');
    }
}

function requestCampaignWorldImport() {
    document.getElementById('campaignWorldImportInput')?.click();
}

async function importCampaignWorldFile(event) {
    const input = event?.target;
    const file = input?.files?.[0];
    if (!file) return;

    try {
        if (file.size > 3 * 1024 * 1024) throw new Error('O arquivo ultrapassa o limite de 3 MB.');
        const packageData = JSON.parse(await file.text());
        window.worldModel?.parseImportPackage?.(packageData);
        openSessionConfirm({
            title: 'Importar Mundo?',
            message: 'A estrutura atual de locais desta campanha será substituída. As demais informações da campanha serão preservadas.',
            confirmLabel: 'Importar',
            danger: true,
            onConfirm: () => {
                try {
                    window.worldStore?.importWorld?.(packageData);
                    showToast('🌍 Mundo importado para a campanha atual.');
                    openWorldHub();
                } catch (error) {
                    showToast(error?.message || 'Não foi possível importar o Mundo.');
                }
            }
        });
    } catch (error) {
        showToast(error?.message || 'Não foi possível ler o arquivo de Mundo.');
    } finally {
        input.value = '';
    }
}

async function openWorldHub(view = 'overview', context = {}) {
    if (view === 'map') {
        try {
            await window.worldFeatureLoader?.ensureMapFeatures?.();
        } catch (error) {
            showToast(error?.message || 'Não foi possível preparar o mapa interativo.');
            return null;
        }
    }
    closeWorldHub();

    if (window.collaborationSession?.isPlayerAccessEnded?.()) {
        showToast('A sala foi encerrada. Volte ao modo offline ou procure outra sala.');
        return;
    }

    const playerMode = window.collaborationSession?.isPlayer?.() === true;
    const world = window.worldStore?.getWorld?.() || window.worldModel?.createEmptyWorld?.();
    const locations = Array.isArray(world?.locations) ? world.locations : [];
    const politicalEntities = locations.filter(location => location.politicalType);
    const canonicalLocations = locations.filter(location => location.canonicalType);
    const cartographicLocations = locations.filter(location => location.cartographicStatus === 'map-only');
    const customLocations = locations.filter(location => location.origin === 'custom'
        && (!playerMode || location.visibility !== 'private'));
    const catalogLocations = [...canonicalLocations, ...cartographicLocations, ...customLocations];
    const npcs = (Array.isArray(world?.npcs) ? world.npcs : [])
        .filter(npc => !playerMode || npc.visibility !== 'private');
    const merchants = npcs.filter(npc => npc.merchant?.enabled);
    const travelHistory = [...(world?.travelHistory || [])].reverse();
    const locationById = new Map(locations.map(location => [location.id, location]));
    const contextLocationId = locationById.has(String(context?.locationId || ''))
        ? String(context.locationId)
        : '';
    const contextLocation = contextLocationId ? locationById.get(contextLocationId) : null;
    const currentPath = window.worldStore?.getCurrentLocationPath?.() || [];
    const currentLocation = currentPath[currentPath.length - 1] || null;
    const clockSnapshot = window.campaignClock?.getSnapshot?.();
    const regionalEvents = window.worldTime?.getRelevantRegionalEvents?.(world, contextLocationId || world.currentLocationId, Number(clockSnapshot?.currentMinute) || 0)
        || (world?.regionalEvents || []);
    const chronology = clockSnapshot && Number.isFinite(Number(clockSnapshot.currentMinute))
        ? window.campaignClock?.getDateParts?.(clockSnapshot.currentMinute)
        : { year: 1276, era: 'DR', month: 1, day: 1 };
    const historyContinuity = 'games';
    const historicalSnapshot = window.worldStore?.getHistoricalSnapshot?.(chronology, {
        continuity: historyContinuity,
        recentLimit: 8
    }) || { situations: [], activeEvents: [], recentEvents: [] };
    const counts = locations.reduce((result, location) => {
        result[location.type] = (result[location.type] || 0) + 1;
        return result;
    }, {});
    const sortedLocations = [...locations].sort((left, right) => {
        const leftPath = window.worldModel?.getLocationPath?.(world, left.id) || [left];
        const rightPath = window.worldModel?.getLocationPath?.(world, right.id) || [right];
        return leftPath.map(entry => entry.name).join(' / ').localeCompare(
            rightPath.map(entry => entry.name).join(' / '),
            'pt-BR'
        );
    });
    const sortedPoliticalEntities = [...politicalEntities].sort((left, right) =>
        left.name.localeCompare(right.name, 'pt-BR'));
    const politicalTypeOptions = [...new Set(sortedPoliticalEntities.map(location => location.politicalType))]
        .sort((left, right) => getWorldPoliticalTypeLabel(left).localeCompare(getWorldPoliticalTypeLabel(right), 'pt-BR'));
    const sortedCanonicalLocations = [...canonicalLocations].sort((left, right) =>
        left.name.localeCompare(right.name, 'pt-BR'));
    const canonicalTypeOptions = [...new Set(sortedCanonicalLocations.map(location => location.canonicalType))]
        .sort((left, right) => getWorldCanonicalTypeLabel(left).localeCompare(getWorldCanonicalTypeLabel(right), 'pt-BR'));
    const sortedCatalogLocations = [...catalogLocations].sort((left, right) =>
        left.name.localeCompare(right.name, 'pt-BR'));
    const catalogTypeOptions = [...new Set(sortedCatalogLocations.map(getWorldCatalogType))]
        .sort((left, right) => {
            const leftLocation = sortedCatalogLocations.find(location => getWorldCatalogType(location) === left);
            const rightLocation = sortedCatalogLocations.find(location => getWorldCatalogType(location) === right);
            return getWorldCatalogTypeLabel(leftLocation).localeCompare(getWorldCatalogTypeLabel(rightLocation), 'pt-BR');
        });
    const sortedNpcs = [...npcs].sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'));
    const sortedMerchants = [...merchants].sort((left, right) => left.merchant.name.localeCompare(right.merchant.name, 'pt-BR'));
    const npcLocationIds = [...new Set(sortedNpcs.map(npc => npc.currentLocationId).filter(Boolean))];
    if (contextLocationId && !npcLocationIds.includes(contextLocationId)) npcLocationIds.push(contextLocationId);
    const npcLocationOptions = npcLocationIds
        .map(id => locationById.get(id)).filter(Boolean)
        .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'));
    const merchantLocationIds = [...new Set(sortedMerchants.map(npc => npc.currentLocationId).filter(Boolean))];
    if (contextLocationId && !merchantLocationIds.includes(contextLocationId)) merchantLocationIds.push(contextLocationId);
    const merchantLocationOptions = merchantLocationIds
        .map(id => locationById.get(id)).filter(Boolean)
        .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'));
    const currentHistoricalSituation = [...currentPath].reverse()
        .map(location => window.worldStore?.getActiveHistoricalSituation?.(location.id, chronology, { continuity: historyContinuity }))
        .find(Boolean) || null;
    const getHistoricalControllerName = entry => entry?.controllerName
        || locationById.get(entry?.controllerId)?.name
        || '';
    const renderPoliticalCard = location => {
        const aliases = Array.isArray(location.aliases) ? location.aliases : [];
        const relations = Array.isArray(location.relations) ? location.relations : [];
        const sources = Array.isArray(location.sources) ? location.sources : [];
        const region = location.politicalRegionId ? locationById.get(location.politicalRegionId) : null;
        const parent = location.parentId && location.parentId !== window.worldModel?.ROOT_CONTINENT_ID
            ? locationById.get(location.parentId)
            : null;
        const grouping = region || parent;
        const search = [location.name, ...aliases, location.politicalStatus, location.description,
            region?.name, parent?.name, ...relations.map(item => item.label)].filter(Boolean).join(' ');
        return `
            <details class="world-political-card" data-political-type="${escapeHtml(location.politicalType)}" data-search="${escapeHtml(search)}">
                <summary>
                    <span>
                        <strong>${escapeHtml(location.name)}</strong>
                        <small>${escapeHtml(getWorldPoliticalTypeLabel(location.politicalType))}${grouping ? ` · ${escapeHtml(grouping.name)}` : ''}</small>
                    </span>
                    <span class="world-political-status">${escapeHtml(location.politicalStatus || 'Entidade política')}</span>
                </summary>
                <div class="world-political-card-body">
                    ${aliases.length ? `<p class="world-political-aliases"><b>Nomes alternativos:</b> ${escapeHtml(aliases.join(' · '))}</p>` : ''}
                    <p>${escapeHtml(location.description || 'Descrição em preparação.')}</p>
                    ${parent ? `<p class="world-political-parent"><b>Vínculo territorial:</b> ${escapeHtml(parent.name)}</p>` : ''}
                    ${relations.length ? `
                        <div class="world-political-relations">
                            <b>Relações políticas</b>
                            <ul>${relations.map(item => {
                                const target = locationById.get(item.targetId);
                                return `<li><strong>${escapeHtml(item.label || 'Relação')}</strong>${target ? ` · ${escapeHtml(target.name)}` : ''}${item.note ? `<small>${escapeHtml(item.note)}</small>` : ''}</li>`;
                            }).join('')}</ul>
                        </div>
                    ` : ''}
                    ${sources.length ? `
                        <div class="world-political-sources">
                            <b>Fontes</b>
                            ${sources.map(item => `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">↗ ${escapeHtml(item.title)}</a>`).join('')}
                        </div>
                    ` : ''}
                </div>
            </details>`;
    };
    const renderCanonicalCard = location => {
        const aliases = Array.isArray(location.aliases) ? location.aliases : [];
        const sources = Array.isArray(location.sources) ? location.sources : [];
        const path = window.worldModel?.getLocationPath?.(world, location.id) || [location];
        const territoryPath = path.slice(1, -1).map(entry => entry.name).join(' › ');
        const search = [location.name, ...aliases, location.description, location.canonicalStatus,
            ...path.map(entry => entry.name)].filter(Boolean).join(' ');
        return `
            <details class="world-political-card world-canonical-card world-location-card" data-location-layer="canonical" data-location-type="${escapeHtml(location.canonicalType)}" data-location-confidence="" data-search="${escapeHtml(search)}">
                <summary>
                    <span>
                        <strong>${escapeHtml(location.name)}</strong>
                        <small>${escapeHtml(getWorldCanonicalTypeLabel(location.canonicalType))}${territoryPath ? ` · ${escapeHtml(territoryPath)}` : ''}</small>
                    </span>
                    ${location.isCapital ? '<span class="world-capital-chip">Capital</span>' : ''}
                </summary>
                <div class="world-political-card-body">
                    ${aliases.length ? `<p class="world-political-aliases"><b>Nomes alternativos:</b> ${escapeHtml(aliases.join(' · '))}</p>` : ''}
                    <p>${escapeHtml(location.description || 'Descrição em preparação.')}</p>
                    <p class="world-location-path"><b>Localização:</b> ${escapeHtml(path.map(entry => entry.name).join(' › '))}</p>
                    ${sources.length ? `
                        <div class="world-political-sources">
                            <b>Fontes</b>
                            ${sources.map(item => `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">↗ ${escapeHtml(item.title)}</a>`).join('')}
                        </div>
                    ` : ''}
                </div>
            </details>`;
    };
    const renderCartographicCard = location => {
        const path = window.worldModel?.getLocationPath?.(world, location.id) || [location];
        const territoryPath = path.slice(1, -1).map(entry => entry.name).join(' › ');
        const map = window.worldCartographicData?.MAP_REFERENCE || {};
        const coordinates = location.coordinates || {};
        const search = [location.name, ...(location.aliases || []), location.description,
            ...path.map(entry => entry.name), getWorldReliabilityLabel(location.cartographicConfidence)].filter(Boolean).join(' ');
        return `
            <details class="world-political-card world-location-card world-cartographic-card" data-location-layer="cartographic" data-location-type="${escapeHtml(location.cartographicType)}" data-location-confidence="${escapeHtml(location.cartographicConfidence || '')}" data-search="${escapeHtml(search)}">
                <summary>
                    <span><strong>🗺️ ${escapeHtml(location.name)}</strong><small>${escapeHtml(getWorldCartographicTypeLabel(location.cartographicType))}${territoryPath ? ` · ${escapeHtml(territoryPath)}` : ''}</small></span>
                    <span class="world-location-layer-chip cartographic">Somente no mapa</span>
                </summary>
                <div class="world-political-card-body">
                    <p>${escapeHtml(location.description)}</p>
                    <p class="world-location-path"><b>Localização:</b> ${escapeHtml(path.map(entry => entry.name).join(' › '))}</p>
                    <div class="world-cartographic-facts">
                        <span><small>CONFIABILIDADE</small><b>${escapeHtml(getWorldReliabilityLabel(location.cartographicConfidence))}</b></span>
                        <span><small>COORDENADAS</small><b>X ${Number(coordinates.x).toFixed(1)}% · Y ${Number(coordinates.y).toFixed(1)}%</b></span>
                    </div>
                    <p class="world-cartographic-note">Posição ${location.coordinateConfidence === 'approximate' ? 'aproximada' : 'estimada'} no mapa <b>${escapeHtml(map.title || 'The Continent')}</b>${map.author ? `, de ${escapeHtml(map.author)}` : ''}. O registro preserva a leitura cartográfica sem apresentar detalhes não confirmados como canônicos.</p>
                </div>
            </details>`;
    };
    const renderCustomLocationCard = location => {
        const path = window.worldModel?.getLocationPath?.(world, location.id) || [location];
        const territoryPath = path.slice(1, -1).map(entry => entry.name).join(' › ');
        const search = [location.name, location.description, ...path.map(entry => entry.name), getWorldCustomTypeLabel(location.customType)].filter(Boolean).join(' ');
        return `
            <details class="world-political-card world-location-card world-custom-location-card" data-location-layer="custom" data-location-type="${escapeHtml(location.customType || 'location')}" data-location-confidence="" data-search="${escapeHtml(search)}">
                <summary>
                    <span><strong>✍️ ${escapeHtml(location.name)}</strong><small>${escapeHtml(getWorldCustomTypeLabel(location.customType))}${territoryPath ? ` · ${escapeHtml(territoryPath)}` : ''}</small></span>
                    <span class="world-location-layer-chip custom">${location.visibility === 'private' ? 'Somente mestre' : 'Campanha'}</span>
                </summary>
                <div class="world-political-card-body">
                    <p>${escapeHtml(location.description || 'Local personalizado da campanha.')}</p>
                    <p class="world-location-path"><b>Localização:</b> ${escapeHtml(path.map(entry => entry.name).join(' › '))}</p>
                    ${location.coordinates ? `<p><b>Coordenadas:</b> X ${Number(location.coordinates.x).toFixed(1)}% · Y ${Number(location.coordinates.y).toFixed(1)}%</p>` : '<p>Sem coordenadas definidas no mapa.</p>'}
                    ${playerMode ? '' : `<div class="world-location-card-actions"><button type="button" class="session-secondary" onclick="openWorldLocationEditor('${escapeHtml(location.id)}')">Editar</button><button type="button" class="session-danger" onclick="requestDeleteWorldLocation('${escapeHtml(location.id)}')">Excluir</button></div>`}
                </div>
            </details>`;
    };
    const renderNpcCard = npc => {
        const location = npc.currentLocationId ? locationById.get(npc.currentLocationId) : null;
        const path = location ? (window.worldModel?.getLocationPath?.(world, location.id) || [location]) : [];
        const movements = [...(npc.movements || [])].reverse();
        const activeRoutine = window.worldTime?.getNpcActiveSchedule?.(npc, Number(clockSnapshot?.currentMinute) || 0);
        const routineLocation = activeRoutine?.locationId ? locationById.get(activeRoutine.locationId) : null;
        const search = [npc.name, npc.profession, npc.faction, npc.publicInfo,
            getWorldNpcRelationshipLabel(npc.relationship), ...path.map(entry => entry.name)].filter(Boolean).join(' ');
        return `
            <details class="world-political-card world-npc-card" data-npc-relationship="${escapeHtml(npc.relationship)}" data-npc-location="${escapeHtml(npc.currentLocationId || '')}" data-npc-location-path="${escapeHtml(path.map(entry => entry.id).join('|'))}" data-search="${escapeHtml(search)}">
                <summary>
                    <span><strong>🧑 ${escapeHtml(npc.name)}</strong><small>${escapeHtml(npc.profession || 'Profissão não informada')}${npc.faction ? ` · ${escapeHtml(npc.faction)}` : ''}</small></span>
                    <span class="world-npc-relationship is-${escapeHtml(npc.relationship)}">${escapeHtml(getWorldNpcRelationshipLabel(npc.relationship))}</span>
                </summary>
                <div class="world-political-card-body world-npc-card-body">
                    <p class="world-location-path"><b>Local atual:</b> ${path.length ? escapeHtml(path.map(entry => entry.name).join(' › ')) : 'Sem localização definida'}</p>
                    <p>${escapeHtml(npc.publicInfo || 'Nenhuma informação pública registrada.')}</p>
                    <div class="world-npc-routine ${activeRoutine ? 'is-active' : ''}"><small>ROTINA AGORA</small><strong>${escapeHtml(activeRoutine?.label || 'Sem atividade programada')}</strong>${activeRoutine ? `<span>${escapeHtml(`${activeRoutine.startsAt}–${activeRoutine.endsAt}${routineLocation ? ` · ${routineLocation.name}` : ''}`)}</span>${activeRoutine.publicInfo ? `<p>${escapeHtml(activeRoutine.publicInfo)}</p>` : ''}` : ''}</div>
                    ${!playerMode && npc.privateNotes ? `<div class="world-npc-private-notes"><small>ANOTAÇÕES PRIVADAS DO MESTRE</small><p>${escapeHtml(npc.privateNotes)}</p></div>` : ''}
                    <details class="world-npc-movements">
                        <summary>Histórico de deslocamentos <b>${movements.length}</b></summary>
                        ${movements.length ? `<ol>${movements.map(movement => `<li><strong>${escapeHtml(movement.fromLocationName)} → ${escapeHtml(movement.toLocationName)}</strong><small>${escapeHtml(formatWorldNpcMovementDate(movement))}</small>${movement.note ? `<span>${escapeHtml(movement.note)}</span>` : ''}</li>`).join('')}</ol>` : '<p>Nenhum deslocamento registrado.</p>'}
                    </details>
                    ${window.worldCommerce?.renderNpcCommerce?.(npc, { playerMode }) || ''}
                    ${playerMode ? '' : `<div class="world-location-card-actions"><button type="button" class="session-secondary" onclick="openWorldNpcScheduleEditor('${escapeHtml(npc.id)}')">Horários</button><button type="button" class="session-secondary" onclick="openWorldNpcEditor('${escapeHtml(npc.id)}')">Editar e mover</button><button type="button" class="session-danger" onclick="requestDeleteWorldNpc('${escapeHtml(npc.id)}')">Excluir</button></div>`}
                </div>
            </details>`;
    };
    const renderMerchantDirectoryCard = npc => {
        const merchant = npc.merchant;
        const location = npc.currentLocationId ? locationById.get(npc.currentLocationId) : null;
        const path = location ? (window.worldModel?.getLocationPath?.(world, location.id) || [location]) : [];
        const products = merchant.catalog.filter(entry => entry.enabled);
        const services = merchant.services.filter(entry => entry.enabled);
        const shopOpen = window.worldTime?.isMerchantOpen?.(merchant, Number(clockSnapshot?.currentMinute) || 0) !== false;
        const search = [merchant.name, npc.name, npc.profession, npc.faction, merchant.description,
            window.worldCommerce?.getMerchantCategoryLabel?.(merchant.category), ...path.map(entry => entry.name)].filter(Boolean).join(' ');
        return `<article class="world-merchant-directory-card" data-search="${escapeHtml(search)}" data-merchant-category="${escapeHtml(merchant.category)}" data-merchant-location="${escapeHtml(npc.currentLocationId || '')}" data-merchant-location-path="${escapeHtml(path.map(entry => entry.id).join('|'))}">
            <div class="world-merchant-directory-heading"><div><small>${escapeHtml(window.worldCommerce?.getMerchantCategoryLabel?.(merchant.category) || 'Comerciante')}</small><strong>🏪 ${escapeHtml(merchant.name)}</strong><span>${escapeHtml(npc.name)}${path.length ? ` · ${escapeHtml(path.map(entry => entry.name).join(' › '))}` : ''}</span></div><button type="button" class="session-primary" onclick="openWorldMerchantShop('${escapeHtml(npc.id)}')">Ver loja</button></div>
            <p>${escapeHtml(merchant.description || 'Nenhuma descrição pública cadastrada.')}</p>
            <div class="world-merchant-directory-facts"><span class="${shopOpen ? 'is-open' : 'is-closed'}">${shopOpen ? '🟢 Aberta' : '🔴 Fechada'}${merchant.openingSchedule?.enabled ? ` · ${escapeHtml(merchant.openingSchedule.opensAt)}–${escapeHtml(merchant.openingSchedule.closesAt)}` : ''}</span><span>📦 ${products.length} produtos</span><span>🛠️ ${services.length} serviços</span><span>🔄 ${escapeHtml(window.worldCommerce?.getRestockLabel?.(merchant) || 'Manual')}</span><span>🤝 ${merchant.negotiationDifficulty > 0 && merchant.discountPercent > 0 ? `Negócios ND ${merchant.negotiationDifficulty} · ${merchant.discountPercent}%` : 'Sem desconto configurado'}</span></div>
        </article>`;
    };
    const activeHistoricalEventIds = new Set((historicalSnapshot.activeEvents || []).map(entry => entry.id));
    const displayedHistoricalEvents = [
        ...(historicalSnapshot.activeEvents || []),
        ...(historicalSnapshot.recentEvents || []).filter(entry => !activeHistoricalEventIds.has(entry.id))
    ];
    const renderHistoricalSituationCard = entry => {
        const target = locationById.get(entry.targetId);
        const controller = getHistoricalControllerName(entry);
        const search = [target?.name, entry.ruler, controller, entry.sovereignty, entry.politicalStatus,
            entry.physicalStatus, entry.summary].filter(Boolean).join(' ');
        return `
            <details class="world-political-card world-history-card" data-history-type="situation" data-search="${escapeHtml(search)}">
                <summary>
                    <span>
                        <strong>🏛️ ${escapeHtml(target?.name || entry.targetId)}</strong>
                        <small>${escapeHtml(entry.politicalStatus || entry.sovereignty || 'Situação territorial')}</small>
                    </span>
                    <span class="world-history-state-chip">${escapeHtml(entry.physicalStatus || 'Preservado')}</span>
                </summary>
                <div class="world-political-card-body world-history-card-body">
                    <div class="world-history-facts">
                        ${entry.ruler ? `<span><small>GOVERNO</small><b>${escapeHtml(entry.ruler)}</b></span>` : ''}
                        ${controller ? `<span><small>CONTROLE</small><b>${escapeHtml(controller)}</b></span>` : ''}
                        ${entry.sovereignty ? `<span><small>SOBERANIA</small><b>${escapeHtml(entry.sovereignty)}</b></span>` : ''}
                        <span><small>VIGÊNCIA</small><b>${escapeHtml(window.worldHistoryData?.formatPeriod?.(entry) || '')}</b></span>
                    </div>
                    <p>${escapeHtml(entry.summary || 'Situação histórica catalogada para este período.')}</p>
                    ${entry.chronologyNote ? `<p class="world-history-note">⚠ ${escapeHtml(entry.chronologyNote)}</p>` : ''}
                    <span class="world-history-continuity">${escapeHtml(getWorldHistoryContinuityLabel(entry.continuity))}</span>
                    ${entry.sources?.length ? `
                        <div class="world-political-sources">
                            <b>Fontes</b>
                            ${entry.sources.map(item => `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">↗ ${escapeHtml(item.title)}</a>`).join('')}
                        </div>
                    ` : ''}
                </div>
            </details>`;
    };
    const renderHistoricalEventCard = entry => {
        const targets = (entry.affectedIds || []).map(id => locationById.get(id)?.name).filter(Boolean);
        const active = activeHistoricalEventIds.has(entry.id);
        const search = [entry.title, entry.description, entry.outcome, ...targets].filter(Boolean).join(' ');
        return `
            <details class="world-political-card world-history-card world-history-event-card" data-history-type="${escapeHtml(entry.type)}" data-search="${escapeHtml(search)}">
                <summary>
                    <span>
                        <strong>${getWorldHistoryTypeIcon(entry.type)} ${escapeHtml(entry.title)}</strong>
                        <small>${escapeHtml(window.worldHistoryData?.formatPeriod?.(entry) || '')} · ${escapeHtml(getWorldHistoryTypeLabel(entry.type))}</small>
                    </span>
                    <span class="world-history-event-chip ${active ? 'is-active' : ''}">${active ? 'EM CURSO' : 'ANTERIOR'}</span>
                </summary>
                <div class="world-political-card-body world-history-card-body">
                    <p>${escapeHtml(entry.description)}</p>
                    ${entry.outcome ? `<p class="world-history-outcome"><b>Consequência:</b> ${escapeHtml(entry.outcome)}</p>` : ''}
                    ${targets.length ? `<p class="world-location-path"><b>Locais envolvidos:</b> ${escapeHtml(targets.join(' · '))}</p>` : ''}
                    ${entry.chronologyNote ? `<p class="world-history-note">⚠ ${escapeHtml(entry.chronologyNote)}</p>` : ''}
                    <span class="world-history-continuity">${escapeHtml(getWorldHistoryContinuityLabel(entry.continuity))}</span>
                    ${entry.sources?.length ? `
                        <div class="world-political-sources">
                            <b>Fontes</b>
                            ${entry.sources.map(item => `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">↗ ${escapeHtml(item.title)}</a>`).join('')}
                        </div>
                    ` : ''}
                </div>
            </details>`;
    };
    const renderRegionalEventCard = event => {
        const location = event.locationId ? locationById.get(event.locationId) : null;
        const recurrence = window.worldTime?.RECURRENCE_LABELS?.[event.recurrence] || 'Uma vez';
        return `<article class="world-regional-event-card"><div><small>${escapeHtml(recurrence.toUpperCase())}${event.visibility === 'private' ? ' · SOMENTE MESTRE' : ''}</small><strong>📍 ${escapeHtml(event.title)}</strong><span>${escapeHtml(window.worldTime?.formatCampaignMinute?.(event.startMinute) || '')}${location ? ` · ${escapeHtml(location.name)}` : ' · Todo o Continente'}</span>${event.description ? `<p>${escapeHtml(event.description)}</p>` : ''}${!playerMode && event.privateNotes ? `<div class="world-npc-private-notes"><small>ANOTAÇÃO PRIVADA</small><p>${escapeHtml(event.privateNotes)}</p></div>` : ''}</div>${playerMode ? '' : `<div class="world-location-card-actions"><button type="button" class="session-secondary" onclick="openWorldRegionalEventEditor('${escapeHtml(event.id)}')">Editar</button><button type="button" class="session-danger" onclick="removeWorldRegionalEvent('${escapeHtml(event.id)}')">Excluir</button></div>`}</article>`;
    };
    const renderTravelCard = travel => {
        const travelers = (Array.isArray(travel.travelers) ? travel.travelers : [])
            .filter(entry => entry?.name)
            .map(entry => `${entry.name} — ${entry.transportLabel || 'A pé'}`);
        const duration = travel.transportMode === 'portal'
            ? '1 turno (1 min)'
            : (window.campaignClock?.formatDuration?.(travel.durationMinutes) || `${travel.durationMinutes} min`);
        const icon = travel.transportMode === 'portal' ? '🌀' : travel.transportMode === 'group' ? '👥' : '🧭';
        return `<article class="world-travel-card"><span aria-hidden="true">${icon}</span><div><strong>${escapeHtml(travel.fromLocationName)} → ${escapeHtml(travel.toLocationName)}</strong><small>${escapeHtml(travel.transportLabel || 'A pé')}${Number(travel.distanceKm) > 0 ? ` · ${Number(travel.distanceKm).toLocaleString('pt-BR')} km` : ''} · ${escapeHtml(duration)} · ${escapeHtml(window.worldTime?.formatCampaignMinute?.(travel.arrivalMinute) || '')}</small>${travelers.length ? `<span class="world-travel-party-history">Participantes: ${escapeHtml(travelers.join('; '))}</span>` : ''}${travel.note ? `<p>${escapeHtml(travel.note)}</p>` : ''}</div></article>`;
    };
    const modal = document.createElement('div');
    modal.id = 'worldHubModal';
    modal.className = `session-overlay${view === 'map' ? ' world-map-overlay' : ''}`;
    modal.addEventListener('click', event => {
        if (event.target === modal) closeWorldHub();
    });
    modal.innerHTML = `
        <section class="session-dialog world-hub-dialog${view === 'map' ? ' world-map-mode' : ''}" role="dialog" aria-modal="true" aria-labelledby="worldHubTitle">
            <div class="session-dialog-header">
                <div>
                    <small class="world-hub-kicker">MUNDO DA CAMPANHA</small>
                    <h2 id="worldHubTitle">${view === 'map' ? 'Mapa do Continente' : 'Atlas, NPCs e comércio'}</h2>
                </div>
                <button type="button" class="session-close" onclick="closeWorldHub()" aria-label="Fechar">×</button>
            </div>
            ${view === 'map' ? '' : '<p class="world-hub-intro">O Mundo combina territórios, locais, NPCs, lojas e a situação histórica resolvida pela data atual da campanha.</p>'}
            <nav class="world-hub-tabs" aria-label="Seções do Mundo">
                <button type="button" class="${view === 'map' ? 'active' : ''}" onclick="openWorldHub('map')">Mapa</button>
                <button type="button" class="${view === 'overview' ? 'active' : ''}" onclick="openWorldHub('overview')">Visão geral</button>
                <button type="button" class="${view === 'atlas' ? 'active' : ''}" onclick="openWorldHub('atlas')">Atlas político</button>
                <button type="button" class="${view === 'locations' ? 'active' : ''}" onclick="openWorldHub('locations')">Locais</button>
                <button type="button" class="${view === 'npcs' ? 'active' : ''}" onclick="openWorldHub('npcs')">NPCs</button>
                <button type="button" class="${view === 'merchants' ? 'active' : ''}" onclick="openWorldHub('merchants')">Lojas</button>
                <button type="button" class="${view === 'events' ? 'active' : ''}" onclick="openWorldHub('events')">Agenda</button>
                <button type="button" class="${view === 'history' ? 'active' : ''}" onclick="openWorldHub('history')">História</button>
            </nav>
            ${view === 'map' ? (window.worldMap?.renderView?.(world, { playerMode }) || '<p class="world-atlas-empty">O mapa visual não pôde ser carregado.</p>') : ''}
            ${view === 'overview' ? `
            <section class="world-current-location" aria-label="Local atual da campanha">
                <small>LOCAL ATUAL</small>
                <strong>${escapeHtml(currentLocation?.name || 'Não definido')}</strong>
                <span>${currentPath.length ? escapeHtml(currentPath.map(location => location.name).join(' › ')) : 'Escolha onde o grupo se encontra.'}</span>
                ${playerMode ? '' : `
                    <label>
                        <span class="sr-only">Alterar local atual</span>
                        <select onchange="setCampaignCurrentWorldLocation(this.value)">
                            <option value="">Não definido</option>
                            ${sortedLocations.filter(location => location.politicalType !== 'geopolitical-region').map(location => {
                                const path = window.worldModel?.getLocationPath?.(world, location.id) || [location];
                                const depth = Math.max(0, path.length - 1);
                                const prefix = depth ? '— '.repeat(depth) : '';
                                return `<option value="${escapeHtml(location.id)}"${world.currentLocationId === location.id ? ' selected' : ''}>${escapeHtml(`${prefix}${location.name} · ${getWorldLocationTypeLabel(location.type)}`)}</option>`;
                            }).join('')}
                        </select>
                    </label>
                    <button type="button" class="session-primary world-travel-button" onclick="openWorldTravelPlanner()">🧭 Planejar viagem</button>
                `}
            </section>
            ${currentHistoricalSituation ? `
                <section class="world-current-history" aria-label="Situação histórica do local atual">
                    <small>SITUAÇÃO EM ${escapeHtml(`${chronology.year} ${chronology.era}`)}</small>
                    <strong>${escapeHtml(currentHistoricalSituation.politicalStatus || currentHistoricalSituation.sovereignty)}</strong>
                    <span>${escapeHtml(currentHistoricalSituation.summary)}</span>
                    ${getHistoricalControllerName(currentHistoricalSituation) ? `<b>Controle: ${escapeHtml(getHistoricalControllerName(currentHistoricalSituation))}</b>` : ''}
                </section>
            ` : ''}
            <div class="world-hub-preview" aria-label="Fundação do Mundo">
                <span class="world-hub-preview-icon" aria-hidden="true">🌍</span>
                <div>
                    <strong>Mundo canônico integrado</strong>
                    <small>${playerMode
                        ? 'Você pode consultar o local atual e as informações públicas compartilhadas pelo mestre.'
                        : 'Política, cidades e pontos especiais convivem com locais personalizados, usando IDs estáveis e fontes consultáveis.'}</small>
                </div>
            </div>
            <div class="world-hub-sections" aria-label="Resumo do catálogo">
                <span>🏰 ${politicalEntities.length} entidades políticas</span>
                <span>🧭 ${counts.province || 0} províncias</span>
                <span>📍 ${canonicalLocations.length} locais canônicos</span>
                <span>🗺️ ${cartographicLocations.length} pontos cartográficos</span>
                <span>✍️ ${customLocations.length} locais da campanha</span>
                <span>🧑 ${npcs.length} NPCs registrados</span>
                <span>🏪 ${merchants.length} lojas ativas</span>
                <span>🧭 ${travelHistory.length} viagens registradas</span>
                <span>📅 ${regionalEvents.length} eventos regionais relevantes</span>
                <span>📜 ${historicalSnapshot.situations?.length || 0} situações em ${escapeHtml(`${chronology.year} ${chronology.era}`)}</span>
                <span>🔐 Campanha isolada</span>
            </div>
            ${regionalEvents.length ? `<section class="world-overview-events"><div class="world-location-heading"><div><small>ACONTECENDO NA REGIÃO</small><strong>${regionalEvents.length} eventos relevantes</strong></div><button type="button" class="session-secondary" onclick="openWorldHub('events')">Ver agenda</button></div>${regionalEvents.slice(0, 3).map(renderRegionalEventCard).join('')}</section>` : ''}
            ${travelHistory.length ? `<section class="world-overview-travels"><div class="world-location-heading"><div><small>VIAGENS RECENTES</small><strong>Deslocamentos da campanha</strong></div></div>${travelHistory.slice(0, 3).map(renderTravelCard).join('')}</section>` : ''}
            ${playerMode ? '' : `
                <div class="world-hub-transfer-actions">
                    <button type="button" class="session-secondary" onclick="exportCampaignWorld()">⇩ Exportar Mundo</button>
                    <button type="button" class="session-secondary" onclick="requestCampaignWorldImport()">⇧ Importar Mundo</button>
                    <input id="campaignWorldImportInput" type="file" accept="application/json,.json" hidden onchange="importCampaignWorldFile(event)">
                </div>
            `}
            ` : view === 'atlas' ? `
            <section class="world-atlas-panel" aria-label="Atlas político do Continente">
                <div class="world-atlas-toolbar">
                    <label>
                        <span>Buscar no Atlas</span>
                        <input id="worldAtlasSearch" type="search" placeholder="Reino, território ou nome alternativo" oninput="filterWorldPoliticalAtlas()">
                    </label>
                    <label>
                        <span>Categoria política</span>
                        <select id="worldAtlasType" onchange="filterWorldPoliticalAtlas()">
                            <option value="all">Todas as categorias</option>
                            ${politicalTypeOptions.map(type => `<option value="${escapeHtml(type)}">${escapeHtml(getWorldPoliticalTypeLabel(type))}</option>`).join('')}
                        </select>
                    </label>
                </div>
                <p class="world-atlas-visible-count">${politicalEntities.length} entidades encontradas</p>
                <div class="world-political-list">${sortedPoliticalEntities.map(renderPoliticalCard).join('')}</div>
                <p class="world-atlas-empty" hidden>Nenhuma entidade corresponde aos filtros selecionados.</p>
                <p class="world-atlas-disclaimer">Abra <b>História</b> para ver governo, controle e soberania calculados conforme ${escapeHtml(`${chronology.year} ${chronology.era}`)}.</p>
            </section>
            ` : view === 'locations' ? `
            <section class="world-atlas-panel" aria-label="Catálogo de locais do Mundo">
                <div class="world-location-heading">
                    <div><small>CATÁLOGO DE LOCAIS</small><strong>Canônicos, cartográficos e da campanha</strong></div>
                    ${playerMode ? '' : '<button type="button" class="session-primary" onclick="openWorldLocationEditor()">+ Criar local</button>'}
                </div>
                <div class="world-atlas-toolbar world-location-toolbar">
                    <label>
                        <span>Buscar local</span>
                        <input id="worldLocationSearch" type="search" placeholder="Nome, território ou descrição" oninput="filterWorldCanonicalCatalog()">
                    </label>
                    <label>
                        <span>Tipo de local</span>
                        <select id="worldLocationType" onchange="filterWorldCanonicalCatalog()">
                            <option value="all">Todos os tipos</option>
                            ${catalogTypeOptions.map(type => {
                                const sample = sortedCatalogLocations.find(location => getWorldCatalogType(location) === type);
                                return `<option value="${escapeHtml(type)}">${escapeHtml(getWorldCatalogTypeLabel(sample))}</option>`;
                            }).join('')}
                        </select>
                    </label>
                    <label><span>Camada</span><select id="worldLocationLayer" onchange="filterWorldCanonicalCatalog()"><option value="all">Todas as camadas</option><option value="canonical">Canônicos</option><option value="cartographic">Somente no mapa</option><option value="custom">Locais da campanha</option></select></label>
                    <label><span>Confiabilidade</span><select id="worldLocationConfidence" onchange="filterWorldCanonicalCatalog()"><option value="all">Todos os níveis</option><option value="high">Alta</option><option value="medium">Média</option><option value="low">Baixa</option></select></label>
                </div>
                <p class="world-atlas-visible-count world-location-visible-count">${catalogLocations.length} locais encontrados</p>
                <div class="world-political-list">${sortedCatalogLocations.map(location => {
                    if (location.origin === 'custom') return renderCustomLocationCard(location);
                    if (location.cartographicStatus === 'map-only') return renderCartographicCard(location);
                    return renderCanonicalCard(location);
                }).join('')}</div>
                <p class="world-atlas-empty world-location-empty" hidden>Nenhum local corresponde aos filtros selecionados.</p>
                <p class="world-atlas-disclaimer">Os pontos “Somente no mapa” preservam o que é visível na cartografia fornecida. A confiabilidade informa o grau de certeza da transcrição e do vínculo territorial; locais do mestre permanecem separados do catálogo oficial.</p>
            </section>
            ` : view === 'npcs' ? `
            <section class="world-atlas-panel world-npc-panel" aria-label="Gerenciamento de NPCs">
                <div class="world-location-heading">
                    <div><small>PERSONAGENS DO MUNDO</small><strong>NPCs, relações e deslocamentos</strong></div>
                    ${playerMode ? '' : '<button type="button" class="session-primary" onclick="openWorldNpcEditor()">+ Criar NPC</button>'}
                </div>
                <div class="world-atlas-toolbar world-npc-toolbar">
                    <label><span>Buscar NPC</span><input id="worldNpcSearch" type="search" placeholder="Nome, profissão ou facção" oninput="filterWorldNpcs()"></label>
                    <label><span>Relacionamento</span><select id="worldNpcRelationship" onchange="filterWorldNpcs()"><option value="all">Todos</option>${(window.worldModel?.NPC_RELATIONSHIPS || []).map(value => `<option value="${value}">${escapeHtml(getWorldNpcRelationshipLabel(value))}</option>`).join('')}</select></label>
                    <label><span>Localização atual</span><select id="worldNpcLocation" onchange="filterWorldNpcs()"><option value="all">Todos os locais</option>${npcLocationOptions.map(location => `<option value="${escapeHtml(location.id)}">${escapeHtml(location.name)}</option>`).join('')}</select></label>
                </div>
                <p class="world-atlas-visible-count world-npc-visible-count">${npcs.length} ${npcs.length === 1 ? 'NPC encontrado' : 'NPCs encontrados'}</p>
                <div class="world-political-list">${sortedNpcs.map(renderNpcCard).join('')}</div>
                <p class="world-atlas-empty world-npc-empty"${npcs.length ? ' hidden' : ''}>Nenhum NPC corresponde aos filtros selecionados.</p>
                <p class="world-atlas-disclaimer">Cada mudança de localização registra origem, destino, data e horário da campanha. Jogadores recebem somente informações públicas; NPCs secretos, notas privadas e trajetos ligados a locais ocultos não são compartilhados.</p>
            </section>
            ` : view === 'merchants' ? `
            <section class="world-atlas-panel world-merchant-panel" aria-label="Comerciantes e lojas">
                <div class="world-location-heading"><div><small>COMÉRCIO DA CAMPANHA</small><strong>Catálogos, estoques e serviços</strong></div></div>
                <div class="world-atlas-toolbar world-merchant-toolbar">
                    <label><span>Buscar loja</span><input id="worldMerchantSearch" type="search" placeholder="Loja, NPC, profissão ou local" oninput="filterWorldMerchants()"></label>
                    <label><span>Categoria</span><select id="worldMerchantCategory" onchange="filterWorldMerchants()"><option value="all">Todas</option>${Object.entries(window.worldCommerce?.CATEGORY_LABELS || {}).map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join('')}</select></label>
                    <label><span>Localização</span><select id="worldMerchantLocation" onchange="filterWorldMerchants()"><option value="all">Todos os locais</option>${merchantLocationOptions.map(location => `<option value="${escapeHtml(location.id)}">${escapeHtml(location.name)}</option>`).join('')}</select></label>
                </div>
                <p class="world-atlas-visible-count world-merchant-visible-count">${merchants.length} ${merchants.length === 1 ? 'loja encontrada' : 'lojas encontradas'}</p>
                <div class="world-merchant-directory">${sortedMerchants.map(renderMerchantDirectoryCard).join('')}</div>
                <p class="world-atlas-empty world-merchant-empty-result"${merchants.length ? ' hidden' : ''}>Nenhuma loja corresponde aos filtros selecionados. Crie uma loja pelo card de um NPC.</p>
                <p class="world-atlas-disclaimer">Os preços e estoques pertencem a cada comerciante. O desconto obtido em Negócios dura somente durante a visita aberta e não altera o preço cadastrado.</p>
            </section>
            ` : view === 'events' ? `
            <section class="world-atlas-panel world-regional-events-panel" aria-label="Calendário, viagens e eventos regionais">
                <div class="world-location-heading"><div><small>AGENDA DO MUNDO</small><strong>Viagens, eventos e rotinas temporais</strong></div>${playerMode ? '' : '<button type="button" class="session-primary" onclick="openWorldRegionalEventEditor()">+ Criar evento</button>'}</div>
                ${contextLocation ? `<div class="world-map-context-banner"><span>📍</span><div><small>FILTRO ABERTO PELO MAPA</small><strong>${escapeHtml(contextLocation.name)}</strong><p>Eventos deste local, de seus territórios superiores e de seus locais descendentes.</p></div><button type="button" onclick="openWorldHub('events')">Limpar</button></div>` : ''}
                <div class="world-time-current"><span>🕰️</span><div><small>AGORA</small><strong>${escapeHtml(window.worldTime?.formatCampaignMinute?.(Number(clockSnapshot?.currentMinute) || 0) || '')}</strong><p>Eventos vinculados a um reino ou região também são apresentados nos seus locais descendentes.</p></div></div>
                <div class="world-history-section-heading"><span>EVENTOS REGIONAIS</span><b>${regionalEvents.length}</b></div>
                <div class="world-regional-event-list">${regionalEvents.length ? regionalEvents.map(renderRegionalEventCard).join('') : `<p class="world-atlas-empty">Nenhum evento relevante para ${escapeHtml(contextLocation?.name || 'o local atual')}.</p>`}</div>
                <div class="world-history-section-heading"><span>VIAGENS DA CAMPANHA</span><b>${travelHistory.length}</b></div>
                ${playerMode ? '' : '<button type="button" class="session-secondary session-full" onclick="openWorldTravelPlanner()">🧭 Planejar novo deslocamento</button>'}
                <div class="world-travel-list">${travelHistory.length ? travelHistory.map(renderTravelCard).join('') : '<p class="world-atlas-empty">Nenhuma viagem registrada.</p>'}</div>
                <p class="world-atlas-disclaimer">O relógio processa eventos, mudanças de rotina, abertura e reposição das lojas uma única vez em cada avanço.</p>
            </section>
            ` : view === 'history' ? `
            <section class="world-atlas-panel world-history-panel" aria-label="Camada histórica do Continente">
                <div class="world-history-date-banner">
                    <span aria-hidden="true">⌛</span>
                    <div>
                        <small>DATA DA CAMPANHA</small>
                        <strong>${escapeHtml(`${String(chronology.day).padStart(2, '0')}/${String(chronology.month).padStart(2, '0')}/${chronology.year} ${chronology.era}`)}</strong>
                        <p>A situação abaixo muda automaticamente ao avançar ou retroceder o calendário.</p>
                    </div>
                </div>
                <div class="world-atlas-toolbar">
                    <label>
                        <span>Buscar na História</span>
                        <input id="worldHistorySearch" type="search" placeholder="Reino, governante ou guerra" oninput="filterWorldHistory()">
                    </label>
                    <label>
                        <span>Tipo de registro</span>
                        <select id="worldHistoryType" onchange="filterWorldHistory()">
                            <option value="all">Todos os registros</option>
                            <option value="situation">Situação territorial</option>
                            <option value="war">Guerras</option>
                            <option value="occupation">Ocupações</option>
                            <option value="destruction">Destruições</option>
                            <option value="reconstruction">Reconstruções</option>
                            <option value="political">Mudanças políticas</option>
                            <option value="battle">Batalhas</option>
                        </select>
                    </label>
                </div>
                <p class="world-atlas-visible-count world-history-visible-count">${historicalSnapshot.situations.length + displayedHistoricalEvents.length} registros visíveis</p>
                ${historicalSnapshot.activeEvents?.length ? `
                    <div class="world-history-section-heading">
                        <span>ACONTECIMENTOS EM CURSO</span>
                        <b>${historicalSnapshot.activeEvents.length}</b>
                    </div>
                    <div class="world-political-list">${historicalSnapshot.activeEvents.map(renderHistoricalEventCard).join('')}</div>
                ` : ''}
                <div class="world-history-section-heading">
                    <span>SITUAÇÃO DOS TERRITÓRIOS</span>
                    <b>${historicalSnapshot.situations.length}</b>
                </div>
                <div class="world-political-list">${historicalSnapshot.situations
                    .sort((left, right) => (locationById.get(left.targetId)?.name || '').localeCompare(locationById.get(right.targetId)?.name || '', 'pt-BR'))
                    .map(renderHistoricalSituationCard).join('')}</div>
                ${displayedHistoricalEvents.some(entry => !activeHistoricalEventIds.has(entry.id)) ? `
                    <div class="world-history-section-heading">
                        <span>MUDANÇAS ANTERIORES MAIS RECENTES</span>
                    </div>
                    <div class="world-political-list">${displayedHistoricalEvents.filter(entry => !activeHistoricalEventIds.has(entry.id)).map(renderHistoricalEventCard).join('')}</div>
                ` : ''}
                <p class="world-atlas-empty world-history-empty" hidden>Nenhum registro corresponde aos filtros selecionados.</p>
                <p class="world-atlas-disclaimer">A consulta usa a continuidade dos jogos quando necessário e identifica esses registros no card. Desfechos variáveis não são convertidos em um único resultado canônico.</p>
            </section>
            ` : ''}
            ${view === 'map' ? '' : `<p class="world-hub-version">Estrutura v${Number(world?.schemaVersion) || 1} · Atlas v${Number(world?.politicalAtlasVersion) || 0} · Locais v${Number(world?.canonicalCatalogVersion) || 0} · Mapa v${Number(world?.cartographicCatalogVersion) || 0} · História v${Number(world?.historicalCatalogVersion) || 0} · ${locations.length} locais · ${npcs.length} NPCs · ${merchants.length} lojas</p>
            <button type="button" class="session-secondary session-full" onclick="closeWorldHub()">Fechar</button>`}
        </section>
    `;
    document.body.appendChild(modal);
    if (view === 'map') {
        requestAnimationFrame(() => window.worldMap?.initialize?.({ world, playerMode }));
    } else if (contextLocationId && (view === 'npcs' || view === 'merchants')) {
        requestAnimationFrame(() => {
            const field = document.getElementById(view === 'npcs' ? 'worldNpcLocation' : 'worldMerchantLocation');
            if (!field) return;
            field.value = contextLocationId;
            if (view === 'npcs') filterWorldNpcs();
            else filterWorldMerchants();
        });
    }
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

    if (window.collaborationSession?.isPlayerAccessEnded?.() && view !== 'collaboration') {
        window.renderCollaborationView?.(dialog);
        return;
    }

    const masterOnlyViews = new Set([
        'sheets', 'library', 'preferences', 'save-encounter', 'load-encounter',
        'app-maintenance'
    ]);
    if (window.collaborationSession?.isPlayer?.() && masterOnlyViews.has(view)) {
        showToast('🔒 Esta ferramenta pertence ao mestre da sala.');
        renderSessionToolsView('menu');
        return;
    }

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

    if (view === 'collaboration' && typeof window.renderCollaborationView === 'function') {
        window.renderCollaborationView(dialog);
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
        const filterTypes = ['all', 'damage', 'healing', 'effect', 'condition', 'equipment', 'loot', 'skill-test', 'turn'];
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

    const playerMode = window.collaborationSession?.isPlayer?.() === true;
    const masterTools = playerMode ? '' : `
            <button type="button" onclick="renderSessionToolsView('save-encounter')">💾 Salvar encontro</button>
            <button type="button" onclick="renderSessionToolsView('load-encounter')">⚔️ Carregar encontro</button>
            <button type="button" onclick="exportSessionBackup()">⇩ Backup JSON</button>
            <button type="button" onclick="document.getElementById('sessionImportInput').click()">⇧ Restaurar JSON</button>
            <button type="button" onclick="renderSessionToolsView('sheets')">🧙 Fichas</button>
            <button type="button" onclick="renderSessionToolsView('library')">✎ Biblioteca</button>
            <button type="button" onclick="renderSessionToolsView('preferences')">⚙ Preferências</button>
    `;

    dialog.innerHTML = `
        <div class="session-dialog-header">
            <h2>Sessão de combate</h2>
            <button type="button" class="session-close" onclick="closeSessionTools()" aria-label="Fechar">×</button>
        </div>
        <p class="session-tools-summary">R${round} · ${combatants.length} participantes</p>
        <div class="session-tool-grid">
            <button type="button" onclick="renderSessionToolsView('collaboration')">🌐 Sala</button>
            <button type="button" onclick="renderSessionToolsView('history')">📜 Histórico</button>
            ${playerMode ? '<button type="button" onclick="closeSessionTools(); openCampaignClock({ readOnly: true, view: \'calendar\' })">🗓️ Calendário</button>' : ''}
            ${masterTools}
            <button type="button" onclick="renderSessionToolsView('report')">▤ Relatório</button>
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
        version: 4,
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

function applyCriticalWoundRecurringEffects(combatant) {
    const activeWounds = Array.isArray(combatant?.criticalWounds)
        ? combatant.criticalWounds.filter(instance => (
            instance.woundId === 'difficult-torn-stomach' &&
            (instance.state || 'normal') === 'normal'
        ) || (
            instance.woundId === 'deadly-heart-damage' &&
            (instance.state || 'normal') === 'treated'
        ))
        : [];
    const checkEvents = window.processCriticalWoundTurnChecks?.(combatant) || [];
    if (!activeWounds.length && !checkEvents.length) return [];

    const changes = activeWounds.map(instance => {
        const heartBleeding = instance.woundId === 'deadly-heart-damage';
        const damage = heartBleeding ? 2 : 4;
        const woundName = heartBleeding ? 'Dano no Coração' : 'Estômago Rasgado';
        const damageName = heartBleeding ? 'Sangramento permanente' : 'dano ácido';
        const before = captureCombatResources(combatant);
        const sourceCombatant = combatants.find(entry =>
            String(entry.id) === String(instance.sourceId)
        );
        const source = sourceCombatant
            ? { id: sourceCombatant.id, name: sourceCombatant.name }
            : null;

        combatant.hpCurrent = Math.max(0, combatant.hpCurrent - damage);
        if (before.hp > 0 && combatant.hpCurrent === 0) {
            combatant.deathSaves = { success: 0, failures: 0 };
            combatant.stabilized = false;
        }

        const after = captureCombatResources(combatant);
        const defeated = didCombatantBecomeDefeated(combatant, before, after);
        const sourcePrefix = source && source.id !== combatant.id ? `${source.name} > ` : '';

        return {
            summary: `${woundName}: ${damage} de ${damageName}`,
            history: {
                label: defeated
                    ? `${sourcePrefix}Derrotou ${combatant.name} com ${woundName}: ${damage}`
                    : `${sourcePrefix}Dano de ${woundName} em ${combatant.name}: ${damage}`,
                detail: [
                    `Ferimento crítico: ${woundName}`,
                    `${heartBleeding ? 'Sangramento permanente' : 'Dano ácido recorrente'}: ${damage}`,
                    `PV: ${before.hp} → ${after.hp}`,
                    ...(defeated ? ['Alvo derrotado'] : [])
                ].join(' · '),
                metadata: {
                    type: 'damage',
                    source,
                    target: { id: combatant.id, name: combatant.name },
                    participants: [source, { id: combatant.id, name: combatant.name }].filter(Boolean),
                    combat: {
                        baseDamage: damage,
                        finalValue: damage,
                        before,
                        after,
                        defeated,
                        criticalWound: { id: instance.woundId, name: woundName }
                    }
                }
            }
        };
    });

    checkEvents.forEach(event => {
        changes.push({
            summary: event.summary,
            history: {
                label: `${combatant.name}: ${event.woundName} — ação necessária`,
                detail: [
                    `Ferimento crítico: ${event.woundName}`,
                    event.kind === 'suffocation'
                        ? 'Consequência: resolver Sufocamento neste turno'
                        : event.kind === 'death-test'
                            ? 'Consequência: realizar teste de resistência à Morte'
                            : 'Consequência: realizar teste de resistência a Atordoamento'
                ].join(' · '),
                metadata: {
                    type: 'condition',
                    target: { id: combatant.id, name: combatant.name },
                    participants: [{ id: combatant.id, name: combatant.name }],
                    effect: {
                        id: event.woundId,
                        type: 'critical-wound',
                        name: event.woundName,
                        action: 'teste necessário'
                    }
                }
            }
        });
    });

    savePlayersToStorage();
    showToast(`🩹 ${combatant.name}: ${changes.map(change => change.summary).join(' · ')}`);
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
    const lootReport = window.getCollectedLootReport?.(state.combatants) || {
        collections: [],
        totalCrowns: 0,
        totalItems: 0
    };

    localStorage.setItem(LAST_COMBAT_REPORT_KEY, JSON.stringify({
        createdAt: new Date().toISOString(),
        rounds: state.round,
        participants: state.combatants.length,
        players: players.length,
        monsters: monsters.length,
        defeatedMonsters: defeated.length,
        totalDamage: totalFromEntries(damageEntries),
        totalHealing: totalFromEntries(healingEntries),
        lootCollections: lootReport.collections,
        totalCrownsCollected: lootReport.totalCrowns,
        totalLootItems: lootReport.totalItems,
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
        const requestedValue = hasResolvedValue
            ? Math.max(0, Number.parseInt(resolvedValue, 10) || 0)
            : Number.parseInt(currentInput) || 0;
        const healingMultiplier = isHealing && requestedValue > 0
            ? Math.max(0, Number(window.getItemConditionHealingMultiplier?.(target)) || 1)
            : 1;
        const value = isHealing
            ? Math.floor(requestedValue * healingMultiplier)
            : requestedValue;
        const historyType = isHealing ? 'healing' : (value === 0 ? 'death-save' : 'damage');
        const historyMetadata = target
            ? createResourceHistoryMetadata(historyType, target, value, {
                ...(historyContext || {}),
                requestedHealing: isHealing ? requestedValue : undefined,
                healingMultiplier
            })
            : null;
        if (historyMetadata?.combat && isHealing) {
            historyMetadata.combat.requestedHealing = requestedValue;
            historyMetadata.combat.healingMultiplier = healingMultiplier;
        }
        const sourcePrefix = historyMetadata?.source?.name
            ? `${historyMetadata.source.name} > `
            : '';
        const historyLabel = () => {
            if (isHealing) return `${sourcePrefix}Cura em ${target?.name || 'alvo'}: ${value}`;

            const recordedDamage = historyMetadata?.combat?.automationDamage?.damageAfterFisstech ?? value;

            if (historyMetadata?.combat?.defeated) {
                if (historyMetadata?.combat?.critical) {
                    return `${sourcePrefix}Derrotou ${target?.name || 'alvo'} com crítico: ${recordedDamage}`;
                }
                return `${sourcePrefix}Derrotou ${target?.name || 'alvo'}: ${recordedDamage || 'falha de morte'}`;
            }

            if (historyMetadata?.combat?.critical) {
                return `${sourcePrefix}Crítico em ${target?.name || 'alvo'}: ${recordedDamage}`;
            }

            return `${sourcePrefix}Dano em ${target?.name || 'alvo'}: ${recordedDamage || 'falha de morte'}`;
        };

        const applyOriginalHP = () => {
            let result;

            if (hasResolvedValue) {
                // A confirmação é assíncrona. Recoloca o valor calculado apenas
                // no instante da aplicação para que armadura e multiplicadores
                // não sejam substituídos pelo valor digitado originalmente.
                currentInput = String(value);
            }

            if (!isHealing && historyMetadata?.combat?.critical) {
                window.applyCriticalDamageBefore?.(target, historyMetadata.combat.critical);
            }

            result = originalApplyHP(isHealing);

            if (!isHealing && historyMetadata?.combat?.critical) {
                window.applyCriticalDamageAfter?.(target, historyMetadata.combat.critical);
            }

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

        if (historyContext?.skipConfirmation) {
            const applied = trackAction(
                historyLabel,
                applyOriginalHP,
                () => buildResourceHistoryDetail(historyMetadata),
                () => historyMetadata
            );
            if (historyContext?.damageSource) window.completeSpellDamageStep?.();
            return applied;
        }

        openSessionConfirm({
            title: historyMetadata?.combat?.critical ? 'Aplicar dano crítico?' : 'Aplicar dano?',
            message: value > 0
                ? historyMetadata?.combat?.critical
                    ? `${target.name} receberá ${value} de dano${historyMetadata.combat.critical.woundName ? `, ${historyMetadata.combat.critical.woundName}` : ''} e a armadura será ignorada.`
                    : `${target.name} receberá ${value} de dano.`
                : `${target.name} receberá uma falha de morte.`,
            confirmLabel: historyMetadata?.combat?.critical ? 'Aplicar crítico' : 'Aplicar dano',
            danger: true,
            onCancel: historyContext?.damageSource
                ? () => window.cancelSpellDamageSequence?.('Sequência de dano cancelada.')
                : null,
            onConfirm: () => {
                const applied = trackAction(
                    historyLabel,
                    applyOriginalHP,
                    () => buildResourceHistoryDetail(historyMetadata),
                    () => historyMetadata
                );
                if (historyContext?.damageSource) window.completeSpellDamageStep?.();
                return applied;
            }
        });
    };

    window.applyST = isHealing => {
        const target = combatants.find(combatant => combatant.id === selectedId);
        const requestedValue = Number.parseInt(currentInput) || 0;
        const recoveryMultiplier = isHealing
            ? Math.max(0, Number(window.getItemConditionStaminaRecoveryMultiplier?.(target)) || 1)
            : 1;
        const value = isHealing ? Math.floor(requestedValue * recoveryMultiplier) : requestedValue;
        const stBefore = Math.max(0, Number(target?.stCurrent) || 0);
        const temporaryStBefore = Math.max(0, Number(window.getCareTemporarySt?.(target)) || 0);
        const runeSourceMaximum = Math.max(0, Number(target?.runeSourceMax) || 0);
        const runeSourceBefore = Math.max(0, Number(target?.runeSourceCurrent) || 0);
        let stAfter = stBefore;
        let temporaryStAfter = temporaryStBefore;
        let runeSourceAfter = runeSourceBefore;
        const restoresRuneSource = isHealing && runeSourceMaximum > 0;

        return trackAction(
            `${isHealing
                ? (restoresRuneSource ? 'Recursos regenerados' : 'ST recuperado')
                : 'ST gasto'} em ${target?.name || 'alvo'}: ${value}`,
            () => {
                if (value !== requestedValue) currentInput = String(value);
                const result = originalApplyST(isHealing);

                if (target && restoresRuneSource) {
                    target.runeSourceCurrent = Math.min(
                        runeSourceMaximum,
                        runeSourceBefore + value
                    );
                    runeSourceAfter = target.runeSourceCurrent;
                    savePlayersToStorage();
                    updateCardTargeted(target);
                }

                stAfter = Math.max(0, Number(target?.stCurrent) || 0);
                temporaryStAfter = Math.max(0, Number(window.getCareTemporarySt?.(target)) || 0);
                return result;
            },
            () => {
                const details = [`EST: ${stBefore} → ${stAfter}`];
                if (temporaryStBefore !== temporaryStAfter) {
                    details.push(`EST temporário: ${temporaryStBefore} → ${temporaryStAfter}`);
                }
                if (recoveryMultiplier !== 1) {
                    details.push(`Recuperação base ${requestedValue} ×${recoveryMultiplier} = ${value}`);
                }
                if (restoresRuneSource) {
                    details.push(`Fonte Rúnica: ${runeSourceBefore} → ${runeSourceAfter}`);
                }
                return details.join(' · ');
            }
        );
    };

    window.nextTurn = () => {
        const before = captureSessionState();
        const hadCombatants = combatants.length > 0;
        originalNextTurn();

        const campaignTime = hadCombatants
            ? window.campaignClock?.advanceByMinutes?.(1, { source: 'combat-turn' })
            : null;

        const activeCombatant = getActiveCombatant();
        const recurringEffects = applyRecurringEffects(activeCombatant);
        const criticalWoundEffects = applyCriticalWoundRecurringEffects(activeCombatant);
        const toxicityEffects = window.processCombatantToxicityTurn?.(activeCombatant) || [];
        const recurringChanges = [
            ...recurringEffects,
            ...criticalWoundEffects,
            ...toxicityEffects
        ].map(change => change.summary);
        const automationChanges = window.processAutomatedTurnEffects?.(activeCombatant) || [];
        const expiredEffects = getExpiredEffects(before);
        const detail = [
            ...(campaignTime?.changed ? [
                `Tempo: ${campaignTime.before.short} → ${campaignTime.after.short}`,
                campaignTime.after.medievalHour,
                ...campaignTime.results.map(result => result.summary || result.detail).filter(Boolean)
            ] : []),
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
            criticalWoundEffects.forEach(change => {
                if (change.history) {
                    addHistoryEntry(change.history.label, change.history.detail, change.history.metadata);
                }
            });
            toxicityEffects.forEach(change => {
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

        if (
            window.isTransportSystemItem?.(item)
            || ['mount', 'vehicle', 'mount-gear'].includes(String(item.transportKind || item.type || ''))
        ) return originalUseSelectedItem();

        if (window.isEquipmentItem?.(item)) return originalUseSelectedItem();

        const itemDefinition = predefinedItems.find(entry => entry.id === item.id) || item;
        const collectionOwner = window.getCharacterCollectionOwner?.() || null;
        const isCareConsumable = Boolean(itemDefinition.careConsumable);
        const appliesActiveInventoryEffect = Boolean(
            window.isInventoryItemAutomationManaged?.(itemDefinition) || (
                (itemDefinition.potion || itemDefinition.oil) &&
                Object.prototype.hasOwnProperty.call(itemDefinition, 'active')
            )
        );
        const confirmationMessage = isCareConsumable
            ? `${item.name} será consumido por ${collectionOwner?.name || 'quem possui este inventário'} e removerá uma porção. ${itemDefinition.careConsumable.kind === 'food' ? 'A alimentação e seus efeitos serão atualizados.' : 'O consumo será registrado sem substituir uma refeição.'} Você poderá desfazer.`
            : appliesActiveInventoryEffect
            ? `${item.name} será consumido e seu efeito será aplicado em ${collectionOwner?.name || 'quem possui este inventário'}. Você poderá desfazer.`
            : `${item.name} será consumido do inventário. Você poderá desfazer.`;

        const executeUse = () => trackAction(
            isCareConsumable
                ? `${collectionOwner?.name || 'Personagem'}: consumiu ${item.name}`
                : `Item usado: ${item.name}`,
            originalUseSelectedItem,
            () => window.consumeToxicityItemUseDetail?.() || '',
            isCareConsumable
                ? {
                    type: 'effect',
                    target: collectionOwner ? { id: collectionOwner.id, name: collectionOwner.name } : undefined,
                    participants: collectionOwner ? [{ id: collectionOwner.id, name: collectionOwner.name }] : [],
                    effect: { id: item.id, type: 'care-consumable', name: item.name, action: 'consumido' }
                }
                : {}
        );

        if (window.beginInventoryItemUseFlow?.(itemDefinition, collectionOwner, executeUse)) {
            return;
        }

        openSessionConfirm({
            title: isCareConsumable ? 'Consumir item?' : 'Usar item?',
            message: confirmationMessage,
            confirmLabel: isCareConsumable ? 'Consumir' : 'Usar item',
            onConfirm: executeUse
        });
    };
}

window.closeSessionConfirm = closeSessionConfirm;
window.cancelSessionConfirm = cancelSessionConfirm;
window.openSessionConfirm = openSessionConfirm;
window.undoLastAction = undoLastAction;
window.openSessionTools = openSessionTools;
window.openWorldHub = openWorldHub;
window.filterWorldPoliticalAtlas = filterWorldPoliticalAtlas;
window.filterWorldCanonicalCatalog = filterWorldCanonicalCatalog;
window.filterWorldHistory = filterWorldHistory;
window.openWorldLocationEditor = openWorldLocationEditor;
window.closeWorldLocationEditor = closeWorldLocationEditor;
window.saveWorldLocationFromForm = saveWorldLocationFromForm;
window.requestDeleteWorldLocation = requestDeleteWorldLocation;
window.filterWorldNpcs = filterWorldNpcs;
window.filterWorldMerchants = filterWorldMerchants;
window.openWorldNpcEditor = openWorldNpcEditor;
window.closeWorldNpcEditor = closeWorldNpcEditor;
window.saveWorldNpcFromForm = saveWorldNpcFromForm;
window.requestDeleteWorldNpc = requestDeleteWorldNpc;
window.closeWorldHub = closeWorldHub;
window.setCampaignCurrentWorldLocation = setCampaignCurrentWorldLocation;
window.exportCampaignWorld = exportCampaignWorld;
window.requestCampaignWorldImport = requestCampaignWorldImport;
window.importCampaignWorldFile = importCampaignWorldFile;
window.closeSessionTools = closeSessionTools;
window.renderSessionToolsView = renderSessionToolsView;
window.refreshSessionStatus = refreshSessionStatus;
window.setHistoryFilter = setHistoryFilter;
window.setHistoryParticipantFilter = setHistoryParticipantFilter;
window.toggleHistoryDetails = toggleHistoryDetails;
window.clearSessionHistory = clearSessionHistory;
window.addCombatHistoryEntry = addHistoryEntry;
window.applyRecurringCombatEffects = applyRecurringEffects;
window.trackCombatAction = (label, callback, detail = '', metadata = {}) =>
    trackAction(label, callback, detail, metadata);
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
