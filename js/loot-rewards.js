(function initializeLootRewards(global) {
    'use strict';

    const LOOT_STATE_VERSION = 1;
    const LOOT_ITEM_ALIASES = Object.freeze({
        garrasdecarnical: 'garradecarnical',
        meduladecarnical: 'medulaosseadecarnical',
        mineriodemeteorito: 'meteorito',
        poeirainfundida: 'poinfundido',
        presadevampiro: 'dentedevampiro'
    });

    function cloneLootValue(value, fallback = null) {
        try {
            return JSON.parse(JSON.stringify(value ?? fallback));
        } catch {
            return fallback;
        }
    }

    function escapeLootHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function normalizeLootName(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase('pt-BR')
            .replace(/[^a-z0-9]+/g, '');
    }

    function getLootMonsterDefinition(combatant) {
        const catalog = typeof monsterDatabase !== 'undefined' ? monsterDatabase : [];
        return catalog.find(monster => String(monster.id) === String(combatant?.presetMonsterId)) || null;
    }

    function parseMonsterReward(rawReward) {
        const original = String(rawReward || '').trim();
        const amountMatch = original.match(/(\d[\d.]*)/);
        const amount = amountMatch
            ? Math.max(0, Number(amountMatch[1].replaceAll('.', '')) || 0)
            : 0;

        return { original, amount };
    }

    function parseMonsterLootLine(rawLine) {
        const original = String(rawLine || '').trim();
        if (!original) return null;

        const difficultyMatch = original.match(/\b(?:ND|CD)\s*:?\s*(\d+)/i);
        const chanceMatch = original.match(/\(\s*(\d+)\s*%\s*\)/);
        const diceMatch = original.match(/\(\s*(\d*)d(\d+)(?:\s*\/\s*(\d+))?\s*\)/i);
        const fixedParenthetical = !chanceMatch && !diceMatch
            ? original.match(/\(\s*(\d+)\s*\)/)
            : null;
        const explicitQuantityMatch = original.match(/\b(\d+)\s*x\b/i);
        const name = original
            .replace(/\([^)]*\)/g, ' ')
            .replace(/\b\d+\s*x\b/ig, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        let quantityRule = { kind: 'fixed', quantity: 1, label: '1' };

        if (chanceMatch) {
            const chance = Math.max(0, Math.min(100, Number(chanceMatch[1]) || 0));
            quantityRule = { kind: 'chance', chance, label: `${chance}%` };
        } else if (diceMatch) {
            const dice = Math.max(1, Number(diceMatch[1]) || 1);
            const sides = Math.max(1, Number(diceMatch[2]) || 1);
            const divisor = Math.max(1, Number(diceMatch[3]) || 1);
            quantityRule = {
                kind: 'dice',
                dice,
                sides,
                divisor,
                label: `${dice}d${sides}${divisor > 1 ? `/${divisor}` : ''}`
            };
        } else {
            const quantity = Math.max(
                1,
                Number(explicitQuantityMatch?.[1] || fixedParenthetical?.[1]) || 1
            );
            quantityRule = { kind: 'fixed', quantity, label: String(quantity) };
        }

        return {
            original,
            name: name || original,
            difficulty: Math.max(0, Number(difficultyMatch?.[1]) || 0),
            quantityRule
        };
    }

    function rollLootDie(sides, random = Math.random) {
        return Math.floor(random() * Math.max(1, sides)) + 1;
    }

    function rollMonsterLootEntry(parsedEntry, random = Math.random) {
        const entry = cloneLootValue(parsedEntry, {});
        const rule = entry.quantityRule || { kind: 'fixed', quantity: 1, label: '1' };
        let quantity = 0;
        let rollDetail = '';

        if (rule.kind === 'chance') {
            const roll = rollLootDie(100, random);
            quantity = roll <= rule.chance ? 1 : 0;
            rollDetail = `d100: ${roll} ${quantity ? '≤' : '>'} ${rule.chance}%`;
        } else if (rule.kind === 'dice') {
            const rolls = Array.from({ length: rule.dice }, () => rollLootDie(rule.sides, random));
            const total = rolls.reduce((sum, value) => sum + value, 0);
            quantity = Math.max(1, Math.ceil(total / Math.max(1, rule.divisor || 1)));
            rollDetail = `${rule.dice}d${rule.sides}: ${rolls.join(' + ')}${rule.divisor > 1 ? ` ÷ ${rule.divisor}` : ''} = ${quantity}`;
        } else {
            quantity = Math.max(1, Number(rule.quantity) || 1);
            rollDetail = `Quantidade fixa: ${quantity}`;
        }

        return {
            ...entry,
            quantity,
            rollDetail
        };
    }

    function rollMonsterLoot(definition, random = Math.random) {
        return (Array.isArray(definition?.loot) ? definition.loot : [])
            .map(parseMonsterLootLine)
            .filter(Boolean)
            .map(entry => rollMonsterLootEntry(entry, random));
    }

    function divideCrowns(total, recipientIds) {
        const amount = Math.max(0, Math.floor(Number(total) || 0));
        const ids = [...new Set((recipientIds || []).map(String).filter(Boolean))];
        if (!amount || !ids.length) return [];

        const base = Math.floor(amount / ids.length);
        let remainder = amount % ids.length;

        return ids.map(recipientId => ({
            recipientId,
            amount: base + (remainder-- > 0 ? 1 : 0)
        })).filter(distribution => distribution.amount > 0);
    }

    function normalizeLootCollectionAmount(value, fallback = 0) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) {
            return Math.max(0, Math.floor(Number(fallback) || 0));
        }
        return Math.max(0, Math.floor(parsed));
    }

    function getLootCatalog() {
        return typeof predefinedItems !== 'undefined' ? predefinedItems : [];
    }

    function getLootItemIcon(name) {
        const normalized = normalizeLootName(name);
        if (/mutagen/.test(normalized)) return '🧬';
        if (/sangue/.test(normalized)) return '🩸';
        if (/olho/.test(normalized)) return '👁️';
        if (/pele|couro|quitina|escama/.test(normalized)) return '🧵';
        if (/dente|presa|garra|osso|cranio/.test(normalized)) return '🦴';
        if (/essencia|quintessencia|po|poeira/.test(normalized)) return '✨';
        if (/item|posse|runa/.test(normalized)) return '🎁';
        return '🧪';
    }

    function resolveLootItemDefinition(name) {
        const catalog = getLootCatalog();
        const normalized = normalizeLootName(name);
        const canonical = LOOT_ITEM_ALIASES[normalized] || normalized;
        const item = catalog.find(entry => normalizeLootName(entry.name) === canonical)
            || catalog.find(entry => normalizeLootName(entry.id) === canonical);

        if (item) return cloneLootValue(item, {});

        return {
            id: `loot_${normalized || 'item'}`,
            name: String(name || 'Saque'),
            icon: getLootItemIcon(name),
            category: 'misc',
            craftingCategory: 'materials',
            craftingMaterial: true,
            goldValue: 0,
            description: 'Material obtido como saque de uma criatura.'
        };
    }

    function getLootRecipients() {
        const entries = typeof combatants !== 'undefined' && Array.isArray(combatants)
            ? combatants
            : [];
        return entries.filter(combatant => combatant?.type === 'player');
    }

    function getDefaultLootRecipient(recipients) {
        return recipients.find(recipient => String(recipient.id) === String(
            typeof activeTurnId !== 'undefined' ? activeTurnId : ''
        )) || recipients[0] || null;
    }

    function ensureMonsterLootState(combatant) {
        if (combatant?.lootCollection?.version === LOOT_STATE_VERSION) {
            return combatant.lootCollection;
        }

        const definition = getLootMonsterDefinition(combatant);
        if (!definition) return null;

        const state = {
            version: LOOT_STATE_VERSION,
            status: 'rolled',
            monsterId: combatant.id,
            monsterName: combatant.name,
            presetMonsterId: definition.id,
            rewardCrowns: parseMonsterReward(definition.reward).amount,
            rewardLabel: definition.reward || '',
            rolledAt: new Date().toISOString(),
            items: rollMonsterLoot(definition),
            crownDistributions: [],
            itemDistributions: [],
            collectedCrownsAmount: null,
            unassignedCrowns: 0
        };

        combatant.lootCollection = state;
        global.savePlayersToStorage?.();
        return state;
    }

    function canCollectMonsterLoot(combatant) {
        if (!combatant || combatant.type !== 'monster' || Number(combatant.hpCurrent) > 0) return false;
        const definition = getLootMonsterDefinition(combatant);
        if (!definition) return false;
        const hasLoot = (definition.loot || []).some(line => String(line || '').trim());
        return hasLoot || parseMonsterReward(definition.reward).amount > 0;
    }

    function getCollectedLootSummary(state) {
        const crowns = (state?.crownDistributions || []).reduce(
            (total, distribution) => total + Math.max(0, Number(distribution.amount) || 0),
            0
        );
        const items = (state?.itemDistributions || [])
            .filter(distribution => distribution.status === 'collected')
            .reduce((total, distribution) => total + Math.max(0, Number(distribution.quantity) || 0), 0);
        return { crowns, items };
    }

    function renderCombatantLootPanel(combatant) {
        if (!canCollectMonsterLoot(combatant)) return '';
        const state = combatant.lootCollection;
        const collected = state?.status === 'collected';
        const summary = collected ? getCollectedLootSummary(state) : null;
        const combatantId = JSON.stringify(String(combatant.id));

        return `
            <section class="monster-loot-panel ${collected ? 'monster-loot-collected' : ''}">
                <button
                    type="button"
                    class="monster-loot-action"
                    onclick='event.stopPropagation(); openMonsterLootModal(${combatantId})'
                >
                    <span>${collected ? '✅ SAQUE COLETADO' : '🎁 COLETAR SAQUE'}</span>
                    <small>${collected
                        ? `${summary.crowns} coroas · ${summary.items} ${summary.items === 1 ? 'item' : 'itens'}`
                        : 'Rolar e distribuir recompensas'}</small>
                </button>
            </section>
        `;
    }

    function renderLootRecipientOptions(recipients, selectedId) {
        return recipients.map(recipient => `
            <option value="${escapeLootHtml(recipient.id)}" ${String(recipient.id) === String(selectedId) ? 'selected' : ''}>
                ${escapeLootHtml(recipient.name)}
            </option>
        `).join('');
    }

    function renderCollectedLootModal(combatant, state) {
        const crownLines = (state.crownDistributions || []).map(distribution => `
            <li><span>👑 ${escapeLootHtml(distribution.recipientName)}</span><strong>${distribution.amount}</strong></li>
        `).join('');
        const unassignedCrowns = normalizeLootCollectionAmount(state.unassignedCrowns);
        const crownSummary = [
            crownLines,
            unassignedCrowns > 0 ? `
                <li class="loot-result-unassigned">
                    <span>👑 Sem destinatário</span>
                    <strong>${unassignedCrowns} não distribuídas</strong>
                </li>
            ` : ''
        ].filter(Boolean).join('');
        const itemLines = (state.itemDistributions || []).map(distribution => `
            <li class="${distribution.status === 'collected' ? '' : 'loot-result-missed'}">
                <span>${escapeLootHtml(distribution.itemName)}</span>
                <strong>${distribution.status === 'collected'
                    ? `${distribution.quantity} → ${escapeLootHtml(distribution.recipientName)}`
                    : escapeLootHtml(distribution.reason || 'Não obtido')}</strong>
            </li>
        `).join('');

        return `
            <div class="session-dialog-header">
                <div><small class="loot-dialog-kicker">RECOMPENSA COLETADA</small><h2>${escapeLootHtml(combatant.name)}</h2></div>
                <button type="button" class="session-close" onclick="closeMonsterLootModal()" aria-label="Fechar">×</button>
            </div>
            <p class="loot-dialog-note">Distribuição concluída em ${new Date(state.collectedAt).toLocaleString('pt-BR')}.</p>
            ${crownSummary ? `<h3>Coroas</h3><ul class="loot-summary-list">${crownSummary}</ul>` : ''}
            ${itemLines ? `<h3>Itens</h3><ul class="loot-summary-list">${itemLines}</ul>` : ''}
            <button type="button" class="session-secondary session-full" onclick="closeMonsterLootModal()">Fechar</button>
        `;
    }

    function openMonsterLootModal(combatantId) {
        closeMonsterLootModal();
        const combatant = (typeof combatants !== 'undefined' ? combatants : [])
            .find(entry => String(entry.id) === String(combatantId));

        if (!canCollectMonsterLoot(combatant)) {
            global.showToast?.('O saque fica disponível depois que a criatura for derrotada.');
            return;
        }

        const state = ensureMonsterLootState(combatant);
        const modal = document.createElement('div');
        modal.id = 'monsterLootModal';
        modal.className = 'session-overlay monster-loot-overlay';
        modal.addEventListener('click', event => {
            if (event.target === modal) closeMonsterLootModal();
        });

        const dialog = document.createElement('section');
        dialog.className = 'session-dialog monster-loot-dialog';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.addEventListener('click', event => event.stopPropagation());

        if (state.status === 'collected') {
            dialog.innerHTML = renderCollectedLootModal(combatant, state);
            modal.append(dialog);
            document.body.append(modal);
            return;
        }

        const recipients = getLootRecipients();
        if (!recipients.length) {
            global.showToast?.('Adicione ao menos um personagem ao combate para receber o saque.');
            return;
        }

        const defaultRecipient = getDefaultLootRecipient(recipients);
        const rewardSection = state.rewardCrowns > 0 ? `
            <section class="loot-reward-section">
                <div class="loot-section-heading">
                    <div><small>RECOMPENSA</small><strong>👑 Coroas</strong></div>
                    <span>Valor original: ${state.rewardCrowns}</span>
                </div>
                <label class="loot-crown-amount" for="lootCrownsAmount">
                    <span>Quantidade a coletar</span>
                    <input
                        type="number"
                        id="lootCrownsAmount"
                        min="0"
                        step="1"
                        inputmode="numeric"
                        value="${state.rewardCrowns}"
                    >
                </label>
                <small class="loot-crown-help">Selecione quem participará da divisão. Sem destinatários, nenhuma Coroa será entregue.</small>
                <div class="loot-recipient-checks">
                    ${recipients.map(recipient => `
                        <label>
                            <input type="checkbox" name="lootCrownRecipient" value="${escapeLootHtml(recipient.id)}" checked>
                            <span>${escapeLootHtml(recipient.name)}</span>
                        </label>
                    `).join('')}
                </div>
            </section>
        ` : '';
        const itemSection = state.items.length ? state.items.map((item, index) => {
            const rolledQuantity = normalizeLootCollectionAmount(item.quantity);
            return `
                <article class="loot-result-card">
                    <div class="loot-result-main">
                        <span class="loot-result-icon">${getLootItemIcon(item.name)}</span>
                        <div><strong>${escapeLootHtml(item.name)}</strong><small>${escapeLootHtml(item.rollDetail)}</small></div>
                        <b>Rolado ×${rolledQuantity}</b>
                    </div>
                    <label class="loot-quantity-editor" for="lootQuantity-${index}">
                        <span>Quantidade a coletar</span>
                        <input
                            type="number"
                            id="lootQuantity-${index}"
                            min="0"
                            step="1"
                            inputmode="numeric"
                            value="${rolledQuantity}"
                        >
                    </label>
                    ${item.difficulty > 0 ? `
                        <label class="loot-difficulty-check">
                            <input type="checkbox" id="lootDifficulty-${index}">
                            <span>Teste ND ${item.difficulty} superado</span>
                        </label>
                    ` : ''}
                    <label class="loot-recipient-select">
                        <span>Receber</span>
                        <select id="lootRecipient-${index}">
                            ${renderLootRecipientOptions(recipients, defaultRecipient?.id)}
                        </select>
                    </label>
                </article>
            `;
        }).join('') : '<p class="loot-empty">Esta criatura não possui itens de saque.</p>';

        dialog.innerHTML = `
            <div class="session-dialog-header">
                <div><small class="loot-dialog-kicker">SAQUE ROLADO</small><h2>${escapeLootHtml(combatant.name)}</h2></div>
                <button type="button" class="session-close" onclick="closeMonsterLootModal()" aria-label="Fechar">×</button>
            </div>
            <p class="loot-dialog-note">As quantidades foram roladas uma única vez e permanecerão salvas. Escolha quem recebe cada resultado.</p>
            ${rewardSection}
            <section class="loot-items-section">
                <div class="loot-section-heading"><div><small>ITENS</small><strong>${state.items.length} resultados</strong></div></div>
                <div class="loot-results">${itemSection}</div>
            </section>
            <div class="session-dialog-actions">
                <button type="button" class="session-secondary" onclick="closeMonsterLootModal()">Cancelar</button>
                <button type="button" class="session-primary" onclick='confirmMonsterLootCollection(${combatantId})'>Distribuir saque</button>
            </div>
        `;

        modal.append(dialog);
        document.body.append(modal);
    }

    function closeMonsterLootModal() {
        document.getElementById('monsterLootModal')?.remove();
    }

    function addCrownsToRecipient(recipient, amount) {
        if (!recipient || amount <= 0) return;
        recipient.inventory ||= [];
        const crownDefinition = resolveLootItemDefinition('Coroa');
        const crown = recipient.inventory.find(item => item.id === 'coroa');

        if (crown) {
            crown.moneyValue = Math.max(0, Number(crown.moneyValue) || 0) + amount;
        } else {
            recipient.inventory.push({ ...crownDefinition, id: 'coroa', quantity: 1, moneyValue: amount });
        }
    }

    function addLootItemToRecipient(recipient, name, quantity, sourceName) {
        if (!recipient || quantity <= 0) return null;
        recipient.inventory ||= [];
        const definition = resolveLootItemDefinition(name);
        const existing = recipient.inventory.find(item => String(item.id) === String(definition.id));

        if (existing) {
            existing.quantity = Math.max(0, Number(existing.quantity) || 0) + quantity;
        } else {
            recipient.inventory.push({
                ...definition,
                quantity,
                lootSource: sourceName
            });
        }

        return definition;
    }

    function syncVisibleLootInventory(recipients) {
        const owner = global.getCharacterCollectionOwner?.();
        const updatedOwner = recipients.find(recipient => String(recipient.id) === String(owner?.id));
        if (!updatedOwner || typeof inventory === 'undefined') return;
        inventory = cloneLootValue(updatedOwner.inventory, []);
    }

    function buildLootHistoryDetail(state) {
        const lines = [];
        if (state.crownDistributions.length) {
            lines.push(`Coroas: ${state.crownDistributions.map(distribution =>
                `${distribution.recipientName} +${distribution.amount}`
            ).join(', ')}`);
        }
        if (normalizeLootCollectionAmount(state.unassignedCrowns) > 0) {
            lines.push(`Coroas não distribuídas: ${normalizeLootCollectionAmount(state.unassignedCrowns)} · nenhum destinatário selecionado`);
        }
        state.itemDistributions.forEach(distribution => {
            if (distribution.status === 'collected') {
                lines.push(`${distribution.itemName}: ${distribution.quantity} → ${distribution.recipientName} · ${distribution.rollDetail}`);
            } else {
                lines.push(`${distribution.itemName}: ${distribution.reason} · ${distribution.rollDetail}`);
            }
        });
        return lines.join('\n');
    }

    function confirmMonsterLootCollection(combatantId) {
        const entries = typeof combatants !== 'undefined' ? combatants : [];
        const combatant = entries.find(entry => String(entry.id) === String(combatantId));
        const state = combatant?.lootCollection;
        const recipients = getLootRecipients();

        if (!combatant || !canCollectMonsterLoot(combatant) || !state || state.status === 'collected') {
            closeMonsterLootModal();
            global.showToast?.('Este saque não está mais disponível.');
            return;
        }

        const crownRecipientIds = [...document.querySelectorAll('input[name="lootCrownRecipient"]:checked')]
            .map(input => input.value);
        const collectedCrownsAmount = normalizeLootCollectionAmount(
            document.getElementById('lootCrownsAmount')?.value,
            state.rewardCrowns
        );

        const crownPlan = divideCrowns(collectedCrownsAmount, crownRecipientIds)
            .map(distribution => {
                const recipient = recipients.find(entry => String(entry.id) === distribution.recipientId);
                return recipient ? { ...distribution, recipient } : null;
            })
            .filter(Boolean);
        const itemPlan = state.items.map((item, index) => {
            const selectedQuantity = normalizeLootCollectionAmount(
                document.getElementById(`lootQuantity-${index}`)?.value,
                item.quantity
            );
            if (selectedQuantity <= 0) {
                return {
                    item,
                    quantity: 0,
                    status: 'missed',
                    reason: normalizeLootCollectionAmount(item.quantity) > 0
                        ? 'Quantidade definida como zero'
                        : 'Não encontrado na rolagem'
                };
            }
            if (item.difficulty > 0 && !document.getElementById(`lootDifficulty-${index}`)?.checked) {
                return { item, quantity: 0, status: 'skipped', reason: `Teste ND ${item.difficulty} não confirmado` };
            }
            const recipientId = document.getElementById(`lootRecipient-${index}`)?.value;
            const recipient = recipients.find(entry => String(entry.id) === String(recipientId));
            return recipient
                ? { item, quantity: selectedQuantity, status: 'collected', recipient }
                : { item, quantity: 0, status: 'skipped', reason: 'Destinatário não definido' };
        });
        const involvedRecipients = [...new Map([
            ...crownPlan.map(plan => plan.recipient),
            ...itemPlan.filter(plan => plan.recipient).map(plan => plan.recipient)
        ].map(recipient => [String(recipient.id), recipient])).values()];

        const mutate = () => {
            crownPlan.forEach(plan => addCrownsToRecipient(plan.recipient, plan.amount));
            itemPlan.forEach(plan => {
                if (plan.status === 'collected') {
                    addLootItemToRecipient(plan.recipient, plan.item.name, plan.quantity, combatant.name);
                }
            });

            state.status = 'collected';
            state.collectedAt = new Date().toISOString();
            state.collectedCrownsAmount = collectedCrownsAmount;
            state.unassignedCrowns = crownRecipientIds.length ? 0 : collectedCrownsAmount;
            state.crownDistributions = crownPlan.map(plan => ({
                recipientId: plan.recipient.id,
                recipientName: plan.recipient.name,
                amount: plan.amount
            }));
            state.itemDistributions = itemPlan.map(plan => ({
                itemName: plan.item.name,
                rolledQuantity: normalizeLootCollectionAmount(plan.item.quantity),
                quantity: plan.status === 'collected' ? plan.quantity : 0,
                recipientId: plan.recipient?.id || null,
                recipientName: plan.recipient?.name || '',
                status: plan.status,
                reason: plan.reason || '',
                difficulty: plan.item.difficulty || 0,
                rollDetail: plan.item.rollDetail
            }));
            combatant.lootCollection = state;

            syncVisibleLootInventory(involvedRecipients);
            global.savePlayersToStorage?.();
            global.persistCharacterCollections?.();
            global.renderInventory?.();
            global.renderList?.(false);
        };
        const participantMetadata = [
            { id: combatant.id, name: combatant.name },
            ...involvedRecipients.map(recipient => ({ id: recipient.id, name: recipient.name }))
        ];
        const label = `Saque coletado: ${combatant.name}`;
        const metadata = {
            type: 'loot',
            source: { id: combatant.id, name: combatant.name },
            participants: participantMetadata
        };
        const detail = () => buildLootHistoryDetail(state);

        if (typeof global.trackCombatAction === 'function') {
            global.trackCombatAction(label, mutate, detail, metadata);
        } else {
            mutate();
            global.addCombatHistoryEntry?.(label, detail(), metadata);
        }

        closeMonsterLootModal();
        const summary = getCollectedLootSummary(state);
        global.showToast?.(`🎁 ${combatant.name}: ${summary.items} itens e ${summary.crowns} Coroas distribuídos.`);
    }

    function getCollectedLootReport(combatantEntries) {
        const collections = (Array.isArray(combatantEntries) ? combatantEntries : [])
            .filter(combatant => combatant?.lootCollection?.status === 'collected')
            .map(combatant => ({
                monsterId: combatant.id,
                monsterName: combatant.name,
                collectedAt: combatant.lootCollection.collectedAt,
                crowns: cloneLootValue(combatant.lootCollection.crownDistributions, []),
                items: cloneLootValue(combatant.lootCollection.itemDistributions, [])
            }));
        const totalCrowns = collections.reduce((total, collection) => total + collection.crowns.reduce(
            (sum, distribution) => sum + Math.max(0, Number(distribution.amount) || 0),
            0
        ), 0);
        const totalItems = collections.reduce((total, collection) => total + collection.items
            .filter(item => item.status === 'collected')
            .reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0), 0);

        return { collections, totalCrowns, totalItems };
    }

    global.lootRewards = Object.freeze({
        normalizeLootName,
        parseMonsterReward,
        parseMonsterLootLine,
        rollMonsterLootEntry,
        rollMonsterLoot,
        divideCrowns,
        normalizeLootCollectionAmount,
        resolveLootItemDefinition,
        ensureMonsterLootState,
        getCollectedLootReport,
        canCollectMonsterLoot
    });
    global.renderCombatantLootPanel = renderCombatantLootPanel;
    global.openMonsterLootModal = openMonsterLootModal;
    global.closeMonsterLootModal = closeMonsterLootModal;
    global.confirmMonsterLootCollection = confirmMonsterLootCollection;
    global.getCollectedLootReport = getCollectedLootReport;
})(typeof window !== 'undefined' ? window : globalThis);
