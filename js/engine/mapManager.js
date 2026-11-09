import { Iso } from './isometric.js';
import { GameObject } from '../entities/gameObject.js';

export class MapManager {
    constructor(seed = 1337) {
        this.seed = seed;
        this.chunkSize = 16; 
        this.chunks = new Map(); 
        this.renderDistance = 2; 
    }

    _getOrCreateChunk(chunkX, chunkY) {
        const key = `${chunkX},${chunkY}`;
        if (this.chunks.has(key)) {
            return this.chunks.get(key);
        }

        const tiles = [];
        const objects = [];

        for (let y = 0; y < this.chunkSize; y++) {
            tiles[y] = [];
            for (let x = 0; x < this.chunkSize; x++) {
                const worldX = chunkX * this.chunkSize + x;
                const worldY = chunkY * this.chunkSize + y;

                const noise = Math.sin(worldX * 0.1) * Math.cos(worldY * 0.1);
                const tileType = noise > 0.4 ? 1 : 0; 
                tiles[y][x] = tileType;

                if (tileType === 0) {
                    const objRng = Math.sin(worldX * 12.9898 + worldY * 78.233 + this.seed) * 43758.5453;
                    const randVal = objRng - Math.floor(objRng);

                    if (randVal < 0.08) {
                        const objType = randVal < 0.04 ? 'rock_ore' : 'tree';
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
                allObjects = allObjects.concat(chunk.objects);
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

                    if (renderX < -Iso.tileWidth || renderX > ctx.canvas.width + Iso.tileWidth ||
                        renderY < -Iso.tileHeight || renderY > ctx.canvas.height + Iso.tileHeight) {
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
