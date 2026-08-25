function savePlayersToStorage() {
    const session = {
        version: 3,
        combatants,
        activeTurnId,
        selectedId,
        round,
        monsterCounter,
        playerCounter
    };

    localStorage.setItem('dnd_combat_session', JSON.stringify(session));
    localStorage.setItem('dnd_players', JSON.stringify(combatants));
    localStorage.setItem('dnd_monsterCounter', String(monsterCounter));
    localStorage.setItem('dnd_playerCounter', String(playerCounter));
}

window.savePlayersToStorage = savePlayersToStorage;
