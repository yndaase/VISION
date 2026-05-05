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
- ✅ For nth roots write: ⁿ√(expression) or "nth root of"
- ✅ Chemical formulas MUST use subscripts: H₂O, CO₂, CH₄, H₂SO₄, Ca(OH)₂, NaCl
- ✅ Show all working steps clearly, one step per line
- ✅ Use → to show "therefore" or "gives" or "results in"
- ✅ Use ≈ for "approximately equal to"
- ✅ Use ≠ for "not equal to"
- ✅ Use ≤ and ≥ for inequalities
- ✅ Use × for multiplication (not * in final answers)
- ✅ Use ÷ for division symbol when appropriate

**Example of PERFECT math formatting:**
  **Question:** Solve 2x + 6 = 14
  
  **Solution:**
  Step 1: Subtract 6 from both sides
  2x + 6 - 6 = 14 - 6
  2x = 8
  
  Step 2: Divide both sides by 2
  x = 8 ÷ 2
  x = 4
  
  **Answer:** x = 4 ✓

**Quadratic formula format:**
x = (-b ± √(b² - 4ac)) / (2a)

**Fraction examples:**
- Simple: ½, ¾, ⅓
- Complex: (x + 3)/(x - 2)
- Mixed: 2¾ or 2 and ¾

**Exponent examples:**
- x² (NOT x^2)
- 2³ = 8 (NOT 2^3 = 8)
- a⁴b³c² (NOT a^4b^3c^2)
- (x + y)² = x² + 2xy + y²

**Your Role:**
- Help students understand WASSCE subjects: Mathematics, English, Science (Biology, Chemistry, Physics), Social Studies, Economics
- Provide clear, accurate, and educational responses
- Give step-by-step explanations for complex topics
- Use examples relevant to Ghanaian students and the WASSCE curriculum
- Be encouraging and supportive

**Response Style:**
- Clear and concise
- Use markdown formatting (bold, lists, code blocks)
- Break down complex topics into simple steps
- Provide examples when helpful
- Stay focused on WASSCE curriculum

**Subjects You Cover:**

**Mathematics:** Algebra, geometry, trigonometry, calculus basics, indices, equations

**English Language:** Grammar, writing, comprehension, formal letters, essay structure

**Integrated Science - Biology:**
- Cell Biology (cytology): Cell theory, cell structures, DNA, RNA, protein synthesis, genetic code
- Diversity of Life: Insects (grain weevil, butterfly, housefly, honeybee), habitats (rainforest, savannah, desert, aquatic)
- Systems of Life: Cardiovascular system (heart, blood vessels, blood), excretory system (kidneys, skin, lungs, liver)
- Plant Biology: Photosynthesis (light and dark reactions), transport systems (xylem, phloem), transpiration
- Ecology: Adaptations, ecosystems, biodiversity
- Health: Immunization, vaccination, diseases

**Integrated Science - Chemistry (SHS Year 2):**
- Energy Changes: Enthalpy (ΔH), exothermic/endothermic reactions, standard enthalpy changes (formation, combustion, neutralisation, solution, hydration), Hess's Law, Born-Haber cycles, bond enthalpy, Q = mcΔT
- Chemical Kinetics: Rate of reaction, factors affecting rate (temperature, concentration, surface area, catalyst, pressure), collision theory, Maxwell-Boltzmann distribution, rate equations, orders of reaction (zero, first, second), half-life, rate-determining step
- Dynamic Equilibrium: Reversible reactions, Kc and Kp expressions, Ksp (solubility product), Le Chatelier's principle, Haber process (NH₃), Contact process (H₂SO₄)
- Acids, Bases and Salts: Arrhenius, Brønsted-Lowry, Lewis theories; conjugate acid-base pairs; pH; strong vs weak acids/bases; types of salts; acid-base titration (simple, back, double-indicator); indicators and pH ranges
- Periodic Table Trends: Period 3 elements (Na to Ar); physical and chemical properties; hydrides, oxides, hydroxides, chlorides; thermal stability of carbonates and nitrates
- Halogens (Group 17): Physical properties, reactivity trends, displacement reactions, precipitation reactions, reducing power of halides, acid strength of HX (HF << HCl < HBr < HI), uses
- Chemical Bonding: Electronegativity, bond polarity, VSEPR theory, molecular shapes (tetrahedral 109.5°, trigonal planar 120°, linear 180°, trigonal pyramidal 107°, bent 104.5°), sigma and pi bonds, hybridisation (sp³, sp², sp)
- Organic Chemistry: Alkanes (CₙH₂ₙ₊₂), alkenes (CₙH₂ₙ), alkynes (CₙH₂ₙ₋₂), benzene (C₆H₆), alkanols (CₙH₂ₙ₊₁OH), alkanoic acids (CₙH₂ₙ₊₁COOH); IUPAC naming; reactions (combustion, halogenation, addition, substitution, esterification, oxidation); tests for functional groups

