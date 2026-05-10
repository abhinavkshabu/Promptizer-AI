// popup.js
document.addEventListener('DOMContentLoaded', () => {
    const frameworkSelect = document.getElementById('framework');
    const personaSelect = document.getElementById('persona');
    const saveBtn = document.getElementById('saveBtn');

    // 1. Load previously saved settings when the menu opens
    chrome.storage.sync.get(['framework', 'persona'], (result) => {
        if (result.framework) {
            frameworkSelect.value = result.framework;
        }
        if (result.persona) {
            personaSelect.value = result.persona;
        }
    });

    // 2. Save new settings when the button is clicked
    saveBtn.addEventListener('click', () => {
        const selectedFramework = frameworkSelect.value;
        const selectedPersona = personaSelect.value;

        chrome.storage.sync.set({
            framework: selectedFramework,
            persona: selectedPersona
        }, () => {
            // Visual feedback
            saveBtn.innerText = "✓ Settings Saved!";
            saveBtn.style.background = "linear-gradient(135deg, #00ff7f, #00bfff)";
            saveBtn.style.color = "#000";

            setTimeout(() => {
                saveBtn.innerText = "Save Preferences";
                saveBtn.style.background = "linear-gradient(135deg, #8553f4, #3b82f6)";
                saveBtn.style.color = "#fff";
            }, 1500);
        });
    });
});