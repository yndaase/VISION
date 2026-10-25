/**
 * Diagnostic endpoint to list ALL active models available for this Groq API key
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let activeModels = [];
  let modelsError = null;

  if (process.env.GROQ_API_KEY) {
    try {
      const resp = await fetch('https://api.groq.com/openai/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        }
      });
      const data = await resp.json();
      if (data.data) {
        activeModels = data.data.map(m => m.id);
      } else {
        modelsError = data;
      }
    } catch (err) {
      modelsError = err.message;
    }
  }

  return res.status(200).json({
    activeModels,
    modelsError,
    timestamp: new Date().toISOString()
  });
}
