// 1. Identify Context
const currentHostname = window.location.hostname;
let aiContext = 'General AI';
if (currentHostname.includes('chatgpt')) aiContext = 'ChatGPT';
else if (currentHostname.includes('gemini')) aiContext = 'Google Gemini';
else if (currentHostname.includes('claude')) aiContext = 'Claude';

// 2. Setup Shadow DOM for CSS isolation
const hostElement = document.createElement('div');
hostElement.id = 'promptizer-host';
document.body.appendChild(hostElement);
const shadowRoot = hostElement.attachShadow({ mode: 'open' });

const logoUrl = chrome.runtime.getURL('icons/icon48.png');

// 3. Create the extension overlay UI
const container = document.createElement('div');
container.innerHTML = `
    <style>
        :host {
            all: initial;
        }

        * {
            box-sizing: border-box;
        }

        .promptizer-trigger,
        .promptizer-panel,
        .promptizer-toast {
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            letter-spacing: 0;
        }

        .promptizer-trigger {
            position: fixed;
            top: 0;
            left: 0;
            z-index: 2147483647;
            display: inline-flex;
            min-width: 40px;
            height: 38px;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 6px 14px 6px 10px;
            border: 1px solid rgba(44, 47, 54, 0.52);
            border-radius: 20px;
            background-color: #1d1d1d;
            color: #f8f8f8;
            box-shadow: inset 0 0 50px 0 rgba(255, 255, 255, 0.02), 0 10px 24px rgba(0, 0, 0, 0.4);
            background-image: 
                radial-gradient(120% 100% at 50% 120%, rgba(255, 255, 255, 0.05) 0%, transparent 50%),
                linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.08) 25%, rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 0.08) 75%, rgba(255, 255, 255, 0) 100%);
            background-size: 200% 100%, 200% 100%;
            animation: liquid-metal-bg 3s linear infinite;
            cursor: pointer;
            opacity: 0;
            pointer-events: none;
            transform: translate3d(var(--trigger-x, -9999px), var(--trigger-y, -9999px), 0) scale(0.98);
            transform-origin: center;
            transition: opacity 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
            user-select: none;
            overflow: hidden;
        }

        .promptizer-trigger::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: inherit;
            box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
            pointer-events: none;
            z-index: 1;
        }

        .promptizer-trigger.is-visible {
            opacity: 1;
            pointer-events: auto;
            transform: translate3d(var(--trigger-x, -9999px), var(--trigger-y, -9999px), 0) scale(1);
        }

        .promptizer-trigger:hover {
            background-color: rgba(45, 45, 45, 1);
            border-color: rgba(255, 255, 255, 0.2);
            box-shadow: inset 0 0 50px 0 rgba(255, 255, 255, 0.05), 0 14px 30px rgba(0, 0, 0, 0.5);
            transform: translate3d(var(--trigger-x, -9999px), var(--trigger-y, -9999px), 0) scale(1.02);
        }

        .promptizer-trigger:focus-visible {
            outline: 2px solid rgba(255, 255, 255, 0.3);
            outline-offset: 2px;
        }

        .trigger-logo {
            width: 20px;
            height: 20px;
            flex: 0 0 auto;
            object-fit: contain;
            pointer-events: none;
            position: relative;
            z-index: 2;
        }

        .trigger-label {
            color: #f8f8f8;
            font-size: 13px;
            font-weight: 600;
            line-height: 1.25;
            letter-spacing: normal;
            pointer-events: none;
            white-space: nowrap;
            position: relative;
            z-index: 2;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
        }

        .trigger-spinner {
            display: none;
            width: 17px;
            height: 17px;
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-top-color: #f8f8f8;
            border-radius: 50%;
            animation: promptizer-spin 0.8s linear infinite;
            position: relative;
            z-index: 2;
        }

        .promptizer-trigger.is-loading .trigger-logo,
        .promptizer-trigger.is-loading .trigger-label {
            display: none;
        }

        .promptizer-trigger.is-loading .trigger-spinner {
            display: block;
        }

        @keyframes promptizer-spin {
            to {
                transform: rotate(360deg);
            }
        }

        @keyframes liquid-metal-bg {
            0% { background-position: 0% 0%, 0% 0%; }
            100% { background-position: 0% 0%, -200% 0%; }
        }

        .promptizer-panel {
            position: fixed;
            top: 0;
            left: 0;
            z-index: 2147483647;
            display: none;
            width: var(--panel-width, 400px);
            max-width: calc(100vw - 24px);
            max-height: min(560px, calc(100vh - 24px));
            overflow: hidden;
            border: 1px solid rgba(32, 35, 31, 0.14);
            border-radius: 10px;
            background: #fffaf0;
            color: #20231f;
            box-shadow: 0 28px 70px rgba(32, 35, 31, 0.28);
            transform: translate3d(var(--panel-x, 24px), var(--panel-y, 24px), 0);
        }

        .promptizer-panel.is-open {
            display: block;
        }

        .panel-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 13px 14px 12px;
            border-bottom: 1px solid #ded4c2;
            background: #1f211d;
            color: #fff8eb;
        }

        .panel-brand {
            display: flex;
            min-width: 0;
            align-items: center;
            gap: 9px;
        }

        .panel-brand img {
            width: 25px;
            height: 25px;
            flex: 0 0 auto;
            object-fit: contain;
        }

        .panel-title {
            display: block;
            overflow: hidden;
            font-size: 13px;
            font-weight: 850;
            line-height: 1.2;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .panel-subtitle {
            display: block;
            margin-top: 2px;
            overflow: hidden;
            color: #cabfa7;
            font-size: 11px;
            font-weight: 600;
            line-height: 1.2;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .icon-btn {
            display: inline-grid;
            width: 30px;
            height: 30px;
            flex: 0 0 auto;
            place-items: center;
            border: 0;
            border-radius: 8px;
            background: transparent;
            color: #fff8eb;
            cursor: pointer;
            transition: background 0.16s ease, color 0.16s ease;
        }

        .icon-btn:hover {
            background: rgba(255, 250, 240, 0.1);
            color: #ffffff;
        }

        .icon-btn:focus-visible,
        .secondary-btn:focus-visible,
        .primary-btn:focus-visible {
            outline: 3px solid rgba(15, 118, 110, 0.26);
            outline-offset: 2px;
        }

        .icon {
            width: 17px;
            height: 17px;
            fill: none;
            stroke: currentColor;
            stroke-linecap: round;
            stroke-linejoin: round;
            stroke-width: 2;
        }

        .panel-body {
            display: grid;
            gap: 12px;
            padding: 14px;
            background: #fffaf0;
        }

        .prompt-card {
            max-height: min(260px, 42vh);
            overflow: auto;
            border: 1px solid #ded4c2;
            border-radius: 8px;
            background: #fffdf8;
            color: #20231f;
            font-size: 13px;
            font-weight: 500;
            line-height: 1.55;
            white-space: pre-wrap;
        }

        .prompt-card pre {
            margin: 0;
            padding: 13px;
            color: inherit;
            font: inherit;
            white-space: pre-wrap;
        }

        .panel-actions {
            display: grid;
            grid-template-columns: 1fr 1.35fr;
            gap: 9px;
        }

        .secondary-btn,
        .primary-btn {
            display: inline-flex;
            min-height: 40px;
            align-items: center;
            justify-content: center;
            gap: 8px;
            border-radius: 8px;
            cursor: pointer;
            font: inherit;
            font-size: 12px;
            font-weight: 850;
            line-height: 1;
            transition: transform 0.16s ease, background 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;
        }

        .secondary-btn {
            border: 1px solid #cfc5b1;
            background: #fffdf8;
            color: #20231f;
        }

        .secondary-btn:hover {
            border-color: #b7aa91;
            background: #fff7e7;
        }

        .primary-btn {
            border: 1px solid #0f766e;
            background: #0f766e;
            color: #f5fffb;
            box-shadow: 0 10px 20px rgba(15, 118, 110, 0.18);
        }

        .primary-btn:hover {
            background: #0b625c;
            box-shadow: 0 12px 24px rgba(15, 118, 110, 0.24);
        }

        .secondary-btn:active,
        .primary-btn:active {
            transform: translateY(1px);
        }

        .loading-lines {
            display: grid;
            gap: 10px;
            padding: 2px 0;
        }

        .loading-line {
            height: 12px;
            border-radius: 999px;
            background: linear-gradient(90deg, #eee3d0 0%, #fffdf8 42%, #eee3d0 80%);
            background-size: 240% 100%;
            animation: promptizer-shimmer 1.15s ease-in-out infinite;
        }

        .loading-line:nth-child(1) {
            width: 100%;
        }

        .loading-line:nth-child(2) {
            width: 76%;
        }

        .loading-line:nth-child(3) {
            width: 92%;
        }

        .loading-block {
            height: 92px;
            margin-top: 2px;
            border-radius: 8px;
            background: linear-gradient(90deg, #eee3d0 0%, #fffdf8 42%, #eee3d0 80%);
            background-size: 240% 100%;
            animation: promptizer-shimmer 1.15s ease-in-out infinite;
        }

        @keyframes promptizer-shimmer {
            0% {
                background-position: 120% 0;
            }
            100% {
                background-position: -120% 0;
            }
        }

        .error-card {
            display: grid;
            gap: 10px;
            border: 1px solid #f1b7ad;
            border-radius: 8px;
            background: #fff5f2;
            padding: 12px;
            color: #84251c;
            font-size: 13px;
            line-height: 1.45;
        }

        .error-title {
            font-size: 13px;
            font-weight: 850;
            line-height: 1.2;
        }

        .promptizer-toast {
            position: fixed;
            right: 18px;
            bottom: 18px;
            z-index: 2147483647;
            max-width: min(320px, calc(100vw - 36px));
            padding: 10px 12px;
            border: 1px solid rgba(32, 35, 31, 0.14);
            border-radius: 8px;
            background: #1f211d;
            color: #fff8eb;
            box-shadow: 0 14px 36px rgba(32, 35, 31, 0.24);
            font-size: 12px;
            font-weight: 700;
            line-height: 1.35;
            opacity: 0;
            pointer-events: none;
            transform: translateY(8px);
            transition: opacity 0.18s ease, transform 0.18s ease;
        }

        .promptizer-toast.is-visible {
            opacity: 1;
            transform: translateY(0);
        }

        @media (max-width: 520px) {
            .trigger-label {
                display: none;
            }

            .promptizer-trigger {
                padding: 7px;
            }

            .panel-actions {
                grid-template-columns: 1fr;
            }
        }
    </style>

    <button class="promptizer-trigger" id="promptizer-trigger" type="button" data-action="promptize" aria-label="Improve prompt with Promptizer">
        <img class="trigger-logo" src="${logoUrl}" alt="">
        <span class="trigger-label">Promptize</span>
        <span class="trigger-spinner" aria-hidden="true"></span>
    </button>

    <section class="promptizer-panel" id="promptizer-panel" aria-live="polite"></section>
    <div class="promptizer-toast" id="promptizer-toast" role="status"></div>
`;
shadowRoot.appendChild(container);

