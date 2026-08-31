let combatants = [];
let activeTurnId = null; 
let selectedId = null;
let expandedEffectPanelIds = new Set();
let round = 1;
let monsterCounter = 1;
let playerCounter = 1;
let currentInput = "0";
let selectedEffect = {

    combatantId: null,

    effectId: null,

    type: null

};
let lastMonsterData = {
hp: "",
st: "",
ca: "",
movement: 5,
atk: "",
armor: {
head: 0,
torso: 0,
arm: 0,
leg: 0
}
};

let lastPlayerData = {
hp: "",
st: "",
ca: "",
movement: 5,
atk: "",
armor: {
head: 0,
torso: 0,
arm: 0,
leg: 0
}
};
