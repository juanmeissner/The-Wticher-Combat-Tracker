function openConditionMenu() {
    if (!selectedId) { showToast('Por favor, Selecione um alvo!'); return; }
    const container = document.getElementById('circleContainer');
    
    const conditions = [
        { icon: '😍', name: 'Enfeitiçado.' },
        { icon: '😱', name: 'Medo.' },
        { icon: '🚫', name: 'Incapacitado.' },
        { icon: '👻', name: 'Invisí­vel.' },
        { icon: '🐍', name: 'Envenenado.' },
        { icon: '🧎', name: 'Caí­do' },
        { icon: '😮', name: 'Exausto.' },
        { icon: '🔥', name: 'Em Chamas' },
        { icon: '💫', name: 'Atordoado.' },
        { icon: '🩸', name: 'Sangrando.' },
        { icon: '🧊', name: 'Congelado.' },
        { icon: '⚖️', name: 'Desequilibrado.' },
        { icon: '🙈', name: 'Cego.' },
        { icon: '🤐', name: 'Silenciado.' },
        { icon: '⛓️', name: 'Aprisionado.' },
        { icon: '🧛', name: 'Vampiro.' },
        { icon: '🌀', name: 'Alucinado.' },
        { icon: '🍷', name: 'Intoxicado.' },
        { icon: '🛢️', name: 'Inflamável.' }
];

const selectedCombatant = combatants.find(comp => comp.id === selectedId);
const renderConditionButton = cond => {
    const active = (selectedCombatant?.effects || []).some(effect =>
        effect.type === 'condition' && effect.id === cond.icon
    );
    const activeClass = active ? ' condition-grid-option-active' : '';

    return `
        <button
            type="button"
            class="condition-grid-option${activeClass}"
            onclick="toggleCondition('${cond.icon}')"
            onmousedown="startConditionPress('${cond.icon}')"
            onmouseup="cancelConditionPress()"
            onmouseleave="cancelConditionPress()"
            ontouchstart="startConditionPress('${cond.icon}')"
            ontouchend="cancelConditionPress()"
            aria-label="${cond.name}"
            aria-pressed="${active}"
        >
            <span class="condition-grid-icon" aria-hidden="true">${cond.icon}</span>
            <span class="condition-grid-label">${cond.name}</span>
        </button>
    `;
};

container.classList.add('condition-menu-grid');
container.innerHTML = `
    <div class="condition-menu-header">
        <div>
            <h2>Condições</h2>
            <p>Toque para aplicar ou remover. Segure para ver os detalhes.</p>
        </div>
        <button type="button" class="condition-menu-close" onclick="closeConditionMenu(event, true)" aria-label="Fechar condições">×</button>
    </div>
    <div class="condition-grid" role="group" aria-label="Condições disponíveis">
        ${conditions.map(renderConditionButton).join('')}
    </div>
`;
    document.getElementById('circularMenu').style.display = 'flex';
}

function closeConditionMenu(e, force = false) {
    if (force || (e && e.target.id === 'circularMenu')) {
        document.getElementById('circularMenu').style.display = 'none';
    }
}

function toggleCondition(icon) {

    if (!selectedId) return;

    const combatant =
        combatants.find(c => c.id === selectedId);

    if (!combatant) return;

    if (!combatant.effects)
        combatant.effects = [];

    const effectIndex =
        combatant.effects.findIndex(e =>

            e.type === 'condition' &&
            e.id === icon

        );

    if (effectIndex !== -1) {

        combatant.effects.splice(effectIndex, 1);

    } else {

        const info = conditionDescriptions[icon];

        combatant.effects.push({

            id: icon,
        
            type: "condition",
        
            name: info.title,
        
            remainingTurns: info.active,
        
            initialTurns: info.active,
        
            stacks: 1,
        
            maxStacks: info.stack,
        
            augment: info.augment
        
        });

    }

    savePlayersToStorage();

    updateCardTargeted(combatant);

    document.getElementById('circularMenu').style.display = 'none';

    setTimeout(() => {

        openConditionMenu();

    }, 0);

}

