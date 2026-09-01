const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(projectRoot, file), 'utf8');
const context = vm.createContext({ console, Math, Date });
context.window = context;

vm.runInContext(read(path.join('js', 'items.js')), context, { filename: 'items.js' });
vm.runInContext(read(path.join('js', 'bestiary.js')), context, { filename: 'bestiary.js' });
vm.runInContext(read(path.join('js', 'loot-rewards.js')), context, { filename: 'loot-rewards.js' });

const loot = context.lootRewards;
assert.ok(loot, 'O módulo deve expor a API de saque e recompensas.');

const griffinFeather = loot.parseMonsterLootLine('Pena de Grifo (1d10)');
assert.equal(griffinFeather.name, 'Pena de Grifo');
assert.deepEqual(
    JSON.parse(JSON.stringify(griffinFeather.quantityRule)),
    { kind: 'dice', dice: 1, sides: 10, divisor: 1, label: '1d10' }
);
assert.equal(loot.rollMonsterLootEntry(griffinFeather, () => 0.4).quantity, 5);

const dividedDice = loot.parseMonsterLootLine('Pó Infundido (1d6 / 2)');
const dividedResult = loot.rollMonsterLootEntry(dividedDice, () => 0.99);
assert.equal(dividedResult.quantity, 3, 'Divisões de dados devem arredondar para cima e nunca produzir zero.');
assert.match(dividedResult.rollDetail, /÷ 2 = 3/);

const difficultyLoot = loot.parseMonsterLootLine('Ovo de Grifo 1x (ND: 16)');
assert.equal(difficultyLoot.name, 'Ovo de Grifo');
assert.equal(difficultyLoot.difficulty, 16);
assert.equal(loot.rollMonsterLootEntry(difficultyLoot, () => 0).quantity, 1);

const chanceLoot = loot.parseMonsterLootLine('Mutagênico Vermelho (5%)');
assert.equal(loot.rollMonsterLootEntry(chanceLoot, () => 0.04).quantity, 1);
assert.equal(loot.rollMonsterLootEntry(chanceLoot, () => 0.05).quantity, 0);

assert.deepEqual(
    JSON.parse(JSON.stringify(loot.divideCrowns(5, ['geralt', 'yennefer']))),
    [
        { recipientId: 'geralt', amount: 3 },
        { recipientId: 'yennefer', amount: 2 }
    ]
);
assert.equal(loot.parseMonsterReward('1.750 Coroas').amount, 1750);
assert.equal(loot.normalizeLootCollectionAmount('17.9'), 17);
assert.equal(loot.normalizeLootCollectionAmount('-4'), 0);
assert.equal(loot.normalizeLootCollectionAmount('inválido', 6), 6);
assert.deepEqual(
    JSON.parse(JSON.stringify(loot.divideCrowns(50, []))),
    [],
    'Sem destinatários, nenhuma Coroa deve ser distribuída.'
);

const resolvedPowder = loot.resolveLootItemDefinition('Poeira Infundida');
assert.equal(resolvedPowder.id, 'poinfundido');
const genericFeather = loot.resolveLootItemDefinition('Pena de Grifo');
assert.equal(genericFeather.id, 'loot_penadegrifo');
assert.equal(genericFeather.craftingMaterial, true);

context.__allLootLinesParse = vm.runInContext(`
    monsterDatabase.flatMap(monster => monster.loot || [])
        .filter(line => String(line).trim())
        .every(line => {
            const parsed = lootRewards.parseMonsterLootLine(line);
            return parsed && parsed.name && parsed.quantityRule;
        })
`, context);
assert.equal(context.__allLootLinesParse, true, 'Todo o saque atual do bestiário deve ser interpretável.');

assert.equal(loot.canCollectMonsterLoot({
    id: 1,
    type: 'monster',
    hpCurrent: 0,
    presetMonsterId: 'grifo'
}), true);
assert.equal(loot.canCollectMonsterLoot({
    id: 1,
    type: 'monster',
    hpCurrent: 10,
    presetMonsterId: 'grifo'
}), false);

context.savePlayersToStorage = () => {};
const persistentMonster = {
    id: 99,
    name: 'Grifo persistente',
    type: 'monster',
    hpCurrent: 0,
    presetMonsterId: 'grifo'
};
const firstLootRoll = loot.ensureMonsterLootState(persistentMonster);
const savedLootRoll = JSON.stringify(firstLootRoll);
const secondLootRoll = loot.ensureMonsterLootState(persistentMonster);
assert.equal(JSON.stringify(secondLootRoll), savedLootRoll, 'Reabrir a coleta não pode rolar o saque novamente.');

const report = loot.getCollectedLootReport([{
    id: 1,
    name: 'Grifo 1',
    lootCollection: {
        status: 'collected',
        collectedAt: '2026-08-28T00:00:00.000Z',
        crownDistributions: [
            { recipientId: 2, recipientName: 'Geralt', amount: 60 },
            { recipientId: 3, recipientName: 'Yennefer', amount: 60 }
        ],
        itemDistributions: [
            { itemName: 'Pena de Grifo', quantity: 5, recipientName: 'Geralt', status: 'collected' },
            { itemName: 'Ovo de Grifo', quantity: 0, status: 'skipped' }
        ]
    }
}]);
assert.equal(report.totalCrowns, 120);
assert.equal(report.totalItems, 5);
assert.equal(report.collections.length, 1);

const indexSource = read('index.html');
const renderSource = read(path.join('js', 'combat', 'combat-render.js'));
const sessionSource = read(path.join('js', 'session-features.js'));
const reportSource = read(path.join('js', 'enhancements.js'));
const workerSource = read(path.join('js', 'service-worker.js'));
const lootSource = read(path.join('js', 'loot-rewards.js'));
const lootStyles = read('loot-rewards.css');
assert.match(indexSource, /loot-rewards\.css/);
assert.match(indexSource, /js\/loot-rewards\.js/);
assert.match(renderSource, /renderCombatantLootPanel/);
assert.match(sessionSource, /getCollectedLootReport/);
assert.match(sessionSource, /loot: \{ icon: '🎁'/);
assert.match(reportSource, /Saques e recompensas/);
assert.match(lootSource, /id="lootCrownsAmount"/);
assert.match(lootSource, /id="lootQuantity-\$\{index\}"/);
assert.doesNotMatch(lootSource, /Escolha ao menos um personagem para receber as Coroas/);
assert.match(lootSource, /state\.unassignedCrowns = crownRecipientIds\.length \? 0 : collectedCrownsAmount/);
assert.match(lootStyles, /\.loot-quantity-editor/);
assert.match(workerSource, /witcher-combat-tracker-v91/);
assert.match(workerSource, /loot-rewards\.css/);
assert.match(workerSource, /js\/loot-rewards\.js/);

console.log('✓ Saque, recompensas, distribuição e relatório pós-combate validados.');
