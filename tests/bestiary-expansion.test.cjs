const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const read = relativePath => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

const context = vm.createContext({});
vm.runInContext(`${read(path.join('js', 'bestiary.js'))}
${read(path.join('js', 'bestiary-expansion.js'))}
globalThis.__monsterDatabase = monsterDatabase;
globalThis.__expandedMonsterDatabase = expandedMonsterDatabase;`, context);

const monsters = context.__monsterDatabase;
const expansion = context.__expandedMonsterDatabase;

test('lotes A, B, D e E ampliam o bestiário sem IDs duplicados', () => {
    assert.equal(expansion.length, 64);
    assert.equal(monsters.length, 85);

    const ids = monsters.map(monster => monster.id);
    assert.equal(new Set(ids).size, ids.length);
});

test('nomes aprovados são usados e aliases incorretos não aparecem', () => {
    const names = monsters.map(monster => monster.name);

    [
        'Lâmia', 'Alpor', 'Nevoloso', 'Kikimora', 'Rotífero', 'Tourovor',
        'Fetulho', 'Chort', 'Pacificadores Gemmerianos'
    ].forEach(name => assert.ok(names.includes(name), `Nome aprovado ausente: ${name}`));

    ['Alpor / Lâmia', 'Kikimore', 'Fracassos', 'Gráficos', 'Chupetas Gemmerianas']
        .forEach(name => assert.ok(!names.includes(name), `Nome incorreto ainda presente: ${name}`));
});

test('expansão usa somente o esquema atual e inclui mecânicas essenciais', () => {
    expansion.forEach(monster => {
        assert.ok(monster.id);
        assert.ok(monster.name);
        assert.ok(Number.isFinite(monster.hp) && monster.hp > 0, `${monster.name} sem HP válido`);
        assert.ok(monster.threat);
        assert.ok(monster.reward);
        assert.ok(monster.armor && ['head', 'torso', 'arm', 'leg'].every(region => Number.isFinite(monster.armor[region])));
        assert.ok(Array.isArray(monster.skills) && monster.skills.length > 0, `${monster.name} sem perícias`);
        assert.ok(Array.isArray(monster.attacks) && monster.attacks.length > 0, `${monster.name} sem ataques`);
        assert.ok(Array.isArray(monster.abilities) && monster.abilities.length > 0, `${monster.name} sem habilidades`);
        assert.equal(Object.hasOwn(monster, 'attributes'), false, `${monster.name} não deve receber atributos-base`);
    });
});

test('Lâmia e Alpor são criaturas distintas e Alpor é superior', () => {
    const lamia = monsters.find(monster => monster.id === 'lamia');
    const alpor = monsters.find(monster => monster.id === 'alpor');

    assert.equal(lamia.name, 'Lâmia');
    assert.equal(alpor.name, 'Alpor');
    assert.ok(alpor.hp > lamia.hp);
    assert.ok(alpor.skills.length >= lamia.skills.length);
});

test('Ulfhedinn preserva a ficha mecânica aprovada da planilha', () => {
    const ulfhedinn = monsters.find(monster => monster.id === 'ulfhedinn');

    assert.equal(ulfhedinn.hp, 120);
    assert.equal(ulfhedinn.speed, '15m');
    assert.ok(ulfhedinn.abilities.some(ability => ability.includes('20 HP por rodada')));
    assert.ok(ulfhedinn.abilities.some(ability => ability.includes('30%')));
    assert.ok(ulfhedinn.attacks.some(attack => attack.includes('ND 20')));
    assert.ok(ulfhedinn.skills.includes('Brigar +12'));
});

test('Lote E inclui as 16 fichas-base aprovadas com nomes normalizados', () => {
    const loteE = [
        'Koshchey', 'Bloedzuiger', 'Mamun', 'Mutante', 'Cemetaur', 'Dagon',
        'Devorador', 'Ozzrel', 'Echinops', 'Frightener', 'Garkain',
        'Centopeia Gigante', 'Sepulcro', 'Mutante Superior', 'Zeugl', 'Kayran'
    ];

    loteE.forEach(name => assert.ok(monsters.some(monster => monster.name === name), `Lote E ausente: ${name}`));
});

test('chefes do Lote E preservam seus fluxos especiais de encontro', () => {
    const byId = id => monsters.find(monster => monster.id === id);

    assert.ok(byId('dagon').abilities.some(ability => ability.includes('Adorador de Dagon')));
    assert.ok(byId('kayran').abilities.some(ability => ability.includes('Seis Tentáculos')));
    assert.ok(byId('zeugl').abilities.some(ability => ability.includes('Quatro Tentáculos')));
    assert.ok(byId('frightener').abilities.some(ability => ability.includes('Sensibilidade Acústica')));
    assert.ok(byId('centopeia-gigante').abilities.some(ability => ability.includes('Yrden')));
    assert.equal(byId('echinops').speed, '0m');
});

test('expansão carrega entre o catálogo base e a interface e integra o cache offline', () => {
    const indexSource = read('index.html');
    const workerSource = read(path.join('js', 'service-worker.js'));
    const baseIndex = indexSource.indexOf('js/bestiary.js');
    const expansionIndex = indexSource.indexOf('js/bestiary-expansion.js');
    const uiIndex = indexSource.indexOf('js/monsters.js');

    assert.ok(baseIndex >= 0 && expansionIndex > baseIndex && uiIndex > expansionIndex);
    assert.match(workerSource, /witcher-combat-tracker-v158/);
    assert.match(workerSource, /\.\/js\/bestiary-expansion\.js/);
});
