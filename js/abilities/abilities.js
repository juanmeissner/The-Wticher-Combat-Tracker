// =========================================
// HABILIDADES
// =========================================

let abilitiesInventory = [];

let selectedAbilityId = null;

let abilityLongPressTimer = null;

let abilityWasLongPress = false;

let expandedMagic = 0;

function renderAbilities() {

    const container =
        document.getElementById('abilitiesList');

    if (!container) return;

    container.innerHTML = '';

    if (abilitiesInventory.length === 0) {

        container.innerHTML = `

            <div class="text-center text-slate-500 mt-10">

                Nenhuma habilidade

            </div>
        `;

        return;
    }

    abilitiesInventory.forEach(ability => {

        container.innerHTML += `

            <div

            class="ability-card
                ${selectedAbilityId === ability.id
                        ? 'ability-card-selected'
                        : ''}
                ${ability.active
                        ? 'ability-card-active'
                        : ''}"

                ontouchstart="startAbilityLongPress('${ability.id}')"

                ontouchend="handleAbilityTouchEnd('${ability.id}')"

                onclick="selectAbility('${ability.id}')">

<div class="flex items-center justify-between w-full">

    <div class="flex items-center gap-4 min-w-0">

        <div class="ability-icon flex-shrink-0">

            ${ability.icon}

        </div>

        <div class="min-w-0">

            <div class="font-bold text-lg truncate">

                ${ability.name}

            </div>

        </div>

    </div>

    <div class="text-cyan-400
                font-bold
                text-lg
                ml-3
                flex-shrink-0">

                ${getModifiedAbilityCost(
                    ability.cost
                )}

    </div>

</div>
        `;
    });
}

function addAbility(abilityId) {

    const exists =
        abilitiesInventory.find(
            a => a.id === abilityId
        );

    if (exists) {

        showToast('⚠️ Habilidade já adicionada');

        return;
    }

    const baseAbility =
        predefinedAbilities.find(
            a => a.id === abilityId
        );

    if (!baseAbility) return;

    abilitiesInventory.push({
        ...baseAbility,
        active: false
    });

    saveAbilities();

    renderAbilities();

    updateAbilitiesHeader();

    closeAbilitiesModal();

    showToast(
        `✨ ${baseAbility.name} adicionada`
    );
}

function removeSelectedAbility() {

    if (!selectedAbilityId) return;

    abilitiesInventory =
        abilitiesInventory.filter(
            a => a.id !== selectedAbilityId
        );

    selectedAbilityId = null;

    saveAbilities();

    renderAbilities();

    updateAbilitiesHeader();

    showToast('🗑️ Habilidade removida');
}

function selectAbility(id) {

    selectedAbilityId = id;

    renderAbilities();
}

function saveAbilities() {

    localStorage.setItem(
        'abilitiesInventory',
        JSON.stringify(abilitiesInventory)
    );
}

function loadAbilities() {

    const saved =
        localStorage.getItem(
            'abilitiesInventory'
        );

    if (!saved) return;

    abilitiesInventory =
        JSON.parse(saved);
}

function startAbilityLongPress(id) {

    abilityWasLongPress = false;

    abilityLongPressTimer =
        setTimeout(() => {

            abilityWasLongPress = true;

            openAbilityDetails(id);

        }, 500);
}

function handleAbilityTouchEnd(id) {

    clearTimeout(abilityLongPressTimer);

    if (abilityWasLongPress) return;

    selectAbility(id);
}

window.addEventListener('load', () => {

    loadAbilities();

    loadExpandedMagic();

    renderAbilities();

    updateAbilitiesHeader();
});

function formatAbilityDescription(text) {

    if (!text) return '';

    return text

        .replace(/\.\s/g, '.<br>')

        .replace(/\!\s/g, '!<br><br>')

        .replace(/\?\s/g, '?<br><br>');
}

function renderAbilityInfo(label, value) {

    if (!value) return '';

    return `

        <div class="bg-slate-800 rounded-xl p-3">

            <div class="text-xs
                        uppercase
                        tracking-wider
                        text-slate-400
                        mb-1">

                ${label}

            </div>

            <div class="text-sm
                        font-bold
                        text-white">

                ${value}

            </div>

        </div>
    `;
}

// =========================================
// MAGIA EXPANDIDA
// =========================================

function getModifiedAbilityCost(cost) {

    if (!cost) return '';

    // Mantém textos
    if (!/^\d+$/.test(cost)) {

        return cost;
    }

    const numericCost =
        parseInt(cost);

    // Cada nível reduz 2
    const reduction =
        expandedMagic * 2;

    return Math.max(
        1,
        numericCost - reduction
    );
}

function updateAbilitiesHeader() {

    const totalElement =
        document.getElementById(
            'totalUnlockCost'
        );

    const expandedElement =
        document.getElementById(
            'expandedMagicValue'
        );

    if (!totalElement ||
        !expandedElement) return;

    const total =
        abilitiesInventory.reduce(
            (sum, ability) =>
                sum + (
                    Number(
                        ability.unlockCost
                    ) || 0
                ),
            0
        );

    totalElement.textContent =
        total;

    expandedElement.textContent =
        expandedMagic;
}

function openExpandedMagicModal() {

    document
        .getElementById(
            'expandedMagicModal'
        )
        .classList.remove('hidden');
}

function closeExpandedMagicModal() {

    document
        .getElementById(
            'expandedMagicModal'
        )
        .classList.add('hidden');
}

function setExpandedMagic(value) {

    expandedMagic = value;

    localStorage.setItem(
        'expandedMagic',
        value
    );

    closeExpandedMagicModal();

    renderAbilities();

    updateAbilitiesHeader();
}

function loadExpandedMagic() {

    const saved =
        localStorage.getItem(
            'expandedMagic'
        );

    if (!saved) return;

    expandedMagic =
        Number(saved);
}

function toggleAbilityActive(id) {

    const ability =
        abilitiesInventory.find(
            a => a.id === id
        );

    if (!ability) return;

    ability.active = !ability.active;

    saveAbilities();

    renderAbilities();

    openAbilityDetails(id);

    showToast(
        ability.active
            ? '✨ Magia ativada'
            : '⭕ Magia desativada'
    );
}