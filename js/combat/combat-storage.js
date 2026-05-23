function savePlayersToStorage() {

    localStorage.setItem(
        'dnd_players',
        JSON.stringify(combatants)
    );

    localStorage.setItem(
        'dnd_monsterCounter',
        monsterCounter
    );

    localStorage.setItem(
        'dnd_playerCounter',
        playerCounter
    );
    }

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('js/sw.js')
                .then(() => console.log('Service Worker Registado!'))
                .catch((err) => console.log('Erro no registo do Service Worker:', err));
        });
    }

    window.savePlayersToStorage = savePlayersToStorage;