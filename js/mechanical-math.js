/**
 * LÓGICA MATEMÁTICA MECÁNICA (v3.1)
 * Implementación de Tensor de Esfuerzos, Descomposición Hidrostática/Desviadora,
 * Ley de Hooke Generalizada y Criterios de Falla (Von Mises).
 */

/**
 * Calcula el Módulo de Corte (G) a partir de E y ν
 * G = E / (2 * (1 + ν))
 */
export function calculateShearModulus(youngGPa, poisson) {
    const E = youngGPa * 1000; // MPa
    return E / (2 * (1 + poisson));
}

/**
 * Calcula el tensor de deformación ε (strains) completo
 * @param {Object} stress {xx, yy, zz, xy, yz, zx} en MPa
 * @param {number} young Módulo de Young en GPa
 * @param {number} poisson Coeficiente de Poisson
 * @returns {Object} {ex, ey, ez, gxy, gyz, gzx}
 */
export function calculateStrains(stress, young, poisson) {
    // Soporte para formato antiguo {x, y, z}
    const xx = stress.xx !== undefined ? stress.xx : (stress.x || 0);
    const yy = stress.yy !== undefined ? stress.yy : (stress.y || 0);
    const zz = stress.zz !== undefined ? stress.zz : (stress.z || 0);
    const xy = stress.xy || 0;
    const yz = stress.yz || 0;
    const zx = stress.zx || 0;

    const E = young * 1000; // Convertir GPa a MPa
    const v = poisson;
    const G = E / (2 * (1 + v));
    
    // Ley de Hooke Generalizada (Isotrópica)
    const ex = (1 / E) * (xx - v * (yy + zz));
    const ey = (1 / E) * (yy - v * (xx + zz));
    const ez = (1 / E) * (zz - v * (xx + yy));

    // Esfuerzos de Cizalle (Angular Strains)
    // γ = τ / G
    const gxy = xy / G;
    const gyz = yz / G;
    const gzx = zx / G;

    return { ex, ey, ez, gxy, gyz, gzx };
}

/**
 * Descompone un tensor de esfuerzos en sus partes Hidrostática y Desviadora
 * @param {Object} stress {xx, yy, zz, xy, yz, zx}
 */
export function decomposeStressTensor(stress) {
    const xx = stress.xx !== undefined ? stress.xx : (stress.x || 0);
    const yy = stress.yy !== undefined ? stress.yy : (stress.y || 0);
    const zz = stress.zz !== undefined ? stress.zz : (stress.z || 0);
    const xy = stress.xy || 0;
    const yz = stress.yz || 0;
    const zx = stress.zx || 0;
    
    // Esfuerzo Hidrostático Promedio (P)
    const P = (xx + yy + zz) / 3;
    
    // Tensor Hidrostático (Solo componentes diagonales iguales a P)
    const hydrostatic = {
        xx: P, yy: P, zz: P,
        xy: 0, yz: 0, zx: 0
    };
    
    // Tensor Desviador (Matriz de Distorsión)
    // Sij = σij - Pδij
    const deviatoric = {
        xx: xx - P,
        yy: yy - P,
        zz: zz - P,
        xy: xy,
        yz: yz,
        zx: zx
    };
    
    return { P, hydrostatic, deviatoric };
}

/**
 * Calcula el cambio volumétrico fraccional (ΔV/V0)
 * Para pequeñas deformaciones: ΔV/V0 ≈ εx + εy + εz
 */
export function calculateVolumeChange(strains) {
    return (strains.ex || 0) + (strains.ey || 0) + (strains.ez || 0);
}

/**
 * Calcula el Esfuerzo Cortante Resuelto (RSS) sobre un plano hkl
 * Simplificación para visualización educativa:
 * τ = σ * cos(phi) * cos(lambda)
 */
export function calculateRSS(stress, indices) {
    const sigX = stress.xx !== undefined ? stress.xx : (stress.x || 0);
    if (sigX === 0) return 0;

    // Vector normal al plano (h k l)
    const n = [indices.h, indices.k, indices.l];
    const nMag = Math.sqrt(n[0]**2 + n[1]**2 + n[2]**2);
    if (nMag === 0) return 0;

    // Dirección de carga (X = [1, 0, 0])
    const loadDir = [1, 0, 0];
    
    // cos(phi) = (n · loadDir) / (|n| * |loadDir|)
    const cosPhi = Math.abs(n[0]) / nMag;
    
    // Suponemos una dirección de deslizamiento probable en 45 grados para visualización
    const cosLambda = Math.cos(Math.PI / 4);

    return sigX * cosPhi * cosLambda;
}

/**
 * Calcula el Esfuerzo de Von Mises (Esfuerzo Equivalente)
 * σvm = √[ σx^2 + σy^2 + σz^2 - (σxσy + σyσz + σzσx) + 3(τxy^2 + τyz^2 + τzx^2) ]
 * @param {Object} stress {xx, yy, zz, xy, yz, zx}
 */
export function calculateVonMises(stress) {
    const xx = stress.xx !== undefined ? stress.xx : (stress.x || 0);
    const yy = stress.yy !== undefined ? stress.yy : (stress.y || 0);
    const zz = stress.zz !== undefined ? stress.zz : (stress.z || 0);
    const xy = stress.xy || 0;
    const yz = stress.yz || 0;
    const zx = stress.zx || 0;

    const term1 = Math.pow(xx, 2) + Math.pow(yy, 2) + Math.pow(zz, 2);
    const term2 = xx * yy + yy * zz + zz * xx;
    const term3 = 3 * (Math.pow(xy, 2) + Math.pow(yz, 2) + Math.pow(zx, 2));

    return Math.sqrt(Math.max(0, term1 - term2 + term3));
}

/**
 * Calcula el Factor de Seguridad (n)
 * n = Límite Elástico / Esfuerzo Equivalente
 */
export function calculateSafetyFactor(vonMises, yieldStrength) {
    if (!yieldStrength || yieldStrength <= 0) return Infinity;
    if (vonMises <= 0) return Infinity;
    return yieldStrength / vonMises;
}

