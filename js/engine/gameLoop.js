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

        // Inicializar subsistemas del motor
        this.mapManager = new MapManager(12345);
        this.particleSystem = new ParticleSystem();
        this.combatSystem = new CombatSystem(this.particleSystem);

        // Crear jugador en posición inicial segura (nivel 1)
        this.player = new Player(8.0, 8.0); 

        // Inicializar controles táctiles vinculados al jugador (para el botón de reinicio y ataque)
        this.inputManager = new InputManager(this.canvas, this.player);

        // Cargar chunks y grupos iniciales de enemigos alrededor del jugador
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
            // 1. Actualizar chunks del mapa infinito y obtener objetos y enemigos activos
            this.mapManager.update(this.player.x, this.player.y);
            const activeObjects = this.mapManager.getActiveObjects() || [];
            const activeEnemies = this.mapManager.getActiveEnemies() || [];
            
            // 2. Procesar lógica de combate, XP, respawns escalados y textos flotantes
            this.combatSystem.processPlayerAttack(this.player, activeEnemies);
            this.combatSystem.processEnemyAttacks(this.player, activeEnemies);
            this.combatSystem.updateRespawns(activeEnemies);
            this.particleSystem.update();
            this.combatSystem.updateFloatingTexts();

            // 3. Actualizar entidades del juego
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

            // Calcular desplazamiento de la cámara centrado en el héroe
            const playerScreen = Iso.toScreen(this.player.x, this.player.y);
            let cameraOffsetX = (this.canvas.width / 2) - playerScreen.x;
            let cameraOffsetY = (this.canvas.height / 2) - playerScreen.y;

            // 1. Dibujar el terreno procedural y hierba animada
            this.mapManager.draw(this.ctx, cameraOffsetX, cameraOffsetY, timestamp);

            // 2. Unificar Jugador, Enemigos activos y Objetos para el ordenamiento de profundidad (Y-Sorting)
            const activeObjects = this.mapManager.getActiveObjects() || [];
            const activeEnemies = this.mapManager.getActiveEnemies() || [];
            
            const renderList = [
                this.player,
                ...activeEnemies,
                ...activeObjects
            ];

            renderList.sort((a, b) => ((a.x || 0) + (a.y || 0)) - ((b.x || 0) + (b.y || 0)));

            // 3. Renderizar entidades y objetos ordenados
            renderList.forEach(entity => {
                if (entity && typeof entity.draw === 'function') {
                    entity.draw(this.ctx, cameraOffsetX, cameraOffsetY, timestamp);
                }
            });

            // 4. Renderizar efectos visuales superiores (Partículas de sangre y números de daño/XP flotantes)
            this.particleSystem.draw(this.ctx, cameraOffsetX, cameraOffsetY, Iso);
            this.combatSystem.drawFloatingTexts(this.ctx, cameraOffsetX, cameraOffsetY, Iso);

            // 5. Renderizar interfaz táctil (Joystick, botón de ataque y menú de reinicio si el héroe muere)
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
