
import { CONFIG, getState, updateState, getActiveCrystalSystem, setActiveCrystalSystem, syncGlobalContext, shouldUpdateUI } from './state.js';
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
import * as FocusManager from './input-focus-fix.js';
import * as CalculatorPanel from './calculator-panel.js';
import * as CrystalCalculator from './crystal-calculator.js';
import * as HCP_ENGINE from './hcp-engine.js';
import * as THREE from 'three';

let isSyncing = false;

function bootstrapApp() {
    FocusManager.initializeFocusManagement();
    SceneController.initializeScene();
    AdvancedPanel.initializeAdvancedPanel(updateSceneGeometry);
    DemoMode.initializeDemoMode(updateSceneGeometry, UIController.switchSystemUI);
    CalculatorPanel.initializeCalculatorPanel();
    
    // Importación dinámica del panel mecánico
    import('./mechanical-panel.js').then(MechanicalPanel => {
        MechanicalPanel.initializeMechanicalPanel(updateSceneGeometry);
        
        // Vincular apertura
        document.getElementById('btn-open-mech')?.addEventListener('click', () => {
            MechanicalPanel.openMechanicalPanel();
        });
        
        // Vincular cierre
        document.getElementById('btn-close-mech')?.addEventListener('click', () => {
            MechanicalPanel.closeMechanicalPanel();
        });
    });
    
    document.getElementById('btn-apply')?.addEventListener('click', updateSceneGeometry);
    document.getElementById('btn-reset')?.addEventListener('click', () => SceneController.resetCameraView(true));
    
    document.getElementById('btn-open-calc')?.addEventListener('click', () => {
        const state = getState();
        CalculatorPanel.syncCalculatorWithAppState(state);
        CalculatorPanel.openCalculatorPanel();
        updateSceneGeometry(); 
    });
    
    const state = getState();
    UIController.buildPresetsUI(state.system);
    UIController.bindUIEvents(updateSceneGeometry, updateSceneGeometryThrottled);
    
    window.addEventListener('resize', () => {
        AdvancedPanel.syncEngineeringPanelStateWithViewport();
    });
    
    SceneController.buildStaticEnvironment(state.system);
    setTimeout(updateSceneGeometry, 100);
}

/**
 * CAMBIO DE SISTEMA ROBUSTO - Orquestador Único
 * Garantiza que la escena, la calculadora y los paneles lean del mismo estado real.
 */
export function switchCrystalSystemSafely(newSys) {
    if (isSyncing) return;
    const currentSys = getActiveCrystalSystem();
    if (newSys === currentSys) return;

    isSyncing = true;
    try {
        console.log(`[Switch] Transición: ${currentSys} -> ${newSys}`);
        
        // 1. Estado core y Sincronización Global
        setActiveCrystalSystem(newSys);
        syncGlobalContext();
        
        // 2. UI y Controles
        UIController.switchSystemUI(newSys);
        AdvancedPanel.updateStructureSelector(); 
        
        // 3. Purga y reconstrucción de motor gráfico
        SceneController.clearDynamicObjects();
        SceneController.buildStaticEnvironment(newSys);
        
        // 4. Sincronización de datos (Calculadora lee del nuevo estado)
        CalculatorPanel.syncCalculatorWithAppState(getState());
        updateSceneGeometryInternal();
        
        // 5. Encuadre
        SceneController.resetCameraView(true);
        
    } catch (e) {
        console.error("[Fatal Switch Error]:", e);
    } finally {
        isSyncing = false;
        SceneController.requestRender();
    }
}

export function updateSceneGeometry() {
    if (isSyncing) return;
    
    // Guard clause para no recalcular si el estado no cambió sustancialmente
    const state = getState();
    if (!shouldUpdateUI(state) && !isSyncing) {
        // En algunos casos queremos forzar (ej. clics en botones), 
        // pero para inputs continuos esto evita loops.
    }

    isSyncing = true;
    try {
        updateSceneGeometryInternal();
    } finally {
        isSyncing = false;
    }
}

