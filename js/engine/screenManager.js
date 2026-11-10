export class ScreenManager {
    constructor() {
        // Inicializador optimizado para PWA en Android / iOS.
        // Se encarga de mantener el flujo sin interrumpir la ejecución del canvas.
    }

    drawOrientationWarning(ctx, canvasWidth, canvasHeight) {
        // Desactivado para permitir ejecución inmediata en cualquier orientación y tamaño.
        return false;
    }
}
