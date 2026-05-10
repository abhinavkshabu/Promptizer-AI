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

// 3. Create the suggestion box (hidden until triggered)
const container = document.createElement('div');
container.innerHTML = `
    <style>
        .suggestion-box {
            position: fixed;
            bottom: 90px;
            right: 30px;
            width: 360px;
            background: #0d0d14;
            border: 1px solid #2a2a3e;
            border-radius: 12px;
            padding: 0;
            box-shadow: 0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(133,83,244,0.1);
            display: none;
            flex-direction: column;
            z-index: 2147483647;
            font-family: system-ui, -apple-system, sans-serif;
            overflow: hidden;
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
`;
shadowRoot.appendChild(container);

// 4. Element References
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

// ─────────────────────────────────────────────────────
// 6. INJECT "P" BUTTON INSIDE EACH AI'S CHATBOX
// ─────────────────────────────────────────────────────

// Platform-specific selectors for the chat input container areas
function getChatboxContainerSelector() {
  if (aiContext === "ChatGPT") {
    // ChatGPT: the form that wraps the input area
    return 'form.w-full, main form, div[class*="composer"] form, form[data-testid], div.relative.flex';
  } else if (aiContext === "Google Gemini") {
    // Gemini: the rich text area container
    return '.input-area-container, .text-input-field, div[class*="input-area"], .ql-editor-container, rich-textarea';
  } else if (aiContext === "Claude") {
    // Claude: the input wrapper
    return 'div[class*="ProseMirror"], fieldset, div.flex.flex-col, div[class*="composer"]';
  }
  return 'form, div[contenteditable="true"]';
}

// Attempt to find the actual text input element
function findChatInput() {
  // Try common selectors in priority order
  const selectors = [
    'rich-textarea .ql-editor',       // Gemini
    'rich-textarea p',                  // Gemini fallback
    'div.ProseMirror',                  // Claude
    '.ProseMirror',                     // Claude fallback
    '#prompt-textarea',                 // ChatGPT
    'div[contenteditable="true"]',      // Generic
    'textarea'                          // Fallback
  ];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) return el;
  }
  return null;
}

// Find or create the closest positioning parent near the chatbox
function findInsertionTarget() {
  // Try to find the input area wrapper we can append a button to
  if (aiContext === "ChatGPT") {
    // ChatGPT: find the toolbar/button area near the input
    const form = document.querySelector('form') || document.querySelector('div[class*="stretch"]');
    if (form) return form;
  } else if (aiContext === "Google Gemini") {
    const container = document.querySelector('.input-area-container') ||
                      document.querySelector('.text-input-field_textarea-wrapper') ||
                      document.querySelector('rich-textarea')?.parentElement?.parentElement;
    if (container) return container;
  } else if (aiContext === "Claude") {
    const fieldset = document.querySelector('fieldset') ||
                     document.querySelector('div[class*="ProseMirror"]')?.parentElement;
    if (fieldset) return fieldset;
  }
  return null;
}

let pButtonInjected = false;

function createPButton() {
  const pBtn = document.createElement('div');
  pBtn.id = 'promptizer-p-trigger';
  pBtn.title = 'Promptize your text';
  pBtn.innerHTML = 'P';
  
  // Inline styles to survive any page CSS reset
  Object.assign(pBtn.style, {
    width: '28px',
    height: '28px',
    minWidth: '28px',
    minHeight: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #8553f4, #3b82f6)',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontWeight: '800',
    fontSize: '14px',
    boxShadow: '0 2px 8px rgba(133, 83, 244, 0.4)',
    transition: 'all 0.2s ease',
    zIndex: '2147483647',
    position: 'relative',
    flexShrink: '0',
    userSelect: 'none',
    lineHeight: '1',
    letterSpacing: '0'
  });

  // Hover effects
  pBtn.addEventListener('mouseenter', () => {
    pBtn.style.transform = 'scale(1.1)';
    pBtn.style.boxShadow = '0 4px 16px rgba(133, 83, 244, 0.6)';
  });
  pBtn.addEventListener('mouseleave', () => {
    pBtn.style.transform = 'scale(1)';
    pBtn.style.boxShadow = '0 2px 8px rgba(133, 83, 244, 0.4)';
  });

  // Click handler — main Promptize logic
  pBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handlePromptize(pBtn);
  });

  return pBtn;
}

