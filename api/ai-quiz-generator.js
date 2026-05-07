/**
 * AI Quiz Generator API
 * Generates quiz questions using Azure OpenAI GPT-4
 */

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

    console.log('[AI Quiz Generator] Generating quiz:', { topic, questionCount, difficulty, subject });

    // Azure OpenAI configuration
    const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY;
    const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
    const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o';

    if (!AZURE_OPENAI_KEY || !AZURE_OPENAI_ENDPOINT) {
      console.error('[AI Quiz Generator] Missing Azure OpenAI credentials');
      return res.status(500).json({ success: false, error: 'AI service not configured' });
    }

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

    // Call Azure OpenAI API
    const apiUrl = `${AZURE_OPENAI_ENDPOINT}openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2024-02-15-preview`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_KEY
      },
      body: JSON.stringify({
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
        top_p: 0.95
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI Quiz Generator] Azure OpenAI error:', errorText);
      throw new Error(`Azure OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from Azure OpenAI');
    }

    const content = data.choices[0].message.content.trim();
    console.log('[AI Quiz Generator] Raw response:', content.substring(0, 200));

    // Parse JSON response
    let questions;
    try {
      // Remove markdown code blocks if present
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      
      questions = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('[AI Quiz Generator] JSON parse error:', parseError);
      console.error('[AI Quiz Generator] Content:', content);
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
