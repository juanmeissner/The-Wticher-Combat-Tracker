(function initializeCareServices(global) {
    'use strict';

    const CARE_STATE_VERSION = 5;
    const MAX_CARE_RECORDS = 30;
    const CARE_DAILY_BENEFIT_STATUS_IDS = Object.freeze([
        'well_fed', 'refreshed', 'well_rested',
        'survivor_ballad', 'freya_abundance', 'freya_fruits'
    ]);

    const CARE_PROFESSIONAL_SKILL_IDS = Object.freeze({
        divineInitiate: 'melitele_iniciado_dos_deuses',
        prolongedCare: 'melitele_cuidado_prolongado',
        singForCoin: 'grey_roads_minstrel_cantar_por_moedas',
        lightSleeper: 'grey_roads_minstrel_dormir_leve',
        survivorBallad: 'grey_roads_minstrel_balada_do_sobrevivente',
        freyaAbundance: 'freya_ciclo_de_abundancia',
        freyaFruits: 'freya_frutos_de_freya'
    });
    const PROLONGED_CARE_HP_BY_LEVEL = Object.freeze([0, 3, 5, 7, 9]);

    const CARE_STATUS_DEFINITIONS = Object.freeze({
        hungry: Object.freeze({ icon: '🍽️', name: 'Faminto', augment: 'debuff', maxStacks: 99 }),
        poor_hygiene: Object.freeze({ icon: '🧼', name: 'Falta de Higiene', augment: 'debuff', maxStacks: 99 }),
        sleep_deprivation: Object.freeze({ icon: '🥱', name: 'Privação de Sono', augment: 'debuff', maxStacks: 99 }),
        uncomfortable: Object.freeze({ icon: '🪵', name: 'Desconfortável', augment: 'debuff', maxStacks: 1 }),
        well_fed: Object.freeze({ icon: '🍲', name: 'Bem Alimentado', augment: 'buff', maxStacks: 2 }),
        refreshed: Object.freeze({ icon: '🛁', name: 'Revigorado', augment: 'buff', maxStacks: 2 }),
        well_rested: Object.freeze({ icon: '🌙', name: 'Bem Descansado', augment: 'buff', maxStacks: 2 }),
        survivor_ballad: Object.freeze({ icon: '🎵', name: 'Balada do Sobrevivente', augment: 'buff', maxStacks: 4 }),
        freya_abundance: Object.freeze({ icon: '🌾', name: 'Ciclo de Abundância', augment: 'buff', maxStacks: 4 }),
        freya_fruits: Object.freeze({ icon: '🍎', name: 'Frutos de Freya', augment: 'buff', maxStacks: 4 })
    });

    const CARE_CATEGORY_RELATIONSHIPS = Object.freeze({
        food: Object.freeze({ negative: 'hungry', positive: 'well_fed' }),
        hygiene: Object.freeze({ negative: 'poor_hygiene', positive: 'refreshed' }),
        lodging: Object.freeze({ negative: 'sleep_deprivation', positive: 'well_rested' })
    });

    const CARE_PHYSICAL_SKILL_IDS = Object.freeze([
        'block', 'brawl', 'staff_spear', 'fencing', 'short_blades', 'spellcasting',
        'lockpicking', 'acrobatics', 'athletics', 'archery', 'stealth', 'two_handed',
        'sleight_of_hand', 'reflex_dodge', 'riding', 'physique', 'tolerance'
    ]);
    const CARE_CONCENTRATION_SKILL_IDS = Object.freeze([
        ...CARE_PHYSICAL_SKILL_IDS,
        'courage', 'resist_coercion', 'history_geography', 'investigation', 'tactics',
        'nature', 'business', 'traps', 'hunting', 'resist_magic', 'deduction',
        'education', 'nordic', 'elder_speech', 'dwarven', 'monster_lore',
        'nilfgaardian', 'social_etiquette', 'streetwise', 'teaching', 'alchemy',
        'perception', 'crafting', 'disguise', 'first_aid', 'trap_crafting', 'survival',
        'fine_arts', 'deceit', 'human_perception', 'forgery'
    ]);
    const CARE_HYGIENE_SKILL_IDS = Object.freeze([
        'appearance_style', 'persuasion', 'seduction', 'social_etiquette'
    ]);
    const CARE_REFRESHED_SKILL_IDS = Object.freeze([
        'seduction', 'persuasion', 'fine_arts', 'appearance_style'
    ]);
    const CARE_RESISTANCE_SKILL_IDS = Object.freeze([
        'physique', 'tolerance', 'courage', 'resist_coercion', 'resist_magic'
    ]);

    const CARE_ASSISTED_SKILL_IDS = Object.freeze({
        'Físico': 'physique',
        'Intimidação': 'intimidation'
    });

    const CARE_CATALOG = Object.freeze({
        food: Object.freeze({
            id: 'food',
            icon: '🍲',
            name: 'Alimentação',
            options: Object.freeze([
                Object.freeze({ id: 'no_food', name: 'Sem alimentação', cost: 0, recovery: { hp: 0, st: 0 }, status: { id: 'hungry', stacks: 1 }, summary: 'Faminto +1; −1 por pilha nas perícias físicas.' }),
                Object.freeze({ id: 'simple_meal', name: 'Refeição Simples', cost: 10, recovery: { hp: 10, st: 5 }, summary: 'Recupera 10 HP e 5 EST.' }),
                Object.freeze({ id: 'good_meal', name: 'Refeição Boa', cost: 20, recovery: { hp: 20, st: 10 }, status: { id: 'well_fed', stacks: 1 }, resources: { adrenaline: 1, temporaryHp: 5, temporarySt: 5 }, summary: 'Recupera 20 HP e 10 EST; Bem Alimentado ×1.' }),
                Object.freeze({ id: 'sophisticated_meal', name: 'Refeição Sofisticada', cost: 60, recovery: { hp: 30, st: 20 }, status: { id: 'well_fed', stacks: 2 }, resources: { adrenaline: 2, temporaryHp: 10, temporarySt: 10 }, summary: 'Recupera 30 HP e 20 EST; Bem Alimentado ×2.' })
            ])
        }),
        hygiene: Object.freeze({
            id: 'hygiene',
            icon: '🛁',
            name: 'Higiene',
            options: Object.freeze([
                Object.freeze({ id: 'no_bath', name: 'Sem banho', cost: 0, recovery: { hp: 0, st: 0 }, status: { id: 'poor_hygiene', stacks: 1 }, summary: 'Falta de Higiene +1.' }),
                Object.freeze({ id: 'cold_bath', name: 'Banho Frio', cost: 5, recovery: { hp: 0, st: 0 }, summary: 'Remove a falta de higiene, sem bônus adicional.' }),
                Object.freeze({ id: 'hot_bath', name: 'Banho Quente', cost: 15, recovery: { hp: 5, st: 10 }, status: { id: 'refreshed', stacks: 1 }, resources: { temporaryHp: 5, temporarySt: 5 }, summary: 'Recupera 5 HP e 10 EST; Revigorado ×1.' }),
                Object.freeze({
                    id: 'sophisticated_bath',
                    name: 'Sofisticado com Espuma e Ervas',
                    cost: 60,
                    recovery: { hp: 15, st: 20 },
                    status: { id: 'refreshed', stacks: 2 },
                    resources: { temporaryHp: 10, temporarySt: 15, luckDice: 1 },
                    directSkillBonuses: { seduction: 3, appearance_style: 3 },
                    summary: 'Recupera 15 HP e 20 EST; Revigorado ×2, +1 Dado da Sorte, +3 Sedução e +3 Aparência e Estilo.'
                })
            ])
        }),
        lodging: Object.freeze({
            id: 'lodging',
            icon: '🛏️',
            name: 'Sono e hospedagem',
            options: Object.freeze([
                Object.freeze({ id: 'no_sleep', name: 'Ficar sem dormir', cost: 0, recovery: { hp: 0, st: 0 }, status: { id: 'sleep_deprivation', stacks: 1 }, summary: 'Privação de Sono +1 e sem recuperação diária.' }),
                Object.freeze({ id: 'straw_stable', name: 'Palha no Chão / Estábulo', cost: 2, costRange: { min: 1, max: 2 }, recovery: { hp: 10, st: 5 }, assistedTests: [{ skill: 'Físico', difficulty: 16, failure: 'Desconfortável' }], summary: 'Recupera 10 HP e 5 EST; teste de Físico ND 16.' }),
                Object.freeze({ id: 'strange_inn', name: 'Quarto de Hospedaria Esquisito', cost: 4, recovery: { hp: 15, st: 10 }, assistedTests: [{ skill: 'Físico', difficulty: 14, failure: 'Desconfortável' }, { skill: 'Intimidação', difficulty: 14, failure: 'Roubo assistido pelo mestre' }], summary: 'Recupera 15 HP e 10 EST; testes de Físico e Intimidação ND 14.' }),
                Object.freeze({ id: 'cheap_inn', name: 'Quarto de Hospedaria Barato', cost: 8, recovery: { hp: 25, st: 15 }, assistedTests: [{ skill: 'Físico', difficulty: 10, failure: 'Desconfortável' }], summary: 'Recupera 25 HP e 15 EST; teste de Físico ND 10.' }),
                Object.freeze({ id: 'normal_inn', name: 'Quarto de Hospedaria Normal', cost: 10, recovery: { hp: 30, st: 20 }, summary: 'Recupera 30 HP e 20 EST.' }),
                Object.freeze({ id: 'quality_inn', name: 'Quarto de Hospedaria de Qualidade', cost: 20, recovery: { hp: 40, st: 30 }, status: { id: 'well_rested', stacks: 1 }, resources: { adrenaline: 1, temporaryHp: 10, temporarySt: 10 }, summary: 'Recupera 40 HP e 30 EST; Bem Descansado ×1.' }),
                Object.freeze({ id: 'luxury_inn', name: 'Quarto de Hospedaria Chique', cost: 60, recovery: { hp: 50, st: 40 }, status: { id: 'well_rested', stacks: 2 }, resources: { adrenaline: 2, temporaryHp: 20, temporarySt: 20 }, summary: 'Recupera 50 HP e 40 EST; Bem Descansado ×2 e +2 Adrenalina.' })
            ])
        })
    });

    let pendingCarePlan = null;

    function cloneCareValue(value, fallback = null) {
        try {
            return JSON.parse(JSON.stringify(value ?? fallback));
        } catch {
            return cloneCareValue(fallback, null);
        }
    }

    function escapeCareHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function normalizeCareAmount(value, fallback = 0) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : Math.max(0, Math.floor(Number(fallback) || 0));
    }

    function getCareStatusDefinition(statusId) {
        return CARE_STATUS_DEFINITIONS[String(statusId)] || null;
    }

    function getCareStatusIdFromEffect(effect) {
        const explicit = String(effect?.automation?.careStatusId || '');
        if (explicit && CARE_STATUS_DEFINITIONS[explicit]) return explicit;
        return Object.entries(CARE_STATUS_DEFINITIONS)
            .find(([, definition]) => definition.icon === effect?.id)?.[0] || '';
    }

    function getCareEffect(combatant, statusId) {
        return (combatant?.effects || []).find(effect =>
            effect?.type === 'condition' && getCareStatusIdFromEffect(effect) === String(statusId)
        ) || null;
    }

    function removeCareStatus(combatant, statusId) {
        if (!Array.isArray(combatant?.effects)) return null;
        const effect = getCareEffect(combatant, statusId);
        if (!effect) return null;
        combatant.effects = combatant.effects.filter(entry => entry !== effect);
        return effect;
    }

    function setCareStatus(combatant, statusId, stacks, option = {}, increment = false) {
        const definition = getCareStatusDefinition(statusId);
        if (!combatant || !definition) return null;
        if (!Array.isArray(combatant.effects)) combatant.effects = [];

        let effect = getCareEffect(combatant, statusId);
        const previousStacks = Math.max(0, Number(effect?.stacks) || 0);
        const nextStacks = Math.min(
            definition.maxStacks,
            Math.max(1, increment ? previousStacks + Math.max(1, Number(stacks) || 1) : Number(stacks) || 1)
        );
        if (!effect) {
            effect = {
                id: definition.icon,
                type: 'condition',
                name: definition.name,
                remainingTurns: 0,
                initialTurns: 0,
                stacks: nextStacks,
                maxStacks: definition.maxStacks,
                augment: definition.augment,
                systemManaged: 'care',
                automation: {}
            };
            combatant.effects.push(effect);
        }

        effect.stacks = nextStacks;
        effect.maxStacks = definition.maxStacks;
        effect.augment = definition.augment;
        effect.systemManaged = 'care';
        effect.automation = {
            ...(effect.automation || {}),
            careStatusId: statusId,
            careOptionId: option.id || effect.automation?.careOptionId || '',
            temporaryHp: Math.max(0, Number(option.resources?.temporaryHp) || 0),
            temporarySt: Math.max(0, Number(option.resources?.temporarySt) || 0),
            directSkillBonuses: cloneCareValue(option.directSkillBonuses, {}),
            professionalSkillId: option.professionalSkillId || effect.automation?.professionalSkillId || '',
            professionalSourceId: option.professionalSourceId || effect.automation?.professionalSourceId || '',
            professionalSourceName: option.professionalSourceName || effect.automation?.professionalSourceName || '',
            note: option.note || effect.automation?.note || ''
        };
        return { effect, previousStacks, nextStacks };
    }

    function getCareTemporarySt(combatant) {
        return (combatant?.effects || []).reduce(
            (total, effect) => total + Math.max(0, Number(effect?.automation?.temporarySt) || 0),
            0
        );
    }

    function spendCareTemporarySt(combatant, requestedAmount) {
        let remaining = normalizeCareAmount(requestedAmount);
        const availableBefore = getCareTemporarySt(combatant);
        const sources = (combatant?.effects || []).filter(effect => Number(effect?.automation?.temporarySt) > 0);
        sources.forEach(effect => {
            if (remaining <= 0) return;
            const available = Math.max(0, Number(effect.automation.temporarySt) || 0);
            const spent = Math.min(remaining, available);
            effect.automation.temporarySt = available - spent;
            remaining -= spent;
        });
        return {
            requested: normalizeCareAmount(requestedAmount),
            spent: normalizeCareAmount(requestedAmount) - remaining,
            remaining,
            availableBefore,
            availableAfter: getCareTemporarySt(combatant)
        };
    }

    function getCareSkillModifier(combatant, skill) {
        const result = { total: 0, details: [], advantage: false, disadvantage: false };
        const skillId = String(skill?.id || '');
        if (!combatant || !skillId) return result;

        const hungryStacks = Math.max(0, Number(getCareEffect(combatant, 'hungry')?.stacks) || 0);
        if (hungryStacks && CARE_PHYSICAL_SKILL_IDS.includes(skillId)) {
            result.total -= hungryStacks;
            result.details.push(`Faminto ×${hungryStacks}: −${hungryStacks}`);
        }

        const hygieneStacks = Math.max(0, Number(getCareEffect(combatant, 'poor_hygiene')?.stacks) || 0);
        if (hygieneStacks && CARE_HYGIENE_SKILL_IDS.includes(skillId)) {
            result.total -= hygieneStacks;
            result.details.push(`Falta de Higiene ×${hygieneStacks}: −${hygieneStacks}`);
        }

        const sleepStacks = Math.max(0, Number(getCareEffect(combatant, 'sleep_deprivation')?.stacks) || 0);
        if (sleepStacks && CARE_CONCENTRATION_SKILL_IDS.includes(skillId)) {
            result.total -= sleepStacks;
            result.details.push(`Privação de Sono ×${sleepStacks}: −${sleepStacks}`);
        }

        if (getCareEffect(combatant, 'uncomfortable') && CARE_PHYSICAL_SKILL_IDS.includes(skillId)) {
            result.disadvantage = true;
            result.details.push('Desconfortável: desvantagem em teste físico');
        }

        const refreshed = getCareEffect(combatant, 'refreshed');
        const refreshedStacks = Math.max(0, Number(refreshed?.stacks) || 0);
        if (refreshedStacks && CARE_REFRESHED_SKILL_IDS.includes(skillId)) {
            result.total += refreshedStacks;
            result.details.push(`Revigorado ×${refreshedStacks}: +${refreshedStacks}`);
        }
        const directBonus = Number(refreshed?.automation?.directSkillBonuses?.[skillId]) || 0;
        if (directBonus) {
            result.total += directBonus;
            result.details.push(`Banho sofisticado: +${directBonus}`);
        }

        const abundanceStacks = Math.max(0, Number(getCareEffect(combatant, 'freya_abundance')?.stacks) || 0);
        if (abundanceStacks && CARE_RESISTANCE_SKILL_IDS.includes(skillId)) {
            result.total += abundanceStacks;
            result.details.push(`Ciclo de Abundância ×${abundanceStacks}: +${abundanceStacks}`);
        }

        const fruitsStacks = Math.max(0, Number(getCareEffect(combatant, 'freya_fruits')?.stacks) || 0);
        if (fruitsStacks && CARE_PHYSICAL_SKILL_IDS.includes(skillId)) {
            result.total += fruitsStacks;
            result.details.push(`Frutos de Freya ×${fruitsStacks}: +${fruitsStacks}`);
        }

        return result;
    }

    function getCareCategory(categoryId) {
        return CARE_CATALOG[String(categoryId)] || null;
    }

    function getCareOption(categoryId, optionId) {
        return getCareCategory(categoryId)?.options.find(option => option.id === String(optionId)) || null;
    }

    function divideCareCost(total, payerIds) {
        const amount = normalizeCareAmount(total);
        const ids = [...new Set((payerIds || []).map(String).filter(Boolean))];
        if (!amount || !ids.length) return [];

        const base = Math.floor(amount / ids.length);
        let remainder = amount % ids.length;
        return ids.map(payerId => ({ payerId, amount: base + (remainder-- > 0 ? 1 : 0) }));
    }

    function getCareParticipants() {
        return (typeof combatants !== 'undefined' && Array.isArray(combatants) ? combatants : [])
            .filter(combatant => combatant?.type === 'player');
    }

    function getDefaultCareParticipant(participants) {
        return participants.find(entry => String(entry.id) === String(typeof selectedId !== 'undefined' ? selectedId : ''))
            || participants.find(entry => String(entry.id) === String(typeof activeTurnId !== 'undefined' ? activeTurnId : ''))
            || participants[0]
            || null;
    }

    function getCareProfessionalSkillLevel(combatant, skillId) {
        if (!combatant || !skillId) return 0;
        const calculated = Number(global.characterSheetModel?.getCharacterProfessionalSkillTotal?.(
            skillId,
            combatant.professionalSkills
        ));
        const fallback = Number(combatant.professionalSkills?.[skillId]?.invested)
            || Number(combatant.professionalSkills?.[skillId])
            || 0;
        return Math.max(0, Math.min(4, Math.floor(Number.isFinite(calculated) ? calculated : fallback)));
    }

    function getCareProfessionalFeatures(combatant) {
        return Object.fromEntries(Object.entries(CARE_PROFESSIONAL_SKILL_IDS).map(([key, skillId]) => [
            key,
            getCareProfessionalSkillLevel(combatant, skillId)
        ]));
    }

    function hasCareProfessionalFeature(combatant) {
        return Object.values(getCareProfessionalFeatures(combatant)).some(level => level > 0);
    }

    function getCareProfessionalProviders(participants) {
        return (participants || []).filter(hasCareProfessionalFeature);
    }

    function getCareNeedDays(combatant, categoryId) {
        const relationship = CARE_CATEGORY_RELATIONSHIPS[categoryId];
        const persisted = Number(combatant?.careState?.needs?.[categoryId]?.daysWithout);
        if (Number.isFinite(persisted)) return Math.max(0, Math.floor(persisted));
        return relationship
            ? Math.max(0, Number(getCareEffect(combatant, relationship.negative)?.stacks) || 0)
            : 0;
    }

    function renderCarePersistenceSummary(participants) {
        return participants.map(participant => {
            const cycle = Math.max(0, Number(participant?.careState?.cycle) || 0);
            const foodDays = getCareNeedDays(participant, 'food');
            const hygieneDays = getCareNeedDays(participant, 'hygiene');
            const sleepDays = getCareNeedDays(participant, 'lodging');
            return `
                <article class="care-persistence-card">
                    <strong>${escapeCareHtml(participant.name)}</strong>
                    <small>Ciclo ${cycle} · 🍽️ ${foodDays}d · 🧼 ${hygieneDays}d · 💤 ${sleepDays}d</small>
                </article>
            `;
        }).join('');
    }

    function getCrownItem(combatant) {
        return Array.isArray(combatant?.inventory)
            ? combatant.inventory.find(item => item?.id === 'coroa') || null
            : null;
    }

    function getCrownBalance(combatant) {
        return normalizeCareAmount(getCrownItem(combatant)?.moneyValue);
    }

    function renderCareParticipantChecks(participants, defaultId, name, checkedAll = false) {
        return participants.map(participant => `
            <label>
                <input
                    type="checkbox"
                    name="${name}"
                    value="${escapeCareHtml(participant.id)}"
                    ${(checkedAll || String(participant.id) === String(defaultId)) ? 'checked' : ''}
                    onchange="refreshCareServicesModal()"
                >
                <span>${escapeCareHtml(participant.name)}</span>
            </label>
        `).join('');
    }

    function renderCareOptionChoices(category) {
        return category.options.map(option => `
            <option value="${escapeCareHtml(option.id)}">${escapeCareHtml(option.name)} · ${option.costRange ? `${option.costRange.min}–${option.costRange.max}` : option.cost} Coroas</option>
        `).join('');
    }

    function renderCareCategoryCard(category) {
        const firstOption = category.options[0];
        return `
            <article class="care-category-card" id="careCategory-${escapeCareHtml(category.id)}" data-enabled="false">
                <label class="care-category-toggle">
                    <input type="checkbox" id="careEnabled-${escapeCareHtml(category.id)}" onchange="toggleCareCategory('${escapeCareHtml(category.id)}', this.checked)">
                    <span>${category.icon} ${escapeCareHtml(category.name)}</span>
                </label>
                <div class="care-category-fields">
                    <label>
                        <span>Opção</span>
                        <select id="careOption-${escapeCareHtml(category.id)}" onchange="changeCareServiceOption('${escapeCareHtml(category.id)}')">
                            ${renderCareOptionChoices(category)}
                        </select>
                    </label>
                    <label>
                        <span>Valor total</span>
                        <input id="careCost-${escapeCareHtml(category.id)}" type="number" min="0" step="1" inputmode="numeric" value="0" oninput="markCareCostAsManual('${escapeCareHtml(category.id)}')">
                    </label>
                </div>
                <p class="care-category-rule" id="careRule-${escapeCareHtml(category.id)}">${escapeCareHtml(firstOption.summary)}</p>
            </article>
        `;
    }

    function renderCareProfessionalProviderOptions(participants, providerId = '') {
        const providers = getCareProfessionalProviders(participants);
        return [
            '<option value="">Sem responsável profissional</option>',
            ...providers.map(provider => {
                const features = getCareProfessionalFeatures(provider);
                const count = Object.values(features).filter(level => level > 0).length;
                return `<option value="${escapeCareHtml(provider.id)}" ${String(provider.id) === String(providerId) ? 'selected' : ''}>${escapeCareHtml(provider.name)} · ${count} integração(ões)</option>`;
            })
        ].join('');
    }

    function renderCareProfessionalOptions(provider, professional = {}) {
        if (!provider) {
            return '<p class="care-services-stage-note">Selecione um personagem com habilidade relacionada para liberar as integrações contextuais.</p>';
        }
        const features = getCareProfessionalFeatures(provider);
        const automatic = [
            features.prolongedCare ? `🩺 Cuidado Prolongado ×${features.prolongedCare}` : '',
            features.lightSleeper ? `🌙 Dormir Leve ×${features.lightSleeper}` : '',
            features.survivorBallad ? `🎵 Balada do Sobrevivente ×${features.survivorBallad}` : '',
            features.freyaAbundance ? `🌾 Ciclo de Abundância ×${features.freyaAbundance}` : ''
        ].filter(Boolean);
        const choices = [];
        if (features.divineInitiate) {
            choices.push(`
                <article class="care-professional-option">
                    <label><input id="careUseDivineInitiate" type="checkbox" ${professional.useDivineInitiate ? 'checked' : ''} onchange="refreshCareServicesModal()"><span>⛪ Usar Iniciado dos Deuses ×${features.divineInitiate}</span></label>
                    <small>Teste assistido para obter serviços gratuitos em uma igreja da fé.</small>
                    <label class="care-professional-nd"><span>ND definido pelo mestre</span><input id="careDivineDifficulty" type="number" min="0" inputmode="numeric" value="${normalizeCareAmount(professional.divineDifficulty, 14)}" oninput="refreshCareServicesModal()"></label>
                </article>
            `);
        }
        if (features.singForCoin) {
            choices.push(`
                <article class="care-professional-option">
                    <label><input id="careUseSingForCoin" type="checkbox" ${professional.useSingForCoin ? 'checked' : ''} onchange="refreshCareServicesModal()"><span>🎶 Usar Cantar por Moedas ×${features.singForCoin}</span></label>
                    <small>Teste assistido de Atuação para obter comida ou abrigo compatível com o nível.</small>
                    <label class="care-professional-nd"><span>ND definido pelo mestre</span><input id="carePerformanceDifficulty" type="number" min="0" inputmode="numeric" value="${normalizeCareAmount(professional.performanceDifficulty, 14)}" oninput="refreshCareServicesModal()"></label>
                </article>
            `);
        }
        if (features.freyaFruits) {
            choices.push(`
                <article class="care-professional-option">
                    <label><input id="careUseFreyaFruits" type="checkbox" ${professional.useFreyaFruits ? 'checked' : ''} onchange="refreshCareServicesModal()"><span>🍎 Preparar Frutos de Freya ×${features.freyaFruits}</span></label>
                    <small>Quando houver alimentação, concede o bônus do nível nos testes físicos por uma cena/ciclo.</small>
                </article>
            `);
        }
        return `
            ${automatic.length ? `<div class="care-professional-tags">${automatic.map(label => `<span>${escapeCareHtml(label)}</span>`).join('')}</div>` : ''}
            ${choices.length ? `<div class="care-professional-grid">${choices.join('')}</div>` : '<p class="care-services-stage-note">As habilidades deste responsável serão aplicadas automaticamente quando forem compatíveis com os serviços escolhidos.</p>'}
        `;
    }

    function createInitialCarePlan(participants) {
        const defaultParticipant = getDefaultCareParticipant(participants);
        const defaultProvider = hasCareProfessionalFeature(defaultParticipant)
            ? defaultParticipant
            : getCareProfessionalProviders(participants)[0] || null;
        return {
            participantIds: defaultParticipant ? [String(defaultParticipant.id)] : [],
            payerIds: defaultParticipant ? [String(defaultParticipant.id)] : [],
            professional: {
                providerId: defaultProvider ? String(defaultProvider.id) : '',
                useDivineInitiate: false,
                divineDifficulty: 14,
                useSingForCoin: false,
                performanceDifficulty: 14,
                useFreyaFruits: false
            },
            categories: Object.fromEntries(Object.keys(CARE_CATALOG).map(categoryId => [categoryId, {
                enabled: false,
                optionId: CARE_CATALOG[categoryId].options[0].id,
                totalCost: 0,
                manualCost: false
            }]))
        };
    }

    function openCareServicesModal() {
        const participants = getCareParticipants();
        if (!participants.length) {
            global.showToast?.('Adicione ao menos um personagem para registrar cuidados e descanso.');
            return false;
        }

        closeCareServicesModal();
        pendingCarePlan = createInitialCarePlan(participants);
        const defaultParticipant = getDefaultCareParticipant(participants);
        const defaultProvider = participants.find(entry => String(entry.id) === pendingCarePlan.professional.providerId) || null;
        const modal = document.createElement('div');
        modal.id = 'careServicesModal';
        modal.className = 'session-overlay care-services-overlay';
        modal.addEventListener('click', event => {
            if (event.target === modal) closeCareServicesModal();
        });

        const dialog = document.createElement('section');
        dialog.className = 'session-dialog care-services-dialog';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-labelledby', 'careServicesTitle');
        dialog.addEventListener('click', event => event.stopPropagation());
        dialog.innerHTML = `
            <div class="session-dialog-header">
                <div><small>CUIDADOS E DESCANSO</small><h2 id="careServicesTitle">Organizar necessidades do grupo</h2></div>
                <button type="button" class="session-close" onclick="closeCareServicesModal()" aria-label="Fechar">×</button>
            </div>
            <p class="care-services-intro">Escolha quem recebeu os serviços. Categoria desmarcada não altera aquele aspecto do personagem.</p>

            <section class="care-services-section">
                <div class="care-services-heading"><div><small>BENEFICIÁRIOS</small><strong>Quem recebeu os cuidados?</strong></div></div>
                <div class="care-services-checks">
                    ${renderCareParticipantChecks(participants, defaultParticipant?.id, 'careBeneficiary')}
                </div>
                <div class="care-persistence-grid" aria-label="Estado diário persistente">
                    ${renderCarePersistenceSummary(participants)}
                </div>
            </section>

            <section class="care-services-section">
                <div class="care-services-heading"><div><small>INTEGRAÇÕES PROFISSIONAIS</small><strong>Quem conduziu os cuidados?</strong></div></div>
                <label class="care-professional-select">
                    <span>Responsável</span>
                    <select id="careProviderSelect" onchange="changeCareProfessionalProvider(this.value)">
                        ${renderCareProfessionalProviderOptions(participants, pendingCarePlan.professional.providerId)}
                    </select>
                </label>
                <div id="careProfessionalOptions">
                    ${renderCareProfessionalOptions(defaultProvider, pendingCarePlan.professional)}
                </div>
            </section>

            <section class="care-services-section">
                <div class="care-services-heading"><div><small>SERVIÇOS</small><strong>Selecione apenas o que aconteceu</strong></div></div>
                <div class="care-category-grid">
                    ${Object.values(CARE_CATALOG).map(renderCareCategoryCard).join('')}
                </div>
            </section>

            <section class="care-services-section">
                <div class="care-services-heading"><div><small>PAGAMENTO</small><strong>Quem pagará as Coroas?</strong></div></div>
                <p class="care-services-stage-note">Sem pagador selecionado, o descanso será registrado sem remover Coroas.</p>
                <div class="care-services-checks">
                    ${renderCareParticipantChecks(participants, defaultParticipant?.id, 'carePayer')}
                </div>
                <div class="care-services-money-summary"><span>Total dos serviços</span><strong id="careGrandTotal">0 Coroas</strong></div>
            </section>

            <section class="care-services-summary" aria-live="polite">
                <small>RESUMO</small>
                <p id="careServicesSummary">Selecione ao menos uma categoria.</p>
            </section>
            <p class="care-services-stage-note">Cada confirmação inicia um novo ciclo diário. Categorias desmarcadas preservam seus contadores; benefícios do ciclo anterior expiram.</p>

            <div class="session-dialog-actions">
                <button type="button" class="session-secondary" onclick="closeCareServicesModal()">Cancelar</button>
                <button type="button" class="session-primary" onclick="confirmCareServices()">Registrar cuidados</button>
            </div>
        `;

        modal.append(dialog);
        document.body.append(modal);
        refreshCareServicesModal();
        return true;
    }

    function closeCareServicesModal() {
        document.getElementById('careServicesModal')?.remove();
        pendingCarePlan = null;
    }

    function getCheckedValues(name) {
        return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(input => String(input.value));
    }

    function getSelectedBeneficiaryCount() {
        return getCheckedValues('careBeneficiary').length;
    }

    function updateCareCategoryCost(categoryId, force = false) {
        const state = pendingCarePlan?.categories?.[categoryId];
        const input = document.getElementById(`careCost-${categoryId}`);
        const select = document.getElementById(`careOption-${categoryId}`);
        const option = getCareOption(categoryId, select?.value);
        if (!state || !input || !option || (!force && state.manualCost)) return;

        const total = option.cost * Math.max(1, getSelectedBeneficiaryCount());
        state.totalCost = normalizeCareAmount(total);
        input.value = String(state.totalCost);
    }

    function toggleCareCategory(categoryId, enabled) {
        const state = pendingCarePlan?.categories?.[categoryId];
        if (!state) return;
        state.enabled = Boolean(enabled);
        state.manualCost = false;
        document.getElementById(`careCategory-${categoryId}`)?.setAttribute('data-enabled', String(state.enabled));
        updateCareCategoryCost(categoryId, true);
        refreshCareServicesModal();
    }

    function changeCareServiceOption(categoryId) {
        const state = pendingCarePlan?.categories?.[categoryId];
        const select = document.getElementById(`careOption-${categoryId}`);
        if (!state || !select) return;
        state.optionId = select.value;
        state.manualCost = false;
        updateCareCategoryCost(categoryId, true);
        refreshCareServicesModal();
    }

    function markCareCostAsManual(categoryId) {
        const state = pendingCarePlan?.categories?.[categoryId];
        if (!state) return;
        state.manualCost = true;
        refreshCareServicesModal();
    }

    function changeCareProfessionalProvider(providerId) {
        if (!pendingCarePlan) return;
        pendingCarePlan = collectCareModalPlan();
        pendingCarePlan.professional.providerId = String(providerId || '');
        pendingCarePlan.professional.useDivineInitiate = false;
        pendingCarePlan.professional.useSingForCoin = false;
        pendingCarePlan.professional.useFreyaFruits = false;
        const provider = getCareParticipants().find(entry => String(entry.id) === pendingCarePlan.professional.providerId) || null;
        const options = document.getElementById('careProfessionalOptions');
        if (options) options.innerHTML = renderCareProfessionalOptions(provider, pendingCarePlan.professional);
        refreshCareServicesModal();
    }

    function collectCareModalPlan() {
        const plan = cloneCareValue(pendingCarePlan, createInitialCarePlan([]));
        plan.participantIds = getCheckedValues('careBeneficiary');
        plan.payerIds = getCheckedValues('carePayer');
        if (!plan.professional || typeof plan.professional !== 'object') plan.professional = {};
        plan.professional.providerId = String(document.getElementById('careProviderSelect')?.value || '');
        plan.professional.useDivineInitiate = Boolean(document.getElementById('careUseDivineInitiate')?.checked);
        plan.professional.divineDifficulty = normalizeCareAmount(document.getElementById('careDivineDifficulty')?.value, 14);
        plan.professional.useSingForCoin = Boolean(document.getElementById('careUseSingForCoin')?.checked);
        plan.professional.performanceDifficulty = normalizeCareAmount(document.getElementById('carePerformanceDifficulty')?.value, 14);
        plan.professional.useFreyaFruits = Boolean(document.getElementById('careUseFreyaFruits')?.checked);

        Object.keys(CARE_CATALOG).forEach(categoryId => {
            const state = plan.categories[categoryId];
            state.enabled = Boolean(document.getElementById(`careEnabled-${categoryId}`)?.checked);
            state.optionId = document.getElementById(`careOption-${categoryId}`)?.value || state.optionId;
            state.totalCost = state.enabled
                ? normalizeCareAmount(document.getElementById(`careCost-${categoryId}`)?.value)
                : 0;
        });

        return plan;
    }

    function getEnabledCareSelections(plan) {
        return Object.entries(plan?.categories || {}).map(([categoryId, state]) => {
            if (!state?.enabled) return null;
            const category = getCareCategory(categoryId);
            const option = getCareOption(categoryId, state.optionId);
            return category && option ? { category, option, totalCost: normalizeCareAmount(state.totalCost) } : null;
        }).filter(Boolean);
    }

    function refreshCareServicesModal() {
        if (!pendingCarePlan || !document.getElementById('careServicesModal')) return;

        Object.keys(CARE_CATALOG).forEach(categoryId => {
            updateCareCategoryCost(categoryId);
            const state = pendingCarePlan.categories[categoryId];
            const select = document.getElementById(`careOption-${categoryId}`);
            const option = getCareOption(categoryId, select?.value || state.optionId);
            if (option) document.getElementById(`careRule-${categoryId}`).textContent = option.summary;
        });

        const plan = collectCareModalPlan();
        pendingCarePlan = plan;
        const selections = getEnabledCareSelections(plan);
        const total = selections.reduce((sum, selection) => sum + selection.totalCost, 0);
        const beneficiaries = getCareParticipants().filter(entry => plan.participantIds.includes(String(entry.id)));
        const payers = getCareParticipants().filter(entry => plan.payerIds.includes(String(entry.id)));
        const provider = getCareParticipants().find(entry => String(entry.id) === String(plan.professional?.providerId)) || null;
        const totalNode = document.getElementById('careGrandTotal');
        const summaryNode = document.getElementById('careServicesSummary');

        if (totalNode) totalNode.textContent = `${total} ${total === 1 ? 'Coroa' : 'Coroas'}`;
        if (summaryNode) {
            const serviceText = selections.length
                ? selections.map(selection => `${selection.category.icon} ${selection.option.name} (${selection.totalCost})`).join(' · ')
                : 'Nenhuma categoria selecionada';
            const providerText = provider ? `responsável: ${provider.name}` : 'sem responsável profissional';
            summaryNode.textContent = `${beneficiaries.length} beneficiário(s) · ${serviceText} · ${providerText} · ${payers.length ? `${payers.length} pagador(es)` : 'sem débito de Coroas'}`;
        }
    }

    function buildCareHistoryDetail(record) {
        const lines = [
            `Beneficiários: ${record.beneficiaries.map(entry => entry.name).join(', ')}`,
            ...record.selections.map(selection => `${selection.categoryName}: ${selection.optionName} · ${selection.totalCost} Coroas · ${selection.summary}`)
        ];

        if (record.professional?.providerName) {
            lines.push(`Responsável profissional: ${record.professional.providerName}`);
        }
        (record.professional?.costAdjustments || []).forEach(adjustment => lines.push(`Custo profissional: ${adjustment}`));

        (record.outcomes || []).forEach(outcome => {
            lines.push(`${outcome.beneficiaryName} · Ciclo ${outcome.cycle} · ${outcome.categoryName}: ${outcome.details.join(' · ')}`);
        });

        (record.assistedTests || []).forEach(test => {
            lines.push(
                `${test.beneficiaryName} · ${test.skillName} ND ${test.difficulty}: ` +
                `${test.roll}${test.secondRoll ? `/${test.secondRoll} → ${test.naturalRoll}` : ''} + ${test.skillTotal} da perícia ` +
                `${test.effectModifier >= 0 ? '+' : ''}${test.effectModifier} de efeitos ` +
                `${test.manualModifier >= 0 ? '+' : ''}${test.manualModifier} = ${test.total} · ${test.success ? 'Sucesso' : `Falha: ${test.failure}`}`
            );
        });

        if (record.payments.length) {
            lines.push(`Pagamento: ${record.payments.map(payment => `${payment.payerName} −${payment.amount}`).join(', ')}`);
        } else if (record.baseTotalCost > 0 && record.totalCost === 0) {
            lines.push(`Pagamento: ${record.baseTotalCost} → 0 Coroas por integração profissional`);
        } else {
            lines.push(`Pagamento: ${record.totalCost} Coroas não debitadas · nenhum pagador selecionado`);
        }
        return lines.join('\n');
    }

    function ensureCareState(combatant) {
        if (!combatant.careState || typeof combatant.careState !== 'object') {
            combatant.careState = { version: CARE_STATE_VERSION, records: [] };
        }
        combatant.careState.version = CARE_STATE_VERSION;
        if (!Array.isArray(combatant.careState.records)) combatant.careState.records = [];
        if (!Array.isArray(combatant.careState.consumptions)) combatant.careState.consumptions = [];
        combatant.careState.cycle = Math.max(0, Math.floor(Number(combatant.careState.cycle) || 0));
        if (!combatant.careState.needs || typeof combatant.careState.needs !== 'object') {
            combatant.careState.needs = {};
        }
        Object.keys(CARE_CATEGORY_RELATIONSHIPS).forEach(categoryId => {
            const current = combatant.careState.needs[categoryId];
            if (!current || typeof current !== 'object') combatant.careState.needs[categoryId] = {};
            const need = combatant.careState.needs[categoryId];
            need.daysWithout = getCareNeedDays(combatant, categoryId);
            if (!need.lastOption || typeof need.lastOption !== 'object') need.lastOption = null;
        });
        if (!combatant.careState.benefits || typeof combatant.careState.benefits !== 'object') {
            combatant.careState.benefits = {};
        }
        if (!combatant.careState.conditions || typeof combatant.careState.conditions !== 'object') {
            combatant.careState.conditions = {};
        }
        return combatant.careState;
    }

    function beginCareCycle(combatant, timestamp) {
        const state = ensureCareState(combatant);
        state.cycle += 1;
        state.lastCycleAt = timestamp;
        const expiredBenefits = [];

        CARE_DAILY_BENEFIT_STATUS_IDS.forEach(statusId => {
            const removed = removeCareStatus(combatant, statusId);
            if (removed) expiredBenefits.push(`${removed.name} expirou no início do ciclo ${state.cycle}`);
        });
        state.benefits = {};
        return { state, cycle: state.cycle, expiredBenefits };
    }

    function updateCarePersistence(combatant, selection, cycleContext, timestamp) {
        const { category, option } = selection;
        const relationship = CARE_CATEGORY_RELATIONSHIPS[category.id];
        const state = cycleContext.state;
        const need = state.needs[category.id];
        const details = [];

        if (relationship && option.status?.id === relationship.negative) {
            const negativeEffect = getCareEffect(combatant, relationship.negative);
            need.daysWithout = Math.max(0, Number(negativeEffect?.stacks) || (need.daysWithout + 1));
            details.push(`${need.daysWithout} dia(s) sem ${category.id === 'food' ? 'alimentação' : category.id === 'hygiene' ? 'banho' : 'dormir'}`);
        } else {
            need.daysWithout = 0;
            need.lastFulfilledAt = timestamp;
            need.lastFulfilledCycle = cycleContext.cycle;
        }

        need.lastProcessedAt = timestamp;
        need.lastProcessedCycle = cycleContext.cycle;
        need.lastOption = { id: option.id, name: option.name };

        if (option.status?.id && CARE_DAILY_BENEFIT_STATUS_IDS.includes(option.status.id)) {
            const effect = getCareEffect(combatant, option.status.id);
            if (effect) {
                effect.automation = {
                    ...(effect.automation || {}),
                    careCycleApplied: cycleContext.cycle,
                    careDurationCycles: 1,
                    expiresAtCareCycle: cycleContext.cycle + 1,
                    note: `Benefício diário · válido durante o ciclo ${cycleContext.cycle}`
                };
                state.benefits[option.status.id] = {
                    name: effect.name,
                    stacks: Math.max(1, Number(effect.stacks) || 1),
                    appliedCycle: cycleContext.cycle,
                    expiresAtCycle: cycleContext.cycle + 1,
                    effect: cloneCareValue(effect, {})
                };
                details.push(`${effect.name} válido durante o ciclo ${cycleContext.cycle}`);
            }
        }

        const uncomfortable = getCareEffect(combatant, 'uncomfortable');
        if (uncomfortable) state.conditions.uncomfortable = cloneCareValue(uncomfortable, {});
        else delete state.conditions.uncomfortable;

        return details;
    }

    function persistCareProfessionalBenefit(combatant, statusId, level, provider, cycleContext, note) {
        const normalizedLevel = Math.max(1, Math.min(4, Number(level) || 1));
        const professionalSkillId = {
            survivor_ballad: CARE_PROFESSIONAL_SKILL_IDS.survivorBallad,
            freya_abundance: CARE_PROFESSIONAL_SKILL_IDS.freyaAbundance,
            freya_fruits: CARE_PROFESSIONAL_SKILL_IDS.freyaFruits
        }[statusId] || '';
        const option = {
            id: `professional_${statusId}`,
            professionalSkillId,
            professionalSourceId: String(provider?.id || ''),
            professionalSourceName: provider?.name || '',
            note
        };
        const changed = setCareStatus(combatant, statusId, normalizedLevel, option, false);
        if (!changed) return null;
        const state = cycleContext?.state || ensureCareState(combatant);
        const cycle = Math.max(1, Number(cycleContext?.cycle) || Number(state.cycle) || 1);
        changed.effect.automation = {
            ...(changed.effect.automation || {}),
            careCycleApplied: cycle,
            careDurationCycles: 1,
            expiresAtCareCycle: cycle + 1,
            note
        };
        state.benefits[statusId] = {
            name: changed.effect.name,
            stacks: normalizedLevel,
            appliedCycle: cycle,
            expiresAtCycle: cycle + 1,
            effect: cloneCareValue(changed.effect, {})
        };
        return changed.effect;
    }

    function isPositiveCareSelection(selections, categoryId) {
        const selection = (selections || []).find(entry => entry.category.id === categoryId);
        if (!selection) return false;
        return selection.option.id !== ({ food: 'no_food', hygiene: 'no_bath', lodging: 'no_sleep' }[categoryId]);
    }

    function applyCareProfessionalBenefits(provider, beneficiary, selections, professional, cycleContext) {
        if (!provider || !beneficiary) return [];
        const features = getCareProfessionalFeatures(provider);
        const details = [];
        const hasFood = isPositiveCareSelection(selections, 'food');
        const hasLodging = isPositiveCareSelection(selections, 'lodging');
        const receivedAnyCare = (selections || []).some(selection => isPositiveCareSelection([selection], selection.category.id));

        if (features.prolongedCare && hasLodging && String(provider.id) !== String(beneficiary.id)) {
            const bonus = PROLONGED_CARE_HP_BY_LEVEL[features.prolongedCare] || 0;
            const before = Math.max(0, Number(beneficiary.hpCurrent) || 0);
            const maximum = Math.max(before, Number(beneficiary.hpMax) || before);
            beneficiary.hpCurrent = Math.min(maximum, before + bonus);
            details.push(`Cuidado Prolongado de ${provider.name}: HP ${before} → ${beneficiary.hpCurrent} (+${beneficiary.hpCurrent - before} de ${bonus})`);
        }

        if (features.lightSleeper && hasLodging && String(provider.id) === String(beneficiary.id)) {
            const removed = removeCareStatus(beneficiary, 'uncomfortable');
            if (removed) details.push(`Dormir Leve ×${features.lightSleeper}: Desconfortável neutralizado`);
        }

        if (features.survivorBallad && receivedAnyCare) {
            const note = `+${features.survivorBallad} nos efeitos de Higiene, Conforto e Alimentação do grupo neste ciclo.`;
            persistCareProfessionalBenefit(beneficiary, 'survivor_ballad', features.survivorBallad, provider, cycleContext, note);
            details.push(`Balada do Sobrevivente ×${features.survivorBallad} aplicada por ${provider.name}`);
        }

        if (features.freyaAbundance && String(provider.id) === String(beneficiary.id) && (hasFood || hasLodging)) {
            const note = `+${features.freyaAbundance} em testes de resistência durante este ciclo.`;
            persistCareProfessionalBenefit(beneficiary, 'freya_abundance', features.freyaAbundance, provider, cycleContext, note);
            details.push(`Ciclo de Abundância ×${features.freyaAbundance} aplicado`);
        }

        if (features.freyaFruits && professional?.useFreyaFruits && hasFood) {
            const note = `+${features.freyaFruits} em testes físicos durante este ciclo.`;
            persistCareProfessionalBenefit(beneficiary, 'freya_fruits', features.freyaFruits, provider, cycleContext, note);
            details.push(`Frutos de Freya ×${features.freyaFruits} preparados por ${provider.name}`);
        }
        return details;
    }

    const CARE_SERVICE_QUALITY_RANKS = Object.freeze({
        no_food: 0, simple_meal: 0, good_meal: 1, sophisticated_meal: 2,
        no_sleep: 0, straw_stable: 0, strange_inn: 0, cheap_inn: 1,
        normal_inn: 2, quality_inn: 3, luxury_inn: 4
    });

    function resolveCareProfessionalCosts(selections, assistedTests, provider, professional = {}) {
        const baseTotal = (selections || []).reduce((sum, selection) => sum + normalizeCareAmount(selection.totalCost), 0);
        const adjustments = [];
        const divineSuccess = Boolean(professional.useDivineInitiate && assistedTests.some(test => test.ruleId === 'divine-initiate' && test.success));
        const singSuccess = Boolean(professional.useSingForCoin && assistedTests.some(test => test.ruleId === 'sing-for-coin' && test.success));
        const singLevel = getCareProfessionalFeatures(provider).singForCoin || 0;
        const resolvedSelections = (selections || []).map(selection => {
            let totalCost = normalizeCareAmount(selection.totalCost);
            if (divineSuccess && totalCost > 0) {
                adjustments.push(`${selection.category.name}: ${totalCost} → 0 por Iniciado dos Deuses`);
                totalCost = 0;
            } else if (singSuccess && ['food', 'lodging'].includes(selection.category.id)
                && (CARE_SERVICE_QUALITY_RANKS[selection.option.id] ?? 99) <= singLevel && totalCost > 0) {
                adjustments.push(`${selection.category.name}: ${totalCost} → 0 por Cantar por Moedas ×${singLevel}`);
                totalCost = 0;
            }
            return { ...selection, baseTotalCost: normalizeCareAmount(selection.totalCost), totalCost };
        });
        return {
            baseTotal,
            totalCost: resolvedSelections.reduce((sum, selection) => sum + selection.totalCost, 0),
            selections: resolvedSelections,
            adjustments
        };
    }

    function restoreCareStateEffects(combatant) {
        if (!combatant?.careState) return false;
        const state = ensureCareState(combatant);
        if (!Array.isArray(combatant.effects)) combatant.effects = [];
        let changed = false;

        (state.activeEffects || []).forEach(snapshot => {
            const statusId = getCareStatusIdFromEffect(snapshot);
            if (!statusId || getCareEffect(combatant, statusId)) return;
            combatant.effects.push(cloneCareValue(snapshot, {}));
            changed = true;
        });

        Object.entries(CARE_CATEGORY_RELATIONSHIPS).forEach(([categoryId, relationship]) => {
            const daysWithout = Math.max(0, Number(state.needs?.[categoryId]?.daysWithout) || 0);
            if (daysWithout <= 0 || getCareEffect(combatant, relationship.negative)) return;
            setCareStatus(combatant, relationship.negative, daysWithout, {}, false);
            changed = true;
        });

        Object.entries(state.benefits || {}).forEach(([statusId, benefit]) => {
            if (!CARE_DAILY_BENEFIT_STATUS_IDS.includes(statusId)) return;
            if (Number(benefit?.expiresAtCycle) <= state.cycle || getCareEffect(combatant, statusId)) return;
            const snapshot = cloneCareValue(benefit?.effect, null);
            if (snapshot?.id) combatant.effects.push(snapshot);
            else {
                const catalogOption = Object.values(CARE_CATALOG)
                    .flatMap(category => category.options)
                    .find(option => option.status?.id === statusId && Number(option.status?.stacks) === Number(benefit?.stacks));
                if (catalogOption) setCareStatus(combatant, statusId, benefit.stacks, catalogOption, false);
            }
            changed = true;
        });

        const uncomfortable = state.conditions?.uncomfortable;
        if (uncomfortable?.id && !getCareEffect(combatant, 'uncomfortable')) {
            combatant.effects.push(cloneCareValue(uncomfortable, {}));
            changed = true;
        }
        return changed;
    }

    function serializeCareState(combatant) {
        if (!combatant?.careState) return null;
        const state = cloneCareValue(ensureCareState(combatant), {});
        state.activeEffects = (combatant.effects || [])
            .filter(effect => Boolean(getCareStatusIdFromEffect(effect)))
            .map(effect => cloneCareValue(effect, {}));
        return state;
    }

    function getCareConsumableDefinition(item) {
        const definition = item?.careConsumable;
        if (!definition || typeof definition !== 'object') return null;
        const kind = String(definition.kind || '').toLowerCase();
        if (!['food', 'drink'].includes(kind)) return null;
        return {
            ...cloneCareValue(definition, {}),
            kind,
            portionsPerUnit: Math.max(1, normalizeCareAmount(definition.portionsPerUnit, 1)),
            durationCycles: normalizeCareAmount(definition.durationCycles)
        };
    }

    function consumeCareInventoryItem(combatant, item, timestamp = new Date().toISOString()) {
        const definition = getCareConsumableDefinition(item);
        if (!combatant || !definition) {
            return { applied: false, blocked: true, reason: 'invalid-care-consumable' };
        }

        const state = ensureCareState(combatant);
        if (state.cycle <= 0) {
            state.cycle = 1;
            state.lastCycleAt = timestamp;
        }

        const details = [];
        let selection = null;
        if (definition.kind === 'food') {
            const category = getCareCategory(definition.categoryId || 'food');
            const option = getCareOption(category?.id || 'food', definition.optionId);
            if (!category || !option) {
                return { applied: false, blocked: true, reason: 'care-option-not-found' };
            }

            selection = { category, option, totalCost: 0, source: 'inventory' };
            details.push(...applyCareSelectionToCombatant(combatant, selection));
            details.push(...updateCarePersistence(
                combatant,
                selection,
                { state, cycle: state.cycle, expiredBenefits: [] },
                timestamp
            ));
            const abundanceLevel = getCareProfessionalFeatures(combatant).freyaAbundance;
            if (abundanceLevel) {
                const note = `+${abundanceLevel} em testes de resistência durante este ciclo.`;
                persistCareProfessionalBenefit(
                    combatant,
                    'freya_abundance',
                    abundanceLevel,
                    combatant,
                    { state, cycle: state.cycle },
                    note
                );
                details.push(`Ciclo de Abundância ×${abundanceLevel} aplicado`);
            }
        } else {
            details.push(definition.effect || 'Bebida consumida; sem efeito mecânico definido.');
        }

        const consumption = {
            id: `care_consumption_${Date.now()}`,
            version: CARE_STATE_VERSION,
            source: 'inventory',
            createdAt: timestamp,
            cycle: state.cycle,
            combatantId: combatant.id,
            combatantName: combatant.name,
            itemId: item.id,
            itemName: item.name,
            kind: definition.kind,
            quality: definition.quality || '',
            portions: definition.portionsPerUnit,
            durationCycles: definition.durationCycles,
            categoryId: selection?.category?.id || '',
            optionId: selection?.option?.id || '',
            optionName: selection?.option?.name || '',
            details: cloneCareValue(details, [])
        };
        state.lastConsumption = cloneCareValue(consumption, {});
        state.consumptions.unshift(cloneCareValue(consumption, {}));
        state.consumptions = state.consumptions.slice(0, MAX_CARE_RECORDS);
        state.lastRecord = cloneCareValue(consumption, {});
        state.records.unshift(cloneCareValue(consumption, {}));
        state.records = state.records.slice(0, MAX_CARE_RECORDS);

        const label = `${combatant.name}: consumiu ${item.name}`;
        const detail = [
            `Origem: inventário de ${combatant.name}`,
            `Tipo: ${definition.kind === 'food' ? 'Alimento' : 'Bebida'} · ${definition.portionsPerUnit} porção(ões)`,
            selection ? `Qualidade aplicada: ${selection.option.name}` : `Qualidade: ${definition.quality || 'não definida'}`,
            ...details
        ].join('\n');
        global.appendToxicityItemUseDetail?.(detail);
        if (typeof global.trackCombatAction !== 'function') {
            global.addCombatHistoryEntry?.(label, detail, {
                type: 'effect',
                target: { id: combatant.id, name: combatant.name },
                participants: [{ id: combatant.id, name: combatant.name }],
                effect: {
                    id: item.id,
                    type: 'care-consumable',
                    name: item.name,
                    action: 'consumido'
                }
            });
        }
        global.renderList?.(false);
        global.renderAutomationCardSummaries?.();
        global.showToast?.(`${definition.kind === 'food' ? '🍽️' : '🥤'} ${item.name} consumido por ${combatant.name}.`);

        return {
            applied: true,
            blocked: false,
            effectKind: 'care-consumable',
            summary: details.join('\n'),
            consumption
        };
    }

    function ensureCareProgression(combatant) {
        if (!combatant.progression || typeof combatant.progression !== 'object') combatant.progression = {};
        combatant.progression.adrenaline = Math.max(0, Number(combatant.progression.adrenaline) || 0);
        combatant.progression.luckDice = Math.max(0, Number(combatant.progression.luckDice) || 0);
        return combatant.progression;
    }

    function applyCareSelectionToCombatant(combatant, selection, assistedTests = []) {
        const { category, option } = selection;
        const relationship = CARE_CATEGORY_RELATIONSHIPS[category.id];
        const details = [];
        const hpBefore = Math.max(0, Number(combatant.hpCurrent) || 0);
        const stBefore = Math.max(0, Number(combatant.stCurrent) || 0);
        const hpMaximum = Math.max(hpBefore, Number(combatant.hpMax) || 0);
        const stMaximum = Math.max(stBefore, Number(combatant.stMax) || 0);
        const recoveredHp = Math.min(Math.max(0, Number(option.recovery?.hp) || 0), Math.max(0, hpMaximum - hpBefore));
        const recoveredSt = Math.min(Math.max(0, Number(option.recovery?.st) || 0), Math.max(0, stMaximum - stBefore));
        combatant.hpCurrent = hpBefore + recoveredHp;
        combatant.stCurrent = stBefore + recoveredSt;
        if (recoveredHp || Number(option.recovery?.hp)) details.push(`HP ${hpBefore} → ${combatant.hpCurrent}`);
        if (recoveredSt || Number(option.recovery?.st)) details.push(`EST ${stBefore} → ${combatant.stCurrent}`);

        if (relationship) {
            if (option.status?.id === relationship.negative) {
                const changed = setCareStatus(combatant, relationship.negative, option.status.stacks, option, true);
                removeCareStatus(combatant, relationship.positive);
                details.push(`${changed.effect.name} ${changed.previousStacks} → ${changed.nextStacks}`);
            } else {
                const removedNegative = removeCareStatus(combatant, relationship.negative);
                if (removedNegative) details.push(`${removedNegative.name} removido`);

                if (option.status?.id === relationship.positive) {
                    const changed = setCareStatus(combatant, relationship.positive, option.status.stacks, option, false);
                    details.push(`${changed.effect.name} ×${changed.nextStacks}`);
                } else {
                    const removedPositive = removeCareStatus(combatant, relationship.positive);
                    if (removedPositive) details.push(`${removedPositive.name} removido`);
                }
            }
        }

        if (category.id === 'lodging' && option.id !== 'no_sleep') {
            const physiqueFailure = assistedTests.some(test =>
                test.skillId === 'physique' && !test.success
            );
            if (physiqueFailure) {
                setCareStatus(combatant, 'uncomfortable', 1, option, false);
                details.push('Desconfortável aplicado');
            } else {
                const removed = removeCareStatus(combatant, 'uncomfortable');
                if (removed) details.push('Desconfortável removido');
            }
            if (assistedTests.some(test => test.skillId === 'intimidation' && !test.success)) {
                details.push('Risco de roubo: resolução pendente do mestre');
            }
        }

        const progression = ensureCareProgression(combatant);
        const adrenaline = Math.max(0, Number(option.resources?.adrenaline) || 0);
        const luckDice = Math.max(0, Number(option.resources?.luckDice) || 0);
        if (adrenaline) {
            const before = progression.adrenaline;
            progression.adrenaline += adrenaline;
            details.push(`Adrenalina ${before} → ${progression.adrenaline}`);
        }
        if (luckDice) {
            const before = progression.luckDice;
            progression.luckDice += luckDice;
            details.push(`Dado da Sorte ${before} → ${progression.luckDice}`);
        }

        const positiveEffect = option.status?.id ? getCareEffect(combatant, option.status.id) : null;
        if (positiveEffect && Number(positiveEffect.automation?.temporaryHp) > 0) {
            details.push(`PV temporários: ${positiveEffect.automation.temporaryHp}`);
        }
        if (positiveEffect && Number(positiveEffect.automation?.temporarySt) > 0) {
            details.push(`EST temporário: ${positiveEffect.automation.temporarySt}`);
        }
        return details.length ? details : ['Nenhuma alteração de recurso'];
    }

    function getCareAssistedSkillContext(combatant, testRule) {
        const skillId = CARE_ASSISTED_SKILL_IDS[testRule.skill] || '';
        const skill = global.characterSheetModel?.getCharacterSkillDefinition?.(skillId)
            || { id: skillId, name: testRule.skill };
        const breakdown = global.characterSheetModel?.getCharacterSkillBreakdown?.(
            skillId,
            combatant?.skills,
            combatant?.attributes
        );
        const effectModifier = global.getItemConditionSkillModifier?.(combatant, skill)
            || getCareSkillModifier(combatant, skill);
        return {
            skillId,
            skillName: testRule.skill,
            skillTotal: Math.round(Number(breakdown?.total) || 0),
            effectModifier: Math.round(Number(effectModifier.total) || 0),
            disadvantage: Boolean(effectModifier.disadvantage),
            effectDetails: cloneCareValue(effectModifier.details, [])
        };
    }

    function getCareProfessionalTestContext(provider, skillId, skillName) {
        return {
            skillId,
            skillName,
            skillTotal: getCareProfessionalSkillLevel(provider, skillId),
            effectModifier: 0,
            disadvantage: false,
            effectDetails: []
        };
    }

    function collectCareAssistedTestRequests(beneficiaries, selections, professionalContext = {}) {
        const lodging = selections.find(selection => selection.category.id === 'lodging');
        const rules = lodging?.option?.assistedTests || [];
        const requests = beneficiaries.flatMap(beneficiary => rules.map((rule, index) => ({
            id: `${beneficiary.id}_${index}`,
            requestType: 'lodging',
            beneficiaryId: beneficiary.id,
            beneficiaryName: beneficiary.name,
            categoryName: lodging.category.name,
            optionName: lodging.option.name,
            difficulty: Math.max(0, Number(rule.difficulty) || 0),
            failure: rule.failure,
            ...getCareAssistedSkillContext(beneficiary, rule)
        })));
        const provider = professionalContext.provider;
        const professional = professionalContext.professional || {};
        if (provider && professional.useDivineInitiate && getCareProfessionalFeatures(provider).divineInitiate) {
            requests.push({
                id: `professional_divine_${provider.id}`,
                requestType: 'professional-care',
                ruleId: 'divine-initiate',
                beneficiaryId: provider.id,
                beneficiaryName: provider.name,
                categoryName: 'Integração profissional',
                optionName: 'Iniciado dos Deuses',
                difficulty: normalizeCareAmount(professional.divineDifficulty, 14),
                failure: 'Os serviços mantêm seus custos normais',
                ...getCareProfessionalTestContext(provider, CARE_PROFESSIONAL_SKILL_IDS.divineInitiate, 'Iniciado dos Deuses')
            });
        }
        if (provider && professional.useSingForCoin && getCareProfessionalFeatures(provider).singForCoin) {
            requests.push({
                id: `professional_song_${provider.id}`,
                requestType: 'professional-care',
                ruleId: 'sing-for-coin',
                beneficiaryId: provider.id,
                beneficiaryName: provider.name,
                categoryName: 'Integração profissional',
                optionName: 'Cantar por Moedas',
                difficulty: normalizeCareAmount(professional.performanceDifficulty, 14),
                failure: 'Comida e hospedagem mantêm seus custos normais',
                ...getCareProfessionalTestContext(provider, CARE_PROFESSIONAL_SKILL_IDS.singForCoin, 'Cantar por Moedas')
            });
        }
        return requests;
    }

    function renderCareAssistedTestRequest(request) {
        const detail = request.effectDetails.length ? ` · ${request.effectDetails.join(' · ')}` : '';
        return `
            <article class="care-test-card">
                <div class="care-test-heading">
                    <div><strong>${escapeCareHtml(request.beneficiaryName)} · ${escapeCareHtml(request.skillName)}</strong><small>${escapeCareHtml(request.optionName)}</small></div>
                    <b>ND ${request.difficulty}</b>
                </div>
                <p>Total conhecido: perícia ${request.skillTotal >= 0 ? '+' : ''}${request.skillTotal} · efeitos ${request.effectModifier >= 0 ? '+' : ''}${request.effectModifier}${escapeCareHtml(detail)}</p>
                ${request.disadvantage ? '<p class="care-services-stage-note">Desvantagem ativa: informe os dois d20; o menor será usado.</p>' : ''}
                <div class="care-test-inputs">
                    <label><span>d20${request.disadvantage ? ' A' : ''}</span><input id="careTestRoll-${escapeCareHtml(request.id)}" type="number" min="1" max="20" inputmode="numeric" placeholder="1–20"></label>
                    ${request.disadvantage ? `<label><span>d20 B</span><input id="careTestSecondRoll-${escapeCareHtml(request.id)}" type="number" min="1" max="20" inputmode="numeric" placeholder="1–20"></label>` : ''}
                    <label><span>Ajuste do mestre</span><input id="careTestModifier-${escapeCareHtml(request.id)}" type="number" inputmode="numeric" value="0"></label>
                </div>
                <small>Falha: ${escapeCareHtml(request.failure)}</small>
            </article>
        `;
    }

    function openCareAssistedTestsModal(context) {
        closeCareServicesModal();
        const modal = document.createElement('div');
        modal.id = 'careAssistedTestsModal';
        modal.className = 'session-overlay care-services-overlay';
        modal.innerHTML = `
            <section class="session-dialog care-services-dialog care-tests-dialog" role="dialog" aria-modal="true" aria-labelledby="careTestsTitle">
                <div class="session-dialog-header">
                    <div><small>TESTES ASSISTIDOS</small><h2 id="careTestsTitle">Resolver cuidados e descanso</h2></div>
                    <button type="button" class="session-close" onclick="closeCareAssistedTestsModal()" aria-label="Fechar">×</button>
                </div>
                <p class="care-services-intro">Informe os resultados naturais. O aplicativo soma perícia, efeitos ativos e o ajuste do mestre.</p>
                <div class="care-tests-list">${context.testRequests.map(renderCareAssistedTestRequest).join('')}</div>
                <div class="session-dialog-actions">
                    <button type="button" class="session-secondary" onclick="closeCareAssistedTestsModal()">Cancelar</button>
                    <button type="button" class="session-primary" onclick="confirmCareAssistedTests()">Aplicar descanso</button>
                </div>
            </section>
        `;
        document.body.append(modal);
        global.pendingCareTestContext = context;
        modal.querySelector('input')?.focus();
    }

    function closeCareAssistedTestsModal() {
        document.getElementById('careAssistedTestsModal')?.remove();
        global.pendingCareTestContext = null;
    }

    function collectCareAssistedTestResults(context) {
        const results = [];
        for (const request of context.testRequests) {
            const rollInput = document.getElementById(`careTestRoll-${request.id}`);
            const secondInput = document.getElementById(`careTestSecondRoll-${request.id}`);
            const roll = Number(rollInput?.value);
            const secondRoll = request.disadvantage ? Number(secondInput?.value) : 0;
            if (!Number.isInteger(roll) || roll < 1 || roll > 20) {
                global.showToast?.(`Informe o d20 de ${request.beneficiaryName} em ${request.skillName}.`);
                rollInput?.focus();
                return null;
            }
            if (request.disadvantage && (!Number.isInteger(secondRoll) || secondRoll < 1 || secondRoll > 20)) {
                global.showToast?.(`Informe o segundo d20 de ${request.beneficiaryName}.`);
                secondInput?.focus();
                return null;
            }
            const naturalRoll = request.disadvantage ? Math.min(roll, secondRoll) : roll;
            const manualModifier = Math.round(Number(document.getElementById(`careTestModifier-${request.id}`)?.value) || 0);
            const total = naturalRoll + request.skillTotal + request.effectModifier + manualModifier;
            results.push({ ...request, roll, secondRoll, naturalRoll, manualModifier, total, success: total >= request.difficulty });
        }
        return results;
    }

    function finalizeCareServices(context, assistedTests = []) {
        const { beneficiaries, payers, record, provider, professional } = context;
        const costResolution = resolveCareProfessionalCosts(context.selections, assistedTests, provider, professional);
        const selections = costResolution.selections;
        const payments = divideCareCost(costResolution.totalCost, payers.map(entry => entry.id)).map(distribution => ({
            ...distribution,
            payer: payers.find(entry => String(entry.id) === distribution.payerId)
        })).filter(entry => entry.payer);
        const insufficient = payments.find(payment => getCrownBalance(payment.payer) < payment.amount);
        if (insufficient) {
            global.showToast?.(`${insufficient.payer.name} possui ${getCrownBalance(insufficient.payer)} Coroas e precisa pagar ${insufficient.amount}.`);
            return false;
        }
        record.assistedTests = cloneCareValue(assistedTests, []);
        record.baseTotalCost = costResolution.baseTotal;
        record.totalCost = costResolution.totalCost;
        record.selections = selections.map(selection => ({
            categoryId: selection.category.id,
            categoryName: selection.category.name,
            optionId: selection.option.id,
            optionName: selection.option.name,
            baseTotalCost: selection.baseTotalCost,
            totalCost: selection.totalCost,
            summary: selection.option.summary,
            rules: cloneCareValue(selection.option, {})
        }));
        record.payments = payments.map(payment => ({ payerId: payment.payer.id, payerName: payment.payer.name, amount: payment.amount }));
        record.professional = {
            providerId: provider?.id || '',
            providerName: provider?.name || '',
            features: provider ? getCareProfessionalFeatures(provider) : {},
            choices: cloneCareValue(professional, {}),
            costAdjustments: cloneCareValue(costResolution.adjustments, [])
        };
        record.outcomes = [];
        record.cycles = [];

        const mutate = () => {
            payments.forEach(payment => {
                const crown = getCrownItem(payment.payer);
                if (crown) crown.moneyValue = getCrownBalance(payment.payer) - payment.amount;
            });
            beneficiaries.forEach(beneficiary => {
                const cycleContext = beginCareCycle(beneficiary, record.createdAt);
                record.cycles.push({
                    beneficiaryId: beneficiary.id,
                    beneficiaryName: beneficiary.name,
                    cycle: cycleContext.cycle,
                    expiredBenefits: cloneCareValue(cycleContext.expiredBenefits, [])
                });
                selections.forEach(selection => {
                    const participantTests = assistedTests.filter(test =>
                        String(test.beneficiaryId) === String(beneficiary.id)
                    );
                    const appliedDetails = applyCareSelectionToCombatant(beneficiary, selection, participantTests);
                    const persistenceDetails = updateCarePersistence(
                        beneficiary,
                        selection,
                        cycleContext,
                        record.createdAt
                    );
                    record.outcomes.push({
                        beneficiaryId: beneficiary.id,
                        beneficiaryName: beneficiary.name,
                        cycle: cycleContext.cycle,
                        categoryId: selection.category.id,
                        categoryName: selection.category.name,
                        optionId: selection.option.id,
                        details: [
                            ...cycleContext.expiredBenefits.splice(0),
                            ...appliedDetails,
                            ...persistenceDetails
                        ]
                    });
                });
                const professionalDetails = applyCareProfessionalBenefits(
                    provider,
                    beneficiary,
                    selections,
                    professional,
                    cycleContext
                );
                if (professionalDetails.length) {
                    record.outcomes.push({
                        beneficiaryId: beneficiary.id,
                        beneficiaryName: beneficiary.name,
                        cycle: cycleContext.cycle,
                        categoryId: 'professional-care',
                        categoryName: 'Integrações profissionais',
                        optionId: provider?.id || '',
                        details: professionalDetails
                    });
                }
            });
            beneficiaries.forEach(beneficiary => {
                const state = ensureCareState(beneficiary);
                state.lastRecord = cloneCareValue(record, {});
                state.records.unshift(cloneCareValue(record, {}));
                state.records = state.records.slice(0, MAX_CARE_RECORDS);
            });
            global.savePlayersToStorage?.();
            global.persistCharacterCollections?.();
            global.renderInventory?.();
            global.renderList?.(false);
            global.renderAutomationCardSummaries?.();
        };

        const label = beneficiaries.length === 1
            ? `Cuidados aplicados: ${beneficiaries[0].name}`
            : `Cuidados aplicados: ${beneficiaries.length} personagens`;
        const metadata = {
            type: 'effect',
            target: beneficiaries.length === 1 ? { id: beneficiaries[0].id, name: beneficiaries[0].name } : undefined,
            participants: [...beneficiaries, ...payers, ...(provider ? [provider] : [])]
                .filter((entry, index, list) => list.findIndex(item => String(item.id) === String(entry.id)) === index)
                .map(entry => ({ id: entry.id, name: entry.name })),
            effect: { id: 'care_services', type: 'care', name: 'Cuidados e descanso', action: 'aplicados' }
        };

        if (typeof global.trackCombatAction === 'function') {
            global.trackCombatAction(label, mutate, () => buildCareHistoryDetail(record), metadata);
        } else {
            mutate();
            global.addCombatHistoryEntry?.(label, buildCareHistoryDetail(record), metadata);
        }

        document.getElementById('careAssistedTestsModal')?.remove();
        global.pendingCareTestContext = null;
        global.showToast?.(`🛏️ Cuidados aplicados a ${beneficiaries.length} personagem(ns).`);
        return true;
    }

    function confirmCareAssistedTests() {
        const context = global.pendingCareTestContext;
        if (!context) return false;
        const assistedTests = collectCareAssistedTestResults(context);
        if (!assistedTests) return false;
        return finalizeCareServices(context, assistedTests);
    }

    function confirmCareServices() {
        const plan = collectCareModalPlan();
        const participants = getCareParticipants();
        const beneficiaries = participants.filter(entry => plan.participantIds.includes(String(entry.id)));
        const payers = participants.filter(entry => plan.payerIds.includes(String(entry.id)));
        const selections = getEnabledCareSelections(plan);
        const provider = participants.find(entry => String(entry.id) === String(plan.professional?.providerId)) || null;
        const professional = cloneCareValue(plan.professional, {});

        if (!beneficiaries.length) {
            global.showToast?.('Selecione ao menos um beneficiário.');
            return false;
        }
        if (!selections.length) {
            global.showToast?.('Selecione ao menos uma categoria de cuidado.');
            return false;
        }

        const totalCost = selections.reduce((sum, selection) => sum + selection.totalCost, 0);
        const timestamp = new Date().toISOString();
        const record = {
            id: `care_${Date.now()}`,
            version: CARE_STATE_VERSION,
            createdAt: timestamp,
            beneficiaries: beneficiaries.map(entry => ({ id: entry.id, name: entry.name })),
            selections: selections.map(selection => ({
                categoryId: selection.category.id,
                categoryName: selection.category.name,
                optionId: selection.option.id,
                optionName: selection.option.name,
                totalCost: selection.totalCost,
                summary: selection.option.summary,
                rules: cloneCareValue(selection.option, {})
            })),
            totalCost,
            payments: [],
            assistedTests: [],
            outcomes: [],
            cycles: []
        };
        const context = { beneficiaries, payers, selections, record, provider, professional };
        const testRequests = collectCareAssistedTestRequests(beneficiaries, selections, { provider, professional });
        if (testRequests.length) {
            openCareAssistedTestsModal({ ...context, testRequests });
            return true;
        }

        const finalized = finalizeCareServices(context, []);
        if (finalized) closeCareServicesModal();
        return finalized;
    }

    function handleHeartAction() {
        const value = Number.parseInt(typeof currentInput !== 'undefined' ? currentInput : '0', 10) || 0;
        const selected = (typeof combatants !== 'undefined' && Array.isArray(combatants) ? combatants : [])
            .find(entry => String(entry.id) === String(typeof selectedId !== 'undefined' ? selectedId : ''));

        if (value > 0 || (selected && Number(selected.hpCurrent) <= 0)) {
            global.applyHP?.(true);
            return 'healing';
        }

        openCareServicesModal();
        return 'care';
    }

    global.careServices = Object.freeze({
        CARE_STATE_VERSION,
        CARE_CATALOG,
        CARE_STATUS_DEFINITIONS,
        CARE_DAILY_BENEFIT_STATUS_IDS,
        CARE_PHYSICAL_SKILL_IDS,
        CARE_CONCENTRATION_SKILL_IDS,
        CARE_PROFESSIONAL_SKILL_IDS,
        normalizeCareAmount,
        getCareOption,
        divideCareCost,
        buildCareHistoryDetail,
        getCareStatusIdFromEffect,
        getCareEffect,
        setCareStatus,
        removeCareStatus,
        getCareTemporarySt,
        spendCareTemporarySt,
        getCareSkillModifier,
        getCareProfessionalSkillLevel,
        getCareProfessionalFeatures,
        getCareProfessionalProviders,
        resolveCareProfessionalCosts,
        applyCareProfessionalBenefits,
        applyCareSelectionToCombatant,
        collectCareAssistedTestRequests,
        ensureCareState,
        beginCareCycle,
        updateCarePersistence,
        restoreCareStateEffects,
        serializeCareState,
        getCareConsumableDefinition,
        consumeCareInventoryItem
    });
    global.handleHeartAction = handleHeartAction;
    global.openCareServicesModal = openCareServicesModal;
    global.closeCareServicesModal = closeCareServicesModal;
    global.toggleCareCategory = toggleCareCategory;
    global.changeCareServiceOption = changeCareServiceOption;
    global.markCareCostAsManual = markCareCostAsManual;
    global.changeCareProfessionalProvider = changeCareProfessionalProvider;
    global.refreshCareServicesModal = refreshCareServicesModal;
    global.confirmCareServices = confirmCareServices;
    global.closeCareAssistedTestsModal = closeCareAssistedTestsModal;
    global.confirmCareAssistedTests = confirmCareAssistedTests;
    global.getCareTemporarySt = getCareTemporarySt;
    global.spendCareTemporarySt = spendCareTemporarySt;
    global.getCareSkillModifier = getCareSkillModifier;
    global.restoreCareStateEffects = restoreCareStateEffects;
    global.serializeCareState = serializeCareState;
    global.consumeCareInventoryItem = consumeCareInventoryItem;
})(typeof window !== 'undefined' ? window : globalThis);
