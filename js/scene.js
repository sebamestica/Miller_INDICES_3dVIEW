/**
 * Miller Explorer - 3D Scene Controller
 * Focused on high-fidelity rendering and visual clarity.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { CONFIG } from './state.js';
import { buildLatticeGroup } from './lattice-renderer.js';

let scene, camera, renderer, labelRenderer, controls;
const dynamicObjects = new THREE.Group();
const staticObjects = new THREE.Group();

/**
 * Initializes the Three.js viewport with professional defaults.
 */
export function initializeScene() {
    const wrapper = document.getElementById('canvas-wrapper');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    camera = new THREE.PerspectiveCamera(40, wrapper.clientWidth/wrapper.clientHeight, 0.1, 1000);
    resetCameraView();

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(wrapper.clientWidth, wrapper.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    wrapper.appendChild(renderer.domElement);

    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(wrapper.clientWidth, wrapper.clientHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    document.getElementById('label-container').appendChild(labelRenderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.7; // Smoother rotation for touch
    controls.screenSpacePanning = true;
    
    // Lighting setup for depth and clarity
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.5);
    mainLight.position.set(10, 20, 15);
    
    scene.add(ambient, hemiLight, mainLight);
    scene.add(staticObjects, dynamicObjects);

    window.addEventListener('resize', onResize);
    
    // Force initial sizing
    setTimeout(onResize, 10);
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

function onResize() {
    const wrapper = document.getElementById('canvas-wrapper');
    const width = wrapper.clientWidth;
    const height = wrapper.clientHeight;
    
    camera.aspect = width / height;
    // Framing and FOV
    if (width < 600) {
        camera.fov = 55;
    } else if (width < 1000) {
        camera.fov = 48;
    } else {
        camera.fov = 40;
    }
    
    camera.updateProjectionMatrix();
    
    // Robust Samsung/Android high-DPR performance constraint
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    labelRenderer.setSize(width, height);

    // Reframe mathematically
    resetCameraView();
}

export function resetCameraView() {
    if (!staticObjects.children.length) return;
    
    // Compute exact bounding box of all objects
    const box = new THREE.Box3().setFromObject(staticObjects);
    const dynBox = new THREE.Box3().setFromObject(dynamicObjects);
    if (!dynBox.isEmpty()) box.expandByObject(dynamicObjects);

    if (box.isEmpty()) return;

    const center = new THREE.Vector3();
    box.getCenter(center);
    const size = new THREE.Vector3();
    box.getSize(size);
    
    const maxDim = Math.max(size.x, size.y, size.z);
    if(maxDim === 0) return;
    
    // Math logic for Camera Fitting
    const fov = camera.fov * (Math.PI / 180);
    let cameraDistance = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    
    // Adjust for extreme Samsung / Desktop wide aspect ratios
    const aspect = camera.aspect;
    if (aspect < 1) cameraDistance /= aspect;
    
    const isMobile = window.innerWidth < 600;
    const paddingMultiplier = isMobile ? 1.7 : 1.45;
    cameraDistance *= paddingMultiplier;

    // Use a fixed aesthetic orientation (Isometric baseline)
    const dir = new THREE.Vector3(0.8, 0.65, 1).normalize();
    camera.position.copy(center).add(dir.multiplyScalar(cameraDistance));
    
    if (controls) {
        controls.target.copy(center);
        controls.update();
    }
}

export function clearDynamicObjects() {
    while(dynamicObjects.children.length > 0) {
        const obj = dynamicObjects.children[0];
        if(obj.geometry) obj.geometry.dispose();
        if(obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
            else obj.material.dispose();
        }
        dynamicObjects.remove(obj);
    }
}

/**
 * Builds the static environment (grid, reference cube/prism, axis labels).
 */
export function buildStaticEnvironment(system) {
    while(staticObjects.children.length > 0) {
        const obj = staticObjects.children[0];
        if(obj.geometry) obj.geometry.dispose();
        if(obj.material) obj.material.dispose();
        staticObjects.remove(obj);
    }
    
    const labelContainer = document.getElementById('label-container');
    if (labelContainer.firstChild) {
        const container = labelContainer.firstChild;
        while(container.hasChildNodes()) container.removeChild(container.firstChild);
    }

    const s = CONFIG.scale;
    
    // 1. Visible Base Grid
    const grid = new THREE.GridHelper(40, 40, 0xcccccc, 0xeeeeee);
    staticObjects.add(grid);

    if (system === 'cubic') {
        // 2. Reference Cube (Ghosted)
        const box = new THREE.BoxGeometry(s, s, s);
        const edges = new THREE.EdgesGeometry(box);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xadb5bd, transparent: true, opacity: 0.3 }));
        line.position.set(s/2, s/2, s/2);
        staticObjects.add(line);

        // Axes (Centered at origin)
        buildAxisLabels(new THREE.Vector3(0,0,1), CONFIG.colors.a1, 'X (a1)', 'a1');
        buildAxisLabels(new THREE.Vector3(1,0,0), CONFIG.colors.a2, 'Y (a2)', 'a2');
        buildAxisLabels(new THREE.Vector3(0,1,0), CONFIG.colors.c, 'Z (c)', 'c');
        controls.target.set(s/2, s/2, s/2);
    } else {
        // 2. Hexagonal Reference (Ghosted)
        const h_height = s * 2.2;
        const h_radius = s;
        const faceGeo = new THREE.CylinderGeometry(h_radius, h_radius, h_height, 6);
        faceGeo.translate(0, h_height/2, 0);
        faceGeo.rotateY(Math.PI / 6);
        
        const lines = new THREE.LineSegments(new THREE.EdgesGeometry(faceGeo), new THREE.LineBasicMaterial({ color: 0xadb5bd, transparent: true, opacity: 0.3 }));
        staticObjects.add(lines);

        buildAxisLabels(new THREE.Vector3(1, 0, 0), CONFIG.colors.a1, 'a1', 'a1');
        buildAxisLabels(new THREE.Vector3(Math.cos(2*Math.PI/3), 0, -Math.sin(2*Math.PI/3)), CONFIG.colors.a2, 'a2', 'a2');
        buildAxisLabels(new THREE.Vector3(Math.cos(4*Math.PI/3), 0, -Math.sin(4*Math.PI/3)), CONFIG.colors.a3, 'a3', 'a3');
        buildAxisLabels(new THREE.Vector3(0, 1, 0), CONFIG.colors.c, 'c', 'c');
        controls.target.set(0, h_height/2, 0);
    }
}

