function showToast(message) {

    const container =
        document.getElementById('toastContainer');

    if (!container) return;

    const toast =
        document.createElement('div');

    toast.className = 'toast';

    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {

        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        toast.style.transition = '0.2s';

        setTimeout(() => {

            toast.remove();

        }, 200);

    }, 2500);
}