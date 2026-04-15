

import * as InterstitialEngine from './interstitial-engine.js';

export function generateAdvisorReport(data) {
    const {
        structure,
        planeArea,
        planarRhoRank,
        directionActive,
        directionCompatible,
        mechanismScore,
        schmidMultiplier,
        activeDefect,
        metalId,        // Nuevo: para análisis de intersticiales
        speciesId       // Nuevo: para análisis de intersticiales
    } = data;

    const strengths = [];
    const limitations = [];
    const recommendations = [];
    let diagnosis = "";


    if (!directionActive) {
        limitations.push("Análisis mecánico incompleto por ausencia de dirección de deslizamiento [uvw].");
        recommendations.push("Activa y define una dirección [uvw] para completar el análisis de esfuerzo y mecanismos.");
    } else if (!directionCompatible) {
        limitations.push("La dirección de deslizamiento activa es secante al plano, invalidando modelos de deslizamiento coplanar.");
        recommendations.push("Prueba una dirección [uvw] que satisfaga h·u + k·v + l·w = 0 para garantizar compatibilidad geométrica.");
    } else {
        strengths.push("Dirección activa compatible con el plano actual, validando el análisis de movilidad geométrica.");
    }


    if (structure === 'fcc') {
        strengths.push("La red FCC favorece cualitativamente el empaquetamiento compacto y la consecuente formación de sistemas de deslizamiento prioritarios.");
    } else if (structure === 'bcc') {
        limitations.push("La red BCC carece de planos genuinamente compactos, requiriendo mayor activación térmica para el deslizamiento clásico.");
    } else if (structure === 'sc') {
        limitations.push("La estructura Cúbica Simple posee baja densidad volumétrica y funciona principalmente como un modelo académico simplificado (ej. Polonio).");
    }


    if (planarRhoRank === 'ALTA' || mechanismScore >= 7) {
        strengths.push("La alta densidad planar sugiere un plano relativamente compacto, favoreciendo mecanismos de deformación primaria.");
    } else if (planarRhoRank === 'BAJA' && mechanismScore < 4) {
        limitations.push("Plano ensanchado de baja densidad. Poco favorable para actuar como sistema de deslizamiento a temperatura ambiente.");
    }


    if (schmidMultiplier !== null) {
        if (schmidMultiplier < 0.2) {
            limitations.push("Factor de Schmid muy bajo. La orientación de carga externa casi no transfiere esfuerzo de corte al plano evaluado.");
            recommendations.push("Ajuste la dirección de carga para optimizar el esfuerzo de corte resuelto y aumentar el factor de Schmid.");
        } else if (schmidMultiplier >= 0.4) {
            strengths.push("Factor de Schmid alto (próximo a 0.5), maximizando la transferencia de tensión mecánica al eje de deslizamiento.");
        }
    } else {
        recommendations.push("Ajuste vector de carga (P) distinto de nulo para evaluar contribuciones mecánicas mediante la Ley de Schmid.");
    }


    if (activeDefect === 'vacancy') {
        limitations.push("Presencia de vacancia: genera distorsión elástica leve, actuando como núcleo moderado pero de bajo freno mecánico.");
    } else if (activeDefect === 'interstitial') {
        limitations.push("Átomo intersticial detectado: distorsiona fuertemente la red local asimétricamente, introduciendo una penalidad severa a la movilidad de dislocaciones.");
        recommendations.push("Considere modelos de endurecimiento por solución sólida intersticial para comprender la reducción de la plasticidad analizada.");
    } else if (activeDefect === 'substitutional') {
        limitations.push("Falla sustitucional: actúa como anclaje puntual, originando un freno friccional adicional producto de variaciones de tamaño de radio atómico.");
    }


    const strengthRatio = strengths.length / (strengths.length + limitations.length || 1);
    
    if (!directionActive) {
        diagnosis = "La geometría fundamental del corte es visible, pero la falta de un análisis de dirección (vector Burgers cualitativo) impide interpretar el potencial de deslizamiento.";
    } else if (!directionCompatible) {
        diagnosis = "Geometría cristalográfica válida, pero incongruente operativamente: incompatibilidad entre el plano propuesto y la dirección de deslizamiento impuesta.";
    } else if (strengthRatio > 0.6) {
        diagnosis = "El sistema actual es geométricamente consistente y francamente favorable para propiciar mecánicas de deslizamiento clásico bajo condiciones ambientales.";
    } else if (strengthRatio > 0.3) {
        diagnosis = "La estructura y el corte son formalmente consistentes, pero ciertas restricciones atómicas o de carga limitan severamente la favorabilidad mecánica global.";
    } else {
        diagnosis = "Condiciones severamente desfavorables para el deslizamiento primario; el plano evaluado requeriría aportes energéticos poco canónicos para ser operante.";
    }

    return {
        diagnosis,
        strengths,
        limitations,
        recommendations: recommendations.slice(0, 2)
    };
}

