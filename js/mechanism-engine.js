


export function estimatePlanarDensityScore(h, k, l, structure) {
    const sumSq = h*h + k*k + l*l;
    if (sumSq === 0) return 0;


    let score = 10 / sumSq;


    if (structure === 'fcc') {
        if (sumSq === 3) score *= 1.5;
    } else if (structure === 'bcc') {
        if (sumSq === 2) score *= 1.5;
    } else if (structure === 'hcp') {
        if (sumSq === 1) score *= 1.8; // Plano basal HCP (0001) es altamente compacto
    } else if (structure === 'sc') {
        if (sumSq === 1) score *= 1.5;
    }

    return Math.min(score, 10);
}


export function estimateLinearDensityScore(u, v, w, structure) {
    const sumSq = u*u + v*v + w*w;
    if (sumSq === 0) return 0;

    let score = 10 / sumSq;


    if (structure === 'fcc') {
        if (sumSq === 2) score *= 1.4;
    } else if (structure === 'bcc') {
        if (sumSq === 3) score *= 1.4;
    } else if (structure === 'hcp') {
        if (sumSq === 1) score *= 1.6; // Dirección <11-20>
    }

    return Math.min(score, 10);
}


export function computeMechanismScore(planarScore, linearScore, isCompatible) {
    if (!isCompatible) return 0;
    

    let base = (planarScore + linearScore) / 2;
    if (planarScore > 7 && linearScore > 7) base += 2;
    
    return Math.min(base, 10);
}


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
