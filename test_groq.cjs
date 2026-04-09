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

Generate exactly these 3 keys:
1. "instagram" — array of exactly 5 strings (visual captions, engaging hook, emoji ok, each based on a fact sheet item).
2. "flashcards" — array of exactly 5 objects each with "q" and "a" string keys. IMPORTANT: Answers must be COMPLETE and DETAILED, citing specific data from the fact sheet (e.g. list multiple items, not just one word). Bad example: A: "Traffic data". Good example: A: "Real-time traffic data, weather conditions, and last-mile delivery patterns from the fact sheet's technical_details".
3. "insights" — array of exactly 5 strings. Each insight must go BEYOND the obvious. Include: trade-offs, risks, engineering challenges, or unexpected implications pulled from the fact sheet's constraints, uncertainties, and risks fields. Bad: "AI improves delivery times". Good: "Accuracy may degrade during unpredictable events like road closures — a risk explicitly flagged in the system design".

Return pure JSON with EXACTLY these 3 keys.`;

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
