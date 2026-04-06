import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { imageBase64, mimeType, userMessage, subject } = req.body;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'AI key not configured in environment variables.' });
  }

  // Specialized Subject Personalities
  const subjectContexts = {
    physics: "Elite WASSCE Physics Tutor. Focus: SI unit correctness, formula precision (F=ma, v=u+at, etc.), and step-by-step derivations. WARNING: Proactively warn students about SI unit conversions and Vector vs Scalar traps.",
    chemistry: "Elite WASSCE Chemistry Tutor. Focus: IUPAC naming, reaction mechanisms, and periodic trends. WARNING: Proactively warn students about valence balancing, oxidation states, and state symbols (s, l, g, aq).",
    biology: "Elite WASSCE Biology Tutor. Focus: Detailed diagram labeling, physiological processes, and genetics. WARNING: Proactively warn students about precise terminology (e.g., 'osmosis' vs 'diffusion') and diagram proportions.",
    maths: "Expert WASSCE Mathematics Tutor. Focus: Step-by-step logic, geometric proofs, and algebraic simplification. WARNING: Watch for sign errors and rounding precision.",
    english: "Expert WASSCE English Tutor. Focus: Grammar, essay structure, literature, and reading comprehension. WARNING: Focus on Lexis & Structure pitfalls."
  };

  const currentContext = subjectContexts[subject] || "Expert WASSCE Academic Tutor across all subjects.";

  try {
    const ai = new GoogleGenAI({ apiKey });

    let prompt = "";
    const parts = [];

    if (imageBase64) {
      // Vision Mode
      prompt = `
        Instructions:
        You are the Vision Education AI Learning Specialist. Persona: ${currentContext}
        You have been given an image of an academic problem, diagram, or text regarding ${subject || 'a general subject'}.
        Provide clear, step-by-step guidance. If it's a science subject, be very strict with units and terminology.
        
        Student Message: "${userMessage || 'Help me understand this material.'}"
        Expert Visual Analysis:
      `;
      parts.push({ text: prompt });
      parts.push({
        inlineData: {
          data: imageBase64,
          mimeType: mimeType || "image/jpeg"
        }
      });
    } else {
      // Text-Only Mode
      prompt = `
        Instructions:
        You are the Vision Education AI Tutor. Persona: ${currentContext}
        A student is asking for specialized help in ${subject || 'their studies'}.
        Respond naturally and provide guidance based on the WASSCE syllabus.
        
        Student Message: "${userMessage}"
        Expert Support:
      `;
      parts.push({ text: prompt });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts }]
    });

    const text = response.text;

    if (!text) {
      return res.status(200).json({
        analysis: "I've analyzed the image but couldn't generate a specific mathematical explanation. Please try a clearer photo!"
      });
    }
    
    return res.status(200).json({
      analysis: text
    });

  } catch (error) {
    console.error('Gemini Vision AI Error:', error);
    return res.status(500).json({ error: `Visual Analysis Failed: ${error.message}` });
  }
}
