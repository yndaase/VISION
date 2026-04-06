import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { studentResponses } = req.body; // Array of { question, studentAnswer, markScheme }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      You are the "Vision Education 2026 WASSCE Chief Examiner".
      Mark the following student Theory (Part B) responses against the provided mark schemes.
      
      Evaluation Rules:
      1. Be fair but strict (WASSCE standard).
      2. Award points based on the 'desc' in the markScheme.
      3. Provide a constructive "Chief Examiner's Critique" for EACH answer.
      
      Student Responses:
      ${JSON.stringify(studentResponses, null, 2)}
      
      Return ONLY a JSON array of results:
      [
        {
          "questionId": number,
          "score": number (total points),
          "maxScore": number (total markScheme points),
          "critique": "Personalized feedback focusing on what was missed or done well."
        }
      ]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean JSON from potential markdown backticks
    const jsonStr = text.replace(/```json|```/g, "").trim();
    const markResults = JSON.parse(jsonStr);

    return res.status(200).json(markResults);
  } catch (error) {
    console.error('AI Marking Engine Error:', error);
    return res.status(500).json({ error: 'Failed to mark the exam.' });
  }
}
