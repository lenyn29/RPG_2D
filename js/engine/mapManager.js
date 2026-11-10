import { Iso } from './isometric.js';
import { GameObject } from '../entities/gameObject.js';
import { Enemy } from '../entities/enemy.js';
import { Sanctuary } from '../entities/sanctuary.js'; // Ruta corregida o verificada

export class MapManager {
    constructor(seed = 1337) {
        this.seed = seed;
        this.chunkSize = 16; 
        this.chunks = new Map(); 
        this.renderDistance = 2; 

        // Instancia segura del Santuario en el punto (8.0, 8.0)
        this.sanctuary = new Sanctuary(8.0, 8.0);
    }

    _getChunkSeed(chunkX, chunkY) {
        let n = chunkX * 374761393 + chunkY * 668265263 + this.seed;
        n = (n ^ (n >> 13)) * 1274126177;
        return (n ^ (n >> 16)) >>> 0;
    }

    _getOrCreateChunk(chunkX, chunkY) {
        const key = `${chunkX},${chunkY}`;
        if (this.chunks.has(key)) {
            return this.chunks.get(key);
        }

        const tiles = [];
        const objects = [];
        const enemies = [];
        const chunkSeed = this._getChunkSeed(chunkX, chunkY);

        for (let y = 0; y < this.chunkSize; y++) {
            tiles[y] = [];
            for (let x = 0; x < this.chunkSize; x++) {
                const worldX = chunkX * this.chunkSize + x;
                const worldY = chunkY * this.chunkSize + y;

                const noise = Math.sin(worldX * 0.2) * Math.cos(worldY * 0.2);
                const tileType = noise > 0.3 ? 1 : 0; 
                tiles[y][x] = tileType;

                if (tileType === 0) {
                    const randomVal = Math.sin(worldX * 12.9898 + worldY * 78.233 + chunkSeed) * 43758.5453;
                    const cleanRandom = randomVal - Math.floor(randomVal);

                    if (cleanRandom < 0.05) {
                        const objType = cleanRandom < 0.025 ? 'rock_ore' : 'tree';
                        objects.push(new GameObject(worldX + 0.5, worldY + 0.5, objType));
                    }
                }
            }
        }

        const clusterSeed = Math.sin(chunkX * 99.1 + chunkY * 11.3 + chunkSeed) * 43758.5453;
        const clusterRandom = clusterSeed - Math.floor(clusterSeed);
        
        if (clusterRandom < 0.6) {
            const count = Math.floor(3 + clusterRandom * 3);
            const centerX = chunkX * this.chunkSize + 8;
            const centerY = chunkY * this.chunkSize + 8;

            for (let i = 0; i < count; i++) {
                const offsetX = (Math.random() - 0.5) * 6;
                const offsetY = (Math.random() - 0.5) * 6;
                const slimeX = centerX + offsetX;
                const slimeY = centerY + offsetY;
                
                // Evitar que spawneen dentro del santuario
                if (this.sanctuary) {
                    const distToSanctuary = Math.sqrt(Math.pow(slimeX - this.sanctuary.x, 2) + Math.pow(slimeY - this.sanctuary.y, 2));
                    if (distToSanctuary > 4.0) {
                        const slimeLevel = Math.floor(1 + Math.random() * 3);
                        enemies.push(new Enemy(slimeX, slimeY, 'slime', slimeLevel));
                    }
                }
            }
        }

        const chunkData = { chunkX, chunkY, tiles, objects, enemies };
        this.chunks.set(key, chunkData);
        return chunkData;
    }

    update(playerX, playerY) {
        if (isNaN(playerX) || isNaN(playerY)) return;
        const playerChunkX = Math.floor(playerX / this.chunkSize);
        const playerChunkY = Math.floor(playerY / this.chunkSize);

        for (let y = -this.renderDistance; y <= this.renderDistance; y++) {
            for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
                this._getOrCreateChunk(playerChunkX + x, playerChunkY + y);
            }
        }

        if (this.sanctuary) {
            this.sanctuary.update();
        }
    }

    getActiveObjects() {
        let allObjects = [];
        for (let chunk of this.chunks.values()) {
            if (chunk && chunk.objects) {
                allObjects = allObjects.concat(chunk.objects);
            }
        }
        return allObjects;
    }

    getActiveEnemies() {
        let allEnemies = [];
        for (let chunk of this.chunks.values()) {
            if (chunk && chunk.enemies) {
                allEnemies = allEnemies.concat(chunk.enemies);
            }
        }
        return allEnemies;
    }

    isWalkable(worldX, worldY) {
        return true; 
    }

    draw(ctx, cameraOffsetX, cameraOffsetY, timestamp = 0) {
        for (let chunk of this.chunks.values()) {
            if (!chunk || !chunk.tiles) continue;

            for (let y = 0; y < this.chunkSize; y++) {
                for (let x = 0; x < this.chunkSize; x++) {
                    const worldX = chunk.chunkX * this.chunkSize + x;
                    const worldY = chunk.chunkY * this.chunkSize + y;
                    const tileType = chunk.tiles[y][x];

                    const screen = Iso.toScreen(worldX, worldY);
                    const renderX = screen.x + cameraOffsetX;
                    const renderY = screen.y + cameraOffsetY;

                    if (renderX < -Iso.tileWidth * 2 || renderX > ctx.canvas.width + Iso.tileWidth * 2 ||
                        renderY < -Iso.tileHeight * 2 || renderY > ctx.canvas.height + Iso.tileHeight * 2) {
                        continue;
                    }

                    ctx.beginPath();
                    ctx.moveTo(renderX, renderY - Iso.tileHeight / 2);
                    ctx.lineTo(renderX + Iso.tileWidth / 2, renderY);
                    ctx.lineTo(renderX, renderY + 20);
                    ctx.lineTo(renderX - Iso.tileWidth / 2, renderY);
                    ctx.closePath();

                    ctx.fillStyle = tileType === 1 ? '#3d2e1e' : '#1a472a'; 
                    ctx.fill();

                    if (tileType === 0) {
                        const grassSeed = worldX * 33.3 + worldY * 77.7;
                        const windSpeed = 0.003;
                        const grassSway = Math.sin(timestamp * windSpeed + grassSeed) * 2.5;

                        ctx.strokeStyle = '#2d6a4f';
                        ctx.lineWidth = 1.2;
                        ctx.lineCap = 'round';

                        ctx.beginPath();
                        ctx.moveTo(renderX - 6, renderY);
                        ctx.quadraticCurveTo(renderX - 6 + grassSway, renderY - 6, renderX - 4 + grassSway, renderY - 9);
                        ctx.stroke();
                    }
                }
            }
        }

        if (this.sanctuary) {
            this.sanctuary.draw(ctx, cameraOffsetX, cameraOffsetY, timestamp);
        }
    }
}