// Strategy: inject the P button inside/near the chatbox input area
function injectPButton() {
  if (pButtonInjected && document.getElementById('promptizer-p-trigger')) return;
  
  pButtonInjected = false; // reset if element was removed by SPA navigation
  
  const pBtn = createPButton();

  if (aiContext === "ChatGPT") {
    // ChatGPT: Insert near the send button area
    // The send button is typically inside the form, in a flex row at the bottom
    const sendBtnContainer = document.querySelector('button[data-testid="send-button"]')?.parentElement ||
                              document.querySelector('form button[aria-label="Send prompt"]')?.parentElement ||
                              document.querySelector('form div.flex.items-end') ||
                              document.querySelector('form div.flex');
    if (sendBtnContainer) {
      // Insert before the send button
      const sendBtn = sendBtnContainer.querySelector('button[data-testid="send-button"]') ||
                      sendBtnContainer.querySelector('button[aria-label="Send prompt"]');
      if (sendBtn) {
        sendBtnContainer.insertBefore(pBtn, sendBtn);
      } else {
        sendBtnContainer.appendChild(pBtn);
      }
      pBtn.style.marginRight = '4px';
      pButtonInjected = true;
      return;
    }
    // Fallback: try to find any button row in the form
    const form = document.querySelector('form');
    if (form) {
      const bottomRow = form.querySelector('div:last-child') || form;
      bottomRow.appendChild(pBtn);
      pBtn.style.marginLeft = '4px';
      pButtonInjected = true;
      return;
    }
  } else if (aiContext === "Google Gemini") {
    // Gemini: Insert near the send/submit button area
    const sendBtn = document.querySelector('button.send-button') ||
                    document.querySelector('button[aria-label="Send message"]') ||
                    document.querySelector('.send-button-container button') ||
                    document.querySelector('button[mattooltip="Send"]');
    if (sendBtn && sendBtn.parentElement) {
      sendBtn.parentElement.insertBefore(pBtn, sendBtn);
      pBtn.style.marginRight = '6px';
      pButtonInjected = true;
      return;
    }
    // Fallback: find the input area's parent
    const inputArea = document.querySelector('.input-area-container') ||
                      document.querySelector('rich-textarea')?.closest('.input-area');
    if (inputArea) {
      inputArea.style.position = 'relative';
      pBtn.style.position = 'absolute';
      pBtn.style.right = '50px';
      pBtn.style.bottom = '8px';
      inputArea.appendChild(pBtn);
      pButtonInjected = true;
      return;
    }
  } else if (aiContext === "Claude") {
    // Claude: Insert near the send button
    const sendBtn = document.querySelector('button[aria-label="Send Message"]') ||
                    document.querySelector('button[aria-label="Send message"]') ||
                    document.querySelector('fieldset button:last-of-type') ||
                    document.querySelector('button[class*="send"]');
    if (sendBtn && sendBtn.parentElement) {
      sendBtn.parentElement.insertBefore(pBtn, sendBtn);
      pBtn.style.marginRight = '4px';
      pButtonInjected = true;
      return;
    }
    // Fallback: insert near the editable area
    const proseMirror = document.querySelector('.ProseMirror');
    if (proseMirror && proseMirror.parentElement) {
      proseMirror.parentElement.style.position = 'relative';
      pBtn.style.position = 'absolute';
      pBtn.style.right = '8px';
      pBtn.style.bottom = '8px';
      proseMirror.parentElement.appendChild(pBtn);
      pButtonInjected = true;
      return;
    }
  }
  
  // Ultimate fallback: fixed position near bottom-right as last resort
  if (!pButtonInjected) {
    pBtn.style.position = 'fixed';
    pBtn.style.bottom = '24px';
    pBtn.style.right = '80px';
    pBtn.style.width = '36px';
    pBtn.style.height = '36px';
    pBtn.style.fontSize = '16px';
    pBtn.style.borderRadius = '10px';
    pBtn.style.boxShadow = '0 4px 20px rgba(133, 83, 244, 0.5)';
    document.body.appendChild(pBtn);
    pButtonInjected = true;
  }
}

// ─────────────────────────────────────────────────────
// 7. MAIN "PROMPTIZE" LOGIC (triggered by P button)
// ─────────────────────────────────────────────────────

