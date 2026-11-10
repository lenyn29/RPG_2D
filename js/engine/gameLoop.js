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
        if (!this.canvas) {
            console.error("No se encontró el canvas con ID 'gameCanvas'");
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.resizeCanvas(), 250);
        });

        try {
            this.screenManager = new ScreenManager();
            this.mapManager = new MapManager(12345);
            this.particleSystem = new ParticleSystem();
            this.combatSystem = new CombatSystem(this.particleSystem);

            // Inicializar al jugador exactamente en el centro del Santuario Ancestral (8.0, 8.0)
            this.player = new Player(8.0, 8.0); 
            this.inputManager = new InputManager(this.canvas, this.player);

            this.mapManager.update(this.player.x, this.player.y);
        } catch (err) {
            console.error("Error crítico al inicializar el GameEngine:", err);
        }

        this.lastTime = performance.now();
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    resizeCanvas() {
        const w = window.innerWidth || document.documentElement.clientWidth || screen.width;
        const h = window.innerHeight || document.documentElement.clientHeight || screen.height;
        this.canvas.width = w > 0 ? w : 800;
        this.canvas.height = h > 0 ? h : 600;
    }

    update(dt) {
        try {
            if (!this.mapManager || !this.player) return;

            const safeDt = (isNaN(dt) || dt <= 0) ? 1 : dt;

            this.mapManager.update(this.player.x, this.player.y);
            const activeObjects = this.mapManager.getActiveObjects() || [];
            const activeEnemies = this.mapManager.getActiveEnemies() || [];
            
            // Conexión clave: Repulsión de mobs según su nivel utilizando el perímetro seguro del Santuario Hexagonal
            const sanctuary = this.mapManager.sanctuary;
            if (sanctuary && activeEnemies.length > 0) {
                activeEnemies.forEach(enemy => {
                    if (enemy && enemy.state !== 'dead' && sanctuary.isMobInSafeArea(enemy.x, enemy.y, enemy.level)) {
                        sanctuary.repelMob(enemy);
                    }
                });
            }

            this.combatSystem.processPlayerAttack(this.player, activeEnemies, this.canvas.width, this.canvas.height);
            this.combatSystem.processEnemyAttacks(this.player, activeEnemies);
            this.combatSystem.updateRespawns(activeEnemies);
            this.particleSystem.update();
            this.combatSystem.updateFloatingTexts();

            this.player.update(this.inputManager, this.mapManager, activeObjects, activeEnemies, safeDt);

            activeEnemies.forEach(enemy => {
                if (enemy && typeof enemy.update === 'function') {
                    enemy.update(this.mapManager, activeObjects, this.player, safeDt);
                }
            });
        } catch (e) {
            console.error("Error en el ciclo update():", e);
        }
    }

    render(timestamp) {
        try {
            if (!this.ctx || !this.canvas || !this.player) return;

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            const shake = this.combatSystem ? this.combatSystem.getScreenShakeOffset() : { x: 0, y: 0 };

            const playerScreen = Iso.toScreen(this.player.x, this.player.y);
            let cameraOffsetX = (this.canvas.width / 2) - playerScreen.x + shake.x;
            let cameraOffsetY = (this.canvas.height / 2) - playerScreen.y + shake.y;

            // 1. Dibujar mapa, terreno y el Santuario Hexagonal Ancestral
            if (this.mapManager) {
                this.mapManager.draw(this.ctx, cameraOffsetX, cameraOffsetY, timestamp);
            }

            const activeObjects = this.mapManager ? (this.mapManager.getActiveObjects() || []) : [];
            const activeEnemies = this.mapManager ? (this.mapManager.getActiveEnemies() || []) : [];
            
            // 2. Ordenamiento por profundidad (Y-Sorting) de entidades del mundo
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

            // 3. UI, partículas, textos flotantes y mandos táctiles
            if (this.particleSystem) {
                this.particleSystem.draw(this.ctx, cameraOffsetX, cameraOffsetY, Iso);
                this.particleSystem.drawConfettiUI(this.ctx);
            }
            if (this.combatSystem) {
                this.combatSystem.drawFloatingTexts(this.ctx, cameraOffsetX, cameraOffsetY, Iso);
            }
            if (this.inputManager) {
                this.inputManager.draw(this.ctx);
            }
        } catch (e) {
            console.error("Error en el ciclo render():", e);
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
