const SESSION_HISTORY_KEY = 'dnd_session_history';
const SAVED_ENCOUNTERS_KEY = 'dnd_saved_encounters';
const MAX_HISTORY_ENTRIES = 80;
const MAX_UNDO_ENTRIES = 25;
const scheduleMicrotask = window.queueMicrotask || (callback => Promise.resolve().then(callback));

let sessionHistory = loadSessionData(SESSION_HISTORY_KEY, []);
let undoStack = [];
let trackingDepth = 0;
let endCombatHoldTimer = null;
let skipNextEndCombatClick = false;

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
        expandedMagic
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
        expandedMagic: state.expandedMagic
    });
}

function persistSessionHistory() {
    localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(sessionHistory));
}

function addHistoryEntry(label, detail = '') {
    sessionHistory.unshift({
        id: Date.now() + Math.random(),
        label,
        detail,
        round,
        at: new Date().toISOString()
    });

    sessionHistory = sessionHistory.slice(0, MAX_HISTORY_ENTRIES);
    persistSessionHistory();
    refreshSessionStatus();
}

function trackAction(label, callback, detail = '') {
    const isTopLevelAction = trackingDepth === 0;
    const before = isTopLevelAction ? captureSessionState() : null;

    trackingDepth++;

    try {
        return callback();
    } finally {
        trackingDepth--;

        if (isTopLevelAction && getStateFingerprint(before) !== getStateFingerprint(captureSessionState())) {
            undoStack.push({ label, state: before });
            undoStack = undoStack.slice(-MAX_UNDO_ENTRIES);
            addHistoryEntry(label, detail);
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
    inventory = cloneSessionData(state.inventory);
    abilitiesInventory = cloneSessionData(state.abilitiesInventory);
    expandedMagic = state.expandedMagic;

    savePlayersToStorage();
    saveInventory();
    saveAbilities();
    localStorage.setItem('expandedMagic', String(expandedMagic));

    const selectedCombatant = combatants.find(combatant => combatant.id === selectedId);
    document.getElementById('targetName').innerText = selectedCombatant?.name || 'Nenhum';

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

    if (view === 'history') {
        const entries = sessionHistory.length
            ? sessionHistory.map(entry => `
                <li>
                    <span>${escapeHtml(entry.label)}</span>
                    <small>R${entry.round} · ${formatHistoryTime(entry.at)}</small>
                </li>
            `).join('')
            : '<li class="session-empty">Ainda não há ações nesta sessão.</li>';

        dialog.innerHTML = `
            <div class="session-dialog-header">
                <h2>Histórico</h2>
                <button type="button" class="session-close" onclick="closeSessionTools()" aria-label="Fechar">×</button>
            </div>
            <ol class="session-history-list">${entries}</ol>
            <button type="button" class="session-secondary session-full" onclick="renderSessionToolsView('menu')">Voltar</button>
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
            lastPlayerData: state.lastPlayerData
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
        version: 1,
        exportedAt: new Date().toISOString(),
        session: captureSessionState(),
        history: sessionHistory,
        encounters: loadSessionData(SAVED_ENCOUNTERS_KEY, [])
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

        if (!backup?.session || !Array.isArray(backup.session.combatants)) {
            throw new Error('Arquivo incompatível');
        }

        openSessionConfirm({
            title: 'Restaurar backup?',
            message: 'O combate, inventário e habilidades atuais serão substituídos. Você poderá desfazer esta restauração.',
            confirmLabel: 'Restaurar',
            danger: true,
            onConfirm: () => {
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

        const rolls = Array.from(
            { length: Math.max(1, Number(effect.stacks) || 1) },
            () => Math.floor(Math.random() * 6) + 1
        );
        const damage = rolls.reduce((total, roll) => total + roll, 0);
        const previousHp = combatant.hpCurrent;

        combatant.hpCurrent = Math.max(0, combatant.hpCurrent - damage);

        if (previousHp > 0 && combatant.hpCurrent === 0) {
            combatant.deathSaves = { success: 0, failures: 0 };
            combatant.stabilized = false;
        }

        changes.push(`${recurringConditions[effect.id]}: ${damage} de dano (${rolls.join('+')})`);
    });

    if (changes.length) {
        savePlayersToStorage();
        showToast(`⚠️ ${combatant.name}: ${changes.join(' · ')}`);
    }

    return changes;
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
                expired.push(`${previousCombatant.name}: ${getEffectName(previousEffect)} expirou`);
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
    const originalApplyArmorDamage = window.applyArmorDamage;
    const originalNextTurn = window.nextTurn;
    const originalSaveEntity = window.saveEntity;
    const originalApplyInitiative = window.applyInitiative;
    const originalToggleCondition = window.toggleCondition;
    const originalToggleEffect = window.toggleEffect;
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
            onConfirm: () => trackAction(
                `Participante removido: ${combatant.name}`,
                () => originalRemoveCombatant({ stopPropagation() {} }, id)
            )
        });
    };

    window.endCombat = () => {
        if (skipNextEndCombatClick) {
            skipNextEndCombatClick = false;
            return;
        }

        openSessionConfirm({
            title: 'Encerrar combate?',
            message: 'Monstros e efeitos serão removidos; jogadores voltarão ao estado inicial do combate. Você poderá desfazer.',
            confirmLabel: 'Encerrar',
            danger: true,
            onConfirm: () => trackAction('Combate encerrado', originalEndCombat)
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

    window.applyHP = isHealing => {
        const target = combatants.find(combatant => combatant.id === selectedId);
        const value = Number.parseInt(currentInput) || 0;

        if (isHealing) {
            return trackAction(
                `Cura em ${target?.name || 'alvo'}: ${value}`,
                () => originalApplyHP(true)
            );
        }

        if (!target) return originalApplyHP(false);

        openSessionConfirm({
            title: 'Aplicar dano?',
            message: value > 0
                ? `${target.name} receberá ${value} de dano.`
                : `${target.name} receberá uma falha de morte.`,
            confirmLabel: 'Aplicar dano',
            danger: true,
            onConfirm: () => trackAction(
                `Dano em ${target.name}: ${value || 'falha de morte'}`,
                () => originalApplyHP(false)
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

    window.applyArmorDamage = () => {
        const target = combatants.find(combatant => combatant.id === selectedId);
        const value = Number.parseInt(pendingDamageBase) || 0;

        if (!target) return originalApplyArmorDamage();

        openSessionConfirm({
            title: 'Danificar armadura?',
            message: `${target.name} perderá ${value} de armadura na área selecionada.`,
            confirmLabel: 'Danificar',
            danger: true,
            onConfirm: () => trackAction(
                `Armadura danificada: ${target.name} (-${value})`,
                originalApplyArmorDamage
            )
        });
    };

    window.nextTurn = () => {
        const before = captureSessionState();
        originalNextTurn();

        const activeCombatant = getActiveCombatant();
        const recurringChanges = applyRecurringEffects(activeCombatant);
        const expiredEffects = getExpiredEffects(before);
        const detail = [...recurringChanges, ...expiredEffects].join(' · ');

        if (getStateFingerprint(before) !== getStateFingerprint(captureSessionState())) {
            undoStack.push({ label: `Próximo turno: ${activeCombatant?.name || 'sem participante'}`, state: before });
            undoStack = undoStack.slice(-MAX_UNDO_ENTRIES);
            addHistoryEntry(`Turno: ${activeCombatant?.name || 'sem participante'}`, detail);
        }

        renderList(false);
    };

    window.saveEntity = () => trackAction('Participante adicionado ou atualizado', originalSaveEntity);
    window.applyInitiative = () => trackAction('Iniciativa alterada', originalApplyInitiative);
    window.toggleCondition = icon => trackAction(`Condição alterada: ${conditionDescriptions[icon]?.title || icon}`, () => originalToggleCondition(icon));
    window.toggleEffect = (type, id) => trackAction('Efeito alterado', () => originalToggleEffect(type, id));

    window.useSelectedInventoryItem = () => {
        const item = inventory.find(entry => entry.id === selectedInventoryItemId);

        if (!item || item.id === 'coroa') return originalUseSelectedItem();

        openSessionConfirm({
            title: 'Usar item?',
            message: `${item.name} será consumido do inventário. Você poderá desfazer.`,
            confirmLabel: 'Usar item',
            onConfirm: () => trackAction(`Item usado: ${item.name}`, originalUseSelectedItem)
        });
    };
}

window.closeSessionConfirm = closeSessionConfirm;
window.undoLastAction = undoLastAction;
window.openSessionTools = openSessionTools;
window.closeSessionTools = closeSessionTools;
window.renderSessionToolsView = renderSessionToolsView;
window.saveCurrentEncounter = saveCurrentEncounter;
window.loadSavedEncounter = loadSavedEncounter;
window.deleteSavedEncounter = deleteSavedEncounter;
window.exportSessionBackup = exportSessionBackup;
window.importSessionBackup = importSessionBackup;

installActionGuards();
window.addEventListener('load', installSessionStatusObserver);
