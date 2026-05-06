# Paystack Payment Setup for Vision AI

## Required Configuration

To enable Pro subscription payments on Vision AI, you need to configure Paystack keys.

### 1. Get Your Paystack Keys

1. Log in to your [Paystack Dashboard](https://dashboard.paystack.com/)
2. Go to **Settings** → **API Keys & Webhooks**
3. Copy your **Public Key** (starts with `pk_test_` or `pk_live_`)
4. Copy your **Secret Key** (starts with `sk_test_` or `sk_live_`)

### 2. Update the Code

**File: `vision-ai/pricing.js`**

Find this line (around line 25):
```javascript
key: 'pk_test_YOUR_PUBLIC_KEY_HERE', // TODO: Replace with your Paystack public key
```

Replace `pk_test_YOUR_PUBLIC_KEY_HERE` with your actual Paystack public key.

### 3. Add Environment Variable to Vercel

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select the **Vision AI** project
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - **Name:** `PAYSTACK_SECRET_KEY`
   - **Value:** Your Paystack secret key (sk_test_... or sk_live_...)
   - **Environment:** Production, Preview, Development (select all)
5. Click **Save**
6. Redeploy the project

### 4. Test the Payment

1. Visit `https://ai.visionedu.online/pricing`
2. Click "Upgrade to Pro"
3. Complete the test payment
4. Verify the user is upgraded to Pro

### Current Status

- ✅ Pricing page created
- ✅ Paystack popup integration added
- ⚠️ **Needs configuration:** Add your Paystack public key to `pricing.js`
- ⚠️ **Needs configuration:** Add `PAYSTACK_SECRET_KEY` to Vercel environment variables

### Payment Flow

1. User clicks "Upgrade to Pro" button
2. Paystack popup opens with payment form
3. User completes payment (Mobile Money, Card, Bank Transfer)
4. On success, user is upgraded to Pro role
5. User is redirected to chat interface

### Pricing

- **Free Tier:** Basic AI, 10 questions/day, Core Math only
- **Pro Tier:** GH₵ 30/month - Premium GPT-4o, unlimited questions, all subjects

---

**Note:** Make sure to use test keys during development and live keys in production.