function updateSceneGeometryInternal() {
    const currentState = getState();
    UIController.showError(null);

    // 1. Sincronización y Validación de inputs
    const indicesResult = syncInputs(currentState.system);
    if (!indicesResult) {
        updateTechnicalPanelInvalid();
        SceneController.clearDynamicObjects(); // Limpia planos y red en caso de error
        SceneController.requestRender();
        return;
    }

    const shift = { x: 0, y: 0, z: 0 };
    if (currentState.system === 'cubic') {
        if (indicesResult.h < 0) shift.x = 1;
        if (indicesResult.k < 0) shift.y = 1;
        if (indicesResult.l < 0) shift.z = 1;
    }

    const isCalcOpen = document.getElementById('calc-panel')?.classList.contains('visible');
    const calcInputs = isCalcOpen ? CalculatorPanel.getCalculatorInputs() : null;
    const caRatio = (calcInputs && calcInputs.a > 0 && calcInputs.c > 0) ? (calcInputs.c / calcInputs.a) : currentState.caRatio;
    
    // Sincronizar estado core
    const { state: updatedState } = updateState({ 
        h: indicesResult.h, k: indicesResult.k, l: indicesResult.l, i: indicesResult.i,
        shift, caRatio 
    });

    // 2. CAPA BASE: Se reconstruye si el sistema cambió o caRatio es nuevo (implícito en rebuild)
    // Para simplificar y dar robustez, rebuildSystemBaseGeometry es atómica.
    SceneController.rebuildSystemBaseGeometry(updatedState.system, updatedState.caRatio);
    SceneController.rebuildAxisLayer(updatedState.system);

    // 3. CAPA DE PLANOS: Intersección y Render
    let points = [];
    if (updatedState.system === 'cubic') {
        const rawPoints = GeometryEngine.computePlaneCubeIntersection(updatedState.indices.h, updatedState.indices.k, updatedState.indices.l, updatedState.shift);
        points = GeometryEngine.sortPolygonPoints(rawPoints);
    } else {
        const sc = CONFIG.scale;
        points = HCP_ENGINE.computeHcpPlaneIntersection(
            updatedState.indices.h, updatedState.indices.k, updatedState.indices.i, updatedState.indices.l, 
            sc, sc * (updatedState.caRatio || 1.633)
        );
    }
    updateState({ planePoints: points });

    if (document.getElementById('toggle-plane')?.checked) {
        SceneController.rebuildPlaneLayer(updatedState, points);
    } else {
        SceneController.rebuildPlaneLayer(updatedState, []); 
    }

    // 4. CAPAS DE RED Y DEFECTOS
    const adv = AdvancedPanel.getAdvancedState();
    const isAdvOpen = document.getElementById('advanced-panel')?.classList.contains('visible');
    const isAnyTechnicalOpen = AdvancedPanel.isAnyTechnicalMenuOpen();
    
    let activeStructure = updatedState.structure;
    if (isCalcOpen && calcInputs && updatedState.system === 'cubic') {
        activeStructure = calcInputs.structure;
    }

    // Sincronización Global de UI (Mantener sidebar actualizado con calculadora)
    UIController.updateSidebarInputs(updatedState.indices.h, updatedState.indices.k, updatedState.indices.l);

    // En HCP y Cúbico, mostramos la red si la calculadora está abierta O si el Modo Ingeniería está activo
    const showAtoms = isCalcOpen || isAdvOpen;
    
    SceneController.rebuildReferenceLatticeLayer(activeStructure, showAtoms, updatedState.caRatio);
    SceneController.rebuildDefectLayer(activeStructure, adv.defect, showAtoms, updatedState.caRatio);

    // 5. CAPA OVERLAY (Vectores adicionales)
    if (document.getElementById('toggle-vector')?.checked) {
        // El vector normal ya está en rebuildPlaneLayer, pero si hay otros:
        if (adv.direction.active) SceneController.renderCrystallographicDirection(adv.direction.u, adv.direction.v, adv.direction.w, updatedState.system);
        SceneController.renderLoadDirection(adv.load.lx, adv.load.ly, adv.load.lz);
    }

    // 6. UI Y CÁLCULOS
    UIController.updateTechnicalPanel(updatedState, points);
    
    if (updatedState.system === 'cubic') {
        performCubicEngineeringAnalysis({ ...updatedState, structure: activeStructure, ...updatedState.indices }, adv, points);
    } else {
        // En HCP limpiar o no realizar análisis de ingeniería que choca con cúbico
        AdvancedPanel.updateAdvancedResults(updatedState, adv.direction, null, null, null, null, null);
        AdvancedPanel.updateAdvisorResults("Análisis de ingeniería en HCP en fase beta.");
    }

    if (isCalcOpen && calcInputs) {
        const calcResults = CrystalCalculator.calculateAllMetrics({
            ...calcInputs, polygonPoints: points, system: updatedState.system
        });
        CalculatorPanel.updateCrystalCalculatorResults(calcResults);
    }

    SceneController.requestRender();
}

/**
 * Limpia la UI técnica cuando los inputs son inválidos
 */
function updateTechnicalPanelInvalid() {
    const el = document.getElementById('val-coords');
    if (el) el.textContent = '---';
    const elI = document.getElementById('val-inter');
    if (elI) elI.textContent = 'Indefinido';
    const elV = document.getElementById('val-vec');
    if (elV) elV.textContent = '|V| = 0';
}