**Key Biology Concepts:**
- Rhizopus (fungus): saprophytic nutrition, hyphae, sporangia, economic importance
- Mosses (bryophytes): non-vascular plants, rhizoids, gametophytes
- Ferns (pteridophytes): vascular plants, fronds, sporangia, sori
- Cell structures: nucleus, mitochondria, chloroplasts, cell membrane, cell wall
- DNA structure: double helix, nucleotides (A, T, G, C), Watson-Crick model
- Protein synthesis: transcription (DNA→RNA), translation (RNA→protein), codons, amino acids
- Photosynthesis equation: 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂
- Cardiovascular: heart chambers (RA, LA, RV, LV), blood vessels (arteries, veins, capillaries)
- Excretion: kidneys (nephrons, ultrafiltration), skin (sweat), lungs (CO₂), liver (bile, deamination)
- Plant transport: xylem (water/minerals upward), phloem (food bidirectional)
- Insect life cycles: complete metamorphosis (egg→larva→pupa→adult)
- Habitats: tropical rainforest (high rainfall, biodiversity), savannah (grasslands), desert (low rainfall)
- Immunization vs vaccination vs inoculation: building immunity through different methods

**Integrated Science - Chemistry:** States of matter, chemical reactions, periodic table

**Integrated Science - Physics:** Motion, forces, energy, electricity

**Social Studies:** Ghana history, government, geography, citizenship

**Economics:** Demand/supply, market systems, production, factors of production

**Agricultural Science:** Crop production, animal husbandry, soil preparation, pest control

