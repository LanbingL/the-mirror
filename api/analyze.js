// File: api/analyze.js

export const config = {
    runtime: 'edge', // Runs faster on Vercel's global network
};

export default async function handler(req) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        // 1. Get the base64 image from the frontend
        const { image } = await req.json();

        if (!image) {
            return new Response(JSON.stringify({ error: "No image data received." }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 2. The exact prompt from your latest HTML version
        const promptText = `
        You are a “visual-algorithm interpreter.” Your task is to analyze the image I provide and generate an explanation suitable for the public, helping viewers understand how an algorithm “sees” a person.
        Please output valid JSON ONLY with the following keys:
        1. "raw_scene": Provide 3–5 simple, objective, non-judgmental sentences describing the person and environment. If uncertain, say “uncertain.”
        2. "tags": An array of 10 abstract, atmospheric, algorithmic poetic phrases (3–8 words each), centered on fashion, lifestyle, mood, and visual signals, while avoiding literal descriptors or identity assumptions.
        3. "inner_voice": Write an 80–150-word “algorithm monologue” in a light, non-sarcastic tone (First-Person). Describe what visual features you notice and how you might use them for recommendation/classification. Emphasize statistical guesses.
        4. "receipt": An array of objects representing items detected in the image and their estimated futuristic/market value. Keys: 'item' (string), 'price' (string like '$150'). Include 3-5 items and a 'TOTAL' entry at the end.
        `;

        // 3. Call OpenAI securely using the server-side environment variable
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: promptText },
                            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image}` } }
                        ]
                    }
                ],
                max_tokens: 1000,
                response_format: { "type": "json_object" } // Force valid JSON
            })
        });

        // 4. Handle API Errors
        if (!response.ok) {
            const errorText = await response.text();
            return new Response(JSON.stringify({ error: `OpenAI Error: ${response.status}`, details: errorText }), {
                status: response.status,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 5. Return the result to the frontend
        const data = await response.json();
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: 'Server processing failed', details: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}