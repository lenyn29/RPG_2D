import { Iso } from '../engine/isometric.js';

export class Player {
    constructor(startX, startY) {
        this.x = startX; 
        this.y = startY; 
        this.speed = 0.05; 
        
        // Variables de animación fluida
        this.animTimer = 0;
        this.isMoving = false;
        this.facingDirection = 'down'; // 'down', 'up', 'left', 'right'
    }

    update(inputManager, mapManager) {
        const move = inputManager.getMovementVector();

        if (move.x !== 0 || move.y !== 0) {
            this.isMoving = true;
            
            // Movimiento independiente en X e Y con colisión
            const nextX = this.x + move.x * this.speed;
            if (mapManager ? mapManager.isWalkable(nextX, this.y) : true) {
                this.x = nextX;
            }

            const nextY = this.y + move.y * this.speed;
            if (mapManager ? mapManager.isWalkable(this.x, nextY) : true) {
                this.y = nextY;
            }

            // Determinar dirección precisa
            if (Math.abs(move.x) > Math.abs(move.y)) {
                this.facingDirection = move.x > 0 ? 'right' : 'left';
            } else {
                this.facingDirection = move.y > 0 ? 'down' : 'up';
            }

            // Ciclo de pasos más rápido y fluido
            this.animTimer += 0.25;
        } else {
            this.isMoving = false;
            // Ciclo de respiración pasiva lento cuando está detenido
            this.animTimer += 0.04;
        }

        // Límites estrictos del mapa 32x32
        const maxLimit = mapManager ? mapManager.cols - 0.1 : 31.9;
        this.x = Math.max(0.1, Math.min(maxLimit, this.x));
        this.y = Math.max(0.1, Math.min(maxLimit, this.y));
    }

    draw(ctx, cameraOffsetX, cameraOffsetY) {
        const screen = Iso.toScreen(this.x, this.y);
        const renderX = screen.x + cameraOffsetX;
        const renderY = screen.y + cameraOffsetY;

        // Factores de animación oscilatorios
        const walkCycle = this.isMoving ? Math.sin(this.animTimer * 4) : 0;
        const breathe = !this.isMoving ? Math.sin(this.animTimer) * 1.2 : 0;
        const bobbing = this.isMoving ? Math.abs(Math.sin(this.animTimer * 4)) * 3.5 : 0;

        const charBaseY = renderY - 14 - bobbing + breathe;

        // 1. Sombra volumétrica dinámica en el suelo (se achica al saltar/moverse)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        const shadowScale = 1 - (bobbing * 0.08);
        ctx.ellipse(renderX, renderY + 2, (Iso.tileWidth / 3.5) * shadowScale, (Iso.tileHeight / 5) * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Capa / Bufanda Táctica con inercia al movimiento
        ctx.fillStyle = '#00F0FF';
        ctx.beginPath();
        const capeWave = Math.sin(this.animTimer * 2) * 2;
        if (this.facingDirection === 'left') {
            ctx.moveTo(renderX + 4, charBaseY - 16);
            ctx.lineTo(renderX + 16 + capeWave, charBaseY - 8);
            ctx.lineTo(renderX + 8, charBaseY - 2);
        } else if (this.facingDirection === 'right') {
            ctx.moveTo(renderX - 4, charBaseY - 16);
            ctx.lineTo(renderX - 16 - capeWave, charBaseY - 8);
            ctx.lineTo(renderX - 8, charBaseY - 2);
        } else {
            ctx.moveTo(renderX - 6, charBaseY - 16);
            ctx.lineTo(renderX + 6, charBaseY - 16);
            ctx.lineTo(renderX, charBaseY - 4 + capeWave);
        }
        ctx.closePath();
        ctx.fill();

        // 3. Piernas Articuladas (Animadas con el ciclo de caminata)
        ctx.fillStyle = '#0F172A';
        const legOffset = walkCycle * 4;
        // Pierna Izquierda
        ctx.fillRect(renderX - 4, charBaseY - 2, 3, 8 + legOffset);
        // Pierna Derecha
        ctx.fillRect(renderX + 1, charBaseY - 2, 3, 8 - legOffset);

        // 4. Torso y Armadura de Alta Definición
        ctx.fillStyle = '#1E293B';
        ctx.beginPath();
        ctx.roundRect(renderX - 7, charBaseY - 18, 14, 18, 4);
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Placa de Armadura y Núcleo Energético Cian (Estilo Shangri-La)
        ctx.fillStyle = '#00F0FF';
        ctx.fillRect(renderX - 2, charBaseY - 12, 4, 6);
        ctx.shadowColor = '#00F0FF';
        ctx.shadowBlur = 6;
        ctx.fillRect(renderX - 1, charBaseY - 10, 2, 2);
        ctx.shadowBlur = 0; // Reset blur

        // 5. Casco y Rostro Estilizado
        ctx.fillStyle = '#94A3B8';
        ctx.beginPath();
        ctx.arc(renderX, charBaseY - 22, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Visor Táctico Frontal Dinámico según la vista
        ctx.fillStyle = '#00F0FF';
        if (this.facingDirection === 'right') {
            ctx.fillRect(renderX + 1, charBaseY - 24, 4, 2.5);
        } else if (this.facingDirection === 'left') {
            ctx.fillRect(renderX - 5, charBaseY - 24, 4, 2.5);
        } else if (this.facingDirection === 'down') {
            ctx.fillRect(renderX - 2.5, charBaseY - 24, 5, 2.5);
        } else {
            // Espalda (Sin visor)
            ctx.fillStyle = '#475569';
            ctx.fillRect(renderX - 2.5, charBaseY - 24, 5, 2.5);
        }
    }
}
