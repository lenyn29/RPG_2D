import { Iso } from '../engine/isometric.js';
import { ProgressionSystem } from '../engine/progressionSystem.js';

export class Player {
    constructor(startX, startY) {
        this.startX = startX; // Guardar punto de reaparición inicial
        this.startY = startY;
        this.x = startX; 
        this.y = startY; 
        this.speed = 0.052; 
        this.radius = 0.35; 
        
        this.sprite = new Image();
        this.sprite.src = 'assets/player.png';
        this.spriteLoaded = false;
        this.sprite.onload = () => { this.spriteLoaded = true; };

        this.frameWidth = 48;  
        this.frameHeight = 48; 
        this.scale = 1.6;
        
        this.animTimer = 0;
        this.currentFrame = 0;
        this.facing = 'down'; 
        this.state = 'idle';  

        this.name = "Doruk";
        this.level = 1;
        this.xp = 0;
        this.maxXp = ProgressionSystem.calculateXpNeeded(this.level);
        
        this.maxHp = ProgressionSystem.calculateMaxHp(this.level);
        this.hp = this.maxHp;
        this.attackPower = ProgressionSystem.calculateDamage(this.level);
        
        this.isHurt = false;
        this.hurtTimer = 0;
        this.invincibleFrames = 0;
        this.knockbackAngle = 0;
        
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.hasDealtDamageThisAttack = false;

        this.deathCounter = 0;
        this.showRestartButton = false;
        this.outOfCombatTimer = 0;

        this.levelUpFlash = {
            active: false,
            timer: 0,
            text: ""
        };
    }

    // Método para revivir al héroe en el santuario mágico con vida plena
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

    gainXp(amount, particleSystem = null, canvasWidth = 0, canvasHeight = 0) {
        this.xp += amount;
        if (this.xp >= this.maxXp) {
            this.levelUp(particleSystem, canvasWidth, canvasHeight);
        }
    }

    levelUp(particleSystem, canvasWidth, canvasHeight) {
        this.level++;
        this.xp = 0;
        this.maxXp = ProgressionSystem.calculateXpNeeded(this.level);
        
        this.maxHp = ProgressionSystem.calculateMaxHp(this.level);
        const healAmount = this.maxHp * 0.20; 
        this.hp = Math.min(this.maxHp, this.hp + healAmount);
        this.attackPower = ProgressionSystem.calculateDamage(this.level);

        this.levelUpFlash = {
            active: true,
            timer: 75,
            text: `⬆️ Lv ${this.level}!`
        };

        if (particleSystem && canvasWidth && canvasHeight) {
            particleSystem.emitConfetti(canvasWidth, canvasHeight);
        }
    }

    canMoveTo(newX, newY, mapManager, objects = [], enemies = []) {
        if (this.state === 'dead') return false;
        if (mapManager && typeof mapManager.isWalkable === 'function') {
            if (!mapManager.isWalkable(newX, newY)) return false;
        }

        if (objects && Array.isArray(objects)) {
            for (let obj of objects) {
                const dx = newX - obj.x;
                const dy = newY - obj.y;
                if (Math.sqrt(dx * dx + dy * dy) < (this.radius + obj.radius)) return false;
            }
        }

        if (enemies && Array.isArray(enemies)) {
            for (let enemy of enemies) {
                if (enemy.state === 'dead') continue;
                const dx = newX - enemy.x;
                const dy = newY - enemy.y;
                if (Math.sqrt(dx * dx + dy * dy) < (this.radius + enemy.radius)) return false;
            }
        }
        return true;
    }

    takeDamage(attackerX, attackerY) {
        if (this.invincibleFrames > 0 || this.state === 'dead') return;
        
        this.isHurt = true;
        this.hurtTimer = 20;
        this.invincibleFrames = 40;
        this.knockbackAngle = Math.atan2(this.y - attackerY, this.x - attackerX);
        this.outOfCombatTimer = 0;
    }

    performAttack() {
        if (this.isAttacking || this.attackCooldown > 0 || this.isHurt || this.state === 'dead') return;

        this.isAttacking = true;
        this.state = 'attack';
        this.currentFrame = 0;
        this.animTimer = 0;
        this.attackCooldown = 40; 
        this.hasDealtDamageThisAttack = false; 
    }

