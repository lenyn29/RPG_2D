// Módulo de Matemáticas Isométricas y Proyección (Y-Sorting)
export const Iso = {
    tileWidth: 64,
    tileHeight: 32,

    // Convierte coordenadas de grilla lógica a coordenadas de pantalla (Canvas)
    toScreen(gridX, gridY) {
        return {
            x: (gridX - gridY) * (this.tileWidth / 2),
            y: (gridX + gridY) * (this.tileHeight / 2)
        };
    },

    // Convierte coordenadas de pantalla a grilla lógica
    toGrid(screenX, screenY) {
        const halfW = this.tileWidth / 2;
        const halfH = this.tileHeight / 2;
        return {
            x: Math.floor((screenX / halfW + screenY / halfH) / 2),
            y: Math.floor((screenY / halfH - screenX / halfW) / 2)
        };
    }
};
