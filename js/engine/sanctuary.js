import { Iso } from '../engine/isometric.js';

export class Sanctuary {
    constructor(worldX, worldY) {
        this.x = worldX; // Coordenada X central en el mundo
        this.y = worldY; // Coordenada Y central en el mundo
        this.radius = 1.8; // Radio físico de interacción
        this.pulseAnim = 0;
    }

    // Calcular perímetro de seguridad en función del nivel del mob
    // 10 baldosas por cada nivel del mob (Lv 1 = 10 tiles, Lv 2 = 20 tiles, etc.)
    getSafetyRadius(mobLevel) {
        return mobLevel * 10;
    }

    // Verificar si un mob está invadiendo la zona segura del santuario
    isMobInSafeArea(mobX, mobY, mobLevel) {
        const dx = mobX - this.x;
        const dy = mobY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const safeRadius = this.getSafetyRadius(mobLevel);
        return dist < safeRadius;
    }

    // Empujar al mob fuera del perímetro seguro si intenta acercarse
    repelMob(mob) {
        const dx = mob.x - this.x;
        const dy = mob.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const safeRadius = this.getSafetyRadius(mob.level);

        if (dist < safeRadius && dist > 0.01) {
            // Vector de expulsión suave hacia el exterior del anillo
            const angle = Math.atan2(dy, dx);
            mob.x = this.x + Math.cos(angle) * (safeRadius + 0.2);
            mob.y = this.y + Math.sin(angle) * (safeRadius + 0.2);
        }
    }

    update(dt = 1) {
        this.pulseAnim += 0.04 * dt;
    }

    draw(ctx, cameraOffsetX, cameraOffsetY, timestamp = 0) {
        const screen = Iso.toScreen(this.x, this.y);
        const renderX = screen.x + cameraOffsetX;
        const renderY = screen.y + cameraOffsetY;

        ctx.save();
        
        // 1. Aura mágica exterior parpadeante en el suelo
        const pulse = Math.sin(timestamp * 0.003) * 0.2 + 0.8;
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.6 * pulse})`; // Azul arcano brillante
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(renderX, renderY, Iso.tileWidth * 1.5, Iso.tileHeight * 1.5, 0, 0, Math.PI * 2);
        ctx.stroke();

        // 2. Anillo rúnico interior giratorio / pulsante
        ctx.strokeStyle = `rgba(14, 165, 233, ${0.9 * pulse})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]); // Efecto de runas discontinuas
        ctx.beginPath();
        ctx.ellipse(renderX, renderY, Iso.tileWidth * 1.1, Iso.tileHeight * 1.1, 0, this.pulseAnim, this.pulseAnim + Math.PI * 1.5);
        ctx.stroke();
        ctx.setLineDash([]); // Limpiar patrón de trazo

        // 3. Núcleo central de sanación (Estrella mística o foco de luz)
        ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.beginPath();
        ctx.ellipse(renderX, renderY, Iso.tileWidth * 0.6, Iso.tileHeight * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(renderX, renderY - 4, 6 * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
