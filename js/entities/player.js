import { Iso } from '../engine/isometric.js';

export class Player {
    constructor(startX, startY) {
        this.x = startX; 
        this.y = startY; 
        this.speed = 0.055; 
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

        // Nombre, Nivel y Estadísticas (10 HP)
        this.name = "Doruk lv 1";
        this.maxHp = 10;
        this.hp = 10;
        
        this.isHurt = false;
        this.hurtTimer = 0;
        this.invincibleFrames = 0;
        this.knockbackAngle = 0;
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.deathTimer = 0; // Temporizador para reiniciar tras morir
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
    }

    performAttack() {
        if (this.isAttacking || this.attackCooldown > 0 || this.isHurt || this.state === 'dead') return;

        this.isAttacking = true;
        this.state = 'attack';
        this.currentFrame = 0;
        this.animTimer = 0;
        this.attackCooldown = 35; 
    }

    update(inputManager, mapManager, objects = [], enemies = []) {
        if (this.state === 'dead') {
            // Animación de muerte dramática y lenta (0.05 por frame)
            this.animTimer += 0.06;
            if (this.animTimer >= 1) {
                this.currentFrame++;
                if (this.currentFrame >= 5) {
                    this.currentFrame = 4; // Quedarse en el último frame
                    this.deathTimer++;
                    if (this.deathTimer > 120) { // Reiniciar juego tras 2 segundos de inercia
                        window.location.reload();
                    }
                }
                this.animTimer = 0;
            }
            return;
        }

        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.invincibleFrames > 0) this.invincibleFrames--;

        if (inputManager.isAttackTriggered()) {
            this.performAttack();
        }

        if (this.isHurt) {
            const kbSpeed = 0.035;
            const nextX = this.x + Math.cos(this.knockbackAngle) * kbSpeed;
            const nextY = this.y + Math.sin(this.knockbackAngle) * kbSpeed;

            if (this.canMoveTo(nextX, nextY, mapManager, objects, enemies)) {
                this.x = nextX;
                this.y = nextY;
            }

            this.hurtTimer--;
            if (this.hurtTimer <= 0) this.isHurt = false;
            return;
        }

        if (this.isAttacking) {
            this.animTimer += 0.2;
            if (this.animTimer >= 1) {
                this.currentFrame++;
                if (this.currentFrame >= 4) {
                    this.isAttacking = false;
                    this.state = 'idle';
                    this.currentFrame = 0;
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
            const mX = worldLen > 0 ? (targetDx / worldLen) * this.speed : 0;
            const mY = worldLen > 0 ? (targetDy / worldLen) * this.speed : 0;

            if (this.canMoveTo(this.x + mX, this.y, mapManager, objects, enemies)) this.x += mX;
            if (this.canMoveTo(this.x, this.y + mY, mapManager, objects, enemies)) this.y += mY;

            let angle = Math.atan2(move.x, -move.y) * (180 / Math.PI);
            if (angle < 0) angle += 360;

            if (angle >= 330 || angle <= 30) this.facing = 'up';
            else if (angle > 30 && angle < 150) this.facing = 'right';
            else if (angle >= 150 && angle <= 210) this.facing = 'down';
            else this.facing = 'left';

            this.animTimer += 0.25;
            if (this.animTimer >= 1) {
                this.currentFrame = (this.currentFrame + 1) % 6;
                this.animTimer = 0;
            }
        } else {
            this.state = 'idle';
            this.animTimer += 0.1;
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

        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(renderX, renderY + 2, Iso.tileWidth / 2.8, Iso.tileHeight / 3.8, 0, 0, Math.PI * 2);
        ctx.fill();

        if (this.invincibleFrames > 0 && Math.floor(this.invincibleFrames / 3) % 2 === 0 && this.state !== 'dead') {
            return; 
        }

        if (this.spriteLoaded && this.sprite.complete) {
            let row = 0;
            let maxFrames = 6;
            const currentState = this.state;

            if (currentState === 'dead') {
                row = 9; // Fila de muerte
                maxFrames = 5;
            } else if (currentState === 'idle') {
                if (this.facing === 'down') row = 0;
                else if (this.facing === 'right' || this.facing === 'left') row = 1;
                else if (this.facing === 'up') row = 2;
            } else if (currentState === 'walk') {
                if (this.facing === 'down') row = 3;
                else if (this.facing === 'right' || this.facing === 'left') row = 4;
                else if (this.facing === 'up') row = 5;
            } else if (currentState === 'attack') {
                if (this.facing === 'down') row = 6;
                else if (this.facing === 'right' || this.facing === 'left') row = 7;
                else if (this.facing === 'up') row = 8;
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
        } else {
            ctx.fillStyle = '#00F0FF';
            ctx.beginPath();
            ctx.arc(renderX, renderY - 15, 12, 0, Math.PI * 2);
            ctx.fill();
        }

        // Nombre y Barra de Vida del Héroe
        this.drawInfoBox(ctx, renderX, renderY - 55);
    }

    drawInfoBox(ctx, x, y) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, x, y);

        const barWidth = 42;
        const barHeight = 5;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(x - barWidth / 2, y + 3, barWidth, barHeight);

        const hpRatio = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(x - barWidth / 2, y + 3, barWidth * hpRatio, barHeight);
    }
}
