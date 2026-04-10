/**
 * Miller Explorer - Advanced Engineering Panel
 * Manages the secondary technical drawer for future feature expansion.
 */
import { sanitizeIntegerInput } from './ui.js';
import { getState, updateState } from './state.js';

/**
 * Initializes the Advanced Panel structure and bindings.
 */
export function initializeAdvancedPanel(updateScene) {
    const sections = [
        { id: 'adv-geo', title: 'Geometría Avanzada', icon: '📐' },
        { id: 'adv-mech', title: 'Mechanism Engine (Heurístico)', icon: '⚙️' },
        { id: 'adv-schmid', title: 'Carga y Schmid', icon: '⚖️' },
        { id: 'adv-defects', title: 'Defectos de Red', icon: '🌑' },
        { id: 'adv-cryst', title: 'Análisis Cristalográfico', icon: '💎' },
        { id: 'adv-advisor', title: 'Advisor', icon: '🧠' }
    ];

    const container = document.getElementById('advanced-sections');
    if (!container) return;

    let headerExtra = `
        <div class="adv-config-box" style="margin-bottom: 25px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <span style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px;">Estructura de Referencia</span>
            <div class="structure-selector" style="margin-top: 12px; display: flex; gap: 15px;">
                <label style="font-size: 0.85rem; font-weight: 600;"><input type="radio" name="adv-struct" value="sc"> SC</label>
                <label style="font-size: 0.85rem; font-weight: 600;"><input type="radio" name="adv-struct" value="bcc" checked> BCC</label>
                <label style="font-size: 0.85rem; font-weight: 600;"><input type="radio" name="adv-struct" value="fcc"> FCC</label>
            </div>
        </div>
    `;

    container.innerHTML = headerExtra + sections.map(s => {
        let content = `<p class="placeholder-text">Próximamente en fase siguiente. El motor de cálculo se integrará aquí.</p>`;
        
        if (s.id === 'adv-geo') {
            content = `
                <div class="adv-tool-box">
                    <label class="toggle-item" style="margin-bottom: 12px; font-weight: 600;">
                        <input type="checkbox" id="adv-toggle-dir"> Activar dirección [u v w]
                    </label>
                    <div id="adv-dir-inputs" class="input-grid grid-3" style="opacity: 0.5; pointer-events: none;">
                        <div class="input-box small"><label>u</label><input type="text" class="coord-input" id="adv-u" value="1" inputmode="text"></div>
                        <div class="input-box small"><label>v</label><input type="text" class="coord-input" id="adv-v" value="-1" inputmode="text"></div>
                        <div class="input-box small"><label>w</label><input type="text" class="coord-input" id="adv-w" value="0" inputmode="text"></div>
                    </div>
                    <div id="adv-geo-results" class="analysis-card mini" style="margin-top: 15px; display: none; padding: 15px; border-style: dashed;">
                        <div class="data-row" style="font-size: 0.8rem;"><span>h·u + k·v + l·w</span><span id="adv-val-cond" style="font-family: 'JetBrains Mono'; font-weight: 700;">-</span></div>
                        <div class="data-row" style="font-size: 0.8rem;"><span>¿En Plano?</span><span id="adv-val-compat" style="font-weight: 700;">-</span></div>
                        <p id="adv-val-inter" style="font-size: 0.75rem; color: var(--text-muted); margin-top: 10px; line-height: 1.4;"></p>
                    </div>
                </div>
            `;
        } else if (s.id === 'adv-mech') {
            content = `
                <div class="adv-tool-box">
                    <div class="analysis-card mini" style="background: #fafbfc; border: none; padding: 15px;">
                        <div class="data-row small"><span>Compacidad Planar</span><span id="mech-planar-score" class="tag-score" style="font-weight:700;">-</span></div>
                        <div class="data-row small"><span>Compacidad Lineal</span><span id="mech-linear-score" class="tag-score" style="font-weight:700;">-</span></div>
                        <hr style="border:0; border-top:1px solid #eee; margin: 12px 0;">
                        <div class="data-row"><span>FAVORABILIDAD</span><span id="mech-total-rank" style="font-weight: 800; padding: 4px 10px; border-radius:4px; font-size: 0.75rem; color: #fff; background: var(--text-muted);">CARGANDO...</span></div>
                        <p id="mech-explanation" style="margin-top: 15px; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5;"></p>
                    </div>
                </div>
            `;
        } else if (s.id === 'adv-schmid') {
            content = `
                <div class="adv-tool-box">
                    <span style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Dirección de Carga [X Y Z]</span>
                    <div id="adv-load-inputs" class="input-grid grid-3" style="margin-top: 10px;">
                        <div class="input-box small"><label>Lx</label><input type="text" class="coord-input" id="adv-lx" value="1" inputmode="text"></div>
                        <div class="input-box small"><label>Ly</label><input type="text" class="coord-input" id="adv-ly" value="0" inputmode="text"></div>
                        <div class="input-box small"><label>Lz</label><input type="text" class="coord-input" id="adv-lz" value="0" inputmode="text"></div>
                    </div>
                    <div id="adv-schmid-results" class="analysis-card mini" style="margin-top: 15px; background: #fffdf2; border-color: #feeaa0; padding: 15px;">
                        <div class="data-row small"><span>Ángulo Phi (&phi;)</span><span id="schmid-val-phi">-</span></div>
                        <div class="data-row small"><span>Ángulo Lambda (&lambda;)</span><span id="schmid-val-lambda">-</span></div>
                        <div class="data-row"><span>FACTOR SCHMID</span><span id="schmid-val-m" style="font-weight: 800; font-family: 'JetBrains Mono';">0.000</span></div>
                        <hr style="border:0; border-top:1px solid #feeaa0; margin: 10px 0;">
                        <div class="data-row"><span>ESTADO CARGA</span><span id="schmid-total-rank" style="font-weight: 800; padding: 2px 8px; border-radius:4px; font-size: 0.7rem; color: #fff; background: var(--text-muted);">-</span></div>
                        <p id="schmid-explanation" style="margin-top: 12px; font-size: 0.75rem; color: #856404; line-height: 1.4;"></p>
                    </div>
                </div>
            `;
        } else if (s.id === 'adv-defects') {
            content = `
                <div class="adv-tool-box">
                    <span style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Defectos de Red</span>
                    <div class="defect-selector" style="margin-top: 12px; display: flex; flex-direction: column; gap: 8px;">
                        <label style="font-size: 0.85rem;"><input type="radio" name="adv-defect" value="none" checked> Ninguno</label>
                        <label style="font-size: 0.85rem;"><input type="radio" name="adv-defect" value="vacancy"> Vacancia (Hueco)</label>
                        <label style="font-size: 0.85rem;"><input type="radio" name="adv-defect" value="interstitial"> Intersticial (At. Extra)</label>
                        <label style="font-size: 0.85rem;"><input type="radio" name="adv-defect" value="substitutional"> Sustitucional (Soluto)</label>
                    </div>
                    <div id="adv-defect-info" class="analysis-card mini" style="margin-top: 15px; display: none; border-left: 3px solid var(--accent-color); padding: 15px; background: #f8f9fa;">
                        <p id="defect-explanation" style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5; margin: 0;"></p>
                    </div>
                </div>
            `;
        } else if (s.id === 'adv-cryst') {
            content = `
                <div class="adv-tool-box">
                    <div class="analysis-card mini" style="background: #fafbfc; border: none; padding: 15px;">
                        
                        <div style="margin-bottom:15px;">
                            <div class="data-row small"><span>Área Geométrica (<span id="cryst-val-struct-name">-</span>)</span><span id="cryst-val-area" class="tag-score" style="font-weight:700;">-</span></div>
                            <div style="font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; color: var(--text-muted); background: #eee; padding: 6px; border-radius: 4px; margin-top: 6px; line-height: 1.4;">
                                Fórmula: A_plano = ½Σ||(P_i - P_0) × (P_{i+1} - P_0)||
                            </div>
                        </div>

                        <div class="data-row small"><span>Átomos Interceptados (N_plano)</span><span id="cryst-val-atoms" class="tag-score" style="font-weight:700;">-</span></div>
                        <p style="font-size: 0.65rem; color: var(--text-muted); margin-top: 4px; line-height: 1.3;">La estructura define qué sitios atómicos existen en realidad. Un átomo se contabiliza si yace coplanar al corte (±ε).</p>
                        
                        <hr style="border:0; border-top:1px solid #eee; margin: 12px 0;">
                        
                        <div class="data-row"><span>DENSIDAD PLANAR</span><span id="cryst-val-density" style="font-weight: 800; font-family: 'JetBrains Mono'; color:var(--accent-color);">-</span></div>
                        <div style="font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; color: var(--text-secondary); background: #e9ecef; padding: 6px; border-radius: 4px; margin-top: 8px; line-height:1.4;">
                             Fórmula: ρ_plano = N_plano / A_plano<br>
                             Sustitución: ρ_plano = <span id="cryst-val-substitution">- / -</span>
                        </div>
                        <div class="data-row" style="margin-top: 8px;"><span>ESTADO ρ</span><span id="cryst-total-rank" style="font-weight: 800; padding: 2px 8px; border-radius:4px; font-size: 0.7rem; color: #fff; background: var(--text-muted);">-</span></div>
                        
                        <p id="cryst-explanation" style="margin-top: 15px; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5; white-space: pre-wrap;"></p>
                    </div>
                </div>
            `;
        } else if (s.id === 'adv-advisor') {
            content = `
                <div class="adv-tool-box">
                    <div class="analysis-card mini" style="background: rgba(255,255,255,0.8); border: 1px solid #e0e4e8; padding: 15px;">
                        <div style="margin-bottom: 15px;">
                            <span style="font-weight: 800; font-size: 0.7rem; color: var(--accent-color); letter-spacing: 1px; text-transform: uppercase;">1. Diagnóstico Actual</span>
                            <p id="advr-diagnosis" style="margin-top: 6px; font-size: 0.8rem; color: var(--text-main); line-height: 1.4; font-weight: 500;">Esperando datos de la escena plana...</p>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <span style="font-weight: 800; font-size: 0.7rem; color: var(--success); letter-spacing: 1px; text-transform: uppercase;">2. Factores Favorables</span>
                            <ul id="advr-strengths" style="margin-top: 6px; padding-left: 15px; font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4; list-style-type: disc;"></ul>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <span style="font-weight: 800; font-size: 0.7rem; color: var(--danger); letter-spacing: 1px; text-transform: uppercase;">3. Factores Limitantes</span>
                            <ul id="advr-limitations" style="margin-top: 6px; padding-left: 15px; font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4; list-style-type: disc;"></ul>
                        </div>
                        
                        <div style="margin-bottom: 5px; padding-top: 10px; border-top: 1px solid #eee;">
                            <span style="font-weight: 800; font-size: 0.7rem; color: var(--text-muted); letter-spacing: 1px; text-transform: uppercase;">4. Recomendaciones Técnicas</span>
                            <ul id="advr-recommendations" style="margin-top: 6px; padding-left: 15px; font-size: 0.75rem; color: var(--text-muted); line-height: 1.4; list-style-type: circle;"></ul>
                        </div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="adv-section-card" data-section="${s.id}">
                <div class="adv-section-header">
                    <span class="adv-icon">${s.icon}</span>
                    <span class="adv-title">${s.title}</span>
                    <span class="adv-chevron"></span>
                </div>
                <div class="adv-section-content" id="content-${s.id}">
                    ${content}
                </div>
            </div>
        `;
    }).join('');

    bindAdvancedPanelEvents(updateScene);
}

/**
 * Binds events for the advanced panel and its sections.
 */
function bindAdvancedPanelEvents(updateScene) {
    // Header toggles
    document.querySelectorAll('.adv-section-card .adv-section-header').forEach(header => {
        header.onclick = () => {
            const card = header.parentElement;
            const isActive = card.classList.contains('active');
            if (isActive) {
                card.classList.remove('active');
            } else {
                document.querySelectorAll('.adv-section-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
            }
        };
    });

    const toggleDir = document.getElementById('adv-toggle-dir');
    const dirInputs = document.getElementById('adv-dir-inputs');
    const inputs = ['adv-u', 'adv-v', 'adv-w', 'adv-lx', 'adv-ly', 'adv-lz'];

    toggleDir.onchange = () => {
        const active = toggleDir.checked;
        dirInputs.style.opacity = active ? '1' : '0.5';
        dirInputs.style.pointerEvents = active ? 'all' : 'none';
        document.getElementById('adv-geo-results').style.display = active ? 'block' : 'none';
        updateScene();
    };

    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.pointerEvents = 'auto';
            el.oninput = () => {
                sanitizeIntegerInput(el);
                updateScene();
            };
            // Evitar interferencias con la cámara cuando se escribe en el panel derecho
            el.onkeydown = (e) => e.stopPropagation();
            el.onkeyup = (e) => e.stopPropagation();
        }
    });

    // Selectors
    document.querySelectorAll('input[name="adv-struct"]').forEach(radio => radio.onchange = updateScene);
    document.querySelectorAll('input[name="adv-defect"]').forEach(radio => {
        radio.onchange = () => {
            const active = radio.value !== 'none';
            document.getElementById('adv-defect-info').style.display = active ? 'block' : 'none';
            updateScene();
        };
    });

    // Close button
    const closeBtn = document.getElementById('btn-close-adv');
    if (closeBtn) {
        closeBtn.onclick = () => {
            setEngineeringModeEnabled(false);
            updateScene();
        };
    }
}

