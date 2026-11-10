import { GameEngine } from './gameLoop.js';

let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
});

// Inyectar dinámicamente la pantalla de inicio al cargar el documento
document.addEventListener('DOMContentLoaded', () => {
    buildStartScreenDOM();
});

function buildStartScreenDOM() {
    if (document.getElementById('startScreen')) return;

    const startScreen = document.createElement('div');
    startScreen.id = 'startScreen';
    startScreen.innerHTML = `
        <div class="top-bar">
            <button class="btn-download" id="downloadBtn">📥 Instalar App</button>
        </div>
        <div class="content-box">
            <h1>SHANGRI-LA FRONTIER</h1>
            <p>
                Adéntrate en vastos territorios inexplorados. Un mundo procedural repleto de misterios ancestrales, 
                majestuosos Santuarios de Piedra hexagonal y criaturas implacables. Domina tus habilidades táctiles, 
                sube de nivel y forja tu leyenda en esta experiencia de acción definitiva.
            </p>
            <button class="btn-start" id="startBtn">✨ INICIAR AVENTURA</button>
        </div>
        <div class="footer-note">Optimizada para Android PWA • Motor Isométrico DeltaTime</div>
    `;

    document.body.appendChild(startScreen);

    // Enlazar eventos
    document.getElementById('downloadBtn').addEventListener('click', handleInstallClick);
    document.getElementById('startBtn').addEventListener('click', () => {
        triggerFullscreenAndLandscape();

        // Ocultar lobby, mostrar canvas y arrancar el motor
        startScreen.style.display = 'none';
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.style.display = 'block';
            window.dispatchEvent(new Event('resize'));
        }

        // Arrancar el motor del juego
        new GameEngine();
    });
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
