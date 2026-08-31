(function initializeZoomLock() {
    const preventZoom = event => event.preventDefault();

    ['gesturestart', 'gesturechange', 'gestureend'].forEach(eventName => {
        document.addEventListener(eventName, preventZoom, { passive: false });
    });

    document.addEventListener('touchmove', event => {
        if (event.touches.length > 1) preventZoom(event);
    }, { passive: false });

    document.addEventListener('dblclick', preventZoom, { passive: false });

    document.addEventListener('wheel', event => {
        if (event.ctrlKey || event.metaKey) preventZoom(event);
    }, { passive: false });

    document.addEventListener('keydown', event => {
        if (!event.ctrlKey && !event.metaKey) return;

        if (['+', '-', '=', '0'].includes(event.key)) preventZoom(event);
    });
})();
