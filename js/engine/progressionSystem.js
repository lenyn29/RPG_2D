export class ProgressionSystem {
    // HP máximo escalado por nivel
    static calculateMaxHp(level) {
        if (level <= 1) return 12;
        return 12 + (level - 1) * 5;
    }

    // Daño de ataque escalado por nivel
    static calculateDamage(level) {
        if (level <= 1) return 1.5;
        return 1.5 + (level - 1) * 0.8;
    }

    // Curva de XP Requerida (Nivel 1->2 = 100 EXP, Nivel 2->3 = 250 EXP, luego +25% exponencial)
    static calculateXpNeeded(level) {
        if (level === 1) return 100;
        if (level === 2) return 250;
        
        let baseExp = 250;
        for (let i = 2; i < level; i++) {
            baseExp *= 1.25;
        }
        return Math.floor(baseExp);
    }

    // Recompensa de EXP por enemigo según su nivel y tipo base
    static getEnemyXpReward(enemyLevel) {
        if (enemyLevel <= 1) return 15; // Slime básico da 15 EXP (7-8 bajas para nivel 2)
        
        // Escalado progresivo para enemigos de mayor nivel en el mundo
        let xp = 15;
        for (let i = 1; i < enemyLevel; i++) {
            xp += xp * 0.6; // Aumento del 60% por nivel de enemigo
        }
        return Math.floor(xp);
    }

    // Estadísticas de combate base para enemigos en los chunks
    static getEnemyStats(level) {
        let hp = 10 + (level - 1) * 6; // Nivel 1 = 10 HP, Nivel 2 = 16 HP, Nivel 3 = 22 HP
        let damage = 1.0 + (level - 1) * 0.6; // Nivel 1 = 1.0, Nivel 2 = 1.6, Nivel 3 = 2.2
        return { hp, damage };
    }
}
