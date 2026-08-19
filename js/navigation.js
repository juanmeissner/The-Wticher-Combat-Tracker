let navigationTouchStartX = 0;
let navigationTouchStartY = 0;
let navigationScreenIndex = 0;

const NAVIGATION_SCREENS = [
    'combatScreen',
    'inventoryScreen',
    'abilitiesScreen'
];

function isModalVisible() {
    return Array.from(
        document.querySelectorAll('.modal, [id$="Modal"], #circularMenu')
    ).some(element => {
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden';
    });
}

function updateNavigation() {
    const appWrapper = document.getElementById('appWrapper');

    if (!appWrapper) return;

    appWrapper.style.transform =
        `translateX(-${navigationScreenIndex * 100}vw)`;

    const activeScreen = NAVIGATION_SCREENS[navigationScreenIndex];

    document.querySelectorAll('[data-screen]').forEach(button => {
        button.classList.toggle(
            'active',
            button.dataset.screen === activeScreen
        );
    });
}

function showSection(sectionId) {
    const screenIndex = NAVIGATION_SCREENS.indexOf(sectionId);

    if (screenIndex === -1) return;

    if (sectionId === 'inventoryScreen' || sectionId === 'abilitiesScreen') {
        window.ensureActiveTurnCharacterCollectionContext?.();
    }

    navigationScreenIndex = screenIndex;
    updateNavigation();
}

document.addEventListener('touchstart', event => {
    if (event.touches.length !== 1 || isModalVisible()) return;

    navigationTouchStartX = event.touches[0].clientX;
    navigationTouchStartY = event.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', event => {
    if (!navigationTouchStartX || isModalVisible()) return;

    const touch = event.changedTouches[0];
    const distanceX = navigationTouchStartX - touch.clientX;
    const distanceY = navigationTouchStartY - touch.clientY;

    navigationTouchStartX = 0;

    if (Math.abs(distanceY) > 60 || Math.abs(distanceX) < 80) return;

    if (distanceX > 0) {
        navigationScreenIndex = Math.min(
            navigationScreenIndex + 1,
            NAVIGATION_SCREENS.length - 1
        );
    } else {
        navigationScreenIndex = Math.max(navigationScreenIndex - 1, 0);
    }

    const destinationScreen = NAVIGATION_SCREENS[navigationScreenIndex];
    if (destinationScreen === 'inventoryScreen' || destinationScreen === 'abilitiesScreen') {
        window.ensureActiveTurnCharacterCollectionContext?.();
    }

    updateNavigation();
}, { passive: true });

window.showSection = showSection;
