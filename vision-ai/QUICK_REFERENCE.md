# Vision AI - Quick Reference Card

## 🚀 Deploy in 3 Commands

```bash
cd vision-ai
vercel login
vercel --prod
```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `api/chat.js` | Serverless endpoint |
| `engine/ai-engine.js` | Main intelligence |
| `engine/knowledge-base.js` | WASSCE content |
| `engine/math-engine.js` | Equation solver |
| `index.html` | Chat interface |
| `app.js` | Frontend logic |

## 🧠 How It Works

```
Query → Math Engine? → Knowledge Base? → Pattern? → Fallback
```

## 📚 Content Coverage

**Mathematics** (4 topics)
- Quadratic formula
- Laws of indices
- Pythagoras theorem
- Simultaneous equations

**English** (2 topics)
- Formal letter writing
- Parts of speech

**Science** (2 topics)
- Photosynthesis
- States of matter

**Social Studies** (2 topics)
- Ghana independence
- Three arms of government

**Economics** (1 topic)
- Demand and supply

## 🧪 Quick Test

```bash
# Test locally
npm run dev

# Test queries
"Solve 3x + 9 = 24"
"What is photosynthesis?"
"Ghana independence"
```

## ⚡ Performance

- Response: < 200ms
- No API costs
- Unlimited queries
- Offline capable

## 🔧 Add Content

Edit `engine/knowledge-base.js`:

```javascript
'new-topic': {
  question: ['keyword1', 'keyword2'],
  answer: `Your answer here`,
  subject: 'Subject Name'
}
```

## 📊 Architecture

```
Frontend (HTML/JS)
    ↓
API (/api/chat)
    ↓
AI Engine
    ↓
Math | Knowledge | Pattern
```

## 🎯 Key Features

✅ Self-contained (no APIs)  
✅ Fast (< 200ms)  
✅ Free (no costs)  
✅ Offline capable  
✅ Step-by-step math  
✅ WASSCE curriculum  

## 📞 Support

- **Docs:** `README.md`
- **Build Guide:** `BUILD_GUIDE.md`
- **Tests:** `TEST_QUERIES.md`
- **Deploy:** `DEPLOYMENT_GUIDE.md`

## 🔗 URLs

- **Repo:** github.com/yndaase/VISION
- **Deploy:** vercel.com
- **Domain:** ai.visionedu.online

---

**Version 2.0.0 | Self-Contained Engine**
