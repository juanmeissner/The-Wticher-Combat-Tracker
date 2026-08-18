window.addEventListener('load', () => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
        .register('service-worker.js')
        .catch(error => console.error('Não foi possível ativar o modo offline.', error));
});
