// Optional Google Gemini provider. Only used when GEMINI_API_KEY is set; any
// failure (quota, network, timeout) falls back to the local engine.

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

const isConfigured = () => Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here');

const generate = async ({ system, messages, maxTokens = 1200 }) => {
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
        const res = await fetch(`${ENDPOINT}/${model}:generateContent`, {
            method: 'POST',
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: system }] },
                contents: messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
                generationConfig: { temperature: 0.6, maxOutputTokens: maxTokens }
            })
        });
        if (!res.ok) {
            const body = await res.text();
            throw new Error(`Gemini ${res.status}: ${body.slice(0, 200)}`);
        }
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('').trim();
        if (!text) throw new Error('Gemini returned an empty response');
        return text;
    } finally {
        clearTimeout(timer);
    }
};

module.exports = { isConfigured, generate, name: 'gemini' };
