// 1. Identify Context
const currentHostname = window.location.hostname;
let aiContext = "General AI";
if (currentHostname.includes("chatgpt")) aiContext = "ChatGPT";
else if (currentHostname.includes("gemini")) aiContext = "Google Gemini";
else if (currentHostname.includes("claude")) aiContext = "Claude";

// 2. Setup Shadow DOM for CSS isolation
const hostElement = document.createElement('div');
hostElement.id = 'promptizer-host';
document.body.appendChild(hostElement);
const shadowRoot = hostElement.attachShadow({ mode: 'open' });

// 3. Create the UI (Button + Hidden Suggestion Box)
const container = document.createElement('div');
container.innerHTML = `
    <style>
        .promptizer-btn {
            position: fixed;
            bottom: 30px;
            right: 30px;
            z-index: 2147483647;
            background: linear-gradient(135deg, #00ff7f, #00bfff); 
            color: #000;
            border: none;
            padding: 14px 24px;
            border-radius: 50px;
            cursor: pointer;
            font-family: 'Courier New', Courier, monospace;
            font-weight: 900;
            font-size: 14px;
            box-shadow: 0 0 15px rgba(0, 255, 127, 0.4);
            transition: transform 0.2s;
        }
        .promptizer-btn:hover { transform: scale(1.05); }
        
        /* The New Suggestion Box */
        .suggestion-box {
            position: fixed;
            bottom: 90px;
            right: 30px;
            width: 320px;
            background: #1e1e2e;
            border: 1px solid #45475a;
            border-radius: 12px;
            padding: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.6);
            display: none; /* Hidden until needed */
            flex-direction: column;
            gap: 12px;
            z-index: 2147483647;
            font-family: sans-serif;
        }
        .suggestion-header {
            color: #89b4fa;
            font-weight: bold;
            font-size: 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .close-btn {
            background: none;
            border: none;
            color: #f38ba8;
            cursor: pointer;
            font-size: 16px;
        }
        .suggestion-text {
            color: #a6e3a1;
            font-size: 13px;
            line-height: 1.5;
            max-height: 200px;
            overflow-y: auto;
            background: #11111b;
            padding: 10px;
            border-radius: 6px;
        }
        .apply-btn {
            background: #89b4fa;
            color: #11111b;
            border: none;
            padding: 10px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            transition: background 0.2s;
        }
        .apply-btn:hover { background: #74c7ec; }
    </style>
    
    <div class="suggestion-box" id="suggestion-box">
        <div class="suggestion-header">
            <span>✨ Optimized Prompt</span>
            <button class="close-btn" id="close-btn">✖</button>
        </div>
        <div class="suggestion-text" id="suggestion-text">...</div>
        <button class="apply-btn" id="apply-btn">📋 Click to Auto-Paste</button>
    </div>

    <button class="promptizer-btn" id="optimize-btn">⚡ Promptize</button>
`;
shadowRoot.appendChild(container);

// 4. Element References
const btn = shadowRoot.getElementById('optimize-btn');
const suggestionBox = shadowRoot.getElementById('suggestion-box');
const suggestionText = shadowRoot.getElementById('suggestion-text');
const applyBtn = shadowRoot.getElementById('apply-btn');
const closeBtn = shadowRoot.getElementById('close-btn');

let currentOptimizedText = "";
let currentTargetInput = null;

// 5. Close Button Logic
closeBtn.addEventListener('click', () => {
    suggestionBox.style.display = 'none';
});

// 6. Main "Promptize" Logic
btn.addEventListener('click', () => {
    
    // Find the chat box (Gemini, Claude, or ChatGPT)
    currentTargetInput = document.querySelector('rich-textarea p, .ProseMirror, #prompt-textarea, div[contenteditable="true"], textarea');

    if (!currentTargetInput) {
        btn.innerText = "❌ Chat box not found";
        setTimeout(() => btn.innerText = "⚡ Promptize", 2000);
        return;
    }

    let rawText = currentTargetInput.value || currentTargetInput.innerText;

    if (!rawText.trim()) {
        btn.innerText = "❌ Type something first";
        setTimeout(() => btn.innerText = "⚡ Promptize", 2000);
        return;
    }

    btn.innerText = "⏳ Thinking...";

    // Send to background script -> Server
    chrome.runtime.sendMessage({
        action: "optimizePrompt",
        text: rawText,
        context: aiContext
    }, (response) => {
        btn.innerText = "⚡ Promptize"; // Reset button
        
        if (response && response.optimizedText && !response.optimizedText.includes("Error")) {
            // Show the suggestion box!
            currentOptimizedText = response.optimizedText;
            suggestionText.innerText = currentOptimizedText;
            suggestionBox.style.display = 'flex';
        } else {
            alert("Server Error: Make sure your local Node server is running!");
        }
    });
});

// 7. Auto-Paste Logic (The Magic Trick)
applyBtn.addEventListener('click', () => {
    if (currentTargetInput && currentOptimizedText) {
        
        // 1. Focus the exact text box we found earlier
        currentTargetInput.focus();
        
        // 2. Select whatever bad prompt is currently in there
        document.execCommand('selectAll', false, null);
        
        // 3. Mimic the user hitting Ctrl+V with the new perfect prompt.
        // This forces Gemini's React/Angular framework to realize the text changed!
        document.execCommand('insertText', false, currentOptimizedText);
        
        // 4. Hide the menu
        suggestionBox.style.display = 'none';
        
        // 5. Success feedback
        applyBtn.innerText = "✅ Pasted!";
        setTimeout(() => applyBtn.innerText = "📋 Click to Auto-Paste", 2000);
    }
});