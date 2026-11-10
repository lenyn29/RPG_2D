import { Iso } from './isometric.js';
import { GameObject } from '../entities/gameObject.js';
import { Enemy } from '../entities/enemy.js';
import { Sanctuary } from '../entities/sanctuary.js';

export class MapManager {
    constructor(seed = 1337) {
        this.seed = seed;
        this.chunkSize = 16; 
        this.chunks = new Map(); 
        this.renderDistance = 2; 

        // Santuario seguro en coordenadas centrales
        this.sanctuary = new Sanctuary(8.0, 8.0);
    }
    // ... resto de métodos sin cambios ...
}
