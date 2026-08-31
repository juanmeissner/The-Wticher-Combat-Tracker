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
    'ability:ritual_de_vida',
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
    'item:nevasca',
    'item:gato',
    'item:baleiaassassina',
    'item:bosquedemaribor',
    'item:trovoada',
    'item:adesivoalquimico',
    'item:cloroformio',
    'item:ervasentorpecentes',
    'item:elixirdepantagran',
    'item:alucinogeno',
    'item:pocaodeperfume',
    'item:inflamador',
    'item:fluidoesterilizante',
    'item:soprodesucubo',
    'item:lagrimasdetalgar',
    'item:bafodedragao',
    'item:samun'
]);

const AUTOMATION_DIRECT_INVENTORY_ITEMS = new Set([
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

let pendingCharacterSpellEffect = null;

const AUTOMATION_VARIABLE_STAMINA_ABILITIES = new Set([
    'quen',
    'quen_ampliado',
    'yrden',
    'axii',
    'axii_marionete'
]);

const AUTOMATION_INSTANT_HEALING_ABILITIES = new Set([
    'cura_magica'
]);

let pendingAutomationEffectApplication = null;
let pendingAutomationDamageContext = null;

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

function getAutomationAdrenalineGain(combatant, baseGain = 0) {
    const base = Math.max(0, Math.floor(Number(baseGain) || 0));
    const effect = getAutomationEffect(combatant, 'item', 'bosquedemaribor');
    const multiplier = effect
        ? Math.max(1, Number(getAutomationData(effect).adrenalineGainMultiplier) || 2)
        : 1;
    return {
        base,
        multiplier,
        bonus: base * (multiplier - 1),
        total: base * multiplier,
        source: multiplier > 1 ? effect?.name || 'Bosque de Maribor' : ''
    };
}

function getAutomationEnvironmentBenefits(combatant) {
    const cat = getAutomationEffect(combatant, 'item', 'gato');
    const killerWhale = getAutomationEffect(combatant, 'item', 'baleiaassassina');
    return {
        ignoresDarknessVisionPenalty: Boolean(cat) && getAutomationData(cat).ignoresDarknessVisionPenalty !== false,
        hypnosisImmune: Boolean(cat) && getAutomationData(cat).hypnosisImmune !== false,
        illusionResistanceBonus: cat
            ? Math.max(0, Number(getAutomationData(cat).illusionResistanceBonus) || 5)
            : 0,
        breathHoldMultiplier: killerWhale
            ? Math.max(1, Number(getAutomationData(killerWhale).breathHoldMultiplier) || 1.5)
            : 1,
        ignoresUnderwaterVisionPenalty: Boolean(killerWhale) &&
            getAutomationData(killerWhale).ignoresUnderwaterVisionPenalty !== false
    };
}

function calculateAutomationBreathDuration(combatant, baseDuration = 0) {
    const base = Math.max(0, Number(baseDuration) || 0);
    const benefits = getAutomationEnvironmentBenefits(combatant);
    return {
        base,
        multiplier: benefits.breathHoldMultiplier,
        total: Math.floor(base * benefits.breathHoldMultiplier)
    };
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

    const block = getAutomationConditionBlock(combatant, icon);
    if (block) {
        showToast?.(block);
        return null;
    }

    const existing = getAutomationEffect(combatant, 'condition', icon);
    if (existing) return existing;

    const duration = parentEffect?.remainingTurns ?? 0;
    const definition = typeof conditionDescriptions !== 'undefined'
        ? conditionDescriptions[icon]
        : null;
    const condition = {
        id: icon,
        type: 'condition',
        name: definition?.title || icon,
        shortDescription: definition?.desc || '',
        remainingTurns: duration,
        initialTurns: duration,
        stacks: 1,
        maxStacks: Math.max(1, Number(definition?.stack) || 1),
        augment: definition?.augment || 'debuff',
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

function isInventoryItemAutomationManaged(itemOrId) {
    const id = typeof itemOrId === 'string' ? itemOrId : itemOrId?.id;
    const item = typeof itemOrId === 'object'
        ? itemOrId
        : predefinedItems.find(current => current.id === id);

    return Boolean(
        id && (
            AUTOMATION_DIRECT_INVENTORY_ITEMS.has(id) ||
            item?.potion ||
            item?.oil
        ) && (
            AUTOMATION_DIRECT_INVENTORY_ITEMS.has(id) ||
            Object.prototype.hasOwnProperty.call(item || {}, 'active')
        )
    );
}

function setPendingAutomationDamageContext(context = {}) {
    pendingAutomationDamageContext = context && typeof context === 'object'
        ? { ...context }
        : {};
}

function peekPendingAutomationDamageContext() {
    return pendingAutomationDamageContext && typeof pendingAutomationDamageContext === 'object'
        ? { ...pendingAutomationDamageContext }
        : {};
}

function consumeAutomationDamageResolution(target) {
    const resolution = target?.automation?.lastDamageResolution || null;
    if (target?.automation) delete target.automation.lastDamageResolution;
    return resolution;
}

function prepareAutomatedLocalizedDamage(target, damage, context = {}) {
    if (context.prelocalizedAutomation) {
        return { ...context.prelocalizedAutomation };
    }
    const requestedDamage = Math.max(0, Number(damage) || 0);
    let adjustedDamage = requestedDamage;
    const damageType = String(context.damageType || '').toLocaleLowerCase('pt-BR');
    const hasDragonBreath = hasAutomationEffect(target, 'item', 'bafodedragao');
    const hasIgniter = hasAutomationEffect(target, 'item', 'inflamador');
    const hasFireReaction = hasDragonBreath || hasIgniter;
    const isFireDamage = damageType === 'fire' || damageType === 'fogo' || (
        !damageType &&
        hasFireReaction &&
        window.confirm(`${target.name} possui um efeito que reage a Fogo. Este dano é de Fogo?`)
    );
    const messages = [];
    let fireBonus = 0;
    let fireMultiplier = 1;

    if (isFireDamage) {
        if (hasDragonBreath) {
            adjustedDamage += 20;
            fireBonus = 20;
            messages.push('Bafo de Dragão: +20 antes do local de acerto');
        }
        if (hasIgniter) {
            adjustedDamage *= 2;
            fireMultiplier = 2;
            messages.push('Inflamador: dano de Fogo dobrado antes do local de acerto');
        }
    }

    return {
        requestedDamage,
        adjustedDamage: Math.max(0, Math.floor(adjustedDamage)),
        damageType: isFireDamage ? 'fire' : damageType,
        fireBonus,
        fireMultiplier,
        message: messages.join(' · ')
    };
}

function getConfiguredAutomationSpent(options, min, max, requestValue) {
    const configured = Number(options?.spent);
    if (Number.isInteger(configured)) {
        return Math.min(max, Math.max(min, configured));
    }

    return requestValue();
}

function getAutomationConfig(type, id, options = {}) {
    const key = `${type}:${id}`;

    switch (key) {
        case 'ability:quen': {
            const spent = getConfiguredAutomationSpent(options, 1, 10, () =>
                requestAutomationInteger('Quen', 'EST gasta para o escudo (1 a 10):', 1, 10, 1)
            );
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
            const spent = getConfiguredAutomationSpent(options, 1, 15, () =>
                requestAutomationInteger('Quen Ampliado', 'EST gasta para o escudo (1 a 15):', 1, 15, 1)
            );
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
            const spent = getConfiguredAutomationSpent(options, 1, 5, () =>
                requestAutomationInteger('Yrden', 'EST gasta para definir a penalidade (1 a 5):', 1, 5, 1)
            );
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
            const spent = getConfiguredAutomationSpent(options, 1, 15, () =>
                requestAutomationInteger('Axii', 'EST gasta para conjurar (1 a 15):', 1, 15, 1)
            );
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
            const spent = getConfiguredAutomationSpent(options, 1, 15, () =>
                requestAutomationInteger('Axii Marionete', 'EST gasta / duração em rodadas (1 a 15):', 1, 15, 1)
            );
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
            return { turnHealing: 3, perTurnSt: 3, staminaCost: 5 };

        case 'ability:ritual_de_vida':
            return { duration: 10, turnHealing: 3, staminaCost: 5 };

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

        case 'item:nevasca': {
            const roll = requestAutomationDice('items', '1d6', 'Nevasca — bônus de perícias');
            return roll === null ? null : {
                skillBonus: roll,
                skillIds: [
                    'block', 'brawl', 'staff_spear', 'fencing', 'short_blades',
                    'archery', 'two_handed', 'reflex_dodge', 'athletics',
                    'acrobatics', 'spellcasting', 'perception'
                ],
                roll,
                note: `+${roll} em sentidos, defesa, esquiva, movimento, feitiços e perícias com armas.`
            };
        }

        case 'item:gato':
            return {
                ignoresDarknessVisionPenalty: true,
                hypnosisImmune: true,
                illusionResistanceBonus: 5,
                note: 'Sem penalidade visual por escuridão; imune a hipnose; +5 em testes contextuais contra ilusões.'
            };

        case 'item:baleiaassassina':
            return {
                breathHoldMultiplier: 1.5,
                ignoresUnderwaterVisionPenalty: true,
                note: 'Respiração submersa ×1,5; sem penalidade de visão subaquática.'
            };

        case 'item:bosquedemaribor':
            return {
                adrenalineGainMultiplier: 2,
                note: 'Cada ganho de Adrenalina concede 1 dado adicional.'
            };

        case 'item:trovoada':
            return {
                combatSkillBonus: 2,
                combatSkillGroups: ['meleeAttack', 'rangedAttack', 'block', 'dodge'],
                note: '+2 em Ataques, Bloqueio e Esquiva.'
            };

        case 'item:andorinha':
            return { turnHealingDice: '1d6', rollGroup: 'items', skipWhenAttacked: true };

        case 'item:corujadomato':
            return { turnStDice: '1d6', rollGroup: 'items' };

        case 'item:filtrodepetri': {
            const roll = requestAutomationDice('items', '1d6', 'Filtro de Petri');
            return roll === null ? null : { signalBonus: roll, note: `+${roll} EST no próximo sinal.` };
        }

        case 'item:adesivoalquimico':
            return { adhesiveCountdown: 2, note: 'O adesivo endurece após 2 turnos do alvo.' };

        case 'item:cloroformio':
            return { linkedCondition: '🚫' };

        case 'item:alucinogeno':
            return { linkedCondition: '🌀' };

        case 'item:ervasentorpecentes':
            return { duration: 20, linkedCondition: '🌀', stabilizesCriticalWound: true };

        case 'item:elixirdepantagran':
            return { duration: 120, linkedCondition: '🤪' };

        case 'item:pocaodeperfume': {
            const pending = window.getPendingInventoryItemAutomationOptions?.(id) || {};
            return {
                duration: Math.max(60, Number(pending.duration) || 60),
                linkedConditions: ['🍷', '🐍'],
                poisonNoSave: true,
                note: pending.hours ? `${pending.hours} hora(s) · somente cura de veneno remove o efeito.` : ''
            };
        }

        case 'item:inflamador':
            return { linkedCondition: '🛢️' };

        case 'item:fluidoesterilizante':
            return { duration: 20, linkedCondition: '🧴', healingMultiplier: 2 };

        case 'item:soprodesucubo': {
            const pending = window.getPendingInventoryItemAutomationOptions?.(id) || {};
            return {
                duration: 30,
                succubusMode: pending.succubusMode || 'skin',
                note: pending.succubusMode === 'drink'
                    ? '−5 em Resistir à Sedução.'
                    : '+2 em Sedução.'
            };
        }

        case 'item:lagrimasdetalgar':
            return { linkedCondition: '🧊' };

        case 'item:bafodedragao':
            return { duration: 3, fireDamageBonus: 20 };

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

function isAutomationWitcherSign(type, id) {
    if (type !== 'ability') return false;

    const ability = predefinedAbilities.find(current => current.id === id);
    const profession = String(ability?.profession || '').toLocaleLowerCase('pt-BR');
    const category = String(ability?.category || '').toLocaleLowerCase('pt-BR');

    return profession === 'bruxo' || category === 'bruxo';
}

function getAutomationEnergyAvailability(caster, metadata = {}) {
    const stamina = Math.max(0, Number(caster?.stCurrent) || 0);
    const temporarySt = Math.max(0, Number(window.getCareTemporarySt?.(caster)) || 0);
    const runeSource = metadata.prioritizeRuneSource
        ? Math.max(0, Number(caster?.runeSourceCurrent) || 0)
        : 0;

    return {
        stamina,
        temporarySt,
        runeSource,
        total: stamina + temporarySt + runeSource
    };
}

function spendAutomationEnergy(caster, metadata = {}) {
    const cost = getAutomationStaminaCost(metadata);
    const availability = getAutomationEnergyAvailability(caster, metadata);

    if (!caster || cost > availability.total) return false;

    const runeSourceSpent = metadata.prioritizeRuneSource
        ? Math.min(cost, availability.runeSource)
        : 0;
    const remainingAfterRune = cost - runeSourceSpent;
    const temporaryResult = window.spendCareTemporarySt?.(caster, remainingAfterRune)
        || { spent: 0, availableAfter: availability.temporarySt };
    const temporaryStSpent = Math.min(remainingAfterRune, Math.max(0, Number(temporaryResult.spent) || 0));
    const staminaSpent = remainingAfterRune - temporaryStSpent;

    metadata.staminaBefore = availability.stamina;
    metadata.staminaSpent = staminaSpent;
    metadata.staminaAfter = availability.stamina - staminaSpent;
    metadata.temporaryStBefore = availability.temporarySt;
    metadata.temporaryStSpent = temporaryStSpent;
    metadata.temporaryStAfter = Math.max(0, Number(temporaryResult.availableAfter) || 0);

    if (metadata.prioritizeRuneSource) {
        metadata.runeSourceBefore = availability.runeSource;
        metadata.runeSourceSpent = runeSourceSpent;
        metadata.runeSourceAfter = availability.runeSource - runeSourceSpent;
        caster.runeSourceCurrent = metadata.runeSourceAfter;
    }
    caster.stCurrent = metadata.staminaAfter;

    return true;
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

function isAutomationManagedEffect(type, id) {
    return AUTOMATION_MANAGED_EFFECTS.has(`${type}:${id}`);
}

function prepareCharacterSpellEffect(target, caster, id, cast = {}) {
    pendingCharacterSpellEffect = null;
    if (!target || !caster || !id) return null;

    if (getAutomationEffect(target, 'ability', id)) {
        showToast(`${target.name} já possui este efeito ativo.`);
        return null;
    }

    if (hasEffectBlockingAbility(target)) {
        showToast('Pó de Dimerítio bloqueia magias neste alvo.');
        return null;
    }

    if (!isAutomationManagedEffect('ability', id)) {
        return { managed: false };
    }

    const metadata = getAutomationConfig('ability', id, { spent: cast.baseCost });
    if (metadata === null) return null;

    pendingCharacterSpellEffect = {
        targetId: String(target.id),
        casterId: String(caster.id),
        id,
        metadata: {
            ...metadata,
            staminaCost: 0,
            prepaidSpellCast: true,
            spellCast: { ...cast }
        }
    };

    return { managed: true, metadata: pendingCharacterSpellEffect.metadata };
}

function consumeCharacterSpellEffect(target, id) {
    const prepared = pendingCharacterSpellEffect;
    pendingCharacterSpellEffect = null;

    if (!prepared || prepared.targetId !== String(target?.id) || prepared.id !== id) {
        return null;
    }

    return prepared;
}

function applyAutomationEffectStart(combatant, effect) {
    const metadata = getAutomationData(effect);
    const key = `${effect.type}:${effect.id}`;

    if (metadata.linkedCondition) {
        addAutomationCondition(combatant, metadata.linkedCondition, effect);
    }

    (metadata.linkedConditions || []).forEach(icon => {
        addAutomationCondition(combatant, icon, effect);
    });

    if (key === 'item:papafigo') {
        removeAutomationCondition(combatant, '🐍');
    }

    if (key === 'item:podelua') {
        removeAutomationCondition(combatant, '👻');
    }

    if (key === 'item:gato') {
        removeAutomationCondition(combatant, '😍');
        combatant.effects = combatant.effects.filter(current => !(
            current.type === 'ability' && ['axii', 'axii_marionete'].includes(current.id)
        ));
        clearAutomationLinkedConditions(combatant);
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
    const baseAmount = Math.max(0, Number(value) || 0);
    const multiplier = Math.max(0, Number(window.getItemConditionHealingMultiplier?.(combatant)) || 1);
    const amount = Math.floor(baseAmount * multiplier);
    if (!combatant || amount === 0 || hasEffectBlockingRegeneration(combatant)) return 0;

    const previousHp = combatant.hpCurrent;
    combatant.hpCurrent = Math.min(combatant.hpMax, combatant.hpCurrent + amount);
    return combatant.hpCurrent - previousHp;
}

function applyInstantAbilityHealing(target, caster, ability) {
    if (!target || !caster || !ability || !AUTOMATION_INSTANT_HEALING_ABILITIES.has(ability.id)) {
        return null;
    }

    const staminaCost = Math.max(0, Number.parseInt(ability.cost, 10) || 0);
    const energyMetadata = { staminaCost, prioritizeRuneSource: false };
    if (getAutomationEnergyAvailability(caster, energyMetadata).total < staminaCost) {
        showToast(`${caster.name} não possui EST suficiente para conjurar ${ability.name}.`);
        return null;
    }

    const roll = requestAutomationDice('abilities', '1d6', `${ability.name} — cura`);
    if (roll === null) return null;

    const calculation = window.characterSpellCasting?.calculateSpellHealing?.(caster, ability, roll);
    if (!calculation?.valid) {
        showToast(`Não foi possível calcular a cura de ${ability.name}.`);
        return null;
    }

    let result = null;
    const mutate = () => {
        const hpBefore = Math.max(0, Number(target.hpCurrent) || 0);
        const hpMaximum = Math.max(hpBefore, Number(target.hpMax) || 0);
        const blocked = hasEffectBlockingRegeneration(target);
        const healingMultiplier = Math.max(0, Number(window.getItemConditionHealingMultiplier?.(target)) || 1);
        const effectiveHealing = Math.floor(calculation.total * healingMultiplier);
        if (!spendAutomationEnergy(caster, energyMetadata)) return null;

        const hpAfter = blocked
            ? hpBefore
            : Math.min(hpMaximum, hpBefore + effectiveHealing);
        target.hpCurrent = hpAfter;
        if (hpAfter > hpBefore) {
            target.deathSaves = { success: 0, failures: 0 };
            target.stabilized = false;
        }
        result = {
            ...calculation,
            healingMultiplier,
            effectiveHealing,
            blocked,
            healed: hpAfter - hpBefore,
            hpBefore,
            hpAfter,
            energy: { ...energyMetadata }
        };
        savePlayersToStorage();
        renderList(false);
        return result;
    };
    const detail = () => [
        `Magia: ${ability.name}`,
        `Fórmula de cura: ${calculation.base} + ${calculation.attributeLabel} ${calculation.attributeBonus} + ${calculation.dice} ${calculation.roll} = ${calculation.total}`,
        ...(result?.healingMultiplier !== 1 ? [`Fluido/condições: ${calculation.total} ×${result?.healingMultiplier} = ${result?.effectiveHealing}`] : []),
        result?.blocked ? 'Cura efetiva: 0 PV · regeneração bloqueada' : `Cura efetiva: ${result?.healed || 0} PV`,
        `PV de ${target.name}: ${result?.hpBefore ?? target.hpCurrent} → ${result?.hpAfter ?? target.hpCurrent}`,
        `EST de ${caster.name}: ${energyMetadata.staminaBefore ?? caster.stCurrent} → ${energyMetadata.staminaAfter ?? caster.stCurrent}`
    ].join('\n');
    const metadata = () => ({
        type: 'healing',
        source: { id: caster.id, name: caster.name },
        target: { id: target.id, name: target.name },
        participants: [
            { id: caster.id, name: caster.name },
            { id: target.id, name: target.name }
        ],
        effect: { id: ability.id, type: 'ability', name: ability.name, action: 'conjurada' },
        combat: {
            action: 'spell-healing',
            abilityId: ability.id,
            finalValue: result?.healed || 0,
            requestedValue: calculation.total,
            before: { hp: result?.hpBefore ?? target.hpCurrent },
            after: { hp: result?.hpAfter ?? target.hpCurrent },
            healing: {
                base: calculation.base,
                attributeLabel: calculation.attributeLabel,
                attributeBonus: calculation.attributeBonus,
                dice: calculation.dice,
                roll: calculation.roll,
                blocked: Boolean(result?.blocked)
            }
        }
    });

    const trackedResult = window.trackCombatAction
        ? window.trackCombatAction(
            () => `${caster.name} conjurou ${ability.name} em ${target.name}: ${result?.healed || 0} PV`,
            mutate,
            detail,
            metadata
        )
        : mutate();
    if (!trackedResult) return null;

    showToast(result.blocked
        ? `🌿 ${ability.name}: a regeneração de ${target.name} está bloqueada.`
        : `🌿 ${caster.name} curou ${target.name} em ${result.healed} PV.`);
    return result;
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
            const staminaPayer = metadata.staminaPayerId
                ? combatants.find(current => String(current.id) === String(metadata.staminaPayerId))
                : combatant;
            const turnCost = Math.max(0, Number(metadata.perTurnSt) || 0);
            const availability = getAutomationEnergyAvailability(staminaPayer, {});
            if (staminaPayer && availability.total >= turnCost) {
                const payment = { staminaCost: turnCost };
                spendAutomationEnergy(staminaPayer, payment);
                changes.push(`${effect.name}: −${turnCost} EST de ${staminaPayer.name || 'conjurador'}${payment.temporaryStSpent ? ` (${payment.temporaryStSpent} temporário)` : ''}`);
                changed = true;
            } else {
                combatant.effects = combatant.effects.filter(current => current !== effect);
                changes.push(`${effect.name}: encerrado por falta de EST do conjurador`);
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
    const damageContext = pendingAutomationDamageContext || {};
    pendingAutomationDamageContext = null;
    const prelocalized = damageContext.prelocalizedAutomation || null;
    const resolution = {
        requestedDamage: remainingDamage,
        damageType: damageContext.damageType || '',
        fireBonus: Math.max(0, Number(prelocalized?.fireBonus) || 0),
        fireMultiplier: Math.max(1, Number(prelocalized?.fireMultiplier) || 1),
        fissstechSuppressed: 0,
        damageAfterFisstech: remainingDamage,
        remainingDamage
    };

    if (prelocalized?.message) messages.push(prelocalized.message);

    target.automation = { ...(target.automation || {}), attackedSinceTurn: true };

    const oil = getAutomationOilBonus(attacker, target);
    if (oil) {
        remainingDamage += 12;
        messages.push(`${oil.effect.name}: +12 contra ${oil.category}`);
    }

    const hasFireReaction = hasAutomationEffect(target, 'item', 'bafodedragao') ||
        hasAutomationEffect(target, 'item', 'inflamador');
    const isFireDamage = !prelocalized && (
        damageContext.damageType === 'fire' || (
            !damageContext.damageType &&
            hasFireReaction &&
            window.confirm(`${target.name} possui um efeito que reage a Fogo. Este dano é de Fogo?`)
        )
    );

    if (isFireDamage) {
        resolution.damageType = 'fire';
        if (hasAutomationEffect(target, 'item', 'bafodedragao')) {
            remainingDamage += 20;
            resolution.fireBonus = 20;
            messages.push('Bafo de Dragão: +20 de dano de Fogo');
        }
        if (hasAutomationEffect(target, 'item', 'inflamador')) {
            remainingDamage *= 2;
            resolution.fireMultiplier = 2;
            messages.push('Inflamador: dano de Fogo dobrado');
        }
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
        resolution.remainingDamage = 0;
        resolution.magicShieldAbsorbed = absorbed;
        target.automation.lastDamageResolution = resolution;
        return { ...resolution, remainingDamage: 0, message: messages.join(' · ') };
    }

    if (hasAutomationEffect(target, 'item', 'fissstech')) {
        const beforeFissstech = remainingDamage;
        remainingDamage = Math.floor(beforeFissstech / 2);
        resolution.fissstechSuppressed = beforeFissstech - remainingDamage;
        resolution.damageAfterFisstech = remainingDamage;
        messages.push(`Fisstech: suprimiu ${resolution.fissstechSuppressed} de dano`);
    }

    getAutomationTemporarySources(target).forEach(effect => {
        if (remainingDamage <= 0) return;
        const metadata = getAutomationData(effect);
        const absorbed = Math.min(remainingDamage, metadata.temporaryHp);
        metadata.temporaryHp -= absorbed;
        remainingDamage -= absorbed;
        messages.push(`${effect.name}: absorveu ${absorbed}`);
    });

    resolution.remainingDamage = remainingDamage;
    target.automation.lastDamageResolution = resolution;
    window.setTimeout(renderAutomationCardSummaries, 0);
    return { ...resolution, remainingDamage, message: messages.join(' · ') };
}

function renderAutomationCardSummaries() {
    ensureAutomationMonsterCategories();

    combatants.forEach(combatant => {
        const card = document.getElementById(`card-${combatant.id}`);
        if (!card) return;

        const labels = [];
        const temporaryHp = getAutomationTemporaryHp(combatant);
        const temporarySt = Math.max(0, Number(window.getCareTemporarySt?.(combatant)) || 0);
        const magicShieldHp = getAutomationMagicShieldHp(combatant);
        const petri = getAutomationEffect(combatant, 'item', 'filtrodepetri');
        const petriBonus = getAutomationData(petri).signalBonus;
        const blizzardBonus = getAutomationData(getAutomationEffect(combatant, 'item', 'nevasca')).skillBonus;
        const thunderboltBonus = getAutomationData(getAutomationEffect(combatant, 'item', 'trovoada')).combatSkillBonus;
        const mariborMultiplier = getAutomationData(getAutomationEffect(combatant, 'item', 'bosquedemaribor')).adrenalineGainMultiplier;

        if (magicShieldHp > 0) labels.push(`🜲 Escudo Mágico ${magicShieldHp}`);
        if (temporaryHp > 0) labels.push(`🛡️ ${temporaryHp} PV temporários`);
        if (temporarySt > 0) labels.push(`⚡ ${temporarySt} EST temporário`);
        if (combatant.type === 'monster' && combatant.monsterCategory) labels.push(`🏷️ ${combatant.monsterCategory}`);
        if (petriBonus) labels.push(`✨ Petri +${petriBonus} EST`);
        if (blizzardBonus) labels.push(`❄️ Nevasca +${blizzardBonus}`);
        if (thunderboltBonus) labels.push(`⚡ Trovoada +${thunderboltBonus}`);
        if (mariborMultiplier > 1) labels.push(`🎲 Adrenalina ×${mariborMultiplier}`);

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
    if (icon === '😍' && getAutomationEnvironmentBenefits(combatant).hypnosisImmune) {
        return 'Gato impede Hipnose e Enfeitiçado enquanto estiver ativo.';
    }

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
        window.openDamageBodyModal = (options = {}) => {
            const target = combatants.find(combatant => combatant.id === selectedId);
            const baseDamage = Math.max(0, Number.parseInt(currentInput, 10) || 0);

            if (
                !options.skipMountedChoice
                && target
                && baseDamage > 0
                && window.requestMountedDamageTarget?.(
                    target,
                    baseDamage,
                    () => window.openDamageBodyModal({ skipMountedChoice: true })
                )
            ) {
                return;
            }

            const magicShieldHp = getAutomationMagicShieldHp(target);
            const spellContext = window.getPendingSpellDamageContext?.() || {};
            const localized = target && baseDamage > 0 && magicShieldHp > 0
                ? prepareAutomatedLocalizedDamage(target, baseDamage, spellContext)
                : null;

            // Um golpe totalmente absorvido por Quen não tem localização, armadura
            // ou multiplicador corporal: é sempre dano direto de 1x no escudo.
            if (target && localized && localized.adjustedDamage <= magicShieldHp) {
                setPendingAutomationDamageContext({
                    ...spellContext,
                    damageType: localized.damageType,
                    prelocalizedAutomation: localized
                });
                window.applyHP(false, localized.adjustedDamage, {
                    baseDamage,
                    localizedBaseDamage: localized.adjustedDamage,
                    damageType: localized.damageType,
                    prelocalizedAutomation: localized,
                    damageSource: spellContext.damageSource || null,
                    spellDamage: spellContext.spellDamage || null,
                    itemDamage: spellContext.itemDamage || null
                });
                return;
            }

            if (localized) {
                setPendingAutomationDamageContext({
                    ...spellContext,
                    damageType: localized.damageType,
                    prelocalizedAutomation: localized
                });
            }

            originalOpenDamageBodyModal({ skipMountedChoice: true });
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

    function applyInventoryItemEffectOnOwner(target, id) {
        const combatTarget = combatants.find(current => String(current.id) === String(target?.id));
        const item = predefinedItems.find(current => current.id === id);
        const isActivePotion = Boolean(
            item?.potion && Object.prototype.hasOwnProperty.call(item, 'active')
        );
        const isActiveOil = Boolean(
            item?.oil &&
            AUTOMATION_OIL_CATEGORIES[id] &&
            Object.prototype.hasOwnProperty.call(item, 'active')
        );

        if (!combatTarget) {
            showToast('Adicione o personagem ao combate antes de consumir um item com efeito ativo.');
            return { applied: false, blocked: true, reason: 'not-in-combat' };
        }
        const isManagedInventoryItem = AUTOMATION_DIRECT_INVENTORY_ITEMS.has(id);
        if (!isActivePotion && !isActiveOil && !isManagedInventoryItem) {
            return { applied: false, notApplicable: true };
        }
        if (isActivePotion && id !== 'papafigo' && hasEffectBlockingItems(combatTarget)) {
            showToast('Papa-figo neutraliza outras poções neste personagem.');
            return { applied: false, blocked: true, reason: 'papafigo' };
        }

        const metadata = AUTOMATION_MANAGED_EFFECTS.has(`item:${id}`)
            ? getAutomationConfig('item', id)
            : {};
        if (metadata === null) {
            return { applied: false, cancelled: true };
        }

        if (!Array.isArray(combatTarget.effects)) combatTarget.effects = [];
        const existingIndex = combatTarget.effects.findIndex(
            effect => effect.type === 'item' && effect.id === id
        );
        const previousEffect = existingIndex >= 0
            ? JSON.parse(JSON.stringify(combatTarget.effects[existingIndex]))
            : null;

        if (existingIndex >= 0) combatTarget.effects.splice(existingIndex, 1);

        queueAutomationEffectApplication(combatTarget, null, 'item', id, metadata);
        const previousSelectedId = selectedId;
        selectedId = combatTarget.id;

        try {
            guardedToggleEffect('item', id);
        } finally {
            selectedId = previousSelectedId;
        }

        const applied = getAutomationEffect(combatTarget, 'item', id);
        if (!applied) {
            pendingAutomationEffectApplication = null;
            if (previousEffect) combatTarget.effects.splice(existingIndex, 0, previousEffect);
            return { applied: false, cancelled: true };
        }

        applyAutomationMetadata(applied, getAutomationData(applied));
        applyAutomationEffectStart(combatTarget, applied);
        applied.sourceId = combatTarget.id;
        applied.sourceName = combatTarget.name;
        savePlayersToStorage();
        renderList(false);
        window.setTimeout(renderAutomationCardSummaries, 0);

        return {
            applied: true,
            refreshed: Boolean(previousEffect),
            effect: applied,
            targetId: combatTarget.id,
            effectKind: isActiveOil ? 'oil' : (isActivePotion ? 'potion' : 'item')
        };
    }

    window.applyInventoryItemEffectOnOwner = applyInventoryItemEffectOnOwner;

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

        if (
            type === 'ability' &&
            ['axii', 'axii_marionete'].includes(id) &&
            getAutomationEnvironmentBenefits(combatant).hypnosisImmune
        ) {
            showToast(`Gato protege ${combatant.name} contra a hipnose de ${id === 'axii' ? 'Axii' : 'Axii Marionete'}.`);
            return;
        }

        if (type === 'ability' && AUTOMATION_INSTANT_HEALING_ABILITIES.has(id)) {
            const caster = combatants.find(current => current.id === activeTurnId) || null;
            if (!caster) {
                showToast('Defina o turno ativo antes de conjurar esta magia de cura.');
                return;
            }
            const ability = predefinedAbilities.find(current => current.id === id);
            return applyInstantAbilityHealing(combatant, caster, ability);
        }

        const preparedSpell = type === 'ability'
            ? consumeCharacterSpellEffect(combatant, id)
            : null;

        if (!AUTOMATION_MANAGED_EFFECTS.has(`${type}:${id}`)) {
            guardedToggleEffect(type, id);
            return;
        }

        let caster = preparedSpell
            ? combatants.find(current => String(current.id) === preparedSpell.casterId) || null
            : null;
        if (!preparedSpell && type === 'ability' && AUTOMATION_VARIABLE_STAMINA_ABILITIES.has(id)) {
            caster = combatants.find(current => current.id === activeTurnId) || null;
            if (!caster) {
                showToast('Defina o turno ativo antes de conjurar esta magia.');
                return;
            }
        }

        const metadata = preparedSpell?.metadata || getAutomationConfig(type, id);
        if (metadata === null) return;

        const staminaCost = getAutomationStaminaCost(metadata);
        metadata.prioritizeRuneSource = staminaCost > 0 && isAutomationWitcherSign(type, id);
        if (staminaCost > 0 && !caster) {
            caster = combatants.find(current => current.id === activeTurnId) || null;
        }
        if (staminaCost > 0 && !caster) {
            showToast('Defina o turno ativo antes de gastar EST.');
            return;
        }
        if (staminaCost > getAutomationEnergyAvailability(caster, metadata).total) {
            showToast(metadata.prioritizeRuneSource
                ? `${caster.name} não possui Fonte Rúnica/EST suficiente para conjurar este Sinal.`
                : `${caster.name} não possui EST suficiente para conjurar esta magia.`);
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
window.isInventoryItemAutomationManaged = isInventoryItemAutomationManaged;
window.setPendingAutomationDamageContext = setPendingAutomationDamageContext;
window.peekPendingAutomationDamageContext = peekPendingAutomationDamageContext;
window.consumeAutomationDamageResolution = consumeAutomationDamageResolution;
window.prepareAutomatedLocalizedDamage = prepareAutomatedLocalizedDamage;
window.getAutomationAdrenalineGain = getAutomationAdrenalineGain;
window.getAutomationEnvironmentBenefits = getAutomationEnvironmentBenefits;
window.calculateAutomationBreathDuration = calculateAutomationBreathDuration;
window.isAutomationRegenerationBlocked = hasEffectBlockingRegeneration;
window.applyInstantAbilityHealing = applyInstantAbilityHealing;
window.getRecurringConditionPrevention = getRecurringConditionPrevention;
window.processAutomatedTurnEffects = processAutomatedTurnEffects;
window.resolveAutomatedDamage = resolveAutomatedDamage;
window.addAutomationCondition = addAutomationCondition;
window.renderAutomationCardSummaries = renderAutomationCardSummaries;
window.hasActiveMagicShield = hasActiveMagicShield;
window.consumeAutomationEffectApplication = consumeAutomationEffectApplication;
window.isAutomationManagedEffect = isAutomationManagedEffect;
window.prepareCharacterSpellEffect = prepareCharacterSpellEffect;
window.getAutomationEnergyAvailability = getAutomationEnergyAvailability;
window.spendAutomationEnergy = spendAutomationEnergy;
window.refreshAutomationMonsterCategories = () => {
    ensureAutomationMonsterCategories();
    savePlayersToStorage();
    window.setTimeout(renderAutomationCardSummaries, 0);
};
window.addEventListener('load', installRulesAutomation);
