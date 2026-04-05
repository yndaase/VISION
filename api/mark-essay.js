/**
 * API: Mark Essay with Gemini AI
 * api/mark-essay.js
 */
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { question, userAnswer, markScheme, modelAnswer } = req.body;

  if (!userAnswer || userAnswer.trim().length < 10) {
    return res.status(400).json({ error: 'Answer too short for AI marking.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing in environment variables.");
    return res.status(500).json({ 
      success: false, 
      error: 'AI Configuration Missing',
      message: 'Please add GEMINI_API_KEY to your environment variables to enable AI grading.'
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: "You are a senior WAEC Integrated Science Examiner. Your task is to grade student theory answers accurately based on a provided Mark Scheme and Model Answer. Be encouraging but strict on scientific accuracy."
    });

    const prompt = `
      QUESTION: ${question}
      
      STUDENT ANSWER: "${userAnswer}"
      
      OFFICIAL MARK SCHEME: ${JSON.stringify(markScheme)}
      
      OFFICIAL MODEL ANSWER: ${modelAnswer}

      TASK:
      1. Analyze the student's answer against the mark scheme.
      2. Assign a numerical score based on the points defined in the mark scheme.
      3. Categorize the performance into a "verdict" (e.g., Excellent, Good, Average, Needs Improvement).
      4. Provide actionable feedback pointing out exactly what they got right and what scientific details they missed.
      
      Return ONLY a JSON object with this structure:
      {
        "score": number,
        "maxPoints": number,
        "verdict": "string",
        "feedback": "string",
        "matchedKeys": ["string"]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean JSON in case AI adds markdown blocks
    const cleanedText = text.replace(/```json|```/g, "").trim();
    const resultJson = JSON.parse(cleanedText);

    return res.status(200).json({
      success: true,
      ...resultJson
    });

  } catch (error) {
    console.error('Gemini Marking Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'AI Service Error',
      details: error.message 
    });
  }
}
