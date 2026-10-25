/**
 * Diagnostic test for active models
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let test120b = null;
  let test20b = null;

  if (process.env.GROQ_API_KEY) {
    try {
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          messages: [{ role: 'user', content: 'Say hello Vision AI' }],
          max_tokens: 30
        })
      });
      const data = await resp.json();
      test120b = { status: resp.status, ok: resp.ok, text: data.choices?.[0]?.message?.content || data };
    } catch (err) {
      test120b = { error: err.message };
    }

    try {
      const resp2 = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-20b',
          messages: [{ role: 'user', content: 'Say hello Vision AI' }],
          max_tokens: 30
        })
      });
      const data2 = await resp2.json();
      test20b = { status: resp2.status, ok: resp2.ok, text: data2.choices?.[0]?.message?.content || data2 };
    } catch (err) {
      test20b = { error: err.message };
    }
  }

  return res.status(200).json({
    test120b,
    test20b,
    timestamp: new Date().toISOString()
  });
}
