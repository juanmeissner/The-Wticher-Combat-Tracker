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

function handleSwipe() {

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