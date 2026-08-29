(function initializeCharacterSkillTests(global) {
    'use strict';

    const expandedSkillPanels = new Set();
    const expandedProfessionalPanels = new Set();

    function escapeSkillHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function isFullCharacter(combatant) {
        return Boolean(combatant && combatant.type === 'player' && combatant.creationMode === 'full');
    }

    function getCharacterSkillEntries(combatant) {
        const model = global.characterSheetModel;
        if (!isFullCharacter(combatant) || !model) return [];

        return model.CHARACTER_SKILLS
            .map(skill => ({
                ...skill,
                attribute: model.getCharacterAttributeDefinition(skill.attributeId),
                breakdown: model.getCharacterSkillBreakdown(
                    skill.id,
                    combatant.skills,
                    combatant.attributes
                )
            }))
            .filter(skill => skill.breakdown && skill.breakdown.total !== 0);
    }

    function getCharacterProfessionalSkillEntries(combatant) {
        const model = global.characterSheetModel;
        if (!isFullCharacter(combatant) || !model) return [];

        return model.getCharacterProfessionalSkills(combatant.identity?.specializationId)
            .map(skill => ({
                ...skill,
                breakdown: model.getCharacterProfessionalSkillBreakdown(
                    skill.id,
                    combatant.professionalSkills,
                    combatant.attributes
                )
            }))
            .filter(skill => skill.breakdown && skill.breakdown.total !== 0);
    }

    const PROFESSIONAL_REMINDER_TRIGGER_LABELS = Object.freeze({
        'low-hp': 'PV baixo',
        'potion-active': 'Poção/Toxicidade',
        poisoned: 'Envenenado',
        defeat: 'Ao derrotar',
        'damage-taken': 'Ao sofrer dano',
        'damage-dealt': 'Ao causar dano',
        defense: 'Defesa/Reação',
        'ability-use': 'Magia/Sinal',
        'item-use': 'Item/Alquimia',
        rest: 'Descanso',
        turn: 'Durante o turno'
    });

    function combatantHasProfessionalCondition(combatant, matcher) {
        const effects = Array.isArray(combatant?.effects) ? combatant.effects : [];
        const conditions = Array.isArray(combatant?.conditions) ? combatant.conditions : [];

        return effects.some(effect => matcher(String(effect?.id || ''), effect))
            || conditions.some(condition => matcher(String(condition || ''), null));
    }

    function getProfessionalReminderPresentation(skill, combatant) {
        const triggers = Array.isArray(skill?.automation?.triggers)
            ? skill.automation.triggers
            : [];
        const isActiveTurn = typeof activeTurnId !== 'undefined'
            && String(activeTurnId) === String(combatant?.id);
        const hasPotion = combatantHasProfessionalCondition(
            combatant,
            (_id, effect) => effect?.type === 'item'
        );
        const isPoisoned = combatantHasProfessionalCondition(
            combatant,
            id => id === '🐍' || /venen/i.test(id)
        );
        const lowHp = Number(combatant?.hpMax) > 0
            && Number(combatant?.hpCurrent) <= (Number(combatant.hpMax) / 2);
        const stateTriggers = new Set([
            ...(lowHp ? ['low-hp'] : []),
            ...(hasPotion ? ['potion-active'] : []),
            ...(isPoisoned ? ['poisoned'] : []),
            ...(isActiveTurn ? ['turn', 'damage-dealt', 'defeat', 'ability-use', 'item-use'] : [])
        ]);
        const relevantTriggers = triggers.filter(trigger => stateTriggers.has(trigger));

        return {
            triggers,
            relevantTriggers,
            relevant: relevantTriggers.length > 0,
            labels: triggers.map(trigger => PROFESSIONAL_REMINDER_TRIGGER_LABELS[trigger] || 'Contextual')
        };
    }

    function getSkillBonusOriginSummary(breakdown) {
        if (!breakdown) return 'Sem composição disponível';

        const origins = [
            ['Investido', breakdown.invested],
            ['Atributo', breakdown.attributeModifier],
            ['Raça', breakdown.raceBonus],
            ['Profissão', breakdown.professionBonus],
            ['Especialização', breakdown.specializationBonus],
            ['Equipamento', breakdown.equipmentBonus],
            ['Temporário', breakdown.temporaryBonus],
            ['Ajuste', breakdown.manualAdjustment]
        ].filter(([, value], index) => index === 0 || Number(value) !== 0);

        return origins.map(([label, value]) => `${label} ${Number(value) >= 0 ? '+' : ''}${Number(value) || 0}`).join(' · ');
    }

    function toggleCharacterSkillsPanel(encodedCombatantId) {
        const key = decodeURIComponent(String(encodedCombatantId));
        if (expandedSkillPanels.has(key)) expandedSkillPanels.delete(key);
        else expandedSkillPanels.add(key);
        global.renderList?.(false);
    }

    function toggleCharacterProfessionalSkillsPanel(encodedCombatantId) {
        const key = decodeURIComponent(String(encodedCombatantId));
        if (expandedProfessionalPanels.has(key)) expandedProfessionalPanels.delete(key);
        else expandedProfessionalPanels.add(key);
        global.renderList?.(false);
    }

    function renderCharacterSkillsPanel(combatant) {
        const skills = getCharacterSkillEntries(combatant);
        if (!skills.length) return '';

        const key = String(combatant.id);
        const encodedId = encodeURIComponent(key);
        const expanded = expandedSkillPanels.has(key);
        const luckDice = Math.max(0, Number(combatant.progression?.luckDice) || 0);
        const adrenaline = Math.max(0, Number(combatant.progression?.adrenaline) || 0);

        return `
            <section class="character-skills-panel ${expanded ? '' : 'is-collapsed'}" aria-label="Perícias de ${escapeSkillHtml(combatant.name)}">
                <button type="button" class="combat-subpanel-header character-skills-header" aria-expanded="${expanded}" onclick="event.stopPropagation(); toggleCharacterSkillsPanel('${encodedId}')">
                    <span>${expanded ? '▼' : '▶'} PERÍCIAS</span>
                    <small>${skills.length} ativas · 🎲 ${luckDice} · ⚡ ${adrenaline}</small>
                </button>
                ${expanded ? `
                    <div class="character-skill-grid">
                        ${skills.map(skill => `
                            <button type="button" class="character-skill-card" onclick="event.stopPropagation(); openCharacterSkillTest('${encodedId}', '${encodeURIComponent(skill.id)}')" title="${escapeSkillHtml(getSkillBonusOriginSummary(skill.breakdown))}">
                                <span class="character-skill-copy">
                                    <strong>${escapeSkillHtml(skill.name)}</strong>
                                    <small>${escapeSkillHtml(skill.attribute?.abbreviation || skill.attributeId)}</small>
                                </span>
                                <span class="character-skill-total">${skill.breakdown.total >= 0 ? '+' : ''}${skill.breakdown.total}</span>
                                <span class="character-skill-roll" aria-hidden="true">🎲</span>
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
            </section>
        `;
    }

    function renderCharacterProfessionalSkillsPanel(combatant) {
        const skills = getCharacterProfessionalSkillEntries(combatant);
        if (!skills.length) return '';

        const key = String(combatant.id);
        const encodedId = encodeURIComponent(key);
        const expanded = expandedProfessionalPanels.has(key);
        const reminderSkills = skills.filter(skill => skill.automation?.mode === 'reminder');
        const relevantReminderCount = reminderSkills.filter(skill => (
            getProfessionalReminderPresentation(skill, combatant).relevant
        )).length;

        return `
            <section class="character-professional-panel ${expanded ? '' : 'is-collapsed'} ${relevantReminderCount ? 'has-relevant-reminders' : ''}" aria-label="Habilidades profissionais de ${escapeSkillHtml(combatant.name)}">
                <button type="button" class="combat-subpanel-header character-professional-header" aria-expanded="${expanded}" onclick="event.stopPropagation(); toggleCharacterProfessionalSkillsPanel('${encodedId}')">
                    <span>${expanded ? '▼' : '▶'} HABILIDADES PROFISSIONAIS</span>
                    <small>${skills.length} ${skills.length === 1 ? 'habilidade' : 'habilidades'}${reminderSkills.length ? ` · 🔔 ${relevantReminderCount || reminderSkills.length}` : ''}</small>
                </button>
                ${expanded ? `
                    <div class="character-professional-list">
                        ${skills.map(skill => {
                            const reminder = skill.automation?.mode === 'reminder'
                                ? getProfessionalReminderPresentation(skill, combatant)
                                : null;
                            return `
                            <article class="character-professional-card ${reminder?.relevant ? 'is-contextually-relevant' : ''}">
                                <span class="character-professional-level">${skill.breakdown.total}</span>
                                <div>
                                    <strong>${escapeSkillHtml(skill.name)}${skill.automation?.status === 'implemented'
                                        ? ' <span class="character-professional-automation-badge">AUTOMÁTICO</span>'
                                        : (skill.automation?.mode === 'reference'
                                            ? ' <span class="character-professional-automation-badge is-reference">REFERÊNCIA</span>'
                                            : '')}</strong>
                                    <p>${escapeSkillHtml(skill.description || 'Sem descrição adicional.')}</p>
                                    ${skill.automation?.mode === 'assisted' ? `
                                        <button type="button" class="character-professional-test-button" onclick="event.stopPropagation(); openCharacterProfessionalSkillTest('${encodedId}', '${encodeURIComponent(skill.id)}')">
                                            🎲 Realizar teste
                                        </button>
                                    ` : ''}
                                    ${reminder ? `
                                        <div class="character-professional-reminder-tags" aria-label="Contextos do lembrete">
                                            ${reminder.labels.map((label, index) => `
                                                <span class="${reminder.relevantTriggers.includes(reminder.triggers[index]) ? 'is-relevant' : ''}">🔔 ${escapeSkillHtml(label)}</span>
                                            `).join('')}
                                        </div>
                                    ` : ''}
                                </div>
                            </article>
                        `}).join('')}
                    </div>
                ` : ''}
            </section>
        `;
    }

    function getSkillRollMode() {
        if (typeof appPreferences !== 'undefined') {
            return appPreferences.rollModes?.skills || 'manual';
        }

        try {
            return JSON.parse(localStorage.getItem('dnd_app_preferences') || '{}').rollModes?.skills || 'manual';
        } catch {
            return 'manual';
        }
    }

    function applyCharacterSkillTestRewards(combatant, result) {
        if (!combatant || !result?.valid) return null;

        combatant.progression = {
            ...(combatant.progression || {}),
            luckDice: Math.max(0, Number(combatant.progression?.luckDice) || 0)
                + Math.max(0, Number(result.luckDiceGained) || 0),
            adrenaline: Math.max(0, Number(combatant.progression?.adrenaline) || 0)
                + Math.max(0, Number(result.adrenalineGained) || 0)
        };

        return combatant.progression;
    }

    function closeCharacterSkillTest() {
        document.getElementById('characterSkillTestModal')?.remove();
    }

    function setCharacterSkillTestComparison(value) {
        const label = document.getElementById('characterSkillTargetLabel');
        const input = document.getElementById('characterSkillTarget');
        if (!label || !input) return;

        const opposed = value === 'opposed';
        label.textContent = opposed ? 'Resultado do oponente' : 'Dificuldade definida pelo mestre';
        input.placeholder = opposed ? 'Ex.: 18' : 'Ex.: 15';
        input.focus();
    }

    function getCharacterTestContext(combatant, skillId, testKind = 'general') {
        const model = global.characterSheetModel;
        const professional = testKind === 'professional';
        const skill = professional
            ? model?.getCharacterProfessionalSkillDefinition(skillId)
            : model?.getCharacterSkillDefinition(skillId);
        const breakdown = professional
            ? model?.getCharacterProfessionalSkillBreakdown(
                skillId,
                combatant?.professionalSkills,
                combatant?.attributes
            )
            : model?.getCharacterSkillBreakdown(skillId, combatant?.skills, combatant?.attributes);

        return { skill, breakdown, professional };
    }

    function openCharacterSkillTest(encodedCombatantId, encodedSkillId, testKind = 'general') {
        closeCharacterSkillTest();

        const combatantId = decodeURIComponent(String(encodedCombatantId));
        const skillId = decodeURIComponent(String(encodedSkillId));
        const combatant = typeof combatants !== 'undefined'
            ? combatants.find(entry => String(entry.id) === combatantId)
            : null;
        const { skill, breakdown, professional } = getCharacterTestContext(
            combatant,
            skillId,
            testKind
        );

        if (!combatant || !skill || !breakdown) {
            global.showToast?.(`Não foi possível abrir este teste ${professional ? 'profissional' : 'de perícia'}.`);
            return;
        }
        if (professional && skill.automation?.mode !== 'assisted') {
            global.showToast?.('Esta habilidade não utiliza o assistente de testes.');
            return;
        }

        const rollMode = getSkillRollMode();
        const woundModifier = global.getCriticalWoundSkillModifier?.(
            combatant,
            skill,
            professional,
            breakdown.total,
            breakdown
        ) || { total: 0, details: [] };
        const toxicityModifier = global.getToxicitySkillModifier?.(combatant, skill) || { total: 0, details: [] };
        const modal = document.createElement('div');
        modal.id = 'characterSkillTestModal';
        modal.className = 'session-overlay';
        modal.addEventListener('click', event => {
            if (event.target === modal) closeCharacterSkillTest();
        });
        modal.innerHTML = `
            <section class="session-dialog character-skill-test-dialog" role="dialog" aria-modal="true" aria-labelledby="characterSkillTestTitle">
                <div class="session-dialog-header">
                    <div>
                        <small class="character-skill-test-kicker">${professional ? 'TESTE PROFISSIONAL' : 'TESTE DE PERÍCIA'}</small>
                        <h2 id="characterSkillTestTitle">${escapeSkillHtml(skill.name)}</h2>
                    </div>
                    <button type="button" class="session-close" onclick="closeCharacterSkillTest()" aria-label="Fechar">×</button>
                </div>
                <p class="character-skill-test-actor">${escapeSkillHtml(combatant.name)} · ${professional ? 'Nível profissional' : 'Total da perícia'} <strong>${breakdown.total >= 0 ? '+' : ''}${breakdown.total}</strong></p>
                <div class="character-skill-breakdown">${escapeSkillHtml(getSkillBonusOriginSummary(breakdown))}</div>
                ${woundModifier.total ? `
                    <p class="character-professional-test-rule">🩹 Ferimentos críticos: ${woundModifier.total} · ${escapeSkillHtml(woundModifier.details.join(' · '))}</p>
                ` : ''}
                ${toxicityModifier.total ? `
                    <p class="character-professional-test-rule">☣ Toxicidade: ${toxicityModifier.total} · ${escapeSkillHtml(toxicityModifier.details.join(' · '))}</p>
                ` : ''}
                ${professional ? `<p class="character-professional-test-rule">${escapeSkillHtml(skill.description)}</p>` : ''}

                <div class="character-skill-form-grid">
                    <label class="character-skill-field">
                        <span>Comparar com</span>
                        <select id="characterSkillComparison" onchange="setCharacterSkillTestComparison(this.value)">
                            <option value="difficulty">Dificuldade do mestre</option>
                            <option value="opposed">Resultado do oponente</option>
                        </select>
                    </label>
                    <label class="character-skill-field">
                        <span id="characterSkillTargetLabel">Dificuldade definida pelo mestre</span>
                        <input id="characterSkillTarget" type="number" inputmode="numeric" placeholder="Ex.: 15">
                    </label>
                    ${rollMode === 'manual' ? `
                        <label class="character-skill-field">
                            <span>Resultado natural do d20</span>
                            <input id="characterSkillNaturalRoll" type="number" inputmode="numeric" min="1" max="20" placeholder="1 a 20">
                        </label>
                    ` : `
                        <div class="character-skill-auto-roll">
                            <span>🎲 Rolagem automática</span>
                            <small>O aplicativo rolará 1d20 ao confirmar.</small>
                        </div>
                    `}
                    <label class="character-skill-field">
                        <span>Modificador deste teste</span>
                        <input id="characterSkillModifier" type="number" inputmode="numeric" value="0" placeholder="Ex.: -2 ou 3">
                    </label>
                </div>

                <div class="character-skill-formula">1d20 + ${breakdown.total} da perícia${woundModifier.total ? ` ${woundModifier.total} de ferimentos` : ''}${toxicityModifier.total ? ` ${toxicityModifier.total} de toxicidade` : ''} + modificador</div>
                <div class="session-dialog-actions">
                    <button type="button" class="session-secondary" onclick="closeCharacterSkillTest()">Cancelar</button>
                    <button type="button" class="session-primary" onclick="executeCharacterSkillTest('${encodedCombatantId}', '${encodedSkillId}', '${professional ? 'professional' : 'general'}')">Realizar teste</button>
                </div>
            </section>
        `;

        document.body.appendChild(modal);
        document.getElementById('characterSkillTarget')?.focus();
    }

    function openCharacterProfessionalSkillTest(encodedCombatantId, encodedSkillId) {
        return openCharacterSkillTest(encodedCombatantId, encodedSkillId, 'professional');
    }

    function executeCharacterSkillTest(
        encodedCombatantId,
        encodedSkillId,
        testKind = 'general',
        random = Math.random
    ) {
        if (typeof testKind === 'function') {
            random = testKind;
            testKind = 'general';
        }
        const combatantId = decodeURIComponent(String(encodedCombatantId));
        const skillId = decodeURIComponent(String(encodedSkillId));
        const combatant = typeof combatants !== 'undefined'
            ? combatants.find(entry => String(entry.id) === combatantId)
            : null;
        const model = global.characterSheetModel;
        const { skill, breakdown, professional } = getCharacterTestContext(
            combatant,
            skillId,
            testKind
        );
        const targetInput = document.getElementById('characterSkillTarget');
        const modifierInput = document.getElementById('characterSkillModifier');

        if (!combatant || !skill || !breakdown) return null;
        if (professional && skill.automation?.mode !== 'assisted') return null;

        const target = Number(targetInput?.value);
        if (!targetInput?.value.trim() || !Number.isFinite(target)) {
            global.showToast?.('Informe a dificuldade ou o resultado do oponente.');
            targetInput?.focus();
            return null;
        }

        const rollMode = getSkillRollMode();
        const naturalInput = document.getElementById('characterSkillNaturalRoll');
        const naturalRoll = rollMode === 'auto'
            ? Math.floor(random() * 20) + 1
            : Number(naturalInput?.value);

        if (rollMode === 'manual' && (!naturalInput?.value.trim() || naturalRoll < 1 || naturalRoll > 20)) {
            global.showToast?.('Informe um resultado natural entre 1 e 20.');
            naturalInput?.focus();
            return null;
        }

        const manualModifier = Number(modifierInput?.value || 0);
        const woundModifier = global.getCriticalWoundSkillModifier?.(
            combatant,
            skill,
            professional,
            breakdown.total,
            breakdown
        ) || { total: 0, details: [] };
        const toxicityModifier = global.getToxicitySkillModifier?.(combatant, skill) || { total: 0, details: [] };
        const modifier = manualModifier + woundModifier.total + toxicityModifier.total;
        const result = model.resolveCharacterSkillTest({
            naturalRoll,
            skillTotal: breakdown.total,
            modifier,
            target,
            inCombat: true
        });

        if (!result.valid) {
            global.showToast?.('Revise os valores informados para o teste.');
            return null;
        }

        applyCharacterSkillTestRewards(combatant, result);

        const comparison = document.getElementById('characterSkillComparison')?.value === 'opposed'
            ? 'Resultado do oponente'
            : 'Dificuldade do mestre';
        const outcome = result.success ? 'Sucesso' : 'Falha';
        const critical = result.classification === 'critical';
        const combatOutcomeContext = global.getCombatRollOutcomeContext?.(
            skill.id,
            result.naturalRoll
        ) || null;
        const preparedCriticalResult = global.syncPreparedAttackCriticalFromSkillTest?.(
            combatant,
            skill,
            result
        ) || { status: 'ignored', prepared: null };
        const opensOutcomeTable = Boolean(
            combatOutcomeContext && combatOutcomeContext.kind !== 'attack-critical'
        );
        const detail = [
            ...(professional ? ['Tipo: habilidade profissional assistida'] : []),
            `Dado: ${result.naturalRoll}${critical ? ' (20 natural — Crítico)' : ''}`,
            `${professional ? 'Nível profissional' : 'Total da perícia'}: ${result.skillTotal >= 0 ? '+' : ''}${result.skillTotal}`,
            `Modificador manual: ${manualModifier >= 0 ? '+' : ''}${manualModifier}`,
            ...(woundModifier.total ? [
                `Penalidade de ferimentos: ${woundModifier.total}`,
                ...woundModifier.details.map(detail => `Ferimento: ${detail}`)
            ] : []),
            ...(toxicityModifier.total ? [
                `Penalidade de toxicidade: ${toxicityModifier.total}`,
                ...toxicityModifier.details.map(detail => `Toxicidade: ${detail}`)
            ] : []),
            `Modificador final: ${result.modifier >= 0 ? '+' : ''}${result.modifier}`,
            `Resultado final: ${result.finalResult}`,
            `${comparison}: ${result.target}`,
            `Margem: ${result.margin >= 0 ? '+' : ''}${result.margin}`,
            `Resultado: ${outcome}`,
            ...(critical ? ['Recompensas: +1 Dado da Sorte · +1 Adrenalina'] : []),
            ...(combatOutcomeContext ? [
                `Desdobramento contextual: ${combatOutcomeContext.title}`,
                ...(opensOutcomeTable ? ['Tabela complementar de 1d10 aberta após o teste'] : [])
            ] : []),
            ...(preparedCriticalResult.status === 'prepared' ? [
                `Próximo dano: crítico preparado por 20 natural`,
                `Margem transportada: ${preparedCriticalResult.prepared.margin}`,
                'Adrenalina já concedida neste teste; o dano não concederá outro ponto'
            ] : []),
            ...(combatOutcomeContext?.kind === 'attack-critical' && preparedCriticalResult.status !== 'prepared' ? [
                'Crítico não preparado: o resultado final não venceu a defesa'
            ] : []),
            ...(professional ? [`Regra de referência: ${skill.description}`] : [])
        ].join('\n');

        global.savePlayersToStorage?.();
        global.addCombatHistoryEntry?.(
            `${combatant.name}: ${skill.name} ${result.finalResult} — ${critical ? 'Crítico' : outcome}`,
            detail,
            {
                type: 'skill-test',
                source: { id: combatant.id, name: combatant.name },
                participants: [{ id: combatant.id, name: combatant.name }],
                combat: {
                    testKind: professional ? 'professional' : 'general',
                    skillId: skill.id,
                    naturalRoll: result.naturalRoll,
                    skillTotal: result.skillTotal,
                    modifier: result.modifier,
                    target: result.target,
                    finalValue: result.finalResult,
                    success: result.success,
                    critical,
                    combatRollGroup: combatOutcomeContext?.group || '',
                    preparedCriticalId: preparedCriticalResult.prepared?.id || ''
                }
            }
        );

        closeCharacterSkillTest();
        global.renderList?.(false);
        if (opensOutcomeTable) {
            global.setTimeout?.(() => global.openCombatRollOutcomeFlow?.({
                combatantId: combatant.id,
                skillId: skill.id,
                skillName: skill.name,
                naturalRoll: result.naturalRoll
            }), 0);
        } else if (preparedCriticalResult.status === 'prepared') {
            global.showToast?.(
                `💥 ${combatant.name}: crítico preparado para o próximo dano · margem ${preparedCriticalResult.prepared.margin}.`
            );
        } else if (combatOutcomeContext?.kind === 'attack-critical') {
            global.showToast?.(
                `🎲 20 natural, mas o resultado ${result.finalResult} não venceu a defesa ${result.target}; nenhum dano foi preparado.`
            );
        } else {
            global.showToast?.(
                critical
                    ? `🎲 Crítico! ${combatant.name} obteve ${result.finalResult} e ganhou Sorte e Adrenalina.`
                    : `🎲 ${skill.name}: ${result.finalResult} — ${outcome}.`
            );
        }

        return result;
    }

    global.characterSkillTests = Object.freeze({
        getCharacterSkillEntries,
        getCharacterProfessionalSkillEntries,
        getProfessionalReminderPresentation,
        getSkillBonusOriginSummary,
        applyCharacterSkillTestRewards
    });
    global.toggleCharacterSkillsPanel = toggleCharacterSkillsPanel;
    global.toggleCharacterProfessionalSkillsPanel = toggleCharacterProfessionalSkillsPanel;
    global.renderCharacterSkillsPanel = renderCharacterSkillsPanel;
    global.renderCharacterProfessionalSkillsPanel = renderCharacterProfessionalSkillsPanel;
    global.openCharacterSkillTest = openCharacterSkillTest;
    global.openCharacterProfessionalSkillTest = openCharacterProfessionalSkillTest;
    global.closeCharacterSkillTest = closeCharacterSkillTest;
    global.setCharacterSkillTestComparison = setCharacterSkillTestComparison;
    global.executeCharacterSkillTest = executeCharacterSkillTest;
})(typeof window !== 'undefined' ? window : globalThis);
