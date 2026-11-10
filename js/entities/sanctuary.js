import { Iso } from '../engine/isometric.js';

export class Sanctuary {
    constructor(worldX, worldY) {
        this.x = worldX || 8.0; 
        this.y = worldY || 8.0; 
        this.radius = 1.8; 
        this.pulseAnim = 0;
    }

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
        this.pulseAnim += 0.04 * safeDt;
    }

    draw(ctx, cameraOffsetX, cameraOffsetY, timestamp = 0) {
        if (!ctx) return;
        const screen = Iso.toScreen(this.x, this.y);
        const renderX = screen.x + (isNaN(cameraOffsetX) ? 0 : cameraOffsetX);
        const renderY = screen.y + (isNaN(cameraOffsetY) ? 0 : cameraOffsetY);

        ctx.save();
        
        const pulse = Math.sin(timestamp * 0.003) * 0.2 + 0.8;
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.6 * pulse})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(renderX, renderY, Iso.tileWidth * 1.5, Iso.tileHeight * 1.5, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(14, 165, 233, ${0.9 * pulse})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.ellipse(renderX, renderY, Iso.tileWidth * 1.1, Iso.tileHeight * 1.1, 0, this.pulseAnim, this.pulseAnim + Math.PI * 1.5);
        ctx.stroke();
        ctx.setLineDash([]);

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
