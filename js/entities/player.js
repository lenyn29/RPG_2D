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
        this.sprite.onload = () => {
            this.spriteLoaded = true;
        };

        this.frameWidth = 48;  
        this.frameHeight = 48; 
        this.scale = 1.6;
        
        this.animTimer = 0;
        this.currentFrame = 0;
        this.facing = 'down'; 
        this.state = 'idle';  // 'idle', 'walk', 'attack'

        // Combate y daño
        this.isHurt = false;
        this.hurtTimer = 0;
        this.knockbackAngle = 0;
        this.isAttacking = false;
        this.attackCooldown = 0;
    }

    canMoveTo(newX, newY, mapManager, objects = [], enemies = []) {
        if (mapManager && typeof mapManager.isWalkable === 'function') {
            if (!mapManager.isWalkable(newX, newY)) return false;
        }

        if (objects && Array.isArray(objects)) {
            for (let obj of objects) {
                const dx = newX - obj.x;
                const dy = newY - obj.y;
                if (Math.sqrt(dx * dx + dy * dy) < (this.radius + obj.radius)) {
                    return false;
                }
            }
        }

        if (enemies && Array.isArray(enemies)) {
            for (let enemy of enemies) {
                if (enemy.state === 'dead') continue;
                const dx = newX - enemy.x;
                const dy = newY - enemy.y;
                if (Math.sqrt(dx * dx + dy * dy) < (this.radius + enemy.radius)) {
                    return false;
                }
            }
        }
        return true;
    }

    takeDamage(attackerX, attackerY) {
        if (this.isHurt) return;
        this.isHurt = true;
        this.hurtTimer = 25;
        this.knockbackAngle = Math.atan2(this.y - attackerY, this.x - attackerX);
    }

    // Ejecutar ataque contra los enemigos cercanos
    performAttack(enemies = []) {
        if (this.isAttacking || this.attackCooldown > 0 || this.isHurt) return;

        this.isAttacking = true;
        this.state = 'attack';
        this.currentFrame = 0;
        this.animTimer = 0;
        this.attackCooldown = 40; // Frames de espera entre ataques

        const attackRange = 1.2; // Radio de alcance del golpe del héroe

        enemies.forEach(enemy => {
            if (enemy.state === 'dead') return;
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= attackRange) {
                // Aplicar daño y retroceso al slime
                enemy.applyDamage(this.x, this.y);
            }
        });
    }

    update(inputManager, mapManager, objects = [], enemies = []) {
        if (this.attackCooldown > 0) this.attackCooldown--;

        // Comprobar si se pulsó el botón de ataque táctil
        if (inputManager.isAttackTriggered()) {
            this.performAttack(enemies);
        }

        if (this.isHurt) {
            const kbSpeed = 0.04;
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

        // Si está ejecutando la animación de ataque, bloquea movimiento momentáneamente
        if (this.isAttacking) {
            this.animTimer += 0.25;
            if (this.animTimer >= 1) {
                this.currentFrame++;
                if (this.currentFrame >= 6) { // Asumiendo 6 frames de ataque en el sprite del player
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

            if (this.canMoveTo(this.x + mX, this.y, mapManager, objects, enemies)) {
                this.x += mX;
            }
            if (this.canMoveTo(this.x, this.y + mY, mapManager, objects, enemies)) {
                this.y += mY;
            }

            let angle = Math.atan2(move.x, -move.y) * (180 / Math.PI);
            if (angle < 0) angle += 360;

            if (angle >= 330 || angle <= 30) {
                this.facing = 'up';
            } else if (angle > 30 && angle < 150) {
                this.facing = 'right';
            } else if (angle >= 150 && angle <= 210) {
                this.facing = 'down';
            } else {
                this.facing = 'left';
            }

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

        if (this.isHurt && Math.floor(this.hurtTimer / 3) % 2 === 0) {
            return; 
        }

        if (this.spriteLoaded && this.sprite.complete) {
            let row = 0;
            const currentState = this.isHurt ? 'idle' : this.state;

            if (currentState === 'idle') {
                if (this.facing === 'down') row = 0;
                else if (this.facing === 'right' || this.facing === 'left') row = 1;
                else if (this.facing === 'up') row = 2;
            } else if (currentState === 'walk') {
                if (this.facing === 'down') row = 3;
                else if (this.facing === 'right' || this.facing === 'left') row = 4;
                else if (this.facing === 'up') row = 5;
            } else if (currentState === 'attack') {
                // Fila de ataque en tu sprite sheet (ajusta si tu sprite tiene fila específica de ataque)
                row = this.facing === 'up' ? 5 : (this.facing === 'down' ? 3 : 4); 
            }

            const safeFrame = this.currentFrame % 6;
            const sx = safeFrame * this.frameWidth;
            const sy = row * this.frameHeight;

            const drawWidth = this.frameWidth * this.scale;
            const drawHeight = this.frameHeight * this.scale;

            ctx.save();
            if (this.facing === 'left') {
                ctx.translate(renderX, renderY);
                ctx.scale(-1, 1);
                ctx.drawImage(
                    this.sprite,
                    sx, sy, this.frameWidth, this.frameHeight,
                    -drawWidth / 2, -drawHeight + (Iso.tileHeight / 2),
                    drawWidth, drawHeight
                );
            } else {
                ctx.drawImage(
                    this.sprite,
                    sx, sy, this.frameWidth, this.frameHeight,
                    renderX - drawWidth / 2, renderY - drawHeight + (Iso.tileHeight / 2),
                    drawWidth, drawHeight
                );
            }
            ctx.restore();
        } else {
            ctx.fillStyle = '#00F0FF';
            ctx.beginPath();
            ctx.arc(renderX, renderY - 15, 12, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
