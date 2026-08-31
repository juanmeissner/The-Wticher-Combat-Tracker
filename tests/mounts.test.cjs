const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const itemsSource = fs.readFileSync(path.join(projectRoot, 'js', 'items.js'), 'utf8');
const mountsSource = fs.readFileSync(path.join(projectRoot, 'js', 'mounts.js'), 'utf8');
const history = [];

const context = vm.createContext({
    console,
    Date,
    Math,
    setTimeout,
    clearTimeout,
    document: {
        getElementById() { return null; },
        createElement() {
            return {
                className: '',
                innerHTML: '',
                addEventListener() {},
                remove() {},
                classList: { add() {}, remove() {} }
            };
        },
        body: { appendChild() {} },
        querySelectorAll() { return []; }
    }
});
context.window = context;

vm.runInContext(`${itemsSource}\nglobalThis.predefinedItems = predefinedItems;`, context, { filename: 'items.js' });
vm.runInContext(mountsSource, context, { filename: 'mounts.js' });

const find = id => context.predefinedItems.find(item => item.id === id);
const mountCatalog = context.predefinedItems.filter(item => item.transportKind === 'mount');
const vehicleCatalog = context.predefinedItems.filter(item => item.transportKind === 'vehicle');
const mountGearCatalog = context.predefinedItems.filter(item => item.transportKind === 'mount-gear');

assert.equal(mountCatalog.length, 4);
assert.ok(mountCatalog.every(item => item.category === 'misc' && item.hp > 0 && item.movement > 0));
assert.equal(vehicleCatalog.length, 4);
assert.ok(vehicleCatalog.every(item => item.category === 'misc' && item.hp > 0 && item.capacity > 0));
assert.equal(mountGearCatalog.length, 9);
assert.deepEqual(
    [...new Set(mountGearCatalog.map(item => item.mountSlot))].sort(),
    ['barding', 'horseshoes', 'saddle', 'saddlebags']
);
assert.ok(mountGearCatalog.every(item => item.category === 'equipment' && item.weight > 0));

const owner = {
    id: 'geralt',
    name: 'Geralt',
    movement: 8,
    inventory: [
        { ...find('cavalodeguerra'), quantity: 2 },
        { ...find('alforjesgrandes'), quantity: 2 },
        { ...find('bardapesada'), quantity: 1 },
        { ...find('ferradurasdeviagem'), quantity: 1 },
        { ...find('carrocasimples'), quantity: 2 },
        { id: 'ration', name: 'Ração', icon: '🍖', category: 'usable', quantity: 3, weight: 2 }
    ]
};
context.getCharacterCollectionOwner = () => owner;
context.addCombatHistoryEntry = (...args) => history.push(args);
context.setPendingAutomationDamageContext = () => {};
context.completeSpellDamageStep = () => {};
context.showToast = () => {};

const state = context.ensureTransportState(owner);
assert.equal(state.version, 2);
assert.equal(state.mounts.length, 2, 'Cada unidade de cavalo deve gerar uma montaria individual.');
assert.equal(state.vehicles.length, 2, 'Cada veículo deve possuir estado próprio.');
assert.equal(state.vehicles[0].requiredMounts, 1, 'A carroça deve exigir um cavalo.');
assert.equal(find('carruagemcomum').requiredMounts, 2, 'A carruagem deve exigir dois cavalos.');

const mount = state.mounts[0];
mount.equipment.saddlebags = 'alforjesgrandes';
mount.equipment.barding = 'bardapesada';
mount.equipment.horseshoes = 'ferradurasdeviagem';
mount.bardingDefenseCurrent = 5;

assert.equal(context.getMountCapacity(owner, mount), 60, 'A capacidade deve vir somente dos alforjes.');
assert.equal(context.getMountMovement(owner, mount), 13, 'Ferraduras +1 e barda pesada -1 devem se compensar.');
mount.conditions = ['frightened'];
assert.equal(context.getMountMovement(owner, mount), 11, 'Assustada deve reduzir o Movimento da montaria em 2.');
mount.conditions = ['stunned'];
assert.equal(context.getMountMovement(owner, mount), 0, 'Atordoada deve impedir o deslocamento da montaria.');
mount.conditions = [];

state.mounted = true;
state.activeMountId = mount.id;
assert.deepEqual(
    JSON.parse(JSON.stringify(context.getEffectiveCombatantMovement(owner))),
    { value: 13, mounted: true, mount: JSON.parse(JSON.stringify(mount)), title: `Montado em ${mount.name}` }
);

