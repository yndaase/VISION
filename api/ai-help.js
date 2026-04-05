import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { question, options, subject, topic, userMessage } = req.body;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'AI key not configured.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: "You are the Vision Education AI Tutor. A student is taking a WASSCE mock exam and needs help with a specific question. Provide hints, explain concepts, and guide them to the answer without revealing it immediately. Be encouraging and use simple English. Keep responses short and conversational."
    });

    const prompt = `
      SUBJECT: ${subject}
      TOPIC: ${topic}
      QUESTION: ${question}
      OPTIONS: ${JSON.stringify(options)}
      
      STUDENT REQUEST: "${userMessage}"

      Please provide help based on the student's request. If they haven't asked a specific question yet, just give a helpful hint about the topic.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return res.status(200).json({
      helpText: response.text()
    });

  } catch (error) {
    console.error('AI Help Error:', error);
    return res.status(500).json({ error: 'AI help service failed.' });
  }
}
