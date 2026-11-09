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

        // Dimensiones de cada frame individual en la hoja de sprites
        this.frameWidth = 16;  // Ajusta según el ancho real de cada sprite en tu grid
        this.frameHeight = 24; // Ajusta según el alto real de cada sprite en tu grid
        
        this.animTimer = 0;
        this.currentFrame = 0;
        this.numFrames = 6;    // Número de frames disponibles por animación en la fila
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

            // Determinar orientación lógica
            if (Math.abs(move.x) > Math.abs(move.y)) {
                this.facingDirection = move.x > 0 ? 'right' : 'left';
            } else {
                this.facingDirection = move.y > 0 ? 'down' : 'up';
            }

            // Control de velocidad de animación de los frames
            this.animTimer += 0.25;
            if (this.animTimer >= 1) {
                this.currentFrame = (this.currentFrame + 1) % this.numFrames;
                this.animTimer = 0;
            }
        } else {
            this.isMoving = false;
            this.currentFrame = 0; // Frame estático de descanso
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

        // 1. Sombra volumétrica proyectada en el suelo
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(renderX, renderY + 2, Iso.tileWidth / 3.5, Iso.tileHeight / 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Si la imagen aún no ha cargado, evitamos errores de render
        if (!this.spriteLoaded) return;

        // 2. Selección de Fila en el Sprite Sheet según la dirección
        // Fila 0: Abajo, Fila 1: Perfil derecho (usada también para izquierda con espejo), Fila 2: Arriba (según orden estándar)
        let row = 0;
        if (this.facingDirection === 'down') row = 0;
        else if (this.facingDirection === 'up') row = 2;
        else if (this.facingDirection === 'right' || this.facingDirection === 'left') row = 1;

        const sx = this.currentFrame * this.frameWidth;
        const sy = row * this.frameHeight;

        // 3. Renderizado con soporte de efecto espejo (Flip Horizontal para la izquierda)
        ctx.save();

        if (this.facingDirection === 'left') {
            // Trasladar al punto del jugador, invertir el eje X y dibujar con offset negativo
            ctx.translate(renderX, renderY);
            ctx.scale(-1, 1);
            ctx.drawImage(
                this.sprite,
                sx, sy, this.frameWidth, this.frameHeight,
                -this.frameWidth / 2, -this.frameHeight,
                this.frameWidth, this.frameHeight
            );
        } else {
            // Dibujado normal para Abajo, Arriba y Derecha
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
