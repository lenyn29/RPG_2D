import { Iso } from '../engine/isometric.js';

export class Enemy {
    constructor(startX, startY, type = 'slime') {
        this.x = startX;
        this.y = startY;
        this.type = type;
        this.speed = 0.02; // Velocidad base de patrulla/persecución
        this.radius = 0.35; // Radio de colisión físico
        
        // Carga de la hoja de sprites del Slime
        this.sprite = new Image();
        this.sprite.src = 'assets/slime.png';
        this.spriteLoaded = false;
        this.sprite.onload = () => {
            this.spriteLoaded = true;
        };

        // Dimensiones de 32x32 y escala 1.6x
        this.frameWidth = 32;
        this.frameHeight = 32;
        this.scale = 1.6;

        // Control de animación y estados
        this.animTimer = 0;
        this.currentFrame = 0;
        this.facing = 'down'; // 'down', 'up', 'left', 'right'
        this.state = 'idle';  // 'idle', 'walk', 'attack', 'hurt', 'dead'
        
        // IA y comportamiento de combate
        this.changeDirTimer = 0;
        this.moveAngle = Math.random() * Math.PI * 2;
        this.attackCooldown = 0;
        this.hurtTimer = 0;
    }

    update(mapManager, objects = [], player = null) {
        if (this.state === 'dead') return;

        // Reducir cooldowns
        if (this.attackCooldown > 0) this.attackCooldown--;

        let targetDist = 999;
        let pdx = 0;
        let pdy = 0;

        if (player) {
            pdx = player.x - this.x;
            pdy = player.y - this.y;
            targetDist = Math.sqrt(pdx * pdx + pdy * pdy);
        }

        // --- MÁQUINA DE ESTADOS E IA ---
        if (this.state === 'hurt') {
            // Animación de retroceso (Retrocede un poco al recibir daño)
            const pushBackSpeed = 0.03;
            const nextX = this.x - Math.cos(this.moveAngle) * pushBackSpeed;
            const nextY = this.y - Math.sin(this.moveAngle) * pushBackSpeed;
            if (mapManager && mapManager.isWalkable(nextX, nextY)) {
                this.x = nextX;
                this.y = nextY;
            }
        } else if (this.state === 'attack') {
            // Impulso hacia adelante (salto de ataque) antes de impactar
            const lungeSpeed = 0.045;
            const angleToPlayer = player ? Math.atan2(pdy, pdx) : this.moveAngle;
            const nextX = this.x + Math.cos(angleToPlayer) * lungeSpeed;
            const nextY = this.y + Math.sin(angleToPlayer) * lungeSpeed;
            if (mapManager && mapManager.isWalkable(nextX, nextY)) {
                this.x = nextX;
                this.y = nextY;
            }
        } else if (player && targetDist < 1.4 && this.attackCooldown === 0) {
            // Iniciar Ataque si está muy cerca
            this.state = 'attack';
            this.currentFrame = 0;
            this.animTimer = 0;
            this.attackCooldown = 90; // Cooldown entre ataques
        } else if (player && targetDist < 4.5) {
            // Persecución al jugador
            this.state = 'walk';
            const angleToPlayer = Math.atan2(pdy, pdx);
            const nextX = this.x + Math.cos(angleToPlayer) * this.speed;
            const nextY = this.y + Math.sin(angleToPlayer) * this.speed;

            if (mapManager && mapManager.isWalkable(nextX, nextY)) {
                this.x = nextX;
                this.y = nextY;
            }

            this.updateFacing(angleToPlayer);
        } else {
            // Patrulla errante
            this.changeDirTimer += 0.02;
            if (this.changeDirTimer > 3) {
                this.moveAngle = Math.random() * Math.PI * 2;
                this.changeDirTimer = 0;
                this.state = Math.random() > 0.4 ? 'walk' : 'idle';
            }

            if (this.state === 'walk') {
                const nextX = this.x + Math.cos(this.moveAngle) * (this.speed * 0.6);
                const nextY = this.y + Math.sin(this.moveAngle) * (this.speed * 0.6);
                
                if (mapManager && mapManager.isWalkable(nextX, nextY)) {
                    this.x = nextX;
                    this.y = nextY;
                }

                this.updateFacing(this.moveAngle);
            }
        }

        // --- CONTROL EXACTO DE FRAMES POR ESTADO ---
        let maxFrames = 4;
        let animSpeed = 0.12;

        if (this.state === 'idle') { maxFrames = 4; animSpeed = 0.1; }
        else if (this.state === 'walk') { maxFrames = 6; animSpeed = 0.18; }
        else if (this.state === 'attack') { maxFrames = 7; animSpeed = 0.22; }
        else if (this.state === 'hurt') { maxFrames = 3; animSpeed = 0.15; }
        else if (this.state === 'dead') { maxFrames = 5; animSpeed = 0.15; }

        this.animTimer += animSpeed;
        if (this.animTimer >= 1) {
            this.currentFrame++;
            if (this.currentFrame >= maxFrames) {
                if (this.state === 'dead') {
                    this.currentFrame = maxFrames - 1; // Mantener último frame de muerte
                } else if (this.state === 'attack' || this.state === 'hurt') {
                    this.state = 'idle'; // Regresar a idle al terminar animación de ataque o daño
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

    // Método para activar retroceso de daño desde el exterior (ej: al golpear al slime)
    applyDamage(sourceX, sourceY) {
        this.state = 'hurt';
        this.currentFrame = 0;
        this.animTimer = 0;
        this.moveAngle = Math.atan2(this.y - sourceY, this.x - sourceX);
    }

    draw(ctx, cameraOffsetX, cameraOffsetY) {
        const screen = Iso.toScreen(this.x, this.y);
        const renderX = screen.x + cameraOffsetX;
        const renderY = screen.y + cameraOffsetY;

        // Sombra en el suelo
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(renderX, renderY + 2, Iso.tileWidth / 3.2, Iso.tileHeight / 4.2, 0, 0, Math.PI * 2);
        ctx.fill();

        if (this.spriteLoaded && this.sprite.complete) {
            // Mapeo exacto de filas según tu especificación:
            // f0: Idle abajo (4) | f1: Idle derecha (4) | f2: Idle arriba (4)
            // f3: Caminar abajo (6) | f4: Caminar derecha (6) | f5: Caminar arriba (6)
            // f6: Ataque abajo (7) | f7: Ataque derecha (7) | f8: Ataque arriba (7)
            // f9: Retroceso abajo (3) | f10: Retroceso derecha (3) | f11: Retroceso arriba (3)
            // f12: Muerte derecha (5)
            let row = 0;

            if (this.state === 'idle') {
                if (this.facing === 'down') row = 0;
                else if (this.facing === 'right' || this.facing === 'left') row = 1;
                else if (this.facing === 'up') row = 2;
            } else if (this.state === 'walk') {
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
            } else if (this.state === 'dead') {
                row = 12;
            }

            const sx = this.currentFrame * this.frameWidth;
            const sy = row * this.frameHeight;

            const drawWidth = this.frameWidth * this.scale;
            const drawHeight = this.frameHeight * this.scale;

            ctx.save();
            // Aplicar espejo horizontal si mira a la izquierda (en filas derechas)
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
            // Respaldo visual temporal si carga tarde
            ctx.fillStyle = '#10B981';
            ctx.beginPath();
            ctx.arc(renderX, renderY - 10, 10, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
