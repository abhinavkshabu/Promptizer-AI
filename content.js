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

        /* --- THE LOADER CSS --- */
        .main-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 280px;
          height: 280px;
          background: transparent;
          overflow: hidden;
        }
        .loader { width: 100%; height: 100%; }
        #browser { overflow: hidden; }
        .grid-line { stroke: #222; stroke-width: 0.5; }
        .browser-frame { fill: #111; stroke: #666; stroke-width: 1; filter: drop-shadow(0 0 10px rgba(0, 0, 0, 0.9)); }
        .browser-top { fill: #1a1a1a; }
        .loading-text { font-family: sans-serif; font-size: 14px; fill: #e4e4e4; }
        .skeleton { fill: #2d2d2d; rx: 4; ry: 4; animation: pulse 1.8s ease-in-out infinite; filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.02)); }

        @keyframes pulse {
          0% { fill: #2d2d2d; opacity: 1; }
          50% { fill: #505050; opacity: 0.6; }
          100% { fill: #2d2d2d; opacity: 1; }
        }

        .trace-flow {
          stroke-width: 1; fill: none; stroke-dasharray: 120 600; stroke-dashoffset: 720;
          animation: flow 5s linear infinite; opacity: 0.95; stroke-linejoin: round;
          filter: drop-shadow(0 0 8px currentColor) blur(0.5px); color: #00ccff;
        }
        .trace-flow:nth-child(1) { stroke: url(#traceGradient1); }
        .trace-flow:nth-child(2) { stroke: url(#traceGradient2); }
        .trace-flow:nth-child(3) { stroke: url(#traceGradient3); }
        .trace-flow:nth-child(4) { stroke: url(#traceGradient4); }

        @keyframes flow {
          from { stroke-dashoffset: 720; }
          to { stroke-dashoffset: 0; }
        }

        /* --- THE TEXT LOADER & RESULT CARD CSS --- */
        .skeleton-text-container {
          margin-top: -30px;
          font-family: monospace;
          color: #00ccff;
          font-size: 14px;
          animation: pulse 1.8s ease-in-out infinite;
        }

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

    // Show the animated SVG loader
    suggestionBox.style.display = 'flex';
    suggestionBox.innerHTML = `
      <div class="suggestion-header">
        <span>✨ Optimizing...</span>
        <button class="close-btn" id="close-btn-loading">✖</button>
      </div>
      <div class="main-container">
        <div class="loader">
          <svg viewBox="0 0 900 900" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <defs>
              <linearGradient id="traceGradient1" x1="250" y1="120" x2="100" y2="200" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#00ccff" stop-opacity="1"></stop><stop offset="100%" stop-color="#00ccff" stop-opacity="0.5"></stop></linearGradient>
              <linearGradient id="traceGradient2" x1="650" y1="120" x2="800" y2="300" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#00ccff" stop-opacity="1"></stop><stop offset="100%" stop-color="#00ccff" stop-opacity="0.5"></stop></linearGradient>
              <linearGradient id="traceGradient3" x1="250" y1="380" x2="400" y2="400" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#00ccff" stop-opacity="1"></stop><stop offset="100%" stop-color="#00ccff" stop-opacity="0.5"></stop></linearGradient>
              <linearGradient id="traceGradient4" x1="650" y1="120" x2="500" y2="100" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#00ccff" stop-opacity="1"></stop><stop offset="100%" stop-color="#00ccff" stop-opacity="0.5"></stop></linearGradient>
            </defs>
            <g id="grid">
              <line x1="0" y1="0" x2="0" y2="100%" class="grid-line"></line><line x1="100" y1="0" x2="100" y2="100%" class="grid-line"></line><line x1="200" y1="0" x2="200" y2="100%" class="grid-line"></line><line x1="300" y1="0" x2="300" y2="100%" class="grid-line"></line><line x1="400" y1="0" x2="400" y2="100%" class="grid-line"></line><line x1="500" y1="0" x2="500" y2="100%" class="grid-line"></line><line x1="600" y1="0" x2="600" y2="100%" class="grid-line"></line><line x1="700" y1="0" x2="700" y2="100%" class="grid-line"></line><line x1="800" y1="0" x2="800" y2="100%" class="grid-line"></line><line x1="900" y1="0" x2="900" y2="100%" class="grid-line"></line>
              <line x1="0" y1="100" x2="100%" y2="100" class="grid-line"></line><line x1="0" y1="200" x2="100%" y2="200" class="grid-line"></line><line x1="0" y1="300" x2="100%" y2="300" class="grid-line"></line><line x1="0" y1="400" x2="100%" y2="400" class="grid-line"></line><line x1="0" y1="500" x2="100%" y2="500" class="grid-line"></line><line x1="0" y1="600" x2="100%" y2="600" class="grid-line"></line><line x1="0" y1="700" x2="100%" y2="700" class="grid-line"></line><line x1="0" y1="800" x2="100%" y2="800" class="grid-line"></line>
            </g>
            <g id="browser" transform="translate(0, 200)">
              <rect x="250" y="120" width="400" height="260" rx="8" ry="8" class="browser-frame"></rect>
              <rect x="250" y="120" width="400" height="30" rx="8" ry="8" class="browser-top"></rect>
              <text x="294" y="140" text-anchor="middle" class="loading-text">Loading...</text>
              <rect x="270" y="160" width="360" height="20" class="skeleton"></rect>
              <rect x="270" y="190" width="200" height="15" class="skeleton"></rect>
              <rect x="270" y="215" width="300" height="15" class="skeleton"></rect>
              <rect x="270" y="240" width="360" height="90" class="skeleton"></rect>
              <rect x="270" y="340" width="180" height="20" class="skeleton"></rect>
            </g>
            <g id="traces" transform="translate(0, 200)">
              <path d="M100 300 H250 V120" class="trace-flow"></path><path d="M800 200 H650 V380" class="trace-flow"></path><path d="M400 520 V380 H250" class="trace-flow"></path><path d="M500 50 V120 H650" class="trace-flow"></path>
            </g>
          </svg>
        </div>
        <div class="skeleton-text-container">AI is thinking harder...</div>
      </div>
    `;

    // Close button for loader
    const closeBtnLoading = shadowRoot.getElementById('close-btn-loading');
    if (closeBtnLoading) {
        closeBtnLoading.addEventListener('click', () => {
            suggestionBox.style.display = 'none';
            btn.innerText = "⚡ Promptize";
        });
    }

    // Send to background script -> Server
    chrome.runtime.sendMessage({
        action: "optimizePrompt",
        text: rawText,
        context: aiContext
    }, (response) => {
        btn.innerText = "⚡ Promptize"; // Reset button

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
