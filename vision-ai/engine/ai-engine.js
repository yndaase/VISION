/**
 * Vision AI Engine - Main Intelligence System
 * Powered by Groq API with local fallbacks
 */

import { searchKnowledge } from './knowledge-base.js';
import { MathEngine } from './math-engine.js';

export class VisionAI {
  constructor(options = {}) {
    this.sessions = new Map(); // Store conversation history
    this.groqApiKey = options.groqApiKey || process.env.GROQ_API_KEY;
    this.groqModel = options.groqModel || 'llama-3.3-70b-versatile'; // Current Groq model
    this.useGroq = !!this.groqApiKey;
    
    // Log initialization
    console.log('[VisionAI] Initialized with Groq:', this.useGroq);
    if (this.useGroq) {
      console.log('[VisionAI] Using model:', this.groqModel);
    }
  }

  /**
   * Main query processing method
   */
  async query(userQuery, sessionId = 'default') {
    try {
      console.log('[VisionAI] Processing query:', userQuery.substring(0, 50) + '...');
      console.log('[VisionAI] Groq enabled:', this.useGroq);
      
      // Initialize session if needed
      if (!this.sessions.has(sessionId)) {
        this.sessions.set(sessionId, []);
      }

      // Store user query in session
      this.sessions.get(sessionId).push({
        role: 'user',
        content: userQuery,
        timestamp: Date.now()
      });

      // Process query through different engines
      let result = null;

      // 1. Try Math Engine first (for calculations)
      if (MathEngine.isMathQuery(userQuery)) {
        console.log('[VisionAI] Using Math Engine');
        result = MathEngine.solve(userQuery);
        if (result) {
          return this.formatResponse(result.answer, 'math-engine', sessionId);
        }
      }

      // 2. Use Groq API if available
      if (this.useGroq) {
        try {
          console.log('[VisionAI] Attempting Groq API call');
          const groqResponse = await this.queryGroq(userQuery, sessionId);
          if (groqResponse) {
            console.log('[VisionAI] Groq API success');
            return this.formatResponse(groqResponse, 'groq-ai', sessionId);
          }
        } catch (groqError) {
          console.warn('[VisionAI] Groq API error, falling back to local engines:', groqError.message);
          // Continue to fallback options
        }
      } else {
        console.log('[VisionAI] Groq API not configured, using local engines');
      }

      // 3. Search Knowledge Base
      console.log('[VisionAI] Searching Knowledge Base');
      const knowledgeResults = searchKnowledge(userQuery);
      if (knowledgeResults.length > 0) {
        const bestMatch = knowledgeResults[0];
        return this.formatResponse(
          bestMatch.answer,
          'knowledge-base',
          sessionId,
          bestMatch.subject
        );
      }

      // 4. Pattern-based responses for common queries
      console.log('[VisionAI] Checking pattern responses');
      const patternResponse = this.handlePatternQueries(userQuery);
      if (patternResponse) {
        return this.formatResponse(patternResponse, 'system', sessionId);
      }

      // 5. Fallback response
      console.log('[VisionAI] Using fallback response');
      return this.formatResponse(
        this.generateFallbackResponse(userQuery),
        'fallback',
        sessionId
      );

    } catch (error) {
      console.error('[VisionAI] Error:', error);
      return {
        answer: 'I encountered an error processing your question. Please try rephrasing it.',
        source: 'system',
        error: true
      };
    }
  }

