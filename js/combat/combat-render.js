    function renderList(shouldScroll = false) {
        const container = document.getElementById('combatList');
        container.innerHTML = "";

        if (combatants.length === 0) {
            container.innerHTML = `<div class="text-slate-600 text-center mt-10">Lista vazia.</div>`;
            return;
        }

        let printedDivider = false;

        combatants.forEach((c) => {
            const isDeadMonster = c.type === 'monster' && c.hpCurrent <= 0;
            const isDeadPlayer = c.type === 'player' && c.deathSaves?.failures >= 3;
            const isEliminated = isDeadMonster || isDeadPlayer;

            if (isEliminated && !printedDivider) {
                const divider = document.createElement('div');
                divider.className = "eliminated-divider flex items-center gap-4 my-4 cursor-pointer hover:opacity-80 transition-opacity py-2 bg-slate-800/20 rounded-lg";
                divider.innerHTML = `
                    <div class="h-px bg-slate-700 flex-1"></div>
                    <span class="text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        Eliminados <span class="text-lg">${showEliminated ? '▼' : '▶'}</span>
                    </span>
                    <div class="h-px bg-slate-700 flex-1"></div>
                `;
                container.appendChild(divider);
                printedDivider = true;
            }

            if (isEliminated && !showEliminated) return; 

            const card = document.createElement('div');
            card.id = `card-${c.id}`;
            
            const opacityClass = isEliminated
    ? 'opacity-50 grayscale'
    : (c.type === 'monster'
    ? 'bg-red-600/50'
    : 'bg-emerald-950/40');
            card.className = `combat-card border border-slate-700 p-0 rounded-2xl cursor-pointer transition-all relative overflow-hidden
                ${selectedId === c.id ? 'card-selected' : ''} 
                ${activeTurnId === c.id && !isEliminated ? 'active-turn' : ''}
                ${opacityClass}`;

            const pct = Math.max(0, Math.min(100, (c.hpCurrent / c.hpMax) * 100));
            const hpBarColor = getHPColor(pct);

            if (deleteVisibleId === c.id) {
                const overlay = document.createElement('div');
                overlay.className = "delete-overlay gap-6";
                overlay.innerHTML = `
                    <button onclick="cancelDeleteMode(event)" class="bg-slate-800 p-3 rounded-full text-slate-300">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                    ${c.presetMonsterId ? `

                    <button

                    ontouchstart="event.stopPropagation()"

                    onmousedown="event.stopPropagation()"

                    onclick="
                        event.preventDefault();
                        event.stopPropagation();

                        openCombatMonsterInfo(${c.id});
                    "

                    class="bg-cyan-700
                        p-4
                        rounded-full
                        text-white
                        shadow-xl">

                    <svg xmlns="http://www.w3.org/2000/svg"
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.5"
                        stroke-linecap="round"
                        stroke-linejoin="round">

                        <path d="M12 17V11"/>

                        <path d="M12 7h.01"/>

                        <circle cx="12" cy="12" r="10"/>

                    </svg>

                </button>

                    ` : ''}
                    
                    <button

    ontouchstart="event.stopPropagation()"

    onmousedown="event.stopPropagation()"

    onclick="
    event.preventDefault();
    event.stopPropagation();

    editCombatant(event, ${c.id});
    " class="bg-blue-600 p-4 rounded-full text-white shadow-xl">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button

    ontouchstart="event.stopPropagation()"

    onmousedown="event.stopPropagation()"

    onclick="
    event.preventDefault();
    event.stopPropagation();

    removeCombatant(event, ${c.id});
    " class="bg-white p-4 rounded-full text-red-700 shadow-xl">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2m-6 9 6-6m-6 0 6 6"/></svg>
                    </button>
                `;
                card.appendChild(overlay);
            }

            const hpColor = c.type === 'monster' ? 'text-red-500' : 'text-emerald-400';
            let statusHtml = '';

            (c.conditions || []).forEach(icon => {
                statusHtml += `<span class="status-icon">${icon}</span>`;
            });

            if (c.statusBrain) {
                statusHtml += `<span class="status-icon">🧠</span>`;
            }

            let hpDisplayHtml = `
                <div class="hp-text text-xl font-bold leading-none ${hpColor}">${c.hpCurrent}/${c.hpMax}</div>
                <div class="text-[10px] uppercase text-slate-500 font-bold tracking-wider leading-none mt-1">HP</div>
            `;
            if (isDeadMonster) {
                hpDisplayHtml = `<div class="hp-text text-3xl leading-none pt-1">💀</div>`;
            } else if (isDeadPlayer) {
                hpDisplayHtml = `
                    <div class="hp-text text-3xl leading-none pt-1">💀</div>
                    <div class="text-[10px] uppercase text-red-500 font-bold tracking-wider leading-none mt-1">Morto</div>
                `;
            } else if (c.hpCurrent <= 0 && !c.stabilized) {
                const s = c.deathSaves?.success || 0;
                const f = c.deathSaves?.failures || 0;
                hpDisplayHtml = `
                    <div class="hp-text text-xl font-bold leading-none text-red-500">0/${c.hpMax}</div>
                    <div class="text-[11px] font-bold mt-1 tracking-widest leading-none">
                        <span class="text-emerald-400">S${s}</span><span class="text-slate-500 mx-1">|</span><span class="text-red-500">F${f}</span>
                    </div>
                `;
            }

            card.innerHTML += `
                <div class="hp-bar absolute left-0 top-0 bottom-0 z-0 opacity-20 transition-all duration-500" style="width: ${pct}%; background-color: ${hpBarColor};"></div>
                <div class="relative z-10 flex justify-between items-start px-2 w-full py-2">
                    <div class="flex items-start gap-2 flex-1 min-w-0 self-start">
                        <div class="init-circle ${activeTurnId === c.id && !isEliminated ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300'} font-bold w-10 h-10 flex items-center justify-center rounded-full text-lg shrink-0 mt-1">
                            ${c.initiative}
                        </div>
                        <div class="flex flex-col items-start justify-start flex-1 min-w-0 leading-none">
                        <h3 class="
                            font-bold
                            leading-none
                            truncate
                            mb-1
                            ${c.type === 'monster' ? 'text-red-400' : ''}
                            ${c.name.length <= 10
                                ? 'text-lg'
                                : c.name.length <= 18
                                    ? 'text-base'
                                    : c.name.length <= 28
                                        ? 'text-sm'
                                        : 'text-xs'}
                        ">
                            ${c.name}
                        </h3>
                    <p class="text-slate-300
                            text-sm
                            font-semibold
                            tracking-tight
                            leading-tight
                            break-words
                            whitespace-pre-line">
                        ${c.atkInfo.replace(/\s*\/\s*/g, '<br>')}
                    </p>
                        </div>
                    </div>
                    <div class="flex items-start gap-2 shrink-0 self-start">
                                    <div class="
                                        status-container
                                        flex
                                        flex-wrap
                                        justify-end
                                        gap-1
                                        w-[52px]
                                        shrink-0
                                    ">

                            ${statusHtml}

                        </div>
    <div class="flex flex-col
        items-end
        justify-center
        text-right
        min-w-[72px]
        shrink-0">

    <div class="hp-container text-center">
    ${hpDisplayHtml}
    </div>

    <div class="mt-1 st-container">
    <div class="text-sm font-bold leading-none text-cyan-400">
        ${c.stCurrent ?? 0}/${c.stMax ?? 0}
    </div>

    <div class="text-[10px] uppercase text-cyan-600 font-bold tracking-wider leading-none mt-1 text-center">
        ST
    </div>
    </div>

    </div>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

        document.getElementById('roundCounter').innerText = round;
        if (shouldScroll) {
            const activeCard = container.querySelector('.active-turn');
            if (activeCard) activeCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function updateCardTargeted(c) {
    const card = document.getElementById(`card-${c.id}`);
    if (!card) return;

    const isDeadMonster = c.type === 'monster' && c.hpCurrent <= 0;
    const isDeadPlayer = c.type === 'player' && c.deathSaves?.failures >= 3;
    const isEliminated = isDeadMonster || isDeadPlayer;
    const pct = Math.max(0, Math.min(100, (c.hpCurrent / c.hpMax) * 100));
    const hpBarColor = getHPColor(pct);

    const hpBar = card.querySelector('.hp-bar');
    if (hpBar) {
        hpBar.style.width = `${pct}%`;
        hpBar.style.backgroundColor = hpBarColor;
    }

    const hpContainer = card.querySelector('.hp-container');

    if (hpContainer) {

    const hpColor = c.type === 'monster'
    ? 'text-red-500'
    : 'text-emerald-400';

    if (isDeadMonster) {

    hpContainer.innerHTML =
        `<div class="hp-text text-3xl leading-none pt-1">💀</div>`;

    } else if (isDeadPlayer) {

    hpContainer.innerHTML = `
        <div class="hp-text text-3xl leading-none pt-1">💀</div>
        <div class="text-[10px] uppercase text-red-500 font-bold tracking-wider leading-none mt-1">
            Morto
        </div>
    `;

    } else if (c.hpCurrent <= 0 && !c.stabilized) {

    const s = c.deathSaves?.success || 0;
    const f = c.deathSaves?.failures || 0;

    hpContainer.innerHTML = `
        <div class="hp-text text-xl font-bold leading-none text-red-500">
            0/${c.hpMax}
        </div>

        <div class="text-[11px] font-bold mt-1 tracking-widest leading-none">
            <span class="text-emerald-400">S${s}</span>
            <span class="text-slate-500 mx-1">|</span>
            <span class="text-red-500">F${f}</span>
        </div>
    `;

    } else {

    hpContainer.innerHTML = `
        <div class="hp-text text-xl font-bold leading-none ${hpColor}">
            ${c.hpCurrent}/${c.hpMax}
        </div>

        <div class="text-[10px] uppercase text-slate-500 font-bold tracking-wider leading-none mt-1">
            HP
        </div>
    `;
    }
    }

    const statusContainer = card.querySelector('.status-container');
    if (statusContainer) {
        let allStatuses = [...(c.conditions || [])];

    if (c.statusBrain)
        allStatuses.push('🧠');

    let statusHtml = allStatuses.map(icon => `

        <div class="w-5 h-5 flex items-center justify-center">
            ${icon}
        </div>

    `).join('');
        statusContainer.innerHTML = statusHtml;
    }

    // Atualiza ST
    const stContainer = card.querySelector('.st-container');

    if (stContainer) {

        stContainer.innerHTML = `
            <div class="text-sm font-bold leading-none text-cyan-400">
                ${c.stCurrent ?? 0}/${c.stMax ?? 0}
            </div>

            <div class="text-[10px] uppercase text-cyan-600 font-bold tracking-wider leading-none mt-1 text-center">
                ST
            </div>
        `;
    }

    if (isEliminated) {
        card.classList.add('opacity-50', 'grayscale');
        card.classList.remove('bg-slate-800/80', 'active-turn');
    } else {
        card.classList.remove(
        'opacity-50',
        'grayscale',
        'bg-slate-800/80',
        'bg-red-600/50',
        'bg-emerald-950/40'
        );

        card.classList.add(
        c.type === 'monster'
        ? 'bg-red-600/50'
        : 'bg-emerald-950/40'
        );
                if (activeTurnId === c.id) card.classList.add('active-turn');
            }
    }

    function selectCombatant(id, name) {

        // Se clicar novamente no mesmo alvo
        if (selectedId === id) {
        
            openEntryActionModal();
        
            return;
        }
        
        const oldSelected = selectedId;
        
        selectedId = id;
        
        document.getElementById('targetName').innerText = name;
        
        if (oldSelected) {
        
            const oldCard = document.getElementById(`card-${oldSelected}`);
        
            if (oldCard)
                oldCard.classList.remove('card-selected');
        }
        
        const newCard = document.getElementById(`card-${id}`);
        
        if (newCard)
            newCard.classList.add('card-selected');
        }

        window.renderList = renderList;
        window.updateCardTargeted = updateCardTargeted;
        window.selectCombatant = selectCombatant;