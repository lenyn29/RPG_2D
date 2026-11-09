import { Iso } from './isometric.js';
import { GameObject } from '../entities/gameObject.js';

export class MapManager {
    constructor(seed = 1337) {
        this.seed = seed;
        this.chunkSize = 16; // 16x16 tiles por chunk
        this.chunks = new Map(); // Almacena los chunks generados: "chunkX,chunkY" -> ChunkData
        this.renderDistance = 2; // Radio de chunks cargados alrededor del jugador
    }

    // Generador pseudo-aleatorio determinista basado en semilla (Mulberry32)
    _seededRandom(seed) {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }

    // Generar o recuperar un chunk específico
    _getOrCreateChunk(chunkX, chunkY) {
        const key = `${chunkX},${chunkY}`;
        if (this.chunks.has(key)) {
            return this.chunks.get(key);
        }

        // Semilla única para este chunk basada en la semilla global y sus coordenadas
        const chunkSeed = this.seed + chunkX * 73856093 ^ chunkY * 19349663;
        let rng = () => {
            // LCG rápido para objetos del chunk
            let x = Math.sin(chunkSeed + Math.random()) * 10000;
            return x - Math.floor(x);
        };

        const tiles = [];
        const objects = [];

        for (let y = 0; y < this.chunkSize; y++) {
            tiles[y] = [];
            for (let x = 0; x < this.chunkSize; x++) {
                const worldX = chunkX * this.chunkSize + x;
                const worldY = chunkY * this.chunkSize + y;

                // Ruida simple para decidir tipo de suelo (Pradera vs Sendero)
                const noise = Math.sin(worldX * 0.1) * Math.cos(worldY * 0.1);
                const tileType = noise > 0.4 ? 1 : 0; // 0: Pradera, 1: Sendero
                tiles[y][x] = tileType;

                // Generación procedural de objetos (Rocas y Árboles) en celdas de pradera
                if (tileType === 0) {
                    const objRng = Math.sin(worldX * 12.9898 + worldY * 78.233 + this.seed) * 43758.5453;
                    const randVal = objRng - Math.floor(objRng);

                    if (randVal < 0.08) {
                        // 8% de probabilidad de tener una roca o árbol en este tile
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

    // Actualizar chunks cargados según la posición del jugador
    update(playerX, playerY) {
        const playerChunkX = Math.floor(playerX / this.chunkSize);
        const playerChunkY = Math.floor(playerY / this.chunkSize);

        // Generar chunks en el radio de visión
        for (let y = -this.renderDistance; y <= this.renderDistance; y++) {
            for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
                this._getOrCreateChunk(playerChunkX + x, playerChunkY + y);
            }
        }
    }

    // Obtener todos los objetos activos en los chunks cargados (para colisiones y Y-Sorting)
    getActiveObjects() {
        let allObjects = [];
        for (let chunk of this.chunks.values()) {
            allObjects = allObjects.concat(chunk.objects);
        }
        return allObjects;
    }

    // Validar si una posición mundial es caminable
    isWalkable(worldX, worldY) {
        const chunkX = Math.floor(worldX / this.chunkSize);
        const chunkY = Math.floor(worldY / this.chunkSize);
        const key = `${chunkX},${chunkY}`;

        if (!this.chunks.has(key)) return false; // Fuera de chunk cargado

        // Límites absolutos opcionales o del mundo infinito (aquí permitimos libre tránsito en chunks cargados)
        return true;
    }

    // Dibujar todos los chunks visibles
    draw(ctx, cameraOffsetX, cameraOffsetY, timestamp) {
        for (let chunk of this.chunks.values()) {
            for (let y = 0; y < this.chunkSize; y++) {
                for (let x = 0; x < this.chunkSize; x++) {
                    const worldX = chunk.chunkX * this.chunkSize + x;
                    const worldY = chunk.chunkY * this.chunkSize + y;
                    const tileType = chunk.tiles[y][x];

                    const screen = Iso.toScreen(worldX, worldY);
                    const renderX = screen.x + cameraOffsetX;
                    const renderY = screen.y + cameraOffsetY;

                    // Optimización: Culling básico fuera de pantalla
                    if (renderX < -Iso.tileWidth || renderX > ctx.canvas.width + Iso.tileWidth ||
                        renderY < -Iso.tileHeight || renderY > ctx.canvas.height + Iso.tileHeight) {
                        continue;
                    }

                    // Dibujar baldosa isométrica
                    ctx.beginPath();
                    ctx.moveTo(renderX, renderY - Iso.tileHeight / 2);
                    ctx.lineTo(renderX + Iso.tileWidth / 2, renderY);
                    ctx.lineTo(renderX, renderY + Iso.tileHeight / 2);
                    ctx.lineTo(renderX - Iso.tileWidth / 2, renderY);
                    ctx.closePath();

                    // Color según tipo de terreno procedural
                    ctx.fillStyle = tileType === 1 ? '#475569' : '#1e293b'; // Sendero gris vs Pradera oscura
                    ctx.fill();
                    ctx.strokeStyle = '#0f172a';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }
    }
}
