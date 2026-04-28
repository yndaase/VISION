import { AzureOpenAI } from "openai";

// ============================================================
// Azure OpenAI Configuration
// Endpoint: https://admin-mnoibqvk-eastus2.cognitiveservices.azure.com/
// ============================================================
const azureKey      = process.env.AZURE_OPENAI_KEY || process.env.GITHUB_TOKEN;
const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT || "https://models.inference.ai.azure.com";
const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o";
const azureVersion  = "2024-12-01-preview";

let azureClient = null;
if (azureKey) {
  azureClient = new AzureOpenAI({
    endpoint:   azureEndpoint,
    apiKey:     azureKey,
    apiVersion: azureVersion,
    deployment: azureDeployment,
  });
}

// ============================================================
// Core AI Content Generator
// ============================================================
async function safeGenerateContent(messages, systemPrompt) {
  if (!azureClient) {
    throw new Error(
      "Azure OpenAI API key is missing. Please set AZURE_OPENAI_KEY in your environment variables."
    );
  }

  const allMessages = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  const response = await azureClient.chat.completions.create({
    model:       azureDeployment,
    messages:    allMessages,
    temperature: 0.5,
    max_tokens:  4096,
  });

  const text = response.choices?.[0]?.message?.content || "";
  return { text };
}

// ============================================================
// Robust JSON Extractor
// Strips markdown fences and extracts valid JSON.
// ============================================================
function extractJSON(response) {
  let text = (response.text || "").trim();

  // Strip markdown code fences (GPT-4o often wraps output)
  text = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(text);
  } catch (_) {
    // Fallback: find the largest JSON block
    const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0].trim());
      } catch (inner) {
        console.error("[JSON Extract Error]:", jsonMatch[0].substring(0, 200));
        throw new Error("AI returned malformed data. Please try again.");
      }
    }
    throw new Error("AI response did not contain valid JSON. Please try again.");
  }
}

// ============================================================
// Main Request Handler
// ============================================================
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { type, role } = req.body;

  try {
    switch (type) {
      case "help":               return await handleHelp(req.body, res);
      case "planner":            return await handlePlanner(req.body, res);
      case "vision":             return await handleVision(req.body, res);
      case "generate-questions": return await handleGenerateQuestions(req.body, res);
      case "mark-exam":          return await handleMarkExam(req.body, res);
      default:
        return res.status(400).json({ error: `Invalid AI request type: ${type}` });
    }
  } catch (error) {
    console.error(`[AI Hub Error - ${type}]:`, error);

    let cleanMsg = error.message || "AI System Error";

    // Parse Azure SDK error objects that embed JSON
    if (cleanMsg.includes("{") && cleanMsg.includes("}")) {
      try {
        const parsed = JSON.parse(cleanMsg.substring(cleanMsg.indexOf("{")));
        if (parsed?.error?.message) cleanMsg = parsed.error.message;
      } catch (_) { /* ignore */ }
    }

    // Friendly quota message
    if (
      cleanMsg.toLowerCase().includes("429") ||
      cleanMsg.toLowerCase().includes("quota") ||
      cleanMsg.toLowerCase().includes("rate limit")
    ) {
      cleanMsg =
        "AI rate limit reached. Please wait a moment and try again.";
    }

    // Auth errors
    if (
      cleanMsg.toLowerCase().includes("401") ||
      cleanMsg.toLowerCase().includes("unauthorized") ||
      cleanMsg.toLowerCase().includes("authentication")
    ) {
      cleanMsg =
        "Azure authentication failed. Please check your API key and endpoint.";
    }

    return res.status(500).json({ error: cleanMsg });
  }
}

// ============================================================
// Handlers
// ============================================================

async function handleHelp(data, res) {
  const { question, subject, topic, userMessage } = data;

  const systemPrompt = `You are the Vision Education AI Academic Assistant. 
Be helpful, encouraging, and concise. Use LaTeX for math if needed.`;

  const prompt = `Subject: ${subject}. Topic: ${topic}.
Original Question: ${question}

Student says: "${userMessage}"

Provide a HINT or CONCEPT EXPLANATION only. Do NOT give the final answer. Keep it under 150 words.`;

  const response = await safeGenerateContent(
    [{ role: "user", content: prompt }],
    systemPrompt
  );
  return res.status(200).json({ helpText: response.text });
}

async function handlePlanner(data, res) {
  const {
    subject, accuracy, name,
    subjects = [],
    studyStart = "8:00",
    studyEnd   = "15:00",
    breakMins  = 30,
  } = data;

  const subjectsList = subjects.length > 0
    ? subjects.join(", ")
    : (subject || "Core Mathematics");

  const weakest = subject || subjects[0] || "Core Mathematics";

  const systemPrompt = `You are an expert WASSCE 2026 study planner. Return ONLY valid JSON — no prose, no markdown fences, no text outside the JSON object.`;

  const prompt = `Create a personalised weekly study timetable for ${name}, a WASSCE 2026 candidate.

Context:
- Subjects to cover: ${subjectsList}
- Weakest subject (needs most time): ${weakest} (${accuracy}% accuracy)
- Study window: ${studyStart} – ${studyEnd}, Monday to Friday
- Short break every ~90 min, ~${breakMins} minutes long

Return EXACTLY this JSON structure (no extra keys, no markdown):
{
  "weekFocus": "One-sentence focus goal for the week",
  "slots": [
    {
      "time": "HH:MM – HH:MM",
      "monday": "Subject name OR BREAK OR LUNCH BREAK OR END OF STUDY",
      "tuesday": "...",
      "wednesday": "...",
      "thursday": "...",
      "friday": "...",
      "isBreak": false
    }
  ],
  "tasks": ["Actionable task 1", "Actionable task 2", "Actionable task 3"],
  "motivation": "A short punchy motivational quote",
  "difficulty": "Medium"
}

Rules:
- All slots from ${studyStart} to ${studyEnd}, continuous (no gaps)
- isBreak must be true for BREAK, LUNCH BREAK, and END OF STUDY rows
- Distribute all subjects; give ${weakest} the most sessions
- Include Past Questions and Theory Practice sessions
- STRICT JSON ONLY. Absolutely no text before or after the JSON object.`;

  const response = await safeGenerateContent(
    [{ role: "user", content: prompt }],
    systemPrompt
  );
  const parsed = extractJSON(response);
  if (!parsed.slots) throw new Error("AI returned invalid timetable structure.");
  return res.status(200).json(parsed);
}

