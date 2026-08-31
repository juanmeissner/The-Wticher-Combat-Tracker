(function initializeInventoryFilters(root) {
    const FILTERS = Object.freeze({
        usable: Object.freeze([
            { id: 'all', label: 'Todos', icon: '◉' },
            { id: 'food', label: 'Comidas', icon: '🍲' },
            { id: 'drink', label: 'Bebidas', icon: '🥤' },
            { id: 'potion', label: 'Poções', icon: '🧪' },
            { id: 'throwable', label: 'Arremessáveis', icon: '💣' },
            { id: 'witcher-potion', label: 'Poções de Witcher', icon: '🐺' },
            { id: 'oil', label: 'Óleos', icon: '🫗' }
        ]),
        equipment: Object.freeze([
            { id: 'all', label: 'Todos', icon: '◉' },
            { id: 'ammunition', label: 'Munições', icon: '🏹' },
            { id: 'sword', label: 'Espadas', icon: '⚔️' },
            { id: 'bow', label: 'Arcos', icon: '🏹' },
            { id: 'crossbow', label: 'Bestas', icon: '🎯' },
            { id: 'axe', label: 'Machados', icon: '🪓' },
            { id: 'dagger', label: 'Adagas', icon: '🗡️' },
            { id: 'staff', label: 'Cajados', icon: '🪄' },
            { id: 'spear', label: 'Lanças', icon: '🔱' },
            { id: 'hammer', label: 'Martelos', icon: '🔨' },
            { id: 'shield', label: 'Escudos', icon: '🛡️' },
            { id: 'armor-body', label: 'Armadura Corpo', icon: '🥋' },
            { id: 'armor-arms', label: 'Armadura Braço', icon: '🦾' },
            { id: 'armor-legs', label: 'Armadura Perna', icon: '🦿' },
            { id: 'armor-head', label: 'Armadura Cabeça', icon: '⛑️' }
        ]),
        misc: Object.freeze([
            { id: 'all', label: 'Todos', icon: '◉' },
            { id: 'culinary', label: 'Comidas', icon: '🥕' },
            { id: 'monster', label: 'Itens de Monstro', icon: '👹' },
            { id: 'herb', label: 'Ervas', icon: '🌿' },
            { id: 'ore', label: 'Minérios', icon: '⛏️' },
            { id: 'metal', label: 'Metais', icon: '⚙️' },
            { id: 'natural', label: 'Naturais', icon: '🪵' }
        ])
    });

    const THROWABLE_IDS = new Set([
        'solucaoacida', 'adesivoalquimico', 'furiadebredan', 'lagrimasdetalgar',
        'fogodazerikania', 'podelua', 'podedimeritio', 'bafodedragao', 'samun',
        'bombadeestilhacos'
    ]);

    const OIL_IDS = new Set(['venenodoenforcado']);

    const CULINARY_IDS = new Set([
        'cereais', 'carneseca', 'sal', 'carne', 'legumes', 'ervasculinarias',
        'carnenobre', 'aguabruta', 'lupulo', 'levedura', 'uvasdetoussaint',
        'carnedecoelho', 'carnedeveado', 'carnedeporco', 'batata', 'cebola',
        'cenoura', 'alho', 'cogumeloscomestiveis', 'farinha', 'ovos', 'leite',
        'manteiga', 'mel', 'hidromel'
    ]);

    const METAL_IDS = new Set([
        'ferro', 'aco', 'ferronegro', 'aconegro', 'acodemahakam', 'acodetretogor',
        'dimeritio', 'dimeritiodemahakam', 'ouro', 'meteorito', 'prata',
        'podeprata', 'nitratodeprata', 'estilhacosdeferro'
    ]);

    function normalize(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, ' ')
            .trim();
    }

    function includesAny(text, fragments) {
        return fragments.some(fragment => text.includes(fragment));
    }

    function getUsableTags(item, text) {
        if (item?.careConsumable?.kind === 'food') return ['food'];
        if (item?.careConsumable?.kind === 'drink') return ['drink'];
        if (OIL_IDS.has(item.id) || String(item.id || '').startsWith('oleode') || text.includes(' oleo de ')) return ['oil'];
        if (Number.isFinite(Number(item?.toxicity)) && item?.toxicity !== '') return ['witcher-potion'];
        if (THROWABLE_IDS.has(item.id)) return ['throwable'];

        return ['potion'];
    }

    function getEquipmentTags(item, text) {
        const slot = String(item?.equipmentSlot || '').toLowerCase();

        if (slot === 'ammunition') return ['ammunition'];
        if (slot === 'shield') return ['shield'];
        if (slot === 'body') return ['armor-body'];
        if (slot === 'arms') return ['armor-arms'];
        if (slot === 'legs') return ['armor-legs'];
        if (slot === 'head') return ['armor-head'];
        if (item?.type !== 'weapon') return [];

        if (text.includes('besta')) return ['crossbow'];
        if (text.includes('arco')) return ['bow'];
        if (includesAny(text, ['adaga', 'estilete', 'punhal', 'jambiya', 'cutelo'])) return ['dagger'];
        if (includesAny(text, ['machado', 'acha de arma'])) return ['axe'];
        if (text.includes('cajado')) return ['staff'];
        if (includesAny(text, ['lanca', 'alabarda', 'glaive'])) return ['spear'];
        if (includesAny(text, ['martelo', 'maca'])) return ['hammer'];
        if (item?.weaponType === 'Arco e Flecha') return ['bow'];
        if (item?.weaponType === 'Brigar') return ['hammer'];
        if (item?.weaponType === 'Esgrima') return ['sword'];

        return [];
    }

    function getMiscTags(item, text) {
        const tags = [];

        if (CULINARY_IDS.has(item.id)) tags.push('culinary');
        if (text.includes('minerio')) tags.push('ore');
        if (METAL_IDS.has(item.id)) tags.push('metal');

        if (includesAny(text, [
            'afogador', 'aracna', 'carnical', 'demonio', 'draconideo', 'endriga',
            'feras', 'golem', 'lobisomem', 'ogro', 'troll', 'vampiro', 'wyvern',
            'bruxa sepulcral', 'po espectral'
        ])) tags.push('monster');

        if (includesAny(text, [
            'aconito', 'cogumelo', 'folhas', 'fruta', 'ginatia', 'heleboro',
            'lupulo', 'madressilva', 'mandragora', 'mirto', 'mofo verde',
            'pequena cicuta', 'petalas', 'quelidonia', 'raiz de pimenta',
            'scleroderma', 'seiva branca', 'sempre viva', 'verbena', 'visco',
            'ervas culinarias'
        ])) tags.push('herb');

        if (includesAny(text, [
            'agua ', 'argila', 'carvao', 'cera', 'couro', 'gordura', 'linha',
            'linho', 'madeira', 'ossos', 'pedra', 'penas', 'sebo'
        ])) tags.push('natural');

        return [...new Set(tags)];
    }

    function getTags(item, category = item?.category) {
        if (!item || !FILTERS[category]) return [];
        const text = normalize(`${item.id || ''} ${item.name || ''}`);

        if (category === 'usable') return getUsableTags(item, text);
        if (category === 'equipment') return getEquipmentTags(item, text);
        if (category === 'misc') return getMiscTags(item, text);
        return [];
    }

    function matches(item, category, filterId) {
        if (!item || item.category !== category) return false;
        if (!filterId || filterId === 'all') return true;
        return getTags(item, category).includes(filterId);
    }

    function getDefinitions(category) {
        return FILTERS[category] || [];
    }

    root.inventoryFilterSystem = Object.freeze({ getDefinitions, getTags, matches, normalize });
})(typeof window !== 'undefined' ? window : globalThis);
