import { Iso } from '../engine/isometric.js';

export class Player {
    constructor(startX, startY) {
        this.x = startX; 
        this.y = startY; 
        this.speed = 0.045; 
        
        // Propiedades de animación y dirección
        this.animTimer = 0;
        this.bobbingOffset = 0; // Efecto orgánico de peso al caminar
        this.facingAngle = 0;
    }

    update(inputManager) {
        const move = inputManager.getMovementVector();

        if (move.x !== 0 || move.y !== 0) {
            this.x += move.x * this.speed;
            this.y += move.y * this.speed;

            // Temporizador para simular balanceo de pasos y animación fluida
            this.animTimer += 0.15;
            this.bobbingOffset = Math.sin(this.animTimer * 4) * 3; // Oscilación vertical sutil
        } else {
            // Animación pasiva de "respiración" cuando está detenido
            this.animTimer += 0.05;
            this.bobbingOffset = Math.sin(this.animTimer) * 1.5;
        }

        // Límites estrictos del mapa expandido (7x7)
        this.x = Math.max(0, Math.min(6.9, this.x));
        this.y = Math.max(0, Math.min(6.9, this.y));
    }

    draw(ctx, cameraOffsetX, cameraOffsetY) {
        const screen = Iso.toScreen(this.x, this.y);
        const renderX = screen.x + cameraOffsetX;
        const renderY = screen.y + cameraOffsetY + this.bobbingOffset;

        // 1. Sombra volumétrica proyectada en el suelo isométrico
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(renderX, renderY - this.bobbingOffset, Iso.tileWidth / 3.5, Iso.tileHeight / 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Renderizado de Alta Fidelidad del Aventurero (Silueta Estilizada Tipo Sprite de Precisión)
        const charBaseY = renderY - 12;

        // Capa de la Bufunda / Capa al viento (Sello de identidad visual tipo Shangri-La)
        ctx.fillStyle = '#00F0FF'; // Cian brillante energético
        ctx.beginPath();
        ctx.moveTo(renderX - 4, charBaseY - 16);
        ctx.lineTo(renderX - 18, charBaseY - 8 + Math.sin(this.animTimer) * 2);
        ctx.lineTo(renderX - 6, charBaseY - 4);
        ctx.closePath();
        ctx.fill();

        // Cuerpo / Armadura ligera del Aventurero
        ctx.fillStyle = '#1E293B'; // Tono base de armadura oscura
        ctx.beginPath();
        ctx.roundRect(renderX - 8, charBaseY - 18, 16, 20, 4);
        ctx.fill();
        ctx.strokeStyle = '#00F0FF';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Núcleo de Energía / Detalle pectoral cian
        ctx.fillStyle = '#00F0FF';
        ctx.fillRect(renderX - 2, charBaseY - 12, 4, 6);

        // Cabeza / Casco del Personaje
        ctx.fillStyle = '#E2E8F0';
        ctx.beginPath();
        ctx.arc(renderX, charBaseY - 24, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Visor / Máscara táctil frontal (Estilo futurista / aventurero ágil)
        ctx.fillStyle = '#00F0FF';
        ctx.fillRect(renderX - 3, charBaseY - 26, 6, 3);
    }
}
