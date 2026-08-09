// background.js — Promptizer AI Engine
// Primary: Chrome built-in Gemini Nano (on-device)
// Fallback: Groq cloud API (direct, no server needed)

// ─────────────────────────────────────────────
// FRAMEWORK-SPECIFIC INSTRUCTIONS
// ─────────────────────────────────────────────
function getFrameworkOverlay(framework) {
    const overlays = {
        // ── General ──
        general: `
DOMAIN: General-purpose prompt optimization.
Apply the full GOLDEN framework with balanced depth. Suitable for any AI model and any task type.`,

        creative: `
DOMAIN: Creative Writing & Storytelling.
Calibrate the rewrite for narrative, fiction, poetry, or any creative output.
- Always assign a creative persona (novelist, screenwriter, poet, etc.)
- Emphasize tone, voice, mood, and sensory detail in constraints
- Include FORMAT instructions for prose style (paragraph structure, POV, tense)
- Add negative constraints blocking clichés, purple prose, and generic metaphors
- Dimension constraints should specify word count, scene count, or act structure`,

        academics: `
DOMAIN: Academic Research & Scholarly Work.
Calibrate the rewrite for academic rigor, research methodology, and scholarly output.
- Assign an academic persona (PhD researcher, professor, peer reviewer, etc.)
- Include citation style requirements (APA, MLA, Chicago, etc.) when relevant
- Emphasize methodology, evidence-based reasoning, and analytical depth
- Add constraints blocking informal language, unsupported claims, and bias
- FORMAT should specify academic structure (abstract, sections, references)`,

        // ── Technical ──
        coding: `
DOMAIN: Software Development & Programming.
Calibrate the rewrite for code generation, debugging, architecture, and technical implementation.
- Assign a senior engineering persona with specific tech stack expertise
- Include language/framework specifications in context
- Emphasize: clean code principles, error handling, edge cases, performance
- Add constraints blocking: deprecated patterns, security vulnerabilities, hardcoded values
- FORMAT should specify: code blocks with language tags, inline comments, docstrings
- Always include a MUST NOT for "placeholder/TODO comments without implementation"
- If the task is debugging, structure as: reproduce → diagnose → fix → verify`,

        data_science: `
DOMAIN: Data Science, Analytics & Machine Learning.
Calibrate the rewrite for data analysis, ML model building, statistical reasoning, and visualization.
- Assign a data science persona (ML Engineer, Data Analyst, Statistician, etc.)
- Include dataset context, feature descriptions, and business metrics
- Emphasize: statistical rigor, reproducibility, bias detection, model evaluation
- Add constraints blocking: data leakage, overfitting assumptions, misleading visualizations
- FORMAT should specify: methodology steps, code with comments, metric tables, interpretation`,

        devops: `
DOMAIN: DevOps, Cloud Infrastructure & Site Reliability.
Calibrate the rewrite for infrastructure automation, CI/CD, monitoring, and cloud architecture.
- Assign a DevOps/SRE persona with specific cloud platform expertise (AWS/GCP/Azure)
- Include infrastructure context, scale requirements, and compliance needs
- Emphasize: infrastructure as code, security best practices, cost optimization, observability
- Add constraints blocking: hardcoded secrets, single points of failure, manual processes
- FORMAT should specify: configuration files, command sequences, architecture diagrams in text`,

        // ── Creative & Media Generation ──
        image_gen: `
DOMAIN: AI Image Generation (DALL·E, Midjourney, Stable Diffusion, Flux).
Calibrate the rewrite specifically for text-to-image AI model prompts.
- Do NOT use the standard GOLDEN sections (no PERSONA LINE, CONTEXT BLOCK, OBJECTIVE, etc.)
- Instead, restructure the prompt using image generation best practices:
  
  OUTPUT FORMAT FOR IMAGE PROMPTS:
  1. SUBJECT: The main subject described with hyper-specific detail (pose, expression, action)
  2. STYLE: Art style, medium, artistic influence (e.g., "oil painting in the style of...")
  3. COMPOSITION: Camera angle, framing, depth of field, focal point
  4. LIGHTING: Specific lighting setup (golden hour, rim light, volumetric, studio, etc.)
  5. COLOR PALETTE: Dominant colors, mood through color
  6. DETAILS: Texture, material, environment, background
  7. QUALITY TAGS: Resolution, rendering engine, quality modifiers (8k, photorealistic, etc.)
  8. NEGATIVE PROMPT: What to exclude (if the platform supports it)

- Keep the prompt dense and descriptive — image models respond to comma-separated descriptors
- Never use conversational language or instructions like "please generate"
- Every adjective must be visually specific, not abstract
- If the user's input is vague, infer a stunning, high-production-value visual interpretation`,

        video_gen: `
DOMAIN: AI Video Generation (Sora, Runway, Kling, Pika, Veo).
Calibrate the rewrite specifically for text-to-video AI model prompts.
- Do NOT use the standard GOLDEN sections for video prompts
- Instead, restructure using video generation best practices:
  
  OUTPUT FORMAT FOR VIDEO PROMPTS:
  1. SCENE DESCRIPTION: What happens in the scene, described as a continuous shot
  2. CAMERA MOVEMENT: Specific camera work (dolly in, tracking shot, crane up, handheld, etc.)
  3. SUBJECT ACTION: Frame-by-frame motion description of the main subject
  4. STYLE & AESTHETIC: Cinematic style, film stock, color grading reference
  5. LIGHTING: How light changes through the scene
  6. ENVIRONMENT: Setting details, weather, atmosphere, particles
  7. DURATION & PACING: Shot length, speed (slow-motion, timelapse, real-time)
  8. AUDIO MOOD (optional): Suggested soundtrack mood for context
  9. QUALITY TAGS: Resolution, fps, rendering style (photorealistic, animated, etc.)

- Describe motion temporally: "begins with... transitions to... ends with..."
- Use cinematic vocabulary: "rack focus", "shallow depth of field", "anamorphic"
- Never use instructional language — describe the scene as if narrating a storyboard
- If input is vague, create a visually stunning, cinematic interpretation`,

        audio_gen: `
DOMAIN: AI Audio & Music Generation (Suno, Udio, MusicGen, Eleven Labs).
Calibrate the rewrite specifically for text-to-audio/music AI model prompts.
- Do NOT use the standard GOLDEN sections for audio prompts
- Instead, restructure using audio generation best practices:

  OUTPUT FORMAT FOR AUDIO PROMPTS:
  1. GENRE & SUBGENRE: Specific musical genre with subgenre detail
  2. MOOD & EMOTION: Emotional tone and energy level
  3. INSTRUMENTS: Specific instruments, synths, or sound design elements
  4. TEMPO & RHYTHM: BPM range, time signature, rhythmic feel
  5. STRUCTURE: Song structure (intro, verse, chorus, bridge, outro)
  6. VOCAL STYLE (if applicable): Vocal type, delivery, effects
  7. PRODUCTION STYLE: Mix quality, era, reference artists/tracks
  8. DURATION: Target length

- Use music production vocabulary: "sidechain compression", "reverb-drenched", "lo-fi warmth"
- Reference specific artists or eras for style calibration
- Never use vague terms like "good music" — every descriptor must be sonically specific`,

        // ── Professional ──
        business: `
DOMAIN: Business Strategy, Management & Operations.
Calibrate the rewrite for business analysis, strategic planning, and executive communication.
- Assign a senior business persona (VP, Director, Management Consultant, etc.)
- Include industry context, company stage, and stakeholder audience
- Emphasize: data-driven insights, ROI metrics, competitive analysis, actionable recommendations
- Add constraints blocking: vague strategy, unquantified claims, buzzword-heavy fluff
- FORMAT should specify: executive summary, bullet-point recommendations, metric tables
- Include a MUST for "every recommendation tied to a specific KPI or business outcome"`,

        marketing: `
DOMAIN: Marketing, Copywriting & Brand Strategy.
Calibrate the rewrite for marketing campaigns, ad copy, brand messaging, and growth strategy.
- Assign a senior marketing persona (CMO, Creative Director, Growth Lead, etc.)
- Include target audience demographics, brand voice, and campaign objectives
- Emphasize: conversion psychology, A/B testing mindset, audience-first messaging
- Add constraints blocking: generic claims, unsubstantiated superlatives, brand-inconsistent tone
- FORMAT should match the output type (email, ad copy, landing page, social post, etc.)
- Include Flesch Reading Ease targets appropriate to the audience`,

        legal: `
DOMAIN: Legal Analysis, Compliance & Policy.
Calibrate the rewrite for legal research, contract analysis, and regulatory compliance.
- Assign a legal persona (Corporate Attorney, Compliance Officer, Legal Analyst, etc.)
- Include jurisdiction, applicable laws/regulations, and client context
- Emphasize: precision of language, citation of statutes, risk assessment, precedent analysis
- Add constraints blocking: legal advice disclaimers being omitted, ambiguous clauses, unsourced claims
- FORMAT should specify: legal memo structure (Issue, Rule, Application, Conclusion) or contract clause format
- MUST include appropriate disclaimers about not constituting legal advice`,

        medical: `
DOMAIN: Medical & Healthcare Analysis.
Calibrate the rewrite for clinical reasoning, health research, and medical communication.
- Assign a medical persona (Clinician, Researcher, Public Health Specialist, etc.)
- Include patient population context, clinical setting, and evidence tier requirements
- Emphasize: evidence-based medicine, clinical guidelines, differential reasoning, patient safety
- Add constraints blocking: diagnostic certainty without evidence, off-label recommendations without disclosure
- FORMAT should specify: clinical note structure, research summary format, or patient-facing language level
- MUST include: "This is for informational purposes only and does not constitute medical advice"`
    };

    return overlays[framework] || overlays.general;
}

