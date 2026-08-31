let navigationScreenIndex = 0;

const NAVIGATION_SCREENS = [
    'combatScreen',
    'inventoryScreen',
    'abilitiesScreen'
];

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

window.showSection = showSection;
