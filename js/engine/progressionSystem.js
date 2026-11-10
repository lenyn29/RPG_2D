export class ProgressionSystem {
    // Calcular HP máximo basado en el nivel
    static calculateMaxHp(level) {
        // Nivel 1 = 10 HP. Cada nivel posterior aumenta de 3 a 5 HP (usaremos un promedio de 4 por nivel)
        if (level <= 1) return 10;
        return 10 + (level - 1) * 4;
    }

    // Calcular Daño de ataque basado en el nivel
    static calculateDamage(level) {
        // Nivel 1 = 1 de daño. Cada nivel posterior incrementa entre 0.5 y 2 (usaremos 1 por nivel)
        if (level <= 1) return 1.0;
        return 1.0 + (level - 1) * 1.0;
    }

    // Calcular XP requerida para subir al siguiente nivel
    static calculateXpNeeded(level) {
        return level * 100; // 100 XP por nivel actual para pasar al siguiente
    }
}
