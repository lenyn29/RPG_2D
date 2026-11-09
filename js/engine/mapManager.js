import { Iso } from './isometric.js';

export class MapManager {
    constructor() {
        this.rows = 32;
        this.cols = 32;
        this.grid = [];
        
        // Generación procedural del mapa 32x32: Pradera (2) y Senderos (3)
        for (let x = 0; x < this.cols; x++) {
            this.grid[x] = [];
            for (let y = 0; y < this.rows; y++) {
                // Diseñar cruces de caminos orgánicos y amplias praderas
                if (Math.abs(x - 16) < 2 || Math.abs(y - 16) < 2 || (x + y) % 8 === 0) {
                    this.grid[x][y] = 3; // Sendero de tierra
                } else {
                    this.grid[x][y] = 2; // Pradera de pasto
                }
            }
        }
    }

    // Colisión estricta únicamente en los límites exteriores (evita caer al abismo)
    isWalkable(x, y) {
        const gridX = Math.floor(x);
        const gridY = Math.floor(y);

        if (gridX < 0 || gridX >= this.cols || gridY < 0 || gridY >= this.rows) {
            return false;
        }
        return true; // Todo el interior de 32x32 es transitable
    }

    draw(ctx, cameraOffsetX, cameraOffsetY, timestamp = 0) {
        // Factor de tiempo para la animación suave de la hierba
        const time = timestamp * 0.003;

        for (let x = 0; x < this.cols; x++) {
            for (let y = 0; y < this.rows; y++) {
                const tileType = this.grid[x][y];
                const screen = Iso.toScreen(x, y);
                const rx = screen.x + cameraOffsetX;
                const ry = screen.y + cameraOffsetY;

                const halfW = Iso.tileWidth / 2;
                const halfH = Iso.tileHeight / 2;

                // 1. Relieve lateral 3D del terreno flotante
                const depthHeight = 6;
                ctx.beginPath();
                ctx.moveTo(rx - halfW, ry);
                ctx.lineTo(rx, ry + halfH);
                ctx.lineTo(rx, ry + halfH + depthHeight);
                ctx.lineTo(rx - halfW, ry + depthHeight);
                ctx.closePath();
                ctx.fillStyle = '#1A1814';
                ctx.fill();

                ctx.beginPath();
                ctx.moveTo(rx + halfW, ry);
                ctx.lineTo(rx, ry + halfH);
                ctx.lineTo(rx, ry + halfH + depthHeight);
                ctx.lineTo(rx + halfW, ry + depthHeight);
                ctx.closePath();
                ctx.fillStyle = '#26221B';
                ctx.fill();

                // 2. Superficie superior del Tile
                ctx.beginPath();
                ctx.moveTo(rx, ry - halfH);
                ctx.lineTo(rx + halfW, ry);
                ctx.lineTo(rx, ry + halfH);
                ctx.lineTo(rx - halfW, ry);
                ctx.closePath();

                if (tileType === 2) {
                    // Pradera de Pasto
                    ctx.fillStyle = '#2D4F3C';
                    ctx.fill();
                    ctx.strokeStyle = '#3E6B52';
                    ctx.lineWidth = 0.5;
                    ctx.stroke();

                    // Hebras de hierba pequeñas con animación procedural de movimiento
                    const sway = Math.sin(time + x * 0.5 + y * 0.5) * 1.5;
                    ctx.fillStyle = '#4EA875';

                    // Hebra 1
                    ctx.beginPath();
                    ctx.moveTo(rx - 3, ry);
                    ctx.lineTo(rx - 3 + sway, ry - 4);
                    ctx.lineTo(rx - 2 + sway, ry - 4);
                    ctx.lineTo(rx - 1, ry);
                    ctx.fill();

                    // Hebra 2
                    ctx.beginPath();
                    ctx.moveTo(rx + 2, ry + 1);
                    ctx.lineTo(rx + 2 + sway * 0.8, ry - 3);
                    ctx.lineTo(rx + 3 + sway * 0.8, ry - 3);
                    ctx.lineTo(rx + 4, ry + 1);
                    ctx.fill();

                } else if (tileType === 3) {
                    // Sendero de Tierra
                    ctx.fillStyle = '#4A3B2C';
                    ctx.fill();
                    ctx.strokeStyle = '#5E4B37';
                    ctx.lineWidth = 0.5;
                    ctx.stroke();

                    // Detalle de textura en el camino
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                    ctx.beginPath();
                    ctx.arc(rx, ry, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }
}