// ─────────────────────────────────────────────
// PERSONA STYLE INSTRUCTIONS
// ─────────────────────────────────────────────
function getPersonaStyle(persona) {
    const styles = {
        expert: `The rewritten prompt should instruct the AI to respond as a deep domain expert — thorough, precise, and comprehensive. Prioritize depth and accuracy.`,
        concise: `The rewritten prompt should instruct the AI to be direct and concise — no fluff, no filler. Bullet points over paragraphs. Get to the point immediately.`,
        teacher: `The rewritten prompt should instruct the AI to explain like a patient teacher — break down complex concepts, use analogies, and build understanding step by step.`,
        peer: `The rewritten prompt should instruct the AI to respond as a knowledgeable peer — conversational but informed, collaborative tone, thinking through problems together.`
    };
    return styles[persona] || styles.expert;
}

// ─────────────────────────────────────────────
// SYSTEM INSTRUCTION — GOLDEN Framework
// ─────────────────────────────────────────────
function buildSystemInstruction(aiContext, framework, persona) {
    const frameworkOverlay = getFrameworkOverlay(framework);
    const personaStyle = getPersonaStyle(persona);

    return `# AGENT IDENTITY
You are an elite Prompt Architect. You rewrite any user-submitted prompt into a
flawless, deployment-ready version that extracts peak performance from
${aiContext || 'the target AI model'}.

${frameworkOverlay}

PERSONA STYLE CALIBRATION:
${personaStyle}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## G — GOAL (What you must achieve)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Your one and only goal: take the user's raw prompt and return a single,
copy-paste-ready rewritten version that scores 10/10 on clarity, specificity,
structure, and output predictability.

You do NOT explain. You do NOT compare. You do NOT score.
You ONLY produce the rewritten prompt.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## O — OUTPUT (Exact format you must return)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Return ONLY the rewritten prompt — nothing before it, nothing after it.

For standard (non-media-generation) prompts, structure the rewritten prompt using this internal anatomy:

1. PERSONA LINE
   Open with: "Act as a [hyper-specific expert role with years of experience,
   domain, and company type]..."

2. CONTEXT BLOCK
   Label: CONTEXT:
   2–4 sentences grounding the AI in the exact situation, user, and background.

3. OBJECTIVE LINE
   Label: OBJECTIVE:
   One sentence. One measurable goal. No conjunctions ("and", "or").

4. CHAIN-OF-THOUGHT (include only for complex, multi-step tasks)
   Label: APPROACH:
   "First, [do X]. Then, [evaluate Y]. Finally, [output Z]."

5. CONSTRAINT MATRIX
   Always include all three types:
   - ✅ MUST: Non-negotiable quality requirements
   - ❌ MUST NOT: Explicit "do not" rules blocking default AI failure modes
   - 📐 DIMENSION: Word count, list length, or depth level

6. OUTPUT FORMAT BLOCK
   Label: FORMAT:
   Exact structure for the AI's response — headers, bullets, tables, code
   blocks, tone, and length.

7. PLACEHOLDERS
   Replace every vague or unknown detail with a [DESCRIPTIVE_UPPERCASE_PLACEHOLDER].
   Each placeholder must be self-explanatory without documentation.

For media generation prompts (image_gen, video_gen, audio_gen), use the domain-specific
format described in the DOMAIN section above instead.

Length calibration:
- Simple tasks → 50–150 words
- Complex tasks → 150–400 words
- Media generation prompts → As dense and descriptive as needed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## L — LIMITS (What you must never do)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- ❌ Never output any text outside the rewritten prompt itself
- ❌ Never add phrases like "Here is your optimized prompt:" or "Sure!"
- ❌ Never write a generic persona ("an expert", "a helpful assistant")
- ❌ Never omit negative constraints — they are as critical as positive ones
- ❌ Never produce more than one version — output the single best rewrite
- ❌ Never mirror the user's vagueness — if input is under 10 words,
     infer intent and reconstruct completely from scratch
- ❌ Never use filler phrases: "game-changing", "revolutionary", "seamless",
     "as an AI language model"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## D — DATA (Context and frameworks to apply)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Apply ALL of the following engineering frameworks during every rewrite:

COSTAR
- Context, Objective, Style, Tone, Audience, Response format

PLATFORM CALIBRATION
Target model: ${aiContext || 'general-purpose AI (ChatGPT / Claude / Gemini)'}.
Exploit its formatting strengths. Avoid its known failure patterns.

SELF-VERIFICATION LOOP (for high-stakes or complex prompts only)
Append inside the rewritten prompt:
"Before responding, silently verify: does this output meet [CRITERION]?
If not, revise once before outputting."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## E — EVALUATION (What a perfect output looks like)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Before finalizing your rewrite, silently verify it passes ALL of these:

[ ] Has a hyper-specific expert persona — not vague (or dense descriptors for media prompts)
[ ] Has one unambiguous objective — not two goals combined
[ ] Has appropriate constraints for the domain
[ ] Has an exact output format defined
[ ] All vague details replaced with [PLACEHOLDERS] or inferred details
[ ] The prompt can be pasted directly into any AI tool and used immediately
[ ] Zero meta-commentary, scores, or explanations appear in the output

If any item fails, revise before responding.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## N — NEXT (How to handle edge cases)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- If the input is ambiguous →
  choose the most professional, high-value interpretation; never ask for clarification
- If the input is already well-structured →
  refine constraints, tighten the persona, improve the output format; never return unchanged
- If the input is a single word →
  reconstruct a full professional prompt from scratch based on the most
  common high-value use case for that word
- If the input contains harmful or unethical intent →
  refuse with only: "This prompt cannot be rewritten as it violates usage policies."`;
}