function performCubicEngineeringAnalysis(state, adv, points) {
    const comp = CrystalAnalysis.checkPlaneDirectionCompatibility(
        { h: state.h, k: state.k, l: state.l },
        { u: adv.direction.u, v: adv.direction.v, w: adv.direction.w }
    );
    const defectPenalty = DefectEngine.computeDefectPenalty(adv.defect);
    let pScore = MechanismEngine.estimatePlanarDensityScore(state.h, state.k, state.l, state.structure) * defectPenalty.multiplier;
    let lScore = MechanismEngine.estimateLinearDensityScore(adv.direction.u, adv.direction.v, adv.direction.w, state.structure) * defectPenalty.multiplier;
    
    const tScore = MechanismEngine.computeMechanismScore(pScore, lScore, comp.liesInPlane);
    const expl = MechanismEngine.explainMechanismScore(tScore, state.structure, comp.liesInPlane);

    const schmidData = SchmidEngine.computeSchmidFactor(
        new THREE.Vector3(state.k, state.l, state.h),
        new THREE.Vector3(adv.direction.v, adv.direction.w, adv.direction.u),
        new THREE.Vector3(adv.load.ly, adv.load.lz, adv.load.lx)
    );

    let area = points.length >= 3 ? PlaneMetrics.computePlaneArea(points) : 0;
    let atomCount = PlaneMetrics.countPlaneAtoms(points, state.structure, adv.defect, state.caRatio);
    let rho = PlaneMetrics.computePlanarDensity(area, atomCount);
    let rhoExplanation = PlaneMetrics.explainPlanarDensity(rho, state.structure);

    AdvancedPanel.updateAdvancedResults(state, adv.direction, comp, {
        planar: pScore, linear: lScore, total: tScore, explanation: expl
    }, schmidData, DefectEngine.getDefectDescription(adv.defect), {
        area: area.toFixed(3), atoms: atomCount, density: rho.toFixed(3), explanation: rhoExplanation
    });

    const report = AdvisorEngine.generateAdvisorReport({
        structure: state.structure, planeArea: area, planarRhoRank: rhoExplanation?.rank || '-',
        directionActive: adv.direction.active, directionCompatible: comp.liesInPlane,
        mechanismScore: tScore, schmidMultiplier: schmidData?.multiplier || null, activeDefect: adv.defect
    });
    AdvancedPanel.updateAdvisorResults(report);

    if (adv.direction.active) SceneController.renderCrystallographicDirection(adv.direction.u, adv.direction.v, adv.direction.w, state.system);
    SceneController.renderLoadDirection(adv.load.lx, adv.load.ly, adv.load.lz);
}

function syncInputs(system) {
    const isCalcOpen = document.getElementById('calc-panel')?.classList.contains('visible');
    
    // Si la calculadora está abierta, priorizamos sus inputs para la escena 3D
    if (isCalcOpen) {
        const parseC = (id) => MathUtils.parseIntegerInput(document.getElementById(id)?.value);
        const h = parseC('calc-h'), k = parseC('calc-k'), l = parseC('calc-l');
        
        if (h === null || k === null || l === null) return null;
        
        if (system === 'cubic') {
            if (!MathUtils.validateCubicIndices(h, k, l)) {
                UIController.showError("Error: (0 0 0) indefinido.");
                return null;
            }
            return { h, k, l, i: 0 };
        } else {
            if (h === 0 && k === 0 && l === 0) {
                UIController.showError("Error: Plano basal indefinido (0 0 0 0).");
                return null;
            }
            return { h, k, l, i: -(h + k) };
        }
    }

    // Comportamiento estándar (sidebar)
    const parse = (id) => MathUtils.parseIntegerInput(document.getElementById(id)?.value);
    
    if (system === 'cubic') {
        const h = parse('c-h'), k = parse('c-k'), l = parse('c-l');
        if (h === null || k === null || l === null) return null;
        if (!MathUtils.validateCubicIndices(h, k, l)) {
            UIController.showError("Error: (0 0 0) indefinido.");
            return null;
        }
        return { h, k, l, i: 0 };
    } else {
        const h = parse('h-h'), k = parse('h-k'), l = parse('h-l');
        if (h === null || k === null || l === null) return null;
        if (h === 0 && k === 0 && l === 0) {
            UIController.showError("Error: Plano basal indefinido (0 0 0 0).");
            return null;
        }
        return { h, k, l, i: -(h + k) };
    }
}

export function updateSceneGeometryThrottled() {
    updateSceneGeometry();
}

window.triggerCalculatorUpdate = updateSceneGeometry;
window.triggerCalculatorSystemChange = switchCrystalSystemSafely;
window.syncViewerSystemToCalculatorSafely = () => switchCrystalSystemSafely(getActiveCrystalSystem());

document.addEventListener('DOMContentLoaded', bootstrapApp);
