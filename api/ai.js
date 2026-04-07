import { GoogleGenAI } from "@google/genai";
import { AzureOpenAI } from "openai";

const apiKey = process.env.GEMINI_API_KEY;
const azureKey = process.env.AZURE_OPENAI_KEY || process.env.GITHUB_TOKEN;
const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT || "https://models.inference.ai.azure.com";
const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o";
const azureVersion = "2025-01-01-preview";

const ai = new GoogleGenAI({ apiKey });

/**
 * Microsoft Azure OpenAI Client Initialization
 */
let azureClient = null;
if (azureKey && azureEndpoint) {
  azureClient = new AzureOpenAI({
    endpoint: azureEndpoint,
    apiKey: azureKey,
    apiVersion: azureVersion,
    deployment: azureDeployment
  });
}

const MODEL_STANDARD = "gemini-2.5-flash";
const MODEL_FALLBACK = "gemini-1.5-flash-8b";

/**
 * AI Content Generation with Multi-Provider Routing
 * Standard Users: Gemini (Google)
 * Pro Users: Azure OpenAI / Microsoft Copilot-grade intelligence
 */
async function safeGenerateContent(contents, role = "student") {
  // 1. Pro Routing (Microsoft Azure AI)
  if (role === "pro" && azureKey) {
    try {
      return await generateWithAzure(contents);
    } catch (err) {
      console.warn("[Azure Error] Falling back to Gemini:", err.message);
    }
  }

  // 2. Standard Routing (Gemini)
  const primaryModel = role === "pro" ? MODEL_FALLBACK : MODEL_STANDARD;
  
  try {
    return await ai.models.generateContent({
      model: primaryModel,
      contents
    });
  } catch (error) {
    const errorMsg = error.message.toLowerCase();
    // Emergency Fallback
    if (errorMsg.includes("503") || errorMsg.includes("unavailable") || errorMsg.includes("429") || errorMsg.includes("quota")) {
      console.warn(`[AI Final Fallback]: Routing to ${MODEL_FALLBACK}`);
      return await ai.models.generateContent({
        model: MODEL_FALLBACK,
        contents
      });
    }
    throw error;
  }
}

/**
 * Microsoft Azure OpenAI SDK Handler with Expert Knowledge
 */
async function generateWithAzure(contents) {
  // Convert Gemini format to OpenAI format
  const messages = contents.map(msg => ({
    role: msg.role === "model" ? "assistant" : msg.role,
    content: msg.parts.map(p => p.text).join("\n")
  }));

  // INJECT EXPERT KNOWLEDGE (System Prompt Calibration)
  const systemMessage = {
    role: "system",
    content: `You are the WAEC Chief Examiner for Core Mathematics (2026 Curriculum). 
    Your goal is to provide high-accuracy marking and encouraging academic tutoring.
    
    EXPERT RULES:
    1. ALWAYS check the GH 100 tax-free threshold in MoMo/E-Levy questions.
    2. In Ratio problems, find 'one part' first before calculating totals.
    3. Use LaTeX for all math: e.g., $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$.
    4. Provide 'Examiner's Secret' tips (pro-tips) that focus on common local student errors like mixing units (MB/GB).
    
    EXEMPLAR MARKING LOGIC:
    - If a student makes a unit error, give partial credit but flag the 'unit confusion'.
    - If a student forgets the tax threshold, explain WHY the GH 100 is subtracted first.
    
    TONE: Professional, firm on accuracy, but helpful like a Senior Mentor.`
  };

  // Add system message to the start
  messages.unshift(systemMessage);

  const response = await azureClient.chat.completions.create({
    model: azureDeployment,
    messages: messages,
    temperature: 0.7,
    max_tokens: 4096
  });

  const text = response.choices[0].message.content;

  return {
    text: text,
    get text() { return text; }
  };
}

/**
 * Groq (OpenAI-Compatible) Fetch Handler
 */
