/**
 * Global Configuration and Application State
 */

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

export function createInitialState() {
    return {
        system: 'cubic',
        h: 1,
        k: 1,
        i: -2,
        l: 1,
        planePoints: [],
        shift: { x: 0, y: 0, z: 0 },
        vecScale: 1.5,
        isEngineeringModeEnabled: false
    };
}

let state = createInitialState();

export function getState() {
    return state;
}

export function updateState(newState) {
    state = { ...state, ...newState };
    return state;
}
