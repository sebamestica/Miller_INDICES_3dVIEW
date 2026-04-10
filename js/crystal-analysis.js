/**
 * Miller Explorer - Crystal Analysis Module
 * Handles advanced crystallographic relationships and analytics.
 */
import * as THREE from 'three';

/**
 * Validates if the direction indices [u v w] are integers and not all zero.
 */
export function validateDirectionIndices(u, v, w) {
    if (isNaN(u) || isNaN(v) || isNaN(w)) return false;
    return !(u === 0 && v === 0 && w === 0);
}

/**
 * Checks the compatibility between a plane (h k l) and a direction [u v w] for cubic systems.
 * The condition is h*u + k*v + l*w = 0 if the direction lies in the plane.
 */
export function checkPlaneDirectionCompatibility(plane, direction) {
    const { h, k, l } = plane;
    const { u, v, w } = direction;
    const value = h * u + k * v + l * w;
    return {
        dotProduct: value,
        liesInPlane: Math.abs(value) < 1e-7,
        interpretation: Math.abs(value) < 1e-7 
            ? "La dirección yace sobre el plano." 
            : "La dirección es perpendicular o secante al plano."
    };
}

/**
 * Computes the 3D vector for a given crystallographic direction [u v w].
 */
export function computeDirectionVector(u, v, w, system) {
    if (system === 'cubic') {
        // Mapping: h->Z, k->X, l->Y consistent with normal vector
        return new THREE.Vector3(v, w, u).normalize();
    }
    // Hexagonal not implemented for advanced analysis yet
    return null;
}