/**
 * Updates the technical results display in the advanced panel.
 */
export function updateAdvancedResults(plane, direction, results, mechanism, schmid, defectInfo, cryst) {
    // Geo results
    const condEl = document.getElementById('adv-val-cond');
    if (condEl) {
        condEl.textContent = results.dotProduct;
        document.getElementById('adv-val-compat').textContent = results.liesInPlane ? 'SÍ (En Plano)' : 'NO (Secante)';
        document.getElementById('adv-val-compat').style.color = results.liesInPlane ? 'var(--success)' : 'var(--danger)';
        document.getElementById('adv-val-inter').textContent = results.interpretation;
    }

    // Mechanism results
    const mechPlanar = document.getElementById('mech-planar-score');
    if (mechPlanar && mechanism) {
        mechPlanar.textContent = mechanism.planar.toFixed(1);
        document.getElementById('mech-linear-score').textContent = mechanism.linear.toFixed(1);
        const rankEl = document.getElementById('mech-total-rank');
        rankEl.textContent = mechanism.explanation.rank;
        rankEl.style.background = mechanism.explanation.color;
        document.getElementById('mech-explanation').textContent = mechanism.explanation.text;
    }

    // Schmid results
    const schmidM = document.getElementById('schmid-val-m');
    if (schmidM && schmid) {
        document.getElementById('schmid-val-phi').textContent = schmid.phi + '°';
        document.getElementById('schmid-val-lambda').textContent = schmid.lambda + '°';
        schmidM.textContent = schmid.multiplier;
        const rankEl = document.getElementById('schmid-total-rank');
        rankEl.textContent = schmid.explanation.rank;
        rankEl.style.background = schmid.explanation.color;
        document.getElementById('schmid-explanation').textContent = schmid.explanation.text;
    }

    // Defect results
    const defectExp = document.getElementById('defect-explanation');
    if (defectExp && defectInfo) {
        defectExp.textContent = defectInfo;
    }

    // Cryst results
    const crystArea = document.getElementById('cryst-val-area');
    if (crystArea && cryst) {
        crystArea.textContent = cryst.area + ' u²';
        document.getElementById('cryst-val-atoms').textContent = cryst.atoms;
        document.getElementById('cryst-val-density').textContent = cryst.density + ' at/u²';
        document.getElementById('cryst-val-substitution').textContent = `${cryst.atoms} / ${cryst.area}`;
        document.getElementById('cryst-val-struct-name').textContent = document.querySelector('input[name="adv-struct"]:checked')?.value.toUpperCase() || 'RED';
        
        if (cryst.explanation) {
             const rankEl = document.getElementById('cryst-total-rank');
             rankEl.textContent = cryst.explanation.rank;
             rankEl.style.background = cryst.explanation.color;
             document.getElementById('cryst-explanation').innerHTML = cryst.explanation.text.replace(/\n\n/g, '<br><br>');
        }
    }
}

