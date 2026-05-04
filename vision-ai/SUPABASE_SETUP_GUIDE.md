# 🚀 Supabase Setup Guide for Vision AI

## Step 1: Create Supabase Project

1. **Go to Supabase:**
   - Visit: https://supabase.com
   - Click **"Start your project"**
   - Sign in with GitHub (recommended) or email

2. **Create New Project:**
   - Click **"New Project"**
   - **Organization:** Create new or select existing
   - **Project Name:** `vision-ai` or `vision-education`
   - **Database Password:** Generate a strong password (save it!)
   - **Region:** Choose closest to your users (e.g., `us-east-1` for USA)
   - **Pricing Plan:** Free (no credit card required)
   - Click **"Create new project"**

3. **Wait for setup** (~2 minutes)

---

## Step 2: Get Supabase Credentials

Once your project is ready:

1. **Go to Project Settings:**
   - Click the **⚙️ Settings** icon (bottom left)
   - Click **"API"** in the sidebar

2. **Copy these values:**
   - **Project URL:** `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long string)

3. **Save them** - you'll need these for Vercel environment variables

---

## Step 3: Set Up Database Schema

1. **Go to SQL Editor:**
   - Click **"SQL Editor"** in the left sidebar
   - Click **"New query"**

2. **Run this SQL to create tables:**

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create vision_ai_messages table
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

-- Create vision_ai_sessions table
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

-- Create indexes for better performance
CREATE INDEX idx_messages_user_email ON vision_ai_messages(user_email);
CREATE INDEX idx_messages_session_id ON vision_ai_messages(session_id);
CREATE INDEX idx_messages_timestamp ON vision_ai_messages(timestamp);
CREATE INDEX idx_sessions_user_email ON vision_ai_sessions(user_email);
CREATE INDEX idx_sessions_session_id ON vision_ai_sessions(session_id);
CREATE INDEX idx_sessions_last_updated ON vision_ai_sessions(last_updated DESC);

-- Enable Row Level Security
ALTER TABLE vision_ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE vision_ai_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for vision_ai_messages
CREATE POLICY "Users can view their own messages"
  ON vision_ai_messages FOR SELECT
  USING (auth.uid() = user_id OR user_email = auth.jwt()->>'email');

CREATE POLICY "Users can insert their own messages"
  ON vision_ai_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_email = auth.jwt()->>'email');

CREATE POLICY "Users can delete their own messages"
  ON vision_ai_messages FOR DELETE
  USING (auth.uid() = user_id OR user_email = auth.jwt()->>'email');

-- Create policies for vision_ai_sessions
CREATE POLICY "Users can view their own sessions"
  ON vision_ai_sessions FOR SELECT
  USING (auth.uid() = user_id OR user_email = auth.jwt()->>'email');

CREATE POLICY "Users can insert their own sessions"
  ON vision_ai_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_email = auth.jwt()->>'email');

CREATE POLICY "Users can update their own sessions"
  ON vision_ai_sessions FOR UPDATE
  USING (auth.uid() = user_id OR user_email = auth.jwt()->>'email');

CREATE POLICY "Users can delete their own sessions"
  ON vision_ai_sessions FOR DELETE
  USING (auth.uid() = user_id OR user_email = auth.jwt()->>'email');
```

3. **Click "Run"** to execute the SQL

4. **Verify tables were created:**
   - Click **"Table Editor"** in the left sidebar
   - You should see `vision_ai_messages` and `vision_ai_sessions` tables

---

## Step 4: Configure Google OAuth

1. **Go to Authentication:**
   - Click **"Authentication"** in the left sidebar
   - Click **"Providers"** tab

2. **Enable Google provider:**
   - Find **"Google"** in the list
   - Toggle it **ON**

3. **Configure Google OAuth:**
   - **Client ID:** `378999569796-v8bj9miq61sggvpea5sbslc24dr9t71s.apps.googleusercontent.com`
   - **Client Secret:** (Get from Google Cloud Console)

4. **Get the client secret:**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click on OAuth client `378999569796-...`
   - Copy the **Client secret** (looks like `GOCSPX-xxxxx`)
   - Paste it in Supabase

5. **Copy the Callback URL:**
   - Supabase will show: `https://xxxxxxxxxxxxx.supabase.co/auth/v1/callback`
   - Copy this URL

