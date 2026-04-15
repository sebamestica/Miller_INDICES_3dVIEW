
import { getState, updateState } from './state.js';
import { closeAdvancedPanel, openAdvancedPanel } from './advanced-panel.js';

const SCENARIOS_CUBIC = [
    {
        name: "Deslizamiento Ideal (FCC)",
        desc: "Plano {111} en estructura FCC. Es el sistema más compacto y favorable para el deslizamiento plástico.",
        state: { system: 'cubic', h: 1, k: 1, l: 1 },
        adv: { structure: 'fcc', u: 1, v: -1, w: 0, active: true, defect: 'none' }
    },
    {
        name: "Sistema BCC Compacto",
        desc: "Plano {110} en BCC. Sistema de alta densidad atómica, fundamental en la ductilidad de aceros ferríticos.",
        state: { system: 'cubic', h: 1, k: 1, l: 0 },
        adv: { structure: 'bcc', u: -1, v: 1, w: 1, active: true, defect: 'none' }
    },
    {
        name: "Impacto de Defectos",
        desc: "Incluso en sistemas favorables, la presencia de intersticiales o vacancias distorsiona la red y reduce la movilidad.",
        state: { system: 'cubic', h: 1, k: 1, l: 1 },
        adv: { structure: 'fcc', u: 1, v: -1, w: 0, active: true, defect: 'interstitial' }
    },
    {
        name: "Análisis de Carga (Schmid)",
        desc: "La orientación de la carga es crítica. Aquí vemos un factor de Schmid bajo debido a la desalineación con el sistema.",
        state: { system: 'cubic', h: 1, k: 0, l: 0 },
        adv: { structure: 'fcc', u: 0, v: 1, w: 1, active: true, lx: 0, ly: 0, lz: 1 }
    }
];

let currentScenarioCubic = -1;


export function initializeDemoMode(updateScene, switchUI) {
    const header = document.querySelector('.header-content');
    if (!header) return;
    const demoBtn = document.createElement('button');
    demoBtn.id = 'btn-demo-mode';
    demoBtn.className = 'secondary-btn highlight';
    demoBtn.innerHTML = 'Demo Guiada';
    demoBtn.style.marginLeft = '12px';
    demoBtn.onclick = () => runNextScenario(updateScene, switchUI);
    header.appendChild(demoBtn);

    const toast = document.createElement('div');
    toast.id = 'demo-toast';
    toast.style.cssText = `
        position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
        background: rgba(0,0,0,0.85); color: #fff; padding: 15px 25px;
        border-radius: 50px; font-size: 0.9rem; z-index: 2000;
        display: none; box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        max-width: 90%; text-align: center; line-height: 1.4; pointer-events: none;
    `;
    
    if (window.innerWidth < 1000) {
        toast.style.bottom = 'auto';
        toast.style.top = '10px';
    }
    document.body.appendChild(toast);
}

function runNextScenario(updateScene, switchUI) {
    // Solo escenarios cúbicos soportados
    currentScenarioCubic = (currentScenarioCubic + 1) % SCENARIOS_CUBIC.length;
    const s = SCENARIOS_CUBIC[currentScenarioCubic];

    import('./app.js').then(app => {
        // Sistema: siempre cúbico
        app.switchCrystalSystemSafely('cubic');
        
        // Actualizar valores en el estado
        updateState(s.state);

        // Actualizar DOM
        document.getElementById('c-h').value = s.state.h;
        document.getElementById('c-k').value = s.state.k;
        document.getElementById('c-l').value = s.state.l;

        if (s.adv) {
            const radio = document.querySelector(`input[name="adv-struct"][value="${s.adv.structure}"]`);
            if (radio) radio.checked = true;
            
            const toggleDir = document.getElementById('adv-toggle-dir');
            if (toggleDir) {
                toggleDir.checked = s.adv.active;
                // Simular cambio para activar UI dependiente
                const event = new Event('change');
                toggleDir.dispatchEvent(event);
            }

            if (document.getElementById('adv-u')) document.getElementById('adv-u').value = s.adv.u;
            if (document.getElementById('adv-v')) document.getElementById('adv-v').value = s.adv.v;
            if (document.getElementById('adv-w')) document.getElementById('adv-w').value = s.adv.w;
            
            if (s.adv.defect) {
                const defRadio = document.querySelector(`input[name="adv-defect"][value="${s.adv.defect}"]`);
                if (defRadio) defRadio.checked = true;
            }
            if (s.adv.lx !== undefined) {
                 if (document.getElementById('adv-lx')) document.getElementById('adv-lx').value = s.adv.lx;
                 if (document.getElementById('adv-ly')) document.getElementById('adv-ly').value = s.adv.ly;
                 if (document.getElementById('adv-lz')) document.getElementById('adv-lz').value = s.adv.lz;
            }
        }

        showTechnicalMessage(s.name, s.desc);
        openAdvancedPanel();
        updateScene();
    });
}

export function showTechnicalMessage(title, message) {
    const toast = document.getElementById('demo-toast');
    if (!toast) return;
    toast.innerHTML = `<strong>${title}:</strong> ${message}`;
    toast.style.display = 'block';
    toast.style.animation = 'none';
    toast.offsetHeight;
    toast.style.animation = 'fadeInUp 0.5s ease-out';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 6000);
}
