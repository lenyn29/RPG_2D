export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emitBlood(worldX, worldY, count = 8) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.02 + Math.random() * 0.04;
            this.particles.push({
                x: worldX,
                y: worldY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 30 + Math.random() * 20, // Duración en frames
                size: 2 + Math.random() * 2
            });
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx, cameraOffsetX, cameraOffsetY, Iso) {
        this.particles.forEach(p => {
            const screen = Iso.toScreen(p.x, p.y);
            const renderX = screen.x + cameraOffsetX;
            const renderY = screen.y + cameraOffsetY;

            ctx.fillStyle = '#ef4444'; // Rojo sangre
            ctx.beginPath();
            ctx.arc(renderX, renderY, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}
