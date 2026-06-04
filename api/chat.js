export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const systemPrompt = `Eres un asistente de soporte interno de inphonity. Responde en español, profesional y conciso sobre: Alta de línea, Soporte técnico, Cashback, SIM/eSIM, Pagos, Cambios de planes, Roaming, MiFi, App inphonity, Legales.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: messages,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          }
        }),
      }
    );

    const data = await response.json();

    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).json({ message: data.candidates[0].content.parts[0].text });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ message: 'Error procesando respuesta' });
  } catch (error) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ error: error.message });
  }
}
