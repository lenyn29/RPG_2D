export class ScreenManager {
    constructor() {
        // Ya no bloqueamos la orientación ni exigimos avisos molestos.
        // El canvas se ajustará dinámicamente al tamaño actual del navegador.
    }

    // Método vacío para compatibilidad con el bucle, sin interrumpir la partida
    drawOrientationWarning(ctx, canvasWidth, canvasHeight) {
        return false; 
    }
}
