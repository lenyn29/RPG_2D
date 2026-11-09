import { Player } from '../entities/player.js';
import { GameObject } from '../entities/gameObject.js';
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
        
        this.player = new Player(16.0, 16.0); 

        // Menas de piedra con cristales repartidas por el mapa
        this.objects = [
            new GameObject(18, 14, 'rock_ore'),
            new GameObject(19, 15, 'rock_ore'),
            new GameObject(12, 18, 'rock_ore'),
            new GameObject(13, 20, 'rock_ore'),
            new GameObject(22, 10, 'rock_ore')
        ];
        
        this.lastTime = performance.now();
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    update(dt) {
        this.player.update(this.inputManager, this.mapManager, this.objects);
    }

    render(timestamp) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const playerScreen = Iso.toScreen(this.player.x, this.player.y);

        const cols = this.mapManager.cols;
        const rows = this.mapManager.rows;
        const halfW = Iso.tileWidth / 2;
        const halfH = Iso.tileHeight / 2;

        const p00 = Iso.toScreen(0, 0);
        const pCols0 = Iso.toScreen(cols, 0);
        const p0Rows = Iso.toScreen(0, rows);
        const pColsRows = Iso.toScreen(cols, rows);

        const minScreenX = Math.min(p00.x, pCols0.x, p0Rows.x, pColsRows.x) - halfW;
        const maxScreenX = Math.max(p00.x, pCols0.x, p0Rows.x, pColsRows.x) + halfW;
        const minScreenY = Math.min(p00.y, pCols0.y, p0Rows.y, pColsRows.y) - halfH;
        const maxScreenY = Math.max(p00.y, pCols0.y, p0Rows.y, pColsRows.y) + halfH + 25;

        let cameraOffsetX = (this.canvas.width / 2) - playerScreen.x;
        let cameraOffsetY = (this.canvas.height / 2) - playerScreen.y;

        const minOffsetX = this.canvas.width - maxScreenX;
        const maxOffsetX = -minScreenX;
        const minOffsetY = this.canvas.height - maxScreenY;
        const maxOffsetY = -minScreenY;

        cameraOffsetX = Math.max(minOffsetX, Math.min(maxOffsetX, cameraOffsetX));
        cameraOffsetY = Math.max(minOffsetY, Math.min(maxOffsetY, cameraOffsetY));

        // 1. Renderizar el Mapa base (Suelo)
        this.mapManager.draw(this.ctx, cameraOffsetX, cameraOffsetY, timestamp);

        // 2. Y-Sorting (Ordenamiento por profundidad de entidades y objetos)
        // Agrupamos al jugador y a todas las menas en un array y los ordenamos por su posición (x + y)
        const renderList = [
            this.player,
            ...this.objects
        ];

        renderList.sort((a, b) => (a.x + a.y) - (b.x + b.y));

        // 3. Renderizar en orden correcto de profundidad
        renderList.forEach(entity => {
            entity.draw(this.ctx, cameraOffsetX, cameraOffsetY);
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
