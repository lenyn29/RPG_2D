export class ScreenManager {
    constructor() {
        this.isPortrait = false;
        this.fullscreenBtn = null;
        this.setupOrientationCheck();
        this.setupFullscreenUI();
    }

    setupOrientationCheck() {
        const checkOrientation = () => {
            // Detectar si el ancho es menor que el alto (modo vertical)
            this.isPortrait = window.innerHeight > window.innerWidth;
        };

        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', checkOrientation);
        checkOrientation();
    }

    setupFullscreenUI() {
        // Crear un botón flotante estético para activar pantalla completa en móviles
        this.fullscreenBtn = document.createElement('button');
        this.fullscreenBtn.innerHTML = '⛶ Pantalla Completa';
        this.fullscreenBtn.style.position = 'fixed';
        this.fullscreenBtn.style.top = '10px';
        this.fullscreenBtn.style.right = '10px';
        this.fullscreenBtn.style.zIndex = '99999';
        this.fullscreenBtn.style.padding = '8px 12px';
        this.fullscreenBtn.style.background = 'rgba(0, 0, 0, 0.7)';
        this.fullscreenBtn.style.color = '#FFFFFF';
        this.fullscreenBtn.style.border = '1px solid rgba(255, 255, 255, 0.3)';
        this.fullscreenBtn.style.borderRadius = '6px';
        this.fullscreenBtn.style.fontSize = '12px';
        this.fullscreenBtn.style.fontFamily = 'sans-serif';
        this.fullscreenBtn.style.cursor = 'pointer';

        this.fullscreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.warn("Error al intentar activar pantalla completa:", err);
                });
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
        });

        document.body.appendChild(this.fullscreenBtn);
    }

    drawOrientationWarning(ctx, canvasWidth, canvasHeight) {
        if (!this.isPortrait) return false;

        ctx.save();
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📱 GIRA TU DISPOSITIVO', canvasWidth / 2, canvasHeight / 2 - 20);

        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Este juego está diseñado exclusivamente en horizontal.', canvasWidth / 2, canvasHeight / 2 + 20);
        ctx.restore();

        return true; // Indica que se está mostrando la advertencia y debe pausar la lógica
    }
}
