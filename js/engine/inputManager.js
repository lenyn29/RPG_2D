export class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        
        // Controles de teclado
        this.keys = { w: false, a: false, s: false, d: false };

        // Joystick Táctil Profesional
        this.touchActive = false;
        this.activePointerId = null;
        this.joystickBase = { x: 0, y: 0 };
        this.joystickCurrent = { x: 0, y: 0 };
        this.maxRadius = 45;
        this.deadZone = 6;
        this.inputVector = { x: 0, y: 0 };

        this.initListeners();
    }

    initListeners() {
        window.addEventListener('keydown', (e) => this.handleKey(e, true));
        window.addEventListener('keyup', (e) => this.handleKey(e, false));

        this.canvas.addEventListener('pointerdown', (e) => this.startJoystick(e));
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
        if (this.touchActive) return;

        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.clientX;
        const clientY = e.clientY;
        const canvasX = clientX - rect.left;
        const canvasY = clientY - rect.top;

        // RESTRICCIÓN DE ZONA: El joystick solo aparece en la mitad inferior izquierda de la pantalla
        const allowedZoneWidth = this.canvas.width * 0.45;
        const allowedZoneHeightStart = this.canvas.height * 0.5;

        if (canvasX <= allowedZoneWidth && canvasY >= allowedZoneHeightStart) {
            this.touchActive = true;
            this.activePointerId = e.pointerId;
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

        if (distance < this.deadZone) {
            this.inputVector = { x: 0, y: 0 };
            this.joystickCurrent.x = e.clientX;
            this.joystickCurrent.y = e.clientY;
            return;
        }

        if (distance > this.maxRadius) {
            this.joystickCurrent.x = this.joystickBase.x + (dx / distance) * this.maxRadius;
            this.joystickCurrent.y = this.joystickBase.y + (dy / distance) * this.maxRadius;
        } else {
            this.joystickCurrent.x = e.clientX;
            this.joystickCurrent.y = e.clientY;
        }

        const intensity = Math.min(distance, this.maxRadius) / this.maxRadius;
        const angle = Math.atan2(dy, dx);

        const screenX = Math.cos(angle) * intensity;
        const screenY = Math.sin(angle) * intensity;

        // Mapeo preciso al plano isométrico
        this.inputVector.x = screenX + screenY;
        this.inputVector.y = screenY - screenX;
    }

    endJoystick(e) {
        if (e && e.pointerId !== this.activePointerId) return;

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
            // Base del joystick
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.joystickBase.x, this.joystickBase.y, this.maxRadius, 0, Math.PI * 2);
            ctx.stroke();

            // Pomo del joystick
            ctx.fillStyle = 'rgba(0, 240, 255, 0.65)';
            ctx.beginPath();
            ctx.arc(this.joystickCurrent.x, this.joystickCurrent.y, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}
