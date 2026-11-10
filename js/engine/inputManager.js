export class InputManager {
    constructor(canvas, player) {
        this.canvas = canvas;
        this.player = player;

        // Estado del joystick virtual analógico
        this.joystickActive = false;
        this.joystickId = null;
        this.joystickCenter = { x: 0, y: 0 };
        this.joystickCurrent = { x: 0, y: 0 };
        this.maxRadius = 55;

        // Estado del botón de ataque táctil
        this.attackPressed = false;
        this.attackTriggeredThisFrame = false;
        this.attackTouchId = null;

        this.setupListeners();
    }

    setupListeners() {
        // Eventos táctiles móviles con opciones pasivas seguras
        const opts = { passive: false };
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), opts);
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), opts);
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), opts);
        this.canvas.addEventListener('touchcancel', (e) => this.handleTouchEnd(e), opts);

        // Compatibilidad con escritorio (Mouse / Teclado)
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !e.repeat) {
                this.attackPressed = true;
                this.attackTriggeredThisFrame = true;
            }
        });
        window.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                this.attackPressed = false;
            }
        });
    }

    handleTouchStart(e) {
        if (e.cancelable) e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();

        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            // Gestión de toque en botón de reaparición si el jugador ha caído
            if (this.player && this.player.state === 'dead' && this.player.showRestartButton) {
                const btnX = this.canvas.width / 2;
                const btnY = this.canvas.height / 2 + 50;
                if (Math.abs(x - btnX) < 130 && Math.abs(y - btnY) < 40) {
                    if (typeof this.player.respawnAtSanctuary === 'function') {
                        this.player.respawnAtSanctuary();
                    }
                    return;
                }
            }

            // Mitad derecha de la pantalla: Botón de Ataque
            if (x > this.canvas.width / 2 && this.attackTouchId === null) {
                this.attackTouchId = touch.identifier;
                this.attackPressed = true;
                this.attackTriggeredThisFrame = true;
            } 
            // Mitad izquierda de la pantalla: Joystick dinámico
            else if (x <= this.canvas.width / 2 && !this.joystickActive) {
                this.joystickActive = true;
                this.joystickId = touch.identifier;
                this.joystickCenter = { x, y };
                this.joystickCurrent = { x, y };
            }
        }
    }

    handleTouchMove(e) {
        if (e.cancelable) e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();

        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (touch.identifier === this.joystickId) {
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;

                const dx = x - this.joystickCenter.x;
                const dy = y - this.joystickCenter.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > this.maxRadius) {
                    this.joystickCurrent.x = this.joystickCenter.x + (dx / dist) * this.maxRadius;
                    this.joystickCurrent.y = this.joystickCenter.y + (dy / dist) * this.maxRadius;
                } else {
                    this.joystickCurrent.x = x;
                    this.joystickCurrent.y = y;
                }
            }
        }
    }

    handleTouchEnd(e) {
        if (e.cancelable) e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (touch.identifier === this.joystickId) {
                this.joystickActive = false;
                this.joystickId = null;
                this.joystickCurrent = { ...this.joystickCenter };
            }
            if (touch.identifier === this.attackTouchId) {
                this.attackTouchId = null;
                this.attackPressed = false;
            }
        }
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.player && this.player.state === 'dead' && this.player.showRestartButton) {
            const btnX = this.canvas.width / 2;
            const btnY = this.canvas.height / 2 + 50;
            if (Math.abs(x - btnX) < 130 && Math.abs(y - btnY) < 40) {
                if (typeof this.player.respawnAtSanctuary === 'function') {
                    this.player.respawnAtSanctuary();
                }
                return;
            }
        }

        if (x > this.canvas.width / 2) {
            this.attackPressed = true;
            this.attackTriggeredThisFrame = true;
        } else {
            this.joystickActive = true;
            this.joystickCenter = { x, y };
            this.joystickCurrent = { x, y };
        }
    }

    handleMouseMove(e) {
        if (!this.joystickActive) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const dx = x - this.joystickCenter.x;
        const dy = y - this.joystickCenter.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > this.maxRadius) {
            this.joystickCurrent.x = this.joystickCenter.x + (dx / dist) * this.maxRadius;
            this.joystickCurrent.y = this.joystickCenter.y + (dy / dist) * this.maxRadius;
        } else {
            this.joystickCurrent.x = x;
            this.joystickCurrent.y = y;
        }
    }

    handleMouseUp(e) {
        this.joystickActive = false;
        this.joystickCurrent = { ...this.joystickCenter };
        this.attackPressed = false;
    }

    getMovementVector() {
        if (!this.joystickActive) return { x: 0, y: 0 };
        const dx = this.joystickCurrent.x - this.joystickCenter.x;
        const dy = this.joystickCurrent.y - this.joystickCenter.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) return { x: 0, y: 0 };

        return {
            x: dx / this.maxRadius,
            y: dy / this.maxRadius
        };
    }

    isAttackTriggered() {
        const triggered = this.attackTriggeredThisFrame;
        this.attackTriggeredThisFrame = false; // Consumir evento por frame
        return triggered;
    }

    draw(ctx) {
        if (!ctx || !this.canvas) return;

        // 1. Renderizado del Joystick Virtual Analógico
        if (this.joystickActive) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.joystickCenter.x, this.joystickCenter.y, this.maxRadius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(this.joystickCurrent.x, this.joystickCurrent.y, 24, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3);';
            ctx.fill();
            ctx.restore();
        }

        // 2. Renderizado del Botón de Ataque Táctil
        ctx.save();
        const btnX = this.canvas.width - 75;
        const btnY = this.canvas.height - 75;
        ctx.beginPath();
        ctx.arc(btnX, btnY, 38, 0, Math.PI * 2);
        ctx.fillStyle = this.attackPressed ? 'rgba(239, 68, 68, 0.65)' : 'rgba(0, 0, 0, 0.4)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ATACAR', btnX, btnY);
        ctx.restore();

        // 3. Interfaz de Muerte y Reaparición en el Santuario Mágico
        if (this.player && this.player.state === 'dead') {
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 26px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('¡HAS CAÍDO EN COMBATE!', this.canvas.width / 2, this.canvas.height / 2 - 45);

            if (this.player.showRestartButton) {
                const rx = this.canvas.width / 2;
                const ry = this.canvas.height / 2 + 40;
                
                ctx.fillStyle = '#22c55e';
                ctx.fillRect(rx - 130, ry - 32, 260, 64);
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 2.5;
                ctx.strokeRect(rx - 130, ry - 32, 260, 64);

                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 17px sans-serif';
                ctx.fillText('✨ REAPARECER EN SANTUARIO', rx, ry);
            } else {
                ctx.fillStyle = '#94a3b8';
                ctx.font = '15px sans-serif';
                ctx.fillText('Regresando al Santuario Mágico...', this.canvas.width / 2, this.canvas.height / 2 + 20);
            }
            ctx.restore();
        }
    }
}