function handlePromptize(triggerBtn) {
  // Find the chat box
  currentTargetInput = findChatInput();

  if (!currentTargetInput) {
    showToast("❌ Chat box not found");
    return;
  }

  let rawText = currentTargetInput.value || currentTargetInput.innerText;

  if (!rawText.trim()) {
    showToast("❌ Type something first");
    return;
  }

  // Show loading state on the P button
  triggerBtn.innerHTML = '⏳';
  triggerBtn.style.background = '#1a1a1a';
  triggerBtn.style.boxShadow = 'none';
  triggerBtn.style.fontSize = '12px';

  // Show the skeleton loader in the suggestion box
  suggestionBox.style.display = 'flex';
  suggestionBox.style.backgroundColor = '#0d0d14';
  suggestionBox.style.border = '1px solid #2a2a3e';
  suggestionBox.style.borderRadius = '12px';
  suggestionBox.style.boxShadow = '0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(133,83,244,0.1)';
  suggestionBox.style.padding = '0';

  suggestionBox.innerHTML = `
      <style>
        @keyframes pulse {
          0% { background-color: #1a1a2e; opacity: 1; }
          50% { background-color: #2a2a4e; opacity: 0.6; }
          100% { background-color: #1a1a2e; opacity: 1; }
        }
        .skeleton-bar {
          border-radius: 4px;
          animation: pulse 1.8s ease-in-out infinite;
        }
      </style>

      <div style="background-color: #111119; padding: 12px 16px; border-top-left-radius: 12px; border-top-right-radius: 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #2a2a3e;">
        <span style="color: #8553f4; font-family: system-ui, sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.5px;">Processing...</span>
        <span id="close-btn-loading" style="color: #6c7086; cursor: pointer; font-family: sans-serif; font-size: 16px;">✖</span>
      </div>

      <div style="padding: 24px; display: flex; flex-direction: column; gap: 16px; background-color: #0d0d14; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;">
        
        <div class="skeleton-bar" style="width: 100%; height: 18px;"></div>
        <div class="skeleton-bar" style="width: 60%; height: 14px;"></div>
        <div class="skeleton-bar" style="width: 85%; height: 14px;"></div>
        <div class="skeleton-bar" style="width: 100%; height: 90px; margin-top: 8px;"></div>
        
        <div style="margin-top: 20px; text-align: center; font-family: system-ui, sans-serif; color: #6c7086; font-size: 14px; animation: pulse 1.8s ease-in-out infinite; background-color: transparent !important;">
          AI is thinking harder...
        </div>
      </div>
    `;

  // Close button for loader
  const closeBtnLoading = shadowRoot.getElementById('close-btn-loading');
  if (closeBtnLoading) {
    closeBtnLoading.addEventListener('click', () => {
      suggestionBox.style.display = 'none';
      resetPButton(triggerBtn);
    });
  }

  // Send to background script -> Server
  chrome.runtime.sendMessage({
    action: "optimizePrompt",
    text: rawText,
    context: aiContext
  }, (response) => {
    resetPButton(triggerBtn);

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

              <div style="padding: 16px;">
                <div style="font-weight: bold; margin-bottom: 10px; color: #8553f4; display: flex; align-items: center; gap: 8px;">
                  ✨ <span style="color: #fff;">Prompt Optimized</span>
                </div>
                
                <div class="promptizer-result-inner" style="background-color: #1a1a2e; color: #e4e4e4; padding: 15px; border-radius: 8px; border: 1px solid #2a2a3e; max-height: 200px; overflow-y: auto; font-size: 14px; line-height: 1.6;">
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
              </div>
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
              <div style="padding: 16px;">
                <div class="promptizer-result-card" style="background: #0d0d14; border: 1px solid #2a2a3e;">
                  <div style="color: #f38ba8; font-weight: bold;">❌ Server Error</div>
                  <div class="promptizer-result-inner" style="color: #f38ba8; background: #1a1a2e;">${response?.optimizedText || 'Make sure your server is running!'}</div>
                  <button class="close-btn" id="close-btn-error" style="margin-top: 10px; color: #f38ba8;">Close</button>
                </div>
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
}

function resetPButton(btn) {
  btn.innerHTML = 'P';
  btn.style.background = 'linear-gradient(135deg, #8553f4, #3b82f6)';
  btn.style.boxShadow = '0 2px 8px rgba(133, 83, 244, 0.4)';
  btn.style.fontSize = '14px';
}

// Simple toast notification
function showToast(message) {
  const existing = shadowRoot.getElementById('promptizer-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'promptizer-toast';
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '80px',
    right: '30px',
    background: '#1a1a2e',
    color: '#e4e4e4',
    padding: '10px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontFamily: 'system-ui, sans-serif',
    border: '1px solid #2a2a3e',
    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
    zIndex: '2147483647',
    transition: 'opacity 0.3s',
    opacity: '1'
  });
  toast.textContent = message;
  shadowRoot.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// ─────────────────────────────────────────────────────
// 8. OBSERVER: Watch for DOM changes and re-inject P button
// ─────────────────────────────────────────────────────

// Use MutationObserver to handle SPA navigation and dynamic DOM
function startObserver() {
  // Initial attempt
  injectPButton();

  // Re-try periodically (SPAs like ChatGPT rebuild their DOM)
  const retryInterval = setInterval(() => {
    const existing = document.getElementById('promptizer-p-trigger');
    if (!existing) {
      pButtonInjected = false;
      injectPButton();
    }
  }, 2000);

  // Also observe DOM mutations
  const observer = new MutationObserver(() => {
    const existing = document.getElementById('promptizer-p-trigger');
    if (!existing) {
      pButtonInjected = false;
      injectPButton();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Wait for page to be ready, then start
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(startObserver, 1500);
  });
} else {
  setTimeout(startObserver, 1500);
}

// 9. Auto-Paste Logic is now handled dynamically inside the result card above.