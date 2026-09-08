const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const stateSource = fs.readFileSync(path.join(projectRoot, 'js', 'state.js'), 'utf8');
const renderSource = fs.readFileSync(path.join(projectRoot, 'js', 'combat', 'combat-render.js'), 'utf8');
const equipmentCss = fs.readFileSync(path.join(projectRoot, 'equipment.css'), 'utf8');
const enhancementsSource = fs.readFileSync(path.join(projectRoot, 'js', 'enhancements.js'), 'utf8');
const equipmentSource = fs.readFileSync(path.join(projectRoot, 'js', 'equipment.js'), 'utf8');
const itemsSource = fs.readFileSync(path.join(projectRoot, 'js', 'items.js'), 'utf8');
const conditionsSource = fs.readFileSync(path.join(projectRoot, 'js', 'conditions.js'), 'utf8');
const combatEffectsSource = fs.readFileSync(path.join(projectRoot, 'js', 'combat', 'combat-effects.js'), 'utf8');

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
assert.match(equipmentCss, /\.movement-container/);
assert.deepEqual(
    JSON.parse(JSON.stringify(context.getCombatantMovementSummary({ type: 'player', movement: 7 }))),
    { display: '7', title: 'Movimento total: 7' }
);
assert.deepEqual(
    JSON.parse(JSON.stringify(context.getCombatantMovementSummary({
        type: 'monster',
        movement: 6,
        movementLabel: '6 Terrestre\n12 Voando'
    }))),
    { display: '6 / 12 voo', title: 'Movimento: 6 Terrestre 12 Voando' }
);
assert.match(renderSource, /renderCombatantMovementIndicator\(c\)/);
assert.match(renderSource, /getCombatantStatusIcons\(c\)/);
assert.match(enhancementsSource, /function syncCarryingWeightCondition/);
assert.match(enhancementsSource, /systemManaged: 'encumbrance'/);
assert.match(enhancementsSource, /excessWeight: target\.excessWeight/);
assert.match(enhancementsSource, /carriedWeightMode: 'equipped'/);
assert.match(enhancementsSource, /combatPanelsMode: 'all'/);
assert.match(enhancementsSource, /function setCombatPanelsMode/);
assert.match(enhancementsSource, /Painéis dos participantes/);
assert.match(enhancementsSource, /Ao selecionar/);
assert.match(enhancementsSource, /function setCarriedWeightMode/);
assert.match(enhancementsSource, /Todo o inventário/);
assert.match(enhancementsSource, /id="contentWeight"/);
assert.match(equipmentSource, /function getCharacterCarriedWeightBreakdown/);
assert.match(equipmentSource, /function getInventoryWeightBreakdown/);
assert.match(itemsSource, /estimatePredefinedInventoryItemWeight/);
assert.match(conditionsSource, /title: 'Carregando Peso'/);
assert.match(combatEffectsSource, /effect\?\.systemManaged === 'encumbrance'/);

assert.equal(context.getCombatPanelsMode(), 'all', 'O modo padrão deve manter todos os painéis visíveis.');
assert.equal(context.isCombatantDetailsExpanded('12'), true);
vm.runInContext("var appPreferences = { combatPanelsMode: 'selected' };", context);
context.resetExpandedCombatantDetails();
assert.equal(context.isCombatantDetailsExpanded('12'), false, 'No modo compacto todos devem começar recolhidos.');
assert.equal(context.toggleCombatantDetails('12'), true);
assert.equal(context.isCombatantDetailsExpanded('12'), true);
assert.equal(context.toggleCombatantDetails('13'), true);
assert.equal(context.isCombatantDetailsExpanded('12'), false, 'Abrir outro participante deve recolher o anterior.');
assert.equal(context.isCombatantDetailsExpanded('13'), true);
assert.equal(context.toggleCombatantDetails('13'), false, 'Tocar novamente deve recolher o participante atual.');
assert.equal(context.isCombatantDetailsExpanded('13'), false);

console.log('✓ Painel recolhível de efeitos ativos validado para jogadores e inimigos.');
