(function initializeItemUseAutomation(global) {
    'use strict';

    const TARGETED_ITEMS = new Set([
        'adesivoalquimico',
        'cloroformio',
        'podecoagulacao',
        'fissstech',
        'alucinogeno',
        'ervasentorpecentes',
        'elixirdepantagran',
        'pocaodeperfume',
        'inflamador',
        'fluidoesterilizante',
        'soprodesucubo',
        'lagrimasdetalgar',
        'podelua',
        'podedimeritio',
        'bafodedragao',
        'samun',
        'solucaoacida',
        'pobasico',
        'venenonegro',
        'furiadebredan',
        'saisaromaticos',
        'lagrimasdeesposas',
        'fogodazerikania',
        'bombadeestilhacos',
        'tumbadeadda',
        'tintainvisivel',
        'amigodoenvenenador'
    ]);

    const MULTI_TARGET_ITEMS = new Set([
        'adesivoalquimico',
        'lagrimasdetalgar',
        'podelua',
        'podedimeritio',
        'bafodedragao',
        'solucaoacida',
        'furiadebredan',
        'fogodazerikania',
        'bombadeestilhacos'
    ]);

    const INSTANT_ITEMS = new Set([
        'solucaoacida', 'pobasico', 'venenonegro', 'furiadebredan',
        'saisaromaticos', 'lagrimasdeesposas', 'fogodazerikania',
        'bombadeestilhacos', 'tumbadeadda', 'tintainvisivel',
        'amigodoenvenenador'
    ]);

    const NARRATIVE_ITEMS = new Set([
        'tumbadeadda', 'tintainvisivel', 'amigodoenvenenador'
    ]);

    const DAMAGE_ITEMS = Object.freeze({
        solucaoacida: Object.freeze({ dice: '4d6', damageType: 'acid', area: 'cone de 3m' }),
        furiadebredan: Object.freeze({ dice: '3d6', damageType: 'fire', armorDamage: 3, area: 'raio de 4m' }),
        fogodazerikania: Object.freeze({ dice: '8d6', damageType: 'fire', armorDamage: 8, area: 'círculo de 5m' }),
        bombadeestilhacos: Object.freeze({ dice: '5d6', damageType: 'physical', armorDamage: 5, area: 'área da explosão' })
    });

    const ITEM_NAMES = Object.freeze({
        solucaoacida: 'Solução Ácida',
        pobasico: 'Pó Básico',
        venenonegro: 'Veneno Negro',
        furiadebredan: 'Fúria de Bredan',
        saisaromaticos: 'Sais Aromáticos',
        lagrimasdeesposas: 'Lágrimas de Esposas',
        fogodazerikania: 'Fogo da Zerikânia',
        bombadeestilhacos: 'Bomba de Estilhaços',
        tumbadeadda: 'Tumba de Adda',
        tintainvisivel: 'Tinta Invisível',
        amigodoenvenenador: 'Amigo do Envenenador'
    });

    const OWNER_FIRST_ITEMS = new Set([
        'podecoagulacao',
        'fissstech',
        'ervasentorpecentes',
        'elixirdepantagran',
        'fluidoesterilizante'
    ]);

    let pendingUse = null;
    let pendingExecution = null;
    let currentTargetOptions = null;

    function escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function clone(value, fallback = null) {
        try {
            return JSON.parse(JSON.stringify(value ?? fallback));
        } catch {
            return fallback;
        }
    }

    function getCombatants() {
        return typeof combatants !== 'undefined' && Array.isArray(combatants) ? combatants : [];
    }

    function isEliminated(combatant) {
        return (combatant.type === 'monster' && Number(combatant.hpCurrent) <= 0) ||
            (combatant.type === 'player' && Number(combatant.deathSaves?.failures) >= 3);
    }

    function getEligibleTargets() {
        return getCombatants().filter(combatant => !isEliminated(combatant));
    }

    function getTargetById(id) {
        return getCombatants().find(combatant => String(combatant.id) === String(id)) || null;
    }

    function getItemRollMode() {
        try {
            return JSON.parse(localStorage.getItem('dnd_app_preferences') || '{}').rollModes?.items || 'manual';
        } catch {
            return 'manual';
        }
    }

    function rollItemDie(sides, label) {
        if (getItemRollMode() === 'auto') {
            return Math.floor(Math.random() * sides) + 1;
        }

        const raw = global.prompt(`${label}\nInforme o resultado de 1d${sides} (1 a ${sides}).`, '');
        if (raw === null) return null;
        const value = Number.parseInt(raw, 10);
        if (!Number.isInteger(value) || value < 1 || value > sides) {
            global.showToast?.(`Informe um resultado entre 1 e ${sides}.`);
            return null;
        }
        return value;
    }

    function getFieldId(prefix, targetId = '') {
        return `${prefix}-${String(targetId).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    }

    function getItemDefinition(itemId) {
        if (typeof predefinedItems === 'undefined' || !Array.isArray(predefinedItems)) return null;
        return predefinedItems.find(item => item.id === itemId) || null;
    }

    function getToleranceTotal(target) {
        const model = global.characterSheetModel;
        if (!model || !target) return 0;
        const breakdown = model.getCharacterSkillBreakdown?.(
            'tolerance',
            target.skills,
            target.attributes
        );
        return Number(breakdown?.total) || 0;
    }

    function closeInventoryItemTargetModal() {
        document.getElementById('inventoryItemTargetModal')?.remove();
        pendingUse = null;
    }

    function getDefaultTargetId(itemId, owner, multiple = false) {
        const eligible = getEligibleTargets();
        const ownerTarget = eligible.find(target => String(target.id) === String(owner?.id));
        const selectedTarget = eligible.find(target => (
            typeof selectedId !== 'undefined' && String(target.id) === String(selectedId)
        ));

        if (multiple) {
            return selectedTarget && String(selectedTarget.id) !== String(owner?.id)
                ? String(selectedTarget.id)
                : '';
        }

        if (OWNER_FIRST_ITEMS.has(itemId) && ownerTarget) return String(ownerTarget.id);
        if (selectedTarget) return String(selectedTarget.id);
        if (ownerTarget) return String(ownerTarget.id);
        return eligible[0] ? String(eligible[0].id) : '';
    }

    function getSelectedTargetIds() {
        return pendingUse ? [...pendingUse.selectedIds] : [];
    }

    function renderTargetSpecificOptions() {
        const container = document.getElementById('inventoryItemTargetOptions');
        if (!container || !pendingUse) return;

        const selectedTargets = getSelectedTargetIds().map(getTargetById).filter(Boolean);
        const target = selectedTargets[0];
        const itemId = pendingUse.item.id;
        const fragments = [];

        const damageRule = DAMAGE_ITEMS[itemId];
        if (damageRule) {
            fragments.push(`
                <div class="item-use-rule-note">
                    <strong>Dano em ${escapeHtml(damageRule.area)}</strong>
                    <span>Informe o total de ${escapeHtml(damageRule.dice)} uma vez. O aplicativo abrirá o fluxo de local e dano para cada alvo marcado.</span>
                </div>
                <label class="item-use-select-field">
                    <span>Dano total de ${escapeHtml(damageRule.dice)}</span>
                    <input id="inventoryItemDamageTotal" type="number" min="0" inputmode="numeric" placeholder="Resultado total dos dados">
                </label>
            `);
        }

        if (itemId === 'solucaoacida') {
            fragments.push(`
                <label class="item-use-select-field">
                    <span>Ablação total de 1d6</span>
                    <input id="inventoryItemAblationTotal" type="number" min="1" max="6" inputmode="numeric" placeholder="1 a 6">
                    <small>Será aplicada às armaduras equipadas e à arma ativa de cada alvo.</small>
                </label>
            `);
        }

        if (itemId === 'pobasico' && target) {
            const tornStomachs = (target.criticalWounds || []).filter(wound => (
                wound.woundId === 'difficult-torn-stomach' && (wound.state || 'normal') === 'normal'
            ));
            const acidEffects = (target.effects || []).filter(effect => (
                effect.type === 'item' && effect.id === 'solucaoacida'
            ));
            fragments.push(`
                <fieldset class="item-use-mode-field">
                    <legend>Uso do Pó Básico</legend>
                    <label class="${acidEffects.length ? '' : 'is-disabled'}">
                        <input type="radio" name="basicPowderMode" value="acid" ${acidEffects.length ? 'checked' : 'disabled'}>
                        Neutralizar Solução Ácida ${acidEffects.length ? '' : '(sem efeito ácido ativo)'}
                    </label>
                    <label class="${tornStomachs.length ? '' : 'is-disabled'}">
                        <input type="radio" name="basicPowderMode" value="stomach" ${!acidEffects.length && tornStomachs.length ? 'checked' : ''} ${tornStomachs.length ? '' : 'disabled'}>
                        Tratar Estômago Rasgado ${tornStomachs.length ? '' : '(sem ferimento elegível)'}
                    </label>
                </fieldset>
                ${!acidEffects.length && !tornStomachs.length ? `
                    <div class="item-use-rule-note is-warning">
                        <strong>Nenhum efeito compatível</strong>
                        <span>Este alvo não possui Solução Ácida ativa nem Estômago Rasgado em estado normal.</span>
                    </div>
                ` : ''}
            `);
        }

        if (itemId === 'venenonegro' && target) {
            const tolerance = getToleranceTotal(target);
            fragments.push(`
                <div class="item-use-rule-note">
                    <strong>Teste de Tolerância ND 18</strong>
                    <span>${escapeHtml(target.name)} soma automaticamente ${tolerance >= 0 ? '+' : ''}${tolerance} ao resultado natural.</span>
                </div>
                ${getItemRollMode() === 'auto' ? `
                    <p class="item-use-auto-roll">🎲 O 1d20 será rolado automaticamente conforme as configurações de itens.</p>
                ` : `
                    <label class="item-use-select-field">
                        <span>Resultado natural do 1d20</span>
                        <input id="inventoryItemBlackVenomRoll" type="number" min="1" max="20" inputmode="numeric" placeholder="1 a 20">
                    </label>
                `}
            `);
        }

        if (itemId === 'saisaromaticos' && target) {
            const removable = (target.effects || []).filter(effect => (
                effect.type === 'condition' && ['😵', '💫', '🚫'].includes(effect.id)
            ));
            fragments.push(`
                <div class="item-use-rule-note ${removable.length ? '' : 'is-warning'}">
                    <strong>Despertar imediatamente</strong>
                    <span>${removable.length
                        ? `Será removido: ${escapeHtml(removable.map(effect => effect.name || effect.id).join(', '))}.`
                        : 'Este alvo não está Inconsciente, Atordoado ou Incapacitado.'}</span>
                </div>
            `);
        }

        if (itemId === 'lagrimasdeesposas' && target) {
            const intoxicated = (target.effects || []).some(effect => (
                (effect.type === 'condition' && effect.id === '🍷') ||
                (effect.type === 'item' && (
                    effect.automation?.linkedCondition === '🍷' ||
                    (effect.automation?.linkedConditions || []).includes('🍷')
                ))
            ));
            fragments.push(`
                <div class="item-use-rule-note ${intoxicated ? '' : 'is-warning'}">
                    <strong>Remover intoxicação</strong>
                    <span>${intoxicated ? 'O alvo ficará sóbrio imediatamente.' : 'Este alvo não possui intoxicação ativa.'}</span>
                </div>
            `);
        }

        if (itemId === 'furiadebredan') {
            fragments.push(`
                <label class="item-use-select-field">
                    <span>ND de Tolerância contra Chamas</span>
                    <input id="inventoryItemFlameDifficulty" type="number" min="1" inputmode="numeric" value="16">
                    <small>O ND pode ser ajustado pelo mestre antes da aplicação.</small>
                </label>
                ${getItemRollMode() === 'auto' ? `
                    <p class="item-use-auto-roll">🎲 Um teste de Tolerância será rolado automaticamente para cada alvo.</p>
                ` : selectedTargets.map(current => `
                    <label class="item-use-select-field">
                        <span>1d20 de ${escapeHtml(current.name)} · Tolerância ${getToleranceTotal(current) >= 0 ? '+' : ''}${getToleranceTotal(current)}</span>
                        <input id="${getFieldId('inventoryItemFuryRoll', current.id)}" type="number" min="1" max="20" inputmode="numeric" placeholder="1 a 20">
                    </label>
                `).join('')}
            `);
        }

        if (itemId === 'fogodazerikania') {
            fragments.push(`
                <div class="item-use-rule-note">
                    <strong>Em Chamas por 1d10 turnos</strong>
                    <span>A duração será definida individualmente para cada alvo atingido.</span>
                </div>
                ${getItemRollMode() === 'auto' ? `
                    <p class="item-use-auto-roll">🎲 A duração será rolada automaticamente para cada alvo.</p>
                ` : selectedTargets.map(current => `
                    <label class="item-use-select-field">
                        <span>1d10 de duração em ${escapeHtml(current.name)}</span>
                        <input id="${getFieldId('inventoryItemZerrikanianDuration', current.id)}" type="number" min="1" max="10" inputmode="numeric" placeholder="1 a 10">
                    </label>
                `).join('')}
            `);
        }

        if (itemId === 'fissstech' && target) {
            const tolerance = getToleranceTotal(target);
            fragments.push(`
                <div class="item-use-rule-note">
                    <strong>Teste de dependência</strong>
                    <span>${escapeHtml(target.name)} fará Tolerância ND 20. O bônus total de Tolerância (${tolerance >= 0 ? '+' : ''}${tolerance}) será somado automaticamente.</span>
                </div>
                ${getItemRollMode() === 'auto' ? `
                    <p class="item-use-auto-roll">🎲 O 1d20 será rolado automaticamente conforme as configurações de itens.</p>
                ` : `
                    <label class="item-use-select-field">
                        <span>Resultado natural do 1d20</span>
                        <input id="inventoryItemToleranceRoll" type="number" min="1" max="20" inputmode="numeric" placeholder="1 a 20">
                        <small>Resultado final: 1d20 + ${tolerance} contra ND 20.</small>
                    </label>
                `}
            `);
        }

        if (itemId === 'ervasentorpecentes' && target) {
            const wounds = (target.criticalWounds || []).filter(wound => (
                (wound.state || 'normal') === 'normal' &&
                !global.getCriticalWoundDefinition?.(wound.woundId)?.cannotStabilize
            ));
            fragments.push(wounds.length ? `
                <label class="item-use-select-field">
                    <span>Ferimento crítico que será estabilizado</span>
                    <select id="inventoryItemWoundSelect">
                        ${wounds.map(wound => {
                            const definition = global.getCriticalWoundDefinition?.(wound.woundId);
                            return `<option value="${escapeHtml(wound.instanceId)}">${escapeHtml(definition?.name || wound.woundId)}</option>`;
                        }).join('')}
                    </select>
                </label>
            ` : `
                <div class="item-use-rule-note is-warning">
                    <strong>Nenhum ferimento estabilizável</strong>
                    <span>O Alucinado ainda será aplicado por 20 rodadas, mas não há ferimento crítico normal para estabilizar.</span>
                </div>
            `);
        }

        if (itemId === 'soprodesucubo') {
            fragments.push(`
                <fieldset class="item-use-mode-field">
                    <legend>Forma de aplicação</legend>
                    <label><input type="radio" name="succubusMode" value="skin" checked> Na pele · +2 em Sedução</label>
                    <label><input type="radio" name="succubusMode" value="drink"> Na bebida · −5 em Resistir à Sedução</label>
                </fieldset>
            `);
        }

        container.innerHTML = fragments.join('');
    }

    function selectInventoryItemUseTarget(targetId, checked) {
        if (!pendingUse) return;
        const id = String(targetId);

        if (pendingUse.multiple) {
            if (checked) pendingUse.selectedIds.add(id);
            else pendingUse.selectedIds.delete(id);
        } else {
            pendingUse.selectedIds = new Set([id]);
            document.querySelectorAll('#inventoryItemTargetModal input[name="inventoryItemTarget"]')
                .forEach(input => { input.checked = String(input.value) === id; });
        }

        renderTargetSpecificOptions();
    }

    function setAllInventoryItemUseTargets(checked) {
        if (!pendingUse?.multiple) return;
        const ids = getEligibleTargets().map(target => String(target.id));
        pendingUse.selectedIds = new Set(checked ? ids : []);
        document.querySelectorAll('#inventoryItemTargetModal input[name="inventoryItemTarget"]')
            .forEach(input => { input.checked = checked; });
        renderTargetSpecificOptions();
    }

    function buildExecutionOptions(itemId, targetIds) {
        const optionsByTarget = {};

        targetIds.forEach(targetId => {
            optionsByTarget[targetId] = {};
        });

        const damageRule = DAMAGE_ITEMS[itemId];
        if (damageRule) {
            const damageInput = document.getElementById('inventoryItemDamageTotal');
            const damageTotal = Number.parseInt(damageInput?.value, 10);
            if (!Number.isInteger(damageTotal) || damageTotal <= 0) {
                global.showToast?.(`Informe o dano total de ${damageRule.dice}.`);
                damageInput?.focus();
                return null;
            }
            targetIds.forEach(targetId => {
                optionsByTarget[targetId].damageTotal = damageTotal;
                optionsByTarget[targetId].damageDice = damageRule.dice;
                optionsByTarget[targetId].damageType = damageRule.damageType;
                optionsByTarget[targetId].armorDamage = damageRule.armorDamage || 0;
            });
        }

        if (itemId === 'solucaoacida') {
            const ablationInput = document.getElementById('inventoryItemAblationTotal');
            const ablationTotal = Number.parseInt(ablationInput?.value, 10);
            if (!Number.isInteger(ablationTotal) || ablationTotal < 1 || ablationTotal > 6) {
                global.showToast?.('Informe o resultado de ablação de 1d6, entre 1 e 6.');
                ablationInput?.focus();
                return null;
            }
            targetIds.forEach(targetId => {
                optionsByTarget[targetId].ablationTotal = ablationTotal;
            });
        }

        if (itemId === 'pobasico') {
            const mode = document.querySelector('input[name="basicPowderMode"]:checked')?.value || '';
            if (!mode) {
                global.showToast?.('Este alvo não possui um efeito que possa ser tratado pelo Pó Básico.');
                return null;
            }
            optionsByTarget[targetIds[0]].basicPowderMode = mode;
        }

        if (itemId === 'venenonegro') {
            const target = getTargetById(targetIds[0]);
            const input = document.getElementById('inventoryItemBlackVenomRoll');
            const naturalRoll = getItemRollMode() === 'auto'
                ? rollItemDie(20, 'Veneno Negro — Tolerância ND 18')
                : Number(input?.value);
            if (!Number.isInteger(naturalRoll) || naturalRoll < 1 || naturalRoll > 20) {
                global.showToast?.('Informe o resultado natural do 1d20, entre 1 e 20.');
                input?.focus();
                return null;
            }
            const toleranceTotal = getToleranceTotal(target);
            optionsByTarget[targetIds[0]].toleranceTest = {
                naturalRoll,
                skillTotal: toleranceTotal,
                result: naturalRoll + toleranceTotal,
                difficulty: 18,
                passed: naturalRoll + toleranceTotal >= 18
            };
        }

        if (itemId === 'saisaromaticos') {
            const target = getTargetById(targetIds[0]);
            const eligible = (target?.effects || []).some(effect => (
                effect.type === 'condition' && ['😵', '💫', '🚫'].includes(effect.id)
            ));
            if (!eligible) {
                global.showToast?.('O alvo não possui uma condição que os Sais Aromáticos possam remover.');
                return null;
            }
        }

        if (itemId === 'lagrimasdeesposas') {
            const target = getTargetById(targetIds[0]);
            const eligible = (target?.effects || []).some(effect => (
                (effect.type === 'condition' && effect.id === '🍷') ||
                (effect.type === 'item' && (
                    effect.automation?.linkedCondition === '🍷' ||
                    (effect.automation?.linkedConditions || []).includes('🍷')
                ))
            ));
            if (!eligible) {
                global.showToast?.('O alvo não possui intoxicação ativa para remover.');
                return null;
            }
        }

        if (itemId === 'furiadebredan') {
            const difficultyInput = document.getElementById('inventoryItemFlameDifficulty');
            const difficulty = Number.parseInt(difficultyInput?.value, 10);
            if (!Number.isInteger(difficulty) || difficulty < 1) {
                global.showToast?.('Informe um ND válido para o teste contra Chamas.');
                difficultyInput?.focus();
                return null;
            }
            for (const targetId of targetIds) {
                const target = getTargetById(targetId);
                const input = document.getElementById(getFieldId('inventoryItemFuryRoll', targetId));
                const naturalRoll = getItemRollMode() === 'auto'
                    ? rollItemDie(20, `Fúria de Bredan — Tolerância de ${target?.name || 'alvo'}`)
                    : Number(input?.value);
                if (!Number.isInteger(naturalRoll) || naturalRoll < 1 || naturalRoll > 20) {
                    global.showToast?.(`Informe o 1d20 de ${target?.name || 'cada alvo'}, entre 1 e 20.`);
                    input?.focus();
                    return null;
                }
                const toleranceTotal = getToleranceTotal(target);
                optionsByTarget[targetId].toleranceTest = {
                    naturalRoll,
                    skillTotal: toleranceTotal,
                    result: naturalRoll + toleranceTotal,
                    difficulty,
                    passed: naturalRoll + toleranceTotal >= difficulty
                };
            }
        }

        if (itemId === 'fogodazerikania') {
            for (const targetId of targetIds) {
                const target = getTargetById(targetId);
                const input = document.getElementById(getFieldId('inventoryItemZerrikanianDuration', targetId));
                const duration = getItemRollMode() === 'auto'
                    ? rollItemDie(10, `Fogo da Zerikânia — duração em ${target?.name || 'alvo'}`)
                    : Number(input?.value);
                if (!Number.isInteger(duration) || duration < 1 || duration > 10) {
                    global.showToast?.(`Informe a duração de 1d10 para ${target?.name || 'cada alvo'}, entre 1 e 10.`);
                    input?.focus();
                    return null;
                }
                optionsByTarget[targetId].flameDuration = duration;
            }
        }

        if (itemId === 'pocaodeperfume') {
            const hours = rollItemDie(10, 'Poção de Perfume — duração');
            if (hours === null) return null;
            targetIds.forEach(targetId => {
                optionsByTarget[targetId] = { hours, duration: hours * 60 };
            });
        }

        if (itemId === 'fissstech') {
            const target = getTargetById(targetIds[0]);
            const manualInput = document.getElementById('inventoryItemToleranceRoll');
            const naturalRoll = getItemRollMode() === 'auto'
                ? rollItemDie(20, 'Fisstech — teste de Tolerância ND 20')
                : Number(manualInput?.value);
            if (!Number.isInteger(naturalRoll) || naturalRoll < 1 || naturalRoll > 20) {
                global.showToast?.('Informe o resultado natural do 1d20, entre 1 e 20.');
                manualInput?.focus();
                return null;
            }
            const toleranceTotal = getToleranceTotal(target);
            optionsByTarget[targetIds[0]] = {
                toleranceNaturalRoll: naturalRoll,
                toleranceTotal,
                toleranceResult: naturalRoll + toleranceTotal,
                tolerancePassed: naturalRoll + toleranceTotal >= 20
            };
        }

        if (itemId === 'ervasentorpecentes') {
            optionsByTarget[targetIds[0]].woundInstanceId =
                document.getElementById('inventoryItemWoundSelect')?.value || '';
        }

        if (itemId === 'soprodesucubo') {
            optionsByTarget[targetIds[0]].succubusMode =
                document.querySelector('input[name="succubusMode"]:checked')?.value || 'skin';
        }

        return optionsByTarget;
    }

    function confirmInventoryItemUseTargets() {
        if (!pendingUse) return;
        const targetIds = getSelectedTargetIds();
        if (!targetIds.length) {
            global.showToast?.('Selecione ao menos um alvo.');
            return;
        }

        const optionsByTarget = buildExecutionOptions(pendingUse.item.id, targetIds);
        if (!optionsByTarget) return;

        const callback = pendingUse.onConfirm;
        pendingExecution = {
            itemId: pendingUse.item.id,
            targetIds,
            optionsByTarget
        };
        closeInventoryItemTargetModal();
        callback();
    }

    function beginInventoryItemUseFlow(item, owner, onConfirm) {
        if (!TARGETED_ITEMS.has(item?.id) || typeof onConfirm !== 'function') return false;

        if (NARRATIVE_ITEMS.has(item.id)) {
            const confirmUse = () => {
                pendingExecution = {
                    itemId: item.id,
                    targetIds: owner?.id != null ? [String(owner.id)] : [],
                    optionsByTarget: {},
                    narrative: true
                };
                onConfirm();
            };
            const message = item.id === 'tumbadeadda'
                ? 'Registra o uso para preservar comidas ou corpos. A duração de 1d10 dias continua sendo definida na mesa.'
                : item.id === 'tintainvisivel'
                    ? 'Registra a preparação ou revelação de uma mensagem com Tinta Invisível.'
                    : 'Registra o uso do Amigo do Envenenador e o lembrete do teste de Alquimia ND 24.';
            if (typeof global.openSessionConfirm === 'function') {
                global.openSessionConfirm({
                    title: `Usar ${item.name}?`,
                    message,
                    confirmLabel: 'Usar e registrar',
                    onConfirm: confirmUse
                });
            } else if (global.confirm?.(`${item.name}\n\n${message}`)) {
                confirmUse();
            }
            return true;
        }

        const targets = getEligibleTargets();
        if (!targets.length) {
            global.showToast?.('Adicione ao combate ao menos um alvo válido antes de usar este item.');
            return true;
        }

        const multiple = MULTI_TARGET_ITEMS.has(item.id);
        const defaultTargetId = getDefaultTargetId(item.id, owner, multiple);
        pendingUse = {
            item,
            owner,
            onConfirm,
            multiple,
            selectedIds: new Set(defaultTargetId ? [defaultTargetId] : [])
        };

        document.getElementById('inventoryItemTargetModal')?.remove();
        const modal = document.createElement('div');
        modal.id = 'inventoryItemTargetModal';
        modal.className = 'session-overlay item-use-target-overlay';
        modal.addEventListener('click', event => {
            if (event.target === modal) closeInventoryItemTargetModal();
        });
        modal.innerHTML = `
            <section class="session-dialog item-use-target-dialog" role="dialog" aria-modal="true" aria-labelledby="inventoryItemTargetTitle">
                <div class="session-dialog-header">
                    <div>
                        <small>USAR ITEM</small>
                        <h2 id="inventoryItemTargetTitle">${escapeHtml(item.name)}</h2>
                    </div>
                    <button type="button" class="session-close" data-item-use-close aria-label="Fechar">×</button>
                </div>
                <p>${multiple ? 'Marque todos os participantes atingidos.' : 'Escolha quem receberá ou renovará o efeito.'}</p>
                ${multiple ? `
                    <div class="item-use-target-tools">
                        <button type="button" data-item-use-all>Selecionar todos</button>
                        <button type="button" data-item-use-none>Limpar</button>
                    </div>
                ` : ''}
                <div class="item-use-target-list" role="group" aria-label="Alvos disponíveis">
                    ${targets.map(target => {
                        const id = String(target.id);
                        const checked = pendingUse.selectedIds.has(id);
                        return `
                            <label class="item-use-target-option">
                                <input type="${multiple ? 'checkbox' : 'radio'}" name="inventoryItemTarget" value="${escapeHtml(id)}" ${checked ? 'checked' : ''}>
                                <span>
                                    <strong>${escapeHtml(target.name)}</strong>
                                    <small>${target.type === 'monster' ? 'Inimigo' : 'Personagem'} · HP ${Math.max(0, Number(target.hpCurrent) || 0)}/${Math.max(0, Number(target.hpMax) || 0)}</small>
                                </span>
                            </label>
                        `;
                    }).join('')}
                </div>
                <div id="inventoryItemTargetOptions"></div>
                <div class="session-dialog-actions">
                    <button type="button" class="session-secondary" data-item-use-cancel>Cancelar</button>
                    <button type="button" class="session-primary" data-item-use-confirm>Aplicar e consumir</button>
                </div>
            </section>
        `;

        document.body.appendChild(modal);
        modal.querySelectorAll('input[name="inventoryItemTarget"]').forEach(input => {
            input.addEventListener('change', () => selectInventoryItemUseTarget(input.value, input.checked));
        });
        modal.querySelector('[data-item-use-close]')?.addEventListener('click', closeInventoryItemTargetModal);
        modal.querySelector('[data-item-use-cancel]')?.addEventListener('click', closeInventoryItemTargetModal);
        modal.querySelector('[data-item-use-confirm]')?.addEventListener('click', confirmInventoryItemUseTargets);
        modal.querySelector('[data-item-use-all]')?.addEventListener('click', () => setAllInventoryItemUseTargets(true));
        modal.querySelector('[data-item-use-none]')?.addEventListener('click', () => setAllInventoryItemUseTargets(false));
        renderTargetSpecificOptions();
        modal.querySelector('input[name="inventoryItemTarget"]:checked')?.focus();
        return true;
    }

    function getCondition(target, icon) {
        return (target?.effects || []).find(effect => effect.type === 'condition' && effect.id === icon) || null;
    }

    function ensureStackCondition(target, icon, delta, maximum = 5) {
        if (!target) return null;
        target.effects ||= [];
        let effect = getCondition(target, icon);
        const next = Math.max(0, Math.min(maximum, (Number(effect?.stacks) || 0) + delta));

        if (next <= 0) {
            target.effects = target.effects.filter(current => current !== effect);
            return null;
        }

        if (!effect) effect = global.addAutomationCondition?.(target, icon) || null;
        if (!effect) return null;
        effect.stacks = next;
        effect.maxStacks = maximum;
        effect.remainingTurns = 0;
        effect.initialTurns = 0;
        return effect;
    }

    function syncWithdrawalExhaustion(target) {
        const withdrawal = getCondition(target, '🥶');
        const exhausted = getCondition(target, '😮');
        const automatedExhaustion = exhausted?.automation?.fissstechWithdrawal;

        if (Number(withdrawal?.stacks) >= 5 && !exhausted) {
            const effect = global.addAutomationCondition?.(target, '😮');
            if (effect) effect.automation = { ...(effect.automation || {}), fissstechWithdrawal: true };
        } else if (Number(withdrawal?.stacks) < 5 && automatedExhaustion) {
            target.effects = target.effects.filter(effect => effect !== exhausted);
        }
    }

    function applyFissstechUse(target, appliedEffect, options) {
        ensureStackCondition(target, '🥶', -1);
        let addiction = getCondition(target, '💉');
        if (!options.tolerancePassed) addiction = ensureStackCondition(target, '💉', 1);

        target.automation = {
            ...(target.automation || {}),
            fissstechWithdrawalPending: Boolean(addiction),
            fissstechWithdrawalDelay: null
        };
        appliedEffect.automation = {
            ...(appliedEffect.automation || {}),
            toleranceTest: {
                naturalRoll: options.toleranceNaturalRoll,
                skillTotal: options.toleranceTotal,
                result: options.toleranceResult,
                difficulty: 20,
                passed: Boolean(options.tolerancePassed)
            }
        };
        syncWithdrawalExhaustion(target);
    }

    function stabilizeSelectedWound(target, instanceId) {
        if (!instanceId) return '';
        const instance = (target.criticalWounds || []).find(wound => wound.instanceId === instanceId);
        const definition = global.getCriticalWoundDefinition?.(instance?.woundId);
        if (!instance || !definition) return '';
        global.setCriticalWoundState?.(target.id, instanceId, 'stabilized');
        return definition.name;
    }

    function getTargetInventory(target) {
        const currentOwner = global.getCharacterCollectionOwner?.();
        if (target && target === currentOwner && typeof inventory !== 'undefined' && Array.isArray(inventory)) {
            return inventory;
        }
        return Array.isArray(target?.inventory) ? target.inventory : [];
    }

    function applyEquippedArmorDamage(target, amount, includeActiveWeapon = false) {
        const applied = Math.max(0, Math.floor(Number(amount) || 0));
        if (!target || !applied) return [];

        const loadout = global.ensureEquipmentLoadout?.(target);
        const targetInventory = getTargetInventory(target);
        const equipmentIds = [
            ...Object.values(loadout?.armor || {}),
            loadout?.shield
        ].filter(Boolean);
        const details = [];

        [...new Set(equipmentIds.map(String))].forEach(itemId => {
            const item = targetInventory.find(entry => String(entry.id) === itemId);
            if (!item) return;
            const maximum = Math.max(0, Number(item.defense) || 0);
            const before = Number.isFinite(Number(item.equipmentDefense))
                ? Math.max(0, Number(item.equipmentDefense))
                : maximum;
            const after = Math.max(0, before - applied);
            item.equipmentDefense = after;
            details.push(`${item.name}: ${before} → ${after}`);
        });

        if (includeActiveWeapon) {
            const weapon = global.applyActiveWeaponDurabilityDamage?.(target, applied);
            if (weapon) details.push(`${weapon.name}: ablação ${weapon.before} → ${weapon.after}`);
        }
        return details;
    }

    function applyTimedCondition(target, icon, duration = 0, maximum = 1) {
        let condition = getCondition(target, icon);
        if (!condition) condition = global.addAutomationCondition?.(target, icon) || null;
        if (!condition) return null;
        condition.stacks = Math.max(1, Number(condition.stacks) || 1);
        condition.maxStacks = Math.max(1, Number(condition.maxStacks) || maximum);
        condition.remainingTurns = Math.max(Number(condition.remainingTurns) || 0, Number(duration) || 0);
        condition.initialTurns = Math.max(Number(condition.initialTurns) || 0, Number(duration) || 0);
        return condition;
    }

    function applyAcidResidue(target, owner) {
        target.effects ||= [];
        let effect = target.effects.find(current => current.type === 'item' && current.id === 'solucaoacida');
        const refreshed = Boolean(effect);
        if (!effect) {
            effect = {
                id: 'solucaoacida',
                type: 'item',
                name: 'Solução Ácida',
                shortDescription: 'Resíduo ácido ativo; pode ser neutralizado com Pó Básico.',
                remainingTurns: 0,
                initialTurns: 0,
                stacks: 1,
                maxStacks: 1,
                augment: 'debuff',
                automation: { acidResidue: true }
            };
            target.effects.push(effect);
        }
        effect.sourceId = owner?.id ?? '';
        effect.sourceName = owner?.name || '';
        return refreshed;
    }

    function removeConditions(target, icons) {
        const set = new Set(icons);
        const removed = (target.effects || []).filter(effect => effect.type === 'condition' && set.has(effect.id));
        target.effects = (target.effects || []).filter(effect => !removed.includes(effect));
        return removed.map(effect => effect.name || effect.id);
    }

    function executeBasicPowder(target, mode) {
        if (mode === 'acid') {
            const before = (target.effects || []).length;
            target.effects = (target.effects || []).filter(effect => !(
                effect.type === 'item' && effect.id === 'solucaoacida'
            ));
            return before !== target.effects.length ? 'Solução Ácida neutralizada' : '';
        }

        const wound = (target.criticalWounds || []).find(instance => (
            instance.woundId === 'difficult-torn-stomach' && (instance.state || 'normal') === 'normal'
        ));
        if (!wound) return '';
        wound.state = 'stabilized';
        wound.updatedAt = new Date().toISOString();
        return 'Estômago Rasgado estabilizado; dano ácido recorrente removido';
    }

    function clearIntoxication(target) {
        const removedConditions = removeConditions(target, ['🍷']);
        const before = (target.effects || []).length;
        target.effects = (target.effects || []).filter(effect => {
            if (effect.type !== 'item') return true;
            const automation = effect.automation || {};
            return automation.linkedCondition !== '🍷' && !(automation.linkedConditions || []).includes('🍷');
        });
        return removedConditions.length + (before - target.effects.length);
    }

    function getNarrativeItemSummary(itemId, owner) {
        const actor = owner?.name || 'Usuário';
        if (itemId === 'tumbadeadda') {
            return `${actor}: Tumba de Adda usada\nLembrete: role 1d10 dias de preservação; um corpo humano consome 2 doses.`;
        }
        if (itemId === 'tintainvisivel') {
            return `${actor}: Tinta Invisível usada\nLembrete: registre a mensagem ou superfície tratada e as condições de revelação.`;
        }
        return `${actor}: Amigo do Envenenador usado\nLembrete: teste de Alquimia ND 24 conforme a finalidade escolhida.`;
    }

    function executeInstantItemUse(owner, itemId, execution) {
        if (NARRATIVE_ITEMS.has(itemId)) {
            return {
                applied: true,
                refreshed: false,
                effect: null,
                effectKind: 'item',
                targets: owner ? [{ id: owner.id, name: owner.name }] : [],
                summary: getNarrativeItemSummary(itemId, owner)
            };
        }

        const detailLines = [];
        const affectedTargets = [];
        const damageTargetIds = [];
        const itemName = getItemDefinition(itemId)?.name || ITEM_NAMES[itemId] || itemId;

        execution.targetIds.forEach(targetId => {
            const target = getTargetById(targetId);
            if (!target) return;
            const options = execution.optionsByTarget[targetId] || {};
            const targetDetails = [];

            if (DAMAGE_ITEMS[itemId]) {
                damageTargetIds.push(String(target.id));
                if (options.armorDamage) {
                    const armor = applyEquippedArmorDamage(target, options.armorDamage, false);
                    targetDetails.push(armor.length
                        ? `armaduras: ${armor.join('; ')}`
                        : `sem armadura equipada para receber ${options.armorDamage} de dano`);
                }
            }

            if (itemId === 'solucaoacida') {
                const armor = applyEquippedArmorDamage(target, options.ablationTotal, true);
                const refreshed = applyAcidResidue(target, owner);
                targetDetails.push(`ablação ${options.ablationTotal}: ${armor.length ? armor.join('; ') : 'nenhum equipamento afetado'}`);
                targetDetails.push(`resíduo ácido ${refreshed ? 'renovado' : 'aplicado'}`);
            } else if (itemId === 'pobasico') {
                const result = executeBasicPowder(target, options.basicPowderMode);
                if (!result) return;
                targetDetails.push(result);
            } else if (itemId === 'venenonegro') {
                const test = options.toleranceTest;
                if (!test?.passed) ensureStackCondition(target, '🐍', 1, 10);
                targetDetails.push(
                    `Tolerância ${test.naturalRoll} + ${test.skillTotal} = ${test.result} contra ND ${test.difficulty}: ${test.passed ? 'sucesso; Envenenado evitado' : 'falha; Envenenado +1 pilha'}`
                );
            } else if (itemId === 'furiadebredan') {
                const test = options.toleranceTest;
                if (!test?.passed) ensureStackCondition(target, '🔥', 1, 10);
                targetDetails.push(
                    `Tolerância ${test.naturalRoll} + ${test.skillTotal} = ${test.result} contra ND ${test.difficulty}: ${test.passed ? 'sucesso; Chamas evitadas' : 'falha; Em Chamas +1 pilha'}`
                );
            } else if (itemId === 'saisaromaticos') {
                const removed = removeConditions(target, ['😵', '💫', '🚫']);
                if (removed.length) {
                    target.effects = (target.effects || []).filter(effect => {
                        if (effect.type !== 'item') return true;
                        const automation = effect.automation || {};
                        return !['😵', '💫', '🚫'].includes(automation.linkedCondition) &&
                            !(automation.linkedConditions || []).some(icon => ['😵', '💫', '🚫'].includes(icon));
                    });
                }
                targetDetails.push(removed.length
                    ? `removeu ${removed.join(', ')}`
                    : 'nenhuma condição Inconsciente, Atordoado ou Incapacitado encontrada');
            } else if (itemId === 'lagrimasdeesposas') {
                const removed = clearIntoxication(target);
                targetDetails.push(removed ? 'intoxicação removida; alvo sóbrio' : 'nenhuma intoxicação encontrada');
            } else if (itemId === 'fogodazerikania') {
                applyTimedCondition(target, '🔥', options.flameDuration, 10);
                targetDetails.push(`Em Chamas por ${options.flameDuration} turno${options.flameDuration === 1 ? '' : 's'}`);
            }

            detailLines.push(`${target.name}: ${targetDetails.join(' · ')}`);
            affectedTargets.push({ id: target.id, name: target.name });
        });

        if (!affectedTargets.length) {
            return { applied: false, blocked: true, reason: 'no-target-applied' };
        }

        const damageRule = DAMAGE_ITEMS[itemId];
        if (damageRule && damageTargetIds.length) {
            const firstOptions = execution.optionsByTarget[damageTargetIds[0]] || {};
            global.setTimeout(() => {
                global.startItemDamageSequence?.({
                    sourceId: owner?.id ?? '',
                    sourceName: owner?.name || 'Usuário',
                    effectId: itemId,
                    effectName: itemName,
                    damage: firstOptions.damageTotal,
                    damageType: damageRule.damageType,
                    targetIds: damageTargetIds,
                    roll: { formula: damageRule.dice, total: firstOptions.damageTotal, source: 'manual' }
                });
            }, 0);
            detailLines.unshift(`${itemName}: dano ${damageRule.dice} informado = ${firstOptions.damageTotal}; localização será resolvida em ${damageTargetIds.length} alvo(s)`);
        }

        global.saveInventory?.();
        global.savePlayersToStorage?.();
        global.renderList?.(false);
        return {
            applied: true,
            refreshed: false,
            effect: null,
            effectKind: 'item',
            targets: affectedTargets,
            summary: detailLines.join('\n')
        };
    }

    function installInventoryApplicationWrapper() {
        const original = global.applyInventoryItemEffectOnOwner;
        if (typeof original !== 'function' || original.itemUseAutomationWrapped) return;

        const wrapped = (owner, itemId) => {
            const execution = pendingExecution?.itemId === itemId ? pendingExecution : null;
            if (!execution) return original(owner, itemId);
            pendingExecution = null;

            if (INSTANT_ITEMS.has(itemId)) {
                return executeInstantItemUse(owner, itemId, execution);
            }

            const results = [];
            const detailLines = [];
            execution.targetIds.forEach(targetId => {
                const target = getTargetById(targetId);
                if (!target) return;
                currentTargetOptions = execution.optionsByTarget[targetId] || {};
                const result = original(target, itemId);
                currentTargetOptions = null;
                if (!result?.applied) return;

                if (itemId === 'fissstech') {
                    applyFissstechUse(target, result.effect, execution.optionsByTarget[targetId]);
                    const test = result.effect.automation?.toleranceTest;
                    detailLines.push(
                        `${target.name}: Tolerância ${test.naturalRoll} + ${test.skillTotal} = ${test.result} contra ND 20 · ${test.passed ? 'sucesso' : 'falha; Vício aumentado'}`
                    );
                }

                if (itemId === 'ervasentorpecentes') {
                    const woundName = stabilizeSelectedWound(
                        target,
                        execution.optionsByTarget[targetId].woundInstanceId
                    );
                    detailLines.push(woundName
                        ? `${target.name}: ${woundName} estabilizado; Alucinado por 20 rodadas`
                        : `${target.name}: Alucinado por 20 rodadas; nenhum ferimento estabilizado`);
                } else {
                    const duration = Math.max(0, Number(result.effect?.remainingTurns) || 0);
                    detailLines.push(`${target.name}: ${result.refreshed ? 'efeito renovado' : 'efeito aplicado'}${duration ? ` por ${duration} rodadas` : ''}`);
                }

                results.push({ ...result, target });
            });

            global.savePlayersToStorage?.();
            global.renderList?.(false);
            return {
                applied: results.length > 0,
                blocked: results.length === 0,
                reason: results.length ? '' : 'no-target-applied',
                refreshed: results.some(result => result.refreshed),
                effect: results[0]?.effect || null,
                effectKind: 'item',
                targets: results.map(result => ({ id: result.target.id, name: result.target.name })),
                summary: detailLines.join('\n')
            };
        };
        wrapped.itemUseAutomationWrapped = true;
        global.applyInventoryItemEffectOnOwner = wrapped;
    }

    function installTurnAutomationWrapper() {
        const original = global.processAutomatedTurnEffects;
        if (typeof original !== 'function' || original.itemUseAutomationWrapped) return;

        const wrapped = combatant => {
            const changes = original(combatant) || [];
            if (!combatant) return changes;

            const adhesive = (combatant.effects || []).find(effect => (
                effect.type === 'item' &&
                effect.id === 'adesivoalquimico' &&
                Number(effect.automation?.adhesiveCountdown) > 0
            ));
            if (adhesive) {
                adhesive.automation.adhesiveCountdown -= 1;
                if (adhesive.automation.adhesiveCountdown <= 0) {
                    combatant.effects = combatant.effects.filter(effect => effect !== adhesive);
                    global.addAutomationCondition?.(combatant, '🕸️');
                    changes.push(`${adhesive.name}: endureceu; ${combatant.name} ficou Grudado`);
                } else {
                    changes.push(`${adhesive.name}: endurece em ${adhesive.automation.adhesiveCountdown} turno`);
                }
            }

            const fissstechActive = (combatant.effects || []).some(effect => (
                effect.type === 'item' && effect.id === 'fissstech'
            ));
            if (combatant.automation?.fissstechWithdrawalPending && !fissstechActive) {
                const rawDelay = combatant.automation.fissstechWithdrawalDelay;
                const configuredDelay = Number(rawDelay);
                if (rawDelay === null || rawDelay === undefined || !Number.isInteger(configuredDelay) || configuredDelay < 0) {
                    combatant.automation.fissstechWithdrawalDelay = 10;
                    changes.push('Abstinência de Fisstech: começa em 10 turnos');
                } else if (configuredDelay > 1) {
                    combatant.automation.fissstechWithdrawalDelay = configuredDelay - 1;
                    changes.push(`Abstinência de Fisstech: começa em ${configuredDelay - 1} turnos`);
                } else {
                    const addictionStacks = Number(getCondition(combatant, '💉')?.stacks) || 0;
                    const withdrawalStacks = Number(getCondition(combatant, '🥶')?.stacks) || 0;
                    if (addictionStacks > withdrawalStacks) {
                        ensureStackCondition(combatant, '🥶', 1);
                        changes.push('Abstinência de Fisstech: +1 pilha');
                    }
                    combatant.automation.fissstechWithdrawalPending = false;
                    combatant.automation.fissstechWithdrawalDelay = null;
                }
            } else if (fissstechActive && combatant.automation?.fissstechWithdrawalPending) {
                combatant.automation.fissstechWithdrawalDelay = null;
            }

            syncWithdrawalExhaustion(combatant);
            global.savePlayersToStorage?.();
            return changes;
        };
        wrapped.itemUseAutomationWrapped = true;
        global.processAutomatedTurnEffects = wrapped;
    }

    function getCombatSkillGroup(skillId) {
        return global.getCombatRollSkillGroup?.(skillId) || null;
    }

    function getItemConditionSkillModifier(combatant, skill, options = {}) {
        const result = { total: 0, details: [], advantage: false, disadvantage: false };
        if (!combatant || !skill) return result;

        const skillId = String(skill.id || '');
        const combatGroup = getCombatSkillGroup(skillId);
        const attackOrDefense = ['meleeAttack', 'rangedAttack', 'block', 'dodge'].includes(combatGroup);
        const perceptionTest = ['perception', 'human_perception', 'deduction'].includes(skillId);

        const blizzard = (combatant.effects || []).find(effect => effect.type === 'item' && effect.id === 'nevasca');
        const blizzardBonus = Math.max(0, Number(blizzard?.automation?.skillBonus) || 0);
        const blizzardSkillIds = Array.isArray(blizzard?.automation?.skillIds)
            ? blizzard.automation.skillIds
            : [];
        if (blizzardBonus && blizzardSkillIds.includes(skillId)) {
            result.total += blizzardBonus;
            result.details.push(`Nevasca: +${blizzardBonus}`);
        }

        const thunderbolt = (combatant.effects || []).find(effect => effect.type === 'item' && effect.id === 'trovoada');
        const thunderboltBonus = thunderbolt
            ? Math.max(0, Number(thunderbolt.automation?.combatSkillBonus) || 2)
            : 0;
        const thunderboltGroups = Array.isArray(thunderbolt?.automation?.combatSkillGroups)
            ? thunderbolt.automation.combatSkillGroups
            : ['meleeAttack', 'rangedAttack', 'block', 'dodge'];
        if (thunderboltBonus && thunderboltGroups.includes(combatGroup)) {
            result.total += thunderboltBonus;
            result.details.push(`Trovoada: +${thunderboltBonus}`);
        }

        const environment = global.getAutomationEnvironmentBenefits?.(combatant) || {};
        if (options.illusion && Number(environment.illusionResistanceBonus) > 0) {
            result.total += Number(environment.illusionResistanceBonus);
            result.details.push(`Gato contra ilusão: +${environment.illusionResistanceBonus}`);
        }
        if (options.darkness && environment.ignoresDarknessVisionPenalty) {
            result.details.push('Gato: penalidade visual de escuridão anulada');
        }
        if (options.underwater && environment.ignoresUnderwaterVisionPenalty) {
            result.details.push('Baleia Assassina: penalidade visual subaquática anulada');
        }

        if (getCondition(combatant, '🌀')) {
            const penalty = skillId === 'perception'
                ? -4
                : ['deduction', 'human_perception'].includes(skillId) ? -2 : 0;
            result.total += penalty;
            if (penalty) result.details.push(`Alucinado: ${penalty}`);
            if (attackOrDefense || perceptionTest) {
                result.disadvantage = true;
                result.details.push('Alucinado: desvantagem');
            }
        }

        if (getCondition(combatant, '🙈') && (attackOrDefense || perceptionTest)) {
            result.disadvantage = true;
            result.details.push('Cego: desvantagem; Percepção exclusivamente visual falha automaticamente');
        }

        if (getCondition(combatant, '🤪')) {
            if (['seduction', 'persuasion'].includes(skillId) || skill.attributeId === 'charisma') {
                result.total += 2;
                result.details.push('Alegria Delirante: +2 social');
            }
            if (['deduction', 'human_perception', 'resist_coercion'].includes(skillId)) {
                result.total -= 2;
                result.details.push('Alegria Delirante: −2 de discernimento');
            }
            if (skillId === 'courage') {
                result.advantage = true;
                result.details.push('Alegria Delirante: vantagem em Coragem');
            }
        }

        const withdrawalStacks = Number(getCondition(combatant, '🥶')?.stacks) || 0;
        if (withdrawalStacks === 1 && ['perception', 'tolerance'].includes(skillId)) {
            result.total -= 2;
            result.details.push('Abstinência 1: −2');
        } else if (withdrawalStacks >= 2) {
            result.total -= 2;
            result.details.push(`Abstinência ${withdrawalStacks}: −2 em todos os testes`);
        }
        if (withdrawalStacks >= 3) {
            result.disadvantage = true;
            result.details.push(`Abstinência ${withdrawalStacks}: desvantagem`);
        }

        const succubus = (combatant.effects || []).find(effect => effect.type === 'item' && effect.id === 'soprodesucubo');
        if (succubus?.automation?.succubusMode === 'skin' && skillId === 'seduction') {
            result.total += 2;
            result.details.push('Sopro de Súcubo na pele: +2');
        }
        if (succubus?.automation?.succubusMode === 'drink' && skillId === 'resist_coercion') {
            result.total -= 5;
            result.details.push('Sopro de Súcubo na bebida: −5');
        }

        const careModifier = global.getCareSkillModifier?.(combatant, skill) || {
            total: 0,
            details: [],
            advantage: false,
            disadvantage: false
        };
        result.total += Number(careModifier.total) || 0;
        result.details.push(...(careModifier.details || []));
        result.advantage = result.advantage || Boolean(careModifier.advantage);
        result.disadvantage = result.disadvantage || Boolean(careModifier.disadvantage);

        if (result.advantage && result.disadvantage) {
            result.advantage = false;
            result.disadvantage = false;
            result.details.push('Vantagem e desvantagem se anulam');
        }
        return result;
    }

    function getItemConditionTestOptions(combatant, skill) {
        if (!combatant || !skill) return [];
        const skillId = String(skill.id || '');
        const combatGroup = getCombatSkillGroup(skillId);
        const environment = global.getAutomationEnvironmentBenefits?.(combatant) || {};
        const visualSkill = Boolean(combatGroup) || [
            'perception', 'investigation', 'deduction', 'hunting', 'survival'
        ].includes(skillId);
        const options = [];

        if (
            Number(environment.illusionResistanceBonus) > 0 &&
            ['resist_magic', 'perception', 'deduction'].includes(skillId)
        ) {
            options.push({
                id: 'illusion',
                label: `Teste contra ilusão · +${environment.illusionResistanceBonus}`,
                description: 'Aplica automaticamente o bônus de Gato.'
            });
        }
        if (environment.ignoresDarknessVisionPenalty && visualSkill) {
            options.push({
                id: 'darkness',
                label: 'Visão em escuridão ou pouca luz',
                description: 'Gato anula a penalidade visual; não aplique penalidade manual.'
            });
        }
        if (environment.ignoresUnderwaterVisionPenalty && visualSkill) {
            options.push({
                id: 'underwater',
                label: 'Visão subaquática',
                description: 'Baleia Assassina anula a penalidade visual subaquática.'
            });
        }
        return options;
    }

    function getItemConditionHealingMultiplier(combatant) {
        let multiplier = (combatant?.effects || []).some(effect => (
            (effect.type === 'item' && effect.id === 'fluidoesterilizante') ||
            (effect.type === 'condition' && effect.id === '🧴')
        )) ? 2 : 1;
        if ((Number(getCondition(combatant, '🥶')?.stacks) || 0) >= 4) multiplier *= 0.5;
        return multiplier;
    }

    function getItemConditionStaminaRecoveryMultiplier(combatant) {
        return (Number(getCondition(combatant, '🥶')?.stacks) || 0) >= 4 ? 0.5 : 1;
    }

    global.beginInventoryItemUseFlow = beginInventoryItemUseFlow;
    global.closeInventoryItemTargetModal = closeInventoryItemTargetModal;
    global.selectInventoryItemUseTarget = selectInventoryItemUseTarget;
    global.setAllInventoryItemUseTargets = setAllInventoryItemUseTargets;
    global.confirmInventoryItemUseTargets = confirmInventoryItemUseTargets;
    global.getPendingInventoryItemAutomationOptions = () => currentTargetOptions || {};
    global.getItemConditionSkillModifier = getItemConditionSkillModifier;
    global.getItemConditionTestOptions = getItemConditionTestOptions;
    global.getItemConditionHealingMultiplier = getItemConditionHealingMultiplier;
    global.getItemConditionStaminaRecoveryMultiplier = getItemConditionStaminaRecoveryMultiplier;
    global.itemUseAutomation = Object.freeze({
        targetedItemIds: Object.freeze([...TARGETED_ITEMS]),
        multiTargetItemIds: Object.freeze([...MULTI_TARGET_ITEMS]),
        instantItemIds: Object.freeze([...INSTANT_ITEMS]),
        narrativeItemIds: Object.freeze([...NARRATIVE_ITEMS]),
        executeInstantItemUse,
        getItemConditionSkillModifier,
        getItemConditionTestOptions,
        getItemConditionHealingMultiplier,
        getItemConditionStaminaRecoveryMultiplier
    });

    installInventoryApplicationWrapper();
    installTurnAutomationWrapper();
    global.addEventListener?.('load', installInventoryApplicationWrapper);
})(window);
