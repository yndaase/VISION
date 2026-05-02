/**
 * Vision AI Math Engine
 * Solves mathematical problems without external APIs
 */

export class MathEngine {
  /**
   * Detect if query is a math problem
   */
  static isMathQuery(query) {
    const mathPatterns = [
      /solve|calculate|compute|find|what is/i,
      /\d+\s*[\+\-\*\/\^]\s*\d+/,
      /equation|formula|algebra/i,
      /x\s*[\+\-\*\/\=]/,
      /\d+x/
    ];

    return mathPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Solve math problem
   */
  static solve(query) {
    try {
      // Simple arithmetic
      if (this.isArithmetic(query)) {
        return this.solveArithmetic(query);
      }

      // Linear equations (e.g., "3x + 9 = 24")
      if (this.isLinearEquation(query)) {
        return this.solveLinearEquation(query);
      }

      // Quadratic equations
      if (this.isQuadraticEquation(query)) {
        return this.solveQuadraticEquation(query);
      }

      // Percentage calculations
      if (this.isPercentage(query)) {
        return this.solvePercentage(query);
      }

      return null;
    } catch (error) {
      console.error('Math engine error:', error);
      return null;
    }
  }

  /**
   * Check if arithmetic expression
   */
  static isArithmetic(query) {
    return /^\s*\d+\s*[\+\-\*\/]\s*\d+/.test(query);
  }

  /**
   * Solve arithmetic
   */
  static solveArithmetic(query) {
    const match = query.match(/(\d+\.?\d*)\s*([\+\-\*\/])\s*(\d+\.?\d*)/);
    if (!match) return null;

    const [, num1, operator, num2] = match;
    const a = parseFloat(num1);
    const b = parseFloat(num2);
    let result;

    switch (operator) {
      case '+': result = a + b; break;
      case '-': result = a - b; break;
      case '*': result = a * b; break;
      case '/': result = b !== 0 ? a / b : 'undefined (division by zero)'; break;
      default: return null;
    }

    return {
      answer: `**Solution:**

${a} ${operator} ${b} = **${result}**

**Step-by-step:**
1. Identify the numbers: ${a} and ${b}
2. Apply the operation: ${operator}
3. Result: ${result}`,
      source: 'math-engine'
    };
  }

  /**
   * Check if linear equation
   */
  static isLinearEquation(query) {
    return /\d*x\s*[\+\-]\s*\d+\s*=\s*\d+/.test(query);
  }

  /**
   * Solve linear equation (ax + b = c)
   */
  static solveLinearEquation(query) {
    // Match patterns like "3x + 9 = 24" or "2x - 5 = 11"
    const match = query.match(/(\d*)x\s*([\+\-])\s*(\d+)\s*=\s*(\d+)/);
    if (!match) return null;

    const [, coeffStr, operator, constant, result] = match;
    const a = coeffStr === '' ? 1 : parseFloat(coeffStr);
    const b = parseFloat(constant);
    const c = parseFloat(result);

    // Solve: ax + b = c  =>  x = (c - b) / a  or  ax - b = c  =>  x = (c + b) / a
    let x;
    if (operator === '+') {
      x = (c - b) / a;
    } else {
      x = (c + b) / a;
    }

    return {
      answer: `**Solution: Linear Equation**

**Given:** ${a === 1 ? '' : a}x ${operator} ${b} = ${c}

**Step 1:** Isolate x
${operator === '+' ? `${a === 1 ? '' : a}x = ${c} - ${b}` : `${a === 1 ? '' : a}x = ${c} + ${b}`}
${a === 1 ? '' : a}x = ${operator === '+' ? c - b : c + b}

**Step 2:** Divide by ${a}
x = ${operator === '+' ? c - b : c + b} ÷ ${a}

**Answer:** x = **${x}**

**Verification:**
${a === 1 ? '' : a}(${x}) ${operator} ${b} = ${a * x} ${operator} ${b} = ${c} ✓`,
      source: 'math-engine'
    };
  }

  /**
   * Check if quadratic equation
   */
  static isQuadraticEquation(query) {
    return /x[²2]|x\^2|quadratic/.test(query);
  }

  /**
   * Solve quadratic equation (simplified)
   */
  static solveQuadraticEquation(query) {
    // Match patterns like "x² + 5x + 6 = 0" or "2x^2 - 3x - 2 = 0"
    const match = query.match(/(\d*)x[²\^]?2?\s*([\+\-])\s*(\d+)x\s*([\+\-])\s*(\d+)\s*=\s*0/);
    if (!match) {
      return {
        answer: `**Quadratic Equation Formula**

For equations of the form: ax² + bx + c = 0

**Formula:** x = (-b ± √(b² - 4ac)) / 2a

**Steps:**
1. Identify a, b, and c
2. Calculate discriminant: b² - 4ac
3. Substitute into formula
4. Simplify to get solutions

**Example:** x² + 5x + 6 = 0
- a = 1, b = 5, c = 6
- Discriminant = 25 - 24 = 1
- x = (-5 ± 1) / 2
- x = -2 or x = -3`,
        source: 'math-engine'
      };
    }

    const [, aStr, sign1, b, sign2, c] = match;
    const a = aStr === '' ? 1 : parseFloat(aStr);
    const bVal = (sign1 === '-' ? -1 : 1) * parseFloat(b);
    const cVal = (sign2 === '-' ? -1 : 1) * parseFloat(c);

    // Calculate discriminant
    const discriminant = bVal * bVal - 4 * a * cVal;

    if (discriminant < 0) {
      return {
        answer: `**Solution: Quadratic Equation**

**Given:** ${a === 1 ? '' : a}x² ${sign1} ${b}x ${sign2} ${c} = 0

**Discriminant:** b² - 4ac = ${bVal}² - 4(${a})(${cVal}) = ${discriminant}

**Result:** No real solutions (discriminant is negative)`,
        source: 'math-engine'
      };
    }

    const sqrtDisc = Math.sqrt(discriminant);
    const x1 = (-bVal + sqrtDisc) / (2 * a);
    const x2 = (-bVal - sqrtDisc) / (2 * a);

    return {
      answer: `**Solution: Quadratic Equation**

**Given:** ${a === 1 ? '' : a}x² ${sign1} ${b}x ${sign2} ${c} = 0

**Using Quadratic Formula:** x = (-b ± √(b² - 4ac)) / 2a

**Step 1:** Identify coefficients
- a = ${a}, b = ${bVal}, c = ${cVal}

**Step 2:** Calculate discriminant
b² - 4ac = ${bVal}² - 4(${a})(${cVal}) = ${discriminant}

**Step 3:** Apply formula
x = (${-bVal} ± √${discriminant}) / ${2 * a}
x = (${-bVal} ± ${sqrtDisc.toFixed(2)}) / ${2 * a}

**Solutions:**
- x₁ = **${x1.toFixed(2)}**
- x₂ = **${x2.toFixed(2)}**`,
      source: 'math-engine'
    };
  }

  /**
   * Check if percentage calculation
   */
  static isPercentage(query) {
    return /percent|%/.test(query);
  }

  /**
   * Solve percentage problems
   */
  static solvePercentage(query) {
    // Match "what is X% of Y" or "X% of Y"
    const match = query.match(/(\d+)%?\s*of\s*(\d+)/i);
    if (!match) return null;

    const [, percent, number] = match;
    const result = (parseFloat(percent) / 100) * parseFloat(number);

    return {
      answer: `**Percentage Calculation**

**Question:** What is ${percent}% of ${number}?

**Formula:** (Percentage / 100) × Number

**Solution:**
(${percent} / 100) × ${number} = ${result}

**Answer:** **${result}**`,
      source: 'math-engine'
    };
  }
}
