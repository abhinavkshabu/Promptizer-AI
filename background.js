// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "optimizePrompt") {
        
        // 1. Check Chrome Storage for the user's selected Persona
        chrome.storage.sync.get(['persona'], function(result) {
            const userPersona = result.persona || 'general';

            // 2. Send the payload to your secure local Groq server
            fetch('http://127.0.0.1:3000/api/optimize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rawText: request.text,
                    aiContext: request.context,
                    persona: userPersona
                })
            })
            .then(response => response.json())
            .then(data => {
                // 3. Send the optimized text back to the webpage
                sendResponse({ optimizedText: data.optimizedText });
            })
            .catch(error => {
                console.error("Server Error:", error);
                sendResponse({ optimizedText: "Error: Could not connect to the Promptizer server. Is it running?" });
            });
        });

        // Return true keeps the message channel open while we wait for the server
        return true; 
    }
});