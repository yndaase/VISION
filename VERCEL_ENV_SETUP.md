# Vercel Environment Variable Setup

## Add Paystack Secret Key to Vercel

The Paystack secret key needs to be added to both Vercel projects for payment processing.

### For Main Site (visionedu.online)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **main Vision Education project**
3. Click **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter:
   - **Key:** `PAYSTACK_SECRET_KEY`
   - **Value:** Your Paystack secret key (from `.env` file or Paystack dashboard)
   - **Environments:** Check all (Production, Preview, Development)
6. Click **Save**
7. Go to **Deployments** tab
8. Click **...** on the latest deployment → **Redeploy**

### For Vision AI (ai.visionedu.online)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **Vision AI project**
3. Click **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter:
   - **Key:** `PAYSTACK_SECRET_KEY`
   - **Value:** Your Paystack secret key (from `.env` file or Paystack dashboard)
   - **Environments:** Check all (Production, Preview, Development)
6. Click **Save**
7. Go to **Deployments** tab
8. Click **...** on the latest deployment → **Redeploy**

## What's Already Done

✅ Paystack secret key added to local `.env` file
✅ Code structure ready for payment processing
⚠️ **Action Required:** Get public key from Paystack dashboard
⚠️ **Action Required:** Add public key to `vision-ai/pricing.js`
⚠️ **Action Required:** Add secret key to Vercel environment variables (see above)

## Important: Public Key vs Secret Key

You provided the **secret key** (`sk_live_...`), which is correct for the backend.

However, you also need the **public key** (`pk_live_...`) for the frontend:

1. Go to [Paystack Dashboard](https://dashboard.paystack.com/)
2. Navigate to **Settings** → **API Keys & Webhooks**
3. Copy your **Public Key** (starts with `pk_live_...`)
4. Update `vision-ai/pricing.js` line 75 with this public key

## After Adding to Vercel

Once you add the environment variable and redeploy:

1. Visit https://ai.visionedu.online/pricing
2. Click "Upgrade to Pro — GH₵ 30/mo"
3. Paystack payment popup will open
4. Complete payment with Mobile Money, Card, or Bank Transfer
5. User will be upgraded to Pro automatically

## Security Notes

- ✅ Secret key is in `.env` (git-ignored, not committed)
- ✅ Public key is safe to commit (used in frontend)
- ✅ Environment variables are encrypted in Vercel
- ⚠️ Never commit the secret key to GitHub

## Testing

To test the payment:
1. Use a test card: `5060 6666 6666 6666 666`
2. CVV: `123`
3. Expiry: Any future date
4. PIN: `1234`
5. OTP: `123456`

For live payments, users will use their actual payment methods.

---

**Status:** Needs public key from Paystack dashboard, then ready for production!
