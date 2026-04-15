
import * as THREE from 'three';

/**
 * Calcula la intersección de un plano de Miller con una celda unitaria cúbica
 */
export function computePlaneCubeIntersection(h, k, l, shift, eps = 1e-7) {
    const points = [];
    
    // Definición de las 12 aristas del cubo unitario
    const edges = [
        { p1: [0,0,0], p2: [1,0,0] }, { p1: [1,0,0], p2: [1,0,1] }, 
        { p1: [1,0,1], p2: [0,0,1] }, { p1: [0,0,1], p2: [0,0,0] },
        { p1: [0,1,0], p2: [1,1,0] }, { p1: [1,1,0], p2: [1,1,1] }, 
        { p1: [1,1,1], p2: [0,1,1] }, { p1: [0,1,1], p2: [0,1,0] },
        { p1: [0,0,0], p2: [0,1,0] }, { p1: [1,0,0], p2: [1,1,0] }, 
        { p1: [1,0,1], p2: [1,1,1] }, { p1: [0,0,1], p2: [0,1,1] }
    ];

    edges.forEach(edge => {
        const p1 = new THREE.Vector3(...edge.p1);
        const p2 = new THREE.Vector3(...edge.p2);
        const v = new THREE.Vector3().subVectors(p2, p1);
        
        // Ecuación del plano: kx + ly + hz = 1 (Ajustado a la rotación mapToThree)
        const den = k * v.x + l * v.y + h * v.z;
        const num = 1 - (k * (p1.x - shift.y) + l * (p1.y - shift.z) + h * (p1.z - shift.x));

        if (Math.abs(den) > eps) {
            const t = num / den;
            if (t >= -eps && t <= 1 + eps) {
                points.push(p1.add(v.multiplyScalar(THREE.MathUtils.clamp(t, 0, 1))));
            }
        }
    });

    return dedupePoints(points, eps);
}

export function dedupePoints(points, eps = 1e-6) {
    const unique = [];
    for (const p of points) {
        if (!unique.some(u => u.distanceTo(p) < eps)) {
            unique.push(p);
        }
    }
    return unique;
}

/**
 * Ordena los vértices del polígono para un renderizado correcto de fan o de indexación
 */
export function sortPolygonPoints(points) {
    if (points.length < 3) return points;
    
    const center = new THREE.Vector3();
    points.forEach(p => center.add(p));
    center.divideScalar(points.length);

    // Encontrar una base local en el plano para calcular ángulos polares
    const v1 = new THREE.Vector3().subVectors(points[0], center).normalize();
    let v2 = null;
    let n = new THREE.Vector3();
    
    // Buscar un segundo vector que no sea colineal con v1
    for (let i = 1; i < points.length; i++) {
        const candidate = new THREE.Vector3().subVectors(points[i], center);
        n.crossVectors(v1, candidate);
        if (n.lengthSq() > 1e-6) {
            v2 = candidate;
            n.normalize();
            break;
        }
    }
    
    // Fallback: Si todos son colineales (muy raro), simplemente saltarse el ordenamiento
    if (!v2) return points; 

    const v3 = new THREE.Vector3().crossVectors(n, v1).normalize();

    return points.sort((a, b) => {
        const da = a.clone().sub(center);
        const db = b.clone().sub(center);
        const angleA = Math.atan2(da.dot(v3), da.dot(v1));
        const angleB = Math.atan2(db.dot(v3), db.dot(v1));
        return angleA - angleB;
    });
}
