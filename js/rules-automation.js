const AUTOMATION_MONSTER_CATEGORIES = Object.freeze({
    nilfgaardianraso: 'Humanoide',
    nilfgaardianknight: 'Humanoide',
    nilfgaardianinfantary: 'Humanoide',
    grifo: 'Híbrido',
    drowner: 'Necrófago',
    ghoul: 'Necrófago',
    lamia: 'Vampiro',
    witch: 'Necrófago',
    werewolf: 'Amaldiçoado',
    siren: 'Híbrido',
    forestdemon: 'Relicto',
    umbrenato: 'Amaldiçoado',
    leshen: 'Relicto',
    nevoloso: 'Necrófago',
    basilisk: 'Draconídeo',
    bullvore: 'Ogroide',
    kikimore: 'Insetoide',
    manticore: 'Besta',
    rotfiend: 'Necrófago',
    draugir: 'Espectro',
    katakan: 'Vampiro'
});

const AUTOMATION_OIL_CATEGORIES = Object.freeze({
    oleodefera: 'Besta',
    oleodeamaldicoado: 'Amaldiçoado',
    oleodedraconideo: 'Draconídeo',
    oleodeelemental: 'Elemental',
    venenodoenforcado: 'Humanoide',
    oleodehibrido: 'Híbrido',
    oleodeinsetoide: 'Insetoide',
    oleodenecrofago: 'Necrófago',
    oleodeogroide: 'Ogroide',
    oleoderelicto: 'Relicto',
    oleodeespectro: 'Espectro',
    oleodevampiro: 'Vampiro'
});

