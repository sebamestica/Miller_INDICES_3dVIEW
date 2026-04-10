/**
 * Miller Explorer - Defect Engine
 * Conceptual representation of point defects and their impact.
 */

export const DEFECT_TYPES = {
    NONE: 'none',
    VACANCY: 'vacancy',
    INTERSTITIAL: 'interstitial',
    SUBSTITUTIONAL: 'substitutional'
};

/**
 * Calculates a qualitative penalty or adjustment to the mechanism favorability.
 */
export function computeDefectPenalty(type) {
    switch (type) {
        case DEFECT_TYPES.VACANCY:
            return { multiplier: 0.95, text: 'Las vacancias pueden facilitar la difusión, pero distorsionan ligeramente la red local.' };
        case DEFECT_TYPES.INTERSTITIAL:
            return { multiplier: 0.8, text: 'Defectos intersticiales crean grandes campos de tensión, dificultando el deslizamiento global.' };
        case DEFECT_TYPES.SUBSTITUTIONAL:
            return { multiplier: 0.9, text: 'Átomos sustitucionales causan endurecimiento por solución sólida, entorpeciendo el movimiento de dislocaciones.' };
        default:
            return { multiplier: 1.0, text: '' };
    }
}

/**
 * Returns technical info for the UI.
 */
export function getDefectDescription(type) {
    const data = computeDefectPenalty(type);
    return data.text;
}
