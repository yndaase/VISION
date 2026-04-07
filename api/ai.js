import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

const MODEL_PRIMARY = "gemini-2.5-flash";
const MODEL_FALLBACK = "gemini-2.5-flash-lite";

/**
 * AI Content Generation with Automatic Fallback
 * Handles 503 (High Demand) errors by switching to a reliable backup model.
 */
async function safeGenerateContent(contents) {
  try {
    // Attempt primary high-performance model
    return await ai.models.generateContent({
      model: MODEL_PRIMARY,
      contents
    });
  } catch (error) {
    const errorMsg = error.message.toLowerCase();
    // Check if error is due to high demand (503 / UNAVAILABLE)
    if (errorMsg.includes("503") || errorMsg.includes("unavailable") || errorMsg.includes("demand")) {
      console.warn(`[AI Primary Busy]: ${MODEL_PRIMARY} at capacity. Falling back to ${MODEL_FALLBACK}.`);
      return await ai.models.generateContent({
        model: MODEL_FALLBACK,
        contents
      });
    }
    throw error; // If it's a 400 or other terminal error, propagate it
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
    return res.status(500).json({ error: `AI System Error: ${error.message}` });
  }
}

// --- Handlers ---

async function handleHelp(data, res) {
  const { question, subject, topic, userMessage } = data;
  const prompt = `You are the Vision Education AI Academic Assistant. Subject: ${subject}. Topic: ${topic}. Question: ${question}. Provide a HINT or CONCEPT EXPLANATION for: "${userMessage}". Keep it short and don't give the final answer.`;
  const contents = [{ role: "user", parts: [{ text: prompt }] }];
  const response = await safeGenerateContent(contents);
  return res.status(200).json({ helpText: response.text });
}

async function handlePlanner(data, res) {
  const { subject, accuracy, name } = data;
  const prompt = `You are the "Vision Education 2026 WASSCE Academic Strategist". A student named ${name} has ${accuracy}% accuracy in ${subject}. Generate a "Today's Study Mission" JSON: { "topic": "Name", "tasks": ["..."], "motivation": "...", "difficulty": "..." }`;
  const contents = [{ role: "user", parts: [{ text: prompt }] }];
  const response = await safeGenerateContent(contents);
  const text = response.text.replace(/```json|```/g, "").trim();
  return res.status(200).json(JSON.parse(text));
}

async function handleVision(data, res) {
  const { imageBase64, mimeType, userMessage, subject } = data;
  const parts = [{ text: `You are the Vision Education AI Learning Specialist. Analyze this ${subject} material: "${userMessage}"` }];
  if (imageBase64) parts.push({ inlineData: { data: imageBase64, mimeType: mimeType || "image/jpeg" } });
  const contents = [{ role: "user", parts }];
  const response = await safeGenerateContent(contents);
  return res.status(200).json({ analysis: response.text });
}

async function handleGenerateQuestions(data, res) {
  const { subject, dateSeed } = data;
  const prompt = `You are a Senior WASSCE Examiner. Generate a Daily AI Mock for ${subject} on ${dateSeed}. Return JSON: { "mcqs": [...], "theory": [...] }. Match the official Vision Edu schema.`;
  const contents = [{ role: "user", parts: [{ text: prompt }] }];
  const response = await safeGenerateContent(contents);
  const text = response.text.replace(/```json|```/g, "").trim();
  return res.status(200).json(JSON.parse(text));
}

async function handleMarkExam(data, res) {
  const { studentResponses } = data;
  const prompt = `You are the WASSCE Chief Examiner. Mark these responses against schemes: ${JSON.stringify(studentResponses)}. Return JSON array of { questionId, score, maxScore, critique }.`;
  const contents = [{ role: "user", parts: [{ text: prompt }] }];
  const response = await safeGenerateContent(contents);
  const text = response.text.replace(/```json|```/g, "").trim();
  return res.status(200).json(JSON.parse(text));
}
