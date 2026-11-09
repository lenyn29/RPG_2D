import { Iso } from '../engine/isometric.js';

export class Enemy {
    constructor(startX, startY, type = 'slime') {
        this.x = startX;
        this.y = startY;
        this.type = type;
        this.speed = 0.015; // Velocidad de movimiento pausada propia de un slime
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

        // Control de animaciones según tus especificaciones de frames por estado
        this.animTimer = 0;
        this.currentFrame = 0;
        this.facing = 'down'; // 'down', 'up', 'left', 'right'
        this.state = 'idle';  // 'idle', 'walk', 'attack', 'hurt', 'dead'
        
        // IA / Comportamiento
        this.changeDirTimer = 0;
        this.moveAngle = Math.random() * Math.PI * 2;
    }

    update(mapManager, objects = [], player = null) {
        // 1. Lógica de IA simple: patrulla aleatoria o persecución si el jugador está cerca
        if (this.state !== 'dead') {
            let targetDist = 999;
            if (player) {
                const pdx = player.x - this.x;
                const pdy = player.y - this.y;
                targetDist = Math.sqrt(pdx * pdx + pdy * pdy);
            }

            // Si el jugador está a menos de 4 tiles de distancia, el slime lo persigue
            if (player && targetDist < 4.0) {
                this.state = 'walk';
                const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
                const nextX = this.x + Math.cos(angleToPlayer) * this.speed;
                const nextY = this.y + Math.sin(angleToPlayer) * this.speed;

                // Movimiento con colisión simple
                if (mapManager && mapManager.isWalkable(nextX, nextY)) {
                    this.x = nextX;
                    this.y = nextY;
                }

                // Orientación visual basada en el ángulo hacia el jugador
                if (Math.abs(Math.cos(angleToPlayer)) > Math.abs(Math.sin(angleToPlayer))) {
                    this.facing = Math.cos(angleToPlayer) > 0 ? 'right' : 'left';
                } else {
                    this.facing = Math.sin(angleToPlayer) > 0 ? 'down' : 'up';
                }
            } else {
                // Patrulla errante suave
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

                    if (Math.abs(Math.cos(this.moveAngle)) > Math.abs(Math.sin(this.moveAngle))) {
                        this.facing = Math.cos(this.moveAngle) > 0 ? 'right' : 'left';
                    } else {
                        this.facing = Math.sin(this.moveAngle) > 0 ? 'down' : 'up';
                    }
                }
            }
        }

        // 2. Control de animación basado en la cantidad exacta de frames por estado:
        // - Idle: 4 frames
        // - Caminar: 6 frames
        // - Atacar: 7 frames
        // - Daño (Hurt): 3 frames
        // - Muerte (Dead): 5 frames
        let maxFrames = 4;
        let animSpeed = 0.15;

        if (this.state === 'idle') { maxFrames = 4; animSpeed = 0.12; }
        else if (this.state === 'walk') { maxFrames = 6; animSpeed = 0.2; }
        else if (this.state === 'attack') { maxFrames = 7; animSpeed = 0.25; }
        else if (this.state === 'hurt') { maxFrames = 3; animSpeed = 0.2; }
        else if (this.state === 'dead') { maxFrames = 5; animSpeed = 0.15; }

        this.animTimer += animSpeed;
        if (this.animTimer >= 1) {
            this.currentFrame++;
            if (this.currentFrame >= maxFrames) {
                if (this.state === 'dead') {
                    this.currentFrame = maxFrames - 1; // Quedarse en el último frame de muerte
                } else if (this.state === 'attack' || this.state === 'hurt') {
                    this.state = 'idle'; // Volver a idle tras terminar ataque o daño
                    this.currentFrame = 0;
                } else {
                    this.currentFrame = 0;
                }
            }
            this.animTimer = 0;
        }
    }

    draw(ctx, cameraOffsetX, cameraOffsetY) {
        const screen = Iso.toScreen(this.x, this.y);
        const renderX = screen.x + cameraOffsetX;
        const renderY = screen.y + cameraOffsetY;

        // Sombra volumétrica en el suelo
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(renderX, renderY + 2, Iso.tileWidth / 3.2, Iso.tileHeight / 4.2, 0, 0, Math.PI * 2);
        ctx.fill();

        if (this.spriteLoaded && this.sprite.complete) {
            // Mapeo de filas en la hoja de sprites según el estado y dirección
            // (Asegúrate de ajustar el orden de filas según tu sprite sheet exacto)
            let row = 0;
            if (this.state === 'idle') row = 0;
            else if (this.state === 'walk') row = 1;
            else if (this.state === 'attack') row = 2;
            else if (this.state === 'hurt') row = 3;
            else if (this.state === 'dead') row = 4;

            const sx = this.currentFrame * this.frameWidth;
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
            // Respaldo visual si la imagen del slime carga tarde
            ctx.fillStyle = '#10B981';
            ctx.beginPath();
            ctx.arc(renderX, renderY - 10, 10, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
