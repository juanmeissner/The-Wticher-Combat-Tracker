// =========================================
// SWIPE ENTRE TELAS
// =========================================

let touchStartX = 0;
let touchEndX = 0;

let currentScreenIndex = 0;

const TOTAL_SCREENS = 3;

// =========================================
// TOUCH
// =========================================

document.addEventListener('touchstart', e => {

    touchStartX =
        e.changedTouches[0].screenX;
});

document.addEventListener('touchend', e => {

    touchEndX =
        e.changedTouches[0].screenX;

    handleSwipe();
});

// =========================================
// MODAIS
// =========================================

function isAnyModalOpen() {

    return document.querySelector('.modal-open');
}

// =========================================
// SWIPE
// =========================================

function handleSwipe() {

    if (isAnyModalOpen()) return;

    const distance =
        touchStartX - touchEndX;

    // esquerda
    if (distance > 80) {

        nextScreen();
    }

    // direita
    if (distance < -80) {

        previousScreen();
    }
}

// =========================================
// NAVEGAÇÃO
// =========================================

function nextScreen() {

    if (currentScreenIndex >= TOTAL_SCREENS - 1)
        return;

    currentScreenIndex++;

    updateScreenPosition();
}

function previousScreen() {

    if (currentScreenIndex <= 0)
        return;

    currentScreenIndex--;

    updateScreenPosition();
}

function updateScreenPosition() {

    document.getElementById('appWrapper')
        .style.transform =
            `translateX(-${currentScreenIndex * 100}vw)`;
}