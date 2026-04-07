import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });
const model = "gemini-2.5-flash"; // Upgraded to latest high-performance model

export default async function handler(req, res) {
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
  const { question, options, subject, topic, userMessage } = data;
  const prompt = `You are the Vision Education AI Academic Assistant. Subject: ${subject}. Topic: ${topic}. Question: ${question}. Provide a HINT or CONCEPT EXPLANATION for: "${userMessage}". Keep it short and don't give the final answer.`;
  const response = await ai.models.generateContent({ model, contents: [{ role: "user", parts: [{ text: prompt }] }] });
  return res.status(200).json({ helpText: response.text() });
}

async function handlePlanner(data, res) {
  const { subject, accuracy, name } = data;
  const prompt = `You are the "Vision Education 2026 WASSCE Academic Strategist". A student named ${name} has ${accuracy}% accuracy in ${subject}. Generate a "Today's Study Mission" JSON: { "topic": "Name", "tasks": ["..."], "motivation": "...", "difficulty": "..." }`;
  const response = await ai.models.generateContent({ model, contents: [{ role: "user", parts: [{ text: prompt }] }] });
  return res.status(200).json(JSON.parse(response.text().replace(/```json|```/g, "").trim()));
}

async function handleVision(data, res) {
  const { imageBase64, mimeType, userMessage, subject } = data;
  const parts = [{ text: `You are the Vision Education AI Learning Specialist. Analyze this ${subject} material: "${userMessage}"` }];
  if (imageBase64) parts.push({ inlineData: { data: imageBase64, mimeType: mimeType || "image/jpeg" } });
  const response = await ai.models.generateContent({ model, contents: [{ role: "user", parts }] });
  return res.status(200).json({ analysis: response.text() });
}

async function handleGenerateQuestions(data, res) {
  const { subject, dateSeed } = data;
  const prompt = `You are a Senior WASSCE Examiner. Generate a Daily AI Mock for ${subject} on ${dateSeed}. Return JSON: { "mcqs": [...], "theory": [...] }. Match the official Vision Edu schema.`;
  const response = await ai.models.generateContent({ model, contents: [{ role: "user", parts: [{ text: prompt }] }] });
  return res.status(200).json(JSON.parse(response.text().replace(/```json|```/g, "").trim()));
}

async function handleMarkExam(data, res) {
  const { studentResponses } = data;
  const prompt = `You are the WASSCE Chief Examiner. Mark these responses against schemes: ${JSON.stringify(studentResponses)}. Return JSON array of { questionId, score, maxScore, critique }.`;
  const response = await ai.models.generateContent({ model, contents: [{ role: "user", parts: [{ text: prompt }] }] });
  return res.status(200).json(JSON.parse(response.text().replace(/```json|```/g, "").trim()));
}
