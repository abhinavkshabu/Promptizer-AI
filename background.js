// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "optimizePrompt") {

        // 1. Check Chrome Storage for the user's selected Framework + Persona
        chrome.storage.sync.get(['framework', 'persona'], function (result) {
            const userFramework = result.framework || 'general';
            const userPersona = result.persona || 'expert';

            // 2. Create an AbortController with a 60-second timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);

            // 3. Send the payload to your LIVE cloud server
            fetch('https://promptizer-ai.onrender.com/api/optimize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    rawText: request.text,
                    aiContext: request.context,
                    framework: userFramework,
                    persona: userPersona
                })
            })
                .then(response => {
                    clearTimeout(timeoutId);
                    if (!response.ok) {
                        // Server returned an HTTP error — parse the error message
                        return response.json().then(errData => {
                            throw new Error(errData.error || `Server error (HTTP ${response.status})`);
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.optimizedText) {
                        sendResponse({ optimizedText: data.optimizedText });
                    } else {
                        sendResponse({ optimizedText: "Error: Server returned an empty result. Please try again." });
                    }
                })
                .catch(error => {
                    clearTimeout(timeoutId);
                    console.error("Promptizer Error:", error);

                    let message;
                    if (error.name === 'AbortError') {
                        message = "Error: Request timed out (60s). The server may be waking up — please try again in a few seconds.";
                    } else {
                        message = `Error: ${error.message || "Could not connect to the Promptizer server."}`;
                    }
                    sendResponse({ optimizedText: message });
                });
        });

        // Return true keeps the message channel open while we wait for the server
        return true;
    }
});