(function (root, factory) {
    const model = root?.worldModel
        || (typeof require === 'function' ? require('./world-model.js') : null);
    const api = factory(model);

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.worldAtlasData = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (model) {
    'use strict';

    const POLITICAL_ATLAS_VERSION = 1;
    const ROOT_ID = model?.ROOT_CONTINENT_ID || 'world-continent';
    const TYPES = Object.freeze({
        EMPIRE: 'empire',
        KINGDOM: 'kingdom',
        UNITED_KINGDOM: 'united-kingdom',
        DUCHY: 'duchy',
        VASSAL_KINGDOM: 'vassal-kingdom',
        VASSAL_DUCHY: 'vassal-duchy',
        FEDERATION: 'federation',
        FREE_CITY: 'free-city',
        AUTONOMOUS_TERRITORY: 'autonomous-territory',
        PROVINCE: 'province',
        REGION: 'geopolitical-region',
        QUEENDOM: 'queendom',
        ARCHIPELAGO: 'archipelago'
    });

    const SOURCE_URLS = Object.freeze({
        north: 'https://witcher.fandom.com/wiki/Northern_Kingdoms',
        nilfgaard: 'https://witcher.fandom.com/wiki/Nilfgaardian_Empire',
        kovir: 'https://witcher.fandom.com/wiki/Kovir_and_Poviss',
        hengfors: 'https://witcher.fandom.com/wiki/Hengfors_League',
        lyria: 'https://witcher.fandom.com/wiki/Lyria_and_Rivia',
        dolBlathanna: 'https://witcher.fandom.com/wiki/Dol_Blathanna',
        brokilon: 'https://witcher.fandom.com/wiki/Brokilon',
        mahakam: 'https://witcher.fandom.com/wiki/Mahakam',
        skellige: 'https://witcher.fandom.com/wiki/Skellige',
        novigrad: 'https://witcher.fandom.com/wiki/Novigrad',
        ofir: 'https://witcher.fandom.com/wiki/Ofir',
        zerrikania: 'https://witcher.fandom.com/wiki/Zerrikania',
        redania: 'https://witcher.fandom.com/wiki/Redania',
        temeria: 'https://witcher.fandom.com/wiki/Temeria',
        aedirn: 'https://witcher.fandom.com/wiki/Aedirn',
        kaedwen: 'https://witcher.fandom.com/wiki/Kaedwen',
        cintra: 'https://witcher.fandom.com/wiki/Cintra'
    });

    function source(title, url) {
        return [{ title, url }];
    }

    function relation(type, targetId, label, note = '') {
        return { type, targetId, label, note };
    }

    function entity(id, name, politicalType, description, options = {}) {
        return {
            id: `world-political-${id}`,
            type: options.type || model.LOCATION_TYPES.REALM,
            parentId: options.parentId || ROOT_ID,
            name,
            description,
            origin: 'official',
            visibility: 'public',
            aliases: options.aliases || [],
            politicalType,
            politicalStatus: options.status || 'Entidade política do Continente',
            politicalRegionId: options.regionId || null,
            relations: options.relations || [],
            sources: options.sources || source('Witcher Wiki', SOURCE_URLS.north),
            atlasVersion: POLITICAL_ATLAS_VERSION,
            coordinates: null
        };
    }

    const IDS = Object.freeze({
        NORTHERN_REALMS: 'world-political-northern-realms',
        NILFGAARD: 'world-political-nilfgaard',
        FAR_SOUTH: 'world-political-far-south',
        AEDIRN: 'world-political-aedirn',
        KAEDWEN: 'world-political-kaedwen',
        REDANIA: 'world-political-redania',
        TEMERIA: 'world-political-temeria',
        KOVIR_POVISS: 'world-political-kovir-poviss',
        HENGFORS: 'world-political-hengfors-league',
        LYRIA_RIVIA: 'world-political-lyria-rivia',
        CINTRA: 'world-political-cintra',
        DOL_BLATHANNA: 'world-political-dol-blathanna',
        BROKILON: 'world-political-brokilon',
        SKELLIGE: 'world-political-skellige',
        NOVIGRAD: 'world-political-novigrad',
        MAHAKAM: 'world-political-mahakam',
        OFIR: 'world-political-ofir',
        ZERRIKANIA: 'world-political-zerrikania'
    });

    const northernMembership = id => relation('member-of', IDS.NORTHERN_REALMS, 'Reinos do Norte', 'Pertence ao conjunto geopolítico dos Reinos do Norte.');
    const nilfgaardOpposition = relation('historical-rivalry', IDS.NILFGAARD, 'Rivalidade com Nilfgaard', 'Relação afetada pelas Guerras do Norte; o controle exato será resolvido pela linha histórica da campanha.');

    const POLITICAL_ENTITIES = Object.freeze([
        entity('northern-realms', 'Reinos do Norte', TYPES.REGION,
            'Conjunto geopolítico dos estados ao norte das Montanhas Amell. Não é um país único: reúne grandes coroas, reinos menores, federações e territórios autônomos.', {
                aliases: ['Reinos Setentrionais', 'Reinos Nórdicos', 'Northern Kingdoms', 'Northern Realms'],
                status: 'Região geopolítica',
                sources: source('Reinos do Norte — Witcher Wiki', SOURCE_URLS.north),
                relations: [nilfgaardOpposition]
            }),
        entity('nilfgaard', 'Império Nilfgaardiano', TYPES.EMPIRE,
            'Potência meridional centralizada que expandiu seu domínio por conquista, anexação e vassalagem. Reúne o núcleo nilfgaardiano, províncias e estados subordinados.', {
                aliases: ['Nilfgaard', 'Império de Nilfgaard', 'Nilfgaardian Empire'],
                status: 'Império soberano',
                sources: source('Império Nilfgaardiano — Witcher Wiki', SOURCE_URLS.nilfgaard),
                relations: [relation('historical-rivalry', IDS.NORTHERN_REALMS, 'Guerras do Norte')]
            }),
        entity('far-south', 'Extremo Sul', TYPES.REGION,
            'Agrupamento cartográfico para terras além das fronteiras meridionais de Nilfgaard. Não representa uma única autoridade política.', {
                aliases: ['Terras Além-Mar', 'Far South'],
                status: 'Região geopolítica',
                sources: source('Mundo de The Witcher — Witcher Wiki', 'https://witcher.fandom.com/wiki/World')
            }),

        entity('aedirn', 'Aedirn', TYPES.KINGDOM,
            'Um dos grandes reinos setentrionais, situado entre Redânia, Kaedwen, Dol Blathanna e as cadeias montanhosas do leste.', {
                regionId: IDS.NORTHERN_REALMS,
                status: 'Reino do Norte',
                sources: source('Aedirn — Witcher Wiki', SOURCE_URLS.aedirn),
                relations: [northernMembership(), nilfgaardOpposition, relation('territorial-dispute', IDS.KAEDWEN, 'Disputa por Lormark')]
            }),
        entity('kaedwen', 'Kaedwen', TYPES.KINGDOM,
            'Grande reino do nordeste, marcado por extensas florestas, clima rigoroso e disputas históricas pela região de Lormark.', {
                regionId: IDS.NORTHERN_REALMS,
                status: 'Reino do Norte',
                sources: source('Kaedwen — Witcher Wiki', SOURCE_URLS.kaedwen),
                relations: [northernMembership(), nilfgaardOpposition, relation('territorial-dispute', IDS.AEDIRN, 'Disputa por Lormark')]
            }),
        entity('redania', 'Redânia', TYPES.KINGDOM,
            'Reino mercantil e agrícola do Norte, com forte tradição de espionagem e longa competição comercial com a Teméria.', {
                aliases: ['Redania'], regionId: IDS.NORTHERN_REALMS, status: 'Reino do Norte',
                sources: source('Redânia — Witcher Wiki', SOURCE_URLS.redania),
                relations: [northernMembership(), nilfgaardOpposition, relation('commercial-rivalry', IDS.TEMERIA, 'Rivalidade comercial')]
            }),
        entity('temeria', 'Teméria', TYPES.KINGDOM,
            'Uma das Quatro Grandes coroas do Norte, ligada a numerosos territórios, vassalos e regiões de grande diversidade política.', {
                aliases: ['Temeria'], regionId: IDS.NORTHERN_REALMS, status: 'Reino do Norte',
                sources: source('Teméria — Witcher Wiki', SOURCE_URLS.temeria),
                relations: [northernMembership(), nilfgaardOpposition, relation('commercial-rivalry', IDS.REDANIA, 'Rivalidade comercial')]
            }),
        entity('kovir-poviss', 'Kovir e Poviss', TYPES.UNITED_KINGDOM,
            'União política rica e independente no extremo norte, formada por Kovir, Poviss e ducados associados. Manteve neutralidade durante as Guerras do Norte.', {
                aliases: ['Kovir and Poviss'], regionId: IDS.NORTHERN_REALMS, status: 'União de reinos do Norte',
                sources: source('Kovir e Poviss — Witcher Wiki', SOURCE_URLS.kovir),
                relations: [northernMembership(), relation('former-subject-of', IDS.REDANIA, 'Antiga dependência da Redânia'), relation('neutrality', IDS.NILFGAARD, 'Neutralidade nas Guerras do Norte')]
            }),
        entity('hengfors-league', 'Liga de Hengfors', TYPES.FEDERATION,
            'Federação de antigos reinos menores, ducados e repúblicas da Marca Oriental, reunidos sob liderança de Hengfors e Caingorn com ampla autonomia interna.', {
                aliases: ['Liga de Niedamir', 'Niedamir’s League', 'Hengfors League'], regionId: IDS.NORTHERN_REALMS,
                status: 'Federação setentrional', sources: source('Liga de Hengfors — Witcher Wiki', SOURCE_URLS.hengfors),
                relations: [northernMembership(), relation('former-region-of', IDS.KOVIR_POVISS, 'Antiga Marca Oriental'), relation('neutrality', IDS.NILFGAARD, 'Neutralidade nas Guerras do Norte')]
            }),
        entity('lyria-rivia', 'Líria e Rívia', TYPES.UNITED_KINGDOM,
            'Confederação histórica de dois reinos do vale de Dol Angra, unidos repetidas vezes por união pessoal e representados por um Conselho de Pares.', {
                aliases: ['Lyria e Rivia', 'Lyria and Rivia'], regionId: IDS.NORTHERN_REALMS, status: 'Confederação de reinos',
                sources: source('Líria e Rívia — Witcher Wiki', SOURCE_URLS.lyria), relations: [northernMembership(), nilfgaardOpposition]
            }),
        entity('cintra', 'Cintra', TYPES.KINGDOM,
            'Reino estratégico na foz do Yaruga. Sua posição entre Norte e Sul tornou sua soberania central nas Guerras do Norte.', {
                aliases: ['Xin’trea', 'Xin\'trea'], regionId: IDS.NORTHERN_REALMS, status: 'Reino de soberania historicamente disputada',
                sources: source('Cintra — Witcher Wiki', SOURCE_URLS.cintra),
                relations: [northernMembership(), relation('historically-conquered-by', IDS.NILFGAARD, 'Conquista e controle variáveis', 'O estado exato depende do ano da campanha.')]
            }),
        entity('cidaris', 'Cidaris', TYPES.KINGDOM,
            'Pequeno reino costeiro setentrional, associado ao comércio marítimo e à esfera política dos Reinos do Norte.', {
                regionId: IDS.NORTHERN_REALMS, status: 'Reino menor do Norte', relations: [northernMembership(), nilfgaardOpposition]
            }),
        entity('verden', 'Verden', TYPES.KINGDOM,
            'Reino situado junto ao Yaruga e às fronteiras de Brokilon, politicamente pressionado pelos conflitos entre o Norte e Nilfgaard.', {
                regionId: IDS.NORTHERN_REALMS, status: 'Reino menor do Norte', relations: [northernMembership(), relation('border-tension', IDS.BROKILON, 'Fronteira hostil')]
            }),
        entity('kerack', 'Kerack', TYPES.KINGDOM,
            'Reino costeiro menor entre Cidaris, Verden e Brokilon, conhecido por sua posição portuária e por conflitos nas bordas da floresta das dríades.', {
                regionId: IDS.NORTHERN_REALMS, status: 'Reino menor do Norte', relations: [northernMembership(), relation('border-tension', IDS.BROKILON, 'Fronteira hostil')]
            }),
        entity('skellige', 'Skellige', TYPES.ARCHIPELAGO,
            'Arquipélago governado por clãs e por uma coroa eletiva. A autoridade real depende do apoio dos jarls e das tradições insulares.', {
                aliases: ['Ilhas Skellige', 'Skellige Isles'], regionId: IDS.NORTHERN_REALMS, status: 'Monarquia eletiva de clãs',
                sources: source('Skellige — Witcher Wiki', SOURCE_URLS.skellige), relations: [northernMembership(), nilfgaardOpposition]
            }),
        entity('brokilon', 'Brokilon', TYPES.QUEENDOM,
            'Estado soberano das dríades no interior da floresta ancestral. Nunca foi conquistado nem submetido pelos reinos humanos do Norte.', {
                aliases: ['Brokiloén', 'Floresta da Morte', 'Floresta das Dríades'], regionId: IDS.NORTHERN_REALMS,
                status: 'Estado soberano não humano', sources: source('Brokilon — Witcher Wiki', SOURCE_URLS.brokilon),
                relations: [northernMembership(), relation('border-tension', 'world-political-verden', 'Fronteira hostil'), relation('border-tension', 'world-political-kerack', 'Fronteira hostil')]
            }),
        entity('dol-blathanna', 'Dol Blathanna', TYPES.DUCHY,
            'Vale das Flores e domínio dos Elfos Livres. Foi parte de Aedirn e passou por reconhecimento como reino, ducado autônomo e território livre.', {
                aliases: ['Vale das Flores', 'Valley of Flowers'], regionId: IDS.NORTHERN_REALMS,
                status: 'Ducado autônomo dos Elfos Livres', sources: source('Dol Blathanna — Witcher Wiki', SOURCE_URLS.dolBlathanna),
                relations: [northernMembership(), relation('former-province-of', IDS.AEDIRN, 'Antiga província de Aedirn'), relation('political-dependency', IDS.NILFGAARD, 'Dependência política histórica')]
            }),
        entity('novigrad', 'Cidade Livre de Novigrad', TYPES.FREE_CITY,
            'Cidade-estado mercantil de grande autonomia, formalmente livre e historicamente ligada à Redânia. É um centro comercial, religioso e político de primeira ordem.', {
                aliases: ['Novigrad', 'Free City of Novigrad'], regionId: IDS.NORTHERN_REALMS, status: 'Cidade livre autônoma',
                sources: source('Novigrad — Witcher Wiki', SOURCE_URLS.novigrad), relations: [northernMembership(), relation('historical-ties', IDS.REDANIA, 'Antigos vínculos com a Redânia')]
            }),

        entity('upper-aedirn', 'Alto Aedirn', TYPES.PROVINCE, 'Região também conhecida como Lormark, historicamente disputada por Aedirn e Kaedwen.', {
            type: model.LOCATION_TYPES.PROVINCE, parentId: IDS.AEDIRN, aliases: ['Upper Aedirn', 'Lormark'], status: 'Região disputada', sources: source('Reinos do Norte — Witcher Wiki', SOURCE_URLS.north),
            relations: [relation('claimed-by', IDS.KAEDWEN, 'Reivindicada por Kaedwen')]
        }),
        entity('lower-aedirn', 'Baixo Aedirn', TYPES.PROVINCE, 'Região ocidental do reino de Aedirn.', {
            type: model.LOCATION_TYPES.PROVINCE, parentId: IDS.AEDIRN, aliases: ['Lower Aedirn'], status: 'Região de Aedirn'
        }),
        entity('arcsea', 'Arcsea', TYPES.PROVINCE, 'Território associado à administração e à esfera política da Redânia.', {
            type: model.LOCATION_TYPES.PROVINCE, parentId: IDS.REDANIA, status: 'Território redaniano', sources: source('Redânia — Witcher Wiki', SOURCE_URLS.redania)
        }),
        entity('yamurlak', 'Yamurlak', TYPES.PROVINCE, 'Território setentrional vinculado à Redânia.', {
            type: model.LOCATION_TYPES.PROVINCE, parentId: IDS.REDANIA, status: 'Território redaniano', sources: source('Redânia — Witcher Wiki', SOURCE_URLS.redania)
        }),
        entity('kovir', 'Kovir', TYPES.KINGDOM, 'Reino componente da união de Kovir e Poviss.', {
            type: model.LOCATION_TYPES.PROVINCE, parentId: IDS.KOVIR_POVISS, status: 'Reino componente', sources: source('Kovir e Poviss — Witcher Wiki', SOURCE_URLS.kovir)
        }),
        entity('poviss', 'Poviss', TYPES.KINGDOM, 'Reino componente da união de Kovir e Poviss.', {
            type: model.LOCATION_TYPES.PROVINCE, parentId: IDS.KOVIR_POVISS, status: 'Reino componente', sources: source('Kovir e Poviss — Witcher Wiki', SOURCE_URLS.kovir)
        }),
        ...['Narok', 'Talgar', 'Velhad'].map(name => entity(name.toLowerCase(), name, TYPES.DUCHY, `Ducado integrante da união de Kovir e Poviss.`, {
            type: model.LOCATION_TYPES.PROVINCE, parentId: IDS.KOVIR_POVISS, status: 'Ducado da união', sources: source('Kovir e Poviss — Witcher Wiki', SOURCE_URLS.kovir)
        })),
        ...['Barefield', 'Caingorn', 'Carnedd', 'Creyden', 'Crinfrid', 'Hengfors', 'Malleore', 'Tammerfors'].map(name => entity(`hengfors-${name.toLowerCase()}`, name, TYPES.AUTONOMOUS_TERRITORY, `Membro da Liga de Hengfors, com autonomia interna dentro da federação.`, {
            type: model.LOCATION_TYPES.PROVINCE, parentId: IDS.HENGFORS, status: 'Membro autônomo da federação', sources: source('Liga de Hengfors — Witcher Wiki', SOURCE_URLS.hengfors)
        })),
        entity('mahakam', 'Mahakam', TYPES.AUTONOMOUS_TERRITORY,
            'Domínio ancestral de anões e gnomos. A coroa temeriana é soberana apenas em caráter titular; o governo interno conserva ampla autonomia.', {
                type: model.LOCATION_TYPES.PROVINCE, parentId: IDS.TEMERIA, aliases: ['Reino de Mahakam'], status: 'Vassalo autônomo da Teméria',
                sources: source('Mahakam — Witcher Wiki', SOURCE_URLS.mahakam), relations: [relation('vassal-of', IDS.TEMERIA, 'Vassalo titular da Teméria')]
            }),
        ...['Angren', 'Brugge', 'Ellander', 'Garramone', 'Maribor', 'Pontaria', 'Riverdell', 'Sodden', 'Velen'].map(name => entity(`temeria-${name.toLowerCase()}`, name, TYPES.PROVINCE, `Território ligado política ou administrativamente à esfera da Teméria.`, {
            type: model.LOCATION_TYPES.PROVINCE, parentId: IDS.TEMERIA, status: 'Território temeriano', sources: source('Teméria — Witcher Wiki', SOURCE_URLS.temeria)
        })),

        entity('nilfgaard-core', 'Nilfgaard', TYPES.PROVINCE, 'Núcleo histórico do Império ao redor do Alba, distinto das terras anexadas e estados vassalos.', {
            type: model.LOCATION_TYPES.PROVINCE, parentId: IDS.NILFGAARD, aliases: ['Baixo Alba', 'Lower Alba'], status: 'Núcleo imperial', sources: source('Império Nilfgaardiano — Witcher Wiki', SOURCE_URLS.nilfgaard)
        }),
        ...['Daerlan', 'Eiddon', 'Liddertal', 'Magne', 'Rowan', 'Ruach', 'Slopes', 'Tarnhann', 'Winneburg', 'Ymlac'].map(name => entity(`nilfgaard-${name.toLowerCase()}`, name, TYPES.PROVINCE, `Região integrante do Império Nilfgaardiano.`, {
            type: model.LOCATION_TYPES.PROVINCE, parentId: IDS.NILFGAARD, status: 'Região imperial', sources: source('Império Nilfgaardiano — Witcher Wiki', SOURCE_URLS.nilfgaard)
        })),
        ...['Angren', 'Etolia', 'Gemmera', 'Geso', 'Mag Turga', 'Nazair'].map(name => entity(`nilfgaard-province-${name.toLowerCase().replace(/\s+/g, '-')}`, name, TYPES.PROVINCE, `Província administrada pelo Império Nilfgaardiano.`, {
            type: model.LOCATION_TYPES.PROVINCE, parentId: IDS.NILFGAARD, status: 'Província imperial', sources: source('Império Nilfgaardiano — Witcher Wiki', SOURCE_URLS.nilfgaard)
        })),
        entity('metinna', 'Metinna', TYPES.VASSAL_KINGDOM, 'Reino vassalo inserido na estrutura provincial do Império Nilfgaardiano.', {
            type: model.LOCATION_TYPES.PROVINCE, parentId: IDS.NILFGAARD, status: 'Reino vassalo de Nilfgaard', sources: source('Império Nilfgaardiano — Witcher Wiki', SOURCE_URLS.nilfgaard), relations: [relation('vassal-of', IDS.NILFGAARD, 'Vassalo de Nilfgaard')]
        }),
        entity('maecht', 'Maecht', TYPES.VASSAL_KINGDOM, 'Reino vassalo associado à província de Metinna e subordinado ao Império Nilfgaardiano.', {
            type: model.LOCATION_TYPES.PROVINCE, parentId: IDS.NILFGAARD, status: 'Reino vassalo de Nilfgaard', sources: source('Império Nilfgaardiano — Witcher Wiki', SOURCE_URLS.nilfgaard), relations: [relation('vassal-of', IDS.NILFGAARD, 'Vassalo de Nilfgaard'), relation('associated-with', 'world-political-metinna', 'Ligado a Metinna')]
        }),
        entity('ebbing', 'Ebbing', TYPES.VASSAL_KINGDOM, 'Estado oficialmente independente, mas listado entre os vassalos do Império Nilfgaardiano.', {
            type: model.LOCATION_TYPES.PROVINCE, parentId: IDS.NILFGAARD, status: 'Vassalo oficialmente independente', sources: source('Império Nilfgaardiano — Witcher Wiki', SOURCE_URLS.nilfgaard), relations: [relation('vassal-of', IDS.NILFGAARD, 'Vassalo de Nilfgaard')]
        }),
        entity('toussaint', 'Toussaint', TYPES.VASSAL_DUCHY, 'Ducado vinícola com grande autonomia cultural e administrativa, submetido politicamente ao Império Nilfgaardiano.', {
            type: model.LOCATION_TYPES.PROVINCE, parentId: IDS.NILFGAARD, status: 'Ducado vassalo de Nilfgaard', sources: source('Toussaint — Witcher Wiki', 'https://witcher.fandom.com/wiki/Toussaint'), relations: [relation('vassal-of', IDS.NILFGAARD, 'Vassalo de Nilfgaard')]
        }),
        entity('vicovaro', 'Vicovaro', TYPES.VASSAL_KINGDOM, 'Estado vassalo meridional integrado à esfera política e militar do Império Nilfgaardiano.', {
            type: model.LOCATION_TYPES.PROVINCE, parentId: IDS.NILFGAARD, status: 'Vassalo de Nilfgaard', sources: source('Império Nilfgaardiano — Witcher Wiki', SOURCE_URLS.nilfgaard), relations: [relation('vassal-of', IDS.NILFGAARD, 'Vassalo de Nilfgaard')]
        }),

        entity('ofir', 'Ofir', TYPES.UNITED_KINGDOM,
            'Conjunto de reinos, povos e antigos impérios do sul reunidos sob uma única autoridade. Mantém comércio distante com portos do Norte.', {
                aliases: ['Ofier'], regionId: IDS.FAR_SOUTH, status: 'Reinos unificados sob um malliq', sources: source('Ofir — Witcher Wiki', SOURCE_URLS.ofir), relations: [relation('member-of', IDS.FAR_SOUTH, 'Extremo Sul')]
            }),
        entity('zerrikania', 'Zerrikânia', TYPES.QUEENDOM,
            'Reino oriental de tradição matriarcal, governado por uma rainha e conhecido no Norte por alquimia, guerreiras e cultos dracônicos.', {
                aliases: ['Zerrikania'], regionId: IDS.FAR_SOUTH, status: 'Reino soberano matriarcal', sources: source('Zerrikânia — Witcher Wiki', SOURCE_URLS.zerrikania), relations: [relation('member-of', IDS.FAR_SOUTH, 'Extremo Sul')]
            })
    ]);

    function seedPoliticalAtlas(world, options = {}) {
        const now = options.now || new Date().toISOString();
        const current = model.normalizeWorld(world, { now });
        const existingById = new Map(current.locations.map(location => [location.id, location]));
        const catalogIds = new Set(POLITICAL_ENTITIES.map(location => location.id));
        const root = current.locations.find(location => location.id === ROOT_ID);
        const catalog = POLITICAL_ENTITIES.map(location => {
            const existing = existingById.get(location.id);
            return model.normalizeLocation({
                ...location,
                coordinates: existing?.coordinates || location.coordinates,
                createdAt: existing?.createdAt || now,
                updatedAt: existing && existing.atlasVersion === POLITICAL_ATLAS_VERSION
                    ? existing.updatedAt
                    : now
            }, { now });
        });
        const customAndExtended = current.locations.filter(location =>
            location.id !== ROOT_ID && !catalogIds.has(location.id));
        return model.normalizeWorld({
            ...current,
            politicalAtlasVersion: POLITICAL_ATLAS_VERSION,
            locations: [root, ...catalog, ...customAndExtended],
            updatedAt: current.updatedAt || now
        }, { now });
    }

    function getPoliticalEntities(world) {
        return model.normalizeWorld(world).locations.filter(location => location.politicalType);
    }

    return Object.freeze({
        POLITICAL_ATLAS_VERSION,
        TYPES,
        IDS,
        SOURCE_URLS,
        POLITICAL_ENTITIES,
        seedPoliticalAtlas,
        getPoliticalEntities
    });
});