const AUTOMATION_COMBATANT_CATEGORIES = Object.freeze([
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

const AUTOMATION_MANAGED_EFFECTS = new Set([
    'ability:quen',
    'ability:quen_ampliado',
    'ability:yrden',
    'ability:axii',
    'ability:axii_marionete',
    'ability:rhewi',
    'ability:sufocar',
    'ability:tempestade_estatica',
    'ability:correntes_de_brasa',
    'ability:bencao_de_cura',
    'ability:reservatorio_primal',
    'ability:fios_da_vida',
    'ability:portal_vertical',
    'ability:dervixe',
    'ability:tempestade_de_raios',
    'ability:partir_agua',
    'ability:cancao_do_ceu',
    'ability:sabedoria_divina',
    'ability:sol_de_aenye',
    'ability:ira_da_floresta',
    'ability:bravura_de_freya',
    'ability:prisao_prismatica',
    'ability:circulo_de_melitele',
    'ability:fogo_purificador',
    'ability:po_para_cegar',
    'ability:segure_a_lingua',
    'item:podecoagulacao',
    'item:luacheia',
    'item:andorinha',
    'item:corujadomato',
    'item:fissstech',
    'item:papafigo',
    'item:sanguepreto',
    'item:podelua',
    'item:podedimeritio',
    'item:filtrodepetri',
    'item:trovoada',
    'item:cloroformio',
    'item:alucinogeno',
    'item:pocaodeperfume',
    'item:inflamador',
    'item:lagrimasdetalgar',
    'item:samun'
]);

const AUTOMATION_VARIABLE_STAMINA_ABILITIES = new Set([
    'quen',
    'quen_ampliado',
    'yrden',
    'axii',
    'axii_marionete'
]);

let pendingAutomationEffectApplication = null;

function getAutomationPreferences() {
    try {
        const stored = JSON.parse(localStorage.getItem('dnd_app_preferences')) || {};
        return {
            abilities: stored.rollModes?.abilities || 'manual',
            items: stored.rollModes?.items || 'manual',
            negativeConditions: stored.rollModes?.negativeConditions || 'auto'
        };
    } catch {
        return { abilities: 'manual', items: 'manual', negativeConditions: 'auto' };
    }
}

function parseAutomationDice(notation) {
    const match = String(notation || '').trim().match(/^(\d+)d(\d+)$/i);
    if (!match) return null;

    return {
        count: Number(match[1]),
        sides: Number(match[2])
    };
}

function rollAutomationDiceAutomatically(notation) {
    const dice = parseAutomationDice(notation);
    if (!dice) return 0;

    return Array.from(
        { length: dice.count },
        () => Math.floor(Math.random() * dice.sides) + 1
    ).reduce((total, value) => total + value, 0);
}

function requestAutomationDice(group, notation, label) {
    const dice = parseAutomationDice(notation);
    if (!dice) return null;

    if (getAutomationPreferences()[group] === 'auto') {
        return rollAutomationDiceAutomatically(notation);
    }

    const minimum = dice.count;
    const maximum = dice.count * dice.sides;
    const result = window.prompt(
        `${label}\nInforme o resultado de ${notation} (${minimum} a ${maximum}).`,
        ''
    );

    if (result === null) return null;

    const value = Number.parseInt(result, 10);
    if (!Number.isInteger(value) || value < minimum || value > maximum) {
        showToast(`Informe um resultado entre ${minimum} e ${maximum}.`);
        return null;
    }

    return value;
}

function rollAutomationDice(group, notation, label) {
    return requestAutomationDice(group, notation, label) ?? 0;
}

function requestAutomationInteger(title, label, minimum, maximum, defaultValue) {
    const result = window.prompt(`${title}\n${label}`, String(defaultValue));
    if (result === null) return null;

    const value = Number.parseInt(result, 10);
    if (!Number.isInteger(value) || value < minimum || value > maximum) {
        showToast(`Informe um valor entre ${minimum} e ${maximum}.`);
        return null;
    }

    return value;
}

function getAutomationEffect(combatant, type, id) {
    return combatant?.effects?.find(effect => effect.type === type && effect.id === id) || null;
}

function hasAutomationEffect(combatant, type, id) {
    return Boolean(getAutomationEffect(combatant, type, id));
}

function getAutomationData(effect) {
    return effect?.automation || {};
}

function normalizeAutomationCombatantCategory(value) {
    return AUTOMATION_COMBATANT_CATEGORIES.includes(value) ? value : '';
}

function setManualEntityCategoryInput(value) {
    const input = document.getElementById('entityRaceInp');
    if (input) input.value = normalizeAutomationCombatantCategory(value);
}

function getManualEntityCategoryInput() {
    return normalizeAutomationCombatantCategory(document.getElementById('entityRaceInp')?.value);
}

function ensureAutomationMonsterCategories() {
    monsterDatabase.forEach(monster => {
        const category = AUTOMATION_MONSTER_CATEGORIES[monster.id];
        if (category) monster.category = category;
    });

    combatants.forEach(combatant => {
        const category = AUTOMATION_MONSTER_CATEGORIES[combatant.presetMonsterId];
        if (category && !combatant.monsterCategory) {
            combatant.monsterCategory = category;
        }

        if (combatant.monsterCategory === 'Vampiro' && !hasAutomationEffect(combatant, 'condition', '🧛')) {
            addAutomationCondition(combatant, '🧛');
        }
    });
}

function addAutomationCondition(combatant, icon, parentEffect = null) {
    if (!combatant) return null;

    const existing = getAutomationEffect(combatant, 'condition', icon);
    if (existing) return existing;

    const duration = parentEffect?.remainingTurns ?? 0;
    const condition = {
        id: icon,
        type: 'condition',
        name: icon,
        remainingTurns: duration,
        initialTurns: duration,
        stacks: 1,
        maxStacks: 1,
        augment: 'debuff',
        automation: parentEffect
            ? { linkedEffect: { id: parentEffect.id, type: parentEffect.type } }
            : undefined
    };

    combatant.effects = combatant.effects || [];
    combatant.effects.push(condition);
    return condition;
}

function removeAutomationCondition(combatant, icon) {
    if (!combatant?.effects) return;
    combatant.effects = combatant.effects.filter(effect => !(effect.type === 'condition' && effect.id === icon));
}

function clearAutomationLinkedConditions(combatant) {
    if (!combatant?.effects) return;

    combatant.effects = combatant.effects.filter(effect => {
        const linkedTo = getAutomationData(effect).linkedEffect;
        if (!linkedTo) return true;

        return combatant.effects.some(parent =>
            parent.type === linkedTo.type && parent.id === linkedTo.id
        );
    });
}

function hasEffectBlockingAbility(combatant) {
    return hasAutomationEffect(combatant, 'item', 'podedimeritio');
}

function hasEffectBlockingItems(combatant) {
    return hasAutomationEffect(combatant, 'item', 'papafigo');
}

function hasEffectBlockingRegeneration(combatant) {
    return hasAutomationEffect(combatant, 'item', 'podelua');
}

function getAutomationConfig(type, id) {
    const key = `${type}:${id}`;

    switch (key) {
        case 'ability:quen': {
            const spent = requestAutomationInteger('Quen', 'EST gasta para o escudo (1 a 10):', 1, 10, 1);
            return spent === null ? null : {
                magicShieldHp: spent * 5,
                shieldKind: 'quen',
                spent,
                staminaCost: spent,
                stacks: spent,
                discardOverflow: true
            };
        }

        case 'ability:quen_ampliado': {
            const spent = requestAutomationInteger('Quen Ampliado', 'EST gasta para o escudo (1 a 15):', 1, 15, 1);
            return spent === null ? null : {
                magicShieldHp: spent * 10,
                shieldKind: 'quen-ampliado',
                spent,
                staminaCost: spent,
                stacks: spent,
                discardOverflow: true
            };
        }

        case 'ability:yrden': {
            const spent = requestAutomationInteger('Yrden', 'EST gasta para definir a penalidade (1 a 5):', 1, 5, 1);
            const duration = requestAutomationDice('abilities', '1d6', 'Yrden — duração');
            if (spent === null || duration === null) return null;
            return {
                duration,
                stacks: spent,
                spent,
                staminaCost: spent,
                note: `−${spent} Destreza e Esquiva dentro do círculo.`
            };
        }

        case 'ability:axii': {
            const spent = requestAutomationInteger('Axii', 'EST gasta para conjurar (1 a 15):', 1, 15, 1);
            if (spent === null) return null;

            const resistancePenalty = 1 + Math.floor((spent - 1) / 2);
            return {
                duration: 0,
                linkedCondition: '💫',
                stacks: spent,
                spent,
                staminaCost: spent,
                note: `Teste de resistência com −${resistancePenalty}.`
            };
        }

        case 'ability:axii_marionete': {
            const spent = requestAutomationInteger('Axii Marionete', 'EST gasta / duração em rodadas (1 a 15):', 1, 15, 1);
            return spent === null ? null : {
                duration: spent,
                stacks: spent,
                spent,
                staminaCost: spent,
                note: 'Controle mental ativo.'
            };
        }

        case 'ability:tempestade_estatica':
            return {
                turnDamage: window.confirm('O alvo está usando metal?') ? '2d6' : '1d6',
                rollGroup: 'abilities'
            };

        case 'ability:sufocar':
            return { turnDamage: '1d10', rollGroup: 'abilities', linkedCondition: '⚖️' };

        case 'ability:correntes_de_brasa':
            return { turnDamage: '2d6', rollGroup: 'abilities', linkedCondition: '⚖️' };

        case 'ability:bencao_de_cura':
            return { turnHealing: 3 };

        case 'ability:reservatorio_primal':
            return { perTurnSt: 6, note: '+5 em dano corpo a corpo e +6 dano físico.' };

        case 'ability:fios_da_vida':
            return { perTurnSt: 2 };

        case 'ability:portal_vertical':
        case 'ability:dervixe':
        case 'ability:tempestade_de_raios':
        case 'ability:partir_agua':
            return { perTurnSt: 6 };

        case 'ability:cancao_do_ceu':
        case 'ability:sabedoria_divina':
        case 'ability:sol_de_aenye':
        case 'ability:ira_da_floresta':
            return { perTurnSt: 5 };

        case 'ability:bravura_de_freya':
            return { temporaryHp: 25, temporaryKind: 'freya' };

        case 'ability:prisao_prismatica':
            return { linkedCondition: '⛓️', prisonHp: 40, note: 'Prisão: 40 PV mágicos.' };

        case 'ability:rhewi':
            return { linkedCondition: '🧊' };

        case 'ability:fogo_purificador':
            return { linkedCondition: '🔥' };

        case 'ability:po_para_cegar':
            return { linkedCondition: '🙈' };

        case 'ability:segure_a_lingua':
            return { linkedCondition: '🤐' };

        case 'item:luacheia': {
            const roll = requestAutomationDice('items', '1d20', 'Lua Cheia');
            return roll === null ? null : {
                temporaryHp: 10 + roll,
                temporaryKind: 'lua-cheia',
                roll
            };
        }

        case 'item:andorinha':
            return { turnHealingDice: '1d6', rollGroup: 'items', skipWhenAttacked: true };

        case 'item:corujadomato':
            return { turnStDice: '1d6', rollGroup: 'items' };

        case 'item:filtrodepetri': {
            const roll = requestAutomationDice('items', '1d6', 'Filtro de Petri');
            return roll === null ? null : { signalBonus: roll, note: `+${roll} EST no próximo sinal.` };
        }

        case 'item:cloroformio':
            return window.confirm('O alvo falhou no teste de resistência?') ? { linkedCondition: '🚫' } : null;

        case 'item:alucinogeno':
            return window.confirm('O alvo falhou no teste de resistência?') ? { linkedCondition: '🌀' } : null;

        case 'item:pocaodeperfume':
            return window.confirm('O alvo falhou no teste de Tolerância?') ? { linkedCondition: '🍷' } : null;

        case 'item:inflamador':
            return { linkedCondition: '🛢️' };

        case 'item:lagrimasdetalgar':
            return { linkedCondition: '🧊' };

        case 'item:samun':
            return { linkedCondition: '🙈' };

        default:
            return {};
    }
}

function applyAutomationMetadata(effect, metadata) {
    effect.automation = metadata;

    if (Number.isInteger(metadata.duration)) {
        effect.remainingTurns = metadata.duration;
        effect.initialTurns = metadata.duration;
    }

    if (Number.isInteger(metadata.stacks)) {
        effect.stacks = metadata.stacks;
    }
}

function getAutomationStaminaCost(metadata) {
    return Math.max(0, Number.parseInt(metadata?.staminaCost, 10) || 0);
}

function queueAutomationEffectApplication(target, caster, type, id, metadata) {
    pendingAutomationEffectApplication = {
        combatantId: String(target.id),
        type,
        id,
        metadata: {
            ...metadata,
            ...(caster
                ? {
                    staminaPayerId: String(caster.id),
                    staminaPayerName: caster.name
                }
                : {})
        }
    };
}

function consumeAutomationEffectApplication(combatant, type, id) {
    const pending = pendingAutomationEffectApplication;
    pendingAutomationEffectApplication = null;

    if (
        !pending ||
        String(combatant?.id) !== pending.combatantId ||
        type !== pending.type ||
        id !== pending.id
    ) {
        return null;
    }

    return pending.metadata;
}

function applyAutomationEffectStart(combatant, effect) {
    const metadata = getAutomationData(effect);
    const key = `${effect.type}:${effect.id}`;

    if (metadata.linkedCondition) {
        addAutomationCondition(combatant, metadata.linkedCondition, effect);
    }

    if (key === 'item:papafigo') {
        removeAutomationCondition(combatant, '🐍');
    }

    if (key === 'item:podelua') {
        removeAutomationCondition(combatant, '👻');
    }

    if (key === 'ability:circulo_de_melitele') {
        removeAutomationCondition(combatant, '😱');
        removeAutomationCondition(combatant, '🍷');
    }

    if (key === 'item:luacheia') {
        combatant.effects
            .filter(current => current !== effect && getAutomationData(current).temporaryKind === 'lua-cheia')
            .forEach(current => {
                current.automation.temporaryHp = 0;
            });
    }
}

function getRecurringConditionPrevention(combatant, effect) {
    if (effect.id === '🩸' && hasAutomationEffect(combatant, 'item', 'podecoagulacao')) {
        return 'contido pelo Pó de Coagulação';
    }

    if (effect.id === '🐍' && hasAutomationEffect(combatant, 'item', 'papafigo')) {
        return 'neutralizado por Papa-figo';
    }

    return '';
}

function applyAutomationDirectDamage(combatant, damage) {
    const amount = Math.max(0, Number(damage) || 0);
    if (!combatant || amount === 0) return 0;

    const previousHp = combatant.hpCurrent;
    combatant.hpCurrent = Math.max(0, combatant.hpCurrent - amount);
    combatant.stabilized = false;

    if (previousHp > 0 && combatant.hpCurrent === 0) {
        combatant.deathSaves = { success: 0, failures: 0 };
    }

    return amount;
}

function applyAutomationHealing(combatant, value) {
    const amount = Math.max(0, Number(value) || 0);
    if (!combatant || amount === 0 || hasEffectBlockingRegeneration(combatant)) return 0;

    const previousHp = combatant.hpCurrent;
    combatant.hpCurrent = Math.min(combatant.hpMax, combatant.hpCurrent + amount);
    return combatant.hpCurrent - previousHp;
}

function processAutomatedTurnEffects(combatant) {
    if (!combatant?.effects?.length) return [];

    ensureAutomationMonsterCategories();
    clearAutomationLinkedConditions(combatant);
    const changes = [];
    let changed = false;
    const wasAttacked = Boolean(combatant.automation?.attackedSinceTurn);

    [...combatant.effects].forEach(effect => {
        const metadata = getAutomationData(effect);
        if (!Object.keys(metadata).length) return;

        if (metadata.perTurnSt) {
            if (combatant.stCurrent >= metadata.perTurnSt) {
                combatant.stCurrent -= metadata.perTurnSt;
                changes.push(`${effect.name}: −${metadata.perTurnSt} EST`);
                changed = true;
            } else {
                combatant.effects = combatant.effects.filter(current => current !== effect);
                changes.push(`${effect.name}: encerrado por falta de EST`);
                changed = true;
                return;
            }
        }

        if (metadata.turnDamage) {
            const damage = rollAutomationDice(metadata.rollGroup || 'abilities', metadata.turnDamage, effect.name);
            const applied = applyAutomationDirectDamage(combatant, damage);
            changes.push(`${effect.name}: ${applied} de dano`);
            changed = changed || applied > 0;
        }

        if (metadata.turnHealing) {
            const healed = applyAutomationHealing(combatant, metadata.turnHealing);
            const reason = hasEffectBlockingRegeneration(combatant) ? 'bloqueada por Pó de Lua' : `+${healed} HP`;
            changes.push(`${effect.name}: cura ${reason}`);
            changed = changed || healed > 0;
        }

        if (metadata.turnHealingDice) {
            if (metadata.skipWhenAttacked && wasAttacked) {
                changes.push(`${effect.name}: não regenerou (foi atacado)`);
            } else if (hasEffectBlockingRegeneration(combatant)) {
                changes.push(`${effect.name}: regeneração bloqueada por Pó de Lua`);
            } else {
                const amount = rollAutomationDice(metadata.rollGroup || 'items', metadata.turnHealingDice, effect.name);
                const healed = applyAutomationHealing(combatant, amount);
                changes.push(`${effect.name}: +${healed} HP`);
                changed = changed || healed > 0;
            }
        }

        if (metadata.turnStDice) {
            const amount = rollAutomationDice(metadata.rollGroup || 'items', metadata.turnStDice, effect.name);
            const previousSt = combatant.stCurrent;
            combatant.stCurrent = Math.min(combatant.stMax, combatant.stCurrent + amount);
            changes.push(`${effect.name}: +${combatant.stCurrent - previousSt} EST`);
            changed = changed || combatant.stCurrent !== previousSt;
        }
    });

    combatant.automation = { ...(combatant.automation || {}), attackedSinceTurn: false };

    if (changed) {
        savePlayersToStorage();
    }

    window.setTimeout(renderAutomationCardSummaries, 0);
    return changes;
}

function getAutomationTemporarySources(combatant) {
    return (combatant?.effects || []).filter(effect => Number(getAutomationData(effect).temporaryHp) > 0);
}

function getAutomationMagicShieldSources(combatant) {
    return (combatant?.effects || []).filter(effect => Number(getAutomationData(effect).magicShieldHp) > 0);
}

function getAutomationMagicShieldHp(combatant) {
    return getAutomationMagicShieldSources(combatant)
        .reduce((total, effect) => total + Number(getAutomationData(effect).magicShieldHp || 0), 0);
}

function hasActiveMagicShield(combatant) {
    return getAutomationMagicShieldHp(combatant) > 0;
}

function getAutomationTemporaryHp(combatant) {
    return getAutomationTemporarySources(combatant)
        .reduce((total, effect) => total + Number(getAutomationData(effect).temporaryHp || 0), 0);
}

function getAutomationOilBonus(attacker, target) {
    if (!attacker || !target?.monsterCategory) return null;

    const effect = (attacker.effects || []).find(current =>
        current.type === 'item' && AUTOMATION_OIL_CATEGORIES[current.id] === target.monsterCategory
    );

    return effect ? { effect, category: target.monsterCategory } : null;
}

function triggerAutomationBloodBlack(attacker, target) {
    if (!attacker || attacker.id === target?.id || !hasAutomationEffect(target, 'item', 'sanguepreto')) {
        return '';
    }

    const hasDefinedCategory = Boolean(normalizeAutomationCombatantCategory(attacker.monsterCategory));
    let vampire =
        attacker.monsterCategory === 'Vampiro' ||
        hasAutomationEffect(attacker, 'condition', '🧛');

    // Uma categoria escolhida é a fonte de verdade: não é necessário perguntar novamente.
    if (!vampire && hasDefinedCategory) return '';

    if (!vampire) {
        vampire = window.confirm(`${attacker.name} é um Vampiro?\nMarque a condição Vampiro para automatizar os próximos ataques.`);
        if (vampire) addAutomationCondition(attacker, '🧛');
    }

    if (!vampire) return '';

    // Sangue Negro é um efeito da poção: usa a preferência de rolagem de itens.
    // Assim, pode pedir o resultado ao jogador ou rolar automaticamente conforme Configurações.
    const damage = rollAutomationDice('items', '1d6', 'Sangue Negro');
    const applied = applyAutomationDirectDamage(attacker, damage);
    return applied > 0 ? `Sangue Negro: ${attacker.name} sofre ${applied} de dano` : '';
}

function resolveAutomatedDamage(target, damage) {
    ensureAutomationMonsterCategories();
    const attacker = combatants.find(combatant => combatant.id === activeTurnId) || null;
    const messages = [];
    let remainingDamage = Math.max(0, Number(damage) || 0);

    target.automation = { ...(target.automation || {}), attackedSinceTurn: true };

    const oil = getAutomationOilBonus(attacker, target);
    if (oil) {
        remainingDamage += 12;
        messages.push(`${oil.effect.name}: +12 contra ${oil.category}`);
    }

    if (hasAutomationEffect(target, 'item', 'fissstech')) {
        remainingDamage = Math.floor(remainingDamage / 2);
        messages.push('Fissstech: dano reduzido pela metade');
    }

    const bloodBlack = triggerAutomationBloodBlack(attacker, target);
    if (bloodBlack) messages.push(bloodBlack);

    const magicShield = getAutomationMagicShieldSources(target)
        .find(effect => getAutomationData(effect).discardOverflow);

    if (magicShield) {
        const metadata = getAutomationData(magicShield);
        const absorbed = Math.min(remainingDamage, metadata.magicShieldHp);
        metadata.magicShieldHp -= absorbed;

        if (metadata.magicShieldHp <= 0) {
            target.effects = target.effects.filter(effect => effect !== magicShield);
            messages.push(`${magicShield.name}: escudo esgotado`);
            if (magicShield.id === 'quen_ampliado') {
                messages.push('Quen Ampliado: aplique 1d6 e o empurrão nos alvos próximos');
            }
        } else {
            messages.push(`${magicShield.name}: absorveu ${absorbed}`);
        }

        window.setTimeout(renderAutomationCardSummaries, 0);
        return { remainingDamage: 0, message: messages.join(' · ') };
    }

    getAutomationTemporarySources(target).forEach(effect => {
        if (remainingDamage <= 0) return;
        const metadata = getAutomationData(effect);
        const absorbed = Math.min(remainingDamage, metadata.temporaryHp);
        metadata.temporaryHp -= absorbed;
        remainingDamage -= absorbed;
        messages.push(`${effect.name}: absorveu ${absorbed}`);
    });

    window.setTimeout(renderAutomationCardSummaries, 0);
    return { remainingDamage, message: messages.join(' · ') };
}

function renderAutomationCardSummaries() {
    ensureAutomationMonsterCategories();

    combatants.forEach(combatant => {
        const card = document.getElementById(`card-${combatant.id}`);
        if (!card) return;

        const labels = [];
        const temporaryHp = getAutomationTemporaryHp(combatant);
        const magicShieldHp = getAutomationMagicShieldHp(combatant);
        const petri = getAutomationEffect(combatant, 'item', 'filtrodepetri');
        const petriBonus = getAutomationData(petri).signalBonus;

        if (magicShieldHp > 0) labels.push(`🜲 Escudo Mágico ${magicShieldHp}`);
        if (temporaryHp > 0) labels.push(`🛡️ ${temporaryHp} PV temporários`);
        if (combatant.type === 'monster' && combatant.monsterCategory) labels.push(`🏷️ ${combatant.monsterCategory}`);
        if (petriBonus) labels.push(`✨ Petri +${petriBonus} EST`);

        const current = card.querySelector('.automation-card-summary');
        if (!labels.length) {
            current?.remove();
            return;
        }

        const text = labels.join(' · ');
        if (current) {
            if (current.textContent !== text) current.textContent = text;
            return;
        }

        const summary = document.createElement('div');
        summary.className = 'automation-card-summary';
        summary.textContent = text;
        card.appendChild(summary);
    });
}

function getAutomationConditionBlock(combatant, icon) {
    if (icon === '🐍' && hasEffectBlockingItems(combatant)) {
        return 'Papa-figo impede Veneno enquanto estiver ativo.';
    }

    if (icon === '👻' && hasEffectBlockingRegeneration(combatant)) {
        return 'Pó de Lua impede Invisibilidade enquanto estiver ativo.';
    }

    return '';
}

function repairAutomationEffectCollections() {
    let changed = false;

    combatants.forEach(combatant => {
        if (!Array.isArray(combatant.effects)) {
            combatant.effects = Array.isArray(combatant.armor?.effects)
                ? combatant.armor.effects
                : [];
            changed = true;
        }

        if (combatant.armor && Object.prototype.hasOwnProperty.call(combatant.armor, 'effects')) {
            delete combatant.armor.effects;
            changed = true;
        }

        (combatant.effects || []).forEach(effect => {
            const metadata = getAutomationData(effect);
            const isLegacyQuen =
                effect.type === 'ability' &&
                (effect.id === 'quen' || effect.id === 'quen_ampliado') &&
                Number(metadata.temporaryHp) > 0;

            if (!isLegacyQuen) return;

            metadata.magicShieldHp = metadata.temporaryHp;
            metadata.shieldKind = effect.id;
            delete metadata.temporaryHp;
            delete metadata.temporaryKind;
            changed = true;
        });
    });

    if (changed) savePlayersToStorage();
    return changed;
}

function installRulesAutomation() {
    repairAutomationEffectCollections();
    ensureAutomationMonsterCategories();

    const originalSpawnPresetMonster = window.spawnPresetMonster;
    window.spawnPresetMonster = monsterId => {
        originalSpawnPresetMonster(monsterId);
        ensureAutomationMonsterCategories();
        savePlayersToStorage();
        renderList(false);
    };

    const originalOpenModal = window.openModal;
    if (originalOpenModal) {
        window.openModal = type => {
            const result = originalOpenModal(type);
            setManualEntityCategoryInput('');
            return result;
        };
    }

    const originalEditCombatant = window.editCombatant;
    if (originalEditCombatant) {
        window.editCombatant = (event, id) => {
            const result = originalEditCombatant(event, id);
            const combatant = combatants.find(current => current.id === id);
            setManualEntityCategoryInput(combatant?.monsterCategory);
            return result;
        };
    }

    const originalSaveEntity = window.saveEntity;
    window.saveEntity = () => {
        const editedCombatantId = editingId;
        const previousIds = new Set(combatants.map(combatant => combatant.id));
        const category = getManualEntityCategoryInput();
        const previousCategory = editedCombatantId
            ? normalizeAutomationCombatantCategory(
                combatants.find(combatant => combatant.id === editedCombatantId)?.monsterCategory
            )
            : '';
        originalSaveEntity();

        const combatant = editedCombatantId
            ? combatants.find(current => current.id === editedCombatantId)
            : combatants.find(current => !previousIds.has(current.id));

        if (!combatant) return;

        combatant.monsterCategory = category;
        ensureAutomationMonsterCategories();
        savePlayersToStorage();
        if (previousCategory !== category) {
            const previousLabel = previousCategory || 'Não definida';
            const categoryLabel = category || 'Não definida';
            window.addCombatHistoryEntry?.(
                `${combatant.name}: Raça/categoria atualizada ${previousLabel} → ${categoryLabel}`,
                '',
                {
                    type: 'participant',
                    target: { id: combatant.id, name: combatant.name },
                    participants: [{ id: combatant.id, name: combatant.name }]
                }
            );
        }
        repairAutomationEffectCollections();
        renderList(false);
    };

    const originalOpenEffectModal = window.openEffectModal;
    window.openEffectModal = () => {
        if (repairAutomationEffectCollections()) renderList(false);
        originalOpenEffectModal();
    };

    const originalShowEffectList = window.showEffectList;
    window.showEffectList = type => {
        repairAutomationEffectCollections();
        originalShowEffectList(type);
    };

    const originalOpenDamageBodyModal =
        window.openDamageBodyModal ||
        (typeof openDamageBodyModal === 'function' ? openDamageBodyModal : null);

    if (originalOpenDamageBodyModal) {
        window.openDamageBodyModal = () => {
            const target = combatants.find(combatant => combatant.id === selectedId);
            const baseDamage = Math.max(0, Number.parseInt(currentInput, 10) || 0);
            const magicShieldHp = getAutomationMagicShieldHp(target);

            // Um golpe totalmente absorvido por Quen não tem localização, armadura
            // ou multiplicador corporal: é sempre dano direto de 1x no escudo.
            if (target && baseDamage > 0 && baseDamage <= magicShieldHp) {
                window.applyHP(false);
                return;
            }

            originalOpenDamageBodyModal();
        };
    }

    const originalApplyCalculatedDamage =
        window.applyCalculatedDamage ||
        (typeof applyCalculatedDamage === 'function' ? applyCalculatedDamage : null);

    if (originalApplyCalculatedDamage) {
        window.applyCalculatedDamage = (typeMultiplier, ignoreArmor = false) => {
            const target = combatants.find(combatant => combatant.id === selectedId);

            if (target && hasActiveMagicShield(target)) {
                showToast('🜲 Escudo Mágico: dano direcionado ao escudo, sem usar armadura.');
                return originalApplyCalculatedDamage(typeMultiplier, true);
            }

            return originalApplyCalculatedDamage(typeMultiplier, ignoreArmor);
        };
    }

    const guardedToggleEffect = window.toggleEffect;
    window.toggleEffect = (type, id) => {
        const combatant = combatants.find(current => current.id === selectedId);
        if (!combatant) return guardedToggleEffect(type, id);

        const existing = getAutomationEffect(combatant, type, id);
        if (existing) {
            guardedToggleEffect(type, id);
            window.setTimeout(renderAutomationCardSummaries, 0);
            return;
        }

        if (type === 'ability' && hasEffectBlockingAbility(combatant)) {
            showToast('Pó de Dimerítio bloqueia magias neste alvo.');
            return;
        }

        if (type === 'item' && id !== 'papafigo' && hasEffectBlockingItems(combatant)) {
            showToast('Papa-figo neutraliza outras poções neste alvo.');
            return;
        }

        if (!AUTOMATION_MANAGED_EFFECTS.has(`${type}:${id}`)) {
            guardedToggleEffect(type, id);
            return;
        }

        let caster = null;
        if (type === 'ability' && AUTOMATION_VARIABLE_STAMINA_ABILITIES.has(id)) {
            caster = combatants.find(current => current.id === activeTurnId) || null;
            if (!caster) {
                showToast('Defina o turno ativo antes de conjurar esta magia.');
                return;
            }
        }

        const metadata = getAutomationConfig(type, id);
        if (metadata === null) return;

        const staminaCost = getAutomationStaminaCost(metadata);
        if (staminaCost > 0 && !caster) {
            caster = combatants.find(current => current.id === activeTurnId) || null;
        }
        if (staminaCost > 0 && !caster) {
            showToast('Defina o turno ativo antes de gastar EST.');
            return;
        }
        if (staminaCost > Math.max(0, Number(caster?.stCurrent) || 0)) {
            showToast(`${caster.name} não possui EST suficiente para conjurar esta magia.`);
            return;
        }

        queueAutomationEffectApplication(combatant, caster, type, id, metadata);
        guardedToggleEffect(type, id);
        const applied = getAutomationEffect(combatant, type, id);
        if (!applied) {
            pendingAutomationEffectApplication = null;
            return;
        }

        applyAutomationMetadata(applied, getAutomationData(applied));
        applyAutomationEffectStart(combatant, applied);
        savePlayersToStorage();
        renderList(false);
        window.setTimeout(renderAutomationCardSummaries, 0);
    };

    const guardedToggleCondition = window.toggleCondition;
    window.toggleCondition = icon => {
        const combatant = combatants.find(current => current.id === selectedId);
        const existing = getAutomationEffect(combatant, 'condition', icon);
        const block = !existing ? getAutomationConditionBlock(combatant, icon) : '';

        if (block) {
            showToast(block);
            return;
        }

        guardedToggleCondition(icon);
        window.setTimeout(renderAutomationCardSummaries, 0);
    };

    const combatList = document.getElementById('combatList');
    if (combatList) {
        new MutationObserver(() => window.setTimeout(renderAutomationCardSummaries, 0))
            .observe(combatList, { childList: true, subtree: true });
    }

    window.setTimeout(() => {
        repairAutomationEffectCollections();
        ensureAutomationMonsterCategories();
        savePlayersToStorage();
        renderList(false);
        renderAutomationCardSummaries();
    }, 0);

    renderAutomationCardSummaries();
}

window.rollAutomationDice = rollAutomationDice;
window.getRecurringConditionPrevention = getRecurringConditionPrevention;
window.processAutomatedTurnEffects = processAutomatedTurnEffects;
window.resolveAutomatedDamage = resolveAutomatedDamage;
window.addAutomationCondition = addAutomationCondition;
window.renderAutomationCardSummaries = renderAutomationCardSummaries;
window.hasActiveMagicShield = hasActiveMagicShield;
window.consumeAutomationEffectApplication = consumeAutomationEffectApplication;
window.refreshAutomationMonsterCategories = () => {
    ensureAutomationMonsterCategories();
    savePlayersToStorage();
    window.setTimeout(renderAutomationCardSummaries, 0);
};
window.addEventListener('load', installRulesAutomation);
