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


        .promptizer-result-card {
          background-color: #111;
          border: 1px solid #666;
          border-radius: 8px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.9);
          color: #e4e4e4;
          padding: 15px;
          font-family: sans-serif;
        }
        .promptizer-result-inner {
          background-color: #2d2d2d;
          border-radius: 4px;
          padding: 12px;
          margin-top: 10px;
          font-size: 13px;
          line-height: 1.5;
          max-height: 200px;
          overflow-y: auto;
        }
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
    btn.style.background = '#1a1a1a';
    btn.style.color = '#888888';
    btn.style.boxShadow = 'none';

    // 1. Force the main popup container to become the black box
    suggestionBox.style.display = 'flex';
    suggestionBox.style.backgroundColor = '#111111';
    suggestionBox.style.border = '1px solid #333333';
    suggestionBox.style.borderRadius = '8px';
    suggestionBox.style.boxShadow = '0 10px 30px rgba(0,0,0,0.9)';
    suggestionBox.style.padding = '0';

    // 2. The new HTML (pure HTML skeleton loader, no SVG)
    suggestionBox.innerHTML = `
      <style>
        @keyframes pulse {
          0% { background-color: #2d2d2d; opacity: 1; }
          50% { background-color: #444444; opacity: 0.6; }
          100% { background-color: #2d2d2d; opacity: 1; }
        }
        .skeleton-bar {
          border-radius: 4px;
          animation: pulse 1.8s ease-in-out infinite;
        }
      </style>

      <div style="background-color: #1a1a1a; padding: 12px 16px; border-top-left-radius: 8px; border-top-right-radius: 8px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333;">
        <span style="color: #888888; font-family: monospace; font-size: 13px; letter-spacing: 1px;">Processing...</span>
        <span id="close-btn-loading" style="color: #666666; cursor: pointer; font-family: sans-serif; font-size: 16px;">✖</span>
      </div>

      <div style="padding: 24px; display: flex; flex-direction: column; gap: 16px; background-color: #111111; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
        
        <div class="skeleton-bar" style="width: 100%; height: 18px;"></div>
        <div class="skeleton-bar" style="width: 60%; height: 14px;"></div>
        <div class="skeleton-bar" style="width: 85%; height: 14px;"></div>
        <div class="skeleton-bar" style="width: 100%; height: 90px; margin-top: 8px;"></div>
        
        <div style="margin-top: 20px; text-align: center; font-family: monospace; color: #888888; font-size: 15px; animation: pulse 1.8s ease-in-out infinite; background-color: transparent !important;">
          AI is thinking harder...
        </div>
      </div>
    `;

    // Close button for loader
    const closeBtnLoading = shadowRoot.getElementById('close-btn-loading');
    if (closeBtnLoading) {
        closeBtnLoading.addEventListener('click', () => {
            suggestionBox.style.display = 'none';
            btn.innerText = "⚡ Promptize";
            btn.style.background = 'linear-gradient(135deg, #00ff7f, #00bfff)';
            btn.style.color = '#000';
            btn.style.boxShadow = '0 0 15px rgba(0, 255, 127, 0.4)';
        });
    }

    // Send to background script -> Server
    chrome.runtime.sendMessage({
        action: "optimizePrompt",
        text: rawText,
        context: aiContext
    }, (response) => {
        btn.innerText = "⚡ Promptize"; // Reset button
        btn.style.background = 'linear-gradient(135deg, #00ff7f, #00bfff)';
        btn.style.color = '#000';
        btn.style.boxShadow = '0 0 15px rgba(0, 255, 127, 0.4)';

        if (response && response.optimizedText && !response.optimizedText.includes("Error")) {
            currentOptimizedText = response.optimizedText;

            // Replace loader with the styled result card
            suggestionBox.innerHTML = `
              <div class="promptizer-result-card">
                <div class="suggestion-header">
                  <span style="color: #00ccff; font-weight: bold;">⚡ Prompt Optimized</span>
                  <button class="close-btn" id="close-btn-result">✖</button>
                </div>
                <div class="promptizer-result-inner">${currentOptimizedText}</div>
                <button class="apply-btn" id="apply-btn" style="margin-top: 10px;">📋 Insert Prompt</button>
              </div>
            `;

            // Re-bind close button
            const closeBtnResult = shadowRoot.getElementById('close-btn-result');
            if (closeBtnResult) {
                closeBtnResult.addEventListener('click', () => {
                    suggestionBox.style.display = 'none';
                });
            }

            // Re-bind apply button
            const newApplyBtn = shadowRoot.getElementById('apply-btn');
            if (newApplyBtn) {
                newApplyBtn.addEventListener('click', () => {
                    if (currentTargetInput && currentOptimizedText) {
                        currentTargetInput.focus();
                        document.execCommand('selectAll', false, null);
                        document.execCommand('insertText', false, currentOptimizedText);
                        suggestionBox.style.display = 'none';
                        newApplyBtn.innerText = "✅ Pasted!";
                        setTimeout(() => newApplyBtn.innerText = "📋 Insert Prompt", 2000);
                    }
                });
            }
        } else {
            suggestionBox.innerHTML = `
              <div class="promptizer-result-card">
                <div style="color: #f38ba8; font-weight: bold;">❌ Server Error</div>
                <div class="promptizer-result-inner" style="color: #f38ba8;">Make sure your local Node server is running!</div>
                <button class="close-btn" id="close-btn-error" style="margin-top: 10px; color: #f38ba8;">Close</button>
              </div>
            `;
            const closeBtnError = shadowRoot.getElementById('close-btn-error');
            if (closeBtnError) {
                closeBtnError.addEventListener('click', () => {
                    suggestionBox.style.display = 'none';
                });
            }
        }
    });
});

// 7. Auto-Paste Logic is now handled dynamically inside the result card above.
