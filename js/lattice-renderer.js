/**
 * Miller Explorer - Lattice Renderer
 * Renders realistic 3D atomic lattices and physical defects for engineering mode.
 */
import * as THREE from 'three';

const ATOM_COLOR = 0x90a4ae;
const GHOST_COLOR = 0xff0000;
const SUBST_COLOR = 0x339af0;
const INTER_COLOR = 0x40c057;

// Cached Geometries to prevent GC spikes
let geoNormal, geoSubst, geoInter, geoVacancy;
let currentScale = 0;

function ensureGeometries(scale) {
    if (geoNormal && currentScale === scale) return;
    
    if (geoNormal) geoNormal.dispose();
    if (geoSubst) geoSubst.dispose();
    if (geoInter) geoInter.dispose();
    if (geoVacancy) geoVacancy.dispose();
    
    geoNormal = new THREE.SphereGeometry(scale * 0.08, 16, 16);
    geoSubst = new THREE.SphereGeometry(scale * 0.1, 16, 16);
    geoVacancy = new THREE.SphereGeometry(scale * 0.08, 12, 12);
    geoInter = new THREE.SphereGeometry(scale * 0.06, 16, 16);
    
    currentScale = scale;
}

// Cached Materials
const matNormal = new THREE.MeshPhongMaterial({ color: ATOM_COLOR, shininess: 90, transparent: true, opacity: 0.85 });
const matSubst = new THREE.MeshPhongMaterial({ color: SUBST_COLOR, shininess: 90 });
const matInter = new THREE.MeshPhongMaterial({ color: INTER_COLOR, shininess: 90 });
const matVacancy = new THREE.MeshBasicMaterial({ color: GHOST_COLOR, wireframe: true, transparent: true, opacity: 0.4 });

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

export function mapToThree(x, y, z) {
    return new THREE.Vector3(y, z, x);
}

/**
 * Builds a highly optimized THREE.Group using InstancedMesh for normal atoms,
 * ensuring draw calls scale beautifully on tablets and Samsung devices.
 */
export function buildLatticeGroup(structure, scale, defectType) {
    const group = new THREE.Group();
    ensureGeometries(scale);
    
    const atoms = getLatticeAtoms(structure);
    
    // Sort atoms: Normal vs Special
    const normalAtoms = [];
    const specialAtoms = [];
    
    atoms.forEach(pos => {
        if (defectType === 'vacancy' && pos.join(',') === '1,1,1') {
            specialAtoms.push({ pos, type: 'vacancy' });
        } else if (defectType === 'substitutional' && pos.join(',') === '1,1,1') {
            specialAtoms.push({ pos, type: 'substitutional' });
        } else {
            normalAtoms.push(pos);
        }
    });
    
    // Process Normal Atoms (Instanced: 1 Draw Call)
    if (normalAtoms.length > 0) {
        const instancedMesh = new THREE.InstancedMesh(geoNormal, matNormal, normalAtoms.length);
        const matrix = new THREE.Matrix4();
        
        normalAtoms.forEach((pos, idx) => {
            const pThree = mapToThree(...pos).multiplyScalar(scale);
            matrix.makeTranslation(pThree.x, pThree.y, pThree.z);
            instancedMesh.setMatrixAt(idx, matrix);
        });
        
        instancedMesh.instanceMatrix.needsUpdate = true;
        group.add(instancedMesh);
    }
    
    // Process Special Foundational Atoms
    specialAtoms.forEach(item => {
        let mesh;
        if (item.type === 'vacancy') {
            mesh = new THREE.Mesh(geoVacancy, matVacancy);
        } else {
            mesh = new THREE.Mesh(geoSubst, matSubst);
        }
        mesh.position.copy(mapToThree(...item.pos).multiplyScalar(scale));
        group.add(mesh);
    });

    // Handle Interstitial explicit
    if (defectType === 'interstitial') {
        let ipos = [0.5, 0.5, 0.5]; // SC Cubic site
        if (structure === 'bcc') ipos = [0.5, 0.5, 0]; // BCC Octahedral
        if (structure === 'fcc') ipos = [0.5, 0.5, 0.5]; // FCC Octahedral

        const mesh = new THREE.Mesh(geoInter, matInter);
        mesh.position.copy(mapToThree(...ipos).multiplyScalar(scale));
        group.add(mesh);
    }

    return group;
}
