const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

async function main() {
    const factSheet = {
        "product": "Unknown",
        "target_audience": "General",
        "key_features": ["Feature A"],
        "technical_details": [],
        "value_proposition": "Value Prop",
        "constraints": [],
        "uncertainties": [],
        "risks": [],
        "metrics": [],
        "entities": [],
        "events": [],
        "tone": "Marketing",
        "ambiguous_points": []
    };

    const agent2SystemPrompt = `You are a creative AI agent called "Copywriter".
Your job is to generate high-quality, targeted marketing content from a structured fact sheet.

Rules:
- ❌ NO NEW FACTS: DO NOT invent features, numbers, entity names, or events. If it isn't in the fact sheet, omit it entirely!
- ❌ NO ASSUMPTIONS: Do not guess context that is not provided.
- Adapt your personality to the requested "tone" in the fact sheet (e.g. Analytical if Technical, Persuasive if Marketing).
- Output ONLY valid JSON.`;

    const agent2PromptA = `Using the following fact sheet, generate content. Use ONLY what is in the fact sheet.

FACT SHEET:
${JSON.stringify(factSheet, null, 2)}

Generate exactly these 4 keys:
1. "blog" — 400 words, markdown format. Structure: Hook/Problem → Solution → Technical Analysis (mention constraints and uncertainties from fact sheet) → Conclusion.
2. "social" — A 5-post Twitter/X thread. STRICT FORMAT: each post must start with its number like "1/", "2/", etc. Each post is a separate string in an array. Example: ["1/ Logistics companies lose millions daily due to inefficient routing.", "2/ The answer lies in AI..."]
3. "email" — 2-4 line teaser only, click-focused, starts with a hook question or bold claim.
4. "linkedin" — Exactly 120 words. STRICT FORMAT: Start with a bold 1-line Hook. Then 2-3 lines of insight/storytelling grounded in the fact sheet. Mention one constraint or uncertainty. End with a thought-provoking question. Use line breaks between sections.

Return pure JSON with EXACTLY these 4 keys. "social" must be an ARRAY of strings, not a single string.`;

    try {
        const response = await openai.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: agent2SystemPrompt + "\n\nIMPORTANT: Your response must be ONLY a valid JSON object. No markdown fences, no explanations, just raw JSON." },
                { role: "user", content: agent2PromptA }
            ],
            temperature: 0.5
        });
        console.log(response.choices[0].message.content);
    } catch (e) {
        if (e.error && e.error.failed_generation) {
            console.log("Failed output was:", e.error.failed_generation);
        }
        console.error("ERROR", e.message);
    }
}
main();
