import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { subject, dateSeed } = req.body; // dateSeed like '2026-04-06'

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      You are the "Vision Education 2026 WASSCE Senior Examiner".
      Generate a "Daily AI Mock Exam" for the subject: ${subject}.
      Target Date: ${dateSeed}.
      
      Generate exactly:
      - 5 high-yield MCQ (Objective) questions.
      - 2 high-yield Theory (Part B) questions.
      
      Follow these structures EXACTLY:
      
      MCQ Schema:
      {
        "id": number (start from 8001),
        "difficulty": "easy" | "medium" | "hard",
        "topic": "Topic Name",
        "question": "Question text (HTML supported)",
        "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
        "correct": "Letter",
        "workings": "Detailed step-by-step math/logic",
        "protip": "Examiner's Secret: common mistake to avoid"
      }

      Theory Schema:
      {
        "id": number (start from 9001),
        "difficulty": "medium" | "hard",
        "topic": "Topic Name",
        "question": "Question text with parts (a), (b), etc.",
        "markScheme": [
          { "key": "unique_string", "points": number, "desc": "What to look for" }
        ],
        "modelAnswer": "Full detailed answer"
      }

      Return ONLY a JSON object:
      {
        "subject": "${subject}",
        "date": "${dateSeed}",
        "mcqs": [...],
        "theory": [...]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean JSON from potential markdown backticks
    const jsonStr = text.replace(/```json|```/g, "").trim();
    const mockData = JSON.parse(jsonStr);

    return res.status(200).json(mockData);
  } catch (error) {
    console.error('AI Question Generator Error:', error);
    return res.status(500).json({ error: 'Failed to generate today\'s exam.' });
  }
}
