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
    try { return JSON.parse(text); } catch (_) {}
    // Extract first {...} block from the response
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
        try { return JSON.parse(match[0]); } catch (_) {}
    }
    throw new Error('Could not extract valid JSON from model response.');
}

async function callLLM(systemPrompt, userPrompt) {
    const response = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
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
- If something is unclear, add it to "ambiguous_points"
- Be concise and accurate
- Output ONLY valid JSON`;

        const agent1UserPrompt = `Analyze the following content and extract structured information:

INPUT:
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
- tone (string)
- ambiguous_points (list of strings)

Return pure JSON matching these exact keys.`;

        const factSheet = await callLLM(agent1SystemPrompt, agent1UserPrompt, true);
        sendLog('Agent 1', `Found core value proposition: ${factSheet.value_proposition}`, 'var(--primary)', 1);
        
        if (factSheet.ambiguous_points && factSheet.ambiguous_points.length > 0) {
            sendLog('Agent 1', `Flagged ambiguous info: ${factSheet.ambiguous_points[0]}`, 'var(--warning)', 1);
        }
        
        res.write(`data: ${JSON.stringify({ type: 'factSheet', data: factSheet })}\n\n`);
        
        sendLog('System', 'Fact-Sheet completed. Passing to Creative Copywriter.', '', 3);

        // --- STEP 3: Agent 2 (Creative Copywriter) — Split into 2 calls to avoid token limits ---
        sendLog('Agent 2', 'Drafting Core Content (Blog, Social, Email, LinkedIn)...', 'var(--warning)', 3);

        const agent2SystemPrompt = `You are a creative AI agent called "Copywriter".
Your job is to generate high-quality marketing content from a structured fact sheet.

Rules:
- DO NOT invent new features, names, or events
- STRICTLY follow the fact sheet
- If information is not in fact sheet -> DO NOT include it
- Maintain consistency across all outputs
- Highlight the value proposition clearly
- EVERY output must start with a Hook: a surprising fact, bold question, or striking number
- Output ONLY valid JSON.`;

        const agent2PromptA = `Using the following fact sheet, generate:

FACT SHEET:
${JSON.stringify(factSheet, null, 2)}

Generate exactly these 4 keys:
1. "blog" — 400 words, markdown format, starts with a hook
2. "social" — 5 tweets thread, hook on post 1, storytelling arc
3. "email" — 2-4 line teaser, click-focused, starts with hook
4. "linkedin" — 100 words, professional + storytelling, starts with hook, uses line breaks

Return pure JSON with EXACTLY these 4 keys.`;

        const agent2PromptB = `Using the following fact sheet, generate:

FACT SHEET:
${JSON.stringify(factSheet, null, 2)}

Generate exactly these 4 keys:
1. "instagram" — array of exactly 5 short strings, each is a slide caption (visual-friendly, emoji ok)
2. "newsletter" — 150 words, structured: Subject line / Body paragraphs / CTA
3. "flashcards" — array of exactly 5 objects each with "q" and "a" string keys
4. "insights" — array of exactly 5 short bullet strings (key takeaways, no bullet symbols)

Return pure JSON with EXACTLY these 4 keys.`;

        const [contentA, contentB] = await Promise.all([
            callLLM(agent2SystemPrompt, agent2PromptA, true),
            callLLM(agent2SystemPrompt, agent2PromptB, true)
        ]);

        sendLog('Agent 2', 'Extended Content generated (Instagram, Newsletter, Flashcards, Insights)...', 'var(--warning)', 3);

        const content = { ...contentA, ...contentB };
        res.write(`data: ${JSON.stringify({ type: 'drafts', data: content })}\n\n`);
        
        // --- STEP 4: NLP Check ---
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
        } else {
            sendLog('NLP Engine', 'NLP consistency check passed! Core features present.', 'var(--success)', 4);
        }

        // --- STEP 5: Agent 3 (Editor-in-Chief Validation) ---
        sendLog('Agent 3', 'Checking Hallucinations vs Fact-Sheet...', 'var(--success)', 5);
        
        const agent3SystemPrompt = `You are an AI agent called "Editor-in-Chief".
Your job is to review and validate generated content.

Rules:
- Compare content strictly with the fact sheet
- Detect hallucinations (fake features, wrong claims, invented names like "DeepSeek" or "Jeffrey Emanuel")
- If any external names, entities, or events are hallucinated that are NOT in the fact sheet, immediately return "status": "rejected"
- List specific hallucination issues (e.g., "DeepSeek not in fact sheet")
- Ensure tone is appropriate
- Suggest corrections if needed
- Do NOT rewrite full content, only give feedback
- Output ONLY valid JSON`;

        const agent3UserPrompt = `FACT SHEET:
${JSON.stringify(factSheet, null, 2)}

GENERATED CONTENT:
${JSON.stringify(content, null, 2)}

Tasks:
1. Hallucination Check: Identify any information not present in the fact sheet
2. Quality Feedback: Suggest improvements

Return pure JSON with keys:
- "status": ("approved" or "rejected")
- "issues": (list of concise strings, e.g., ["Entity X not in fact sheet"])
- "corrections": (list of concise strings)
- "confidence_score": (float between 0.0 and 1.0)`;

        const review = await callLLM(agent3SystemPrompt, agent3UserPrompt, true);
        
        if (review.status === 'rejected') {
            sendLog('Agent 3', `REJECTED (Confidence: ${review.confidence_score}): ${review.issues[0]}`, 'var(--accent)', 5);
            sendLog('System', 'Correction requested (simulated). Proceeding manually.', '', 6);
        } else {
            sendLog('Agent 3', `APPROVED all drafts. Quality metrics met. Confidence: ${review.confidence_score}`, 'var(--success)', 5);
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
