/**
 * ADVISOR MESSAGES DICTIONARY
 * Contiene las plantillas de mensajes técnicos sin emojis.
 */

const MESSAGES = {
    GENERAL_STABILITY: (params) => 
        `El sistema se encuentra en un régimen elástico estable para el material ${params.material}. La deformación actual (${(params.strain * 100).toFixed(2)}%) no compromete la integridad de la red cristalina.`,
    
    HIGH_DEFORMATION: (params) => 
        `ALERTA TÉCNICA: Se ha detectado una deformación del ${(params.strain * 100).toFixed(2)}%. Este nivel supera los límites elásticos convencionales, sugiriendo el inicio de una nucleación de dislocaciones y posible endurecimiento por deformación.`,
    
    YIELD_PROXIMITY: (params) => 
        `PRECAUCIÓN: El esfuerzo cortante resuelto (RSS) de ${params.rss.toFixed(2)} MPa se aproxima al límite elástico del material. Existe un riesgo inminente de deslizamiento en los planos de mayor densidad atómica.`,
    
    HCP_RESTRICTION: () => 
        `AVISO: El análisis mecánico automatizado está actualmente optimizado para sistemas cúbicos. Para estructuras Hexagonales Compactas (HCP), se recomienda un análisis manual de los planos basal y prismático.`
};

export function getMessage(key, params) {
    if (MESSAGES[key]) {
        return MESSAGES[key](params);
    }
    return "No hay observaciones técnicas disponibles para el estado actual.";
}
