/**
 * MECHANICAL CHART (v1.0)
 * Visualización simple de curva Esfuerzo-Deformación (σ-ε) en Canvas.
 */

export function drawStressStrainCurve(canvasId, currentStress, currentStrain, yieldStrength, youngGPa) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    // Ajustar resolución interna para nitidez (DPR)
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
    }

    const w = rect.width;
    const h = rect.height;
    const padding = 35;

    // Limpiar
    ctx.clearRect(0, 0, w, h);

    // Ejes
    ctx.beginPath();
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 1.5;
    ctx.moveTo(padding, 10);
    ctx.lineTo(padding, h - padding); // Eje Y (σ)
    ctx.lineTo(w - 10, h - padding);  // Eje X (ε)
    ctx.stroke();

    // Etiquetas de Ejes
    ctx.fillStyle = '#718096';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('σ (MPa)', 5, 15);
    ctx.fillText('ε (%)', w - 30, h - 15);

    // Escalamiento (Asumimos el yield como punto de referencia 70% del gráfico)
    const maxGraphStress = yieldStrength * 1.5;
    const yieldStrain = (yieldStrength / (youngGPa * 1000)) * 100; // en %
    const maxGraphStrain = yieldStrain * 2;

    const getX = (strainPct) => padding + (strainPct / maxGraphStrain) * (w - padding - 20);
    const getY = (stressMPa) => (h - padding) - (stressMPa / maxGraphStress) * (h - padding - 20);

    // 1. Dibujar Curva Elástica (Línea de Hooke)
    ctx.beginPath();
    ctx.strokeStyle = '#2b6cb0';
    ctx.lineWidth = 2;
    ctx.moveTo(getX(0), getY(0));
    ctx.lineTo(getX(yieldStrain), getY(yieldStrength));
    ctx.stroke();

    // 2. Dibujar Región Plástica (Simplificada: horizontal después del yield)
    ctx.beginPath();
    ctx.setLineDash([4, 2]);
    ctx.moveTo(getX(yieldStrain), getY(yieldStrength));
    ctx.lineTo(getX(maxGraphStrain), getY(yieldStrength));
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Dibujar Punto de Límite Elástico
    ctx.beginPath();
    ctx.fillStyle = '#2b6cb0';
    ctx.arc(getX(yieldStrain), getY(yieldStrength), 3, 0, Math.PI * 2);
    ctx.fill();

    // 4. Dibujar Punto Actual de Operación
    const currentStrainPct = currentStrain * 100;
    const px = getX(currentStrainPct);
    const py = getY(currentStress);

    // Líneas guía para el punto actual
    ctx.beginPath();
    ctx.strokeStyle = '#e2e8f0';
    ctx.setLineDash([2, 2]);
    ctx.moveTo(padding, py);
    ctx.lineTo(px, py);
    ctx.lineTo(px, h - padding);
    ctx.stroke();
    ctx.setLineDash([]);

    // El Punto
    ctx.beginPath();
    ctx.fillStyle = currentStress > yieldStrength ? '#c53030' : '#48bb78';
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (currentStress > yieldStrength) {
        ctx.fillStyle = '#c53030';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillText('ZONA PLÁSTICA / FALLA', padding + 10, 25);
    }
}
