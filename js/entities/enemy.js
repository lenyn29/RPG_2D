import { Iso } from '../engine/isometric.js';

export class Enemy {
    constructor(startX, startY, type = 'slime') {
        this.x = startX;
        this.y = startY;
        this.type = type;
        this.speed = 0.025; // Velocidad de patrulla
        this.radius = 0.3;  // Radio de colisión
        
        // Sprite de Slime
        this.sprite = new Image();
        this.sprite.src = 'assets/slime.png';
        this.spriteLoaded = false;
        this.sprite.onload = () => {
            this.spriteLoaded = true;
        };

        // Dimensiones específicas de 32x32 y escala 1.6x
        this.frameWidth = 32;
        this.frameHeight = 32;
        this.scale = 1.6;

        // Estado y animación
        this.animTimer = 0;
        this.currentFrame = 0;
        this.facing = 'down'; // 'down', 'up', 'left', 'right'
        this.state = 'idle';  // 'idle', 'walk'
    }

    update(mapManager, objects = []) {
        // Por ahora mantenemos la animación de respiración/movimiento en idle
        // (En el siguiente paso agregaremos la IA de persecución o patrulla)
        this.animTimer += 0.15;
        if (this.animTimer >= 1) {
            this.currentFrame = (this.currentFrame + 1) % 6;
            this.animTimer = 0;
        }
    }

    draw(ctx, cameraOffsetX, cameraOffsetY) {
        const screen = Iso.toScreen(this.x, this.y);
        const renderX = screen.x + cameraOffsetX;
        const renderY = screen.y + cameraOffsetY;

        // Sombra en el suelo
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(renderX, renderY + 2, Iso.tileWidth / 3.2, Iso.tileHeight / 4.2, 0, 0, Math.PI * 2);
        ctx.fill();

        if (this.spriteLoaded && this.sprite.complete) {
            let row = 0;
            const maxFrames = 6;

            if (this.state === 'idle') {
                if (this.facing === 'down') row = 0;
                else if (this.facing === 'right' || this.facing === 'left') row = 1;
                else if (this.facing === 'up') row = 2;
            } else if (this.state === 'walk') {
                if (this.facing === 'down') row = 3;
                else if (this.facing === 'right' || this.facing === 'left') row = 4;
                else if (this.facing === 'up') row = 5;
            }

            const safeFrame = this.currentFrame % maxFrames;
            const sx = safeFrame * this.frameWidth;
            const sy = row * this.frameHeight;

            const drawWidth = this.frameWidth * this.scale;
            const drawHeight = this.frameHeight * this.scale;

            ctx.save();
            if (this.facing === 'left') {
                ctx.translate(renderX, renderY);
                ctx.scale(-1, 1);
                ctx.drawImage(
                    this.sprite,
                    sx, sy, this.frameWidth, this.frameHeight,
                    -drawWidth / 2, -drawHeight + (Iso.tileHeight / 2),
                    drawWidth, drawHeight
                );
            } else {
                ctx.drawImage(
                    this.sprite,
                    sx, sy, this.frameWidth, this.frameHeight,
                    renderX - drawWidth / 2, renderY - drawHeight + (Iso.tileHeight / 2),
                    drawWidth, drawHeight
                );
            }
            ctx.restore();
        } else {
            // Respaldo visual mientras carga la imagen del slime
            ctx.fillStyle = '#10B981';
            ctx.beginPath();
            ctx.arc(renderX, renderY - 10, 10, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
