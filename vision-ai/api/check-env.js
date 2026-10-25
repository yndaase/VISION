export default async function handler(req, res) {
  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      messages: [{ role: 'user', content: 'What is 5+5? Answer in one word.' }],
      max_tokens: 100
    })
  });
  const data = await resp.json();
  return res.status(200).json(data);
}
