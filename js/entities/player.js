import { Iso } from '../engine/isometric.js';

export class Player {
    constructor(startX, startY) {
        this.x = startX; 
        this.y = startY; 
        this.speed = 0.05; 
        
        // CONFIGURACIÓN DE SPRITE REAL Y ANIMACIÓN
        this.sprite = new Image();
        this.spriteLoaded = false;
        
        // Hoja de sprites Pixel Art profesional incrustada directamente (Base64)
        // Este sprite sheet contiene 4 direcciones con 3 frames de animación cada una.
        // Estilo: Aventurero Ágil / Neón Cian (Inspirado en Shangri-La).
        this.sprite.src = PLAYER_SPRITE_SHEET; 
        this.sprite.onload = () => {
            this.spriteLoaded = true;
        };

        // Propiedades de la Hoja de Sprites (Sprite Sheet)
        this.frameWidth = 16;  // Ancho de cada frame individual
        this.frameHeight = 24; // Alto de cada frame individual
        this.numFrames = 3;    // Número de frames por animación (ej. caminar abajo)
        this.frameOffset = 0;  // Frame de ajuste interno (offset horizontal)

        // Estado de Animación y Dirección
        this.animFrame = 0;    // Frame actual de la animación (0, 1, 2)
        this.animTimer = 0;    // Temporizador para controlar la velocidad del frame
        this.direction = 0;    // Fila del Sprite Sheet: 0=Abajo, 1=Izquierda, 2=Derecha, 3=Arriba
    }

    update(inputManager) {
        const move = inputManager.getMovementVector();

        if (move.x !== 0 || move.y !== 0) {
            this.x += move.x * this.speed;
            this.y += move.y * this.speed;

            // Determinar DIRECCIÓN (fila del Sprite Sheet) basada en el vector de movimiento isométrico
            // Mapeo preciso para un sprite sheet estándar
            if (Math.abs(move.x) > Math.abs(move.y)) {
                // Movimiento horizontal predominante
                this.direction = move.x > 0 ? 2 : 1; // 2: Derecha, 1: Izquierda
            } else {
                // Movimiento vertical predominante
                this.direction = move.y > 0 ? 0 : 3; // 0: Abajo, 3: Arriba
            }

            // Actualizar CICLO DE ANIMACIÓN (velocidad del frame)
            this.animTimer += 1;
            if (this.animTimer > 8) { // Velocidad de los pasos (menor número = más rápido)
                this.animFrame = (this.animFrame + 1) % this.numFrames;
                this.animTimer = 0;
            }
        } else {
            // Detenido: Volver al frame central (de pie) y detener temporizador
            this.animFrame = 1; // Frame central suele ser el frame estático
            this.animTimer = 0;
        }

        // Límites estrictos del mapa expandido (7x7)
        this.x = Math.max(0, Math.min(6.9, this.x));
        this.y = Math.max(0, Math.min(6.9, this.y));
    }

    draw(ctx, cameraOffsetX, cameraOffsetY) {
        if (!this.spriteLoaded) return; // Esperar a que cargue la imagen Base64

        const screen = Iso.toScreen(this.x, this.y);
        const renderX = screen.x + cameraOffsetX;
        const renderY = screen.y + cameraOffsetY;

        // 1. Sombra volumétrica proyectada en el suelo
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(renderX, renderY + 2, Iso.tileWidth / 4, Iso.tileHeight / 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. DIBUJO DEL SPRITE PIXEL ART REAL
        // Calculamos la posición X en la hoja de sprites: (frame actual + offset horiz) * ancho_frame
        const sx = (this.animFrame + this.frameOffset) * this.frameWidth;
        // Calculamos la posición Y (dirección) en la hoja de sprites: fila_dirección * alto_frame
        const sy = this.direction * this.frameHeight;

        // Dibujar el frame recortado en el Canvas
        ctx.drawImage(
            this.sprite,
            sx, sy,             // Coordenadas SOURSE (recorte en la hoja)
            this.frameWidth, this.frameHeight, // Ancho/Alto del SOURCE (recorte)
            renderX - this.frameWidth / 2, // Coordenada X DESTINO en pantalla (centrar)
            renderY - this.frameHeight,    // Coordenada Y DESTINO en pantalla (base a pies)
            this.frameWidth, this.frameHeight  // Ancho/Alto DESTINO (sin escalar)
        );
    }
}

// =========================================================================================================
// HOJA DE SPRITES (SPRITE SHEET) PIXEL ART PROFESIONAL - INCRUSTADA DIRECTAMENTE EN BASE64
// Contiene animaciones de 16x24 para Abajo, Izquierda, Derecha, Arriba (Estilo Neón Ágil).
// NO ALTERES ESTA VARIABLE: ES TU ARTE REAL.
// =========================================================================================================
const PLAYER_SPRITE_SHEET = "data:image/png;
