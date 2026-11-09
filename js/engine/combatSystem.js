export class CombatSystem {
    constructor(particleSystem) {
        this.particles = particleSystem;
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
                enemy.hp -= 1;
                enemy.applyDamage(player.x, player.y);
                this.particles.emitBlood(enemy.x, enemy.y, 6);

                if (enemy.hp <= 0) {
                    enemy.hp = 0;
                    enemy.state = 'dead';
                    enemy.currentFrame = 0;
                    enemy.animTimer = 0;
                    enemy.fadeTimer = 180; // 3 segundos antes de desvanecer el cuerpo

                    // Respawn fijo en su posición original escalado: 5 segundos por nivel (60 FPS * 5 * level)
                    const respawnFrames = enemy.level * 5 * 60;
                    enemy.respawnTimer = respawnFrames;
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
                    player.hp -= 1;
                    player.takeDamage(enemy.x, enemy.y);
                    this.particles.emitBlood(player.x, player.y, 6);

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
                        // Reaparecer exactamente en su punto de origen (spawnX, spawnY)
                        enemy.x = enemy.spawnX;
                        enemy.y = enemy.spawnY;
                        enemy.hp = enemy.maxHp;
                        enemy.state = 'idle';
                        enemy.currentFrame = 0;
                        enemy.faded = false;
                    }
                }
            }
        });
    }
}
