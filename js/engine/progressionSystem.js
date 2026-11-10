export class ProgressionSystem {
    static calculateMaxHp(level) {
        if (level <= 1) return 10;
        return 10 + (level - 1) * 4;
    }

    static calculateDamage(level) {
        if (level <= 1) return 1.0;
        return 1.0 + (level - 1) * 0.5;
    }

    static calculateXpNeeded(level) {
        let baseExp = 100;
        for (let i = 1; i < level; i++) {
            baseExp *= 1.20;
        }
        return Math.floor(baseExp);
    }

    // Nivel 1 = 20 XP, aumentando la mitad (50%) por cada nivel
    static getEnemyXpReward(enemyLevel) {
        let xp = 20;
        for (let i = 1; i < enemyLevel; i++) {
            xp += xp * 0.5;
        }
        return Math.floor(xp);
    }
}