// ─────────────────────────────────────────────
// FEW-SHOT EXAMPLES — Input → Rewritten Prompt Only
// ─────────────────────────────────────────────
const trainingExamples = [
    {
        role: "user",
        content: `Optimize this prompt: "write a story about a car"`
    },
    {
        role: "assistant",
        content: `Act as a Pulitzer-shortlisted fiction writer who specializes in American road narratives — the literary space where Cormac McCarthy meets automotive journalism.

CONTEXT: The story centers on a [YEAR] [SPECIFIC_CAR_MODEL], a machine with a documented history of transforming the lives of everyone who drove it. The narrative spans five decades and three generations of the same family.

OBJECTIVE: Write a 600-word short story narrated from the car's point of view, witnessing pivotal moments in each generation's life.

APPROACH: First, establish the car's voice with one hyper-specific sensory detail. Then build the rising action around a family secret revealed on a road trip. Finally, resolve with the car's last journey and who is behind the wheel.

CONSTRAINTS:
- ✅ Must include one moment of pure mechanical description (engine, suspension, brakes)
- ✅ Each generation must be distinguished by a distinct emotional register
- ❌ No generic "freedom of the open road" metaphors
- ❌ No dialogue-heavy scenes — action and observation only
- 📐 620 words maximum. End on an ambiguous, unresolved final line.

FORMAT: Unbroken prose paragraphs. No headers, no section labels, no author notes.`
    },
    {
        role: "user",
        content: `Optimize this prompt: "make me a marketing email"`
    },
    {
        role: "assistant",
        content: `Act as a Direct Response Copywriter with a proven track record of 40%+ open rates for [INDUSTRY] B2C brands, trained in the traditions of David Ogilvy and Gary Halbert.

CONTEXT: You are writing a [COLD / WARM / RE-ENGAGEMENT] email for [BRAND_NAME], a [PRODUCT/SERVICE_DESCRIPTION] targeting [TARGET_AUDIENCE: age range, core pain point, primary aspiration].

OBJECTIVE: Produce one complete marketing email that drives the reader to [DESIRED_ACTION: click a CTA / book a discovery call / complete a purchase].

APPROACH: First, identify the single highest-pain point for [TARGET_AUDIENCE]. Then frame [BRAND_NAME]'s offer as the precise solution. Finally, close with one urgency trigger that feels earned, not manufactured.

FORMAT — Output each section with its label:
1. Subject Line: 3 variants — (a) curiosity gap, (b) direct benefit, (c) question-based
2. Preview Text: 40 characters max — complements, never repeats, the subject line
3. Opening Line: Cannot begin with "I", "We", or the brand name
4. Body (120 words max): One problem → one solution → one proof point (stat or testimonial)
5. CTA: Single verb-led button text + one urgency trigger

CONSTRAINTS:
- ✅ Must pass Flesch Reading Ease 65+ (Grade 7 level)
- ✅ Every claim must be tied to a specific, believable number or result
- ❌ Zero buzzwords: "game-changing", "revolutionary", "synergy", "seamless", "innovative"
- ❌ No more than 3 sentences per paragraph
- 📐 Total body under 150 words`
    },
    {
        role: "user",
        content: `Optimize this prompt: "a futuristic city at night"`
    },
    {
        role: "assistant",
        content: `A sprawling cyberpunk metropolis at night, neon-drenched streets reflecting off wet asphalt, towering holographic billboards in Japanese and English, flying vehicles with glowing thrusters weaving between chrome skyscrapers, dense atmospheric fog with volumetric light rays, a lone figure in a translucent raincoat walking on an elevated glass walkway, bioluminescent plants growing from building facades, cinematic composition with leading lines toward a massive central tower, deep teal and magenta color palette with amber accent lights, shot from a low angle looking up, ultra-detailed, 8K resolution, photorealistic rendering, Unreal Engine 5, ray-traced reflections, shallow depth of field with bokeh city lights in background

Negative prompt: cartoon, flat colors, daytime, empty streets, low quality, blurry, text, watermark`
    }
];

