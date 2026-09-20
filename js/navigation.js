let navigationScreenIndex = 0;

const NAVIGATION_SCREENS = [
    'combatScreen',
    'inventoryScreen',
    'abilitiesScreen'
];

function updateNavigation() {
    const appWrapper = document.getElementById('appWrapper');

    if (!appWrapper) return;

    const activeScreen = NAVIGATION_SCREENS[navigationScreenIndex];
    appWrapper.style.transform = 'none';
    appWrapper.dataset.activeScreen = activeScreen;

    NAVIGATION_SCREENS.forEach(screenId => {
        const screen = document.getElementById(screenId);
        if (!screen) return;

        const isActive = screenId === activeScreen;
        screen.hidden = !isActive;
        screen.inert = !isActive;
        screen.setAttribute('aria-hidden', String(!isActive));
    });

    document.querySelectorAll('[data-screen]').forEach(button => {
        const isActive = button.dataset.screen === activeScreen;
        button.classList.toggle('active', isActive);
        if (isActive) button.setAttribute('aria-current', 'page');
        else button.removeAttribute('aria-current');
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

updateNavigation();
