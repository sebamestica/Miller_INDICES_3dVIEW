/**
 * GESTOR DE UNIDADES (UTILS)
 * Normalización y conversión de unidades físicas para cálculos mecánicos.
 */
export class UnitManager {
    private static readonly PASCAL_IN_GPA = 1e9;
    private static readonly PASCAL_IN_MPA = 1e6;
    private static readonly PASCAL_IN_PSI = 6894.757;

    /**
     * Normaliza un valor de esfuerzo a Pascales (Pa).
     */
    static normalizeStress(value: number, unit: string): number {
        switch (unit.toLowerCase()) {
            case 'gpa':
                return value * this.PASCAL_IN_GPA;
            case 'mpa':
                return value * this.PASCAL_IN_MPA;
            case 'psi':
                return value * this.PASCAL_IN_PSI;
            case 'pa':
            default:
                return value;
        }
    }

    /**
     * Convierte un valor interno (Pa) a la unidad de visualización deseada.
     */
    static convertResult(value: number, unit: string): number {
        switch (unit.toLowerCase()) {
            case 'gpa':
                return value / this.PASCAL_IN_GPA;
            case 'mpa':
                return value / this.PASCAL_IN_MPA;
            case 'psi':
                return value / this.PASCAL_IN_PSI;
            case 'pa':
            default:
                return value;
        }
    }
}
