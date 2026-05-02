# Check Groq API Status

## The fallback message you're seeing means Groq API is NOT working.

The message "I don't have specific information about that topic..." is the **fallback response** that appears when:
1. ❌ Groq API key is not set in Vercel
2. ❌ Groq API key is invalid
3. ❌ Groq API is failing/timing out
4. ❌ Model name is incorrect

---

## Quick Check: View Deployment Logs

### Step 1: Check Vercel Logs

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Select your project

2. **Go to Latest Deployment:**
   - Click "Deployments" tab
   - Click on the most recent deployment

3. **View Function Logs:**
   - Click "Functions" tab
   - Click on `/api/chat`
   - Look for logs when you send a message

### Step 2: What to Look For

**✅ If Groq is Working (you should see):**
```
[API/chat] Groq API Key configured: true
[VisionAI] Processing query: your question...
[VisionAI] Groq enabled: true
[VisionAI] Attempting Groq API call
[Groq] Sending request with X messages
[Groq] Response status: 200
[Groq] Success! Response length: XXX
[VisionAI] Groq API success
```

**❌ If API Key Missing (you'll see):**
```
[API/chat] Groq API Key configured: false
[VisionAI] Groq enabled: false
[VisionAI] Groq API not configured, using local engines
[VisionAI] Using fallback response
```

**❌ If API Key Invalid (you'll see):**
```
[API/chat] Groq API Key configured: true
[VisionAI] Groq enabled: true
[VisionAI] Attempting Groq API call
[Groq] Response status: 401
[Groq] API error: Invalid API key
[VisionAI] Groq API error, falling back to local engines
```

**❌ If Model Not Found (you'll see):**
```
[Groq] Response status: 404
[Groq] API error: Model not found
```

---

## Fix Based on Logs

### Issue 1: "Groq API Key configured: false"

**This means the environment variable is NOT set in Vercel.**

**Fix:**
1. Go to Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Add new variable:
   - **Key:** `GROQ_API_KEY`
   - **Value:** Your Groq API key (starts with `gsk_`)
   - **Environments:** Check all three (Production, Preview, Development)
4. Click "Save"
5. Go to Deployments → Latest → "..." → "Redeploy"
6. Wait 1-2 minutes
7. Test again

### Issue 2: "Response status: 401" (Invalid API Key)

**Your API key is wrong or expired.**

**Fix:**
1. Go to https://console.groq.com
2. Click "API Keys"
3. Create a NEW API key
4. Copy the new key
5. Go to Vercel → Settings → Environment Variables
6. Edit `GROQ_API_KEY`
7. Paste the new key
8. Save and Redeploy

### Issue 3: "Response status: 404" (Model Not Found)

**The model `llama-3.3-70b-versatile` doesn't exist.**

**Fix:**
1. Check available models at: https://console.groq.com/docs/models
2. If `llama-3.3-70b-versatile` is not listed, we need to update the code
3. Use one of these instead:
   - `llama-3.1-70b-versatile`
   - `llama-3.1-8b-instant`
   - `mixtral-8x7b-32768`

---

## Test Your API Key Manually

### Test with cURL

```bash
curl https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer YOUR_GROQ_API_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3.3-70b-versatile",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

**Expected Response (Success):**
```json
{
  "choices": [{
    "message": {
      "content": "Hello! How can I help you today?"
    }
  }]
}
```

**Error Response (Invalid Key):**
```json
{
  "error": {
    "message": "Invalid API key",
    "type": "invalid_request_error"
  }
}
```

**Error Response (Model Not Found):**
```json
{
  "error": {
    "message": "Model 'llama-3.3-70b-versatile' not found",
    "type": "invalid_request_error"
  }
}
```

---

## Most Common Issue: API Key Not Set

**90% of the time, the issue is that `GROQ_API_KEY` is not set in Vercel.**

### Double-Check Vercel Environment Variables

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Look for: `GROQ_API_KEY`

**Should look like this:**
```
Name: GROQ_API_KEY
Value: gsk_************************ (hidden)
Environments: Production ✓ Preview ✓ Development ✓
```

**If you DON'T see `GROQ_API_KEY` in the list:**
- It's not set! Add it now.

**If you DO see it:**
- Click "Edit" to verify the value is correct
- Make sure it starts with `gsk_`
- Make sure all environments are checked
- After any changes, REDEPLOY

---

## Force Redeploy

After setting the API key, you MUST redeploy:

1. **Go to Deployments tab**
2. **Click "..." on latest deployment**
3. **Click "Redeploy"**
4. **Wait for deployment to complete (~1-2 minutes)**
5. **Test again**

**Important:** Changes to environment variables don't take effect until you redeploy!

---

## Real-Time Debugging

### Use Vercel CLI to See Logs Live

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Tail logs in real-time
vercel logs --follow
```

Then send a message in the chat and watch the logs appear in your terminal.

---

## What Should Happen When Working

1. **You ask:** "Explain photosynthesis"

2. **Logs show:**
   ```
   [API/chat] Groq API Key configured: true
   [VisionAI] Groq enabled: true
   [VisionAI] Attempting Groq API call
   [Groq] Sending request with 2 messages
   [Groq] Response status: 200
   [Groq] Success! Response length: 847
   ```

3. **You see:**
   - Detailed explanation of photosynthesis
   - Source badge: **🤖 Groq AI**
   - Response time: ~1-2 seconds

4. **NOT the fallback message!**

---

## Next Steps

1. **Check Vercel logs** (most important!)
2. **Verify API key is set** in Vercel environment variables
3. **Test API key** with cURL command above
4. **Redeploy** after any changes
5. **Report back** what you see in the logs

---

**The logs will tell us exactly what's wrong!** 🔍