// 4. Element References
const promptizerTrigger = shadowRoot.getElementById('promptizer-trigger');
const suggestionBox = shadowRoot.getElementById('promptizer-panel');
const toast = shadowRoot.getElementById('promptizer-toast');

let currentOptimizedText = '';
let currentTargetInput = null;
let trackingInterval = null;
let toastTimer = null;

// 5. Find the active chat input
function findChatInput() {
  const selectors = [
    'rich-textarea .ql-editor',
    'rich-textarea p',
    'div.ProseMirror',
    '#prompt-textarea',
    'div[contenteditable="true"]',
    'textarea'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.offsetHeight > 0 && element.offsetWidth > 0) {
      return element;
    }
  }

  return null;
}

function getInputText(element) {
  if (!element) return '';
  if (typeof element.value === 'string') return element.value;
  return element.innerText || element.textContent || '';
}

function dispatchInputEvent(element, text) {
  try {
    element.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      data: text,
      inputType: 'insertText'
    }));
  } catch (error) {
    element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
  }
}

function replaceInputText(element, text) {
  if (!element) return;

  element.focus();

  if (typeof element.value === 'string') {
    element.value = text;
    dispatchInputEvent(element, text);
    return;
  }

  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(element);
  selection.removeAllRanges();
  selection.addRange(range);

  document.execCommand('insertText', false, text);
  dispatchInputEvent(element, text);
}