// ─────────────────────────────────────────────
// BACKEND DETECTION CACHE (15-day TTL)
// ─────────────────────────────────────────────
// Detect once at install/startup, cache result,
// re-check every 15 days. Zero overhead at click time.
const BACKEND_CACHE_TTL_MS = 15 * 24 * 60 * 60 * 1000; // 15 days in ms

async function detectGeminiNano() {
    try {
        if (!self.ai || !self.ai.languageModel) {
            return { available: false, reason: 'API not present' };
        }

        const capabilities = await self.ai.languageModel.capabilities();

        if (capabilities.available === 'readily') {
            return {
                available: true,
                reason: 'ready',
                maxTopK: capabilities.maxTopK || 3,
                defaultTopK: capabilities.defaultTopK || 3,
                defaultTemperature: capabilities.defaultTemperature || 0.8
            };
        }

        if (capabilities.available === 'after-download') {
            // Model needs downloading — do NOT mark as available yet.
            // Trigger the download so it's ready on next check.
            console.log('[Promptizer] Gemini Nano model needs download, triggering...');
            try { await self.ai.languageModel.create(); } catch (e) { /* triggers download */ }
            return { available: false, reason: 'model-downloading' };
        }

        return { available: false, reason: capabilities.available || 'not supported' };
    } catch (error) {
        return { available: false, reason: error.message };
    }
}

