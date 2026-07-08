function openEffectModal() {

    if (!selectedId) {

        showToast('Selecione um alvo.');

        return;

    }

    document.getElementById('effectModal').style.display = 'flex';

    document.getElementById('effectList').innerHTML = '';

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

    const database =
    type === 'ability'
        ? predefinedAbilities.filter(a => a.hasOwnProperty('active'))
        : predefinedItems.filter(i => i.hasOwnProperty('active'));

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
    
            combatant.effects.push({

                id: source.id,
            
                type: type,
            
                name: source.name,
            
                remainingTurns: source.active,
            
                initialTurns: source.active,
            
                stacks: 1,
            
                maxStacks: source.stack ?? 1,
            
                augment: source.augment ?? "buff"
            
            });

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

    combatant.effects =
        combatant.effects.filter(e=>

            !(e.id===id && e.type===type)

        );

    savePlayersToStorage();

    renderList(false);

    showToast("🗑️ Efeito removido");

}

window.removeEffect = removeEffect;