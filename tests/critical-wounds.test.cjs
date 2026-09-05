const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(projectRoot, 'js', 'critical-wounds.js'), 'utf8');
const indexSource = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
const serviceWorkerSource = fs.readFileSync(
    path.join(projectRoot, 'js', 'service-worker.js'),
    'utf8'
);
const sessionFeaturesSource = fs.readFileSync(
    path.join(projectRoot, 'js', 'session-features.js'),
    'utf8'
);
const skillTestsSource = fs.readFileSync(
    path.join(projectRoot, 'js', 'character-skill-tests.js'),
    'utf8'
);
const enhancementsSource = fs.readFileSync(path.join(projectRoot, 'js', 'enhancements.js'), 'utf8');
const combatSource = fs.readFileSync(path.join(projectRoot, 'js', 'combat', 'combat.js'), 'utf8');
const damageModalSource = fs.readFileSync(
    path.join(projectRoot, 'js', 'combat', 'damage-modal.js'),
    'utf8'
);

const context = vm.createContext({
    console,
    conditionDescriptions: {
        '🩸': { title: 'Sangrando', active: 0, stack: 10, augment: 'debuff' },
        '🐍': { title: 'Envenenado', active: 0, stack: 10, augment: 'debuff' },
        '💫': { title: 'Atordoado', active: 0, stack: 1, augment: 'debuff' }
    },
    combatants: [],
    savePlayersToStorage() {},
    renderList() {},
    showToast() {}
});
context.window = context;
context.characterSheetModel = {
    getCharacterAttributeTotal() { return 16; },
    getCharacterAttributeModifier() { return 3; }
};
context.trackCombatAction = (_label, callback) => callback();

vm.runInContext(source, context, { filename: 'critical-wounds.js' });

assert.equal(context.CRITICAL_SEVERITIES.length, 4);
assert.equal(context.CRITICAL_WOUNDS.length, 24);
assert.equal(Object.keys(context.COMBAT_ROLL_OUTCOME_TABLES).length, 6);

assert.equal(context.getCombatRollOutcomeContext('fencing', 1).tableId, 'meleeAttackFumble');
assert.equal(context.getCombatRollOutcomeContext('archery', 1).tableId, 'rangedAttackFumble');
assert.equal(context.getCombatRollOutcomeContext('fencing', 20).kind, 'attack-critical');
assert.equal(context.getCombatRollOutcomeContext('archery', 20).group, 'rangedAttack');
assert.equal(context.getCombatRollOutcomeContext('block', 20).tableId, 'blockCritical');
assert.equal(context.getCombatRollOutcomeContext('reflex_dodge', 20).tableId, 'dodgeCritical');
assert.equal(context.getCombatRollOutcomeContext('athletics', 20), null);
assert.equal(context.getCombatRollOutcome('dodgeFumble', 10).title, 'Impacto letal');

const blockDisarm = context.getCombatRollOutcome('blockCritical', 8);
assert.equal(blockDisarm.disarm, true);
assert.equal(blockDisarm.extraDice, '1d6');

const blockFumbleDisarm = context.getCombatRollOutcome('blockFumble', 7);
assert.equal(blockFumbleDisarm.disarm, true);
assert.equal(blockFumbleDisarm.target, 'self');

const blockDominance = context.getCombatRollOutcome('blockCritical', 10);
assert.equal(blockDominance.disarm, true);
assert.equal(blockDominance.incidentTarget, 'actor');

const dodgeLostReaction = context.getCombatRollOutcome('dodgeCritical', 8);
assert.equal(dodgeLostReaction.choices.length, 2);
assert.equal(dodgeLostReaction.choices[0].condition, '⚖️');
assert.match(dodgeLostReaction.choices[1].incident, /próxima reação/i);

const dodgeImpact = context.getCombatRollOutcome('dodgeCritical', 9);
assert.equal(dodgeImpact.choices.length, 2);
assert.equal(dodgeImpact.choices[1].extraDice, '1d6');
assert.equal(dodgeImpact.choices[1].targetDamage, true);

assert.equal(context.getCriticalSeverity(6), null);
assert.equal(context.getCriticalSeverity(7).name, 'Simples');
assert.equal(context.getCriticalSeverity(9).name, 'Simples');
assert.equal(context.getCriticalSeverity(10).name, 'Complicado');
assert.equal(context.getCriticalSeverity(13).name, 'Difícil');
assert.equal(context.getCriticalSeverity(15).name, 'Mortal');
assert.equal(context.getCriticalSeverity(99).name, 'Mortal');

