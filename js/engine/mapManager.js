import { Iso } from './isometric.js';
import { GameObject } from '../entities/gameObject.js';

export class MapManager {
    constructor(seed = 1337) {
        this.seed = seed;
        this.chunkSize = 16; 
        this.chunks = new Map(); 
        this.renderDistance = 2; 
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
        const chunkSeed = this._getChunkSeed(chunkX, chunkY);

        for (let y = 0; y < this.chunkSize; y++) {
            tiles[y] = [];
            for (let x = 0; x < this.chunkSize; x++) {
                const worldX = chunkX * this.chunkSize + x;
                const worldY = chunkY * this.chunkSize + y;

                const noise = Math.sin(worldX * 0.2) * Math.cos(worldY * 0.2);
                const tileType = noise > 0.3 ? 1 : 0; // 0: Pradera, 1: Sendero
                tiles[y][x] = tileType;

                if (tileType === 0) {
                    const randomVal = Math.sin(worldX * 12.9898 + worldY * 78.233 + chunkSeed) * 43758.5453;
                    const cleanRandom = randomVal - Math.floor(randomVal);

                    if (cleanRandom < 0.07) {
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

                    // 1. Dibujar el cuerpo del tile SIN líneas de borde (suelo continuo)
                    ctx.beginPath();
                    ctx.moveTo(renderX, renderY - Iso.tileHeight / 2);
                    ctx.lineTo(renderX + Iso.tileWidth / 2, renderY);
                    ctx.lineTo(renderX, renderY + Iso.tileHeight / 2);
                    ctx.lineTo(renderX - Iso.tileWidth / 2, renderY);
                    ctx.closePath();

                    // Colores de pradera orgánica vs sendero de tierra
                    ctx.fillStyle = tileType === 1 ? '#334155' : '#0f291e'; 
                    ctx.fill();

                    // 2. Si es pradera (tileType === 0), añadimos mechones de hierba con animación de viento
                    if (tileType === 0) {
                        const grassSeed = worldX * 33.3 + worldY * 77.7;
                        const windSpeed = 0.003;
                        const grassSway = Math.sin(timestamp * windSpeed + grassSeed) * 2.5;

                        ctx.strokeStyle = '#10b981'; // Color verde hierba brillante
                        ctx.lineWidth = 1.2;
                        ctx.lineCap = 'round';

                        // Mechón izquierdo de hierba
                        ctx.beginPath();
                        ctx.moveTo(renderX - 6, renderY);
                        ctx.quadraticCurveTo(renderX - 6 + grassSway, renderY - 6, renderX - 4 + grassSway, renderY - 9);
                        ctx.stroke();

                        // Mechón derecho de hierba
                        ctx.beginPath();
                        ctx.moveTo(renderX + 4, renderY + 2);
                        ctx.quadraticCurveTo(renderX + 4 + grassSway, renderY - 4, renderX + 6 + grassSway, renderY - 7);
                        ctx.stroke();
                    }
                }
            }
        }
    }
}
