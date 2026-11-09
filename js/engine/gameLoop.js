import { Player } from '../entities/player.js';
import { Iso } from './isometric.js';
import { InputManager } from './inputManager.js';
import { MapManager } from './mapManager.js';

class GameEngine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.inputManager = new InputManager(this.canvas);
        this.mapManager = new MapManager();
        
        // Posición inicial segura en el centro del mapa (zona caminable)
        this.player = new Player(4.0, 4.0); 
        
        this.lastTime = performance.now();
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    update(dt) {
        this.player.update(this.inputManager, this.mapManager);
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const cameraOffsetX = this.canvas.width / 2;
        const cameraOffsetY = this.canvas.height / 3.5;

        // 1. Renderizar Mapa
        this.mapManager.draw(this.ctx, cameraOffsetX, cameraOffsetY);

        // 2. Renderizar Jugador
        this.player.draw(this.ctx, cameraOffsetX, cameraOffsetY);

        // 3. Renderizar Controles Táctiles
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