function buildAxisLabels(dir, color, text, cls) {
    const arrow = new THREE.ArrowHelper(dir.clone().normalize(), new THREE.Vector3(0,0,0), CONFIG.axisLen, color, 0.8, 0.4);
    staticObjects.add(arrow);

    const div = document.createElement('div');
    div.className = `axis-label ${cls}`;
    div.textContent = text;
    const label = new CSS2DObject(div);
    label.position.copy(dir.clone().multiplyScalar(CONFIG.axisLen + 0.8));
    staticObjects.add(label);
}

/**
 * Renders the Miller plane with technical polish.
 */
export function renderPlane(points) {
    if (points.length < 3) return;
    
    const s = CONFIG.scale;
    const geo = new THREE.BufferGeometry().setFromPoints(points.map(p => p.clone().multiplyScalar(s)));
    
    // Triangulate manually for buffer geo (assuming convex order)
    const indices = [];
    for (let i = 1; i < points.length - 1; i++) {
        indices.push(0, i, i + 1);
    }
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({
        color: CONFIG.colors.plane,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.65,
        shininess: 90,
        specular: 0xffffff
    }));
    
    // Clean edges
    const edges = new THREE.EdgesGeometry(geo);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ 
        color: CONFIG.colors.planeEdge, 
        linewidth: 2,
        transparent: true,
        opacity: 0.8 
    }));
    
    dynamicObjects.add(mesh, line);
}

/**
 * Renders the Normal Vector.
 */
export function renderNormalVector(state) {
    const { system, h, k, l, shift, vecScale } = state;
    const s = CONFIG.scale;
    let dir, origin;

    if(system === 'cubic') {
        dir = new THREE.Vector3(k, l, h).normalize();
        origin = new THREE.Vector3(shift.y*s, shift.z*s, shift.x*s);
    } else {
        dir = new THREE.Vector3(h, l, -(h + 2*k)/Math.sqrt(3)).normalize();
        origin = new THREE.Vector3(0,0,0);
    }

    const arrow = new THREE.ArrowHelper(dir, origin, s * vecScale, CONFIG.colors.vector, 1.0, 0.5);
    arrow.line.material.linewidth = 3;
    dynamicObjects.add(arrow);
}

/**
 * Highlights the active origin of the coordinate system.
 */
export function renderOriginPoint(state) {
    const s = CONFIG.scale;
    const { system, shift } = state;
    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(s*0.06, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0x212529 })
    );
    if (system === 'cubic') {
        sphere.position.set(shift.y, shift.z, shift.x).multiplyScalar(s);
    } else {
        sphere.position.set(0, 0, 0);
    }
    dynamicObjects.add(sphere);
}

/**
 * Renders a specific crystallographic direction [u v w].
 */
export function renderCrystallographicDirection(u, v, w, system) {
    if (system !== 'cubic') return; 
    const s = CONFIG.scale;
    // Map same as normal vector
    const dir = new THREE.Vector3(v, w, u).normalize();
    const origin = new THREE.Vector3(0, 0, 0);
    
    // Use a distinct style (Orange/Gold)
    const arrow = new THREE.ArrowHelper(dir, origin, s * 1.8, 0xffa500, 0.8, 0.4);
    arrow.line.material.linewidth = 4;
    dynamicObjects.add(arrow);
}

/**
 * Renders the Oriented Load Direction.
 */
export function renderLoadDirection(lx, ly, lz) {
    if (lx === 0 && ly === 0 && lz === 0) return;
    const s = CONFIG.scale;
    const dir = new THREE.Vector3(ly, lz, lx).normalize(); // Consistent mapping
    const origin = new THREE.Vector3(s*1.2, s*1.2, s*1.2); // Offset from center to see separate
    
    const arrow = new THREE.ArrowHelper(dir, origin, s * 1.5, 0xff0000, 0.6, 0.3);
    arrow.line.material.linewidth = 2;
    dynamicObjects.add(arrow);
}

/**
 * Renders the full 3D atomic lattice and defects.
 */
export function renderLattice3D(structure, defectType, isVisible) {
    if (!isVisible || structure === 'hexagonal') return;
    const group = buildLatticeGroup(structure, CONFIG.scale, defectType);
    dynamicObjects.add(group);
}
