/**
 * Miller Explorer - Application Controller
 * High-level orchestration of math, geometry, and rendering.
 */
import { getState, updateState } from './state.js';
import * as MathUtils from './math.js';
import * as GeometryEngine from './geometry-engine.js';
import * as SceneController from './scene.js';
import * as UIController from './ui.js';
import * as AdvancedPanel from './advanced-panel.js';
import * as CrystalAnalysis from './crystal-analysis.js';
import * as MechanismEngine from './mechanism-engine.js';
import * as SchmidEngine from './schmid-engine.js';
import * as DefectEngine from './defect-engine.js';
import * as PlaneMetrics from './plane-metrics.js';
import * as AdvisorEngine from './advisor-engine.js';
import * as DemoMode from './demo-mode.js';
import * as THREE from 'three';

/**
 * Initializes the application flow.
 */
function bootstrapApp() {
    SceneController.initializeScene();
    AdvancedPanel.initializeAdvancedPanel(updateSceneGeometry);
    DemoMode.initializeDemoMode(updateSceneGeometry, UIController.switchSystemUI);
    
    const state = getState();
    UIController.buildPresetsUI(state.system);
    UIController.bindUIEvents(updateSceneGeometry);
    
    setTimeout(updateSceneGeometry, 50);
}

/**
 * Main update routine. Processes inputs, computes geometry, and triggers re-render.
 */
function updateSceneGeometry() {
    const state = getState();
    SceneController.clearDynamicObjects();
    UIController.showError(null);

    // 1. Sync and Validate Inputs
    const indices = syncInputs(state.system);
    if (!indices) return;

    // 2. Identify Coordinate Origin (Shift)
    const shift = { x: 0, y: 0, z: 0 };
    if (state.system === 'cubic') {
        if (indices.h < 0) shift.x = 1;
        if (indices.k < 0) shift.y = 1;
        if (indices.l < 0) shift.z = 1;
    }

    // 3. Update global state
    const updatedState = updateState({ ...indices, shift });

    // 4. Compute Intersections
    let rawPoints = [];
    if (updatedState.system === 'cubic') {
        rawPoints = GeometryEngine.computePlaneCubeIntersection(indices.h, indices.k, indices.l, shift);
    } else {
        rawPoints = GeometryEngine.computePlaneHexIntersection(indices.h, indices.k, indices.l);
    }

    // 5. Build ordered polygon
    const points = GeometryEngine.sortPolygonPoints(rawPoints);
    updateState({ planePoints: points });

    // 6. Update Static Environment if needed
    SceneController.buildStaticEnvironment(updatedState.system);

    // 7. Render dynamic geometry
    if (document.getElementById('toggle-plane').checked) {
        if (points.length >= 3) {
            SceneController.renderPlane(points);
        } else {
            UIController.showError("El plano geométrico es válido, pero su porción intersectada queda fuera de la celda unitaria visible.", "info");
        }
    }

    if (document.getElementById('toggle-vector').checked) {
        SceneController.renderNormalVector(updatedState);
    }

    if (document.getElementById('toggle-origin').checked && (shift.x || shift.y || shift.z)) {
        SceneController.renderOriginPoint(updatedState);
    }

    // 8. Update readout panels
    UIController.updateTechnicalPanel(updatedState, points);

    // 9. Advanced Analysis (Engineering Mode)
    const adv = AdvancedPanel.getAdvancedState();
    const isAdvOpen = document.getElementById('advanced-panel').classList.contains('visible');

    if (updatedState.system === 'cubic') {
        const comp = CrystalAnalysis.checkPlaneDirectionCompatibility(
            { h: updatedState.h, k: updatedState.k, l: updatedState.l },
            { u: adv.direction.u, v: adv.direction.v, w: adv.direction.w }
        );

        // Mechanism Heuristics with Defect Penalty
        const defectPenalty = DefectEngine.computeDefectPenalty(adv.defect);
        let planarScore = MechanismEngine.estimatePlanarDensityScore(updatedState.h, updatedState.k, updatedState.l, adv.structure);
        let linearScore = MechanismEngine.estimateLinearDensityScore(adv.direction.u, adv.direction.v, adv.direction.w, adv.structure);
        
        planarScore *= defectPenalty.multiplier;
        linearScore *= defectPenalty.multiplier;

        const totalScore = MechanismEngine.computeMechanismScore(planarScore, linearScore, comp.liesInPlane);
        const explanation = MechanismEngine.explainMechanismScore(totalScore, adv.structure, comp.liesInPlane);

        // Schmid Factor Calculation
        const normalVec = new THREE.Vector3(updatedState.k, updatedState.l, updatedState.h);
        const slipVec = new THREE.Vector3(adv.direction.v, adv.direction.w, adv.direction.u);
        const loadVec = new THREE.Vector3(adv.load.ly, adv.load.lz, adv.load.lx);
        
        const schmidData = SchmidEngine.computeSchmidFactor(normalVec, slipVec, loadVec);
        const schmidExp = SchmidEngine.explainSchmidFactor(schmidData ? schmidData.raw : null);

        // Plane Metrics
        let area = 0, atomCount = 0, rho = 0, rhoExplanation = null;
        if (points.length >= 3) {
            area = PlaneMetrics.computePlaneArea(points);
            atomCount = PlaneMetrics.countPlaneAtoms(points, adv.structure, adv.defect);
            rho = PlaneMetrics.computePlanarDensity(area, atomCount);
            rhoExplanation = PlaneMetrics.explainPlanarDensity(rho, adv.structure);
        } else {
            rhoExplanation = { rank: '-', color: 'var(--text-muted)', text: 'No hay polígono geométrico visible en la celda unitaria trazada. No es posible ejecutar un análisis volumétrico para este caso.' };
        }

        // Update Advanced Panel
        AdvancedPanel.updateAdvancedResults(updatedState, adv.direction, comp, {
            planar: planarScore,
            linear: linearScore,
            total: totalScore,
            explanation: explanation
        }, {
            ...schmidData,
            explanation: schmidExp
        }, DefectEngine.getDefectDescription(adv.defect), {
            area: area === 0 ? '-' : area.toFixed(3),
            atoms: area === 0 ? '-' : atomCount,
            density: area === 0 || isNaN(rho) ? '-' : rho.toFixed(3),
            explanation: rhoExplanation
        });
        
        // Advisor Engine
        const advisorReport = AdvisorEngine.generateAdvisorReport({
            structure: adv.structure,
            planeArea: area,
            planarRhoRank: rhoExplanation ? rhoExplanation.rank : '-',
            directionActive: adv.direction.active,
            directionCompatible: comp.liesInPlane,
            mechanismScore: totalScore,
            schmidMultiplier: schmidData ? schmidData.multiplier : null,
            activeDefect: adv.defect
        });
        AdvancedPanel.updateAdvisorResults(advisorReport);

        // Advanced Rendering
        if (adv.direction.active) SceneController.renderCrystallographicDirection(adv.direction.u, adv.direction.v, adv.direction.w, updatedState.system);
        SceneController.renderLoadDirection(adv.load.lx, adv.load.ly, adv.load.lz);
        SceneController.renderLattice3D(adv.structure, adv.defect, isAdvOpen);
    }
    
    // Explicit render requested to support the low-cost idle GPU optimization
    SceneController.requestRender();
}