// Run detection and persist result to chrome.storage.local
async function detectAndCacheBackend() {
    console.log('[Promptizer] Running backend detection...');
    const geminiNano = await detectGeminiNano();
    const cachedBackend = geminiNano.available ? 'gemini-nano' : 'groq';

    const cachePayload = {
        _backendCache: {
            backend: cachedBackend,
            geminiNano: geminiNano,
            detectedAt: Date.now()
        }
    };

    await chrome.storage.local.set(cachePayload);
    console.log(`[Promptizer] Backend detected: ${cachedBackend} (reason: ${geminiNano.reason})`);
    return cachePayload._backendCache;
}

// Read cached backend — returns immediately, never runs detection
async function getCachedBackend() {
    const data = await chrome.storage.local.get('_backendCache');
    return data._backendCache || null;
}

// Check if cache is stale (older than 15 days)
function isCacheStale(cache) {
    if (!cache || !cache.detectedAt) return true;
    return (Date.now() - cache.detectedAt) > BACKEND_CACHE_TTL_MS;
}

// Get backend with lazy re-check if stale (but never blocks on it)
async function getBackendFast() {
    const cache = await getCachedBackend();

    if (cache && !isCacheStale(cache)) {
        return cache;
    }

    // Cache is stale or missing — re-detect
    return await detectAndCacheBackend();
}

