import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { subject, count, studentPerformance } = req.body;

  if (!subject) {
    return res.status(400).json({ error: 'Subject is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'AI key not configured in environment variables.' });
  }

  const genAI = new GoogleGenerativeAI(apiKey, "v1");
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    You are a Senior WAEC (West African Examinations Council) Examiner for the subject: ${subject}.
    Your task is to set "Part B" (Theory/Essay) questions for a 2026 WASSCE Mock Examination.

    CONTEXT:
    The student has just finished the Objective (MCQ) section. 
    Performance Summary: ${JSON.stringify(studentPerformance)}
    
    REQUIREMENTS:
    1. Generate exactly ${count || 3} high-quality, structured essay questions.
    2. Each question must follow WASSCE formatting with sub-parts (e.g., (a), (b), (c)).
    3. Questions should be rigorous and appropriate for high school seniors.
    4. ADAPTIVE LOGIC: If the student performed poorly in specific topics (mentioned in performance summary), focus at least 50% of the theory questions on those topics to test their deep understanding.
    5. For each question, provide:
       - The question text (HTML formatted if needed for bold/italics).
       - A comprehensive mark scheme.
       - A model answer.
       - Total marks for that question.

    OUTPUT FORMAT:
    You must return ONLY a JSON array of objects. Do not include markdown code blocks or additional text.
    Format:
    [
      {
        "id": number (start from 5001),
        "subject": "${subject}",
        "type": "essay",
        "topic": "string",
        "question": "string (with sub-parts (a), (b)...)",
        "markScheme": "string",
        "modelAnswer": "string",
        "marks": number
      }
    ]
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Robust JSON cleaning logic
    let jsonString = text.trim();
    if (jsonString.startsWith("```")) {
        // Remove markdown wrappers if present
        jsonString = jsonString.replace(/^```(json)?/, "").replace(/```$/, "").trim();
    }
    
    const questions = JSON.parse(jsonString);
    return res.status(200).json({ questions });
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    const errorMessage = error.message || 'AI brain timed out.';
    if (errorMessage.includes('safety')) {
        return res.status(500).json({ error: 'AI safety filter blocked question generation. Try another subject.' });
    }
    return res.status(500).json({ error: `AI System Error: ${errorMessage}` });
  }
}
