import { sanitizeIntegerInput } from './ui.js';
import { getState, updateState, getActiveCrystalSystem, getActiveReferenceStructure } from './state.js';
import * as InterstitialEngine from './interstitial-engine.js';

let savedUpdateScene = null;

export function initializeAdvancedPanel(updateScene) {
    savedUpdateScene = updateScene;
    const sections = [
        { id: 'adv-geo', title: 'Geometría Avanzada', icon: '' },
        { id: 'adv-mech', title: 'Mechanism Engine (Heurístico)', icon: '' },
        { id: 'adv-schmid', title: 'Carga y Schmid', icon: '' },
        { id: 'adv-defects', title: 'Defectos de Red', icon: '' },
        { id: 'adv-cryst', title: 'Análisis Cristalográfico', icon: '' },
        { id: 'adv-interstitials', title: 'Intersticiales y Absorción', icon: '' },
        { id: 'adv-advisor', title: 'Advisor', icon: '' }
    ];

    const container = document.getElementById('advanced-sections');
    if (!container) return;

    let headerExtra = `
        <div id="adv-struct-container" class="adv-config-box" style="margin-bottom: 25px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
        </div>
    `;

    container.innerHTML = headerExtra + sections.map(s => {
        let content = `<p class="placeholder-text">Próximamente.</p>`;
        
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
                    </div>
                </div>
            `;
        } else if (s.id === 'adv-mech') {
            content = `
                <div class="adv-tool-box">
                    <div id="mech-no-dir-msg" style="padding: 15px; background: #fff5f5; border: 1px dashed #feb2b2; border-radius: 6px; font-size: 0.75rem; color: #c53030; margin-bottom: 10px;">
                        ⚠️ Active <strong>Dirección [u v w]</strong> para habilitar.
                    </div>
                    <div id="mech-results-container" class="analysis-card mini" style="background: #fafbfc; border: none; padding: 15px; opacity: 0.4; pointer-events: none;">
                        <div class="data-row small"><span>Compacidad Planar</span><span id="mech-planar-score" class="tag-score" style="font-weight:700;">-</span></div>
                        <div class="data-row small"><span>Compacidad Lineal</span><span id="mech-linear-score" class="tag-score" style="font-weight:700;">-</span></div>
                        <hr style="border:0; border-top:1px solid #eee; margin: 12px 0;">
                        <div class="data-row"><span>FAVORABILIDAD</span><span id="mech-total-rank" style="font-weight: 800; padding: 4px 10px; border-radius:4px; font-size: 0.75rem; color: #fff; background: var(--text-muted);">DESC.</span></div>
                        <p id="mech-explanation" style="margin-top: 15px; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5;"></p>
                    </div>
                </div>
            `;
        } else if (s.id === 'adv-schmid') {
            content = `
                <div class="adv-tool-box">
                    <div id="schmid-no-dir-msg" style="padding: 15px; background: #fff5f5; border: 1px dashed #feb2b2; border-radius: 6px; font-size: 0.75rem; color: #c53030; margin-bottom: 10px;">
                        ⚠️ Requiere dirección activa.
                    </div>
                    <div id="schmid-results-container" style="opacity: 0.4; pointer-events: none;">
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
                </div>
            `;
        } else if (s.id === 'adv-defects') {
            content = `
                <div class="adv-tool-box">
                    <span style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Defectos de Red</span>
                    <div class="defect-selector" style="margin-top: 12px; display: flex; flex-direction: column; gap: 8px;">
                        <label style="font-size: 0.85rem;"><input type="radio" name="adv-defect" value="none" checked> Ninguno</label>
                        <label style="font-size: 0.85rem;"><input type="radio" name="adv-defect" value="vacancy"> Vacancia</label>
                        <label style="font-size: 0.85rem;"><input type="radio" name="adv-defect" value="interstitial"> Intersticial</label>
                        <label style="font-size: 0.85rem;"><input type="radio" name="adv-defect" value="substitutional"> Sustitucional</label>
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
                        <div class="data-row small"><span>Área Plano (<span id="cryst-val-struct-name">-</span>)</span><span id="cryst-val-area" class="tag-score" style="font-weight:700;">-</span></div>
                        <div class="data-row small"><span>Átomos (N_plano)</span><span id="cryst-val-atoms" class="tag-score" style="font-weight:700;">-</span></div>
                        <hr style="border:0; border-top:1px solid #eee; margin: 12px 0;">
                        <div class="data-row"><span>DENSIDAD PLANAR</span><span id="cryst-val-density" style="font-weight: 800; font-family: 'JetBrains Mono'; color:var(--accent-color);">-</span></div>
                        <div class="data-row" style="margin-top: 8px;"><span>ESTADO ρ</span><span id="cryst-total-rank" style="font-weight: 800; padding: 2px 8px; border-radius:4px; font-size: 0.7rem; color: #fff; background: var(--text-muted);">-</span></div>
                        <p id="cryst-explanation" style="margin-top: 15px; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5; white-space: pre-wrap;"></p>
                    </div>
                </div>
            `;
        } else if (s.id === 'adv-interstitials') {
            content = `
                <div class="adv-tool-box">
                    <span style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Seleccionar Metal y Especie</span>
                    <div class="input-grid grid-2" style="margin-top: 12px; gap: 10px;">
                        <div>
                            <label style="font-size: 0.75rem; color: var(--text-secondary);">Metal</label>
                            <select id="int-metal-select" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.85rem; margin-top: 4px;">
                                <option value="">-- Seleccionar --</option>
                            </select>
                        </div>
                        <div>
                            <label style="font-size: 0.75rem; color: var(--text-secondary);">Especie</label>
                            <select id="int-species-select" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.85rem; margin-top: 4px;">
                                <option value="">-- Seleccionar --</option>
                            </select>
                        </div>
                    </div>
                    <div id="int-results-container" style="margin-top: 15px; display: none;">
                        <div class="analysis-card mini" style="background: #f8fafc; border: 1px solid #ddd; padding: 15px;">
                            <div class="data-row small"><span>Estructura Metal</span><span id="int-val-structure" style="font-weight: 700;">-</span></div>
                            <div class="data-row small"><span>Sitio Octaédrico (Å)</span><span id="int-val-oct" style="font-family: 'JetBrains Mono'; font-weight: 700;">-</span></div>
                            <div class="data-row small"><span>Sitio Tetraédrico (Å)</span><span id="int-val-tet" style="font-family: 'JetBrains Mono'; font-weight: 700;">-</span></div>
                            <hr style="border:0; border-top:1px solid #eee; margin: 12px 0;">
                            <div class="data-row"><span>COMPATIBILIDAD</span><span id="int-val-compat" style="font-weight: 800; padding: 2px 8px; border-radius:4px; font-size: 0.75rem; color: #fff; background: #999;">-</span></div>
                            <div class="data-row small"><span>Sitio Favorable</span><span id="int-val-site" style="font-weight: 700;">-</span></div>
                            <div class="data-row small"><span>Distorsión Esperada</span><span id="int-val-distortion" style="font-weight: 700;">-</span></div>
                            <hr style="border:0; border-top:1px solid #eee; margin: 12px 0;">
                            <p id="int-explanation" style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5; margin: 0; white-space: pre-wrap;"></p>
                        </div>
                    </div>
                </div>
            `;
        } else if (s.id === 'adv-advisor') {
            content = `
                <div class="adv-tool-box">
                    <div class="analysis-card mini" style="background: rgba(255,255,255,0.8); border: 1px solid #e0e4e8; padding: 15px;">
                        <div style="margin-bottom: 12px;">
                            <span style="font-weight: 800; font-size: 0.7rem; color: var(--accent-color); letter-spacing: 1px; text-transform: uppercase;">Diagnóstico Actual</span>
                            <p id="advr-diagnosis" style="margin-top: 6px; font-size: 0.8rem; color: var(--text-main); line-height: 1.4; font-weight: 500;">Esperando datos...</p>
                        </div>
                        <div id="advr-strengths-container">
                             <ul id="advr-strengths" style="margin-top: 6px; padding-left: 15px; font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4; list-style-type: disc;"></ul>
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

export function updateOptionalDirectionVisibility(active) {
    const mechMsg = document.getElementById('mech-no-dir-msg');
    const mechCont = document.getElementById('mech-results-container');
    const schmidMsg = document.getElementById('schmid-no-dir-msg');
    const schmidCont = document.getElementById('schmid-results-container');

    if (mechMsg) mechMsg.style.display = active ? 'none' : 'block';
    if (mechCont) {
        mechCont.style.opacity = active ? '1' : '0.4';
        mechCont.style.pointerEvents = active ? 'all' : 'none';
    }

    if (schmidMsg) schmidMsg.style.display = active ? 'none' : 'block';
    if (schmidCont) {
        schmidCont.style.opacity = active ? '1' : '0.4';
        schmidCont.style.pointerEvents = active ? 'all' : 'none';
    }
}

export function updateStructureSelector(updateScene) {
    const container = document.getElementById('adv-struct-container');
    if (!container) return;
    
    const finalUpdateScene = updateScene || savedUpdateScene;
    const sys = getActiveCrystalSystem();
    const currentStruct = getActiveReferenceStructure().toLowerCase();
    
    // Solo soporta cúbico
    const isChecked = (val) => val === currentStruct ? 'checked' : '';
    container.innerHTML = `
        <span style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Estructura de Referencia</span>
        <div class="structure-selector" style="margin-top: 12px; display: flex; gap: 15px;">
            <label style="font-size: 0.85rem; font-weight: 600;"><input type="radio" name="adv-struct" value="sc" ${isChecked('sc')}> SC</label>
            <label style="font-size: 0.85rem; font-weight: 600;"><input type="radio" name="adv-struct" value="bcc" ${isChecked('bcc')}> BCC</label>
            <label style="font-size: 0.85rem; font-weight: 600;"><input type="radio" name="adv-struct" value="fcc" ${isChecked('fcc')}> FCC</label>
        </div>
    `;

    document.querySelectorAll('input[name="adv-struct"]').forEach(radio => {
        radio.onchange = () => {
            if (sys === 'cubic') {
                updateState({ structure: radio.value.toUpperCase() });
            }
            if (finalUpdateScene) finalUpdateScene();
        };
    });
}

function bindAdvancedPanelEvents(updateScene) {
    updateStructureSelector(updateScene);

    document.querySelectorAll('.adv-section-card .adv-section-header').forEach(header => {
        header.onclick = () => {
            const card = header.parentElement;
            const isActive = card.classList.contains('active');
            document.querySelectorAll('.adv-section-card').forEach(c => c.classList.remove('active'));
            if (!isActive) card.classList.add('active');
            
            // Forzar actualización de escena para sincronizar visualización atómica HCP
            if (updateScene) updateScene();
        };
    });

    const toggleDir = document.getElementById('adv-toggle-dir');
    const dirInputs = document.getElementById('adv-dir-inputs');
    const inputs = ['adv-u', 'adv-v', 'adv-w', 'adv-lx', 'adv-ly', 'adv-lz'];

    if (toggleDir) {
        toggleDir.onchange = () => {
            const active = toggleDir.checked;
            dirInputs.style.opacity = active ? '1' : '0.5';
            dirInputs.style.pointerEvents = active ? 'all' : 'none';
            document.getElementById('adv-geo-results').style.display = active ? 'block' : 'none';
            updateOptionalDirectionVisibility(active);
            updateScene();
        };
    }

    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.oninput = () => { sanitizeIntegerInput(el); updateScene(); };
            el.onkeydown = (e) => e.stopPropagation();
            el.onkeyup = (e) => e.stopPropagation();
        }
    });

    document.querySelectorAll('input[name="adv-defect"]').forEach(radio => {
        radio.onchange = () => {
            const active = radio.value !== 'none';
            document.getElementById('adv-defect-info').style.display = active ? 'block' : 'none';
            updateScene();
        };
    });

    // Inicializar módulo de intersticiales
    initializeInterstitialSelectors();

    document.getElementById('btn-close-adv')?.addEventListener('click', () => {
        setEngineeringModeEnabled(false);
        updateScene();
    });
}