/**
 * Updates the advisor AI panel with formatted lists and text.
 */
export function updateAdvisorResults(report) {
    if (!report) return;
    
    document.getElementById('advr-diagnosis').textContent = report.diagnosis;
    
    const fillList = (id, items) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = '';
        if (!items || items.length === 0) {
            el.innerHTML = '<li>Sin observaciones en esta categoría.</li>';
        } else {
            items.forEach(text => {
                const li = document.createElement('li');
                li.style.marginBottom = '4px';
                li.textContent = text;
                el.appendChild(li);
            });
        }
    };
    
    fillList('advr-strengths', report.strengths);
    fillList('advr-limitations', report.limitations);
    fillList('advr-recommendations', report.recommendations);
}

/**
 * Reads current advanced state.
 */
export function getAdvancedState() {
    const parse = (id) => parseInt(document.getElementById(id)?.value) || 0;
    return {
        direction: {
            active: document.getElementById('adv-toggle-dir')?.checked || false,
            u: parse('adv-u'), v: parse('adv-v'), w: parse('adv-w')
        },
        load: {
            lx: parse('adv-lx'), ly: parse('adv-ly'), lz: parse('adv-lz')
        },
        structure: document.querySelector('input[name="adv-struct"]:checked')?.value || 'bcc',
        defect: document.querySelector('input[name="adv-defect"]:checked')?.value || 'none'
    };
}

