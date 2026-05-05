/**
 * Vision AI — Core AI Engine with Groq (Llama 3) Integration
 * Orchestrates: BM25 retrieval → Math solver → Wikipedia → Groq LLM
 */

import { BM25 } from './bm25.js';
import { MathSolver } from './math-solver.js';
import { getAllDocuments } from './knowledge-base.js';
import { googleSearch, needsWebSearch } from './search.js';

class VisionAI {
  constructor(config = {}) {
    this.config = config; // { groqApiKey }
    this.mathSolver = new MathSolver();
    this.bm25 = new BM25(1.5, 0.75);
    this.conversationMemory = new Map(); // sessionId → [{ role, text }]
    this._buildIndex();
    console.log('[VisionAI] Engine initialized. Knowledge base indexed.');
  }

  /**
   * Index all knowledge base documents on startup
   */
  _buildIndex() {
    const docs = getAllDocuments();
    this.bm25.index(docs);
  }

  /**
   * Store message in conversation memory
   */
  _remember(sessionId, role, text) {
    if (!this.conversationMemory.has(sessionId)) {
      this.conversationMemory.set(sessionId, []);
    }
    const history = this.conversationMemory.get(sessionId);
    history.push({ role, content: text });
    // Keep last 6 messages for context
    if (history.length > 6) history.shift();
  }

