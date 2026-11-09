import { Iso } from '../engine/isometric.js';

export class Player {
    constructor(startX, startY) {
        this.x = startX; 
        this.y = startY; 
        this.speed = 0.045; 
        
        // Configuración de Sprites y Animación
        this.sprite = new Image();
        this.spriteLoaded = false;
        
        // Nota: Aquí puedes apuntar a tu archivo de sprite sheet en el repositorio (ej. 'assets/hero_sheet.png')
        // Si la imagen no existe todavía, el sistema usará un renderizado alternativo de alta calidad sin romper el juego.
        this.sprite.src = 'assets/hero.png'; 
        this.sprite.onload = () => {
            this.spriteLoaded = true;
        };

        // Propiedades de animación
        this.animFrame = 0;
        this.animTimer = 0;
        this.facingDirection = 'down'; // 'down', 'up', 'left', 'right'
    }

    update(inputManager) {
        const move = inputManager.getMovementVector();

        if (move.x !== 0 || move.y !== 0) {
            this.x += move.x * this.speed;
            this.y += move.y * this.speed;

            // Determinar dirección para la futura orientación del sprite
            if (Math.abs(move.x) > Math.abs(move.y)) {
                this.facingDirection = move.x > 0 ? 'right' : 'left';
            } else {
                this.facingDirection = move.y > 0 ? 'down' : 'up';
            }

            // Actualizar ciclo de animación de movimiento
            this.animTimer += 1;
            if (this.animTimer > 10) {
                this.animFrame = (this.animFrame + 1) % 4; // Asumiendo 4 frames por animación
                this.animTimer = 0;
            }
        } else {
            this.animFrame = 0; // Frame estático en reposo
        }

        // Límites estrictos del mapa expandido (7x7)
        this.x = Math.max(0, Math.min(6.9, this.x));
        this.y = Math.max(0, Math.min(6.9, this.y));
    }

    draw(ctx, cameraOffsetX, cameraOffsetY) {
        const screen = Iso.toScreen(this.x, this.y);
        const renderX = screen.x + cameraOffsetX;
        const renderY = screen.y + cameraOffsetY;

        // Si ya cargaste un archivo de sprite real en 'assets/hero.png', lo dibujará aquí.
        if (this.spriteLoaded) {
            // Configuración estándar para Sprite Sheet (Ej: frames de 32x48 píxeles)
            const frameWidth = 32;
            const frameHeight = 48;
            
            ctx.drawImage(
                this.sprite,
                this.animFrame * frameWidth, 0, // Posición X e Y en la hoja de sprites
                frameWidth, frameHeight,
                renderX - frameWidth / 2, renderY - frameHeight + 10, // Posición en pantalla isométrica
                frameWidth, frameHeight
            );
        } else {
            // --- AVATAR HÍBRIDO DE ALTA CALIDAD (Placeholder visual mientras añades el sprite) ---
            // Sombra bajo los pies en el suelo isométrico
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.beginPath();
            ctx.ellipse(renderX, renderY, Iso.tileWidth / 3, Iso.tileHeight / 3, 0, 0, Math.PI * 2);
            ctx.fill();

            // Cuerpo del Aventurero (Estilo Fantasía / Protagonista Ágil)
            ctx.fillStyle = '#00F0FF'; // Núcleo cian energético
            ctx.beginPath();
            ctx.arc(renderX, renderY - 18, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Capa / Bufanda característica al viento (Inspirada en Shangri-La Frontier)
            ctx.fillStyle = '#FF3366';
            ctx.beginPath();
            ctx.moveTo(renderX - 6, renderY - 20);
            ctx.lineTo(renderX - 16, renderY - 12);
            ctx.lineTo(renderX - 8, renderY - 8);
            ctx.closePath();
            ctx.fill();
        }
    }
}
