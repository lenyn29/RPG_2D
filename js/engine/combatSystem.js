export class CombatSystem {
    constructor() {
        // Nada de estado global complejo, gestiona interacciones en tiempo real
    }

    // Comprobar ataques del jugador a los enemigos
    processPlayerAttack(player, enemies) {
        if (!player.isAttacking) return;

        const attackRange = 1.3; // Rango de alcance del golpe
        enemies.forEach(enemy => {
            if (enemy.state === 'dead' || enemy.isHurt) return;

            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= attackRange) {
                // Aplicar 1 punto de daño al enemigo
                enemy.hp -= 1;
                enemy.applyDamage(player.x, player.y);

                if (enemy.hp <= 0) {
                    enemy.hp = 0;
                    enemy.state = 'dead';
                    enemy.currentFrame = 0;
                    enemy.animTimer = 0;
                    enemy.respawnTimer = 600; // 10 segundos a 60 FPS (600 frames)
                }
            }
        });
    }

    // Comprobar ataques de los enemigos al jugador
    processEnemyAttacks(player, enemies, mapManager, objects) {
        if (player.state === 'dead') return;

        enemies.forEach(enemy => {
            if (enemy.state === 'dead') return;

            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Si el slime está ejecutando su salto de ataque y toca al jugador
            if (enemy.state === 'attack' && dist <= 0.8) {
                if (!player.isHurt && player.invincibleFrames <= 0) {
                    player.hp -= 1; // 1 punto de daño al héroe
                    player.takeDamage(enemy.x, enemy.y);

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

    // Gestionar el respawn de enemigos muertos (cada 10 segundos)
    updateRespawns(enemies, mapManager) {
        enemies.forEach(enemy => {
            if (enemy.state === 'dead') {
                if (enemy.respawnTimer > 0) {
                    enemy.respawnTimer--;
                    if (enemy.respawnTimer <= 0) {
                        // Reaparecer al enemigo con vida llena en su posición o aleatoria cercana
                        enemy.hp = 10;
                        enemy.state = 'idle';
                        enemy.currentFrame = 0;
                        // Opcional: desplazarlo ligeramente para que no aparezca encima de algo
                    }
                }
            }
        });
    }
}
