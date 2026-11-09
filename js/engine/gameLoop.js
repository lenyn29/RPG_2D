import { Player } from '../entities/player.js';
import { Iso } from './isometric.js';
import { InputManager } from './inputManager.js';
import { MapManager } from './mapManager.js';

class GameEngine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error("No se encontró el elemento #gameCanvas en el HTML.");
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.inputManager = new InputManager(this.canvas);
        this.mapManager = new MapManager(9999);
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
        this.mapManager.update(this.player.x, this.player.y);
        const activeObjects = this.mapManager.getActiveObjects();
        this.player.update(this.inputManager, this.mapManager, activeObjects);
    }

    render(timestamp) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const playerScreen = Iso.toScreen(this.player.x, this.player.y);
        let cameraOffsetX = (this.canvas.width / 2) - playerScreen.x;
        let cameraOffsetY = (this.canvas.height / 2) - playerScreen.y;

        this.mapManager.draw(this.ctx, cameraOffsetX, cameraOffsetY, timestamp);

        const activeObjects = this.mapManager.getActiveObjects();
        const renderList = [
            this.player,
            ...activeObjects
        ];

        renderList.sort((a, b) => (a.x + a.y) - (b.x + b.y));

        renderList.forEach(entity => {
            if (entity && typeof entity.draw === 'function') {
                entity.draw(this.ctx, cameraOffsetX, cameraOffsetY, timestamp);
            }
        });

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
