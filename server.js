import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import nlp from 'compromise';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize OpenAI client (supports Groq or OpenAI via env variables)
const useGroq = !!process.env.GROQ_API_KEY;
const openai = new OpenAI({
    apiKey: useGroq ? process.env.GROQ_API_KEY : (process.env.OPENAI_API_KEY || 'your-api-key'),
    baseURL: useGroq ? "https://api.groq.com/openai/v1" : undefined,
});

const DEFAULT_MODEL = process.env.MODEL_NAME || (process.env.GROQ_API_KEY ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini');

function extractJSON(text) {
    // Try direct parse first
    try { return JSON.parse(text); } catch (_) { }
    // Extract first {...} block from the response
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
        try { return JSON.parse(match[0]); } catch (_) { }
    }
    throw new Error('Could not extract valid JSON from model response.');
}

async function callLLM(systemPrompt, userPrompt) {
    const response = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        response_format: { type: "json_object" },
        messages: [
            { role: "system", content: systemPrompt + "\n\nIMPORTANT: Your response must be ONLY a valid JSON object. No markdown fences, no explanations, just raw JSON." },
            { role: "user", content: userPrompt }
        ],
        temperature: 0.5
    });
    return extractJSON(response.choices[0].message.content);
}

app.post('/api/generate', async (req, res) => {
    // Optional: Use Server-Sent Events (SSE) to send logs in real time, or just return all at once.
    // For simplicity, we'll return a full response, but the UI can simulate the typing if we don't use SSE.
    // Since the user asked to make it LOOK advanced with Agent Chat Log, let's use SSE so the frontend gets live events!

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendLog = (agent, msg, color, step) => {
        res.write(`data: ${JSON.stringify({ type: 'log', log: { agent, msg, color, step } })}\n\n`);
    };

    const { inputText } = req.body;

    if (!inputText) {
        res.write(`data: ${JSON.stringify({ type: 'error', error: 'Input text is required' })}\n\n`);
        return res.end();
    }

    try {
        // --- STEP 1: NLP Preprocessing ---
        sendLog('System', 'NLP Preprocessing: Tokenizing, cleaning, and extracting entities...', 'var(--primary)', 1);

        let doc = nlp(inputText);
        doc.normalize();
        const entities = doc.topics().out('array');

        sendLog('NLP Engine', `Detected entities/keywords: ${entities.slice(0, 5).join(', ')}`, 'var(--primary)', 1);

        const cleanText = doc.text();

        // --- STEP 2: Agent 1 (Lead Research) ---
        sendLog('Agent 1', 'Lead Research generating Fact Sheet from clean text...', 'var(--primary)', 2);

        const agent1SystemPrompt = `You are an analytical AI agent called "Lead Researcher".
Your job is to extract structured, factual information from raw input text.

Rules:
- Do NOT generate marketing content
- Only extract facts from the input
- DO NOT guess or infer missing context (like names, brands, or events)
- Identify tone based on context (e.g. Technical, Marketing, Educational)
- Be concise and accurate
- Output ONLY valid JSON`;

        const agent1UserPrompt = `Analyze the following content and extract structured information:

INPUT:
"""
${cleanText}
"""

Extract:
- product (string, or "Unknown")
- target_audience (string)
- key_features (list of strings)
- technical_details (list of strings)
- value_proposition (string)
- constraints (list of strings)
- metrics (list of strings)
- entities (list of strings)
- events (list of strings)
- tone (string, adapt personality to context)
- ambiguous_points (list of strings)

Return pure JSON matching these exact keys.`;

        const factSheet = await callLLM(agent1SystemPrompt, agent1UserPrompt);
        sendLog('Agent 1', `Found core value proposition: ${factSheet.value_proposition}`, 'var(--primary)', 1);

        if (factSheet.ambiguous_points && factSheet.ambiguous_points.length > 0) {
            sendLog('Agent 1', `Flagged ambiguous info: ${factSheet.ambiguous_points[0]}`, 'var(--warning)', 1);
        }

        res.write(`data: ${JSON.stringify({ type: 'factSheet', data: factSheet })}\n\n`);
        sendLog('System', 'Fact-Sheet completed. Passing to Creative Copywriter.', '', 3);

        let content = {};
        let approved = false;
        let editorFeedback = "";
        let maxAttempts = 2; // Allow 1 regeneration if rejected

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            if (attempt > 1) {
                sendLog('Agent 2', `REGENERATING Drafts (Attempt ${attempt}). Fixing Editor Issues...`, 'var(--warning)', 3);
            } else {
                sendLog('Agent 2', 'Drafting Core Content... Adapting tone to: ' + factSheet.tone, 'var(--warning)', 3);
            }

            const agent2SystemPrompt = `You are a creative AI agent called "Copywriter".
Your job is to generate high-quality, targeted marketing content from a structured fact sheet.

Rules:
- ❌ NO NEW FACTS: DO NOT invent features, numbers, entity names, or events. If it isn't in the fact sheet, omit it entirely!
- ❌ NO ASSUMPTIONS: Do not guess context that is not provided.
- Adapt your personality to the requested "tone" in the fact sheet (e.g. Analytical if Technical, Persuasive if Marketing).
- Output ONLY valid JSON.`;

            const agent2PromptA = `Using the following fact sheet, generate content.
${editorFeedback ? `\nCRITICAL FIXES NEEDED FROM PREVIOUS ATTEMPT:\n${editorFeedback}\n` : ""}

FACT SHEET:
${JSON.stringify(factSheet, null, 2)}

Generate exactly these 4 keys:
1. "blog" — 400 words, markdown format. Structure: Hook/Problem -> Solution -> Technical Analysis -> Conclusion.
2. "social" — 5 Twitter/X posts thread. Hook on post 1, clean storytelling arc, no random stats.
3. "email" — 2-4 line teaser, click-focused, hook + curiosity.
4. "linkedin" — 100 words, storyteller tone + insight. Line breaks for readability.

Return pure JSON with EXACTLY these 4 keys.`;

            const agent2PromptB = `Using the following fact sheet, generate content.
${editorFeedback ? `\nCRITICAL FIXES NEEDED FROM PREVIOUS ATTEMPT:\n${editorFeedback}\n` : ""}

FACT SHEET:
${JSON.stringify(factSheet, null, 2)}

Generate exactly these 3 keys:
1. "instagram" — array of exactly 5 strings (visual captions, engaging hook, emoji ok).
2. "flashcards" — array of exactly 5 objects each with "q" and "a" string keys.
3. "insights" — array of exactly 5 short bullet strings (key takeaways).

Return pure JSON with EXACTLY these 3 keys.`;

            const [contentA, contentB] = await Promise.all([
                callLLM(agent2SystemPrompt, agent2PromptA),
                callLLM(agent2SystemPrompt, agent2PromptB)
            ]);

            content = { ...contentA, ...contentB, _tone: factSheet.tone };
            res.write(`data: ${JSON.stringify({ type: 'drafts', data: content })}\n\n`);

            // --- STEP 4 & 5: NLP / Validation ---
            sendLog('System', 'Executing local NLP Keyword Consistency check...', '', 4);
            const blogDoc = nlp(content.blog || content.blog_post || "");
            const textKeywords = blogDoc.topics().out('array').map(w => w.toLowerCase());

            let missingFeatures = [];
            if (factSheet.key_features) {
                const keyFeatures = Array.isArray(factSheet.key_features) ? factSheet.key_features : [factSheet.key_features];
                keyFeatures.forEach(feature => {
                    if (!textKeywords.some(kw => feature.toLowerCase().includes(kw) || kw.includes(feature.toLowerCase()))) {
                        missingFeatures.push(feature);
                    }
                });
            }
            if (missingFeatures.length > 0) {
                sendLog('NLP Engine', `Warning: Blog might be missing strict mention of: ${missingFeatures.join(', ')}`, 'var(--warning)', 4);
            }

            sendLog('Agent 3', 'Checking Hallucinations vs Fact-Sheet...', 'var(--success)', 5);

            const agent3SystemPrompt = `You are "Editor-in-Chief". Review the generated content against the Fact Sheet.
Rules:
- Detect Hallucinations: If any name, company, metric, or event is mentioned that is NOT explicitly isolated in the Fact Sheet fields, it is a hallucination.
- Output ONLY valid JSON with keys: "status" ("approved" or "rejected"), "issues" (array of exact string errors), "corrections" (array), "confidence_score" (float 0.0-1.0)`;

            const agent3UserPrompt = `FACT SHEET:
${JSON.stringify(factSheet, null, 2)}

GENERATED CONTENT:
${JSON.stringify(content, null, 2)}

Did the Copywriter invent any facts, numbers, or names? If yes, status MUST be rejected.`;

            const review = await callLLM(agent3SystemPrompt, agent3UserPrompt);

            res.write(`data: ${JSON.stringify({ type: 'log', log: { agent: 'Agent 3', msg: `Confidence Score: ${review.confidence_score}`, color: 'var(--success)', step: 5 } })}\n\n`);

            if (review.status === 'rejected') {
                sendLog('Agent 3', `REJECTED: ${review.issues[0]}`, 'var(--accent)', 5);
                editorFeedback = review.instructions || review.corrections?.join('. ') || review.issues?.join('. ');
                if (attempt === maxAttempts) {
                    sendLog('System', 'Max attempts reached. Returning rejected draft.', '', 6);
                }
            } else {
                sendLog('Agent 3', `APPROVED. Content is fact-aligned and high-quality!`, 'var(--success)', 5);
                approved = true;
                break;
            }
        }

        sendLog('System', 'Campaign generation workflow complete.', '', 6);
        res.write(`data: ${JSON.stringify({ type: 'complete' })}\n\n`);

    } catch (err) {
        console.error("AI Generation Error:", err);
        sendLog('System', `Workflow Error: ${err.message}`, 'var(--accent)', 1);
        res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
    }

    res.end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