async function initializeInterstitialSelectors() {
    console.log('[IntersticePanel] Inicializando módulo de intersticiales...');
    
    // Obtener referencias a selectores (declaración única)
    const metalSelect = document.getElementById('int-metal-select');
    const speciesSelect = document.getElementById('int-species-select');
    
    if (!metalSelect || !speciesSelect) {
        console.error('[IntersticePanel] Selectores no encontrados en DOM:', { metalSelect, speciesSelect });
        return;
    }
    
    console.log('[IntersticePanel] Selectores encontrados, cargando datos...');
    
    // Cargar y poblar especies
    try {
        const species = await InterstitialEngine.loadInterstitialSpecies();
        console.log('[IntersticePanel] Especies cargadas:', species);
        if (speciesSelect && species.length > 0) {
            species.forEach(sp => {
                const opt = document.createElement('option');
                opt.value = sp.id;
                opt.textContent = `${sp.symbol} - ${sp.name}`;
                speciesSelect.appendChild(opt);
            });
            console.log(`[IntersticePanel] ${species.length} especies agregadas al selector`);
        }
    } catch (e) {
        console.error("[IntersticePanel] Error cargando especies:", e);
    }

    // Cargar y poblar materiales (metales)
    try {
        const resp = await fetch('./data/materials-library.json');
        const materials = await resp.json();
        console.log('[IntersticePanel] Materiales cargados:', materials);
        if (metalSelect) {
            materials.forEach(mat => {
                const opt = document.createElement('option');
                opt.value = mat.id;
                opt.textContent = `${mat.symbol} (${mat.structure})`;
                metalSelect.appendChild(opt);
            });
            console.log(`[IntersticePanel] ${materials.length} metales agregados al selector`);
        }
    } catch (e) {
        console.error("[IntersticePanel] Error cargando materiales:", e);
    }

    // Función de análisis intersticial
    const updateInterstitialAnalysis = async () => {
        const metalId = metalSelect?.value;
        const speciesId = speciesSelect?.value;

        console.log('[IntersticePanel] Análisis:', { metalId, speciesId });

        if (!metalId || !speciesId) {
            document.getElementById('int-results-container').style.display = 'none';
            return;
        }

        try {
            const resp = await fetch('./data/materials-library.json');
            const materials = await resp.json();
            const metal = materials.find(m => m.id === metalId);
            const species = await InterstitialEngine.loadInterstitialSpecies();
            const solute = species.find(s => s.id === speciesId);

            console.log('[IntersticePanel] Datos encontrados:', { metal, solute });

            if (metal && solute) {
                updateInterstitialResults(metal, solute);
                document.getElementById('int-results-container').style.display = 'block';
            }
        } catch (e) {
            console.error("Update analysis failed:", e);
        }
    };

    // Agregar listeners de eventos
    if (metalSelect) {
        metalSelect.addEventListener('change', updateInterstitialAnalysis);
        console.log('[IntersticePanel] Listener agregado a metalSelect');
    }
    if (speciesSelect) {
        speciesSelect.addEventListener('change', updateInterstitialAnalysis);
        console.log('[IntersticePanel] Listener agregado a speciesSelect');
    }
    
    console.log('[IntersticePanel] Módulo inicializado correctamente');
}