/**
 * Reads UI inputs and performs validation.
 */
function syncInputs(system) {
    const parse = (id) => MathUtils.parseIntegerInput(document.getElementById(id).value);
    
    if (system === 'cubic') {
        const h = parse('c-h'), k = parse('c-k'), l = parse('c-l');
        if (h === null || k === null || l === null) {
            UIController.showError("Error: Inserte valores enteros válidos.");
            return null;
        }
        if (!MathUtils.validateCubicIndices(h, k, l)) {
            UIController.showError("Error: (0 0 0) es indefinido.");
            return null;
        }
        return { h, k, l, i: 0 };
    } else {
        const h = parse('h-h'), k = parse('h-k'), l = parse('h-l');
        if (h === null || k === null || l === null) {
            UIController.showError("Error: Inserte valores enteros válidos.");
            return null;
        }
        const i = -(h + k);
        document.getElementById('h-i').value = i;
        
        const hexVal = MathUtils.validateHexIndices(h, k, i, l);
        if (h === 0 && k === 0 && i === 0 && l === 0) {
            UIController.showError("Error: (0 0 0 0) es indefinido.");
            return null;
        }
        if (!hexVal.valid) {
            UIController.showError(`Aviso: i ≠ -(h+k). Esperado ${hexVal.expectedI}.`);
        }
        return { h, k, i, l };
    }
}

document.addEventListener('DOMContentLoaded', bootstrapApp);