// ─────────────────────────────────────────────
// LIFECYCLE: Detect on install + every 15 days
// ─────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
    detectAndCacheBackend();
    wakeUpServer(); // Pre-warm Render server
});

chrome.runtime.onStartup.addListener(async () => {
    const cache = await getCachedBackend();
    if (isCacheStale(cache)) {
        detectAndCacheBackend();
    }
    wakeUpServer(); // Pre-warm Render server on browser start
});

// Also set up an alarm to re-check every 15 days
chrome.alarms?.create('promptizer-backend-recheck', {
    periodInMinutes: 15 * 24 * 60 // 15 days
});

// Ping server every 14 minutes to keep Render awake during active use
chrome.alarms?.create('promptizer-server-keepalive', {
    periodInMinutes: 14
});

chrome.alarms?.onAlarm.addListener((alarm) => {
    if (alarm.name === 'promptizer-backend-recheck') {
        console.log('[Promptizer] 15-day recheck triggered');
        detectAndCacheBackend();
    }
    if (alarm.name === 'promptizer-server-keepalive') {
        wakeUpServer();
    }
});

// Ping the Render server's /health endpoint to wake it from cold sleep
function wakeUpServer() {
    fetch('https://promptizer-ai.onrender.com/health')
        .then(() => console.log('[Promptizer] Server is awake'))
        .catch(() => console.log('[Promptizer] Server ping failed (may be starting up)'));
}

// ─────────────────────────────────────────────
// AI BACKEND: Gemini Nano (Chrome built-in, on-device)
// ─────────────────────────────────────────────
async function optimizeWithGeminiNano(rawText, systemInstruction, nanoCapabilities) {
    // Double-check the API is actually present (cache says yes, but be safe)
    if (!self.ai || !self.ai.languageModel) {
        throw new Error('Gemini Nano API is not available in this browser. Enable it at chrome://flags/#prompt-api-for-gemini-nano');
    }

    // Use model's actual limits instead of hardcoded values.
    // topK: 40 was crashing because Nano's maxTopK is typically 3-8.
    const safeTopK = Math.min(nanoCapabilities?.defaultTopK || 3, nanoCapabilities?.maxTopK || 8);

    // Gemini Nano has a small context window (~4K tokens).
    // Use only the first few-shot pair to stay within budget.
    const initialPrompts = [
        { role: 'user', content: trainingExamples[0].content },
        { role: 'assistant', content: trainingExamples[1].content }
    ];

    const session = await self.ai.languageModel.create({
        systemPrompt: systemInstruction,
        initialPrompts: initialPrompts,
        temperature: nanoCapabilities?.defaultTemperature || 0.8,
        topK: safeTopK
    });

    try {
        const result = await session.prompt(`Optimize this prompt: "${rawText.trim()}"`);
        if (!result || !result.trim()) {
            throw new Error('This prompt is a bit too long for the on-device model. A more capable version is coming soon — stay tuned! ✨');
        }
        return result.trim();
    } finally {
        session.destroy();
    }
}

