/**
 * MOTOR DE CÁLCULO ISOTRÓPICO (FISICA CORE)
 * Implementa la Ley de Hooke Generalizada para materiales isotrópicos.
 */
export class IsotropicEngine {
    /**
     * Calcula el tensor de deformación (strain) a partir del tensor de esfuerzos (stress).
     * @param sigma Tensor de esfuerzos 3x3 (MPa)
     * @param E Módulo de Young (MPa)
     * @param nu Coeficiente de Poisson
     */
    static computeStrainFromStress(sigma: number[][], E: number, nu: number) {
        const strainTensor: number[][] = [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0]
        ];

        // Traza del tensor de esfuerzos (suma de componentes diagonales)
        const trace = sigma[0][0] + sigma[1][1] + sigma[2][2];

        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (i === j) {
                    // Componentes normales: εii = (1/E) * [σii - ν(σjj + σkk)]
                    // Forma alternativa: εii = ((1+ν)/E) * σii - (ν/E) * trace
                    strainTensor[i][j] = ((1 + nu) / E) * sigma[i][j] - (nu / E) * trace;
                } else {
                    // Componentes de cizalladura: εij = ((1+ν)/E) * σij
                    // Nota: εij es deformación tensorial. La deformación de ingeniería γij = 2 * εij
                    strainTensor[i][j] = ((1 + nu) / E) * sigma[i][j];
                }
            }
        }

        const volumetricStrain = strainTensor[0][0] + strainTensor[1][1] + strainTensor[2][2];

        return {
            tensor: strainTensor,
            volumetricStrain: volumetricStrain
        };
    }

    /**
     * Calcula el Módulo de Corte (G)
     * G = E / (2 * (1 + ν))
     */
    static computeShearModulus(E: number, nu: number): number {
        return E / (2 * (1 + nu));
    }
}
