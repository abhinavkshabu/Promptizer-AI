// popup.js
document.addEventListener('DOMContentLoaded', () => {
    const personaSelect = document.getElementById('persona');
    const saveBtn = document.getElementById('saveBtn');

    // 1. Load the previously saved setting when the menu opens
    chrome.storage.sync.get(['persona'], (result) => {
        if (result.persona) {
            personaSelect.value = result.persona;
        }
    });

    // 2. Save the new setting when the button is clicked
    saveBtn.addEventListener('click', () => {
        const selectedPersona = personaSelect.value;
        
        chrome.storage.sync.set({ persona: selectedPersona }, () => {
            // Visual feedback
            saveBtn.innerText = "Settings Locked!";
            saveBtn.style.background = "#00ff7f";
            saveBtn.style.color = "#000";
            
            setTimeout(() => {
                saveBtn.innerText = "Save Preferences";
                saveBtn.style.background = "#a6e3a1";
            }, 1500);
        });
    });
});