import { Player } from '../entities/player.js';
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

        this.mapManager = new MapManager(12345);
        this.particleSystem = new ParticleSystem();
        this.combatSystem = new CombatSystem(this.particleSystem);

        this.player = new Player(8.0, 8.0); 
        this.inputManager = new InputManager(this.canvas, this.player);

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
            const activeEnemies = this.mapManager.getActiveEnemies() || [];
            
            // Pasar dimensiones del canvas para el confeti
            this.combatSystem.processPlayerAttack(this.player, activeEnemies, this.canvas.width, this.canvas.height);
            this.combatSystem.processEnemyAttacks(this.player, activeEnemies);
            this.combatSystem.updateRespawns(activeEnemies);
            this.particleSystem.update();
            this.combatSystem.updateFloatingTexts();

            this.player.update(this.inputManager, this.mapManager, activeObjects, activeEnemies);

            activeEnemies.forEach(enemy => {
                enemy.update(this.mapManager, activeObjects, this.player);
            });
        } catch (e) {
            console.error("Error en el ciclo de actualización (update):", e);
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
            const activeEnemies = this.mapManager.getActiveEnemies() || [];
            
            const renderList = [
                this.player,
                ...activeEnemies,
                ...activeObjects
            ];

            renderList.sort((a, b) => ((a.x || 0) + (a.y || 0)) - ((b.x || 0) + (b.y || 0)));

            renderList.forEach(entity => {
                if (entity && typeof entity.draw === 'function') {
                    entity.draw(this.ctx, cameraOffsetX, cameraOffsetY, timestamp);
                }
            });

            this.particleSystem.draw(this.ctx, cameraOffsetX, cameraOffsetY, Iso);
            this.combatSystem.drawFloatingTexts(this.ctx, cameraOffsetX, cameraOffsetY, Iso);

            // Renderizar partículas de confeti en capa UI superior
            this.particleSystem.drawConfettiUI(this.ctx);

            // Dibujar cartel de subida de nivel en pantalla si está activo
            if (this.player.levelUpNotification.active) {
                this.ctx.save();
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75);';
                this.ctx.fillRect(0, this.canvas.height / 2 - 40, this.canvas.width, 80);

                this.ctx.fillStyle = '#eab308'; // Dorado nivel
                this.ctx.font = 'bold 22px sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.shadowColor = '#000000';
                this.ctx.shadowBlur = 6;
                this.ctx.fillText(this.player.levelUpNotification.text, this.canvas.width / 2, this.canvas.height / 2);
                this.ctx.restore();
            }

            this.inputManager.draw(this.ctx);
        } catch (e) {
            console.error("Error en el ciclo de renderizado (render):", e);
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
