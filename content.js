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
              <style>
                /* --- The Galaxy Button CSS --- */
                .galaxy-btn {
                  --btn-bg: #0c0c14;
                  --btn-text: #ffffff;
                  --btn-primary: #8553f4;
                  --btn-secondary: #3b82f6;
                  --btn-accent: #f43f5e;
                  --btn-font-size: 14px;

                  font-family: system-ui, -apple-system, sans-serif;
                  font-size: var(--btn-font-size);
                  padding: 0.8em 1.5em;
                  border-radius: 0.75em;
                  border: none;
                  background: var(--btn-bg);
                  position: relative;
                  cursor: pointer;
                  overflow: hidden;
                  z-index: 1;
                  transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                  box-shadow: 0 0.5em 1.5em -0.5em rgba(133, 83, 244, 0.4);
                  margin-top: 15px;
                  width: 100%;
                }

                .galaxy-btn:focus-visible { outline: 2px solid var(--btn-primary); outline-offset: 4px; }
                .galaxy-btn:active { transform: scale(0.96); }

                .galaxy-btn__content {
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 0.75em;
                  position: relative;
                  z-index: 2;
                  color: var(--btn-text);
                  font-weight: 600;
                  letter-spacing: 0.05em;
                  text-transform: uppercase;
                }

                .galaxy-btn__icon {
                  width: 1.25em;
                  height: 1.25em;
                  transition: transform 0.3s ease;
                  fill: var(--btn-text);
                }

                .galaxy-btn:hover .galaxy-btn__icon { transform: translateX(0.25em) rotate(-10deg); }

                .galaxy-btn::before {
                  content: "";
                  position: absolute;
                  inset: -4px;
                  z-index: 0;
                  background: conic-gradient(from 0deg, var(--btn-bg) 0deg, var(--btn-primary) 60deg, var(--btn-secondary) 120deg, var(--btn-bg) 180deg, var(--btn-accent) 240deg, var(--btn-primary) 300deg, var(--btn-bg) 360deg);
                  border-radius: 0.75em;
                  animation: rotate-nebula 4s linear infinite;
                  filter: blur(8px);
                  opacity: 0.7;
                  transition: opacity 0.3s ease;
                }

                .galaxy-btn:hover::before { opacity: 1; animation-duration: 2s; }

                .galaxy-btn::after {
                  content: "";
                  position: absolute;
                  inset: 2px;
                  background: var(--btn-bg);
                  border-radius: 0.6em;
                  z-index: 1;
                }

                .galaxy-btn__stars {
                  position: absolute;
                  inset: 0;
                  z-index: 1;
                  pointer-events: none;
                  background-image: radial-gradient(circle at 20% 30%, white 1px, transparent 1.5px), radial-gradient(circle at 80% 70%, white 1px, transparent 1.5px), radial-gradient(circle at 40% 80%, white 0.5px, transparent 1px);
                  background-size: 120% 120%;
                  opacity: 0.3;
                  transition: opacity 0.3s ease, background-position 0.3s ease;
                }

                .galaxy-btn:hover .galaxy-btn__stars {
                  opacity: 0.8;
                  animation: star-drift 5s linear infinite alternate;
                }

                @keyframes rotate-nebula { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes star-drift { 0% { transform: scale(1); } 100% { transform: scale(1.1) translate(-2%, -2%); } }
              </style>

              <div style="font-weight: bold; margin-bottom: 10px; color: #8553f4; display: flex; align-items: center; gap: 8px;">
                ✨ <span style="color: #fff;">Prompt Optimized</span>
              </div>
              
              <div class="promptizer-result-inner" style="background-color: #1a1a1a; color: #e4e4e4; padding: 15px; border-radius: 6px; border: 1px solid #333; max-height: 200px; overflow-y: auto; font-size: 14px; line-height: 1.5;">
                ${currentOptimizedText}
              </div>

              <button id="apply-btn" class="galaxy-btn">
                <span class="galaxy-btn__content">
                  <svg class="galaxy-btn__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12V1z"/>
                  </svg>
                  Insert Prompt
                </span>
                <div class="galaxy-btn__stars"></div>
              </button>
            `;

      // Re-bind apply button
      const newApplyBtn = shadowRoot.getElementById('apply-btn');
      if (newApplyBtn) {
        newApplyBtn.addEventListener('click', () => {
          if (currentTargetInput && currentOptimizedText) {
            currentTargetInput.focus();
            document.execCommand('selectAll', false, null);
            document.execCommand('insertText', false, currentOptimizedText);
            suggestionBox.style.display = 'none';
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
