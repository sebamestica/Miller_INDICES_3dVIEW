/**
 * Miller Explorer - UI Controller
 * Manages DOM events, updates the technical panel, and handles the CLI.
 */
import { getState, updateState } from './state.js';
import { parseIntegerInput } from './math.js';
import { resetCameraView } from './scene.js';
import * as AdvancedPanel from './advanced-panel.js';

/**
 * Binds all UI interactions to the main update routine.
 */
export function bindUIEvents(updateScene) {
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = (e) => {
            const sys = e.target.dataset.system;
            updateState({ system: sys });
            switchSystemUI(sys);
            updateScene();
        };
    });

    // Hexagonal auto-i logic
    const hH = document.getElementById('h-h');
    const hK = document.getElementById('h-k');
    const hI = document.getElementById('h-i');
    
    const updateI = () => {
       const h = parseIntegerInput(hH.value);
       const k = parseIntegerInput(hK.value);
       if (h !== null && k !== null) hI.value = -(h + k);
       else hI.value = '...';
    };
    hH.oninput = updateI;
    hK.oninput = updateI;

    // Inputs Sanitization
    const allInputs = document.querySelectorAll('.coord-input');
    allInputs.forEach(input => {
        input.oninput = (e) => {
            sanitizeIntegerInput(input);
            if (input.id === 'h-h' || input.id === 'h-k') updateI();
        };
    });

    document.getElementById('btn-apply').onclick = updateScene;
    document.getElementById('btn-reset').onclick = resetCameraView;

    ['toggle-plane', 'toggle-vector', 'toggle-origin'].forEach(id => {
        document.getElementById(id).onchange = updateScene;
    });

    // Vector scale slider
    const scaleInput = document.getElementById('input-scale');
    scaleInput.oninput = (e) => {
        const val = parseFloat(e.target.value);
        updateState({ vecScale: val });
        document.getElementById('val-scale-txt').textContent = val;
        updateScene();
    };

    // CLI Integration
    const cliInput = document.getElementById('cli-input');
    const cliRunBtn = document.getElementById('btn-cli-run');
    const handleCLI = () => {
        const cmd = cliInput.value.trim();
        if(cmd) {
            processCLICommand(cmd, updateScene);
            cliInput.value = '';
        }
    };
    cliRunBtn.onclick = handleCLI;
    cliInput.onkeypress = (e) => { if(e.key === 'Enter') handleCLI(); };

    // Advanced Panel Toggle
    const engToggle = document.getElementById('eng-toggle');
    if (engToggle) {
        engToggle.onchange = (e) => {
            AdvancedPanel.setEngineeringModeEnabled(e.target.checked);
            updateScene();
        };
    }
}

/**
 * Sanitizes input to allow only valid integer characters (0-9 and leading minus).
 */
export function sanitizeIntegerInput(el) {
    let val = el.value;
    // Remove anything that isn't a digit, or the first minus sign
    let sanitized = val.replace(/[^-0-9]/g, '');
    
    // Handle multiple minus signs: only one allowed at start
    if (sanitized.indexOf('-') > 0) {
        sanitized = sanitized[0] + sanitized.slice(1).replace(/-/g, '');
    }
    
    if (val !== sanitized) {
        el.value = sanitized;
    }
    return sanitized;
}

/**
 * Updates the UI appearance based on the selected crystal system.
 */
export function switchSystemUI(sys) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.system === sys));
    
    document.getElementById('inputs-cubic').style.display = sys === 'cubic' ? 'grid' : 'none';
    document.getElementById('inputs-hexagonal').style.display = sys === 'hexagonal' ? 'grid' : 'none';
    document.getElementById('system-subtitle').textContent = sys === 'cubic' ? 'Laboratorio Cristalográfico Cúbico' : 'Laboratorio Cristalográfico Hexagonal';
    document.getElementById('input-title').textContent = sys === 'cubic' ? 'Índices (h k l)' : 'Índices de Miller-Bravais (h k i l)';
    document.getElementById('val-sys').textContent = sys === 'cubic' ? 'Cúbico' : 'Hexagonal';
    document.getElementById('hex-note').style.display = sys === 'hexagonal' ? 'block' : 'none';
    document.getElementById('legend-axes').textContent = sys === 'cubic' ? 'Ejes: X (Azul), Y (Rojo), Z (Verde)' : 'Ejes: a1, a2, a3 (Azul/Rojo/Naranja), c (Verde)';

    buildPresetsUI(sys);
}

/**
 * Dynamically builds the preset chips.
 */
export function buildPresetsUI(system) {
    const container = document.getElementById('preset-container');
    container.innerHTML = '';
    const items = system === 'cubic' 
        ? [[1,0,0],[1,1,0],[1,1,1],[2,1,1],[-1,1,1],[1,0,-1]]
        : [[1,0,-1,0],[1,1,-2,0],[0,0,0,1],[1,0,-1,1],[1,1,-2,1],[-1,2,-1,0]];

    items.forEach(p => {
        const chip = document.createElement('div');
        chip.className = 'preset-chip';
        chip.textContent = `(${p.join(' ')})`;
        chip.onclick = () => {
            if(system === 'cubic') {
                document.getElementById('c-h').value = p[0];
                document.getElementById('c-k').value = p[1];
                document.getElementById('c-l').value = p[2];
            } else {
                document.getElementById('h-h').value = p[0];
                document.getElementById('h-k').value = p[1];
                document.getElementById('h-l').value = p[3];
                document.getElementById('h-i').value = p[2];
            }
            document.getElementById('btn-apply').click();
        };
        container.appendChild(chip);
    });
}

