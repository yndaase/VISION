import { AzureOpenAI } from "openai";

const azureKey = process.env.AZURE_OPENAI_KEY || process.env.GITHUB_TOKEN;
const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT || "https://models.inference.ai.azure.com";
const azureDeploymentPro = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o";

// Groq provides a completely free, lightning-fast API for Meta's Llama 3 models
const groqKey = process.env.GROQ_API_KEY;
const groqModel = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
const azureVersion = "2025-01-01-preview";

/**
 * Microsoft Azure OpenAI Client Initialization
 */
let azureClient = null;
if (azureKey && azureEndpoint) {
  azureClient = new AzureOpenAI({
    endpoint: azureEndpoint,
    apiKey: azureKey,
    apiVersion: azureVersion,
  });
}

/**
 * AI Content Generation with Multi-Provider Routing
 * Standard Users: Groq (Llama 3.1) [100% Free]
 * Pro Users: Azure OpenAI (GPT-4o)
 */
async function safeGenerateContent(contents, role = "student") {
  const mode = contents.find(c => c.mode)?.mode || "examiner";
  const useProModel = role === "pro" || role === "admin";

  try {
    if (useProModel) {
      if (!azureKey) throw new Error("Azure OpenAI API key is missing for Pro routing.");
      return await generateWithAzure(contents, mode, azureDeploymentPro);
    } else {
      if (!groqKey) throw new Error("Groq API key is missing. Please configure GROQ_API_KEY for free-tier users.");
      return await generateWithGroq(contents, mode);
    }
  } catch (error) {
    console.error(`[AI Engine Error]:`, error.message);
    throw error;
  }
}

/**
 * Microsoft Azure OpenAI SDK Handler with Dual-Mode Support
 */
async function generateWithAzure(contents, mode = "examiner", deploymentName = azureDeploymentPro) {
  // Convert Gemini format to OpenAI format
  const messages = contents.map(msg => ({
    role: msg.role === "model" ? "assistant" : msg.role,
    content: msg.parts ? msg.parts.map(p => p.text).join("\n") : ""
  })).filter(msg => msg.content.trim() !== "");

  // Branching System Prompt
  let systemContent = "";
  if (mode === "normal") {
    systemContent = `You are a helpful, versatile, and supportive AI Academic Assistant for Vision Education. 
    Provide clear and accurate answers to the student's questions on any academic topic. 
    Be conversational, concise, and encourage critical thinking. Use LaTeX for math if needed.`;
  } else {
    systemContent = `You are the WAEC Chief Examiner for Core Mathematics (2026 Curriculum). 
    Your goal is to provide high-accuracy marking and encouraging academic tutoring.
    
    EXPERT RULES:
    1. ALWAYS check the GH 100 tax-free threshold in MoMo/E-Levy questions.
    2. In Ratio problems, find 'one part' first before calculating totals.
    3. Use LaTeX for all math: e.g., $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$.
    4. Provide 'Examiner's Secret' tips (pro-tips) that focus on common local student errors like mixing units (MB/GB).
    
    EXEMPLAR MARKING LOGIC:
    - If a student makes a unit error, give partial credit but flag the 'unit confusion'.
    - If a student forgets the tax threshold, explain WHY the GH 100 is subtracted first.
    
    TONE: Professional, firm on accuracy, but helpful like a Senior Mentor.`;
  }

  const systemMessage = {
    role: "system",
    content: systemContent
  };

  // Add system message to the start
  messages.unshift(systemMessage);

  const response = await azureClient.chat.completions.create({
    model: deploymentName,
    messages: messages,
    temperature: mode === "normal" ? 0.7 : 0.4, // Examiner is more precise
    max_tokens: 4096
  });

  const text = response.choices[0].message.content;

  // Return a plain object with a `text` property so it's compatible
  // with the Gemini SDK response format used by extractJSON.
  return { text };
}

/**
 * Groq AI Fetch Handler (100% Free Tier - Llama 3)
 */