const conditionDescriptions = {

    '😍': {
        title: 'Enfeitiçado',
        active: 0,
        stack: 1,
        augment: "debuff",
        desc: 'A criatura fica encantada e não pode atacar quem a enfeitiçou.'
    },
    
    '😱': {
        title: 'Medo',
        active: 0,
        stack: 1,
        augment: "debuff",
        desc: 'Movimento reduzido pela metade, se falhar em teste de Coragem irá ficar paralisado durante o turno inteiro.'
    },
    
    '🚫': {
        title: 'Incapacitado',
        active: 0,
        stack: 1,
        augment: "condition",
        desc: 'O alvo ficará desmaiado até passar em um teste de resistência ND 18.'
    },
    
    '👻': {
        title: 'Invisí­vel',
        active: 0,
        stack: 1,
        augment: "buff",
        desc: 'Dí­ficil de detectar visualmente e recebe vantagens apropriadas.'
    },
    
    '🐍': {
        title: 'Envenenado',
        active: 0,
        stack: 10,
        augment: "debuff",
        desc: 'Sofre 1d6 de dano por turno e -2 em testes físicos. Pode fazer um teste de resistência ao fim de cada turno para encerrar o efeito.												'
    },
    
    '🧎': {
        title: 'Caí­do',
        active: 0,
        stack: 1,
        augment: "debuff",
        desc: 'Sofre desvantagem em ataques corpo a corpo, ataques contra ele tem vantagem, e levantar-se consome uma ação, pode esquivar ou bloquear.'
    },
    
    '😮': {
        title: 'Exausto',
        active: 0,
        stack: 1,
        augment: "debuff",
        desc: 'A criatura sofre penalidades fí­sica progressivas.'
    },
    
    '🔥': {
        title: 'Em Chamas',
        active: 0,
        stack: 10,
        augment: "debuff",
        desc: 'Sofre 1d6 de dano por turno até apagar o fogo (ação completa ou teste apropriado). Testes físicos sofrem -2 enquanto estiver em chamas.'
    },
    
    '💫': {
        title: 'Atordoado',
        active: 1,
        stack: 1,
        augment: "debuff",
        desc: 'O personagem perde a próxima ação e não pode realizar defesa ou esquiva até o fim do próximo turno.'
    },
    
    '🩸': {
        title: 'Sangrando',
        active: 0,
        stack: 10,
        augment: "debuff",
        desc: 'Sofre 1d6 de dano por turno até receber primeiros socorros ou ser curado. O efeito acumula se reaplicado.'
    },
    
    '🧊': {
        title: 'Congelado',
        active: 0,
        stack: 1,
        augment: "debuff",
        desc: 'Movimento reduzido pela metade e desvantagem em ações físicas. Se falhar em um teste de resistência, fica Atordoado por 1 turno.'
    },
    
    '⚖️': {
        title: 'Desequilibrado',
        active: 0,
        stack: 1,
        augment: "debuff",
        desc: 'Sofre -2 em ataques e defesas e não pode realizar reações até o próximo turno.'
    },

    '🙈': {
        title: 'Cego',
        active: 0,
        stack: 1,
        augment: "debuff",
        desc: 'Não enxerga o campo de batalha e sofre as penalidades definidas pelo mestre.'
    },

    '🤐': {
        title: 'Silenciado',
        active: 0,
        stack: 1,
        augment: "debuff",
        desc: 'Não consegue falar ou conjurar magias verbais enquanto o efeito durar.'
    },

    '⛓️': {
        title: 'Aprisionado',
        active: 0,
        stack: 1,
        augment: "control",
        desc: 'Não pode se mover ou realizar ações físicas enquanto estiver preso.'
    },

    '🧛': {
        title: 'Vampiro',
        active: 0,
        stack: 1,
        augment: "condition",
        desc: 'Criatura vampírica: sofre Sangue Negro ao atacar um alvo protegido.'
    },

    '🌀': {
        title: 'Alucinado',
        active: 0,
        stack: 1,
        augment: "debuff",
        desc: 'Sofre alucinações até superar o teste de resistência definido pelo mestre.'
    },

    '🍷': {
        title: 'Intoxicado',
        active: 0,
        stack: 1,
        augment: "debuff",
        desc: 'Está intoxicado e sujeito aos efeitos definidos pela substância aplicada.'
    },

    '🛢️': {
        title: 'Inflamável',
        active: 0,
        stack: 1,
        augment: "debuff",
        desc: 'Pode incendiar quando exposto a faíscas; dano de fogo é resolvido conforme a regra do item.'
    }
    };

    function getConditionEffect(icon) {

        const data = conditionDescriptions[icon];
    
        if (!data)
            return null;
    
        return {
    
            id: icon,
    
            type: 'condition',
    
            icon: icon,
    
            name: data.title,
    
            shortDescription: data.desc,
    
            remainingTurns: 0
    
        };
    
    }

    window.openConditionMenu = openConditionMenu;
    window.closeConditionMenu = closeConditionMenu;
    window.toggleCondition = toggleCondition;
