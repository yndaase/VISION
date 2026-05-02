# Vision AI - WASSCE Intelligence Engine

A self-contained AI learning assistant built specifically for WASSCE students in Ghana. No external APIs required for core functionality.

## 🌟 Features

### ✅ Self-Contained System
- **No API Keys Required** - Works completely offline
- **Local Knowledge Base** - Pre-loaded with WASSCE curriculum content
- **Built-in Math Engine** - Solves equations step-by-step
- **Pattern Recognition** - Intelligent query understanding

### 📚 Subject Coverage

**Mathematics**
- Quadratic formula and equations
- Laws of indices
- Pythagoras theorem
- Simultaneous equations
- Linear equations
- Percentage calculations

**English Language**
- Formal letter writing
- Parts of speech
- Grammar rules
- Essay structure

**Integrated Science**
- Photosynthesis
- States of matter
- Chemical reactions
- Physics concepts

**Social Studies**
- Ghana independence history
- Three arms of government
- Citizenship and rights

**Economics**
- Demand and supply
- Market equilibrium
- Economic systems

### 🔐 Authentication
- Google OAuth integration
- Email/password login
- Session management
- User profile display

### 💾 Data Persistence
- Firebase chat history (optional)
- Local session storage
- Conversation context

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (for local development)
- Vercel account (for deployment)

### Local Development

```bash
# 1. Clone repository
git clone https://github.com/yndaase/VISION.git
cd VISION/vision-ai

# 2. Install dependencies (minimal)
npm install

# 3. Run development server
npm run dev

# 4. Open browser
# Visit: http://localhost:3000
```

### Deploy to Vercel

**Method 1: Vercel CLI**
```bash
cd vision-ai
vercel --prod
```

**Method 2: Vercel Dashboard**
1. Go to https://vercel.com/new
2. Import `yndaase/VISION` repository
3. Set **Root Directory** to `vision-ai`
4. Deploy

## 📁 Project Structure

```
vision-ai/
├── index.html              # Main chat interface
├── login.html              # Authentication page
├── styles.css              # Main app styles
├── login-styles.css        # Login page styles
├── app.js                  # Frontend logic
├── login.js                # Login functionality
├── firebase-config.js      # Firebase configuration
├── api/
│   └── chat.js            # Serverless chat endpoint
├── engine/
│   ├── ai-engine.js       # Main AI intelligence
│   ├── knowledge-base.js  # WASSCE curriculum content
│   └── math-engine.js     # Mathematical problem solver
├── package.json           # Dependencies
├── vercel.json            # Vercel configuration
└── README.md              # This file
```

## 🧠 How It Works

### 1. Query Processing Pipeline

```
User Query
    ↓
Math Engine Check
    ↓ (if not math)
Knowledge Base Search
    ↓ (if no match)
Pattern Recognition
    ↓ (if no pattern)
Fallback Response
```

### 2. Math Engine
- Detects mathematical expressions
- Solves arithmetic operations
- Handles linear equations (ax + b = c)
- Solves quadratic equations
- Calculates percentages
- Provides step-by-step solutions

### 3. Knowledge Base
- Pre-loaded WASSCE content
- Keyword-based search
- Relevance scoring
- Subject categorization

### 4. Pattern Recognition
- Greetings and introductions
- Help requests
- Study tips
- Exam format information
- Subject-specific guidance

## 🎯 Usage Examples

### Mathematics
```
User: "Solve 3x + 9 = 24"
AI: [Step-by-step solution with answer x = 5]

User: "What is the quadratic formula?"
AI: [Complete explanation with examples]

User: "Calculate 25% of 80"
AI: [Solution: 20]
```

### English
```
User: "How to write a formal letter for WASSCE"
AI: [Complete format with structure and examples]

User: "Explain parts of speech"
AI: [Detailed explanation with examples]
```

### Science
```
User: "Explain photosynthesis"
AI: [Process, equation, requirements, importance]

User: "What are the states of matter?"
AI: [Solid, liquid, gas with properties]
```

### Social Studies
```
User: "When did Ghana gain independence?"
AI: [Date, key facts, leaders, significance]

User: "Three arms of government"
AI: [Executive, Legislative, Judicial with details]
```

## 🔧 Configuration

### Firebase (Optional)
Edit `firebase-config.js` to add your Firebase credentials:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  // ... other config
};
```

### Google OAuth
Update Google Client ID in `login.html`:

```html
<div id="g_id_onload"
  data-client_id="YOUR_GOOGLE_CLIENT_ID"
  ...
</div>
```

## 📊 Performance

- **Response Time:** < 100ms (local processing)
- **No API Limits:** Unlimited queries
- **Offline Capable:** Core features work without internet
- **Lightweight:** < 500KB total size

## 🛠️ Extending the System

### Add New Knowledge

Edit `engine/knowledge-base.js`:

```javascript
export const knowledgeBase = {
  mathematics: {
    'new-topic': {
      question: ['keyword1', 'keyword2'],
      answer: `Your detailed answer here`,
      subject: 'Core Mathematics'
    }
  }
};
```

### Add Math Capabilities

Edit `engine/math-engine.js` to add new problem types.

### Customize Responses

Edit `engine/ai-engine.js` to modify pattern recognition and fallback responses.

## 🔒 Security

- HTTPS enforced
- CORS configured
- Input validation
- Session management
- XSS protection headers

## 📱 Mobile Support

- Fully responsive design
- Touch-optimized interface
- Mobile-first approach
- Works on all screen sizes

## 🐛 Troubleshooting

### Chat not working?
- Check browser console for errors
- Verify `/api/chat` endpoint is accessible
- Ensure JavaScript is enabled

### Login issues?
- Check Firebase configuration
- Verify Google OAuth Client ID
- Add domain to Firebase authorized domains

### Deployment fails?
- Verify Node.js version (18+)
- Check `vercel.json` configuration
- Review Vercel build logs

## 📚 Documentation

- **Quick Start:** `QUICK_START.md`
- **Deployment Guide:** `DEPLOYMENT_GUIDE.md`
- **API Documentation:** See `api/chat.js`

## 🤝 Contributing

This is a proprietary project for Vision Education. For questions or support, contact the development team.

## 📄 License

MIT License - See LICENSE file for details

## 🎓 About Vision Education

Vision Education is committed to making quality education accessible to every Ghanaian student. Vision AI is part of our mission to leverage technology for educational excellence.

**Website:** https://visionedu.online  
**Vision AI:** https://ai.visionedu.online

---

**Built with ❤️ for WASSCE Students**  
**Version:** 2.0.0 (Self-Contained Engine)  
**Last Updated:** May 2, 2026