    update(inputManager, mapManager, objects = [], enemies = [], dt = 1) {
        if (this.levelUpFlash.active) {
            this.levelUpFlash.timer -= dt;
            if (this.levelUpFlash.timer <= 0) this.levelUpFlash.active = false;
        }

        // Sanación activa en el Santuario Mágico (si está sobre las coordenadas de inicio)
        const distToSanctuary = Math.sqrt(Math.pow(this.x - this.startX, 2) + Math.pow(this.y - this.startY, 2));
        if (distToSanctuary < 1.5 && this.hp < this.maxHp && this.state !== 'dead') {
            // Curación acelerada del 2% de HP por segundo dentro del santuario
            this.hp = Math.min(this.maxHp, this.hp + ((this.maxHp * 0.02) / 60) * dt);
        }

        if (this.state === 'dead') {
            this.animTimer += 0.05 * dt;
            if (this.animTimer >= 1) {
                this.currentFrame++;
                if (this.currentFrame >= 5) this.currentFrame = 4;
                this.animTimer = 0;
            }
            this.deathCounter += dt;
            if (this.deathCounter >= 300) this.showRestartButton = true;
            return;
        }

        if (this.hp < this.maxHp) {
            if (this.outOfCombatTimer < 180) {
                this.outOfCombatTimer += dt;
            } else {
                this.hp = Math.min(this.maxHp, this.hp + ((0.3 / 60) * dt));
            }
        }

        if (this.attackCooldown > 0) this.attackCooldown -= dt;
        if (this.invincibleFrames > 0) this.invincibleFrames -= dt;

        if (inputManager.isAttackTriggered()) {
            this.performAttack();
        }

        if (this.isHurt) {
            const kbSpeed = 0.035 * dt;
            const nextX = this.x + Math.cos(this.knockbackAngle) * kbSpeed;
            const nextY = this.y + Math.sin(this.knockbackAngle) * kbSpeed;

            if (this.canMoveTo(nextX, nextY, mapManager, objects, enemies)) {
                this.x = nextX;
                this.y = nextY;
            }

            this.hurtTimer -= dt;
            if (this.hurtTimer <= 0) this.isHurt = false;
            return;
        }

        if (this.isAttacking) {
            this.animTimer += 0.22 * dt;
            if (this.animTimer >= 1) {
                this.currentFrame++;
                if (this.currentFrame >= 4) {
                    this.isAttacking = false;
                    this.state = 'idle';
                    this.currentFrame = 0;
                    this.hasDealtDamageThisAttack = false;
                }
                this.animTimer = 0;
            }
            return;
        }

        const move = inputManager.getMovementVector();

        if (move.x !== 0 || move.y !== 0) {
            this.state = 'walk';
            
            const joyLen = Math.sqrt(move.x * move.x + move.y * move.y);
            const joyX = joyLen > 0 ? move.x / joyLen : 0;
            const joyY = joyLen > 0 ? move.y / joyLen : 0;

            const targetDx = joyX + joyY;
            const targetDy = joyY - joyX;

            const worldLen = Math.sqrt(targetDx * targetDx + targetDy * targetDy);
            const moveSpeed = this.speed * dt;
            const mX = worldLen > 0 ? (targetDx / worldLen) * moveSpeed : 0;
            const mY = worldLen > 0 ? (targetDy / worldLen) * moveSpeed : 0;

            if (this.canMoveTo(this.x + mX, this.y, mapManager, objects, enemies)) this.x += mX;
            if (this.canMoveTo(this.x, this.y + mY, mapManager, objects, enemies)) this.y += mY;

            let angle = Math.atan2(move.x, -move.y) * (180 / Math.PI);
            if (angle < 0) angle += 360;

            if (angle >= 330 || angle <= 30) this.facing = 'up';
            else if (angle > 30 && angle < 150) this.facing = 'right';
            else if (angle >= 150 && angle <= 210) this.facing = 'down';
            else this.facing = 'left';

            this.animTimer += 0.25 * dt;
            if (this.animTimer >= 1) {
                this.currentFrame = (this.currentFrame + 1) % 6;
                this.animTimer = 0;
            }
        } else {
            this.state = 'idle';
            this.animTimer += 0.1 * dt;
            if (this.animTimer >= 1) {
                this.currentFrame = (this.currentFrame + 1) % 6;
                this.animTimer = 0;
            }
        }
    }

