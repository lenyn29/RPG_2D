export class ProgressionSystem {
    // HP máximo escalado por nivel
    static calculateMaxHp(level) {
        if (level <= 1) return 10;
        return 10 + (level - 1) * 4;
    }

    // Daño escalado por nivel
    static calculateDamage(level) {
        if (level <= 1) return 1.0;
        return 1.0 + (level - 1) * 1.0;
    }

    // XP necesaria para subir de nivel (Aumenta un 20% cada vez que sube)
    static calculateXpNeeded(level) {
        let baseExp = 100;
        for (let i = 1; i < level; i++) {
            baseExp *= 1.20; // Incremento del 20% por nivel
        }
        return Math.floor(baseExp);
    }

    // XP que otorga un enemigo al morir (Nivel 1 = 10, Nivel 2 = 20, Nivel 3 = 30...)
    static getEnemyXpReward(enemyLevel) {
        return enemyLevel * 10;
    }
}