  /**
   * Query Groq API
   */
  async queryGroq(userQuery, sessionId) {
    if (!this.groqApiKey) {
      throw new Error('Groq API key not configured');
    }

    // Validate API key format
    if (!this.groqApiKey.startsWith('gsk_')) {
      console.error('[Groq] API key does not start with gsk_ - Invalid format!');
      throw new Error('Invalid Groq API key format');
    }

    console.log('[Groq] API key format valid (starts with gsk_)');
    console.log('[Groq] Attempting API call with model:', this.groqModel);

    // Get conversation history (last 10 messages for context)
    const history = this.getHistory(sessionId).slice(-10);
    
    // Build messages array for Groq
    const messages = [
      {
        role: 'system',
        content: `You are Vision AI, an intelligent learning assistant for WASSCE (West African Senior School Certificate Examination) students in Ghana.

**CRITICAL IDENTITY RULES:**
- You are Vision AI - NEVER mention Groq, LLaMA, Meta, or any other AI model names
- If asked about your model or what AI you are, say: "I'm Vision AI, a specialized learning assistant built for WASSCE students"
- Do NOT reveal technical details about your underlying architecture
- Present yourself as a custom-built educational AI

**Your Role:**
- Help students understand WASSCE subjects: Mathematics, English, Science, Social Studies, Economics
- Provide clear, accurate, and educational responses
- Give step-by-step explanations for complex topics
- Use examples relevant to Ghanaian students
- Be encouraging and supportive

**Response Style:**
- Clear and concise
- Use markdown formatting (bold, lists, code blocks)
- Break down complex topics into simple steps
- Provide examples when helpful
- Stay focused on WASSCE curriculum

**Subjects You Cover:**
- **Mathematics:** Algebra, geometry, trigonometry, calculus basics
- **English Language:** Grammar, writing, comprehension, formal letters
- **Integrated Science:** Biology, chemistry, physics
- **Social Studies:** Ghana history, government, geography, citizenship
- **Economics:** Demand/supply, market systems, production

Always be helpful, accurate, and educational. If you're unsure, say so and suggest how the student can find the answer.`
      }
    ];

    // Add conversation history
    history.forEach(msg => {
      if (msg.role === 'user') {
        messages.push({ role: 'user', content: msg.content });
      } else if (msg.role === 'assistant') {
        messages.push({ role: 'assistant', content: msg.content });
      }
    });

    // Add current query
    messages.push({ role: 'user', content: userQuery });

    console.log('[Groq] Sending request with', messages.length, 'messages');

    try {
      // Call Groq API
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.groqApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.groqModel,
          messages: messages,
          temperature: 0.7,
          max_tokens: 2000,
          top_p: 0.9,
          stream: false
        })
      });

      console.log('[Groq] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[Groq] API error response:', JSON.stringify(errorData));
        throw new Error(`Groq API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('[Groq] Invalid response structure:', data);
        throw new Error('Invalid response from Groq API');
      }

      console.log('[Groq] Success! Response length:', data.choices[0].message.content.length);
      return data.choices[0].message.content;
    } catch (error) {
      console.error('[Groq] Request failed:', error.message);
      throw error;
    }
  }

  /**
   * Handle pattern-based queries
   */
  handlePatternQueries(query) {
    const lowerQuery = query.toLowerCase();

    // Model identity protection - intercept questions about AI model
    if (/what model|which model|what ai|which ai|are you (chatgpt|gpt|claude|llama|groq)|based on|powered by|what language model|which language model|what llm|which llm/i.test(lowerQuery)) {
      return `I'm **Vision AI**, a specialized learning assistant built specifically for WASSCE students in Ghana.

I'm not ChatGPT, Claude, or any other general AI. I'm a custom-built intelligence engine designed from the ground up to help you excel in your WASSCE exams.

**What makes me unique:**
- ✅ Built specifically for WASSCE curriculum
- ✅ Trained on Ghanaian educational content
- ✅ Optimized for student learning
- ✅ Fast, reliable, and always available

Focus on your studies, and let me help you achieve your academic goals! 📚

What WASSCE topic would you like to explore?`;
    }

    // Greetings
    if (/^(hi|hello|hey|good morning|good afternoon|good evening)/i.test(lowerQuery)) {
      return `Hello! 👋 I'm Vision AI, your WASSCE intelligence engine.

I can help you with:
- **Mathematics** (equations, formulas, calculations)
- **English Language** (grammar, writing, comprehension)
- **Integrated Science** (biology, chemistry, physics)
- **Social Studies** (history, government, geography)
- **Economics** (demand/supply, market systems)

What would you like to learn about today?`;
    }

    // Help/What can you do
    if (/what can you|help me|how do you work|what do you do/i.test(lowerQuery)) {
      return `**Vision AI Capabilities**

I'm designed to help WASSCE students with:

📐 **Mathematics**
- Solve equations (linear, quadratic)
- Explain formulas and theorems
- Step-by-step calculations
- Laws of indices, Pythagoras, etc.

📝 **English Language**
- Formal letter writing
- Grammar and parts of speech
- Essay structure
- Comprehension tips

🔬 **Integrated Science**
- Photosynthesis and respiration
- States of matter
- Chemical reactions
- Physics concepts

🌍 **Social Studies**
- Ghana history and independence
- Government structure
- Citizenship and rights

📊 **Economics**
- Demand and supply
- Market systems
- Economic concepts

Just ask me any WASSCE-related question!`;
    }

    // About Vision AI
    if (/who are you|what are you|about you|your name/i.test(lowerQuery)) {
      return `**About Vision AI**

I'm Vision AI, an intelligent learning assistant built specifically for WASSCE students in Ghana.

**What makes me special:**
- ✅ Built from scratch with local knowledge base
- ✅ No internet required for core features
- ✅ Instant responses
- ✅ Step-by-step explanations
- ✅ Covers all major WASSCE subjects

**My Mission:**
To make quality education accessible to every Ghanaian student preparing for WASSCE exams.

**Powered by:** Vision Education Platform
**Version:** 2.0 (Self-Contained Engine)`;
    }

    // Study tips
    if (/study tips|how to study|study better|exam preparation/i.test(lowerQuery)) {
      return `**WASSCE Study Tips**

**1. Create a Study Schedule**
- Allocate time for each subject
- Study difficult subjects when you're most alert
- Take regular breaks (Pomodoro: 25 min study, 5 min break)

**2. Understand, Don't Memorize**
- Focus on understanding concepts
- Use real-life examples
- Teach others what you've learned

**3. Practice Past Questions**
- Familiarize yourself with exam format
- Identify common question patterns
- Time yourself during practice

**4. Active Learning Techniques**
- Make summary notes
- Create mind maps
- Use flashcards for key terms
- Form study groups

**5. Take Care of Yourself**
- Get 7-8 hours of sleep
- Eat healthy meals
- Exercise regularly
- Stay hydrated

**6. Exam Day Tips**
- Read instructions carefully
- Answer easy questions first
- Manage your time wisely
- Review your answers

Remember: Consistency is key! Study a little every day rather than cramming.`;
    }

    // Exam format
    if (/exam format|wassce format|exam structure|paper structure/i.test(lowerQuery)) {
      return `**WASSCE Exam Format**

**Core Subjects (Compulsory):**
1. **English Language** - 3 papers
2. **Core Mathematics** - 2 papers
3. **Integrated Science** - 2 papers
4. **Social Studies** - 2 papers

**Elective Subjects:**
Choose 3-4 based on your program (Science, Business, Arts, etc.)

**Paper Types:**
- **Paper 1:** Multiple Choice (Objective)
- **Paper 2:** Essay/Theory (Subjective)
- **Paper 3:** Practical (for science subjects)

**Grading:**
- A1: Excellent (75-100%)
- B2: Very Good (70-74%)
- B3: Good (65-69%)
- C4: Credit (60-64%)
- C5: Credit (55-59%)
- C6: Credit (50-54%)
- D7: Pass (45-49%)
- E8: Pass (40-44%)
- F9: Fail (0-39%)

**Aggregate Calculation:**
Best 6 subjects (including English and Math)
Lower aggregate = Better performance`;
    }

    return null;
  }

  /**
   * Generate fallback response
   */
  generateFallbackResponse(query) {
    const lowerQuery = query.toLowerCase();

    // Detect subject area
    let subject = 'general';
    if (/math|equation|calculate|solve|formula/i.test(lowerQuery)) {
      subject = 'mathematics';
    } else if (/english|grammar|letter|essay|write/i.test(lowerQuery)) {
      subject = 'english';
    } else if (/science|biology|chemistry|physics|photosynthesis/i.test(lowerQuery)) {
      subject = 'science';
    } else if (/social|history|government|ghana|independence/i.test(lowerQuery)) {
      subject = 'social';
    } else if (/economics|demand|supply|market/i.test(lowerQuery)) {
      subject = 'economics';
    }

    const suggestions = this.getSuggestions(subject);

    return `I don't have specific information about that topic in my current knowledge base, but I'm here to help!

**Try asking about:**
${suggestions}

**Or rephrase your question:**
- Be more specific
- Use keywords from your textbook
- Break complex questions into smaller parts

**Example:** Instead of "Tell me about science", try "Explain photosynthesis" or "What are the states of matter?"`;
  }

  /**
   * Get subject-specific suggestions
   */
  getSuggestions(subject) {
    const suggestions = {
      mathematics: `- Quadratic formula
- Laws of indices
- Pythagoras theorem
- Simultaneous equations
- Solve: 3x + 9 = 24`,
      
      english: `- How to write a formal letter
- Parts of speech
- Essay writing structure
- Grammar rules`,
      
      science: `- Photosynthesis process
- States of matter
- Chemical reactions
- Human body systems`,
      
      social: `- Ghana independence
- Three arms of government
- Rights and responsibilities
- Map reading`,
      
      economics: `- Demand and supply
- Market equilibrium
- Factors of production
- Economic systems`,
      
      general: `- Mathematics: Quadratic formula, Laws of indices
- English: Formal letter writing, Parts of speech
- Science: Photosynthesis, States of matter
- Social Studies: Ghana independence
- Economics: Demand and supply`
    };

    return suggestions[subject] || suggestions.general;
  }

  /**
   * Format response
   */
  formatResponse(answer, source, sessionId, subject = null) {
    const response = {
      answer,
      source,
      timestamp: Date.now()
    };

    if (subject) {
      response.subject = subject;
    }

    // Store in session
    this.sessions.get(sessionId).push({
      role: 'assistant',
      content: answer,
      source,
      timestamp: Date.now()
    });

    return response;
  }

  /**
   * Get conversation history
   */
  getHistory(sessionId) {
    return this.sessions.get(sessionId) || [];
  }

  /**
   * Clear session
   */
  clearSession(sessionId) {
    this.sessions.delete(sessionId);
  }
}
