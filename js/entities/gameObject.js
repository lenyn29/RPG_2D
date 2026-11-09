import { Iso } from '../engine/isometric.js';

export class GameObject {
    constructor(tileX, tileY, type = 'rock_ore') {
        this.x = tileX;
        this.y = tileY;
        this.type = type; // 'rock_ore' o 'tree'
        
        // Radio de colisión adaptado al tipo de objeto
        this.radius = type === 'tree' ? 0.6 : 0.55; 
        
        // Desfase único para que cada árbol se mueva con el viento de forma independiente
        this.windOffset = tileX * 12.34 + tileY * 56.78;
    }

    draw(ctx, cameraOffsetX, cameraOffsetY, timestamp = 0) {
        const screen = Iso.toScreen(this.x, this.y);
        const renderX = screen.x + cameraOffsetX;
        const renderY = screen.y + cameraOffsetY;

        // 1. Sombra volumétrica en el suelo
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(renderX, renderY + 4, Iso.tileWidth / 2.2, Iso.tileHeight / 3.2, 0, 0, Math.PI * 2);
        ctx.fill();

        if (this.type === 'rock_ore') {
            // --- MENA DE PIEDRA / ROCA SÓLIDA ---
            // Base principal de la roca
            ctx.fillStyle = '#334155';
            ctx.beginPath();
            ctx.moveTo(renderX, renderY + 6);
            ctx.lineTo(renderX + 18, renderY - 2);
            ctx.lineTo(renderX, renderY - 18);
            ctx.lineTo(renderX - 18, renderY - 2);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#1E293B';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Cara derecha (Sombra volumétrica)
            ctx.fillStyle = '#1E293B';
            ctx.beginPath();
            ctx.moveTo(renderX, renderY + 6);
            ctx.lineTo(renderX + 18, renderY - 2);
            ctx.lineTo(renderX + 18, renderY + 2);
            ctx.lineTo(renderX, renderY + 10);
            ctx.closePath();
            ctx.fill();

            // Cara izquierda (Luz lateral)
            ctx.fillStyle = '#475569';
            ctx.beginPath();
            ctx.moveTo(renderX, renderY + 6);
            ctx.lineTo(renderX - 18, renderY - 2);
            ctx.lineTo(renderX - 18, renderY + 2);
            ctx.lineTo(renderX, renderY + 10);
            ctx.closePath();
            ctx.fill();

            // Cristales de energía incrustados
            ctx.fillStyle = '#00F0FF';
            ctx.beginPath();
            ctx.moveTo(renderX - 2, renderY - 18);
            ctx.lineTo(renderX + 4, renderY - 8);
            ctx.lineTo(renderX - 2, renderY - 3);
            ctx.lineTo(renderX - 8, renderY - 10);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#A5F3FC';
            ctx.beginPath();
            ctx.moveTo(renderX - 2, renderY - 18);
            ctx.lineTo(renderX - 2, renderY - 3);
            ctx.lineTo(renderX - 8, renderY - 10);
            ctx.closePath();
            ctx.fill();

        } else if (this.type === 'tree') {
            // --- ÁRBOL CON ANIMACIÓN DE VIENTO ---
            // Tronco del árbol
            ctx.fillStyle = '#78350f';
            ctx.fillRect(renderX - 4, renderY - 14, 8, 18);

            // Oscilación del follaje simulando viento mediante función seno
            const windSpeed = 0.0025;
            const sway = Math.sin(timestamp * windSpeed + this.windOffset) * 4.0;

            // Follaje inferior (Copa principal)
            ctx.fillStyle = '#065f46';
            ctx.beginPath();
            ctx.ellipse(renderX + sway, renderY - 36, 24, 18, 0, 0, Math.PI * 2);
            ctx.fill();

            // Follaje superior (Brillo de copa)
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.ellipse(renderX + (sway * 0.7), renderY - 44, 16, 12, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