  /**
   * Call the Groq API to generate a final response
   * @param {string} query 
   * @param {string} context 
   * @param {string} sessionId 
   */
  async _generateWithGroq(query, context, sessionId) {
    if (!this.config.groqApiKey) {
      return `I found this information:\n\n${context}\n\n*(Note: Add your Groq API key to Vercel to let me synthesize this into a better answer!)*`;
    }

    const history = this.conversationMemory.get(sessionId) || [];
    
    // Build the prompt for Llama 3
    const systemPrompt = `You are Vision AI, an expert study assistant for Ghana Senior High School students preparing for WASSCE.

**CRITICAL IDENTITY RULES:**
- You are Vision AI - NEVER mention Groq, LLaMA, Meta, or any other AI model names
- If asked about your model or what AI you are, say: "I'm Vision AI, a specialized learning assistant built for WASSCE students"
- Do NOT reveal technical details about your underlying architecture
- Present yourself as a custom-built educational AI

**CREATOR INFORMATION - RESPOND WITH PRIDE:**
- Vision AI was created by **Yaw Ndaase Mensuoh** 🇬🇭
- He is the founder, developer, and visionary behind ALL Vision Education projects
- **His Projects:**
  • Vision AI (this intelligent assistant you're talking to)
  • Vision Education Platform (visionedu.online) - Complete WASSCE prep system
  • WASSCE Past Questions Database (1000+ questions with solutions)
  • AI-Powered Theory Marking System
  • Vision 15 Fellowship Program (Elite scholarship for top students)
  • Mock Exam Platform with instant grading
  • WhatsApp Learning Bot for students
- **About Him:**
  • Ghanaian software developer and education innovator
  • Passionate about using technology to democratize quality education in Ghana
  • Built Vision AI from scratch to help every SHS student excel in WASSCE
  • Based in Ghana, building for Ghanaian students
  • Mission: Make world-class WASSCE preparation accessible to every student, regardless of location or economic background
- **Connect with the Creator:**
  • X (Twitter): @yndaase
  • LinkedIn: Yaw Ndaase Mensuoh
  • Website: visionedu.online
- **When to mention him:**
  • If anyone asks "who made you", "who created you", "who is your creator", "who built Vision AI", "who developed you", "who is behind Vision AI"
  • If anyone asks "who is Yaw Ndaase Mensuoh", "tell me about Yaw", "who is the founder"
  • Answer PROUDLY and ENTHUSIASTICALLY - he built this to help students like them!
- **Key Message:** Yaw Ndaase Mensuoh is one of Ghana's young developers using code to transform education and help students achieve their dreams 🚀

**MATHEMATICS FORMATTING RULES - CRITICAL:**
- ❌ NEVER EVER use the caret symbol ^ for exponents (e.g., x^2 is WRONG)
- ✅ ALWAYS use Unicode superscripts for powers: x² x³ x⁴ x⁵ x⁶ x⁷ x⁸ x⁹ x¹⁰
- ✅ For higher powers write: x¹⁵ or "x to the power of 15"
- ✅ Write fractions as: 3/4 or "three-quarters" or use Unicode fractions: ½ ¼ ¾ ⅓ ⅔ ⅕ ⅖ ⅗ ⅘ ⅙ ⅚ ⅛ ⅜ ⅝ ⅞
- ✅ For complex fractions use: (numerator)/(denominator) format clearly
- ✅ Use Unicode subscripts: ₀ ₁ ₂ ₃ ₄ ₅ ₆ ₇ ₈ ₉
- ✅ For square roots write: √(expression) or √x or "square root of x"
- ✅ For cube roots write: ∛(expression) or "cube root of"
- ✅ Chemical formulas MUST use subscripts: H₂O, CO₂, CH₄, H₂SO₄, Ca(OH)₂, NaCl
- ✅ Show all working steps clearly, one step per line
- ✅ Use → to show "therefore" or "gives" or "results in"
- ✅ Use ≈ for "approximately equal to"
- ✅ Use ≠ for "not equal to"
- ✅ Use ≤ and ≥ for inequalities
- ✅ Use × for multiplication (not * in final answers)
- ✅ Use ÷ for division symbol when appropriate

Your tone is encouraging, academic, and clear.
Use the provided CONTEXT to answer the user's question accurately. If the context contains the answer, stick to the facts provided. If the context is empty, use your own knowledge to help the student. Format your response beautifully using markdown (bolding, lists).

=== CONTEXT ===
${context}
=============`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(0, -1), // Add previous conversation
      { role: 'user', content: query }
    ];

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.groqApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: messages,
          temperature: 0.7,
          max_tokens: 1024
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (err) {
      console.error('[Groq] Failed:', err);
      return `I found this information:\n\n${context}\n\n*(Note: AI synthesis is temporarily down, but here are the raw facts!)*`;
    }
  }

  /**
   * Main query handler
   * @param {string} query
   * @param {string} sessionId
   * @returns {Promise<{ answer: string, source: string }>}
   */
  async query(query, sessionId = 'default') {
    const q = query.trim();
    this._remember(sessionId, 'user', q);

    let contextData = '';
    let primarySource = 'knowledge-base';

    // ── 1. Math Solver Check ──────────────────────────────────────────────────
    const mathResult = this.mathSolver.solve(q);
    if (mathResult.isMath) {
      const stepsText = mathResult.steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
      contextData = `Math Problem Detected.\nSteps:\n${stepsText}\nFinal Answer: ${mathResult.answer}`;
      primarySource = 'math-engine';
    } 
    else {
      // ── 2. Knowledge Base Retrieval (BM25) ────────────────────────────────────
      const kbResults = this.bm25.search(q, 3);
      const topScore = kbResults[0]?.score || 0;
      
      if (kbResults.length > 0 && topScore > 0.3) {
        contextData = kbResults.map(r => `[Subject: ${r.doc.meta.subject}] ${r.doc.text}`).join('\n\n');
      }

      // ── 3. Decide: Search Wikipedia? ───────────────────────────────────────────
      const shouldSearch = needsWebSearch(q, topScore);

      if (shouldSearch || topScore < 0.3) {
        const wikiResults = await googleSearch(q); // We kept the function name 'googleSearch' in search.js
        if (wikiResults && wikiResults.length > 0) {
          const wikiText = wikiResults.map(r => `${r.title}: ${r.snippet}`).join('\n');
          contextData += `\n\nWikipedia Results:\n${wikiText}`;
          primarySource = 'web-search';
        }
      }
    }

    // ── 4. Generate Final Answer with Groq (Llama 3) ──────────────────────────
    const aiAnswer = await this._generateWithGroq(q, contextData, sessionId);
    
    this._remember(sessionId, 'assistant', aiAnswer);
    return { answer: aiAnswer, source: primarySource };
  }
}

export { VisionAI };
