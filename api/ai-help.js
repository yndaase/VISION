import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { question, options, subject, topic, userMessage } = req.body;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'AI key not configured in environment variables.' });
  }

  try {
    // Initialize the new GoogleGenAI client (automatically picks up GEMINI_API_KEY from env if needed)
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Instructions:
      You are the Vision Education AI Tutor. A student is taking a WASSCE mock exam and needs help with a specific question. 
      Provide hints, explain concepts, and guide them to the answer without revealing it immediately. 
      Be encouraging and use simple English. Keep responses short and conversational.

      Context:
      SUBJECT: ${subject}
      TOPIC: ${topic}
      QUESTION: ${question}
      OPTIONS: ${JSON.stringify(options)}
      
      Student Request: "${userMessage}"

      Expert Guidance:
    `;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    // The new SDK returns a simplified response object
    const text = response.text;

    if (!text) {
      return res.status(200).json({
        helpText: "I'm processing the data. Please try re-phrasing your question!"
      });
    }
    
    return res.status(200).json({
      helpText: text
    });

  } catch (error) {
    console.error('Gemini GenAI Migration Error:', error);
    const errorMessage = error.message || 'AI tutor failed.';
    if (errorMessage.includes('safety')) {
      return res.status(200).json({ 
        helpText: "I'm sorry, I can't provide help for this specific request due to safety guidelines. Let's try another topic!" 
      });
    }
    return res.status(500).json({ error: `AI System Error (Migration): ${errorMessage}` });
  }
}
