import { Iso } from '../engine/isometric.js';

export class Player {
    constructor(startX, startY) {
        this.x = startX; 
        this.y = startY; 
        this.speed = 0.04; 
        
        // Controles de teclado
        this.keys = { w: false, a: false, s: false, d: false };
        
        // Control de Joystick Táctil / Mouse
        this.touchActive = false;
        this.touchVector = { x: 0, y: 0 };
        this.joystickBase = { x: 0, y: 0 };
        this.joystickCurrent = { x: 0, y: 0 };
        this.maxRadius = 40; // Radio máximo del joystick virtual

        this.initInput();
    }

    initInput() {
        // Eventos de Teclado
        window.addEventListener('keydown', (e) => this.handleKey(e, true));
        window.addEventListener('keyup', (e) => this.handleKey(e, false));

        // Eventos Táctiles y de Mouse para el Joystick Virtual
        window.addEventListener('pointerdown', (e) => this.startJoystick(e));
        window.addEventListener('pointermove', (e) => this.moveJoystick(e));
        window.addEventListener('pointerup', (e) => this.endJoystick(e));
    }

    handleKey(e, isPressed) {
        switch(e.key.toLowerCase()) {
            case 'w': case 'arrowup': this.keys.w = isPressed; break;
            case 's': case 'arrowdown': this.keys.s = isPressed; break;
            case 'a': case 'arrowleft': this.keys.a = isPressed; break;
            case 'd': case 'arrowright': this.keys.d = isPressed; break;
        }
    }

    startJoystick(e) {
        // Activar el joystick virtual en cualquier parte donde el usuario toque o haga clic
        this.touchActive = true;
        this.joystickBase = { x: e.clientX, y: e.clientY };
        this.joystickCurrent = { x: e.clientX, y: e.clientY };
    }

    moveJoystick(e) {
        if (!this.touchActive) return;
        
        const dx = e.clientX - this.joystickBase.x;
        const dy = e.clientY - this.joystickBase.y;
        const distance = Math.hypot(dx, dy);

        if (distance > this.maxRadius) {
            // Limitar al radio máximo del joystick
            this.joystickCurrent.x = this.joystickBase.x + (dx / distance) * this.maxRadius;
            this.joystickCurrent.y = this.joystickBase.y + (dy / distance) * this.maxRadius;
        } else {
            this.joystickCurrent.x = e.clientX;
            this.joystickCurrent.y = e.clientY;
        }

        // Calcular vector normalizado para el movimiento
        const angle = Math.atan2(dy, dx);
        // Mapear ángulo de pantalla al plano isométrico
        this.touchVector.x = Math.cos(angle);
        this.touchVector.y = Math.sin(angle);
    }

    endJoystick() {
        this.touchActive = false;
        this.touchVector = { x: 0, y: 0 };
    }

    update() {
        let dx = 0;
        let dy = 0;

        // 1. Movimiento por Teclado
        if (this.keys.w) { dx -= 1; dy -= 1; }
        if (this.keys.s) { dx += 1; dy += 1; }
        if (this.keys.a) { dx -= 1; dy += 1; }
        if (this.keys.d) { dx += 1; dy -= 1; }

        if (dx !== 0 || dy !== 0) {
            const length = Math.hypot(dx, dy);
            this.x += (dx / length) * this.speed;
            this.y += (dy / length) * this.speed;
        }

        // 2. Movimiento por Joystick Táctil
        if (this.touchActive && (this.touchVector.x !== 0 || this.touchVector.y !== 0)) {
            // Conversión de vector de pantalla a dirección isométrica aproximada
            const isoMoveX = (this.touchVector.x * 0.7 + this.touchVector.y * 1.2);
            const isoMoveY = (this.touchVector.y * 1.2 - this.touchVector.x * 0.7);
            
            const length = Math.hypot(isoMoveX, isoMoveY);
            if (length > 0) {
                this.x += (isoMoveX / length) * this.speed;
                this.y += (isoMoveY / length) * this.speed;
            }
        }

        // 3. Límites del mapa (Colisiones de borde 0 a 5)
        this.x = Math.max(0, Math.min(4.9, this.x));
        this.y = Math.max(0, Math.min(4.9, this.y));
    }

    draw(ctx, cameraOffsetX, cameraOffsetY) {
        const screen = Iso.toScreen(this.x, this.y);
        const renderX = screen.x + cameraOffsetX;
        const renderY = screen.y + cameraOffsetY;

        // Dibujo de la esfera azul del jugador
        ctx.fillStyle = '#00F0FF';
        ctx.beginPath();
        ctx.arc(renderX, renderY - 10, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Anillo bajo los pies
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.beginPath();
        ctx.ellipse(renderX, renderY, Iso.tileWidth / 4, Iso.tileHeight / 4, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Dibujar el Joystick Táctil en pantalla si se está usando
        if (this.touchActive) {
            // Base del joystick
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.joystickBase.x, this.joystickBase.y, this.maxRadius, 0, Math.PI * 2);
            ctx.stroke();

            // Pomo del joystick
            ctx.fillStyle = 'rgba(0, 240, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(this.joystickCurrent.x, this.joystickCurrent.y, 20, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
