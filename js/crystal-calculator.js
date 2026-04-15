
import * as PlaneMetrics from './plane-metrics.js';
import { CONFIG } from './state.js';
import { 
    AVOGADRO_SCALE, 
    calculateAtomicRadius, 
    calculateDhkl, 
    calculateUnitCellVolume,
    getAtomsPerUnitCell,
    calculateTheoreticalDensity
} from './math.js';
import * as MaterialsData from './materials-data.js';
import * as HCP_MATH from './hcp-math.js';


/**
 * Radio atómico (r)
 */
export function computeAtomicRadiusFromLattice(a, structure) {
    if (!a || a <= 0) return 0;
    return calculateAtomicRadius(a, structure);
}

/**
 * Densidad teórica (rho)
 */
export function computeTheoreticalDensity(a, atomicMass, structure, system = 'cubic', c = null) {
    if (!a || !atomicMass || a <= 0 || atomicMass <= 0) return 0;
    
    const n = getAtomsPerUnitCell(structure);
    const vol = calculateUnitCellVolume(a, system, c);
    
    return calculateTheoreticalDensity(n, atomicMass, vol);
}

/**
 * Espaciado d_hkl
 */
export function computeInterplanarSpacing(a, h, k, l, system = 'cubic', c = null) {
    if (h === 0 && k === 0 && l === 0) return 0;
    return calculateDhkl(a, h, k, l, system, c);
}

/**
 * Orquestación de métricas para la UI de la calculadora (solo cúbico)
 */
export function calculateAllMetrics(params) {
    const { a, c, atomicMass, structure, h, k, l, polygonPoints, system, isoMode, isoSingleIdx, isoMaterialId, getIsotopicCustomMix } = params;
    
    // Validaciones críticas iniciales
    if (!a || a <= 0 || (h === 0 && k === 0 && l === 0)) {
        return {
            atomicRadius: 0,
            theoreticalDensity: 0,
            isotopicEffectiveMass: atomicMass || 0,
            interplanarSpacing: 0,
            planeArea: 0,
            atomCount: 0,
            planarDensity: 0
        };
    }

    // Solo cúbico soportado
    const activeStruct = structure || 'BCC';

    // Cálculo de Masa Isotópica Efectiva
    let effectiveMass = atomicMass || 0;
    if (isoMode && isoMode !== 'natural' && isoMaterialId && isoMaterialId !== 'custom') {
        const mat = MaterialsData ? MaterialsData.getMaterialById(isoMaterialId) : null;
        if (mat) {
            const iso = MaterialsData ? MaterialsData.getIsotopesForSymbol(mat.symbol) : null;
            if (iso && iso.length > 0) {
                if (isoMode === 'single' && iso[isoSingleIdx]) {
                    effectiveMass = iso[isoSingleIdx].mass;
                } else if (isoMode === 'custom' && getIsotopicCustomMix) {
                    const mix = getIsotopicCustomMix();
                    let sumMass = 0; let sumP = 0;
                    for (let i = 0; i < Math.min(mix.length, iso.length); i++) {
                        sumMass += (mix[i] / 100) * iso[i].mass;
                        sumP += mix[i];
                    }
                    if (sumP > 0) effectiveMass = sumMass / (sumP / 100);
                }
            }
        }
    }

    if (system === 'hcp' || activeStruct === 'HCP') {
        const hcpMetrics = HCP_MATH.getHcpTheoreticalProperties(a, c || (a * 1.633));
        const dhkl = HCP_MATH.calculateHcpDhkl(h, k, l, a, c || (a * 1.633));
        const area = HCP_MATH.calculateHcpVolume(a, c || (a * 1.633)); // placeholder
        // n for density = 6 atoms in the full 3-base unit cell, so volume=volume, atoms=6
        // Let's use standard theoretical density formula n=6
        const rho = calculateTheoreticalDensity(6, effectiveMass, hcpMetrics.volume);
        
        return {
            atomicRadius: a / 2, // Simple approximation
            theoreticalDensity: rho,
            isotopicEffectiveMass: effectiveMass,
            interplanarSpacing: dhkl,
            planeArea: 0,
            atomCount: 0,
            planarDensity: 0,
            hexCA: hcpMetrics.ratio,
            hexVol: hcpMetrics.volume
        };
    } else {
        const area = PlaneMetrics.computePlaneArea(polygonPoints);
        const atoms = PlaneMetrics.countPlaneAtoms(polygonPoints, activeStruct, null);

        return {
            atomicRadius: computeAtomicRadiusFromLattice(a, activeStruct),
            theoreticalDensity: computeTheoreticalDensity(a, effectiveMass, activeStruct, 'cubic', null),
            isotopicEffectiveMass: effectiveMass,
            interplanarSpacing: computeInterplanarSpacing(a, h, k, l, 'cubic', null),
            planeArea: area,
            atomCount: atoms,
            planarDensity: PlaneMetrics.computePlanarDensity(area, atoms),
            hexCA: 0,
            hexVol: 0
        };
    }
}
