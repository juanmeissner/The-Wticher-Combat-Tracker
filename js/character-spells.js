(function initializeCharacterSpells(global) {
    'use strict';

    const SPELL_FILTERS = Object.freeze([
        Object.freeze({ id: 'all', label: 'Todas' }),
        Object.freeze({ id: 'offensive', label: 'Ofensivas' }),
        Object.freeze({ id: 'defensive', label: 'Defensivas' }),
        Object.freeze({ id: 'utility', label: 'Utilidade' })
    ]);
    const SPELL_COST_OVERRIDES = Object.freeze({
        axii: Object.freeze({ min: 1, max: 15 }),
        axii_marionete: Object.freeze({ min: 1, max: 15 }),
        quen_ampliado: Object.freeze({ min: 1, max: 15 })
    });
    const OVERLOAD_EFFECT_LABELS = Object.freeze({
        damage: 'Dano',
        range: 'Alcance',
        duration: 'Duração'
    });
    const SPELL_HEALING_RULES = Object.freeze({
        cura_magica: Object.freeze({
            mode: 'instant-formula',
            base: 3,
            dice: '1d6',
            attributeId: 'intelligence',
            attributeLabel: 'Bônus de Inteligência'
        })
    });
    const MULTI_HIT_SPELL_RULES = Object.freeze({
        cenlly_graig: Object.freeze({
            minHits: 1,
            maxHits: 5,
            dice: '2d6',
            extraCostPerHit: 1,
            conditionIcon: '🩸',
            conditionName: 'Sangrando',
            conditionChance: 10
        }),
        granizo_de_carys: Object.freeze({
            minHits: 1,
            maxHits: 5,
            dice: '2d6',
            extraCostPerHit: 1,
            conditionIcon: '🧊',
            conditionName: 'Congelado',
            conditionChance: 10
        })
    });
    const NON_DAMAGE_LABELS = /^(?:-|nenhum|indefinido|efeito vari[aá]vel conforme feiti[cç]o)$/i;
    const expandedPanels = new Set();
    const expandedSpellCards = new Set();
    const panelFilters = new Map();
    const panelSearches = new Map();
    let pendingCast = null;

    function escapeSpellHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function normalizeSpellSearch(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase('pt-BR')
            .trim();
    }

    function isFullCharacter(combatant) {
        return Boolean(combatant && combatant.type === 'player' && combatant.creationMode === 'full');
    }

    function getAbilityCatalog() {
        return Array.isArray(global.predefinedAbilities) ? global.predefinedAbilities : [];
    }

    function getKnownCharacterSpells(combatant) {
        if (!isFullCharacter(combatant)) return [];

        const storedAbilities = Array.isArray(combatant.abilities) ? combatant.abilities : [];
        const knownIds = new Set([
            ...(Array.isArray(combatant.learnedAbilityIds) ? combatant.learnedAbilityIds : []),
            ...storedAbilities.map(ability => ability?.id).filter(Boolean)
        ]);
        const catalog = getAbilityCatalog();
        const storedById = new Map(storedAbilities.map(ability => [ability?.id, ability]));

        return [...knownIds]
            .map(id => catalog.find(ability => ability.id === id) || storedById.get(id))
            .filter(Boolean);
    }

    function getSpellRole(ability) {
        const text = normalizeSpellSearch([
            ability?.name,
            ability?.shortDescription,
            ability?.description,
            ability?.damage
        ].filter(Boolean).join(' '));

        if (/quen|escudo|prote[cç][aã]o|defensiv|cura|curar|pv tempor/.test(text)) {
            return 'defensive';
        }
        if (String(ability?.damage || '').trim() || /causa dano|ataque|ofensiv|incend|explos/.test(text)) {
            return 'offensive';
        }
        return 'utility';
    }

    function getSpellRoleLabel(role) {
        return SPELL_FILTERS.find(filter => filter.id === role)?.label.replace(/s$/, '') || 'Utilidade';
    }

    function getSpellDamageRule(ability, baseCost = 0) {
        const raw = String(ability?.damage || '').trim();
        if (!raw || NON_DAMAGE_LABELS.test(raw)) return null;

        const normalized = normalizeSpellSearch(raw)
            .replaceAll('×', 'x')
            .replaceAll('*', 'x');
        const duration = normalizeSpellSearch(ability?.duration);
        const recurringOnly = /por turno|por rodada/.test(normalized)
            && !/imediat/.test(duration)
            && !/\bou\b/.test(normalized);
        if (recurringOnly) return null;

        const dice = normalized.match(/(\d+)d(\d+)/);
        const staminaMultiplier = /(?:x|por)\s*(?:est|st)(?:\s+gasta)?/.test(normalized);
        const intelligenceBonus = /coef\.?\s*int|bonus\s+de\s+inteligencia/.test(normalized);
        const isSimple = Boolean(dice) && (
            /^\d+d\d+$/.test(normalized) ||
            staminaMultiplier ||
            intelligenceBonus
        );
        const rangeText = normalizeSpellSearch(`${ability?.range || ''} ${ability?.description || ''}`);
        const multiple = /cone|raio|esfera|em area|em todas as direcoes|tudo atingido|todos os alvos|cada alvo/.test(rangeText);
        const count = dice ? Math.max(1, Number(dice[1]) || 1) : 0;
        const sides = dice ? Math.max(2, Number(dice[2]) || 6) : 0;
        const effectiveCount = staminaMultiplier
            ? count * Math.max(1, Number(baseCost) || 1)
            : count;

        const multiHit = MULTI_HIT_SPELL_RULES[String(ability?.id || '')] || null;

        return {
            raw,
            mode: multiHit ? 'multi-hit' : isSimple ? 'dice' : 'manual-total',
            count: effectiveCount,
            sides,
            notation: isSimple ? `${effectiveCount}d${sides}` : raw,
            multiple: multiHit ? false : multiple,
            damageType: normalizeSpellSearch(ability?.type) === 'fogo' ? 'fire' : normalizeSpellSearch(ability?.type),
            attributeId: intelligenceBonus ? 'intelligence' : '',
            attributeLabel: intelligenceBonus ? 'Bônus de Inteligência' : '',
            multiHit
        };
    }

    function getSpellDamageAttributeBonus(combatant, rule) {
        if (!rule?.attributeId) return 0;
        return Number(global.characterSheetModel?.getCharacterAttributeModifier?.(
            rule.attributeId,
            combatant?.attributes
        )) || 0;
    }

    function getAvailableSpellTargets() {
        return (typeof combatants !== 'undefined' ? combatants : []).filter(entry => (
            (entry.type !== 'monster' || entry.hpCurrent === undefined || Number(entry.hpCurrent) > 0) &&
            (entry.type !== 'player' || Math.max(0, Number(entry.deathSaves?.failures) || 0) < 3)
        ));
    }

    function getCharacterAdrenaline(combatant) {
        return Math.max(0, Math.floor(Number(combatant?.progression?.adrenaline) || 0));
    }

    function getPendingAdrenalineUses() {
        return {
            strongStrike: Boolean(pendingCast?.adrenalineUses?.strongStrike),
            doubledEffect: Boolean(pendingCast?.adrenalineUses?.doubledEffect)
        };
    }

    function getPendingAdrenalineCost() {
        const uses = getPendingAdrenalineUses();
        return Number(uses.strongStrike) + Number(uses.doubledEffect);
    }

    function canDoubleSpellEffect(ability, damageRule) {
        if (damageRule?.multiHit || damageRule?.multiple) return true;
        if (Object.prototype.hasOwnProperty.call(ability || {}, 'active')) return true;
        if (global.isAutomationManagedEffect?.('ability', ability?.id)) return true;
        const duration = normalizeSpellSearch(ability?.duration);
        return Boolean(duration && !/imediat|instant/.test(duration));
    }

    function getEffectiveMultiHitMax(rule) {
        if (!rule?.multiHit) return 0;
        return rule.multiHit.maxHits * (getPendingAdrenalineUses().doubledEffect ? 2 : 1);
    }

    function getSpellDamageMultiplier(overloadResult, adrenalineUses = {}) {
        const overloadMultiplier = overloadResult?.success !== false && overloadResult?.effect === 'damage' ? 2 : 1;
        const adrenalineMultiplier = adrenalineUses.strongStrike ? 2 : 1;
        return {
            overloadMultiplier,
            adrenalineMultiplier,
            total: overloadMultiplier * adrenalineMultiplier
        };
    }

    function renderSpellTargetField(targets, damageRule) {
        if (!damageRule) {
            return `
                <label class="character-spell-field">
                    <span>Alvo ou beneficiário</span>
                    <select onchange="updateCharacterSpellCastTarget(this.value)">
                        ${targets.map(target => `<option value="${escapeSpellHtml(target.id)}"${String(target.id) === String(pendingCast.targetId) ? ' selected' : ''}>${escapeSpellHtml(target.name)}</option>`).join('')}
                    </select>
                </label>
            `;
        }

        return `
            <fieldset class="character-spell-target-field">
                <legend>${damageRule.multiple ? 'Alvos atingidos' : 'Alvo atingido'}</legend>
                <small>${damageRule.multiple ? 'Marque todos os participantes alcançados pela área.' : 'Selecione quem receberá o dano.'}</small>
                <div class="character-spell-target-list">
                    ${targets.map(target => {
                        const checked = pendingCast.targetIds.has(String(target.id));
                        return `
                            <label>
                                <input type="${damageRule.multiple ? 'checkbox' : 'radio'}" name="characterSpellDamageTarget" value="${escapeSpellHtml(target.id)}" ${checked ? 'checked' : ''} onchange="updateCharacterSpellCastTarget(this.value, this.checked)">
                                <span><strong>${escapeSpellHtml(target.name)}</strong><small>HP ${Math.max(0, Number(target.hpCurrent) || 0)}/${Math.max(0, Number(target.hpMax) || 0)}</small></span>
                            </label>
                        `;
                    }).join('')}
                </div>
            </fieldset>
        `;
    }

    function getPendingMultiHitCount(rule) {
        if (!rule?.multiHit) return 0;
        return Math.min(
            getEffectiveMultiHitMax(rule),
            Math.max(rule.multiHit.minHits, Math.floor(Number(pendingCast?.hitCount) || rule.multiHit.minHits))
        );
    }

    function ensurePendingMultiHitEntries(rule) {
        if (!pendingCast || !rule?.multiHit) return [];
        const count = getPendingMultiHitCount(rule);
        if (!Array.isArray(pendingCast.hits)) pendingCast.hits = [];
        while (pendingCast.hits.length < count) {
            pendingCast.hits.push({ naturalRoll: '', damage: '', bodyPart: 'torso' });
        }
        pendingCast.hits = pendingCast.hits.slice(0, count);
        return pendingCast.hits;
    }

    function ensurePendingSpellDamageEntries(rule) {
        if (!pendingCast || !rule || rule.multiHit) return [];
        const selectedIds = [...(pendingCast.targetIds || [])].map(String);
        const previous = new Map(
            (Array.isArray(pendingCast.damageEntries) ? pendingCast.damageEntries : [])
                .map(entry => [String(entry.targetId), entry])
        );
        pendingCast.damageEntries = selectedIds.map(targetId => previous.get(targetId) || {
            targetId,
            naturalRoll: '',
            damage: '',
            bodyPart: 'torso'
        });
        return pendingCast.damageEntries;
    }

    function renderMultiHitSpellFields(rule) {
        const entries = ensurePendingMultiHitEntries(rule);
        const count = getPendingMultiHitCount(rule);
        const maximumHits = getEffectiveMultiHitMax(rule);
        const strongStrike = getPendingAdrenalineUses().strongStrike;
        const options = Array.from(
            { length: maximumHits - rule.multiHit.minHits + 1 },
            (_, index) => index + rule.multiHit.minHits
        );
        return `
            <section class="character-spell-damage character-spell-multi-hit">
                <div>
                    <strong>⚔️ Rajadas individuais</strong>
                    <small>Cada impacto usa ${escapeSpellHtml(rule.multiHit.dice)}${strongStrike ? ' ×2 com Golpe Forte' : ''}, região, armadura e crítico próprios.</small>
                </div>
                <label class="character-spell-field character-spell-hit-count">
                    <span>Quantidade de impactos</span>
                    <select onchange="updateCharacterSpellHitCount(this.value)">
                        ${options.map(value => `<option value="${value}"${value === count ? ' selected' : ''}>${value} ${value === 1 ? 'impacto' : 'impactos'}</option>`).join('')}
                    </select>
                    <small>O custo adicional é de ${rule.multiHit.extraCostPerHit} EST por impacto.</small>
                </label>
                <div class="character-spell-hit-list">
                    ${entries.map((entry, index) => `
                        <article class="character-spell-hit-card ${Number(entry.naturalRoll) === 20 ? 'is-critical' : ''}">
                            <header>
                                <strong>Impacto ${index + 1}</strong>
                                <span>${Number(entry.naturalRoll) === 20 ? '💥 CRÍTICO' : `${escapeSpellHtml(rule.multiHit.dice)}${strongStrike ? ' ×2' : ''}`}</span>
                            </header>
                            <div class="character-spell-hit-fields">
                                <label>
                                    <span>D20 natural</span>
                                    <input type="number" min="1" max="20" inputmode="numeric" value="${escapeSpellHtml(entry.naturalRoll)}" placeholder="1–20" oninput="updateCharacterSpellHitField(${index}, 'naturalRoll', this.value)">
                                </label>
                                <label>
                                    <span>Dano base (${escapeSpellHtml(rule.multiHit.dice)})</span>
                                    <input type="number" min="0" inputmode="numeric" value="${escapeSpellHtml(entry.damage)}" placeholder="Total" oninput="updateCharacterSpellHitField(${index}, 'damage', this.value)">
                                </label>
                                <label>
                                    <span>Local do acerto</span>
                                    <select onchange="updateCharacterSpellHitField(${index}, 'bodyPart', this.value)">
                                        <option value="head"${entry.bodyPart === 'head' ? ' selected' : ''}>Cabeça ×3</option>
                                        <option value="torso"${entry.bodyPart === 'torso' ? ' selected' : ''}>Tronco ×1</option>
                                        <option value="arm"${entry.bodyPart === 'arm' ? ' selected' : ''}>Braço ×0,5</option>
                                        <option value="leg"${entry.bodyPart === 'leg' ? ' selected' : ''}>Perna ×0,5</option>
                                    </select>
                                </label>
                            </div>
                            ${Number(entry.naturalRoll) === 20 ? '<small class="character-spell-hit-critical-note">Ignora armadura, dobra o dano antes da região e abrirá o ferimento crítico.</small>' : ''}
                        </article>
                    `).join('')}
                </div>
                <p class="character-spell-damage-note">Informe o resultado original de ${escapeSpellHtml(rule.multiHit.dice)}. Crítico, Adrenalina, Sobrecarga e região serão calculados pelo app.</p>
            </section>
        `;
    }

    function renderSpellDamageField(combatant, rule) {
        if (!rule) return '';
        if (rule.multiHit) return renderMultiHitSpellFields(rule);
        const attributeBonus = getSpellDamageAttributeBonus(combatant, rule);
        const entries = ensurePendingSpellDamageEntries(rule);
        const targetsById = new Map(getAvailableSpellTargets().map(target => [String(target.id), target]));
        const uses = getPendingAdrenalineUses();
        return `
            <section class="character-spell-damage">
                <div>
                    <strong>⚔️ Dano direto</strong>
                    <small>${escapeSpellHtml(rule.raw)}${rule.mode === 'dice' ? ` · rolagem efetiva ${escapeSpellHtml(rule.notation)}` : ' · fórmula contextual'}</small>
                </div>
                ${rule.attributeId ? `<p>${escapeSpellHtml(rule.attributeLabel)} será somado automaticamente: ${attributeBonus >= 0 ? '+' : ''}${attributeBonus}.</p>` : ''}
                ${entries.length ? `<div class="character-spell-hit-list">
                    ${entries.map((entry, index) => {
                        const target = targetsById.get(String(entry.targetId));
                        return `
                            <article class="character-spell-hit-card ${Number(entry.naturalRoll) === 20 ? 'is-critical' : ''}">
                                <header>
                                    <strong>${escapeSpellHtml(target?.name || `Alvo ${index + 1}`)}</strong>
                                    <span>${Number(entry.naturalRoll) === 20 ? '💥 CRÍTICO' : `${escapeSpellHtml(rule.notation)}${uses.strongStrike ? ' ×2' : ''}`}</span>
                                </header>
                                <div class="character-spell-hit-fields">
                                    <label>
                                        <span>D20 natural</span>
                                        <input type="number" min="1" max="20" inputmode="numeric" value="${escapeSpellHtml(entry.naturalRoll)}" placeholder="1–20" oninput="updateCharacterSpellDamageField('${encodeURIComponent(String(entry.targetId))}', 'naturalRoll', this.value)">
                                    </label>
                                    <label>
                                        <span>${rule.mode === 'dice' ? `Dano base (${escapeSpellHtml(rule.notation)})` : 'Dano base'}</span>
                                        <input type="number" min="0" inputmode="numeric" value="${escapeSpellHtml(entry.damage)}" placeholder="Total" oninput="updateCharacterSpellDamageField('${encodeURIComponent(String(entry.targetId))}', 'damage', this.value)">
                                    </label>
                                    <label>
                                        <span>Local do acerto</span>
                                        <select onchange="updateCharacterSpellDamageField('${encodeURIComponent(String(entry.targetId))}', 'bodyPart', this.value)">
                                            <option value="head"${entry.bodyPart === 'head' ? ' selected' : ''}>Cabeça ×3</option>
                                            <option value="torso"${entry.bodyPart === 'torso' ? ' selected' : ''}>Tronco ×1</option>
                                            <option value="arm"${entry.bodyPart === 'arm' ? ' selected' : ''}>Braço ×0,5</option>
                                            <option value="leg"${entry.bodyPart === 'leg' ? ' selected' : ''}>Perna ×0,5</option>
                                        </select>
                                    </label>
                                </div>
                                ${Number(entry.naturalRoll) === 20 ? '<small class="character-spell-hit-critical-note">O dano será crítico, ignorará a armadura e seguirá para o ferimento da região.</small>' : ''}
                            </article>
                        `;
                    }).join('')}
                </div>` : '<p class="character-spell-damage-note">Selecione ao menos um alvo para preencher o dano.</p>'}
                <p class="character-spell-damage-note">Informe o dano original. Crítico, Adrenalina, Sobrecarga, armadura e região serão calculados automaticamente.</p>
            </section>
        `;
    }

    function renderSpellAdrenalineOptions(combatant, ability, damageRule) {
        if (!damageRule) return '';
        const available = getCharacterAdrenaline(combatant);
        const uses = getPendingAdrenalineUses();
        const cost = getPendingAdrenalineCost();
        const canDoubleEffect = canDoubleSpellEffect(ability, damageRule);
        return `
            <section class="character-spell-adrenaline">
                <div class="character-spell-adrenaline-heading">
                    <div><strong>⚡ Adrenalina</strong><small>${available} ${available === 1 ? 'disponível' : 'disponíveis'} · ${cost} selecionada${cost === 1 ? '' : 's'}</small></div>
                    <b>${Math.max(0, available - cost)} restante${available - cost === 1 ? '' : 's'}</b>
                </div>
                <label class="character-spell-adrenaline-option ${uses.strongStrike ? 'is-active' : ''}">
                    <input type="checkbox" ${uses.strongStrike ? 'checked' : ''} onchange="toggleCharacterSpellAdrenaline('strongStrike', this.checked)">
                    <span><strong>Golpe Forte · 1 Adrenalina</strong><small>Dobra o dano base. Pode acumular com crítico e Sobrecarga de dano.</small></span>
                </label>
                ${canDoubleEffect ? `
                    <label class="character-spell-adrenaline-option ${uses.doubledEffect ? 'is-active' : ''}">
                        <input type="checkbox" ${uses.doubledEffect ? 'checked' : ''} onchange="toggleCharacterSpellAdrenaline('doubledEffect', this.checked)">
                        <span><strong>Efeito Dobrado · 1 Adrenalina</strong><small>${damageRule.multiHit ? 'Eleva o limite desta magia de 5 para 10 impactos.' : 'Dobra duração, pilhas ou limite de alvos quando a regra da magia permitir.'}</small></span>
                    </label>
                ` : ''}
            </section>
        `;
    }

    function parseSpellCost(abilityOrCost) {
        const ability = typeof abilityOrCost === 'object' ? abilityOrCost : null;
        const raw = String(ability?.cost ?? abilityOrCost ?? '').trim();
        const normalized = normalizeSpellSearch(raw);
        const override = SPELL_COST_OVERRIDES[ability?.id];

        if (!raw || /sem custo|gratuit/.test(normalized)) {
            return { mode: 'free', raw: raw || 'Sem custo', min: 0, max: 0, defaultValue: 0 };
        }

        const fixed = normalized.match(/^(\d+)\s*(?:est|sta)?$/);
        if (fixed) {
            const value = Math.max(0, Number(fixed[1]) || 0);
            return { mode: 'fixed', raw, min: value, max: value, defaultValue: value };
        }

        const range = normalized.match(/^(\d+)\s*a\s*(\d+)\s*(?:est|sta)?$/);
        if (range) {
            const min = Math.max(0, Number(range[1]) || 0);
            const max = Math.max(min, Number(range[2]) || min);
            return { mode: 'range', raw, min, max, defaultValue: min };
        }

        if (/variavel/.test(normalized)) {
            return {
                mode: 'variable',
                raw,
                min: override?.min || 1,
                max: override?.max || 99,
                defaultValue: override?.min || 1
            };
        }

        const embeddedRange = normalized.match(/(\d+)\s*a\s*(\d+)/);
        return {
            mode: 'formula',
            raw,
            min: override?.min || Number(embeddedRange?.[1]) || 1,
            max: override?.max || Math.max(Number(embeddedRange?.[2]) || 99, Number(embeddedRange?.[1]) || 1),
            defaultValue: override?.min || Number(embeddedRange?.[1]) || 1
        };
    }

    function getProfessionalSkillLevel(combatant, skillId) {
        const model = global.characterSheetModel;
        if (!model?.getCharacterProfessionalSkillTotal) return 0;
        return Math.max(0, Number(model.getCharacterProfessionalSkillTotal(
            skillId,
            combatant?.professionalSkills
        )) || 0);
    }

    function getExpandedMagicLevel(combatant) {
        return Math.max(
            0,
            Number(combatant?.expandedMagic) || 0,
            getProfessionalSkillLevel(combatant, 'mage_magia_expandida')
        );
    }

    function isModifierApplicable(modifier, ability) {
        if (!modifier || modifier.enabled === false) return false;
        if (modifier.abilityId && modifier.abilityId !== ability?.id) return false;
        if (modifier.type && modifier.type !== ability?.type) return false;
        if (modifier.profession && modifier.profession !== ability?.profession) return false;
        return true;
    }

    function getSpellCastingModifiers(combatant, ability, options = {}) {
        const modifiers = [];
        const expandedLevel = getExpandedMagicLevel(combatant);
        if (expandedLevel > 0) {
            modifiers.push({
                id: 'expanded-magic',
                label: `Magia Expandida Nv. ${expandedLevel}`,
                costFlat: -(expandedLevel * 2),
                source: 'professional-skill'
            });
        }

        const customModifiers = Array.isArray(combatant?.spellCastingModifiers)
            ? combatant.spellCastingModifiers
            : [];
        customModifiers.filter(modifier => isModifierApplicable(modifier, ability))
            .forEach(modifier => modifiers.push({ ...modifier }));

        if (options.overloadEffect) {
            modifiers.push({
                id: 'arcane-overload',
                label: `Sobrecarga Arcana · ${OVERLOAD_EFFECT_LABELS[options.overloadEffect] || options.overloadEffect}`,
                costMultiplier: 2,
                [`${options.overloadEffect}Multiplier`]: 2,
                source: 'cast-option'
            });
        }
        return modifiers;
    }

    function calculateEffectiveSpell(combatant, ability, baseCost, options = {}) {
        const parsedCost = parseSpellCost(ability);
        const normalizedBaseCost = parsedCost.mode === 'free'
            ? 0
            : Math.min(parsedCost.max, Math.max(parsedCost.min, Math.floor(Number(baseCost) || parsedCost.defaultValue)));
        const modifiers = getSpellCastingModifiers(combatant, ability, options);
        let cost = normalizedBaseCost;
        const costSteps = [{ label: 'Custo base', value: normalizedBaseCost }];

        modifiers.forEach(modifier => {
            const flat = Number(modifier.costFlat) || 0;
            if (!flat) return;
            cost += flat;
            costSteps.push({ label: modifier.label, value: flat });
        });
        if (normalizedBaseCost > 0) cost = Math.max(1, cost);
        else cost = 0;
        modifiers.forEach(modifier => {
            const multiplier = Number(modifier.costMultiplier);
            if (!Number.isFinite(multiplier) || multiplier === 1) return;
            cost *= multiplier;
            costSteps.push({ label: `${modifier.label} ×${multiplier}`, value: null });
        });

        const overloadEffect = options.overloadEffect || '';
        return {
            abilityId: ability?.id || '',
            baseCost: normalizedBaseCost,
            finalCost: Math.max(0, Math.floor(cost)),
            costSteps,
            modifiers,
            overloadEffect,
            damage: overloadEffect === 'damage' && ability?.damage ? `${ability.damage} ×2` : (ability?.damage || ''),
            range: overloadEffect === 'range' && ability?.range ? `${ability.range} ×2` : (ability?.range || ''),
            duration: overloadEffect === 'duration' && ability?.duration ? `${ability.duration} ×2` : (ability?.duration || '')
        };
    }

    function getArcaneOverloadOptions(combatant, ability) {
        const level = getProfessionalSkillLevel(combatant, 'mage_sobrecarga_arcana');
        if (level <= 0) return { level: 0, options: [] };

        const options = [];
        if (String(ability?.damage || '').trim()) options.push({ id: 'damage', label: 'Dobrar dano' });
        if (String(ability?.range || '').trim()) options.push({ id: 'range', label: 'Dobrar alcance' });
        if (String(ability?.duration || '').trim() && !/imediat/i.test(ability.duration)) {
            options.push({ id: 'duration', label: 'Dobrar duração' });
        }
        return { level, options };
    }

    function isWitcherSign(ability) {
        return normalizeSpellSearch(ability?.profession) === 'bruxo'
            || normalizeSpellSearch(ability?.category) === 'bruxo';
    }

    function getSpellEnergyAvailability(combatant, ability) {
        const stamina = Math.max(0, Number(combatant?.stCurrent) || 0);
        const temporarySt = Math.max(0, Number(global.getCareTemporarySt?.(combatant)) || 0);
        const runeSource = isWitcherSign(ability)
            ? Math.max(0, Number(combatant?.runeSourceCurrent) || 0)
            : 0;
        return { stamina, temporarySt, runeSource, total: stamina + temporarySt + runeSource };
    }

    function spendSpellEnergy(combatant, ability, cost) {
        const totalCost = Math.max(0, Math.floor(Number(cost) || 0));
        const availability = getSpellEnergyAvailability(combatant, ability);
        if (!combatant || totalCost > availability.total) return null;

        const runeSourceSpent = isWitcherSign(ability)
            ? Math.min(totalCost, availability.runeSource)
            : 0;
        const remainingAfterRune = totalCost - runeSourceSpent;
        const temporaryResult = global.spendCareTemporarySt?.(combatant, remainingAfterRune)
            || { spent: 0, availableAfter: availability.temporarySt };
        const temporaryStSpent = Math.min(remainingAfterRune, Math.max(0, Number(temporaryResult.spent) || 0));
        const staminaSpent = remainingAfterRune - temporaryStSpent;
        const result = {
            cost: totalCost,
            staminaBefore: availability.stamina,
            staminaSpent,
            staminaAfter: availability.stamina - staminaSpent,
            temporaryStBefore: availability.temporarySt,
            temporaryStSpent,
            temporaryStAfter: Math.max(0, Number(temporaryResult.availableAfter) || 0),
            runeSourceBefore: availability.runeSource,
            runeSourceSpent,
            runeSourceAfter: availability.runeSource - runeSourceSpent
        };
        combatant.stCurrent = result.staminaAfter;
        if (isWitcherSign(ability)) combatant.runeSourceCurrent = result.runeSourceAfter;
        return result;
    }

    function getCostPreview(combatant, ability) {
        const parsed = parseSpellCost(ability);
        if (parsed.mode === 'free') return '0 EST';
        if (parsed.mode === 'fixed') {
            return `${calculateEffectiveSpell(combatant, ability, parsed.defaultValue).finalCost} EST`;
        }
        if (parsed.mode === 'range') {
            const min = calculateEffectiveSpell(combatant, ability, parsed.min).finalCost;
            const max = calculateEffectiveSpell(combatant, ability, parsed.max).finalCost;
            return min === max ? `${min} EST` : `${min}–${max} EST`;
        }
        return 'Definir EST';
    }

    function getSpellSearchText(ability) {
        return normalizeSpellSearch([
            ability?.name,
            ability?.type,
            ability?.category,
            ability?.shortDescription,
            ability?.description
        ].filter(Boolean).join(' '));
    }

    function renderSpellDetail(ability) {
        const details = [
            ['Tipo', ability.type],
            ['Categoria', ability.category],
            ['Profissão', ability.profession],
            ['Alcance', ability.range],
            ['Duração', ability.duration],
            ['Dano', ability.damage],
            ['Defesa/Teste', ability.defense],
            ['Ação', ability.action],
            ['Custo original', ability.cost]
        ].filter(([, value]) => String(value || '').trim());

        return `
            <div class="character-spell-detail">
                <p>${escapeSpellHtml(ability.description || ability.shortDescription || 'Sem descrição adicional.')}</p>
                <dl>${details.map(([label, value]) => `
                    <div><dt>${escapeSpellHtml(label)}</dt><dd>${escapeSpellHtml(value)}</dd></div>
                `).join('')}</dl>
            </div>
        `;
    }

    function renderCharacterSpellCard(combatant, ability) {
        const cardKey = `${combatant.id}:${ability.id}`;
        const expanded = expandedSpellCards.has(cardKey);
        const role = getSpellRole(ability);
        const preview = getCostPreview(combatant, ability);
        const onTurn = String(combatant.id) === String(typeof activeTurnId !== 'undefined' ? activeTurnId : '');
        const fixedCost = parseSpellCost(ability).mode === 'fixed'
            ? calculateEffectiveSpell(combatant, ability, parseSpellCost(ability).defaultValue).finalCost
            : null;
        const insufficient = fixedCost !== null
            && fixedCost > getSpellEnergyAvailability(combatant, ability).total;

        return `
            <article class="character-spell-card ${expanded ? 'is-expanded' : ''}">
                <div class="character-spell-card-main">
                    <span class="character-spell-icon" aria-hidden="true">${escapeSpellHtml(ability.icon || '✨')}</span>
                    <div class="character-spell-copy">
                        <strong>${escapeSpellHtml(ability.name)}</strong>
                        <small>${escapeSpellHtml(ability.type || getSpellRoleLabel(role))} · ${escapeSpellHtml(getSpellRoleLabel(role))}${ability.range ? ` · ${escapeSpellHtml(ability.range)}` : ''}</small>
                        ${ability.damage ? `<span>${escapeSpellHtml(ability.damage)}</span>` : ''}
                    </div>
                    <button type="button" class="character-spell-expand" onclick="event.stopPropagation(); toggleCharacterSpellCard('${encodeURIComponent(String(combatant.id))}', '${encodeURIComponent(ability.id)}')" aria-expanded="${expanded}" aria-label="${expanded ? 'Recolher' : 'Expandir'} ${escapeSpellHtml(ability.name)}">${expanded ? '⌃' : '⌄'}</button>
                </div>
                <button type="button" class="character-spell-cast-button" onclick="event.stopPropagation(); openCharacterSpellCast('${encodeURIComponent(String(combatant.id))}', '${encodeURIComponent(ability.id)}')" ${(onTurn && !insufficient) ? '' : 'disabled'}>
                    ${!onTurn ? 'Fora do turno' : insufficient ? 'EST insuficiente' : `Conjurar — ${escapeSpellHtml(preview)}`}
                </button>
                ${expanded ? renderSpellDetail(ability) : ''}
            </article>
        `;
    }

    function renderCharacterSpellsPanel(combatant) {
        const spells = getKnownCharacterSpells(combatant);
        if (!spells.length) return '';

        const key = String(combatant.id);
        const encodedId = encodeURIComponent(key);
        const expanded = expandedPanels.has(key);
        const filter = panelFilters.get(key) || 'all';
        const search = panelSearches.get(key) || '';
        const visibleSpells = spells.filter(ability => (
            (filter === 'all' || getSpellRole(ability) === filter)
            && (!search || getSpellSearchText(ability).includes(search))
        ));

        return `
            <section class="character-spells-panel ${expanded ? '' : 'is-collapsed'}" aria-label="Magias de ${escapeSpellHtml(combatant.name)}">
                <button type="button" class="combat-subpanel-header character-spells-header" aria-expanded="${expanded}" onclick="event.stopPropagation(); toggleCharacterSpellsPanel('${encodedId}')">
                    <span>${expanded ? '▼' : '▶'} MAGIAS</span>
                    <small>${spells.length} ${spells.length === 1 ? 'conhecida' : 'conhecidas'} · EST ${Math.max(0, Number(combatant.stCurrent) || 0)}/${Math.max(0, Number(combatant.stMax) || 0)}</small>
                </button>
                ${expanded ? `
                    <div class="character-spells-content">
                        ${spells.length >= 8 ? `
                            <label class="character-spell-search">
                                <span>Buscar magia</span>
                                <input type="search" value="${escapeSpellHtml(search)}" placeholder="Nome, tipo ou efeito..." oninput="filterCharacterSpells('${encodedId}', this.value)">
                            </label>
                        ` : ''}
                        ${spells.length >= 6 ? `
                            <div class="character-spell-filters" role="group" aria-label="Filtrar magias">
                                ${SPELL_FILTERS.map(entry => `
                                    <button type="button" class="${filter === entry.id ? 'is-active' : ''}" onclick="event.stopPropagation(); setCharacterSpellFilter('${encodedId}', '${entry.id}')">${entry.label}</button>
                                `).join('')}
                            </div>
                        ` : ''}
                        <div class="character-spell-list">
                            ${visibleSpells.length
                                ? visibleSpells.map(ability => renderCharacterSpellCard(combatant, ability)).join('')
                                : '<p class="character-spell-empty">Nenhuma magia corresponde aos filtros.</p>'}
                        </div>
                    </div>
                ` : ''}
            </section>
        `;
    }

    function rerenderCombat() {
        if (typeof renderList === 'function') renderList(false);
    }

    function toggleCharacterSpellsPanel(encodedCombatantId) {
        const key = decodeURIComponent(String(encodedCombatantId));
        if (expandedPanels.has(key)) expandedPanels.delete(key);
        else expandedPanels.add(key);
        rerenderCombat();
    }

    function toggleCharacterSpellCard(encodedCombatantId, encodedAbilityId) {
        const key = `${decodeURIComponent(String(encodedCombatantId))}:${decodeURIComponent(String(encodedAbilityId))}`;
        if (expandedSpellCards.has(key)) expandedSpellCards.delete(key);
        else expandedSpellCards.add(key);
        rerenderCombat();
    }

    function setCharacterSpellFilter(encodedCombatantId, filterId) {
        const key = decodeURIComponent(String(encodedCombatantId));
        panelFilters.set(key, SPELL_FILTERS.some(entry => entry.id === filterId) ? filterId : 'all');
        rerenderCombat();
    }

    function filterCharacterSpells(encodedCombatantId, value) {
        const key = decodeURIComponent(String(encodedCombatantId));
        panelSearches.set(key, normalizeSpellSearch(value));
        rerenderCombat();
    }

    function getSkillRollMode() {
        try {
            if (typeof appPreferences !== 'undefined') return appPreferences.rollModes?.skills || 'manual';
            return JSON.parse(localStorage.getItem('dnd_app_preferences') || '{}').rollModes?.skills || 'manual';
        } catch {
            return 'manual';
        }
    }

    function getAbilityRollMode() {
        try {
            if (typeof appPreferences !== 'undefined') return appPreferences.rollModes?.abilities || 'manual';
            return JSON.parse(localStorage.getItem('dnd_app_preferences') || '{}').rollModes?.abilities || 'manual';
        } catch {
            return 'manual';
        }
    }

    function getSpellHealingRule(abilityOrId) {
        const id = typeof abilityOrId === 'object' ? abilityOrId?.id : abilityOrId;
        return SPELL_HEALING_RULES[String(id || '')] || null;
    }

    function getSpellHealingAttributeBonus(combatant, rule) {
        if (!rule?.attributeId) return 0;
        return Math.max(0, Number(global.characterSheetModel?.getCharacterAttributeModifier?.(
            rule.attributeId,
            combatant?.attributes
        )) || 0);
    }

    function calculateSpellHealing(combatant, ability, diceResult) {
        const rule = getSpellHealingRule(ability);
        if (!rule) return null;

        const roll = Number(diceResult);
        const validRoll = Number.isInteger(roll) && roll >= 1 && roll <= 6;
        const attributeBonus = getSpellHealingAttributeBonus(combatant, rule);
        return {
            valid: validRoll,
            abilityId: ability.id,
            base: rule.base,
            dice: rule.dice,
            roll: validRoll ? roll : null,
            attributeId: rule.attributeId,
            attributeLabel: rule.attributeLabel,
            attributeBonus,
            total: validRoll ? rule.base + attributeBonus + roll : 0
        };
    }

    function calculateSpellDamage(combatant, rule, enteredValue, overloadResult, random = Math.random, adrenalineUses = {}) {
        if (!rule) return null;
        const automaticDice = getAbilityRollMode() === 'auto' && rule.mode === 'dice';
        const rolled = automaticDice
            ? rollDice(rule.count, rule.sides, random)
            : { rolls: [], total: Number(enteredValue) };
        if (!Number.isFinite(rolled.total) || rolled.total < 0) return { valid: false };

        const attributeBonus = getSpellDamageAttributeBonus(combatant, rule);
        const subtotal = Math.max(0, Math.floor(rolled.total) + attributeBonus);
        const multipliers = getSpellDamageMultiplier(overloadResult, adrenalineUses);
        return {
            valid: true,
            raw: rule.raw,
            notation: rule.notation,
            rollMode: automaticDice ? 'auto' : 'manual',
            rolls: rolled.rolls,
            rolledTotal: Math.floor(rolled.total),
            attributeBonus,
            subtotal,
            overloadMultiplier: multipliers.overloadMultiplier,
            adrenalineMultiplier: multipliers.adrenalineMultiplier,
            totalMultiplier: multipliers.total,
            total: subtotal * multipliers.total,
            damageType: rule.damageType,
            multiple: rule.multiple
        };
    }

    function calculateMultiHitSpellDamage(rule, entries, overloadResult, adrenalineUses = {}) {
        if (!rule?.multiHit || !Array.isArray(entries)) return null;
        const maximumHits = rule.multiHit.maxHits * (adrenalineUses.doubledEffect ? 2 : 1);
        const count = Math.min(maximumHits, Math.max(rule.multiHit.minHits, entries.length));
        if (entries.length !== count) return { valid: false, invalidIndex: 0 };
        const multipliers = getSpellDamageMultiplier(overloadResult, adrenalineUses);
        const hits = entries.map((entry, index) => {
            const naturalRoll = Number(entry?.naturalRoll);
            const enteredDamage = Number(entry?.damage);
            const bodyPart = String(entry?.bodyPart || '');
            const valid = Number.isInteger(naturalRoll)
                && naturalRoll >= 1
                && naturalRoll <= 20
                && Number.isFinite(enteredDamage)
                && enteredDamage > 0
                && ['head', 'torso', 'arm', 'leg'].includes(bodyPart);
            return {
                index,
                valid,
                naturalRoll,
                enteredDamage: valid ? Math.floor(enteredDamage) : 0,
                damage: valid ? Math.floor(enteredDamage) * multipliers.total : 0,
                bodyPart,
                critical: naturalRoll === 20
            };
        });
        const invalid = hits.find(hit => !hit.valid);
        return {
            valid: !invalid,
            invalidIndex: invalid?.index ?? -1,
            multiHit: true,
            notation: rule.multiHit.dice,
            overloadMultiplier: multipliers.overloadMultiplier,
            adrenalineMultiplier: multipliers.adrenalineMultiplier,
            totalMultiplier: multipliers.total,
            doubledEffect: Boolean(adrenalineUses.doubledEffect),
            damageType: rule.damageType,
            hits,
            total: hits.reduce((sum, hit) => sum + hit.damage, 0)
        };
    }

    function calculatePreparedSpellDamage(combatant, rule, entries, overloadResult, adrenalineUses = {}, random = Math.random) {
        if (!rule || rule.multiHit || !Array.isArray(entries)) return null;
        const results = entries.map((entry, index) => {
            const naturalRoll = Number(entry?.naturalRoll);
            const bodyPart = String(entry?.bodyPart || '');
            const calculation = calculateSpellDamage(
                combatant,
                rule,
                entry?.damage,
                overloadResult,
                random,
                adrenalineUses
            );
            const valid = Number.isInteger(naturalRoll)
                && naturalRoll >= 1
                && naturalRoll <= 20
                && ['head', 'torso', 'arm', 'leg'].includes(bodyPart)
                && calculation?.valid
                && calculation.total > 0;
            return {
                index,
                targetId: String(entry?.targetId || ''),
                naturalRoll,
                bodyPart,
                critical: naturalRoll === 20,
                valid,
                enteredDamage: calculation?.rolledTotal || 0,
                damage: calculation?.total || 0,
                calculation
            };
        });
        const invalid = results.find(entry => !entry.valid);
        const multipliers = getSpellDamageMultiplier(overloadResult, adrenalineUses);
        return {
            valid: !invalid && results.length > 0,
            invalidIndex: invalid?.index ?? (results.length ? -1 : 0),
            prepared: true,
            notation: rule.notation,
            damageType: rule.damageType,
            overloadMultiplier: multipliers.overloadMultiplier,
            adrenalineMultiplier: multipliers.adrenalineMultiplier,
            totalMultiplier: multipliers.total,
            entries: results,
            total: results.reduce((sum, entry) => sum + entry.damage, 0)
        };
    }

    function getBacklashDice(ability) {
        const category = normalizeSpellSearch(ability?.category);
        if (/mestre/.test(category)) return 3;
        if (/profissional/.test(category)) return 2;
        return 1;
    }

    function rollDice(count, sides = 6, random = Math.random) {
        const rolls = Array.from({ length: Math.max(0, count) }, () => Math.floor(random() * sides) + 1);
        return { rolls, total: rolls.reduce((sum, value) => sum + value, 0) };
    }

    function closeCharacterSpellCast() {
        document.getElementById('characterSpellCastModal')?.remove();
        pendingCast = null;
    }

    function getPendingEffectiveSpell() {
        if (!pendingCast) return null;
        return calculateEffectiveSpell(
            pendingCast.combatant,
            pendingCast.ability,
            pendingCast.baseCost,
            { overloadEffect: pendingCast.overloadEffect }
        );
    }

    function renderCharacterSpellCastModal() {
        if (!pendingCast) return;
        const previousScroll = document.querySelector?.('.character-spell-cast-dialog')?.scrollTop || 0;
        document.getElementById('characterSpellCastModal')?.remove();

        const { combatant, ability, parsedCost, overloadEffect } = pendingCast;
        const effective = getPendingEffectiveSpell();
        const overload = getArcaneOverloadOptions(combatant, ability);
        const availability = getSpellEnergyAvailability(combatant, ability);
        const rollMode = getSkillRollMode();
        const healingRule = getSpellHealingRule(ability);
        const healingRollMode = getAbilityRollMode();
        const healingAttributeBonus = getSpellHealingAttributeBonus(combatant, healingRule);
        const damageRule = getSpellDamageRule(ability, effective.baseCost);
        const hitCount = getPendingMultiHitCount(damageRule);
        const multiHitCost = damageRule?.multiHit ? hitCount * damageRule.multiHit.extraCostPerHit : 0;
        const finalCastCost = effective.finalCost + multiHitCost;
        const enoughEnergy = finalCastCost <= availability.total;
        const adrenalineAvailable = getCharacterAdrenaline(combatant);
        const adrenalineCost = getPendingAdrenalineCost();
        const enoughAdrenaline = adrenalineCost <= adrenalineAvailable;
        const targets = getAvailableSpellTargets();
        const modal = document.createElement('div');
        modal.id = 'characterSpellCastModal';
        modal.className = 'session-overlay character-spell-cast-overlay';
        modal.addEventListener('click', event => {
            if (event.target === modal) closeCharacterSpellCast();
        });
        modal.innerHTML = `
            <section class="session-dialog character-spell-cast-dialog" role="dialog" aria-modal="true" aria-labelledby="characterSpellCastTitle">
                <div class="session-dialog-header">
                    <div>
                        <small class="character-spell-kicker">CONJURAÇÃO</small>
                        <h2 id="characterSpellCastTitle">${escapeSpellHtml(ability.icon || '✨')} ${escapeSpellHtml(ability.name)}</h2>
                    </div>
                    <button type="button" class="session-close" onclick="closeCharacterSpellCast()" aria-label="Fechar">×</button>
                </div>
                <p class="character-spell-caster">${escapeSpellHtml(combatant.name)} · EST ${availability.stamina}${availability.temporarySt ? ` + ${availability.temporarySt} temporário` : ''}${availability.runeSource ? ` + ${availability.runeSource} Fonte Rúnica` : ''}</p>
                ${parsedCost.mode !== 'fixed' && parsedCost.mode !== 'free' ? `
                    <label class="character-spell-field">
                        <span>EST base utilizada</span>
                        <input id="characterSpellBaseCost" type="number" min="${parsedCost.min}" max="${parsedCost.max}" value="${pendingCast.baseCost}" onchange="updateCharacterSpellCastBaseCost(this.value)">
                        <small>${escapeSpellHtml(parsedCost.raw)} · informe o gasto antes dos modificadores.</small>
                    </label>
                ` : ''}
                ${renderSpellTargetField(targets, damageRule)}
                ${renderSpellAdrenalineOptions(combatant, ability, damageRule)}
                <section class="character-spell-cost-summary">
                    <strong>Custo calculado</strong>
                    ${effective.costSteps.map(step => `<span><b>${escapeSpellHtml(step.label)}</b><em>${step.value === null ? 'aplicado' : `${step.label === 'Custo base' || step.value < 0 ? '' : '+'}${step.value} EST`}</em></span>`).join('')}
                    ${multiHitCost ? `<span><b>${hitCount} ${hitCount === 1 ? 'impacto' : 'impactos'}</b><em>+${multiHitCost} EST</em></span>` : ''}
                    <div><span>Custo final</span><strong>${finalCastCost} EST</strong></div>
                </section>
                ${healingRule ? `
                    <section class="character-spell-healing">
                        <div>
                            <strong>🌿 Cura automatizada</strong>
                            <small>3 + ${escapeSpellHtml(healingRule.attributeLabel)} + 1d6</small>
                        </div>
                        <div class="character-spell-healing-formula">
                            <span>Base <b>3</b></span>
                            <span>${escapeSpellHtml(healingRule.attributeLabel)} <b>+${healingAttributeBonus}</b></span>
                        </div>
                        ${healingRollMode === 'auto' ? `
                            <p class="character-spell-auto-roll">🎲 O 1d6 de cura será rolado automaticamente.</p>
                        ` : `
                            <label class="character-spell-field">
                                <span>Resultado do 1d6 de cura</span>
                                <input id="characterSpellHealingRoll" type="number" min="1" max="6" inputmode="numeric" placeholder="1 a 6">
                                <small>Informe somente o resultado mostrado pelo dado físico.</small>
                            </label>
                        `}
                    </section>
                ` : ''}
                ${renderSpellDamageField(combatant, damageRule)}
                ${overload.options.length ? `
                    <section class="character-spell-overload">
                        <div><strong>Sobrecarga Arcana · Nível ${overload.level}</strong><small>Opcional · dobra o custo e exige teste CD 16.</small></div>
                        <div class="character-spell-overload-options">
                            <button type="button" class="${!overloadEffect ? 'is-active' : ''}" onclick="setCharacterSpellOverload('')">Não usar</button>
                            ${overload.options.map(option => `<button type="button" class="${overloadEffect === option.id ? 'is-active' : ''}" onclick="setCharacterSpellOverload('${option.id}')">${escapeSpellHtml(option.label)}</button>`).join('')}
                        </div>
                        ${overloadEffect ? `
                            <div class="character-spell-effective-effect">
                                ${effective.damage ? `<span><b>Dano</b>${escapeSpellHtml(effective.damage)}</span>` : ''}
                                ${effective.range ? `<span><b>Alcance</b>${escapeSpellHtml(effective.range)}</span>` : ''}
                                ${effective.duration ? `<span><b>Duração</b>${escapeSpellHtml(effective.duration)}</span>` : ''}
                            </div>
                            ${rollMode === 'manual' ? `
                                <label class="character-spell-field">
                                    <span>Resultado natural do d20</span>
                                    <input id="characterSpellOverloadRoll" type="number" min="1" max="20" inputmode="numeric" placeholder="1 a 20">
                                    <small>Teste: 1d20 + ${overload.level} contra CD 16.</small>
                                </label>
                            ` : '<p class="character-spell-auto-roll">🎲 O teste de Sobrecarga será rolado automaticamente.</p>'}
                        ` : ''}
                    </section>
                ` : ''}
                ${!enoughEnergy ? `<p class="character-spell-warning">EST insuficiente: faltam ${finalCastCost - availability.total} pontos.</p>` : ''}
                ${!enoughAdrenaline ? `<p class="character-spell-warning">Adrenalina insuficiente: faltam ${adrenalineCost - adrenalineAvailable} pontos.</p>` : ''}
                <div class="session-dialog-actions">
                    <button type="button" class="session-secondary" onclick="closeCharacterSpellCast()">Cancelar</button>
                    <button type="button" class="session-primary" onclick="confirmCharacterSpellCast()" ${(enoughEnergy && enoughAdrenaline) ? '' : 'disabled'}>Confirmar conjuração · ${finalCastCost} EST${adrenalineCost ? ` · ${adrenalineCost} Adrenalina` : ''}</button>
                </div>
            </section>
        `;
        document.body.appendChild(modal);
        const dialog = modal.querySelector?.('.character-spell-cast-dialog');
        if (dialog) dialog.scrollTop = previousScroll;
    }

    function openCharacterSpellCast(encodedCombatantId, encodedAbilityId) {
        const combatantId = decodeURIComponent(String(encodedCombatantId));
        const abilityId = decodeURIComponent(String(encodedAbilityId));
        const combatant = typeof combatants !== 'undefined'
            ? combatants.find(entry => String(entry.id) === combatantId)
            : null;
        const ability = getKnownCharacterSpells(combatant).find(entry => entry.id === abilityId);
        if (!combatant || !ability) {
            global.showToast?.('Esta magia não está disponível para o personagem.');
            return;
        }
        if (String(combatant.id) !== String(typeof activeTurnId !== 'undefined' ? activeTurnId : '')) {
            global.showToast?.(`Aguarde o turno de ${combatant.name} para conjurar.`);
            return;
        }

        const parsedCost = parseSpellCost(ability);
        const selectedTarget = typeof selectedId !== 'undefined'
            ? combatants.find(entry => String(entry.id) === String(selectedId))
            : null;
        const damageRule = getSpellDamageRule(ability, parsedCost.defaultValue);
        const selectedIsCaster = String(selectedTarget?.id ?? '') === String(combatant.id);
        const initialTargetIds = damageRule?.multiple && selectedIsCaster
            ? []
            : [String(selectedTarget?.id ?? combatant.id)];
        pendingCast = {
            combatant,
            ability,
            parsedCost,
            baseCost: parsedCost.defaultValue,
            targetId: selectedTarget?.id ?? combatant.id,
            targetIds: new Set(initialTargetIds),
            damageInput: '',
            hitCount: damageRule?.multiHit?.minHits || 0,
            hits: damageRule?.multiHit
                ? [{ naturalRoll: '', damage: '', bodyPart: 'torso' }]
                : [],
            damageEntries: [],
            adrenalineUses: {
                strongStrike: false,
                doubledEffect: false
            },
            overloadEffect: ''
        };
        renderCharacterSpellCastModal();
    }

    function updateCharacterSpellCastBaseCost(value) {
        if (!pendingCast) return;
        pendingCast.baseCost = Math.min(
            pendingCast.parsedCost.max,
            Math.max(pendingCast.parsedCost.min, Math.floor(Number(value) || pendingCast.parsedCost.defaultValue))
        );
        renderCharacterSpellCastModal();
    }

    function updateCharacterSpellCastTarget(value, checked = true) {
        if (!pendingCast) return;
        const target = (typeof combatants !== 'undefined' ? combatants : [])
            .find(entry => String(entry.id) === String(value));
        if (!target) return;

        const rule = getSpellDamageRule(pendingCast.ability, pendingCast.baseCost);
        if (!rule?.multiple) {
            pendingCast.targetIds = new Set([String(target.id)]);
            pendingCast.targetId = target.id;
            ensurePendingSpellDamageEntries(rule);
            renderCharacterSpellCastModal();
            return;
        }

        if (checked) pendingCast.targetIds.add(String(target.id));
        else pendingCast.targetIds.delete(String(target.id));
        pendingCast.targetId = [...pendingCast.targetIds][0] ?? pendingCast.combatant.id;
        ensurePendingSpellDamageEntries(rule);
        renderCharacterSpellCastModal();
    }

    function updateCharacterSpellDamageRoll(value) {
        if (pendingCast) pendingCast.damageInput = String(value ?? '');
    }

    function updateCharacterSpellDamageField(encodedTargetId, field, value) {
        if (!pendingCast || !['naturalRoll', 'damage', 'bodyPart'].includes(field)) return;
        const targetId = decodeURIComponent(String(encodedTargetId));
        const rule = getSpellDamageRule(pendingCast.ability, pendingCast.baseCost);
        const entry = ensurePendingSpellDamageEntries(rule)
            .find(current => String(current.targetId) === targetId);
        if (!entry) return;
        if (field === 'bodyPart') {
            entry.bodyPart = ['head', 'torso', 'arm', 'leg'].includes(value) ? value : 'torso';
            return;
        }
        entry[field] = String(value ?? '');
        if (field === 'naturalRoll') {
            const input = document.querySelector?.(`input[oninput*="${encodeURIComponent(targetId)}"][oninput*="naturalRoll"]`);
            const card = input?.closest?.('.character-spell-hit-card');
            card?.classList.toggle('is-critical', Number(value) === 20);
            const badge = card?.querySelector?.('header span');
            if (badge) badge.textContent = Number(value) === 20
                ? '💥 CRÍTICO'
                : `${rule.notation}${getPendingAdrenalineUses().strongStrike ? ' ×2' : ''}`;
            const previousNote = card?.querySelector?.('.character-spell-hit-critical-note');
            if (Number(value) === 20 && !previousNote) {
                const note = document.createElement?.('small');
                if (note) {
                    note.className = 'character-spell-hit-critical-note';
                    note.textContent = 'O dano será crítico, ignorará a armadura e seguirá para o ferimento da região.';
                    card?.appendChild?.(note);
                }
            } else if (Number(value) !== 20) {
                previousNote?.remove();
            }
        }
    }

    function updateCharacterSpellHitCount(value) {
        if (!pendingCast) return;
        const rule = getSpellDamageRule(pendingCast.ability, pendingCast.baseCost);
        if (!rule?.multiHit) return;
        pendingCast.hitCount = Math.min(
            getEffectiveMultiHitMax(rule),
            Math.max(rule.multiHit.minHits, Math.floor(Number(value) || rule.multiHit.minHits))
        );
        ensurePendingMultiHitEntries(rule);
        renderCharacterSpellCastModal();
    }

    function updateCharacterSpellHitField(index, field, value) {
        if (!pendingCast) return;
        const rule = getSpellDamageRule(pendingCast.ability, pendingCast.baseCost);
        const hits = ensurePendingMultiHitEntries(rule);
        const hit = hits[Math.max(0, Math.floor(Number(index) || 0))];
        if (!hit || !['naturalRoll', 'damage', 'bodyPart'].includes(field)) return;
        if (field === 'bodyPart') {
            hit.bodyPart = ['head', 'torso', 'arm', 'leg'].includes(value) ? value : 'torso';
            return;
        }
        hit[field] = String(value ?? '');
        if (field === 'naturalRoll') {
            const card = document.querySelectorAll?.('.character-spell-hit-card')?.[index];
            card?.classList.toggle('is-critical', Number(value) === 20);
            const badge = card?.querySelector('header span');
            if (badge) badge.textContent = Number(value) === 20
                ? '💥 CRÍTICO'
                : `${rule.multiHit.dice}${getPendingAdrenalineUses().strongStrike ? ' ×2' : ''}`;
            const previousNote = card?.querySelector('.character-spell-hit-critical-note');
            if (Number(value) === 20 && !previousNote) {
                const note = document.createElement('small');
                note.className = 'character-spell-hit-critical-note';
                note.textContent = 'Ignora armadura, dobra o dano antes da região e abrirá o ferimento crítico.';
                card?.appendChild(note);
            } else if (Number(value) !== 20) {
                previousNote?.remove();
            }
        }
    }

    function setCharacterSpellOverload(effectId) {
        if (!pendingCast) return;
        const valid = getArcaneOverloadOptions(pendingCast.combatant, pendingCast.ability).options
            .some(option => option.id === effectId);
        pendingCast.overloadEffect = valid ? effectId : '';
        renderCharacterSpellCastModal();
    }

    function toggleCharacterSpellAdrenaline(kind, enabled) {
        if (!pendingCast || !['strongStrike', 'doubledEffect'].includes(kind)) return;
        const next = Boolean(enabled);
        const previous = Boolean(pendingCast.adrenalineUses?.[kind]);
        pendingCast.adrenalineUses ||= { strongStrike: false, doubledEffect: false };
        pendingCast.adrenalineUses[kind] = next;
        if (getPendingAdrenalineCost() > getCharacterAdrenaline(pendingCast.combatant)) {
            pendingCast.adrenalineUses[kind] = previous;
            global.showToast?.(`${pendingCast.combatant.name} não possui Adrenalina suficiente.`);
            renderCharacterSpellCastModal();
            return;
        }
        const rule = getSpellDamageRule(pendingCast.ability, pendingCast.baseCost);
        if (kind === 'doubledEffect' && !next && rule?.multiHit) {
            pendingCast.hitCount = Math.min(rule.multiHit.maxHits, pendingCast.hitCount);
            ensurePendingMultiHitEntries(rule);
        }
        renderCharacterSpellCastModal();
    }

    function buildSpellCastHistoryMetadata(caster, target, ability, effective, energy, overloadResult, healingResult, damageResult, adrenalineSpend) {
        const participants = [caster, target]
            .filter(Boolean)
            .filter((entry, index, entries) => entries.findIndex(other => String(other.id) === String(entry.id)) === index)
            .map(entry => ({ id: entry.id, name: entry.name }));
        return {
            type: healingResult?.applied ? 'healing' : 'effect',
            source: { id: caster.id, name: caster.name },
            target: target ? { id: target.id, name: target.name } : undefined,
            participants,
            effect: { id: ability.id, type: 'ability', name: ability.name, action: 'conjurada' },
            combat: {
                action: 'spell-cast',
                abilityId: ability.id,
                baseCost: effective.baseCost,
                finalCost: effective.finalCost,
                staminaSpent: energy?.staminaSpent || 0,
                temporaryStSpent: energy?.temporaryStSpent || 0,
                runeSourceSpent: energy?.runeSourceSpent || 0,
                adrenaline: adrenalineSpend ? { ...adrenalineSpend } : null,
                overload: overloadResult || null,
                spellDamage: damageResult?.valid ? { ...damageResult } : null,
                ...(healingResult?.applied ? {
                    finalValue: healingResult.healed,
                    requestedValue: healingResult.total,
                    before: { hp: healingResult.hpBefore },
                    after: { hp: healingResult.hpAfter },
                    healing: {
                        formula: healingResult.formula,
                        base: healingResult.base,
                        attributeLabel: healingResult.attributeLabel,
                        attributeBonus: healingResult.attributeBonus,
                        dice: healingResult.dice,
                        roll: healingResult.roll,
                        multiplier: healingResult.healingMultiplier,
                        effectiveHealing: healingResult.effectiveHealing,
                        blocked: healingResult.blocked
                    }
                } : {})
            }
        };
    }

    function confirmCharacterSpellCast(random = Math.random) {
        if (!pendingCast) return null;
        const { combatant, ability, targetId, targetIds, overloadEffect } = pendingCast;
        const adrenalineUses = getPendingAdrenalineUses();
        const adrenalineCost = getPendingAdrenalineCost();
        const damageRule = getSpellDamageRule(ability, pendingCast.baseCost);
        const chosenTargetIds = damageRule
            ? [...targetIds]
            : [String(targetId)];
        if (damageRule && !chosenTargetIds.length) {
            global.showToast?.('Selecione ao menos um alvo para o dano da magia.');
            return null;
        }
        const chosenTargets = getAvailableSpellTargets().filter(entry => chosenTargetIds.includes(String(entry.id)));
        if (damageRule && !chosenTargets.length) {
            global.showToast?.('Os alvos selecionados não estão mais disponíveis no combate.');
            return null;
        }
        const target = (typeof combatants !== 'undefined' ? combatants : [])
            .find(entry => String(entry.id) === String(chosenTargetIds[0] ?? targetId)) || combatant;
        const effective = getPendingEffectiveSpell();
        const availability = getSpellEnergyAvailability(combatant, ability);
        const multiHitCount = getPendingMultiHitCount(damageRule);
        const multiHitCost = damageRule?.multiHit
            ? multiHitCount * damageRule.multiHit.extraCostPerHit
            : 0;
        const finalCastCost = effective.finalCost + multiHitCost;
        const castEffective = { ...effective, finalCost: finalCastCost };
        if (finalCastCost > availability.total) {
            global.showToast?.(`${combatant.name} não possui EST suficiente.`);
            return null;
        }
        if (adrenalineCost > getCharacterAdrenaline(combatant)) {
            global.showToast?.(`${combatant.name} não possui Adrenalina suficiente.`);
            return null;
        }

        const healingRule = getSpellHealingRule(ability);
        let healingCalculation = null;
        if (healingRule) {
            const manualInput = document.getElementById('characterSpellHealingRoll');
            const diceResult = getAbilityRollMode() === 'auto'
                ? rollDice(1, 6, random).total
                : Number(manualInput?.value);
            healingCalculation = calculateSpellHealing(combatant, ability, diceResult);
            if (!healingCalculation?.valid) {
                global.showToast?.('Informe o resultado do 1d6 de cura, entre 1 e 6.');
                manualInput?.focus();
                return null;
            }
        }

        let overloadResult = null;
        if (overloadEffect) {
            const overload = getArcaneOverloadOptions(combatant, ability);
            const rollMode = getSkillRollMode();
            const manualInput = document.getElementById('characterSpellOverloadRoll');
            const naturalRoll = rollMode === 'auto'
                ? Math.floor(random() * 20) + 1
                : Number(manualInput?.value);
            if (!Number.isInteger(naturalRoll) || naturalRoll < 1 || naturalRoll > 20) {
                global.showToast?.('Informe o resultado natural do d20 para a Sobrecarga Arcana.');
                manualInput?.focus();
                return null;
            }
            const skillResult = global.characterSheetModel?.resolveCharacterSkillTest?.({
                naturalRoll,
                skillTotal: overload.level,
                modifier: 0,
                target: 16,
                inCombat: true
            });
            const total = skillResult?.valid ? skillResult.finalResult : naturalRoll + overload.level;
            const success = skillResult?.valid ? skillResult.success : total >= 16;
            const backlash = success ? { rolls: [], total: 0 } : rollDice(getBacklashDice(ability), 6, random);
            overloadResult = {
                effect: overloadEffect,
                level: overload.level,
                naturalRoll,
                total,
                difficulty: 16,
                success,
                classification: skillResult?.classification || 'normal',
                luckDiceGained: skillResult?.luckDiceGained || 0,
                adrenalineGained: skillResult?.adrenalineGained || 0,
                backlash
            };
        }

        const spellDamage = damageRule?.multiHit
            ? calculateMultiHitSpellDamage(damageRule, ensurePendingMultiHitEntries(damageRule), overloadResult, adrenalineUses)
            : damageRule
                ? calculatePreparedSpellDamage(
                    combatant,
                    damageRule,
                    ensurePendingSpellDamageEntries(damageRule),
                    overloadResult,
                    adrenalineUses,
                    random
                )
                : null;
        if (damageRule && !spellDamage?.valid) {
            const noun = damageRule.multiHit ? 'impacto' : 'alvo';
            global.showToast?.(`Preencha corretamente o D20, dano e local do ${noun} ${(spellDamage?.invalidIndex ?? 0) + 1}.`);
            document.querySelectorAll?.('.character-spell-hit-card')?.[spellDamage?.invalidIndex ?? 0]
                ?.querySelector('input')?.focus();
            return null;
        }

        const multiHitCondition = damageRule?.multiHit
            ? {
                roll: Math.floor(random() * 100) + 1,
                chance: damageRule.multiHit.conditionChance,
                icon: damageRule.multiHit.conditionIcon,
                name: damageRule.multiHit.conditionName
            }
            : null;
        if (multiHitCondition) multiHitCondition.applied = multiHitCondition.roll <= multiHitCondition.chance;

        const appliesEffect = !healingRule && overloadResult?.success !== false && (
            Object.prototype.hasOwnProperty.call(ability, 'active')
            || global.isAutomationManagedEffect?.('ability', ability.id)
        );
        if (appliesEffect) {
            const prepared = global.prepareCharacterSpellEffect?.(target, combatant, ability.id, {
                baseCost: effective.baseCost,
                finalCost: finalCastCost,
                overload: overloadResult,
                effectMultiplier: (adrenalineUses.doubledEffect ? 2 : 1)
                    * (overloadResult?.success !== false && overloadResult?.effect === 'duration' ? 2 : 1),
                adrenalineUses: { ...adrenalineUses }
            });
            if (prepared === null) return null;
        }

        let energy = null;
        let healingResult = null;
        let adrenalineSpend = null;
        const hpBefore = Math.max(0, Number(combatant.hpCurrent) || 0);
        const selectedAdrenalineLabels = [
            adrenalineUses.strongStrike ? 'Golpe Forte' : '',
            adrenalineUses.doubledEffect ? 'Efeito Dobrado' : ''
        ].filter(Boolean);
        const label = `${combatant.name} conjurou ${ability.name}${overloadEffect ? ' com Sobrecarga Arcana' : ''}${selectedAdrenalineLabels.length ? ` e ${selectedAdrenalineLabels.join(' + ')}` : ''} — ${finalCastCost} EST`;
        const mutate = () => {
            energy = spendSpellEnergy(combatant, ability, finalCastCost);
            if (!energy) return null;

            if (adrenalineCost && overloadResult?.success !== false) {
                combatant.progression ||= {};
                const before = getCharacterAdrenaline(combatant);
                combatant.progression.adrenaline = before - adrenalineCost;
                adrenalineSpend = {
                    before,
                    spent: adrenalineCost,
                    after: combatant.progression.adrenaline,
                    strongStrike: adrenalineUses.strongStrike,
                    doubledEffect: adrenalineUses.doubledEffect
                };
            }

            if (overloadResult) {
                const rewardResult = {
                    valid: true,
                    luckDiceGained: overloadResult.luckDiceGained,
                    adrenalineGained: overloadResult.adrenalineGained
                };
                global.characterSkillTests?.applyCharacterSkillTestRewards?.(combatant, rewardResult);
                overloadResult.appliedAdrenalineGained = rewardResult.appliedAdrenalineGained ?? overloadResult.adrenalineGained;
                overloadResult.adrenalineBonusGained = rewardResult.adrenalineBonusGained || 0;
                overloadResult.adrenalineBonusSource = rewardResult.adrenalineBonusSource || '';
            }

            if (overloadResult?.success === false) {
                combatant.hpCurrent = Math.max(0, hpBefore - overloadResult.backlash.total);
                global.addCombatConsequence?.(combatant, {
                    title: 'Ação perdida · Sobrecarga Arcana',
                    description: `${ability.name} falhou na Sobrecarga. A ação foi perdida.`,
                    sourceId: `spell-overload-${ability.id}`
                });
            } else if (appliesEffect) {
                selectedId = target.id;
                global.toggleEffect?.('ability', ability.id);
            } else if (healingCalculation) {
                const targetHpBefore = Math.max(0, Number(target.hpCurrent) || 0);
                const targetHpMaximum = Math.max(targetHpBefore, Number(target.hpMax) || 0);
                const blocked = Boolean(global.isAutomationRegenerationBlocked?.(target));
                const healingMultiplier = Math.max(0, Number(global.getItemConditionHealingMultiplier?.(target)) || 1);
                const effectiveHealing = Math.floor(healingCalculation.total * healingMultiplier);
                const targetHpAfter = blocked
                    ? targetHpBefore
                    : Math.min(targetHpMaximum, targetHpBefore + effectiveHealing);
                target.hpCurrent = targetHpAfter;
                if (targetHpAfter > targetHpBefore) {
                    target.deathSaves = { success: 0, failures: 0 };
                    target.stabilized = false;
                }
                healingResult = {
                    ...healingCalculation,
                    applied: true,
                    blocked,
                    healingMultiplier,
                    effectiveHealing,
                    healed: targetHpAfter - targetHpBefore,
                    hpBefore: targetHpBefore,
                    hpAfter: targetHpAfter,
                    formula: `${healingCalculation.base} + ${healingCalculation.attributeBonus} + ${healingCalculation.roll} = ${healingCalculation.total}`
                };
            }

            if (multiHitCondition?.applied && overloadResult?.success !== false) {
                global.addAutomationCondition?.(target, multiHitCondition.icon);
            }

            global.savePlayersToStorage?.();
            if (typeof renderList === 'function') renderList(false);
            return energy;
        };
        const detail = () => {
            const lines = [
                `Magia: ${ability.name}`,
                `Alvo: ${target.name}`,
                `Custo base: ${effective.baseCost} EST`,
                ...effective.modifiers.map(modifier => modifier.label),
                ...(multiHitCost ? [`Rajadas: ${multiHitCount} × ${damageRule.multiHit.extraCostPerHit} EST = +${multiHitCost} EST`] : []),
                `Custo final: ${finalCastCost} EST`,
                [
                    energy?.runeSourceSpent ? `Fonte Rúnica ${energy.runeSourceBefore} → ${energy.runeSourceAfter}` : '',
                    energy?.temporaryStSpent ? `EST temporário ${energy.temporaryStBefore} → ${energy.temporaryStAfter}` : '',
                    `EST ${energy?.staminaBefore ?? availability.stamina} → ${energy?.staminaAfter ?? availability.stamina}`
                ].filter(Boolean).join(' · ')
            ];
            if (adrenalineSpend) {
                lines.push(`Adrenalina: ${adrenalineSpend.before} → ${adrenalineSpend.after} · ${selectedAdrenalineLabels.join(' + ')}`);
            }
            if (overloadResult) {
                lines.push(`Sobrecarga: ${overloadResult.naturalRoll} + ${overloadResult.level} = ${overloadResult.total} contra CD 16`);
                if (overloadResult.classification === 'critical') {
                    lines.push(
                        `Crítico natural · +1 Dado da Sorte · +${overloadResult.appliedAdrenalineGained ?? overloadResult.adrenalineGained} Adrenalina${overloadResult.adrenalineBonusGained ? ` (${overloadResult.adrenalineBonusSource}: +${overloadResult.adrenalineBonusGained})` : ''}`
                    );
                }
                lines.push(overloadResult.success
                    ? `Sucesso · ${overloadEffect === 'damage' ? 'dano' : overloadEffect === 'range' ? 'alcance' : 'duração'} dobrado(a)`
                    : `Falha · ${overloadResult.backlash.rolls.join('+')} = ${overloadResult.backlash.total} de dano arcano · ação perdida`);
            }
            if (healingResult) {
                lines.push(`Fórmula de cura: ${healingResult.base} + ${healingResult.attributeLabel} ${healingResult.attributeBonus} + ${healingResult.dice} ${healingResult.roll} = ${healingResult.total}`);
                if (healingResult.healingMultiplier !== 1) {
                    lines.push(`Modificador de cura: ${healingResult.total} ×${healingResult.healingMultiplier} = ${healingResult.effectiveHealing}`);
                }
                lines.push(healingResult.blocked
                    ? 'Cura efetiva: 0 PV · regeneração bloqueada'
                    : `Cura efetiva: ${healingResult.healed} PV`);
                lines.push(`PV de ${target.name}: ${healingResult.hpBefore} → ${healingResult.hpAfter}`);
            }
            if (spellDamage?.valid) {
                if (spellDamage.multiHit) {
                    lines.push(`Rajadas: ${spellDamage.hits.length} impactos de ${spellDamage.notation}`);
                    spellDamage.hits.forEach(hit => {
                        const region = ({ head: 'Cabeça', torso: 'Tronco', arm: 'Braço', leg: 'Perna' })[hit.bodyPart] || hit.bodyPart;
                        lines.push(`Impacto ${hit.index + 1}: D20 ${hit.naturalRoll} · ${hit.enteredDamage} dano${spellDamage.totalMultiplier > 1 ? ` ×${spellDamage.totalMultiplier} = ${hit.damage}` : ''} · ${region}${hit.critical ? ' · CRÍTICO' : ''}`);
                    });
                    lines.push(`Dano base somado antes de armadura e regiões: ${spellDamage.total}`);
                    if (multiHitCondition) {
                        lines.push(`${multiHitCondition.name}: d100 ${multiHitCondition.roll} contra ${multiHitCondition.chance}% · ${multiHitCondition.applied ? 'aplicado' : 'não aplicado'}`);
                    }
                } else if (spellDamage.prepared) {
                    spellDamage.entries.forEach(entry => {
                        const damageTarget = chosenTargets.find(candidate => String(candidate.id) === String(entry.targetId));
                        const region = ({ head: 'Cabeça', torso: 'Tronco', arm: 'Braço', leg: 'Perna' })[entry.bodyPart] || entry.bodyPart;
                        lines.push(`${damageTarget?.name || `Alvo ${entry.index + 1}`}: D20 ${entry.naturalRoll} · ${entry.enteredDamage} dano${spellDamage.totalMultiplier > 1 ? ` ×${spellDamage.totalMultiplier} = ${entry.damage}` : ''} · ${region}${entry.critical ? ' · CRÍTICO' : ''}`);
                    });
                    lines.push(`Dano base somado antes de armadura e regiões: ${spellDamage.total}`);
                }
                lines.push(`Alvos: ${chosenTargets.map(entry => entry.name).join(', ')}`);
            }
            return lines.join('\n');
        };
        const metadata = () => buildSpellCastHistoryMetadata(
            combatant,
            target,
            ability,
            castEffective,
            energy,
            overloadResult,
            healingResult,
            spellDamage,
            adrenalineSpend
        );
        const result = global.trackCombatAction
            ? global.trackCombatAction(label, mutate, detail, metadata)
            : mutate();

        if (!result) return null;
        closeCharacterSpellCast();
        if (spellDamage?.valid && overloadResult?.success !== false) {
            if (spellDamage.multiHit) {
                global.startSpellMultiHitSequence?.({
                    casterId: combatant.id,
                    casterName: combatant.name,
                    abilityId: ability.id,
                    abilityName: ability.name,
                    targetId: chosenTargets[0]?.id,
                    damageType: spellDamage.damageType,
                    hits: spellDamage.hits,
                    roll: spellDamage
                });
            } else if (spellDamage.prepared) {
                global.startPreparedSpellDamageSequence?.({
                    casterId: combatant.id,
                    casterName: combatant.name,
                    abilityId: ability.id,
                    abilityName: ability.name,
                    damageType: spellDamage.damageType,
                    entries: spellDamage.entries,
                    roll: spellDamage
                });
            } else {
                global.startSpellDamageSequence?.({
                    casterId: combatant.id,
                    abilityId: ability.id,
                    abilityName: ability.name,
                    damage: spellDamage.total,
                    damageType: spellDamage.damageType,
                    targetIds: chosenTargets.map(entry => entry.id),
                    roll: spellDamage
                });
            }
        }
        global.showToast?.(overloadResult?.success === false
            ? `💥 Sobrecarga falhou: ${combatant.name} sofreu ${overloadResult.backlash.total} de dano.`
            : healingResult
                ? healingResult.blocked
                    ? `🌿 ${ability.name}: a regeneração de ${target.name} está bloqueada.`
                    : `🌿 ${combatant.name} curou ${target.name} em ${healingResult.healed} PV.`
                : `✨ ${combatant.name} conjurou ${ability.name} por ${finalCastCost} EST.`);
        return { energy, adrenaline: adrenalineSpend, effective: castEffective, overload: overloadResult, target, targets: chosenTargets, healing: healingResult, damage: spellDamage };
    }

    global.renderCharacterSpellsPanel = renderCharacterSpellsPanel;
    global.toggleCharacterSpellsPanel = toggleCharacterSpellsPanel;
    global.toggleCharacterSpellCard = toggleCharacterSpellCard;
    global.setCharacterSpellFilter = setCharacterSpellFilter;
    global.filterCharacterSpells = filterCharacterSpells;
    global.openCharacterSpellCast = openCharacterSpellCast;
    global.closeCharacterSpellCast = closeCharacterSpellCast;
    global.updateCharacterSpellCastBaseCost = updateCharacterSpellCastBaseCost;
    global.updateCharacterSpellCastTarget = updateCharacterSpellCastTarget;
    global.updateCharacterSpellDamageRoll = updateCharacterSpellDamageRoll;
    global.updateCharacterSpellDamageField = updateCharacterSpellDamageField;
    global.updateCharacterSpellHitCount = updateCharacterSpellHitCount;
    global.updateCharacterSpellHitField = updateCharacterSpellHitField;
    global.setCharacterSpellOverload = setCharacterSpellOverload;
    global.toggleCharacterSpellAdrenaline = toggleCharacterSpellAdrenaline;
    global.confirmCharacterSpellCast = confirmCharacterSpellCast;
    global.characterSpellCasting = Object.freeze({
        SPELL_FILTERS,
        parseSpellCost,
        getKnownCharacterSpells,
        getSpellRole,
        getExpandedMagicLevel,
        getSpellCastingModifiers,
        calculateEffectiveSpell,
        getArcaneOverloadOptions,
        getSpellEnergyAvailability,
        spendSpellEnergy,
        getCostPreview,
        getSpellHealingRule,
        getSpellHealingAttributeBonus,
        calculateSpellHealing,
        getSpellDamageRule,
        calculateSpellDamage,
        calculatePreparedSpellDamage,
        calculateMultiHitSpellDamage,
        MULTI_HIT_SPELL_RULES,
        renderCharacterSpellsPanel,
        rollDice
    });
})(typeof window !== 'undefined' ? window : globalThis);
