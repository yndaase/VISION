import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { question, options, subject, topic, userMessage } = req.body;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('AIzaSy')) { // Basic format check
    if (!apiKey) return res.status(500).json({ error: 'AI key not configured in environment variables.' });
  } else {
    return res.status(500).json({ error: 'AI key format appears invalid.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey, "v1");
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
    const text = response.text();

    if (!text) {
      return res.status(200).json({
        helpText: "I'm sorry, I couldn't generate a specific hint for this question. Try rephrasing your request!"
      });
    }
    
    return res.status(200).json({
      helpText: text
    });

  } catch (error) {
    console.error('AI Help Error:', error);
    
    // Check for specific safety or quota errors
    const errorMessage = error.message || 'AI help service failed.';
    if (errorMessage.includes('safety')) {
      return res.status(200).json({ 
        helpText: "I'm sorry, but I can't provide help for this specific request due to safety guidelines. Let's try another topic!" 
      });
    }
    
    if (errorMessage.includes('quota')) {
      return res.status(500).json({ error: 'AI quota exceeded. Please try again later.' });
    }

    return res.status(500).json({ error: `AI System Error: ${errorMessage}` });
  }
}
