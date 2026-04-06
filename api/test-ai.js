import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is missing from Vercel Environment Variables. Please add it to your project settings." });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Test a minimal 1.5 Flash call
    const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ role: "user", parts: [{ text: "Respond with only the word: SUCCESS" }] }]
    });

    const text = response.text;

    return res.status(200).json({ 
        status: "success", 
        message: "SDK Migration Successful - GenAI 2.0 Brain is Linked!",
        rawResponse: text,
        diagnosticInfo: {
            apiKeyPresent: true,
            modelUsed: "gemini-2.0-flash",
            sdk: "@google/genai"
        }
    });
  } catch (error) {
    console.error("AI GenAI Migration Diagnostic Error:", error);
    return res.status(500).json({ 
        status: "error", 
        message: "AI SDK Connection Failed.",
        errorDetails: error.message,
        diagnosticInfo: {
            apiKeyPresent: true,
            modelUsed: "gemini-2.0-flash",
            sdk: "@google/genai"
        }
    });
  }
}
