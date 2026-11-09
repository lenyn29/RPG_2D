import { Iso } from '../engine/isometric.js';

export class Player {
    constructor(startX, startY) {
        this.x = startX; 
        this.y = startY; 
        this.speed = 0.055; 
        
        this.sprite = new Image();
        this.sprite.src = 'assets/player.png';
        this.spriteLoaded = false;
        this.sprite.onload = () => {
            this.spriteLoaded = true;
        };

        this.frameWidth = 48;  
        this.frameHeight = 48; 
        this.scale = 1.6;
        
        this.animTimer = 0;
        this.currentFrame = 0;
        this.facing = 'down'; 
        this.state = 'idle';  
    }

    update(inputManager, mapManager) {
        const move = inputManager.getMovementVector();

        if (move.x !== 0 || move.y !== 0) {
            this.state = 'walk';
            
            // 1. Mapeo directo y limpio de Pantalla a Isométrico
            // En pantalla: move.x > 0 es derecha, move.y > 0 es abajo.
            const moveX = (move.x * 0.5 - move.y * 0.5);
            const moveY = (move.x * 0.5 + move.y * 0.5);

            // Normalizar velocidad final en el mundo
            const len = Math.sqrt(moveX * moveX + moveY * moveY);
            const dirX = len > 0 ? (moveX / len) * this.speed : 0;
            const dirY = len > 0 ? (moveY / len) * this.speed : 0;

            // 2. Colisión independiente en X e Y
            const nextX = this.x + dirX;
            if (!mapManager || mapManager.isWalkable(nextX, this.y)) {
                this.x = nextX;
            }

            const nextY = this.y + dirY;
            if (!mapManager || mapManager.isWalkable(this.x, nextY)) {
                this.y = nextY;
            }

            // 3. Ángulos basados en la pantalla (Arriba = 0°)
            // - Arriba (0°): 330° a 30° (Rango de 60°)
            // - Derecha (90°): 30° a 150° (Rango de 120°)
            // - Abajo (180°): 150° a 210° (Rango de 60°)
            // - Izquierda (270°): 210° a 330° (Rango de 120°)
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

            // Animación de caminar (6 frames)
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

        // Límites del mapa 32x32
        const maxLimit = mapManager ? mapManager.cols - 0.1 : 31.9;
        this.x = Math.max(0.1, Math.min(maxLimit, this.x));
        this.y = Math.max(0.1, Math.min(maxLimit, this.y));
    }

    draw(ctx, cameraOffsetX, cameraOffsetY) {
        if (!this.spriteLoaded) return;

        const screen = Iso.toScreen(this.x, this.y);
        const renderX = screen.x + cameraOffsetX;
        const renderY = screen.y + cameraOffsetY;

        // Sombra en el suelo
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(renderX, renderY + 2, Iso.tileWidth / 2.8, Iso.tileHeight / 3.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Selección de Fila según estado y dirección
        let row = 0;
        const maxFrames = 6;

        if (this.state === 'idle') {
            if (this.facing === 'down') row = 0;             // f0: Idle Abajo
            else if (this.facing === 'right' || this.facing === 'left') row = 1; // f1: Idle Derecha
            else if (this.facing === 'up') row = 2;          // f2: Idle Arriba
        } else if (this.state === 'walk') {
            if (this.facing === 'down') row = 3;             // f3: Caminar Abajo
            else if (this.facing === 'right' || this.facing === 'left') row = 4; // f4: Caminar Derecha
            else if (this.facing === 'up') row = 5;          // f5: Caminar Arriba
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
    }
}
