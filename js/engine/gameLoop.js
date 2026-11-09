import { Player } from '../entities/player.js';
import { Iso } from './isometric.js';
import { InputManager } from './inputManager.js';

class GameEngine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Inicializar Gestor de Controles y Entidades
        this.inputManager = new InputManager(this.canvas);
        this.player = new Player(2.5, 2.5);
        
        this.lastTime = performance.now();
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    update(dt) {
        this.player.update(this.inputManager);
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const cameraOffsetX = this.canvas.width / 2;
        const cameraOffsetY = this.canvas.height / 3;

        // Renderizar mini grilla isométrica (5x5)
        for (let x = 0; x < 5; x++) {
            for (let y = 0; y < 5; y++) {
                const screen = Iso.toScreen(x, y);
                const rx = screen.x + cameraOffsetX;
                const ry = screen.y + cameraOffsetY;

                this.ctx.strokeStyle = '#2A344A';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(rx, ry - Iso.tileHeight / 2);
                this.ctx.lineTo(rx + Iso.tileWidth / 2, ry);
                this.ctx.lineTo(rx, ry + Iso.tileHeight / 2);
                this.ctx.lineTo(rx - Iso.tileWidth / 2, ry);
                this.ctx.closePath();
                this.ctx.stroke();
            }
        }

        // Renderizar Jugador
        this.player.draw(this.ctx, cameraOffsetX, cameraOffsetY);

        // Renderizar Controles Táctiles (UI superpuesta)
        this.inputManager.draw(this.ctx);
    }

    loop(timestamp) {
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.update(dt);
        this.render();

        requestAnimationFrame(this.loop);
    }
}

window.onload = () => {
    new GameEngine();
};
