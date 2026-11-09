import { Iso } from './isometric.js';

export class MapManager {
    constructor() {
        // Matriz lógica del mapa (Ejemplo 5x5)
        // 0: Abismo / Vacío, 1: Piedra de Ruina Ancestral, 2: Suelo Tecnológico Energético
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
                if (tileType === 0) continue;

                const screen = Iso.toScreen(x, y);
                const rx = screen.x + cameraOffsetX;
                const ry = screen.y + cameraOffsetY;

                const halfW = Iso.tileWidth / 2;
                const halfH = Iso.tileHeight / 2;

                // 1. Dibujar el bloque lateral (Efecto 3D de relieve / profundidad del tile)
                const depthHeight = 8; // Grosor del bloque de piedra
                ctx.beginPath();
                ctx.moveTo(rx - halfW, ry);
                ctx.lineTo(rx, ry + halfH);
                ctx.lineTo(rx, ry + halfH + depthHeight);
                ctx.lineTo(rx - halfW, ry + depthHeight);
                ctx.closePath();
                ctx.fillStyle = '#141A23'; // Sombra lateral profunda
                ctx.fill();

                ctx.beginPath();
                ctx.moveTo(rx + halfW, ry);
                ctx.lineTo(rx, ry + halfH);
                ctx.lineTo(rx, ry + halfH + depthHeight);
                ctx.lineTo(rx + halfW, ry + depthHeight);
                ctx.closePath();
                ctx.fillStyle = '#1B232F'; // Lateral secundario
                ctx.fill();

                // 2. Dibujar la cara superior del rombo isométrico (Superficie del Tile)
                ctx.beginPath();
                ctx.moveTo(rx, ry - halfH);
                ctx.lineTo(rx + halfW, ry);
                ctx.lineTo(rx, ry + halfH);
                ctx.lineTo(rx - halfW, ry);
                ctx.closePath();

                // Biomas Procedurales Estilo Shangri-La
                if (tileType === 1) {
                    // Bioma: Piedra de Ruina Ancestral
                    ctx.fillStyle = '#222B38';
                    ctx.fill();
                    ctx.strokeStyle = '#3A4659';
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    // Textura procedural interna: Grieta sutil de piedra
                    ctx.strokeStyle = 'rgba(15, 20, 28, 0.4)';
                    ctx.beginPath();
                    ctx.moveTo(rx - 10, ry);
                    ctx.lineTo(rx + 5, ry - 4);
                    ctx.stroke();
                } else if (tileType === 2) {
                    // Bioma: Suelo Tecnológico Energético
                    ctx.fillStyle = '#182C36';
                    ctx.fill();
                    ctx.strokeStyle = '#00F0FF'; // Brillo cian en los bordes
                    ctx.lineWidth = 1.5;
                    ctx.stroke();

                    // Textura procedural interna: Núcleo de energía central
                    ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
                    ctx.beginPath();
                    ctx.moveTo(rx, ry - halfH * 0.5);
                    ctx.lineTo(rx + halfW * 0.5, ry);
                    ctx.lineTo(rx, ry + halfH * 0.5);
                    ctx.lineTo(rx - halfW * 0.5, ry);
                    ctx.closePath();
                    ctx.fill();
                }
            }
        }
    }
}
