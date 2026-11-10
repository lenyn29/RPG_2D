import { GameEngine } from './gameLoop.js';

let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
});

export class LobbyManager {
    constructor() {
        this.init();
    }

    init() {
        // Asegurarnos de que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.buildLobby());
        } else {
            this.buildLobby();
        }
    }

    buildLobby() {
        if (document.getElementById('startScreen')) return;

        // 1. Crear el contenedor principal del Lobby
        const startScreen = document.createElement('div');
        startScreen.id = 'startScreen';

        // Estilos incrustados exclusivamente para el Lobby generado por JS (respeta el style.css existente)
        startScreen.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: linear-gradient(135deg, #0b0f19 0%, #1e1b4b 50%, #0f172a 100%);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            z-index: 9999;
            font-family: sans-serif;
            box-sizing: border-box;
            user-select: none;
        `;

        startScreen.innerHTML = `
            <div style="width: 100%; display: flex; justify-content: flex-end; align-items: center;">
                <button id="lobbyDownloadBtn" style="background: rgba(56, 189, 248, 0.15); border: 1px solid #38bdf8; color: #38bdf8; padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(56, 189, 248, 0.2);">
                    📥 Instalar App
                </button>
            </div>
            
            <div style="max-width: 580px; text-align: center; color: #f8fafc; padding: 0 10px;">
                <h1 style="font-size: 26px; color: #38bdf8; margin-bottom: 12px; text-shadow: 0 2px 10px rgba(56, 189, 248, 0.4); letter-spacing: 1px;">SHANGRI-LA FRONTIER</h1>
                <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 28px;">
                    Adéntrate en vastos territorios inexplorados. Un mundo procedural repleto de misterios ancestrales, 
                    majestuosos Santuarios de Piedra hexagonal y criaturas implacables. Domina tus habilidades táctiles, 
                    sube de nivel y forja tu leyenda en esta experiencia de acción definitiva.
                </p>
                <button id="lobbyStartBtn" style="background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%); color: white; border: none; padding: 15px 36px; font-size: 17px; font-weight: bold; border-radius: 12px; cursor: pointer; box-shadow: 0 6px 20px rgba(37, 99, 235, 0.5);">
                    ✨ INICIAR AVENTURA
                </button>
            </div>

            <div style="font-size: 11px; color: #64748b; margin-bottom: 5px;">Optimizada para Android PWA • Motor Isométrico DeltaTime</div>
        `;

        document.body.appendChild(startScreen);

        // 2. Ocultar el canvas inicialmente hasta que pulse el botón
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.style.display = 'none';
        }

        // 3. Enlazar eventos de los botones
        document.getElementById('lobbyDownloadBtn').addEventListener('click', () => this.handleInstall());
        document.getElementById('lobbyStartBtn').addEventListener('click', () => this.startAdventure(startScreen));
    }

    handleInstall() {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                deferredPrompt = null;
            });
        } else {
            alert("Para instalar la app, abre el menú de opciones de tu navegador móvil y selecciona 'Agregar a la pantalla principal' o 'Instalar aplicación'.");
        }
    }

    startAdventure(startScreenElement) {
        // Solicitar Pantalla Completa y Bloqueo Horizontal (requiere gesto táctil del usuario)
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(() => {});
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        }

        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(() => {});
        }

        // Desvanecer / Ocultar Lobby
        if (startScreenElement) {
            startScreenElement.remove(); // Elimina el DOM del lobby por completo
        }

        // Mostrar Canvas y encender el motor del juego
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.style.display = 'block';
            window.dispatchEvent(new Event('resize'));
        }

        // ⚡ Arrancar el motor isométrico del juego
        new GameEngine();
    }
}

// Auto-inicializar el gestor de lobby al cargar
new LobbyManager();
