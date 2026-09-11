(function (root, factory) {
    const model = root?.worldModel
        || (typeof require === 'function' ? require('./world-model.js') : null);
    const atlas = root?.worldAtlasData
        || (typeof require === 'function' ? require('./world-atlas-data.js') : null);
    const locations = root?.worldLocationData
        || (typeof require === 'function' ? require('./world-location-data.js') : null);
    const api = factory(model, atlas, locations);

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.worldHistoryData = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (model, atlas, locations) {
    'use strict';

    const HISTORY_CATALOG_VERSION = 1;
    const CONTINUITIES = Object.freeze({
        SHARED: 'shared',
        BOOKS: 'books',
        GAMES: 'games'
    });
    const EVENT_TYPES = Object.freeze({
        WAR: 'war',
        OCCUPATION: 'occupation',
        DESTRUCTION: 'destruction',
        RECONSTRUCTION: 'reconstruction',
        POLITICAL: 'political',
        BATTLE: 'battle'
    });
    const P = atlas.IDS;
    const L = locations.IDS;

    const URLS = Object.freeze({
        northernWarOne: 'https://witcher.fandom.com/wiki/Northern_War_I',
        northernWarTwo: 'https://witcher.fandom.com/wiki/Northern_War_II',
        northernWarThree: 'https://witcher.fandom.com/wiki/Northern_War_III',
        peaceOfCintra: 'https://witcher.fandom.com/wiki/Peace_of_Cintra',
        thanedd: 'https://witcher.fandom.com/wiki/Thanedd_coup',
        cintra: 'https://witcher.fandom.com/wiki/Cintra',
        aedirn: 'https://witcher.fandom.com/wiki/Aedirn',
        redania: 'https://witcher.fandom.com/wiki/Redania',
        temeria: 'https://witcher.fandom.com/wiki/Temeria',
        kaedwen: 'https://witcher.fandom.com/wiki/Kaedwen',
        dolBlathanna: 'https://witcher.fandom.com/wiki/Dol_Blathanna',
        lyriaRivia: 'https://witcher.fandom.com/wiki/Lyria_and_Rivia',
        nilfgaard: 'https://witcher.fandom.com/wiki/Nilfgaardian_Empire',
        skellige: 'https://witcher.fandom.com/wiki/Skellige',
        toussaint: 'https://witcher.fandom.com/wiki/Toussaint',
        novigrad: 'https://witcher.fandom.com/wiki/Novigrad',
        stygga: 'https://witcher.fandom.com/wiki/Stygga_Castle',
        whiteOrchard: 'https://witcher.fandom.com/wiki/White_Orchard',
        timeline: 'https://witcher.fandom.com/wiki/Timeline'
    });

    function source(title, url) {
        return Object.freeze({ title, url });
    }

    function moment(year, era = 'DR', month = 1, day = 1, precision = 'year') {
        return Object.freeze({
            year: Math.max(1, Math.floor(Number(year) || 1)),
            era: String(era).toUpperCase() === 'AR' ? 'AR' : 'DR',
            month: Math.min(12, Math.max(1, Math.floor(Number(month) || 1))),
            day: Math.min(31, Math.max(1, Math.floor(Number(day) || 1))),
            precision: ['day', 'month', 'year'].includes(precision) ? precision : 'year'
        });
    }

    function endOfYear(year, era = 'DR') {
        return moment(year, era, 12, 31, 'year');
    }

    function situation(id, targetId, start, options = {}) {
        return Object.freeze({
            id: `world-history-situation-${id}`,
            targetId,
            start,
            end: options.end || null,
            ruler: options.ruler || '',
            controllerId: options.controllerId || targetId,
            controllerName: options.controllerName || '',
            sovereignty: options.sovereignty || '',
            politicalStatus: options.politicalStatus || '',
            physicalStatus: options.physicalStatus || 'Preservado',
            summary: options.summary || '',
            chronologyNote: options.chronologyNote || '',
            continuity: options.continuity || CONTINUITIES.SHARED,
            sources: Object.freeze(options.sources || [])
        });
    }

    function historicalEvent(id, title, type, start, affectedIds, description, options = {}) {
        return Object.freeze({
            id: `world-history-event-${id}`,
            title,
            type,
            start,
            end: Object.prototype.hasOwnProperty.call(options, 'end') ? options.end : start,
            affectedIds: Object.freeze(affectedIds || []),
            description,
            outcome: options.outcome || '',
            continuity: options.continuity || CONTINUITIES.SHARED,
            chronologyNote: options.chronologyNote || '',
            timelineEntryIds: Object.freeze(options.timelineEntryIds || []),
            sources: Object.freeze(options.sources || [])
        });
    }

    const SITUATIONS = Object.freeze([
        situation('nilfgaard-emhyr', P.NILFGAARD, moment(1257), {
            ruler: 'Emhyr var Emreis', controllerId: P.NILFGAARD,
            sovereignty: 'Império soberano', politicalStatus: 'Potência expansionista do Sul',
            summary: 'Emhyr governa o Império e conduz sua expansão sobre os Reinos do Norte.',
            sources: [source('Império Nilfgaardiano — Witcher Wiki', URLS.nilfgaard)]
        }),
        situation('cintra-calanthe', P.CINTRA, moment(1200), {
            end: endOfYear(1262), ruler: 'Calanthe e Eist Tuirseach', controllerId: P.CINTRA,
            sovereignty: 'Reino soberano', politicalStatus: 'Coroa cintriana independente',
            summary: 'Cintra permanece sob sua dinastia antes da invasão nilfgaardiana.',
            chronologyNote: 'O início deste recorte é apenas organizacional; a transição confirmada ocorre em 1263 DR.',
            sources: [source('Cintra — Witcher Wiki', URLS.cintra)]
        }),
        situation('cintra-occupied', P.CINTRA, moment(1263), {
            end: endOfYear(1267), ruler: 'Administração imperial', controllerId: P.NILFGAARD,
            sovereignty: 'Reino conquistado', politicalStatus: 'Ocupação nilfgaardiana', physicalStatus: 'Devastado',
            summary: 'A capital foi saqueada, a dinastia foi desarticulada e o reino passou ao controle de Nilfgaard.',
            chronologyNote: 'A invasão e o saque ocorreram durante 1263 DR; a fonte não fixa aqui um dia civil.',
            sources: [source('Cintra — Witcher Wiki', URLS.cintra), source('Primeira Guerra do Norte', URLS.northernWarOne)]
        }),
        situation('cintra-imperial-settlement', P.CINTRA, moment(1268, 'DR', 4, 2, 'day'), {
            ruler: 'Emhyr var Emreis e a falsa Ciri', controllerId: P.NILFGAARD,
            sovereignty: 'Coroa ligada ao Império', politicalStatus: 'Questão sucessória encerrada pelo Tratado de Cintra', physicalStatus: 'Em reconstrução',
            summary: 'O tratado preserva Cintra como unidade política sob a solução dinástica imposta por Nilfgaard.',
            sources: [source('Paz de Cintra', URLS.peaceOfCintra)]
        }),

        situation('aedirn-demavend-before-war', P.AEDIRN, moment(1263), {
            end: moment(1267, 'DR', 6, 30, 'day'), ruler: 'Demavend III', controllerId: P.AEDIRN,
            sovereignty: 'Reino soberano', politicalStatus: 'Reino do Norte',
            summary: 'Aedirn é governado por Demavend III e enfrenta guerrilhas e tensões em Lormark.',
            sources: [source('Aedirn — Witcher Wiki', URLS.aedirn)]
        }),
        situation('aedirn-second-war', P.AEDIRN, moment(1267, 'DR', 7, 1, 'month'), {
            end: moment(1268, 'DR', 4, 1, 'day'), ruler: 'Demavend III, no exílio', controllerId: P.NILFGAARD,
            sovereignty: 'Reino invadido e dividido', politicalStatus: 'Ocupação majoritariamente nilfgaardiana', physicalStatus: 'Devastado',
            summary: 'Nilfgaard ocupa grande parte do reino; Kaedwen toma Lormark e a Teméria ocupa Hagge.',
            sources: [source('Aedirn — Witcher Wiki', URLS.aedirn), source('Segunda Guerra do Norte', URLS.northernWarTwo)]
        }),
        situation('aedirn-restored', P.AEDIRN, moment(1268, 'DR', 4, 2, 'day'), {
            end: endOfYear(1270), ruler: 'Demavend III', controllerId: P.AEDIRN,
            sovereignty: 'Reino restaurado', politicalStatus: 'Reconstrução após a Paz de Cintra', physicalStatus: 'Em reconstrução',
            summary: 'A soberania retorna após a retirada imperial, embora Dol Blathanna conquiste autonomia.',
            sources: [source('Paz de Cintra', URLS.peaceOfCintra), source('Aedirn — Witcher Wiki', URLS.aedirn)]
        }),
        situation('aedirn-third-war', P.AEDIRN, moment(1271), {
            ruler: 'Sucessão variável após Demavend III', controllerId: P.NILFGAARD,
            sovereignty: 'Estado conquistado ou vassalo, conforme as escolhas', politicalStatus: 'Terceira Guerra do Norte', physicalStatus: 'Ocupado',
            summary: 'Após o regicídio, Aedirn cai diante de Nilfgaard; a forma exata de submissão depende dos eventos de The Witcher 2.',
            continuity: CONTINUITIES.GAMES,
            sources: [source('Aedirn — Witcher Wiki', URLS.aedirn), source('Terceira Guerra do Norte', URLS.northernWarThree)]
        }),

        situation('kaedwen-henselt', P.KAEDWEN, moment(1263), {
            end: endOfYear(1271), ruler: 'Henselt', controllerId: P.KAEDWEN,
            sovereignty: 'Reino soberano', politicalStatus: 'Reino do Norte',
            summary: 'Kaedwen permanece sob Henselt e disputa o Alto Aedirn/Lormark.',
            sources: [source('Kaedwen — Witcher Wiki', URLS.kaedwen)]
        }),
        situation('kaedwen-redanian-annexation', P.KAEDWEN, moment(1272), {
            ruler: 'Radovid V, pela anexação redaniana', controllerId: P.REDANIA,
            sovereignty: 'Anexado pela Redânia', politicalStatus: 'Território sob controle redaniano', physicalStatus: 'Militarizado',
            summary: 'A Redânia cruza as Montanhas Kestrel, absorve Kaedwen e incorpora suas forças militares.',
            continuity: CONTINUITIES.GAMES,
            sources: [source('Kaedwen — Witcher Wiki', URLS.kaedwen), source('Cronologia dos jogos', 'https://witcher.fandom.com/wiki/Timeline/Games')]
        }),

        situation('redania-vizimir', P.REDANIA, moment(1263), {
            end: moment(1267, 'DR', 6, 30, 'day'), ruler: 'Vizimir II', controllerId: P.REDANIA,
            sovereignty: 'Reino soberano', politicalStatus: 'Grande reino do Norte',
            summary: 'Vizimir II governa a Redânia e lidera a coalizão setentrional contra Nilfgaard.',
            sources: [source('Vizimir II — Witcher Wiki', 'https://witcher.fandom.com/wiki/Vizimir_II')]
        }),
        situation('redania-regency', P.REDANIA, moment(1267, 'DR', 7, 1, 'day'), {
            end: endOfYear(1270), ruler: 'Conselho de Regência de Hedwig, Dijkstra e Philippa Eilhart', controllerId: P.REDANIA,
            sovereignty: 'Reino soberano em regência', politicalStatus: 'Regência após o assassinato de Vizimir II',
            summary: 'O herdeiro Radovid ainda é menor; o Conselho de Regência conduz o governo durante a guerra.',
            sources: [source('Redânia — Witcher Wiki', URLS.redania), source('Vizimir II — Witcher Wiki', 'https://witcher.fandom.com/wiki/Vizimir_II')]
        }),
        situation('redania-radovid', P.REDANIA, moment(1271), {
            ruler: 'Radovid V', controllerId: P.REDANIA,
            sovereignty: 'Reino soberano', politicalStatus: 'Principal potência militar do Norte', physicalStatus: 'Militarizado',
            summary: 'Radovid governa a Redânia; o desfecho final da guerra permanece variável conforme as escolhas de The Witcher 3.',
            continuity: CONTINUITIES.GAMES,
            sources: [source('Redânia — Witcher Wiki', URLS.redania), source('Terceira Guerra do Norte', URLS.northernWarThree)]
        }),

        situation('temeria-foltest', P.TEMERIA, moment(1263), {
            end: endOfYear(1270), ruler: 'Foltest', controllerId: P.TEMERIA,
            sovereignty: 'Reino soberano', politicalStatus: 'Grande reino do Norte',
            summary: 'Foltest governa a Teméria, Sodden e seus territórios associados.',
            sources: [source('Foltest — Witcher Wiki', 'https://witcher.fandom.com/wiki/Foltest'), source('Teméria — Witcher Wiki', URLS.temeria)]
        }),
        situation('temeria-third-war', P.TEMERIA, moment(1271), {
            ruler: 'Sem monarca estável após Foltest', controllerId: P.NILFGAARD,
            sovereignty: 'Reino fragmentado e invadido', politicalStatus: 'Ocupação e resistência temeriana', physicalStatus: 'Devastado',
            summary: 'Após o regicídio, o exército é vencido e remanescentes mantêm uma campanha de guerrilha contra Nilfgaard.',
            continuity: CONTINUITIES.GAMES,
            sources: [source('Teméria — Witcher Wiki', URLS.temeria), source('Terceira Guerra do Norte', URLS.northernWarThree)]
        }),

        situation('lyria-rivia-meve', P.LYRIA_RIVIA, moment(1263), {
            end: moment(1267, 'DR', 6, 30, 'day'), ruler: 'Meve', controllerId: P.LYRIA_RIVIA,
            sovereignty: 'Confederação soberana', politicalStatus: 'Reinos do Norte',
            summary: 'Meve governa Líria e Rívia antes da segunda invasão nilfgaardiana.',
            sources: [source('Líria e Rívia — Witcher Wiki', URLS.lyriaRivia)]
        }),
        situation('lyria-rivia-occupied', P.LYRIA_RIVIA, moment(1267, 'DR', 7, 1, 'month'), {
            end: moment(1268, 'DR', 4, 1, 'day'), ruler: 'Meve, em campanha', controllerId: P.NILFGAARD,
            sovereignty: 'Reinos invadidos', politicalStatus: 'Ocupação nilfgaardiana', physicalStatus: 'Devastado',
            summary: 'Líria e Rívia caem nos primeiros dias da invasão; Meve conduz a resistência.',
            sources: [source('Segunda Guerra do Norte', URLS.northernWarTwo), source('Meve — Witcher Wiki', 'https://witcher.fandom.com/wiki/Meve')]
        }),
        situation('lyria-rivia-restored', P.LYRIA_RIVIA, moment(1268, 'DR', 4, 2, 'day'), {
            end: endOfYear(1270), ruler: 'Meve', controllerId: P.LYRIA_RIVIA,
            sovereignty: 'Confederação restaurada', politicalStatus: 'Reconstrução após a Paz de Cintra', physicalStatus: 'Em reconstrução',
            summary: 'A Paz de Cintra devolve Líria aos seus governantes e determina a retirada dos colonos nilfgaardianos.',
            sources: [source('Paz de Cintra', URLS.peaceOfCintra)]
        }),
        situation('lyria-rivia-third-war', P.LYRIA_RIVIA, moment(1271), {
            ruler: 'Meve, em resistência', controllerId: P.NILFGAARD,
            sovereignty: 'Território invadido', politicalStatus: 'Ocupação na Terceira Guerra do Norte', physicalStatus: 'Ocupado',
            summary: 'A região volta a cair durante o avanço imperial iniciado após a cúpula de Loc Muinne.',
            continuity: CONTINUITIES.GAMES,
            sources: [source('Terceira Guerra do Norte', URLS.northernWarThree)]
        }),

        situation('dol-blathanna-aedirn', P.DOL_BLATHANNA, moment(1200), {
            end: moment(1267, 'DR', 6, 30, 'day'), ruler: 'Governador de Vengerberg', controllerId: P.AEDIRN,
            sovereignty: 'Território de Aedirn', politicalStatus: 'Região sob administração humana',
            summary: 'A antiga terra élfica permanece administrada por Aedirn antes do Golpe de Thanedd.',
            chronologyNote: 'O início deste recorte é organizacional; a situação do verão de 1267 é a referência confirmada.',
            sources: [source('Dol Blathanna — Witcher Wiki', URLS.dolBlathanna)]
        }),
        situation('dol-blathanna-kingdom', P.DOL_BLATHANNA, moment(1267, 'DR', 7, 1, 'month'), {
            end: moment(1268, 'DR', 4, 1, 'day'), ruler: 'Francesca Findabair', controllerId: P.DOL_BLATHANNA,
            sovereignty: 'Reino élfico apoiado por Nilfgaard', politicalStatus: 'Estado cliente durante a guerra',
            summary: 'Francesca torna-se rainha do novo estado élfico após o Golpe de Thanedd.',
            sources: [source('Dol Blathanna — Witcher Wiki', URLS.dolBlathanna), source('Golpe de Thanedd', URLS.thanedd)]
        }),
        situation('dol-blathanna-freehold', P.DOL_BLATHANNA, moment(1268, 'DR', 4, 2, 'day'), {
            ruler: 'Francesca Findabair', controllerId: P.DOL_BLATHANNA,
            sovereignty: 'Feudo livre autônomo', politicalStatus: 'Ducado ligado a Aedirn por juramento de lealdade',
            summary: 'A Paz de Cintra reconhece a autonomia élfica sem tributo, sob compromisso de lealdade a Aedirn.',
            sources: [source('Paz de Cintra', URLS.peaceOfCintra), source('Dol Blathanna — Witcher Wiki', URLS.dolBlathanna)]
        }),

        situation('skellige-eist', P.SKELLIGE, moment(1257), {
            end: endOfYear(1262), ruler: 'Eist Tuirseach', controllerId: P.SKELLIGE,
            sovereignty: 'Arquipélago soberano', politicalStatus: 'Monarquia eletiva dos clãs',
            summary: 'Eist porta a coroa enquanto Crach an Craite exerce grande poder militar nas ilhas.',
            sources: [source('Eist Tuirseach — Witcher Wiki', 'https://witcher.fandom.com/wiki/Eist_Tuirseach')]
        }),
        situation('skellige-bran', P.SKELLIGE, moment(1263), {
            end: endOfYear(1271), ruler: 'Bran Tuirseach', controllerId: P.SKELLIGE,
            sovereignty: 'Arquipélago soberano', politicalStatus: 'Monarquia eletiva dos clãs',
            summary: 'Bran retorna ao trono após a morte de Eist e um breve interregno.',
            chronologyNote: 'A sucessão ocorre durante 1263 DR; o dia não foi definido pela fonte usada.',
            sources: [source('Bran Tuirseach — Witcher Wiki', 'https://witcher.fandom.com/wiki/Bran_Tuirseach')]
        }),
        situation('skellige-succession', P.SKELLIGE, moment(1272), {
            ruler: 'Sucessão dos clãs — resultado variável', controllerId: P.SKELLIGE,
            sovereignty: 'Arquipélago soberano', politicalStatus: 'Eleição real em disputa',
            summary: 'Cerys, Hjalmar ou Svanrige podem assumir o trono conforme as escolhas de The Witcher 3.',
            continuity: CONTINUITIES.GAMES,
            sources: [source('Skellige — Witcher Wiki', URLS.skellige)]
        }),

        situation('toussaint-anna-raymund', 'world-political-toussaint', moment(1258), {
            end: endOfYear(1264), ruler: 'Anna Henrietta e Raymund', controllerId: 'world-political-toussaint',
            sovereignty: 'Ducado vassalo autônomo', politicalStatus: 'Vassalo de Nilfgaard',
            summary: 'A duquesa e seu consorte governam Toussaint com ampla autonomia interna.',
            sources: [source('Toussaint — Witcher Wiki', URLS.toussaint)]
        }),
        situation('toussaint-anna', 'world-political-toussaint', moment(1265), {
            ruler: 'Anna Henrietta', controllerId: 'world-political-toussaint',
            sovereignty: 'Ducado vassalo autônomo', politicalStatus: 'Vassalo de Nilfgaard',
            summary: 'Anna Henrietta governa sozinha após a morte de Raymund.',
            sources: [source('Anna Henrietta — Witcher Wiki', 'https://witcher.fandom.com/wiki/Anna_Henrietta')]
        }),
        situation('novigrad-free-city', P.NOVIGRAD, moment(1200), {
            ruler: 'Hierarca e Conselho de Novigrad', controllerId: P.NOVIGRAD,
            sovereignty: 'Cidade livre', politicalStatus: 'Neutralidade formal e governo urbano',
            summary: 'Novigrad conserva autonomia formal; na Terceira Guerra sua neutralidade é pressionada por Redânia e Nilfgaard.',
            chronologyNote: 'O início deste recorte é organizacional; a condição exata varia ao longo da história da cidade.',
            sources: [source('Novigrad — Witcher Wiki', URLS.novigrad)]
        }),

        situation('cintra-city-sacked', 'world-canonical-cintra-city', moment(1263), {
            end: endOfYear(1267), controllerId: P.NILFGAARD,
            sovereignty: 'Capital ocupada', politicalStatus: 'Sob administração nilfgaardiana', physicalStatus: 'Saqueada e devastada',
            summary: 'O massacre e o saque deixam grande parte da população morta, deslocada ou refugiada.',
            sources: [source('Cintra — Witcher Wiki', URLS.cintra)]
        }),
        situation('cintra-city-rebuilding', 'world-canonical-cintra-city', moment(1268, 'DR', 4, 2, 'day'), {
            controllerId: P.NILFGAARD, sovereignty: 'Capital ligada ao Império', politicalStatus: 'Administração pós-tratado', physicalStatus: 'Em reconstrução',
            summary: 'A cidade entra em recuperação após anos de ocupação e devastação.',
            sources: [source('Paz de Cintra', URLS.peaceOfCintra)]
        }),
        situation('vengerberg-destroyed', 'world-canonical-vengerberg', moment(1267, 'DR', 7, 1, 'month'), {
            end: moment(1268, 'DR', 4, 1, 'day'), controllerId: P.NILFGAARD,
            sovereignty: 'Capital ocupada', politicalStatus: 'Cerco e ocupação nilfgaardiana', physicalStatus: 'Saqueada e devastada',
            summary: 'Vengerberg é cercada, saqueada e perde grande parte de sua população e guarnição.',
            sources: [source('Aedirn — Witcher Wiki', URLS.aedirn)]
        }),
        situation('vengerberg-rebuilding', 'world-canonical-vengerberg', moment(1268, 'DR', 4, 2, 'day'), {
            end: endOfYear(1270), controllerId: P.AEDIRN,
            sovereignty: 'Capital restaurada', politicalStatus: 'Administração aedirniana', physicalStatus: 'Em reconstrução',
            summary: 'A capital retorna a Aedirn e inicia a reconstrução após a guerra.',
            sources: [source('Paz de Cintra', URLS.peaceOfCintra)]
        }),
        situation('vengerberg-third-war', 'world-canonical-vengerberg', moment(1271), {
            controllerId: P.NILFGAARD, sovereignty: 'Capital conquistada', politicalStatus: 'Ocupação na Terceira Guerra', physicalStatus: 'Ocupada',
            summary: 'A situação acompanha a nova queda de Aedirn diante do avanço imperial.',
            continuity: CONTINUITIES.GAMES,
            sources: [source('Terceira Guerra do Norte', URLS.northernWarThree)]
        }),
        situation('thanedd-after-coup', L.THANEDD, moment(1267, 'DR', 7, 1, 'day'), {
            ruler: 'Sem autoridade colegiada reconhecida', controllerId: P.TEMERIA,
            sovereignty: 'Ilha em território temeriano', politicalStatus: 'Brotherhood dissolvida', physicalStatus: 'Danificada',
            summary: 'O golpe rompe a organização dos magos e deixa Aretuza, Garstang e Tor Lara marcadas pelo confronto.',
            sources: [source('Golpe de Thanedd', URLS.thanedd)]
        }),
        situation('stygga-destroyed', 'world-canonical-stygga', moment(1268), {
            controllerId: 'world-political-ebbing', sovereignty: 'Ruínas sem governo', politicalStatus: 'Local destruído', physicalStatus: 'Destruído',
            summary: 'A Loja das Feiticeiras destrói completamente a fortaleza após o confronto com Vilgefortz.',
            chronologyNote: 'A destruição é datada de 1268 DR, sem dia confirmado na fonte usada.',
            sources: [source('Castelo de Stygga — Witcher Wiki', URLS.stygga)]
        }),
        situation('white-orchard-occupied', 'world-canonical-white-orchard', moment(1272), {
            controllerId: P.NILFGAARD, sovereignty: 'Aldeia temeriana ocupada', politicalStatus: 'Administração militar nilfgaardiana', physicalStatus: 'Ocupada',
            summary: 'Nilfgaard vence a batalha local e estabelece controle militar sobre Pomar Branco.',
            continuity: CONTINUITIES.GAMES,
            sources: [source('Pomar Branco — Witcher Wiki', URLS.whiteOrchard)]
        }),
        situation('velen-frontline', 'world-political-temeria-velen', moment(1272), {
            controllerName: 'Controle fragmentado: Nilfgaard, forças locais e frente redaniana',
            sovereignty: 'Província temeriana disputada', politicalStatus: 'Zona de guerra e ocupação', physicalStatus: 'Devastada',
            summary: 'Velen torna-se terra de ninguém entre exércitos, guerrilhas e autoridades locais.',
            continuity: CONTINUITIES.GAMES,
            sources: [source('Terceira Guerra do Norte', URLS.northernWarThree)]
        })
    ]);

    const EVENTS = Object.freeze([
        historicalEvent('conjunction', 'Conjunção das Esferas', EVENT_TYPES.POLITICAL, moment(230, 'AR'), [model.ROOT_CONTINENT_ID],
            'O cataclismo entre mundos transforma definitivamente povos, magia e criaturas do Continente.', {
                chronologyNote: 'Marco remoto preservado em AR; não representa uma data civil precisa.',
                timelineEntryIds: ['conjunction-of-spheres'],
                sources: [source('Linha do tempo — Witcher Wiki', URLS.timeline)]
            }),
        historicalEvent('first-northern-war', 'Primeira Guerra do Norte', EVENT_TYPES.WAR, moment(1263),
            [P.NILFGAARD, P.CINTRA, P.TEMERIA, P.REDANIA, P.AEDIRN, P.KAEDWEN, 'world-political-temeria-sodden'],
            'Nilfgaard invade Cintra e avança sobre Sodden, mas é detido pela coalizão setentrional.', {
                end: endOfYear(1263), outcome: 'Cintra e o Alto Sodden permanecem ocupados; Nilfgaard é derrotado na Colina de Sodden.',
                chronologyNote: 'A guerra é registrada em 1262–1263 em algumas fontes; este recorte destaca os acontecimentos de 1263.',
                sources: [source('Primeira Guerra do Norte', URLS.northernWarOne)]
            }),
        historicalEvent('sack-of-cintra', 'Saque de Cintra', EVENT_TYPES.DESTRUCTION, moment(1263),
            [P.CINTRA, 'world-canonical-cintra-city', 'world-canonical-cintra-castle'],
            'O exército nilfgaardiano toma a capital, massacra seus habitantes e desarticula a casa real.', {
                outcome: 'Cintra passa à ocupação de Nilfgaard.', chronologyNote: 'A fonte usada informa o ano, não o dia.',
                sources: [source('Cintra — Witcher Wiki', URLS.cintra)]
            }),
        historicalEvent('thanedd-coup', 'Golpe de Thanedd', EVENT_TYPES.DESTRUCTION, moment(1267, 'DR', 7, 1, 'day'),
            [L.THANEDD, 'world-canonical-aretuza', 'world-canonical-garstang', 'world-canonical-tor-lara'],
            'Facções pró-Norte e pró-Nilfgaard entram em confronto; soldados redanianos, Scoia’tael e magos lutam na ilha.', {
                outcome: 'A Irmandade dos Feiticeiros é dissolvida e a Segunda Guerra do Norte se precipita.',
                timelineEntryIds: ['thanedd-coup-details'],
                sources: [source('Golpe de Thanedd', URLS.thanedd)]
            }),
        historicalEvent('second-northern-war', 'Segunda Guerra do Norte', EVENT_TYPES.WAR, moment(1267, 'DR', 7, 1, 'month'),
            [P.NILFGAARD, P.AEDIRN, P.LYRIA_RIVIA, P.TEMERIA, P.REDANIA, P.KAEDWEN, P.CINTRA, P.DOL_BLATHANNA],
            'Nilfgaard invade Aedirn e Líria/Rívia após o colapso político de Thanedd.', {
                end: moment(1268, 'DR', 4, 2, 'day'), outcome: 'A vitória do Norte em Brenna conduz à Paz de Cintra.',
                sources: [source('Segunda Guerra do Norte', URLS.northernWarTwo), source('Paz de Cintra', URLS.peaceOfCintra)]
            }),
        historicalEvent('occupation-aedirn-lyria', 'Ocupação de Aedirn, Líria e Rívia', EVENT_TYPES.OCCUPATION, moment(1267, 'DR', 7, 1, 'month'),
            [P.AEDIRN, P.LYRIA_RIVIA, 'world-canonical-vengerberg', 'world-canonical-aldersberg'],
            'As forças imperiais vencem em Aldersberg, ocupam os reinos orientais e saqueiam Vengerberg.', {
                end: moment(1268, 'DR', 4, 1, 'day'), outcome: 'A retirada é determinada após Brenna e a Paz de Cintra.',
                sources: [source('Aedirn — Witcher Wiki', URLS.aedirn), source('Segunda Guerra do Norte', URLS.northernWarTwo)]
            }),
        historicalEvent('vengerberg-destruction', 'Saque de Vengerberg', EVENT_TYPES.DESTRUCTION, moment(1267, 'DR', 7, 1, 'month'),
            ['world-canonical-vengerberg', P.AEDIRN],
            'A capital de Aedirn é sitiada e saqueada durante a invasão.', {
                outcome: 'A cidade perde milhares de habitantes e precisa ser reconstruída.',
                sources: [source('Aedirn — Witcher Wiki', URLS.aedirn)]
            }),
        historicalEvent('peace-of-cintra', 'Paz de Cintra', EVENT_TYPES.POLITICAL, moment(1268, 'DR', 4, 2, 'day'),
            [P.NILFGAARD, P.CINTRA, P.TEMERIA, P.AEDIRN, P.LYRIA_RIVIA, P.DOL_BLATHANNA],
            'O tratado encerra a Segunda Guerra do Norte e redefine soberania, retirada de tropas e reparações.', {
                outcome: 'Líria, Brugge e territórios temerianos são devolvidos; Dol Blathanna obtém autonomia.',
                sources: [source('Paz de Cintra', URLS.peaceOfCintra)]
            }),
        historicalEvent('postwar-reconstruction', 'Reconstrução após a Segunda Guerra', EVENT_TYPES.RECONSTRUCTION, moment(1268, 'DR', 4, 2, 'day'),
            [P.AEDIRN, P.LYRIA_RIVIA, P.TEMERIA, 'world-canonical-vengerberg', 'world-canonical-cintra-city'],
            'Cidades, aldeias, castelos, minas e oficinas devastados entram em lenta reconstrução.', {
                end: endOfYear(1270), outcome: 'Os reinos recuperam parte da administração, mas permanecem economicamente fragilizados.',
                sources: [source('Paz de Cintra', URLS.peaceOfCintra)]
            }),
        historicalEvent('stygga-destruction', 'Destruição do Castelo de Stygga', EVENT_TYPES.DESTRUCTION, moment(1268),
            ['world-canonical-stygga'],
            'A Loja das Feiticeiras apaga a fortaleza do mapa após a derrota de Vilgefortz.', {
                outcome: 'Restam apenas ruínas e relatos fragmentários.', chronologyNote: 'A fonte usada informa apenas 1268 DR.',
                sources: [source('Castelo de Stygga — Witcher Wiki', URLS.stygga)]
            }),
        historicalEvent('northern-regicides', 'Regicídios do Norte', EVENT_TYPES.POLITICAL, moment(1271),
            [P.AEDIRN, P.TEMERIA, P.REDANIA],
            'Os assassinatos de Demavend III e Foltest desestabilizam Aedirn e Teméria.', {
                outcome: 'O vazio de poder prepara a nova invasão nilfgaardiana.', continuity: CONTINUITIES.GAMES,
                chronologyNote: 'Os eventos pertencem à continuidade dos jogos.',
                sources: [source('Terceira Guerra do Norte', URLS.northernWarThree)]
            }),
        historicalEvent('loc-muinne-summit', 'Cúpula de Loc Muinne', EVENT_TYPES.POLITICAL, moment(1271),
            [L.LOC_MUINNE, P.REDANIA, P.KAEDWEN, P.AEDIRN, P.TEMERIA],
            'Governantes, diplomatas e magos tentam redefinir fronteiras e restaurar instituições mágicas.', {
                outcome: 'A cúpula fracassa e a perseguição aos magos se intensifica.', continuity: CONTINUITIES.GAMES,
                sources: [source('Terceira Guerra do Norte', URLS.northernWarThree)]
            }),
        historicalEvent('third-northern-war', 'Terceira Guerra do Norte', EVENT_TYPES.WAR, moment(1271),
            [P.NILFGAARD, P.AEDIRN, P.LYRIA_RIVIA, P.TEMERIA, P.REDANIA, P.KAEDWEN, P.NOVIGRAD],
            'Nilfgaard lança nova invasão e avança até a linha do Pontar, onde encontra resistência redaniana.', {
                end: null, outcome: 'O desfecho depende das escolhas e finais de The Witcher 3.', continuity: CONTINUITIES.GAMES,
                chronologyNote: 'Continuidade dos jogos; a situação final não é fixada pelo catálogo.',
                sources: [source('Terceira Guerra do Norte', URLS.northernWarThree)]
            }),
        historicalEvent('kaedwen-annexed', 'Anexação de Kaedwen pela Redânia', EVENT_TYPES.OCCUPATION, moment(1272),
            [P.KAEDWEN, P.REDANIA, 'world-canonical-ard-carraigh'],
            'As forças de Radovid cruzam as Montanhas Kestrel e incorporam o reino e seu exército.', {
                outcome: 'Kaedwen passa a integrar os domínios redanianos.', continuity: CONTINUITIES.GAMES,
                sources: [source('Kaedwen — Witcher Wiki', URLS.kaedwen)]
            }),
        historicalEvent('white-orchard-occupation', 'Ocupação de Pomar Branco', EVENT_TYPES.OCCUPATION, moment(1272),
            ['world-canonical-white-orchard', P.TEMERIA, P.NILFGAARD],
            'Tropas nilfgaardianas vencem a batalha local e ocupam a aldeia temeriana.', {
                outcome: 'A região passa a uma administração militar imperial.', continuity: CONTINUITIES.GAMES,
                sources: [source('Pomar Branco — Witcher Wiki', URLS.whiteOrchard)]
            })
    ]);

    function toAstronomicalYear(value) {
        const year = Math.max(1, Math.floor(Number(value?.year) || 1));
        return String(value?.era || 'DR').toUpperCase() === 'AR' ? 1 - year : year;
    }

    function toComparable(value, edge = 'start') {
        const astronomicalYear = toAstronomicalYear(value);
        const precision = value?.precision || 'day';
        const month = precision === 'year' && edge === 'end' ? 12 : Math.min(12, Math.max(1, Number(value?.month) || 1));
        const day = precision !== 'day' && edge === 'end' ? 31 : Math.min(31, Math.max(1, Number(value?.day) || 1));
        return astronomicalYear * 400 + month * 32 + day;
    }

    function compareMoments(left, right) {
        return toComparable(left) - toComparable(right);
    }

    function normalizeChronology(value = {}) {
        const source = value && typeof value === 'object' ? value : {};
        return {
            year: Math.max(1, Math.floor(Number(source.year) || 1276)),
            era: String(source.era || 'DR').toUpperCase() === 'AR' ? 'AR' : 'DR',
            month: Math.min(12, Math.max(1, Math.floor(Number(source.month) || 1))),
            day: Math.min(31, Math.max(1, Math.floor(Number(source.day) || 1))),
            precision: 'day'
        };
    }

    function isActiveDuring(entry, chronology) {
        const current = toComparable(normalizeChronology(chronology));
        const start = toComparable(entry.start, 'start');
        const end = entry.end ? toComparable(entry.end, 'end') : Number.POSITIVE_INFINITY;
        return current >= start && current <= end;
    }

    function continuityMatches(entry, continuity = CONTINUITIES.GAMES) {
        if (continuity === 'all') return true;
        return entry.continuity === CONTINUITIES.SHARED || entry.continuity === continuity;
    }

    function getActiveSituation(targetId, chronology, options = {}) {
        const continuity = options.continuity || CONTINUITIES.GAMES;
        return SITUATIONS
            .filter(entry => entry.targetId === targetId && continuityMatches(entry, continuity) && isActiveDuring(entry, chronology))
            .sort((left, right) => {
                const continuityPriority = Number(right.continuity === continuity) - Number(left.continuity === continuity);
                return continuityPriority || compareMoments(right.start, left.start);
            })[0] || null;
    }

    function getActiveEvents(chronology, options = {}) {
        const continuity = options.continuity || CONTINUITIES.GAMES;
        return EVENTS.filter(entry => continuityMatches(entry, continuity) && isActiveDuring(entry, chronology));
    }

    function getEventsForYear(chronology, options = {}) {
        const current = normalizeChronology(chronology);
        const continuity = options.continuity || CONTINUITIES.GAMES;
        return EVENTS.filter(entry => {
            if (!continuityMatches(entry, continuity)) return false;
            const startYear = toAstronomicalYear(entry.start);
            const endYear = entry.end ? toAstronomicalYear(entry.end) : Number.POSITIVE_INFINITY;
            const currentYear = toAstronomicalYear(current);
            return currentYear >= startYear && currentYear <= endYear;
        });
    }

    function getRecentEvents(chronology, options = {}) {
        const continuity = options.continuity || CONTINUITIES.GAMES;
        const limit = Math.max(0, Math.floor(Number(options.limit) || 6));
        const current = toComparable(normalizeChronology(chronology));
        return EVENTS
            .filter(entry => continuityMatches(entry, continuity) && toComparable(entry.start, 'start') <= current)
            .sort((left, right) => compareMoments(right.start, left.start))
            .slice(0, limit);
    }

    function getHistoricalSnapshot(world, chronology, options = {}) {
        const current = normalizeChronology(chronology);
        const continuity = options.continuity || CONTINUITIES.GAMES;
        const locationIds = new Set((world?.locations || []).map(entry => entry.id));
        const situations = [...new Set(SITUATIONS.map(entry => entry.targetId))]
            .filter(targetId => locationIds.has(targetId))
            .map(targetId => getActiveSituation(targetId, current, { continuity }))
            .filter(Boolean);
        return {
            chronology: current,
            continuity,
            situations,
            activeEvents: getActiveEvents(current, { continuity }),
            yearEvents: getEventsForYear(current, { continuity }),
            recentEvents: getRecentEvents(current, { continuity, limit: options.recentLimit || 6 })
        };
    }

    function formatMoment(value) {
        const era = value?.era === 'AR' ? 'AR' : 'DR';
        const year = Math.max(1, Number(value?.year) || 1);
        if (value?.precision === 'day') return `${String(value.day).padStart(2, '0')}/${String(value.month).padStart(2, '0')}/${year} ${era}`;
        if (value?.precision === 'month') return `${String(value.month).padStart(2, '0')}/${year} ${era}`;
        return `${year} ${era}`;
    }

    function formatPeriod(entry) {
        const start = formatMoment(entry.start);
        if (!entry.end) return `Desde ${start}`;
        if (compareMoments(entry.start, entry.end) === 0) return start;
        return `${start} — ${formatMoment(entry.end)}`;
    }

    function seedHistoricalLayer(world, options = {}) {
        const now = options.now || new Date().toISOString();
        return model.normalizeWorld({
            ...model.normalizeWorld(world, { now }),
            historicalCatalogVersion: HISTORY_CATALOG_VERSION
        }, { now });
    }

    return Object.freeze({
        HISTORY_CATALOG_VERSION,
        CONTINUITIES,
        EVENT_TYPES,
        URLS,
        SITUATIONS,
        EVENTS,
        moment,
        toAstronomicalYear,
        toComparable,
        compareMoments,
        normalizeChronology,
        isActiveDuring,
        getActiveSituation,
        getActiveEvents,
        getEventsForYear,
        getRecentEvents,
        getHistoricalSnapshot,
        formatMoment,
        formatPeriod,
        seedHistoricalLayer
    });
});
