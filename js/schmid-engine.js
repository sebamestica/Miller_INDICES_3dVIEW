/**
 * Miller Explorer - Schmid Factor Engine
 * Calculates resolved shear stress factor for oriented loading.
 */
import * as THREE from 'three';

/**
 * Computes the Schmid Factor m = cos(phi) * cos(lambda).
 * phi: angle between Normal and Load.
 * lambda: angle between Slip Direction and Load.
 */
export function computeSchmidFactor(normal, slip, load) {
    if (!normal || !slip || !load) return null;

    const n = normal.clone().normalize();
    const s = slip.clone().normalize();
    const l = load.clone().normalize();

    const cosPhi = Math.abs(n.dot(l));
    const cosLambda = Math.abs(s.dot(l));
    const factor = cosPhi * cosLambda;

    return {
        phi: THREE.MathUtils.radToDeg(Math.acos(Math.min(cosPhi, 1))).toFixed(1),
        lambda: THREE.MathUtils.radToDeg(Math.acos(Math.min(cosLambda, 1))).toFixed(1),
        multiplier: factor.toFixed(3),
        raw: factor
    };
}

/**
 * Provides a qualitative assessment of the Schmid factor.
 */
export function explainSchmidFactor(factor) {
    if (factor === null) return { rank: '-', color: 'var(--text-muted)', text: 'Datos insuficientes.' };

    if (factor > 0.4) {
        return {
            rank: 'ALTO',
            color: 'var(--success)',
            text: 'Orientación de carga óptima para deslizamiento. Factor cercano al máximo teórico (0.5).'
        };
    } else if (factor > 0.2) {
        return {
            rank: 'MEDIO',
            color: 'var(--accent-color)',
            text: 'Factor moderado. El plano está activo pero la carga no está perfectamente alineada con el deslizamiento.'
        };
    } else {
        return {
            rank: 'BAJO',
            color: 'var(--danger)',
            text: 'Configuración desfavorable. El sistema de deslizamiento está casi bloqueado por la orientación de carga.'
        };
    }
}
