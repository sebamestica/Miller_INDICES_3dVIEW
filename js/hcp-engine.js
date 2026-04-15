import * as THREE from 'three';
import * as HCP_MATH from './hcp-math.js';

/**
 * HCP GEOMETRY ENGINE - AUDITADA
 * Maneja el posicionamiento físico de los planos dentro del prisma.
 */

export function getHcpPrismVertices(a, c) {
    const verts = [];
    // Geometría absoluta: Base en Y=0, Techo en Y=c
    for (let yVal of [0, c]) {
        for (let i = 0; i < 6; i++) {
            const angle = i * Math.PI / 3;
            verts.push(new THREE.Vector3(a * Math.cos(angle), yVal, a * Math.sin(angle)));
        }
    }
    return verts;
}

export function computeHcpPlaneIntersection(h, k, i, l, a, c, eps = 1e-6) {
    const verts = getHcpPrismVertices(a, c);
    const edges = [];
    
    // Construcción de las 18 aristas del prisma hexagonal
    for (let idx = 0; idx < 6; idx++) {
        const next = (idx + 1) % 6;
        edges.push(new THREE.Line3(verts[idx], verts[next]));           // Base
        edges.push(new THREE.Line3(verts[idx + 6], verts[next + 6]));   // Top
        edges.push(new THREE.Line3(verts[idx], verts[idx + 6]));        // Vertical
    }

    const normal = HCP_MATH.getHcpCartesianNormal(h, k, l, a, c);
    if (normal.lengthSq() < 1e-12) return [];

    // LÓGICA DE POSICIONAMIENTO (PATCH 0001)
    // Buscamos el miembro de la familia de planos (N.P = d) que mejor represente la celda.
    // Para l=1, d=1 es el techo (0001). Para l=0, d=0 es un plano que pasa por el centro.
    let bestPoints = [];
    
    // Intentamos d=1 (estándar), si no hay intersección clara o es basal l=0, probamos d=0
    let targets = [];
    if (h === 0 && k === 0 && i === 0) {
        // Planos puramente basales (000l)
        targets = [l, 0]; // (0001) -> d=1 (techo), (0002) -> d=1 (medio) porque N es el doble de largo
    } else {
        targets = [1, 0, -1, 0.5];
    }

    for (let d of targets) {
        const points = [];
        edges.forEach(edge => {
            const intersect = new THREE.Vector3();
            // Ecuación: N.x*x + N.y*y + N.z*z = d
            const p1 = edge.start;
            const p2 = edge.end;
            const dot1 = normal.dot(p1);
            const dot2 = normal.dot(p2);

            if (Math.abs(dot2 - dot1) > 1e-9) {
                const t = (d - dot1) / (dot2 - dot1);
                if (t >= -eps && t <= 1 + eps) {
                    points.push(p1.clone().lerp(p2, t));
                }
            } else if (Math.abs(dot1 - d) < eps) {
                points.push(p1.clone(), p2.clone());
            }
        });

        const unique = [];
        points.forEach(p => {
            if (!unique.some(up => up.distanceTo(p) < 1e-4)) unique.push(p);
        });

        if (unique.length >= 3) {
            bestPoints = sortHcpPoints(unique, normal);
            if (bestPoints.length >= 3) break;
        }
    }

    return bestPoints;
}

function sortHcpPoints(points, normal) {
    const center = new THREE.Vector3();
    points.forEach(p => center.add(p));
    center.divideScalar(points.length);

    const v1 = new THREE.Vector3().subVectors(points[0], center).normalize();
    const v2 = new THREE.Vector3().crossVectors(normal, v1).normalize();

    return points.sort((a, b) => {
        const da = a.clone().sub(center);
        const db = b.clone().sub(center);
        return Math.atan2(da.dot(v2), da.dot(v1)) - Math.atan2(db.dot(v2), db.dot(v1));
    });
}

/**
 * Retorna los sitios atómicos para una celda HCP de 14 átomos (prisma hexagonal).
 */
export function getHcpLatticeSites(a, c) {
    const sites = [];

    // Capa A Inferior (y=0): Centro + 6 esquinas
    sites.push({ pos: new THREE.Vector3(0, 0, 0), type: 'center' });
    for (let i = 0; i < 6; i++) {
        const angle = i * Math.PI / 3;
        sites.push({ pos: new THREE.Vector3(a * Math.cos(angle), 0, a * Math.sin(angle)), type: 'corner' });
    }

    // Capa B Media (y=c/2): 3 átomos internos en los huecos
    const distB = a / Math.sqrt(3);
    const anglesB = [Math.PI/6, 5*Math.PI/6, 3*Math.PI/2]; // 30, 150, 270 grados
    anglesB.forEach(angle => {
        sites.push({ pos: new THREE.Vector3(distB * Math.cos(angle), c/2, distB * Math.sin(angle)), type: 'internal' });
    });

    // Capa A Superior (y=c): Centro + 6 esquinas
    sites.push({ pos: new THREE.Vector3(0, c, 0), type: 'center' });
    for (let i = 0; i < 6; i++) {
        const angle = i * Math.PI / 3;
        sites.push({ pos: new THREE.Vector3(a * Math.cos(angle), c, a * Math.sin(angle)), type: 'corner' });
    }

    return sites;
}
