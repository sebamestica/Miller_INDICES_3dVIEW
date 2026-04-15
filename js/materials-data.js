/**
 * Materials Data Module
 * Responsible for fetching and providing access to the curated materials library.
 */

let cachedMaterials = [];

/**
 * Loads the materials library from the JSON file
 * @returns {Promise<Array>} The list of materials
 */
export async function loadMaterialsLibrary() {
    try {
        const response = await fetch('./data/materials-library.json');
        if (!response.ok) throw new Error("No se pudo cargar la librería de materiales.");
        cachedMaterials = await response.json();
        return cachedMaterials;
    } catch (error) {
        console.error("Error en loadMaterialsLibrary:", error);
        return [];
    }
}

/**
 * Returns all materials in the library
 */
export function getAllMaterials() {
    return cachedMaterials;
}

/**
 * Finds a material by its ID
 * @param {string} id 
 */
export function getMaterialById(id) {
    return cachedMaterials.find(m => m.id === id) || null;
}

let cachedIsotopes = {};

export async function loadIsotopesLibrary() {
    try {
        const response = await fetch('./data/isotopes-reference.json');
        if (!response.ok) throw new Error("No se pudo cargar la librería de isótopos.");
        cachedIsotopes = await response.json();
        return cachedIsotopes;
    } catch (error) {
        console.warn("Librería de isótopos no disponible o error en carga:", error);
        return {};
    }
}

export function getIsotopesForSymbol(symbol) {
    return cachedIsotopes[symbol] || null;
}