export function updateAdvancedResults(state, direction, results, mechanism, schmid, defectInfo, cryst) {
    // Sistema: siempre cúbico
    const panel = document.getElementById('advanced-panel');
    if (!panel || !panel.classList.contains('visible')) return;

    // 1. Geometría
    const condEl = document.getElementById('adv-val-cond');
    if (condEl) {
        condEl.textContent = results?.dotProduct ?? '-';
        document.getElementById('adv-val-compat').textContent = results?.liesInPlane ? 'SÍ' : 'NO';
    }

    // 2. Mecanismos
    const mechPlanar = document.getElementById('mech-planar-score');
    if (mechPlanar) {
        if (!mechanism) {
            mechPlanar.textContent = '-';
            document.getElementById('mech-linear-score').textContent = '-';
            const rankEl = document.getElementById('mech-total-rank');
            rankEl.textContent = '-';
            rankEl.style.background = 'var(--text-muted)';
            document.getElementById('mech-explanation').textContent = '';
        } else {
            mechPlanar.textContent = (mechanism.planar || 0).toFixed(1);
            document.getElementById('mech-linear-score').textContent = (mechanism.linear || 0).toFixed(1);
            const rankEl = document.getElementById('mech-total-rank');
            rankEl.textContent = mechanism.explanation?.rank ?? '-';
            rankEl.style.background = mechanism.explanation?.color ?? 'var(--text-muted)';
            document.getElementById('mech-explanation').textContent = mechanism.explanation?.text ?? '';
        }
    }

    // 3. Schmid
    const schmidM = document.getElementById('schmid-val-m');
    if (schmidM) {
        if (!schmid) {
            schmidM.textContent = '-';
            document.getElementById('schmid-val-phi').textContent = '-';
            document.getElementById('schmid-val-lambda').textContent = '-';
            const rankEl = document.getElementById('schmid-total-rank');
            rankEl.textContent = '-';
            rankEl.style.background = 'var(--text-muted)';
            document.getElementById('schmid-explanation').textContent = '';
        } else {
            document.getElementById('schmid-val-phi').textContent = (schmid.phi ?? '-') + '°';
            document.getElementById('schmid-val-lambda').textContent = (schmid.lambda ?? '-') + '°';
            schmidM.textContent = schmid.multiplier ?? '0.000';
            const rankEl = document.getElementById('schmid-total-rank');
            rankEl.textContent = schmid.explanation?.rank ?? '-';
            rankEl.style.background = schmid.explanation?.color ?? 'var(--text-muted)';
            document.getElementById('schmid-explanation').textContent = schmid.explanation?.text ?? '';
        }
    }

    // 4. Defectos
    const defectExp = document.getElementById('defect-explanation');
    if (defectExp) defectExp.textContent = defectInfo || "Sin defectos.";

    // 5. Análisis Cristalográfico
    const crystArea = document.getElementById('cryst-val-area');
    if (crystArea) {
        if (!cryst) {
            crystArea.textContent = '-';
        } else {
            crystArea.textContent = (cryst.area ?? '-') + ' Å²';
            document.getElementById('cryst-val-atoms').textContent = cryst.atoms ?? '-';
            document.getElementById('cryst-val-density').textContent = (cryst.density ?? '-') + ' at/Å²';
            document.getElementById('cryst-val-struct-name').textContent = state.structure;
            
            const rankEl = document.getElementById('cryst-total-rank');
            rankEl.textContent = cryst.explanation?.rank ?? 'N/D';
            rankEl.style.background = cryst.explanation?.color ?? 'var(--text-muted)';
            document.getElementById('cryst-explanation').textContent = cryst.explanation?.text ?? '';
        }
    }
}

