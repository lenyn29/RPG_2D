export class ProgressionSystem {
    // 10 puntos de vida base para nivel 1
    static calculateMaxHp(level) {
        if (level <= 1) return 10;
        return 10 + (level - 1) * 4;
    }

    // 1 de daño base para nivel 1
    static calculateDamage(level) {
        if (level <= 1) return 1.0;
        return 1.0 + (level - 1) * 0.5;
    }

    // XP necesaria para subir de nivel (aumenta 20% cada vez)
    static calculateXpNeeded(level) {
        let baseExp = 100;
        for (let i = 1; i < level; i++) {
            baseExp *= 1.20;
        }
        return Math.floor(baseExp);
    }

    static getEnemyXpReward(enemyLevel) {
        return enemyLevel * 10;
    }
}
