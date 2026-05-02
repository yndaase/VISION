/**
 * Vision AI Knowledge Base
 * Contains WASSCE curriculum content organized by subject
 */

export const knowledgeBase = {
  // MATHEMATICS
  mathematics: {
    'quadratic formula': {
      question: ['quadratic formula', 'solve quadratic', 'x² equation'],
      answer: `**Quadratic Formula**

The quadratic formula is used to solve equations of the form: ax² + bx + c = 0

**Formula:**
x = (-b ± √(b² - 4ac)) / 2a

**Steps to use:**
1. Identify a, b, and c from your equation
2. Calculate the discriminant: b² - 4ac
3. If discriminant ≥ 0, substitute into formula
4. Simplify to get two solutions (or one if discriminant = 0)

**Example:** Solve 2x² + 5x - 3 = 0
- a = 2, b = 5, c = -3
- Discriminant = 5² - 4(2)(-3) = 25 + 24 = 49
- x = (-5 ± √49) / 4 = (-5 ± 7) / 4
- x = 0.5 or x = -3

**When discriminant is:**
- Positive: Two real solutions
- Zero: One real solution
- Negative: No real solutions`,
      subject: 'Core Mathematics'
    },

    'laws of indices': {
      question: ['laws of indices', 'index laws', 'exponent rules', 'power rules'],
      answer: `**Laws of Indices (Exponent Rules)**

**1. Multiplication Rule:** aᵐ × aⁿ = aᵐ⁺ⁿ
   Example: 2³ × 2² = 2⁵ = 32

**2. Division Rule:** aᵐ ÷ aⁿ = aᵐ⁻ⁿ
   Example: 5⁴ ÷ 5² = 5² = 25

**3. Power of a Power:** (aᵐ)ⁿ = aᵐⁿ
   Example: (3²)³ = 3⁶ = 729

**4. Power of a Product:** (ab)ⁿ = aⁿbⁿ
   Example: (2×3)² = 2² × 3² = 4 × 9 = 36

**5. Power of a Quotient:** (a/b)ⁿ = aⁿ/bⁿ
   Example: (4/2)³ = 4³/2³ = 64/8 = 8

**6. Zero Index:** a⁰ = 1 (where a ≠ 0)
   Example: 100⁰ = 1

**7. Negative Index:** a⁻ⁿ = 1/aⁿ
   Example: 2⁻³ = 1/2³ = 1/8

**8. Fractional Index:** a^(m/n) = ⁿ√(aᵐ)
   Example: 8^(2/3) = ³√(8²) = ³√64 = 4`,
      subject: 'Core Mathematics'
    },

    'pythagoras theorem': {
      question: ['pythagoras', 'pythagorean theorem', 'right triangle', 'hypotenuse'],
      answer: `**Pythagoras' Theorem**

In a right-angled triangle, the square of the hypotenuse equals the sum of squares of the other two sides.

**Formula:** a² + b² = c²

Where:
- c = hypotenuse (longest side, opposite the right angle)
- a and b = the other two sides

**Finding the hypotenuse:**
c = √(a² + b²)

**Finding a shorter side:**
a = √(c² - b²)

**Example 1:** Find the hypotenuse if sides are 3 and 4
- c² = 3² + 4² = 9 + 16 = 25
- c = √25 = 5

**Example 2:** Find the missing side if hypotenuse is 13 and one side is 5
- a² = 13² - 5² = 169 - 25 = 144
- a = √144 = 12

**Common Pythagorean Triples:**
- 3, 4, 5
- 5, 12, 13
- 8, 15, 17
- 7, 24, 25`,
      subject: 'Core Mathematics'
    },

    'simultaneous equations': {
      question: ['simultaneous equations', 'solve two equations', 'elimination method', 'substitution method'],
      answer: `**Simultaneous Equations**

Two methods to solve two equations with two unknowns:

**Method 1: Elimination**
1. Make coefficients of one variable equal
2. Add or subtract equations to eliminate that variable
3. Solve for remaining variable
4. Substitute back to find other variable

Example: 
2x + y = 7 ... (1)
3x - y = 8 ... (2)

Add equations: 5x = 15, so x = 3
Substitute: 2(3) + y = 7, so y = 1

**Method 2: Substitution**
1. Rearrange one equation for one variable
2. Substitute into other equation
3. Solve for one variable
4. Substitute back to find other variable

Example:
y = 2x + 1 ... (1)
3x + 2y = 12 ... (2)

Substitute (1) into (2): 3x + 2(2x + 1) = 12
3x + 4x + 2 = 12
7x = 10, so x = 10/7
Then y = 2(10/7) + 1 = 27/7`,
      subject: 'Core Mathematics'
    }
  },

  // ENGLISH LANGUAGE
  english: {
    'formal letter': {
      question: ['formal letter', 'write formal letter', 'business letter', 'official letter'],
      answer: `**How to Write a Formal Letter (WASSCE Format)**

**Structure:**

1. **Your Address** (top right)
   123 Main Street
   Accra, Ghana
   
2. **Date** (below your address)
   2nd May, 2026

3. **Recipient's Address** (left side)
   The Principal
   Augusco Senior High School
   Cape Coast, Ghana

4. **Salutation**
   Dear Sir/Madam,

5. **Subject/Title** (underlined)
   Application for School Prefect Position

6. **Body** (3-4 paragraphs)
   - Introduction: State purpose
   - Main content: Details/reasons
   - Conclusion: Closing remarks

7. **Closing**
   Yours faithfully, (if you don't know the name)
   Yours sincerely, (if you know the name)

8. **Signature**
   [Your signature]
   Your Full Name

**Key Points:**
- Use formal language
- Be clear and concise
- Check spelling and grammar
- Use proper punctuation
- Maintain respectful tone`,
      subject: 'English Language'
    },

    'parts of speech': {
      question: ['parts of speech', 'noun', 'verb', 'adjective', 'adverb', 'grammar'],
      answer: `**Parts of Speech**

**1. Noun** - Names of people, places, things, or ideas
   Examples: student, Ghana, book, happiness

**2. Pronoun** - Replaces a noun
   Examples: he, she, it, they, who, which

**3. Verb** - Action or state of being
   Examples: run, study, is, become

**4. Adjective** - Describes a noun
   Examples: beautiful, tall, intelligent, red

**5. Adverb** - Describes a verb, adjective, or another adverb
   Examples: quickly, very, well, yesterday

**6. Preposition** - Shows relationship between words
   Examples: in, on, at, by, with, from

**7. Conjunction** - Connects words or clauses
   Examples: and, but, or, because, although

**8. Interjection** - Expresses emotion
   Examples: Oh! Wow! Alas! Hurray!

**Quick Test:**
"The intelligent student quickly solved the difficult problem."
- The: Article
- intelligent: Adjective
- student: Noun
- quickly: Adverb
- solved: Verb
- difficult: Adjective
- problem: Noun`,
      subject: 'English Language'
    }
  },

  // INTEGRATED SCIENCE
  science: {
    'photosynthesis': {
      question: ['photosynthesis', 'how plants make food', 'chlorophyll'],
      answer: `**Photosynthesis**

The process by which green plants make their own food using sunlight.

**Word Equation:**
Carbon dioxide + Water → Glucose + Oxygen
(in the presence of sunlight and chlorophyll)

**Chemical Equation:**
6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂

**Requirements:**
1. **Sunlight** - Energy source
2. **Chlorophyll** - Green pigment in leaves
3. **Carbon dioxide** - From air through stomata
4. **Water** - From soil through roots

**Process:**
1. Light energy is absorbed by chlorophyll
2. Water molecules are split (photolysis)
3. Carbon dioxide is reduced to glucose
4. Oxygen is released as by-product

**Where it happens:**
- **Chloroplasts** in leaf cells
- Mainly in **palisade mesophyll** layer

**Importance:**
- Produces food for plants
- Releases oxygen for respiration
- Removes CO₂ from atmosphere
- Base of food chains

**Factors affecting rate:**
- Light intensity
- CO₂ concentration
- Temperature
- Water availability`,
      subject: 'Integrated Science'
    },

    'states of matter': {
      question: ['states of matter', 'solid liquid gas', 'matter', 'particles'],
      answer: `**States of Matter**

Matter exists in three main states: Solid, Liquid, and Gas

**SOLID**
- **Shape:** Fixed/definite shape
- **Volume:** Fixed volume
- **Particles:** Very close together, vibrate in fixed positions
- **Examples:** Ice, wood, metal, rock

**LIQUID**
- **Shape:** Takes shape of container
- **Volume:** Fixed volume
- **Particles:** Close together but can move around
- **Examples:** Water, oil, milk, blood

**GAS**
- **Shape:** Fills entire container
- **Volume:** No fixed volume
- **Particles:** Far apart, move freely and randomly
- **Examples:** Air, oxygen, carbon dioxide, steam

**Changes of State:**
- **Melting:** Solid → Liquid (heating)
- **Freezing:** Liquid → Solid (cooling)
- **Evaporation:** Liquid → Gas (heating)
- **Condensation:** Gas → Liquid (cooling)
- **Sublimation:** Solid → Gas directly
- **Deposition:** Gas → Solid directly

**Particle Theory:**
- All matter is made of tiny particles
- Particles are always moving
- Temperature affects particle movement
- Spaces between particles vary by state`,
      subject: 'Integrated Science'
    }
  },

  // SOCIAL STUDIES
  social: {
    'ghana independence': {
      question: ['ghana independence', 'when did ghana gain independence', '6th march', 'nkrumah'],
      answer: `**Ghana's Independence**

**Date:** 6th March, 1957

**Key Facts:**
- Ghana was the **first sub-Saharan African country** to gain independence
- Previously called the **Gold Coast** (British colony)
- Led by **Dr. Kwame Nkrumah** and the Convention People's Party (CPP)

**Timeline:**
- **1947:** United Gold Coast Convention (UGCC) formed
- **1949:** CPP formed by Nkrumah
- **1951:** Nkrumah becomes Leader of Government Business
- **1952:** Nkrumah becomes Prime Minister
- **1957:** Independence achieved on 6th March
- **1960:** Ghana becomes a Republic

**Key Leaders:**
- **Dr. Kwame Nkrumah** - First Prime Minister and President
- **The Big Six:** Nkrumah, J.B. Danquah, Edward Akufo-Addo, Ebenezer Ako-Adjei, Emmanuel Obetsebi-Lamptey, William Ofori Atta

**Significance:**
- Inspired other African nations
- Pan-African movement leadership
- Symbol of African liberation
- "Ghana, your beloved country is free forever!"

**National Symbols:**
- **Flag:** Red (blood), Gold (wealth), Green (forests), Black Star (freedom)
- **Motto:** "Freedom and Justice"
- **Anthem:** "God Bless Our Homeland Ghana"`,
      subject: 'Social Studies'
    },

    'three arms of government': {
      question: ['arms of government', 'branches of government', 'executive legislative judicial'],
      answer: `**Three Arms of Government**

**1. EXECUTIVE ARM**
- **Function:** Implements and enforces laws
- **Head:** President
- **Members:** President, Vice President, Ministers, Civil Servants
- **Duties:**
  - Execute laws passed by Parliament
  - Manage day-to-day government affairs
  - Formulate policies
  - Conduct foreign relations

**2. LEGISLATIVE ARM**
- **Function:** Makes laws
- **Body:** Parliament
- **Members:** 275 Members of Parliament (MPs)
- **Duties:**
  - Pass new laws
  - Amend existing laws
  - Approve national budget
  - Oversight of Executive

**3. JUDICIAL ARM**
- **Function:** Interprets laws and administers justice
- **Head:** Chief Justice
- **Courts:** Supreme Court, Court of Appeal, High Court, Circuit Courts, District Courts
- **Duties:**
  - Interpret the Constitution
  - Settle disputes
  - Punish lawbreakers
  - Protect citizens' rights

**Separation of Powers:**
- Each arm is independent
- Provides checks and balances
- Prevents abuse of power
- Ensures democracy

**Checks and Balances:**
- Parliament can impeach President
- President appoints judges (with approval)
- Courts can declare laws unconstitutional
- Parliament approves Executive appointments`,
      subject: 'Social Studies'
    }
  },

  // ECONOMICS
  economics: {
    'demand and supply': {
      question: ['demand and supply', 'law of demand', 'law of supply', 'market equilibrium'],
      answer: `**Demand and Supply**

**LAW OF DEMAND**
"As price increases, quantity demanded decreases (and vice versa), all other factors remaining constant."

**Demand Curve:** Slopes downward (left to right)

**Factors affecting Demand:**
- Price of the good
- Income of consumers
- Prices of related goods (substitutes/complements)
- Consumer tastes and preferences
- Population size
- Future price expectations

**LAW OF SUPPLY**
"As price increases, quantity supplied increases (and vice versa), all other factors remaining constant."

**Supply Curve:** Slopes upward (left to right)

**Factors affecting Supply:**
- Price of the good
- Cost of production
- Technology
- Number of sellers
- Government policies (taxes, subsidies)
- Future price expectations
- Weather (for agricultural products)

**MARKET EQUILIBRIUM**
- Point where demand equals supply
- **Equilibrium Price:** Price at which quantity demanded = quantity supplied
- **Equilibrium Quantity:** Amount bought and sold at equilibrium price

**Market Changes:**
- **Surplus:** Supply > Demand (price falls)
- **Shortage:** Demand > Supply (price rises)

**Example:**
If price of oranges increases:
- Demand decreases (consumers buy less)
- Supply increases (farmers supply more)
- Market moves toward new equilibrium`,
      subject: 'Economics'
    }
  }
};

/**
 * Search knowledge base for relevant content
 */
export function searchKnowledge(query) {
  const lowerQuery = query.toLowerCase();
  const results = [];

  // Search through all subjects
  for (const subject in knowledgeBase) {
    for (const topic in knowledgeBase[subject]) {
      const entry = knowledgeBase[subject][topic];
      
      // Check if query matches any question patterns
      const matches = entry.question.some(pattern => 
        lowerQuery.includes(pattern.toLowerCase())
      );

      if (matches) {
        results.push({
          topic,
          subject: entry.subject,
          answer: entry.answer,
          relevance: calculateRelevance(lowerQuery, entry.question)
        });
      }
    }
  }

  // Sort by relevance
  results.sort((a, b) => b.relevance - a.relevance);
  
  return results;
}

/**
 * Calculate relevance score
 */
function calculateRelevance(query, patterns) {
  let score = 0;
  patterns.forEach(pattern => {
    if (query.includes(pattern.toLowerCase())) {
      score += pattern.split(' ').length; // Longer matches = higher score
    }
  });
  return score;
}
