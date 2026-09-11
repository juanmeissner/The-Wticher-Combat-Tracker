(function (root, factory) {
    const model = root?.worldModel
        || (typeof require === 'function' ? require('./world-model.js') : null);
    const atlas = root?.worldAtlasData
        || (typeof require === 'function' ? require('./world-atlas-data.js') : null);
    const api = factory(model, atlas);

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.worldLocationData = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (model, atlas) {
    'use strict';

    const CANONICAL_CATALOG_VERSION = 1;
    const TYPES = Object.freeze({
        CAPITAL: 'capital',
        CITY: 'city',
        PORT_CITY: 'port-city',
        TOWN: 'town',
        VILLAGE: 'village',
        FORTRESS: 'fortress',
        CASTLE: 'castle',
        KEEP: 'keep',
        PALACE: 'palace',
        ACADEMY: 'academy',
        TEMPLE: 'temple',
        ISLAND: 'island',
        RUINS: 'ruins',
        TOWER: 'tower',
        BATTLEFIELD: 'battlefield',
        FOREST_SETTLEMENT: 'forest-settlement',
        SPECIAL_SITE: 'special-site'
    });

    const P = atlas.IDS;
    const parentIds = Object.freeze({
        UPPER_AEDIRN: 'world-political-upper-aedirn',
        LOWER_AEDIRN: 'world-political-lower-aedirn',
        VELEN: 'world-political-temeria-velen',
        ELLANDER: 'world-political-temeria-ellander',
        SODDEN: 'world-political-temeria-sodden',
        NAZAIR: 'world-political-nilfgaard-province-nazair',
        METINNA: 'world-political-metinna',
        TOUSSAINT: 'world-political-toussaint',
        VICOVARO: 'world-political-vicovaro',
        NILFGAARD_CORE: 'world-political-nilfgaard-core'
    });

    function wiki(slug, title) {
        return [{ title: title || `${String(slug).replace(/_/g, ' ')} — Witcher Wiki`, url: `https://witcher.fandom.com/wiki/${slug}` }];
    }

    function location(id, name, canonicalType, parentId, description, options = {}) {
        return {
            id: `world-canonical-${id}`,
            type: model.LOCATION_TYPES.LOCATION,
            parentId,
            name,
            description,
            origin: 'official',
            visibility: 'public',
            aliases: options.aliases || [],
            canonicalType,
            canonicalStatus: options.status || 'Local canônico',
            isCapital: options.isCapital === true,
            importance: options.importance || (options.isCapital ? 'major' : 'regional'),
            canonicalVersion: CANONICAL_CATALOG_VERSION,
            sources: options.sources || wiki(name.replace(/\s+/g, '_')),
            relations: [],
            atlasVersion: 0,
            coordinates: null
        };
    }

    const IDS = Object.freeze({
        VIZIMA: 'world-canonical-vizima',
        NOVIGRAD: 'world-canonical-novigrad',
        THANEDD: 'world-canonical-thanedd',
        KAER_MORHEN: 'world-canonical-kaer-morhen',
        LOC_MUINNE: 'world-canonical-loc-muinne',
        NILFGAARD_CITY: 'world-canonical-nilfgaard-city',
        BEAUCLAIR: 'world-canonical-beauclair',
        KAER_TROLDE: 'world-canonical-kaer-trolde'
    });

    const CANONICAL_LOCATIONS = Object.freeze([
        location('vengerberg', 'Vengerberg', TYPES.CAPITAL, P.AEDIRN,
            'Capital de Aedirn e antigo centro de comércio, indústria e educação do reino.', {
                isCapital: true, sources: wiki('Vengerberg', 'Vengerberg — Witcher Wiki')
            }),
        location('aldersberg', 'Aldersberg', TYPES.CITY, parentIds.LOWER_AEDIRN,
            'Cidade aedirniana associada a importantes combates durante as Guerras do Norte.', { sources: wiki('Aldersberg') }),
        location('gulet', 'Gulet', TYPES.CITY, parentIds.LOWER_AEDIRN,
            'Cidade de Aedirn conhecida como origem de artesãos, soldados e personagens ligados às guerras do reino.', { sources: wiki('Gulet') }),
        location('vergen', 'Vergen', TYPES.CITY, parentIds.UPPER_AEDIRN,
            'Cidade fortificada e centro de mineração na região disputada do Alto Aedirn.', { sources: wiki('Vergen') }),
        location('eyn-lan', 'Eysenlaan', TYPES.TOWN, parentIds.LOWER_AEDIRN,
            'Assentamento de Aedirn registrado nas rotas orientais do reino.', { sources: wiki('Aedirn', 'Aedirn — Witcher Wiki') }),

        location('ard-carraigh', 'Ard Carraigh', TYPES.CAPITAL, P.KAEDWEN,
            'Capital de Kaedwen e sede tradicional da Dinastia do Unicórnio.', {
                aliases: ['High Rock'], isCapital: true, sources: wiki('Ard_Carraigh', 'Ard Carraigh — Witcher Wiki')
            }),
        location('ban-ard', 'Ban Ard', TYPES.CITY, P.KAEDWEN,
            'Cidade kaedweniana que abriga a célebre academia de magia masculina.', { sources: wiki('Ban_Ard') }),
        location('ban-ard-academy', 'Academia de Ban Ard', TYPES.ACADEMY, 'world-canonical-ban-ard',
            'Instituição de formação mágica masculina e um dos grandes centros arcanos do Norte.', { sources: wiki('Ban_Ard_Academy') }),
        location('ban-glean', 'Ban Gleán', TYPES.TOWN, P.KAEDWEN,
            'Assentamento kaedweniano associado às forças militares e às rotas do leste.', { sources: wiki('Ban_Gle%C3%A1n') }),
        location('kaer-morhen', 'Kaer Morhen', TYPES.FORTRESS, P.KAEDWEN,
            'Fortaleza montanhosa e sede histórica da Escola do Lobo, construída em um vale remoto de Kaedwen.', {
                aliases: ["Caer a'Muirehen", 'Fortaleza do Velho Mar'], importance: 'legendary', sources: wiki('Kaer_Morhen', 'Kaer Morhen — Witcher Wiki')
            }),
        location('loc-muinne', 'Loc Muinne', TYPES.RUINS, P.KAEDWEN,
            'Ruínas de uma antiga cidade vrani e élfica nos contrafortes das Montanhas Azuis, posteriormente usadas para uma cúpula política.', {
                importance: 'major', sources: wiki('Loc_Muinne', 'Loc Muinne — Witcher Wiki')
            }),
        location('shaerrawedd', 'Shaerrawedd', TYPES.RUINS, P.KAEDWEN,
            'Ruínas élficas transformadas em símbolo da resistência e da tragédia dos Aen Seidhe.', { importance: 'major', sources: wiki('Shaerrawedd') }),

        location('tretogor', 'Tretogor', TYPES.CAPITAL, P.REDANIA,
            'Capital da Redânia, sede da corte real e do governo do reino.', {
                aliases: ['Dreiberg'], isCapital: true, sources: wiki('Tretogor', 'Tretogor — Witcher Wiki')
            }),
        location('oxenfurt', 'Oxenfurt', TYPES.CITY, P.REDANIA,
            'Cidade universitária às margens do Pontar, célebre pela maior academia dos Reinos do Norte.', {
                importance: 'major', sources: wiki('Oxenfurt', 'Oxenfurt — Witcher Wiki')
            }),
        location('oxenfurt-academy', 'Academia de Oxenfurt', TYPES.ACADEMY, 'world-canonical-oxenfurt',
            'Centro de pesquisa e ensino que atrai estudiosos, médicos, naturalistas e artistas de todo o Continente.', { sources: wiki('Oxenfurt_Academy') }),
        location('rinde', 'Rinde', TYPES.TOWN, P.REDANIA,
            'Cidade mercantil redaniana conhecida pelo encontro de Geralt e Yennefer e por sua atividade comercial.', { sources: wiki('Rinde') }),
        location('blaviken', 'Blaviken', TYPES.TOWN, P.REDANIA,
            'Cidade costeira onde ocorreu o confronto que deu a Geralt o epíteto de Carniceiro de Blaviken.', { importance: 'major', sources: wiki('Blaviken') }),
        location('drakenborg', 'Drakenborg', TYPES.CASTLE, P.REDANIA,
            'Fortificação redaniana usada como prisão e centro de detenção.', { sources: wiki('Drakenborg') }),
        location('novigrad', 'Novigrad', TYPES.CITY, P.NOVIGRAD,
            'Maior cidade do Norte e um dos principais centros de comércio, religião e poder econômico do Continente.', {
                aliases: ['Cidade Livre de Novigrad'], isCapital: true, importance: 'major', sources: wiki('Novigrad', 'Novigrad — Witcher Wiki')
            }),

        location('vizima', 'Vizima', TYPES.CAPITAL, P.TEMERIA,
            'Capital fortificada da Teméria, construída junto ao Lago Vizima e ao encontro de importantes rotas comerciais.', {
                aliases: ['Wyzima', 'Wyzim'], isCapital: true, sources: wiki('Vizima', 'Vizima — Witcher Wiki')
            }),
        location('vizima-royal-castle', 'Castelo Real de Vizima', TYPES.CASTLE, IDS.VIZIMA,
            'Residência real e núcleo político fortificado da capital temeriana.', { sources: wiki('Vizima_Royal_Castle') }),
        location('maribor', 'Maribor', TYPES.CITY, P.TEMERIA,
            'Uma das maiores cidades da Teméria e importante centro regional do reino.', { sources: wiki('Maribor') }),
        location('gors-velen', 'Gors Velen', TYPES.PORT_CITY, parentIds.VELEN,
            'Influente cidade portuária da Teméria, ligada por ponte à Ilha de Thanedd e às principais rotas comerciais costeiras.', {
                importance: 'major', sources: wiki('Gors_Velen', 'Gors Velen — Witcher Wiki')
            }),
        location('thanedd', 'Ilha de Thanedd', TYPES.ISLAND, parentIds.VELEN,
            'Ilha mágica ao largo de Gors Velen, sede de Aretuza e palco do golpe que desfez a antiga Irmandade dos Feiticeiros.', {
                aliases: ['Thanedd', 'Ilha Thanedd'], importance: 'legendary', sources: wiki('Thanedd_Island', 'Ilha de Thanedd — Witcher Wiki')
            }),
        location('aretuza', 'Aretuza', TYPES.ACADEMY, IDS.THANEDD,
            'Academia de formação de feiticeiras instalada nos níveis inferiores da Ilha de Thanedd.', { importance: 'major', sources: wiki('Aretuza') }),
        location('garstang', 'Garstang', TYPES.PALACE, IDS.THANEDD,
            'Palácio principal da Ilha de Thanedd e cenário central do golpe de 1267.', { sources: wiki('Garstang') }),
        location('loxia', 'Loxia', TYPES.PALACE, IDS.THANEDD,
            'Complexo de recepção situado na base da Ilha de Thanedd.', { sources: wiki('Loxia') }),
        location('tor-lara', 'Tor Lara', TYPES.TOWER, IDS.THANEDD,
            'Torre élfica no topo de Thanedd, também conhecida como Torre da Gaivota.', {
                aliases: ['Torre da Gaivota', 'Tower of the Gull'], importance: 'legendary', sources: wiki('Tor_Lara')
            }),
        location('dorian', 'Dorian', TYPES.CITY, P.TEMERIA,
            'Cidade temeriana situada nas rotas entre o interior do reino e a costa de Velen.', { sources: wiki('Dorian') }),
        location('ellander', 'Ellander', TYPES.CITY, parentIds.ELLANDER,
            'Centro regional da Teméria conhecido sobretudo pelo culto de Melitele.', { sources: wiki('Ellander') }),
        location('temple-melitele', 'Templo de Melitele', TYPES.TEMPLE, 'world-canonical-ellander',
            'Importante centro religioso, médico e educacional conduzido pelas sacerdotisas de Melitele em Ellander.', { importance: 'major', sources: wiki('Temple_of_Melitele') }),
        location('white-orchard', 'Pomar Branco', TYPES.VILLAGE, P.TEMERIA,
            'Vilarejo rural temeriano cercado por campos, pomares e áreas de conflito durante a guerra.', {
                aliases: ['White Orchard', 'Huerto Blanco'], sources: wiki('White_Orchard')
            }),
        location('crows-perch', 'Poleiro do Corvo', TYPES.FORTRESS, parentIds.VELEN,
            'Fortaleza de madeira erguida sobre uma colina de Velen e centro de poder regional.', {
                aliases: ["Crow's Perch"], importance: 'major', sources: wiki('Crow%27s_Perch')
            }),
        ...[
            ['downwarren', 'Baixada', 'Downwarren', 'Vilarejo pantanoso de Velen ligado às tradições locais e às Moiras.'],
            ['midcopse', 'Centrobosque', 'Midcopse', 'Vilarejo de Velen situado entre bosques e estradas castigadas pela guerra.'],
            ['lindenvale', 'Vale das Tílias', 'Lindenvale', 'Pequeno assentamento agrícola de Velen.'],
            ['blackbough', 'Ramo Negro', 'Blackbough', 'Vilarejo de Velen conhecido por suas práticas populares e contratos de monstros.'],
            ['oreton', 'Oreton', 'Oreton', 'Vilarejo fortificado próximo às águas e pântanos de Velen.'],
            ['heatherton', 'Heatherton', 'Heatherton', 'Assentamento de Velen devastado pelos acontecimentos da guerra.']
        ].map(([id, name, slug, description]) => location(id, name, TYPES.VILLAGE, parentIds.VELEN, description, { aliases: name === slug ? [] : [slug], sources: wiki(slug) })),
        location('sodden-hill', 'Colina de Sodden', TYPES.BATTLEFIELD, parentIds.SODDEN,
            'Local da batalha decisiva em que os exércitos do Norte detiveram a primeira grande invasão nilfgaardiana.', {
                aliases: ['Sodden Hill'], importance: 'legendary', sources: wiki('Battle_of_Sodden_Hill')
            }),

        location('lan-exeter', 'Lan Exeter', TYPES.CAPITAL, P.KOVIR_POVISS,
            'Capital de inverno de Kovir e Poviss, construída sobre ilhotas e canais no Golfo de Praxeda.', {
                isCapital: true, importance: 'major', sources: wiki('Lan_Exeter', 'Lan Exeter — Witcher Wiki')
            }),
        location('pont-vanis', 'Pont Vanis', TYPES.CAPITAL, P.KOVIR_POVISS,
            'Capital de verão de Kovir e Poviss e importante porto político e comercial do extremo norte.', {
                aliases: ['Point Vanis'], isCapital: true, importance: 'major', sources: wiki('Pont_Vanis', 'Pont Vanis — Witcher Wiki')
            }),
        location('tredam', 'Tredam', TYPES.TOWN, P.KOVIR_POVISS,
            'Cidade de Kovir associada a um célebre ultimato durante as Guerras do Norte.', { sources: wiki('Tredam') }),

        location('hengfors-city', 'Hengfors', TYPES.CAPITAL, P.HENGFORS,
            'Capital da Liga de Hengfors e centro político e econômico da federação.', {
                isCapital: true, sources: wiki('Hengfors_%28city%29', 'Hengfors — Witcher Wiki')
            }),
        location('caingorn-city', 'Caingorn', TYPES.TOWN, 'world-political-hengfors-caingorn',
            'Sede histórica do reino de Caingorn e um dos principais núcleos da Liga de Hengfors.', { sources: wiki('Caingorn') }),
        location('barefield', 'Barefield', TYPES.VILLAGE, 'world-political-hengfors-barefield',
            'Assentamento pastoril lembrado pela caçada ao dragão dourado Villentretenmerth.', { sources: wiki('Barefield') }),
        location('creyden', 'Creyden', TYPES.TOWN, 'world-political-hengfors-creyden',
            'Assentamento da Liga de Hengfors junto às rotas do extremo norte.', { sources: wiki('Creyden') }),

        location('lyria-city', 'Líria', TYPES.CAPITAL, P.LYRIA_RIVIA,
            'Capital de verão da união de Líria e Rívia, cercada por vales férteis e regiões montanhosas.', {
                aliases: ['Lyria'], isCapital: true, sources: wiki('Lyria_%28city%29')
            }),
        location('rivia-city', 'Rívia', TYPES.CAPITAL, P.LYRIA_RIVIA,
            'Capital de inverno do reino unido e importante centro artesanal e metalúrgico.', {
                aliases: ['Rivia'], isCapital: true, sources: wiki('Rivia_%28city%29')
            }),
        location('spalla', 'Spalla', TYPES.TOWN, P.LYRIA_RIVIA,
            'Cidade situada nas rotas orientais de Líria.', { sources: wiki('Lyria', 'Líria — Witcher Wiki') }),
        location('scala', 'Scala', TYPES.TOWN, P.LYRIA_RIVIA,
            'Assentamento lírio próximo às montanhas e às vias que cortam Dol Angra.', { sources: wiki('Lyria', 'Líria — Witcher Wiki') }),
        location('rastburg-castle', 'Castelo de Rastburg', TYPES.CASTLE, P.LYRIA_RIVIA,
            'Castelo fortificado nas terras de Líria.', { aliases: ['Rastburg Castle'], sources: wiki('Lyria', 'Líria — Witcher Wiki') }),

        location('cintra-city', 'Cintra', TYPES.CAPITAL, P.CINTRA,
            'Capital portuária do reino de Cintra, erguida próxima à foz do Yaruga e protegida por seu castelo real.', {
                aliases: ["Xin'trea"], isCapital: true, importance: 'major', sources: wiki('Cintra_%28city%29')
            }),
        location('cintra-castle', 'Castelo de Cintra', TYPES.CASTLE, 'world-canonical-cintra-city',
            'Residência da dinastia cintriana e último reduto da capital durante a invasão nilfgaardiana.', { importance: 'major', sources: wiki('Cintra_Castle') }),
        location('attre', 'Attre', TYPES.TOWN, 'world-political-cintra',
            'Assentamento e domínio nobre ligado ao Reino de Cintra.', { sources: wiki('Attre') }),
        location('strept', 'Strept', TYPES.TOWN, P.CINTRA,
            'Assentamento do interior de Cintra registrado nas rotas ao sul do Yaruga.', { sources: wiki('Cintra', 'Cintra — Witcher Wiki') }),

        location('cidaris-city', 'Cidaris', TYPES.CAPITAL, 'world-political-cidaris',
            'Capital marítima de Cidaris, conhecida por seus bazares, vinhos, estaleiros e ligação com o Grande Mar.', {
                isCapital: true, sources: wiki('Cidaris_%28city%29', 'Cidaris — Witcher Wiki')
            }),
        location('bremervoord', 'Bremervoord', TYPES.PORT_CITY, 'world-political-cidaris',
            'Cidade portuária e centro do principado de Bremervoord na esfera de Cidaris.', { sources: wiki('Bremervoord') }),
        location('kerack-city', 'Kerack', TYPES.CAPITAL, 'world-political-kerack',
            'Capital portuária do pequeno reino de Kerack, situada na foz do Adalatte.', {
                isCapital: true, sources: wiki('Kerack_%28city%29', 'Kerack — Witcher Wiki')
            }),
        location('rissberg', 'Rissberg', TYPES.FORTRESS, 'world-political-kerack',
            'Castelo e complexo de pesquisa associado a magos, experimentos e ao Capítulo.', { importance: 'major', sources: wiki('Rissberg') }),

        location('kaer-trolde', 'Kaer Trolde', TYPES.PORT_CITY, P.SKELLIGE,
            'Cidade portuária do clã an Craite em Ard Skellig, dominada pela cidadela que protege a frota do arquipélago.', {
                importance: 'major', sources: wiki('Kaer_Trolde', 'Kaer Trolde — Witcher Wiki')
            }),
        location('kaer-trolde-castle', 'Castelo de Kaer Trolde', TYPES.CASTLE, IDS.KAER_TROLDE,
            'Fortaleza do clã an Craite erguida acima do porto de Kaer Trolde.', { sources: wiki('Kaer_Trolde_keep') }),
        location('kaer-almhult', 'Kaer Almhult', TYPES.FORTRESS, P.SKELLIGE,
            'Antiga sede planejada para os reis das ilhas, posteriormente abandonada e usada como prisão.', { sources: wiki('Kaer_Almhult') }),
        location('gedyneith', 'Gedyneith', TYPES.SPECIAL_SITE, P.SKELLIGE,
            'Bosque sagrado de druidas em Ard Skellig e local tradicional de coroação dos soberanos das ilhas.', { importance: 'major', sources: wiki('Gedyneith') }),
        ...[
            ['larvik', 'Larvik'], ['svorlag', 'Svorlag'], ['harviken', 'Harviken'], ['lofoten', 'Lofoten'], ['rannvaig', 'Rannvaig'], ['rogne', 'Rogne']
        ].map(([id, name]) => location(id, name, TYPES.VILLAGE, P.SKELLIGE, `Assentamento canônico das Ilhas Skellige.`, { sources: wiki(name) })),

        location('duen-canell', 'Duén Canell', TYPES.FOREST_SETTLEMENT, P.BROKILON,
            'Coração político e espiritual de Brokilon, residência da rainha Eithné e das dríades.', { importance: 'major', sources: wiki('Du%C3%A9n_Canell') }),
        location('silver-towers', 'Torres de Prata', TYPES.CAPITAL, P.DOL_BLATHANNA,
            'Sede atribuída ao governo dos Elfos Livres em Dol Blathanna.', {
                aliases: ['Silver Towers'], isCapital: true, sources: wiki('Dol_Blathanna', 'Dol Blathanna — Witcher Wiki')
            }),
        location('lower-posada', 'Baixa Posada', TYPES.VILLAGE, P.DOL_BLATHANNA,
            'Vilarejo agrícola no Vale das Flores visitado por Geralt e Jaskier.', { aliases: ['Lower Posada'], sources: wiki('Lower_Posada') }),
        location('upper-posada', 'Alta Posada', TYPES.VILLAGE, P.DOL_BLATHANNA,
            'Assentamento do Vale das Flores situado acima de Baixa Posada.', { aliases: ['Upper Posada'], sources: wiki('Upper_Posada') }),
        location('mount-carbon', 'Monte Carbon', TYPES.FORTRESS, P.MAHAKAM,
            'Grande fortaleza subterrânea e centro político dos clãs de Mahakam.', { aliases: ['Mount Carbon'], importance: 'major', sources: wiki('Mount_Carbon') }),

        location('nilfgaard-city', 'Cidade das Torres Douradas', TYPES.CAPITAL, parentIds.NILFGAARD_CORE,
            'Capital do Império Nilfgaardiano às margens do Alba, centro da corte imperial e do núcleo cultural nilfgaardiano.', {
                aliases: ['Nilfgaard', 'Cidade das Mil Torres', 'City of Golden Towers'], isCapital: true, importance: 'major', sources: wiki('Nilfgaard_%28city%29', 'Cidade das Torres Douradas — Witcher Wiki')
            }),
        location('imperial-palace', 'Palácio Imperial de Nilfgaard', TYPES.PALACE, IDS.NILFGAARD_CITY,
            'Residência do imperador, protegida pela Brigada Impera e integrada à capital.', { importance: 'major', sources: wiki('Imperial_Palace', 'Palácio Imperial — Witcher Wiki') }),
        location('metinna-city', 'Metinna', TYPES.CAPITAL, parentIds.METINNA,
            'Capital do reino vassalo de Metinna e centro de suas planícies, arenas e comércio de cavalos.', { isCapital: true, sources: wiki('Metinna') }),
        location('tor-zireael', 'Tor Zireael', TYPES.TOWER, parentIds.METINNA,
            'Torre da Andorinha, portal élfico associado à fuga de Ciri e às lendas do Sangue Ancestral.', {
                aliases: ['Torre da Andorinha', 'Tower of the Swallow'], importance: 'legendary', sources: wiki('Tor_Zireael')
            }),
        location('beauclair', 'Beauclair', TYPES.CAPITAL, parentIds.TOUSSAINT,
            'Capital de Toussaint, construída ao redor do palácio ducal e cercada por vinhedos e tradições cavalheirescas.', {
                isCapital: true, importance: 'major', sources: wiki('Beauclair', 'Beauclair — Witcher Wiki')
            }),
        location('beauclair-palace', 'Palácio de Beauclair', TYPES.PALACE, IDS.BEAUCLAIR,
            'Residência da duquesa de Toussaint e centro administrativo do ducado.', { importance: 'major', sources: wiki('Beauclair_Palace') }),
        location('corvo-bianco', 'Corvo Bianco', TYPES.SPECIAL_SITE, parentIds.TOUSSAINT,
            'Vinhedo e propriedade rural de Toussaint concedida a Geralt.', { aliases: ['Corvo Bianco Vineyard'], sources: wiki('Corvo_Bianco') }),
        location('dun-tynne', 'Castelo de Dun Tynne', TYPES.CASTLE, parentIds.TOUSSAINT,
            'Castelo fortificado no ducado de Toussaint.', { aliases: ['Dun Tynne Castle'], sources: wiki('Dun_Tynne_Castle') }),
        location('castel-ravello', 'Castel Ravello', TYPES.CASTLE, parentIds.TOUSSAINT,
            'Propriedade vinícola fortificada de Toussaint.', { sources: wiki('Castel_Ravello_Vineyard') }),
        location('vicovaro-city', 'Vicovaro', TYPES.CAPITAL, parentIds.VICOVARO,
            'Capital do estado vassalo de Vicovaro e centro associado a uma influente aristocracia imperial.', { isCapital: true, sources: wiki('Vicovaro') }),
        location('viroleda', 'Viroleda', TYPES.CITY, P.NILFGAARD,
            'Cidade imperial conhecida por seus ferreiros e lâminas de alta qualidade.', { sources: wiki('Viroleda') }),
        location('baccala', 'Baccalà', TYPES.PORT_CITY, parentIds.NILFGAARD_CORE,
            'Cidade portuária situada nas proximidades da capital nilfgaardiana.', { aliases: ['Baccala'], sources: wiki('Baccal%C3%A0') }),
        location('winneburg-castle', 'Castelo de Winneburg', TYPES.CASTLE, 'world-political-nilfgaard-winneburg',
            'Fortificação da região imperial de Winneburg.', { aliases: ['Winneburg Castle'], sources: wiki('Winneburg_Castle') }),
        location('rhys-rhun', 'Castelo de Rhys-Rhun', TYPES.FORTRESS, parentIds.NAZAIR,
            'Fortaleza abandonada às margens do lago Muredach, mais tarde ligada a versões deliberadamente falsas sobre a queda de Vilgefortz.', {
                aliases: ['Rhys-Rhun Castle'], importance: 'major', sources: wiki('Rhys-Rhun_Castle', 'Rhys-Rhun — Witcher Wiki')
            }),
        location('stygga', 'Castelo de Stygga', TYPES.FORTRESS, P.NILFGAARD,
            'Fortaleza remota usada por Vilgefortz e cenário do confronto final de Geralt, Yennefer e Ciri contra o feiticeiro.', {
                aliases: ['Stygga Castle'], importance: 'legendary', status: 'Local canônico posteriormente destruído', sources: wiki('Stygga_Castle')
            })
    ]);

    function seedCanonicalLocations(world, options = {}) {
        const now = options.now || new Date().toISOString();
        const withPolitics = atlas.seedPoliticalAtlas(world, { now });
        const existingById = new Map(withPolitics.locations.map(entry => [entry.id, entry]));
        const catalogIds = new Set(CANONICAL_LOCATIONS.map(entry => entry.id));
        const official = CANONICAL_LOCATIONS.map(entry => {
            const existing = existingById.get(entry.id);
            return model.normalizeLocation({
                ...entry,
                coordinates: existing?.coordinates || entry.coordinates,
                createdAt: existing?.createdAt || now,
                updatedAt: existing && existing.canonicalVersion === CANONICAL_CATALOG_VERSION
                    ? existing.updatedAt
                    : now
            }, { now });
        });
        const retained = withPolitics.locations.filter(entry => !catalogIds.has(entry.id));
        return model.normalizeWorld({
            ...withPolitics,
            canonicalCatalogVersion: CANONICAL_CATALOG_VERSION,
            locations: [...retained, ...official],
            updatedAt: withPolitics.updatedAt || now
        }, { now });
    }

    function getCanonicalLocations(world) {
        return model.normalizeWorld(world).locations.filter(entry => entry.canonicalType);
    }

    return Object.freeze({
        CANONICAL_CATALOG_VERSION,
        TYPES,
        IDS,
        CANONICAL_LOCATIONS,
        seedCanonicalLocations,
        getCanonicalLocations
    });
});
