// =========================================
// SWIPE ENTRE TELAS
// =========================================

let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', e => {

    touchStartX =
        e.changedTouches[0].screenX;
});

document.addEventListener('touchend', e => {

    touchEndX =
        e.changedTouches[0].screenX;

    handleSwipe();
});

function isAnyModalOpen() {

    // =====================================
    // INVENTÁRIO
    // =====================================

    const inventoryModalOpen =
        !document
            .getElementById('inventoryModal')
            ?.classList.contains('hidden');

    const itemDetailsModalOpen =
        !document
            .getElementById('itemDetailsModal')
            ?.classList.contains('hidden');

    // =====================================
    // MONSTROS / COMBATE
    // =====================================

    const monsterChoiceOpen =
        document
            .getElementById('monsterChoiceModal')
            ?.style.display === 'flex';

    const monsterDetailsOpen =
        document
            .getElementById('monsterDetailsModal')
            ?.style.display === 'flex';

    const presetMonsterOpen =
        document
            .getElementById('presetMonsterModal')
            ?.style.display === 'flex';

    // =====================================
    // RESULTADO
    // =====================================

    return (
        inventoryModalOpen ||
        itemDetailsModalOpen ||
        monsterChoiceOpen ||
        monsterDetailsOpen ||
        presetMonsterOpen
    );
}

function handleSwipe() {

    // BLOQUEIA SWIPE COM MODAL ABERTO
    if (isAnyModalOpen()) return;

    const distance =
        touchStartX - touchEndX;

    // esquerda
    if (distance > 80) {

        showInventoryScreen();
    }

    // direita
    if (distance < -80) {

        showCombatScreen();
    }
}

function showInventoryScreen() {

    document.getElementById('appWrapper')
        .style.transform =
            'translateX(-100vw)';
}

function showCombatScreen() {

    document.getElementById('appWrapper')
        .style.transform =
            'translateX(0)';
}