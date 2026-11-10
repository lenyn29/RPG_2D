import { ProgressionSystem } from './progressionSystem.js';

export class CombatSystem {
    constructor(particleSystem) {
        this.particles = particleSystem;
        this.floatingTexts = []; 
        this.screenShakeTimer = 0;
        this.screenShakeIntensity = 0;
    }

    triggerScreenShake(durationFrames = 12, intensity = 5) {
        this.screenShakeTimer = durationFrames;
        this.screenShakeIntensity = intensity;
    }

    getScreenShakeOffset() {
        if (this.screenShakeTimer <= 0) return { x: 0, y: 0 };
        this.screenShakeTimer--;
        const offsetX = (Math.random() - 0.5) * this.screenShakeIntensity;
        const offsetY = (Math.random() - 0.5) * this.screenShakeIntensity;
        return { x: offsetX, y: offsetY };
    }

    addFloatingText(text, x, y, color = '#ef4444') {
        this.floatingTexts.push({
            text: text,
            x: x,
            y: y,
            life: 50, 
            color: color,
            vy: -0.018 
        });
    }

    processPlayerAttack(player, enemies, canvasWidth, canvasHeight) {
        if (!player.isAttacking || player.hasDealtDamageThisAttack) return;

        const attackRange = 1.4;
        let enemiesInRange = [];

        enemies.forEach(enemy => {
            if (enemy.state === 'dead' || enemy.isHurt) return;
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= attackRange) {
                enemiesInRange.push({ enemy, dist, dx, dy });
            }
        });

        if (enemiesInRange.length > 0) {
            player.hasDealtDamageThisAttack = true;
            this.triggerScreenShake(12, 6);

            enemiesInRange.sort((a, b) => a.dist - b.dist);
            const closest = enemiesInRange[0];

            if (Math.abs(closest.dx) > Math.abs(closest.dy)) {
                player.facing = closest.dx > 0 ? 'right' : 'left';
            } else {
                player.facing = closest.dy > 0 ? 'down' : 'up';
            }

            const baseDamage = player.attackPower || 1.5;
            const affectedEnemies = enemiesInRange.slice(0, 3); // Máximo 3 objetivos en área

            affectedEnemies.forEach((item, index) => {
                const targetEnemy = item.enemy;
                
                // 15% Probabilidad de crítico (x1.5 daño)
                const isCrit = Math.random() < 0.15;
                let damageAmount = (index === 0) ? baseDamage : (baseDamage / 2);
                if (isCrit) damageAmount *= 1.5;

                const finalDamage = Math.round(damageAmount * 10) / 10;

                targetEnemy.hp -= finalDamage;
                targetEnemy.applyDamage(player.x, player.y);
                this.particles.emitBlood(targetEnemy.x, targetEnemy.y, index === 0 ? 6 : 2);
                
                const textColor = isCrit ? '#eab308' : '#ef4444';
                const textDisplay = isCrit ? `💥-${finalDamage}` : `-${finalDamage}`;
                this.addFloatingText(textDisplay, targetEnemy.x, targetEnemy.y - 0.5, textColor);

                if (targetEnemy.hp <= 0) {
                    targetEnemy.hp = 0;
                    targetEnemy.state = 'dead';
                    targetEnemy.currentFrame = 0;
                    targetEnemy.animTimer = 0;
                    targetEnemy.fadeTimer = 180; 
                    targetEnemy.respawnTimer = targetEnemy.level * 6 * 60; 

                    const xpReward = ProgressionSystem.getEnemyXpReward(targetEnemy.level);
                    player.gainXp(xpReward, this.particles, canvasWidth, canvasHeight);
                    this.addFloatingText(`+${xpReward} XP`, player.x, player.y - 0.9, '#3b82f6');
                }
            });
        }
    }

    processEnemyAttacks(player, enemies) {
        if (!player || player.state === 'dead') return;

        enemies.forEach(enemy => {
            if (enemy.state === 'dead' || enemy.state === 'flee') return;

            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (enemy.state === 'attack' && dist <= 0.85) {
                if (!player.isHurt && player.invincibleFrames <= 0) {
                    const enemyDamage = Math.round((enemy.attackPower || 1) * 10) / 10;
                    player.hp -= enemyDamage;
                    player.takeDamage(enemy.x, enemy.y);
                    this.triggerScreenShake(16, 8);
                    this.particles.emitBlood(player.x, player.y, 7);
                    this.addFloatingText(`-${enemyDamage}`, player.x, player.y - 0.5, '#06b6d4'); 

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
                        const stats = ProgressionSystem.getEnemyStats(enemy.level);
                        enemy.maxHp = stats.hp;
                        enemy.hp = enemy.maxHp;
                        enemy.state = 'idle';
                        enemy.currentFrame = 0;
                        enemy.fadeTimer = 0;
                        enemy.wasAttacked = false;
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
        if (!ctx) return;
        this.floatingTexts.forEach(ft => {
            const screen = Iso.toScreen(ft.x, ft.y);
            const renderX = screen.x + cameraOffsetX;
            const renderY = screen.y + cameraOffsetY;

            ctx.save();
            ctx.fillStyle = ft.color;
            ctx.font = 'bold 15px sans-serif';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 5;
            ctx.fillText(ft.text, renderX, renderY);
            ctx.restore();
        });
    }
}
