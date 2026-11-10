export class InputManager {
    constructor(canvas, player = null) {
        this.canvas = canvas;
        this.player = player;
        this.touchActive = false;
        this.touchId = null;
        this.baseX = 0;
        this.baseY = 0;
        this.currX = 0;
        this.currY = 0;
        this.maxRadius = 50;

        // Estado del botón de ataque
        this.attackPressed = false;
        this.attackButton = {
            x: window.innerWidth - 80,
            y: window.innerHeight - 100,
            radius: 35
        };
        this.attackTouchId = null;

        this.setupListeners();
    }

    setPlayer(player) {
        this.player = player;
    }

    setupListeners() {
        window.addEventListener('resize', () => {
            this.attackButton.x = window.innerWidth - 80;
            this.attackButton.y = window.innerHeight - 100;
        });

        window.addEventListener('touchstart', (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];

                // 1. Verificar si pulsa el botón de reinicio al morir el héroe
                if (this.player && this.player.showRestartButton) {
                    const bx = window.innerWidth / 2;
                    const by = window.innerHeight / 2 + 50;
                    if (touch.clientX >= bx - 90 && touch.clientX <= bx + 90 &&
                        touch.clientY >= by - 25 && touch.clientY <= by + 25) {
                        window.location.reload();
                        return;
                    }
                }

                // 2. Verificar si toca el botón de ataque (Mitad derecha / Zona inferior derecha)
                const adx = touch.clientX - this.attackButton.x;
                const ady = touch.clientY - this.attackButton.y;
                if (Math.sqrt(adx * adx + ady * ady) <= this.attackButton.radius + 15) {
                    this.attackTouchId = touch.identifier;
                    this.attackPressed = true;
                    continue;
                }

                // 3. Joystick en la mitad izquierda de la pantalla
                if (!this.touchActive && touch.clientX < window.innerWidth / 2) {
                    this.touchId = touch.identifier;
                    this.baseX = touch.clientX;
                    this.baseY = touch.clientY;
                    this.currX = touch.clientX;
                    this.currY = touch.clientY;
                    this.touchActive = true;
                }
            }
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier === this.touchId) {
                    this.currX = touch.clientX;
                    this.currY = touch.clientY;
                }
            }
            e.preventDefault();
        }, { passive: false });

        const endHandler = (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier === this.touchId) {
                    this.touchActive = false;
                    this.touchId = null;
                    this.currX = this.baseX;
                    this.currY = this.baseY;
                }
                if (touch.identifier === this.attackTouchId) {
                    this.attackTouchId = null;
                    this.attackPressed = false;
                }
            }
        };

        window.addEventListener('touchend', endHandler);
        window.addEventListener('touchcancel', endHandler);
    }

    isAttackTriggered() {
        if (this.attackPressed) {
            this.attackPressed = false; // Consumir evento de ataque
            return true;
        }
        return false;
    }

    getMovementVector() {
        if (!this.touchActive) return { x: 0, y: 0 };

        let dx = this.currX - this.baseX;
        let dy = this.currY - this.baseY; 
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance === 0) return { x: 0, y: 0 };

        const force = Math.min(distance, this.maxRadius) / this.maxRadius;
        return {
            x: (dx / distance) * force,
            y: (dy / distance) * force
        };
    }

    draw(ctx) {
        // 1. Dibujar Joystick Izquierdo
        if (this.touchActive) {
            ctx.beginPath();
            ctx.arc(this.baseX, this.baseY, this.maxRadius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(this.currX, this.currY, 22, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 240, 255, 0.5)';
            ctx.fill();
            ctx.strokeStyle = '#00F0FF';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // 2. Dibujar Botón de Ataque Derecho (UI fija)
        ctx.beginPath();
        ctx.arc(this.attackButton.x, this.attackButton.y, this.attackButton.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.attackTouchId !== null ? 'rgba(239, 68, 68, 0.7)' : 'rgba(239, 68, 68, 0.35)';
        ctx.fill();
        ctx.strokeStyle = '#EF4444'; 
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚔️', this.attackButton.x, this.attackButton.y);

        // Dentro del método de manejo de clics del botón de reinicio en inputManager.js:
        // Reemplazar la recarga de página por:
        if (this.player.showRestartButton) {
            this.player.respawnAtSanctuary();
        }
    }
}
