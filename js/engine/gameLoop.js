import { Player } from '../entities/player.js';
import { Iso } from './isometric.js';
import { InputManager } from './inputManager.js';
import { MapManager } from './mapManager.js';

class GameEngine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.inputManager = new InputManager(this.canvas);
        
        // Inicializar mapa infinito con semilla fija
        this.mapManager = new MapManager(12345);
        
        // Empezar en una coordenada segura dentro del chunk (8, 8)
        this.player = new Player(8.0, 8.0); 
        
        // Forzar la creación de los primeros chunks inmediatamente
        this.mapManager.update(this.player.x, this.player.y);

        this.lastTime = performance.now();
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    update(dt) {
        this.mapManager.update(this.player.x, this.player.y);
        const activeObjects = this.mapManager.getActiveObjects();
        this.player.update(this.inputManager, this.mapManager, activeObjects);
    }

    render(timestamp) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const playerScreen = Iso.toScreen(this.player.x, this.player.y);
        let cameraOffsetX = (this.canvas.width / 2) - playerScreen.x;
        let cameraOffsetY = (this.canvas.height / 2) - playerScreen.y;

        // 1. Dibujar suelo de los chunks
        this.mapManager.draw(this.ctx, cameraOffsetX, cameraOffsetY, timestamp);

        // 2. Obtener objetos activos y ordenar por Y-Sorting con el jugador
        const activeObjects = this.mapManager.getActiveObjects() || [];
        const renderList = [
            this.player,
            ...activeObjects
        ];

        renderList.sort((a, b) => (a.x + a.y) - (b.x + b.y));

        // 3. Dibujar entidades y objetos ordenados
        renderList.forEach(entity => {
            if (entity && typeof entity.draw === 'function') {
                entity.draw(this.ctx, cameraOffsetX, cameraOffsetY, timestamp);
            }
        });

        // 4. Dibujar controles táctiles
        this.inputManager.draw(this.ctx);
    }

    loop(timestamp) {
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.update(dt);
        this.render(timestamp);

        requestAnimationFrame(this.loop);
    }
}

window.onload = () => {
    new GameEngine();
};
