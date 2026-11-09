import { Player } from '../entities/player.js';
import { Enemy } from '../entities/enemy.js';
import { CombatSystem } from './combatSystem.js';
import { ParticleSystem } from './particleSystem.js';
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
        this.particleSystem = new ParticleSystem();
        this.combatSystem = new CombatSystem(this.particleSystem);

        this.player = new Player(8.0, 8.0); 
        
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
            
            // Procesar combate y partículas
            this.combatSystem.processPlayerAttack(this.player, this.enemies);
            this.combatSystem.processEnemyAttacks(this.player, this.enemies);
            this.combatSystem.updateRespawns(this.enemies);
            this.particleSystem.update();

            // Actualizar entidades
            this.player.update(this.inputManager, this.mapManager, activeObjects, this.enemies);

            this.enemies.forEach(enemy => {
                enemy.update(this.mapManager, activeObjects, this.player);
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

            this.mapManager.draw(this.ctx, cameraOffsetX, cameraOffsetY, timestamp);

            const activeObjects = this.mapManager.getActiveObjects() || [];
            const renderList = [
                this.player,
                ...this.enemies, // Incluimos muertos para ver su animación dramática
                ...activeObjects
            ];

            renderList.sort((a, b) => ((a.x || 0) + (a.y || 0)) - ((b.x || 0) + (b.y || 0)));

            renderList.forEach(entity => {
                if (entity && typeof entity.draw === 'function') {
                    entity.draw(this.ctx, cameraOffsetX, cameraOffsetY, timestamp);
                }
            });

            // Dibujar partículas de sangre sobre las entidades
            this.particleSystem.draw(this.ctx, cameraOffsetX, cameraOffsetY, Iso);

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
