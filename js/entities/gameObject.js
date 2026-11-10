import { Iso } from '../engine/isometric.js';

export class GameObject {
    constructor(x, y, type = 'tree') {
        this.x = x;
        this.y = y;
        this.type = type; // 'tree' o 'rock_ore'
        this.radius = 0.4;
        
        this.maxHp = type === 'rock_ore' ? 5 : 3;
        this.hp = this.maxHp;
        this.state = 'alive'; // 'alive' o 'destroyed'

        this.sprite = new Image();
        this.sprite.src = type === 'rock_ore' ? 'assets/rock.png' : 'assets/tree.png';
        this.spriteLoaded = false;
        this.sprite.onload = () => { this.spriteLoaded = true; };
    }

    applyDamage(amount) {
        if (this.state === 'destroyed') return;
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.state = 'destroyed';
        }
    }

    draw(ctx, cameraOffsetX, cameraOffsetY) {
        if (this.state === 'destroyed') return;

        const screen = Iso.toScreen(this.x, this.y);
        const renderX = screen.x + cameraOffsetX;
        const renderY = screen.y + cameraOffsetY;

        // Sombra base
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(renderX, renderY + 4, Iso.tileWidth / 2.5, Iso.tileHeight / 3.5, 0, 0, Math.PI * 2);
        ctx.fill();

        if (this.spriteLoaded && this.sprite.complete) {
            const drawWidth = 48;
            const drawHeight = 64;
            ctx.drawImage(this.sprite, renderX - drawWidth / 2, renderY - drawHeight + 10, drawWidth, drawHeight);
        } else {
            ctx.fillStyle = this.type === 'rock_ore' ? '#64748b' : '#15803d';
            ctx.beginPath();
            ctx.arc(renderX, renderY - 15, 16, 0, Math.PI * 2);
            ctx.fill();
        }

        // Mostrar barra de vida del recurso si ha recibido daño
        if (this.hp < this.maxHp) {
            const barWidth = 24;
            const barHeight = 3;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(renderX - barWidth / 2, renderY - 45, barWidth, barHeight);
            ctx.fillStyle = '#eab308';
            ctx.fillRect(renderX - barWidth / 2, renderY - 45, barWidth * (this.hp / this.maxHp), barHeight);
        }
    }
}
