/**
 * INTERSTITIAL ENGINE (v2.0)
 * ==========================
 * Modelo completo de sitios intersticiales para FCC y BCC
 * con cálculos de compatibilidad, distorsión, endurecimiento y fragilización.
 */

const EPS = 1e-6;

// Reglas geométricas fundamentales
export const SITE_RULES = {
    fcc: {
        // Octaédricos: centros de aristas, radio máx ≈ 0.207*a (√2-1)*a/2
        octahedral: { 
            maxRadiusCoeff: 0.207,  // (√2-1)/2
            radiusRatio: 0.414,     // Para compatibilidad con código existente
            sitesPerCell: 4,
            description: 'Centro de aristas'
        },
        // Tetraédricos: centros de octantes, radio máx ≈ 0.225*a (√3-1)/(2√3)
        tetrahedral: { 
            maxRadiusCoeff: 0.225,  // (√3-1)/(2√3)
            radiusRatio: 0.225,
            sitesPerCell: 8,
            description: 'Centro de octante'
        }
    },
    bcc: {
        // Octaédricos: centros de caras, radio máx ≈ 0.183*a (3-√3)/4
        octahedral: { 
            maxRadiusCoeff: 0.183,  // (3-√3)/4
            radiusRatio: 0.155,     // Conservador para código existente
            sitesPerCell: 6,
            description: 'Centro de cara'
        },
        // Tetraédricos: similar a FCC, radio máx ≈ 0.183*a
        tetrahedral: { 
            maxRadiusCoeff: 0.183,  // (3-√3)/4
            radiusRatio: 0.291,     // Para código existente
            sitesPerCell: 12,
            description: 'Sitio tetraédrico'
        }
    }
};

let interstitialSpecies = [];

export async function loadInterstitialSpecies() {
    try {
        const response = await fetch('./data/interstitial-species.json');
        interstitialSpecies = await response.json();
        return interstitialSpecies;
    } catch (e) {
        console.error("Failed to load interstitial species data:", e);
        return [];
    }
}

export function getInterstitialSpecies() {
    return interstitialSpecies;
}

/**
 * Calcula el radio máximo de sitio octaédrico en FCC
 * r_oct_max = (√2 - 1) * a / 2
 */
export function calcOctahedralSiteFCC(a) {
    if (!a || a <= 0) return 0;
    return a * (Math.sqrt(2) - 1) / 2;
}

/**
 * Calcula el radio máximo de sitio tetraédrico en FCC
 * r_tet_max = (√3 - 1) * a / (2√3)
 */
export function calcTetrahedralSiteFCC(a) {
    if (!a || a <= 0) return 0;
    return a * (Math.sqrt(3) - 1) / (2 * Math.sqrt(3));
}

/**
 * Calcula el radio máximo de sitio octaédrico en BCC
 * r_oct_max = (3 - √3) * a / 4
 */
export function calcOctahedralSiteBCC(a) {
    if (!a || a <= 0) return 0;
    return a * (3 - Math.sqrt(3)) / 4;
}

/**
 * Calcula el radio máximo de sitio tetraédrico en BCC
 * r_tet_max ≈ (3 - √3) * a / 4
 */
export function calcTetrahedralSiteBCC(a) {
    if (!a || a <= 0) return 0;
    return a * (3 - Math.sqrt(3)) / 4;
}

/**
 * Obtiene radios de sitios para una estructura
 */
export function getInterstitialSiteRadii(structure, a) {
    if (!a || a <= 0) return null;
    const s = structure?.toUpperCase();
    
    if (s === 'FCC') {
        return {
            octahedral: calcOctahedralSiteFCC(a),
            tetrahedral: calcTetrahedralSiteFCC(a),
            favorable: calcOctahedralSiteFCC(a),
            unfavorable: calcTetrahedralSiteFCC(a),
            structure: 'FCC'
        };
    } else if (s === 'BCC') {
        const oct = calcOctahedralSiteBCC(a);
        const tet = calcTetrahedralSiteBCC(a);
        return {
            octahedral: oct,
            tetrahedral: tet,
            favorable: tet,
            unfavorable: oct,
            structure: 'BCC'
        };
    }
    return null;
}

export function evaluateSite(latticeRadius, soluteRadius, siteType, structure) {
    const s = structure?.toLowerCase();
    if (s !== 'fcc' && s !== 'bcc') return null;

    const rules = SITE_RULES[s][siteType];
    const maxSiteRadius = latticeRadius * rules.radiusRatio;
    
    // Distorsión esperada
    const distortionRatio = soluteRadius / maxSiteRadius;
    let fits = soluteRadius <= maxSiteRadius;
    let rank = 'BAJA';
    let expectedDistortion = 'Mínima';
    
    if (distortionRatio <= 1.0) {
        rank = 'SIN DISTORSIÓN';
        expectedDistortion = 'Ninguna. Entra perfectamente en el sitio.';
    } else if (distortionRatio <= 1.2) {
        rank = 'BAJA';
        expectedDistortion = 'Baja. Expansión de red local.';
    } else if (distortionRatio <= 1.5) {
        rank = 'MODERADA';
        expectedDistortion = 'Moderada. Fuerte tensión local, útil para endurecimiento.';
    } else {
        rank = 'SEVERA';
        expectedDistortion = 'Severa. Alta penalización termodinámica.';
    }

    return {
        maxRadius: maxSiteRadius,
        soluteRadius,
        ratio: parseFloat(distortionRatio.toFixed(3)),
        fits,
        rank,
        expectedDistortion,
        sitesPerCell: rules.sitesPerCell,
        siteType
    };
}

