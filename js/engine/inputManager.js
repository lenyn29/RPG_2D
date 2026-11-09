export class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        
        // Controles de teclado
        this.keys = { w: false, a: false, s: false, d: false };

        // Joystick Táctil Robusto
        this.touchActive = false;
        this.activePointerId = null;
        this.joystickBase = { x: 0, y: 0 };
        this.joystickCurrent = { x: 0, y: 0 };
        this.maxRadius = 50;
        this.inputVector = { x: 0, y: 0 };

        this.initListeners();
    }

    initListeners() {
        window.addEventListener('keydown', (e) => this.handleKey(e, true));
        window.addEventListener('keyup', (e) => this.handleKey(e, false));

        // Escuchar directamente en el canvas
        this.canvas.addEventListener('pointerdown', (e) => this.startJoystick(e));
        this.canvas.addEventListener('pointermove', (e) => this.moveJoystick(e));
        this.canvas.addEventListener('pointerup', (e) => this.endJoystick(e));
        this.canvas.addEventListener('pointercancel', (e) => this.endJoystick(e));
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
        if (this.touchActive) return;

        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.clientX;
        const clientY = e.clientY;
        const canvasX = clientX - rect.left;
        const canvasY = clientY - rect.top;

        // Restricción: Solo en la mitad inferior izquierda de la pantalla
        const allowedZoneWidth = this.canvas.width * 0.5;
        const allowedZoneHeightStart = this.canvas.height * 0.4;

        if (canvasX <= allowedZoneWidth && canvasY >= allowedZoneHeightStart) {
            this.touchActive = true;
            this.activePointerId = e.pointerId;
            
            // Capturar el puntero para que no se pierda el evento aunque el dedo salga del canvas
            try {
                this.canvas.setPointerCapture(e.pointerId);
            } catch (err) {
                // Fallback silencioso
            }

            this.joystickBase = { x: clientX, y: clientY };
            this.joystickCurrent = { x: clientX, y: clientY };
            this.inputVector = { x: 0, y: 0 };
        }
    }

    moveJoystick(e) {
        if (!this.touchActive || e.pointerId !== this.activePointerId) return;

        const dx = e.clientX - this.joystickBase.x;
        const dy = e.clientY - this.joystickBase.y;
        const distance = Math.hypot(dx, dy);

        // Actualizar posición visual del pomo
        if (distance > this.maxRadius) {
            this.joystickCurrent.x = this.joystickBase.x + (dx / distance) * this.maxRadius;
            this.joystickCurrent.y = this.joystickBase.y + (dy / distance) * this.maxRadius;
        } else {
            this.joystickCurrent.x = e.clientX;
            this.joystickCurrent.y = e.clientY;
        }

        if (distance > 5) { // Zona muerta mínima para evitar ruido
            const intensity = Math.min(distance, this.maxRadius) / this.maxRadius;
            const angle = Math.atan2(dy, dx);

            // Vector de pantalla
            const screenX = Math.cos(angle) * intensity;
            const screenY = Math.sin(angle) * intensity;

            // Traducción directa al plano isométrico
            this.inputVector.x = screenX + screenY;
            this.inputVector.y = screenY - screenX;
        } else {
            this.inputVector = { x: 0, y: 0 };
        }
    }

    endJoystick(e) {
        if (e && this.activePointerId !== null && e.pointerId !== this.activePointerId) return;

        if (this.activePointerId !== null) {
            try {
                this.canvas.releasePointerCapture(this.activePointerId);
            } catch (err) {
                // Fallback silencioso
            }
        }

        this.touchActive = false;
        this.activePointerId = null;
        this.inputVector = { x: 0, y: 0 };
    }

    getMovementVector() {
        let moveX = 0;
        let moveY = 0;

        // Lectura de teclado
        if (this.keys.w) { moveX -= 1; moveY -= 1; }
        if (this.keys.s) { moveX += 1; moveY += 1; }
        if (this.keys.a) { moveX -= 1; moveY += 1; }
        if (this.keys.d) { moveX += 1; moveY -= 1; }

        if (moveX !== 0 || moveY !== 0) {
            const length = Math.hypot(moveX, moveY);
            moveX /= length;
            moveY /= length;
        }

        // Override por Joystick Táctil
        if (this.touchActive && (this.inputVector.x !== 0 || this.inputVector.y !== 0)) {
            moveX = this.inputVector.x;
            moveY = this.inputVector.y;
        }

        return { x: moveX, y: moveY };
    }

    draw(ctx) {
        if (this.touchActive) {
            // Dibujar Base
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.joystickBase.x, this.joystickBase.y, this.maxRadius, 0, Math.PI * 2);
            ctx.stroke();

            // Dibujar Pomo
            ctx.fillStyle = 'rgba(0, 240, 255, 0.75)';
            ctx.beginPath();
            ctx.arc(this.joystickCurrent.x, this.joystickCurrent.y, 22, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}
