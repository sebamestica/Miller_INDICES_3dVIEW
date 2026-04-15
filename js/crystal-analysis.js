
import * as THREE from 'three';


export function validateDirectionIndices(u, v, w) {
    if (isNaN(u) || isNaN(v) || isNaN(w)) return false;
    return !(u === 0 && v === 0 && w === 0);
}


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


export function computeDirectionVector(u, v, w, system) {
    if (system === 'cubic') {

        return new THREE.Vector3(v, w, u).normalize();
    }

    return null;
}
