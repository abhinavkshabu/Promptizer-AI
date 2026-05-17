// popup.js
document.addEventListener('DOMContentLoaded', () => {
    const modeButtons = Array.from(document.querySelectorAll('.mode-btn'));
    const statusText = document.getElementById('statusText');
    const storage = globalThis.chrome && chrome.storage && chrome.storage.sync;

    function normalizeFramework(value) {
        if (['coding', 'data_science', 'devops'].includes(value)) return 'coding';
        if (['creative', 'image_gen', 'video_gen', 'audio_gen'].includes(value)) return 'creative';
        return 'general';
    }

    function setActive(framework) {
        modeButtons.forEach((button) => {
            const isActive = button.dataset.framework === framework;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-checked', String(isActive));
        });
    }

    function saveFramework(framework) {
        setActive(framework);

        if (!storage) {
            statusText.textContent = 'Selected';
            return;
        }

        storage.set({
            framework,
            persona: 'expert'
        }, () => {
            statusText.textContent = 'Saved';
            setTimeout(() => {
                statusText.textContent = '';
            }, 1200);
        });
    }

    modeButtons.forEach((button) => {
        button.addEventListener('click', () => {
            saveFramework(button.dataset.framework);
        });
    });

    if (!storage) {
        setActive('general');
        return;
    }

    storage.get(['framework'], (result) => {
        setActive(normalizeFramework(result.framework));
    });
});
