/**
 * Miller Explorer - Plane Metrics
 * Computes exact areas, intercepts and densities for planes.
 */
import * as THREE from 'three';
import { getLatticeAtoms, mapToThree } from './lattice-renderer.js';

export function computePlaneArea(polygonPoints) {
    if (!polygonPoints || polygonPoints.length < 3) return 0;
    
    let area = 0;
    const p0 = polygonPoints[0];
    
    for (let i = 1; i < polygonPoints.length - 1; i++) {
        const v1 = new THREE.Vector3().subVectors(polygonPoints[i], p0);
        const v2 = new THREE.Vector3().subVectors(polygonPoints[i+1], p0);
        const cross = new THREE.Vector3().crossVectors(v1, v2);
        area += cross.length() * 0.5;
    }
    
    return area; 
}

export function countPlaneAtoms(polygonPoints, structure, defectType) {
    if (!polygonPoints || polygonPoints.length < 3) return 0;
    
    const atoms = getLatticeAtoms(structure);
    
    let validAtoms = [...atoms];
    if (defectType === 'vacancy') {
        validAtoms = validAtoms.filter(pos => pos.join(',') !== '1,1,1');
    }
    if (defectType === 'interstitial') {
        let ipos = [0.5, 0.5, 0.5];
        if (structure === 'bcc') ipos = [0.5, 0.5, 0];
        if (structure === 'fcc') ipos = [0.5, 0.5, 0.5];
        validAtoms.push(ipos);
    }
    
    const plane = new THREE.Plane().setFromCoplanarPoints(polygonPoints[0], polygonPoints[1], polygonPoints[2]);
    
    let count = 0;
    const eps = 1e-4;
    
    validAtoms.forEach(pos => {
        const pThree = mapToThree(...pos);
        if (Math.abs(plane.distanceToPoint(pThree)) < eps) {
            count++;
        }
    });
    
    return count;
}

export function computePlanarDensity(area, atomCount) {
    if (area < 1e-6) return 0;
    return atomCount / area;
}

export function explainPlanarDensity(rho) {
    if (rho === 0 || isNaN(rho)) return { rank: '-', color: 'var(--text-muted)', text: 'Plano truncado o sin átomos compartidos.' };
    if (rho >= 2.0) return { rank: 'ALTA', color: 'var(--success)', text: 'Alta aglomeración atómica. Fundamental en sistemas de deslizamiento reales.' };
    if (rho >= 1.0) return { rank: 'MEDIA', color: 'var(--accent-color)', text: 'Compacidad modal. Actividad de deslizamiento posible a altas temperaturas.' };
    return { rank: 'BAJA', color: 'var(--danger)', text: 'Plano ensanchado poco denso. Deslizamiento improbable sin dislocaciones accesorias complejas.' };
}
