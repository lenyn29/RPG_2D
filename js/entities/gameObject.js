import { Iso } from '../engine/isometric.js';

export class GameObject {
    constructor(tileX, tileY, type = 'crystal_cluster') {
        this.x = tileX;
        this.y = tileY;
        this.type = type; // 'crystal_cluster', 'stalactite_ore'
        this.width = 1.0;
        this.height = 1.0;
    }

    draw(ctx, cameraOffsetX, cameraOffsetY) {
        const screen = Iso.toScreen(this.x, this.y);
        const renderX = screen.x + cameraOffsetX;
        const renderY = screen.y + cameraOffsetY;

        // 1. Sombra base en el suelo
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(renderX, renderY + 4, Iso.tileWidth / 2.5, Iso.tileHeight / 3, 0, 0, Math.PI * 2);
        ctx.fill();

        if (this.type === 'crystal_cluster') {
            // Dibujo procedural de un cúmulo de cristales de energía / menas de piedra
            
            // Cristal Central Grande (Cian / Turquesa)
            ctx.fillStyle = '#00F0FF';
            ctx.beginPath();
            ctx.moveTo(renderX, renderY - 28);       // Punta superior
            ctx.lineTo(renderX + 8, renderY - 8);    // Lado derecho
            ctx.lineTo(renderX, renderY + 2);        // Base centro
            ctx.lineTo(renderX - 8, renderY - 8);    // Lado izquierdo
            ctx.closePath();
            ctx.fill();

            // Brillo interno del cristal central (Cara izquierda más clara)
            ctx.fillStyle = '#A5F3FC';
            ctx.beginPath();
            ctx.moveTo(renderX, renderY - 28);
            ctx.lineTo(renderX, renderY + 2);
            ctx.lineTo(renderX - 8, renderY - 8);
            ctx.closePath();
            ctx.fill();

            // Cristal Secundario Izquierdo (Púrpura / Mineral energético)
            ctx.fillStyle = '#8B5CF6';
            ctx.beginPath();
            ctx.moveTo(renderX - 12, renderY - 18);
            ctx.lineTo(renderX - 4, renderY - 4);
            ctx.lineTo(renderX - 8, renderY + 6);
            ctx.lineTo(renderX - 16, renderY - 2);
            ctx.closePath();
            ctx.fill();

            // Cristal Secundario Derecho
            ctx.fillStyle = '#0ea5e9';
            ctx.beginPath();
            ctx.moveTo(renderX + 10, renderY - 20);
            ctx.lineTo(renderX + 18, renderY - 6);
            ctx.lineTo(renderX + 12, renderY + 4);
            ctx.lineTo(renderX + 6, renderY - 8);
            ctx.closePath();
            ctx.fill();

            // Efecto de brillo neón (Glow)
            ctx.shadowColor = '#00F0FF';
            ctx.shadowBlur = 8;
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(renderX, renderY - 28);
            ctx.lineTo(renderX + 8, renderY - 8);
            ctx.lineTo(renderX, renderY + 2);
            ctx.stroke();
            ctx.shadowBlur = 0; // Reset
        }
    }
}
