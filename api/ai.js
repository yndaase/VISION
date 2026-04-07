import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

const MODEL_PRIMARY = "gemini-2.5-flash";
const MODEL_FALLBACK = "gemini-2.5-flash-lite";

/**
 * AI Content Generation with Automatic Fallback
 */
async function safeGenerateContent(contents) {
  try {
    return await ai.models.generateContent({
      model: MODEL_PRIMARY,
      contents
    });
  } catch (error) {
    const errorMsg = error.message.toLowerCase();
    if (errorMsg.includes("503") || errorMsg.includes("unavailable") || errorMsg.includes("demand")) {
      console.warn(`[AI Fallback]: Primary busy, switching to ${MODEL_FALLBACK}`);
      return await ai.models.generateContent({
        model: MODEL_FALLBACK,
        contents
      });
    }
    throw error;
  }
}

/**
 * Robust JSON Extractor
 * Strips AI conversation filler and extracts valid JSON blocks.
 */
function extractJSON(response) {
  const text = response.text;
  try {
    return JSON.parse(text);
  } catch (e) {
    const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (inner) {
        console.error("[JSON Extract Error]: Found block but failed to parse.", text);
        throw new Error("Invalid JSON structure in AI response.");
      }
    }
    console.error("[JSON Extract Error]: No JSON found in response.", text);
    throw new Error("AI failed to provide a structured data response.");
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { type } = req.body;

  try {
    switch (type) {
      case 'help': return await handleHelp(req.body, res);
      case 'planner': return await handlePlanner(req.body, res);
      case 'vision': return await handleVision(req.body, res);
      case 'generate-questions': return await handleGenerateQuestions(req.body, res);
      case 'mark-exam': return await handleMarkExam(req.body, res);
      default: return res.status(400).json({ error: 'Invalid AI request type' });
    }
  } catch (error) {
    console.error(`[AI Hub Error - ${type}]:`, error);
    return res.status(500).json({ error: error.message || "AI System Error" });
  }
}

// --- Handlers ---

async function handleHelp(data, res) {
  const { question, subject, topic, userMessage } = data;
  const prompt = `You are the Vision Education AI Academic Assistant. Subject: ${subject}. Topic: ${topic}. Original Question: ${question}.
  
  Student says: "${userMessage}"
  
  Provide a HINT or CONCEPT EXPLANATION. Do NOT give the final answer. Keep it encouraging and under 150 words.`;
  
  const contents = [{ role: "user", parts: [{ text: prompt }] }];
  const response = await safeGenerateContent(contents);
  return res.status(200).json({ helpText: response.text });
}

async function handlePlanner(data, res) {
  const { subject, accuracy, name } = data;
  const prompt = `Student: ${name}. Performance: ${accuracy}% in ${subject}.
  Generate a Daily Study Mission in JSON:
  {
    "topic": "Specific Topic Name",
    "tasks": ["Small Task 1", "Small Task 2"],
    "motivation": "A punchy motivational quote",
    "difficulty": "Easy"|"Medium"|"Hard"
  }
  JSON ONLY.`;
  
  const contents = [{ role: "user", parts: [{ text: prompt }] }];
  const response = await safeGenerateContent(contents);
  return res.status(200).json(extractJSON(response));
}

async function handleVision(data, res) {
  const { imageBase64, mimeType, userMessage, subject } = data;
  const parts = [{ text: `Vision Education AI Learning Specialist. Material: ${subject}. Request: "${userMessage || 'Explain this material.'}"` }];
  if (imageBase64) parts.push({ inlineData: { data: imageBase64, mimeType: mimeType || "image/jpeg" } });
  
  const contents = [{ role: "user", parts }];
  const response = await safeGenerateContent(contents);
  return res.status(200).json({ analysis: response.text });
}

async function handleGenerateQuestions(data, res) {
  const { subject, dateSeed } = data;
  const prompt = `You are a Senior WASSCE Examiner. Generate a Daily AI Mock for ${subject} on ${dateSeed}.
  Return exactly 5 MCQs and 2 Theory questions in a single JSON object.
  
  Format:
  {
    "mcqs": [
      { "id": 100, "difficulty": "easy"|"medium"|"hard", "topic": "string", "question": "string", "options": { "A": "string", "B": "string", "C": "string", "D": "string" }, "correct": "A"|"B"|"C"|"D" }
    ],
    "theory": [
      { "id": 200, "difficulty": "hard", "topic": "string", "question": "string", "markScheme": "string", "modelAnswer": "string" }
    ]
  }
  STRICT JSON ONLY. NO MARKDOWN. NO CODE BLOCKS.`;
  
  const contents = [{ role: "user", parts: [{ text: prompt }] }];
  const response = await safeGenerateContent(contents);
  return res.status(200).json(extractJSON(response));
}

async function handleMarkExam(data, res) {
  const { studentResponses } = data;
  const prompt = `You are the WASSCE Chief Examiner. Mark these responses: ${JSON.stringify(studentResponses)}.
  Return a JSON ARRAY of results:
  [
    { "questionId": "string", "score": number, "maxScore": number, "critique": "short critique" }
  ]
  JSON ONLY.`;
  
  const contents = [{ role: "user", parts: [{ text: prompt }] }];
  const response = await safeGenerateContent(contents);
  return res.status(200).json(extractJSON(response));
}
