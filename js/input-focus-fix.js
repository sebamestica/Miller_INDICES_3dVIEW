

export function initializeFocusManagement() {

    const stopPropagation = (e) => {
        if (isEditable(e.target)) {
            e.stopPropagation();
        }
    };

    window.addEventListener('keydown', stopPropagation, true);
    window.addEventListener('keyup', stopPropagation, true);
    window.addEventListener('keypress', stopPropagation, true);


    const preventSceneInteraction = (e) => {
        if (isEditable(e.target)) {


            e.stopPropagation();
        }
    };

    window.addEventListener('touchstart', preventSceneInteraction, { passive: true });
    window.addEventListener('mousedown', preventSceneInteraction, true);



    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('focus', () => {
             document.body.classList.add('input-focused');
        });
        input.addEventListener('blur', () => {
             document.body.classList.remove('input-focused');
        });
    });
}


export function isEditable(el) {
    if (!el) return false;
    const tag = el.tagName.toLowerCase();
    const isInput = tag === 'input' || tag === 'textarea' || tag === 'select';
    const isContentEditable = el.getAttribute('contenteditable') === 'true';
    return isInput || isContentEditable;
}


export function shouldIgnoreKeyboard(e) {
    return isEditable(document.activeElement);
}
