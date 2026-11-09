import { Iso } from '../engine/isometric.js';

export class Enemy {
    constructor(startX, startY, type = 'slime', level = 1) {
        this.spawnX = startX; // Posición fija de respawn original
        this.spawnY = startY;
        this.x = startX;
        this.y = startY;
        this.type = type;
        this.level = level; // Nivel del enemigo (ej. Slime lv 2)
        this.speed = 0.018; 
        this.radius = 0.35; 
        
        this.sprite = new Image();
        this.sprite.src = 'assets/slime.png';
        this.spriteLoaded = false;
        this.sprite.onload = () => { this.spriteLoaded = true; };

        this.frameWidth = 32;
        this.frameHeight = 32;
        this.scale = 1.6;

        this.name = `Slime lv ${this.level}`;
        this.maxHp = 10;
        this.hp = 10;
        this.respawnTimer = 0; 
        this.fadeTimer = 0; // Temporizador para desvanecer el cuerpo (3s)

        this.animTimer = 0;
        this.currentFrame = 0;
        this.facing = 'down'; 
        this.state = 'idle';  // 'idle', 'walk', 'attack', 'hurt', 'flee', 'dead'
        
        this.changeDirTimer = 0;
        this.moveAngle = Math.random() * Math.PI * 2;
        this.attackCooldown = 0;
    }

    canMoveTo(newX, newY, mapManager, objects = [], player = null) {
        if (mapManager && !mapManager.isWalkable(newX, newY)) return false;

        for (let obj of objects) {
            const dx = newX - obj.x;
            const dy = newY - obj.y;
            if (Math.sqrt(dx * dx + dy * dy) < (this.radius + obj.radius)) return false;
        }

        if (player && player.state !== 'dead') {
            const dx = newX - player.x;
            const dy = newY - player.y;
            if (Math.sqrt(dx * dx + dy * dy) < (this.radius + player.radius)) return false;
        }

        return true;
    }

    applyDamage(sourceX, sourceY) {
        if (this.state === 'dead') return;
        this.state = 'hurt';
        this.currentFrame = 0;
        this.animTimer = 0;
        this.moveAngle = Math.atan2(this.y - sourceY, this.x - sourceX);
    }

    update(mapManager, objects = [], player = null) {
        if (this.state === 'dead') {
            this.animTimer += 0.05;
            if (this.animTimer >= 1) {
                this.currentFrame++;
                if (this.currentFrame >= 5) {
                    this.currentFrame = 4;
                    if (this.fadeTimer < 180) this.fadeTimer++; // Desvanecer cuerpo a los 3s
                }
                this.animTimer = 0;
            }
            return;
        }

        if (this.attackCooldown > 0) this.attackCooldown--;

        let targetDist = 999;
        let pdx = 0;
        let pdy = 0;

        if (player && player.state !== 'dead') {
            pdx = player.x - this.x;
            pdy = player.y - this.y;
            targetDist = Math.sqrt(pdx * pdx + pdy * pdy);
        }

        // --- PERSONALIDAD E INTELIGENCIA ARTIFICIAL ---
        // 1. Instinto de huida si la vida baja del 50%
        if (this.hp < (this.maxHp / 2)) {
            this.state = 'flee';
        }

        // 2. Si el héroe tiene mayor nivel, el slime lo ignora por completo
        const playerIsHigherLevel = player && (player.level > this.level);

        if (this.state === 'flee' && player) {
            // Huir en dirección contraria al jugador
            const fleeAngle = Math.atan2(this.y - player.y, this.x - player.x);
            const nextX = this.x + Math.cos(fleeAngle) * (this.speed * 1.2);
            const nextY = this.y + Math.sin(fleeAngle) * (this.speed * 1.2);
            if (this.canMoveTo(nextX, nextY, mapManager, objects, player)) {
                this.x = nextX;
                this.y = nextY;
            }
            this.updateFacing(fleeAngle);
        } else if (this.state === 'hurt') {
            const pushBackSpeed = 0.03;
            const nextX = this.x - Math.cos(this.moveAngle) * pushBackSpeed;
            const nextY = this.y - Math.sin(this.moveAngle) * pushBackSpeed;
            if (this.canMoveTo(nextX, nextY, mapManager, objects, player)) {
                this.x = nextX;
                this.y = nextY;
            }
        } else if (this.state === 'attack') {
            const lungeSpeed = 0.045;
            const angleToPlayer = player ? Math.atan2(pdy, pdx) : this.moveAngle;
            const nextX = this.x + Math.cos(angleToPlayer) * lungeSpeed;
            const nextY = this.y + Math.sin(angleToPlayer) * lungeSpeed;
            
            if (this.canMoveTo(nextX, nextY, mapManager, objects, player)) {
                this.x = nextX;
                this.y = nextY;
            }
        } else if (player && player.state !== 'dead' && !playerIsHigherLevel && targetDist < 0.9 && this.attackCooldown === 0) {
            // Solo ataca si está DEMASIADO CERCA (distancia < 0.9) y el héroe no es de mayor nivel
            this.state = 'attack';
            this.currentFrame = 0;
            this.animTimer = 0;
            this.attackCooldown = 90;
        } else if (player && player.state !== 'dead' && !playerIsHigherLevel && targetDist < 3.5) {
            // Persigue solo si estás cerca y tienes nivel igual o menor
            this.state = 'walk';
            const angleToPlayer = Math.atan2(pdy, pdx);
            const nextX = this.x + Math.cos(angleToPlayer) * this.speed;
            const nextY = this.y + Math.sin(angleToPlayer) * this.speed;

            if (this.canMoveTo(nextX, nextY, mapManager, objects, player)) {
                this.x = nextX;
                this.y = nextY;
            }
            this.updateFacing(angleToPlayer);
        } else {
            // Patrulla errante normal
            this.changeDirTimer += 0.02;
            if (this.changeDirTimer > 3) {
                this.moveAngle = Math.random() * Math.PI * 2;
                this.changeDirTimer = 0;
                this.state = Math.random() > 0.4 ? 'walk' : 'idle';
            }

            if (this.state === 'walk') {
                const nextX = this.x + Math.cos(this.moveAngle) * (this.speed * 0.6);
                const nextY = this.y + Math.sin(this.moveAngle) * (this.speed * 0.6);
                
                if (this.canMoveTo(nextX, nextY, mapManager, objects, player)) {
                    this.x = nextX;
                    this.y = nextY;
                }
                this.updateFacing(this.moveAngle);
            }
        }

        let maxFrames = 4;
        let animSpeed = 0.12;

        if (this.state === 'idle') { maxFrames = 4; animSpeed = 0.1; }
        else if (this.state === 'walk' || this.state === 'flee') { maxFrames = 6; animSpeed = 0.18; }
        else if (this.state === 'attack') { maxFrames = 7; animSpeed = 0.22; }
        else if (this.state === 'hurt') { maxFrames = 3; animSpeed = 0.15; }

        this.animTimer += animSpeed;
        if (this.animTimer >= 1) {
            this.currentFrame++;
            if (this.currentFrame >= maxFrames) {
                if (this.state === 'attack' || this.state === 'hurt') {
                    this.state = 'idle';
                    this.currentFrame = 0;
                } else {
                    this.currentFrame = 0;
                }
            }
            this.animTimer = 0;
        }
    }

