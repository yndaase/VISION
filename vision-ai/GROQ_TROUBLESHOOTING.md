# Groq API Troubleshooting Guide

## 🔍 Issue: Groq API Not Working in Chat

If your Groq API key is configured but the chat isn't using Groq AI, follow these steps to diagnose and fix the issue.

---

## Step 1: Verify API Key in Vercel

### Check Environment Variable

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Select your `vision-ai` project

2. **Check Environment Variables:**
   - Settings → Environment Variables
   - Look for: `GROQ_API_KEY`
   - Verify it's set for all environments:
     - ✅ Production
     - ✅ Preview  
     - ✅ Development

3. **Verify API Key Format:**
   - Should start with `gsk_`
   - Example: `gsk_abc123...`
   - No extra spaces or quotes

### If Missing or Wrong:

1. **Update the Variable:**
   - Click "Edit" on `GROQ_API_KEY`
   - Paste your correct API key
   - Save

2. **Redeploy:**
   - Go to "Deployments" tab
   - Click "..." on latest deployment
   - Click "Redeploy"
   - Wait 1-2 minutes

---

## Step 2: Check Deployment Logs

### View Function Logs

1. **Go to Vercel Dashboard:**
   - Deployments → Latest Deployment
   - Click "Functions" tab
   - Click `/api/chat` function

2. **Look for These Logs:**

**✅ Success (Groq Working):**
```
[API/chat] Groq API Key configured: true
[VisionAI] Groq enabled: true
[VisionAI] Attempting Groq API call
[Groq] Sending request with X messages
[Groq] Response status: 200
[Groq] Success! Response length: XXX
[VisionAI] Groq API success
```

**❌ API Key Missing:**
```
[API/chat] Groq API Key configured: false
[VisionAI] Groq enabled: false
[VisionAI] Groq API not configured, using local engines
```

**❌ API Key Invalid:**
```
[Groq] Response status: 401
[Groq] API error: { error: { message: "Invalid API key" } }
[VisionAI] Groq API error, falling back to local engines
```

**❌ Rate Limit:**
```
[Groq] Response status: 429
[Groq] API error: { error: { message: "Rate limit exceeded" } }
```

**❌ Model Not Found:**
```
[Groq] Response status: 404
[Groq] API error: { error: { message: "Model not found" } }
```

---

## Step 3: Test Your API Key

### Test in Groq Console

1. **Go to Groq Console:**
   - https://console.groq.com

2. **Check API Key:**
   - Click "API Keys" in sidebar
   - Verify your key is active (not revoked)
   - Check usage limits

3. **Test in Playground:**
   - Click "Playground" in sidebar
   - Select model: `llama-3.3-70b-versatile`
   - Send a test message
   - If it works here, your key is valid

### Test with cURL

