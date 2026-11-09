import { Iso } from './isometric.js';

export class MapManager {
    constructor() {
        // Matriz lógica del mapa (9x9)
        // 0: Abismo / Vacío (No caminable)
        // 1: Roca / Montaña (No caminable - Colisión estricta)
        // 2: Pradera de Pasto Orgánico (Caminable)
        // 3: Tierra y Senderos (Caminable)
        this.grid = [
            [0, 0, 1, 1, 1, 1, 1, 0, 0],
            [0, 1, 1, 3, 3, 3, 1, 1, 0],
            [1, 1, 3, 2, 2, 2, 3, 1, 1],
            [1, 3, 2, 2, 2, 2, 2, 3, 1],
            [1, 3, 2, 2, 3, 2, 2, 3, 1],
            [1, 3, 2, 2, 2, 2, 2, 3, 1],
            [1, 1, 3, 2, 2, 2, 3, 1, 1],
            [0, 1, 1, 3, 3, 3, 1, 1, 0],
            [0, 0, 1, 1, 1, 1, 1, 0, 0]
        ];
        
        this.rows = this.grid.length;
        this.cols = this.grid[0].length;
    }

    // Validación rigurosa de colisión por coordenadas de celda
    isWalkable(x, y) {
        const gridX = Math.floor(x);
        const gridY = Math.floor(y);

        // Fuera de los límites de la matriz
        if (gridX < 0 || gridX >= this.cols || gridY < 0 || gridY >= this.rows) {
            return false;
        }

        const tileType = this.grid[gridX][gridY];
        // Únicamente se puede caminar sobre Pasto (2) y Tierra/Senderos (3)
        return tileType === 2 || tileType === 3;
    }

    draw(ctx, cameraOffsetX, cameraOffsetY) {
        for (let x = 0; x < this.cols; x++) {
            for (let y = 0; y < this.rows; y++) {
                const tileType = this.grid[x][y];
                if (tileType === 0) continue; // Abismo invisible

                const screen = Iso.toScreen(x, y);
                const rx = screen.x + cameraOffsetX;
                const ry = screen.y + cameraOffsetY;

                const halfW = Iso.tileWidth / 2;
                const halfH = Iso.tileHeight / 2;

                // 1. Relieve lateral 3D del terreno
                const depthHeight = 10;
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

                // 2. Cara superior del terreno
                ctx.beginPath();
                ctx.moveTo(rx, ry - halfH);
                ctx.lineTo(rx + halfW, ry);
                ctx.lineTo(rx, ry + halfH);
                ctx.lineTo(rx - halfW, ry);
                ctx.closePath();

                if (tileType === 1) {
                    // Roca Mística (Infranqueable)
                    ctx.fillStyle = '#3A3F47';
                    ctx.fill();
                    ctx.strokeStyle = '#282C33';
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                    ctx.fillRect(rx - 4, ry - 2, 8, 4);
                } else if (tileType === 2) {
                    // Pradera de Pasto
                    ctx.fillStyle = '#2D4F3C';
                    ctx.fill();
                    ctx.strokeStyle = '#3E6B52';
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    ctx.fillStyle = '#4EA875';
                    ctx.fillRect(rx - 2, ry - 2, 2, 4);
                    ctx.fillRect(rx + 2, ry + 1, 2, 3);
                } else if (tileType === 3) {
                    // Tierra y Senderos
                    ctx.fillStyle = '#4A3B2C';
                    ctx.fill();
                    ctx.strokeStyle = '#5E4B37';
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
                    ctx.beginPath();
                    ctx.arc(rx, ry, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }
}
