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

        // Inicializar Gestores y Jugador en posición segura del mapa
        this.inputManager = new InputManager(this.canvas);
        this.mapManager = new MapManager();
        this.player = new Player(3.5, 3.5); 
        
        this.lastTime = performance.now();
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    update(dt) {
        // Enviar mapManager para procesar colisiones
        this.player.update(this.inputManager, this.mapManager);
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const cameraOffsetX = this.canvas.width / 2;
        const cameraOffsetY = this.canvas.height / 3.5;

        // 1. Dibujar Terreno
        this.mapManager.draw(this.ctx, cameraOffsetX, cameraOffsetY);

        // 2. Dibujar Jugador
        this.player.draw(this.ctx, cameraOffsetX, cameraOffsetY);

        // 3. Dibujar UI Táctil
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
