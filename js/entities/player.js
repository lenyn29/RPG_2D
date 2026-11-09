import { Iso } from '../engine/isometric.js';

export class Player {
    constructor(startX, startY) {
        this.x = startX; 
        this.y = startY; 
        this.speed = 0.05; 
    }

    update(inputManager) {
        const move = inputManager.getMovementVector();

        if (move.x !== 0 || move.y !== 0) {
            this.x += move.x * this.speed;
            this.y += move.y * this.speed;
        }

        // Límites estrictos del mapa isométrico (0 a 5)
        this.x = Math.max(0, Math.min(4.9, this.x));
        this.y = Math.max(0, Math.min(4.9, this.y));
    }

    draw(ctx, cameraOffsetX, cameraOffsetY) {
        const screen = Iso.toScreen(this.x, this.y);
        const renderX = screen.x + cameraOffsetX;
        const renderY = screen.y + cameraOffsetY;

        // Dibujo del jugador (Esfera neón)
        ctx.fillStyle = '#00F0FF';
        ctx.beginPath();
        ctx.arc(renderX, renderY - 10, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Anillo inferior
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.beginPath();
        ctx.ellipse(renderX, renderY, Iso.tileWidth / 4, Iso.tileHeight / 4, 0, 0, Math.PI * 2);
        ctx.stroke();
    }
}