    updateFacing(angle) {
        if (Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle))) {
            this.facing = Math.cos(angle) > 0 ? 'right' : 'left';
        } else {
            this.facing = Math.sin(angle) > 0 ? 'down' : 'up';
        }
    }

    draw(ctx, cameraOffsetX, cameraOffsetY) {
        const screen = Iso.toScreen(this.x, this.y);
        const renderX = screen.x + cameraOffsetX;
        const renderY = screen.y + cameraOffsetY;

        const isFadedOut = (this.state === 'dead' && this.fadeTimer >= 180);

        // Charco de sangre al morir
        if (this.state === 'dead') {
            ctx.fillStyle = 'rgba(185, 28, 28, 0.7)';
            ctx.beginPath();
            ctx.ellipse(renderX, renderY + 4, Iso.tileWidth / 2.8, Iso.tileHeight / 3.8, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.beginPath();
            ctx.ellipse(renderX, renderY + 2, Iso.tileWidth / 3.2, Iso.tileHeight / 4.2, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        if (!isFadedOut && this.spriteLoaded && this.sprite.complete) {
            let row = 0;
            let maxFrames = 6;

            if (this.state === 'dead') {
                row = 12; 
                maxFrames = 5;
            } else if (this.state === 'idle') {
                if (this.facing === 'down') row = 0;
                else if (this.facing === 'right' || this.facing === 'left') row = 1;
                else if (this.facing === 'up') row = 2;
            } else if (this.state === 'walk' || this.state === 'flee') {
                if (this.facing === 'down') row = 3;
                else if (this.facing === 'right' || this.facing === 'left') row = 4;
                else if (this.facing === 'up') row = 5;
            } else if (this.state === 'attack') {
                if (this.facing === 'down') row = 6;
                else if (this.facing === 'right' || this.facing === 'left') row = 7;
                else if (this.facing === 'up') row = 8;
            } else if (this.state === 'hurt') {
                if (this.facing === 'down') row = 9;
                else if (this.facing === 'right' || this.facing === 'left') row = 10;
                else if (this.facing === 'up') row = 11;
            }

            const safeFrame = this.currentFrame % maxFrames;
            const sx = safeFrame * this.frameWidth;
            const sy = row * this.frameHeight;

            const drawWidth = this.frameWidth * this.scale;
            const drawHeight = this.frameHeight * this.scale;

            ctx.save();
            if (this.facing === 'left' && this.state !== 'dead') {
                ctx.translate(renderX, renderY);
                ctx.scale(-1, 1);
                ctx.drawImage(this.sprite, sx, sy, this.frameWidth, this.frameHeight, -drawWidth / 2, -drawHeight + (Iso.tileHeight / 2), drawWidth, drawHeight);
            } else {
                ctx.drawImage(this.sprite, sx, sy, this.frameWidth, this.frameHeight, renderX - drawWidth / 2, renderY - drawHeight + (Iso.tileHeight / 2), drawWidth, drawHeight);
            }
            ctx.restore();
        } else if (!isFadedOut) {
            ctx.fillStyle = '#10B981';
            ctx.beginPath();
            ctx.arc(renderX, renderY - 10, 10, 0, Math.PI * 2);
            ctx.fill();
        }

        if (this.state !== 'dead') {
            this.drawInfoBox(ctx, renderX, renderY - 45);
        }
    }

    drawInfoBox(ctx, x, y) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, x, y);

        const barWidth = 32;
        const barHeight = 4;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(x - barWidth / 2, y + 3, barWidth, barHeight);

        const hpRatio = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(x - barWidth / 2, y + 3, barWidth * hpRatio, barHeight);
    }
}
