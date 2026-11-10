import { Player } from '../entities/player.js';
import { CombatSystem } from './combatSystem.js';
import { ParticleSystem } from './particleSystem.js';
import { Iso } from './isometric.js';
import { InputManager } from './inputManager.js';
import { MapManager } from './mapManager.js';
import { ScreenManager } from './screenManager.js';

class GameEngine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Inicializar subsistemas del motor
        this.screenManager = new ScreenManager();
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
            
            // 1. Repeler mobs si invaden la zona segura del Santuario Mágico
            const sanctuary = this.mapManager.sanctuary;
            if (sanctuary) {
                activeEnemies.forEach(enemy => {
                    if (enemy.state !== 'dead' && sanctuary.isMobInSafeArea(enemy.x, enemy.y, enemy.level)) {
                        sanctuary.repelMob(enemy);
                    }
                });
            }

            // 2. Procesar combate, XP, respawns y efectos
            this.combatSystem.processPlayerAttack(this.player, activeEnemies, this.canvas.width, this.canvas.height);
            this.combatSystem.processEnemyAttacks(this.player, activeEnemies);
            this.combatSystem.updateRespawns(activeEnemies);
            this.particleSystem.update();
            this.combatSystem.updateFloatingTexts();

            // 3. Actualizar entidades con Delta Time
            this.player.update(this.inputManager, this.mapManager, activeObjects, activeEnemies, dt);

            activeEnemies.forEach(enemy => {
                enemy.update(this.mapManager, activeObjects, this.player, dt);
            });
        } catch (e) {
            console.error("Error en el ciclo de actualización (update):", e);
        }
    }

    render(timestamp) {
        try {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // Si el móvil está en vertical, mostrar advertencia de giro
            if (this.screenManager.drawOrientationWarning(this.ctx, this.canvas.width, this.canvas.height)) {
                return;
            }

            // Obtener desplazamiento de Screen Shake
            const shake = this.combatSystem.getScreenShakeOffset();

            const playerScreen = Iso.toScreen(this.player.x, this.player.y);
            let cameraOffsetX = (this.canvas.width / 2) - playerScreen.x + shake.x;
            let cameraOffsetY = (this.canvas.height / 2) - playerScreen.y + shake.y;

            // 1. Dibujar mapa y Santuario Mágico
            this.mapManager.draw(this.ctx, cameraOffsetX, cameraOffsetY, timestamp);

            // 2. Renderizar entidades ordenadas por profundidad (Y-Sorting)
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

            // 3. Efectos visuales e interfaz de usuario (UI)
            this.particleSystem.draw(this.ctx, cameraOffsetX, cameraOffsetY, Iso);
            this.combatSystem.drawFloatingTexts(this.ctx, cameraOffsetX, cameraOffsetY, Iso);
            this.particleSystem.drawConfettiUI(this.ctx);

            this.inputManager.draw(this.ctx);
        } catch (e) {
            console.error("Error en el ciclo de renderizado (render):", e);
        }
    }

    loop(timestamp) {
        const rawDt = (timestamp - this.lastTime) / 1000;
        const dt = Math.min(rawDt * 60, 2.0); 
        this.lastTime = timestamp;

        this.update(dt);
        this.render(timestamp);

        requestAnimationFrame(this.loop);
    }
}

window.onload = () => {
    new GameEngine();
};
