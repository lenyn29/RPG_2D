import { Iso } from '../engine/isometric.js';

export class Player {
    constructor(startX, startY) {
        this.x = startX; 
        this.y = startY; 
        this.speed = 0.045; 
        
        // Variables de estado y animación procedural
        this.animTimer = 0;
        this.bobbingOffset = 0; // Efecto de peso y pasos al caminar
        this.facingDirection = 'down'; // 'down', 'up', 'left', 'right'
    }

    update(inputManager) {
        const move = inputManager.getMovementVector();

        if (move.x !== 0 || move.y !== 0) {
            this.x += move.x * this.speed;
            this.y += move.y * this.speed;

            // Determinar orientación lógica
            if (Math.abs(move.x) > Math.abs(move.y)) {
                this.facingDirection = move.x > 0 ? 'right' : 'left';
            } else {
                this.facingDirection = move.y > 0 ? 'down' : 'up';
            }

            // Animación de desplazamiento (balanceo de pasos)
            this.animTimer += 0.2;
            this.bobbingOffset = Math.sin(this.animTimer * 4) * 3;
        } else {
            // Animación pasiva de respiración en reposo
            this.animTimer += 0.05;
            this.bobbingOffset = Math.sin(this.animTimer) * 1.2;
        }

        // Límites estrictos del mapa (7x7)
        this.x = Math.max(0, Math.min(6.9, this.x));
        this.y = Math.max(0, Math.min(6.9, this.y));
    }

    draw(ctx, cameraOffsetX, cameraOffsetY) {
        const screen = Iso.toScreen(this.x, this.y);
        const renderX = screen.x + cameraOffsetX;
        const renderY = screen.y + cameraOffsetY + this.bobbingOffset;

        // 1. Sombra volumétrica en el suelo isométrico
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(renderX, renderY - this.bobbingOffset, Iso.tileWidth / 3.2, Iso.tileHeight / 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Renderizado Procedural Detallado del Personaje
        const charBaseY = renderY - 14;

        // Bufanda / Capa táctica al viento (según dirección)
        ctx.fillStyle = '#00F0FF'; // Cian energético
        ctx.beginPath();
        if (this.facingDirection === 'left') {
            ctx.moveTo(renderX + 4, charBaseY - 16);
            ctx.lineTo(renderX + 16, charBaseY - 10);
            ctx.lineTo(renderX + 6, charBaseY - 6);
        } else {
            ctx.moveTo(renderX - 4, charBaseY - 16);
            ctx.lineTo(renderX - 16, charBaseY - 10);
            ctx.lineTo(renderX - 6, charBaseY - 6);
        }
        ctx.closePath();
        ctx.fill();

        // Torso / Armadura principal
        ctx.fillStyle = '#1E293B';
        ctx.beginPath();
        ctx.roundRect(renderX - 7, charBaseY - 18, 14, 18, 3);
        ctx.fill();
        ctx.strokeStyle = '#00F0FF';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Núcleo o detalle pectoral tecnológico
        ctx.fillStyle = '#00F0FF';
        ctx.fillRect(renderX - 1.5, charBaseY - 12, 3, 5);

        // Cabeza / Casco
        ctx.fillStyle = '#CBD5E1';
        ctx.beginPath();
        ctx.arc(renderX, charBaseY - 23, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Visor táctico frontal
        ctx.fillStyle = '#00F0FF';
        if (this.facingDirection === 'right') {
            ctx.fillRect(renderX + 1, charBaseY - 25, 4, 2.5);
        } else if (this.facingDirection === 'left') {
            ctx.fillRect(renderX - 5, charBaseY - 25, 4, 2.5);
        } else if (this.facingDirection === 'down') {
            ctx.fillRect(renderX - 2.5, charBaseY - 25, 5, 2.5);
        } else {
            // Espalda (sin visor visible)
            ctx.fillStyle = '#475569';
            ctx.fillRect(renderX - 2.5, charBaseY - 25, 5, 2.5);
        }
    }
}
