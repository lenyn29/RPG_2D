import { Iso } from './isometric.js';

export class MapManager {
    constructor() {
        // Matriz lógica del mapa (7x7)
        // 0: Abismo / Vacío (No caminable)
        // 1: Roca de Montaña Mística (No caminable / Colisión)
        // 2: Pradera de Pasto Orgánico (Caminable)
        // 3: Tierra Ancestral / Sendero (Caminable)
        this.grid = [
            [0, 1, 1, 1, 1, 1, 0],
            [1, 1, 3, 3, 3, 1, 1],
            [1, 3, 2, 2, 2, 3, 1],
            [1, 3, 2, 2, 2, 3, 1],
            [1, 3, 2, 2, 2, 3, 1],
            [1, 1, 3, 3, 3, 1, 1],
            [0, 1, 1, 1, 1, 1, 0]
        ];
        
        this.rows = this.grid.length;
        this.cols = this.grid[0].length;
    }

    // Método para validar si una posición del mapa es libre para caminar
    isWalkable(x, y) {
        const gridX = Math.floor(x);
        const gridY = Math.floor(y);

        // Verificar límites fuera de la matriz
        if (gridX < 0 || gridX >= this.cols || gridY < 0 || gridY >= this.rows) {
            return false;
        }

        const tileType = this.grid[gridX][gridY];
        // Solo las praderas (2) y senderos (3) permiten el paso
        return tileType === 2 || tileType === 3;
    }

    draw(ctx, cameraOffsetX, cameraOffsetY) {
        for (let x = 0; x < this.cols; x++) {
            for (let y = 0; y < this.rows; y++) {
                const tileType = this.grid[x][y];
                if (tileType === 0) continue;

                const screen = Iso.toScreen(x, y);
                const rx = screen.x + cameraOffsetX;
                const ry = screen.y + cameraOffsetY;

                const halfW = Iso.tileWidth / 2;
                const halfH = Iso.tileHeight / 2;

                // 1. Relieve lateral orgánico 3D
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
                    // Roca sólida
                    ctx.fillStyle = '#3A3F47';
                    ctx.fill();
                    ctx.strokeStyle = '#4E5663';
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                    ctx.fillRect(rx - 3, ry - 3, 6, 6);
                } else if (tileType === 2) {
                    // Pradera
                    ctx.fillStyle = '#2D4F3C';
                    ctx.fill();
                    ctx.strokeStyle = '#3E6B52';
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    ctx.fillStyle = '#4EA875';
                    ctx.fillRect(rx - 2, ry - 2, 2, 4);
                    ctx.fillRect(rx + 2, ry + 1, 2, 3);
                } else if (tileType === 3) {
                    // Sendero
                    ctx.fillStyle = '#4A3B2C';
                    ctx.fill();
                    ctx.strokeStyle = '#5E4B37';
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                    ctx.beginPath();
                    ctx.arc(rx, ry, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }
}