/**
 * Updates the technical panel with current state data.
 */
export function updateTechnicalPanel(state, points) {
    const { system, h, k, i, l } = state;
    document.getElementById('val-coords').textContent = system === 'cubic' ? `(${h} ${k} ${l})` : `(${h} ${k} ${i} ${l})`;
    document.getElementById('val-inter').textContent = `${points.length} puntos`;
    
    const mag = system === 'cubic' ? Math.sqrt(h*h + k*k + l*l) : Math.sqrt(h*h + (h+2*k)*(h+2*k)/3 + l*l);
    document.getElementById('val-vec').textContent = `|V| ≈ ${mag.toFixed(3)}`;
}

/**
 * Displays or hides error and info messages.
 */
export function showError(msg, type="error") {
    const err = document.getElementById('error-box');
    if (msg) {
        err.textContent = msg;
        err.style.display = 'block';
        err.style.color = type === 'info' ? 'var(--text-secondary)' : 'var(--danger)';
        err.style.backgroundColor = type === 'info' ? '#e9ecef' : '#ffeeba';
        err.style.borderColor = type === 'info' ? '#ced4da' : '#ffc107';
    } else {
        err.style.display = 'none';
        err.style.color = '';
        err.style.backgroundColor = '';
        err.style.borderColor = '';
    }
}

/**
 * Processes commands from the mini-terminal.
 */
function processCLICommand(cmdStr, updateScene) {
    const out = document.getElementById('cli-output');
    const print = (msg, type='normal') => {
        const color = type === 'error' ? 'var(--danger)' : (type === 'success' ? 'var(--success)' : 'var(--text-main)');
        out.innerHTML += `<div style="color: ${color}">> ${msg}</div>`;
        out.scrollTop = out.scrollHeight;
    };

    print(cmdStr, 'normal');
    const parts = cmdStr.toLowerCase().split(/\s+/);
    if(parts.length === 0) return;
    const cmd = parts[0];

    try {
        if (cmd === 'help' || cmd === 'examples') {
            print('Sistema: system [cubic | hex]', 'success');
            print('Cúbico: plane [h k l] | vector [h k l]', 'success');
            print('Hexagonal: plane_hex [h k i l] | vector_hex [h k i l]', 'success');
        } else if (cmd === 'clear') {
            out.innerHTML = '> Consola limpiada.<br>';
        } else if (cmd === 'system') {
            const target = parts[1];
            if (target === 'cubic' || target === 'c') {
                updateState({ system: 'cubic' });
                switchSystemUI('cubic');
                print('Sistema cambiado a Cúbico', 'success');
                updateScene();
            } else if (target === 'hex' || target === 'hexagonal' || target === 'h') {
                updateState({ system: 'hexagonal' });
                switchSystemUI('hexagonal');
                print('Sistema cambiado a Hexagonal', 'success');
                updateScene();
            } else {
                print('Error: Especifica cubic o hex', 'error');
            }
        } else if (cmd === 'plane' || cmd === 'vector') {
            if (parts.length >= 4) {
                updateState({ system: 'cubic' });
                switchSystemUI('cubic');
                document.getElementById('c-h').value = parts[1];
                document.getElementById('c-k').value = parts[2];
                document.getElementById('c-l').value = parts[3];
                document.getElementById('toggle-plane').checked = (cmd === 'plane');
                document.getElementById('toggle-vector').checked = (cmd === 'vector');
                updateScene();
                print(`Renderizando ${cmd} cúbico (${parts[1]} ${parts[2]} ${parts[3]})`, 'success');
            } else {
                print('Error: Faltan índices (h k l)', 'error');
            }
        } else if (cmd === 'plane_hex' || cmd === 'vector_hex') {
            if (parts.length >= 5) {
                updateState({ system: 'hexagonal' });
                switchSystemUI('hexagonal');
                document.getElementById('h-h').value = parts[1];
                document.getElementById('h-k').value = parts[2];
                document.getElementById('h-l').value = parts[4];
                document.getElementById('h-i').value = -(parseInt(parts[1]) + parseInt(parts[2]));
                document.getElementById('toggle-plane').checked = (cmd === 'plane_hex');
                document.getElementById('toggle-vector').checked = (cmd === 'vector_hex');
                updateScene();
                print(`Renderizando ${cmd} hexagonal (${parts[1]} ${parts[2]} ${-(parseInt(parts[1]) + parseInt(parts[2]))} ${parts[4]})`, 'success');
            } else {
                print('Error: Faltan índices (h k i l)', 'error');
            }
        } else {
            print(`Error: Comando no reconocido '${cmd}'`, 'error');
        }
    } catch (e) {
        print('Error de ejecución', 'error');
    }
}
