import { ProgressionSystem } from './progressionSystem.js';

export class CombatSystem {
    constructor(particleSystem) {
        this.particles = particleSystem;
        this.floatingTexts = []; 
        this.screenShakeTimer = 0;
        this.screenShakeIntensity = 0;
    }

    triggerScreenShake(durationFrames = 12, intensity = 6) {
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
            life: 45, 
            color: color,
            vy: -0.015 
        });
    }

    processPlayerAttack(player, enemies, objects, canvasWidth, canvasHeight) {
        if (!player.isAttacking || player.hasDealtDamageThisAttack) return;

        const attackRange = 1.3;
        let targetsInRange = [];

        // 1. Comprobar enemigos en rango
        enemies.forEach(enemy => {
            if (enemy.state === 'dead' || enemy.isHurt) return;
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= attackRange) {
                targetsInRange.push({ type: 'enemy', target: enemy, dist, dx, dy });
            }
        });

        // 2. Comprobar recursos destructibles (rocas / árboles) en rango
        objects.forEach(obj => {
            if (obj.state === 'destroyed') return;
            const dx = obj.x - player.x;
            const dy = obj.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= attackRange) {
                targetsInRange.push({ type: 'object', target: obj, dist, dx, dy });
            }
        });

        if (targetsInRange.length > 0) {
            player.hasDealtDamageThisAttack = true;
            this.triggerScreenShake(10, 5); // Activar sacudida de cámara

            targetsInRange.sort((a, b) => a.dist - b.dist);
            const closest = targetsInRange[0];

            if (Math.abs(closest.dx) > Math.abs(closest.dy)) {
                player.facing = closest.dx > 0 ? 'right' : 'left';
            } else {
                player.facing = closest.dy > 0 ? 'down' : 'up';
            }

            const baseDamage = player.attackPower || 1;
            const affected = targetsInRange.slice(0, 3);

            affected.forEach((item, index) => {
                const damageAmount = (index === 0) ? baseDamage : (baseDamage / 2);
                const roundedDamage = Math.round(damageAmount * 10) / 10;

                if (item.type === 'enemy') {
                    const enemy = item.target;
                    enemy.hp -= roundedDamage;
                    enemy.applyDamage(player.x, player.y);
                    this.particles.emitBlood(enemy.x, enemy.y, index === 0 ? 5 : 2);
                    this.addFloatingText(`-${roundedDamage}`, enemy.x, enemy.y - 0.5, '#ef4444');

                    if (enemy.hp <= 0) {
                        enemy.hp = 0;
                        enemy.state = 'dead';
                        enemy.currentFrame = 0;
                        enemy.animTimer = 0;
                        enemy.fadeTimer = 180; 
                        enemy.respawnTimer = enemy.level * 5 * 60; 

                        const xpReward = ProgressionSystem.getEnemyXpReward(enemy.level);
                        player.gainXp(xpReward, this.particles, canvasWidth, canvasHeight);
                        this.addFloatingText(`+${xpReward} XP`, player.x, player.y - 0.8, '#3b82f6');
                    }
                } else if (item.type === 'object') {
                    const obj = item.target;
                    obj.applyDamage(roundedDamage);
                    this.addFloatingText(`-${roundedDamage}`, obj.x, obj.y - 0.5, '#eab308');
                }
            });
        }
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
                    const enemyDamage = Math.round((enemy.attackPower || 1) * 10) / 10;
                    player.hp -= enemyDamage;
                    player.takeDamage(enemy.x, enemy.y);
                    this.triggerScreenShake(14, 7); // Sacudida fuerte al recibir daño
                    this.particles.emitBlood(player.x, player.y, 6);
                    this.addFloatingText(`-${enemyDamage}`, player.x, player.y - 0.5, '#3b82f6'); 

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
                        enemy.maxHp = ProgressionSystem.calculateMaxHp(enemy.level);
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
