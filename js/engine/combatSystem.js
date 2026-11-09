export class CombatSystem {
    constructor(particleSystem) {
        this.particles = particleSystem;
        this.floatingTexts = []; // Almacena los textos de daño flotante
    }

    addFloatingText(text, x, y, color = '#ef4444') {
        this.floatingTexts.push({
            text: text,
            x: x,
            y: y,
            life: 45, // Duración en frames
            color: color,
            vy: -0.015 // Velocidad de ascenso
        });
    }

    processPlayerAttack(player, enemies) {
        if (!player.isAttacking) return;

        const attackRange = 1.3;
        enemies.forEach(enemy => {
            if (enemy.state === 'dead' || enemy.isHurt) return;

            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= attackRange) {
                enemy.hp -= 1; // 1 punto de daño estricto
                enemy.applyDamage(player.x, player.y);
                this.particles.emitBlood(enemy.x, enemy.y, 6);
                this.addFloatingText("-1", enemy.x, enemy.y - 0.5, '#ef4444');

                if (enemy.hp <= 0) {
                    enemy.hp = 0;
                    enemy.state = 'dead';
                    enemy.currentFrame = 0;
                    enemy.animTimer = 0;
                    enemy.fadeTimer = 180; 
                    enemy.respawnTimer = enemy.level * 5 * 60; // 5s por nivel
                }
            }
        });
    }

    processEnemyAttacks(player, enemies) {
        if (player.state === 'dead') return;

        enemies.forEach(enemy => {
            if (enemy.state === 'dead' || enemy.state === 'flee') return;

            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (enemy.state === 'attack' && dist <= 0.8) {
                if (!player.isHurt && player.invincibleFrames <= 0) {
                    player.hp -= 1; // 1 punto de daño al héroe
                    player.takeDamage(enemy.x, enemy.y);
                    this.particles.emitBlood(player.x, player.y, 6);
                    this.addFloatingText("-1", player.x, player.y - 0.5, '#3b82f6'); // Daño azulado o rojo al player

                    if (player.hp <= 0) {
                        player.hp = 0;
                        player.state = 'dead';
                        player.currentFrame = 0;
                        player.animTimer = 0;
                        player.fadeTimer = 180;
                    }
                }
            }
        });
    }

    updateRespawns(enemies) {
        enemies.forEach(enemy => {
            if (enemy.state === 'dead') {
                if (enemy.respawnTimer > 0) {
                    enemy.respawnTimer--;
                    if (enemy.respawnTimer <= 0) {
                        enemy.x = enemy.spawnX;
                        enemy.y = enemy.spawnY;
                        enemy.hp = enemy.maxHp;
                        enemy.state = 'idle';
                        enemy.currentFrame = 0;
                        enemy.fadeTimer = 0;
                    }
                }
            }
        });
    }

    updateFloatingTexts() {
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            let ft = this.floatingTexts[i];
            ft.y += ft.vy;
            ft.life--;
            if (ft.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    drawFloatingTexts(ctx, cameraOffsetX, cameraOffsetY, Iso) {
        this.floatingTexts.forEach(ft => {
            const screen = Iso.toScreen(ft.x, ft.y);
            const renderX = screen.x + cameraOffsetX;
            const renderY = screen.y + cameraOffsetY;

            ctx.save();
            ctx.fillStyle = ft.color;
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 4;
            ctx.fillText(ft.text, renderX, renderY);
            ctx.restore();
        });
    }
}
