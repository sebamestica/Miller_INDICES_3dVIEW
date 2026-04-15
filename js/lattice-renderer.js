import * as THREE from 'three';
import { CONFIG, getState } from './state.js';
import * as HCP_ENGINE from './hcp-engine.js';

const ATOM_COLOR = 0x90a4ae;
const GHOST_COLOR = 0xff0000;
const SUBST_COLOR = 0x339af0;
const INTER_COLOR = 0x40c057;


let geoNormal, geoSubst, geoInter, geoVacancy;
let currentScale = 0;
let currentSegments = 0;

function ensureGeometries(scale) {
    const { performance } = getState();
    const segs = performance.sphereSegments;

    if (geoNormal && currentScale === scale && currentSegments === segs) return;
    
    if (geoNormal) geoNormal.dispose();
    if (geoSubst) geoSubst.dispose();
    if (geoInter) geoInter.dispose();
    if (geoVacancy) geoVacancy.dispose();
    
    geoNormal = new THREE.SphereGeometry(scale * 0.08, segs, segs);
    geoSubst = new THREE.SphereGeometry(scale * 0.1, segs, segs);
    geoVacancy = new THREE.SphereGeometry(scale * 0.08, Math.max(8, segs - 4), Math.max(8, segs - 4));
    geoInter = new THREE.SphereGeometry(scale * 0.06, segs, segs);
    
    currentScale = scale;
    currentSegments = segs;
}


const matNormal = new THREE.MeshPhongMaterial({ color: ATOM_COLOR, shininess: 90, transparent: true, opacity: 0.85 });
const matSubst = new THREE.MeshPhongMaterial({ color: SUBST_COLOR, shininess: 90 });
const matInter = new THREE.MeshPhongMaterial({ color: INTER_COLOR, shininess: 90 });
const matVacancy = new THREE.MeshBasicMaterial({ color: GHOST_COLOR, wireframe: true, transparent: true, opacity: 0.4 });

export function getLatticeAtoms(structure) {
    const s = structure ? structure.toLowerCase() : 'sc';
    if (s === 'hcp') return []; // Delegamos a lógica específica de HCP

    const corners = [
        [0,0,0], [1,0,0], [0,1,0], [1,1,0],
        [0,0,1], [1,0,1], [0,1,1], [1,1,1]
    ];
    let atoms = [...corners];

    if (s === 'bcc') {
        atoms.push([0.5, 0.5, 0.5]);
    } else if (s === 'fcc') {
        atoms.push(
            [0.5, 0.5, 0], [0.5, 0.5, 1],
            [0.5, 0, 0.5], [0.5, 1, 0.5],
            [0, 0.5, 0.5], [1, 0.5, 0.5]
        );
    }
    return atoms;
}

// getHcpLatticeSites removido - se utiliza la versión auditada de HCP_ENGINE


export function mapToThree(x, y, z) {
    return new THREE.Vector3(y, z, x);
}


export function buildLatticeGroup(structure, scale, defectType, caRatio = null, onlyDefects = false) {
    const group = new THREE.Group();
    ensureGeometries(scale);
    const sLower = structure.toLowerCase();
    
    if (sLower === 'hcp') {
        const sites = HCP_ENGINE.getHcpLatticeSites(scale, (caRatio || CONFIG.hcp_ca_ratio));
        let normalSites = [];
        let specialSites = [];

        sites.forEach((s, idx) => {
            const pos = s.pos;
            if (defectType === 'vacancy' && idx === 0) {
                specialSites.push({ pos, type: 'vacancy' });
            } else if (defectType === 'substitutional' && idx === 0) {
                specialSites.push({ pos, type: 'substitutional' });
            } else {
                normalSites.push(pos);
            }
        });

        // Renderizar red base (solo si NO pedimos solo defectos)
        if (!onlyDefects && normalSites.length > 0) {
            const im = new THREE.InstancedMesh(geoNormal, matNormal, normalSites.length);
            const m = new THREE.Matrix4();
            normalSites.forEach((p, i) => {
                m.makeTranslation(p.x, p.y, p.z);
                im.setMatrixAt(i, m);
            });
            im.instanceMatrix.needsUpdate = true;
            group.add(im);
        }

        // Renderizar defectos (solo si defectType != 'none')
        if (defectType !== 'none') {
            specialSites.forEach(s => {
                const mesh = new THREE.Mesh(s.type === 'vacancy' ? geoVacancy : geoSubst, s.type === 'vacancy' ? matVacancy : matSubst);
                mesh.position.copy(s.pos);
                group.add(mesh);
            });

            if (defectType === 'interstitial') {
                const ipos = new THREE.Vector3(0.5, scale * (caRatio || 1.633) * 0.5, 0.5); // Sitio intersticial genérico HCP
                const mesh = new THREE.Mesh(geoInter, matInter);
                mesh.position.copy(ipos);
                group.add(mesh);
            }
        }
    } else {
        const atoms = getLatticeAtoms(sLower);
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

        if (!onlyDefects && normalAtoms.length > 0) {
            const im = new THREE.InstancedMesh(geoNormal, matNormal, normalAtoms.length);
            const m = new THREE.Matrix4();
            normalAtoms.forEach((pos, idx) => {
                const pThree = mapToThree(...pos).multiplyScalar(scale);
                m.makeTranslation(pThree.x, pThree.y, pThree.z);
                im.setMatrixAt(idx, m);
            });
            im.instanceMatrix.needsUpdate = true;
            group.add(im);
        }

        if (defectType !== 'none') {
            specialAtoms.forEach(item => {
                const mesh = new THREE.Mesh(item.type === 'vacancy' ? geoVacancy : geoSubst, item.type === 'vacancy' ? matVacancy : matSubst);
                mesh.position.copy(mapToThree(...item.pos).multiplyScalar(scale));
                group.add(mesh);
            });

            if (defectType === 'interstitial') {
                let ipos = [0.5, 0.5, 0.5]; // Octaédrico FCC
                if (sLower === 'bcc') ipos = [0.5, 0.5, 0]; // Octaédrico BCC
                if (sLower === 'sc') ipos = [0.5, 0.5, 0.5]; // Centro SC
                const mesh = new THREE.Mesh(geoInter, matInter);
                mesh.position.copy(mapToThree(...ipos).multiplyScalar(scale));
                group.add(mesh);
            }
        }
    }

    return group;
}
