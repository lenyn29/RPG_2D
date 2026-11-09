import { Iso } from '../engine/isometric.js';

export class Player {
    constructor(startX, startY) {
        this.x = startX; // Posición lógica X
        this.y = startY; // Posición lógica Y
        this.speed = 0.05; // Velocidad de desplazamiento suave
        this.targetX = startX;
        this.targetY = startY;
        
        // Controles de entrada (Teclado)
        this.keys = { w: false, a: false, s: false, d: false };
        this.initInput();
    }

    initInput() {
        window.addEventListener('keydown', (e) => this.handleKey(e, true));
        window.addEventListener('keyup', (e) => this.handleKey(e, false));
    }

    handleKey(e, isPressed) {
        switch(e.key.toLowerCase()) {
            case 'w': case 'arrowup': this.keys.w = isPressed; break;
            case 's': case 'arrowdown': this.keys.s = isPressed; break;
            case 'a': case 'arrowleft': this.keys.a = isPressed; break;
            case 'd': case 'arrowright': this.keys.d = isPressed; break;
        }
    }

    update() {
        // Movimiento direccional fluido en grilla isométrica
        let dx = 0;
        let dy = 0;

        if (this.keys.w) { dx -= 1; dy -= 1; }
        if (this.keys.s) { dx += 1; dy += 1; }
        if (this.keys.a) { dx -= 1; dy += 1; }
        if (this.keys.d) { dx += 1; dy -= 1; }

        if (dx !== 0 || dy !== 0) {
            // Normalizar vector de movimiento diagonal
            const length = Math.hypot(dx, dy);
            this.x += (dx / length) * this.speed;
            this.y += (dy / length) * this.speed;
        }
    }

    draw(ctx, cameraOffsetX, cameraOffsetY) {
        const screen = Iso.toScreen(this.x, this.y);
        const renderX = screen.x + cameraOffsetX;
        const renderY = screen.y + cameraOffsetY;

        // Dibujo temporal del jugador como marcador Neón (hasta que el artista entregue el sprite)
        ctx.fillStyle = '#00F0FF';
        ctx.beginPath();
        ctx.arc(renderX, renderY - 10, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Anillo de selección bajo los pies
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.beginPath();
        ctx.ellipse(renderX, renderY, Iso.tileWidth / 4, Iso.tileHeight / 4, 0, 0, Math.PI * 2);
        ctx.stroke();
    }
}