['simple', 'complicated', 'difficult', 'deadly'].forEach(severity => {
    assert.equal(context.getCriticalWoundsFor(severity, 'head').length, 2);
    assert.equal(context.getCriticalWoundsFor(severity, 'torso').length, 2);
    assert.equal(context.getCriticalWoundsFor(severity, 'arm').length, 1);
    assert.equal(context.getCriticalWoundsFor(severity, 'leg').length, 1);
});

assert.deepEqual(
    JSON.parse(JSON.stringify(context.calculateCriticalDamage(20, 'head', 15))),
    {
        baseDamage: 20,
        doubledDamage: 40,
        bodyMultiplier: 3,
        localizedDamage: 120,
        woundBonus: 10,
        finalDamage: 130
    }
);
assert.equal(context.calculateCriticalDamage(15, 'arm', 7).finalDamage, 18);

const woundedHead = {
    criticalWounds: [{ woundId: 'difficult-skull-fracture', state: 'treated' }]
};
assert.equal(context.getCriticalBodyMultiplier(woundedHead, 'head'), 4);
assert.equal(context.getCriticalBodyMultiplier(woundedHead, 'torso'), 1);
assert.equal(
    context.getCriticalWoundSkillModifier(
        { criticalWounds: [{ woundId: 'difficult-torn-stomach', state: 'normal' }] },
        { id: 'athletics', attributeId: 'dexterity' },
        false
    ).total,
    -2
);
assert.equal(
    context.getCriticalWoundSkillModifier(
        { criticalWounds: [{ woundId: 'difficult-open-leg-fracture', state: 'normal' }] },
        { id: 'athletics', attributeId: 'dexterity' },
        false,
        12
    ).total,
    -9
);

const derivedWithHeartDamage = context.applyCriticalWoundDerivedModifiers(
    { criticalWounds: [{ woundId: 'deadly-heart-damage', state: 'normal' }] },
    { stMaximum: 80, movement: 12, carryingCapacity: 30 }
);
assert.equal(derivedWithHeartDamage.stMaximum, 20);
assert.equal(derivedWithHeartDamage.movement, 3);
assert.equal(derivedWithHeartDamage.carryingCapacity, 30);
const derivedWithTwistedLeg = context.applyCriticalWoundDerivedModifiers(
    { criticalWounds: [{ woundId: 'simple-twisted-leg', state: 'stabilized' }] },
    { stMaximum: 30, movement: 12, carryingCapacity: 20 }
);
assert.equal(derivedWithTwistedLeg.movement, 9);
const derivedWithFracturedLeg = context.applyCriticalWoundDerivedModifiers(
    { criticalWounds: [{ woundId: 'complicated-fractured-leg', state: 'normal' }] },
    { stMaximum: 30, movement: 12, carryingCapacity: 20 }
);
assert.equal(derivedWithFracturedLeg.movement, 9);
assert.equal(
    context.getCriticalWoundSkillModifier(
        { criticalWounds: [{ woundId: 'simple-cracked-ribs', state: 'normal' }] },
        { id: 'physique', attributeId: 'strength' },
        false
    ).total,
    -2
);
assert.equal(
    context.getCriticalWoundSkillModifier(
        { criticalWounds: [{ woundId: 'difficult-concussion', state: 'normal' }] },
        { id: 'reflex_dodge', attributeId: 'dexterity' },
        false
    ).total,
    -4
);
assert.equal(
    context.getCriticalWoundSkillModifier(
        {
            attributes: { constitution: { invested: 6 } },
            criticalWounds: [{ woundId: 'deadly-heart-damage', state: 'normal' }]
        },
        { id: 'physique', attributeId: 'constitution' },
        false,
        7,
        { attributeModifier: 3 }
    ).total,
    -3
);
assert.equal(
    context.hasUnusableArmFromCriticalWound({
        criticalWounds: [{ woundId: 'deadly-severed-arm', state: 'treated' }]
    }),
    true
);
assert.deepEqual(
    JSON.parse(JSON.stringify(context.getCriticalWoundBlockedEquipmentSlots({
        criticalWounds: [
            { woundId: 'deadly-severed-arm', state: 'normal' },
            { woundId: 'deadly-severed-leg', state: 'stabilized' }
        ]
    }))).sort(),
    ['arms', 'legs']
);
assert.match(
    context.getCriticalEquipmentSlotRestriction({
        name: 'Geralt',
        criticalWounds: [{ woundId: 'deadly-severed-arm', state: 'treated' }]
    }, 'arms'),
    /amputação sem prótese/i
);
assert.equal(
    context.getCriticalWoundBlockedEquipmentSlots({
        criticalWounds: [{ woundId: 'deadly-severed-arm', state: 'cured' }]
    }).length,
    0
);

