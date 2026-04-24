/**
 * BIBLIOTECA DE MATERIALES MECÁNICOS
 */
export const MECHANICAL_MATERIALS = [
    {
        id: 'steel',
        name: 'Acero Inoxidable (AISI 304)',
        young: 193, // GPa
        poisson: 0.29,
        yield: 215 // MPa (Límite elástico aproximado)
    },
    {
        id: 'aluminum',
        name: 'Aluminio (6061-T6)',
        young: 68.9,
        poisson: 0.33,
        yield: 276
    },
    {
        id: 'copper',
        name: 'Cobre Recocido',
        young: 110,
        poisson: 0.34,
        yield: 70
    },
    {
        id: 'titanium',
        name: 'Titanio (Ti-6Al-4V)',
        young: 114,
        poisson: 0.34,
        yield: 880
    },
    {
        id: 'custom',
        name: 'Manual / Personalizado',
        young: 200,
        poisson: 0.30,
        yield: 0
    }
];

export function getMaterialById(id) {
    return MECHANICAL_MATERIALS.find(m => m.id === id) || MECHANICAL_MATERIALS[0];
}
