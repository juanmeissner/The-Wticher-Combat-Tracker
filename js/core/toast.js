function positionToastContainer(container) {
    if (!container) return;

    const combatTabActive = Boolean(
        document.querySelector('[data-screen="combatScreen"].active')
    );
    const controls = document.getElementById('combatControls');
    const root = document.documentElement;

    if (combatTabActive && controls) {
        const controlsRect = controls.getBoundingClientRect();
        const bottomOffset = Math.max(
            12,
            window.innerHeight - Math.min(window.innerHeight, controlsRect.top) + 12
        );

        root.style.setProperty('--toast-bottom-offset', `${bottomOffset}px`);
        return;
    }

    root.style.removeProperty('--toast-bottom-offset');
}

function showToast(message) {

    const container =
        document.getElementById('toastContainer');

    if (!container) return;

    positionToastContainer(container);

    const visibleToasts = container.querySelectorAll('.toast');
    if (visibleToasts.length >= 3) {
        visibleToasts[0].remove();
    }

    const toast =
        document.createElement('div');

    toast.className = 'toast';

    toast.setAttribute('role', 'status');

    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {

        toast.style.opacity = '0';
        toast.style.transform = 'translateY(12px)';
        toast.style.transition = '0.2s';

        setTimeout(() => {

            toast.remove();

        }, 200);

    }, 2500);
}

window.addEventListener('resize', () => {
    const container = document.getElementById('toastContainer');
    if (container?.childElementCount) positionToastContainer(container);
}, { passive: true });