async function generateWithGroq(contents, mode = "examiner") {
  const messages = contents.map(msg => ({
    role: msg.role === "model" ? "assistant" : msg.role,
    content: msg.parts ? msg.parts.map(p => p.text).join("\n") : ""
  })).filter(msg => msg.content.trim() !== "");

  let systemContent = "";
  if (mode === "normal") {
    systemContent = `You are a helpful, versatile, and supportive AI Academic Assistant for Vision Education. Provide clear and accurate answers to the student's questions on any academic topic.`;
  } else {
    systemContent = `You are the WAEC Chief Examiner for Core Mathematics (2026 Curriculum). Provide high-accuracy marking and encouraging academic tutoring. Use LaTeX for math. Be firm but helpful.`;
  }

  messages.unshift({ role: "system", content: systemContent });

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${groqKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: groqModel,
      messages: messages,
      temperature: mode === "normal" ? 0.7 : 0.4
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Groq API Error");

  return { text: data.choices[0].message.content };
}

/**
 * Robust JSON Extractor
 * Strips AI conversation filler and extracts valid JSON blocks.
 */
function extractJSON(response) {
  let text = (response.text || "").trim();

  // Strip common markdown code fences that Azure/GPT-4o often wraps output in
  text = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    return JSON.parse(text);
  } catch (e) {
    // Aggressive Regex to find the LARGEST JSON block
    const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      const candidate = jsonMatch[0].trim();
      try {
        return JSON.parse(candidate);
      } catch (inner) {
        console.error("[JSON Extract Error]: Block failed to parse.", candidate);
        throw new Error("AI data structure corrupted. Please try again.");
      }
    }
    throw new Error("AI failed to provide technical data. Please refresh.");
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
  const { subject, accuracy, name, email = "" } = data;
  
  const effectiveRole = role;

  const prompt = `Student: ${name}. Performance: ${accuracy}% in ${subject}.
  Generate a Strategic 7-Day Study Timetable in JSON:
  {
    "topic": "Mastery Focus for the Week",
    "timetable": "| Day | Session | Focus Topic | Goal |\n|---|---|---|---|\n| Monday | 4PM-6PM | Topic A | Goal A | ...",
    "tasks": ["Critical Action 1", "Critical Action 2"],
    "motivation": "A punchy motivational quote",
    "difficulty": "Easy"|"Medium"|"Hard"
  }
  STRICT JSON ONLY. No conversational text. No markdown code blocks.`;
  
  const contents = [{ role: "user", parts: [{ text: prompt }] }];
  const response = await safeGenerateContent(contents, effectiveRole);
  return res.status(200).json(extractJSON(response));
}

async function handleVision(data, role, res) {
  const { imageBase64, mimeType, userMessage, subject, email = "" } = data;
  const parts = [{ text: `Vision Education AI Learning Specialist. Material: ${subject}. Request: "${userMessage || 'Explain this material.'}"` }];
  if (imageBase64) parts.push({ inlineData: { data: imageBase64, mimeType: mimeType || "image/jpeg" } });
  
  const effectiveRole = role;
  
  const contents = [{ role: "user", parts }];
  const response = await safeGenerateContent(contents, effectiveRole);
  return res.status(200).json({ analysis: response.text });
}

async function handleGenerateQuestions(data, role, res) {
  const { subject, dateSeed, mcqCount = 5, theoryCount = 2, email = "" } = data;
  
  const effectiveRole = role;
  
  const isPro = effectiveRole === 'pro';
  
  const prompt = `You are a ${isPro ? 'Senior Elite' : 'Senior'} WASSCE Examiner. Generate a ${isPro ? 'High-Precision Strategic' : 'Daily'} AI Mock for ${subject} on ${dateSeed}.
  ${isPro ? 'Focus on advanced deductive reasoning and complex Section B scenarios.' : ''}
  Return exactly ${mcqCount} MCQs and ${theoryCount} Theory questions in a single JSON object.
  
  Format:
  {
    "mcqs": [
      { "id": "any", "difficulty": "${isPro ? 'hard' : 'medium'}", "topic": "string", "question": "string", "options": { "A": "string", "B": "string", "C": "string", "D": "string" }, "correct": "A"|"B"|"C"|"D" }
    ],
    "theory": [
      { "id": "any", "difficulty": "hard", "topic": "string", "question": "string", "markScheme": "string", "modelAnswer": "string" }
    ]
  }
  STRICT JSON ONLY. NO MARKDOWN. NO CODE BLOCKS.`;
  
  const contents = [{ role: "user", parts: [{ text: prompt }] }];
  const response = await safeGenerateContent(contents, effectiveRole);
  return res.status(200).json(extractJSON(response));
}

async function handleMarkExam(data, role, res) {
  const { studentResponses, singleQuestion } = data;

  if (singleQuestion && studentResponses && studentResponses.length === 1) {
    // Single question mode - used by "Mark with AI" button on essay questions
    const q = studentResponses[0];
    const prompt = `You are the WASSCE Chief Examiner. Mark the following student response strictly.

Question: ${q.question}
${q.markScheme ? `Mark Scheme: ${JSON.stringify(q.markScheme)}` : ''}
${q.modelAnswer ? `Model Answer: ${q.modelAnswer}` : ''}
Student's Answer: ${q.studentAnswer}

Return ONLY valid JSON in this exact format (no markdown, no text outside):
{
  "success": true,
  "score": <number>,
  "maxPoints": <number>,
  "verdict": "<Excellent|Good|Satisfactory|Needs Improvement|Insufficient>",
  "feedback": "<specific, constructive 2-3 sentence feedback>",
  "modelAnswerSummary": "<brief model answer if not provided>"
}`;

    const contents = [{ role: "user", parts: [{ text: prompt }] }];
    const response = await safeGenerateContent(contents, role);
    const parsed = extractJSON(response);
    return res.status(200).json({ ...parsed, success: true });
  }

  // Bulk mode - used on exam submit for all theory questions
  const prompt = `You are the WASSCE Chief Examiner. Mark these student responses: ${JSON.stringify(studentResponses)}.
  Return a JSON ARRAY of results:
  [
    { "questionId": "string", "score": number, "maxScore": number, "critique": "short critique<50 words" }
  ]
  JSON ONLY. No markdown. No text outside the array.`;

  const contents = [{ role: "user", parts: [{ text: prompt }] }];
  const response = await safeGenerateContent(contents, role);
  return res.status(200).json(extractJSON(response));
}
