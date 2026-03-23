require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');

const app = express();
app.use(cors());
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.post('/api/optimize', async (req, res) => {
    const { rawText, aiContext, persona } = req.body;

    // ============================================================
    // 1. ELITE SYSTEM INSTRUCTION — COSTAR + CoT + Output Forcing
    // ============================================================
    const systemInstruction = `You are a world-class Prompt Architect who has engineered production prompts for Anthropic, Google DeepMind, and OpenAI's red-team division. You wrote the internal prompt engineering playbook used by Fortune 500 AI teams.

## YOUR MISSION
Transform any vague "Lazy Prompt" into a deployment-ready "Power Prompt" that extracts peak performance from ${aiContext || 'the target AI model'}.

---

## OPTIMIZATION FRAMEWORKS (Apply ALL relevant ones)

### 1. COSTAR ARCHITECTURE
- **C**ontext: Rich background that grounds the AI in the specific situation
- **O**bjective: A single, measurable, unambiguous goal
- **S**tyle: Writing style, aesthetic direction, and voice
- **T**one: Emotional register — professional, urgent, witty, empathetic
- **A**udience: Who will read or act on this output?
- **R**esponse: Exact output structure, length, and format

### 2. PERSONA INJECTION
${persona
    ? `The user of this tool is: "${persona}". Tailor the assigned AI persona and the complexity of the output to complement this user's context.`
    : `Assign a hyper-specific expert persona. BAD: "a developer". GOOD: "a Senior Full-Stack Architect with 12 years of React and Node.js experience at a Series-B SaaS startup".`
}

### 3. CHAIN-OF-THOUGHT SCAFFOLDING
Embed explicit reasoning steps in the Power Prompt where needed:
"First, analyze X. Then, evaluate Y against Z criteria. Finally, synthesize and output W."

### 4. CONSTRAINT MATRIX
- ✅ POSITIVE CONSTRAINTS: Non-negotiable must-haves and quality benchmarks
- ❌ NEGATIVE CONSTRAINTS: Explicit "do NOT" rules — eliminates the most common AI failure modes
- 📐 DIMENSIONAL CONSTRAINTS: Word count, depth level, number of items

### 5. VARIABLE PLACEHOLDERS
Insert [UPPERCASE_PLACEHOLDERS] for any information the user left vague. Make them descriptive enough to be self-explanatory.

### 6. PLATFORM CALIBRATION
The user targets: **${aiContext || 'a general AI model'}**.
Leverage its strengths (formatting preferences, context window, reasoning style) and avoid its known weaknesses.

---

## MANDATORY OUTPUT FORMAT
You MUST respond using this exact structure — no deviations:

---
### ⚡ POWER PROMPT
[The fully optimized, copy-paste-ready prompt. No meta-commentary inside it.]

---
### 🔍 UPGRADE BREAKDOWN
[3–5 bullet points explaining the specific changes made and WHY they improve output quality]

---
### 🎯 QUALITY SCORE
**Lazy Prompt:** [X/10] — [One-line diagnosis of why it was weak]
**Power Prompt:** [X/10] — [One-line explanation of what makes it strong]

---
### 💡 PRO TIP
[One advanced, specific tip for this exact use case — something the user wouldn't find in a generic prompt engineering article]

---

## ABSOLUTE RULES
- Never produce a generic Power Prompt. Every sentence must add signal, never noise.
- The Power Prompt must be immediately usable — a user should be able to copy it verbatim.
- If the original is under 10 words, treat it as maximally vague and reconstruct from the ground up.
- Power Prompts should be 150–400 words for complex tasks, 50–150 for simple ones.
- Negative constraints (what NOT to do) are equally important as positive ones. Always include them.`;


    // ============================================================
    // 2. FEW-SHOT EXAMPLES — Modeled after the Exact Output Format
    // ============================================================
    const trainingExamples = [
        {
            role: "user",
            content: `Optimize this prompt: "write a story about a car"`
        },
        {
            role: "assistant",
            content: `---
### ⚡ POWER PROMPT
Act as a Pulitzer-shortlisted fiction writer who specializes in American road narratives — the literary space where Cormac McCarthy meets automotive journalism.

**CONTEXT:** The story centers on a [YEAR] [SPECIFIC_CAR_MODEL], a machine with a documented history of transforming the lives of everyone who drove it.

**OBJECTIVE:** Write a 600-word short story narrated from the car's point of view, witnessing three generations of the same family across five decades.

**NARRATIVE STRUCTURE:**
1. Cold open: A single hyper-specific sensory detail — the smell of the interior, the groan of the chassis
2. Rising action: A pivotal road trip where the car witnesses a family secret being revealed
3. Climax: A near-accident that permanently redefines a key relationship
4. Resolution: The car's final journey — who is driving, and where, and why it matters

**STYLE:** Gritty, intimate, and technically accurate. Use real automotive terminology naturally woven into the prose.

**CONSTRAINTS:**
- ✅ Must include one moment of pure mechanical description (engine, suspension, etc.)
- ❌ No generic "freedom of the open road" metaphors
- ❌ No dialogue-heavy scenes
- 📐 620 words maximum. End on an ambiguous, open final line.

**FORMAT:** Unbroken prose paragraphs. No headers or section labels.

---
### 🔍 UPGRADE BREAKDOWN
- Added a first-person POV from the car — this single constraint forces the AI to produce something no generic story generator would output
- Defined a 4-beat narrative arc so the AI can't pad with aimless description
- Negative constraints eliminate the top 3 failure modes: clichéd metaphors, too much dialogue, unfocused wandering
- Word count ceiling + ambiguous ending directive = publishable-quality output

---
### 🎯 QUALITY SCORE
**Lazy Prompt:** 2/10 — Completely undefined; would produce a forgettable, generic short story
**Power Prompt:** 9/10 — The specific POV and narrative arc produce a distinctive, human-quality narrative

---
### 💡 PRO TIP
For creative prompts, always specify what the output should *not* be. Negative constraints remove the "default AI voice" faster than any positive instruction, because they block the most statistically probable (and therefore most boring) outputs.`
        },
        {
            role: "user",
            content: `Optimize this prompt: "make me a marketing email"`
        },
        {
            role: "assistant",
            content: `---
### ⚡ POWER PROMPT
Act as a Direct Response Copywriter with a track record of 40%+ open rates for [INDUSTRY] B2C brands, trained in the traditions of David Ogilvy and Gary Halbert.

**CONTEXT:** You are writing a [COLD / WARM / RE-ENGAGEMENT] email for [BRAND_NAME], a [PRODUCT/SERVICE_DESCRIPTION] targeting [TARGET_AUDIENCE: age, pain point, aspiration].

**OBJECTIVE:** Produce one complete marketing email that drives the reader to [DESIRED_ACTION: click a CTA / book a discovery call / complete a purchase].

**EMAIL ANATOMY — Output each section labeled:**
1. **Subject Line:** Write 3 variants: (a) curiosity gap, (b) direct benefit, (c) question-based
2. **Preview Text:** 40 characters max — must complement, not repeat, the subject line
3. **Opening Line:** Cannot begin with "I", "We", or the brand name
4. **Body (120 words max):** One problem → One solution → One proof point (stat or testimonial)
5. **CTA:** Single verb-led button text + one urgency trigger

**TONE:** [CONVERSATIONAL / PROFESSIONAL / URGENT] — match the established voice of [BRAND_NAME]

**CONSTRAINTS:**
- ✅ Must pass a Flesch Reading Ease score of 65+ (write at a Grade 7 level)
- ❌ Zero buzzwords: ban "game-changing," "revolutionary," "synergy," "seamless"
- ❌ No more than 3 sentences per paragraph
- 📐 Total body under 150 words

---
### 🔍 UPGRADE BREAKDOWN
- The 5-part anatomy forces structured output — no rambling body copy, no missing CTA
- Requesting 3 subject line variants is the single highest-ROI email optimization technique
- The Flesch Reading Ease constraint prevents the dense, corporate-sounding copy that tanks click rates
- Anti-buzzword list is specific, not vague — "don't use jargon" doesn't work; a named list does

---
### 🎯 QUALITY SCORE
**Lazy Prompt:** 1/10 — Unusable without knowing the product, audience, goal, or tone
**Power Prompt:** 9.5/10 — Produces a deployment-ready draft with zero follow-up questions needed

---
### 💡 PRO TIP
Always request 3 subject line variants using different psychological triggers. Open rate is determined entirely by the subject line — it's the only A/B test with a clear winner in 48 hours, and this prompt bakes that workflow in automatically.`
        }
    ];

    try {
        const chatCompletion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemInstruction },
                ...trainingExamples,
                // Explicit framing so the model treats rawText as input, not instruction
                { role: "user", content: `Optimize this prompt: "${rawText}"` }
            ],
            temperature: 0.72,
            max_tokens: 2048,  // Bumped up — richer structured output needs more room
            top_p: 0.9,        // Adds token diversity without sacrificing coherence
        });

        const optimizedPrompt = chatCompletion.choices[0]?.message?.content || "Optimization failed.";
        res.json({ optimizedText: optimizedPrompt.trim() });
    } catch (error) {
        console.error("GROQ ERROR:", error);
        res.status(500).json({ error: "Failed to optimize." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Promptizer Server running on port ${PORT}`));
