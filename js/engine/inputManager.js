export class InputManager {
    constructor(canvas, player) {
        this.canvas = canvas;
        this.player = player;

        // Estado del joystick virtual
        this.joystickActive = false;
        this.joystickId = null;
        this.joystickCenter = { x: 0, y: 0 };
        this.joystickCurrent = { x: 0, y: 0 };
        this.maxRadius = 50;

        // Estado del botón de ataque
        this.attackPressed = false;
        this.attackTriggeredThisFrame = false;
        this.attackTouchId = null;

        this.setupListeners();
    }

    setupListeners() {
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        this.canvas.addEventListener('touchcancel', (e) => this.handleTouchEnd(e), { passive: false });

        // Soporte básico para pruebas en escritorio con Mouse / Teclado
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
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
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();

        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            // Si el héroe está muerto y muestra el botón de reaparición, comprobar clic en el botón
            if (this.player.showRestartButton) {
                const btnX = this.canvas.width / 2;
                const btnY = this.canvas.height / 2 + 50;
                if (Math.abs(x - btnX) < 110 && Math.abs(y - btnY) < 30) {
                    this.player.respawnAtSanctuary();
                    return;
                }
            }

            // Mitad derecha de la pantalla: Botón de Ataque
            if (x > this.canvas.width / 2 && this.attackTouchId === null) {
                this.attackTouchId = touch.identifier;
                this.attackPressed = true;
                this.attackTriggeredThisFrame = true;
            } 
            // Mitad izquierda de la pantalla: Joystick
            else if (x <= this.canvas.width / 2 && !this.joystickActive) {
                this.joystickActive = true;
                this.joystickId = touch.identifier;
                this.joystickCenter = { x, y };
                this.joystickCurrent = { x, y };
            }
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
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
        e.preventDefault();
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

        if (this.player.showRestartButton) {
            const btnX = this.canvas.width / 2;
            const btnY = this.canvas.height / 2 + 50;
            if (Math.abs(x - btnX) < 110 && Math.abs(y - btnY) < 30) {
                this.player.respawnAtSanctuary();
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
        this.attackTriggeredThisFrame = false; // Consumir evento del frame
        return triggered;
    }

    draw(ctx) {
        // 1. Dibujar Joystick si está activo
        if (this.joystickActive) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.joystickCenter.x, this.joystickCenter.y, this.maxRadius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(this.joystickCurrent.x, this.joystickCurrent.y, 22, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.fill();
            ctx.restore();
        }

        // 2. Dibujar Botón de Ataque táctil en esquina inferior derecha
        ctx.save();
        const btnX = ctx.canvas.width - 70;
        const btnY = ctx.canvas.height - 70;
        ctx.beginPath();
        ctx.arc(btnX, btnY, 35, 0, Math.PI * 2);
        ctx.fillStyle = this.attackPressed ? 'rgba(239, 68, 68, 0.6)' : 'rgba(0, 0, 0, 0.35)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ATAQUE', btnX, btnY);
        ctx.restore();

        // 3. Pantalla de Muerte y Botón de Reaparición en el Santuario
        if (this.player.state === 'dead') {
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 26px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('¡HAS CAÍDO EN COMBATE!', ctx.canvas.width / 2, ctx.canvas.height / 2 - 30);

            if (this.player.showRestartButton) {
                const rx = ctx.canvas.width / 2;
                const ry = ctx.canvas.height / 2 + 50;
                
                ctx.fillStyle = '#22c55e';
                ctx.fillRect(rx - 110, ry - 30, 220, 60);
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 2;
                ctx.strokeRect(rx - 110, ry - 30, 220, 60);

                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 16px sans-serif';
                ctx.textBaseline = 'middle';
                ctx.fillText('✨ REAPARECER', rx, ry);
            } else {
                ctx.fillStyle = '#94a3b8';
                ctx.font = '14px sans-serif';
                ctx.fillText('Regresando al Santuario Mágico...', ctx.canvas.width / 2, ctx.canvas.height / 2 + 20);
            }
            ctx.restore();
        }
    }
}
