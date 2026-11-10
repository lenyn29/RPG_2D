import { Iso } from '../engine/isometric.js';

export class GameObject {
    constructor(x, y, type = 'tree') {
        this.x = x;
        this.y = y;
        this.type = type; // 'tree' o 'rock_ore'
        this.radius = 0.4;
        
        this.sprite = new Image();
        this.sprite.src = type === 'rock_ore' ? 'assets/rock.png' : 'assets/tree.png';
        this.spriteLoaded = false;
        this.sprite.onload = () => { this.spriteLoaded = true; };
    }

    draw(ctx, cameraOffsetX, cameraOffsetY) {
        const screen = Iso.toScreen(this.x, this.y);
        const renderX = screen.x + cameraOffsetX;
        const renderY = screen.y + cameraOffsetY;

        // Sombra base en el suelo
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(renderX, renderY + 4, Iso.tileWidth / 2.5, Iso.tileHeight / 3.5, 0, 0, Math.PI * 2);
        ctx.fill();

        if (this.spriteLoaded && this.sprite.complete) {
            const drawWidth = 48;
            const drawHeight = 64;
            ctx.drawImage(this.sprite, renderX - drawWidth / 2, renderY - drawHeight + 10, drawWidth, drawHeight);
        }
    }
}
