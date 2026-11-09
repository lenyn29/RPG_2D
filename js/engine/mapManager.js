import { Iso } from './isometric.js';

export class MapManager {
    constructor() {
        // Matriz lógica del mapa (Ejemplo 5x5)
        // 0: Abismo / Vacío, 1: Piedra de Ruina, 2: Pasto Luminoso
        this.grid = [
            [1, 1, 1, 1, 1],
            [1, 2, 2, 2, 1],
            [1, 2, 1, 2, 1],
            [1, 2, 2, 2, 1],
            [1, 1, 1, 1, 1]
        ];
        
        this.rows = this.grid.length;
        this.cols = this.grid[0].length;
    }

    draw(ctx, cameraOffsetX, cameraOffsetY) {
        for (let x = 0; x < this.cols; x++) {
            for (let y = 0; y < this.rows; y++) {
                const tileType = this.grid[x][y];
                if (tileType === 0) continue; // No dibujar nada si es abismo

                const screen = Iso.toScreen(x, y);
                const rx = screen.x + cameraOffsetX;
                const ry = screen.y + cameraOffsetY;

                // Dibujar el cuerpo del tile isométrico (Rombo)
                ctx.beginPath();
                ctx.moveTo(rx, ry - Iso.tileHeight / 2);
                ctx.lineTo(rx + Iso.tileWidth / 2, ry);
                ctx.lineTo(rx, ry + Iso.tileHeight / 2);
                ctx.lineTo(rx - Iso.tileWidth / 2, ry);
                ctx.closePath();

                // Colores según el tipo de suelo (Estética Shangri-La / Ruinas)
                if (tileType === 1) {
                    ctx.fillStyle = '#222B38'; // Piedra de Ruina Oscura
                    ctx.strokeStyle = '#4A5260';
                } else if (tileType === 2) {
                    ctx.fillStyle = '#1B303A'; // Placa de metal / Suelo energético
                    ctx.strokeStyle = '#00F0FF'; // Acento cian
                }

                ctx.fill();
                ctx.lineWidth = 1;
                ctx.stroke();

                // Detalle central para dar profundidad geométrica
                ctx.fillStyle = 'rgba(0, 0, 0, 0.15);';
                ctx.fillRect(rx - 2, ry - 2, 4, 4);
            }
        }
    }
}
