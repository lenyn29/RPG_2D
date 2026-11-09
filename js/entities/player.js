import { Iso } from '../engine/isometric.js';

export class Player {
    constructor(startX, startY) {
        this.x = startX; 
        this.y = startY; 
        this.speed = 0.055; // Velocidad suave y constante
        
        // Carga de la hoja de sprites física
        this.sprite = new Image();
        this.sprite.src = 'assets/player.png';
        this.spriteLoaded = false;
        this.sprite.onload = () => {
            this.spriteLoaded = true;
        };

        // Dimensiones estándar y escala 1.6x
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
            
            // 1. Normalizar el vector del joystick en la pantalla
            const joyLen = Math.sqrt(move.x * move.x + move.y * move.y);
            const joyX = joyLen > 0 ? move.x / joyLen : 0;
            const joyY = joyLen > 0 ? move.y / joyLen : 0;

            // 2. Proyección exacta de Pantalla a Coordenadas Isométricas del Mundo
            // Esto alinea el movimiento del joystick con la visual de la pantalla.
            const halfW = Iso.tileWidth / 2;
            const halfH = Iso.tileHeight / 2;

            const targetDx = (joyX / halfW + joyY / halfH) / 2;
            const targetDy = (joyY / halfH - joyX / halfW) / 2;

            // 3. Normalizar el vector resultante en el mundo para evitar aceleraciones diagonales
            const worldLen = Math.sqrt(targetDx * targetDx + targetDy * targetDy);
            const moveX = worldLen > 0 ? (targetDx / worldLen) * this.speed : 0;
            const moveY = worldLen > 0 ? (targetDy / worldLen) * this.speed : 0;

            // 4. Movimiento independiente con colisión en el mapa
            const nextX = this.x + moveX;
            if (!mapManager || mapManager.isWalkable(nextX, this.y)) {
                this.x = nextX;
            }

            const nextY = this.y + moveY;
            if (!mapManager || mapManager.isWalkable(this.x, nextY)) {
                this.y = nextY;
            }

            // 5. Mapeo de ángulos exactos (Arriba = 0°)
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

        // 2. Selección de Fila en el Sprite Sheet según estado y dirección
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

        // 3. Renderizado con escala y efecto espejo automático para la izquierda
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
