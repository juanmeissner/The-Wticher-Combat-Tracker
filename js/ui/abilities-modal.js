function openAbilitiesModal() {

    document
        .getElementById('abilitiesModal')
        .classList.remove('hidden');

    document
        .getElementById('abilitiesModal')
        .classList.add('modal-open');

    renderAbilitiesModal();
}

function closeAbilitiesModal() {

    document
        .getElementById('abilitiesModal')
        .classList.add('hidden');

    document
        .getElementById('abilitiesModal')
        .classList.remove('modal-open');
}

function renderAbilitiesModal() {

    const container =
        document.getElementById(
            'abilitiesModalList'
        );

    container.innerHTML = '';

    predefinedAbilities.forEach(ability => {

        container.innerHTML += `

        <button
    
            onclick="openAbilityDetails('${ability.id}')"
    
            class="w-full
                   bg-slate-800
                   hover:bg-slate-700
                   text-white
                   rounded-xl
                   p-4
                   flex
                   justify-between
                   items-center">
    
            <div class="flex items-center gap-3">
    
                <div class="text-3xl">
    
                    ${ability.icon}
    
                </div>
    
                <div class="text-left">
    
                    <div class="font-bold">
    
                        ${ability.name}
    
                    </div>
    
                    <div class="text-sm text-slate-400">
    
                        ${ability.shortDescription}
    
                    </div>
    
                </div>
    
            </div>
    
            <div class="text-cyan-400 font-bold">
    
                ${getModifiedAbilityCost(
                    ability.cost
                )}
    
            </div>
    
        </button>
    `;
    });
}

function openAbilityDetails(id) {

    const ability =
        predefinedAbilities.find(
            a => a.id === id
        );

    if (!ability) return;

    const inventoryAbility =
    abilitiesInventory.find(
        a => a.id === id
    );

    const content =
        document.getElementById(
            'abilityDetailsContent'
        );

    content.innerHTML = `

<div class="text-5xl mb-4 text-center">
    ${ability.icon}
</div>

<div class="text-2xl font-bold text-center mb-2">
    ${ability.name}
</div>

<div class="text-center text-cyan-400 mb-6">
    ${ability.shortDescription}
</div>

<div class="ability-description mb-6">
    ${formatAbilityDescription(
        ability.description
    )}
</div>

<div class="grid grid-cols-2 gap-3">

    ${renderAbilityInfo('Tipo', ability.type)}

    ${renderAbilityInfo('Profissão', ability.profession)}

    ${renderAbilityInfo('Categoria', ability.category)}

    ${renderAbilityInfo('Duração', ability.duration)}

    ${renderAbilityInfo('Defesa', ability.defense)}

    ${renderAbilityInfo('Dano', ability.damage)}

    ${renderAbilityInfo('Consumo', ability.consumption)}

    ${renderAbilityInfo('Alcance', ability.range)}

    ${renderAbilityInfo('Ação', ability.action)}

    ${renderAbilityInfo('Custo', ability.unlockCost)}

</div>
`;

const button =
    document.getElementById(
        'addAbilityBtn'
    );

if (inventoryAbility) {

    button.innerText =
        inventoryAbility.active
            ? 'Desativar Magia'
            : 'Ativar Magia';

    button.className = `
        w-full
        mt-3
        py-3
        rounded-xl
        font-bold
        text-base
        transition-all
        duration-200
        text-white
        ${inventoryAbility.active
            ? 'bg-red-700 hover:bg-red-600'
            : 'bg-green-700 hover:bg-green-600'}
    `;

    button.onclick = () => {

        toggleAbilityActive(id);
    };

} else {

    button.innerText =
        'Adicionar Habilidade';

    button.className = `
        w-full
        mt-3
        py-3
        rounded-xl
        font-bold
        text-base
        transition-all
        duration-200
        text-white
        bg-blue-700
        hover:bg-blue-600
    `;

    button.onclick = () => {

        addAbility(id);

        closeAbilityDetailsModal();
    };
}

    document
        .getElementById('abilityDetailsModal')
        .classList.remove('hidden');

    document
        .getElementById('abilityDetailsModal')
        .classList.add('modal-open');
}

function closeAbilityDetailsModal() {

    document
        .getElementById('abilityDetailsModal')
        .classList.add('hidden');

    document
        .getElementById('abilityDetailsModal')
        .classList.remove('modal-open');
}