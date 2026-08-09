// popup.js
document.addEventListener('DOMContentLoaded', () => {
    const modeButtons = Array.from(document.querySelectorAll('.mode-btn'));
    const personaChips = Array.from(document.querySelectorAll('.persona-chip'));
    const statusText = document.getElementById('statusText');
    const storage = globalThis.chrome && chrome.storage && chrome.storage.sync;

    function normalizeFramework(value) {
        if (['coding', 'data_science', 'devops'].includes(value)) return 'coding';
        if (['creative', 'image_gen', 'video_gen', 'audio_gen'].includes(value)) return 'creative';
        return 'general';
    }

    function setActiveFramework(framework) {
        modeButtons.forEach((button) => {
            const isActive = button.dataset.framework === framework;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-checked', String(isActive));
        });
    }

    function setActivePersona(persona) {
        personaChips.forEach((chip) => {
            const isActive = chip.dataset.persona === persona;
            chip.classList.toggle('is-active', isActive);
            chip.setAttribute('aria-checked', String(isActive));
        });
    }

    function flashStatus(text) {
        statusText.textContent = text;
        setTimeout(() => {
            statusText.textContent = '';
        }, 1200);
    }

    function save(framework, persona) {
        if (!storage) {
            flashStatus('Selected');
            return;
        }

        storage.set({ framework, persona }, () => {
            flashStatus('Saved');
        });
    }

    function getCurrentSettings() {
        const activeFramework = modeButtons.find(b => b.classList.contains('is-active'));
        const activePersona = personaChips.find(c => c.classList.contains('is-active'));
        return {
            framework: activeFramework?.dataset.framework || 'general',
            persona: activePersona?.dataset.persona || 'expert'
        };
    }

    // Framework buttons
    modeButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const framework = button.dataset.framework;
            setActiveFramework(framework);
            const settings = getCurrentSettings();
            save(framework, settings.persona);
        });
    });

    // Persona chips
    personaChips.forEach((chip) => {
        chip.addEventListener('click', () => {
            const persona = chip.dataset.persona;
            setActivePersona(persona);
            const settings = getCurrentSettings();
            save(settings.framework, persona);
        });
    });

    // Load saved settings
    if (!storage) {
        setActiveFramework('general');
        setActivePersona('expert');
        return;
    }

    storage.get(['framework', 'persona'], (result) => {
        setActiveFramework(normalizeFramework(result.framework));
        setActivePersona(result.persona || 'expert');
    });
});
