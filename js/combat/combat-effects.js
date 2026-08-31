function renderEffectApplicationContext() {
    const modal = document.getElementById('effectModal');
    const title = modal?.querySelector('h2');
    const target = combatants.find(combatant => combatant.id === selectedId);
    const caster = combatants.find(combatant => combatant.id === activeTurnId);

    if (!modal || !title || !target) return;

    let context = document.getElementById('effectApplicationContext');
    if (!context) {
        context = document.createElement('div');
        context.id = 'effectApplicationContext';
        context.className = 'effect-application-context';
        context.setAttribute('aria-live', 'polite');
        title.insertAdjacentElement('afterend', context);
    }

    context.textContent = caster
        ? `Turno: ${caster.name}  →  Alvo: ${target.name}`
        : `Sem turno ativo  →  Alvo: ${target.name}`;
}

function openEffectModal() {

    if (!selectedId) {

        showToast('Selecione um alvo.');

        return;

    }

    window.ensureActiveTurnCharacterCollectionContext?.();

    document.getElementById('effectModal').style.display = 'flex';

    document.getElementById('effectList').innerHTML = '';

    renderEffectApplicationContext();

}


function closeEffectModal() {

    document.getElementById('effectModal').style.display = 'none';

}

window.openEffectModal = openEffectModal;

window.closeEffectModal = closeEffectModal;

function showEffectList(type) {

    const list = document.getElementById('effectList');

    const combatant = combatants.find(c => c.id === selectedId);

    if (!combatant) return;

    renderEffectApplicationContext();

    window.ensureActiveTurnCharacterCollectionContext?.();

    const database = type === 'ability'
        ? abilitiesInventory.filter(ability => ability.hasOwnProperty('active'))
        : inventory.filter(item =>
            item.hasOwnProperty('active') &&
            (item.id === 'coroa' || Math.max(0, Number(item.quantity) || 0) > 0)
        );

    if (database.length === 0) {
        const ownerName = window.getCharacterCollectionContextInfo?.().name || 'o personagem do turno';
        const safeOwnerName = window.escapeCharacterCollectionHtml?.(ownerName) || 'o personagem do turno';
        list.innerHTML = `
            <div class="effect-list-empty">
                Nenhum ${type === 'ability' ? 'efeito de habilidade' : 'efeito de item'} disponível para ${safeOwnerName}.
                <small>Adicione primeiro pela aba ${type === 'ability' ? 'Habilidades' : 'Itens'}.</small>
            </div>
        `;
        return;
    }

    list.innerHTML = database.map(effect => {

        const active = combatant.effects.some(e =>
            e.id === effect.id &&
            e.type === type
        );

        return `

            <div

                class="
                    effect-select-card
                    ${active ? 'effect-selected' : ''}
                "

                onclick="toggleEffect('${type}','${effect.id}')"

            >

                <div class="flex items-center gap-3">

                    <div class="text-3xl">

                        ${
                            effect.icon
                                ? effect.icon.startsWith('http')
                                    ? `<img src="${effect.icon}" class="w-10 h-10 object-contain">`
                                    : effect.icon
                                : '✨'
                        }

                    </div>

                    <div class="flex-1">

                        <div class="font-bold">

                            ${effect.name}

                        </div>

                        <div class="text-sm text-slate-400">

                            ${effect.shortDescription}

                        </div>

                    </div>

                    ${
                        active
                        ? `<div class="text-green-400 text-xl">✓</div>`
                        : ''
                    }

                </div>

            </div>

        `;

    }).join('');

}

function toggleEffect(type,id){

    const combatant =
        combatants.find(c => c.id===selectedId);

    if(!combatant) return;

    if(!combatant.effects)
        combatant.effects=[];

    const index =
        combatant.effects.findIndex(e=>

            e.id===id &&
            e.type===type

        );

    if(index==-1){

        const source =
        type === 'ability'
            ? predefinedAbilities.find(a => a.id === id)
            : predefinedItems.find(i => i.id === id);

        const automationMetadata =
            window.consumeAutomationEffectApplication?.(combatant, type, id);

        const staminaCost = Math.max(0, Number(automationMetadata?.staminaCost) || 0);
        const staminaPayer = staminaCost > 0
            ? combatants.find(current =>
                String(current.id) === String(automationMetadata?.staminaPayerId)
            )
            : null;

        const energyAvailability = staminaPayer
            ? window.getAutomationEnergyAvailability?.(staminaPayer, automationMetadata)
                || { total: Math.max(0, Number(staminaPayer.stCurrent) || 0) }
            : { total: 0 };

        if (staminaCost > 0 && (!staminaPayer || staminaCost > energyAvailability.total)) {
            showToast(automationMetadata?.prioritizeRuneSource
                ? "O personagem do turno não possui Fonte Rúnica/EST suficiente para aplicar este Sinal."
                : "O personagem do turno não possui EST suficiente para aplicar este efeito.");
            return;
        }
    
        const appliedEffect = {

            id: source.id,
            
            type: type,
            
            name: source.name,
            
            remainingTurns: source.active,
            
            initialTurns: source.active,
            
            stacks: 1,
            
            maxStacks: source.stack ?? 1,
            
            augment: source.augment ?? "buff"
        };

        if (automationMetadata) {
            appliedEffect.automation = automationMetadata;

            if (Number.isInteger(automationMetadata.duration)) {
                appliedEffect.remainingTurns = automationMetadata.duration;
                appliedEffect.initialTurns = automationMetadata.duration;
            }

            if (Number.isInteger(automationMetadata.stacks)) {
                appliedEffect.stacks = automationMetadata.stacks;
            }

            if (staminaCost > 0) {
                if (typeof window.spendAutomationEnergy === 'function') {
                    if (!window.spendAutomationEnergy(staminaPayer, automationMetadata)) {
                        showToast("Não foi possível consumir os recursos do personagem do turno.");
                        return;
                    }
                } else {
                    automationMetadata.staminaBefore = Math.max(0, Number(staminaPayer.stCurrent) || 0);
                    staminaPayer.stCurrent = Math.max(0, automationMetadata.staminaBefore - staminaCost);
                    automationMetadata.staminaAfter = staminaPayer.stCurrent;
                }
            }
        }

        combatant.effects.push(appliedEffect);

        showToast("✨ Efeito aplicado");

    }

    else{

        combatant.effects.splice(index,1);

        showToast("🗑️ Efeito removido");

    }

    savePlayersToStorage();

    showEffectList(type);

    renderList(false);

}

window.showEffectList = showEffectList;
window.toggleEffect = toggleEffect;

function removeEffect(combatantId,type,id){

    const combatant =
        combatants.find(c=>c.id===combatantId);

    if(!combatant) return;

    const effect = combatant.effects?.find(entry => entry.id === id && entry.type === type);
    if (effect?.systemManaged === 'encumbrance') {
        showToast('⚖️ Reduza o peso equipado para remover Carregando Peso.');
        return;
    }

    combatant.effects =
        combatant.effects.filter(e=>

            !(e.id===id && e.type===type)

        );

    savePlayersToStorage();

    renderList(false);

    showToast("🗑️ Efeito removido");

}

window.removeEffect = removeEffect;
