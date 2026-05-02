# Vercel Environment Setup - Vision AI

## 🔑 Setting Up Groq API Key

Follow these steps to configure the Groq API key in Vercel for Vision AI to work properly.

---

## Step 1: Get Your Groq API Key

1. **Visit Groq Console:**
   - Go to: https://console.groq.com
   - Sign in or create an account

2. **Create API Key:**
   - Click on "API Keys" in the sidebar
   - Click "Create API Key"
   - Give it a name: `Vision AI Production`
   - Click "Create"
   - **Copy the API key** (you won't see it again!)

---

## Step 2: Add API Key to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Sign in to your account

2. **Select Your Project:**
   - Find and click on your `vision-ai` project
   - (Or the project name you used for deployment)

3. **Navigate to Settings:**
   - Click the "Settings" tab at the top
   - Click "Environment Variables" in the left sidebar

4. **Add New Variable:**
   - Click "Add New" button
   - Fill in the form:
     - **Key:** `GROQ_API_KEY`
     - **Value:** Paste your Groq API key
     - **Environment:** Select all three:
       - ✅ Production
       - ✅ Preview
       - ✅ Development
   - Click "Save"

5. **Redeploy:**
   - Go to "Deployments" tab
   - Find the latest deployment
   - Click the "..." menu on the right
   - Click "Redeploy"
   - Wait for deployment to complete (~1-2 minutes)

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Navigate to your project
cd vision-ai

# Add environment variable
vercel env add GROQ_API_KEY

# When prompted:
# - Enter your Groq API key
# - Select: Production, Preview, Development (all)

# Redeploy
vercel --prod
```

---

## Step 3: Verify Configuration

### Check Environment Variables

1. **In Vercel Dashboard:**
   - Go to Settings → Environment Variables
   - You should see: `GROQ_API_KEY` with value hidden (••••••)
   - Environments: Production, Preview, Development

### Test the Deployment

1. **Visit Your Chat Page:**
   - Go to: https://ai.visionedu.online/chat
   - Log in if needed

2. **Send a Test Message:**
   - Type: "Explain photosynthesis in detail"
   - Send the message

3. **Check the Response:**
   - Should receive a detailed AI response
   - Source badge should show: **🤖 Groq AI**
   - Response time: ~1-2 seconds

### Check Deployment Logs

1. **In Vercel Dashboard:**
   - Go to "Deployments" tab
   - Click on the latest deployment
   - Click "Functions" tab
   - Click on `/api/chat` function
   - Check logs for any errors

**Expected Log (Success):**
```
[API/chat] Query received
[API/chat] Using Groq AI
[API/chat] Response sent successfully
```

**Error Log (API Key Missing):**
```
[API/chat] Groq API key not configured
[API/chat] Falling back to local engines
```

---

## Step 4: Monitor Usage

### Groq Console

1. **Visit:** https://console.groq.com
2. **Click:** "Usage" in sidebar
3. **Monitor:**
   - Requests per minute
   - Tokens consumed
   - Daily/monthly limits

### Free Tier Limits

- **Requests:** 30 requests/minute
- **Tokens:** 6,000 tokens/minute
- **Models:** All models available

**Note:** If limits are exceeded, Vision AI automatically falls back to local engines.

---

## 🔒 Security Best Practices

### DO ✅
- Store API key in Vercel environment variables
- Use different API keys for production/development
- Rotate API keys periodically (every 90 days)
- Monitor usage in Groq console
- Set up usage alerts in Groq console

### DON'T ❌
- Never commit API keys to Git
- Never expose API keys in client-side code
- Never share API keys publicly
- Never use production keys in development
- Never hardcode API keys in source files

---

## 🐛 Troubleshooting

### Issue: "Groq API key not configured"

**Symptoms:**
- All responses use Knowledge Base or Fallback
- No responses show "🤖 Groq AI" badge

**Solution:**
1. Check environment variable is set in Vercel
2. Verify variable name is exactly: `GROQ_API_KEY`
3. Redeploy after adding variable
4. Clear browser cache and test again

### Issue: "Groq API error: 401 Unauthorized"

**Symptoms:**
- Responses fall back to local engines
- Deployment logs show 401 error

**Solution:**
1. Verify API key is correct in Vercel
2. Check API key is still valid in Groq console
3. Create new API key if expired
4. Update Vercel environment variable
5. Redeploy

### Issue: "Groq API error: 429 Rate Limit"

**Symptoms:**
- Some requests work, others fail
- Error appears during high traffic

**Solution:**
1. Check usage in Groq console
2. Wait 1 minute for rate limit to reset
3. Consider upgrading to paid tier
4. Implement request queuing (future enhancement)

### Issue: Responses are slow

**Symptoms:**
- Takes > 5 seconds to get response
- Timeout errors

**Solution:**
1. Check Groq status: https://status.groq.com
2. Verify Vercel function timeout (default: 10s)
3. Check network connectivity
4. Try different Groq model (smaller = faster)

---

## 🔄 Updating API Key

### When to Update
- API key compromised or exposed
- Rotating keys for security (every 90 days)
- Switching to different Groq account
- Moving from free to paid tier

### How to Update

1. **Create New Key in Groq Console**
2. **Update in Vercel:**
   - Settings → Environment Variables
   - Find `GROQ_API_KEY`
   - Click "Edit"
   - Paste new key
   - Click "Save"
3. **Redeploy:**
   - Deployments → Latest → Redeploy
4. **Revoke Old Key in Groq Console**

---

## 📊 Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `GROQ_API_KEY` | Yes | Groq API authentication key | `gsk_...` |

### Future Variables (Optional)

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `GROQ_MODEL` | No | Groq model to use | `llama-3.3-70b-versatile` |
| `GROQ_TEMPERATURE` | No | Response creativity (0-1) | `0.7` |
| `GROQ_MAX_TOKENS` | No | Max response length | `2000` |

---

## 🚀 Deployment Checklist

Before going live, ensure:

- [ ] Groq API key obtained from console.groq.com
- [ ] `GROQ_API_KEY` added to Vercel environment variables
- [ ] Environment variable set for all environments (Production, Preview, Development)
- [ ] Latest code deployed to Vercel
- [ ] Test message sent and received successfully
- [ ] Response shows "🤖 Groq AI" badge
- [ ] Deployment logs show no errors
- [ ] Usage monitoring set up in Groq console
- [ ] Backup plan if rate limits exceeded (local fallbacks work)

---

## 📞 Support

### Vercel Support
- **Docs:** https://vercel.com/docs
- **Support:** https://vercel.com/support

### Groq Support
- **Docs:** https://console.groq.com/docs
- **Discord:** https://discord.gg/groq
- **Status:** https://status.groq.com

### Vision AI Support
- **GitHub:** github.com/yndaase/VISION
- **Issues:** Report bugs in GitHub Issues

---

## ✅ Quick Reference

### Vercel Dashboard URLs
- **Project:** https://vercel.com/dashboard
- **Settings:** Project → Settings → Environment Variables
- **Deployments:** Project → Deployments
- **Logs:** Deployment → Functions → /api/chat

### Groq Console URLs
- **Dashboard:** https://console.groq.com
- **API Keys:** https://console.groq.com/keys
- **Usage:** https://console.groq.com/usage
- **Docs:** https://console.groq.com/docs

### Vision AI URLs
- **Homepage:** https://ai.visionedu.online
- **Chat:** https://ai.visionedu.online/chat
- **Login:** https://ai.visionedu.online/login

---

**Setup Complete! 🎉**

Your Vision AI is now powered by Groq's ultra-fast LLM API with intelligent local fallbacks.
