
import * as THREE from 'three';
import { getLatticeAtoms, mapToThree } from './lattice-renderer.js';
import { CONFIG } from './state.js';

/**
 * Calcula el área geométrica de un polígono 3D arbitrario
 */
export function computePlaneArea(polygonPoints) {
    if (!polygonPoints || polygonPoints.length < 3) return 0;
    
    let area = 0;
    const p0 = polygonPoints[0];
    
    for (let i = 1; i < polygonPoints.length - 1; i++) {
        const v1 = new THREE.Vector3().subVectors(polygonPoints[i], p0);
        const v2 = new THREE.Vector3().subVectors(polygonPoints[i+1], p0);
        const cross = new THREE.Vector3().crossVectors(v1, v2);
        area += cross.length() * 0.5;
    }
    
    return area; 
}

/**
 * Cuenta la contribución de átomos que intersectan el plano (n_eff)
 * Regla cúbica: 
 * - Átomo en esquina del cuadrado unitario: 1/4
 * - Átomo en borde del cuadrado unitario: 1/2
 * - Átomo interno: 1.0
 */
export function countPlaneAtoms(polygonPoints, structure, defectType = null, caRatio = null) {
    if (!polygonPoints || polygonPoints.length < 3) return 0;
    
    const eps = 0.05; // Tolerancia para coplanaridad
    const plane = new THREE.Plane().setFromCoplanarPoints(polygonPoints[0], polygonPoints[1], polygonPoints[2]);
    let totalContribution = 0;

    // Solo soporta cúbico
    const atoms = getLatticeAtoms(structure.toLowerCase());
    atoms.forEach(pos => {
        const pThree = mapToThree(...pos).multiplyScalar(CONFIG.scale);
        const dist = plane.distanceToPoint(pThree);
        
        if (Math.abs(dist) < eps) {
            // El átomo está en el plano. Ahora determinamos su contribución dentro de la CELDA
            // Verificamos cuántos límites de la celda unitaria [0,1] toca el punto indexado
                let boundaryCount = 0;
                for (let i = 0; i < 3; i++) {
                    if (Math.abs(pos[i]) < 0.001 || Math.abs(pos[i] - 1) < 0.001) {
                        boundaryCount++;
                    }
                }

                if (boundaryCount === 3) {
                    // Esquina de la celda: En un plano genérico, aporta 1/4 al área seccional
                    totalContribution += 0.25;
                } else if (boundaryCount === 2) {
                    // Borde de la celda: Aporta 1/2
                    totalContribution += 0.5;
                } else {
                    // Cara de la celda o interior: Aporta 1.0
                    totalContribution += 1.0;
                }
            }
        });
    
    return totalContribution;
}

/**
 * Densidad Planar (at/Å²)
 */
export function computePlanarDensity(area, atomCount) {
    if (!area || area <= 0 || !atomCount || atomCount <= 0) return 0;
    return atomCount / area;
}

/**
 * Genera una explicación técnica y un ranking para la densidad planar
 */
export function explainPlanarDensity(rho, structureName = "red") {
    if (rho === 0 || isNaN(rho)) return { 
        rank: '-', 
        color: 'var(--text-muted)', 
        text: 'Sin átomos detectados en este plano de corte.' 
    };
    
    // Basado en densidades típicas (Ej. Al FCC (111) rho ~ 0.14 at/A2)
    // Usaremos un ranking heurístico para feedback visual
    const s = structureName.toUpperCase();
    let rank = 'BAJA';
    let color = 'var(--danger)';
    
    if (rho >= 0.12) {
        rank = 'MÁXIMA';
        color = '#d946ef'; // Magenta brillante para planos compactos
    } else if (rho >= 0.08) {
        rank = 'ALTA';
        color = 'var(--success)';
    } else if (rho >= 0.04) {
        rank = 'MEDIA';
        color = 'var(--accent-color)';
    }

    return { 
        rank, 
        color, 
        text: `Estructura: ${s}. Densidad medida: ${rho.toFixed(4)} at/Å². Este valor indica la eficiencia del empaquetamiento atómico en la orientación seleccionada.`
    };
}