assert.deepEqual(
    JSON.parse(JSON.stringify(context.calculateCriticalTreatmentTest({
        naturalRoll: 12,
        skillTotal: 5,
        modifier: 1,
        difficulty: 16
    }))),
    {
        valid: true,
        naturalRoll: 12,
        skillTotal: 5,
        modifier: 1,
        difficulty: 16,
        finalResult: 18,
        margin: 2,
        success: true,
        critical: false
    }
);
assert.equal(context.calculateCriticalTreatmentTest({
    naturalRoll: 4,
    skillTotal: 3,
    difficulty: 15
}).success, false);
assert.equal(context.calculateCriticalTreatmentTest({
    naturalRoll: 20,
    skillTotal: 0,
    difficulty: 20
}).critical, true);

context.campaignClock = {
    describeMinute: () => ({ epochMinute: 5000 }),
    formatDuration: minutes => `${minutes} minutos`
};
const recoveringTarget = {
    id: 'recovering', name: 'Paciente', type: 'player', stMax: 20, stCurrent: 20,
    movement: 8, carryingCapacity: 10, criticalWounds: []
};
const recoveringWound = {
    instanceId: 'recovery-1', woundId: 'simple-cracked-ribs', state: 'treated', treatment: {}
};
recoveringTarget.criticalWounds.push(recoveringWound);
const scheduledRecovery = context.scheduleCriticalWoundRecovery(recoveringWound, 2, 'days');
assert.equal(scheduledRecovery.startedAtMinute, 5000);
assert.equal(scheduledRecovery.completesAtMinute, 7880);
assert.equal(context.getCriticalWoundRecoveries([recoveringTarget], 7880, 5000).length, 1);
const completedRecovery = context.completeCriticalWoundRecovery(recoveringTarget, recoveringWound, 7880);
assert.equal(completedRecovery.woundName, 'Costelas Trincadas');
assert.equal(recoveringWound.state, 'cured');
assert.equal(recoveringWound.treatment.recovery.status, 'completed');

const quickWounded = {
    creationMode: 'quick',
    stMax: 80,
    stCurrent: 60,
    movement: 12,
    carryingCapacity: 30,
    criticalWounds: [{ woundId: 'deadly-heart-damage', state: 'normal' }]
};
context.syncCriticalWoundResourceLimits(quickWounded);
assert.equal(quickWounded.stMax, 20);
assert.equal(quickWounded.stCurrent, 20);
assert.equal(quickWounded.movement, 3);
quickWounded.criticalWounds[0].state = 'treated';
context.syncCriticalWoundResourceLimits(quickWounded);
assert.equal(quickWounded.stMax, 80);
assert.equal(quickWounded.movement, 12);

const spleenCheck = {
    criticalWounds: [{
        woundId: 'complicated-ruptured-spleen',
        state: 'normal',
        check: { kind: 'stun-resistance', elapsedTurns: 4, interval: 5 }
    }]
};
assert.equal(context.processCriticalWoundTurnChecks(spleenCheck).length, 1);
assert.match(context.processCriticalWoundTurnChecks({
    criticalWounds: [{ woundId: 'difficult-hole-in-chest', state: 'normal' }]
})[0].summary, /Sufocamento/);
assert.equal(
    context.getCriticalWoundSkillModifier(
        { criticalWounds: [{ woundId: 'simple-cracked-jaw', state: 'normal' }] },
        { id: 'spellcasting', attributeId: 'intelligence' },
        false
    ).total,
    -2
);

const sourceCombatant = {
    id: 'geralt',
    name: 'Geralt',
    type: 'player',
    progression: { adrenaline: 2 }
};
const target = {
    id: 'griffin',
    name: 'Grifo',
    type: 'monster',
    hpCurrent: 80,
    hpMax: 80,
    effects: [],
    criticalWounds: []
};
context.combatants.push(sourceCombatant, target);

const preparedResult = context.syncPreparedAttackCriticalFromSkillTest(
    sourceCombatant,
    { id: 'fencing', name: 'Esgrima' },
    { naturalRoll: 20, success: true, margin: 8, target: 18, finalResult: 26 }
);
assert.equal(preparedResult.status, 'prepared');
assert.equal(preparedResult.prepared.margin, 8);
assert.equal(preparedResult.prepared.group, 'meleeAttack');
assert.equal(context.getPreparedAttackCritical(sourceCombatant).skillName, 'Esgrima');

const clearedPreparedResult = context.syncPreparedAttackCriticalFromSkillTest(
    sourceCombatant,
    { id: 'fencing', name: 'Esgrima' },
    { naturalRoll: 12, success: true, margin: 3, target: 18, finalResult: 21 }
);
assert.equal(clearedPreparedResult.status, 'cleared');
assert.equal(context.getPreparedAttackCritical(sourceCombatant), null);

