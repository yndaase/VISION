import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { subject, year, questionsCount } = req.body;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'AI key not configured in environment variables.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      You are a Senior WAEC (West African Examinations Council) Examiner for the subject: ${subject}.
      Generate ${questionsCount || 5} theoretical (structured) questions specifically for the WASSCE Core Mathematics exam style.
      Each question must follow the actual Part B format.

      Return ONLY a JSON array with this structure:
      [
        {
          "number": 1,
          "question": "The actual math question text goes here...",
          "subQuestions": ["(a) Sub-question 1", "(b) Sub-question 2"],
          "marks": 12
        }
      ]
    `;

    const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    const text = response.text;
    
    // Clean potential markdown wrapping
    let jsonString = text.trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.split('```json')[1].split('```')[0].trim();
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.split('```')[1].split('```')[0].trim();
    }

    const questions = JSON.parse(jsonString);
    return res.status(200).json({ questions });

  } catch (error) {
    console.error("Gemini GenAI Migration Error:", error);
    return res.status(500).json({ error: `AI System Error (Migration): ${error.message}` });
  }
}