export function setEngineeringModeEnabled(enabled) {
    updateState({ isEngineeringModeEnabled: enabled });
    
    const toggle = document.getElementById('eng-toggle');
    if (toggle) toggle.checked = enabled;
    
    if (enabled) {
        document.getElementById('advanced-panel').classList.add('visible');
        document.body.classList.add('eng-mode-active');
    } else {
        document.getElementById('advanced-panel').classList.remove('visible');
        document.body.classList.remove('eng-mode-active');
    }
    
    applyEngineeringModeLayout();
}

export function applyEngineeringModeLayout() {
    const state = getState();
    if (!state.isEngineeringModeEnabled) {
        document.body.style.overflow = '';
        return;
    }
    
    if (window.innerWidth <= 1000) {
        // En mobile necesitamos mantener el scroll habilitado para ver el panel bajo el canvas
        document.body.style.overflow = '';
    } else {
        // En desktop, el panel lateral desactiva el scroll principal
        document.body.style.overflow = 'hidden'; 
    }
}

export function toggleEngineeringMode() {
    const state = getState();
    setEngineeringModeEnabled(!state.isEngineeringModeEnabled);
}

export function syncEngineeringPanelStateWithViewport() {
    applyEngineeringModeLayout();
}

// Mantenemos estas funciones por si se llaman en otro lado
export function openAdvancedPanel() {
    setEngineeringModeEnabled(true);
}

export function closeAdvancedPanel() {
    setEngineeringModeEnabled(false);
}
