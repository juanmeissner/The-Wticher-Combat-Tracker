function openConditionMenu() {
    if (!selectedId) { showToast('Por favor, Selecione um alvo!'); return; }
    const container = document.getElementById('circleContainer');
    
    const conditions = [
        { icon: '😍', name: 'Enfeitiçado.' },
        { icon: '😱', name: 'Medo.' },
        { icon: '🚫', name: 'Incapacitado.' },
        { icon: '😵', name: 'Inconsciente.' },
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
        { icon: '🛢️', name: 'Inflamável.' },
        { icon: '🕸️', name: 'Grudado.' },
        { icon: '💉', name: 'Vício em Fisstech.' },
        { icon: '🥶', name: 'Abstinência de Fisstech.' },
        { icon: '🤪', name: 'Alegria Delirante.' },
        { icon: '🧴', name: 'Cura Potencializada.' },
        { icon: '🍽️', name: 'Faminto.' },
        { icon: '🧼', name: 'Falta de Higiene.' },
        { icon: '🥱', name: 'Privação de Sono.' },
        { icon: '🪵', name: 'Desconfortável.' },
        { icon: '🍲', name: 'Bem Alimentado.' },
        { icon: '🛁', name: 'Revigorado.' },
        { icon: '🌙', name: 'Bem Descansado.' }
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

    '🏋️': {
        title: 'Carregando Peso',
        active: 0,
        stack: 1,
        augment: 'debuff',
        desc: 'A carga equipada ultrapassou a capacidade do personagem. Todo o peso equipado é descontado do Movimento, respeitando o mínimo base de 5. O status é removido automaticamente ao reduzir a carga.'
    },

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

    '😵': {
        title: 'Inconsciente',
        active: 0,
        stack: 1,
        augment: "debuff",
        desc: 'O alvo está inconsciente, não pode agir nem se defender até ser despertado ou até que a causa seja removida.'
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
        desc: 'Percepção exclusivamente visual falha automaticamente. Sofre desvantagem em ataques, defesas, Esquiva e Percepção que dependam da visão; ataques contra o alvo têm vantagem, o Movimento é reduzido pela metade sem orientação e reações que exijam visão ficam indisponíveis.'
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
        desc: 'Sofre −4 em Percepção, −2 em Dedução e Percepção Humana, além de desvantagem em todos os testes de Ataque, Defesa, Percepção e Esquiva.'
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
        desc: 'Pode incendiar quando exposto a faíscas. Enquanto estiver sob o efeito de Inflamador, todo dano de Fogo recebido é dobrado.'
    },

    '🕸️': {
        title: 'Grudado',
        active: 0,
        stack: 1,
        augment: 'control',
        desc: 'Movimento 0 e não pode Esquivar. Ainda pode atacar e bloquear. Pode gastar uma ação e passar em Físico ND 16 para se libertar.'
    },

    '💉': {
        title: 'Vício em Fisstech',
        active: 0,
        stack: 5,
        augment: 'debuff',
        desc: 'Dependência permanente e acumulativa. Uma falha em Tolerância ND 20 após usar Fisstech aumenta o Vício em 1 pilha. O tratamento reduz as pilhas individualmente.'
    },

    '🥶': {
        title: 'Abstinência de Fisstech',
        active: 0,
        stack: 5,
        augment: 'debuff',
        desc: '1 pilha: −2 em Percepção e Tolerância. 2: −2 em todos os testes. 3: desvantagem em todos os testes. 4: recuperação de HP e EST pela metade. 5: também fica Exausto. Usar Fisstech alivia 1 pilha.'
    },

    '🤪': {
        title: 'Alegria Delirante',
        active: 120,
        stack: 1,
        augment: 'condition',
        desc: '+2 em Carisma social, Sedução e Persuasão, com vantagem em Coragem e resistência a Medo. Sofre −2 em Dedução, Percepção Humana e Resistir à Coerção, além de desvantagem para perceber mentiras e intenções hostis.'
    },

    '🧴': {
        title: 'Cura Potencializada',
        active: 20,
        stack: 1,
        augment: 'buff',
        desc: 'Toda cura real de HP recebida é dobrada. Não aumenta PV temporários nem Escudo Mágico e nunca ultrapassa o HP máximo.'
    },

    '🍽️': {
        title: 'Faminto',
        active: 0,
        stack: 99,
        augment: 'debuff',
        desc: 'Cada dia sem alimentação adiciona 1 pilha e aplica −1 por pilha nas perícias físicas. Uma refeição remove todas as pilhas.'
    },

    '🧼': {
        title: 'Falta de Higiene',
        active: 0,
        stack: 99,
        augment: 'debuff',
        desc: 'Cada período sem banho adiciona 1 pilha e aplica −1 por pilha em Aparência e Estilo, Persuasão, Sedução e Etiqueta Social.'
    },

    '🥱': {
        title: 'Privação de Sono',
        active: 0,
        stack: 99,
        augment: 'debuff',
        desc: 'Cada período sem dormir adiciona 1 pilha e aplica −1 por pilha nas perícias físicas e de concentração, incluindo Físico.'
    },

    '🪵': {
        title: 'Desconfortável',
        active: 0,
        stack: 1,
        augment: 'debuff',
        desc: 'Descanso inadequado. O personagem realiza todos os testes físicos com desvantagem até descansar adequadamente.'
    },

    '🍲': {
        title: 'Bem Alimentado',
        active: 0,
        stack: 2,
        augment: 'buff',
        desc: 'Refeição Boa concede 1 pilha e Refeição Sofisticada concede 2. Cada pilha concede Adrenalina e recursos temporários conforme o serviço.'
    },

    '🛁': {
        title: 'Revigorado',
        active: 0,
        stack: 2,
        augment: 'buff',
        desc: 'Cada pilha concede +1 em Sedução, Persuasão, Belas Artes e Aparência e Estilo, além dos recursos temporários do banho.'
    },

    '🌙': {
        title: 'Bem Descansado',
        active: 0,
        stack: 2,
        augment: 'buff',
        desc: 'Hospedaria de Qualidade concede 1 pilha e Hospedaria Chique concede 2, com recursos temporários e Adrenalina conforme o serviço.'
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
