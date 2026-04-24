
import * as THREE from 'three';

export const CONFIG = {
    scale: 5,
    axisLen: 12, 
    colors: {
        plane: 0x2196f3,
        planeEdge: 0x0d47a1,
        vector: 0xffa000,
        a1: 0x2979ff,
        a2: 0xff1744,
        a3: 0xff9100,
        c: 0x00e676,
        wireframe: 0x000000
    }
};

/**
 * Hardware and Performance Profiling
 */
function detectPerformanceProfile() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const hasLowMem = navigator.deviceMemory && navigator.deviceMemory < 4;
    
    if (isMobile || hasLowMem) {
        return {
            mode: 'low',
            sphereSegments: 12,
            targetFPS: 30,
            pixelRatioLimit: 1.2,
            isMobile: true
        };
    }
    return {
        mode: 'high',
        sphereSegments: 32,
        targetFPS: 60,
        pixelRatioLimit: 2.0,
        isMobile: false
    };
}

/**
 * ESTADO GLOBAL CONSOLIDADO
 */
const INITIAL_STATE = {
    // Orquestación de Sistemas
    activeCrystalSystem: 'cubic', 
    activeCubicReferenceStructure: 'BCC', 
    
    // Contextos de Sincronización
    activeCalculatorContext: 'cubic',
    activeViewerContext: 'cubic',

    // Parámetros de Celda
    latticeParams: { a: 4.05, c: 9.25, mass: 26.98 },
    
    // Miller / Miller-Bravais
    indices: { h: 1, k: 1, i: -2, l: 1 },
    
    // Geometría 3D
    planePoints: [],
    shift: { x: 0, y: 0, z: 0 },
    vecScale: 1.5,
    hasUserAdjustedCamera: false,
    performance: detectPerformanceProfile(),
    
    // UI Flags
    isEngineeringModeEnabled: false,
    isCalculatorOpen: false,
    isMechanicalOpen: false,

    // Módulo Mecánico
    mechanical: {
        loadType: 'uniaxial', // uniaxial, biaxial, triaxial
        stress: { x: 0, y: 0, z: 0 }, // MPa
        material: {
            id: 'custom',
            name: 'Manual / Personalizado',
            young: 200, // GPa
            poisson: 0.30
        },
        results: {
            strain: { x: 0, y: 0, z: 0 },
            volumeChange: 0,
            rss: 0
        }
    }
};

let state = { ...INITIAL_STATE };
let lastEmittedState = null;

// --- GETTERS ---

export function getState() { 
    return {
        ...state,
        system: state.activeCrystalSystem, // Alias para compatibilidad
        structure: getActiveReferenceStructure()
    };
}

export function getActiveCrystalSystem() { return state.activeCrystalSystem; }
export function getActiveViewerContext() { return state.activeViewerContext; }
export function getActiveCalculatorContext() { return state.activeCalculatorContext; }

export function getActiveReferenceStructure() {
    // Solo soportamos estructuras cúbicas
    return state.activeCubicReferenceStructure || 'BCC';
}

// --- SETTERS CON GUARD CLAUSES ---

export function setActiveCrystalSystem(sys) {
    if (sys === state.activeCrystalSystem) return false;
    
    // Support cubic and hexagonal 
    if (sys !== 'cubic' && sys !== 'hcp') {
        console.warn(`[State] Sistema ${sys} no soportado. Permaneciendo en: cubic`);
        return false;
    }

    state.activeCrystalSystem = sys;
    state.activeViewerContext = sys;
    state.activeCalculatorContext = sys;
    
    // Asegurar estructura cúbica válida
    if (!['SC', 'BCC', 'FCC'].includes(state.activeCubicReferenceStructure)) {
        state.activeCubicReferenceStructure = 'BCC';
    }
    return true;
}

/**
 * Valida si el defecto actual es aplicable a la estructura activa
 */
export function validateDefectAnchoring(defect, structure) {
    if (defect === 'none') return true;
    // Todos los defectos (vacancy, substitutional, interstitial) se aplican a SC, BCC, FCC
    return ['vacancy', 'substitutional', 'interstitial'].includes(defect);
}

export function setActiveCalculatorContext(sys) {
    if (sys === state.activeCalculatorContext) return false;
    state.activeCalculatorContext = sys;
    return true;
}

export function setActiveCubicReferenceStructure(struct) {
    const valid = ['SC', 'BCC', 'FCC'];
    const s = struct ? struct.toUpperCase() : 'BCC';
    if (valid.includes(s) && state.activeCubicReferenceStructure !== s) {
        state.activeCubicReferenceStructure = s;
        return true;
    }
    return false;
}

/**
 * SINCRONIZACIÓN GLOBAL - Fuente única de verdad
 * Evita loops de actualización comparando estados.
 */
export function syncGlobalContext() {
    // Si el visor y la calculadora están en sistemas distintos, el visor manda sobre el estado core,
    // pero permitimos que la calculadora mantenga su contexto interno hasta que se aplique.
    if (state.activeViewerContext !== state.activeCrystalSystem) {
        state.activeViewerContext = state.activeCrystalSystem;
    }
}

/**
 * ACTUALIZACIÓN DE ESTADO SEGURA
 */
export function updateState(updates) {
    let changed = false;

    for (const key in updates) {
        if (JSON.stringify(state[key]) !== JSON.stringify(updates[key])) {
            state[key] = updates[key];
            changed = true;
        }
    }

    // Compatibilidad heredada
    if (updates.system) {
        if (setActiveCrystalSystem(updates.system)) changed = true;
    }
    if (updates.structure && state.activeCrystalSystem === 'cubic') {
        if (setActiveCubicReferenceStructure(updates.structure)) changed = true;
    }

    if (updates.h !== undefined) state.indices.h = updates.h;
    if (updates.k !== undefined) state.indices.k = updates.k;
    if (updates.l !== undefined) state.indices.l = updates.l;
    if (updates.i !== undefined) state.indices.i = updates.i;

    return { state: getState(), changed };
}

/**
 * PREVENCIÓN DE LOOP RECURSIVO
 * Verifica si el cambio es sustancial antes de disparar eventos globales.
 */
export function shouldUpdateUI(newState) {
    const serialized = JSON.stringify({
        sys: newState.activeCrystalSystem,
        struct: getActiveReferenceStructure(),
        indices: state.indices,
        eng: newState.isEngineeringModeEnabled
    });
    
    if (serialized === lastEmittedState) return false;
    lastEmittedState = serialized;
    return true;
}