    draw(ctx, cameraOffsetX, cameraOffsetY) {
        const screen = Iso.toScreen(this.x, this.y);
        const renderX = screen.x + cameraOffsetX;
        const renderY = screen.y + cameraOffsetY;

        const isFadedOut = (this.state === 'dead' && this.deathCounter >= 300);

        if (this.state === 'dead') {
            ctx.fillStyle = 'rgba(185, 28, 28, 0.7)';
            ctx.beginPath();
            ctx.ellipse(renderX, renderY + 4, Iso.tileWidth / 2.5, Iso.tileHeight / 3.5, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
            ctx.beginPath();
            ctx.ellipse(renderX, renderY + 2, Iso.tileWidth / 2.8, Iso.tileHeight / 3.8, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        if (this.invincibleFrames > 0 && Math.floor(this.invincibleFrames / 3) % 2 === 0 && this.state !== 'dead') {
            return; 
        }

        if (!isFadedOut && this.spriteLoaded && this.sprite.complete) {
            let row = 0;
            let maxFrames = 6;
            const currentState = this.state;

            if (currentState === 'dead') {
                row = 9; maxFrames = 5;
            } else if (currentState === 'idle') {
                row = this.facing === 'down' ? 0 : (this.facing === 'up' ? 2 : 1);
            } else if (currentState === 'walk') {
                row = this.facing === 'down' ? 3 : (this.facing === 'up' ? 5 : 4);
            } else if (currentState === 'attack') {
                row = this.facing === 'down' ? 6 : (this.facing === 'up' ? 8 : 7);
                maxFrames = 4;
            }

            const safeFrame = this.currentFrame % maxFrames;
            const sx = safeFrame * this.frameWidth;
            const sy = row * this.frameHeight;

            const drawWidth = this.frameWidth * this.scale;
            const drawHeight = this.frameHeight * this.scale;

            ctx.save();
            if (this.facing === 'left') {
                ctx.translate(renderX, renderY);
                ctx.scale(-1, 1);
                ctx.drawImage(this.sprite, sx, sy, this.frameWidth, this.frameHeight, -drawWidth / 2, -drawHeight + (Iso.tileHeight / 2), drawWidth, drawHeight);
            } else {
                ctx.drawImage(this.sprite, sx, sy, this.frameWidth, this.frameHeight, renderX - drawWidth / 2, renderY - drawHeight + (Iso.tileHeight / 2), drawWidth, drawHeight);
            }
            ctx.restore();
        } else if (!isFadedOut) {
            ctx.fillStyle = '#00F0FF';
            ctx.beginPath();
            ctx.arc(renderX, renderY - 15, 12, 0, Math.PI * 2);
            ctx.fill();
        }

        if (this.state !== 'dead') {
            this.drawInfoBox(ctx, renderX, renderY - 60);

            if (this.levelUpFlash.active) {
                ctx.save();
                ctx.fillStyle = '#eab308';
                ctx.font = 'bold 13px sans-serif';
                ctx.textAlign = 'center';
                ctx.shadowColor = '#000000';
                ctx.shadowBlur = 4;
                const offsetY = -75 - ((75 - this.levelUpFlash.timer) * 0.2);
                ctx.fillText(this.levelUpFlash.text, renderX, renderY + offsetY);
                ctx.restore();
            }
        }
    }

    drawInfoBox(ctx, x, y) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.name} lv ${this.level}`, x, y);

        const barWidth = 42;
        const barHeight = 5;
        const barY = y + 6;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(x - barWidth / 2, barY, barWidth, barHeight);
        const hpRatio = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(x - barWidth / 2, barY, barWidth * hpRatio, barHeight);

        const xpY = barY + 7;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(x - barWidth / 2, xpY, barWidth, 3);
        const xpRatio = Math.max(0, this.xp / this.maxXp);
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(x - barWidth / 2, xpY, barWidth * xpRatio, 3);
    }
}
