/**
 * AI Quiz Generator API
 * Generates quiz questions using Groq (openai/gpt-oss-120b)
 * Same model as Vision AI Chat (ai.visionedu.online)
 */

const GROQ_API_KEY_QG = process.env.GROQ_API_KEY;
const GROQ_MODEL_QG = "openai/gpt-oss-120b";

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { topic, questionCount = 10, difficulty = 'medium', subject = 'general' } = req.body;

    if (!topic) {
      return res.status(400).json({ success: false, error: 'Topic is required' });
    }

    if (!GROQ_API_KEY_QG) {
      console.error('[AI Quiz Generator] Missing GROQ_API_KEY');
      return res.status(500).json({ success: false, error: 'AI service not configured. Please set GROQ_API_KEY in Vercel environment variables.' });
    }

    console.log('[AI Quiz Generator] Generating quiz:', { topic, questionCount, difficulty, subject });

    // Create prompt for quiz generation
    const prompt = `You are an expert educator creating a ${difficulty} level quiz on "${topic}" for ${subject} students.

Generate exactly ${questionCount} multiple-choice questions following these requirements:

1. Each question must have 4 options (A, B, C, D)
2. Questions should be clear, educational, and appropriate for ${difficulty} difficulty
3. Include a mix of conceptual and application-based questions
4. Ensure only ONE correct answer per question
5. Make distractors (wrong answers) plausible but clearly incorrect

Return ONLY a valid JSON array with this exact structure:
[
  {
    "question": "Question text here?",
    "type": "multiple_choice",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "points": 1
  }
]

Important:
- correctAnswer is 0-based index (0=A, 1=B, 2=C, 3=D)
- Do not include any markdown, explanations, or text outside the JSON array
- Ensure valid JSON syntax`;

    // Call Groq API
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY_QG}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL_QG,
        messages: [
          {
            role: 'system',
            content: 'You are an expert educator who creates high-quality educational quiz questions. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI Quiz Generator] Groq API error:', errorText);
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from Groq');
    }

    // Handle reasoning model: content may be in reasoning field
    const msg = data.choices[0].message;
    const rawContent = (msg.content || msg.reasoning || '').trim();

    console.log('[AI Quiz Generator] Raw response:', rawContent.substring(0, 200));

    // Parse JSON response
    let questions;
    try {
      // Remove markdown code blocks if present
      let jsonString = rawContent
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      // Fallback: extract JSON array from text (handles reasoning model prose)
      if (!jsonString.startsWith('[')) {
        const arrMatch = jsonString.match(/(\[[\s\S]*\])/);
        if (arrMatch) jsonString = arrMatch[1];
      }

      questions = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('[AI Quiz Generator] JSON parse error:', parseError);
      console.error('[AI Quiz Generator] Content:', rawContent);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Validate questions
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('AI did not generate valid questions array');
    }

    // Validate each question structure
    const validatedQuestions = questions.map((q, index) => {
      if (!q.question || !Array.isArray(q.options) || q.options.length < 2) {
        console.warn(`[AI Quiz Generator] Invalid question at index ${index}, skipping`);
        return null;
      }

      return {
        question: q.question,
        type: q.type || 'multiple_choice',
        options: q.options,
        correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
        points: q.points || 1
      };
    }).filter(Boolean);

    if (validatedQuestions.length === 0) {
      throw new Error('No valid questions generated');
    }

    console.log('[AI Quiz Generator] ✅ Generated', validatedQuestions.length, 'questions');

    return res.status(200).json({
      success: true,
      questions: validatedQuestions,
      metadata: {
        topic,
        difficulty,
        subject,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[AI Quiz Generator] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate quiz'
    });
  }
}
