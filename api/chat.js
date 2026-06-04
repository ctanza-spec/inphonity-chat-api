export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const systemPrompt = `Eres un asistente de soporte interno de inphonity, una empresa de telefonía móvil. Tu objetivo es ayudar a agentes del Contact Center a resolver consultas sobre:

ALTA DE LÍNEA:
- Venta asistida, registro web, landing de referidos
- Validaciones: cobertura (código postal), IMEI (*#06#), equipo liberado
- Código de referido (CRÍTICO: no se puede cambiar)
- SIM física ($100, 2-7 días) vs eSIM (inmediata)
- Portabilidad: NIP al 051, proceso 48 hrs hábiles
- Bono portabilidad: aplica de Telcel, Movistar, AT&T, UNEFON (NO Altan Redes)

SOPORTE TÉCNICO:
- Falla de datos: configurar APN (internet.mvno239.com), roaming, forzado de red
- Falla de llamadas: VoLTE iOS/Android, configurar APN IMS
- Falla de SMS
- Bono de GB: error de sistema, promociones caducadas, bono de fidelidad (6 meses)

CASHBACK:
- Bono estándar: 25% precio plan por referido
- Bono promocional: 50% en primeros 7 días
- Cashback residual: desde mes 2, según nivel (5%, 3%, 1%)
- Dispersión mínima: $300, si menos se acumula al viernes
- Si no paga 60 días: se pierde bono y cashback

SIM/eSIM:
- Estados: activa, suspendida, cancelada, bloqueada
- Reposición: SIM extraviada/robada
- Tarjetas físicas: envío 2-7 días

PAGOS:
- SPEI Openpay, Tarjeta crédito/débito, Getnet Santander
- Pago con Cashback, Efectivo (7-Eleven, Walmart)
- Transferencia Santander

CAMBIOS DE PLANES:
- Restricciones según tiempo de contrato
- Promociones activas

ROAMING INTERNACIONAL:
- USA, Canadá, y otros países

MIFI:
- Soporte, recargas, activaciones

APP INPHONITY:
- Gestión de cuenta, pagos, consultas

LEGALES:
- Facturación, políticas, términos

Responde de forma concisa, profesional y en español. Si no tienes información sobre algo, indícalo. Enfócate en ayudar rápidamente.`;

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + GEMINI_API_KEY,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system: {
            parts: [{ text: systemPrompt }]
          },
          contents: messages,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          }
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API error:', data);
      return res.status(response.status).json({ error: data.error?.message || 'API error' });
    }

    if (data.candidates && data.candidates[0]) {
      const aiMessage = data.candidates[0].content.parts[0].text;
      return res.status(200).json({ message: aiMessage });
    } else {
      return res.status(200).json({ message: '❌ Error: no se pudo procesar la respuesta. Intenta de nuevo.' });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}