async function generateWithGroq(contents) {
  // Convert Gemini format to OpenAI/Groq format
  const messages = contents.map(msg => ({
    role: msg.role === "model" ? "assistant" : msg.role,
    content: msg.parts.map(p => p.text).join("\n")
  }));

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${groqKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL_PRO,
      messages: messages,
      temperature: 0.7,
      max_tokens: 2048
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Groq API Error");

  return {
    text: data.choices[0].message.content,
    // Add raw text for JSON extractor
    get text() { return data.choices[0].message.content; }
  };
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

  const { type, role } = req.body;

  try {
    switch (type) {
      case 'help': return await handleHelp(req.body, role, res);
      case 'planner': return await handlePlanner(req.body, role, res);
      case 'vision': return await handleVision(req.body, role, res);
      case 'generate-questions': return await handleGenerateQuestions(req.body, role, res);
      case 'mark-exam': return await handleMarkExam(req.body, role, res);
      default: return res.status(400).json({ error: 'Invalid AI request type' });
    }
  } catch (error) {
    console.error(`[AI Hub Error - ${type}]:`, error);
    let cleanMsg = error.message || "AI System Error";
    
    // Catch-all for SDK raw JSON in error messages
    if (cleanMsg.includes('{') && cleanMsg.includes('}')) {
      try {
        const parsed = JSON.parse(cleanMsg.substring(cleanMsg.indexOf('{')));
        if (parsed.error && parsed.error.message) cleanMsg = parsed.error.message;
      } catch (e) { /* ignore */ }
    }

    if (cleanMsg.toLowerCase().includes("429") || cleanMsg.toLowerCase().includes("quota")) {
      cleanMsg = "You've reached the free-tier limit for this model (20 requests/day). Please wait a few moments or try again tomorrow.";
    }

    return res.status(500).json({ error: cleanMsg });
  }
}

// --- Handlers ---

async function handleHelp(data, role, res) {
  const { question, subject, topic, userMessage } = data;
  const prompt = `You are the Vision Education AI Academic Assistant. Subject: ${subject}. Topic: ${topic}. Original Question: ${question}.
  
  Student says: "${userMessage}"
  
  Provide a HINT or CONCEPT EXPLANATION. Do NOT give the final answer. Keep it encouraging and under 150 words.`;
  
  const contents = [{ role: "user", parts: [{ text: prompt }] }];
  const response = await safeGenerateContent(contents, role);
  return res.status(200).json({ helpText: response.text });
}

async function handlePlanner(data, role, res) {
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
  const response = await safeGenerateContent(contents, role);
  return res.status(200).json(extractJSON(response));
}

async function handleVision(data, role, res) {
  const { imageBase64, mimeType, userMessage, subject } = data;
  const parts = [{ text: `Vision Education AI Learning Specialist. Material: ${subject}. Request: "${userMessage || 'Explain this material.'}"` }];
  if (imageBase64) parts.push({ inlineData: { data: imageBase64, mimeType: mimeType || "image/jpeg" } });
  
  const contents = [{ role: "user", parts }];
  const response = await safeGenerateContent(contents, role);
  return res.status(200).json({ analysis: response.text });
}

async function handleGenerateQuestions(data, role, res) {
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
  const response = await safeGenerateContent(contents, role);
  return res.status(200).json(extractJSON(response));
}

async function handleMarkExam(data, role, res) {
  const { studentResponses } = data;
  const prompt = `You are the WASSCE Chief Examiner. Mark these responses: ${JSON.stringify(studentResponses)}.
  Return a JSON ARRAY of results:
  [
    { "questionId": "string", "score": number, "maxScore": number, "critique": "short critique" }
  ]
  JSON ONLY.`;
  
  const contents = [{ role: "user", parts: [{ text: prompt }] }];
  const response = await safeGenerateContent(contents, role);
  return res.status(200).json(extractJSON(response));
}