/**
 * Genera insights sobre el sistema intersticial seleccionado
 * @param {object} metal - datos del metal
 * @param {object} solute - datos del soluto
 * @returns {object} {insights, warnings, recommendations}
 */
export async function generateInterstitialInsights(metal, solute) {
    const insights = [];
    const warnings = [];
    const recommendations = [];

    if (!metal || !solute) {
        return { insights, warnings, recommendations };
    }

    const structure = metal.structure?.toUpperCase();
    const a = metal.latticeParameterA;
    const r_solute = solute.radius;

    // Análisis geométrico
    const sites = InterstitialEngine.getInterstitialSiteRadii(structure, a);
    if (!sites) {
        return { insights, warnings, recommendations };
    }

    const fit_oct = InterstitialEngine.evaluateSite(a, r_solute, 'octahedral', structure);
    const fit_tet = InterstitialEngine.evaluateSite(a, r_solute, 'tetrahedral', structure);

    // Determinar mejor sitio
    const best_fit = fit_oct.ratio < fit_tet.ratio ? fit_oct : fit_tet;

    // Insights geométricos
    if (best_fit.fits) {
        insights.push(`${solute.symbol} cabe en sitio ${best_fit.siteType} de ${structure}.`);
        insights.push(`Distorsión esperada: ${best_fit.rank}.`);
    } else {
        insights.push(`${solute.symbol} NO cabe sin distorsión severa en ${structure}.`);
    }

    // Análisis específicos por sistema
    if (structure === 'BCC') {
        insights.push("Estructura BCC: cambios de propiedades mecánicas especialmente pronunciados.");
        
        if (solute.symbol === 'H') {
            warnings.push("⚠️ HIDRÓGENO EN BCC: Alto riesgo de fragilización.");
            recommendations.push("Evitar concentraciones altas de H en BCC (Fe, W, etc.).");
        } else if (solute.symbol === 'C') {
            insights.push("Carbon en BCC (Fe): Endurecimiento muy efectivo pero reduce ductilidad.");
            recommendations.push("Controlar concentración de C para balance resistencia-tenacidad.");
        }
    } else if (structure === 'FCC') {
        insights.push("Estructura FCC: Mayor tolerancia a distorsión intersticial.");
        
        if (solute.symbol === 'C') {
            insights.push("Carbon en FCC: Excelente para endurecimiento sin fragilización severa.");
            recommendations.push("C en Ni, Pd, Cu ofrece propiedades mecánicas mejoradas.");
        } else if (solute.symbol === 'H') {
            if (metal.symbol === 'Pd') {
                insights.push("H en Pd (FCC): Absorción única y reversible.");
                recommendations.push("Aplicación potencial: almacenamiento y purificación de H₂.");
            } else {
                insights.push("H en FCC: Menos crítico que en BCC pero aún puede afectar.");
            }
        }
    }

    // Endurecimiento esperado
    if (best_fit.fits) {
        const hardening = InterstitialEngine.assessInterstialStrengthening(metal, solute);
        insights.push(`Endurecimiento estimado: ${hardening.hardening}.`);
        insights.push(`Mecanismo: ${hardening.mechanism}.`);
    }

    // Evaluación específica de H para fragilización
    if (solute.symbol === 'H') {
        const embrittlement = InterstitialEngine.assessHydrogenEmbrittlement(metal, 5);
        if (embrittlement.risk !== 'NINGUNO') {
            warnings.push(`Riesgo de fragilización por H: ${embrittlement.risk}.`);
        }
    }

    return {
        insights,
        warnings,
        recommendations
    };
}
