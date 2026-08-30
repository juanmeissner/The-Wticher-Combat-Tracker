const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const stateSource = fs.readFileSync(path.join(projectRoot, 'js', 'state.js'), 'utf8');
const renderSource = fs.readFileSync(path.join(projectRoot, 'js', 'combat', 'combat-render.js'), 'utf8');
const equipmentCss = fs.readFileSync(path.join(projectRoot, 'equipment.css'), 'utf8');

const context = vm.createContext({ console, encodeURIComponent, decodeURIComponent });
vm.runInContext('var window = globalThis;', context);
vm.runInContext(stateSource, context, { filename: 'js/state.js' });
vm.runInContext(`
    var predefinedAbilities = [];
    var predefinedItems = [];
    var conditionDescriptions = {
        '🔥': {
            title: 'Em Chamas',
            desc: 'Sofre dano recorrente de fogo.',
            active: true,
            stack: 3,
            augment: 'debuff'
        }
    };
`, context);
vm.runInContext(renderSource, context, { filename: 'js/combat/combat-render.js' });

const combatant = {
    id: 12,
    name: 'Grifo 1',
    type: 'monster',
    effects: [{ id: '🔥', type: 'condition', remainingTurns: 3, stacks: 2 }]
};
context.__effectsCombatant = combatant;

const collapsed = context.renderCombatantEffectsPanel(combatant);
assert.match(collapsed, /EFEITOS ATIVOS/);
assert.match(collapsed, /1 ativo/);
assert.match(collapsed, /aria-expanded="false"/);
assert.doesNotMatch(collapsed, /Em Chamas/);

vm.runInContext("expandedEffectPanelIds.add('12')", context);
const expanded = context.renderCombatantEffectsPanel(combatant);
assert.match(expanded, /aria-expanded="true"/);
assert.match(expanded, /Em Chamas/);
assert.match(expanded, /3 Rodadas/);
assert.match(expanded, /x2/);

vm.runInContext("selectedEffect = { combatantId: 12, effectId: '🔥', type: 'condition' }", context);
const selectedEffectPanel = context.renderCombatantEffectsPanel(combatant);
assert.match(selectedEffectPanel, /decreaseEffectTurn/);
assert.match(selectedEffectPanel, /increaseEffectStack/);

assert.equal(context.renderCombatantEffectsPanel({ ...combatant, effects: [] }), '');
assert.match(renderSource, /activeEffectsPanelHtml/);
assert.doesNotMatch(renderSource, /expandedEffectsCombatantId/);
assert.match(equipmentCss, /combat-effects-panel/);
assert.match(equipmentCss, /combat-effects-header/);

console.log('✓ Painel recolhível de efeitos ativos validado para jogadores e inimigos.');
