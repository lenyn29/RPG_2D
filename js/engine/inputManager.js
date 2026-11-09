export class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.touchActive = false;
        this.touchId = null;
        this.baseX = 0;
        this.baseY = 0;
        this.currX = 0;
        this.currY = 0;
        this.maxRadius = 50;

        this.setupListeners();
    }

    setupListeners() {
        window.addEventListener('touchstart', (e) => {
            if (!this.touchActive) {
                const touch = e.changedTouches[0];
                // Solo activamos el joystick si se toca la mitad izquierda de la pantalla, o toda la pantalla si prefieres
                this.touchId = touch.identifier;
                this.baseX = touch.clientX;
                this.baseY = touch.clientY;
                this.currX = touch.clientX;
                this.currY = touch.clientY;
                this.touchActive = true;
            }
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (!this.touchActive) return;
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier === this.touchId) {
                    this.currX = touch.clientX;
                    this.currY = touch.clientY;
                    break;
                }
            }
            e.preventDefault();
        }, { passive: false });

        const endHandler = (e) => {
            if (!this.touchActive) return;
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.touchId) {
                    this.touchActive = false;
                    this.touchId = null;
                    this.currX = this.baseX;
                    this.currY = this.baseY;
                    break;
                }
            }
        };

        window.addEventListener('touchend', endHandler);
        window.addEventListener('touchcancel', endHandler);
    }

    // Retorna el vector del joystick normalizado a la pantalla
    getMovementVector() {
        if (!this.touchActive) return { x: 0, y: 0 };

        let dx = this.currX - this.baseX;
        let dy = this.currY - this.baseY; // En HTML5 Canvas, Y positivo es ABAJO, Y negativo es ARRIBA
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance === 0) return { x: 0, y: 0 };

        // Limitar al radio máximo del joystick
        const force = Math.min(distance, this.maxRadius) / this.maxRadius;
        const normX = dx / distance;
        const normY = dy / distance;

        return {
            x: normX * force,
            y: normY * force
        };
    }

    draw(ctx) {
        if (!this.touchActive) return;

        // Dibujar base del joystick
        ctx.beginPath();
        ctx.arc(this.baseX, this.baseY, this.maxRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Dibujar palanca (thumb) del joystick
        ctx.beginPath();
        ctx.arc(this.currX, this.currY, 22, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 240, 255, 0.5)';
        ctx.fill();
        ctx.strokeStyle = '#00F0FF';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}