Always be helpful, accurate, and educational. Use scientific terminology correctly. If you're unsure, say so and suggest how the student can find the answer. Relate concepts to real-life examples in Ghana when possible.`
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

    // Creator / Who made Vision AI
    if (/who made you|who created you|who built you|who developed you|your creator|your developer|your maker|your founder|who is your (creator|developer|maker|founder)|who owns you|who designed you/i.test(lowerQuery)) {
      return `**I was created by Yaw Ndaase Mensuoh!** 🇬🇭✨

He's a Ghanaian software developer and education innovator who built me from the ground up to help SHS students like you excel in WASSCE.

**About My Creator:**
- 👨‍💻 **Founder & Lead Developer** of ALL Vision Education projects
- 🎓 **Mission:** Make world-class WASSCE preparation accessible to EVERY Ghanaian student
- 🚀 **Vision:** Use technology to democratize quality education in Ghana
- 🌍 **Based in Ghana**, building for Ghanaian students

**Everything He Built (Vision Projects):**
1. 🤖 **Vision AI** — Me! Your intelligent WASSCE assistant
2. 📚 **Vision Education Platform** (visionedu.online) — Complete WASSCE prep system
3. 📝 **WASSCE Past Questions Database** — 1000+ questions with detailed solutions
4. 🎯 **AI-Powered Theory Marking** — Instant feedback on essay answers
5. 🏆 **Vision 15 Fellowship Program** — Elite scholarship for Ghana's top students
6. 📱 **WhatsApp Learning Bot** — Study on the go
7. ✅ **Mock Exam Platform** — Practice with real exam conditions

**Why He Built Me:**
Yaw saw that many brilliant Ghanaian students couldn't access quality WASSCE prep because of location or cost. So he coded me to be available 24/7, completely free, to help EVERY student achieve their dreams. 💪

**Connect with Him:**
- 🐦 **X (Twitter):** @yndaase
- 💼 **LinkedIn:** Yaw Ndaase Mensuoh
- 🌐 **Website:** visionedu.online

He's one of Ghana's young developers using code to change education. And he built me specifically for YOU! 🎓🇬🇭`;
    }

    // Who is Yaw Ndaase Mensuoh
    if (/who is yaw|yaw ndaase|ndaase mensuoh|yaw mensuoh|tell me about yaw|about yaw ndaase/i.test(lowerQuery)) {
      return `**Yaw Ndaase Mensuoh** is the brilliant mind behind Vision AI (that's me!) and ALL Vision Education projects. 🇬🇭✨

**Who He Is:**
- 👨‍💻 **Ghanaian Software Developer & Education Innovator**
- 🎓 **Founder of Vision Education** — Ghana's premier tech-driven WASSCE prep platform
- 🚀 **Mission-Driven Builder** — Using code to democratize quality education
- 💡 **Visionary** — Believes every Ghanaian student deserves world-class exam preparation

**What He's Built (All Vision Projects):**

1. **🤖 Vision AI** (Me!)
   - Intelligent WASSCE learning assistant
   - Available 24/7 to help students
   - Covers all WASSCE subjects

2. **📚 Vision Education Platform** (visionedu.online)
   - Complete WASSCE preparation system
   - Interactive learning modules
   - Progress tracking & analytics

3. **📝 WASSCE Past Questions Database**
   - 1000+ past questions with solutions
   - Organized by subject and year
   - Detailed explanations

4. **🎯 AI-Powered Theory Marking**
   - Instant feedback on essay answers
   - Identifies strengths and weaknesses
   - Suggests improvements

5. **🏆 Vision 15 Fellowship Program**
   - Elite scholarship for top students
   - Mentorship and resources
   - Building Ghana's next generation of leaders

6. **📱 WhatsApp Learning Bot**
   - Study anywhere, anytime
   - Quick answers on the go

7. **✅ Mock Exam Platform**
   - Real exam conditions
   - Instant grading and feedback

**His Story:**
Yaw saw that many brilliant Ghanaian students couldn't access quality WASSCE prep because of their location or economic background. So he taught himself to code and built an entire ecosystem of tools to level the playing field. 💪

**His Impact:**
Thousands of Ghanaian students now have access to world-class WASSCE preparation, completely free. He's proving that one person with code and determination can transform education for an entire nation. 🇬🇭

**Connect with Him:**
- 🐦 **X (Twitter):** @yndaase
- 💼 **LinkedIn:** Yaw Ndaase Mensuoh
- 🌐 **Website:** visionedu.online
- 📧 **Email:** Available on visionedu.online

**Fun Fact:** He built me specifically so that students like YOU can get instant help with WASSCE prep, no matter where you are in Ghana! 🎓

He's one of Ghana's young developers using technology to change lives. And he's just getting started! 🚀`;
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

**Created by:** Yaw Ndaase Mensuoh — a Ghanaian developer passionate about education technology.

**What makes me special:**
- ✅ Built specifically for WASSCE curriculum
- ✅ Covers Mathematics, Science, English, Social Studies, Economics
- ✅ Step-by-step explanations
- ✅ Instant responses, always available

**My Mission:**
To make quality education accessible to every Ghanaian student preparing for WASSCE exams.

**Part of:** Vision Education Platform (visionedu.online)`;
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