context.applyMountDamage(owner, mount, 12);
assert.equal(mount.bardingDefenseCurrent, 0, 'A barda deve absorver e perder seus 5 pontos de defesa.');
assert.equal(mount.hpCurrent, 48, 'A montaria deve receber apenas o dano que ultrapassar a barda.');
assert.match(history.at(-1)[1], /Barda: 5 absorvido/);

mount.cargo.push({ id: 'ration', name: 'Ração', quantity: 2, weight: 2 });
assert.equal(context.getCargoWeight(mount.cargo), 4);
assert.deepEqual(
    JSON.parse(JSON.stringify(context.getMountLoadBreakdown(owner, mount))),
    {
        cargoWeight: 4,
        equipmentWeight: 25,
        total: 29,
        capacity: 60,
        excessCargo: 0,
        isOverloaded: false,
        equipmentEntries: [
            { slot: 'saddlebags', itemId: 'alforjesgrandes', name: 'Alforjes Grandes', weight: 4 },
            { slot: 'barding', itemId: 'bardapesada', name: 'Barda Pesada', weight: 20 },
            { slot: 'horseshoes', itemId: 'ferradurasdeviagem', name: 'Ferraduras de Viagem', weight: 1 }
        ]
    }
);
assert.equal(context.canRemoveTransportInventoryItem(owner.inventory[0]), true, 'Um segundo exemplar vazio ainda pode ser removido.');

const secondMount = state.mounts[1];
const firstVehicle = state.vehicles[0];
const secondVehicle = state.vehicles[1];
let transfer = context.transferCargoBetweenStorages(
    owner.id,
    `mount:${mount.id}`,
    `mount:${secondMount.id}`,
    'ration',
    1
);
assert.equal(transfer.transferred, false, 'Montaria sem alforjes não deve receber carga.');
assert.equal(transfer.reason, 'capacity');
assert.equal(mount.cargo[0].quantity, 2, 'Falha de capacidade não deve alterar a origem.');

secondMount.equipment.saddlebags = 'alforjesgrandes';
assert.equal(context.canRemoveTransportInventoryItem(owner.inventory[0]), false, 'Nenhuma unidade pode ser removida quando todas possuem carga ou equipamento.');
transfer = context.transferCargoBetweenStorages(
    owner.id,
    `mount:${mount.id}`,
    `mount:${secondMount.id}`,
    'ration',
    1
);
assert.equal(transfer.transferred, true, 'Deve transferir diretamente entre duas montarias.');
assert.equal(mount.cargo[0].quantity, 1);
assert.equal(secondMount.cargo[0].quantity, 1);

transfer = context.transferCargoBetweenStorages(
    owner.id,
    `mount:${secondMount.id}`,
    `vehicle:${firstVehicle.id}`,
    'ration',
    'all'
);
assert.equal(transfer.transferred, true, 'Deve transferir diretamente da montaria para o veículo.');
assert.equal(secondMount.cargo.length, 0);
assert.equal(firstVehicle.cargo[0].quantity, 1);

transfer = context.transferCargoBetweenStorages(
    owner.id,
    `vehicle:${firstVehicle.id}`,
    `vehicle:${secondVehicle.id}`,
    'ration',
    'all'
);
assert.equal(transfer.transferred, true, 'Deve transferir diretamente entre dois veículos.');
assert.equal(firstVehicle.cargo.length, 0);
assert.equal(secondVehicle.cargo[0].quantity, 1);

transfer = context.transferCargoBetweenStorages(
    owner.id,
    `vehicle:${secondVehicle.id}`,
    'owner',
    'ration',
    'all'
);
assert.equal(transfer.transferred, true, 'Deve devolver carga diretamente ao personagem.');
assert.equal(secondVehicle.cargo.length, 0);
assert.equal(owner.inventory.find(item => item.id === 'ration').quantity, 4);

transfer = context.transferCargoBetweenStorages(
    owner.id,
    'owner',
    `mount:${mount.id}`,
    'ration',
    2
);
assert.equal(transfer.transferred, true, 'Deve transferir diretamente do personagem para a montaria.');
assert.equal(owner.inventory.find(item => item.id === 'ration').quantity, 2);
assert.equal(mount.cargo[0].quantity, 3);