async function handleVision(data, res) {
  const { imageBase64, mimeType, userMessage, subject } = data;

  const systemPrompt = `You are the Vision Education AI Learning Specialist. Analyze learning materials and explain them clearly.`;

  const content = [];
  content.push({
    type: "text",
    text: `Subject: ${subject}. Request: "${userMessage || "Explain this material."}"`,
  });
  if (imageBase64) {
    content.push({
      type: "image_url",
      image_url: { url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}` },
    });
  }

  const response = await safeGenerateContent(
    [{ role: "user", content }],
    systemPrompt
  );
  return res.status(200).json({ analysis: response.text });
}

async function handleGenerateQuestions(data, res) {
  const {
    subject,
    dateSeed,
    mcqCount   = 5,
    theoryCount = 2,
    batchIndex  = 1,
    focusTopics = "",
    role        = "student",
  } = data;

  const isPro = role === "pro" || role === "admin";

  const systemPrompt = `You are a Senior WASSCE Chief Examiner. 
Your job is to produce high-quality, curriculum-aligned exam questions.
Return ONLY a valid JSON object — no markdown fences, no prose, no extra text.`;

  const prompt = `Generate a WASSCE mock exam batch for: ${subject}
Date seed: ${dateSeed} | Batch: ${batchIndex}
${focusTopics ? `Focus topics: ${focusTopics}` : ""}
${isPro ? "Difficulty: hard. Focus on advanced reasoning and complex scenarios." : "Difficulty: medium. Cover a broad range of syllabus topics."}

Return EXACTLY ${mcqCount} MCQs and ${theoryCount} theory questions.

MATH FORMATTING RULES:
- Wrap ALL math in LaTeX dollar signs: $x^2 + 2x + 1$
- Matrices: $\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$
- Fractions: $\\frac{a}{b}$  |  Roots: $\\sqrt{x}$
- NEVER use plain text like [[2,3],[5,1]] for matrices.

Required JSON format:
{
  "mcqs": [
    {
      "id": "q1",
      "difficulty": "${isPro ? "hard" : "medium"}",
      "topic": "topic name",
      "question": "question text",
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "correct": "A"
    }
  ],
  "theory": [
    {
      "id": "t1",
      "difficulty": "hard",
      "topic": "topic name",
      "question": "question text",
      "markScheme": "marking points here",
      "modelAnswer": "full model answer here"
    }
  ]
}
STRICT JSON ONLY. No text before or after the JSON object.`;

  const response = await safeGenerateContent(
    [{ role: "user", content: prompt }],
    systemPrompt
  );

  const parsed = extractJSON(response);

  // Validate structure before returning
  if (!parsed.mcqs && !parsed.theory) {
    throw new Error("AI returned unexpected structure. Missing mcqs/theory keys.");
  }

  return res.status(200).json(parsed);
}

async function handleMarkExam(data, res) {
  const { studentResponses, singleQuestion } = data;

  const systemPrompt = `You are the WASSCE Chief Examiner. Mark student responses fairly and strictly.
Return ONLY valid JSON — no markdown, no prose, no extra text.`;

  if (singleQuestion && studentResponses?.length === 1) {
    const q = studentResponses[0];

    const prompt = `Mark this student response:

Question: ${q.question}
${q.markScheme ? `Mark Scheme: ${q.markScheme}` : ""}
${q.modelAnswer ? `Model Answer: ${q.modelAnswer}` : ""}
Student's Answer: ${q.studentAnswer}

Return this exact JSON:
{
  "success": true,
  "score": <number>,
  "maxPoints": <number>,
  "verdict": "<Excellent|Good|Satisfactory|Needs Improvement|Insufficient>",
  "feedback": "<specific, constructive 2-3 sentence feedback>",
  "modelAnswerSummary": "<brief model answer summary if not already provided>"
}`;

    const response = await safeGenerateContent(
      [{ role: "user", content: prompt }],
      systemPrompt
    );
    const parsed = extractJSON(response);
    return res.status(200).json({ ...parsed, success: true });
  }

  // Bulk marking mode
  const prompt = `Mark these student responses: ${JSON.stringify(studentResponses)}

Return a JSON array:
[
  { "questionId": "string", "score": number, "maxScore": number, "critique": "short critique under 50 words" }
]
JSON array ONLY. No other text.`;

  const response = await safeGenerateContent(
    [{ role: "user", content: prompt }],
    systemPrompt
  );
  return res.status(200).json(extractJSON(response));
}
