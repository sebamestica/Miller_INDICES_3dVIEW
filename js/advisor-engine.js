/**
 * Miller Explorer - Advisor Engine
 * Generates rule-based technical insights based on the holistic state of the unit cell.
 */

export function generateAdvisorReport(data) {
    const {
        structure,
        planeArea,
        planarRhoRank,
        directionActive,
        directionCompatible,
        mechanismScore,
        schmidMultiplier, // null if load=0
        activeDefect
    } = data;

    const strengths = [];
    const limitations = [];
    const recommendations = [];
    let diagnosis = "";

    // 1. Direction Rules
    if (!directionActive) {
        limitations.push("Análisis mecánico incompleto por ausencia de dirección de deslizamiento [uvw].");
        recommendations.push("Activa y define una dirección [uvw] para completar el análisis de esfuerzo y mecanismos.");
    } else if (!directionCompatible) {
        limitations.push("La dirección de deslizamiento activa es secante al plano, invalidando modelos de deslizamiento coplanar.");
        recommendations.push("Prueba una dirección [uvw] que satisfaga h·u + k·v + l·w = 0 para garantizar compatibilidad geométrica.");
    } else {
        strengths.push("Dirección activa compatible con el plano actual, validando el análisis de movilidad geométrica.");
    }

    // 2. Crystal Structure Rules
    if (structure === 'fcc') {
        strengths.push("La red FCC favorece cualitativamente el empaquetamiento compacto y la consecuente formación de sistemas de deslizamiento prioritarios.");
    } else if (structure === 'bcc') {
        limitations.push("La red BCC carece de planos genuinamente compactos, requiriendo mayor activación térmica para el deslizamiento clásico.");
    } else if (structure === 'sc') {
        limitations.push("La estructura Cúbica Simple posee baja densidad volumétrica y funciona principalmente como un modelo académico simplificado (ej. Polonio).");
    }

    // 3. Density & Mechanism Rules
    if (planarRhoRank === 'ALTA' || mechanismScore >= 7) {
        strengths.push("La alta densidad planar sugiere un plano relativamente compacto, favoreciendo mecanismos de deformación primaria.");
    } else if (planarRhoRank === 'BAJA' && mechanismScore < 4) {
        limitations.push("Plano ensanchado de baja densidad. Poco favorable para actuar como sistema de deslizamiento a temperatura ambiente.");
    }

    // 4. Schmid Rules
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

    // 5. Defect Rules
    if (activeDefect === 'vacancy') {
        limitations.push("Presencia de vacancia: genera distorsión elástica leve, actuando como núcleo moderado pero de bajo freno mecánico.");
    } else if (activeDefect === 'interstitial') {
        limitations.push("Átomo intersticial detectado: distorsiona fuertemente la red local asimétricamente, introduciendo una penalidad severa a la movilidad de dislocaciones.");
        recommendations.push("Considere modelos de endurecimiento por solución sólida intersticial para comprender la reducción de la plasticidad analizada.");
    } else if (activeDefect === 'substitutional') {
        limitations.push("Falla sustitucional: actúa como anclaje puntual, originando un freno friccional adicional producto de variaciones de tamaño de radio atómico.");
    }

    // Compose Conclusion
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
        recommendations: recommendations.slice(0, 2) // keep max 2 recommendations
    };
}
