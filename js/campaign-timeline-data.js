(function initializeCampaignTimelineData(global) {
    'use strict';

    const SOURCE_LABEL = 'Cronologia histórica fornecida pelo usuário';
    const MONTH_NAMES = Object.freeze([
        'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
        'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ]);

    const CATEGORIES = Object.freeze([
        Object.freeze({ id: 'peoples', label: 'Povos e migrações' }),
        Object.freeze({ id: 'magic', label: 'Magia e Conjunção' }),
        Object.freeze({ id: 'faith', label: 'Fé e profecias' }),
        Object.freeze({ id: 'culture', label: 'Cultura e conhecimento' }),
        Object.freeze({ id: 'politics', label: 'Política e reinos' }),
        Object.freeze({ id: 'war', label: 'Guerras e conflitos' }),
        Object.freeze({ id: 'people', label: 'Nascimentos e mortes' }),
        Object.freeze({ id: 'witchers', label: 'Bruxos' }),
        Object.freeze({ id: 'plague', label: 'Pragas e crises' }),
        Object.freeze({ id: 'stories', label: 'Relatos e jornadas' }),
        Object.freeze({ id: 'climate', label: 'Clima e futuro' })
    ]);

    const PERIODS = Object.freeze([
        Object.freeze({ id: 'ar', label: 'Antes da Ressurreição' }),
        Object.freeze({ id: 'transition', label: 'Mudança de era' }),
        Object.freeze({ id: 'dr-1-999', label: '1–999 DR' }),
        Object.freeze({ id: 'dr-1000-1199', label: '1000–1199 DR' }),
        Object.freeze({ id: 'dr-1200-1299', label: '1200–1299 DR' }),
        Object.freeze({ id: 'dr-1300-plus', label: '1300 DR em diante' }),
        Object.freeze({ id: 'uncertain', label: 'Data incerta ou relativa' })
    ]);

    const ANNUAL_EVENT_GROUPS = Object.freeze([
        Object.freeze({ id: 'winter', label: 'Inverno', icon: '❄️' }),
        Object.freeze({ id: 'spring', label: 'Primavera', icon: '🌸' }),
        Object.freeze({ id: 'summer', label: 'Verão', icon: '☀️' }),
        Object.freeze({ id: 'autumn', label: 'Outono', icon: '🍂' }),
        Object.freeze({ id: 'political', label: 'Feriados políticos', icon: '🏛️' }),
        Object.freeze({ id: 'regional', label: 'Tradições regionais', icon: '🪵' }),
        Object.freeze({ id: 'guild', label: 'Guildas e conclaves', icon: '⚔️' })
    ]);

    function isValidAnnualDate(value) {
        const match = String(value || '').match(/^(\d{2})-(\d{2})$/);
        if (!match) return false;
        const month = Number(match[1]);
        const day = Number(match[2]);
        const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth[month - 1];
    }

    function getAnnualEventGroup(id) {
        return ANNUAL_EVENT_GROUPS.find(group => group.id === id) || null;
    }

    function defineAnnualEvent(value) {
        const group = getAnnualEventGroup(value.group);
        if (!group) throw new Error(`Grupo anual inválido: ${value.group}`);
        const calendarDates = [...new Set([value.date, ...(value.calendarDates || [])])];
        if (!calendarDates.length || calendarDates.some(date => !isValidAnnualDate(date))) {
            throw new Error(`Data anual inválida: ${value.id}`);
        }
        const [month, day] = calendarDates[0].split('-').map(Number);
        return Object.freeze({
            id: `builtin-annual-${String(value.id)}`,
            type: 'festival',
            title: String(value.title),
            description: String(value.description),
            date: `1276-${calendarDates[0]}`,
            era: 'DR',
            time: '00:00',
            allDay: true,
            annual: true,
            completed: false,
            contact: String(value.contact || ''),
            reward: 0,
            rewardDistribution: null,
            source: 'witcher-annual-calendar',
            sourceKind: 'annual-official',
            sourceLabel: 'Calendário anual do Continente',
            readonly: true,
            icon: String(value.icon || group.icon),
            group: group.id,
            groupLabel: group.label,
            month,
            day,
            calendarDates: Object.freeze(calendarDates),
            dateLabel: String(value.dateLabel || ''),
            scheduleNote: String(value.scheduleNote || ''),
            references: Object.freeze([...(value.references || [])].map(reference => Object.freeze({ ...reference })))
        });
    }

    const ANNUAL_EVENTS = Object.freeze([
        defineAnnualEvent({
            id: 'saovine', group: 'winter', icon: '🌑', title: 'Saovine', date: '10-31', calendarDates: ['11-01'],
            dateLabel: '31 de outubro até 1º de novembro',
            description: 'Ano Novo Élfico e festival do Estiolamento, quando a natureza começa a murchar e o inverno se inicia. A celebração atravessa a meia-noite; seu segundo dia marca o novo ano dos elfos. É uma noite associada aos mortos, espectros e feitiçaria, na qual muitas pessoas evitam deixar suas casas.',
            references: [
                { label: 'Calendário Élfico — Witcher Games Wiki', url: 'https://witcher-games.fandom.com/wiki/Elven_calendar' },
                { label: 'Calendário Élfico — Witcher Wiki', url: 'https://witcher.fandom.com/pt-br/wiki/Calend%C3%A1rio_%C3%89lfico' }
            ]
        }),
        defineAnnualEvent({
            id: 'midinvaerne', group: 'winter', icon: '🌌', title: 'Midinváerne', date: '12-21',
            dateLabel: '21 de dezembro',
            description: 'Solstício de Inverno e noite mais longa do ano. Entre humanos é um período de recolhimento; entre elfos celebra o renascimento do sol, pois os dias voltam a crescer depois desta data.',
            scheduleNote: 'Foi adotado 21 de dezembro entre as duas datas tradicionalmente aceitas.',
            references: [{ label: 'Calendário Élfico — Witcher Wiki', url: 'https://witcher.fandom.com/wiki/Elven_calendar' }]
        }),
        defineAnnualEvent({
            id: 'imbaelk', group: 'spring', icon: '🌱', title: 'Imbaelk', date: '02-02',
            dateLabel: '2 de fevereiro',
            description: 'Festival da Germinação. Celebra o despertar sutil da natureza sob a neve e representa um período de purificação e preparação da terra para o plantio.',
            references: [
                { label: 'Discussão sobre o calendário', url: 'https://www.reddit.com/r/witcher/comments/3c9bkx/question_about_time_in_the_witcher_series/' },
                { label: 'Calendário Élfico — Witcher Wiki', url: 'https://witcher.fandom.com/pt-br/wiki/Calend%C3%A1rio_%C3%89lfico' }
            ]
        }),
        defineAnnualEvent({
            id: 'birke', group: 'spring', icon: '🌼', title: 'Birke', date: '03-22',
            dateLabel: '22 de março',
            description: 'Equinócio de Primavera, marco do início oficial da estação e do fim da neve no Continente. Comunidades camponesas celebram a sobrevivência ao rigor do inverno.',
            references: [
                { label: 'Calendário Élfico — Witcher Wiki', url: 'https://witcher.fandom.com/wiki/Elven_calendar' },
                { label: 'Calendário Élfico — Witcher Wiki PT-BR', url: 'https://witcher.fandom.com/pt-br/wiki/Calend%C3%A1rio_%C3%89lfico' }
            ]
        }),
        defineAnnualEvent({
            id: 'belleteyn', group: 'summer', icon: '🔥', title: 'Belleteyn', date: '05-01',
            dateLabel: '1º de maio',
            description: 'Festival do Florescimento e uma das noites mais importantes do Continente. Fogueiras e danças celebram fertilidade, amor e vida. A data também é associada aos reencontros de Geralt e Yennefer e aos aniversários de Yennefer e Ciri.',
            references: [
                { label: 'Linha do tempo — Witcher Fanon', url: 'https://the-witcher-fanon.fandom.com/wiki/The_Witcher_Fanon_Wikia:Timeline' },
                { label: 'Belleteyn — Witcher Wiki', url: 'https://witcher.fandom.com/pt-br/wiki/Belleteyn' },
                { label: 'Timeline', url: 'https://www.scribd.com/document/967503698/Timeline' }
            ]
        }),
        defineAnnualEvent({
            id: 'midaete', group: 'summer', icon: '☀️', title: 'Midaëte', date: '06-22',
            dateLabel: '22 de junho',
            description: 'Solstício de Verão e dia mais longo do ano. Rituais de fogo e sol acompanham a colheita de ervas mágicas, às quais se atribuem propriedades especiais nesta noite.',
            references: [
                { label: 'Calendário Élfico — Witcher Wiki', url: 'https://witcher.fandom.com/wiki/Elven_calendar' },
                { label: 'Calendário Élfico — Witcher Wiki PT-BR', url: 'https://witcher.fandom.com/pt-br/wiki/Calend%C3%A1rio_%C3%89lfico' }
            ]
        }),
        defineAnnualEvent({
            id: 'lammas', group: 'autumn', icon: '🌾', title: 'Lammas', date: '08-01',
            dateLabel: '1º de agosto',
            description: 'Festival da Maturação e da primeira colheita. A fartura de grãos, frutas e pães é celebrada enquanto o Continente inicia sua transição para o clima frio.',
            references: [
                { label: 'Discussão sobre o calendário', url: 'https://www.reddit.com/r/witcher/comments/3c9bkx/question_about_time_in_the_witcher_series/' },
                { label: 'Calendário Élfico — Witcher Wiki', url: 'https://witcher.fandom.com/pt-br/wiki/Calend%C3%A1rio_%C3%89lfico' }
            ]
        }),
        defineAnnualEvent({
            id: 'velen-equinox', group: 'autumn', icon: '🍂', title: 'Velen', date: '09-23',
            dateLabel: '23 de setembro',
            description: 'Equinócio de Outono, quando dia e noite têm duração equivalente. Celebra a colheita final e a preparação dos estoques para o inverno.',
            scheduleNote: 'O nome desta festividade não deve ser confundido com a região pantanosa de Velen.'
        }),
        defineAnnualEvent({
            id: 'resurrection-day', group: 'political', icon: '🌅', title: 'Dia da Ressurreição', date: '01-01',
            dateLabel: '1º de janeiro',
            description: 'Início do ano civil nos reinos humanos. Celebra o renascimento mítico da natureza e serve como referência para a contagem oficial dos anos no Continente, embora o ano novo mágico seja celebrado em Saovine.',
            references: [{ label: 'Calendário Élfico — Witcher Wiki', url: 'https://witcher.fandom.com/pt-br/wiki/Calend%C3%A1rio_%C3%89lfico' }]
        }),
        defineAnnualEvent({
            id: 'great-knights-tournament', group: 'political', icon: '🏇', title: 'Biruta — Grande Torneio de Cavaleiros', date: '07-15',
            dateLabel: '15 de julho', contact: 'Beauclair, Toussaint',
            description: 'Cavaleiros andantes de várias regiões viajam a Beauclair para competir em justa, arco e flecha e arenas de combate, buscando glória e o favor da duquesa Anna Henrietta.',
            scheduleNote: 'Data de organização da campanha: 15 de julho, pois a tradição não possui dia anual fixo informado.'
        }),
        defineAnnualEvent({
            id: 'new-wine-festival', group: 'political', icon: '🍷', title: 'Festa do Vinho Novo', date: '10-15',
            dateLabel: '15 de outubro', contact: 'Toussaint',
            description: 'Ápice cultural de Toussaint, quando os grandes vinhedos abrem os primeiros barris da temporada. Arte, poesia, banquetes luxuosos e farta embriaguez tomam a corte.',
            scheduleNote: 'Data de organização da campanha: 15 de outubro, representando o final do outono.'
        }),
        defineAnnualEvent({
            id: 'dziady', group: 'regional', icon: '🕯️', title: 'Noite dos Antepassados — Dziady', date: '10-31',
            dateLabel: '31 de outubro', contact: 'Velen e comunidades eslavas',
            description: 'Celebração espiritual dos camponeses, conduzida por um premeditador. Aldeões se reúnem à noite em lugares sagrados ou cemitérios, oferecem banquetes aos mortos e buscam dar paz às almas penadas e purificar a comunidade de maldições.'
        }),
        defineAnnualEvent({
            id: 'mages-conclave', group: 'guild', icon: '🔮', title: 'Conclave dos Magos', date: '09-08',
            dateLabel: '8 de setembro', contact: 'Aretuza ou Ban Ard',
            description: 'Grande encontro político e cultural dos usuários de magia. Magos e feiticeiras debatem leis, compartilham descobertas e participam de bailes monumentais marcados por vinho caro, vestimentas extravagantes e ilusões místicas.',
            scheduleNote: 'Data de organização da campanha: 8 de setembro. O conclave não possui data fixa na tradição e pode ser remarcado pelo mestre.'
        })
    ]);

    function normalizeSearch(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLocaleLowerCase('pt-BR')
            .replace(/[^a-z0-9]+/g, '');
    }

    function parseTimelineHeading(value) {
        const raw = String(value || '').trim();
        const dated = raw.match(/^(\d+)\s*(AR|DR)$/i);
        if (dated) {
            return {
                kind: 'dated',
                year: Number(dated[1]),
                era: dated[2].toUpperCase()
            };
        }
        if (/^\d+$/.test(raw)) {
            return { kind: 'ambiguous-year', year: Number(raw), era: null };
        }
        if (/^\?+$/.test(raw)) return { kind: 'unknown', year: null, era: null };
        const relative = raw.match(/^(?:aproximadamente\s+)?(\d+)\s+anos?\s+no\s+futuro$/i);
        if (relative) {
            return { kind: 'relative-future', yearsInFuture: Number(relative[1]), year: null, era: null };
        }
        return { kind: 'unknown', year: null, era: null };
    }

    function getAstronomicalYear(year, era) {
        return era === 'AR' ? 1 - Number(year) : Number(year);
    }

    function getPeriodId(parsed) {
        if (parsed.kind === 'ambiguous-year') return 'transition';
        if (parsed.kind !== 'dated') return 'uncertain';
        if (parsed.era === 'AR') return 'ar';
        if (parsed.year <= 999) return 'dr-1-999';
        if (parsed.year <= 1199) return 'dr-1000-1199';
        if (parsed.year <= 1299) return 'dr-1200-1299';
        return 'dr-1300-plus';
    }

    function getCategory(categoryId) {
        return CATEGORIES.find(category => category.id === categoryId) || null;
    }

    function getPeriod(periodId) {
        return PERIODS.find(period => period.id === periodId) || null;
    }

    function formatTimelineDate(entry) {
        const parsed = entry.parsedDate || parseTimelineHeading(entry.heading);
        if (parsed.kind === 'dated') {
            const month = Number(entry.month);
            return month >= 1 && month <= 12
                ? `${MONTH_NAMES[month - 1]} de ${parsed.year} ${parsed.era}`
                : `${parsed.year} ${parsed.era}`;
        }
        if (parsed.kind === 'ambiguous-year') return `${parsed.year} · era não informada`;
        if (parsed.kind === 'relative-future') return entry.heading;
        return 'Data desconhecida';
    }

    function buildSortValue(parsed, month, sortHint) {
        if (parsed.kind === 'dated') {
            return getAstronomicalYear(parsed.year, parsed.era) * 12 + Math.max(0, Number(month || 1) - 1);
        }
        if (Number.isFinite(Number(sortHint))) return Number(sortHint);
        if (parsed.kind === 'relative-future') return Number.MAX_SAFE_INTEGER;
        return Number.MAX_SAFE_INTEGER - 1;
    }

    function defineEntry(value, sourceOrder) {
        const parsedDate = parseTimelineHeading(value.heading);
        const month = Number(value.month);
        const safeMonth = month >= 1 && month <= 12 ? month : null;
        const category = getCategory(value.category);
        if (!category) throw new Error(`Categoria inválida na cronologia: ${value.category}`);
        const entry = {
            id: String(value.id),
            sourceKind: 'official',
            sourceLabel: SOURCE_LABEL,
            sourceOrder,
            heading: String(value.heading),
            text: String(value.text),
            category: category.id,
            categoryLabel: category.label,
            parsedDate,
            year: parsedDate.year,
            era: parsedDate.era,
            month: safeMonth,
            day: null,
            precision: parsedDate.kind === 'dated' ? (safeMonth ? 'month' : 'year') : parsedDate.kind,
            period: getPeriodId(parsedDate),
            chronologyNote: String(value.chronologyNote || ''),
            references: Object.freeze([...(value.references || [])].map(reference => Object.freeze({ ...reference }))),
            sortValue: buildSortValue(parsedDate, safeMonth, value.sortHint)
        };
        entry.displayDate = formatTimelineDate(entry);
        return Object.freeze(entry);
    }

    const RAW_ENTRIES = [
        { id: 'dwarves-arrive', heading: '2700 AR', category: 'peoples', text: 'Anöes chegam no Continente. Gnomos já tinham pequenas colônias em Mahakan e Tir Tochair' },
        { id: 'age-of-migration', heading: '2230 AR', category: 'peoples', text: 'Era da Migração. Elfos Aen Seidhe chegam ao Continente em seus navios brancos.' },
        { id: 'conjunction-of-spheres', heading: '230 AR', category: 'magic', text: 'A Conjunção das Esferas.' },
        { id: 'humans-arrive', heading: '230 AR', category: 'peoples', text: 'Humanos chegam no Continente.' },
        { id: 'melitele-first-records', heading: '230 AR', category: 'faith', text: 'Primeiros registros do Culto da deusa Melitele' },
        { id: 'runic-writing', heading: '230 AR', category: 'culture', text: 'Desenvolvimento da língua escrita baseada em runas e ideogramas' },
        {
            id: 'resurrection', heading: '1', category: 'faith', text: 'A Ressurreição', sortHint: 0.5,
            chronologyNote: 'A fonte informa apenas “1”, sem indicar AR ou DR; o registro foi mantido na posição da mudança de era.'
        },
        { id: 'first-landing', heading: '760 DR', category: 'peoples', text: 'Primeiros humanos chegam no norte do Continente, dando origem aos primeiros Nortenhos. O evento chamado como Primeiro Desembarque, ou Desembarque dos Exilados, marca a origem dos povos do norte em sua chegada no Delta do rio Jaruga.' },
        {
            id: 'dezmod-sambuk-kingdoms', heading: '??', category: 'politics', text: 'Começam reinos de Dezmod e Sambuk', sortHint: 790 * 12,
            chronologyNote: 'A fonte não informa data e posiciona este acontecimento entre 760 DR e 830 DR.'
        },
        {
            id: 'simpler-alphabet', heading: '??', category: 'culture', text: 'Novo alfabeto mais simples criado', sortHint: 790 * 12 + 1,
            chronologyNote: 'A fonte não informa data e posiciona este acontecimento entre 760 DR e 830 DR.'
        },
        {
            id: 'novigradian-union', heading: '??', category: 'politics', text: 'É formada a União Novigradiana', sortHint: 790 * 12 + 2,
            chronologyNote: 'A fonte não informa data e posiciona este acontecimento entre 760 DR e 830 DR.'
        },
        { id: 'conclave-created', heading: '830 DR', category: 'magic', text: 'Criação do Conclave de Magos' },
        { id: 'chapter-supreme-council-created', heading: '830 DR', category: 'magic', text: 'Criação do Capítulo e Conselho Supremo dos Magos' },
        { id: 'conclave-executions', heading: '830 DR', category: 'politics', text: 'Execução de quem não reconhece o Conclave ou as novas leis.' },
        { id: 'regis-born', heading: '839 DR', category: 'people', text: 'Régis, vampiro amigo de Geralt nasce.' },
        { id: 'first-witchers', heading: '950 DR', category: 'witchers', text: 'Os primeiros Bruxos são criados pelos magos renegados Alzur e Cosimo Malaspina' },
        { id: 'aelirenn-revolt', heading: '1060 DR', category: 'war', text: 'Revolta de Aelirenn' },
        { id: 'vesemir-active', heading: '1112 DR', category: 'witchers', text: 'Indícios do Bruxo Vesemir já executando atividades como Bruxo neste ano.' },
        { id: 'lebioda-sermon', heading: '1133 DR', category: 'faith', text: 'Em Birke, na vila de Sylvan Dam, o profeta Lebioda prega um sermão para seus alunos' },
        { id: 'kovir-poviss-redania-separate', heading: '1140 DR', category: 'politics', text: 'Com a morte do Rei Radovid III, Poviss, Kovir e Redânia se separam.' },
        { id: 'cregennan-murdered', heading: '1142 DR', category: 'people', text: 'O mago Cregennan é assassinado.' },
        { id: 'lara-dorren-death', heading: '1142 DR', category: 'people', text: 'Lara Dorren dá à luz a seu filho e morre de exaustão na floresta perto de Tretogor.' },
        { id: 'riannon-adopted', heading: '1142 DR', category: 'politics', text: 'A Rainha Cerro da Redânia adota a garota meio-elfa e a chama de Riannon.' },
        { id: 'lara-war', heading: '1142 DR', category: 'war', text: 'Morte de Lara desencadeia outra guerra entre elfos e humanos' },
        { id: 'day-of-fire', heading: '1146 DR', category: 'witchers', text: 'Dia do Fogo, morte da maioria dos bruxos da escola da mantícora.' },
        { id: 'falka-rebellion', heading: '1150 DR', category: 'war', text: 'Rebelião de Falka' },
        { id: 'aedirn-conquers-dol-blathanna', heading: '1150 DR', category: 'war', text: 'Aedirn conquista Dol Blathanna' },
        { id: 'falka-burned', heading: '1159 DR', category: 'people', text: 'Falka é queimada em uma fogueira' },
        { id: 'yennefer-born', heading: '1173 DR', category: 'people', text: 'Yennefer de Vengerberg nasce' },
        { id: 'vizima-black-plague', heading: '1176 DR', category: 'plague', text: 'Surto da peste negra em Vizima' },
        { id: 'temerian-nobility-rebellion', heading: '1176 DR', category: 'war', text: 'Rebelião da nobreza em Teméria' },
        { id: 'yennefer-graduates', heading: '1186 DR', category: 'magic', text: 'Yennefer se forma em Aretuza, tornando-se feiticeira.' },
        { id: 'emblonia-divided', heading: '1200 DR', category: 'politics', text: 'Temeria e Redânia dividem Emblonia entre si' },
        { id: 'calanthe-born', heading: '1217 DR', category: 'people', text: 'Calanthe, avó de Ciri, nasce' },
        { id: 'jaskier-born', heading: '1229 DR', category: 'people', text: 'Jaskier “Dandelion” nasce' },
        { id: 'dagorad-death-calanthe-coronation', heading: '1231 DR', category: 'politics', text: 'Morte de Dagorad de Cintra, coroação de Calanthe' },
        { id: 'battle-of-hochebuz', heading: '1232 DR', category: 'war', text: 'Batalha de Hochebuz' },
        { id: 'northern-wars-begin', heading: '1239 DR', category: 'war', text: 'O início das Guerras do Norte, anexação de Ebbing' },
        { id: 'geralt-meets-jaskier', heading: '1240 DR', category: 'stories', text: 'Geralt e Jaskier se conhecem numa festa em Gulet' },
        { id: 'edge-of-world-last-wish', heading: '1240 DR', category: 'stories', text: 'Contos Confins do Mundo e O Último Desejo' },
        { id: 'season-of-storms', heading: '1250 DR', category: 'stories', text: 'Eventos do livro Tempo de Tempestade' },
        { id: 'question-of-price', heading: '1251 DR', category: 'stories', text: 'Conto Uma Questão de Preço' },
        { id: 'duny-pavetta-marry', heading: '1251 DR', category: 'people', text: 'Duny e Pavetta, os pais de Ciri se casam' },
        { id: 'ciri-born', heading: '1252 DR', category: 'people', text: 'Princesa Cirilla de Cintra nasce. Ela é mais conhecida como Ciri ou o Leãozinho de Cintra.' },
        { id: 'witcher-voice-of-reason', heading: '1252 DR', category: 'stories', text: 'Os contos The Witcher (conto) e A Voz da Razão' },
        { id: 'bounds-of-reason', heading: '1253 DR', category: 'stories', text: 'Acontecimentos do conto O Limite do Possível' },
        { id: 'pavetta-duny-death', heading: '1256 DR', category: 'people', text: 'Morte de Pavetta e Duny em Sedna Abyss' },
        { id: 'emhyr-retakes-throne', heading: '1257 DR', category: 'politics', text: 'Emhyr var Emreis derruba e executa o Usurpador, retomando o controle do trono Imperial.' },
        { id: 'jaskier-meets-anna-henrietta', heading: '1261 DR', category: 'stories', text: 'Jaskier conhece Anna Henrietta em Toussaint' },
        { id: 'sword-of-destiny', heading: '1262 DR', category: 'stories', text: 'O conto "A Espada do Destino"' },
        { id: 'first-northern-war', heading: '1263 DR', category: 'war', text: 'O Império Nilfgaardiano invade os Reinos do Norte, desencadeando a Primeira Guerra do Norte' },
        { id: 'cintra-massacre', heading: '1263 DR', category: 'war', text: 'Massacre em Cintra' },
        { id: 'battle-of-sodden', heading: '1263 DR', category: 'war', text: 'Batalha em Sodden' },
        {
            id: 'radovid-ciri-engagement', heading: '1263 DR', category: 'politics', text: 'Noivado do Príncipe Radovid V de Redania e Ciri',
            references: [
                { label: 'Radovid V', url: 'https://witcher.fandom.com/pt-br/wiki/Radovid_V' },
                { label: 'Redania', url: 'https://witcher.fandom.com/pt-br/wiki/Redania' },
                { label: 'Ciri', url: 'https://witcher.fandom.com/pt-br/wiki/Ciri' }
            ]
        },
        {
            id: 'vizimir-breaks-engagement', heading: '1263 DR', category: 'politics', text: 'Rei Vizimir II rompe o noivado entre os dois',
            references: [
                { label: 'Vizimir II', url: 'https://witcher.fandom.com/pt-br/wiki/Vizimir_II' },
                { label: 'Redânia', url: 'https://witcher.fandom.com/pt-br/wiki/Red%C3%A2nia' }
            ]
        },
        {
            id: 'slaughter-of-cintra', heading: '1263 DR', category: 'war', text: 'A Carnificina de Cintra - Rainha Calanthe, avó de Ciri, comete suicídio ao invés de se render aos nilfgaardianos',
            references: [{ label: 'Calanthe', url: 'https://witcher.fandom.com/pt-br/wiki/Calanthe' }]
        },
        { id: 'something-more', heading: '1264 DR', category: 'stories', text: 'O conto "Algo Mais" se passa' },
        { id: 'ciri-kaer-morhen-training', heading: '1265 DR', category: 'witchers', text: 'Ciri inicia seu treinamento em Kaer Morhen' },
        {
            id: 'blood-contempt-baptism', heading: '1267 DR', category: 'stories', text: 'Eventos de O Sangue dos Elfos, Tempo do Desprezo e Batismo de Fogo acontecem',
            chronologyNote: 'A fonte identifica o bloco de 1267 DR como “ATUALMENTE”.'
        },
        { id: 'cintra-attre-rebellions', heading: '1267 DR', category: 'war', text: 'Rebeliões de Cintra e Attre acontecem' },
        { id: 'lodge-of-sorceresses', heading: '1267 DR', category: 'magic', text: 'Estada das Feiticeiras é formada.' },
        {
            id: 'thanedd-coup-war-begins', heading: '1267 DR', month: 7, category: 'war', text: 'Julho - Golpe Thanedd; Império Nilfgaardiano invade o vale Dol Angra; Segunda Guerra do Norte começa',
            references: [
                { label: 'Império Nilfgaardiano', url: 'https://witcher.fandom.com/pt-br/wiki/Imp%C3%A9rio_Nilfgaardiano' },
                { label: 'Dol Angra', url: 'https://witcher.fandom.com/pt-br/wiki/Dol_Angra' },
                { label: 'Segunda Guerra do Norte', url: 'https://witcher.fandom.com/pt-br/wiki/Segunda_Guerra_do_Norte' }
            ]
        },
        {
            id: 'thanedd-coup-details', heading: '1267 DR', category: 'war', text: 'Golpe em Thanedd - os feiticeiros se separam, depois de Francesca Findabair trazer comandos Scoia\'tael para o banquete. Soldados Nilfgaardianos entram na fortaleza através de portais feitos por magos Nilfgaardianos. Depois, acontece uma caça às feiticeiras, liderada por Dijkstra e o Serviço Secreto Redaniano.',
            references: [
                { label: 'Ilha de Thanedd', url: 'https://witcher.fandom.com/pt-br/wiki/Ilha_de_Thanedd' },
                { label: 'Francesca Findabair', url: 'https://witcher.fandom.com/pt-br/wiki/Francesca_Findabair' },
                { label: 'Scoia\'tael', url: 'https://witcher.fandom.com/pt-br/wiki/Scoia%27tael' },
                { label: 'Nilfgaard', url: 'https://witcher.fandom.com/pt-br/wiki/Nilfgaard' },
                { label: 'Sigismund Dijkstra', url: 'https://witcher.fandom.com/pt-br/wiki/Sigismund_Dijkstra' },
                { label: 'Redânia', url: 'https://witcher.fandom.com/pt-br/wiki/Red%C3%A2nia' }
            ]
        },
        {
            id: 'ciri-tarn-mira-tor-zireael', heading: '1267 DR', category: 'stories', text: 'Ciri mata vários membros da gangue de Stefan Skellen, incluindo Rience em Tarn Mira. Ciri escapa de Bonhart entrando em Tor Zireael.',
            references: [
                { label: 'Rience', url: 'https://witcher.fandom.com/pt-br/wiki/Rience' },
                { label: 'Tarn Mira', url: 'https://witcher.fandom.com/pt-br/wiki/Tarn_Mira' }
            ]
        },
        { id: 'second-northern-war-start', heading: '1267 DR', category: 'war', text: 'Inicio da Segunda Guerra do Norte' },
        { id: 'lady-of-the-lake', heading: '1268 DR', category: 'stories', text: 'Eventos em A Senhora do Lago acontecem' },
        { id: 'red-comet', heading: '1268 DR', month: 3, category: 'climate', text: 'Cometa vermelho aparece em março' },
        { id: 'second-northern-war-ends', heading: '1268 DR', category: 'war', text: 'Segunda Guerra do Norte Termina' },
        { id: 'rivia-massacre', heading: '1268 DR', category: 'people', text: 'Massacre de Rivia Acontece, Geralt é aparentemente morto por camponeses' },
        { id: 'first-catriona-outbreak', heading: '1268 DR', category: 'plague', text: 'Primeiro surto da Peste Catriona' },
        { id: 'milo-vanderbeck-dies', heading: '1269 DR', category: 'people', text: 'Dr. Milo Vanderbeck morre de peste catriona nos braços de Iola, a Segunda.' },
        { id: 'wild-hunt-tracks-geralt-yennefer', heading: '1269 DR', category: 'stories', text: 'A Caçada Selvagem rastreia Geralt e Yennefer para tirar Ciri de seu esconderijo.' },
        { id: 'witcher-game-one', heading: '1270 DR', category: 'stories', text: 'Acontecem eventos do jogo The Witcher 1' },
        { id: 'witcher-game-two', heading: '1271 DR', category: 'stories', text: 'Acontecem eventos do jogo The Witcher 2' },
        { id: 'witcher-game-three', heading: '1272 DR', category: 'stories', text: 'Acontecem eventos do jogo The Witcher 3' },
        { id: 'second-catriona-outbreak', heading: '1272 DR', category: 'plague', text: 'Segundo surto da Peste Catriona' },
        { id: 'witch-hunts-begin', heading: '1272 DR', category: 'politics', text: 'Início da caça às bruxas' },
        { id: 'blood-and-wine', heading: '1275 DR', category: 'stories', text: 'Acontecem eventos da expansão do jogo Blood and Wine' },
        { id: 'witch-hunts-end', heading: '1276 DR', category: 'politics', text: 'O fim da caça às bruxas' },
        { id: 'third-catriona-outbreak', heading: '1294 DR', category: 'plague', text: 'Terceiro surto da Peste Catriona' },
        { id: 'climate-changes-begin', heading: '1294 DR', category: 'climate', text: 'Início das Mudanças Climáticas' },
        { id: 'aen-seidhe-departure', heading: '1373 DR', category: 'peoples', text: 'A maiorias dos elfos Aen Seidhe deixa o mundo, levando a maior parte de sua arte, e destruindo o que ficou para tra’s' },
        {
            id: 'white-frost', heading: '3000 anos no futuro', category: 'climate', text: 'Órbita do planeta faz entrar em uma era do gelo chamada de Geada Branca, profetizada por Ithlinne.',
            chronologyNote: 'A fonte descreve aproximadamente 3000 anos no futuro, sem informar o ano de referência; nenhum ano absoluto foi calculado.'
        }
    ];

    const ENTRIES = Object.freeze(RAW_ENTRIES.map((entry, index) => defineEntry(entry, index + 1)));

    function sortTimelineEntries(entries, order = 'asc') {
        const direction = order === 'desc' ? -1 : 1;
        return [...(entries || [])].sort((left, right) => direction * (
            Number(left.sortValue) - Number(right.sortValue)
            || Number(left.sourceOrder || 0) - Number(right.sourceOrder || 0)
        ));
    }

    function filterTimelineEntries(options = {}) {
        const search = normalizeSearch(options.search);
        const era = ['AR', 'DR'].includes(String(options.era || '').toUpperCase())
            ? String(options.era).toUpperCase()
            : 'all';
        const category = getCategory(options.category) ? options.category : 'all';
        const period = getPeriod(options.period) ? options.period : 'all';
        return sortTimelineEntries(ENTRIES.filter(entry => {
            if (era !== 'all' && entry.era !== era) return false;
            if (category !== 'all' && entry.category !== category) return false;
            if (period !== 'all' && entry.period !== period) return false;
            if (!search) return true;
            return normalizeSearch([
                entry.text,
                entry.heading,
                entry.displayDate,
                entry.categoryLabel,
                entry.chronologyNote,
                ...entry.references.map(reference => reference.label)
            ].join(' ')).includes(search);
        }), options.order);
    }

    function getEntry(id) {
        return ENTRIES.find(entry => entry.id === String(id)) || null;
    }

    function getEntriesForCalendar({ year, era, month, day } = {}) {
        const normalizedEra = String(era || '').toUpperCase();
        const numericYear = Number(year);
        const numericMonth = Number(month);
        const numericDay = Number(day);
        return ENTRIES.filter(entry => {
            if (entry.parsedDate.kind !== 'dated' || entry.year !== numericYear || entry.era !== normalizedEra) return false;
            if (entry.precision === 'month' && entry.month !== numericMonth) return false;
            if (entry.precision === 'day' && (entry.month !== numericMonth || entry.day !== numericDay)) return false;
            return true;
        });
    }

    const api = Object.freeze({
        SOURCE_LABEL,
        CATEGORIES,
        PERIODS,
        ANNUAL_EVENT_GROUPS,
        ANNUAL_EVENTS,
        ENTRIES,
        normalizeSearch,
        isValidAnnualDate,
        getAnnualEventGroup,
        parseTimelineHeading,
        formatTimelineDate,
        sortTimelineEntries,
        filterTimelineEntries,
        getEntry,
        getEntriesForCalendar
    });

    global.campaignTimelineData = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
