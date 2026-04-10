/**
 * Miller Explorer - Mathematical Utilities
 */
import * as THREE from 'three';

const EPS = 1e-6;

/**
 * Validates Miller Indices for Cubic systems.
 * Returns false if all indices are zero.
 */
export function validateCubicIndices(h, k, l) {
    return !(h === 0 && k === 0 && l === 0);
}

/**
 * Validates Miller-Bravais Indices for Hexagonal systems.
 * h + k + i must equal 0.
 */
export function validateHexIndices(h, k, i, l) {
    if (h === 0 && k === 0 && i === 0 && l === 0) return { valid: false, expectedI: 0 };
    const diff = h + k + i;
    return {
        valid: Math.abs(diff) < EPS,
        expectedI: -(h + k)
    };
}

/**
 * Sanitizes and parses technical integer inputs.
 * Handles negative signs and removes illegal characters.
 */
export function parseIntegerInput(value) {
    let cleaned = String(value).trim();
    cleaned = cleaned.replace(/[,.+\s]/g, '');
    const hasMinus = cleaned.includes('-');
    cleaned = cleaned.replace(/-/g, '');
    if (hasMinus && cleaned.length > 0) cleaned = '-' + cleaned;
    
    if (!/^[-]?\d+$/.test(cleaned) || cleaned === '-0') {
        return (cleaned === '0' || cleaned === '-0') ? 0 : null;
    }
    return parseInt(cleaned, 10);
}

/**
 * Computes the magnitude of the normal vector.
 */
export function computeVectorMagnitude(h, k, i, l, system) {
    if (system === 'cubic') {
        return Math.sqrt(h*h + k*k + l*l);
    } else {
        // Approximate magnitude for hexagonal representation
        return Math.sqrt(h*h + (h+2*k)*(h+2*k)/3 + l*l);
    }
}
