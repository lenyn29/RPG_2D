let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
});

export function initStartScreen(onStartCallback) {
    const downloadBtn = document.getElementById('downloadBtn');
    const startBtn = document.getElementById('startBtn');

    if (downloadBtn) {
        downloadBtn.addEventListener('click', handleInstallClick);
    }

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            triggerFullscreenAndLandscape();
            
            // Ocultar pantalla de inicio y mostrar canvas
            const startScreen = document.getElementById('startScreen');
            const canvas = document.getElementById('gameCanvas');
            
            if (startScreen) startScreen.style.display = 'none';
            if (canvas) {
                canvas.style.display = 'block';
                window.dispatchEvent(new Event('resize'));
            }

            // Ejecutar la función para arrancar el motor del juego
            if (typeof onStartCallback === 'function') {
                onStartCallback();
            }
        });
    }
}

function handleInstallClick() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('Usuario instaló la PWA');
            }
            deferredPrompt = null;
        });
    } else {
        alert("Para instalar la app, abre el menú de opciones de tu navegador móvil y selecciona 'Agregar a la pantalla principal' o 'Instalar aplicación'.");
    }
}

function triggerFullscreenAndLandscape() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    }

    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch((err) => {
            console.log('Bloqueo de orientación horizontal no soportado o denegado:', err);
        });
    }
}
