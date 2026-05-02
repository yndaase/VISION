# Vision AI - Test Queries

Test these queries to verify Vision AI is working correctly.

## ✅ Mathematics

### Basic Arithmetic
```
12 + 8
45 - 17
6 * 9
144 / 12
```

### Linear Equations
```
Solve 3x + 9 = 24
Solve: 2x - 5 = 11
5x + 10 = 35
x + 7 = 15
```

### Quadratic Equations
```
What is the quadratic formula?
Solve x² + 5x + 6 = 0
Explain quadratic equations
```

### Percentage
```
What is 25% of 80?
Calculate 15% of 200
50% of 60
```

### Formulas
```
Laws of indices
Pythagoras theorem
Simultaneous equations
```

## ✅ English Language

```
How to write a formal letter
Formal letter format for WASSCE
Parts of speech
Explain nouns and verbs
Grammar rules
```

## ✅ Integrated Science

```
Explain photosynthesis
What is photosynthesis?
States of matter
Difference between solid liquid and gas
How do plants make food?
```

## ✅ Social Studies

```
When did Ghana gain independence?
Ghana independence date
Who was Kwame Nkrumah?
Three arms of government
Branches of government
Executive legislative judicial
```

## ✅ Economics

```
Demand and supply
Law of demand
Law of supply
Market equilibrium
What is demand?
```

## ✅ General Queries

### Greetings
```
Hello
Hi there
Good morning
Hey
```

### Help
```
What can you do?
Help me
How do you work?
What are your capabilities?
```

### About
```
Who are you?
What are you?
Tell me about yourself
```

### Study Tips
```
Study tips
How to study for WASSCE
Exam preparation
How to study better
```

### Exam Format
```
WASSCE exam format
Exam structure
How many papers in WASSCE?
WASSCE grading system
```

## ✅ Edge Cases

### Unknown Topics
```
Tell me about quantum physics
Explain cryptocurrency
What is machine learning?
```
**Expected:** Fallback response with suggestions

### Incomplete Queries
```
What is
Explain
Tell me
```
**Expected:** Request for clarification

### Mixed Queries
```
Hello, can you solve 3x + 9 = 24?
Hi! What is photosynthesis?
```
**Expected:** Should handle both greeting and question

## 📊 Expected Response Times

- **Math Engine:** < 100ms
- **Knowledge Base:** < 200ms
- **Pattern Recognition:** < 100ms
- **Fallback:** < 150ms

## 🎯 Success Criteria

### ✅ Math Engine
- [ ] Solves arithmetic correctly
- [ ] Shows step-by-step for equations
- [ ] Handles invalid input gracefully
- [ ] Formats answers clearly

### ✅ Knowledge Base
- [ ] Returns relevant content
- [ ] Matches keywords correctly
- [ ] Provides complete explanations
- [ ] Includes subject labels

### ✅ Pattern Recognition
- [ ] Responds to greetings
- [ ] Provides help information
- [ ] Gives study tips
- [ ] Explains exam format

### ✅ User Experience
- [ ] Fast response times
- [ ] Clear formatting
- [ ] Helpful error messages
- [ ] Relevant suggestions

## 🧪 Testing Procedure

### 1. Manual Testing
```bash
# Start development server
npm run dev

# Open browser
http://localhost:3000

# Test each category of queries
# Verify responses are correct
# Check response times
# Test edge cases
```

### 2. API Testing
```bash
# Test API endpoint directly
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query":"Solve 3x + 9 = 24","sessionId":"test"}'
```

### 3. Load Testing
```bash
# Send multiple requests
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/chat \
    -H "Content-Type: application/json" \
    -d '{"query":"What is photosynthesis?","sessionId":"test'$i'"}'
done
```

## 📝 Test Results Template

```
Date: ___________
Tester: ___________

Mathematics:
- Arithmetic: ✅ / ❌
- Linear Equations: ✅ / ❌
- Quadratic Equations: ✅ / ❌
- Percentage: ✅ / ❌

English:
- Formal Letter: ✅ / ❌
- Parts of Speech: ✅ / ❌

Science:
- Photosynthesis: ✅ / ❌
- States of Matter: ✅ / ❌

Social Studies:
- Ghana Independence: ✅ / ❌
- Government: ✅ / ❌

Economics:
- Demand/Supply: ✅ / ❌

General:
- Greetings: ✅ / ❌
- Help: ✅ / ❌
- Study Tips: ✅ / ❌

Performance:
- Average Response Time: _____ ms
- Slowest Query: _____ ms
- Fastest Query: _____ ms

Issues Found:
1. ___________
2. ___________
3. ___________

Overall Rating: _____ / 10
```

## 🐛 Known Limitations

1. **Limited Knowledge Base**
   - Only covers topics explicitly added
   - Cannot answer questions outside curriculum

2. **Math Engine Constraints**
   - Only handles specific equation formats
   - Cannot solve complex calculus
   - Limited to basic algebra

3. **No Context Memory**
   - Each query is independent
   - Cannot reference previous answers
   - No multi-turn reasoning

4. **Pattern Matching**
   - May miss variations of questions
   - Requires specific keywords
   - Cannot understand complex phrasing

## 🔄 Continuous Improvement

### Add Test Results
After testing, document:
- Queries that failed
- Unexpected responses
- Performance issues
- User feedback

### Update Knowledge Base
Based on test results:
- Add missing topics
- Improve existing answers
- Add more keywords
- Refine responses

### Enhance Math Engine
- Add new problem types
- Improve step-by-step explanations
- Handle more formats
- Better error messages

---

**Test thoroughly before deployment!**  
**Report issues to development team**  
**Version 2.0.0 - Self-Contained Engine**
