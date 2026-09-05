(function initializeCharacterSheetWizard(global) {
    'use strict';

    const CHARACTER_SHEET_DRAFT_KEY = 'dnd_character_sheet_draft';
    const CHARACTER_SHEET_DRAFT_VERSION = 6;
    const WIZARD_STEPS = Object.freeze([
        Object.freeze({ id: 'identity', label: 'Identidade' }),
        Object.freeze({ id: 'race', label: 'Raça' }),
        Object.freeze({ id: 'path', label: 'Caminho' }),
        Object.freeze({ id: 'attributes', label: 'Atributos' }),
        Object.freeze({ id: 'professional-skills', label: 'Profissão' }),
        Object.freeze({ id: 'skills', label: 'Perícias' }),
        Object.freeze({ id: 'abilities', label: 'Magias' }),
        Object.freeze({ id: 'derived-values', label: 'Valores' }),
        Object.freeze({ id: 'review', label: 'Revisão' })
    ]);
    const LEVEL_UP_STEP_INDEXES = Object.freeze([0, 3, 4, 5, 6, 7, 8]);

    let characterWizardDraft = null;

    function getCharacterModel() {
        return global.characterSheetModel;
    }

    function getWizardAbilityCatalog() {
        return Array.isArray(global.predefinedAbilities) ? global.predefinedAbilities : [];
    }

    function getCharacterTemplateCatalog() {
        return Array.isArray(global.characterSheetTemplates?.list)
            ? global.characterSheetTemplates.list
            : [];
    }

    function normalizeWizardSearch(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    function escapeWizardHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function isCharacterLevelUpDraft(draft = characterWizardDraft) {
        return Boolean(
            draft?.workflow === 'level-up'
            && draft?.levelUpBase
            && Number(draft.levelUpBase.level) >= 1
        );
    }

    function getWizardStepIndexes(draft = characterWizardDraft) {
        return isCharacterLevelUpDraft(draft)
            ? LEVEL_UP_STEP_INDEXES
            : WIZARD_STEPS.map((_, index) => index);
    }

    function getWizardStepKicker(stepIndex = characterWizardDraft?.step ?? 0) {
        const indexes = getWizardStepIndexes();
        const position = Math.max(0, indexes.indexOf(stepIndex));
        return `PASSO ${position + 1} DE ${indexes.length}`;
    }

    function getLevelUpBaseInvestment(collectionName, id) {
        if (!isCharacterLevelUpDraft()) return 0;
        return Math.max(
            0,
            Number(characterWizardDraft.levelUpBase?.[collectionName]?.[id]?.invested) || 0
        );
    }

    function isPreviouslyLearnedAbility(abilityId) {
        return isCharacterLevelUpDraft()
            && (characterWizardDraft.levelUpBase?.learnedAbilityIds || []).includes(abilityId);
    }

    function cloneWizardValue(value, fallback) {
        if (value === undefined || value === null) return fallback;
        return JSON.parse(JSON.stringify(value));
    }

    function formatWizardSignedNumber(value) {
        const numeric = Number(value) || 0;
        return numeric >= 0 ? `+${numeric}` : String(numeric);
    }

    function normalizeWizardBirthDate(value) {
        const model = getCharacterModel();
        if (typeof model?.normalizeCharacterBirthDate === 'function') {
            return model.normalizeCharacterBirthDate(value);
        }
        return null;
    }

    function getWizardSkillBonusOrigins(breakdown) {
        if (!breakdown) return [];

        return [
            ['Atributo', breakdown.attributeModifier, true],
            ['Raça', breakdown.raceBonus],
            ['Profissão', breakdown.professionBonus],
            ['Subclasse', breakdown.specializationBonus],
            ['Equipamento', breakdown.equipmentBonus],
            ['Temporário', breakdown.temporaryBonus],
            ['Ajuste', breakdown.manualAdjustment]
        ]
            .filter(([, value, alwaysShow]) => alwaysShow || Number(value) !== 0)
            .map(([label, value]) => `${label} ${formatWizardSignedNumber(value)}`);
    }

    function createCharacterWizardDraft(overrides = {}) {
        const model = getCharacterModel();
        const source = overrides && typeof overrides === 'object' ? overrides : {};
        const raceId = model?.normalizeCharacterRaceId(source.raceId) || '';
        const requestedProfessionId = model?.normalizeCharacterProfessionId(source.professionId) || '';
        const professionId = raceId === 'witcher'
            ? 'witcher'
            : (model?.isCharacterProfessionAvailableForRace(requestedProfessionId, raceId)
                ? requestedProfessionId
                : '');
        const racialFoundation = model?.applyCharacterRaceBonuses(
            raceId,
            source.attributes,
            source.skills
        );
        const specialization = model?.getCharacterSpecializationDefinition(
            professionId,
            source.specializationId,
            raceId
        );
        const professionalSkills = model?.normalizeCharacterProfessionalSkillAllocations(
            source.professionalSkills,
            specialization?.id
        ) || {};
        const skills = model?.applyCharacterProfessionalSkillBonuses(
            specialization?.id,
            professionalSkills,
            racialFoundation?.skills
        ) || racialFoundation?.skills || {};
        const skillGroup = model?.getCharacterAttributeDefinition(source.skillGroup)?.id
            || model?.CHARACTER_ATTRIBUTES?.[0]?.id
            || 'strength';
        const abilityContext = {
            raceId,
            professionId,
            specializationId: specialization?.id || ''
        };
        const learnedAbilityIds = model?.normalizeCharacterLearnedAbilityIds(
            Array.isArray(source.learnedAbilityIds) ? source.learnedAbilityIds : source.abilities,
            abilityContext,
            getWizardAbilityCatalog()
        ) || [];
        const birthSource = source.birthDate ?? source.identity?.birthDate;
        const normalizedBirthDate = normalizeWizardBirthDate(birthSource);
        const hasPartialBirthDate = birthSource && typeof birthSource === 'object'
            && ['day', 'month', 'year'].some(field => Number(birthSource[field]) > 0);
        const birthDate = normalizedBirthDate || (hasPartialBirthDate ? {
            day: Math.max(0, Math.floor(Number(birthSource.day) || 0)) || null,
            month: Math.max(0, Math.floor(Number(birthSource.month) || 0)) || null,
            year: Math.max(0, Math.floor(Number(birthSource.year) || 0)) || null,
            era: String(birthSource.era || 'DR').toUpperCase() === 'AR' ? 'AR' : 'DR'
        } : null);
        const requestedStep = Math.max(0, Math.floor(Number(source.step) || 0));
        const sourceDraftVersion = Number(source.draftVersion) || CHARACTER_SHEET_DRAFT_VERSION;
        let migratedStep = requestedStep;
        if (sourceDraftVersion === 1 && migratedStep >= 4) migratedStep += 1;
        if (sourceDraftVersion <= 2 && migratedStep >= 6) migratedStep += 1;
        if (sourceDraftVersion <= 3 && migratedStep >= 7) migratedStep += 1;

        return {
            draftVersion: CHARACTER_SHEET_DRAFT_VERSION,
            step: Math.min(WIZARD_STEPS.length - 1, migratedStep),
            editingSheetId: String(source.editingSheetId || ''),
            workflow: source.workflow === 'level-up' ? 'level-up' : 'sheet',
            levelUpBase: cloneWizardValue(source.levelUpBase, null),
            name: String(source.name || '').slice(0, 80),
            level: model?.normalizeCharacterLevel(source.level) || 1,
            birthDate,
            raceId,
            professionId,
            specializationId: specialization?.id || '',
            attributes: racialFoundation?.attributes || {},
            skills,
            professionalSkills,
            learnedAbilityIds,
            abilityProfessionFilter: normalizeWizardSearch(source.abilityProfessionFilter) || 'all',
            abilityTierFilter: normalizeWizardSearch(source.abilityTierFilter) || 'all',
            abilitySearch: String(source.abilitySearch || '').slice(0, 80),
            skillGroup,
            abilities: cloneWizardValue(source.abilities, []),
            progression: cloneWizardValue(source.progression, {}),
            traits: cloneWizardValue(source.traits, []),
            automationState: cloneWizardValue(source.automationState, {}),
            updatedAt: source.updatedAt || new Date().toISOString()
        };
    }

    function isCharacterWizardDraftValid(draft) {
        return Boolean(
            draft
            && typeof draft === 'object'
            && [1, 2, 3, 4, 5, CHARACTER_SHEET_DRAFT_VERSION].includes(Number(draft.draftVersion))
        );
    }

    function readCharacterWizardDraft() {
        try {
            const parsed = JSON.parse(localStorage.getItem(CHARACTER_SHEET_DRAFT_KEY));
            return isCharacterWizardDraftValid(parsed)
                ? createCharacterWizardDraft(parsed)
                : null;
        } catch {
            return null;
        }
    }

    function persistCharacterWizardDraft() {
        if (!characterWizardDraft) return false;

        characterWizardDraft.updatedAt = new Date().toISOString();
        localStorage.setItem(CHARACTER_SHEET_DRAFT_KEY, JSON.stringify(characterWizardDraft));
        return true;
    }

    function clearCharacterWizardDraft() {
        characterWizardDraft = null;
        localStorage.removeItem(CHARACTER_SHEET_DRAFT_KEY);
    }

    function hasCharacterWizardProgress(draft) {
        const hasAttributePoints = Object.values(draft?.attributes || {})
            .some(entry => Number(entry?.invested) > 0);
        const hasSkillPoints = Object.values(draft?.skills || {})
            .some(entry => Number(entry?.invested) > 0);
        const hasProfessionalSkillPoints = Object.values(draft?.professionalSkills || {})
            .some(entry => Number(entry?.invested) > 0);
        const hasLearnedAbilities = Array.isArray(draft?.learnedAbilityIds)
            && draft.learnedAbilityIds.length > 0;

        return Boolean(
            draft
            && (
                draft.name
                || draft.raceId
                || draft.professionId
                || draft.specializationId
                || draft.birthDate
                || draft.step > 0
                || hasAttributePoints
                || hasSkillPoints
                || hasProfessionalSkillPoints
                || hasLearnedAbilities
            )
        );
    }

    function getWizardDialog() {
        return document.querySelector('#sessionToolsModal .session-tools');
    }

    function getWizardRace() {
        return getCharacterModel()?.getCharacterRaceDefinition(characterWizardDraft?.raceId) || null;
    }

    function getWizardProfession() {
        return getCharacterModel()?.getCharacterProfessionDefinition(characterWizardDraft?.professionId) || null;
    }

    function getWizardSpecialization() {
        return getCharacterModel()?.getCharacterSpecializationDefinition(
            characterWizardDraft?.professionId,
            characterWizardDraft?.specializationId,
            characterWizardDraft?.raceId
        ) || null;
    }

    function getWizardAllocationSummary() {
        return getCharacterModel()?.getCharacterAllocationSummary(
            characterWizardDraft?.level,
            characterWizardDraft?.attributes,
            characterWizardDraft?.skills,
            {
                professionalSkills: characterWizardDraft?.professionalSkills,
                specializationId: characterWizardDraft?.specializationId
            }
        ) || null;
    }

    function getWizardAbilityContext() {
        return {
            raceId: characterWizardDraft?.raceId,
            professionId: characterWizardDraft?.professionId,
            specializationId: characterWizardDraft?.specializationId
        };
    }

    function getWizardTrainingSummary() {
        return getCharacterModel()?.getCharacterTrainingSummary(
            characterWizardDraft?.level,
            characterWizardDraft?.learnedAbilityIds,
            getWizardAbilityContext(),
            getWizardAbilityCatalog()
        ) || null;
    }

    function validateCharacterWizardStep(step = characterWizardDraft?.step ?? 0, { notify = false } = {}) {
        const draft = characterWizardDraft;
        let message = '';

        if (!draft) message = 'Inicie uma ficha completa.';
        else if (
            step === 0
            && isCharacterLevelUpDraft(draft)
            && draft.level <= Number(draft.levelUpBase.level)
        ) message = 'O novo nível deve ser maior que o nível atual.';
        else if (step === 0 && !draft.name.trim()) message = 'Informe o nome do personagem.';
        else if (
            step === 0
            && draft.birthDate
            && !normalizeWizardBirthDate(draft.birthDate)
        ) message = 'Informe uma data de nascimento válida ou deixe todos os campos vazios.';
        else if (step === 1 && !getWizardRace()) message = 'Escolha uma raça.';
        else if (
            step === 2
            && draft.raceId !== 'witcher'
            && (
                !getWizardProfession()
                || !getCharacterModel()?.isCharacterProfessionAvailableForRace(
                    draft.professionId,
                    draft.raceId
                )
            )
        ) message = 'Escolha uma profissão disponível para esta raça.';
        else if (step === 2 && !getWizardSpecialization()) {
            message = draft.raceId === 'witcher'
                ? 'Escolha uma escola de bruxo.'
                : 'Escolha uma especialização.';
        }
        else if (step === 3 && getWizardAllocationSummary()?.attributePointsRemaining < 0) {
            message = 'Os atributos ultrapassam o orçamento disponível para este nível.';
        }
        else if ([4, 5].includes(step) && getWizardAllocationSummary()?.skillPointsRemaining < 0) {
            message = 'As perícias ultrapassam o orçamento disponível para este nível.';
        }
        else if (step === 6 && getWizardTrainingSummary()?.trainingPointsRemaining < 0) {
            message = 'As magias ultrapassam os pontos de treino disponíveis para este nível.';
        }

        if (message && notify) global.showToast?.(message);
        return !message;
    }

    function validateCompleteCharacterWizard({ notify = false } = {}) {
        for (const step of getWizardStepIndexes().slice(0, -1)) {
            if (!validateCharacterWizardStep(step, { notify })) return false;
        }

        return true;
    }

    function renderWizardProgress() {
        const indexes = getWizardStepIndexes();
        const currentPosition = indexes.indexOf(characterWizardDraft.step);

        return `
            <ol class="character-wizard-progress${isCharacterLevelUpDraft() ? ' is-level-up' : ''}" aria-label="Progresso ${isCharacterLevelUpDraft() ? 'da evolução' : 'da criação'}">
                ${indexes.map((stepIndex, position) => `
                    <li class="${position === currentPosition ? 'is-current' : ''} ${position < currentPosition ? 'is-complete' : ''}">
                        <span>${position + 1}</span>
                        <small>${escapeWizardHtml(WIZARD_STEPS[stepIndex].label)}</small>
                    </li>
                `).join('')}
            </ol>
        `;
    }

    function renderIdentityStep() {
        if (isCharacterLevelUpDraft()) return renderLevelUpIdentityStep();

        const birthDate = characterWizardDraft.birthDate || {};
        const age = global.campaignClock?.getCharacterAge?.(birthDate);
        const monthOptions = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ].map((month, index) => `<option value="${index + 1}" ${Number(birthDate.month) === index + 1 ? 'selected' : ''}>${month}</option>`).join('');

        return `
            <section class="character-wizard-step" aria-labelledby="characterWizardStepTitle">
                <div class="character-wizard-step-copy">
                    <span class="character-wizard-kicker">${getWizardStepKicker(0)}</span>
                    <h3 id="characterWizardStepTitle">Identidade</h3>
                    <p>Defina o nome e o nível inicial. Os pontos disponíveis acompanham o nível escolhido.</p>
                </div>
                <div class="character-wizard-fields">
                    <label>Nome do personagem
                        <input id="characterWizardName" class="session-input" maxlength="80" autocomplete="off" value="${escapeWizardHtml(characterWizardDraft.name)}" oninput="updateCharacterWizardField('name', this.value)">
                    </label>
                    <label>Nível
                        <input id="characterWizardLevel" class="session-input" type="number" min="1" step="1" inputmode="numeric" value="${characterWizardDraft.level}" onchange="updateCharacterWizardField('level', this.value)">
                    </label>
                </div>
                <div class="character-birth-section">
                    <div class="character-birth-heading">
                        <div><strong>Data de nascimento</strong><small>O dia e o mês criam um aniversário anual no calendário da campanha.</small></div>
                        ${Number.isFinite(age) ? `<span>${age} anos</span>` : ''}
                    </div>
                    <div class="character-birth-fields">
                        <label>Dia<input class="session-input" type="number" min="1" max="31" inputmode="numeric" value="${birthDate.day || ''}" oninput="updateCharacterWizardBirthField('day', this.value)"></label>
                        <label>Mês<select class="session-input" onchange="updateCharacterWizardBirthField('month', this.value)"><option value="">Selecione</option>${monthOptions}</select></label>
                        <label>Ano <small>(opcional)</small><input class="session-input" type="number" min="1" inputmode="numeric" value="${birthDate.year || ''}" oninput="updateCharacterWizardBirthField('year', this.value)"></label>
                        <label>Era<select class="session-input" onchange="updateCharacterWizardBirthField('era', this.value)"><option value="DR" ${birthDate.era !== 'AR' ? 'selected' : ''}>DR</option><option value="AR" ${birthDate.era === 'AR' ? 'selected' : ''}>AR</option></select></label>
                    </div>
                </div>
                ${renderCharacterBudgetPreview()}
            </section>
        `;
    }

    function renderLevelUpIdentityStep() {
        const model = getCharacterModel();
        const baseLevel = Number(characterWizardDraft.levelUpBase.level) || 1;
        const currentBudgets = model?.getCharacterBudgets(baseLevel);
        const nextBudgets = model?.getCharacterBudgets(characterWizardDraft.level);
        const baseAllocation = model?.getCharacterAllocationSummary(
            baseLevel,
            characterWizardDraft.levelUpBase.attributes,
            characterWizardDraft.levelUpBase.skills,
            {
                professionalSkills: characterWizardDraft.levelUpBase.professionalSkills,
                specializationId: characterWizardDraft.specializationId
            }
        );
        const baseTraining = model?.getCharacterTrainingSummary(
            baseLevel,
            characterWizardDraft.levelUpBase.learnedAbilityIds,
            getWizardAbilityContext(),
            getWizardAbilityCatalog()
        );
        const gainedLevels = Math.max(0, characterWizardDraft.level - baseLevel);

        return `
            <section class="character-wizard-step character-level-up-step" aria-labelledby="characterWizardStepTitle">
                <div class="character-wizard-step-copy">
                    <span class="character-wizard-kicker">${getWizardStepKicker(0)}</span>
                    <h3 id="characterWizardStepTitle">Escolha o novo nível</h3>
                    <p>A raça, a profissão e as escolhas anteriores serão preservadas. Você poderá aplicar apenas os pontos liberados pela evolução.</p>
                </div>
                <div class="character-level-up-hero">
                    <div>
                        <span>PERSONAGEM</span>
                        <strong>${escapeWizardHtml(characterWizardDraft.name)}</strong>
                        <small>Nível atual ${baseLevel}</small>
                    </div>
                    <label>Novo nível
                        <input id="characterWizardLevel" class="session-input" type="number" min="${baseLevel + 1}" step="1" inputmode="numeric" value="${characterWizardDraft.level}" onchange="updateCharacterWizardField('level', this.value)">
                    </label>
                </div>
                <div class="character-level-up-gains" aria-label="Recursos liberados por ${gainedLevels} níveis">
                    <article><span>Atributos ganhos</span><strong>+${Math.max(0, (nextBudgets?.attributePoints || 0) - (currentBudgets?.attributePoints || 0))}</strong><small>${Math.max(0, (nextBudgets?.attributePoints || 0) - (baseAllocation?.attributePointsSpent || 0))} disponíveis no total</small></article>
                    <article><span>Perícias ganhas</span><strong>+${Math.max(0, (nextBudgets?.skillPoints || 0) - (currentBudgets?.skillPoints || 0))}</strong><small>${Math.max(0, (nextBudgets?.skillPoints || 0) - (baseAllocation?.skillPointsSpent || 0))} disponíveis no total</small></article>
                    <article><span>Treino ganho</span><strong>+${Math.max(0, (nextBudgets?.trainingPoints || 0) - (currentBudgets?.trainingPoints || 0))}</strong><small>${Math.max(0, (nextBudgets?.trainingPoints || 0) - (baseTraining?.trainingPointsSpent || 0))} disponíveis no total</small></article>
                </div>
                <div class="character-wizard-stage-note">
                    <strong>${gainedLevels} ${gainedLevels === 1 ? 'nível selecionado' : 'níveis selecionados'}</strong>
                    <span>Pontos que ficaram sem uso em níveis anteriores também permanecem disponíveis.</span>
                </div>
                ${characterWizardDraft.levelUpBase.canUndoLastEvolution ? `
                    <button type="button" class="character-level-up-undo" onclick="undoLastCharacterLevelUp('${escapeWizardHtml(characterWizardDraft.editingSheetId)}')">↶ Desfazer a última evolução confirmada</button>
                ` : ''}
            </section>
        `;
    }

    function renderCharacterBudgetPreview() {
        const budgets = getCharacterModel()?.getCharacterBudgets(characterWizardDraft.level);
        if (!budgets) return '';

        return `
            <div class="character-budget-preview" aria-label="Pontos disponíveis no nível ${budgets.level}">
                <div><span>Atributos</span><strong>${budgets.attributePoints}</strong></div>
                <div><span>Perícias</span><strong>${budgets.skillPoints}</strong></div>
                <div><span>Treino</span><strong>${budgets.trainingPoints}</strong></div>
            </div>
        `;
    }

    function renderRaceStep() {
        const model = getCharacterModel();
        const races = model?.CHARACTER_RACES || [];
        const selectedRace = getWizardRace();

        return `
            <section class="character-wizard-step" aria-labelledby="characterWizardStepTitle">
                <div class="character-wizard-step-copy">
                    <span class="character-wizard-kicker">${getWizardStepKicker(1)}</span>
                    <h3 id="characterWizardStepTitle">Raça</h3>
                    <p>A raça aplicará bônus e características próprias nas próximas etapas.</p>
                </div>
                <div class="character-choice-grid character-race-grid">
                    ${races.map(race => `
                        <button type="button" class="character-choice-card ${race.id === characterWizardDraft.raceId ? 'is-selected' : ''}" onclick="selectCharacterWizardRace('${race.id}')" aria-pressed="${race.id === characterWizardDraft.raceId}">
                            <strong>${escapeWizardHtml(race.name)}</strong>
                            <small>${escapeWizardHtml(race.summary || race.monsterCategory)}</small>
                            ${race.development === 'in_progress' ? '<span>Em desenvolvimento</span>' : ''}
                        </button>
                    `).join('')}
                </div>
                ${selectedRace ? `
                    <div class="character-race-detail ${selectedRace.development === 'in_progress' ? 'is-development' : ''}">
                        <div>
                            <strong>${escapeWizardHtml(selectedRace.name)}</strong>
                            <small>${escapeWizardHtml(selectedRace.summary || '')}</small>
                        </div>
                        <ul>
                            ${(selectedRace.traits || []).map(trait => `
                                <li><b>${escapeWizardHtml(trait.name)}:</b> ${escapeWizardHtml(trait.description)}</li>
                            `).join('')}
                        </ul>
                        ${(selectedRace.blockedProfessionIds || []).length ? `
                            <p>Indisponíveis: ${selectedRace.blockedProfessionIds.map(id => escapeWizardHtml(model.getCharacterProfessionDefinition(id)?.name || id)).join(' e ')}.</p>
                        ` : ''}
                    </div>
                ` : ''}
            </section>
        `;
    }

    function renderPathStep() {
        const model = getCharacterModel();
        const isWitcher = characterWizardDraft.raceId === 'witcher';
        const profession = getWizardProfession();
        const specializations = model?.getCharacterSpecializations(
            characterWizardDraft.professionId,
            characterWizardDraft.raceId
        ) || [];
        const availableProfessions = model?.getAvailableCharacterProfessions(
            characterWizardDraft.raceId
        ) || [];

        return `
            <section class="character-wizard-step" aria-labelledby="characterWizardStepTitle">
                <div class="character-wizard-step-copy">
                    <span class="character-wizard-kicker">${getWizardStepKicker(2)}</span>
                    <h3 id="characterWizardStepTitle">${isWitcher ? 'Escola de bruxo' : 'Profissão e especialização'}</h3>
                    <p>${isWitcher
                        ? 'A escola substitui a profissão comum e define a árvore profissional do Witcher.'
                        : 'A profissão define quais caminhos e habilidades profissionais estarão disponíveis.'}</p>
                </div>
                ${isWitcher ? '' : `
                    <label class="character-wizard-select-label">Profissão
                        <select class="session-input" onchange="selectCharacterWizardProfession(this.value)">
                            <option value="">Escolha uma profissão</option>
                            ${availableProfessions.map(entry => `
                                <option value="${entry.id}"${entry.id === characterWizardDraft.professionId ? ' selected' : ''}>${escapeWizardHtml(entry.name)}</option>
                            `).join('')}
                        </select>
                    </label>
                `}
                ${(isWitcher || profession) ? `
                    <div class="character-choice-grid character-path-grid">
                        ${specializations.map(specialization => `
                            <button type="button" class="character-choice-card ${specialization.id === characterWizardDraft.specializationId ? 'is-selected' : ''}" onclick="selectCharacterWizardSpecialization('${specialization.id}')" aria-pressed="${specialization.id === characterWizardDraft.specializationId}">
                                <strong>${escapeWizardHtml(specialization.name)}</strong>
                                <small>${isWitcher ? 'Escola' : escapeWizardHtml(profession?.name || 'Caminho')}</small>
                            </button>
                        `).join('')}
                    </div>
                ` : '<div class="character-wizard-empty">Escolha uma profissão para visualizar seus caminhos.</div>'}
            </section>
        `;
    }

    function renderAllocationBalance(label, spent, budget) {
        const remaining = budget - spent;
        const balanceClass = remaining < 0 ? 'is-over-budget' : (remaining === 0 ? 'is-complete' : '');

        return `
            <div class="character-allocation-balance ${balanceClass}" role="status">
                <span>${escapeWizardHtml(label)}</span>
                <div><strong>${spent}</strong><small>usados</small></div>
                <div><strong>${Math.max(0, remaining)}</strong><small>restantes</small></div>
                ${remaining < 0 ? `<em>Excesso: ${Math.abs(remaining)}</em>` : ''}
            </div>
        `;
    }

    function renderAttributesStep() {
        const model = getCharacterModel();
        const summary = getWizardAllocationSummary();
        const canIncrease = summary?.attributePointsRemaining > 0;

        return `
            <section class="character-wizard-step" aria-labelledby="characterWizardStepTitle">
                <div class="character-wizard-step-copy">
                    <span class="character-wizard-kicker">${getWizardStepKicker(3)}</span>
                    <h3 id="characterWizardStepTitle">Distribua os atributos</h3>
                    <p>Todos começam em ${model?.CHARACTER_ATTRIBUTE_BASE_VALUE || 10}. Os pontos investidos são somados ao valor base e não possuem limite máximo.</p>
                </div>
                ${renderAllocationBalance(
                    'Pontos de atributo',
                    summary?.attributePointsSpent || 0,
                    summary?.attributePoints || 0
                )}
                <div class="character-attribute-grid">
                    ${(model?.CHARACTER_ATTRIBUTES || []).map(attribute => {
                        const invested = Number(characterWizardDraft.attributes?.[attribute.id]?.invested) || 0;
                        const baseInvested = getLevelUpBaseInvestment('attributes', attribute.id);
                        const raceBonus = Number(characterWizardDraft.attributes?.[attribute.id]?.raceBonus) || 0;
                        const total = model.getCharacterAttributeTotal(attribute.id, characterWizardDraft.attributes);
                        const modifier = model.getCharacterAttributeModifier(attribute.id, characterWizardDraft.attributes);

                        return `
                            <article class="character-allocation-card">
                                <div>
                                    <span>${escapeWizardHtml(attribute.abbreviation)}</span>
                                    <strong>${escapeWizardHtml(attribute.name)}</strong>
                                    <small>Base ${model.CHARACTER_ATTRIBUTE_BASE_VALUE} + ${invested}${raceBonus ? ` · racial ${raceBonus > 0 ? '+' : ''}${raceBonus}` : ''} · bônus +${modifier}${isCharacterLevelUpDraft() ? ` · mínimo preservado ${baseInvested}` : ''}</small>
                                </div>
                                <div class="character-allocation-control">
                                    <button type="button" onclick="adjustCharacterWizardAttribute('${attribute.id}', -1)" ${invested <= baseInvested ? 'disabled' : ''} aria-label="Remover ponto de ${escapeWizardHtml(attribute.name)}">−</button>
                                    <output aria-label="Valor total de ${escapeWizardHtml(attribute.name)}">${total}</output>
                                    <button type="button" onclick="adjustCharacterWizardAttribute('${attribute.id}', 1)" ${canIncrease ? '' : 'disabled'} aria-label="Adicionar ponto em ${escapeWizardHtml(attribute.name)}">+</button>
                                </div>
                            </article>
                        `;
                    }).join('')}
                </div>
                <p class="character-allocation-hint">Você pode avançar com pontos restantes. O assistente apenas impede gastos acima do orçamento.</p>
            </section>
        `;
    }

    function renderProfessionalSkillsStep() {
        const model = getCharacterModel();
        const specialization = getWizardSpecialization();
        const skills = model?.getCharacterProfessionalSkills(specialization?.id) || [];
        const summary = getWizardAllocationSummary();

        return `
            <section class="character-wizard-step" aria-labelledby="characterWizardStepTitle">
                <div class="character-wizard-step-copy">
                    <span class="character-wizard-kicker">${getWizardStepKicker(4)}</span>
                    <h3 id="characterWizardStepTitle">Habilidades profissionais</h3>
                    <p>Distribua primeiro os pontos da árvore ${escapeWizardHtml(specialization?.name || '')}. O saldo restante será usado nas perícias gerais.</p>
                </div>
                ${renderAllocationBalance(
                    'Saldo compartilhado de perícias',
                    summary?.skillPointsSpent || 0,
                    summary?.skillPoints || 0
                )}
                <div class="character-professional-heading">
                    <div>
                        <span>ÁRVORE PROFISSIONAL</span>
                        <strong>${escapeWizardHtml(specialization?.name || 'Não definida')}</strong>
                    </div>
                    <small>${skills.length} habilidades · máximo 4 pontos investidos em cada</small>
                </div>
                <div class="character-skill-list character-professional-skill-list">
                    ${skills.map(skill => {
                        const invested = Number(characterWizardDraft.professionalSkills?.[skill.id]?.invested) || 0;
                        const baseInvested = getLevelUpBaseInvestment('professionalSkills', skill.id);
                        const canIncrease = invested < (skill.maxInvestment || 4)
                            && (summary?.skillPointsRemaining || 0) >= (skill.pointCost || 1);

                        return `
                            <article class="character-skill-row character-professional-skill-row">
                                <div class="character-wizard-professional-copy">
                                    <strong>${escapeWizardHtml(skill.name)}${skill.automation?.status === 'implemented'
                                        ? ' <span class="character-professional-automation-badge">AUTOMÁTICO</span>'
                                        : (skill.automation?.mode === 'reference'
                                            ? ' <span class="character-professional-automation-badge is-reference">REFERÊNCIA</span>'
                                            : '')}</strong>
                                    <p class="character-professional-description">${escapeWizardHtml(skill.description)}</p>
                                    <small class="character-professional-level-note">Nível profissional · máximo ${skill.maxInvestment || 4}${isCharacterLevelUpDraft() ? ` · preservado ${baseInvested}` : ''}</small>
                                </div>
                                <div class="character-allocation-control character-skill-control">
                                    <button type="button" onclick="adjustCharacterWizardProfessionalSkill('${skill.id}', -1)" ${invested <= baseInvested ? 'disabled' : ''} aria-label="Remover nível de ${escapeWizardHtml(skill.name)}">−</button>
                                    <output aria-label="Nível investido em ${escapeWizardHtml(skill.name)}">${invested}</output>
                                    <button type="button" onclick="adjustCharacterWizardProfessionalSkill('${skill.id}', 1)" ${canIncrease ? '' : 'disabled'} aria-label="Adicionar nível em ${escapeWizardHtml(skill.name)}">+</button>
                                </div>
                            </article>
                        `;
                    }).join('')}
                </div>
                <p class="character-allocation-hint">Esses níveis usam o mesmo orçamento da próxima etapa. Habilidades profissionais não somam bônus de atributo; os bônus que elas concedem são aplicados apenas às perícias gerais indicadas.</p>
            </section>
        `;
    }

    function renderSkillsStep() {
        const model = getCharacterModel();
        const summary = getWizardAllocationSummary();
        const activeAttribute = model?.getCharacterAttributeDefinition(characterWizardDraft.skillGroup)
            || model?.CHARACTER_ATTRIBUTES?.[0];
        const skills = model?.getCharacterSkillsByAttribute(activeAttribute?.id) || [];
        const activeAttributeModifier = model?.getCharacterAttributeModifier(
            activeAttribute?.id,
            characterWizardDraft.attributes
        ) || 0;

        return `
            <section class="character-wizard-step" aria-labelledby="characterWizardStepTitle">
                <div class="character-wizard-step-copy">
                    <span class="character-wizard-kicker">${getWizardStepKicker(5)}</span>
                    <h3 id="characterWizardStepTitle">Distribua as perícias</h3>
                    <p>Perícias comuns e profissionais compartilham o mesmo orçamento. Nesta etapa, cada perícia comum aceita até 4 níveis investidos.</p>
                </div>
                ${renderAllocationBalance(
                    'Pontos de perícia',
                    summary?.skillPointsSpent || 0,
                    summary?.skillPoints || 0
                )}
                <label class="character-wizard-select-label character-skill-filter">Grupo de perícias
                    <select class="session-input" onchange="selectCharacterWizardSkillGroup(this.value)">
                        ${(model?.CHARACTER_ATTRIBUTES || []).map(attribute => `
                            <option value="${attribute.id}"${attribute.id === activeAttribute?.id ? ' selected' : ''}>${escapeWizardHtml(attribute.name)} · ${model.getCharacterSkillsByAttribute(attribute.id).length}</option>
                        `).join('')}
                    </select>
                </label>
                <div class="character-skill-group-bonus" aria-live="polite">
                    <strong>${formatWizardSignedNumber(activeAttributeModifier)}</strong>
                    <span>Bônus de ${escapeWizardHtml(activeAttribute?.name || 'atributo')} aplicado a todas as ${skills.length} perícias deste grupo.</span>
                </div>
                <div class="character-skill-list">
                    ${skills.map(skill => {
                        const invested = Number(characterWizardDraft.skills?.[skill.id]?.invested) || 0;
                        const baseInvested = getLevelUpBaseInvestment('skills', skill.id);
                        const breakdown = model.getCharacterSkillBreakdown(
                            skill.id,
                            characterWizardDraft.skills,
                            characterWizardDraft.attributes
                        );
                        const bonusOrigins = getWizardSkillBonusOrigins(breakdown);
                        const canIncrease = invested < (model?.CHARACTER_SKILL_INVESTMENT_CAP || 4)
                            && (summary?.skillPointsRemaining || 0) >= skill.pointCost;

                        return `
                            <article class="character-skill-row">
                                <div class="character-wizard-skill-copy">
                                    <strong>${escapeWizardHtml(skill.name)}</strong>
                                    <small class="character-skill-cost">${escapeWizardHtml(activeAttribute?.abbreviation || '')}${skill.pointCost === 2 ? ' · custa 2 pontos por nível' : ' · custa 1 ponto por nível'}${isCharacterLevelUpDraft() ? ` · preservado ${baseInvested}` : ''}</small>
                                    <small class="character-skill-math">
                                        <span>${bonusOrigins.join(' · ')}</span>
                                        <b>Bônus ${formatWizardSignedNumber(breakdown?.bonusTotal)}</b>
                                        <b>Total ${breakdown?.total ?? 0}</b>
                                    </small>
                                </div>
                                <div class="character-allocation-control character-skill-control">
                                    <button type="button" onclick="adjustCharacterWizardSkill('${skill.id}', -1)" ${invested <= baseInvested ? 'disabled' : ''} aria-label="Remover nível de ${escapeWizardHtml(skill.name)}">−</button>
                                    <output aria-label="Nível investido em ${escapeWizardHtml(skill.name)}">${invested}</output>
                                    <button type="button" onclick="adjustCharacterWizardSkill('${skill.id}', 1)" ${canIncrease ? '' : 'disabled'} aria-label="Adicionar nível em ${escapeWizardHtml(skill.name)}">+</button>
                                </div>
                            </article>
                        `;
                    }).join('')}
                </div>
                <p class="character-allocation-hint">O número entre os botões é o investimento. Bônus de atributo, raça, profissão e equipamentos são mostrados separadamente e não consomem pontos.</p>
            </section>
        `;
    }

    function renderAbilitiesStep() {
        const model = getCharacterModel();
        const catalog = getWizardAbilityCatalog();
        const context = getWizardAbilityContext();
        const access = model?.getCharacterAbilityAccessProfile(context);
        const options = model?.getCharacterAbilityLearningOptions(context, catalog) || [];
        const training = getWizardTrainingSummary();
        const learnedIds = new Set(training?.learnedAbilityIds || []);
        const automaticIds = new Set(training?.automaticAbilityIds || []);
        const professionFilters = [...new Map(options.map(ability => [
            model.normalizeCharacterAbilityProfession(ability.profession),
            ability.profession
        ])).entries()];
        const selectedFilter = professionFilters.some(([id]) => id === characterWizardDraft.abilityProfessionFilter)
            ? characterWizardDraft.abilityProfessionFilter
            : 'all';
        const professionFilteredOptions = selectedFilter === 'all'
            ? options
            : options.filter(ability => (
                model.normalizeCharacterAbilityProfession(ability.profession) === selectedFilter
            ));
        const tierFilters = [...new Map(professionFilteredOptions.map(ability => [
            normalizeWizardSearch(ability.category || 'Sem categoria'),
            ability.category || 'Sem categoria'
        ])).entries()];
        const selectedTier = tierFilters.some(([id]) => id === characterWizardDraft.abilityTierFilter)
            ? characterWizardDraft.abilityTierFilter
            : 'all';
        const filteredOptions = selectedTier === 'all'
            ? professionFilteredOptions
            : professionFilteredOptions.filter(ability => (
                normalizeWizardSearch(ability.category || 'Sem categoria') === selectedTier
            ));
        const normalizedSearch = normalizeWizardSearch(characterWizardDraft.abilitySearch);
        const visibleCount = filteredOptions.filter(ability => normalizeWizardSearch([
            ability.name,
            ability.profession,
            ability.category,
            ability.type,
            ability.shortDescription,
            ability.description
        ].join(' ')).includes(normalizedSearch)).length;

        return `
            <section class="character-wizard-step" aria-labelledby="characterWizardStepTitle">
                <div class="character-wizard-step-copy">
                    <span class="character-wizard-kicker">${getWizardStepKicker(6)}</span>
                    <h3 id="characterWizardStepTitle">Aprendizado de magias</h3>
                    <p>${access?.isMagical
                        ? 'Use pontos de treino para aprender habilidades permitidas pela profissão. Rituais e hexes aparecem somente para caminhos mágicos.'
                        : 'Esta profissão não aprende magias durante a criação. Os pontos de treino permanecem disponíveis para uma futura progressão.'}</p>
                </div>
                ${renderAllocationBalance(
                    'Pontos de treino',
                    training?.trainingPointsSpent || 0,
                    training?.trainingPoints || 0
                )}
                ${options.length ? `
                    <div class="character-ability-toolbar">
                        <label>Buscar magia
                            <input class="session-input" type="search" maxlength="80" value="${escapeWizardHtml(characterWizardDraft.abilitySearch)}" placeholder="Nome, elemento ou efeito..." oninput="filterCharacterWizardAbilities(this.value)">
                        </label>
                        <label>Origem da habilidade
                            <select class="session-input" onchange="selectCharacterWizardAbilityProfession(this.value)">
                                <option value="all"${selectedFilter === 'all' ? ' selected' : ''}>Todas</option>
                                ${professionFilters.map(([id, name]) => `
                                    <option value="${escapeWizardHtml(id)}"${selectedFilter === id ? ' selected' : ''}>${escapeWizardHtml(name)}</option>
                                `).join('')}
                            </select>
                        </label>
                        <label>Grau / categoria
                            <select class="session-input" onchange="selectCharacterWizardAbilityTier(this.value)">
                                <option value="all"${selectedTier === 'all' ? ' selected' : ''}>Todos</option>
                                ${tierFilters.map(([id, name]) => `
                                    <option value="${escapeWizardHtml(id)}"${selectedTier === id ? ' selected' : ''}>${escapeWizardHtml(name)}</option>
                                `).join('')}
                            </select>
                        </label>
                    </div>
                    <div class="character-ability-result-count" aria-live="polite">
                        <span id="characterAbilityVisibleCount">${visibleCount}</span> de ${filteredOptions.length} habilidades exibidas
                    </div>
                    <div class="character-ability-list">
                        ${filteredOptions.map(ability => {
                            const isAutomatic = automaticIds.has(ability.id);
                            const isLearned = learnedIds.has(ability.id);
                            const wasPreviouslyLearned = isPreviouslyLearnedAbility(ability.id);
                            const searchText = normalizeWizardSearch([
                                ability.name,
                                ability.profession,
                                ability.category,
                                ability.type,
                                ability.shortDescription,
                                ability.description
                            ].join(' '));
                            const isVisible = searchText.includes(normalizedSearch);
                            const canLearn = isLearned
                                || (training?.trainingPointsRemaining || 0) >= ability.unlockCost;

                            return `
                                <article class="character-ability-card ${isLearned || isAutomatic ? 'is-selected' : ''}" data-ability-search="${escapeWizardHtml(searchText)}"${isVisible ? '' : ' hidden'}>
                                    <div class="character-ability-card-heading">
                                        <span class="character-ability-icon" aria-hidden="true">${escapeWizardHtml(ability.icon || '✨')}</span>
                                        <div>
                                            <strong>${escapeWizardHtml(ability.name)}</strong>
                                            <small>${escapeWizardHtml([ability.profession, ability.category, ability.type].filter(Boolean).join(' · '))}</small>
                                        </div>
                                        <b>${isAutomatic ? 'Automática' : `${ability.unlockCost} PT`}</b>
                                    </div>
                                    <p>${escapeWizardHtml(ability.shortDescription || ability.description || 'Sem descrição resumida.')}</p>
                                    ${ability.description && ability.description !== ability.shortDescription ? `
                                        <details>
                                            <summary>Ver descrição completa</summary>
                                            <p>${escapeWizardHtml(ability.description)}</p>
                                        </details>
                                    ` : ''}
                                    <button type="button" class="character-ability-toggle ${isLearned && !wasPreviouslyLearned ? 'is-remove' : ''}" onclick="toggleCharacterWizardAbility('${escapeWizardHtml(ability.id)}')" ${isAutomatic || wasPreviouslyLearned || !canLearn ? 'disabled' : ''}>
                                        ${isAutomatic
                                            ? 'Concedida pela raça Witcher'
                                            : (wasPreviouslyLearned
                                                ? 'Já conhecida · preservada'
                                                : (isLearned ? 'Remover novo aprendizado' : `Aprender · ${ability.unlockCost} PT`))}
                                    </button>
                                </article>
                            `;
                        }).join('')}
                    </div>
                ` : `
                    <div class="character-wizard-empty character-ability-empty">
                        <strong>Nenhuma magia disponível para este caminho.</strong>
                        <span>A ficha pode ser concluída normalmente e os pontos de treino continuarão registrados.</span>
                    </div>
                `}
                <p class="character-allocation-hint">Magias já aprendidas não cobram pontos novamente. Habilidades de Bruxo são concedidas automaticamente e não consomem pontos de treino.</p>
            </section>
        `;
    }

    function renderDerivedValuesStep() {
        const model = getCharacterModel();
        const derived = model?.calculateCharacterDerivedValues(characterWizardDraft, {
            equippedWeight: isCharacterLevelUpDraft()
                ? Math.max(0, Number(characterWizardDraft.levelUpBase.equippedWeight) || 0)
                : 0
        });
        const breakdown = derived?.breakdown || {};
        const stFormulaLabels = {
            witcher: 'Witcher',
            mage: 'Mago',
            cleric: 'Clérigo',
            druid: 'Druida',
            physical: 'Reserva física'
        };

        return `
            <section class="character-wizard-step" aria-labelledby="characterWizardStepTitle">
                <div class="character-wizard-step-copy">
                    <span class="character-wizard-kicker">${getWizardStepKicker(7)}</span>
                    <h3 id="characterWizardStepTitle">Valores derivados</h3>
                    <p>HP, EST, carga e movimento foram calculados com os atributos, perícias, raça, profissão e nível escolhidos.</p>
                </div>
                <div class="character-derived-grid">
                    <article class="character-derived-card is-hp">
                        <span>❤️ HP MÁXIMO</span>
                        <strong>${derived?.hpMaximum ?? 0}</strong>
                        <small>Constituição + Físico por nível</small>
                    </article>
                    <article class="character-derived-card is-st">
                        <span>⚡ EST MÁXIMO</span>
                        <strong>${derived?.stMaximum ?? 0}</strong>
                        <small>${escapeWizardHtml(stFormulaLabels[derived?.stFormula] || 'Fórmula da profissão')}</small>
                    </article>
                    <article class="character-derived-card">
                        <span>🎒 CARGA</span>
                        <strong>${derived?.carryingCapacity ?? 0}</strong>
                        <small>Inclui bônus racial ${breakdown.racialCarryBonus ? `(+${breakdown.racialCarryBonus})` : ''}</small>
                    </article>
                    <article class="character-derived-card">
                        <span>👣 MOVIMENTO</span>
                        <strong>${derived?.movement ?? 5}</strong>
                        <small>Limite de 5 a 15 quadrados</small>
                    </article>
                    ${derived?.runeSourceMaximum ? `
                        <article class="character-derived-card is-rune">
                            <span>🔷 FONTE RÚNICA</span>
                            <strong>${derived.runeSourceMaximum}</strong>
                            <small>Reserva exclusiva dos Sinais do Grifo</small>
                        </article>
                    ` : ''}
                </div>
                <div class="character-derived-breakdown">
                    <strong>Como o aplicativo calculou</strong>
                    <dl>
                        <div><dt>HP</dt><dd>(${breakdown.constitutionBonus || 0} bônus CON + ${breakdown.physiqueTotal || 0} Físico) × ${derived?.level || 1} + (10 + ${breakdown.constitutionBase || 10} CON base)</dd></div>
                        <div><dt>Carga</dt><dd>Força ${breakdown.strengthTotal || 10} ÷ 2 + Físico ${breakdown.physiqueTotal || 0} + bônus FOR ${breakdown.strengthBonus || 0}${breakdown.racialCarryBonus ? ` + raça ${breakdown.racialCarryBonus}` : ''}</dd></div>
                        <div><dt>Movimento</dt><dd>Atletismo × 2 + 4 + Físico + bônus FOR − peso equipado</dd></div>
                    </dl>
                </div>
                <div class="character-wizard-stage-note">
                    <strong>${isCharacterLevelUpDraft() ? 'Equipamentos atuais considerados' : 'Peso equipado começa em 0'}</strong>
                    <span>${isCharacterLevelUpDraft()
                        ? `A prévia preserva os equipamentos da ficha e considera ${Math.max(0, Number(characterWizardDraft.levelUpBase.equippedWeight) || 0)} de peso no cálculo.`
                        : 'Depois da criação, armaduras, escudo, arma ativa e as duas armas reservas reduzem o movimento automaticamente. Itens apenas guardados no inventário não contam.'}</span>
                </div>
            </section>
        `;
    }

    function getCharacterLevelUpReviewData(draft = characterWizardDraft) {
        const model = getCharacterModel();
        if (!model || !isCharacterLevelUpDraft(draft)) return null;

        const base = draft.levelUpBase;
        const equippedWeight = Math.max(0, Number(base.equippedWeight) || 0);
        const baseSource = {
            ...draft,
            level: base.level,
            identity: { ...(draft.identity || {}), level: base.level },
            attributes: base.attributes,
            skills: base.skills,
            professionalSkills: base.professionalSkills,
            learnedAbilityIds: base.learnedAbilityIds
        };
        const beforeDerived = model.calculateCharacterDerivedValues(baseSource, { equippedWeight });
        const afterDerived = model.calculateCharacterDerivedValues(draft, { equippedWeight });
        const attributeChanges = (model.CHARACTER_ATTRIBUTES || []).map(attribute => {
            const before = Math.max(0, Number(base.attributes?.[attribute.id]?.invested) || 0);
            const after = Math.max(0, Number(draft.attributes?.[attribute.id]?.invested) || 0);
            return { id: attribute.id, name: attribute.name, abbreviation: attribute.abbreviation, before, after };
        }).filter(change => change.after !== change.before);
        const professionalChanges = (model.getCharacterProfessionalSkills(draft.specializationId) || []).map(skill => {
            const before = Math.max(0, Number(base.professionalSkills?.[skill.id]?.invested) || 0);
            const after = Math.max(0, Number(draft.professionalSkills?.[skill.id]?.invested) || 0);
            return { id: skill.id, name: skill.name, before, after };
        }).filter(change => change.after !== change.before);
        const skillChanges = (model.CHARACTER_SKILLS || []).map(skill => {
            const before = Math.max(0, Number(base.skills?.[skill.id]?.invested) || 0);
            const after = Math.max(0, Number(draft.skills?.[skill.id]?.invested) || 0);
            return { id: skill.id, name: skill.name, before, after };
        }).filter(change => change.after !== change.before);
        const previousAbilityIds = new Set(base.learnedAbilityIds || []);
        const options = model.getCharacterAbilityLearningOptions(
            {
                raceId: draft.raceId,
                professionId: draft.professionId,
                specializationId: draft.specializationId
            },
            getWizardAbilityCatalog()
        );
        const newAbilityIds = new Set((draft.learnedAbilityIds || []).filter(id => !previousAbilityIds.has(id)));
        const newAbilities = options.filter(ability => newAbilityIds.has(ability.id));

        return {
            fromLevel: Number(base.level) || 1,
            toLevel: Number(draft.level) || 1,
            attributeChanges,
            professionalChanges,
            skillChanges,
            newAbilities,
            beforeDerived,
            afterDerived
        };
    }

    function renderCharacterLevelUpReviewStep() {
        const review = getCharacterLevelUpReviewData();
        const changes = [
            ...review.attributeChanges.map(change => `${escapeWizardHtml(change.abbreviation)} ${change.before} → ${change.after}`),
            ...review.professionalChanges.map(change => `${escapeWizardHtml(change.name)} ${change.before} → ${change.after}`),
            ...review.skillChanges.map(change => `${escapeWizardHtml(change.name)} ${change.before} → ${change.after}`)
        ];
        const derivedRows = [
            ['❤️ HP máximo', review.beforeDerived.hpMaximum, review.afterDerived.hpMaximum],
            ['⚡ EST máximo', review.beforeDerived.stMaximum, review.afterDerived.stMaximum],
            ['🎒 Carga', review.beforeDerived.carryingCapacity, review.afterDerived.carryingCapacity],
            ['👣 Movimento', review.beforeDerived.movement, review.afterDerived.movement]
        ];
        if (review.beforeDerived.runeSourceMaximum || review.afterDerived.runeSourceMaximum) {
            derivedRows.push(['🔷 Fonte Rúnica', review.beforeDerived.runeSourceMaximum, review.afterDerived.runeSourceMaximum]);
        }

        return `
            <section class="character-wizard-step character-level-up-review" aria-labelledby="characterWizardStepTitle">
                <div class="character-wizard-step-copy">
                    <span class="character-wizard-kicker">${getWizardStepKicker(8)}</span>
                    <h3 id="characterWizardStepTitle">Revisão da evolução</h3>
                    <p>Confira todas as mudanças antes de atualizar a ficha. Nada será aplicado até a confirmação.</p>
                </div>
                <div class="character-level-up-summary">
                    <span>EVOLUÇÃO</span>
                    <strong>${escapeWizardHtml(characterWizardDraft.name)}</strong>
                    <small>Nível ${review.fromLevel} → ${review.toLevel}</small>
                </div>
                <div class="character-level-up-derived-grid">
                    ${derivedRows.map(([label, before, after]) => `
                        <article class="${Number(after) !== Number(before) ? 'has-change' : ''}">
                            <span>${label}</span>
                            <strong>${before} → ${after}</strong>
                        </article>
                    `).join('')}
                </div>
                <div class="character-review-section">
                    <strong>Investimentos realizados · ${changes.length}</strong>
                    <div class="character-review-skill-list">
                        ${changes.length ? changes.map(change => `<span>${change}</span>`).join('') : '<small>Nenhum ponto novo foi distribuído.</small>'}
                    </div>
                </div>
                <div class="character-review-section">
                    <strong>Novas magias · ${review.newAbilities.length}</strong>
                    <div class="character-review-ability-list">
                        ${review.newAbilities.length
                            ? review.newAbilities.map(ability => `<span><b>${escapeWizardHtml(ability.icon || '✨')} ${escapeWizardHtml(ability.name)}</b><small>${ability.unlockCost} pontos de treino</small></span>`).join('')
                            : '<small>Nenhuma magia nova foi aprendida.</small>'}
                    </div>
                </div>
                <div class="character-wizard-stage-note">
                    <strong>Recursos atuais serão preservados</strong>
                    <span>O aplicativo atualizará os valores máximos sem recuperar automaticamente HP, EST ou Fonte Rúnica.</span>
                </div>
                <div class="character-wizard-finish-actions character-level-up-finish">
                    <button type="button" class="session-primary" onclick="finishCharacterSheetWizard('level-up')">Confirmar evolução</button>
                </div>
            </section>
        `;
    }

    function renderReviewStep() {
        if (isCharacterLevelUpDraft()) return renderCharacterLevelUpReviewStep();

        const editing = Boolean(characterWizardDraft?.editingSheetId);
        const race = getWizardRace();
        const profession = characterWizardDraft.raceId === 'witcher'
            ? { name: 'Witcher' }
            : getWizardProfession();
        const specialization = getWizardSpecialization();
        const budgets = getCharacterModel()?.getCharacterBudgets(characterWizardDraft.level);
        const model = getCharacterModel();
        const summary = getWizardAllocationSummary();
        const training = getWizardTrainingSummary();
        const derived = model?.calculateCharacterDerivedValues(characterWizardDraft, {
            equippedWeight: 0
        });
        const availableAbilities = model?.getCharacterAbilityLearningOptions(
            getWizardAbilityContext(),
            getWizardAbilityCatalog()
        ) || [];
        const selectedAbilityIds = new Set([
            ...(training?.learnedAbilityIds || []),
            ...(training?.automaticAbilityIds || [])
        ]);
        const selectedAbilities = availableAbilities.filter(ability => selectedAbilityIds.has(ability.id));
        const raceTraits = model?.getCharacterRaceTraits(characterWizardDraft.raceId) || [];
        const activeProfessionalSkills = (model?.getCharacterProfessionalSkills(
            characterWizardDraft.specializationId
        ) || []).filter(skill => (
            Number(characterWizardDraft.professionalSkills?.[skill.id]?.invested) !== 0
        ));
        const activeSkills = (model?.CHARACTER_SKILLS || []).filter(skill => {
            const record = characterWizardDraft.skills?.[skill.id] || {};
            return [
                'invested',
                'attributeModifier',
                'raceBonus',
                'professionBonus',
                'specializationBonus',
                'equipmentBonus',
                'temporaryBonus',
                'manualAdjustment'
            ].some(field => (Number(record[field]) || 0) !== 0)
                || model.getCharacterSkillTotal(
                    skill.id,
                    characterWizardDraft.skills,
                    characterWizardDraft.attributes
                ) !== 0;
        });

        return `
            <section class="character-wizard-step" aria-labelledby="characterWizardStepTitle">
                <div class="character-wizard-step-copy">
                    <span class="character-wizard-kicker">${getWizardStepKicker(8)}</span>
                    <h3 id="characterWizardStepTitle">Revisão</h3>
                    <p>Confira a identidade e os pontos distribuídos antes de salvar a ficha.</p>
                </div>
                <div class="character-review-card">
                    <div class="character-review-name">
                        <span>PERSONAGEM</span>
                        <strong>${escapeWizardHtml(characterWizardDraft.name)}</strong>
                        <small>Nível ${characterWizardDraft.level}</small>
                    </div>
                    <dl>
                        <div><dt>Raça</dt><dd>${escapeWizardHtml(race?.name || 'Não definida')}</dd></div>
                        <div><dt>Profissão</dt><dd>${escapeWizardHtml(profession?.name || 'Não definida')}</dd></div>
                        <div><dt>${characterWizardDraft.raceId === 'witcher' ? 'Escola' : 'Especialização'}</dt><dd>${escapeWizardHtml(specialization?.name || 'Não definida')}</dd></div>
                        ${characterWizardDraft.birthDate ? `<div><dt>Nascimento</dt><dd>${escapeWizardHtml(global.campaignClock?.formatCharacterBirthDate?.(characterWizardDraft.birthDate) || 'Data informada')}</dd></div>` : ''}
                        ${Number.isFinite(global.campaignClock?.getCharacterAge?.(characterWizardDraft.birthDate)) ? `<div><dt>Idade atual</dt><dd>${global.campaignClock.getCharacterAge(characterWizardDraft.birthDate)} anos</dd></div>` : ''}
                        <div><dt>Atributos</dt><dd>${summary?.attributePointsSpent || 0}/${budgets?.attributePoints || 0} pontos</dd></div>
                        <div><dt>Profissionais</dt><dd>${summary?.professionalSkillPointsSpent || 0} pontos</dd></div>
                        <div><dt>Perícias gerais</dt><dd>${summary?.commonSkillPointsSpent || 0} pontos</dd></div>
                        <div><dt>Saldo conjunto</dt><dd>${summary?.skillPointsSpent || 0}/${budgets?.skillPoints || 0} pontos</dd></div>
                        <div><dt>Treino</dt><dd>${training?.trainingPointsSpent || 0}/${budgets?.trainingPoints || 0} pontos</dd></div>
                        <div><dt>HP / EST</dt><dd>${derived?.hpMaximum || 0} / ${derived?.stMaximum || 0}</dd></div>
                        <div><dt>Movimento / Carga</dt><dd>${derived?.movement || 5} / ${derived?.carryingCapacity || 0}</dd></div>
                        ${derived?.runeSourceMaximum ? `<div><dt>Fonte Rúnica</dt><dd>${derived.runeSourceMaximum}</dd></div>` : ''}
                    </dl>
                </div>
                <div class="character-review-section">
                    <strong>Habilidades profissionais · ${activeProfessionalSkills.length}</strong>
                    <div class="character-review-skill-list">
                        ${activeProfessionalSkills.length
                            ? activeProfessionalSkills.map(skill => {
                                const breakdown = model.getCharacterProfessionalSkillBreakdown(
                                    skill.id,
                                    characterWizardDraft.professionalSkills,
                                    characterWizardDraft.attributes
                                );
                                return `<span>${escapeWizardHtml(skill.name)} <b>Nível ${breakdown?.total ?? 0}</b></span>`;
                            }).join('')
                            : '<small>Nenhum ponto profissional distribuído.</small>'}
                    </div>
                </div>
                <div class="character-review-section">
                    <strong>Atributos</strong>
                    <div class="character-review-attribute-list">
                        ${(model?.CHARACTER_ATTRIBUTES || []).map(attribute => {
                            const total = model.getCharacterAttributeTotal(attribute.id, characterWizardDraft.attributes);
                            const modifier = model.getCharacterAttributeModifier(attribute.id, characterWizardDraft.attributes);
                            return `<span>${escapeWizardHtml(attribute.abbreviation)} <b>${total}</b> · bônus +${modifier}</span>`;
                        }).join('')}
                    </div>
                </div>
                <div class="character-review-section">
                    <strong>Perícias com valor · ${activeSkills.length}</strong>
                    <div class="character-review-skill-list">
                        ${activeSkills.length
                            ? activeSkills.map(skill => {
                                const total = model.getCharacterSkillTotal(
                                    skill.id,
                                    characterWizardDraft.skills,
                                    characterWizardDraft.attributes
                                );
                                return `<span>${escapeWizardHtml(skill.name)} <b>${total > 0 ? '+' : ''}${total}</b></span>`;
                            }).join('')
                            : '<small>Nenhum ponto ou bônus aplicado.</small>'}
                    </div>
                </div>
                <div class="character-review-section">
                    <strong>Magias e habilidades · ${selectedAbilities.length}</strong>
                    <div class="character-review-ability-list">
                        ${selectedAbilities.length
                            ? selectedAbilities.map(ability => `
                                <span><b>${escapeWizardHtml(ability.icon || '✨')} ${escapeWizardHtml(ability.name)}</b><small>${ability.accessMode === 'automatic' ? 'Concedida automaticamente' : `${ability.unlockCost} pontos de treino`}</small></span>
                            `).join('')
                            : '<small>Nenhuma magia aprendida ou concedida.</small>'}
                    </div>
                </div>
                <div class="character-review-section">
                    <strong>Características raciais · ${raceTraits.length}</strong>
                    <div class="character-review-trait-list">
                        ${raceTraits.map(trait => `
                            <span><b>${escapeWizardHtml(trait.name)}</b><small>${escapeWizardHtml(trait.description)}</small></span>
                        `).join('')}
                    </div>
                </div>
                <div class="character-wizard-stage-note">
                    <strong>Próximas camadas</strong>
                    <span>Os testes de perícia e os painéis de combate já usam estes valores. Automações profissionais e valores derivados serão acrescentados em etapas próprias.</span>
                </div>
                <div class="character-wizard-finish-actions">
                    ${editing
                        ? '<button type="button" class="session-primary" onclick="finishCharacterSheetWizard(\'update\')">Salvar alterações</button>'
                        : `<button type="button" class="session-primary" onclick="finishCharacterSheetWizard('save')">Salvar ficha</button>
                           <button type="button" class="character-wizard-combat-button" onclick="finishCharacterSheetWizard('save-and-combat')">Salvar e adicionar ao combate</button>
                           <button type="button" class="session-secondary" onclick="finishCharacterSheetWizard('combat-only')">Somente neste combate</button>`}
                </div>
            </section>
        `;
    }

    function renderCharacterWizardStep({ preserveScroll = false } = {}) {
        if (!characterWizardDraft) characterWizardDraft = readCharacterWizardDraft() || createCharacterWizardDraft();

        const dialog = getWizardDialog();
        if (!dialog) return;
        const previousScrollTop = preserveScroll ? Math.max(0, Number(dialog.scrollTop) || 0) : 0;

        dialog.classList.add('character-wizard-dialog');
        const stepContent = [
            renderIdentityStep,
            renderRaceStep,
            renderPathStep,
            renderAttributesStep,
            renderProfessionalSkillsStep,
            renderSkillsStep,
            renderAbilitiesStep,
            renderDerivedValuesStep,
            renderReviewStep
        ][characterWizardDraft.step]();
        const isReview = characterWizardDraft.step === WIZARD_STEPS.length - 1;
        const editing = Boolean(characterWizardDraft.editingSheetId);
        const levelUp = isCharacterLevelUpDraft();

        dialog.innerHTML = `
            <div class="session-dialog-header character-wizard-header">
                <div>
                    <span class="character-wizard-title-kicker">${levelUp ? 'EVOLUÇÃO DE PERSONAGEM' : (editing ? 'EDITAR FICHA COMPLETA' : 'FICHA COMPLETA')}</span>
                    <h2>${levelUp ? 'Subir de nível' : (editing ? 'Edição completa de personagem' : 'Criação de personagem')}</h2>
                </div>
                <div class="character-wizard-header-actions">
                    <button type="button" class="character-wizard-save-draft" onclick="saveCharacterWizardDraft()" title="Salvar ${levelUp ? 'evolução' : 'rascunho'}">💾</button>
                    <button type="button" class="character-wizard-discard-draft" onclick="discardCharacterWizardDraft()" title="${levelUp ? 'Cancelar evolução' : 'Descartar rascunho'}" aria-label="${levelUp ? 'Cancelar evolução' : 'Descartar rascunho'}">🗑️</button>
                    <button type="button" class="session-close" onclick="closeSessionTools()" aria-label="Fechar">×</button>
                </div>
            </div>
            ${renderWizardProgress()}
            ${stepContent}
            <div class="session-dialog-actions character-wizard-navigation">
                <button type="button" class="session-secondary" onclick="moveCharacterWizard(-1)">${characterWizardDraft.step === 0 ? (editing ? 'Voltar às fichas' : 'Voltar aos modos') : 'Voltar'}</button>
                ${isReview ? '' : '<button type="button" class="session-primary" onclick="moveCharacterWizard(1)">Continuar</button>'}
            </div>
        `;

        if (preserveScroll) {
            const restoreScroll = () => {
                dialog.scrollTop = previousScrollTop;
            };
            restoreScroll();
            if (typeof global.requestAnimationFrame === 'function') {
                global.requestAnimationFrame(() => {
                    restoreScroll();
                    global.requestAnimationFrame(restoreScroll);
                });
            }
            global.setTimeout?.(restoreScroll, 80);
        }

        if (characterWizardDraft.step === 0) {
            dialog.querySelector('#characterWizardName')?.focus();
        }
    }

    function openCharacterCreationModeChooser() {
        let dialog = getWizardDialog();
        if (!dialog) {
            global.openSessionTools?.('sheets');
            dialog = getWizardDialog();
        }
        if (!dialog) return;

        const savedDraft = readCharacterWizardDraft();
        dialog.classList.add('character-wizard-dialog');
        dialog.innerHTML = `
            <div class="session-dialog-header">
                <div>
                    <span class="character-wizard-title-kicker">NOVA FICHA</span>
                    <h2>Como deseja criar?</h2>
                </div>
                <button type="button" class="session-close" onclick="closeSessionTools()" aria-label="Fechar">×</button>
            </div>
            <p>Escolha a velocidade da ficha. A opção rápida continua exatamente como antes.</p>
            <div class="character-mode-grid">
                <button type="button" class="character-mode-card" onclick="createQuickCharacterSheet()">
                    <span class="character-mode-icon">⚡</span>
                    <strong>Criação rápida</strong>
                    <small>HP, ST, ataque e defesas para entrar logo no combate.</small>
                </button>
                <button type="button" class="character-mode-card character-mode-card-featured" onclick="startCharacterSheetWizard({ fresh: true })">
                    <span class="character-mode-icon">📜</span>
                    <strong>Criação completa</strong>
                    <small>Raça, profissão, atributos, perícias profissionais e aprendizado de magias.</small>
                </button>
                <button type="button" class="character-mode-card character-mode-card-template" onclick="openCharacterTemplateChooser()">
                    <span class="character-mode-icon">🧭</span>
                    <strong>Modelo pronto</strong>
                    <small>Comece com uma construção equilibrada e personalize tudo antes de salvar.</small>
                </button>
                <button type="button" class="character-mode-card character-mode-card-import" onclick="document.getElementById('characterSheetImportInput')?.click()">
                    <span class="character-mode-icon">⇧</span>
                    <strong>Importar ficha</strong>
                    <small>Receba uma ficha criada em outro dispositivo sem substituir as que já existem.</small>
                </button>
                <input id="characterSheetImportInput" type="file" accept="application/json,.json" hidden onchange="importCharacterSheetFile(event)">
            </div>
            ${hasCharacterWizardProgress(savedDraft) ? `
                <button type="button" class="character-draft-resume" onclick="startCharacterSheetWizard()">
                    <span>Continuar rascunho</span>
                    <strong>${escapeWizardHtml(savedDraft.name || 'Personagem sem nome')} · Passo ${savedDraft.step + 1}</strong>
                </button>
            ` : ''}
            <div class="session-dialog-actions">
                <button type="button" class="session-secondary" onclick="renderSessionToolsView('sheets')">Cancelar</button>
            </div>
        `;
    }

    function openCharacterTemplateChooser() {
        let dialog = getWizardDialog();
        if (!dialog) {
            global.openSessionTools?.('sheets');
            dialog = getWizardDialog();
        }
        if (!dialog) return;

        const templates = getCharacterTemplateCatalog();
        const cards = templates.length
            ? templates.map(template => `
                <button type="button" class="character-template-card" onclick="startCharacterSheetTemplate('${escapeWizardHtml(template.id)}')">
                    <span class="character-template-icon" aria-hidden="true">${escapeWizardHtml(template.icon)}</span>
                    <span class="character-template-copy">
                        <strong>${escapeWizardHtml(template.name)}</strong>
                        <small>${escapeWizardHtml(template.role)}</small>
                        <span>${escapeWizardHtml(template.summary)}</span>
                    </span>
                    <span class="character-template-action">Usar modelo</span>
                </button>
            `).join('')
            : '<p class="character-template-empty">Nenhum modelo pronto está disponível.</p>';

        dialog.classList.add('character-wizard-dialog');
        dialog.innerHTML = `
            <div class="session-dialog-header">
                <div>
                    <span class="character-wizard-title-kicker">MODELOS PRONTOS</span>
                    <h2>Escolha um ponto de partida</h2>
                </div>
                <button type="button" class="session-close" onclick="closeSessionTools()" aria-label="Fechar">×</button>
            </div>
            <p>O modelo preenche a ficha completa, mas todas as escolhas continuam editáveis.</p>
            <div class="character-template-grid">${cards}</div>
            <div class="session-dialog-actions">
                <button type="button" class="session-secondary" onclick="openCharacterCreationModeChooser()">Voltar</button>
            </div>
        `;
    }

    function startCharacterSheetTemplate(templateId, confirmedReset = false) {
        const template = global.characterSheetTemplates?.getById?.(templateId);
        const templateDraft = global.characterSheetTemplates?.createDraft?.(templateId);
        if (!template || !templateDraft) {
            global.showToast?.('Este modelo pronto não está disponível.');
            return;
        }

        const savedDraft = readCharacterWizardDraft();
        if (!confirmedReset && hasCharacterWizardProgress(savedDraft)) {
            global.openSessionConfirm?.({
                title: 'Usar este modelo?',
                message: `O rascunho atual será substituído por ${template.name}.`,
                confirmLabel: 'Usar modelo',
                danger: true,
                onConfirm: () => startCharacterSheetTemplate(templateId, true)
            });
            return;
        }

        characterWizardDraft = createCharacterWizardDraft({
            ...templateDraft,
            step: 0
        });
        persistCharacterWizardDraft();
        renderCharacterWizardStep();
        global.showToast?.(`${template.name} carregado. Revise e personalize a ficha.`);
    }

    function startCharacterSheetWizard(options = {}) {
        const editingSheetId = String(options?.editSheetId || '');
        if (editingSheetId) {
            const sheet = global.getCharacterSheetForEditing?.(editingSheetId);
            if (!sheet || sheet.creationMode !== 'full') {
                global.showToast?.('Não foi possível abrir esta ficha completa para edição.');
                return;
            }

            characterWizardDraft = createCharacterWizardDraft({
                ...sheet,
                editingSheetId: sheet.id,
                step: 0,
                name: sheet.identity?.name || sheet.name,
                level: sheet.identity?.level,
                raceId: sheet.raceId || sheet.identity?.raceId,
                professionId: sheet.identity?.professionId,
                specializationId: sheet.identity?.specializationId
            });
            persistCharacterWizardDraft();
            renderCharacterWizardStep();
            return;
        }

        const fresh = options?.fresh === true;
        const confirmedReset = options?.confirmedReset === true;
        const savedDraft = readCharacterWizardDraft();

        if (fresh && !confirmedReset && hasCharacterWizardProgress(savedDraft)) {
            global.openSessionConfirm?.({
                title: 'Começar uma nova ficha?',
                message: 'O rascunho atual será substituído por uma nova criação completa.',
                confirmLabel: 'Começar nova',
                danger: true,
                onConfirm: () => startCharacterSheetWizard({ fresh: true, confirmedReset: true })
            });
            return;
        }

        characterWizardDraft = fresh
            ? createCharacterWizardDraft()
            : savedDraft || createCharacterWizardDraft();
        persistCharacterWizardDraft();
        renderCharacterWizardStep();
    }

    function startCharacterLevelUpWizard(sheetId, confirmedReset = false) {
        const sheet = global.getCharacterSheetForEditing?.(String(sheetId || ''));
        if (!sheet || sheet.creationMode !== 'full') {
            global.showToast?.('Somente fichas completas podem usar o assistente de evolução.');
            return;
        }

        const currentLevel = getCharacterModel()?.normalizeCharacterLevel(sheet.identity?.level) || 1;
        const abilityContext = {
            raceId: sheet.raceId || sheet.identity?.raceId,
            professionId: sheet.identity?.professionId,
            specializationId: sheet.identity?.specializationId
        };
        const normalizedLearnedAbilityIds = getCharacterModel()?.normalizeCharacterLearnedAbilityIds(
            sheet.learnedAbilityIds,
            abilityContext,
            getWizardAbilityCatalog()
        ) || [];
        const savedDraft = readCharacterWizardDraft();
        if (
            isCharacterLevelUpDraft(savedDraft)
            && savedDraft.editingSheetId === sheet.id
            && Number(savedDraft.levelUpBase.level) === currentLevel
        ) {
            characterWizardDraft = savedDraft;
            characterWizardDraft.levelUpBase.canUndoLastEvolution = Boolean(
                global.canUndoLastCharacterLevelUp?.(sheet.id)
            );
            persistCharacterWizardDraft();
            renderCharacterWizardStep();
            global.showToast?.(`Evolução de ${sheet.name} retomada.`);
            return;
        }

        if (!confirmedReset && hasCharacterWizardProgress(savedDraft)) {
            global.openSessionConfirm?.({
                title: 'Iniciar evolução?',
                message: 'O rascunho atual será substituído pelo assistente de evolução deste personagem.',
                confirmLabel: 'Iniciar evolução',
                danger: true,
                onConfirm: () => startCharacterLevelUpWizard(sheet.id, true)
            });
            return;
        }

        const base = {
            level: currentLevel,
            attributes: cloneWizardValue(sheet.attributes, {}),
            skills: cloneWizardValue(sheet.skills, {}),
            professionalSkills: cloneWizardValue(sheet.professionalSkills, {}),
            learnedAbilityIds: cloneWizardValue(normalizedLearnedAbilityIds, []),
            equippedWeight: Math.max(0, Number(sheet.equippedWeight) || 0),
            hpMaximum: Math.max(0, Number(sheet.hpMax) || 0),
            stMaximum: Math.max(0, Number(sheet.stMax) || 0),
            runeSourceMaximum: Math.max(0, Number(sheet.runeSourceMax) || 0),
            canUndoLastEvolution: Boolean(global.canUndoLastCharacterLevelUp?.(sheet.id))
        };

        characterWizardDraft = createCharacterWizardDraft({
            ...sheet,
            editingSheetId: sheet.id,
            workflow: 'level-up',
            levelUpBase: base,
            step: 0,
            name: sheet.identity?.name || sheet.name,
            level: currentLevel + 1,
            raceId: sheet.raceId || sheet.identity?.raceId,
            professionId: sheet.identity?.professionId,
            specializationId: sheet.identity?.specializationId
        });
        persistCharacterWizardDraft();
        renderCharacterWizardStep();
    }

    function updateCharacterWizardField(field, value) {
        if (!characterWizardDraft) return;

        if (field === 'name' && !isCharacterLevelUpDraft()) {
            characterWizardDraft.name = String(value || '').slice(0, 80);
        }
        if (field === 'level') {
            const normalizedLevel = getCharacterModel()?.normalizeCharacterLevel(value) || 1;
            characterWizardDraft.level = isCharacterLevelUpDraft()
                ? Math.max(Number(characterWizardDraft.levelUpBase.level) + 1, normalizedLevel)
                : normalizedLevel;
        }

        persistCharacterWizardDraft();
        if (field === 'level') renderCharacterWizardStep();
    }

    function updateCharacterWizardBirthField(field, value) {
        if (!characterWizardDraft || isCharacterLevelUpDraft()) return;
        const current = characterWizardDraft.birthDate && typeof characterWizardDraft.birthDate === 'object'
            ? { ...characterWizardDraft.birthDate }
            : { day: null, month: null, year: null, era: 'DR' };
        if (field === 'era') current.era = String(value).toUpperCase() === 'AR' ? 'AR' : 'DR';
        else if (['day', 'month', 'year'].includes(field)) {
            current[field] = String(value).trim() ? Math.max(0, Math.floor(Number(value) || 0)) || null : null;
        }
        characterWizardDraft.birthDate = current.day || current.month || current.year ? current : null;
        persistCharacterWizardDraft();
    }

    function normalizeWizardLearnedAbilities() {
        if (!characterWizardDraft) return;

        characterWizardDraft.learnedAbilityIds = getCharacterModel()
            ?.normalizeCharacterLearnedAbilityIds(
                characterWizardDraft.learnedAbilityIds,
                getWizardAbilityContext(),
                getWizardAbilityCatalog()
            ) || [];
        characterWizardDraft.abilityProfessionFilter = 'all';
        characterWizardDraft.abilityTierFilter = 'all';
    }

    function selectCharacterWizardRace(raceId) {
        if (!characterWizardDraft) return;

        const normalizedRace = getCharacterModel()?.normalizeCharacterRaceId(raceId) || '';
        if (normalizedRace !== characterWizardDraft.raceId) {
            characterWizardDraft.raceId = normalizedRace;
            characterWizardDraft.professionId = normalizedRace === 'witcher' ? 'witcher' : '';
            characterWizardDraft.specializationId = '';
            characterWizardDraft.professionalSkills = {};
            characterWizardDraft.learnedAbilityIds = [];
            const racialFoundation = getCharacterModel()?.applyCharacterRaceBonuses(
                normalizedRace,
                characterWizardDraft.attributes,
                characterWizardDraft.skills
            );
            characterWizardDraft.attributes = racialFoundation?.attributes || characterWizardDraft.attributes;
            characterWizardDraft.skills = getCharacterModel()?.applyCharacterProfessionalSkillBonuses(
                '',
                {},
                racialFoundation?.skills || characterWizardDraft.skills
            ) || characterWizardDraft.skills;
        }

        persistCharacterWizardDraft();
        renderCharacterWizardStep();
    }

    function selectCharacterWizardProfession(professionId) {
        if (!characterWizardDraft) return;

        const normalizedProfession = getCharacterModel()?.normalizeCharacterProfessionId(professionId) || '';
        if (
            normalizedProfession
            && !getCharacterModel()?.isCharacterProfessionAvailableForRace(
                normalizedProfession,
                characterWizardDraft.raceId
            )
        ) {
            global.showToast?.('Esta profissão não está disponível para a raça escolhida.');
            return;
        }
        if (normalizedProfession !== characterWizardDraft.professionId) {
            characterWizardDraft.professionId = normalizedProfession;
            characterWizardDraft.specializationId = '';
            characterWizardDraft.professionalSkills = {};
            characterWizardDraft.learnedAbilityIds = [];
        }

        const specializations = getCharacterModel()?.getCharacterSpecializations(
            characterWizardDraft.professionId,
            characterWizardDraft.raceId
        ) || [];
        if (specializations.length === 1) characterWizardDraft.specializationId = specializations[0].id;
        characterWizardDraft.skills = getCharacterModel()?.applyCharacterProfessionalSkillBonuses(
            characterWizardDraft.specializationId,
            characterWizardDraft.professionalSkills,
            characterWizardDraft.skills
        ) || characterWizardDraft.skills;
        normalizeWizardLearnedAbilities();

        persistCharacterWizardDraft();
        renderCharacterWizardStep();
    }

    function selectCharacterWizardSpecialization(specializationId) {
        if (!characterWizardDraft) return;

        const specialization = getCharacterModel()?.getCharacterSpecializationDefinition(
            characterWizardDraft.professionId,
            specializationId,
            characterWizardDraft.raceId
        );
        const nextSpecializationId = specialization?.id || '';
        if (nextSpecializationId !== characterWizardDraft.specializationId) {
            characterWizardDraft.specializationId = nextSpecializationId;
            characterWizardDraft.professionalSkills = getCharacterModel()
                ?.normalizeCharacterProfessionalSkillAllocations({}, nextSpecializationId) || {};
            characterWizardDraft.skills = getCharacterModel()?.applyCharacterProfessionalSkillBonuses(
                nextSpecializationId,
                characterWizardDraft.professionalSkills,
                characterWizardDraft.skills
            ) || characterWizardDraft.skills;
            normalizeWizardLearnedAbilities();
        }
        persistCharacterWizardDraft();
        renderCharacterWizardStep();
    }

    function adjustCharacterWizardAttribute(attributeId, delta) {
        const model = getCharacterModel();
        const definition = model?.getCharacterAttributeDefinition(attributeId);
        if (!characterWizardDraft || !definition) return;

        const summary = getWizardAllocationSummary();
        const current = Number(characterWizardDraft.attributes?.[definition.id]?.invested) || 0;
        const direction = Math.sign(Number(delta) || 0);
        const minimum = getLevelUpBaseInvestment('attributes', definition.id);

        if (direction > 0 && (summary?.attributePointsRemaining || 0) <= 0) return;
        if (direction < 0 && current <= minimum) return;

        characterWizardDraft.attributes[definition.id] = {
            ...(characterWizardDraft.attributes[definition.id] || {}),
            invested: Math.max(minimum, current + direction)
        };
        persistCharacterWizardDraft();
        renderCharacterWizardStep();
    }

    function selectCharacterWizardSkillGroup(attributeId) {
        const definition = getCharacterModel()?.getCharacterAttributeDefinition(attributeId);
        if (!characterWizardDraft || !definition) return;

        characterWizardDraft.skillGroup = definition.id;
        persistCharacterWizardDraft();
        renderCharacterWizardStep();
    }

    function adjustCharacterWizardSkill(skillId, delta) {
        const model = getCharacterModel();
        const definition = model?.getCharacterSkillDefinition(skillId);
        if (!characterWizardDraft || !definition) return;

        const summary = getWizardAllocationSummary();
        const current = Number(characterWizardDraft.skills?.[definition.id]?.invested) || 0;
        const direction = Math.sign(Number(delta) || 0);
        const cap = model?.CHARACTER_SKILL_INVESTMENT_CAP || 4;
        const minimum = getLevelUpBaseInvestment('skills', definition.id);

        if (direction > 0 && current >= cap) return;
        if (direction > 0 && (summary?.skillPointsRemaining || 0) < definition.pointCost) return;
        if (direction < 0 && current <= minimum) return;

        characterWizardDraft.skills[definition.id] = {
            ...(characterWizardDraft.skills[definition.id] || {}),
            invested: Math.min(cap, Math.max(minimum, current + direction))
        };
        persistCharacterWizardDraft();
        renderCharacterWizardStep({ preserveScroll: true });
    }

    function adjustCharacterWizardProfessionalSkill(skillId, delta) {
        const model = getCharacterModel();
        const definition = model?.getCharacterProfessionalSkillDefinition(skillId);
        if (!characterWizardDraft || !definition) return;
        if (definition.treeId !== characterWizardDraft.specializationId) return;

        const summary = getWizardAllocationSummary();
        const current = Number(characterWizardDraft.professionalSkills?.[definition.id]?.invested) || 0;
        const direction = Math.sign(Number(delta) || 0);
        const cap = definition.maxInvestment || model?.CHARACTER_SKILL_INVESTMENT_CAP || 4;
        const pointCost = definition.pointCost || 1;
        const minimum = getLevelUpBaseInvestment('professionalSkills', definition.id);

        if (direction > 0 && current >= cap) return;
        if (direction > 0 && (summary?.skillPointsRemaining || 0) < pointCost) return;
        if (direction < 0 && current <= minimum) return;

        characterWizardDraft.professionalSkills[definition.id] = {
            ...(characterWizardDraft.professionalSkills[definition.id] || {}),
            invested: Math.min(cap, Math.max(minimum, current + direction))
        };
        characterWizardDraft.skills = model.applyCharacterProfessionalSkillBonuses(
            characterWizardDraft.specializationId,
            characterWizardDraft.professionalSkills,
            characterWizardDraft.skills
        );
        persistCharacterWizardDraft();
        renderCharacterWizardStep({ preserveScroll: true });
    }

    function selectCharacterWizardAbilityProfession(professionId) {
        if (!characterWizardDraft) return;

        const normalizedId = normalizeWizardSearch(professionId) || 'all';
        const validIds = new Set((getCharacterModel()?.getCharacterAbilityLearningOptions(
            getWizardAbilityContext(),
            getWizardAbilityCatalog()
        ) || []).map(ability => (
            getCharacterModel().normalizeCharacterAbilityProfession(ability.profession)
        )));

        characterWizardDraft.abilityProfessionFilter = normalizedId === 'all' || validIds.has(normalizedId)
            ? normalizedId
            : 'all';
        characterWizardDraft.abilityTierFilter = 'all';
        persistCharacterWizardDraft();
        renderCharacterWizardStep();
    }

    function selectCharacterWizardAbilityTier(categoryId) {
        if (!characterWizardDraft) return;

        characterWizardDraft.abilityTierFilter = normalizeWizardSearch(categoryId) || 'all';
        persistCharacterWizardDraft();
        renderCharacterWizardStep();
    }

    function filterCharacterWizardAbilities(value) {
        if (!characterWizardDraft) return;

        characterWizardDraft.abilitySearch = String(value || '').slice(0, 80);
        const search = normalizeWizardSearch(characterWizardDraft.abilitySearch);
        let visibleCount = 0;

        document.querySelectorAll('.character-ability-card').forEach(card => {
            const isVisible = String(card.dataset.abilitySearch || '').includes(search);
            card.hidden = !isVisible;
            if (isVisible) visibleCount += 1;
        });

        const count = document.getElementById('characterAbilityVisibleCount');
        if (count) count.textContent = String(visibleCount);
        persistCharacterWizardDraft();
    }

    function toggleCharacterWizardAbility(abilityId) {
        const model = getCharacterModel();
        if (!characterWizardDraft || !model) return;

        const options = model.getCharacterAbilityLearningOptions(
            getWizardAbilityContext(),
            getWizardAbilityCatalog()
        );
        const ability = options.find(entry => entry.id === abilityId);
        if (!ability || ability.accessMode !== 'learnable') return;
        if (isPreviouslyLearnedAbility(ability.id)) {
            global.showToast?.(`${ability.name} já fazia parte da ficha e será preservada.`);
            return;
        }

        const learnedIds = new Set(characterWizardDraft.learnedAbilityIds || []);
        if (learnedIds.has(ability.id)) {
            learnedIds.delete(ability.id);
        } else {
            const training = getWizardTrainingSummary();
            if ((training?.trainingPointsRemaining || 0) < ability.unlockCost) {
                global.showToast?.(`Faltam pontos de treino para aprender ${ability.name}.`);
                return;
            }
            learnedIds.add(ability.id);
        }

        characterWizardDraft.learnedAbilityIds = model.normalizeCharacterLearnedAbilityIds(
            [...learnedIds],
            getWizardAbilityContext(),
            getWizardAbilityCatalog()
        );
        persistCharacterWizardDraft();
        renderCharacterWizardStep({ preserveScroll: true });
    }

    function moveCharacterWizard(direction) {
        if (!characterWizardDraft) return;

        if (direction < 0 && characterWizardDraft.step === 0) {
            const editing = Boolean(characterWizardDraft.editingSheetId);
            if (editing) {
                clearCharacterWizardDraft();
                global.renderSessionToolsView?.('sheets');
            } else {
                persistCharacterWizardDraft();
                openCharacterCreationModeChooser();
            }
            return;
        }

        if (direction > 0 && !validateCharacterWizardStep(characterWizardDraft.step, { notify: true })) return;

        const indexes = getWizardStepIndexes();
        const currentPosition = Math.max(0, indexes.indexOf(characterWizardDraft.step));
        const nextPosition = Math.min(indexes.length - 1, Math.max(0, currentPosition + direction));
        characterWizardDraft.step = indexes[nextPosition];
        persistCharacterWizardDraft();
        renderCharacterWizardStep();
    }

    function saveCharacterWizardDraft() {
        if (!persistCharacterWizardDraft()) return;
        global.showToast?.(isCharacterLevelUpDraft()
            ? 'Evolução salva para continuar depois.'
            : 'Rascunho da ficha salvo neste dispositivo.');
    }

    function discardCharacterWizardDraft() {
        const editing = Boolean(characterWizardDraft?.editingSheetId);
        const levelUp = isCharacterLevelUpDraft();
        global.openSessionConfirm?.({
            title: levelUp ? 'Cancelar evolução?' : (editing ? 'Cancelar edição?' : 'Descartar rascunho?'),
            message: levelUp
                ? 'Os pontos distribuídos nesta evolução serão descartados. A ficha salva será mantida.'
                : editing
                ? 'As alterações feitas nesta edição serão descartadas. A ficha salva será mantida.'
                : 'As escolhas desta ficha completa serão removidas.',
            confirmLabel: levelUp ? 'Cancelar evolução' : (editing ? 'Cancelar edição' : 'Descartar'),
            danger: true,
            onConfirm: () => {
                clearCharacterWizardDraft();
                if (editing) global.renderSessionToolsView?.('sheets');
                else openCharacterCreationModeChooser();
            }
        });
    }

    function finishCharacterSheetWizard(action) {
        if (!validateCompleteCharacterWizard({ notify: true })) return;

        const draft = createCharacterWizardDraft(characterWizardDraft);
        let result = null;

        if (action === 'save') {
            result = global.createFullCharacterSheetFromDraft?.(draft, { addToCombat: false });
        } else if (action === 'save-and-combat') {
            result = global.createFullCharacterSheetFromDraft?.(draft, { addToCombat: true });
        } else if (action === 'combat-only') {
            result = global.addFullCharacterDraftToCombat?.(draft);
        } else if (action === 'update') {
            result = global.updateFullCharacterSheetFromDraft?.(draft.editingSheetId, draft);
        } else if (action === 'level-up') {
            result = global.applyCharacterLevelUpFromDraft?.(draft.editingSheetId, draft);
        }

        if (result) clearCharacterWizardDraft();
    }

    global.openCharacterCreationModeChooser = openCharacterCreationModeChooser;
    global.openCharacterTemplateChooser = openCharacterTemplateChooser;
    global.startCharacterSheetTemplate = startCharacterSheetTemplate;
    global.startCharacterSheetWizard = startCharacterSheetWizard;
    global.startCharacterLevelUpWizard = startCharacterLevelUpWizard;
    global.renderCharacterWizardStep = renderCharacterWizardStep;
    global.updateCharacterWizardField = updateCharacterWizardField;
    global.updateCharacterWizardBirthField = updateCharacterWizardBirthField;
    global.selectCharacterWizardRace = selectCharacterWizardRace;
    global.selectCharacterWizardProfession = selectCharacterWizardProfession;
    global.selectCharacterWizardSpecialization = selectCharacterWizardSpecialization;
    global.adjustCharacterWizardAttribute = adjustCharacterWizardAttribute;
    global.selectCharacterWizardSkillGroup = selectCharacterWizardSkillGroup;
    global.adjustCharacterWizardSkill = adjustCharacterWizardSkill;
    global.adjustCharacterWizardProfessionalSkill = adjustCharacterWizardProfessionalSkill;
    global.selectCharacterWizardAbilityProfession = selectCharacterWizardAbilityProfession;
    global.selectCharacterWizardAbilityTier = selectCharacterWizardAbilityTier;
    global.filterCharacterWizardAbilities = filterCharacterWizardAbilities;
    global.toggleCharacterWizardAbility = toggleCharacterWizardAbility;
    global.moveCharacterWizard = moveCharacterWizard;
    global.saveCharacterWizardDraft = saveCharacterWizardDraft;
    global.discardCharacterWizardDraft = discardCharacterWizardDraft;
    global.finishCharacterSheetWizard = finishCharacterSheetWizard;
    global.characterSheetWizard = Object.freeze({
        CHARACTER_SHEET_DRAFT_KEY,
        CHARACTER_SHEET_DRAFT_VERSION,
        WIZARD_STEPS,
        createCharacterWizardDraft,
        isCharacterWizardDraftValid,
        readCharacterWizardDraft,
        clearCharacterWizardDraft,
        hasCharacterWizardProgress,
        getWizardAllocationSummary,
        isCharacterLevelUpDraft,
        getWizardStepIndexes,
        getCharacterLevelUpReviewData,
        validateCharacterWizardStep,
        validateCompleteCharacterWizard
    });
})(typeof window !== 'undefined' ? window : globalThis);
