import { Iso } from './isometric.js';
import { GameObject } from '../entities/gameObject.js';

export class MapManager {
    constructor(seed = 1337) {
        this.seed = seed;
        this.chunkSize = 16; 
        this.chunks = new Map(); 
        this.renderDistance = 2; 
    }

    // Generador determinista simple basado en semilla
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
        const chunkSeed = this._getChunkSeed(chunkX, chunkY);

        for (let y = 0; y < this.chunkSize; y++) {
            tiles[y] = [];
            for (let x = 0; x < this.chunkSize; x++) {
                const worldX = chunkX * this.chunkSize + x;
                const worldY = chunkY * this.chunkSize + y;

                // Definir tipo de suelo procedural seguro
                const noise = Math.sin(worldX * 0.2) * Math.cos(worldY * 0.2);
                const tileType = noise > 0.3 ? 1 : 0; // 0: Pradera, 1: Sendero
                tiles[y][x] = tileType;

                // Generar rocas o árboles de forma procedural usando la semilla del chunk
                if (tileType === 0) {
                    const randomVal = Math.sin(worldX * 12.9898 + worldY * 78.233 + chunkSeed) * 43758.5453;
                    const cleanRandom = randomVal - Math.floor(randomVal);

                    if (cleanRandom < 0.07) { // 7% de probabilidad por tile de pradera
                        const objType = cleanRandom < 0.035 ? 'rock_ore' : 'tree';
                        objects.push(new GameObject(worldX + 0.5, worldY + 0.5, objType));
                    }
                }
            }
        }

        const chunkData = { chunkX, chunkY, tiles, objects };
        this.chunks.set(key, chunkData);
        return chunkData;
    }

    update(playerX, playerY) {
        if (isNaN(playerX) || isNaN(playerY)) return;
        const playerChunkX = Math.floor(playerX / this.chunkSize);
        const playerChunkY = Math.floor(playerY / this.chunkSize);

        // Generar chunks alrededor del jugador
        for (let y = -this.renderDistance; y <= this.renderDistance; y++) {
            for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
                this._getOrCreateChunk(playerChunkX + x, playerChunkY + y);
            }
        }
    }

    getActiveObjects() {
        let allObjects = [];
        for (let chunk of this.chunks.values()) {
            if (chunk && chunk.objects) {
                allObjects = allObjects.push ? allObjects.concat(chunk.objects) : [];
            }
        }
        return allObjects;
    }

    isWalkable(worldX, worldY) {
        return true; 
    }

    draw(ctx, cameraOffsetX, cameraOffsetY, timestamp) {
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

                    // Culling de pantalla para alto rendimiento
                    if (renderX < -Iso.tileWidth * 2 || renderX > ctx.canvas.width + Iso.tileWidth * 2 ||
                        renderY < -Iso.tileHeight * 2 || renderY > ctx.canvas.height + Iso.tileHeight * 2) {
                        continue;
                    }

                    ctx.beginPath();
                    ctx.moveTo(renderX, renderY - Iso.tileHeight / 2);
                    ctx.lineTo(renderX + Iso.tileWidth / 2, renderY);
                    ctx.lineTo(renderX, renderY + Iso.tileHeight / 2);
                    ctx.lineTo(renderX - Iso.tileWidth / 2, renderY);
                    ctx.closePath();

                    ctx.fillStyle = tileType === 1 ? '#475569' : '#1e293b';
                    ctx.fill();
                    ctx.strokeStyle = '#0f172a';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }
    }
}
