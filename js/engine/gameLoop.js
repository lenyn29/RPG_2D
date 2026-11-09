import { Player } from '../entities/player.js';
import { Enemy } from '../entities/enemy.js';
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
        this.mapManager = new MapManager(12345);
        this.player = new Player(8.0, 8.0); 
        
        // Spawn de Slimes enemigos cerca del jugador
        this.enemies = [
            new Enemy(10.0, 8.0, 'slime'),
            new Enemy(6.0, 10.0, 'slime')
        ];

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
        try {
            this.mapManager.update(this.player.x, this.player.y);
            const activeObjects = this.mapManager.getActiveObjects() || [];
            
            // Actualizar jugador
            this.player.update(this.inputManager, this.mapManager, activeObjects);

            // Actualizar enemigos
            this.enemies.forEach(enemy => {
                enemy.update(this.mapManager, activeObjects);
            });
        } catch (e) {
            console.error("Error en update:", e);
        }
    }

    render(timestamp) {
        try {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            const playerScreen = Iso.toScreen(this.player.x, this.player.y);
            let cameraOffsetX = (this.canvas.width / 2) - playerScreen.x;
            let cameraOffsetY = (this.canvas.height / 2) - playerScreen.y;

            // 1. Dibujar el mapa base
            this.mapManager.draw(this.ctx, cameraOffsetX, cameraOffsetY, timestamp);

            // 2. Unificar Jugador, Objetos y Enemigos para Y-Sorting de profundidad
            const activeObjects = this.mapManager.getActiveObjects() || [];
            const renderList = [
                this.player,
                ...this.enemies,
                ...activeObjects
            ];

            renderList.sort((a, b) => ((a.x || 0) + (a.y || 0)) - ((b.x || 0) + (b.y || 0)));

            // 3. Dibujar en orden de profundidad
            renderList.forEach(entity => {
                if (entity && typeof entity.draw === 'function') {
                    entity.draw(this.ctx, cameraOffsetX, cameraOffsetY, timestamp);
                }
            });

            // 4. Joystick UI
            this.inputManager.draw(this.ctx);
        } catch (e) {
            console.error("Error en render:", e);
        }
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
