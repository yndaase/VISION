# Deploy Vision AI via Vercel CLI

## Why CLI Instead of Dashboard?

The Vercel dashboard deployments are getting stuck (Queued/Initializing). The CLI bypasses the GitHub integration and deploys directly from your local machine.

## Step-by-Step Instructions

### 1. Install Vercel CLI

Open your terminal and run:

```bash
npm install -g vercel
```

**Or if you have it already:**
```bash
vercel --version
```

---

### 2. Login to Vercel

```bash
vercel login
```

This will:
- Open your browser
- Ask you to confirm login
- Link your terminal to your Vercel account

---

### 3. Navigate to Your Project

```bash
cd vision-ai
```

---

### 4. Deploy to Production

```bash
vercel --prod
```

**What this does:**
- Uploads your code directly to Vercel
- Bypasses GitHub integration
- Deploys immediately (no queue)
- Takes 2-5 minutes

---

### 5. Watch the Deployment

You'll see output like:

```
🔍  Inspect: https://vercel.com/yndaase/vision-ai/xxxxx
✅  Production: https://vision-ai.vercel.app [2m]
```

---

## Expected Output

```bash
Vercel CLI 33.0.0
? Set up and deploy "~/vision-ai"? [Y/n] y
? Which scope do you want to deploy to? Your Account
? Link to existing project? [Y/n] y
? What's the name of your existing project? vision-ai
🔗  Linked to yndaase/vision-ai (created .vercel and added it to .gitignore)
🔍  Inspect: https://vercel.com/yndaase/vision-ai/xxxxx [2s]
✅  Production: https://vision-ai.vercel.app [copied to clipboard] [2m]
```

---

## Troubleshooting

### Error: "Command not found: vercel"

**Solution:**
```bash
# Try with npx (no installation needed)
npx vercel --prod
```

### Error: "Not logged in"

**Solution:**
```bash
vercel login
```

### Error: "No such file or directory"

**Solution:**
```bash
# Make sure you're in the right directory
cd vision-ai
pwd  # Should show: .../VISION/vision-ai
```

### Error: "Project not found"

**Solution:**
```bash
# Link to your existing project
vercel link
```

---

## Advantages of CLI Deployment

✅ **No Queue** - Deploys immediately  
✅ **No GitHub Integration Issues** - Direct upload  
✅ **Faster** - No waiting for webhooks  
✅ **More Control** - See real-time logs  
✅ **Reliable** - Bypasses dashboard bugs  

---

## After Successful Deployment

Once you see:
```
✅  Production: https://vision-ai.vercel.app
```

Your AI improvements are LIVE! Test them:

1. **Go to your site:** https://vision-ai.vercel.app
2. **Ask:** "Who made you?"
3. **Expected:** Response about Yaw Ndaase Mensuoh
4. **Ask:** "Solve x² + 5x + 6 = 0"
5. **Expected:** Solution with proper Unicode (no ^ symbols)

---

## Future Deployments

Once this works, you can:

**Option 1:** Keep using CLI
```bash
cd vision-ai
vercel --prod
```

**Option 2:** Fix GitHub integration
- The CLI deployment might "unstick" the dashboard
- Try dashboard deployments again after this succeeds

---

**Created:** May 5, 2026  
**Status:** Ready to Use  
**Priority:** HIGH - Alternative deployment method
