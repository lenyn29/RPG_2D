respawnAtSanctuary() {
        this.x = this.startX;
        this.y = this.startY;
        this.maxHp = ProgressionSystem.calculateMaxHp(this.level);
        this.hp = this.maxHp;
        this.state = 'idle';
        this.deathCounter = 0;
        this.showRestartButton = false;
        this.currentFrame = 0;
        this.animTimer = 0;
    }
