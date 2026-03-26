require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');

const app = express();
app.use(cors());
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─────────────────────────────────────────────
// SYSTEM INSTRUCTION — GOLDEN Framework
// ─────────────────────────────────────────────
function buildSystemInstruction(aiContext, persona) {
    return `# AGENT IDENTITY
You are an elite Prompt Architect. You rewrite any user-submitted prompt into a
flawless, deployment-ready version that extracts peak performance from
${aiContext || 'the target AI model'}.

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

Structure the rewritten prompt using this internal anatomy:

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

Length calibration:
- Simple tasks → 50–150 words
- Complex tasks → 150–400 words

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

PERSONA INJECTION
${
    persona
        ? `User context: "${persona}". Calibrate the assigned AI persona and output
   depth to match this user's expertise level and goals.`
        : `Always assign a specific role. Include: seniority level + domain +
   company/environment type.
   ❌ "a developer"
   ✅ "a Senior Backend Engineer with 8 years in distributed systems at a
       Series-B fintech startup"`
}

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

[ ] Has a hyper-specific expert persona — not vague
[ ] Has one unambiguous objective — not two goals combined
[ ] Has at least one ✅ MUST, one ❌ MUST NOT, and one 📐 DIMENSION constraint
[ ] Has an exact output format defined
[ ] All vague details replaced with [PLACEHOLDERS]
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
    }
];

// ─────────────────────────────────────────────
// ROUTE: POST /api/optimize
// ─────────────────────────────────────────────
app.post('/api/optimize', async (req, res) => {
    const { rawText, aiContext, persona } = req.body;

    if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
        return res.status(400).json({ error: "rawText is required and must be a non-empty string." });
    }
    if (rawText.trim().length > 3000) {
        return res.status(400).json({ error: "rawText exceeds the 3000-character limit." });
    }

    const systemInstruction = buildSystemInstruction(aiContext?.trim(), persona?.trim());

    try {
        const chatCompletion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemInstruction },
                ...trainingExamples,
                { role: "user", content: `Optimize this prompt: "${rawText.trim()}"` }
            ],
            temperature: 0.60,        // Low — structured rewriting needs consistency over creativity
            max_tokens: 2500,         // Room for rich, multi-block rewrites
            top_p: 0.88,              // Slight nucleus sampling for vocabulary diversity
            frequency_penalty: 0.35,  // Prevents repetitive phrasing across constraint blocks
            presence_penalty: 0.20,   // Encourages broader vocabulary in persona and context blocks
        });

        const optimizedPrompt = chatCompletion.choices[0]?.message?.content;

        if (!optimizedPrompt) {
            return res.status(500).json({ error: "Model returned an empty response. Please try again." });
        }

        res.json({
            optimizedText: optimizedPrompt.trim(),
            usage: chatCompletion.usage ?? null,
            model: chatCompletion.model ?? "llama-3.3-70b-versatile"
        });

    } catch (error) {
        console.error("GROQ API ERROR:", error?.message || error);

        const statusCode = error?.status ?? 500;
        const userMessage =
            statusCode === 429 ? "Rate limit hit. Please wait a moment and retry." :
            statusCode === 401 ? "Invalid API key. Check your GROQ_API_KEY in .env" :
            statusCode === 400 ? "Bad request sent to Groq API. Check your inputs." :
            "Optimization failed due to an internal server error.";

        res.status(statusCode).json({ error: userMessage });
    }
});

// ─────────────────────────────────────────────
// ROUTE: GET /health
// ─────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({
        status: "ok",
        service: "Promptizer API",
        timestamp: new Date().toISOString()
    });
});

// ─────────────────────────────────────────────
// SERVER BOOT
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Promptizer Server running → http://localhost:${PORT}`);
    console.log(`🔑 GROQ_API_KEY: ${process.env.GROQ_API_KEY ? "✅ Loaded" : "❌ MISSING — check .env"}`);
});
