import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { imageBase64, mimeType, userMessage } = req.body;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'AI key not configured in environment variables.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    let prompt = "";
    const parts = [];

    if (imageBase64) {
      // Vision Mode
      prompt = `
        Instructions:
        You are the Vision Education AI Learning Specialist. You have been given an image of a math problem or diagram. 
        Identify the mathematical concepts shown (e.g., Geometry, Trigonometry, Graphs) and provide guidance.
        Student Message: "${userMessage || 'Help me solve this problem.'}"
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
        You are the Vision Education AI Tutor. A student is asking for general help or just saying hi.
        Respond naturally and provide guidance only on what they ask. Do not assume there is an image.
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
