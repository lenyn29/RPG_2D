export class ProgressionSystem {
    // HP máximo: Nivel 1 = 12 HP. Escala con +5 por nivel (crecimiento constante pero desafiante)
    static calculateMaxHp(level) {
        if (level <= 1) return 12;
        return 12 + (level - 1) * 5;
    }

    // Daño de ataque: Nivel 1 = 1.5. Escala +0.8 por nivel
    static calculateDamage(level) {
        if (level <= 1) return 1.5;
        return 1.5 + (level - 1) * 0.8;
    }

    // Curva de XP Exponencial: Aumenta un 25% por nivel para alargar el ciclo de avance
    static calculateXpNeeded(level) {
        let baseExp = 80;
        for (let i = 1; i < level; i++) {
            baseExp *= 1.25;
        }
        return Math.floor(baseExp);
    }

    // Recompensa de XP por Slime: Nivel 1 = 20 XP, aumentando 50% por nivel
    static getEnemyXpReward(enemyLevel) {
        let xp = 20;
        for (let i = 1; i < enemyLevel; i++) {
            xp += xp * 0.5;
        }
        return Math.floor(xp);
    }

    // HP y Daño específico para Enemigos según su nivel en el mundo
    static getEnemyStats(level) {
        let hp = 10 + (level - 1) * 6; // Nivel 1 = 10 HP, Nivel 2 = 16, Nivel 3 = 22
        let damage = 1.0 + (level - 1) * 0.6; // Nivel 1 = 1.0, Nivel 2 = 1.6, Nivel 3 = 2.2
        return { hp, damage };
    }
}
