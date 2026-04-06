import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is missing from Vercel Environment Variables. Please add it to your project settings and redeploy." });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: "v1" });
    
    const result = await model.generateContent("Respond with only the word: SUCCESS");
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ 
        status: "success", 
        message: "AI Brain is Linked & Functional!",
        rawResponse: text,
        diagnosticInfo: {
            apiKeyPresent: true,
            modelUsed: "gemini-1.5-flash",
            apiVersion: "v1"
        }
    });
  } catch (error) {
    console.error("AI Diagnostic Error:", error);
    return res.status(500).json({ 
        status: "error", 
        message: "AI Brain Linkage Failed.",
        errorDetails: error.message,
        errorStack: error.stack,
        diagnosticInfo: {
            apiKeyPresent: true,
            modelUsed: "gemini-1.5-flash",
            apiVersion: "v1"
        },
        troubleshootingStep: "Check your Google Cloud Console for the 'Generative Language API' and ensure it is 'Enabled' for this project."
    });
  }
}
