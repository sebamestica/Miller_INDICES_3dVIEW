/**
 * ADVISOR ENGINE
 * Lógica de análisis técnico para el generador de reportes.
 */

import * as AdvisorMessages from './advisor-messages.js';

/**
 * Genera un reporte técnico basado en el estado cristalográfico.
 * Usado por app.js para el panel avanzado.
 */
export function generateAdvisorReport(data) {
    if (!data) return null;

    // Lógica simplificada para el panel avanzado
    let status = 'info';
    let message = `Sistema: ${data.structure}. `;
    
    if (data.mechanismScore > 0.8) {
        message += "Alta probabilidad de activación de sistemas de deslizamiento primarios.";
        status = 'warning';
    } else {
        message += "Configuración estable bajo condiciones de carga estándar.";
    }

    return {
        title: 'Análisis Cristalográfico',
        content: message,
        status: status
    };
}

/**
 * Genera un reporte técnico basado en la simulación mecánica.
 * Usado por mechanical-panel.js.
 */
export function generateMechanicalAdvice(stress, strains, vonMises, yieldLimit, fs, rss) {
    let status = 'info';
    let text = "";

    const strainMax = Math.max(Math.abs(strains.ex), Math.abs(strains.ey), Math.abs(strains.ez));

    if (fs < 1.0) {
        status = 'danger';
        text = AdvisorMessages.getMessage('HIGH_DEFORMATION', { strain: strainMax });
    } else if (fs < 1.5 || rss > yieldLimit * 0.4) {
        status = 'warning';
        text = AdvisorMessages.getMessage('YIELD_PROXIMITY', { rss, material: 'seleccionado' });
    } else {
        status = 'info';
        text = AdvisorMessages.getMessage('GENERAL_STABILITY', { strain: strainMax, material: 'seleccionado' });
    }

    return {
        text: text,
        status: status
    };
}
