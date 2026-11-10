import { Iso } from '../engine/isometric.js';

export class GameObject {
    constructor(x, y, type = 'tree') {
        this.x = x;
        this.y = y;
        this.type = type; // 'tree' o 'rock_ore'
        this.radius = 0.45;
        
        // Animación sutil de respiración o balanceo procedural
        this.seed = x * 12.9898 + y * 78.233;
    }

    draw(ctx, cameraOffsetX, cameraOffsetY, timestamp = 0) {
        const screen = Iso.toScreen(this.x, this.y);
        const renderX = screen.x + cameraOffsetX;
        const renderY = screen.y + cameraOffsetY;

        // 1. Sombra base isométrica en el suelo
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(renderX, renderY + 4, Iso.tileWidth / 2.2, Iso.tileHeight / 3, 0, 0, Math.PI * 2);
        ctx.fill();

        if (this.type === 'tree') {
            // --- DISEÑO DE ÁRBOL PROCEDURAL MEJORADO ---
            const sway = Math.sin(timestamp * 0.002 + this.seed) * 2; // Balanceo sutil con el viento

            // Tronco
            ctx.fillStyle = '#4a2e18';
            ctx.beginPath();
            ctx.moveTo(renderX - 6, renderY);
            ctx.lineTo(renderX + 6, renderY);
            ctx.lineTo(renderX + 4, renderY - 30);
            ctx.lineTo(renderX - 4, renderY - 30);
            ctx.closePath();
            ctx.fill();

            // Sombra del tronco
            ctx.fillStyle = '#2e1c0f';
            ctx.beginPath();
            ctx.moveTo(renderX, renderY);
            ctx.lineTo(renderX + 6, renderY);
            ctx.lineTo(renderX + 4, renderY - 30);
            ctx.lineTo(renderX, renderY - 30);
            ctx.closePath();
            ctx.fill();

            // Capas de Follaje con volumen y personalidad
            const treeTopX = renderX + sway;
            const treeTopY = renderY - 55;

            // Follaje oscuro trasero (profundidad)
            ctx.fillStyle = '#1b4332';
            ctx.beginPath();
            ctx.arc(treeTopX, treeTopY + 5, 24, 0, Math.PI * 2);
            ctx.fill();

            // Follaje principal vibrante
            ctx.fillStyle = '#2d6a4f';
            ctx.beginPath();
            ctx.arc(treeTopX, treeTopY, 22, 0, Math.PI * 2);
            ctx.fill();

            // Brillo superior del follaje (luz cenital)
            ctx.fillStyle = '#52b788';
            ctx.beginPath();
            ctx.arc(treeTopX - 6, treeTopY - 6, 10, 0, Math.PI * 2);
            ctx.fill();

        } else if (this.type === 'rock_ore') {
            // --- DISEÑO DE ROCA / YACIMIENTO MINERAL PROCEDURAL ---
            // Base de roca principal
            ctx.fillStyle = '#475569';
            ctx.beginPath();
            ctx.moveTo(renderX - 16, renderY);
            ctx.lineTo(renderX + 16, renderY);
            ctx.lineTo(renderX + 12, renderY - 22);
            ctx.lineTo(renderX - 8, renderY - 26);
            ctx.closePath();
            ctx.fill();

            // Cara sombreada de la roca
            ctx.fillStyle = '#334155';
            ctx.beginPath();
            ctx.moveTo(renderX, renderY);
            ctx.lineTo(renderX + 16, renderY);
            ctx.lineTo(renderX + 12, renderY - 22);
            ctx.lineTo(renderX, renderY - 20);
            ctx.closePath();
            ctx.fill();

            // Cristales de mineral mágicos / energéticos incrustados (Azules brillantes)
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.moveTo(renderX - 4, renderY - 10);
            ctx.lineTo(renderX + 2, renderY - 14);
            ctx.lineTo(renderX, renderY - 28);
            ctx.lineTo(renderX - 6, renderY - 20);
            ctx.closePath();
            ctx.fill();

            // Brillo interior del cristal
            ctx.fillStyle = '#bae6fd';
            ctx.beginPath();
            ctx.moveTo(renderX - 3, renderY - 12);
            ctx.lineTo(renderX, renderY - 15);
            ctx.lineTo(renderX - 1, renderY - 25);
            ctx.closePath();
            ctx.fill();

            // Segundo cristal más pequeño
            ctx.fillStyle = '#0284c7';
            ctx.beginPath();
            ctx.moveTo(renderX + 3, renderY - 6);
            ctx.lineTo(renderX + 10, renderY - 10);
            ctx.lineTo(renderX + 7, renderY - 20);
            ctx.closePath();
            ctx.fill();
        }
    }
}
