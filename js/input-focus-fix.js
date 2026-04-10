/**
 * Input Focus Fix and Stability Module
 * Robustly handles input events to prevent interference from 3D scene controls
 * and other global event listeners.
 */

export function initializeFocusManagement() {
    // 1. Prevent Three.js/OrbitControls from stealing keys when typing
    const stopPropagation = (e) => {
        if (isEditable(e.target)) {
            e.stopPropagation();
        }
    };

    window.addEventListener('keydown', stopPropagation, true);
    window.addEventListener('keyup', stopPropagation, true);
    window.addEventListener('keypress', stopPropagation, true);

    // 2. Prevent touch events from triggering scene actions when interacting with UI
    const preventSceneInteraction = (e) => {
        if (isEditable(e.target)) {
            // We want the input to work normally, but not let the event bubble 
            // to any global listeners that might call preventDefault()
            e.stopPropagation();
        }
    };

    window.addEventListener('touchstart', preventSceneInteraction, { passive: true });
    window.addEventListener('mousedown', preventSceneInteraction, true);

    // 3. Robust Fix for Mobile Keyboard dismissal / focus loss
    // Some mobile browsers lose focus if a layout shift (like resize) is too aggressive
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('focus', () => {
             document.body.classList.add('input-focused');
        });
        input.addEventListener('blur', () => {
             document.body.classList.remove('input-focused');
        });
    });
}

/**
 * Checks if an element is an editable input or technical control.
 */
export function isEditable(el) {
    if (!el) return false;
    const tag = el.tagName.toLowerCase();
    const isInput = tag === 'input' || tag === 'textarea' || tag === 'select';
    const isContentEditable = el.getAttribute('contenteditable') === 'true';
    return isInput || isContentEditable;
}

/**
 * Ensures that global scene keyboard shortcuts don't fire when typing.
 */
export function shouldIgnoreKeyboard(e) {
    return isEditable(document.activeElement);
}
