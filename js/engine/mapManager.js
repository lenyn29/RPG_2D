import { Iso } from './isometric.js';

export class MapManager {
    constructor() {
        // Matriz lógica del mapa ampliada a 7x7 para dar más espacio a la exploración de biomas
        // 0: Abismo / Vacío, 1: Roca de Montaña Mística, 2: Pradera de Pasto Orgánico, 3: Tierra Ancestral
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

    draw(ctx, cameraOffsetX, cameraOffsetY) {
        for (let x = 0; x < this.cols; x++) {
            for (let y = 0; y < this.rows; y++) {
                const tileType = this.grid[x][y];
                if (tileType === 0) continue; // Abismo vacío

                const screen = Iso.toScreen(x, y);
                const rx = screen.x + cameraOffsetX;
                const ry = screen.y + cameraOffsetY;

                const halfW = Iso.tileWidth / 2;
                const halfH = Iso.tileHeight / 2;

                // 1. Relieve lateral orgánico (Efecto 3D de terreno de tierra/roca)
                const depthHeight = 10;
                ctx.beginPath();
                ctx.moveTo(rx - halfW, ry);
                ctx.lineTo(rx, ry + halfH);
                ctx.lineTo(rx, ry + halfH + depthHeight);
                ctx.lineTo(rx - halfW, ry + depthHeight);
                ctx.closePath();
                ctx.fillStyle = '#1A1814'; // Tierra profunda / Sombra cálida
                ctx.fill();

                ctx.beginPath();
                ctx.moveTo(rx + halfW, ry);
                ctx.lineTo(rx, ry + halfH);
                ctx.lineTo(rx, ry + halfH + depthHeight);
                ctx.lineTo(rx + halfW, ry + depthHeight);
                ctx.closePath();
                ctx.fillStyle = '#26221B'; // Lateral secundario de terreno
                ctx.fill();

                // 2. Cara superior del rombo (Superficie del Bioma Orgánico)
                ctx.beginPath();
                ctx.moveTo(rx, ry - halfH);
                ctx.lineTo(rx + halfW, ry);
                ctx.lineTo(rx, ry + halfH);
                ctx.lineTo(rx - halfW, ry);
                ctx.closePath();

                // Biomas Orgánicos y Naturales
                if (tileType === 1) {
                    // Bioma: Roca de Montaña Mística (Bordes rugosos)
                    ctx.fillStyle = '#3A3F47';
                    ctx.fill();
                    ctx.strokeStyle = '#4E5663';
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    // Textura de piedra natural
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                    ctx.fillRect(rx - 3, ry - 3, 6, 6);

                } else if (tileType === 2) {
                    // Bioma: Pradera de Pasto Orgánico (Verde vivo y natural)
                    ctx.fillStyle = '#2D4F3C';
                    ctx.fill();
                    ctx.strokeStyle = '#3E6B52';
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    // Pequeños detalles de briznas de pasto procedurales
                    ctx.fillStyle = '#4EA875';
                    ctx.fillRect(rx - 2, ry - 2, 2, 4);
                    ctx.fillRect(rx + 2, ry + 1, 2, 3);

                } else if (tileType === 3) {
                    // Bioma: Tierra Ancestral / Sendero
                    ctx.fillStyle = '#4A3B2C';
                    ctx.fill();
                    ctx.strokeStyle = '#5E4B37';
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    // Textura de suelo polvoriento
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                    ctx.beginPath();
                    ctx.arc(rx, ry, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }
}
