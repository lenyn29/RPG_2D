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
                enemy.hp -= 1; // 1 punto de daño estricto
                enemy.applyDamage(player.x, player.y);
                this.particles.emitBlood(enemy.x, enemy.y, 6);

                if (enemy.hp <= 0) {
                    enemy.hp = 0;
                    enemy.state = 'dead';
                    enemy.currentFrame = 0;
                    enemy.animTimer = 0;
                    enemy.respawnTimer = 600; // 10 segundos para respawn
                }
            }
        });
    }

    processEnemyAttacks(player, enemies) {
        if (player.state === 'dead') return;

        enemies.forEach(enemy => {
            if (enemy.state === 'dead') return;

            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (enemy.state === 'attack' && dist <= 0.8) {
                if (!player.isHurt && player.invincibleFrames <= 0) {
                    player.hp -= 1; // 1 punto de daño al héroe
                    player.takeDamage(enemy.x, enemy.y);
                    this.particles.emitBlood(player.x, player.y, 6);

                    if (player.hp <= 0) {
                        player.hp = 0;
                        player.state = 'dead';
                        player.currentFrame = 0;
                        player.animTimer = 0;
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
                        enemy.hp = 10;
                        enemy.state = 'idle';
                        enemy.currentFrame = 0;
                    }
                }
            }
        });
    }
}
