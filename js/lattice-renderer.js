/**
 * Miller Explorer - Lattice Renderer
 * Renders realistic 3D atomic lattices and physical defects for engineering mode.
 */
import * as THREE from 'three';

const ATOM_COLOR = 0x90a4ae;
const GHOST_COLOR = 0xff0000;
const SUBST_COLOR = 0x339af0;
const INTER_COLOR = 0x40c057;

export function getLatticeAtoms(structure) {
    const corners = [
        [0,0,0], [1,0,0], [0,1,0], [1,1,0],
        [0,0,1], [1,0,1], [0,1,1], [1,1,1]
    ];
    let atoms = [...corners];

    if (structure === 'bcc') {
        atoms.push([0.5, 0.5, 0.5]);
    } else if (structure === 'fcc') {
        atoms.push(
            [0.5, 0.5, 0], [0.5, 0.5, 1],
            [0.5, 0, 0.5], [0.5, 1, 0.5],
            [0, 0.5, 0.5], [1, 0.5, 0.5]
        );
    }
    return atoms;
}

// Maps crystallographic (x,y,z) to THREE (y,z,x) according to engine mapping
export function mapToThree(x, y, z) {
    return new THREE.Vector3(y, z, x);
}

/**
 * Builds a THREE.Group representing the unit cell lattice atoms.
 */
export function buildLatticeGroup(structure, scale, defectType) {
    const group = new THREE.Group();
    const atoms = getLatticeAtoms(structure);
    
    const matNormal = new THREE.MeshPhongMaterial({ 
        color: ATOM_COLOR, 
        shininess: 90,
        transparent: true,
        opacity: 0.85 
    });

    atoms.forEach(pos => {
        // Handle Vacancy
        if (defectType === 'vacancy' && pos.join(',') === '1,1,1') {
            const mesh = new THREE.Mesh(
                new THREE.SphereGeometry(scale * 0.08, 16, 16),
                new THREE.MeshBasicMaterial({ color: GHOST_COLOR, wireframe: true, transparent: true, opacity: 0.4 })
            );
            mesh.position.copy(mapToThree(...pos).multiplyScalar(scale));
            group.add(mesh);
            return;
        }

        // Handle Substitutional
        const isSubst = (defectType === 'substitutional' && pos.join(',') === '1,1,1');
        const mat = isSubst ? new THREE.MeshPhongMaterial({ color: SUBST_COLOR, shininess: 90 }) : matNormal;
        const rad = isSubst ? 0.1 : 0.08;

        const mesh = new THREE.Mesh(new THREE.SphereGeometry(scale * rad, 32, 32), mat);
        mesh.position.copy(mapToThree(...pos).multiplyScalar(scale));
        group.add(mesh);
    });

    // Handle Interstitial
    if (defectType === 'interstitial') {
        let ipos = [0.5, 0.5, 0.5]; // SC Cubic site
        if (structure === 'bcc') ipos = [0.5, 0.5, 0]; // BCC Octahedral
        if (structure === 'fcc') ipos = [0.5, 0.5, 0.5]; // FCC Octahedral

        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(scale * 0.06, 32, 32),
            new THREE.MeshPhongMaterial({ color: INTER_COLOR, shininess: 90 })
        );
        mesh.position.copy(mapToThree(...ipos).multiplyScalar(scale));
        group.add(mesh);
    }

    return group;
}
