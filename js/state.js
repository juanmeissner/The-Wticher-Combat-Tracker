let combatants = [];
let activeTurnId = null; 
let selectedId = null;
let round = 1;
let monsterCounter = 1;
let playerCounter = 1;
let currentInput = "0";
let lastMonsterData = {
hp: "",
st: "",
ca: "",
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
atk: "",
armor: {
head: 0,
torso: 0,
arm: 0,
leg: 0
}
};