transfer = context.transferCargoBetweenStorages(
    owner.id,
    'owner',
    `vehicle:${firstVehicle.id}`,
    'ration',
    1
);
assert.equal(transfer.transferred, true, 'Deve transferir diretamente do personagem para o veículo.');
assert.equal(owner.inventory.find(item => item.id === 'ration').quantity, 1);
assert.equal(firstVehicle.cargo[0].quantity, 1);

transfer = context.transferCargoBetweenStorages(
    owner.id,
    `vehicle:${firstVehicle.id}`,
    `mount:${secondMount.id}`,
    'ration',
    1
);
assert.equal(transfer.transferred, true, 'Deve transferir diretamente do veículo para a montaria.');
assert.equal(firstVehicle.cargo.length, 0);
assert.equal(secondMount.cargo[0].quantity, 1);

transfer = context.transferCargoBetweenStorages(
    owner.id,
    `mount:${secondMount.id}`,
    `mount:${secondMount.id}`,
    'ration',
    1
);
assert.equal(transfer.transferred, false, 'Origem e destino não podem ser o mesmo armazenamento.');
assert.equal(transfer.reason, 'same-storage');
assert.equal(secondMount.cargo[0].quantity, 1);

const ownerQuantityBeforeCapacityFailure = owner.inventory.find(item => item.id === 'ration').quantity;
firstVehicle.capacity = 1;
transfer = context.transferCargoBetweenStorages(
    owner.id,
    'owner',
    `vehicle:${firstVehicle.id}`,
    'ration',
    1
);
assert.equal(transfer.transferred, false, 'Veículo sem espaço suficiente deve recusar a transferência inteira.');
assert.equal(transfer.reason, 'capacity');
assert.equal(owner.inventory.find(item => item.id === 'ration').quantity, ownerQuantityBeforeCapacityFailure);
assert.equal(firstVehicle.cargo.length, 0);
firstVehicle.capacity = 150;

context.toggleMountPanel(owner.id);
const panel = context.renderCombatantMountPanel(owner);
assert.match(panel, /MONTARIA/);
assert.match(panel, /HP 48\/55/);
assert.match(panel, /Saudável/);

assert.equal(state.mounted, true, 'O cavaleiro deve continuar montado antes do dano fatal.');
context.applyMountDamage(owner, mount, 100);
assert.equal(mount.hpCurrent, 0);
assert.equal(state.mounted, false, 'A derrota da montaria deve desmontar o cavaleiro.');
assert.ok(owner.effects.some(effect => effect.id === '🧎'), 'A queda deve aplicar a condição Caído ao cavaleiro.');
assert.ok(history.some(entry => /caiu de/.test(entry[0])), 'A queda do cavaleiro deve ser registrada no histórico.');

const indexSource = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
const workerSource = fs.readFileSync(path.join(projectRoot, 'js', 'service-worker.js'), 'utf8');
const damageSource = fs.readFileSync(path.join(projectRoot, 'js', 'combat', 'damage-modal.js'), 'utf8');
const rulesSource = fs.readFileSync(path.join(projectRoot, 'js', 'rules-automation.js'), 'utf8');
const renderSource = fs.readFileSync(path.join(projectRoot, 'js', 'combat', 'combat-render.js'), 'utf8');
const sessionSource = fs.readFileSync(path.join(projectRoot, 'js', 'session-features.js'), 'utf8');
assert.match(indexSource, /mounts\.css/);
assert.match(indexSource, /js\/mounts\.js/);
assert.match(workerSource, /mounts\.css/);
assert.match(workerSource, /js\/mounts\.js/);
assert.match(damageSource, /requestMountedDamageTarget/);
assert.match(rulesSource, /skipMountedChoice/);
assert.match(renderSource, /renderCombatantMountPanel/);
assert.match(sessionSource, /isTransportSystemItem/);
assert.match(mountsSource, /Central de Carga/);
assert.match(mountsSource, /transferCargoBetweenStorages/);
assert.match(mountsSource, /swapCargoTransferRoute/);
assert.match(mountsSource, /sourceKey === destination\.key|source\.key === destination\.key/);

const mountsCss = fs.readFileSync(path.join(projectRoot, 'mounts.css'), 'utf8');
assert.match(mountsCss, /\.transport-transfer-route/);
assert.match(mountsCss, /@media \(max-width: 640px\)/);
assert.match(mountsCss, /\.transport-transfer-item-row/);

console.log('✓ Montarias, alforjes, veículos, movimento e dano validados.');
