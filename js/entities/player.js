import { Iso } from '../engine/isometric.js';

export class Player {
    constructor(startX, startY) {
        this.x = startX; 
        this.y = startY; 
        this.speed = 0.08; 
        
        // Carga de la hoja de sprites física
        this.sprite = new Image();
        this.sprite.src = 'assets/player.png';
        this.spriteLoaded = false;
        this.sprite.onload = () => {
            this.spriteLoaded = true;
        };

        // Dimensiones estándar de 48x48 y factor de escala 1.6x
        this.frameWidth = 48;  
        this.frameHeight = 48; 
        this.scale = 1.6;
        
        // Control de animación
        this.animTimer = 0;
        this.currentFrame = 0;
        this.facing = 'down'; // 'down', 'up', 'left', 'right'
        this.state = 'idle';  // 'idle', 'walk'
    }

    update(inputManager, mapManager) {
        const move = inputManager.getMovementVector();

        if (move.x !== 0 || move.y !== 0) {
            this.state = 'walk';
            
            // 1. Transformación exacta de coordenadas de pantalla (Joystick) a Mundo Isométrico
            const halfW = Iso.tileWidth / 2;
            const halfH = Iso.tileHeight / 2;

            const screenDx = move.x * this.speed;
            const screenDy = move.y * this.speed;

            const rawDx = (screenDx / halfW + screenDy / halfH) / 2;
            const rawDy = (screenDy / halfH - screenDx / halfW) / 2;

            // Normalización estricta para eliminar cualquier aceleración en diagonales
            const len = Math.sqrt(rawDx * rawDx + rawDy * rawDy);
            const dirX = len > 0 ? (rawDx / len) * this.speed : 0;
            const dirY = len > 0 ? (rawDy / len) * this.speed : 0;

            // 2. Movimiento independiente en X e Y con colisión
            const nextX = this.x + dirX;
            if (mapManager ? mapManager.isWalkable(nextX, this.y) : true) {
                this.x = nextX;
            }

            const nextY = this.y + dirY;
            if (mapManager ? mapManager.isWalkable(this.x, nextY) : true) {
                this.y = nextY;
            }

            // 3. Mapeo angular exacto (Arriba = 0°, Derecha = 90°, Abajo = 180°, Izquierda = 270°)
            // - Arriba (0°): Rango de 60° (-30° a 30° / 330° a 30°)
            // - Derecha (90°): Rango de 120° (30° a 150°)
            // - Abajo (180°): Rango de 60° (150° a 210°)
            // - Izquierda (270°): Rango de 120° (210° a 330°)
            let angle = Math.atan2(move.x, -move.y) * (360 / Math.PI);
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
        ctx.ellipse(renderX, renderY + 2, Iso.tileWidth / 2.8, Iso.tileHeight / 3.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Selección de la Fila (Row) según estado y dirección
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

        // Tamaños aplicados con la escala 1.6x
        const drawWidth = this.frameWidth * this.scale;
        const drawHeight = this.frameHeight * this.scale;

        // 3. Renderizado con escala y efecto espejo automático si mira a la izquierda
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
