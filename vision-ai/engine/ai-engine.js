/**
 * Vision AI Engine - Main Intelligence System
 * Self-contained AI without external APIs
 */

import { searchKnowledge } from './knowledge-base.js';
import { MathEngine } from './math-engine.js';

export class VisionAI {
  constructor() {
    this.sessions = new Map(); // Store conversation history
  }

  /**
   * Main query processing method
   */
  async query(userQuery, sessionId = 'default') {
    try {
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
        result = MathEngine.solve(userQuery);
        if (result) {
          return this.formatResponse(result.answer, 'math-engine', sessionId);
        }
      }

      // 2. Search Knowledge Base
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

      // 3. Pattern-based responses for common queries
      const patternResponse = this.handlePatternQueries(userQuery);
      if (patternResponse) {
        return this.formatResponse(patternResponse, 'system', sessionId);
      }

      // 4. Fallback response
      return this.formatResponse(
        this.generateFallbackResponse(userQuery),
        'fallback',
        sessionId
      );

    } catch (error) {
      console.error('Vision AI Error:', error);
      return {
        answer: 'I encountered an error processing your question. Please try rephrasing it.',
        source: 'system',
        error: true
      };
    }
  }

  /**
   * Handle pattern-based queries
   */
  handlePatternQueries(query) {
    const lowerQuery = query.toLowerCase();

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
