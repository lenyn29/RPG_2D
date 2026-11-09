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
        
        // Inicializar Mapa Infinito con una semilla fija (ej. 9999)
        this.mapManager = new MapManager(9999);
        
        // Posición inicial del héroe (ej. coordenada 0,0 en el mundo infinito)
        this.player = new Player(0.0, 0.0); 
        
        this.lastTime = performance.now();
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    update(dt) {
        // 1. Actualizar chunks según la posición actual del jugador
        this.mapManager.update(this.player.x, this.player.y);

        // 2. Obtener los objetos activos de los chunks cercanos para las colisiones
        const activeObjects = this.mapManager.getActiveObjects();

        // 3. Actualizar jugador pasando los objetos y el mapa
        this.player.update(this.inputManager, this.mapManager, activeObjects);
    }

    render(timestamp) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const playerScreen = Iso.toScreen(this.player.x, this.player.y);

        // Cámara centrada estrictamente en el jugador (mundo infinito)
        let cameraOffsetX = (this.canvas.width / 2) - playerScreen.x;
        let cameraOffsetY = (this.canvas.height / 2) - playerScreen.y;

        // 1. Renderizar Suelo (Chunks visibles)
        this.mapManager.draw(this.ctx, cameraOffsetX, cameraOffsetY, timestamp);

        // 2. Obtener objetos cercanos para Y-Sorting junto al jugador
        const activeObjects = this.mapManager.getActiveObjects();
        const renderList = [
            this.player,
            ...activeObjects
        ];

        // Ordenamiento por profundidad isométrica
        renderList.sort((a, b) => (a.x + a.y) - (b.x + b.y));

        // 3. Renderizar entidades y objetos ordenados
        renderList.forEach(entity => {
            entity.draw(this.ctx, cameraOffsetX, cameraOffsetY, timestamp);
        });

        // 4. Controles Táctiles (UI fija)
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
