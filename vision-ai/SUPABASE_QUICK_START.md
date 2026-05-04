# 🚀 Supabase Quick Start - 5 Steps

## ✅ Step 1: Create Supabase Project (5 min)

1. Go to: **https://supabase.com**
2. Click **"Start your project"** → Sign in
3. Click **"New Project"**
4. Fill in:
   - Name: `vision-ai`
   - Database Password: (generate strong password - save it!)
   - Region: `us-east-1` (or closest to you)
5. Click **"Create new project"**
6. Wait ~2 minutes

---

## ✅ Step 2: Create Database Tables (3 min)

1. In Supabase dashboard, click **"SQL Editor"** (left sidebar)
2. Click **"New query"**
3. Copy this SQL and paste it:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create messages table
CREATE TABLE vision_ai_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  source TEXT,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sessions table
CREATE TABLE vision_ai_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  session_id TEXT NOT NULL UNIQUE,
  last_message TEXT,
  message_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_messages_user_email ON vision_ai_messages(user_email);
CREATE INDEX idx_messages_session_id ON vision_ai_messages(session_id);
CREATE INDEX idx_sessions_user_email ON vision_ai_sessions(user_email);
CREATE INDEX idx_sessions_last_updated ON vision_ai_sessions(last_updated DESC);

-- Enable Row Level Security
ALTER TABLE vision_ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE vision_ai_sessions ENABLE ROW LEVEL SECURITY;

-- Create security policies
CREATE POLICY "Users can view their own messages"
  ON vision_ai_messages FOR SELECT
  USING (auth.uid() = user_id OR user_email = auth.jwt()->>'email');

CREATE POLICY "Users can insert their own messages"
  ON vision_ai_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_email = auth.jwt()->>'email');

CREATE POLICY "Users can view their own sessions"
  ON vision_ai_sessions FOR SELECT
  USING (auth.uid() = user_id OR user_email = auth.jwt()->>'email');

CREATE POLICY "Users can insert their own sessions"
  ON vision_ai_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_email = auth.jwt()->>'email');

CREATE POLICY "Users can update their own sessions"
  ON vision_ai_sessions FOR UPDATE
  USING (auth.uid() = user_id OR user_email = auth.jwt()->>'email');
```

4. Click **"Run"**
5. Verify: Click **"Table Editor"** → should see `vision_ai_messages` and `vision_ai_sessions`

---

## ✅ Step 3: Configure Google OAuth (5 min)

### A. In Supabase:

1. Click **"Authentication"** → **"Providers"**
2. Find **"Google"** → Toggle **ON**
3. Fill in:
   - **Client ID**: `378999569796-v8bj9miq61sggvpea5sbslc24dr9t71s.apps.googleusercontent.com`
   - **Client Secret**: (get from Google Cloud Console - see below)
4. **Copy the Callback URL** shown (looks like: `https://xxxxx.supabase.co/auth/v1/callback`)
5. Don't click Save yet!

### B. Get Client Secret from Google:

1. Go to: **https://console.cloud.google.com/apis/credentials**
2. Find OAuth client: `378999569796-v8bj9miq61sggvpea5sbslc24dr9t71s`
3. Click on it
4. **Copy the Client secret** (looks like: `GOCSPX-xxxxx`)
5. **Add Authorized redirect URI**:
   - Paste the Supabase callback URL you copied
   - Click **"Save"**

### C. Back in Supabase:

1. Paste the Client secret
2. Click **"Save"**
3. Scroll down to **"Site URL"** → Set to: `https://ai.visionedu.online`
4. Scroll to **"Redirect URLs"** → Add:
   ```
   https://ai.visionedu.online
   https://ai.visionedu.online/chat
   https://ai.visionedu.online/login
   ```
5. Click **"Save"**

---

## ✅ Step 4: Add Environment Variables to Vercel (2 min)

### A. Get Supabase Credentials:

1. In Supabase, click **⚙️ Settings** (bottom left)
2. Click **"API"**
3. Copy these two values:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long string)

### B. Add to Vercel:

1. Go to: **https://vercel.com/yndaases-projects/vision-ai/settings/environment-variables**
2. Add first variable:
   - Name: `SUPABASE_URL`
   - Value: (paste Project URL)
   - Environment: Check all three (Production, Preview, Development)
   - Click **"Save"**
3. Add second variable:
   - Name: `SUPABASE_ANON_KEY`
   - Value: (paste anon public key)
   - Environment: Check all three
   - Click **"Save"**

### C. Redeploy:

1. Go to **"Deployments"** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**
4. Wait ~2 minutes

---

## ✅ Step 5: Test (5 min)

1. **Go to**: https://ai.visionedu.online/login
2. **Click**: "Continue with Google"
3. **Sign in** with your Google account
4. **Should redirect** to chat page
5. **Send a test message**: "Hello Vision AI"
6. **Refresh the page** → message should still be there
7. **Check Supabase**:
   - Go to **Table Editor** → **vision_ai_messages**
   - You should see your message!

---

## 🎉 Success!

If all steps worked:
- ✅ Google Sign-In works
- ✅ Chat messages save to Supabase
- ✅ Chat history persists on refresh
- ✅ No Firebase errors

---

## 🐛 Troubleshooting

### "Failed to load Supabase config"
- Check Vercel environment variables are set
- Redeploy the project
- Wait 2 minutes and try again

### "Invalid login credentials"
- Verify Client ID and Secret in Supabase
- Verify callback URL in Google Cloud Console
- Wait 5 minutes for changes to propagate

### "Row Level Security policy violation"
- Re-run the SQL from Step 2
- Verify policies exist in Table Editor → Policies tab

---

## 📞 Need Help?

- **Full Guide**: See `SUPABASE_SETUP_GUIDE.md`
- **Supabase Docs**: https://supabase.com/docs
- **Supabase Discord**: https://discord.supabase.com

---

**Total Time**: ~20 minutes  
**Difficulty**: Easy  
**Cost**: Free (no credit card required)