6. **Add callback URL to Google Cloud Console:**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click on OAuth client `378999569796-...`
   - **Authorized redirect URIs** - Add:
     ```
     https://xxxxxxxxxxxxx.supabase.co/auth/v1/callback
     ```
   - Click **Save**

7. **Click "Save" in Supabase**

---

## Step 5: Configure Site URL

1. **Still in Authentication settings:**
   - Scroll down to **"Site URL"**
   - Set to: `https://ai.visionedu.online`

2. **Add Redirect URLs:**
   - Scroll to **"Redirect URLs"**
   - Add these URLs (one per line):
     ```
     https://ai.visionedu.online
     https://ai.visionedu.online/chat
     https://ai.visionedu.online/login
     ```

3. **Click "Save"**

---

## Step 6: Add Environment Variables to Vercel

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/yndaases-projects/vision-ai/settings/environment-variables

2. **Add these environment variables:**

   **SUPABASE_URL:**
   - Name: `SUPABASE_URL`
   - Value: `https://xxxxxxxxxxxxx.supabase.co` (from Step 2)
   - Environment: Production, Preview, Development
   - Click **Save**

   **SUPABASE_ANON_KEY:**
   - Name: `SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (from Step 2)
   - Environment: Production, Preview, Development
   - Click **Save**

3. **Redeploy:**
   - Go to **Deployments** tab
   - Click **"..."** on latest deployment
   - Click **"Redeploy"**

---

## Step 7: Test Authentication

After deployment completes:

1. **Go to:** https://ai.visionedu.online/login
2. **Click "Continue with Google"**
3. **Sign in with Google**
4. **Check console logs** - should see:
   ```
   [Supabase] Auth successful: mensuohyaw@gmail.com
   [Supabase] Session persisted
   ```
5. **Go to chat page** - should see:
   ```
   [Supabase] User authenticated: mensuohyaw@gmail.com
   [Supabase] Message saved
   ```

---

## Step 8: Verify in Supabase Dashboard

1. **Check Authentication:**
   - Go to **Authentication → Users**
   - You should see your Google account listed

2. **Check Database:**
   - Go to **Table Editor → vision_ai_messages**
   - Send a test message in chat
   - Refresh the table - you should see the message

3. **Check Sessions:**
   - Go to **Table Editor → vision_ai_sessions**
   - You should see your chat session

---

## 🎉 Success Criteria

✅ **Supabase project created**  
✅ **Database tables created**  
✅ **Google OAuth configured**  
✅ **Environment variables added to Vercel**  
✅ **Code deployed**  
✅ **Google Sign-In works**  
✅ **Chat messages save to Supabase**  
✅ **Chat history loads on page refresh**

---

## 🔧 Troubleshooting

### Issue: "Invalid login credentials"

**Cause:** Google OAuth not configured correctly

**Fix:**
1. Verify Client ID and Secret in Supabase
2. Verify callback URL in Google Cloud Console
3. Wait 5 minutes and try again

### Issue: "Row Level Security policy violation"

**Cause:** RLS policies not set up correctly

**Fix:**
1. Go to SQL Editor
2. Re-run the policy creation SQL from Step 3
3. Verify policies exist in Table Editor → Policies tab

### Issue: "Failed to save message"

**Cause:** Environment variables not set

**Fix:**
1. Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` in Vercel
2. Redeploy the project
3. Clear browser cache and test

---

## 📊 Supabase vs Firebase Comparison

| Feature | Firebase | Supabase |
|---------|----------|----------|
| **Setup Complexity** | High | Low |
| **Google OAuth** | Complex | Simple |
| **Auth Persistence** | Issues | Works |
| **Query Language** | NoSQL | SQL (PostgreSQL) |
| **Free Tier** | 1GB | 500MB |
| **Real-time** | Yes | Yes |
| **Documentation** | Good | Excellent |

---

## 🚀 Next Steps

After successful setup:
1. Test chat history persistence
2. Test session management
3. Monitor usage in Supabase dashboard
4. (Optional) Set up real-time subscriptions for live chat updates

---

**Estimated Setup Time:** 30-40 minutes  
**Difficulty:** Easy  
**Cost:** Free (no credit card required)