export function getFavorableSite(structure) {
    const s = structure?.toLowerCase();
    if (s === 'fcc') return 'octahedral';  // 0.414 > 0.225
    if (s === 'bcc') return 'tetrahedral'; // 0.291 > 0.155
    return null;
}

export function analyzeInterstitialSystem(latticeRadius, structure, speciesId) {
    if (!interstitialSpecies.length) return null;
    
    const solute = interstitialSpecies.find(x => x.id === speciesId);
    if (!solute) return null;

    const s = structure?.toLowerCase();
    if (s !== 'fcc' && s !== 'bcc') return null;

    const octa = evaluateSite(latticeRadius, solute.radius, 'octahedral', s);
    const tetra = evaluateSite(latticeRadius, solute.radius, 'tetrahedral', s);

    const favoredSite = getFavorableSite(s);
    const favorableData = favoredSite === 'octahedral' ? octa : tetra;

    return {
        solute,
        latticeRadius,
        structure: structure.toUpperCase(),
        octahedral: octa,
        tetrahedral: tetra,
        favoredSite,
        favorableData
    };
}

/**
 * Evalúa endurecimiento por soluto intersticial
 */
export function assessInterstialStrengthening(metalData, soluteData) {
    if (!metalData || !soluteData || !metalData.latticeParameterA || !soluteData.radius) {
        return { hardening: 'DESCONOCIDO', mechanism: '?', score: 0 };
    }
    
    const structure = metalData.structure?.toUpperCase();
    const a = metalData.latticeParameterA;
    const r_solute = soluteData.radius;
    
    const sitesData = getInterstitialSiteRadii(structure, a);
    if (!sitesData) return { hardening: 'ERROR', mechanism: '?', score: 0 };
    
    const fit_oct = evaluateSite(a, r_solute, 'octahedral', structure);
    const fit_tet = evaluateSite(a, r_solute, 'tetrahedral', structure);
    
    let score = 50; // Base media
    let mechanism = 'Endurecimiento intersticial';
    
    // Evaluar mejor ajuste
    const best_fit = fit_oct.ratio < fit_tet.ratio ? fit_oct : fit_tet;
    
    if (!best_fit.fits) {
        score = 10;
        mechanism = 'Incompatible - Sin endurecimiento';
    } else {
        // Bonificación por distorsión (distorsión fuerte = más endurecimiento)
        if (best_fit.rank === 'SEVERA' || best_fit.rank === 'MODERADA') {
            score += 30;
        } else if (best_fit.rank === 'BAJA') {
            score += 10;
        } else if (best_fit.rank === 'SIN DISTORSIÓN') {
            score -= 10;
        }
        
        // Ajuste por estructura
        if (structure === 'BCC' && best_fit.rank === 'SEVERA') {
            score += 20; // En BCC, la distorsión severa es muy efectiva
        }
    }
    
    score = Math.max(0, Math.min(score, 100));
    
    let hardening = 'LEVE';
    if (score >= 80) hardening = 'MUY FUERTE';
    else if (score >= 60) hardening = 'FUERTE';
    else if (score >= 40) hardening = 'MODERADO';
    else if (score >= 20) hardening = 'LEVE';
    else hardening = 'NULO';
    
    return {
        hardening,
        mechanism,
        score: Math.round(score),
        siteType: best_fit.siteType
    };
}

/**
 * Evalúa fragilización por hidrógeno
 */
export function assessHydrogenEmbrittlement(metalData, H_concentration_ppm = 5) {
    if (!metalData) return { risk: 'DESCONOCIDO', mechanism: '?', score: 0 };
    
    let score = 0;
    let mechanism = 'N/A';
    
    const structure = metalData.structure?.toUpperCase();
    
    // BCC es mucho más susceptible a fragilización por H
    if (structure === 'BCC') {
        score = 70;
        mechanism = 'Ocupación de sitios tetraédricos, captura de dislocaciones';
    } else if (structure === 'FCC') {
        score = 25;
        mechanism = 'Ocupación octaédrica menos probable, efecto leve';
    } else {
        score = 40;
        mechanism = 'Fragilización intersticial por hidrógeno';
    }
    
    // Ajuste por concentración
    if (H_concentration_ppm > 100) score += 20;
    else if (H_concentration_ppm > 20) score += 10;
    else if (H_concentration_ppm > 5) score += 5;
    
    score = Math.max(0, Math.min(score, 100));
    
    let risk = 'NINGUNO';
    if (score >= 80) risk = 'CRÍTICO';
    else if (score >= 60) risk = 'SEVERO';
    else if (score >= 40) risk = 'SIGNIFICATIVO';
    else if (score >= 20) risk = 'LEVE';
    
    return {
        risk,
        mechanism,
        score: Math.round(score),
        H_concentration_ppm
    };
}