```bash
curl https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer YOUR_GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3.3-70b-versatile",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

**Expected Response:**
```json
{
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "Hello! How can I help you today?"
    }
  }]
}
```

**If Error:**
- 401: Invalid API key
- 429: Rate limit exceeded
- 404: Model not found

---

## Step 4: Check Model Availability

### Verify Model Name

The current model is: `llama-3.3-70b-versatile`

**Check if model exists:**
1. Go to: https://console.groq.com/docs/models
2. Look for `llama-3.3-70b-versatile`
3. If not found, use an alternative:
   - `llama-3.1-70b-versatile`
   - `llama-3.1-8b-instant`
   - `mixtral-8x7b-32768`

### Update Model (if needed)

If the model doesn't exist, update `api/chat.js`:

```javascript
_engine = new VisionAI({
  groqApiKey: process.env.GROQ_API_KEY,
  groqModel: 'llama-3.1-70b-versatile' // Use available model
});
```

Then commit and push:
```bash
git add vision-ai/api/chat.js
git commit -m "fix: Update Groq model to available version"
git push origin master
```

---

## Step 5: Check Rate Limits

### Free Tier Limits

- **Requests:** 30 requests/minute
- **Tokens:** 6,000 tokens/minute
- **Daily:** Check Groq console

### If Rate Limited:

1. **Wait 1 minute** for limit to reset
2. **Check usage** in Groq console
3. **Upgrade plan** if needed

### Monitor Usage:

1. Go to: https://console.groq.com/usage
2. Check current usage
3. Set up alerts for limits

---

## Step 6: Test in Production

### Send Test Message

1. **Go to Chat:**
   - https://ai.visionedu.online/chat
   - Log in if needed

2. **Send Test Query:**
   ```
   Explain photosynthesis in detail
   ```

3. **Check Source Badge:**
   - ✅ Should show: **🤖 Groq AI**
   - ❌ If shows: **📚 Knowledge Base** → Groq not working
   - ❌ If shows: **💡 Suggestion** → Groq not working

4. **Check Response Quality:**
   - Groq: Detailed, conversational, context-aware
   - Knowledge Base: Pre-written, template-like
   - Fallback: Generic suggestions

---

## Step 7: Common Issues & Solutions

### Issue 1: "Groq API Key configured: false"

**Cause:** Environment variable not set in Vercel

**Solution:**
1. Add `GROQ_API_KEY` in Vercel settings
2. Redeploy
3. Test again

### Issue 2: "401 Unauthorized"

**Cause:** Invalid or expired API key

**Solution:**
1. Create new API key in Groq console
2. Update in Vercel environment variables
3. Redeploy

### Issue 3: "429 Rate Limit Exceeded"

**Cause:** Too many requests

**Solution:**
1. Wait 1 minute
2. Check usage in Groq console
3. Consider upgrading plan

### Issue 4: "404 Model Not Found"

**Cause:** Model name incorrect or deprecated

**Solution:**
1. Check available models in Groq docs
2. Update model name in `api/chat.js`
3. Commit and push

### Issue 5: Always Uses Knowledge Base

**Cause:** Groq API failing silently

**Solution:**
1. Check deployment logs for errors
2. Verify API key is correct
3. Test API key with cURL
4. Check model availability

### Issue 6: Slow Responses

**Cause:** Network issues or Groq service slow

**Solution:**
1. Check Groq status: https://status.groq.com
2. Try different model (smaller = faster)
3. Check Vercel function timeout

---

## Step 8: Enable Debug Mode

### View Logs in Real-Time

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login:**
   ```bash
   vercel login
   ```

3. **Tail Logs:**
   ```bash
   vercel logs --follow
   ```

4. **Send Test Message:**
   - Go to chat and send a message
   - Watch logs in terminal

5. **Look for:**
   - `[API/chat] Groq API Key configured: true/false`
   - `[VisionAI] Groq enabled: true/false`
   - `[Groq] Response status: XXX`
   - Any error messages

---

## Step 9: Verify Deployment

### Check Latest Deployment

1. **Go to Vercel Dashboard:**
   - Deployments tab
   - Check latest deployment status

2. **Verify:**
   - ✅ Status: Ready
   - ✅ Build: Successful
   - ✅ Functions: Deployed
   - ✅ Domain: Active

3. **If Failed:**
   - Click deployment to see error
   - Fix error in code
   - Commit and push again

### Force Redeploy

If deployment looks good but still not working:

1. **Trigger New Deployment:**
   - Make a small change (add comment)
   - Commit and push
   - Or use "Redeploy" button in Vercel

2. **Clear Cache:**
   - In browser: Ctrl+Shift+R (hard refresh)
   - Clear browser cache completely
   - Try incognito/private mode

---

## Step 10: Contact Support

### If Still Not Working

**Gather Information:**
1. Vercel deployment logs
2. Browser console errors
3. Test message and response
4. Source badge shown
5. Groq console usage stats

**Check Resources:**
- **Groq Discord:** https://discord.gg/groq
- **Groq Docs:** https://console.groq.com/docs
- **Vercel Support:** https://vercel.com/support

**Report Issue:**
- Include all gathered information
- Mention you're using Vercel serverless functions
- Specify model: `llama-3.3-70b-versatile`

---

## Quick Checklist

Use this checklist to quickly verify everything:

- [ ] `GROQ_API_KEY` set in Vercel (all environments)
- [ ] API key starts with `gsk_`
- [ ] API key is valid in Groq console
- [ ] Latest code deployed to Vercel
- [ ] Deployment status: Ready
- [ ] Model `llama-3.3-70b-versatile` exists
- [ ] Not hitting rate limits (30 req/min)
- [ ] Deployment logs show "Groq API Key configured: true"
- [ ] Test message sent in chat
- [ ] Response shows "🤖 Groq AI" badge
- [ ] Response is detailed and conversational

---

## Expected Behavior

### When Working Correctly:

1. **User sends message:** "Explain photosynthesis"

2. **Logs show:**
   ```
   [API/chat] Groq API Key configured: true
   [VisionAI] Processing query: Explain photosynthesis...
   [VisionAI] Groq enabled: true
   [VisionAI] Attempting Groq API call
   [Groq] Sending request with 2 messages
   [Groq] Response status: 200
   [Groq] Success! Response length: 847
   [VisionAI] Groq API success
   ```

3. **User sees:**
   - Detailed explanation of photosynthesis
   - Source badge: **🤖 Groq AI**
   - Response time: ~1-2 seconds

4. **Response quality:**
   - Conversational tone
   - Step-by-step explanation
   - Examples and analogies
   - Markdown formatting

---

## Alternative: Test Locally

### Run Locally with Vercel CLI

```bash
# Install dependencies
cd vision-ai
npm install

# Set environment variable
export GROQ_API_KEY="your_key_here"

# Run locally
vercel dev

# Test at http://localhost:3000/chat
```

This helps identify if issue is with:
- Code (works locally but not on Vercel)
- Environment (works on Vercel but not locally)
- API key (doesn't work anywhere)

---

## Success Indicators

You'll know Groq is working when:

✅ Deployment logs show Groq API calls  
✅ Responses show "🤖 Groq AI" badge  
✅ Responses are detailed and conversational  
✅ Response time is 1-3 seconds  
✅ Handles follow-up questions with context  
✅ No fallback to Knowledge Base for general questions  

---

**Need More Help?**

Check the other documentation files:
- `VERCEL_SETUP.md` - Environment configuration
- `GROQ_INTEGRATION.md` - Technical details
- `DEPLOYMENT_COMPLETE.md` - Full deployment guide

**Last Updated:** May 2, 2026
