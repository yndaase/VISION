import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { subject, accuracy, name } = req.body;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      You are the "Vision Education 2026 WASSCE Academic Strategist". 
      A student named ${name || 'Explorer'} has a current accuracy of ${accuracy}% in ${subject}.
      
      Generate a "Today's Study Mission" to help them achieve an A1 in the 2026 WASSCE.
      Focus on high-yield topics from the WAEC Chief Examiner's 2025 Report.
      
      Return ONLY a JSON object with this structure:
      {
        "topic": "Specific Syllabus Topic Heading",
        "tasks": ["Task 1: Read/Watch X", "Task 2: Solve 5 past questions on Y", "Task 3: Summarize Z"],
        "motivation": "A short, powerful WASSCE-focused motivational tip.",
        "difficulty": "Easy" | "Medium" | "Hard"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean JSON from potential markdown backticks
    const jsonStr = text.replace(/```json|```/g, "").trim();
    const plan = JSON.parse(jsonStr);

    return res.status(200).json(plan);
  } catch (error) {
    console.error('AI Planner Error:', error);
    return res.status(500).json({ 
        error: 'Failed to generate your mission.',
        topic: "General Revision",
        tasks: ["Review your weakest subject", "Attempt one Mock Exam", "Review Chief Examiner reports"],
        motivation: "Keep pushing, every session counts toward your A1!",
        difficulty: "Medium"
    });
  }
}