const failedNaturalTwenty = context.syncPreparedAttackCriticalFromSkillTest(
    sourceCombatant,
    { id: 'fencing', name: 'Esgrima' },
    { naturalRoll: 20, success: false, margin: -2, target: 30, finalResult: 28 }
);
assert.equal(failedNaturalTwenty.status, 'unchanged');
assert.equal(context.getPreparedAttackCritical(sourceCombatant), null);

const critical = {
    sourceId: sourceCombatant.id,
    margin: 13,
    woundId: 'difficult-open-arm-fracture'
};
context.applyCriticalDamageBefore(target, critical);

assert.equal(sourceCombatant.progression.adrenaline, 3);
assert.equal(target.criticalWounds.length, 1);
assert.equal(target.criticalWounds[0].state, 'normal');
assert.equal(target.effects.length, 1);
assert.equal(target.effects[0].id, '🩸');
assert.equal(target.effects[0].stacks, 1);

const preparedSource = {
    id: 'milva',
    name: 'Milva',
    type: 'player',
    progression: { adrenaline: 4 },
    preparedCriticalAttack: {
        id: 'prepared-critical-test',
        sourceId: 'milva',
        skillId: 'archery',
        skillName: 'Arco e Flecha',
        group: 'rangedAttack',
        margin: 5,
        adrenalineAlreadyGranted: true,
        adrenalineBefore: 3,
        adrenalineAfter: 4
    }
};
context.combatants.push(preparedSource);
const carriedCritical = {
    sourceId: preparedSource.id,
    margin: 5,
    woundId: '',
    preparedCriticalId: 'prepared-critical-test',
    preparedFromNatural20: true,
    preparedSkillName: 'Arco e Flecha',
    adrenalineAlreadyGranted: true,
    adrenalineBefore: 3,
    adrenalineAfter: 4
};
context.applyCriticalDamageBefore(target, carriedCritical);
assert.equal(preparedSource.progression.adrenaline, 4);
assert.equal(carriedCritical.adrenalineReused, true);
assert.equal(carriedCritical.preparedCriticalConsumed, true);
assert.equal(context.getPreparedAttackCritical(preparedSource), null);

context.setCriticalWoundState(
    target.id,
    target.criticalWounds[0].instanceId,
    'stabilized'
);
assert.equal(target.criticalWounds[0].state, 'stabilized');
assert.equal(target.effects.some(effect => effect.id === '🩸'), false);

const restoredTarget = {
    effects: [],
    criticalWounds: [{
        instanceId: 'stored-wound',
        woundId: 'difficult-open-leg-fracture',
        state: 'normal'
    }]
};
context.restoreCriticalWoundConditions(restoredTarget);
assert.equal(restoredTarget.effects[0].id, '🩸');

const doomedPlayer = {
    id: 'doomed',
    name: 'Condenado',
    type: 'player',
    hpCurrent: 50,
    hpMax: 50,
    effects: [],
    deathSaves: { success: 0, failures: 0 }
};
context.combatants.push(doomedPlayer);
const lethalCritical = {
    sourceId: sourceCombatant.id,
    margin: 15,
    woundId: 'deadly-broken-spine'
};
context.applyCriticalDamageBefore(doomedPlayer, lethalCritical);
context.applyCriticalDamageAfter(doomedPlayer, lethalCritical);
assert.equal(doomedPlayer.hpCurrent, 0);
assert.equal(doomedPlayer.deathSaves.failures, 3);
assert.equal(lethalCritical.deathApplied, true);

assert.match(indexSource, /💥 Dano Crítico/);
assert.match(indexSource, /id="criticalDamageModal"/);
assert.ok(
    indexSource.indexOf('js/equipment.js') < indexSource.indexOf('js/critical-wounds.js'),
    'O sistema de ferimentos deve ser carregado após os equipamentos.'
);
assert.match(serviceWorkerSource, /\.\/critical-wounds\.css/);
assert.match(serviceWorkerSource, /\.\/js\/critical-wounds\.js/);
assert.match(sessionFeaturesSource, /applyCriticalWoundRecurringEffects/);
assert.match(sessionFeaturesSource, /difficult-torn-stomach/);
assert.match(skillTestsSource, /getCriticalWoundSkillModifier/);
assert.match(skillTestsSource, /openCombatRollOutcomeFlow/);
assert.match(skillTestsSource, /syncPreparedAttackCriticalFromSkillTest/);
assert.match(sessionFeaturesSource, /session-critical-ready/);
assert.match(damageModalSource, /openPreparedCriticalDamageFlow/);
assert.match(enhancementsSource, /criticalWounds/);
assert.match(combatSource, /restoreCriticalWoundConditions/);

console.log('critical-wounds.test.cjs: ok');