export function updateAdvisorResults(report) {
    const panel = document.getElementById('advanced-panel');
    if (!panel || !panel.classList.contains('visible')) return;
    if (!report) return;
    
    document.getElementById('advr-diagnosis').textContent = report.diagnosis;
    const el = document.getElementById('advr-strengths');
    if (el) {
        el.innerHTML = '';
        (report.strengths || []).forEach(text => {
            const li = document.createElement('li');
            li.textContent = text;
            el.appendChild(li);
        });
    }
}

export function updateInterstitialResults(metal, solute) {
    const panel = document.getElementById('advanced-panel');
    if (!panel) return;

    try {
        // Obtener radios de sitios
        const sites = InterstitialEngine.getInterstitialSiteRadii(metal.structure, metal.latticeParameterA);
        if (!sites) return;

        // Evaluar compatibilidad
        const fit_oct = InterstitialEngine.evaluateSite(metal.latticeParameterA, solute.radius, 'octahedral', metal.structure);
        const fit_tet = InterstitialEngine.evaluateSite(metal.latticeParameterA, solute.radius, 'tetrahedral', metal.structure);

        // Determinar mejor ajuste
        let best_fit, site_name;
        if (fit_oct.ratio < fit_tet.ratio) {
            best_fit = fit_oct;
            site_name = 'OCTAHEDRAL';
        } else {
            best_fit = fit_tet;
            site_name = 'TETRAHEDRAL';
        }

        // Actualizar UI
        document.getElementById('int-val-structure').textContent = metal.structure;
        document.getElementById('int-val-oct').textContent = sites.octahedral.toFixed(3);
        document.getElementById('int-val-tet').textContent = sites.tetrahedral.toFixed(3);
        document.getElementById('int-val-site').textContent = site_name;
        document.getElementById('int-val-distortion').textContent = best_fit.rank;

        // Determinación de compatibilidad
        let compat_text, compat_color;
        if (best_fit.fits && best_fit.ratio < 0.59) {
            compat_text = 'COMPATIBLE';
            compat_color = '#28a745'; // verde
        } else if (best_fit.ratio < 0.8) {
            compat_text = 'MARGINAL';
            compat_color = '#ff9800'; // naranja
        } else {
            compat_text = 'INCOMPATIBLE';
            compat_color = '#dc3545'; // rojo
        }

        const compatEl = document.getElementById('int-val-compat');
        compatEl.textContent = compat_text;
        compatEl.style.background = compat_color;

        // Explicación    
        let explanation = `Metal: ${metal.name} (${metal.structure})\nSoluto: ${solute.name} (${solute.symbol})\n\n`;
        explanation += `Radio del sitio ${site_name}: ${best_fit.maxRadius.toFixed(3)} Å\n`;
        explanation += `Radio del soluto: ${solute.radius.toFixed(3)} Å\n`;
        explanation += `Razón r_soluto/r_sitio: ${best_fit.ratio.toFixed(3)}\n\n`;
        explanation += `ANÁLISIS:\n`;
        
        if (best_fit.fits) {
            if (metal.structure === 'BCC' && solute.symbol === 'H') {
                explanation += `⚠️ H en BCC: muy pequeño, causa fragilización.\n`;
                explanation += `Riesgo de Hydrogen Embrittlement: CRÍTICO.\n`;
            } else if (metal.structure === 'FCC' && solute.symbol === 'C') {
                explanation += `✓ C en FCC: endurecimiento robusto.\n`;
                explanation += `Mecanismo: Distorsión de red + Modulo misfit.\n`;
            } else if (metal.symbol === 'Pd' && solute.symbol === 'H') {
                explanation += `✓ H en Pd (FCC): absorción fácil.\n`;
                explanation += `Aplicación: Almacenamiento de hidrógeno.\n`;
            } else {
                explanation += `✓ Cabe en sitio ${site_name}.\n`;
                explanation += `Distorsión: ${best_fit.rank}.\n`;
                explanation += `Endurecimiento esperado: Moderado a Fuerte.\n`;
            }
        } else {
            explanation += `✗ No cabe sin distorsión excesiva.\n`;
            explanation += `Penalidad termodinámica severa.\n`;
        }

        document.getElementById('int-explanation').textContent = explanation;
    } catch (e) {
        console.error('updateInterstitialResults error:', e);
    }
}

