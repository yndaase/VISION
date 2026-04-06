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

    // Specialized Subject Personalities for Exams
    const subjectContexts = {
      physics: "Expert WASSCE Physics Tutor. Focus: SI units, formula hints (v=u+at, E=mc^2), and mechanics concepts.",
      chemistry: "Expert WASSCE Chemistry Tutor. Focus: Reaction hints, periodic trends, and IUPAC nomenclature.",
      biology: "Expert WASSCE Biology Tutor. Focus: Physiological processes, diagram hints, and genetic terminology.",
      maths: "Expert WASSCE Mathematics Tutor. Focus: Step-by-step logic, geometric theorems, and algebra tricks.",
      english: "Expert WASSCE English Tutor. Focus: Grammar rules, Lexis/Structure guidance, and literature hints."
    };

    const currentContext = subjectContexts[subject] || "Expert WASSCE Academic Assistant.";

    const prompt = `
      Instructions:
      You are the Vision Education AI Academic Assistant. Persona: ${currentContext}
      A student is taking a WASSCE mock exam and needs a HINT or CONCEPT EXPLANATION. 
      Provide clear guidance across any subject. Be encouraging and use simple English.
      Keep responses short and conversational. Do NOT give the absolute final answer unless it's a very simple conceptual question.

      Context:
      SUBJECT: ${subject}
      TOPIC: ${topic}
      QUESTION: ${question}
      OPTIONS: ${JSON.stringify(options)}
      
      Student Request: "${userMessage}"

      Expert Guidance:
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