function clamp(value, min, max) {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

function updatePromptizerPosition() {
  const chatInput = findChatInput();
  const hasText = getInputText(chatInput).trim().length > 0;

  if (!chatInput || !hasText) {
    promptizerTrigger.classList.remove('is-visible');
    return;
  }

  const rect = chatInput.getBoundingClientRect();
  const compact = window.innerWidth <= 520;
  const triggerWidth = compact ? 42 : 112;
  const triggerHeight = 36;
  const margin = 10;

  let x = rect.right - triggerWidth - margin;
  let y = rect.top - triggerHeight - 8;

  if (y < 8) {
    y = rect.bottom + 8;
  }

  x = clamp(x, 10, window.innerWidth - triggerWidth - 10);
  y = clamp(y, 10, window.innerHeight - triggerHeight - 10);

  promptizerTrigger.style.setProperty('--trigger-x', `${Math.round(x)}px`);
  promptizerTrigger.style.setProperty('--trigger-y', `${Math.round(y)}px`);
  promptizerTrigger.classList.add('is-visible');
}

function positionPanel() {
  const anchor = currentTargetInput || findChatInput();
  const panelWidth = Math.min(400, window.innerWidth - 24);

  suggestionBox.style.setProperty('--panel-width', `${panelWidth}px`);

  const panelRect = suggestionBox.getBoundingClientRect();
  const panelHeight = panelRect.height || 300;

  let x = window.innerWidth - panelWidth - 18;
  let y = window.innerHeight - panelHeight - 72;

  if (anchor) {
    const anchorRect = anchor.getBoundingClientRect();
    x = anchorRect.right - panelWidth;
    y = anchorRect.top - panelHeight - 12;

    if (y < 12) {
      y = anchorRect.bottom + 12;
    }
  }

  x = clamp(x, 12, window.innerWidth - panelWidth - 12);
  y = clamp(y, 12, window.innerHeight - panelHeight - 12);

  suggestionBox.style.setProperty('--panel-x', `${Math.round(x)}px`);
  suggestionBox.style.setProperty('--panel-y', `${Math.round(y)}px`);
}

function openPanel() {
  suggestionBox.classList.add('is-open');
  requestAnimationFrame(positionPanel);
}

function closePanel() {
  suggestionBox.classList.remove('is-open');
  suggestionBox.innerHTML = '';
}

function setTriggerLoading(isLoading) {
  promptizerTrigger.classList.toggle('is-loading', isLoading);
  promptizerTrigger.setAttribute('aria-busy', String(isLoading));
}

function renderPanelHeader(title, subtitle) {
  return `
    <header class="panel-header">
      <div class="panel-brand">
        <img src="${logoUrl}" alt="">
        <div>
          <span class="panel-title">${title}</span>
          <span class="panel-subtitle">${subtitle}</span>
        </div>
      </div>
      <button class="icon-btn" type="button" data-action="close" aria-label="Close Promptizer">
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18 6 6 18"></path>
          <path d="m6 6 12 12"></path>
        </svg>
      </button>
    </header>
  `;
}

function renderLoading() {
  suggestionBox.innerHTML = `
    ${renderPanelHeader('Improving prompt', aiContext)}
    <div class="panel-body">
      <div class="loading-lines" aria-hidden="true">
        <div class="loading-line"></div>
        <div class="loading-line"></div>
        <div class="loading-line"></div>
        <div class="loading-block"></div>
      </div>
    </div>
  `;
  openPanel();
}

function renderResult(text) {
  suggestionBox.innerHTML = `
    ${renderPanelHeader('Prompt ready', aiContext)}
    <div class="panel-body">
      <div class="prompt-card">
        <pre id="promptizer-result-text"></pre>
      </div>
      <div class="panel-actions">
        <button class="secondary-btn" type="button" data-action="copy">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Copy
        </button>
        <button class="primary-btn" type="button" data-action="replace">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 6 9 17l-5-5"></path>
          </svg>
          Replace prompt
        </button>
      </div>
    </div>
  `;

  const resultText = shadowRoot.getElementById('promptizer-result-text');
  resultText.textContent = text;
  openPanel();
}

function renderError(message) {
  suggestionBox.innerHTML = `
    ${renderPanelHeader('Promptizer issue', aiContext)}
    <div class="panel-body">
      <div class="error-card">
        <div class="error-title">Could not improve this prompt</div>
        <div id="promptizer-error-text"></div>
      </div>
      <div class="panel-actions">
        <button class="secondary-btn" type="button" data-action="close">Close</button>
        <button class="primary-btn" type="button" data-action="retry">Try again</button>
      </div>
    </div>
  `;

  const errorText = shadowRoot.getElementById('promptizer-error-text');
  errorText.textContent = message || 'The server did not return a prompt. Please try again.';
  openPanel();
}

async function copyOptimizedText() {
  if (!currentOptimizedText) return;

  try {
    await navigator.clipboard.writeText(currentOptimizedText);
    showToast('Prompt copied');
    return;
  } catch (error) {
    const textarea = document.createElement('textarea');
    textarea.value = currentOptimizedText;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    showToast('Prompt copied');
  }
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('is-visible');

  toastTimer = setTimeout(() => {
    toast.classList.remove('is-visible');
  }, 1800);
}

// 6. Main Promptizer logic
function handlePromptize() {
  currentTargetInput = findChatInput();

  if (!currentTargetInput) {
    showToast('Chat box not found');
    return;
  }

  const rawText = getInputText(currentTargetInput);

  if (!rawText.trim()) {
    showToast('Type something first');
    return;
  }

  setTriggerLoading(true);
  renderLoading();

  chrome.runtime.sendMessage({
    action: 'optimizePrompt',
    text: rawText,
    context: aiContext
  }, (response) => {
    setTriggerLoading(false);

    const optimizedText = response && response.optimizedText ? response.optimizedText : '';
    const hasError = !optimizedText || optimizedText.startsWith('Error:');

    if (hasError) {
      renderError(optimizedText);
      return;
    }

    currentOptimizedText = optimizedText;
    renderResult(currentOptimizedText);
  });
}

shadowRoot.addEventListener('click', (event) => {
  const actionElement = event.target.closest('[data-action]');
  if (!actionElement) return;

  const action = actionElement.dataset.action;

  if (action === 'promptize') {
    event.preventDefault();
    event.stopPropagation();
    handlePromptize();
    return;
  }

  if (action === 'close') {
    closePanel();
    return;
  }

  if (action === 'copy') {
    copyOptimizedText();
    return;
  }

  if (action === 'replace') {
    replaceInputText(currentTargetInput, currentOptimizedText);
    closePanel();
    showToast('Prompt replaced');
    return;
  }

  if (action === 'retry') {
    handlePromptize();
  }
});

function startTracking() {
  if (trackingInterval) clearInterval(trackingInterval);
  trackingInterval = setInterval(updatePromptizerPosition, 140);
  updatePromptizerPosition();
}

window.addEventListener('resize', () => {
  updatePromptizerPosition();
  if (suggestionBox.classList.contains('is-open')) {
    positionPanel();
  }
});

window.addEventListener('scroll', () => {
  updatePromptizerPosition();
  if (suggestionBox.classList.contains('is-open')) {
    positionPanel();
  }
}, true);

// 7. Start after the host page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(startTracking, 800);
  });
} else {
  setTimeout(startTracking, 800);
}
