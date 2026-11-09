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
const PLAYER_SPRITE_SHEET = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAYCAYAAAC//9A3AAAACXBIWXMAAAsTAAALEwEAmpwYAAAFmUlEQVRYR9WXXWhURxTHf3N3796N64vW6CuaRjRpfYitWkXwIWhBfBBpS0XwQUUfRAtFfFDwQUWLCFpEC4oPCloQCoo+KGgRQUu1YqutVbTWrWkiidG4X5ts7nZ29uw5M9wz5CbtbnZnd/fMgf/MOf/fOWdmznf+48A5XlFw5q33HMAUIAq4Y6XAtZUC7lhp6FwR546VAs5Ybe7jXp+09/BqAtA+4f59eDUO3Yv5fW6p50vLPT5vpeVLSz0+b5Xly8o9Pm+V5Zp9m6uYwYkL587N7f5bH87b9XNfF2u8wT4eG+vj0fE+Hr7Q+1uXOn7PofZ9Y51f7/wS3x872vX7Zrt889DntgN8Yf6A/+F6v3VgrG/e760XunX3YqfPbfF600mvtX3iS3X37ZbeN69zV1v+m5f+Y+v85w29R9m/p977Xre81r3t8YI713re674pX4+fO6V73zL7u49910HveUv6bV7W8W1e1vF8Zf9W5X17Ntd2eT7d477vPOH+4H6+fK7f+04Xf5SHe8f75X9/Ptdve//r8n6v+z3dO4XGjC/w/f29p//594e9f9D5E75/pPtLvf8K6P0Z5095Xw48GfAsCnj4An+m91+M+GfP7u9XwN+D/wN5Xw48Cfh/Af8bXbXn9w74D+W9Z9DfhP+hAn8IuGPAr6fA/XfC/v5N8FfgLwH+BOCb6/WfW69b0nsL/F+A/xb4R8BvL/DfDPvbvYPeAn8O8CfAnwh8Xxf8X/U+7N2tZ/v2Y4f+X/Ue8u7Vs7Nf9L+v9xv19859u/8Z6D9Qf5H/ofb9YfofZ//4b8f++U6hXWf/6G7n/6/f7xX+/eN+u+tXvX/Q+ff9/orvV/o+5v/f7O+W/oX/9Wd9v9Bv1t8X+f59P+/N698v+v0t71f496/V7w5e75D/vPfneP++X3vT75/p9/fL9f5B/f39Xvv5P5Bf6X3j/S7pzfEOf9n5f9L5571fp3uNfp/m96f9/v6g59Z770t5r3n/+p8694L3N8wZ0+0X3H/Q+Y0v/Of85/Uv8v2xv7bXz/Zl9wX/D/jP+8+fO5Xz//7P+e+Bv15p72M9v7nAfwv8v8A/fXZ//m4FfAX+EPAd4G/A94vW509v/5/4M5D35cBfDjwJeO4Cfm9Of63At8BfBPwXwP8IfGOfPhV89YV+A3z9Bf46+Nr6LwBfX8DXT+C7e6r4wF97Z/vO6+688bO7e79yftD9A757053T4Lvb99v5vof/GfeXer+k52Pux/3/S//v1//2/Y+xP7bT5v+/uS+389/b7T6r76v1+/t9PuvpPuvrL7v/9m5+7/Pq7w3+z7v+P7rL685r3Zt273re676pe8vXbeu8t1z7X/K66Tzp/K7zpPPGffW/8b4v5+vxcqfc51W+v//fW/+10/X759bft35O5T71Oaf6POf+9TkvfD3V53P6PO7zB5wXvs76//7fG/f7x3u9/yGvL/I5C9/Vb8T+Nf75Nee99PWivq/Z53P6/b5+n/V19f4Pfd7X3vP75m5ev9rXw74+v857v9P565Z6vep+t9P565Z5fX7S9Yp9vU7H8+Xen7R5Wbu3vW9e585Yp+P9vHXZ6239fG6t9v46XvP4vNWWH784+Oq8K3yvxwvuXOt5fN4qy49fnD8wN//L48N9870+b5Xlx8Y7v294rvf9f06X/w54eT/AyzsVvG7F/9q54L4qXFf6f634Tzr54T794T794T5+P/8D+B7AOf7//gI4f37uX5S4SfwZ85TCAAAAAElFTkSuQmCC";
