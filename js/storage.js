function savePlayersToStorage() {

    localStorage.setItem(
        'dnd_players',
        JSON.stringify(combatants)
    );
    }