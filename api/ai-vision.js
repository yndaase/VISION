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

    // Construct the multimodal request with the provided image
    const prompt = `
      Instructions:
      You are the Vision Education AI Learning Specialist. You have been given an image of a math problem or diagram. 
      Identify the mathematical concepts shown (e.g., Geometry, Trigonometry, Graphs) and provide a step-by-step guidance.
      Do not just give the final answer; explain the "Why" and "How" so the student learns the method.
      Be encouraging and use simple English.

      Student Request: "${userMessage || 'Can you help me solve this math problem in the image?'}"

      Expert Visual Analysis:
    `;

    const parts = [
      { text: prompt }
    ];

    if (imageBase64) {
      parts.push({
        inlineData: {
          data: imageBase64, // Expecting base64 string without the "data:image/x;base64," prefix
          mimeType: mimeType || "image/jpeg"
        }
      });
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
