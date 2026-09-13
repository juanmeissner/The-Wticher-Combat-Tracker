/*
 * Expansão do bestiário - lotes A, B e D.
 *
 * Mantém o mesmo formato dos presets históricos do aplicativo. Os atributos
 * do sistema-fonte não são armazenados: somente dados que o Combat Tracker já
 * sabe exibir e transportar para o combate.
 */

function createExpandedMonster(definition) {
    const baseArmor = { head: 0, torso: 0, arm: 0, leg: 0 };

    return {
        image: '',
        st: 0,
        ca: 13,
        armor: { ...baseArmor, ...(definition.armor || {}) },
        vulnerabilities: [],
        abilities: [],
        attacks: [],
        loot: [],
        skills: [],
        speed: '5m',
        height: 'Não informado',
        weight: 'Não informado',
        habitat: 'Não informado',
        intelligence: 'Não informado',
        organization: 'Não informado',
        superstition: '',
        witcherKnowledge: '',
        ...definition,
        armor: { ...baseArmor, ...(definition.armor || {}) }
    };
}

const expandedMonsterDatabase = [
    // LOTE A - CRIATURAS COM FICHA MECÂNICA
    createExpandedMonster({
        id: 'alpor', name: 'Alpor', hp: 95, threat: 'Difícil / Perigoso', reward: '250 Coroas', st: 45, ca: 15,
        vulnerabilities: ['Óleo de Vampiro', 'Sangue Negro', 'Fogo'],
        abilities: [
            'Regeneração Superior - Recupera 10 HP no início do turno, exceto quando impedida por fogo ou efeito apropriado.',
            'Invisibilidade Mágica - Pode ocultar-se mesmo de sentidos comuns; Pó de Lua revela sua posição.',
            'Saliva Anestésica - A mordida pode incapacitar ou entorpecer a presa.',
            'Drenar Sangue - Ao morder um alvo agarrado, recupera HP igual à metade do dano causado.',
            'Grito Sônico - Criaturas próximas devem resistir ou ficam Atordoadas.'
        ],
        attacks: ['Garras 6d6', 'Mordida 7d6', 'Grito Sônico - ND 18 contra Atordoado'],
        loot: ['Saliva de vampiro (1d6)', 'Sangue de vampiro (1d4)', 'Essência de monstro (1d4)'],
        skills: ['Curta Distância +14', 'Brigar +14', 'Corpo a Corpo +14', 'Esquivar/Escapar +15', 'Atletismo +13', 'Consciência +12', 'Furtividade +16', 'Sobrevivência no Ermo +11', 'Resistir a Magia +13', 'Resistir a Coerção +13', 'Tolerância +12', 'Coragem +13', 'Carisma +11', 'Engano +13', 'Percepção Humana +11', 'Sedução +14'],
        speed: '12m', height: '1,8m', weight: '75kg', habitat: 'Ruínas, criptas e cidades durante a noite', intelligence: 'Humana elevada', organization: 'Solitário',
        witcherKnowledge: 'Alpores são uma variedade mais poderosa de Lâmia. Caçam de forma consciente, regeneram-se depressa e combinam invisibilidade com ataques incapacitantes.'
    }),
    createExpandedMonster({
        id: 'amarok', name: 'Amarok', hp: 120, threat: 'Médio / Complexo', reward: '100 Coroas', st: 35, ca: 14,
        vulnerabilities: ['Óleo de Espectro', 'Yrden', 'Luz intensa e fogo'],
        abilities: ['Forma Incorpórea - Ignora ataques físicos comuns fora de Yrden.', 'Invisibilidade - Pode desaparecer e reposicionar-se.', 'Caça Persistente - Mantém o rastro da presa escolhida.', 'Aura de Medo - Alvos próximos devem resistir ao medo.'],
        attacks: ['Mordida 4d6+1', 'Congelar - 50% de chance de aplicar Congelado'],
        loot: ['Essência de espectro (1d4)', 'Pó infundido (1d4)', 'Pele espectral (1d2)'],
        skills: ['Atletismo +5', 'Brigar +6', 'Consciência +5', 'Coragem +10', 'Esquivar/Escapar +2', 'Tolerância +10', 'Intimidação +10', 'Resistir a Magia +7', 'Lançar Feitiços +7', 'Furtividade +7'],
        speed: '11m', height: '1m', weight: '70kg', habitat: 'Florestas, colinas e territórios de caça', intelligence: 'Animal astuta', organization: 'Solitário',
        witcherKnowledge: 'Predador espectral que persegue uma presa até abatê-la. Luz, fogo e Yrden limitam suas defesas sobrenaturais.'
    }),
    createExpandedMonster({
        id: 'aparicao', name: 'Aparição', hp: 60, threat: 'Médio / Perigoso', reward: '80 Coroas', st: 25, ca: 13,
        vulnerabilities: ['Óleo de Espectro', 'Yrden', 'Pó de Lua'],
        abilities: ['Forma Incorpórea - Fora de Yrden, ataques comuns têm eficácia reduzida.', 'Teleporte - Reaparece em um ponto visível a até 10m.', 'Visão Noturna - Ignora penalidades de escuridão.'],
        attacks: ['Espada Espectral 3d6', 'Lanterna Espectral 2d6+2'],
        loot: ['Pó de espectro (1d6)', 'Essência de espectro (1d4)', 'Infusão de poeira (1d2)'],
        skills: ['Esgrima +7', 'Curta Distância +6', 'Brigar +6', 'Atletismo +5', 'Consciência +8', 'Furtividade +9', 'Sobrevivência no Ermo +6', 'Resistir a Magia +6', 'Tolerância +7'],
        speed: '5m', habitat: 'Cemitérios, ruínas e locais ligados a mortes violentas', intelligence: 'Fragmentos de consciência humana', organization: 'Solitária',
        witcherKnowledge: 'Espírito preso ao mundo por trauma ou assunto inacabado. Yrden e Pó de Lua permitem enfrentá-lo de forma consistente.'
    }),
    createExpandedMonster({
        id: 'aparicao-diurna', name: 'Aparição Diurna', hp: 25, threat: 'Médio / Perigoso', reward: '50 Coroas', st: 30, ca: 14,
        vulnerabilities: ['Óleo de Espectro', 'Yrden', 'Pó de Lua'],
        abilities: ['Forma Incorpórea - Exige Yrden ou recurso equivalente para ser atingida normalmente.', 'Dança do Meio-Dia - Cria imagens que confundem e cercam o alvo.', 'Fraqueza Celestial - Perde parte de suas vantagens quando afastada da luz solar.'],
        attacks: ['Garras 5d6 - causa ablação'],
        loot: ['Essência de aparição (1d4)', 'Pó infundido (1d4)', 'Cabelo de aparição (1d2)'],
        skills: ['Lançar Feitiços +6', 'Curta Distância +8', 'Brigar +7', 'Atletismo +4', 'Consciência +10', 'Furtividade +10', 'Sobrevivência no Ermo +5', 'Resistir a Magia +7', 'Tolerância +7'],
        speed: '6m', habitat: 'Campos abertos, plantações e locais de morte sob o sol', intelligence: 'Fragmentos de consciência humana', organization: 'Solitária',
        witcherKnowledge: 'Surge em locais marcados por morte e sofrimento durante o dia. Suas duplicatas devem ser controladas antes do golpe decisivo.'
    }),
    createExpandedMonster({
        id: 'lobo', name: 'Lobo', hp: 20, threat: 'Fácil / Simples', reward: '10 Coroas', st: 20, ca: 12,
        vulnerabilities: ['Aço', 'Fogo', 'Ataques de área contra a matilha'],
        abilities: ['Rastrear pelo Cheiro - Vantagem para seguir criaturas feridas.', 'Visão Noturna - Enxerga no escuro.', 'Tática de Matilha - Recebe bônus quando aliados cercam o mesmo alvo.'],
        attacks: ['Mordida 2d6'], loot: ['Pele de lobo (1)', 'Carne crua (1d6)', 'Dentes de fera (1d4)'],
        skills: ['Curta Distância +6', 'Brigar +6', 'Atletismo +6', 'Consciência +6', 'Furtividade +6', 'Sobrevivência no Ermo +9', 'Resistir a Magia +2', 'Tolerância +5', 'Coragem +6'],
        speed: '7m', height: '0,8m', weight: '45kg', habitat: 'Florestas, montanhas e campos', intelligence: 'Animal', organization: 'Matilha'
    }),
    createExpandedMonster({
        id: 'warg', name: 'Warg', hp: 35, threat: 'Médio / Simples', reward: '40 Coroas', st: 25, ca: 13, armor: { head: 2, torso: 2, arm: 1, leg: 1 },
        vulnerabilities: ['Aço', 'Fogo'],
        abilities: ['Rastrear pelo Cheiro - Segue presas por grandes distâncias.', 'Líder da Matilha - Lobos aliados recebem +2 em Coragem e ataques contra seu alvo.', 'Derrubar - Uma mordida em investida pode deixar o alvo Caído.'],
        attacks: ['Mordida 3d6+2', 'Investida 4d6 - teste para não cair'], loot: ['Pele de warg (1)', 'Dentes de fera (1d6)', 'Carne crua (1d6)'],
        skills: ['Curta Distância +8', 'Brigar +8', 'Atletismo +8', 'Consciência +8', 'Furtividade +7', 'Sobrevivência no Ermo +10', 'Resistir a Magia +4', 'Tolerância +7', 'Coragem +9'],
        speed: '9m', height: '1,2m', weight: '90kg', habitat: 'Florestas antigas, montanhas e ermos', intelligence: 'Animal astuta', organization: 'Matilha'
    }),
    createExpandedMonster({
        id: 'fetulho', name: 'Fetulho', hp: 20, threat: 'Médio / Complexo', reward: '500 Coroas', st: 20, ca: 13,
        vulnerabilities: ['Óleo de Amaldiçoado', 'Axii'],
        abilities: ['Transformação - Sob condições da maldição assume forma monstruosa com 60 HP.', 'Drenar Sangue - Recupera HP ao ferir uma presa imobilizada.', 'Espinhos - Quem o agarra ou golpeia sem proteção pode sofrer dano.', 'Isca Espectral - Atrai ou desorienta criaturas ligadas à maldição.', 'Visão Noturna - Ignora escuridão.'],
        attacks: ['Garras 3d6+3', 'Mordida 4d6+2'], loot: ['Sangue de fetulho (1d4)', 'Tecido de monstro (1d4)', 'Essência amaldiçoada (1d2)'],
        skills: ['Atletismo +6', 'Consciência +5', 'Coragem +7', 'Esquivar/Escapar +6', 'Tolerância +4', 'Corpo a Corpo +7', 'Resistir a Magia +7', 'Furtividade +9'],
        speed: '2m', height: '0,6m', weight: '15kg', habitat: 'Lares e sepulturas ligados a uma maldição familiar', intelligence: 'Instintiva', organization: 'Solitário'
    }),
    createExpandedMonster({
        id: 'chort', name: 'Chort', hp: 90, threat: 'Duro / Complexo', reward: '1.250 Coroas', st: 45, ca: 14, armor: { head: 8, torso: 8, arm: 8, leg: 8 },
        vulnerabilities: ['Óleo de Relicto', 'Símbolos ou sons que sobrecarreguem sua audição'],
        abilities: ['Regeneração - Recupera 3 HP por rodada.', 'Investida - Percorre uma linha e causa 8d6 ao impacto.', 'Corpo Maciço - Resiste a Aard, empurrões e quedas.', 'Audição Sensível - Sons intensos podem desorientá-lo.'],
        attacks: ['Garras 5d6+2', 'Mordida 6d6+1', 'Chifres 7d6', 'Investida 8d6'], loot: ['Pele de chort (1)', 'Chifre de chort (1d2)', 'Olhos de monstro (1d4)', 'Essência de monstro (1d4)'],
        skills: ['Atletismo +6', 'Consciência +10', 'Brigar +4', 'Coragem +8', 'Esquivar/Escapar +6', 'Tolerância +4', 'Corpo a Corpo +7', 'Físico +8', 'Resistir a Magia +5', 'Furtividade +2', 'Sobrevivência no Ermo +5'],
        speed: '9m', height: '2,5m', weight: '400kg', habitat: 'Florestas antigas, vales e ruínas', intelligence: 'Animal astuta', organization: 'Solitário'
    }),
    createExpandedMonster({
        id: 'cocatriz', name: 'Cocatriz', hp: 60, threat: 'Médio / Complexo', reward: '600 Coroas', st: 30, ca: 14, armor: { head: 5, torso: 5, arm: 5, leg: 5 },
        vulnerabilities: ['Óleo de Draconídeo', 'Aard', 'Fogo contra gases inflamáveis'],
        abilities: ['Voo - Move-se pelo ar e pode atacar em mergulho.', 'Veneno - Ferimentos podem aplicar Envenenado.', 'Hálito Tóxico - Cria uma nuvem venenosa.', 'Névoa Ácida - Causa dano e ablação.', 'Gases Inflamáveis - Fogo na nuvem provoca explosão.'],
        attacks: ['Garras 4d6', 'Bico 5d6', 'Hálito Tóxico', 'Névoa Ácida'], loot: ['Penas de cocatriz (1d6)', 'Estômago de cocatriz (1)', 'Veneno (1d4)', 'Olhos de monstro (1d2)'],
        skills: ['Atletismo +7', 'Consciência +6', 'Brigar +7', 'Coragem +4', 'Esquivar/Escapar +7', 'Tolerância +6', 'Corpo a Corpo +7', 'Resistir a Magia +5', 'Furtividade +5', 'Sobrevivência no Ermo +8'],
        speed: '9m', habitat: 'Montanhas, penhascos e vales abertos', intelligence: 'Animal', organization: 'Solitária ou par'
    }),
    createExpandedMonster({
        id: 'ciclope', name: 'Ciclope', hp: 110, threat: 'Duro / Complexo', reward: '1.750 Coroas', st: 110, ca: 13, armor: { head: 10, torso: 10, arm: 10, leg: 10 },
        vulnerabilities: ['Óleo de Ogroide', 'Ataques no olho'],
        abilities: ['Força Esmagadora - Pode destruir cobertura e estruturas leves.', 'Alcance Ampliado - Seus ataques corpo a corpo alcançam além do normal.', 'Varredura - Atinge vários alvos em arco.', 'Resistência Física - Difícil de derrubar, empurrar ou agarrar.'],
        attacks: ['Soco 8d8+6', 'Árvore ou clava 8d8+2', 'Varredura - ataque em área'], loot: ['Olho de ciclope (1)', 'Tecido de ogroide (1d6)', 'Dentes de monstro (1d6)', 'Itens carregados (1d6)'],
        skills: ['Atletismo +3', 'Consciência +8', 'Coragem +7', 'Esquivar/Escapar +4', 'Tolerância +10', 'Corpo a Corpo +7', 'Físico +10', 'Resistir a Coerção +7', 'Resistir a Magia +8', 'Armadilhas +6'],
        speed: '5m', height: '4,5m', weight: '1.000kg', habitat: 'Montanhas, cavernas e ruínas isoladas', intelligence: 'Baixa', organization: 'Solitário'
    }),
    createExpandedMonster({
        id: 'driade', name: 'Dríade', hp: 30, threat: 'Médio / Simples', reward: '350 Coroas', st: 30, ca: 14,
        vulnerabilities: ['Fogo', 'Dimerítio contra magia natural'],
        abilities: ['Emboscada Florestal - Recebe vantagem ao atacar de vegetação densa.', 'Tiro Especializado - Ignora penalidades comuns por cobertura vegetal.', 'Mãos Curativas - Pode estabilizar e recuperar um aliado.'],
        attacks: ['Arco Longo 4d6', 'Lança 3d6'], loot: ['Arco de dríade (1)', 'Flechas (2d10)', 'Ervas raras (1d6)', 'Componentes naturais (1d4)'],
        skills: ['Arco e Flecha +10', 'Atletismo +8', 'Consciência +9', 'Engano +4', 'Esquivar/Escapar +8', 'Tolerância +5', 'Intimidação +5', 'Resistir a Coerção +5', 'Resistir a Magia +4', 'Cajado/Lança +7', 'Furtividade +9', 'Táticas +3', 'Armadilhas +5'],
        speed: '8m', height: 'Humana', weight: 'Humano', habitat: 'Brokilon e florestas antigas', intelligence: 'Humana', organization: 'Patrulha ou comunidade'
    }),
    createExpandedMonster({
        id: 'rainha-endriaga', name: 'Rainha Endríaga', hp: 35, threat: 'Fácil / Perigoso', reward: '30 Coroas', st: 35, ca: 13, armor: { head: 8, torso: 8, arm: 8, leg: 8 },
        vulnerabilities: ['Óleo de Insetoide', 'Fogo'],
        abilities: ['Salto - Salta obstáculos e alcança a presa.', 'Veneno - As garras podem aplicar Envenenado.', 'Rainha da Colônia - Endríagas próximas lutam com maior coragem.', 'Variantes - Pode comandar guerreiras e trabalhadoras.'],
        attacks: ['Garras 3d6', 'Picada Venenosa 3d6'], loot: ['Quitina de endríaga (1d6)', 'Embrião de endríaga (1d4)', 'Veneno (1d4)', 'Essência de monstro (1d2)'],
        skills: ['Curta Distância +6', 'Brigar +5', 'Atletismo +5', 'Consciência +5', 'Furtividade +7', 'Sobrevivência no Ermo +6', 'Resistir a Magia +6', 'Tolerância +6', 'Coragem +5'],
        speed: '7m', habitat: 'Florestas, cavernas e colônias subterrâneas', intelligence: 'Animal', organization: 'Colônia'
    }),
    createExpandedMonster({
        id: 'aracna', name: 'Aracna', hp: 90, threat: 'Difícil / Complexo', reward: '1.000 Coroas', st: 45, ca: 14, armor: { head: 20, torso: 20, arm: 20, leg: 20 },
        vulnerabilities: ['Óleo de Insetoide', 'Ponto macio exposto durante certos ataques', 'Fogo'],
        abilities: ['Salto - Avança grandes distâncias.', 'Camuflagem - Oculta-se no ambiente.', 'Teia - Imobiliza alvos e cria terreno difícil.', 'Ponto Macio - Algumas ações expõem uma região sem armadura.', 'Resistência a Dano - A carapaça reduz ataques comuns.'],
        attacks: ['Garras 5d6', 'Mordida com Veneno - 25%', 'Teia - aplica Preso'], loot: ['Quitina de aracna (1d6)', 'Olhos de aracna (1d6)', 'Veneno (1d4)', 'Seda de aracna (1d6)'],
        skills: ['Curta Distância +5', 'Brigar +5', 'Atletismo +5', 'Consciência +6', 'Furtividade +6', 'Sobrevivência no Ermo +4', 'Resistir a Magia +9', 'Tolerância +5', 'Coragem +10'],
        speed: '5m', habitat: 'Florestas densas, cavernas e ruínas cobertas por teias', intelligence: 'Animal astuta', organization: 'Solitária'
    }),
    createExpandedMonster({
        id: 'golem', name: 'Golem', hp: 80, threat: 'Difícil / Simples', reward: '1.200 Coroas', st: 0, ca: 13, armor: { head: 20, torso: 20, arm: 20, leg: 20 },
        vulnerabilities: ['Bombas de Dimerítio', 'Eletricidade', 'Destruir ou desativar seu criador'],
        abilities: ['Construto - Imune a veneno, sangramento, doença e efeitos mentais.', 'Investida - Causa dano e derruba em linha reta.', 'Força Esmagadora - Destrói cobertura e equipamentos frágeis.', 'Não possui ST - Habilidades que drenam ST não o afetam.'],
        attacks: ['Soco 8d6 - causa ablação', 'Investida 8d6'], loot: ['Coração de golem (1)', 'Pó infundido (1d6)', 'Pedra rúnica (1d2)', 'Minério (2d6)'],
        skills: ['Brigar +6', 'Atletismo +2', 'Consciência +8', 'Furtividade +2', 'Sobrevivência no Ermo +4', 'Resistir a Magia +10', 'Físico +7'],
        speed: '4m', height: '2,5m', weight: '600kg', habitat: 'Laboratórios, ruínas e locais protegidos por magia', intelligence: 'Programada', organization: 'Solitário ou guardião'
    }),
    createExpandedMonster({
        id: 'nekker', name: 'Nekker', hp: 15, threat: 'Fácil / Complexo', reward: '10 Coroas', st: 15, ca: 13,
        vulnerabilities: ['Óleo de Ogroide', 'Bombas e ataques de área'],
        abilities: ['Visão Noturna - Ignora escuridão.', 'Força do Bando - Recebe bônus ao cercar o alvo.', 'Túneis - Pode surgir de toca preparada.'],
        attacks: ['Garras 2d6'], loot: ['Olhos de nekker (1d4)', 'Coração de nekker (1)', 'Garras de nekker (1d4)'],
        skills: ['Brigar +5', 'Curta Distância +5', 'Esquivar/Escapar +6', 'Atletismo +7', 'Consciência +8', 'Furtividade +8', 'Sobrevivência no Ermo +8', 'Resistir a Magia +4', 'Resistir a Coerção +9', 'Tolerância +6', 'Coragem +6'],
        speed: '6m', height: '1m', weight: '35kg', habitat: 'Florestas, ravinas, cavernas e túneis', intelligence: 'Baixa', organization: 'Bando'
    }),
    createExpandedMonster({
        id: 'chefe-nekker', name: 'Chefe Nekker', hp: 20, threat: 'Médio / Complexo', reward: '30 Coroas', st: 20, ca: 14, armor: { head: 2, torso: 2, arm: 2, leg: 2 },
        vulnerabilities: ['Óleo de Ogroide', 'Eliminar o chefe desorganiza o bando'],
        abilities: ['Líder do Bando - Nekkers aliados recebem bônus de Coragem e ataque.', 'Ordens Complexas - Coordena emboscadas e recuos.', 'Visão Noturna - Ignora escuridão.'],
        attacks: ['Garras 2d6+2', 'Mordida 3d6'], loot: ['Olhos de nekker (1d4)', 'Coração de nekker (1)', 'Troféu de chefe nekker (1)'],
        skills: ['Brigar +7', 'Curta Distância +7', 'Esquivar/Escapar +7', 'Atletismo +8', 'Consciência +9', 'Furtividade +8', 'Sobrevivência no Ermo +9', 'Resistir a Magia +5', 'Resistir a Coerção +10', 'Tolerância +7', 'Coragem +9'],
        speed: '7m', height: '1,2m', weight: '45kg', habitat: 'Tocas e territórios de bandos nekker', intelligence: 'Baixa, mas tática', organization: 'Chefe de bando'
    }),
    createExpandedMonster({
        id: 'troll-pedra', name: 'Troll de Pedra', hp: 80, threat: 'Médio / Perigoso', reward: '800 Coroas', st: 40, ca: 13, armor: { head: 20, torso: 20, arm: 20, leg: 20 },
        vulnerabilities: ['Óleo de Ogroide', 'Partes frontais menos rochosas'],
        abilities: ['Força Esmagadora - Destrói cobertura e empurra alvos.', 'Ablação Dobrada - Ataques apropriados removem armadura em ritmo especial.', 'Costas Rochosas - Ataques pelas costas enfrentam proteção reforçada.', 'Resistência - Difícil de derrubar ou atordoar.'],
        attacks: ['Soco 6d6', 'Pedregulho 5d6 - alcance 16m'], loot: ['Pele de troll (1d6)', 'Cérebro de troll (1)', 'Fígado de troll (1)', 'Minério (2d6)'],
        skills: ['Brigar +8', 'Esquivar/Escapar +5', 'Atletismo +3', 'Consciência +9', 'Furtividade +3', 'Sobrevivência no Ermo +7', 'Resistir a Magia +8', 'Resistir a Coerção +6', 'Tolerância +8', 'Coragem +10'],
        speed: '4m', height: '3m', weight: '500kg', habitat: 'Pontes, montanhas, cavernas e vales rochosos', intelligence: 'Baixa a humana simples', organization: 'Solitário ou família'
    }),
    createExpandedMonster({
        id: 'wyvern', name: 'Wyvern', hp: 80, threat: 'Difícil / Simples', reward: '1.000 Coroas', st: 40, ca: 15, armor: { head: 10, torso: 10, arm: 10, leg: 10 },
        vulnerabilities: ['Óleo de Draconídeo', 'Aard durante o voo'],
        abilities: ['Voo - Pode atacar em mergulho e ignorar obstáculos terrestres.', 'Cuspir Veneno - Linha de 8m causando 3d6 e Envenenado.', 'Escamas Resistentes - Reduz dano cortante e perfurante.'],
        attacks: ['Garras 6d6', 'Mordida 7d6', 'Cauda 5d6+2', 'Cuspir Veneno 3d6 - 8m'], loot: ['Couro de wyvern (1d6)', 'Ovo de wyvern (1d2)', 'Veneno de wyvern (1d4)', 'Essência de draconídeo (1d2)'],
        skills: ['Brigar +7', 'Curta Distância +8', 'Esquivar/Escapar +6', 'Atletismo +8', 'Consciência +10', 'Furtividade +6', 'Sobrevivência no Ermo +9', 'Resistir a Magia +8', 'Tolerância +8', 'Coragem +8'],
        speed: '7m', habitat: 'Montanhas, penhascos e vales', intelligence: 'Animal', organization: 'Solitária ou ninho'
    }),
    createExpandedMonster({
        id: 'fleder', name: 'Fleder', hp: 60, threat: 'Médio / Simples', reward: '500 Coroas', st: 30, ca: 14, armor: { head: 5, torso: 5, arm: 5, leg: 5 },
        vulnerabilities: ['Óleo de Vampiro', 'Fogo', 'Sangue Negro'],
        abilities: ['Regeneração - Recupera HP enquanto não estiver sob efeito de fogo.', 'Salto Predatório - Avança e ataca.', 'Escalada - Move-se por paredes.', 'Asas Vestigiais - Amortecem quedas e permitem saltos longos.'],
        attacks: ['Garras 5d6', 'Mordida 6d6+2'], loot: ['Dentes de fleder (1d6)', 'Sangue de vampiro (1d4)', 'Saliva de vampiro (1d4)', 'Tecido de monstro (1d4)'],
        skills: ['Atletismo +6', 'Consciência +5', 'Coragem +7', 'Esquivar/Escapar +6', 'Tolerância +6', 'Resistir a Coerção +6', 'Resistir a Magia +4', 'Furtividade +7'],
        speed: '7m', habitat: 'Cavernas, ruínas, criptas e esgotos', intelligence: 'Bestial', organization: 'Solitário ou pequeno grupo'
    }),
    createExpandedMonster({
        id: 'gargula', name: 'Gárgula', hp: 70, threat: 'Difícil / Médio', reward: '900 Coroas', st: 0, ca: 14, armor: { head: 15, torso: 15, arm: 15, leg: 15 },
        vulnerabilities: ['Bombas de Dimerítio', 'Destruição do foco mágico'],
        abilities: ['Construto - Imune a veneno, sangramento, doença e efeitos mentais.', 'Carga Saltada - Salta e cai sobre uma área.', 'Arremessar Pedregulho - Ataque à distância.', 'Hálito Venenoso - Cria nuvem tóxica.', 'Pisão - Derruba alvos próximos.'],
        attacks: ['Soco 6d6', 'Pedregulho 5d6', 'Carga Saltada 7d6', 'Pisão 5d6'], loot: ['Coração de gárgula (1)', 'Pó infundido (1d6)', 'Pedra rúnica (1d2)', 'Minério (1d6)'],
        skills: ['Atletismo +5', 'Consciência +8', 'Esquivar/Escapar +6', 'Resistir a Magia +10', 'Furtividade +5'],
        speed: '4m', height: '2,2m', weight: '450kg', habitat: 'Ruínas, castelos e laboratórios mágicos', intelligence: 'Programada', organization: 'Guardiã solitária ou par'
    }),
    createExpandedMonster({
        id: 'guvorag', name: 'Guvorag', hp: 50, threat: 'Médio / Complexo', reward: '450 Coroas', st: 25, ca: 14, armor: { head: 10, torso: 10, arm: 10, leg: 10 },
        vulnerabilities: ['Óleo de Insetoide', 'Yrden', 'Pó de Lua contra invisibilidade'],
        abilities: ['Ilusão e Invisibilidade - Confunde e oculta sua posição.', 'Marionetista - Manipula uma criatura vulnerável.', 'Teias - Aplica Preso.', 'Escalada - Move-se por paredes e tetos.', 'Percepção Mágica - Detecta fontes de magia.'],
        attacks: ['Garras 4d6', 'Mordida 5d6', 'Teia - aplica Preso'], loot: ['Olhos de guvorag (1d6)', 'Seda de guvorag (1d6)', 'Veneno (1d4)', 'Essência de monstro (1d2)'],
        skills: ['Atletismo +5', 'Consciência +10', 'Brigar +9', 'Carisma +6', 'Engano +6', 'Esquivar/Escapar +6', 'Percepção Humana +10', 'Intimidação +6', 'Corpo a Corpo +7', 'Resistir a Magia +10', 'Sedução +6', 'Lançar Feitiços +6', 'Furtividade +5', 'Sobrevivência no Ermo +2'],
        speed: '8m', habitat: 'Cavernas, ruínas e florestas antigas', intelligence: 'Alta', organization: 'Solitário'
    }),
    createExpandedMonster({
        id: 'harpia', name: 'Harpia', hp: 25, threat: 'Fácil / Complexo', reward: '20 Coroas', st: 25, ca: 14,
        vulnerabilities: ['Óleo de Híbrido', 'Aard durante o voo'],
        abilities: ['Voo - Ignora obstáculos terrestres.', 'Manobra Aérea - Reposiciona-se após atacar.', 'Ossos Ocos - Sofre mais com impactos e quedas.', 'Colecionadora - Distrai-se com objetos brilhantes.'],
        attacks: ['Garras 2d6', 'Garras em Mergulho 2d6+3'], loot: ['Penas de harpia (1d6)', 'Ovo de harpia (1d2)', 'Garras de harpia (1d4)', 'Objetos brilhantes (1d6)'],
        skills: ['Atletismo +8', 'Consciência +8', 'Esquivar/Escapar +6', 'Tolerância +4', 'Resistir a Magia +5', 'Furtividade +4'],
        speed: '9m', habitat: 'Penhascos, montanhas, costas e ruínas altas', intelligence: 'Animal', organization: 'Bando'
    }),
    createExpandedMonster({
        id: 'vampiro-superior', name: 'Vampiro Superior', hp: 100, threat: 'Duro / Difícil', reward: 'Mais de 2.000 Coroas', st: 50, ca: 17, armor: { head: 20, torso: 20, arm: 20, leg: 20 },
        vulnerabilities: ['Conhecimento específico sobre o indivíduo', 'Fogo pode retardar regeneração', 'Sangue Negro'],
        abilities: ['Regeneração Superior - Recupera ferimentos em velocidade extrema.', 'Ilusão - Altera percepções e aparência.', 'Invisibilidade Mágica - Não é detectado por meios comuns.', 'Imortalidade - Métodos convencionais não garantem morte permanente.', 'Poderes Variáveis - Cada indivíduo pode possuir capacidades únicas.'],
        attacks: ['Garras 6d6', 'Mordida 8d6+2', 'Ataque Sobrenatural - definido pelo mestre'], loot: ['Componente de vampiro superior (1)', 'Sangue de vampiro superior (1d2)'],
        skills: ['Atletismo +10', 'Consciência +8', 'Carisma +10', 'Coragem +9', 'Engano +10', 'Esquivar/Escapar +10', 'Etiqueta Social +10', 'Percepção Humana +10', 'Resistir a Coerção +10', 'Resistir a Magia +10', 'Sedução +10', 'Furtividade +10'],
        speed: '9m', height: 'Variável', weight: 'Variável', habitat: 'Qualquer região; frequentemente oculto entre humanos', intelligence: 'Excepcional', organization: 'Solitário'
    }),
    createExpandedMonster({
        id: 'nereida', name: 'Nereida', hp: 30, threat: 'Médio / Difícil', reward: '550 Coroas', st: 30, ca: 14,
        vulnerabilities: ['Óleo de Híbrido', 'Dimerítio contra canto e ilusão'],
        abilities: ['Anfíbia - Respira e se move normalmente debaixo d\'\u00e1gua.', 'Canto - Encanta ou atrai ouvintes.', 'Ilusão - Altera a percepção de sua forma.', 'Constrição - Imobiliza alvo agarrado.', 'Invocação Marinha - Chama uma criatura aquática menor.'],
        attacks: ['Garras 4d6', 'Constrição 5d6', 'Canto - teste de Resistir a Magia'], loot: ['Escamas de nereida (1d6)', 'Cabelo de nereida (1d4)', 'Essência aquática (1d4)', 'Pérola (1d2)'],
        skills: ['Atletismo +7', 'Consciência +6', 'Coragem +4', 'Esquivar/Escapar +7', 'Tolerância +6', 'Corpo a Corpo +7', 'Resistir a Magia +5', 'Furtividade +5'],
        speed: '9m', habitat: 'Costas, rios profundos, lagos e cavernas alagadas', intelligence: 'Humana', organization: 'Solitária ou pequeno grupo'
    }),
    createExpandedMonster({
        id: 'ogro', name: 'Ogro', hp: 30, threat: 'Médio / Simples', reward: '250 Coroas', st: 30, ca: 13, armor: { head: 10, torso: 10, arm: 10, leg: 10 },
        vulnerabilities: ['Óleo de Ogroide', 'Engano e distrações'],
        abilities: ['Robusto - Resiste a empurrões e quedas.', 'Golpe Forte - Pode gastar ST para ampliar o dano.', 'Físico Poderoso - Carrega e arremessa objetos pesados.', 'Senciente - Pode negociar e usar ferramentas simples.'],
        attacks: ['Arma Bruta 4d6+4', 'Dardo ou objeto arremessado 3d6+2'], loot: ['Tecido de ogroide (1d6)', 'Dentes de ogro (1d4)', 'Itens carregados (2d6)'],
        skills: ['Atletismo +8', 'Consciência +7', 'Coragem +6', 'Esquivar/Escapar +7', 'Tolerância +6', 'Resistir a Magia +5', 'Furtividade +6', 'Esgrima +7'],
        speed: '5m', height: '2,5m', weight: '250kg', habitat: 'Colinas, cavernas, estradas isoladas e ruínas', intelligence: 'Baixa a humana simples', organization: 'Solitário ou pequeno grupo'
    }),
    createExpandedMonster({
        id: 'pesta', name: 'Pesta', hp: 80, threat: 'Duro / Complexo', reward: '1.000 Coroas', st: 40, ca: 15,
        vulnerabilities: ['Óleo de Espectro', 'Yrden', 'Magias e efeitos de cura'],
        abilities: ['Forma Incorpórea - Exige Yrden ou recurso equivalente.', 'Doença Amaldiçoada - Ataques podem transmitir doença.', 'Comandar Ratos - Convoca e dirige enxames.', 'Enxame - Ocupa uma área e causa dano persistente.', 'Avessa à Cura - Energia curativa a enfraquece.'],
        attacks: ['Garras 5d6', 'Doença - 25%', 'Enxame de Ratos - dano em área'], loot: ['Essência de espectro (1d6)', 'Pó de pesta (1d4)', 'Tecido amaldiçoado (1d4)'],
        skills: ['Atletismo +5', 'Consciência +10', 'Coragem +6', 'Esquivar/Escapar +7', 'Tolerância +6', 'Intimidação +6', 'Resistir a Coerção +6', 'Resistir a Magia +5', 'Lançar Feitiços +8', 'Furtividade +7'],
        speed: '6m', habitat: 'Locais de epidemia, ruínas, esgotos e valas comuns', intelligence: 'Humana corrompida', organization: 'Solitária com enxames'
    }),
    createExpandedMonster({
        id: 'fenix', name: 'Fênix', hp: 50, threat: 'Duro / Complexo', reward: '1.000 Coroas', st: 25, ca: 15,
        vulnerabilities: ['Frio', 'Dimerítio contra renascimento mágico'],
        abilities: ['Voo - Move-se livremente pelo ar.', 'Regeneração - Recupera HP enquanto sua chama estiver ativa.', 'Explosão - Ao ser ameaçada, libera fogo em área.', 'Aura de Fogo - Causa dano a quem permanece próximo.', 'Renascimento - Pode retornar das cinzas se o ritual não for interrompido.'],
        attacks: ['Garras 4d6+4', 'Bico 6d6+2', 'Explosão de Fogo - dano em área'], loot: ['Pena de fênix (1d4)', 'Cinzas de fênix (1d4)', 'Essência de fogo (1d4)'],
        skills: ['Atletismo +8', 'Consciência +6', 'Coragem +8', 'Esquivar/Escapar +9', 'Tolerância +5', 'Corpo a Corpo +9', 'Resistir a Coerção +7', 'Resistir a Magia +8', 'Furtividade +3', 'Sobrevivência no Ermo +6'],
        speed: '7m', habitat: 'Montanhas remotas, desertos e locais de forte energia mágica', intelligence: 'Animal mágica', organization: 'Solitária'
    }),
    createExpandedMonster({
        id: 'preta', name: 'Preta', hp: 25, threat: 'Fácil / Difícil', reward: '50 Coroas', st: 25, ca: 13,
        vulnerabilities: ['Óleo de Espectro', 'Sol e lua', 'Alimentar-se torna possível percebê-la'],
        abilities: ['Invisível aos Alimentados - Somente famintos ou efeitos especiais a percebem claramente.', 'Fome - Sua presença agrava privação e fraqueza.', 'Fúria - Torna-se mais perigosa quando ferida.', 'Fraqueza Celestial - Luz solar ou lunar limita seus poderes.'],
        attacks: ['Garras 3d6', 'Mordida 3d6+4'], loot: ['Essência de espectro (1d4)', 'Pó infundido (1d4)', 'Tecido de monstro (1d2)'],
        skills: ['Atletismo +7', 'Consciência +8', 'Esquivar/Escapar +6', 'Tolerância +8', 'Corpo a Corpo +6', 'Resistir a Magia +5', 'Furtividade +5'],
        speed: '5m', habitat: 'Locais de fome, ruínas e estradas abandonadas', intelligence: 'Instintiva', organization: 'Solitária'
    }),
    createExpandedMonster({
        id: 'estriga', name: 'Estriga', hp: 50, threat: 'Médio / Difícil', reward: '650 Coroas', st: 25, ca: 15, armor: { head: 5, torso: 5, arm: 5, leg: 5 },
        vulnerabilities: ['Óleo de Amaldiçoado', 'Axii', 'Quebrar a maldição'],
        abilities: ['Regeneração - Recupera HP por rodada.', 'Salto - Alcança alvos distantes.', 'Escalada - Move-se por paredes e tetos.', 'Carga - Avança e derruba.', 'Vínculo com a Sepultura - Recebe bônus perto do local onde repousa.'],
        attacks: ['Garras 4d6+2', 'Mordida 5d6', 'Carga 6d6'], loot: ['Cabelo de estriga (1d4)', 'Sangue de estriga (1d4)', 'Essência amaldiçoada (1d2)'],
        skills: ['Atletismo +9', 'Consciência +7', 'Coragem +9', 'Esquivar/Escapar +10', 'Tolerância +7', 'Físico +9', 'Resistir a Magia +7', 'Furtividade +8', 'Sobrevivência no Ermo +4'],
        speed: '10m', height: '1,8m', weight: '80kg', habitat: 'Criptas, castelos e locais ligados à maldição', intelligence: 'Bestial com traços humanos', organization: 'Solitária'
    }),
    createExpandedMonster({
        id: 'sucubo', name: 'Súcubo', hp: 70, threat: 'Médio / Complexo', reward: '650 Coroas', st: 35, ca: 14,
        vulnerabilities: ['Óleo de Relicto', 'Dimerítio contra magia'],
        abilities: ['Sedução Sobrenatural - Influencia uma criatura que falhar em Resistir a Magia.', 'Feitiçaria - Usa magia para controle, defesa ou fuga.', 'Imunidade a Encanto - Não pode ser seduzida ou enfeitiçada por efeitos semelhantes.', 'Variante Íncubo - Pode aparecer em forma masculina.'],
        attacks: ['Chute 3d6+2', 'Cabeçada 4d6+2', 'Feitiço - conforme repertório'], loot: ['Chifre de súcubo (1d2)', 'Sangue de relícto (1d4)', 'Essência de monstro (1d2)'],
        skills: ['Atletismo +6', 'Consciência +7', 'Carisma +10', 'Coragem +7', 'Engano +8', 'Esquivar/Escapar +8', 'Tolerância +8', 'Percepção Humana +10', 'Resistir a Magia +7', 'Sedução +10', 'Furtividade +4'],
        speed: '6m', height: 'Humana', weight: 'Humano', habitat: 'Cidades, florestas e comunidades isoladas', intelligence: 'Humana elevada', organization: 'Solitária'
    }),
    createExpandedMonster({
        id: 'uktena', name: 'Uktena', hp: 70, threat: 'Médio / Complexo', reward: '650 Coroas', st: 35, ca: 14, armor: { head: 8, torso: 8, arm: 8, leg: 8 },
        vulnerabilities: ['Óleo de Relicto', 'Fogo'],
        abilities: ['Constrição - Agarra, causa dano e pode sufocar.', 'Saliva Venenosa - Ataques podem aplicar Envenenado.', 'Adivinhação - Percebe presságios e ameaças.', 'Escalada e Natação - Move-se sem penalidade nesses ambientes.'],
        attacks: ['Mordida 5d6', 'Constrição 6d6+2', 'Saliva Venenosa'], loot: ['Escamas de uktena (1d6)', 'Veneno de uktena (1d4)', 'Essência de relícto (1d2)'],
        skills: ['Atletismo +5', 'Consciência +8', 'Esquivar/Escapar +7', 'Tolerância +6', 'Corpo a Corpo +7', 'Físico +7', 'Resistir a Magia +5', 'Lançar Feitiços +8', 'Furtividade +5'],
        speed: '4m', habitat: 'Rios, pântanos, cavernas úmidas e florestas antigas', intelligence: 'Alta', organization: 'Solitária'
    }),
    createExpandedMonster({
        id: 'bruxa-agua', name: 'Bruxa da Água', hp: 50, threat: 'Médio / Complexo', reward: '450 Coroas', st: 25, ca: 15,
        vulnerabilities: ['Óleo de Necrófago', 'Igni', 'Samum'],
        abilities: ['Lama Cegante - Aplica Cego em área.', 'Anfíbia - Move-se e respira na água.', 'Chão Encharcado - Cria terreno difícil.', 'Comandar Afogadores - Coordena necrófagos aquáticos.'],
        attacks: ['Garras 5d6', 'Mordida 6d6', 'Lama Cegante - aplica Cego'], loot: ['Cabelo de bruxa da água (1d4)', 'Glândula de veneno (1d2)', 'Essência aquática (1d4)', 'Tecido de monstro (1d4)'],
        skills: ['Atletismo +8', 'Consciência +7', 'Coragem +7', 'Esquivar/Escapar +6', 'Tolerância +8', 'Corpo a Corpo +8', 'Resistir a Coerção +10', 'Resistir a Magia +9', 'Furtividade +8'],
        speed: '7m', habitat: 'Pântanos, rios, lagos e margens abandonadas', intelligence: 'Humana cruel', organization: 'Solitária ou com afogadores'
    }),

    // LOTE B - INIMIGOS HUMANOS E FACÇÕES
    createExpandedMonster({
        id: 'bandido', name: 'Bandido', hp: 20, threat: 'Fácil / Simples', reward: '10 Coroas', st: 20, ca: 13, armor: { head: 5, torso: 5, arm: 5, leg: 5 },
        vulnerabilities: ['Veneno do Enforcado', 'Axii'],
        abilities: ['Combatente Escalável - O mestre pode trocar armas e armadura conforme a importância do grupo.', 'Tática de Bando - Procura cercar alvos isolados e fugir quando perde a vantagem numérica.'],
        attacks: ['Espada Longa de Ferro 2d6+2', 'Adaga 1d6', 'Besta de Mão 2d6+2 - recarga lenta'],
        loot: ['Coroas (2d6)', 'Espada longa de ferro (1)', 'Adaga (1)', 'Besta de mão (1)', 'Itens pessoais (1d4)'],
        skills: ['Esgrima +6', 'Besta +4', 'Lâminas Curtas +5', 'Brigar +6', 'Esquivar/Escapar +4', 'Atletismo +4', 'Consciência +6', 'Furtividade +3', 'Sobrevivência no Ermo +5', 'Resistir a Magia +4', 'Resistir a Coerção +5', 'Tolerância +5', 'Coragem +7'],
        speed: '4m', height: 'Humana', weight: 'Humano', habitat: 'Cidades, estradas e acampamentos improvisados', intelligence: 'Humana', organization: 'Grupos de 3 a 15'
    }),
    createExpandedMonster({
        id: 'mago-inimigo', name: 'Mago', hp: 30, threat: 'Médio / Simples', reward: '100 Coroas', st: 30, ca: 14,
        vulnerabilities: ['Dimerítio', 'Interromper a conjuração', 'Combate corpo a corpo'],
        abilities: ['Repertório Arcano - Conhece Aenye, Glamour, Pó para Cegar, Rhewi e Teletransporte.', 'Rituais - Pode preparar Jarro de Feitiço e Ritual da Magia.', 'Hexes - Pode usar Comichão Eterna e Hex das Sombras.', 'Foco (2) - O cajado reduz em 2 o custo apropriado de conjuração.'],
        attacks: ['Cajado de Ferro 3d6 - Foco (2)', 'Adaga 1d6', 'Feitiços - conforme repertório'],
        loot: ['Coroas (3d10)', 'Cajado de ferro (1)', 'Componentes mágicos (1d6)', 'Fórmula ou pergaminho (1d2)'],
        skills: ['Cajado/Lança +6', 'Lançar Feitiços +7', 'Criar Hex +6', 'Criar Ritual +5', 'Esquivar/Escapar +8', 'Atletismo +5', 'Consciência +7', 'Furtividade +5', 'Sobrevivência no Ermo +5', 'Resistir a Magia +7', 'Resistir a Coerção +7', 'Tolerância +5', 'Coragem +6'],
        speed: '5m', height: 'Humana', weight: 'Humano', habitat: 'Cidades, torres, academias e cortes', intelligence: 'Humana elevada', organization: 'Solitário ou círculo'
    }),
    createExpandedMonster({
        id: 'arqueiro-scoiatael', name: 'Arqueiro Scoia\'tael', hp: 25, threat: 'Fácil / Complexo', reward: '20 Coroas', st: 25, ca: 14, armor: { head: 3, torso: 5, arm: 5, leg: 5 },
        vulnerabilities: ['Veneno do Enforcado', 'Perder cobertura ou distância'],
        abilities: ['Emboscada Florestal - Recebe vantagem quando ataca sem ter sido percebido.', 'Munição Rancorosa - Pode usar flechas especiais adequadas ao alvo.', 'Atirador Móvel - Reposiciona-se entre disparos sem perder precisão.'],
        attacks: ['Falcione de Caçador 3d6', 'Adaga 1d6', 'Facas de Arremesso 1d6 - alcance 20m', 'Arco Longo 4d6 - alcance 200m'],
        loot: ['Coroas (1d10)', 'Arco longo (1)', 'Flechas (2d10)', 'Falcione de caçador (1)', 'Ervas (1d4)'],
        skills: ['Arco e Flecha +8', 'Esgrima +6', 'Lâminas Curtas +6', 'Brigar +4', 'Esquivar/Escapar +7', 'Atletismo +7', 'Consciência +9', 'Furtividade +8', 'Sobrevivência no Ermo +10', 'Resistir a Magia +4', 'Resistir a Coerção +6', 'Tolerância +7', 'Coragem +6'],
        speed: '7m', height: 'Humana', weight: 'Humano', habitat: 'Florestas, estradas e acampamentos Scoia\'tael', intelligence: 'Humana', organization: 'Comando de 3 a 15'
    }),
    createExpandedMonster({
        id: 'ladrao-estrada', name: 'Ladrão de Estrada', hp: 30, threat: 'Fácil / Complexo', reward: '40 Coroas', st: 30, ca: 13, armor: { head: 8, torso: 12, arm: 12, leg: 12 },
        vulnerabilities: ['Veneno do Enforcado', 'Perder a emboscada'],
        abilities: ['Emboscada de Estrada - Prepara cobertura, bloqueios e armadilhas antes do ataque.', 'Atropelar - Quando montado pode atravessar o espaço do alvo e derrubá-lo.', 'Correr e Recuar - Usa a montaria para atacar e sair do alcance.'],
        attacks: ['Arco Longo 4d6 - alcance 100m', 'Punhal 1d6+2', 'Espada 2d6+4', 'Lança 3d6 - alcance 2m'],
        loot: ['Coroas (3d10)', 'Arma usada (1)', 'Flechas (2d10)', 'Itens roubados (1d6)', 'Montaria, se presente (1)'],
        skills: ['Arco e Flecha +5', 'Atletismo +5', 'Consciência +6', 'Brigar +6', 'Coragem +7', 'Esquivar/Escapar +5', 'Tolerância +5', 'Resistir a Coerção +5', 'Resistir a Magia +4', 'Cavalgar +5', 'Lâminas Curtas +5', 'Cajado/Lança +7', 'Furtividade +5', 'Esgrima +7', 'Táticas +4', 'Armadilhas +6', 'Sobrevivência no Ermo +6'],
        speed: '5m', height: 'Humana', weight: 'Humano', habitat: 'Estradas principais, pontes e desfiladeiros', intelligence: 'Humana', organization: 'Bando'
    }),
    createExpandedMonster({
        id: 'soldado-mercenario', name: 'Soldado Mercenário', hp: 30, threat: 'Fácil / Complexo', reward: '35 Coroas', st: 30, ca: 14, armor: { head: 5, torso: 14, arm: 12, leg: 12 },
        vulnerabilities: ['Veneno do Enforcado', 'Suborno ou quebra de contrato, a critério do mestre'],
        abilities: ['Paranoia - Mantém vigília e desconfia de emboscadas.', 'Comprado e Pago - Sua lealdade depende do contrato e do pagamento.', 'Equipamento Variável - O mestre pode substituir armas e proteções.', 'Montaria Opcional - Pode entrar em combate montado.'],
        attacks: ['Besta 4d6+2 - alcance 100m', 'Espada 4d6', 'Adaga 1d6'],
        loot: ['Coroas (3d10)', 'Besta (1)', 'Virotes (2d10)', 'Arma corpo a corpo (1)', 'Contrato ou insígnia (1)'],
        skills: ['Consciência +6', 'Coragem +8', 'Besta +7', 'Esquivar/Escapar +6', 'Tolerância +7', 'Corpo a Corpo +7', 'Resistir a Coerção +3', 'Resistir a Magia +4', 'Lâminas Curtas +5', 'Furtividade +5', 'Esgrima +6', 'Táticas +5'],
        speed: '6m', height: 'Humana', weight: 'Humano', habitat: 'Acampamentos militares, estradas e zonas de guerra', intelligence: 'Humana', organization: 'Esquadrão ou companhia'
    }),
    createExpandedMonster({
        id: 'pirata', name: 'Pirata', hp: 25, threat: 'Fácil / Complexo', reward: '45 Coroas', st: 25, ca: 14, armor: { head: 3, torso: 5, arm: 5, leg: 5 },
        vulnerabilities: ['Veneno do Enforcado', 'Combate longe do navio ou tripulação'],
        abilities: ['Coquetel de Fogo - Arremessa mistura incendiária em uma pequena área.', 'Pouca Honra - Usa distrações, areia e golpes baixos.', 'Ação Naval - Move-se sem penalidade em convés e cordames.'],
        attacks: ['Arco 3d6+3', 'Punhal 2d6+2', 'Machado 5d6', 'Coquetel de Fogo - dano e Chamas'],
        loot: ['Coroas (3d10)', 'Arma usada (1)', 'Bebida alcoólica (1d4)', 'Mercadoria saqueada (1d6)'],
        skills: ['Arco e Flecha +7', 'Consciência +6', 'Coragem +6', 'Esquivar/Escapar +7', 'Tolerância +6', 'Intimidação +8', 'Corpo a Corpo +7', 'Resistir a Coerção +7', 'Resistir a Magia +4', 'Lâminas Curtas +8', 'Furtividade +5', 'Táticas +6'],
        speed: '7m', height: 'Humana', weight: 'Humano', habitat: 'Portos, costas, ilhas e navios', intelligence: 'Humana', organization: 'Tripulação'
    }),
    createExpandedMonster({
        id: 'agente-servico-secreto', name: 'Agente do Serviço Secreto', hp: 30, threat: 'Fácil / Difícil', reward: '250 Coroas', st: 30, ca: 15, armor: { head: 8, torso: 8, arm: 8, leg: 8 },
        vulnerabilities: ['Veneno do Enforcado', 'Expor seu disfarce ou rede de apoio'],
        abilities: ['Espionagem - Reúne informações e identifica rotinas.', 'Venenos e Aditivos - Pode preparar armas, alimentos ou bebidas.', 'Disfarce - Assume identidades e oculta equipamento.', 'Improvisação - Usa ferramentas e o ambiente para criar vantagens.'],
        attacks: ['Besta de Mão 2d6+2', 'Estilete 1d6', 'Soco Inglês 2d6', 'Veneno - conforme substância'],
        loot: ['Coroas (5d10)', 'Besta de mão (1)', 'Estilete (1)', 'Veneno (1d4)', 'Documentos codificados (1d4)'],
        skills: ['Consciência +8', 'Coragem +7', 'Besta +5', 'Engano +9', 'Esquivar/Escapar +8', 'Intimidação +7', 'Resistir a Coerção +10', 'Resistir a Magia +4', 'Furtividade +8', 'Esgrima +3', 'Táticas +6', 'Sobrevivência no Ermo +4'],
        speed: '7m', height: 'Humana', weight: 'Humano', habitat: 'Cidades, cortes, quartéis e fronteiras', intelligence: 'Humana elevada', organization: 'Solitário ou célula'
    }),
    createExpandedMonster({
        id: 'pacificadores-gemmerianos', name: 'Pacificadores Gemmerianos', hp: 35, threat: 'Duro / Simples', reward: '500 Coroas', st: 35, ca: 14, armor: { head: 14, torso: 16, arm: 16, leg: 16 },
        vulnerabilities: ['Veneno do Enforcado', 'Ataques que contornem a armadura pesada'],
        abilities: ['Soldados Treinados - Usam ataques especiais e manobras em formação.', 'Juggernaut - Ignoram parte das penalidades por armadura e são difíceis de derrubar.'],
        attacks: ['Punhal 2d6+2', 'Malho Gemmeriano 6d6+2'],
        loot: ['Coroas (6d10)', 'Malho gemmeriano (1)', 'Armadura pesada (1)', 'Insígnia gemmeriana (1)'],
        skills: ['Atletismo +5', 'Consciência +4', 'Coragem +9', 'Esquivar/Escapar +7', 'Tolerância +8', 'Etiqueta Social +7', 'Intimidação +8', 'Liderança +5', 'Corpo a Corpo +9', 'Físico +7', 'Resistir a Coerção +8', 'Resistir a Magia +5', 'Furtividade +4', 'Táticas +3'],
        speed: '4m', height: 'Humana', weight: 'Humano', habitat: 'Gemmera e zonas ocupadas pelo Império', intelligence: 'Humana', organization: 'Unidade militar'
    }),
    createExpandedMonster({
        id: 'soldado-reinos-norte', name: 'Soldado dos Reinos do Norte', hp: 30, threat: 'Fácil / Complexo', reward: '100 Coroas', st: 35, ca: 14, armor: { head: 14, torso: 14, arm: 14, leg: 14 },
        vulnerabilities: ['Veneno do Enforcado', 'Quebra de formação'],
        abilities: ['Endurecido pela Guerra - Resiste melhor ao medo em batalha.', 'Equipamento Variável - Pode usar arco, espada ou maça conforme a unidade.', 'Formação - Recebe bônus defensivo ao lutar junto de aliados.'],
        attacks: ['Arco 3d6+3', 'Espada 4d6+4', 'Maça 5d6'],
        loot: ['Coroas (3d10)', 'Arma usada (1)', 'Armadura militar (1)', 'Rções (1d4)', 'Insígnia do reino (1)'],
        skills: ['Arco e Flecha +7', 'Atletismo +4', 'Consciência +6', 'Coragem +6', 'Esquivar/Escapar +6', 'Tolerância +5', 'Intimidação +5', 'Liderança +4', 'Resistir a Coerção +6', 'Resistir a Magia +5', 'Furtividade +5', 'Esgrima +6', 'Táticas +3', 'Sobrevivência no Ermo +5'],
        speed: '6m', height: 'Humana', weight: 'Humano', habitat: 'Reinos do Norte e frentes de guerra', intelligence: 'Humana', organization: 'Esquadrão, pelotão ou exército'
    }),
    createExpandedMonster({
        id: 'cavalaria-kaedweni', name: 'Cavalaria Kaedweni', hp: 35, threat: 'Médio / Complexo', reward: '450 Coroas', st: 35, ca: 14, armor: { head: 16, torso: 16, arm: 16, leg: 16 },
        vulnerabilities: ['Veneno do Enforcado', 'Derrubar ou assustar a montaria'],
        abilities: ['Escaramuçador - Ataca e recua usando a mobilidade da montaria.', 'Carga Montada - Causa dano adicional e pode derrubar.', 'Cavalo de Guerra - Entra em combate com montaria treinada quando disponível.'],
        attacks: ['Arco 3d6+2', 'Machado 2d6+1', 'Carga Montada - dano da arma e impacto'],
        loot: ['Coroas (5d10)', 'Arco (1)', 'Machado (1)', 'Armadura militar (1)', 'Cavalo de guerra, se presente (1)'],
        skills: ['Atletismo +4', 'Consciência +4', 'Coragem +9', 'Esquivar/Escapar +7', 'Tolerância +8', 'Intimidação +8', 'Liderança +5', 'Corpo a Corpo +9', 'Físico +7', 'Resistir a Coerção +8', 'Resistir a Magia +5', 'Cavalgar +7', 'Furtividade +4', 'Táticas +3'],
        speed: '4m', height: 'Humana', weight: 'Humano', habitat: 'Kaedwen, fronteiras e campos de batalha', intelligence: 'Humana', organization: 'Unidade de cavalaria'
    }),
    createExpandedMonster({
        id: 'listra-azul-temeriano', name: 'Listra Azul Temeriano', hp: 30, threat: 'Médio / Difícil', reward: '300 Coroas', st: 30, ca: 15, armor: { head: 14, torso: 16, arm: 12, leg: 12 },
        vulnerabilities: ['Veneno do Enforcado', 'Combate prolongado sem cobertura'],
        abilities: ['Operações Especiais - Usa infiltração, sabotagem e reconhecimento.', 'Emboscada - Recebe vantagem ao iniciar o combate oculto.', 'Treinamento Temeriano - Coordena ataques e troca de alvos.'],
        attacks: ['Besta 4d6+2', 'Espada 5d6', 'Punhal 2d6+2'],
        loot: ['Coroas (5d10)', 'Besta (1)', 'Espada (1)', 'Armadura temeriana (1)', 'Insígnia dos Listras Azuis (1)'],
        skills: ['Atletismo +8', 'Consciência +7', 'Coragem +6', 'Besta +6', 'Esquivar/Escapar +5', 'Tolerância +5', 'Intimidação +5', 'Liderança +4', 'Resistir a Coerção +6', 'Resistir a Magia +5', 'Furtividade +8', 'Esgrima +7', 'Táticas +6', 'Armadilhas +8'],
        speed: '7m', height: 'Humana', weight: 'Humano', habitat: 'Teméria e territórios de operação', intelligence: 'Humana elevada', organization: 'Equipe de operações especiais'
    }),
    createExpandedMonster({
        id: 'alabardeiro-redaniano', name: 'Alabardeiro Redaniano', hp: 35, threat: 'Médio / Simples', reward: '400 Coroas', st: 35, ca: 14, armor: { head: 12, torso: 14, arm: 14, leg: 14 },
        vulnerabilities: ['Veneno do Enforcado', 'Flanqueamento e combate muito próximo'],
        abilities: ['Formação de Alabardas - Protege aliados e controla corredores.', 'Alcance - Pode atacar antes de inimigos que entram em sua zona.', 'Preparar contra Carga - Amplia o dano contra alvo em investida.'],
        attacks: ['Punhal 2d6+2', 'Alabarda 6d6+3'],
        loot: ['Coroas (5d10)', 'Alabarda (1)', 'Punhal (1)', 'Armadura redaniana (1)', 'Insígnia de Redânia (1)'],
        skills: ['Arco e Flecha +7', 'Atletismo +5', 'Consciência +6', 'Coragem +6', 'Esquivar/Escapar +7', 'Tolerância +5', 'Intimidação +5', 'Liderança +4', 'Resistir a Coerção +6', 'Resistir a Magia +5', 'Cajado/Lança +9', 'Furtividade +5', 'Esgrima +6', 'Táticas +3'],
        speed: '5m', height: 'Humana', weight: 'Humano', habitat: 'Redânia, fortalezas e campos de batalha', intelligence: 'Humana', organization: 'Formação militar'
    }),
    createExpandedMonster({
        id: 'saqueador-scoiatael', name: 'Saqueador Scoia\'tael', hp: 35, threat: 'Médio / Complexo', reward: '500 Coroas', st: 35, ca: 14, armor: { head: 10, torso: 10, arm: 10, leg: 10 },
        vulnerabilities: ['Veneno do Enforcado', 'Perder mobilidade e cobertura'],
        abilities: ['Ferramentas Superiores - Emprega armadilhas e equipamento de emboscada.', 'Ódio Racial - Pode receber bônus situacional contra a facção perseguida.', 'Ataque Coordenado - Concentra fogo no alvo marcado.'],
        attacks: ['Besta 2d6', 'Cutelo 3d6', 'Machado 5d6+3'],
        loot: ['Coroas (4d10)', 'Besta (1)', 'Cutelo ou machado (1)', 'Armadilhas (1d4)', 'Suprimentos Scoia\'tael (1d4)'],
        skills: ['Atletismo +7', 'Consciência +6', 'Coragem +7', 'Besta +7', 'Esquivar/Escapar +4', 'Tolerância +5', 'Liderança +4', 'Corpo a Corpo +7', 'Resistir a Coerção +5', 'Resistir a Magia +7', 'Lâminas Curtas +6', 'Furtividade +8', 'Táticas +4', 'Armadilhas +7'],
        speed: '4m', height: 'Humana', weight: 'Humano', habitat: 'Florestas, montanhas e rotas de suprimento', intelligence: 'Humana', organization: 'Comando Scoia\'tael'
    }),
    createExpandedMonster({
        id: 'veterano-scoiatael', name: 'Veterano Scoia\'tael', hp: 30, threat: 'Médio / Complexo', reward: '500 Coroas', st: 30, ca: 15, armor: { head: 20, torso: 20, arm: 20, leg: 20 },
        vulnerabilities: ['Veneno do Enforcado', 'Separar da montaria e do grupo'],
        abilities: ['Escaramuçador Montado - Dispara, reposiciona e mantém distância.', 'Veterano - Ignora a primeira penalidade de medo do encontro.', 'Sobrevivente - Conhece rotas de fuga e terreno selvagem.'],
        attacks: ['Arco 4d6', 'Messer 3d6+4', 'Glaive 4d6+3'],
        loot: ['Coroas (5d10)', 'Arco (1)', 'Messer ou glaive (1)', 'Armadura reforçada (1)', 'Cavalo, se presente (1)'],
        skills: ['Arco e Flecha +9', 'Atletismo +7', 'Consciência +9', 'Coragem +6', 'Esquivar/Escapar +8', 'Tolerância +4', 'Liderança +3', 'Resistir a Coerção +5', 'Resistir a Magia +4', 'Cavalgar +6', 'Furtividade +8', 'Esgrima +8', 'Táticas +6', 'Sobrevivência no Ermo +8'],
        speed: '8m', height: 'Humana', weight: 'Humano', habitat: 'Florestas, fronteiras e campos de batalha', intelligence: 'Humana elevada', organization: 'Comando veterano'
    }),
    createExpandedMonster({
        id: 'defensor-mahakam', name: 'Defensor de Mahakam', hp: 40, threat: 'Médio / Complexo', reward: '600 Coroas', st: 40, ca: 14, armor: { head: 8, torso: 20, arm: 20, leg: 20 },
        vulnerabilities: ['Veneno do Enforcado', 'Ataques direcionados à cabeça menos protegida'],
        abilities: ['Costas Fortes - Carrega equipamento pesado sem sofrer a penalidade normal.', 'Equipamento Anão - Armas e armadura de qualidade superior.', 'Defesa de Posição - Recebe bônus ao proteger passagem ou aliado.'],
        attacks: ['Besta Pesada 5d6', 'Cutelo 3d6', 'Ataque com Escudo 2d6 - pode derrubar'],
        loot: ['Coroas (6d10)', 'Besta pesada (1)', 'Cutelo (1)', 'Armadura de Mahakam (1)', 'Ferramentas anãs (1d4)'],
        skills: ['Atletismo +5', 'Consciência +7', 'Coragem +7', 'Besta +8', 'Esquivar/Escapar +8', 'Tolerância +6', 'Liderança +6', 'Corpo a Corpo +9', 'Resistir a Coerção +6', 'Resistir a Magia +7', 'Furtividade +2', 'Táticas +5', 'Sobrevivência no Ermo +5'],
        speed: '4m', height: 'Anã', weight: 'Anão', habitat: 'Mahakam, fortalezas e comboios anões', intelligence: 'Humana', organization: 'Unidade defensiva'
    }),

    // LOTE D - FICHA MECÂNICA EXCLUSIVA DA PLANILHA
    createExpandedMonster({
        id: 'ulfhedinn', name: 'Ulfhedinn', hp: 120, threat: 'Alta / Complexo', reward: '80 Coroas', st: 50, ca: 15, armor: { head: 10, torso: 10, arm: 10, leg: 10 },
        vulnerabilities: ['Óleo de Amaldiçoado', 'Pó de Lua - suspende a regeneração enquanto estiver ativo'],
        abilities: ['Regeneração - Recupera 20 HP por rodada; Pó de Lua ativo impede a recuperação.', 'Rastrear pelo Cheiro - Segue criaturas e reconhece rastros pelo odor.', 'Visão Noturna - Ignora penalidades de escuridão.', 'Transformação - Um portador humano tem 30% de chance de transformar-se a cada noite e 100% durante a lua cheia.', 'Ataques Implacáveis - Inimigos rolam com desvantagem ao tentar bloquear seus ataques.'],
        attacks: ['Garras 6d6 + Brigar', 'Mordida 7d6 + Brigar', 'Uivo de Lobisomem - ND 20 contra Medo'],
        loot: ['Pele de lobisomem (1)', 'Saliva de lobisomem (1d6)', 'Itens aleatórios (1d6)'],
        skills: ['Curta Distância +9', 'Brigar +12', 'Esquivar/Escapar +12', 'Atletismo +8', 'Consciência +10', 'Furtividade +9', 'Sobrevivência no Ermo +9', 'Resistir a Magia +9', 'Resistir a Coerção +10', 'Tolerância +8', 'Coragem +10'],
        speed: '15m', height: '2,4m', weight: '180kg', habitat: 'Skellige, montanhas e florestas remotas', intelligence: 'Humana durante a calma; bestial em fúria', organization: 'Solitário ou junto de um clã',
        witcherKnowledge: 'O Ulfhedinn é um licantropo extraordinariamente poderoso. Sua regeneração exige Pó de Lua ou recurso equivalente, e enfrentar suas garras apenas com bloqueios é especialmente arriscado.'
    }),

    // LOTE E - FICHAS-BASE ADAPTADAS A PARTIR DA LORE
    createExpandedMonster({
        id: 'koshchey', name: 'Koshchey', hp: 180, threat: 'Mortal / Complexo', reward: '2.500 Coroas', st: 90, ca: 17, armor: { head: 25, torso: 25, arm: 22, leg: 22 },
        vulnerabilities: ['Prata', 'Ruína ou dispersão do ritual que o criou', 'Pontos internos expostos após ablação'],
        abilities: [
            'Criação de Alzur - Imune a medo, veneno, doença e controle mental; resistente a Atordoado e Caído.',
            'Carapaça Quase Impenetrável - Enquanto uma região tiver armadura, reduz em 10 o dano final que não seja de prata.',
            'Sangramento Profundo - Ferimentos das pinças aplicam Sangramento; a margem do ataque define a gravidade.',
            'Golpe Cegante - Um acerto crítico pode aplicar Cego além do ferimento sorteado.',
            'Predador Inescapável - Ao escolher uma presa, ignora reações de medo e atravessa cobertura destrutível para alcançá-la.'
        ],
        attacks: ['Pinças Espinhosas 8d6+4 - Sangramento', 'Patas Perfurantes 6d6+3', 'Esmagamento 10d6 - pode derrubar', 'Varredura 7d6 - atinge todos em alcance'],
        loot: ['Coração de Koshchey (1)', 'Quitina de Koshchey (2d6)', 'Mutagênio raro (1d2)', 'Essência mágica (1d6)'],
        skills: ['Atletismo +12', 'Brigar +17', 'Corpo a Corpo +17', 'Consciência +14', 'Coragem +18', 'Esquivar/Escapar +11', 'Físico +18', 'Furtividade +8', 'Resistir a Coerção +18', 'Resistir a Magia +17', 'Tolerância +18'],
        speed: '8m', height: 'Mais de 6m de largura', weight: 'Várias toneladas', habitat: 'Locais de invocação e laboratórios de magos poderosos', intelligence: 'Instintiva, vinculada ao criador', organization: 'Chefe único',
        witcherKnowledge: 'Um Koshchey é uma criatura colossal produzida por rituais proibidos. Sua carapaça exige prata, ablação concentrada e o rompimento do vínculo mágico que o sustenta.'
    }),
    createExpandedMonster({
        id: 'bloedzuiger', name: 'Bloedzuiger', hp: 35, threat: 'Médio / Complexo', reward: '120 Coroas', st: 25, ca: 13, armor: { head: 4, torso: 4, arm: 4, leg: 4 },
        vulnerabilities: ['Prata', 'Fogo', 'Óleo de Insetoide', 'Ataques fortes'],
        abilities: [
            'Imunidade a Veneno - Não recebe Envenenado nem dano de toxinas comuns.',
            'Digestão Externa - A mordida aplica Ácido e causa 2 pontos de ablação na região atingida.',
            'Explosão Ácida - Ao chegar a 0 HP, pergunta ao mestre se a explosão atinge criaturas em alcance curto; cada alvo sofre 4d6 de ácido e 3 de ablação.',
            'Morte Perigosa - Ataques de área contra grupos de Bloedzuigers podem provocar uma reação em cadeia.'
        ],
        attacks: ['Mordida Sugadora 4d6 - Ácido e 2 de ablação', 'Jato Digestivo 3d6 - alcance 6m', 'Explosão Ácida 4d6 - ao morrer'],
        loot: ['Sangue de Bloedzuiger (1d4)', 'Linfa de Abominação (1d4)', 'Cristais de Albar (1d4)', 'Glândula ácida (1)'],
        skills: ['Atletismo +6', 'Brigar +8', 'Consciência +7', 'Coragem +8', 'Esquivar/Escapar +5', 'Furtividade +7', 'Resistir a Magia +5', 'Sobrevivência no Ermo +8', 'Tolerância +10'],
        speed: '5m', height: '1,2m', weight: '90kg', habitat: 'Pântanos e brejos', intelligence: 'Animal', organization: 'Solitário ou grupo pequeno',
        witcherKnowledge: 'O estômago cheio de ácido torna sua morte tão perigosa quanto seus ataques. Fogo e prata funcionam, mas é essencial recuar antes da explosão.'
    }),
    createExpandedMonster({
        id: 'mamun', name: 'Mamun', hp: 20, threat: 'Fácil / Complexo', reward: '60 Coroas', st: 30, ca: 14,
        vulnerabilities: ['Prata', 'Fogo', 'Pó de Lua contra ilusões'],
        abilities: [
            'Desorientar Viajante - O alvo que falhar em Resistir a Magia perde a orientação e recebe desvantagem em Percepção e Sobrevivência por 10 rodadas.',
            'Dança de Saovine - Em Saovine, pode criar duas imagens ilusórias; um acerto destrói uma imagem.',
            'Glândulas Alucinógenas - Ao ser agarrado ou ferido em alcance curto, pode aplicar Alucinado por 3 rodadas.',
            'Pequeno e Furtivo - Pode esconder-se em vegetação e cobertura que não ocultariam uma criatura humana.'
        ],
        attacks: ['Garras 1d6+2', 'Nuvem Alucinógena - aplica Alucinado', 'Desorientar - teste contra Resistir a Magia'],
        loot: ['Glândula de Mamun (1d2)', 'Esporos alucinógenos (1d4)', 'Essência de monstro (1)'],
        skills: ['Atletismo +7', 'Brigar +5', 'Consciência +8', 'Engano +9', 'Esquivar/Escapar +9', 'Furtividade +12', 'Lançar Feitiços +7', 'Resistir a Magia +8', 'Sobrevivência no Ermo +9'],
        speed: '7m', height: '0,6m', weight: '12kg', habitat: 'Campos e matas rurais de Vizima, Velen e Aedirn', intelligence: 'Astuta', organization: 'Pequeno grupo',
        witcherKnowledge: 'Mamuns são pequenos seres rurais conhecidos por desorientar quem volta de uma taverna. Suas glândulas produzem substâncias alucinógenas valiosas.'
    }),
    createExpandedMonster({
        id: 'mutante', name: 'Mutante', hp: 40, threat: 'Médio / Simples', reward: '150 Coroas', st: 35, ca: 15, armor: { head: 4, torso: 5, arm: 4, leg: 4 },
        vulnerabilities: ['Aço', 'Ataques rápidos'],
        abilities: [
            'Agilidade Deformada - Pode mover-se antes ou depois de um ataque sem gastar a ação completa.',
            'Escalador de Quatro Mãos - Move-se por árvores, paredes e estruturas com facilidade.',
            'Protótipo Instável - Ao cair abaixo de metade do HP, recebe +2 em dano e -2 em defesa.',
            'Mente Reduzida - Resiste a intimidação comum, mas pode ser atraído por iscas simples.'
        ],
        attacks: ['Garras Ósseas 4d6', 'Mordida 3d6+2', 'Arma Improvisada 4d6'],
        loot: ['Glândula pituitária (1)', 'Tendões de mutante (1d4)', 'Presa de fera (1d4)', 'Mutagênio (1)'],
        skills: ['Atletismo +10', 'Brigar +9', 'Consciência +7', 'Coragem +8', 'Esquivar/Escapar +11', 'Furtividade +9', 'Resistir a Coerção +7', 'Resistir a Magia +5', 'Tolerância +8'],
        speed: '9m', height: '1,8m', weight: '85kg', habitat: 'Laboratórios da Salamandra, ruínas e campos de batalha', intelligence: 'Baixa', organization: 'Grupo ou tropa de apoio',
        witcherKnowledge: 'Experimento humano fracassado da Salamandra. É rápido, agressivo e pouco inteligente; aço e ataques rápidos superam suas defesas.'
    }),
    createExpandedMonster({
        id: 'cemetaur', name: 'Cemetaur', hp: 110, threat: 'Duro / Complexo', reward: '1.200 Coroas', st: 55, ca: 15, armor: { head: 12, torso: 14, arm: 12, leg: 12 },
        vulnerabilities: ['Prata', 'Óleo de Necrófago', 'Sangue Negro'],
        abilities: [
            'Rainha da Necrópole - Necrófagos aliados em alcance recebem +2 em ataques e Coragem.',
            'Imunidade a Veneno - Não recebe Envenenado por toxinas comuns.',
            'Resistência Monstruosa - Tem vantagem contra Atordoado e Caído.',
            'Devorar Vivo - Contra alvo Caído ou Preso, a mordida causa +2d6 e recupera 10 HP.',
            'Língua de Medula - Puxa um alvo em alcance curto e pode deixá-lo Preso.'
        ],
        attacks: ['Garras 6d6+2', 'Mordida 7d6+2', 'Língua de Medula 4d6 - puxa e prende', 'Devorar Vivo 9d6+2'],
        loot: ['Mandíbula de Cemetaur (1)', 'Vinagre branco (1d4)', 'Linfa de Abominação (1d4)', 'Mutagênio de necrófago (1)'],
        skills: ['Atletismo +9', 'Brigar +15', 'Consciência +12', 'Coragem +15', 'Esquivar/Escapar +9', 'Físico +14', 'Intimidação +15', 'Resistir a Coerção +14', 'Resistir a Magia +12', 'Sobrevivência no Ermo +10', 'Tolerância +16'],
        speed: '7m', height: '2,4m', weight: '220kg', habitat: 'Campos de batalha, cemitérios e criptas antigas', intelligence: 'Predatória e tática', organization: 'Líder de necrópole',
        witcherKnowledge: 'Cemetaurs são os mais poderosos necrófagos de uma necrópole. Comandam carniçais e Sepulcros e tentam derrubar a presa para devorá-la viva.'
    }),
    createExpandedMonster({
        id: 'dagon', name: 'Dagon', hp: 200, threat: 'Mortal / Encontro', reward: '3.000 Coroas', st: 120, ca: 18, armor: { head: 25, torso: 30, arm: 25, leg: 25 },
        vulnerabilities: ['Fé dos adoradores - somente a queda dos fiéis permite derrotá-lo', 'Samum contra adoradores', 'Rompimento do ritual de invocação'],
        abilities: [
            'Divindade Invulnerável - Enquanto existir um Adorador de Dagon ativo, dano direto não reduz seu HP.',
            'Vínculo de Fé - Cada adorador derrotado causa 15 de dano verdadeiro a Dagon; o último pode encerrar o encontro.',
            'Névoa Abissal - Todos os inimigos na área recebem desvantagem em Percepção e ataques à distância.',
            'Senhor das Profundezas - Criaturas aquáticas aliadas recebem +2 em ataques, defesa e dano.',
            'Destruição Encarnada - Seus golpes podem destruir cobertura, embarcações e estruturas.',
            'Chefe de Encontro - O valor de HP acompanha o vínculo ritual e não permite uma morte convencional.'
        ],
        attacks: ['Tentáculo Abissal 10d6 - pode derrubar', 'Onda Devastadora 8d6 - todos na área', 'Mordida das Profundezas 12d6', 'Névoa do Abismo - aplica Cego por 1 rodada'],
        loot: ['Secreção de Dagon (1)', 'Essência do culto (2d6)', 'Relíquia vodyanoi (1d4)', 'Tesouro ritual (3d6)'],
        skills: ['Atletismo +12', 'Brigar +18', 'Consciência +16', 'Coragem +20', 'Físico +20', 'Intimidação +20', 'Lançar Feitiços +18', 'Resistir a Coerção +20', 'Resistir a Magia +20', 'Tolerância +20'],
        speed: '6m', height: 'Colossal', weight: 'Várias toneladas', habitat: 'Lagos profundos, cidades submersas e altares dedicados', intelligence: 'Divina e incompreensível', organization: 'Chefe único com adoradores',
        witcherKnowledge: 'Dagon não é derrotado como um monstro comum. Sua manifestação recebe poder da fé dos adoradores; atacar o culto e o ritual é o caminho real para vencer.'
    }),
    createExpandedMonster({
        id: 'devorador', name: 'Devorador', hp: 50, threat: 'Médio / Complexo', reward: '300 Coroas', st: 30, ca: 13, armor: { head: 6, torso: 8, arm: 6, leg: 6 },
        vulnerabilities: ['Prata', 'Óleo de Necrófago', 'Sangue Negro'],
        abilities: [
            'Imunidade a Veneno - Não recebe Envenenado por toxinas comuns.',
            'Resistente a Queda - Tem vantagem contra Caído.',
            'Devorar Vivo - Contra alvo Caído, a mordida causa +2d6 e recupera 5 HP.',
            'Explosão Cadavérica - Ao chegar a 0 HP, pode explodir e causar 4d6 em alcance curto, conforme decisão do mestre.',
            'Caçadora Noturna - Recebe +2 em Furtividade e Consciência no escuro.'
        ],
        attacks: ['Garras 4d6+2', 'Mordida 5d6', 'Devorar Vivo 7d6', 'Explosão Cadavérica 4d6'],
        loot: ['Dentes de Devorador (1d4)', 'Cadaverina (1d4)', 'Cristais de Albar (1d4)', 'Pele de necrófago (1d4)'],
        skills: ['Atletismo +8', 'Brigar +10', 'Consciência +9', 'Coragem +10', 'Esquivar/Escapar +7', 'Furtividade +9', 'Resistir a Coerção +10', 'Resistir a Magia +7', 'Sobrevivência no Ermo +8', 'Tolerância +12'],
        speed: '7m', height: '1,8m', weight: '90kg', habitat: 'Cavernas e ruínas próximas a assentamentos e cadáveres', intelligence: 'Baixa e cruel', organization: 'Grupo chamado sabá',
        witcherKnowledge: 'Devoradores tentam derrubar suas vítimas antes de comer carne ainda viva. Alguns incham e explodem quando estão morrendo, tornando grupos especialmente perigosos.'
    }),
    createExpandedMonster({
        id: 'ozzrel', name: 'Ozzrel', hp: 95, threat: 'Difícil / Complexo', reward: '200 Coroas', st: 45, ca: 15, armor: { head: 10, torso: 12, arm: 10, leg: 10 },
        vulnerabilities: ['Prata', 'Óleo de Necrófago', 'Sangue Negro', 'Fogo para interromper regeneração'],
        abilities: [
            'Rei da Cripta - Carniçais e necrófagos menores próximos recebem +2 em Coragem.',
            'Regeneração de Alghoul - Recupera 10 HP por rodada enquanto não estiver sob efeito de fogo.',
            'Espinhos Defensivos - Atacantes corpo a corpo sofrem 1d6 quando os espinhos estão erguidos.',
            'Resistente a Controle - Tem vantagem contra Atordoado e Caído.',
            'Fúria Necrófaga - Abaixo de metade do HP, recebe +2 em ataques e dano.'
        ],
        attacks: ['Garras 6d6', 'Mordida 7d6', 'Varredura de Espinhos 4d6 - área curta'],
        loot: ['Cabeça de Ozzrel (1)', 'Medula de alghoul (1d4)', 'Garras de alghoul (1d4)', 'Itens da cripta (2d6)'],
        skills: ['Atletismo +10', 'Brigar +14', 'Consciência +11', 'Coragem +14', 'Esquivar/Escapar +9', 'Físico +13', 'Furtividade +9', 'Intimidação +13', 'Resistir a Coerção +14', 'Resistir a Magia +10', 'Tolerância +14'],
        speed: '8m', height: '2,1m', weight: '150kg', habitat: 'Cripta nos arredores de Vizima', intelligence: 'Predatória', organization: 'Chefe único com necrófagos',
        witcherKnowledge: 'Ozzrel é um alghoul excepcionalmente grande e resistente, conhecido como Rei da Cripta. Fogo limita sua regeneração, mas o combate direto ainda exige preparação.'
    }),
    createExpandedMonster({
        id: 'echinops', name: 'Echinops', hp: 35, threat: 'Médio / Simples', reward: '180 Coroas', st: 0, ca: 12, armor: { head: 8, torso: 8, arm: 6, leg: 6 },
        vulnerabilities: ['Prata', 'Fogo - dano dobrado', 'Óleo de Amaldiçoado'],
        abilities: [
            'Enraizado - Não pode se mover, ser empurrado ou ficar Caído.',
            'Mente Vegetal - Imune a medo, Axii, Atordoado e demais efeitos mentais.',
            'Sem Sangue ou Dor - Imune a Sangramento, Cego, Envenenado e dor.',
            'Espinhos Fragmentários - Um alvo ferido continua sofrendo 1d6 por rodada até gastar uma ação para remover os fragmentos.',
            'Camuflagem Natural - Enquanto não atacar, pode parecer um tufo de vegetação.'
        ],
        attacks: ['Rajada de Espinhos 4d6 - alcance 3m e Sangramento', 'Espinho Venenoso 3d6 - aplica Envenenado'],
        loot: ['Raiz de Echinops (1d4)', 'Esporos (1d6)', 'Espinhos venenosos (1d6)'],
        skills: ['Consciência +9', 'Coragem +12', 'Furtividade +12', 'Resistir a Coerção +15', 'Resistir a Magia +8', 'Tolerância +15'],
        speed: '0m', height: '1,5m', weight: 'Enraizado', habitat: 'Locais de crimes não expiados, túmulos, pântanos e jardins amaldiçoados', intelligence: 'Vegetal instintiva', organization: 'Solitário ou agrupamento',
        witcherKnowledge: 'Echinops é uma planta monstruosa imóvel que dispara espinhos. Fogo é sua fraqueza principal; tentar envenená-la, cegá-la ou derrubá-la é inútil.'
    }),
    createExpandedMonster({
        id: 'frightener', name: 'Frightener', hp: 160, threat: 'Mortal / Complexo', reward: '2.000 Coroas', st: 80, ca: 16, armor: { head: 22, torso: 25, arm: 22, leg: 22 },
        vulnerabilities: ['Aço', 'Prata', 'Ruídos altos e agudos'],
        abilities: [
            'Abominação de Guerra - Imune a medo, veneno, doença, sangramento e controle mental; resistente aos demais efeitos.',
            'Sensibilidade Acústica - Um som intenso bem-sucedido remove sua reação, reduz a armadura em 10 e aplica Atordoado por 1 rodada.',
            'Regeneração Acelerada - Recupera 10 HP por rodada; fica suspensa enquanto estiver afetado por ruído intenso.',
            'Corpo Endurecido - Enquanto não estiver vulnerável ao som, reduz em 8 o dano final recebido.',
            'Rugido Interruptor - Conjurações em alcance médio exigem teste para não serem interrompidas.'
        ],
        attacks: ['Garras de Mantis 8d6+3', 'Mandíbulas 10d6', 'Investida Esmagadora 9d6 - pode derrubar', 'Rugido - interrompe conjuração'],
        loot: ['Olho de Frightener (1d2)', 'Garra de Frightener (1d6)', 'Quitina de Frightener (2d6)', 'Mutagênio raro (1d2)'],
        skills: ['Atletismo +13', 'Brigar +17', 'Consciência +13', 'Coragem +18', 'Esquivar/Escapar +10', 'Físico +18', 'Intimidação +18', 'Resistir a Coerção +18', 'Resistir a Magia +16', 'Tolerância +18'],
        speed: '8m', height: '4m', weight: '1.200kg', habitat: 'Desertos, laboratórios e campos onde foi solto por um mago', intelligence: 'Instintiva, treinável por magia', organization: 'Chefe único ou arma de guerra',
        witcherKnowledge: 'Quase invencível enquanto luta em condições normais. Ruídos agudos desorientam o Frightener e expõem sua carapaça ao ataque.'
    }),
    createExpandedMonster({
        id: 'garkain', name: 'Garkain', hp: 90, threat: 'Difícil / Complexo', reward: '900 Coroas', st: 45, ca: 15, armor: { head: 8, torso: 8, arm: 8, leg: 8 },
        vulnerabilities: ['Prata', 'Óleo de Vampiro', 'Sangue Negro', 'Samum', 'Pó de Lua'],
        abilities: [
            'Líder de Vampiros Inferiores - Fleders e vampiros menores em alcance recebem +2 em Coragem.',
            'Visão Paralisante - Alvos que o veem pela primeira vez devem resistir ou ficam Atordoados por 1 rodada.',
            'Explosão Mental - Aplica Alucinado e desvantagem em ataques e defesas por 2 rodadas.',
            'Salto Monstruoso - Não corre, mas salta até 12m e pode atacar ao aterrissar.',
            'Drenar Sangue - Ao morder alvo Preso ou Atordoado, recupera metade do dano.',
            'Destemido - Imune a medo e resistente a Atordoado.'
        ],
        attacks: ['Garras 6d6', 'Mordida 7d6+2', 'Salto Predatório 7d6', 'Explosão Mental - aplica Alucinado'],
        loot: ['Saliva de Garkain (1d4)', 'Membrana de asa (1d6)', 'Linfa de Abominação (1d4)', 'Sangue de vampiro (1d4)'],
        skills: ['Atletismo +11', 'Brigar +15', 'Consciência +12', 'Coragem +16', 'Esquivar/Escapar +10', 'Furtividade +12', 'Intimidação +15', 'Resistir a Coerção +14', 'Resistir a Magia +12', 'Tolerância +14'],
        speed: '6m', height: '2,2m', weight: '140kg', habitat: 'Cemitérios, prédios abandonados, telhados e criptas', intelligence: 'Predatória elevada', organization: 'Solitário ou líder de vampiros menores',
        witcherKnowledge: 'Garkains são vampiros inferiores extremamente perigosos. Usam choque mental e saltos para incapacitar a presa antes de beber seu sangue.'
    }),
    createExpandedMonster({
        id: 'centopeia-gigante', name: 'Centopeia Gigante', hp: 85, threat: 'Difícil / Complexo', reward: '700 Coroas', st: 40, ca: 15, armor: { head: 10, torso: 25, arm: 20, leg: 20 },
        vulnerabilities: ['Prata', 'Óleo de Insetoide', 'Yrden - impede escavar e reduz a defesa'],
        abilities: [
            'Sentido de Tremor - É cega, mas detecta movimento no solo; Cego não a afeta.',
            'Escavar - Desaparece no solo e emerge em outro ponto no turno seguinte.',
            'Armadura Traseira - Ataques no torso e nas costas enfrentam armadura reforçada.',
            'Paralisada por Yrden - Ao emergir dentro de Yrden, fica Presa, perde a reação e não pode escavar por 1 rodada.',
            'Imunidades de Insetoide - Imune a Sangramento e Caído; resistente a Atordoado.',
            'Anel Defensivo - Enrola-se, aumenta a armadura em 10 e depois realiza uma varredura.'
        ],
        attacks: ['Mandíbulas 6d6 - aplica Envenenado', 'Jato Ácido 4d6 - 3 de ablação', 'Varredura Corporal 5d6 - área curta'],
        loot: ['Carapaça quitinosa (2d6)', 'Traqueias (1d6)', 'Glândula de veneno (1d4)', 'Mandíbula de Centopeia Gigante (1d2)', 'Extrato ácido (1d4)'],
        skills: ['Atletismo +10', 'Brigar +13', 'Consciência +12', 'Coragem +14', 'Esquivar/Escapar +8', 'Físico +14', 'Furtividade +10', 'Resistir a Magia +11', 'Sobrevivência no Ermo +12', 'Tolerância +15'],
        speed: '8m', height: '1m', weight: '250kg', habitat: 'Florestas, prados, subsolo e vinhedos de Toussaint', intelligence: 'Animal', organization: 'Solitária ou ninho',
        witcherKnowledge: 'A carapaça traseira desvia armas e sinais simples. Yrden deve prender a criatura ao emergir, expondo sua parte frontal menos protegida.'
    }),
    createExpandedMonster({
        id: 'sepulcro', name: 'Sepulcro', hp: 65, threat: 'Médio / Complexo', reward: '450 Coroas', st: 35, ca: 14, armor: { head: 10, torso: 12, arm: 10, leg: 10 },
        vulnerabilities: ['Prata', 'Óleo de Necrófago', 'Fogo', 'Sangue Negro'],
        abilities: [
            'Veneno de Cadáver - Mordidas e ferimentos aplicam Envenenado; o efeito representa infecção por cadaverina.',
            'Imunidade a Veneno - Não recebe Envenenado por toxinas comuns.',
            'Pele e Músculos Grossos - Reduz em 4 o dano final de armas que não sejam de prata.',
            'Resistente a Queda - Tem vantagem contra Caído.',
            'Devorar Medula - Contra alvo Caído, causa +2d6 e recupera 5 HP.'
        ],
        attacks: ['Garras 5d6', 'Mordida 6d6 - Veneno de Cadáver', 'Devorar Medula 8d6'],
        loot: ['Osso de Sepulcro (1d6)', 'Cadaverina (1d4)', 'Vinagre branco (1d4)', 'Dentes de necrófago (1d4)'],
        skills: ['Atletismo +8', 'Brigar +12', 'Consciência +9', 'Coragem +12', 'Esquivar/Escapar +7', 'Físico +12', 'Furtividade +8', 'Resistir a Coerção +12', 'Resistir a Magia +9', 'Sobrevivência no Ermo +8', 'Tolerância +14'],
        speed: '6m', height: '2m', weight: '140kg', habitat: 'Campos de batalha, cemitérios, pântanos e criptas', intelligence: 'Baixa', organization: 'Solitário ou junto de necrófagos',
        witcherKnowledge: 'Sepulcros são parentes maiores dos carniçais, protegidos por pele grossa e portadores de veneno de cadáver. Tentam derrubar a presa para consumir sua medula.'
    }),
    createExpandedMonster({
        id: 'mutante-superior', name: 'Mutante Superior', hp: 90, threat: 'Duro / Simples', reward: '500 Coroas', st: 55, ca: 13, armor: { head: 12, torso: 15, arm: 14, leg: 14 },
        vulnerabilities: ['Aço', 'Ataques fortes', 'Baixa mobilidade'],
        abilities: [
            'Força Sobre-Humana - Pode destruir cobertura e usar armas enormes.',
            'Pele e Músculos Espessos - Reduz em 5 o dano final de golpes comuns.',
            'Fúria Destrutiva - Abaixo de metade do HP, recebe +2 em ataques e +1d6 de dano.',
            'Mente Devastada - Imune a medo comum, mas vulnerável a enganos simples.',
            'Bruto Lento - Não pode realizar reações contra quem se afasta depois de uma Esquiva bem-sucedida.'
        ],
        attacks: ['Clava Pesada 8d6+2', 'Soco 6d6+3', 'Varredura 7d6 - área curta', 'Esmagamento 9d6 - contra alvo Caído'],
        loot: ['Glândula pituitária (1)', 'Fígado de fera (1d2)', 'Presas de fera (1d4)', 'Mutagênio (1d2)', 'Arma pesada (1)'],
        skills: ['Atletismo +8', 'Brigar +14', 'Consciência +7', 'Coragem +15', 'Esquivar/Escapar +5', 'Físico +16', 'Intimidação +14', 'Resistir a Coerção +13', 'Resistir a Magia +7', 'Tolerância +16'],
        speed: '4m', height: '2,4m', weight: '220kg', habitat: 'Laboratórios da Salamandra, mansões abandonadas e campos de guerra', intelligence: 'Muito baixa', organization: 'Tropa de choque',
        witcherKnowledge: 'Um experimento da Salamandra que trocou velocidade e inteligência por massa muscular, pele resistente e força destrutiva. Aço e mobilidade vencem sua proteção.'
    }),
    createExpandedMonster({
        id: 'zeugl', name: 'Zeugl', hp: 150, threat: 'Duro / Complexo', reward: '1.800 Coroas', st: 70, ca: 14, armor: { head: 25, torso: 30, arm: 15, leg: 15 },
        vulnerabilities: ['Destruir quatro tentáculos expõe o corpo', 'Fogo', 'Yrden para controlar tentáculos'],
        abilities: [
            'Corpo Inacessível - Enquanto houver tentáculos ativos, o corpo reduz a 0 o dano de golpes de espada.',
            'Quatro Tentáculos - Cada tentáculo possui 25 HP e 10 de armadura; destruir todos remove Corpo Inacessível e reduz a CA para 11.',
            'Ataques Múltiplos - Pode realizar dois golpes de tentáculo contra alvos diferentes no mesmo turno.',
            'Agarrar e Arrastar - Um alvo Preso é movido em direção à boca a cada turno.',
            'Miasma de Esgoto - Criaturas próximas testam Tolerância ou ficam Envenenadas.',
            'Regeneração de Tentáculo - Após 3 rodadas, um tentáculo destruído retorna com metade do HP, salvo se cauterizado.'
        ],
        attacks: ['Tentáculo 6d6+2 - agarra', 'Chuva de Tentáculos - dois ataques separados', 'Mordida 10d6 - contra alvo arrastado', 'Veneno de Zeugl 4d6 - aplica Envenenado'],
        loot: ['Veneno de Zeugl (1d6)', 'Tentáculo de Zeugl (2d6)', 'Glândula regenerativa (1d2)', 'Mutagênio raro (1)'],
        skills: ['Atletismo +8', 'Brigar +16', 'Consciência +12', 'Coragem +16', 'Físico +18', 'Intimidação +15', 'Resistir a Coerção +16', 'Resistir a Magia +13', 'Tolerância +18'],
        speed: '3m', height: 'Corpo com mais de 4m', weight: 'Mais de 1.000kg', habitat: 'Esgotos, lixões e depósitos de resíduos urbanos', intelligence: 'Animal', organization: 'Chefe solitário',
        witcherKnowledge: 'O corpo de um Zeugl adulto fica protegido sob a imundície. Os tentáculos devem ser cortados e cauterizados antes que a criatura possa ser finalizada.'
    }),
    createExpandedMonster({
        id: 'kayran', name: 'Kayran', hp: 220, threat: 'Mortal / Complexo', reward: '3.000 Coroas', st: 100, ca: 16, armor: { head: 25, torso: 30, arm: 18, leg: 18 },
        vulnerabilities: ['Yrden', 'Armadilha de Kayran', 'Cortar os quatro tentáculos externos', 'Antídoto de Kayran protege contra o muco'],
        abilities: [
            'Imunidade a Veneno - Não recebe Envenenado nem dano de toxinas.',
            'Seis Tentáculos - Quatro externos possuem 35 HP e 12 de armadura; os dois centrais são imunes até a fase final.',
            'Tentáculo Veloz - Um tentáculo externo só pode receber ataques corpo a corpo quando estiver Preso por Yrden ou pela Armadilha de Kayran.',
            'Fases do Chefe - Cada tentáculo externo destruído remove 30 HP do corpo; após o terceiro, o Kayran entra em Fúria.',
            'Muco Tóxico - Contato aplica Envenenado e Preso; o antídoto específico ignora o veneno, mas não a imobilização.',
            'Fúria do Kayran - Na fase final realiza dois ataques de tentáculo por turno.'
        ],
        attacks: ['Golpe de Tentáculo 9d6 - pode derrubar', 'Varredura Dupla 7d6 - área ampla', 'Muco Tóxico 4d6 - Envenenado e Preso', 'Esmagamento 12d6 - fase final'],
        loot: ['Pele de Kayran (2d6)', 'Muco de Kayran (1d6)', 'Olho de Kayran (1d2)', 'Tecido de monstro (2d6)', 'Mutagênio raro (1)'],
        skills: ['Atletismo +10', 'Brigar +18', 'Consciência +14', 'Coragem +18', 'Físico +20', 'Intimidação +18', 'Resistir a Coerção +18', 'Resistir a Magia +16', 'Tolerância +20'],
        speed: '4m', height: 'Colossal', weight: 'Várias toneladas', habitat: 'Rios profundos e vales alagados próximos a Flotsam', intelligence: 'Animal', organization: 'Chefe único',
        witcherKnowledge: 'O Kayran exige preparação e combate em fases. Yrden ou uma armadilha prende os tentáculos externos para que sejam cortados; destruir três conduz à fase final.'
    })
];

monsterDatabase.push(...expandedMonsterDatabase);
