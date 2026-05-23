function askConcentration(id) {
    concentrationTargetId = id;
    document.getElementById('concentrationModal').style.display = 'flex';
}

function answerConcentration(passed) {
    document.getElementById('concentrationModal').style.display = 'none';
    if (!passed && concentrationTargetId) {
        const index = combatants.findIndex(c => c.id === concentrationTargetId);
        if (index !== -1) {
            combatants[index].statusBrain = false;
            savePlayersToStorage();
            updateCardTargeted(combatants[index]);
        }
    }
    concentrationTargetId = null;
}