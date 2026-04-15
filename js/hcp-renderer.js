import * as THREE from 'three';
import * as HCP_ENGINE from './hcp-engine.js';
import { CONFIG } from './state.js';

export function drawHcpPrism(group, a, c) {
    const verts = HCP_ENGINE.getHcpPrismVertices(a, c);
    
    // Draw edges
    const material = new THREE.LineBasicMaterial({ 
        color: 0x9e9e9e, linewidth: 2, transparent: true, opacity: 0.6 
    });
    
    // bottom, top, sides
    for (let i = 0; i < 6; i++) {
        const next = (i + 1) % 6;
        const pts = [
            verts[i], verts[next], // base
            verts[i + 6], verts[next + 6], // top
            verts[i], verts[i + 6] // height
        ];
        
        for(let j=0; j<pts.length; j+=2) {
            const geo = new THREE.BufferGeometry().setFromPoints([pts[j], pts[j+1]]);
            const line = new THREE.Line(geo, material);
            group.add(line);
        }
    }
}

export function drawHcpLattice(group, a, c, performance) {
    const sites = HCP_ENGINE.getHcpLatticeSites(a, c);
    const segs = performance?.sphereSegments || 32;
    const sphereGeo = new THREE.SphereGeometry(a * 0.15, segs, segs);
    const mat = new THREE.MeshPhongMaterial({ 
        color: 0x90a4ae, 
        shininess: 90, 
        transparent: true, 
        opacity: 0.85 
    });

    const imesh = new THREE.InstancedMesh(sphereGeo, mat, sites.length);
    const matrix = new THREE.Matrix4();

    sites.forEach((site, i) => {
        matrix.makeTranslation(site.pos.x, site.pos.y, site.pos.z);
        imesh.setMatrixAt(i, matrix);
    });

    imesh.instanceMatrix.needsUpdate = true;
    group.add(imesh);
}

// drawHcpAxes removido - el visor orquesta los ejes de forma centralizada en rebuildAxisLayer (scene.js)


export function drawHcpPlane(group, points, color, edgeColor) {
    if (!points || points.length < 3) return;

    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const indices = [];
    for (let i = 1; i < points.length - 1; i++) {
        indices.push(0, i, i + 1);
    }
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({
        color: color, 
        side: THREE.DoubleSide, 
        transparent: true, 
        opacity: 0.65, 
        shininess: 90
    }));

    const edges = new THREE.EdgesGeometry(geo);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ 
        color: edgeColor, 
        linewidth: 2 
    }));

    group.add(mesh, line);
}
