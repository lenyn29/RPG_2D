export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.confettiParticles = [];
    }

    emitBlood(worldX, worldY, count = 6) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.02 + Math.random() * 0.04;
            this.particles.push({
                x: worldX,
                y: worldY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 30 + Math.random() * 20,
                size: 2 + Math.random() * 2
            });
        }
    }

    // Emisor de confeti en pantalla (coordenadas de pantalla UI)
    emitConfetti(canvasWidth, canvasHeight) {
        const colors = ['#22c55e', '#3b82f6', '#eab308', '#ec4899', '#06b6d4'];
        for (let i = 0; i < 60; i++) {
            this.confettiParticles.push({
                x: canvasWidth / 2 + (Math.random() - 0.5) * 200,
                y: canvasHeight / 2 - 50,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 6 - 2,
                gravity: 0.15,
                rotation: Math.random() * Math.PI,
                vRot: (Math.random() - 0.5) * 0.2,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 6 + Math.random() * 6,
                life: 120 // 2 segundos de duración
            });
        }
    }

    update() {
        // Actualizar sangre
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Actualizar confeti
        for (let i = this.confettiParticles.length - 1; i >= 0; i--) {
            let c = this.confettiParticles[i];
            c.x += c.vx;
            c.y += c.vy;
            c.vy += c.gravity;
            c.rotation += c.vRot;
            c.life--;
            if (c.life <= 0) this.confettiParticles.splice(i, 1);
        }
    }

    draw(ctx, cameraOffsetX, cameraOffsetY, Iso) {
        // Dibujar sangre en mundo isométrico
        this.particles.forEach(p => {
            const screen = Iso.toScreen(p.x, p.y);
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(screen.x + cameraOffsetX, screen.y + cameraOffsetY, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    // Dibujar confeti en la capa de interfaz (UI 2D de pantalla)
    drawConfettiUI(ctx) {
        this.confettiParticles.forEach(c => {
            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.rotate(c.rotation);
            ctx.fillStyle = c.color;
            ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.6);
            ctx.restore();
        });
    }
}
