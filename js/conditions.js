function openConditionMenu() {
    if (!selectedId) { showToast('Por favor, Selecione um alvo!'); return; }
    const container = document.getElementById('circleContainer');
    container.innerHTML = `<button class="absolute top-1/2 left-1/2 -mt-6 -ml-6 w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center text-white font-bold z-10 border border-slate-500 shadow-xl" onclick="closeConditionMenu(event, true)">X</button>`;
    
    const conditions = [
        { icon: '😍', name: 'Enfeitiçado.' },
        { icon: '😱', name: 'Medo.' },
        { icon: '🚫', name: 'Incapacitado.' },
        { icon: '👻', name: 'Invisí­vel.' },
        { icon: '🐍', name: 'Envenado.' },
        { icon: '🧎', name: 'Caí­do' },
        { icon: '😮', name: 'Exausto.' },
        { icon: '🔥', name: 'Em Chamas' },
        { icon: '💫', name: 'Atordoado.' },
        { icon: '🩸', name: 'Sangrando.' },
        { icon: '🧊', name: 'Congelado.' },
        { icon: '⚖️', name: 'Desequilibrado.' }
];

const innerRadius = 95;
const outerRadius = 190;

conditions.forEach((cond, i) => {

// Divide em dois anéis
const isOuter = i >= Math.ceil(conditions.length / 2);

const ringConditions = isOuter
? conditions.slice(Math.ceil(conditions.length / 2))
: conditions.slice(0, Math.ceil(conditions.length / 2));

const localIndex = isOuter
? i - Math.ceil(conditions.length / 2)
: i;

const radius = isOuter ? outerRadius : innerRadius;

const angle =
(localIndex * (360 / ringConditions.length) - 90)
* (Math.PI / 180);

const x = Math.cos(angle) * radius;
const y = Math.sin(angle) * radius;

const el = document.createElement('div');

el.className =
"absolute top-1/2 left-1/2 -mt-6 -ml-6 w-12 h-12 flex flex-col items-center justify-center";

el.style.transform = `translate(${x}px, ${y}px)`;

const c = combatants.find(comp => comp.id === selectedId);

const isActive =
Array.isArray(c.conditions) &&
c.conditions.includes(cond.icon);

const bgClass = isActive
? 'bg-blue-600 border-blue-400'
: 'bg-slate-800 border-slate-600';

el.innerHTML = `
<button
onclick="toggleCondition('${cond.icon}')"

onmousedown="startConditionPress('${cond.icon}')"
onmouseup="cancelConditionPress()"
onmouseleave="cancelConditionPress()"

ontouchstart="startConditionPress('${cond.icon}')"
ontouchend="cancelConditionPress()"
    class="w-12 h-12 rounded-full text-2xl flex items-center justify-center border ${bgClass} shadow-lg active:scale-90 transition-transform">

    ${cond.icon}

</button>

<span class="text-[10px] text-slate-200 mt-1 font-bold bg-slate-900/80 px-1 rounded whitespace-nowrap">
    ${cond.name}
</span>
`;

container.appendChild(el);
});

    document.getElementById('circularMenu').style.display = 'flex';
}

function closeConditionMenu(e, force = false) {
    if (force || (e && e.target.id === 'circularMenu')) {
        document.getElementById('circularMenu').style.display = 'none';
    }
}

function toggleCondition(icon) {
    if (!selectedId) return;
    const index = combatants.findIndex(c => c.id === selectedId);
    if (index !== -1) {
        if (!combatants[index].conditions) combatants[index].conditions = [];
        
        const condIndex = combatants[index].conditions.indexOf(icon);
        if (condIndex !== -1) {
            combatants[index].conditions.splice(condIndex, 1);
        } else {
            combatants[index].conditions.push(icon);
        }
        
        savePlayersToStorage();
        updateCardTargeted(combatants[index]);
        document.getElementById('circularMenu').style.display = 'none';

        setTimeout(() => {
            openConditionMenu();
        }, 0);
    }
}

const conditionDescriptions = {

    '😍': {
        title: 'Enfeitiçado',
        desc: 'A criatura fica encantada e não pode atacar quem a enfeitiçou.'
    },
    
    '😱': {
        title: 'Medo',
        desc: 'Movimento reduzido pela metade, se falhar em teste de Coragem irá ficar paralisado durante o turno inteiro.'
    },
    
    '🚫': {
        title: 'Incapacitado',
        desc: 'O alvo ficará desmaiado até passar em um teste de resistência ND 18.'
    },
    
    '👻': {
        title: 'Invisé­vel',
        desc: 'Dí­ficil de detectar visualmente e recebe vantagens apropriadas.'
    },
    
    '🐍': {
        title: 'Envenenado',
        desc: 'Sofre 1d6 de dano por turno e -2 em testes físicos. Pode fazer um teste de resistência ao fim de cada turno para encerrar o efeito.												'
    },
    
    '🧎': {
        title: 'Caí­do',
        desc: 'Sofre desvantagem em ataques corpo a corpo, ataques contra ele tem vantagem, e levantar-se consome uma ação, pode esquivar ou bloquear.'
    },
    
    '😮': {
        title: 'Exausto',
        desc: 'A criatura sofre penalidades fí­sica progressivas.'
    },
    
    '🔥': {
        title: 'Em Chamas',
        desc: 'Sofre 1d6 de dano por turno até apagar o fogo (ação completa ou teste apropriado). Testes físicos sofrem -2 enquanto estiver em chamas.'
    },
    
    '💫': {
        title: 'Atordoado',
        desc: 'O personagem perde a próxima ação e não pode realizar defesa ou esquiva até o fim do prÃ³ximo turno.'
    },
    
    '🩸': {
        title: 'Sangrando',
        desc: 'Sofre 1d6 de dano por turno até receber primeiros socorros ou ser curado. O efeito acumula se reaplicado.'
    },
    
    '🧊': {
        title: 'Congelado',
        desc: 'Movimento reduzido pela metade e desvantagem em ações físicas. Se falhar em um teste de resistência, fica Atordoado por 1 turno.'
    },
    
    '⚖️': {
        title: 'Desequilibrado',
        desc: 'Sofre -2 em ataques e defesas e não pode realizar reações até o próximo turno.'
    }
    };

    window.openConditionMenu = openConditionMenu;
    window.closeConditionMenu = closeConditionMenu;
    window.toggleCondition = toggleCondition;