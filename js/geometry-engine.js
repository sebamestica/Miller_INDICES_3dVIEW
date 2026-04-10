/**
 * Miller Explorer - Geometry Engine
 * Encapsulates complex 3d intersection and polygon construction logic.
 */
import * as THREE from 'three';

/**
 * Computes intersection points between a plane (defined by Miller indices)
 * and a 1x1x1 unit cube shifted by a specific origin.
 */
export function computePlaneCubeIntersection(h, k, l, shift, eps = 1e-7) {
    const points = [];
    
    // The cube has 12 edges. We intersect the plane hx + ky + lz = d with each.
    // In our coordinate mapping (used in previous logic):
    // k -> X(3d), l -> Y(3d), h -> Z(3d)
    // The plane equation is: k*(x - shift.y) + l*(y - shift.z) + h*(z - shift.x) = 1
    
    const edges = [
        // Bottom face (y=0)
        { p1: [0,0,0], p2: [1,0,0] }, { p1: [1,0,0], p2: [1,0,1] }, 
        { p1: [1,0,1], p2: [0,0,1] }, { p1: [0,0,1], p2: [0,0,0] },
        // Top face (y=1)
        { p1: [0,1,0], p2: [1,1,0] }, { p1: [1,1,0], p2: [1,1,1] }, 
        { p1: [1,1,1], p2: [0,1,1] }, { p1: [0,1,1], p2: [0,1,0] },
        // Vertical edges
        { p1: [0,0,0], p2: [0,1,0] }, { p1: [1,0,0], p2: [1,1,0] }, 
        { p1: [1,0,1], p2: [1,1,1] }, { p1: [0,0,1], p2: [0,1,1] }
    ];

    edges.forEach(edge => {
        const p1 = new THREE.Vector3(...edge.p1);
        const p2 = new THREE.Vector3(...edge.p2);
        const v = new THREE.Vector3().subVectors(p2, p1);
        
        // Dot product with plane normal (k, l, h)
        // d = Normal . (P - P_shifted) = 1
        const den = k * v.x + l * v.y + h * v.z;
        const num = 1 - (k * (p1.x - shift.y) + l * (p1.y - shift.z) + h * (p1.z - shift.x));

        if (Math.abs(den) > eps) {
            const t = num / den;
            if (t >= -eps && t <= 1 + eps) {
                points.push(p1.add(v.multiplyScalar(THREE.MathUtils.clamp(t, 0, 1))));
            }
        } else if (Math.abs(num) < eps) {
            // Edge is parallel and on the plane
            points.push(p1, p2);
        }
    });

    return dedupePoints(points, eps);
}

/**
 * Computes intersection points for a Hexagonal Prism.
 */
export function computePlaneHexIntersection(h, k, l, h_height = 2.2, eps = 1e-7) {
    const rawPoints = [];
    const verts = [];
    // 6 vertices at bottom (y=0), 6 at top (y=h_height)
    for(let n=0; n<6; n++) {
        const ang = n * Math.PI / 3;
        verts.push(new THREE.Vector3(Math.cos(ang), 0, -Math.sin(ang)));
    }
    for(let n=0; n<6; n++) {
        const ang = n * Math.PI / 3;
        verts.push(new THREE.Vector3(Math.cos(ang), h_height, -Math.sin(ang)));
    }
    
    const edges = [];
    for(let n=0; n<6; n++) {
        const next = (n+1)%6;
        edges.push({p1: verts[n], p2: verts[next]});       // bottom
        edges.push({p1: verts[n+6], p2: verts[next+6]}); // top
        edges.push({p1: verts[n], p2: verts[n+6]});      // vertical
    }

    // Normal for hex: (h, l, -(h + 2*k)/sqrt(3))
    const normal = new THREE.Vector3(h, l, -(h + 2*k)/Math.sqrt(3));
    
    // Coordinate Shift for negative L to keep intersection inside visible prism
    const shiftY = (l < 0) ? h_height : 0;
    
    edges.forEach(edge => {
        const p1 = edge.p1;
        const p2 = edge.p2;
        const v = new THREE.Vector3().subVectors(p2, p1);
        const den = normal.dot(v);
        const num = 1.0 - (normal.x * p1.x + normal.y * (p1.y - shiftY) + normal.z * p1.z);

        if (Math.abs(den) > eps) {
            const t = num / den;
            if (t >= -eps && t <= 1 + eps) {
                rawPoints.push(p1.clone().add(v.multiplyScalar(THREE.MathUtils.clamp(t,0,1))));
            }
        } else if (Math.abs(num) < eps) {
            rawPoints.push(p1.clone(), p2.clone());
        }
    });

    return dedupePoints(rawPoints, eps);
}

/**
 * Removes nearly identical points.
 */
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
 * Sorts points to form a convex polygon based on their center.
 */
export function sortPolygonPoints(points) {
    if (points.length < 3) return points;
    
    const center = new THREE.Vector3();
    points.forEach(p => center.add(p));
    center.divideScalar(points.length);

    // Get plane normal from first 3 points
    const v1 = new THREE.Vector3().subVectors(points[1], points[0]);
    const v2 = new THREE.Vector3().subVectors(points[2], points[0]);
    const normal = new THREE.Vector3().crossVectors(v1, v2).normalize();

    const b1 = new THREE.Vector3(1, 0, 0);
    if (Math.abs(normal.dot(b1)) > 0.9) b1.set(0, 0, 1);
    const ex = new THREE.Vector3().crossVectors(normal, b1).normalize();
    const ey = new THREE.Vector3().crossVectors(normal, ex).normalize();

    return points.sort((a, b) => {
        const da = a.clone().sub(center);
        const db = b.clone().sub(center);
        return Math.atan2(da.dot(ey), da.dot(ex)) - Math.atan2(db.dot(ey), db.dot(ex));
    });
}
