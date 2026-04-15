import * as THREE from 'three';

/**
 * HCP MATH CORE - AUDITADA
 * Define la relación entre índices de Miller-Bravais y el espacio cartesiano de Three.js.
 * Sistema de Coordenadas:
 * Y = Eje C (Altura)
 * X, Z = Plano Basal
 */

export function validateHcpIndices(h, k, i, l) {
    return Math.abs(i + (h + k)) < 1e-6;
}

/**
 * Proyecta índices (hkil) a un vector normal N en el espacio real.
 * Si N . P = d, entonces d=1 representa el plano con intercept 1/l en c.
 */
export function getHcpCartesianNormal(h, k, l, a, c) {
    // Componentes recíprocas puras para red hexagonal
    const hx = h / a;
    const hz = (h + 2 * k) / (a * Math.sqrt(3));
    const hy = l / c; 
    
    return new THREE.Vector3(hx, hy, hz);
}

export function calculateHcpVolume(a, c) {
    if (a <= 0 || c <= 0) return 0;
    return (1.5 * Math.sqrt(3)) * (a * a) * c;
}

export function calculateHcpDhkl(h, k, l, a, c) {
    if (h === 0 && k === 0 && l === 0) return 0;
    const term1 = (4 / 3) * (h * h + h * k + k * k) / (a * a);
    const term2 = (l * l) / (c * c);
    const invD2 = term1 + term2;
    return invD2 > 0 ? 1 / Math.sqrt(invD2) : 0;
}

export function getHcpTheoreticalProperties(a, c) {
    const ratio = c / a;
    const ideal = Math.sqrt(8/3);
    const deviation = ((ratio - ideal) / ideal) * 100;
    const volume = calculateHcpVolume(a, c);
    
    return {
        ratio,
        ideal,
        deviation,
        volume,
        apf: 0.74
    };
}
