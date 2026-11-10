import { Iso } from '../engine/isometric.js';
import { ProgressionSystem } from '../engine/progressionSystem.js';

export class Enemy {
    constructor(startX, startY, type = 'slime', level = 1) {
        this.spawnX = startX; 
        this.spawnY = startY;
        this.x = startX;
        this.y = startY;
        this.type = type;
        this.level = level; 
        this.speed = 0.016 + (level * 0.002); // Los slimes de mayor nivel son ligeramente más ágiles
        this.radius = 0.35; 
        
        this.sprite = new Image();
        this.sprite.src = 'assets/slime.png';
        this.spriteLoaded = false;
        this.sprite.onload = () => { this.spriteLoaded = true; };

        this.frameWidth = 32;
        this.frameHeight = 32;
        this.scale = 1.6;

        this.name = `Slime lv ${this.level}`;
        const stats = ProgressionSystem.getEnemyStats(this.level);
        this.maxHp = stats.hp;
        this.hp = this.maxHp;
        this.attackPower = stats.damage;

        this.respawnTimer = 0; 
        this.fadeTimer = 0; 
        this.fleeTimer = 0; 
        this.wasAttacked = false; 

        this.animTimer = 0;
        this.currentFrame = 0;
        this.facing = 'down'; 
        this.state = 'idle';  
        
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
        this.fleeTimer = 0; 
        this.wasAttacked = true; // ¡Despierta su furia si el héroe lo ataca!
        this.moveAngle = Math.atan2(this.y - sourceY, this.x - sourceX);
    }

    update(mapManager, objects = [], player = null, dt = 1) {
        if (this.state === 'dead') {
            this.animTimer += 0.05 * dt;
            if (this.animTimer >= 1) {
                this.currentFrame++;
                if (this.currentFrame >= 5) {
                    this.currentFrame = 4;
                    if (this.fadeTimer < 180) this.fadeTimer++;
                }
                this.animTimer = 0;
            }
            return;
        }

        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        let targetDist = 999;
        let pdx = 0;
        let pdy = 0;

        if (player && player.state !== 'dead') {
            pdx = player.x - this.x;
            pdy = player.y - this.y;
            targetDist = Math.sqrt(pdx * pdx + pdy * pdy);
        }

        // Huida táctica si baja del 30% de vida
        const fleeThreshold = this.maxHp * 0.30;
        if (this.hp < fleeThreshold) {
            this.state = 'flee';
            // Tras 3s de huida ininterrumpida, regenera 0.3 HP por segundo
            if (this.fleeTimer < 180) {
                this.fleeTimer += dt;
            } else {
                this.hp = Math.min(fleeThreshold, this.hp + ((0.3 / 60) * dt));
            }
        } else {
            this.fleeTimer = 0;
        }

        // Si el héroe es de mayor nivel, el slime lo respeta y no lo persigue (a menos que haya sido atacado)
        const playerIsHigherLevel = player && (player.level > this.level) && !this.wasAttacked;

        if (this.state === 'flee' && player) {
            const fleeAngle = Math.atan2(this.y - player.y, this.x - player.x);
            const moveSpeed = (this.speed * 1.3) * dt;
            const nextX = this.x + Math.cos(fleeAngle) * moveSpeed;
            const nextY = this.y + Math.sin(fleeAngle) * moveSpeed;
            if (this.canMoveTo(nextX, nextY, mapManager, objects, player)) {
                this.x = nextX;
                this.y = nextY;
            }
            this.updateFacing(fleeAngle);
        } else if (this.state === 'hurt') {
            const pushBackSpeed = 0.03 * dt;
            const nextX = this.x - Math.cos(this.moveAngle) * pushBackSpeed;
            const nextY = this.y - Math.sin(this.moveAngle) * pushBackSpeed;
            if (this.canMoveTo(nextX, nextY, mapManager, objects, player)) {
                this.x = nextX;
                this.y = nextY;
            }
        } else if (this.state === 'attack') {
            const lungeSpeed = 0.045 * dt;
            const angleToPlayer = player ? Math.atan2(pdy, pdx) : this.moveAngle;
            const nextX = this.x + Math.cos(angleToPlayer) * lungeSpeed;
            const nextY = this.y + Math.sin(angleToPlayer) * lungeSpeed;
            
            if (this.canMoveTo(nextX, nextY, mapManager, objects, player)) {
                this.x = nextX;
                this.y = nextY;
            }
        } else if (player && player.state !== 'dead' && !playerIsHigherLevel && targetDist < 0.9 && this.attackCooldown <= 0) {
            this.state = 'attack';
            this.currentFrame = 0;
            this.animTimer = 0;
            this.attackCooldown = 80;
        } else if (player && player.state !== 'dead' && !playerIsHigherLevel && targetDist < 3.8) {
            this.state = 'walk';
            const angleToPlayer = Math.atan2(pdy, pdx);
            const moveSpeed = this.speed * dt;
            const nextX = this.x + Math.cos(angleToPlayer) * moveSpeed;
            const nextY = this.y + Math.sin(angleToPlayer) * moveSpeed;

            if (this.canMoveTo(nextX, nextY, mapManager, objects, player)) {
                this.x = nextX;
                this.y = nextY;
            }
            this.updateFacing(angleToPlayer);
        } else {
            this.changeDirTimer += 0.02 * dt;
            if (this.changeDirTimer > 3) {
                this.moveAngle = Math.random() * Math.PI * 2;
                this.changeDirTimer = 0;
                this.state = Math.random() > 0.4 ? 'walk' : 'idle';
            }

            if (this.state === 'walk') {
                const moveSpeed = (this.speed * 0.6) * dt;
                const nextX = this.x + Math.cos(this.moveAngle) * moveSpeed;
                const nextY = this.y + Math.sin(this.moveAngle) * moveSpeed;
                
                if (this.canMoveTo(nextX, nextY, mapManager, objects, player)) {
                    this.x = nextX;
                    this.y = nextY;
                }
                this.updateFacing(this.moveAngle);
            }
        }

        let maxFrames = 4;
        let animSpeed = 0.12 * dt;

        if (this.state === 'idle') { maxFrames = 4; animSpeed = 0.1 * dt; }
        else if (this.state === 'walk' || this.state === 'flee') { maxFrames = 6; animSpeed = 0.18 * dt; }
        else if (this.state === 'attack') { maxFrames = 7; animSpeed = 0.22 * dt; }
        else if (this.state === 'hurt') { maxFrames = 3; animSpeed = 0.15 * dt; }

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
                row = 12; maxFrames = 5;
            } else if (this.state === 'idle') {
                row = this.facing === 'down' ? 0 : (this.facing === 'up' ? 2 : 1);
            } else if (this.state === 'walk' || this.state === 'flee') {
                row = this.facing === 'down' ? 3 : (this.facing === 'up' ? 5 : 4);
            } else if (this.state === 'attack') {
                row = this.facing === 'down' ? 6 : (this.facing === 'up' ? 8 : 7);
            } else if (this.state === 'hurt') {
                row = this.facing === 'down' ? 9 : (this.facing === 'up' ? 11 : 10);
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
            this.drawInfoBox(ctx, renderX, renderY - 48);
        }
    }

    drawInfoBox(ctx, x, y) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, x, y);

        const barWidth = 32;
        const barHeight = 4;
        const barY = y + 5;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(x - barWidth / 2, barY, barWidth, barHeight);

        const hpRatio = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(x - barWidth / 2, barY, barWidth * hpRatio, barHeight);
    }
}
