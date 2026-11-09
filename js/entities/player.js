import { Iso } from '../engine/isometric.js';

export class Player {
    constructor(startX, startY) {
        this.x = startX; 
        this.y = startY; 
        this.speed = 0.055; 
        this.radius = 0.35; 
        
        this.sprite = new Image();
        this.sprite.src = 'assets/player.png';
        this.spriteLoaded = false;
        this.sprite.onload = () => {
            this.spriteLoaded = true;
        };
        this.sprite.onerror = () => {
            // Si la imagen falla o no existe, permitimos renderizar un respaldo geométrico para que no crashee
            this.spriteLoaded = false;
        };

        this.frameWidth = 48;  
        this.frameHeight = 48; 
        this.scale = 1.6;
        
        this.animTimer = 0;
        this.currentFrame = 0;
        this.facing = 'down'; 
        this.state = 'idle';  
    }

    canMoveTo(newX, newY, mapManager, objects = []) {
        if (mapManager && typeof mapManager.isWalkable === 'function') {
            if (!mapManager.isWalkable(newX, newY)) return false;
        }

        if (objects && Array.isArray(objects)) {
            for (let obj of objects) {
                const dx = newX - obj.x;
                const dy = newY - obj.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < (this.radius + obj.radius)) {
                    return false;
                }
            }
        }
        return true;
    }

    update(inputManager, mapManager, objects = []) {
        const move = inputManager.getMovementVector();

        if (move.x !== 0 || move.y !== 0) {
            this.state = 'walk';
            
            const joyLen = Math.sqrt(move.x * move.x + move.y * move.y);
            const joyX = joyLen > 0 ? move.x / joyLen : 0;
            const joyY = joyLen > 0 ? move.y / joyLen : 0;

            const targetDx = joyX + joyY;
            const targetDy = joyY - joyX;

            const worldLen = Math.sqrt(targetDx * targetDx + targetDy * targetDy);
            const moveX = worldLen > 0 ? (targetDx / worldLen) * this.speed : 0;
            const moveY = worldLen > 0 ? (targetDy / worldLen) * this.speed : 0;

            if (this.canMoveTo(this.x + moveX, this.y, mapManager, objects)) {
                this.x += moveX;
            }
            if (this.canMoveTo(this.x, this.y + moveY, mapManager, objects)) {
                this.y += moveY;
            }

            let angle = Math.atan2(move.x, -move.y) * (180 / Math.PI);
            if (angle < 0) angle += 360;

            if (angle >= 330 || angle <= 30) {
                this.facing = 'up';
            } else if (angle > 30 && angle < 150) {
                this.facing = 'right';
            } else if (angle >= 150 && angle <= 210) {
                this.facing = 'down';
            } else {
                this.facing = 'left';
            }

            this.animTimer += 0.25;
            if (this.animTimer >= 1) {
                this.currentFrame = (this.currentFrame + 1) % 6;
                this.animTimer = 0;
            }
        } else {
            this.state = 'idle';
            this.animTimer += 0.1;
            if (this.animTimer >= 1) {
                this.currentFrame = (this.currentFrame + 1) % 6;
                this.animTimer = 0;
            }
        }
    }

    draw(ctx, cameraOffsetX, cameraOffsetY) {
        const screen = Iso.toScreen(this.x, this.y);
        const renderX = screen.x + cameraOffsetX;
        const renderY = screen.y + cameraOffsetY;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(renderX, renderY + 2, Iso.tileWidth / 2.8, Iso.tileHeight / 3.8, 0, 0, Math.PI * 2);
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
            // Respaldo temporal si el sprite carga tarde: un círculo brillante para ubicar al héroe
            ctx.fillStyle = '#00F0FF';
            ctx.beginPath();
            ctx.arc(renderX, renderY - 15, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}
