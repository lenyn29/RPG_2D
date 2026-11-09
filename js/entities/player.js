import { Iso } from '../engine/isometric.js';

export class Player {
    constructor(startX, startY) {
        this.x = startX; 
        this.y = startY; 
        this.speed = 0.05; 
        
        // Carga de la hoja de sprites física
        this.sprite = new Image();
        this.sprite.src = 'assets/player.png';
        this.spriteLoaded = false;
        this.sprite.onload = () => {
            this.spriteLoaded = true;
        };

        // Dimensiones exactas de cada frame
        this.frameWidth = 16;  
        this.frameHeight = 24; 
        
        // Control de animación
        this.animTimer = 0;
        this.currentFrame = 0;
        this.facing = 'down'; // 'down', 'up', 'left', 'right'
        this.state = 'idle';  // 'idle', 'walk', 'attack'
    }

    update(inputManager, mapManager) {
        const move = inputManager.getMovementVector();

        if (move.x !== 0 || move.y !== 0) {
            this.state = 'walk';
            
            // Movimiento independiente en X e Y con colisión
            const nextX = this.x + move.x * this.speed;
            if (mapManager ? mapManager.isWalkable(nextX, this.y) : true) {
                this.x = nextX;
            }

            const nextY = this.y + move.y * this.speed;
            if (mapManager ? mapManager.isWalkable(this.x, nextY) : true) {
                this.y = nextY;
            }

            // Orientación
            if (Math.abs(move.x) > Math.abs(move.y)) {
                this.facing = move.x > 0 ? 'right' : 'left';
            } else {
                this.facing = move.y > 0 ? 'down' : 'up';
            }

            // Animación de caminar (6 frames)
            this.animTimer += 0.2;
            if (this.animTimer >= 1) {
                this.currentFrame = (this.currentFrame + 1) % 6;
                this.animTimer = 0;
            }
        } else {
            this.state = 'idle';
            // Animación de reposo (6 frames)
            this.animTimer += 0.1;
            if (this.animTimer >= 1) {
                this.currentFrame = (this.currentFrame + 1) % 6;
                this.animTimer = 0;
            }
        }

        // Límites estrictos del mapa 32x32
        const maxLimit = mapManager ? mapManager.cols - 0.1 : 31.9;
        this.x = Math.max(0.1, Math.min(maxLimit, this.x));
        this.y = Math.max(0.1, Math.min(maxLimit, this.y));
    }

    draw(ctx, cameraOffsetX, cameraOffsetY) {
        if (!this.spriteLoaded) return;

        const screen = Iso.toScreen(this.x, this.y);
        const renderX = screen.x + cameraOffsetX;
        const renderY = screen.y + cameraOffsetY;

        // 1. Sombra volumétrica en el suelo
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(renderX, renderY + 2, Iso.tileWidth / 3.5, Iso.tileHeight / 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Selección de la Fila (Row) según estado y dirección
        let row = 0;
        let maxFrames = 6;

        if (this.state === 'idle') {
            if (this.facing === 'down') row = 0;             // f0: Idle Abajo (6 frames)
            else if (this.facing === 'right' || this.facing === 'left') row = 1; // f1: Idle Derecha (6 frames)
            else if (this.facing === 'up') row = 2;          // f2: Idle Arriba (6 frames)
        } else if (this.state === 'walk') {
            if (this.facing === 'down') row = 3;             // f3: Caminar Abajo (6 frames)
            else if (this.facing === 'right' || this.facing === 'left') row = 4; // f4: Caminar Derecha (6 frames)
            else if (this.facing === 'up') row = 5;          // f5: Caminar Arriba (6 frames)
        }

        // Asegurar que el frame actual no exceda el límite de la fila activa
        const safeFrame = this.currentFrame % maxFrames;
        const sx = safeFrame * this.frameWidth;
        const sy = row * this.frameHeight;

        // 3. Renderizado con efecto espejo automático si mira a la izquierda
        ctx.save();
        if (this.facing === 'left') {
            ctx.translate(renderX, renderY);
            ctx.scale(-1, 1);
            ctx.drawImage(
                this.sprite,
                sx, sy, this.frameWidth, this.frameHeight,
                -this.frameWidth / 2, -this.frameHeight,
                this.frameWidth, this.frameHeight
            );
        } else {
            ctx.drawImage(
                this.sprite,
                sx, sy, this.frameWidth, this.frameHeight,
                renderX - this.frameWidth / 2, renderY - this.frameHeight,
                this.frameWidth, this.frameHeight
            );
        }
        ctx.restore();
    }
}
