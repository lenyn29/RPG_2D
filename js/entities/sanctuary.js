import { Iso } from '../engine/isometric.js';

export class Sanctuary {
    constructor(worldX, worldY) {
        this.x = worldX || 8.0; 
        this.y = worldY || 8.0; 
        this.radius = 2.0; // Radio de interacción del santuario
        this.pulseAnim = 0;
    }

    // Perímetro de seguridad: 10 baldosas por cada nivel del mob
    getSafetyRadius(mobLevel) {
        const lvl = isNaN(mobLevel) ? 1 : mobLevel;
        return lvl * 10;
    }

    isMobInSafeArea(mobX, mobY, mobLevel) {
        if (isNaN(mobX) || isNaN(mobY)) return false;
        const dx = mobX - this.x;
        const dy = mobY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const safeRadius = this.getSafetyRadius(mobLevel);
        return dist < safeRadius;
    }

    repelMob(mob) {
        if (!mob || isNaN(mob.x) || isNaN(mob.y)) return;
        const dx = mob.x - this.x;
        const dy = mob.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const safeRadius = this.getSafetyRadius(mob.level);

        if (dist < safeRadius && dist > 0.01) {
            const angle = Math.atan2(dy, dx);
            mob.x = this.x + Math.cos(angle) * (safeRadius + 0.2);
            mob.y = this.y + Math.sin(angle) * (safeRadius + 0.2);
        }
    }

    update(dt = 1) {
        const safeDt = isNaN(dt) ? 1 : dt;
        this.pulseAnim += 0.03 * safeDt;
    }

    draw(ctx, cameraOffsetX, cameraOffsetY, timestamp = 0) {
        if (!ctx) return;

        const screen = Iso.toScreen(this.x, this.y);
        const renderX = screen.x + (isNaN(cameraOffsetX) ? 0 : cameraOffsetX);
        const renderY = screen.y + (isNaN(cameraOffsetY) ? 0 : cameraOffsetY);

        ctx.save();

        // --- 1. CONSTRUCCIÓN DE LA PLATAFORMA HEXAGONAL ISOMÉTRICA ---
        const hexRadiusWorld = 1.9; // Radio del hexágono en el mundo
        const hexPoints = [];
        
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const wx = this.x + hexRadiusWorld * Math.cos(angle);
            const wy = this.y + hexRadiusWorld * Math.sin(angle);
            const ptScreen = Iso.toScreen(wx, wy);
            hexPoints.push({
                x: ptScreen.x + (isNaN(cameraOffsetX) ? 0 : cameraOffsetX),
                y: ptScreen.y + (isNaN(cameraOffsetY) ? 0 : cameraOffsetY)
            });
        }

        // Sombra general de la plataforma en el suelo
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.moveTo(hexPoints[0].x, hexPoints[0].y + 12);
        for (let i = 1; i < 6; i++) {
            ctx.lineTo(hexPoints[i].x, hexPoints[i].y + 12);
        }
        ctx.closePath();
        ctx.fill();

        // Base / Zócalo de piedra ancestral (efecto 3D hacia abajo)
        ctx.fillStyle = '#1e293b'; 
        ctx.beginPath();
        ctx.moveTo(hexPoints[0].x, hexPoints[0].y);
        for (let i = 1; i < 6; i++) {
            ctx.lineTo(hexPoints[i].x, hexPoints[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Superficie superior de la plataforma (Baldosas de piedra pulida)
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.moveTo(hexPoints[0].x, hexPoints[0].y - 8);
        for (let i = 1; i < 6; i++) {
            ctx.lineTo(hexPoints[i].x, hexPoints[i].y - 8);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // --- 2. ANILLO RÚNICO Y NÚCLEO DE SANACIÓN MÁGICA ---
        const pulse = Math.sin(timestamp * 0.003) * 0.2 + 0.8;
        
        // Círculo rúnico exterior
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.75 * pulse})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(renderX, renderY - 8, Iso.tileWidth * 1.2, Iso.tileHeight * 1.2, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Runas internas discontinuas giratorias
        ctx.strokeStyle = `rgba(14, 165, 233, ${0.9 * pulse})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.ellipse(renderX, renderY - 8, Iso.tileWidth * 0.85, Iso.tileHeight * 0.85, 0, this.pulseAnim, this.pulseAnim + Math.PI * 1.5);
        ctx.stroke();
        ctx.setLineDash([]);

        // Núcleo de luz central
        ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.beginPath();
        ctx.ellipse(renderX, renderY - 8, Iso.tileWidth * 0.45, Iso.tileHeight * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();

        // --- 3. LAS 6 COLUMNAS ANCESTRALES EN CADA VÉRTICE DEL HEXÁGONO ---
        hexPoints.forEach((pt) => {
            const colBaseX = pt.x;
            const colBaseY = pt.y - 8;
            const colHeight = 30; // Altura de la columna de piedra

            // Sombra en la base de la columna
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.beginPath();
            ctx.ellipse(colBaseX, colBaseY + 3, 7, 3.5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Cuerpo monolítico de la columna
            ctx.fillStyle = '#475569';
            ctx.fillRect(colBaseX - 5, colBaseY - colHeight, 10, colHeight);
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1;
            ctx.strokeRect(colBaseX - 5, colBaseY - colHeight, 10, colHeight);

            // Capitel ornamentado superior de la columna
            ctx.fillStyle = '#64748b';
            ctx.fillRect(colBaseX - 7, colBaseY - colHeight - 5, 14, 6);

            // Gema / Orbe místico incrustado en la punta de la columna con brillo mágico
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(colBaseX, colBaseY - colHeight - 8, 4 * pulse, 0, Math.PI * 2);
            ctx.fill();

            // Destello interior de la gema
            ctx.fillStyle = '#bae6fd';
            ctx.beginPath();
            ctx.arc(colBaseX - 1, colBaseY - colHeight - 9, 1.5, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }
}