export function getAdvancedState() {
    const parse = (id) => parseInt(document.getElementById(id)?.value) || 0;
    const state = getState();
    return {
        direction: {
            active: document.getElementById('adv-toggle-dir')?.checked || false,
            u: parse('adv-u'), v: parse('adv-v'), w: parse('adv-w')
        },
        load: {
            lx: parse('adv-lx'), ly: parse('adv-ly'), lz: parse('adv-lz')
        },
        structure: state.structure.toLowerCase(),
        defect: document.querySelector('input[name="adv-defect"]:checked')?.value || 'none'
    };
}

export function setEngineeringModeEnabled(enabled) {
    updateState({ isEngineeringModeEnabled: enabled });
    const toggle = document.getElementById('eng-toggle');
    if (toggle) toggle.checked = enabled;
    
    const panel = document.getElementById('advanced-panel');
    if (enabled) {
        panel.classList.add('visible');
        document.body.classList.add('eng-mode-active');
    } else {
        panel.classList.remove('visible');
        document.body.classList.remove('eng-mode-active');
    }
    applyEngineeringModeLayout();
}

export function applyEngineeringModeLayout() {
    const state = getState();
    document.body.style.overflow = (state.isEngineeringModeEnabled && window.innerWidth > 1000) ? 'hidden' : '';
}

export function toggleEngineeringMode() {
    const state = getState();
    setEngineeringModeEnabled(!state.isEngineeringModeEnabled);
}

export function syncEngineeringPanelStateWithViewport() {
    applyEngineeringModeLayout();
}

export function openAdvancedPanel() { setEngineeringModeEnabled(true); }
export function closeAdvancedPanel() { setEngineeringModeEnabled(false); }

/**
 * Verifica si algún panel técnico de ingeniería está expandido.
 * Usado para disparar visualizaciones automáticas en HCP.
 */
export function isAnyTechnicalMenuOpen() {
    const list = ['adv-geo', 'adv-cryst', 'adv-schmid', 'adv-defects', 'adv-interstitials'];
    for (const id of list) {
        const card = document.querySelector(`.adv-section-card[data-section="${id}"]`);
        if (card && card.classList.contains('active')) return true;
    }
    return false;
}