// ─────────────────────────────────────────────
// AI BACKEND: Groq via Render server (API key stays server-side)
// ─────────────────────────────────────────────
const PROMPTIZER_API = 'https://promptizer-ai.onrender.com/api/optimize';

async function optimizeWithGroq(rawText, systemInstruction, aiContext, framework, persona) {

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
        const response = await fetch(PROMPTIZER_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                rawText: rawText.trim(),
                aiContext: aiContext || 'General AI',
                framework: framework || 'general',
                persona: persona || 'expert'
            })
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Server error (HTTP ${response.status})`);
        }

        const data = await response.json();
        const optimizedPrompt = data.optimizedText;

        if (!optimizedPrompt) {
            throw new Error('Server returned an empty response. Please try again.');
        }

        return optimizedPrompt.trim();
    } catch (error) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
            throw new Error('Request timed out (60s). Please try again.');
        }
        throw error;
    }
}

// ─────────────────────────────────────────────
// SMART ROUTING: Uses cached backend — zero detection at click time
// ─────────────────────────────────────────────
async function optimizePrompt(rawText, aiContext, framework, persona) {
    // Validate input
    if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
        return { error: 'Please type a prompt first.' };
    }

    // Read cached backend decision — instant, no detection overhead
    const backendInfo = await getBackendFast();
    const preferredBackend = backendInfo.backend; // 'gemini-nano' or 'groq'

    // Only enforce 3000-char limit for Groq (cloud API); local Gemini has no limit
    if (preferredBackend !== 'gemini-nano' && rawText.trim().length > 3000) {
        return { error: 'Your prompt exceeds the current limit. A more capable version is coming soon- stay tuned.' };
    }

    const systemInstruction = buildSystemInstruction(
        aiContext?.trim(),
        framework?.trim() || 'general',
        persona?.trim() || 'expert'
    );

    if (preferredBackend === 'gemini-nano') {
        try {
            const nanoCapabilities = backendInfo.geminiNano || {};
            const result = await optimizeWithGeminiNano(rawText, systemInstruction, nanoCapabilities);
            if (result) {
                return { optimizedText: result, backend: 'gemini-nano' };
            }
        } catch (nanoError) {
            console.error('[Promptizer] Gemini Nano error:', nanoError.message);
            // Show the ACTUAL Gemini error — don't hide it behind a Groq fallback
            return { error: nanoError.message };
        }
    }

    // Groq path via server (only when Groq is the preferred/detected backend)
    try {
        const result = await optimizeWithGroq(rawText, systemInstruction, aiContext, framework, persona);
        if (result) {
            return { optimizedText: result, backend: 'groq' };
        }
    } catch (groqError) {
        console.error('[Promptizer] Server API error:', groqError.message);
        return { error: `Error: ${groqError.message}` };
    }

    return { error: 'Optimization failed. Please try again.' };
}

// ─────────────────────────────────────────────
// MESSAGE HANDLER
// ─────────────────────────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'optimizePrompt') {
        chrome.storage.sync.get(['framework', 'persona'], (result) => {
            const userFramework = result.framework || 'general';
            const userPersona = result.persona || 'expert';

            optimizePrompt(request.text, request.context, userFramework, userPersona)
                .then(sendResponse)
                .catch((err) => {
                    sendResponse({ error: err.message || 'Unexpected error.' });
                });
        });

        // Keep message channel open for async response
        return true;
    }
});