/**
 * Miller Explorer - Mechanism Engine
 * Provides qualitative, heuristic interpretation of slip systems and favorability.
 */

/**
 * Estimates a qualitative planar density score.
 * Lower indices (lower h^2+k^2+l^2) generally mean higher d-spacing and compactness.
 */
export function estimatePlanarDensityScore(h, k, l, structure) {
    const sumSq = h*h + k*k + l*l;
    if (sumSq === 0) return 0;

    // Heuristic base: 1/sumSq
    let score = 10 / sumSq;

    // Adjustments by structure
    if (structure === 'fcc') {
        if (sumSq === 3) score *= 1.5; // {111} is top
    } else if (structure === 'bcc') {
        if (sumSq === 2) score *= 1.5; // {110} is top
    } else if (structure === 'sc') {
        if (sumSq === 1) score *= 1.5; // {100} is top
    }

    return Math.min(score, 10);
}

/**
 * Estimates a qualitative linear density score for direction [u v w].
 */
export function estimateLinearDensityScore(u, v, w, structure) {
    const sumSq = u*u + v*v + w*w;
    if (sumSq === 0) return 0;

    let score = 10 / sumSq;

    // Adjustments
    if (structure === 'fcc') {
        if (sumSq === 2) score *= 1.4; // <110> is most compact
    } else if (structure === 'bcc') {
        if (sumSq === 3) score *= 1.4; // <111> is most compact
    }

    return Math.min(score, 10);
}

/**
 * Computes a combined mechanism favorability score.
 */
export function computeMechanismScore(planarScore, linearScore, isCompatible) {
    if (!isCompatible) return 0;
    
    // Average + bonus for both being high
    let base = (planarScore + linearScore) / 2;
    if (planarScore > 7 && linearScore > 7) base += 2;
    
    return Math.min(base, 10);
}

/**
 * Returns a qualitative classification and explanation.
 */
export function explainMechanismScore(score, structure, isCompatible) {
    if (!isCompatible) {
        return {
            rank: 'NULA',
            color: 'var(--danger)',
            text: 'La dirección no pertenece al plano. No se puede formar un sistema de deslizamiento válido.'
        };
    }

    if (score > 8) {
        return {
            rank: 'ALTA',
            color: 'var(--success)',
            text: `Sistema altamente favorable. Se aproxima a los sistemas de deslizamiento primarios en estructuras ${structure.toUpperCase()}.`
        };
    } else if (score > 4.5) {
        return {
            rank: 'MEDIA',
            color: 'var(--accent-color)',
            text: 'Sistema moderadamente favorable. Requiere mayores niveles de energía para activación mecánica.'
        };
    } else {
        return {
            rank: 'BAJA',
            color: 'var(--text-muted)',
            text: 'Baja probabilidad de activación. Índices complejos y baja compacidad relativa.'
        };
    }
}
