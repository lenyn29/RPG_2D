import { Iso } from '../engine/isometric.js';

export class Player {
    constructor(startX, startY) {
        this.x = startX; 
        this.y = startY; 
        this.baseSpeed = 0.05; 
        
        // Controles de teclado
        this.keys = { w: false, a: false, s: false, d: false };
        
        // Estado del Joystick Virtual Profesional
        this.touchActive = false;
        this.activePointerId = null;
        this.joystickBase = { x: 0, y: 0 };
        this.joystickCurrent = { x: 0, y: 0 };
        this.maxRadius = 50;  // Radio máximo de arrastre
        this.deadZone = 8;     // Zona muerta para evitar micro-movimientos
        
        // Vector de velocidad normalizado (-1 a 1)
        this.inputVector = { x: 0, y: 0 };

        this.initInput();
    }

    initInput() {
        // Eventos de Teclado
        window.addEventListener('keydown', (e) => this.handleKey(e, true));
        window.addEventListener('keyup', (e) => this.handleKey(e, false));

        // Eventos de Puntero Unificados (Touch, Mouse, Stylus)
        window.addEventListener('pointerdown', (e) => this.startJoystick(e));
        window.addEventListener('pointermove', (e) => this.moveJoystick(e));
        window.addEventListener('pointerup', (e) => this.endJoystick(e));
        window.addEventListener('pointercancel', (e) => this.endJoystick(e));
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
        // Ignorar si ya hay un puntero activo manteniendo el control
        if (this.touchActive) return;

        this.touchActive = true;
        this.activePointerId = e.pointerId;
        this.joystickBase = { x: e.clientX, y: e.clientY };
        this.joystickCurrent = { x: e.clientX, y: e.clientY };
        this.inputVector = { x: 0, y: 0 };
    }

    moveJoystick(e) {
        if (!this.touchActive || e.pointerId !== this.activePointerId) return;

        const dx = e.clientX - this.joystickBase.x;
        const dy = e.clientY - this.joystickBase.y;
        const distance = Math.hypot(dx, dy);

        if (distance < this.deadZone) {
            this.inputVector = { x: 0, y: 0 };
            this.joystickCurrent = { x: e.clientX, y: e.clientY };
            return;
        }

        // Limitar la posición visual del pomo dentro del radio del joystick
        if (distance > this.maxRadius) {
            this.joystickCurrent.x = this.joystickBase.x + (dx / distance) * this.maxRadius;
            this.joystickCurrent.y = this.joystickBase.y + (dy / distance) * this.maxRadius;
        } else {
            this.joystickCurrent.x = e.clientX;
            this.joystickCurrent.y = e.clientY;
        }

        // Normalización analógica de 0 a 1 según qué tanto se arrastre el joystick
        const intensity = Math.min(distance, this.maxRadius) / this.maxRadius;
        const angle = Math.atan2(dy, dx);

        // Transformación directa del ángulo de pantalla (2D) hacia las direcciones isométricas (2.5D)
        const screenX = Math.cos(angle) * intensity;
        const screenY = Math.sin(angle) * intensity;

        // Proyección del vector de pantalla a grilla isométrica en tiempo real
        this.inputVector.x = screenX + screenY;
        this.inputVector.y = screenY - screenX;
    }

    endJoystick(e) {
        if (e && e.pointerId !== this.activePointerId) return;

        this.touchActive = false;
        this.activePointerId = null;
        this.inputVector = { x: 0, y: 0 };
    }

    update() {
        let moveX = 0;
        let moveY = 0;

        // 1. Lectura por Teclado
        if (this.keys.w) { moveX -= 1; moveY -= 1; }
        if (this.keys.s) { moveX += 1; moveY += 1; }
        if (this.keys.a) { moveX -= 1; moveY += 1; }
        if (this.keys.d) { moveX += 1; moveY -= 1; }

        if (moveX !== 0 || moveY !== 0) {
            const length = Math.hypot(moveX, moveY);
            moveX = (moveX / length);
            moveY = (moveY / length);
        }

        // 2. Override por Joystick Táctil Continuo (Si está activo)
        if (this.touchActive && (this.inputVector.x !== 0 || this.inputVector.y !== 0)) {
            moveX = this.inputVector.x;
            moveY = this.inputVector.y;
        }

        // 3. Aplicar Movimiento Integrado
        if (moveX !== 0 || moveY !== 0) {
            this.x += moveX * this.baseSpeed;
            this.y += moveY * this.baseSpeed;
        }

        // 4. Límites del mapa (Grilla de 5x5)
        this.x = Math.max(0, Math.min(4.9, this.x));
        this.y = Math.max(0, Math.min(4.9, this.y));
    }

    draw(ctx, cameraOffsetX, cameraOffsetY) {
        const screen = Iso.toScreen(this.x, this.y);
        const renderX = screen.x + cameraOffsetX;
        const renderY = screen.y + cameraOffsetY;

        // Dibujo del jugador (Marcador Neón)
        ctx.fillStyle = '#00F0FF';
        ctx.beginPath();
        ctx.arc(renderX, renderY - 10, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Anillo de base
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.beginPath();
        ctx.ellipse(renderX, renderY, Iso.tileWidth / 4, Iso.tileHeight / 4, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Renderizado del Joystick Táctil Minimalista
        if (this.touchActive) {
            // Base exterior
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.joystickBase.x, this.joystickBase.y, this.maxRadius, 0, Math.PI * 2);
            ctx.stroke();

            // Pomo interior (Desplazamiento fluido)
            ctx.fillStyle = 'rgba(0, 240, 255, 0.6)';
            ctx.beginPath();
            ctx.arc(this.joystickCurrent.x, this.joystickCurrent.y, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    }
}
